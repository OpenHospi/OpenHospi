import { useRouter } from 'expo-router';
import { MessageSquare, Shield } from 'lucide-react-native';
import { FlatList, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/text';
import { useSession } from '@/lib/auth-client';
import { useConversations } from '@/services/chat';

export default function ChatTab() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.chat' });
  const { data: session } = useSession();
  const { data: conversations, isLoading } = useConversations();
  const router = useRouter();

  const userId = session?.user?.id;

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="muted" className="text-sm">
          {t('loading_messages')}
        </Text>
      </View>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 }}>
        <MessageSquare size={40} className="text-muted-foreground" />
        <Text variant="muted" className="text-center text-sm">
          {t('no_conversations')}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const otherMembers = item.members.filter((m) => m.userId !== userId);
          const displayName =
            otherMembers.length > 0
              ? otherMembers.map((m) => m.firstName).join(', ')
              : item.roomTitle;

          return (
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
              onPress={() => router.push(`/chat/${item.id}`)}>
              {/* Avatar */}
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                className="bg-primary/10">
                <Text className="text-primary font-medium">
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>

              {/* Content */}
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text className="text-foreground text-sm font-medium" numberOfLines={1}>
                    {item.roomTitle}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Shield size={10} className="text-primary" />
                  <Text variant="muted" className="text-xs" numberOfLines={1}>
                    {displayName}
                  </Text>
                </View>
              </View>

              {/* Unread badge */}
              {item.unreadCount > 0 && (
                <View
                  style={{
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 6,
                  }}
                  className="bg-primary">
                  <Text className="text-primary-foreground text-xs font-medium">
                    {item.unreadCount > 99 ? '99+' : String(item.unreadCount)}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}
