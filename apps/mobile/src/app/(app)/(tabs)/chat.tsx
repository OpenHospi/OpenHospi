import { useRouter } from 'expo-router';
import { MessageSquare } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { useAppSession } from '@/context/session';
import { useConversations, type ConversationListItem } from '@/services/chat';
import { getStoragePublicUrl } from '@/lib/storage-url';

function formatConversationTime(isoString: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function getConversationDisplayName(
  item: ConversationListItem,
  currentUserId: string | undefined
): string {
  if (item.roomTitle) return item.roomTitle;
  const others = item.members.filter((m) => m.userId !== currentUserId);
  if (others.length === 0) return item.members.map((m) => m.firstName).join(', ');
  return others.map((m) => m.firstName).join(', ');
}

function getFirstOtherMember(
  item: ConversationListItem,
  currentUserId: string | undefined
): ConversationListItem['members'][number] | undefined {
  const others = item.members.filter((m) => m.userId !== currentUserId);
  return others[0] ?? item.members[0];
}

type ConversationRowProps = {
  item: ConversationListItem;
  currentUserId: string | undefined;
  onPress: () => void;
};

function ConversationRow({ item, currentUserId, onPress }: ConversationRowProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.chat' });

  const displayName = getConversationDisplayName(item, currentUserId);
  const avatarMember = getFirstOtherMember(item, currentUserId);
  const avatarUrl = avatarMember?.avatarUrl
    ? getStoragePublicUrl(avatarMember.avatarUrl, 'profile-photos')
    : null;
  const initials = avatarMember
    ? `${avatarMember.firstName[0] ?? ''}${avatarMember.lastName[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
      className="active:bg-muted/50">
      <Avatar
        alt={`${avatarMember?.firstName ?? ''} ${avatarMember?.lastName ?? ''}`.trim()}
        style={{ width: 48, height: 48 }}
        className="rounded-full">
        {avatarUrl ? <AvatarImage source={{ uri: avatarUrl }} /> : null}
        <AvatarFallback>
          <Text className="text-muted-foreground text-sm font-medium">{initials}</Text>
        </AvatarFallback>
      </Avatar>

      <View style={{ flex: 1, gap: 2 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text
            className="text-foreground text-base font-semibold"
            numberOfLines={1}
            style={{ flex: 1, marginRight: 8 }}>
            {displayName}
          </Text>
          <Text className="text-muted-foreground text-xs">
            {formatConversationTime(item.lastMessageAt)}
          </Text>
        </View>

        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text
            variant="muted"
            className="text-sm"
            numberOfLines={1}
            style={{ flex: 1, marginRight: 8 }}>
            {t('encrypted_message')}
          </Text>
          {item.unreadCount > 0 && (
            <View
              style={{
                minWidth: 20,
                height: 20,
                paddingHorizontal: 6,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
              }}
              className="bg-primary">
              <Text className="text-primary-foreground text-xs font-bold">
                {item.unreadCount > 99 ? '99+' : String(item.unreadCount)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function EmptyState() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.chat' });

  return (
    <View
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <View
        style={{ alignItems: 'center', justifyContent: 'center', padding: 48 }}
        className="rounded-lg border border-dashed">
        <MessageSquare size={32} className="text-muted-foreground" />
        <Text style={{ marginTop: 16 }} className="text-foreground text-lg font-semibold">
          {t('no_conversations')}
        </Text>
        <Text variant="muted" style={{ marginTop: 4 }} className="text-center text-sm">
          {t('empty')}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const router = useRouter();
  const { t: tBreadcrumbs } = useTranslation('translation', { keyPrefix: 'breadcrumbs' });
  const { session } = useAppSession();
  const currentUserId = session?.user?.id;

  const { data: conversations, isPending, refetch, isRefetching } = useConversations();

  if (isPending) {
    return (
      <SafeAreaView
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        className="bg-background"
        edges={['top']}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text className="text-foreground text-2xl font-bold tracking-tight">
          {tBreadcrumbs('chat')}
        </Text>
      </View>

      <FlatList
        data={conversations ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationRow
            item={item}
            currentUserId={currentUserId}
            onPress={() => router.push(`/(app)/chat/${item.id}` as never)}
          />
        )}
        ListEmptyComponent={<EmptyState />}
        contentContainerStyle={
          !conversations || conversations.length === 0 ? { flex: 1 } : { paddingBottom: 16 }
        }
        refreshing={isRefetching}
        onRefresh={refetch}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, marginLeft: 76 }} className="bg-border" />
        )}
      />
    </SafeAreaView>
  );
}
