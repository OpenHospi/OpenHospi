import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { eq } from 'drizzle-orm';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ChatInputBar } from '@/components/chat/chat-input-bar';
import { DateSeparator } from '@/components/chat/date-separator';
import { EncryptionGate } from '@/components/chat/encryption-gate';
import { MessageBubble } from '@/components/chat/message-bubble';
import { ScrollToBottomFab } from '@/components/navigation/scroll-to-bottom-fab';
import { NativeIcon } from '@/components/native/icon';
import { ThemedText } from '@/components/native/text';
import { KeyboardAware } from '@/components/shared/keyboard-aware';
import { useTheme } from '@/design';
import { useEncryptionContext } from '@/hooks/use-encryption';
import { useSession } from '@/lib/auth-client';
import { hapticPullToRefreshSnap } from '@/lib/haptics';
import { db as localDb } from '@/lib/db';
import { localMessages, messageDrafts } from '@/lib/db/schema';
import { subscribeToChannel } from '@/lib/supabase';
import {
  useConversationDetail,
  useMarkConversationRead,
  useMessages,
  useSendMessage,
} from '@/services/chat';

type MessageRow = {
  id: string;
  conversationId: string;
  senderId: string;
  senderDeviceId: string | null;
  messageType: string;
  createdAt: string;
  payload: string | null;
  senderFirstName: string | null;
};

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

const FIVE_MIN = 5 * 60_000;

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();

  return (
    <EncryptionGate>
      <ConversationChat conversationId={conversationId} />
    </EncryptionGate>
  );
}

function ConversationChat({ conversationId }: { conversationId: string }) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'app.chat' });
  const { colors } = useTheme();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const router = useRouter();

  const dateLabels = { today: t('date_today'), yesterday: t('date_yesterday') };

  const { data: detail } = useConversationDetail(conversationId);
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchMessages,
  } = useMessages(conversationId);
  const sendMessageMutation = useSendMessage(userId);
  const markRead = useMarkConversationRead();
  const { encryptMessage, decryptMessage, processPendingDistributions, deviceId } =
    useEncryptionContext();

  const [text, setText] = useState('');
  const [decryptedCache, setDecryptedCache] = useState<Record<string, string>>({});
  const [distributionVersion, setDistributionVersion] = useState(0);
  const [showScrollFab, setShowScrollFab] = useState(false);
  const [failedMessageIds, setFailedMessageIds] = useState<Set<string>>(new Set());
  const listRef = useRef<FlashListRef<MessageRow>>(null);

  // API returns newest-first across pages. Reverse once so FlashList sees
  // chronological order (oldest -> newest) with the newest message at the end.
  // This lets FlashList v2's `startRenderingFromBottom` show the most recent
  // messages first and keeps `onStartReached` firing when the user scrolls up
  // to load older history.
  const allMessages: MessageRow[] = (messagesData?.pages.flatMap((p) => p.messages) ?? [])
    .slice()
    .reverse();
  const memberUserIds = detail?.members.map((m) => m.userId) ?? [];

  // Restore draft on mount
  useEffect(() => {
    const [draft] = localDb
      .select({ content: messageDrafts.content })
      .from(messageDrafts)
      .where(eq(messageDrafts.conversationId, conversationId))
      .all();
    if (draft?.content) setText(draft.content);
  }, [conversationId]);

  // Save draft on unmount
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    return () => {
      const draft = textRef.current.trim();
      if (draft) {
        localDb
          .insert(messageDrafts)
          .values({ conversationId, content: draft, updatedAt: new Date() })
          .onConflictDoUpdate({
            target: messageDrafts.conversationId,
            set: { content: draft, updatedAt: new Date() },
          })
          .run();
      } else {
        localDb.delete(messageDrafts).where(eq(messageDrafts.conversationId, conversationId)).run();
      }
    };
  }, [conversationId]);

  // Mark as read on open
  useEffect(() => {
    if (conversationId) {
      markRead.mutate(conversationId);
    }
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Process pending distributions on mount
  useEffect(() => {
    if (deviceId) {
      processPendingDistributions(deviceId).catch(() => {});
    }
  }, [deviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Decrypt a single message (cache-first)
  async function decryptSingle(msg: MessageRow): Promise<string | null> {
    if (msg.messageType === 'system') return msg.payload ?? '';
    if (!msg.payload) return null;

    const cached = localDb
      .select({ plaintext: localMessages.plaintext })
      .from(localMessages)
      .where(eq(localMessages.id, msg.id))
      .all();
    if (cached.length > 0) return cached[0].plaintext;

    if (!msg.senderDeviceId) return null;

    try {
      const plaintext = await decryptMessage(
        msg.id,
        conversationId,
        { userId: msg.senderId, deviceId: msg.senderDeviceId },
        msg.payload
      );

      if (plaintext) {
        localDb
          .insert(localMessages)
          .values({
            id: msg.id,
            conversationId,
            senderUserId: msg.senderId,
            plaintext,
            timestamp: new Date(msg.createdAt),
          })
          .onConflictDoNothing()
          .run();
      }

      return plaintext;
    } catch {
      return t('decryption_failed');
    }
  }

  const messageIds = allMessages.map((m) => m.id).join(',');

  useEffect(() => {
    async function decryptAll() {
      const cache: Record<string, string> = {};

      for (const msg of allMessages) {
        if (decryptedCache[msg.id]) {
          cache[msg.id] = decryptedCache[msg.id];
          continue;
        }
        const result = await decryptSingle(msg);
        if (result !== null) cache[msg.id] = result;
      }

      setDecryptedCache(cache);
    }

    if (allMessages.length > 0) {
      decryptAll();
    }
  }, [messageIds, distributionVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  // Managed Supabase Realtime subscription — auto-reconnects via supabase.ts
  useEffect(() => {
    const unsubscribe = subscribeToChannel({
      name: `chat:${conversationId}`,
      configure: (channel) =>
        channel
          .on('broadcast', { event: 'new_message' }, async () => {
            if (deviceId) {
              await processPendingDistributions(deviceId).catch(() => {});
            }
            refetchMessages();
          })
          .on('broadcast', { event: 'sender_key_distribution' }, async () => {
            if (deviceId) {
              await processPendingDistributions(deviceId).catch(() => {});
              setDistributionVersion((v) => v + 1);
            }
          }),
    });

    return unsubscribe;
  }, [conversationId, deviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || !userId) return;

    setText('');
    localDb.delete(messageDrafts).where(eq(messageDrafts.conversationId, conversationId)).run();

    try {
      const result = await encryptMessage(conversationId, memberUserIds, trimmed);

      const msg = await sendMessageMutation.mutateAsync({
        conversationId,
        payload: result.payload,
        deviceId: result.deviceId,
        distributions: result.distributions,
      });

      if (msg?.id) {
        localDb
          .insert(localMessages)
          .values({
            id: msg.id,
            conversationId,
            senderUserId: userId,
            plaintext: trimmed,
            timestamp: new Date(),
          })
          .onConflictDoNothing()
          .run();
      }
    } catch (err) {
      console.error('[Chat] Send failed:', err);
      const lastOptimistic = allMessages.find((m) => m.senderId === userId && m.id.length > 30);
      if (lastOptimistic) {
        setFailedMessageIds((prev) => new Set([...prev, lastOptimistic.id]));
      }
      setText(trimmed);
    }
  }

  function handleRetry(messageId: string) {
    setFailedMessageIds((prev) => {
      const next = new Set(prev);
      next.delete(messageId);
      return next;
    });
  }

  // Data is chronological (oldest -> newest). prev = older, next = newer.
  // isFirstInGroup: the previous message is from a different sender (or > 5min gap).
  // isLastInGroup: the next message is from a different sender (or > 5min gap).
  function getGroupFlags(index: number) {
    const msg = allMessages[index];
    const prev = allMessages[index - 1];
    const next = allMessages[index + 1];

    const msgTime = new Date(msg.createdAt).getTime();

    const sameAsPrev =
      !!prev &&
      prev.senderId === msg.senderId &&
      Math.abs(msgTime - new Date(prev.createdAt).getTime()) < FIVE_MIN;

    const sameAsNext =
      !!next &&
      next.senderId === msg.senderId &&
      Math.abs(new Date(next.createdAt).getTime() - msgTime) < FIVE_MIN;

    return {
      isFirstInGroup: !sameAsPrev,
      isLastInGroup: !sameAsNext,
      showSender: !sameAsPrev,
    };
  }

  function getDeliveryStatus(msg: MessageRow): 'sending' | 'sent' | 'failed' | undefined {
    if (msg.senderId !== userId) return undefined;
    if (failedMessageIds.has(msg.id)) return 'failed';

    const isOptimistic = !decryptedCache[msg.id] && msg.senderId === userId;
    if (isOptimistic && sendMessageMutation.isPending) return 'sending';

    return 'sent';
  }

  const memberCount = detail?.members.length ?? 0;

  return (
    <KeyboardAware style={{ backgroundColor: colors.background }} keyboardVerticalOffset={90}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(app)/(tabs)/chat/[conversationId]/info',
                  params: { conversationId },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={detail?.roomTitle ?? t('conversation')}
              accessibilityHint="Opens conversation info">
              <View style={styles.headerCenter}>
                <ThemedText variant="body" weight="600" numberOfLines={1}>
                  {detail?.roomTitle ?? t('conversation')}
                </ThemedText>
                {memberCount > 0 ? (
                  <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                    {t('members_count', { count: memberCount })}
                  </ThemedText>
                ) : null}
              </View>
            </Pressable>
          ),
          headerBackTitle: t('title'),
        }}
      />

      <View style={styles.flex1}>
        {allMessages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <NativeIcon
              name="lock.fill"
              androidName="lock"
              size={36}
              color={colors.tertiaryForeground}
            />
            <ThemedText
              variant="subheadline"
              color={colors.secondaryForeground}
              style={styles.textCenter}>
              {t('say_hello')}
            </ThemedText>
            <View style={styles.e2eRow}>
              <NativeIcon
                name="lock.fill"
                androidName="lock"
                size={11}
                color={colors.tertiaryForeground}
              />
              <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                {t('e2e_info')}
              </ThemedText>
            </View>
          </View>
        ) : (
          <FlashList
            ref={listRef}
            data={allMessages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            maintainVisibleContentPosition={{
              startRenderingFromBottom: true,
              autoscrollToBottomThreshold: 0.2,
            }}
            onStartReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                hapticPullToRefreshSnap();
                fetchNextPage();
              }
            }}
            onStartReachedThreshold={0.3}
            onScroll={(e) => {
              const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
              const distanceFromBottom =
                contentSize.height - (contentOffset.y + layoutMeasurement.height);
              setShowScrollFab(distanceFromBottom > 300);
            }}
            scrollEventThrottle={100}
            accessibilityRole="list"
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <View style={styles.e2eRow}>
                  <NativeIcon
                    name="lock.fill"
                    androidName="lock"
                    size={11}
                    color={colors.tertiaryForeground}
                  />
                  <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                    {t('e2e_info')}
                  </ThemedText>
                </View>
              </View>
            }
            renderItem={({ item: msg, index }) => {
              const isOwn = msg.senderId === userId;
              const plaintext = decryptedCache[msg.id];
              const msgDate = new Date(msg.createdAt);
              const prevMsg = allMessages[index - 1];
              const showDateSep =
                !prevMsg || toDateKey(msgDate) !== toDateKey(new Date(prevMsg.createdAt));

              const { isFirstInGroup, isLastInGroup, showSender } = getGroupFlags(index);
              const deliveryStatus = getDeliveryStatus(msg);

              return (
                <View>
                  {showDateSep ? (
                    <DateSeparator date={msgDate} locale={i18n.language} labels={dateLabels} />
                  ) : null}
                  <MessageBubble
                    isOwn={isOwn}
                    text={plaintext ?? '…'}
                    senderName={msg.senderFirstName}
                    showSender={showSender}
                    isFirstInGroup={isFirstInGroup}
                    isLastInGroup={isLastInGroup}
                    timestamp={msgDate.toLocaleTimeString(i18n.language, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    status={
                      deliveryStatus === 'sending'
                        ? 'sending'
                        : deliveryStatus === 'sent'
                          ? 'sent'
                          : undefined
                    }
                  />
                  {deliveryStatus === 'failed' ? (
                    <Pressable
                      onPress={() => handleRetry(msg.id)}
                      style={styles.failedRow}
                      accessibilityRole="button"
                      accessibilityLabel={t('send_failed')}
                      accessibilityHint="Tap to dismiss failure">
                      <NativeIcon
                        name="exclamationmark.circle.fill"
                        androidName="error"
                        size={12}
                        color={colors.destructive}
                      />
                      <ThemedText variant="caption1" color={colors.destructive}>
                        {t('send_failed')}
                      </ThemedText>
                    </Pressable>
                  ) : null}
                </View>
              );
            }}
          />
        )}

        <ScrollToBottomFab
          visible={showScrollFab}
          onPress={() => listRef.current?.scrollToEnd({ animated: true })}
        />
      </View>

      <ChatInputBar
        value={text}
        onChangeText={setText}
        onSend={handleSend}
        isSending={sendMessageMutation.isPending}
        placeholder={t('message_placeholder')}
      />
    </KeyboardAware>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  headerCenter: {
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  textCenter: {
    textAlign: 'center',
  },
  e2eRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listContent: {
    padding: 16,
  },
  listHeader: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  failedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
});
