import { City, Gender, StudyLevel } from '@openhospi/shared/enums';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
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
        <Pressable key={v} onPress={() => onSelect(v)}>
          <Badge variant={selected === v ? 'default' : 'outline'} className="rounded-lg px-3 py-2">
            <Text>{t(`${translateKey}.${v}`)}</Text>
          </Badge>
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
      { onSuccess: onNext, onError: () => Alert.alert('Error saving data') }
    );
  }

  return (
    <ScrollView
      className="flex-1"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="space-y-4 pb-8">
      <View className="gap-2">
        <Label>{t('gender')}</Label>
        <EnumPicker
          values={Gender.values}
          selected={gender}
          onSelect={setGender}
          translateKey="gender"
          t={tEnums}
        />
      </View>

      <View className="gap-2">
        <Label>{t('birthDate')}</Label>
        <Input
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
        />
      </View>

      <View className="gap-2">
        <Label>{t('studyProgram')}</Label>
        <Input
          value={studyProgram}
          onChangeText={setStudyProgram}
          placeholder={tPlaceholders('studyProgram')}
        />
      </View>

      <View className="gap-2">
        <Label>{t('studyLevel')}</Label>
        <EnumPicker
          values={StudyLevel.values}
          selected={studyLevel}
          onSelect={setStudyLevel}
          translateKey="study_level"
          t={tEnums}
        />
      </View>

      <View className="gap-2">
        <Label>{t('preferredCity')}</Label>
        <EnumPicker
          values={City.values}
          selected={preferredCity}
          onSelect={setPreferredCity}
          translateKey="city"
          t={tEnums}
        />
      </View>

      <View className="gap-2">
        <Label>
          {t('vereniging')} <Text variant="muted">({tCommon('optional')})</Text>
        </Label>
        <Input
          value={vereniging}
          onChangeText={setVereniging}
          placeholder={tPlaceholders('vereniging')}
        />
      </View>

      <Button onPress={handleSubmit} disabled={submitAbout.isPending}>
        <Text>{tCommon('next')}</Text>
      </Button>
    </ScrollView>
  );
}
