import { FlashList } from '@shopify/flash-list';
import { Stack, useRouter } from 'expo-router';
import { MessageSquare } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ConversationListItem } from '@/components/chat/conversation-list-item';
import { NativeEmptyState } from '@/components/feedback/native-empty-state';
import { ThemedSkeleton } from '@/components/primitives/themed-skeleton';
import { ListSeparator } from '@/components/layout/list-separator';
import { useTheme } from '@/design';
import { hapticPullToRefreshSnap } from '@/lib/haptics';
import { useSession } from '@/lib/auth-client';
import { useConversations } from '@/services/chat';

function ChatHeader({
  title,
  searchPlaceholder,
  onSearchChange,
}: {
  title: string;
  searchPlaceholder: string;
  onSearchChange: (text: string) => void;
}) {
  return (
    <>
      <Stack.Screen options={{ headerTitle: title }} />
      <Stack.SearchBar
        placeholder={searchPlaceholder}
        hideWhenScrolling
        obscureBackground
        onChangeText={(event) => onSearchChange(event.nativeEvent.text)}
        onCancelButtonPress={() => onSearchChange('')}
      />
    </>
  );
}

function SkeletonRow() {
  return (
    <View style={styles.skeletonRow}>
      <ThemedSkeleton width={48} height={48} circle />
      <View style={styles.skeletonLines}>
        <ThemedSkeleton width="60%" height={14} />
        <ThemedSkeleton width="40%" height={12} />
      </View>
    </View>
  );
}

export default function ChatTab() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.chat' });
  const { data: session } = useSession();
  const { data: conversations, isLoading, refetch, isRefetching } = useConversations();
  const router = useRouter();
  const [searchText, setSearchText] = useState('');

  const userId = session?.user?.id;

  const filtered = searchText
    ? (conversations ?? []).filter((c) => {
        const q = searchText.toLowerCase();
        if (c.roomTitle.toLowerCase().includes(q)) return true;
        return c.members.some((m) => m.firstName.toLowerCase().includes(q));
      })
    : (conversations ?? []);

  const handleRefresh = () => {
    hapticPullToRefreshSnap();
    refetch();
  };

  if (isLoading) {
    return (
      <>
        <ChatHeader
          title={t('title')}
          searchPlaceholder={t('search_placeholder')}
          onSearchChange={setSearchText}
        />
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      </>
    );
  }

  return (
    <>
      <ChatHeader
        title={t('title')}
        searchPlaceholder={t('search_placeholder')}
        onSearchChange={setSearchText}
      />
      <FlashList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const otherMembers = item.members.filter((m) => m.userId !== userId);
          const displayName =
            otherMembers.length > 0
              ? otherMembers.map((m) => m.firstName).join(', ')
              : item.roomTitle;

          return (
            <ConversationListItem
              id={item.id}
              roomTitle={item.roomTitle}
              roomPhotoUrl={item.roomPhotoUrl}
              displayName={displayName}
              lastMessageAt={item.lastMessageAt}
              unreadCount={item.unreadCount}
              locale={t('locale')}
              onPress={() =>
                router.push({
                  pathname: '/(app)/(tabs)/chat/[conversationId]',
                  params: { conversationId: item.id },
                })
              }
            />
          );
        }}
        ItemSeparatorComponent={() => <ListSeparator insetLeft={76} />}
        ListEmptyComponent={
          <NativeEmptyState
            sfSymbol="bubble.left.and.bubble.right"
            icon={MessageSquare}
            title={searchText ? t('no_conversations') : t('empty')}
          />
        }
        refreshing={isRefetching}
        onRefresh={handleRefresh}
      />
    </>
  );
}

const styles = StyleSheet.create({
  skeletonContainer: {
    flex: 1,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  skeletonLines: {
    flex: 1,
    gap: 6,
  },
});
