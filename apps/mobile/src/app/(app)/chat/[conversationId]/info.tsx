import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Euro, Home, Lock, Shield, ShieldCheck } from 'lucide-react-native';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { useAppSession } from '@/context/session';
import { useConversationDetail, type ConversationDetail } from '@/services/chat';
import { useVerificationStatus } from '@/services/verification';
import { getStoragePublicUrl } from '@/lib/storage-url';

type Member = ConversationDetail['members'][number];

function MemberRow({ member, onVerify }: { member: Member; onVerify: (member: Member) => void }) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.chat' });
  const { isVerified } = useVerificationStatus(member.userId);

  const avatarUrl = member.avatarUrl
    ? getStoragePublicUrl(member.avatarUrl, 'profile-photos')
    : null;
  const initials = `${member.firstName[0] ?? ''}${member.lastName[0] ?? ''}`.toUpperCase();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
      }}>
      <Avatar
        alt={`${member.firstName} ${member.lastName}`}
        style={{ width: 40, height: 40 }}
        className="rounded-full">
        {avatarUrl ? <AvatarImage source={{ uri: avatarUrl }} /> : null}
        <AvatarFallback>
          <Text className="text-muted-foreground text-sm font-medium">{initials}</Text>
        </AvatarFallback>
      </Avatar>

      <View style={{ flex: 1 }}>
        <Text className="text-foreground text-sm font-medium">
          {member.firstName} {member.lastName}
        </Text>
        <Text className="text-muted-foreground text-xs">
          {member.role === 'house_member' ? t('house_members') : t('seeker_info')}
        </Text>
      </View>

      <Pressable
        onPress={() => onVerify(member)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 8,
        }}
        className={isVerified ? 'bg-green-500/10' : 'bg-muted'}>
        {isVerified ? (
          <ShieldCheck size={14} className="text-green-600" />
        ) : (
          <Shield size={14} className="text-muted-foreground" />
        )}
        <Text
          className={
            isVerified ? 'text-xs font-medium text-green-600' : 'text-muted-foreground text-xs'
          }>
          {isVerified ? t('verified') : t('not_verified')}
        </Text>
      </Pressable>
    </View>
  );
}

function RoomCard({ room }: { room: NonNullable<ConversationDetail['room']> }) {
  const router = useRouter();

  const coverUrl = room.coverPhotoUrl
    ? getStoragePublicUrl(room.coverPhotoUrl, 'room-photos')
    : null;

  return (
    <Pressable
      onPress={() => router.push(`/(app)/room/${room.id}` as never)}
      style={{ marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' }}
      className="border-border bg-card border">
      {coverUrl ? (
        <Image
          source={{ uri: coverUrl }}
          style={{ width: '100%', height: 140 }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{ width: '100%', height: 140, alignItems: 'center', justifyContent: 'center' }}
          className="bg-muted">
          <Home size={32} className="text-muted-foreground" />
        </View>
      )}
      <View style={{ padding: 12, gap: 4 }}>
        <Text className="text-card-foreground font-semibold" numberOfLines={1}>
          {room.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text className="text-muted-foreground text-sm">{room.city}</Text>
          <Text className="text-muted-foreground text-sm">·</Text>
          <Euro size={12} className="text-primary" />
          <Text className="text-primary text-sm font-medium">{room.rentPrice}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 }}>
      <Text className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
        {title}
      </Text>
    </View>
  );
}

export default function ConversationInfoScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.chat' });
  const { session } = useAppSession();
  const currentUserId = session?.user?.id;

  const { data: detail, isPending } = useConversationDetail(conversationId);

  if (isPending) {
    return (
      <SafeAreaView
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        className="bg-background"
        edges={['bottom']}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!detail) {
    return (
      <SafeAreaView
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        className="bg-background"
        edges={['bottom']}>
        <Text variant="muted">{t('conversation')}</Text>
      </SafeAreaView>
    );
  }

  const isSeeker = detail.seekerUserId === currentUserId;

  const houseMembers = detail.members.filter((m) => m.role === 'house_member');
  const seekerMembers = detail.members.filter((m) => m.role === 'seeker');

  function handleVerify(member: Member) {
    router.push({
      pathname: '/(app)/(modals)/verify-identity' as never,
      params: {
        peerUserId: member.userId,
        peerName: `${member.firstName} ${member.lastName}`,
      },
    });
  }

  function handleBlockUser() {
    Alert.alert(t('block_user'), undefined, [
      { text: t('block_user'), style: 'destructive', onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function handleReportUser(name: string) {
    Alert.alert(t('report_user', { name }), undefined, [
      { text: t('report_user', { name }), style: 'destructive', onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['bottom']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* E2E encrypted info badge */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginHorizontal: 16,
            marginTop: 16,
            padding: 12,
            borderRadius: 10,
          }}
          className="bg-primary/10">
          <Lock size={16} className="text-primary" />
          <Text className="text-primary text-sm font-medium">{t('e2e_info')}</Text>
        </View>

        {/* Room card */}
        {detail.room && (
          <>
            <SectionHeader title={t('room_details')} />
            <RoomCard room={detail.room} />
          </>
        )}

        {/* If seeker: show house members first */}
        {isSeeker && houseMembers.length > 0 && (
          <>
            <SectionHeader title={t('house_members')} />
            <View className="border-border border-t">
              {houseMembers.map((member) => (
                <View key={member.userId}>
                  <MemberRow member={member} onVerify={handleVerify} />
                  <View style={{ height: 1, marginLeft: 68 }} className="bg-border" />
                </View>
              ))}
            </View>
          </>
        )}

        {/* If house member: show seeker first */}
        {!isSeeker && seekerMembers.length > 0 && (
          <>
            <SectionHeader title={t('seeker_info')} />
            <View className="border-border border-t">
              {seekerMembers.map((member) => (
                <View key={member.userId}>
                  <MemberRow member={member} onVerify={handleVerify} />
                  <View style={{ height: 1, marginLeft: 68 }} className="bg-border" />
                </View>
              ))}
            </View>
          </>
        )}

        {/* All members section — shown for both roles */}
        <SectionHeader title={t('all_members')} />
        <View className="border-border border-t">
          {detail.members.map((member) => (
            <View key={member.userId}>
              <MemberRow member={member} onVerify={handleVerify} />
              <View style={{ height: 1, marginLeft: 68 }} className="bg-border" />
            </View>
          ))}
        </View>

        {/* Actions */}
        <SectionHeader title="" />
        <View className="border-border border-t border-b">
          {seekerMembers.length > 0 && seekerMembers[0] && (
            <Pressable
              onPress={() =>
                handleReportUser(`${seekerMembers[0]!.firstName} ${seekerMembers[0]!.lastName}`)
              }
              style={{ paddingHorizontal: 16, paddingVertical: 14 }}
              className="active:bg-muted/50">
              <Text className="text-destructive text-sm">
                {t('report_user', {
                  name: `${seekerMembers[0].firstName} ${seekerMembers[0].lastName}`,
                })}
              </Text>
            </Pressable>
          )}
          {houseMembers.length > 0 && !isSeeker && (
            <View style={{ height: 1 }} className="bg-border" />
          )}
          <Pressable
            onPress={handleBlockUser}
            style={{ paddingHorizontal: 16, paddingVertical: 14 }}
            className="active:bg-muted/50">
            <Text className="text-destructive text-sm">{t('block_user')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
