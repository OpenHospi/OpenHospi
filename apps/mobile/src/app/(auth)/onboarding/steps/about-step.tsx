import { City, Gender, StudyLevel } from '@openhospi/shared/enums';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useTranslation } from 'react-i18next';
import { useSubmitAbout } from '@/services/onboarding';

type Props = { onNext: () => void };

function EnumPicker({
  values,
  selected,
  onSelect,
  translateKey,
  t,
}: {
  values: readonly string[];
  selected: string | null;
  onSelect: (v: string) => void;
  translateKey: string;
  t: (key: string) => string;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {values.map((v) => (
        <Pressable
          key={v}
          className={`rounded-lg border px-3 py-2 ${selected === v ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}
          onPress={() => onSelect(v)}
        >
          <Text
            className={`text-sm ${selected === v ? 'font-semibold text-primary' : 'text-foreground'}`}
          >
            {t(`${translateKey}.${v}`)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function AboutStep({ onNext }: Props) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding.fields' });
  const { t: tPlaceholders } = useTranslation('translation', {
    keyPrefix: 'app.onboarding.placeholders',
  });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const [gender, setGender] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [studyProgram, setStudyProgram] = useState('');
  const [studyLevel, setStudyLevel] = useState<string | null>(null);
  const [preferredCity, setPreferredCity] = useState<string | null>(null);
  const [vereniging, setVereniging] = useState('');

  const submitAbout = useSubmitAbout();

  function handleSubmit() {
    if (!gender || !birthDate || !studyProgram.trim() || !preferredCity) {
      Alert.alert('Please complete all required fields.');
      return;
    }
    submitAbout.mutate(
      {
        gender,
        birthDate,
        studyProgram: studyProgram.trim(),
        studyLevel: studyLevel || undefined,
        preferredCity,
        vereniging: vereniging.trim() || undefined,
      },
      { onSuccess: onNext, onError: () => Alert.alert('Error saving data') },
    );
  }

  return (
    <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
      <Text className="text-sm font-medium text-foreground">{t('gender')}</Text>
      <View className="mt-1">
        <EnumPicker
          values={Gender.values}
          selected={gender}
          onSelect={setGender}
          translateKey="gender"
          t={tEnums}
        />
      </View>

      <Text className="mt-4 text-sm font-medium text-foreground">{t('birthDate')}</Text>
      <TextInput
        className="mt-1 rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground"
        value={birthDate}
        onChangeText={setBirthDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#999"
        keyboardType="numbers-and-punctuation"
      />

      <Text className="mt-4 text-sm font-medium text-foreground">{t('studyProgram')}</Text>
      <TextInput
        className="mt-1 rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground"
        value={studyProgram}
        onChangeText={setStudyProgram}
        placeholder={tPlaceholders('studyProgram')}
        placeholderTextColor="#999"
      />

      <Text className="mt-4 text-sm font-medium text-foreground">{t('studyLevel')}</Text>
      <View className="mt-1">
        <EnumPicker
          values={StudyLevel.values}
          selected={studyLevel}
          onSelect={setStudyLevel}
          translateKey="study_level"
          t={tEnums}
        />
      </View>

      <Text className="mt-4 text-sm font-medium text-foreground">{t('preferredCity')}</Text>
      <View className="mt-1">
        <EnumPicker
          values={City.values}
          selected={preferredCity}
          onSelect={setPreferredCity}
          translateKey="city"
          t={tEnums}
        />
      </View>

      <Text className="mt-4 text-sm font-medium text-foreground">
        {t('vereniging')} <Text className="text-muted-foreground">({tCommon('optional')})</Text>
      </Text>
      <TextInput
        className="mt-1 rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground"
        value={vereniging}
        onChangeText={setVereniging}
        placeholder={tPlaceholders('vereniging')}
        placeholderTextColor="#999"
      />

      <Pressable
        className="mb-8 mt-6 items-center rounded-xl bg-primary px-6 py-3.5 active:opacity-80"
        onPress={handleSubmit}
        disabled={submitAbout.isPending}
      >
        <Text className="text-base font-semibold text-primary-foreground">{tCommon('next')}</Text>
      </Pressable>
    </ScrollView>
  );
}
