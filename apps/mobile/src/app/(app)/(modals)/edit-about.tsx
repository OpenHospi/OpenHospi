import { City, Gender, StudyLevel } from '@openhospi/shared/enums';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';
import { useProfile, useUpdateProfile } from '@/services/profile';

function ChipPicker({
  values,
  selected,
  onSelect,
  translateKey,
  t,
}: {
  values: readonly string[];
  selected: string | null;
  onSelect: (v: string | null) => void;
  translateKey: string;
  t: (key: string) => string;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {values.map((v) => (
        <Pressable key={v} onPress={() => onSelect(selected === v ? null : v)}>
          <Badge
            variant={selected === v ? 'default' : 'outline'}
            className="rounded-lg px-3 py-1.5">
            <Text>{t(`${translateKey}.${v}`)}</Text>
          </Badge>
        </Pressable>
      ))}
    </View>
  );
}

export default function EditAboutScreen() {
  const router = useRouter();
  const { t: tFields } = useTranslation('translation', { keyPrefix: 'app.onboarding.fields' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const { data: profile, isPending } = useProfile();
  const updateProfile = useUpdateProfile();

  const [gender, setGender] = useState(profile?.gender ?? null);
  const [birthDate, setBirthDate] = useState(profile?.birthDate ?? '');
  const [studyProgram, setStudyProgram] = useState(profile?.studyProgram ?? '');
  const [studyLevel, setStudyLevel] = useState(profile?.studyLevel ?? null);
  const [preferredCity, setPreferredCity] = useState(profile?.preferredCity ?? null);
  const [vereniging, setVereniging] = useState(profile?.vereniging ?? '');

  if (isPending) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  function handleSave() {
    updateProfile.mutate(
      {
        gender,
        birthDate,
        studyProgram: studyProgram.trim(),
        studyLevel: studyLevel || undefined,
        preferredCity,
        vereniging: vereniging.trim() || undefined,
      },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert('Error'),
      }
    );
  }

  return (
    <View className="bg-background flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled">
        <View className="space-y-4 px-4 pt-4">
          <View className="gap-2">
            <Label>{tFields('gender')}</Label>
            <ChipPicker
              values={Gender.values}
              selected={gender}
              onSelect={setGender}
              translateKey="gender"
              t={tEnums}
            />
          </View>

          <View className="gap-2">
            <Label>{tFields('birthDate')}</Label>
            <Input value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" />
          </View>

          <View className="gap-2">
            <Label>{tFields('studyProgram')}</Label>
            <Input value={studyProgram} onChangeText={setStudyProgram} />
          </View>

          <View className="gap-2">
            <Label>{tFields('studyLevel')}</Label>
            <ChipPicker
              values={StudyLevel.values}
              selected={studyLevel}
              onSelect={(v) => setStudyLevel(v as typeof studyLevel)}
              translateKey="study_level"
              t={tEnums}
            />
          </View>

          <View className="gap-2">
            <Label>{tFields('preferredCity')}</Label>
            <ChipPicker
              values={City.values}
              selected={preferredCity}
              onSelect={(v) => setPreferredCity(v as typeof preferredCity)}
              translateKey="city"
              t={tEnums}
            />
          </View>

          <View className="mb-8 gap-2">
            <Label>{tFields('vereniging')}</Label>
            <Input value={vereniging} onChangeText={setVereniging} />
          </View>
        </View>
      </ScrollView>

      <View className="border-border border-t px-4 pt-3 pb-6">
        <Button className="h-14 rounded-xl" onPress={handleSave} disabled={updateProfile.isPending}>
          <Text>{tCommon('save')}</Text>
        </Button>
      </View>
    </View>
  );
}
