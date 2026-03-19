import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ban, BellOff, Flag, Shield } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { useSession } from '@/lib/auth-client';
import { useConversationDetail } from '@/services/chat';

export default function ConversationInfoScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { t } = useTranslation('translation', { keyPrefix: 'app.chat' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { data: detail } = useConversationDetail(conversationId);
  const router = useRouter();
  const [blockOpen, setBlockOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  if (!detail) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="muted" className="text-sm">
          {t('loading_messages')}
        </Text>
      </View>
    );
  }

  const initial = detail.roomTitle.charAt(0).toUpperCase();

  function handleBlock() {
    setBlockOpen(false);
    Alert.alert(t('block_user'), 'User blocked');
  }

  function handleReport() {
    setReportOpen(false);
    Alert.alert(t('report_message'), 'Report submitted');
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      className="bg-background"
      contentContainerStyle={{ padding: 24, gap: 24 }}>
      {/* Header */}
      <View style={{ alignItems: 'center', gap: 12 }}>
        <Avatar alt={detail.roomTitle} style={{ width: 80, height: 80 }}>
          <AvatarFallback>
            <Text className="text-muted-foreground text-2xl font-semibold">{initial}</Text>
          </AvatarFallback>
        </Avatar>
        <Text className="text-foreground text-lg font-semibold">{detail.roomTitle}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Shield size={14} className="text-primary" />
          <Text variant="muted" className="text-xs">
            {t('encrypted')}
          </Text>
        </View>
      </View>

      {/* Room info card */}
      <View
        style={{ borderRadius: 12, padding: 16, gap: 12, borderWidth: 1 }}
        className="bg-card border-border">
        <Text className="text-foreground text-sm font-semibold">{t('room_info')}</Text>
        <Text variant="muted" className="text-sm">
          {detail.roomTitle}
        </Text>
        <Pressable
          onPress={() => router.push(`/room/${detail.roomId}`)}
          style={{
            borderRadius: 8,
            paddingVertical: 10,
            alignItems: 'center',
            borderWidth: 1,
          }}
          className="border-border">
          <Text className="text-primary text-sm font-medium">{t('view_listing')}</Text>
        </Pressable>
      </View>

      {/* Members */}
      <View style={{ gap: 12 }}>
        <Text className="text-muted-foreground text-xs font-medium uppercase">
          {t('members')} ({detail.members.length})
        </Text>
        {detail.members.map((member) => (
          <View key={member.userId} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar alt={member.firstName} style={{ width: 32, height: 32 }}>
              <AvatarFallback>
                <Text className="text-muted-foreground text-xs font-medium">
                  {member.firstName.charAt(0).toUpperCase()}
                </Text>
              </AvatarFallback>
            </Avatar>
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

      {/* Actions */}
      <View style={{ gap: 2 }}>
        <Pressable
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 14,
            paddingHorizontal: 4,
          }}
          onPress={() => Alert.alert(t('mute_conversation'))}>
          <BellOff size={20} className="text-muted-foreground" />
          <Text className="text-foreground text-sm">{t('mute_conversation')}</Text>
        </Pressable>

        <Pressable
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 14,
            paddingHorizontal: 4,
          }}
          onPress={() => setBlockOpen(true)}>
          <Ban size={20} className="text-destructive" />
          <Text className="text-destructive text-sm">{t('block_user')}</Text>
        </Pressable>

        <Pressable
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 14,
            paddingHorizontal: 4,
          }}
          onPress={() => setReportOpen(true)}>
          <Flag size={20} className="text-destructive" />
          <Text className="text-destructive text-sm">{t('report_message')}</Text>
        </Pressable>
      </View>

      {/* Block confirmation */}
      <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('block_user')}</AlertDialogTitle>
            <AlertDialogDescription>{t('blocked')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>{tCommon('cancel')}</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={handleBlock} className="bg-destructive">
              <Text>{t('block_user')}</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report confirmation */}
      <AlertDialog open={reportOpen} onOpenChange={setReportOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('report_message')}</AlertDialogTitle>
            <AlertDialogDescription>{t('report_message')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>{tCommon('cancel')}</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={handleReport} className="bg-destructive">
              <Text>{t('report_message')}</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollView>
  );
}
