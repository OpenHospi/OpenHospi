import type { GroupCiphertextPayload } from '@openhospi/crypto';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Info, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { Text } from '@/components/ui/text';
import { KeyChangeBanner } from '@/components/key-change-banner';
import { sentMessageCache } from '@/lib/crypto/sent-message-cache';
import { useAppSession } from '@/context/session';
import { useEncryption } from '@/hooks/use-encryption';
import { supabase } from '@/lib/supabase';
import {
  useConversationDetail,
  useMessages,
  useSendMessage,
  useMarkRead,
  fetchRealtimeToken,
  type MessageItem,
} from '@/services/chat';
import { useKeyChangeDetection } from '@/services/verification';

type DecryptedMessage = MessageItem & {
  decryptedText: string | null;
  decryptFailed: boolean;
};

async function tryDecryptMessage(
  msg: {
    ciphertext: string;
    iv: string;
    signature: string;
    chainIteration: number;
    chainId: string;
    senderId: string;
  },
  conversationId: string,
  decryptGroupMessage: (
    conversationId: string,
    senderUserId: string,
    payload: GroupCiphertextPayload
  ) => Promise<string>
): Promise<{ text: string | null; failed: boolean }> {
  try {
    const payload: GroupCiphertextPayload = {
      ciphertext: msg.ciphertext,
      iv: msg.iv,
      signature: msg.signature,
      chainIteration: msg.chainIteration,
      chainId: msg.chainId,
    };
    const plaintext = await decryptGroupMessage(conversationId, msg.senderId, payload);
    return { text: plaintext, failed: false };
  } catch (error) {
    console.error('[Chat] Decryption failed for message', error);
    return { text: null, failed: true };
  }
}

function MessageBubble({ message, isOwn }: { message: DecryptedMessage; isOwn: boolean }) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.chat' });

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const text = message.decryptFailed
    ? t('decryption_failed')
    : (message.decryptedText ?? t('encrypted_message'));

  return (
    <View
      style={{
        alignSelf: isOwn ? 'flex-end' : 'flex-start',
        maxWidth: '80%',
        marginHorizontal: 16,
        marginVertical: 2,
      }}>
      <View
        style={{
          borderRadius: 18,
          ...(isOwn ? { borderBottomRightRadius: 4 } : { borderBottomLeftRadius: 4 }),
          paddingHorizontal: 14,
          paddingVertical: 8,
        }}
        className={isOwn ? 'bg-primary' : 'bg-muted'}>
        <Text
          className={`text-sm leading-5 ${message.decryptFailed ? 'text-muted-foreground italic' : isOwn ? 'text-primary-foreground' : 'text-foreground'}`}>
          {text}
        </Text>
      </View>
      <Text
        className="text-muted-foreground text-xs"
        style={{
          alignSelf: isOwn ? 'flex-end' : 'flex-start',
          marginTop: 2,
          ...(isOwn ? { marginRight: 4 } : { marginLeft: 4 }),
        }}>
        {isOwn ? time : `${message.senderFirstName} · ${time}`}
      </Text>
    </View>
  );
}

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('translation', { keyPrefix: 'app.chat' });
  const { session } = useAppSession();
  const userId = session?.user?.id ?? '';

  const { data: detail } = useConversationDetail(conversationId);
  const { data: initialMessages, isPending: messagesLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const markRead = useMarkRead(conversationId);
  const { status, encryptGroupMessage, decryptGroupMessage } = useEncryption(userId);

  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);

  const otherMembers = detail?.members.filter((m) => m.userId !== userId) ?? [];
  const firstOther = otherMembers[0];

  const { hasChanged: keyChanged } = useKeyChangeDetection(firstOther?.userId ?? '');

  // Set header title
  useEffect(() => {
    if (!detail) return;
    const others = detail.members.filter((m) => m.userId !== userId);
    const title = detail.room?.title ?? others.map((m) => m.firstName).join(', ');
    navigation.setOptions({
      title,
      headerRight: () => (
        <Pressable
          onPress={() => router.push(`/(app)/chat/${conversationId}/info` as never)}
          hitSlop={8}>
          <Info size={22} className="text-foreground" />
        </Pressable>
      ),
    });
  }, [detail, conversationId, navigation, router, userId]);

  // Decrypt initial messages
  useEffect(() => {
    if (!initialMessages || status !== 'ready') return;

    let active = true;
    setIsDecrypting(true);

    (async () => {
      const decrypted = await Promise.all(
        initialMessages.map(async (msg): Promise<DecryptedMessage> => {
          if (!msg.ciphertext || !msg.iv || !msg.signature || msg.chainIteration == null) {
            return { ...msg, decryptedText: null, decryptFailed: false };
          }

          // Skip decryption for own messages — use cached plaintext
          if (msg.senderId === userId) {
            const cached = await sentMessageCache.get(msg.id);
            return { ...msg, decryptedText: cached, decryptFailed: !cached };
          }

          const result = await tryDecryptMessage(
            {
              ciphertext: msg.ciphertext,
              iv: msg.iv,
              signature: msg.signature,
              chainIteration: msg.chainIteration,
              chainId: msg.chainId ?? '',
              senderId: msg.senderId,
            },
            conversationId,
            decryptGroupMessage
          );
          return { ...msg, decryptedText: result.text, decryptFailed: result.failed };
        })
      );

      if (active) {
        setMessages(decrypted);
        setIsDecrypting(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [initialMessages, status, userId, conversationId, decryptGroupMessage]);

  // Mark conversation read on mount
  // markRead.mutate is stable per React Query — safe to exclude from deps
  useEffect(() => {
    if (conversationId) {
      markRead.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Realtime subscription
  useEffect(() => {
    if (status !== 'ready' || !userId) return;

    let active = true;

    (async () => {
      const tokenData = await fetchRealtimeToken().catch(() => null);

      if (!active) return;

      const channel = supabase.channel(`payloads:${conversationId}`, {
        config: {
          broadcast: { self: false },
          ...(tokenData ? { params: { user_token: tokenData.token } } : {}),
        },
      });

      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_payloads',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const record = payload.new as {
            message_id: string;
            sender_user_id: string;
            ciphertext: string;
            iv: string;
            signature: string;
            chain_iteration: number;
            chain_id: string;
          };

          if (!active) return;
          if (record.sender_user_id === userId) return;

          try {
            const senderMember = detail?.members.find((m) => m.userId === record.sender_user_id);

            const result = await tryDecryptMessage(
              {
                ciphertext: record.ciphertext,
                iv: record.iv,
                signature: record.signature,
                chainIteration: record.chain_iteration,
                chainId: record.chain_id ?? '',
                senderId: record.sender_user_id,
              },
              conversationId,
              decryptGroupMessage
            );

            const newMsg: DecryptedMessage = {
              id: record.message_id,
              senderId: record.sender_user_id,
              senderFirstName: senderMember?.firstName ?? '',
              senderAvatarUrl: senderMember?.avatarUrl ?? null,
              ciphertext: record.ciphertext,
              iv: record.iv,
              signature: record.signature,
              chainIteration: record.chain_iteration,
              chainId: record.chain_id ?? '',
              messageType: 'text',
              createdAt: new Date().toISOString(),
              decryptedText: result.text,
              decryptFailed: result.failed,
            };

            if (active) {
              setMessages((prev) => [newMsg, ...prev]);
              markRead.mutate();
            }
          } catch (error) {
            console.error('[Chat] Realtime decryption failed', error);
          }
        }
      );

      channel.subscribe();
      channelRef.current = channel;
    })();

    return () => {
      active = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, userId, conversationId, decryptGroupMessage]);

  async function handleSend() {
    const text = inputText.trim();
    if (!text || isSending || !detail) return;

    setIsSending(true);
    setInputText('');

    try {
      const memberUserIds = detail.members.map((m) => m.userId);
      const payload = await encryptGroupMessage(conversationId, memberUserIds, text);

      const result = await sendMessage.mutateAsync({ conversationId, payload });
      const messageId = result?.messageId ?? `optimistic-${Date.now()}`;
      await sentMessageCache.save(messageId, text);

      const ownMsg: DecryptedMessage = {
        id: messageId,
        senderId: userId,
        senderFirstName: session?.user?.name ?? '',
        senderAvatarUrl: null,
        ciphertext: null,
        iv: null,
        signature: null,
        chainIteration: null,
        chainId: null,
        messageType: 'text',
        createdAt: new Date().toISOString(),
        decryptedText: text,
        decryptFailed: false,
      };
      setMessages((prev) => [ownMsg, ...prev]);
    } catch (error) {
      console.error('[Chat] Failed to send message:', error);
      setInputText(text);
      Alert.alert(t('error_title'), t('send_error'));
    } finally {
      setIsSending(false);
    }
  }

  if (status === 'loading') {
    return (
      <SafeAreaView
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        className="bg-background"
        edges={['bottom']}>
        <ActivityIndicator size="large" />
        <Text variant="muted" style={{ marginTop: 12 }} className="text-sm">
          {t('loading_messages')}
        </Text>
      </SafeAreaView>
    );
  }

  if (status === 'needs-setup' || status === 'needs-recovery') {
    return (
      <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['bottom']}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: 32,
          }}>
          <Text className="text-foreground text-center text-lg font-semibold">
            {status === 'needs-recovery'
              ? t('encryption.unlock_title')
              : t('encryption.setup_title')}
          </Text>
          <Text variant="muted" className="text-center text-sm">
            {status === 'needs-recovery'
              ? t('encryption.unlock_description')
              : t('encryption.setup_description')}
          </Text>
          <Pressable
            onPress={() => router.push('/(app)/(modals)/key-recovery' as never)}
            style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
            className="bg-primary">
            <Text className="text-primary-foreground font-semibold">
              {status === 'needs-recovery'
                ? t('encryption.unlock_pin')
                : t('encryption.setup_with_pin')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
        {firstOther && (
          <KeyChangeBanner
            peerUserId={firstOther.userId}
            peerName={firstOther.firstName}
            hasChanged={keyChanged}
          />
        )}

        {messagesLoading || isDecrypting ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <ActivityIndicator size="small" />
            <Text variant="muted" className="text-sm">
              {isDecrypting ? t('decrypting') : t('loading_messages')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble message={item} isOwn={item.senderId === userId} />
            )}
            inverted
            contentContainerStyle={{ paddingVertical: 12 }}
            ListEmptyComponent={
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 32,
                  paddingVertical: 48,
                }}>
                <Text variant="muted" className="text-center text-sm">
                  {t('no_messages')}
                </Text>
              </View>
            }
          />
        )}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 8,
            paddingHorizontal: 12,
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 8),
          }}
          className="border-border bg-background border-t">
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={t('message_placeholder')}
            multiline
            style={{
              flex: 1,
              maxHeight: 120,
              minHeight: 40,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 20,
            }}
            className="border-border bg-muted text-foreground border text-sm leading-5"
            placeholderTextColor="rgba(0,0,0,0.4)"
            returnKeyType="default"
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className={inputText.trim() && !isSending ? 'bg-primary' : 'bg-muted'}>
            {isSending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Send
                size={18}
                className={inputText.trim() ? 'text-primary-foreground' : 'text-muted-foreground'}
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
