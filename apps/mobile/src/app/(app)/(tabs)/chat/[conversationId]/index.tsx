import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { eq } from 'drizzle-orm';
import { Lock } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ChatInputBar } from '@/components/chat-input-bar';
import { DateSeparator } from '@/components/date-separator';
import { EncryptionGate } from '@/components/encryption-gate';
import { MessageBubble } from '@/components/message-bubble';
import { ScrollToBottomFab } from '@/components/scroll-to-bottom-fab';
import { Text } from '@/components/ui/text';
import { useEncryptionContext } from '@/hooks/use-encryption';
import { useSession } from '@/lib/auth-client';
import { db as localDb } from '@/lib/db';
import { localMessages } from '@/lib/db/schema';
import { supabase } from '@/lib/supabase';
import {
  useConversationDetail,
  useMessages,
  useMarkConversationRead,
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
  const dateLabels = { today: t('date_today'), yesterday: t('date_yesterday') };
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const router = useRouter();

  const { data: detail } = useConversationDetail(conversationId);
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchMessages,
  } = useMessages(conversationId);
  const sendMessageMutation = useSendMessage();
  const markRead = useMarkConversationRead();
  const { encryptMessage, decryptMessage, processPendingDistributions, deviceId } =
    useEncryptionContext();

  const [text, setText] = useState('');
  const [decryptedCache, setDecryptedCache] = useState<Record<string, string>>({});
  const [distributionVersion, setDistributionVersion] = useState(0);
  const [showScrollFab, setShowScrollFab] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const allMessages = messagesData?.pages.flatMap((p) => p.messages) ?? [];
  const memberUserIds = detail?.members.map((m) => m.userId) ?? [];

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

  // Decrypt a single message
  async function decryptSingle(msg: MessageRow): Promise<string | null> {
    if (msg.messageType === 'system') return msg.payload ?? '';
    if (!msg.payload) return null;

    // Check local SQLite cache first (Signal's approach — crypto keys are one-time use)
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
        {
          userId: msg.senderId,
          deviceId: msg.senderDeviceId,
        },
        msg.payload
      );

      // Cache after successful decryption so we never need to re-decrypt
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

  // Stable message ID list for effect deps
  const messageIds = allMessages.map((m) => m.id).join(',');

  // Decrypt messages
  useEffect(() => {
    async function decryptAll() {
      const cache: Record<string, string> = {};

      for (const msg of allMessages) {
        if (decryptedCache[msg.id]) {
          cache[msg.id] = decryptedCache[msg.id];
          continue;
        }

        const result = await decryptSingle(msg);
        if (result !== null) {
          cache[msg.id] = result;
        }
      }

      setDecryptedCache(cache);
    }

    if (allMessages.length > 0) {
      decryptAll();
    }
  }, [messageIds, distributionVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase.channel(`chat:${conversationId}`);

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
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, deviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || !userId) return;

    setText('');

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
      setText(trimmed);
    }
  }

  // Compute message grouping
  function getGroupFlags(index: number) {
    const msg = allMessages[index];
    const prev = allMessages[index - 1]; // newer (inverted list: index-1 is newer)
    const next = allMessages[index + 1]; // older

    const FIVE_MIN = 5 * 60_000;
    const msgTime = new Date(msg.createdAt).getTime();

    const sameAsPrev =
      prev &&
      prev.senderId === msg.senderId &&
      Math.abs(new Date(prev.createdAt).getTime() - msgTime) < FIVE_MIN;

    const sameAsNext =
      next &&
      next.senderId === msg.senderId &&
      Math.abs(new Date(next.createdAt).getTime() - msgTime) < FIVE_MIN;

    // In inverted list: "first in group" = last message visually (bottom), "last in group" = first visually (top)
    return {
      isFirstInGroup: !sameAsNext, // no older message from same sender = top of group
      isLastInGroup: !sameAsPrev, // no newer message from same sender = bottom of group
      showSender: !sameAsNext, // show name at top of group
    };
  }

  const memberCount = detail?.members.length ?? 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      className="bg-background">
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(app)/(tabs)/chat/[conversationId]/info',
                  params: { conversationId },
                })
              }>
              <View style={{ alignItems: 'center' }}>
                <Text className="text-foreground text-base font-semibold" numberOfLines={1}>
                  {detail?.roomTitle ?? t('conversation')}
                </Text>
                {memberCount > 0 && (
                  <Text className="text-muted-foreground text-xs">
                    {t('members_count', { count: memberCount })}
                  </Text>
                )}
              </View>
            </Pressable>
          ),
          headerBackTitle: t('title'),
        }}
      />

      <View style={{ flex: 1 }}>
        {allMessages.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
            <Lock size={32} className="text-muted-foreground" />
            <Text variant="muted" className="text-center text-sm">
              {t('say_hello')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Lock size={12} className="text-muted-foreground" />
              <Text variant="muted" className="text-xs">
                {t('e2e_info')}
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={allMessages}
            keyExtractor={(item) => item.id}
            inverted
            contentContainerStyle={{ padding: 16 }}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
            }}
            onEndReachedThreshold={0.3}
            onScroll={(e) => {
              const offsetY = e.nativeEvent.contentOffset.y;
              setShowScrollFab(offsetY > 300);
            }}
            scrollEventThrottle={100}
            ListHeaderComponent={
              <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Lock size={12} className="text-muted-foreground" />
                  <Text variant="muted" className="text-xs">
                    {t('e2e_info')}
                  </Text>
                </View>
              </View>
            }
            renderItem={({ item: msg, index }) => {
              const isOwn = msg.senderId === userId;
              const plaintext = decryptedCache[msg.id];
              const msgDate = new Date(msg.createdAt);
              const nextMsg = allMessages[index + 1];
              const showDateSep =
                !nextMsg || toDateKey(msgDate) !== toDateKey(new Date(nextMsg.createdAt));

              const { isFirstInGroup, isLastInGroup, showSender } = getGroupFlags(index);

              return (
                <View>
                  {showDateSep && (
                    <DateSeparator date={msgDate} locale={i18n.language} labels={dateLabels} />
                  )}
                  <MessageBubble
                    isOwn={isOwn}
                    text={plaintext ?? '...'}
                    senderName={msg.senderFirstName}
                    showSender={showSender}
                    isFirstInGroup={isFirstInGroup}
                    isLastInGroup={isLastInGroup}
                    timestamp={msgDate.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  />
                </View>
              );
            }}
          />
        )}

        <ScrollToBottomFab
          visible={showScrollFab}
          onPress={() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true })}
        />
      </View>

      <ChatInputBar
        value={text}
        onChangeText={setText}
        onSend={handleSend}
        isSending={sendMessageMutation.isPending}
        placeholder={t('message_placeholder')}
      />
    </KeyboardAvoidingView>
  );
}
