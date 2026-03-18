import { useLocalSearchParams } from 'expo-router';
import { eq } from 'drizzle-orm';
import { Lock, Send } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { EncryptionGate } from '@/components/encryption-gate';
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

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();

  return (
    <EncryptionGate>
      <ConversationChat conversationId={conversationId} />
    </EncryptionGate>
  );
}

function ConversationChat({ conversationId }: { conversationId: string }) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.chat' });
  const { data: session } = useSession();
  const userId = session?.user?.id;

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
  const inputRef = useRef<TextInput>(null);

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
  const decryptSingle = useCallback(
    async (msg: MessageRow): Promise<string | null> => {
      if (msg.messageType === 'system') return msg.payload ?? '';
      if (!msg.payload) return null;

      // Own messages — check local SQLite cache (same as Signal)
      if (msg.senderId === userId) {
        const cached = localDb
          .select({ plaintext: localMessages.plaintext })
          .from(localMessages)
          .where(eq(localMessages.id, msg.id))
          .all();
        if (cached.length > 0) return cached[0].plaintext;
      }

      if (!msg.senderDeviceId) return null;

      try {
        return await decryptMessage(
          conversationId,
          {
            userId: msg.senderId,
            deviceId: msg.senderDeviceId,
          },
          msg.payload
        );
      } catch {
        return t('decryption_failed');
      }
    },
    [userId, conversationId, decryptMessage, t]
  );

  // Decrypt messages
  useEffect(() => {
    async function decryptAll() {
      const cache: Record<string, string> = {};

      for (const msg of allMessages) {
        if (decryptedCache[msg.id]) {
          cache[msg.id] = decryptedCache[msg.id];
          continue;
        }

        const text = await decryptSingle(msg);
        if (text !== null) {
          cache[msg.id] = text;
        }
      }

      setDecryptedCache(cache);
    }

    if (allMessages.length > 0) {
      decryptAll();
    }
  }, [allMessages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase.channel(`chat:${conversationId}`);

    channel
      .on('broadcast', { event: 'new_message' }, () => {
        refetchMessages();
      })
      .on('broadcast', { event: 'sender_key_distribution' }, () => {
        if (deviceId) processPendingDistributions(deviceId);
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      className="bg-background">
      <FlatList
        data={[...allMessages].reverse()}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={{ padding: 16, gap: 4 }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
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
        renderItem={({ item: msg }) => {
          const isOwn = msg.senderId === userId;
          const plaintext = decryptedCache[msg.id];

          return (
            <View style={{ alignItems: isOwn ? 'flex-end' : 'flex-start', marginVertical: 2 }}>
              <View
                style={{
                  maxWidth: '75%',
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
                className={isOwn ? 'bg-primary' : 'bg-muted'}>
                {!isOwn && msg.senderFirstName && (
                  <Text
                    className={`text-xs font-medium ${isOwn ? 'text-primary-foreground' : 'text-foreground'}`}
                    style={{ opacity: 0.7, marginBottom: 2 }}>
                    {msg.senderFirstName}
                  </Text>
                )}
                <Text
                  className={`text-sm ${isOwn ? 'text-primary-foreground' : 'text-foreground'}`}>
                  {plaintext ?? '...'}
                </Text>
                <Text
                  className={`text-right ${isOwn ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                  style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 8,
          padding: 12,
          borderTopWidth: 1,
        }}
        className="border-border">
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder={t('message_placeholder')}
          multiline
          style={{
            flex: 1,
            minHeight: 40,
            maxHeight: 120,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            fontSize: 14,
          }}
          className="bg-muted text-foreground"
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <Pressable
          onPress={handleSend}
          disabled={!text.trim() || sendMessageMutation.isPending}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: text.trim() ? 1 : 0.5,
          }}
          className="bg-primary">
          {sendMessageMutation.isPending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Send size={18} color="white" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
