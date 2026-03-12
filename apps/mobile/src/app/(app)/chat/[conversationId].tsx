import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Info, Send } from 'lucide-react-native';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { Text } from '@/components/ui/text';
import { KeyChangeBanner } from '@/components/key-change-banner';
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
import type { EncryptedMessage } from '@openhospi/crypto';

type DecryptedMessage = MessageItem & {
  decryptedText: string | null;
  decryptFailed: boolean;
};

function MessageBubble({ message, isOwn }: { message: DecryptedMessage; isOwn: boolean }) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.chat' });

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isOwn) {
    return (
      <View
        style={{ alignSelf: 'flex-end', maxWidth: '80%', marginHorizontal: 16, marginVertical: 2 }}>
        <View
          style={{
            borderRadius: 18,
            borderBottomRightRadius: 4,
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}
          className="bg-primary">
          <Text className="text-primary-foreground text-sm leading-5">
            {message.decryptedText ?? t('encrypted_message')}
          </Text>
        </View>
        <Text
          className="text-muted-foreground text-xs"
          style={{ alignSelf: 'flex-end', marginTop: 2, marginRight: 4 }}>
          {time}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{ alignSelf: 'flex-start', maxWidth: '80%', marginHorizontal: 16, marginVertical: 2 }}>
      <View
        style={{
          borderRadius: 18,
          borderBottomLeftRadius: 4,
          paddingHorizontal: 14,
          paddingVertical: 8,
        }}
        className="bg-muted">
        {message.decryptFailed ? (
          <Text className="text-muted-foreground text-sm leading-5 italic">
            {t('decryption_failed')}
          </Text>
        ) : (
          <Text className="text-foreground text-sm leading-5">
            {message.decryptedText ?? t('encrypted_message')}
          </Text>
        )}
      </View>
      <Text className="text-muted-foreground text-xs" style={{ marginTop: 2, marginLeft: 4 }}>
        {message.senderFirstName} · {time}
      </Text>
    </View>
  );
}

function EncryptionGate({
  status,
  onSetup,
}: {
  status: 'needs-setup' | 'needs-recovery';
  onSetup: () => void;
}) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.chat.encryption' });

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
      <Text className="text-foreground text-center text-lg font-semibold">
        {status === 'needs-recovery' ? t('unlock_title') : t('setup_title')}
      </Text>
      <Text variant="muted" className="text-center text-sm">
        {status === 'needs-recovery' ? t('unlock_description') : t('setup_description')}
      </Text>
      <Pressable
        onPress={onSetup}
        style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
        className="bg-primary">
        <Text className="text-primary-foreground font-semibold">
          {status === 'needs-recovery' ? t('unlock_pin') : t('setup_with_pin')}
        </Text>
      </Pressable>
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
  const { status, encryptMessage, decryptMessage, encryptForSelf, decryptForSelf } =
    useEncryption(userId);

  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const flatListRef = useRef<FlatList<DecryptedMessage>>(null);

  const otherMembers = detail?.members.filter((m) => m.userId !== userId) ?? [];
  const firstOther = otherMembers[0];

  const { hasChanged: keyChanged } = useKeyChangeDetection(firstOther?.userId ?? '', undefined);

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
          hitSlop={8}
          style={{ paddingRight: 8 }}>
          <Info size={20} className="text-foreground" />
        </Pressable>
      ),
    });
  }, [detail, conversationId, navigation, router, userId]);

  // Decrypt initial messages
  useEffect(() => {
    if (!initialMessages || status !== 'ready') return;

    setIsDecrypting(true);
    (async () => {
      const decrypted = await Promise.all(
        initialMessages.map(async (msg): Promise<DecryptedMessage> => {
          if (!msg.ciphertext || !msg.iv) {
            return { ...msg, decryptedText: null, decryptFailed: false };
          }

          try {
            if (msg.senderId === userId && msg.ratchetPublicKey === 'self') {
              // Own message — self-encrypted
              const plaintext = await decryptForSelf(msg.ciphertext, msg.iv);
              return { ...msg, decryptedText: plaintext, decryptFailed: false };
            }

            if (
              msg.ratchetPublicKey &&
              msg.messageNumber != null &&
              msg.previousChainLength != null
            ) {
              // Other member's message — Double Ratchet
              const encrypted: EncryptedMessage = {
                ciphertext: msg.ciphertext,
                iv: msg.iv,
                header: {
                  ratchetPublicKey: msg.ratchetPublicKey,
                  messageNumber: msg.messageNumber,
                  previousChainLength: msg.previousChainLength,
                },
              };
              const plaintext = await decryptMessage(conversationId, msg.senderId, encrypted);
              return { ...msg, decryptedText: plaintext, decryptFailed: false };
            }

            return { ...msg, decryptedText: null, decryptFailed: false };
          } catch (error) {
            console.error('[Chat] Decryption failed for message', msg.id, error);
            return { ...msg, decryptedText: null, decryptFailed: true };
          }
        })
      );
      setMessages(decrypted.slice().reverse());
      setIsDecrypting(false);
    })();
  }, [initialMessages, status, userId, conversationId, decryptMessage, decryptForSelf]);

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

      const channel = supabase.channel(`chat:${conversationId}`, {
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
          table: 'message_ciphertexts',
          filter: `recipient_user_id=eq.${userId}`,
        },
        async (payload) => {
          const record = payload.new as {
            message_id: string;
            sender_user_id: string;
            ciphertext: string;
            iv: string;
            ratchet_public_key: string;
            message_number: number;
            previous_chain_length: number;
          };

          if (!active) return;

          // Skip own messages — optimistic add already covers them
          if (record.sender_user_id === userId) return;

          try {
            const senderMember = detail?.members.find((m) => m.userId === record.sender_user_id);

            const encrypted: EncryptedMessage = {
              ciphertext: record.ciphertext,
              iv: record.iv,
              header: {
                ratchetPublicKey: record.ratchet_public_key,
                messageNumber: record.message_number,
                previousChainLength: record.previous_chain_length,
              },
            };

            const plaintext = await decryptMessage(
              conversationId,
              record.sender_user_id,
              encrypted
            );

            const newMsg: DecryptedMessage = {
              id: record.message_id,
              senderId: record.sender_user_id,
              senderFirstName: senderMember?.firstName ?? '',
              senderAvatarUrl: senderMember?.avatarUrl ?? null,
              ciphertext: record.ciphertext,
              iv: record.iv,
              ratchetPublicKey: record.ratchet_public_key,
              messageNumber: record.message_number,
              previousChainLength: record.previous_chain_length,
              messageType: 'text',
              createdAt: new Date().toISOString(),
              decryptedText: plaintext,
              decryptFailed: false,
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
  }, [status, userId, conversationId, decryptMessage]);

  async function handleSend() {
    const text = inputText.trim();
    if (!text || isSending || !detail) return;

    const recipients = detail.members.filter((m) => m.userId !== userId);
    if (recipients.length === 0) return;

    setIsSending(true);
    setInputText('');

    try {
      const payloads = await Promise.all(
        recipients.map(async (member) => {
          const encrypted = await encryptMessage(conversationId, member.userId, text);
          return {
            recipientUserId: member.userId,
            ciphertext: encrypted.ciphertext,
            iv: encrypted.iv,
            ratchetPublicKey: encrypted.header.ratchetPublicKey,
            messageNumber: encrypted.header.messageNumber,
            previousChainLength: encrypted.header.previousChainLength,
          };
        })
      );

      // Encrypt for self (HKDF-derived key)
      const selfEncrypted = await encryptForSelf(text);
      payloads.push({
        recipientUserId: userId,
        ciphertext: selfEncrypted.ciphertext,
        iv: selfEncrypted.iv,
        ratchetPublicKey: 'self',
        messageNumber: 0,
        previousChainLength: 0,
      });

      await sendMessage.mutateAsync({ conversationId, payloads });

      // Optimistically add own message to the list
      const ownMsg: DecryptedMessage = {
        id: `optimistic-${Date.now()}`,
        senderId: userId,
        senderFirstName: session?.user?.name ?? '',
        senderAvatarUrl: null,
        ciphertext: null,
        iv: null,
        ratchetPublicKey: null,
        messageNumber: null,
        previousChainLength: null,
        messageType: 'text',
        createdAt: new Date().toISOString(),
        decryptedText: text,
        decryptFailed: false,
      };
      setMessages((prev) => [ownMsg, ...prev]);
    } catch {
      setInputText(text);
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
        <EncryptionGate
          status={status}
          onSetup={() => router.push('/(app)/(modals)/key-recovery' as never)}
        />
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
            ref={flatListRef}
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
