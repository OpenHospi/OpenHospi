import { useLocalSearchParams, useRouter } from 'expo-router';
import { Info, Lock, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
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

import { Text } from '@/components/ui/text';
import { useEncryption } from '@/hooks/use-encryption';
import { useSession } from '@/lib/auth-client';
import {
  useConversationDetail,
  useMessages,
  useMarkConversationRead,
  useSendMessage,
} from '@/services/chat';

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { t } = useTranslation('translation', { keyPrefix: 'app.chat' });
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { data: detail } = useConversationDetail(conversationId);
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(conversationId);
  const sendMessageMutation = useSendMessage();
  const markRead = useMarkConversationRead();
  const { encryptMessage, decryptMessage } = useEncryption(userId);

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

  // Decrypt messages
  useEffect(() => {
    async function decryptAll() {
      const cache: Record<string, string> = {};

      for (const msg of allMessages) {
        if (decryptedCache[msg.id]) {
          cache[msg.id] = decryptedCache[msg.id];
          continue;
        }

        if (msg.messageType === 'system') {
          cache[msg.id] = msg.payload ?? '';
          continue;
        }

        if (!msg.payload) continue;

        try {
          const plaintext = await decryptMessage(
            conversationId,
            {
              userId: msg.senderId,
              deviceId: 1,
            },
            msg.payload
          );
          cache[msg.id] = plaintext;
        } catch {
          cache[msg.id] = t('decryption_failed');
        }
      }

      setDecryptedCache(cache);
    }

    if (allMessages.length > 0) {
      decryptAll();
    }
  }, [allMessages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || !userId) return;

    setText('');

    try {
      const payload = await encryptMessage(conversationId, memberUserIds, trimmed);
      await sendMessageMutation.mutateAsync({
        conversationId,
        payload,
      });
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
      {/* Messages */}
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

      {/* Input */}
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
