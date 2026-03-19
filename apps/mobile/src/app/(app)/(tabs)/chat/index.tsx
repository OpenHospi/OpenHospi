import { Stack, useRouter } from 'expo-router';
import { MessageSquare } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ConversationListItem } from '@/components/conversation-list-item';
import { Text } from '@/components/ui/text';
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
      <Stack.Screen
        options={{
          headerTitle: title,
        }}
      />
      <Stack.SearchBar
        placeholder={searchPlaceholder}
        hideWhenScrolling={false}
        onChangeText={(event) => onSearchChange(event.nativeEvent.text)}
        onCancelButtonPress={() => onSearchChange('')}
      />
    </>
  );
}

function SkeletonRow() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}>
      <View style={{ width: 48, height: 48, borderRadius: 24 }} className="bg-muted" />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ width: '60%', height: 14, borderRadius: 4 }} className="bg-muted" />
        <View style={{ width: '40%', height: 12, borderRadius: 4 }} className="bg-muted" />
      </View>
    </View>
  );
}

export default function ChatTab() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'app.chat' });
  const { data: session } = useSession();
  const { data: conversations, isLoading } = useConversations();
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

  if (isLoading) {
    return (
      <>
        <ChatHeader
          title={t('title')}
          searchPlaceholder={t('search_placeholder')}
          onSearchChange={setSearchText}
        />
        <View style={{ flex: 1 }}>
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
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
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
              locale={i18n.language}
              onPress={() => router.push(`/chat/${item.id}`)}
            />
          );
        }}
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              gap: 12,
              padding: 24,
            }}>
            <MessageSquare size={48} className="text-muted-foreground" />
            <Text variant="muted" className="text-center text-sm">
              {searchText ? t('no_conversations') : t('empty')}
            </Text>
          </View>
        }
        contentContainerStyle={filtered.length === 0 ? { flex: 1 } : undefined}
      />
    </>
  );
}
