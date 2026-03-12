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
import type { EncryptedMessage, X3DHMetadata } from '@openhospi/crypto';

type DecryptedMessage = MessageItem & {
  decryptedText: string | null;
  decryptFailed: boolean;
};

function buildX3DHMeta(msg: {
  ephemeralPublicKey?: string | null;
  senderIdentityKey?: string | null;
  usedSignedPreKeyId?: number | null;
  usedOneTimePreKeyId?: number | null;
}): X3DHMetadata | undefined {
  if (!msg.ephemeralPublicKey || !msg.senderIdentityKey || msg.usedSignedPreKeyId == null) {
    return undefined;
  }
  return {
    ephemeralPublicKey: msg.ephemeralPublicKey,
    senderIdentityKey: msg.senderIdentityKey,
    usedSignedPreKeyId: msg.usedSignedPreKeyId,
    usedOneTimePreKeyId: msg.usedOneTimePreKeyId ?? undefined,
  };
}

async function tryDecryptMessage(
  msg: {
    ciphertext: string;
    iv: string;
    ratchetPublicKey: string | null;
    messageNumber: number | null;
    previousChainLength: number | null;
    ephemeralPublicKey?: string | null;
    senderIdentityKey?: string | null;
    usedSignedPreKeyId?: number | null;
    usedOneTimePreKeyId?: number | null;
    senderId: string;
  },
  userId: string,
  conversationId: string,
  decryptMessage: (
    conversationId: string,
    senderUserId: string,
    encrypted: EncryptedMessage,
    x3dhMeta?: X3DHMetadata | null
  ) => Promise<string>,
  decryptForSelf: (ciphertext: string, iv: string) => Promise<string>
): Promise<{ text: string | null; failed: boolean }> {
  try {
    if (msg.senderId === userId && msg.ratchetPublicKey === 'self') {
      const plaintext = await decryptForSelf(msg.ciphertext, msg.iv);
      return { text: plaintext, failed: false };
    }

    if (msg.ratchetPublicKey && msg.messageNumber != null && msg.previousChainLength != null) {
      const encrypted: EncryptedMessage = {
        ciphertext: msg.ciphertext,
        iv: msg.iv,
        header: {
          ratchetPublicKey: msg.ratchetPublicKey,
          messageNumber: msg.messageNumber,
          previousChainLength: msg.previousChainLength,
        },
      };
      const x3dhMeta = buildX3DHMeta(msg);
      const plaintext = await decryptMessage(conversationId, msg.senderId, encrypted, x3dhMeta);
      return { text: plaintext, failed: false };
    }

    return { text: null, failed: false };
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
  const { status, encryptMessage, decryptMessage, encryptForSelf, decryptForSelf } =
    useEncryption(userId);

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
          if (!msg.ciphertext || !msg.iv) {
            return { ...msg, decryptedText: null, decryptFailed: false };
          }

          const result = await tryDecryptMessage(
            { ...msg, ciphertext: msg.ciphertext, iv: msg.iv },
            userId,
            conversationId,
            decryptMessage,
            decryptForSelf
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
            ephemeral_public_key: string | null;
            sender_identity_key: string | null;
            used_signed_pre_key_id: number | null;
            used_one_time_pre_key_id: number | null;
          };

          if (!active) return;
          if (record.sender_user_id === userId) return;

          try {
            const senderMember = detail?.members.find((m) => m.userId === record.sender_user_id);

            const result = await tryDecryptMessage(
              {
                ciphertext: record.ciphertext,
                iv: record.iv,
                ratchetPublicKey: record.ratchet_public_key,
                messageNumber: record.message_number,
                previousChainLength: record.previous_chain_length,
                ephemeralPublicKey: record.ephemeral_public_key,
                senderIdentityKey: record.sender_identity_key,
                usedSignedPreKeyId: record.used_signed_pre_key_id,
                usedOneTimePreKeyId: record.used_one_time_pre_key_id,
                senderId: record.sender_user_id,
              },
              userId,
              conversationId,
              decryptMessage,
              decryptForSelf
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
              ephemeralPublicKey: record.ephemeral_public_key,
              senderIdentityKey: record.sender_identity_key,
              usedSignedPreKeyId: record.used_signed_pre_key_id,
              usedOneTimePreKeyId: record.used_one_time_pre_key_id,
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
          const result = await encryptMessage(conversationId, member.userId, text);
          return {
            recipientUserId: member.userId,
            ciphertext: result.encrypted.ciphertext,
            iv: result.encrypted.iv,
            ratchetPublicKey: result.encrypted.header.ratchetPublicKey,
            messageNumber: result.encrypted.header.messageNumber,
            previousChainLength: result.encrypted.header.previousChainLength,
            ephemeralPublicKey: result.x3dhMeta?.ephemeralPublicKey,
            senderIdentityKey: result.x3dhMeta?.senderIdentityKey,
            usedSignedPreKeyId: result.x3dhMeta?.usedSignedPreKeyId,
            usedOneTimePreKeyId: result.x3dhMeta?.usedOneTimePreKeyId,
          };
        })
      );

      const selfEncrypted = await encryptForSelf(text);
      payloads.push({
        recipientUserId: userId,
        ciphertext: selfEncrypted.ciphertext,
        iv: selfEncrypted.iv,
        ratchetPublicKey: 'self',
        messageNumber: 0,
        previousChainLength: 0,
        ephemeralPublicKey: undefined,
        senderIdentityKey: undefined,
        usedSignedPreKeyId: undefined,
        usedOneTimePreKeyId: undefined,
      });

      await sendMessage.mutateAsync({ conversationId, payloads });

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
        ephemeralPublicKey: null,
        senderIdentityKey: null,
        usedSignedPreKeyId: null,
        usedOneTimePreKeyId: null,
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
