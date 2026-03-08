import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ProfileSectionCard } from '@/components/profile-section-card';
import { useTranslation } from 'react-i18next';
import { authClient } from '@/lib/auth-client';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useProfile } from '@/services/profile';

export default function ProfileScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.profile' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const router = useRouter();

  const { data: profile, isPending } = useProfile();

  if (isPending) {
    return (
      <SafeAreaView className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className="bg-background flex-1 items-center justify-center">
        <Text variant="muted">Profile not found</Text>
      </SafeAreaView>
    );
  }

  const avatarUrl = profile.avatarUrl
    ? getStoragePublicUrl(profile.avatarUrl, 'profile-photos')
    : null;

  return (
    <SafeAreaView className="bg-background flex-1" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 pt-2 pb-2">
        <Text className="text-2xl font-bold tracking-tight">{t('title')}</Text>
        <Pressable onPress={() => router.push('/(app)/settings' as never)}>
          <Settings size={24} className="text-muted-foreground" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="items-center py-6">
          <Avatar alt={profile.firstName ?? 'Avatar'} className="size-24">
            {avatarUrl ? (
              <AvatarImage source={{ uri: avatarUrl }} />
            ) : (
              <AvatarFallback>
                <Text className="text-3xl">{profile.firstName?.[0] ?? '?'}</Text>
              </AvatarFallback>
            )}
          </Avatar>
          <Text className="mt-3 text-2xl font-bold">
            {profile.firstName} {profile.lastName}
          </Text>
          <Text variant="muted" className="mt-0.5 text-sm">
            {profile.institutionDomain}
          </Text>
        </View>

        <View className="space-y-4">
          <ProfileSectionCard
            title={t('title')}
            onEdit={() => router.push('/(app)/edit-photos' as never)}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3">
                {profile.photos.map((photo) => (
                  <Image
                    key={photo.id}
                    source={{
                      uri: getStoragePublicUrl(photo.url, 'profile-photos'),
                    }}
                    style={{ width: 80, height: 80, borderRadius: 8 }}
                    contentFit="cover"
                  />
                ))}
              </View>
            </ScrollView>
          </ProfileSectionCard>

          <ProfileSectionCard
            title={t('studyInfo')}
            onEdit={() => router.push('/(app)/edit-about' as never)}>
            <View className="gap-1">
              {profile.gender && (
                <Text className="text-sm">
                  {t('gender')}: {tEnums(`gender.${profile.gender}`)}
                </Text>
              )}
              {profile.birthDate && (
                <Text className="text-sm">
                  {t('birthDate')}: {profile.birthDate}
                </Text>
              )}
              {profile.studyProgram && (
                <Text className="text-sm">
                  {t('studyProgram')}: {profile.studyProgram}
                </Text>
              )}
              {profile.studyLevel && (
                <Text className="text-sm">
                  {t('studyLevel')}: {tEnums(`study_level.${profile.studyLevel}`)}
                </Text>
              )}
              {profile.preferredCity && (
                <Text className="text-sm">
                  {t('preferredCity')}: {tEnums(`city.${profile.preferredCity}`)}
                </Text>
              )}
              {profile.vereniging && (
                <Text className="text-sm">
                  {t('vereniging')}: {profile.vereniging}
                </Text>
              )}
            </View>
          </ProfileSectionCard>

          <ProfileSectionCard
            title={t('bio')}
            onEdit={() => router.push('/(app)/edit-bio' as never)}>
            <Text className="text-sm">{profile.bio || '-'}</Text>
          </ProfileSectionCard>

          <ProfileSectionCard
            title={t('languages')}
            onEdit={() => router.push('/(app)/edit-languages' as never)}>
            <View className="flex-row flex-wrap gap-2">
              {(profile.languages ?? []).map((lang) => (
                <Badge key={lang} variant="secondary" className="rounded-lg">
                  <Text>{tEnums(`language_enum.${lang}`)}</Text>
                </Badge>
              ))}
            </View>
          </ProfileSectionCard>

          <ProfileSectionCard
            title={t('lifestyleTags')}
            onEdit={() => router.push('/(app)/edit-lifestyle' as never)}>
            <View className="flex-row flex-wrap gap-2">
              {(profile.lifestyleTags ?? []).map((tag) => (
                <Badge key={tag} variant="secondary" className="rounded-lg">
                  <Text>{tEnums(`lifestyle_tag.${tag}`)}</Text>
                </Badge>
              ))}
            </View>
          </ProfileSectionCard>

          <Button variant="destructive" onPress={() => authClient.signOut()}>
            <Text>{tCommon('logout')}</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
