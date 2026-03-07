import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EditAboutSheet } from '@/components/edit-sheets/edit-about-sheet';
import { EditBioSheet } from '@/components/edit-sheets/edit-bio-sheet';
import { EditLanguagesSheet } from '@/components/edit-sheets/edit-languages-sheet';
import { EditLifestyleSheet } from '@/components/edit-sheets/edit-lifestyle-sheet';
import { EditPhotosSheet } from '@/components/edit-sheets/edit-photos-sheet';
import { ProfileSectionCard } from '@/components/profile-section-card';
import { useTranslations } from '@/i18n';
import { authClient } from '@/lib/auth-client';
import { useProfile } from '@/services/profile';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

export default function ProfileScreen() {
  const t = useTranslations('app.profile');
  const tEnums = useTranslations('enums');
  const tCommon = useTranslations('common.labels');
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
        <Text className="text-base text-muted-foreground">Profile not found</Text>
      </SafeAreaView>
    );
  }

  const avatarUrl = profile.avatarUrl
    ? `${SUPABASE_URL}/storage/v1/object/public/profile-photos/${profile.avatarUrl}`
    : null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 pb-2 pt-2">
        <Text className="text-xl font-bold text-foreground">{t('title')}</Text>
        <Pressable onPress={() => router.push('/(app)/settings' as never)}>
          {Platform.OS === 'ios' ? (
            <Ionicons name="settings-outline" size={24} color="#666" />
          ) : (
            <Ionicons name="settings-outline" size={24} color="#666" />
          )}
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Profile header */}
        <View className="items-center py-4">
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: 96, height: 96, borderRadius: 48 }}
              contentFit="cover"
            />
          ) : (
            <View className="h-24 w-24 items-center justify-center rounded-full bg-muted">
              <Text className="text-3xl text-muted-foreground">
                {profile.firstName?.[0] ?? '?'}
              </Text>
            </View>
          )}
          <Text className="mt-3 text-xl font-bold text-foreground">
            {profile.firstName} {profile.lastName}
          </Text>
          <Text className="mt-0.5 text-sm text-muted-foreground">{profile.institutionDomain}</Text>
        </View>

        {/* Photo gallery */}
        <ProfileSectionCard title={t('title')} onEdit={() => setEditPhotosVisible(true)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
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

        {/* About */}
        <View className="mt-3">
          <ProfileSectionCard title={t('studyInfo')} onEdit={() => setEditAboutVisible(true)}>
            {profile.gender && (
              <Text className="text-sm text-foreground">
                {t('gender')}: {tEnums(`gender.${profile.gender}`)}
              </Text>
            )}
            {profile.birthDate && (
              <Text className="text-sm text-foreground">
                {t('birthDate')}: {profile.birthDate}
              </Text>
            )}
            {profile.studyProgram && (
              <Text className="text-sm text-foreground">
                {t('studyProgram')}: {profile.studyProgram}
              </Text>
            )}
            {profile.studyLevel && (
              <Text className="text-sm text-foreground">
                {t('studyLevel')}: {tEnums(`study_level.${profile.studyLevel}`)}
              </Text>
            )}
            {profile.preferredCity && (
              <Text className="text-sm text-foreground">
                {t('preferredCity')}: {tEnums(`city.${profile.preferredCity}`)}
              </Text>
            )}
            {profile.vereniging && (
              <Text className="text-sm text-foreground">
                {t('vereniging')}: {profile.vereniging}
              </Text>
            )}
          </ProfileSectionCard>
        </View>

        {/* Bio */}
        <View className="mt-3">
          <ProfileSectionCard title={t('bio')} onEdit={() => setEditBioVisible(true)}>
            <Text className="text-sm text-foreground">{profile.bio || '-'}</Text>
          </ProfileSectionCard>
        </View>

        {/* Languages */}
        <View className="mt-3">
          <ProfileSectionCard title={t('languages')} onEdit={() => setEditLanguagesVisible(true)}>
            <View className="flex-row flex-wrap gap-2">
              {(profile.languages ?? []).map((lang) => (
                <View key={lang} className="rounded-lg bg-primary/10 px-3 py-1.5">
                  <Text className="text-sm text-primary">{tEnums(`language_enum.${lang}`)}</Text>
                </View>
              ))}
            </View>
          </ProfileSectionCard>
        </View>

        {/* Lifestyle */}
        <View className="mt-3">
          <ProfileSectionCard
            title={t('lifestyleTags')}
            onEdit={() => setEditLifestyleVisible(true)}
          >
            <View className="flex-row flex-wrap gap-2">
              {(profile.lifestyleTags ?? []).map((tag) => (
                <View key={tag} className="rounded-lg bg-secondary px-3 py-1.5">
                  <Text className="text-sm text-secondary-foreground">
                    {tEnums(`lifestyle_tag.${tag}`)}
                  </Text>
                </View>
              ))}
            </View>
          </ProfileSectionCard>
        </View>

        {/* Logout */}
        <Pressable
          className="mb-8 mt-6 items-center rounded-xl border border-destructive py-3.5"
          onPress={() => authClient.signOut()}
        >
          <Text className="text-base font-semibold text-destructive">{tCommon('logout')}</Text>
        </Pressable>
      </ScrollView>

      {/* Edit sheets */}
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
