import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { EditAboutSheet } from '@/components/edit-sheets/edit-about-sheet';
import { EditBioSheet } from '@/components/edit-sheets/edit-bio-sheet';
import { EditLanguagesSheet } from '@/components/edit-sheets/edit-languages-sheet';
import { EditLifestyleSheet } from '@/components/edit-sheets/edit-lifestyle-sheet';
import { EditPhotosSheet } from '@/components/edit-sheets/edit-photos-sheet';
import { ProfileSectionCard } from '@/components/profile-section-card';
import { useTranslation } from 'react-i18next';
import { authClient } from '@/lib/auth-client';
import { useProfile } from '@/services/profile';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

export default function ProfileScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.profile' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const router = useRouter();

  const { data: profile, isPending } = useProfile();

  const [editAboutVisible, setEditAboutVisible] = useState(false);
  const [editBioVisible, setEditBioVisible] = useState(false);
  const [editLanguagesVisible, setEditLanguagesVisible] = useState(false);
  const [editLifestyleVisible, setEditLifestyleVisible] = useState(false);
  const [editPhotosVisible, setEditPhotosVisible] = useState(false);

  if (isPending) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text variant="muted">Profile not found</Text>
      </SafeAreaView>
    );
  }

  const avatarUrl = profile.avatarUrl
    ? `${SUPABASE_URL}/storage/v1/object/public/profile-photos/${profile.avatarUrl}`
    : null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 pb-2 pt-2">
        <Text variant="large" className="text-xl">
          {t('title')}
        </Text>
        <Pressable onPress={() => router.push('/(app)/settings' as never)}>
          <Ionicons name="settings-outline" size={24} color="#666" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4">
        <View className="items-center py-4">
          <Avatar alt={profile.firstName ?? 'Avatar'} className="size-24">
            {avatarUrl ? (
              <AvatarImage source={{ uri: avatarUrl }} />
            ) : (
              <AvatarFallback>
                <Text className="text-3xl">{profile.firstName?.[0] ?? '?'}</Text>
              </AvatarFallback>
            )}
          </Avatar>
          <Text variant="large" className="mt-3 text-xl">
            {profile.firstName} {profile.lastName}
          </Text>
          <Text variant="muted" className="mt-0.5">
            {profile.institutionDomain}
          </Text>
        </View>

        <ProfileSectionCard title={t('title')} onEdit={() => setEditPhotosVisible(true)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {profile.photos.map((photo) => (
                <Image
                  key={photo.id}
                  source={{
                    uri: `${SUPABASE_URL}/storage/v1/object/public/profile-photos/${photo.url}`,
                  }}
                  style={{ width: 80, height: 80, borderRadius: 8 }}
                  contentFit="cover"
                />
              ))}
            </View>
          </ScrollView>
        </ProfileSectionCard>

        <View className="mt-3">
          <ProfileSectionCard title={t('studyInfo')} onEdit={() => setEditAboutVisible(true)}>
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
          </ProfileSectionCard>
        </View>

        <View className="mt-3">
          <ProfileSectionCard title={t('bio')} onEdit={() => setEditBioVisible(true)}>
            <Text className="text-sm">{profile.bio || '-'}</Text>
          </ProfileSectionCard>
        </View>

        <View className="mt-3">
          <ProfileSectionCard title={t('languages')} onEdit={() => setEditLanguagesVisible(true)}>
            <View className="flex-row flex-wrap gap-2">
              {(profile.languages ?? []).map((lang) => (
                <Badge key={lang} variant="secondary" className="rounded-lg">
                  <Text>{tEnums(`language_enum.${lang}`)}</Text>
                </Badge>
              ))}
            </View>
          </ProfileSectionCard>
        </View>

        <View className="mt-3">
          <ProfileSectionCard
            title={t('lifestyleTags')}
            onEdit={() => setEditLifestyleVisible(true)}
          >
            <View className="flex-row flex-wrap gap-2">
              {(profile.lifestyleTags ?? []).map((tag) => (
                <Badge key={tag} variant="secondary" className="rounded-lg">
                  <Text>{tEnums(`lifestyle_tag.${tag}`)}</Text>
                </Badge>
              ))}
            </View>
          </ProfileSectionCard>
        </View>

        <Button variant="destructive" className="mb-8 mt-6" onPress={() => authClient.signOut()}>
          <Text>{tCommon('logout')}</Text>
        </Button>
      </ScrollView>

      <EditAboutSheet
        visible={editAboutVisible}
        onClose={() => setEditAboutVisible(false)}
        initialData={{
          gender: profile.gender,
          birthDate: profile.birthDate,
          studyProgram: profile.studyProgram,
          studyLevel: profile.studyLevel,
          preferredCity: profile.preferredCity,
          vereniging: profile.vereniging,
        }}
      />
      <EditBioSheet
        visible={editBioVisible}
        onClose={() => setEditBioVisible(false)}
        initialBio={profile.bio ?? ''}
      />
      <EditLanguagesSheet
        visible={editLanguagesVisible}
        onClose={() => setEditLanguagesVisible(false)}
        initialLanguages={profile.languages ?? []}
      />
      <EditLifestyleSheet
        visible={editLifestyleVisible}
        onClose={() => setEditLifestyleVisible(false)}
        initialTags={profile.lifestyleTags ?? []}
      />
      <EditPhotosSheet
        visible={editPhotosVisible}
        onClose={() => setEditPhotosVisible(false)}
        photos={profile.photos}
      />
    </SafeAreaView>
  );
}
