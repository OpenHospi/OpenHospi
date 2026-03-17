import { useLocalSearchParams } from 'expo-router';
import { Shield, UserCircle } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/text';
import { useSession } from '@/lib/auth-client';
import { useConversationDetail } from '@/services/chat';

export default function ConversationInfoScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { t } = useTranslation('translation', { keyPrefix: 'app.chat' });
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { data: detail } = useConversationDetail(conversationId);

  if (!detail) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="muted" className="text-sm">
          {t('loading_messages')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      className="bg-background"
      contentContainerStyle={{ padding: 24, gap: 24 }}>
      {/* Room title */}
      <View style={{ gap: 8, alignItems: 'center' }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          className="bg-primary/10">
          <Text className="text-primary text-2xl font-semibold">
            {detail.roomTitle.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text className="text-foreground text-lg font-semibold">{detail.roomTitle}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Shield size={14} className="text-primary" />
          <Text variant="muted" className="text-xs">
            {t('encrypted')}
          </Text>
        </View>
      </View>

      {/* Members */}
      <View style={{ gap: 12 }}>
        <Text className="text-muted-foreground text-xs font-medium uppercase">
          {t('members')} ({detail.members.length})
        </Text>
        {detail.members.map((member) => (
          <View key={member.userId} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <UserCircle size={24} className="text-muted-foreground" />
            <Text className="text-foreground text-sm">
              {member.firstName}
              {member.userId === userId && (
                <Text variant="muted" className="text-xs">
                  {' '}
                  ({t('you')})
                </Text>
              )}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
