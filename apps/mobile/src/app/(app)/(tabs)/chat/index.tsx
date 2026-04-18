import { FlashList } from '@shopify/flash-list';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ConversationListItem } from '@/components/chat/conversation-list-item';
import { NativeEmptyState } from '@/components/feedback/native-empty-state';
import { NativeDivider } from '@/components/native/divider';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { useSession } from '@/lib/auth-client';
import { hapticPullToRefreshSnap } from '@/lib/haptics';
import { useConversations } from '@/services/chat';

function SkeletonRow() {
  return (
    <View style={styles.skeletonRow} accessibilityRole="progressbar" accessibilityLabel="Loading">
      <ThemedSkeleton width={52} height={52} circle />
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
  const locale = t('locale');

  const filtered = searchText
    ? (conversations ?? []).filter((c) => {
        const q = searchText.toLowerCase();
        if (c.roomTitle.toLowerCase().includes(q)) return true;
        return c.members.some((m) => m.firstName.toLowerCase().includes(q));
      })
    : (conversations ?? []);

  function handleRefresh() {
    hapticPullToRefreshSnap();
    refetch();
  }

  return (
    <>
      <Stack.Screen options={{ headerTitle: t('title') }} />
      <Stack.SearchBar
        placeholder={t('search_placeholder')}
        hideWhenScrolling
        obscureBackground
        onChangeText={(event) => setSearchText(event.nativeEvent.text)}
        onCancelButtonPress={() => setSearchText('')}
      />

      {isLoading ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : (
        <FlashList
          contentInsetAdjustmentBehavior="automatic"
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
                locale={locale}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/(tabs)/chat/[conversationId]',
                    params: { conversationId: item.id },
                  })
                }
              />
            );
          }}
          ItemSeparatorComponent={SeparatorInset}
          ListEmptyComponent={
            <NativeEmptyState
              sfSymbol="bubble.left.and.bubble.right"
              androidIcon="forum"
              title={searchText ? t('no_conversations') : t('empty')}
            />
          }
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
        />
      )}
    </>
  );
}

function SeparatorInset() {
  return (
    <View style={styles.separatorWrap}>
      <NativeDivider />
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonContainer: {
    flex: 1,
    paddingTop: 8,
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
  separatorWrap: {
    marginStart: 80,
  },
});
