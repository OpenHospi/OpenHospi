import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { getInstitution } from '@openhospi/inacademia';
import { Settings } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ProfileFieldRow } from '@/components/profile-field-row';
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
  const { bottom } = useSafeAreaInsets();

  const { data: profile, isPending } = useProfile();
  const { i18n } = useTranslation();
  const institution = useMemo(
    () => (profile ? getInstitution(profile.institutionDomain) : null),
    [profile]
  );
  const institutionName = institution
    ? institution.name[i18n.language === 'nl' ? 'nl' : 'en']
    : null;

  if (isPending) {
    return (
      <SafeAreaView
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        className="bg-background">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        className="bg-background">
        <Text variant="muted">Profile not found</Text>
      </SafeAreaView>
    );
  }

  const avatarUrl = profile.avatarUrl
    ? getStoragePublicUrl(profile.avatarUrl, 'profile-photos')
    : null;

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 8,
        }}>
        <Text className="text-foreground text-2xl font-bold tracking-tight">{t('title')}</Text>
        <Pressable onPress={() => router.push('/(app)/settings' as never)}>
          <Settings size={24} className="text-muted-foreground" />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: bottom + 16 }}>
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Avatar alt={profile.firstName ?? 'Avatar'} className="size-24">
            {avatarUrl ? (
              <AvatarImage source={{ uri: avatarUrl }} />
            ) : (
              <AvatarFallback>
                <Text className="text-3xl">{profile.firstName?.[0] ?? '?'}</Text>
              </AvatarFallback>
            )}
          </Avatar>
          <Text style={{ marginTop: 12 }} className="text-foreground text-2xl font-bold">
            {profile.firstName} {profile.lastName}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 8,
              marginTop: 8,
            }}>
            {institution && institutionName && (
              <Tooltip delayDuration={150}>
                <TooltipTrigger>
                  <Badge variant="secondary" className="rounded-lg">
                    <Text className="text-xs">{institution.short}</Text>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <Text>{institutionName}</Text>
                </TooltipContent>
              </Tooltip>
            )}
            {profile.vereniging && (
              <Badge variant="outline" className="rounded-lg">
                <Text className="text-xs">{tEnums(`vereniging.${profile.vereniging}`)}</Text>
              </Badge>
            )}
          </View>
        </View>

        <View style={{ gap: 16 }}>
          <ProfileSectionCard
            title={t('title')}
            onEdit={() => router.push('/(app)/edit-photos' as never)}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
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

          <ProfileSectionCard title={t('studyInfo')}>
            <View>
              <ProfileFieldRow
                label={t('gender')}
                value={profile.gender ? tEnums(`gender.${profile.gender}`) : null}
                placeholder={tCommon('notSet')}
                onPress={() => router.push('/(app)/edit-gender' as never)}
              />
              <Separator />
              <ProfileFieldRow
                label={t('birthDate')}
                value={profile.birthDate ? new Date(profile.birthDate).toLocaleDateString() : null}
                placeholder={tCommon('notSet')}
                onPress={() => router.push('/(app)/edit-birth-date' as never)}
              />
              <Separator />
              <ProfileFieldRow
                label={t('studyProgram')}
                value={profile.studyProgram || null}
                placeholder={tCommon('notSet')}
                onPress={() => router.push('/(app)/edit-study-program' as never)}
              />
              <Separator />
              <ProfileFieldRow
                label={t('studyLevel')}
                value={profile.studyLevel ? tEnums(`study_level.${profile.studyLevel}`) : null}
                placeholder={tCommon('notSet')}
                onPress={() => router.push('/(app)/edit-study-level' as never)}
              />
              <Separator />
              <ProfileFieldRow
                label={t('preferredCity')}
                value={profile.preferredCity ? tEnums(`city.${profile.preferredCity}`) : null}
                placeholder={tCommon('notSet')}
                onPress={() => router.push('/(app)/edit-preferred-city' as never)}
              />
              <Separator />
              <ProfileFieldRow
                label={t('vereniging')}
                value={profile.vereniging || null}
                placeholder={tCommon('notSet')}
                onPress={() => router.push('/(app)/edit-vereniging' as never)}
              />
            </View>
          </ProfileSectionCard>

          <ProfileSectionCard
            title={t('bio')}
            onEdit={() => router.push('/(app)/edit-bio' as never)}>
            <Text className="text-card-foreground text-sm">{profile.bio || '-'}</Text>
          </ProfileSectionCard>

          <ProfileSectionCard
            title={t('languages')}
            onEdit={() => router.push('/(app)/edit-languages' as never)}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
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
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
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
