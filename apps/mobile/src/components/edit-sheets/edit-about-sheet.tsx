import { City, Gender, StudyLevel } from '@openhospi/shared/enums';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useTranslation } from 'react-i18next';
import { useUpdateProfile } from '@/services/profile';

type Props = {
  visible: boolean;
  onClose: () => void;
  initialData: {
    gender: string | null;
    birthDate: string | null;
    studyProgram: string | null;
    studyLevel: string | null;
    preferredCity: string | null;
    vereniging: string | null;
  };
};

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
        <Pressable
          key={v}
          className={`rounded-lg border px-3 py-2 ${selected === v ? 'border-primary bg-primary/10' : 'border-border'}`}
          onPress={() => onSelect(selected === v ? null : v)}
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

export function EditAboutSheet({ visible, onClose, initialData }: Props) {
  const { t: tFields } = useTranslation('translation', { keyPrefix: 'app.onboarding.fields' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const [gender, setGender] = useState(initialData.gender);
  const [birthDate, setBirthDate] = useState(initialData.birthDate ?? '');
  const [studyProgram, setStudyProgram] = useState(initialData.studyProgram ?? '');
  const [studyLevel, setStudyLevel] = useState(initialData.studyLevel);
  const [preferredCity, setPreferredCity] = useState(initialData.preferredCity);
  const [vereniging, setVereniging] = useState(initialData.vereniging ?? '');

  const updateProfile = useUpdateProfile();

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
        onSuccess: () => onClose(),
        onError: () => Alert.alert('Error'),
      },
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <Pressable onPress={onClose}>
            <Text className="text-base text-muted-foreground">{tCommon('cancel')}</Text>
          </Pressable>
          <Text className="text-base font-semibold text-foreground">{tFields('gender')}</Text>
          <Pressable onPress={handleSave} disabled={updateProfile.isPending}>
            <Text className="text-base font-semibold text-primary">{tCommon('save')}</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-4 pt-4">
          <Text className="text-sm font-medium text-foreground">{tFields('gender')}</Text>
          <View className="mt-1">
            <ChipPicker
              values={Gender.values}
              selected={gender}
              onSelect={setGender}
              translateKey="gender"
              t={tEnums}
            />
          </View>

          <Text className="mt-4 text-sm font-medium text-foreground">{tFields('birthDate')}</Text>
          <TextInput
            className="mt-1 rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground"
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
          />

          <Text className="mt-4 text-sm font-medium text-foreground">
            {tFields('studyProgram')}
          </Text>
          <TextInput
            className="mt-1 rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground"
            value={studyProgram}
            onChangeText={setStudyProgram}
            placeholderTextColor="#999"
          />

          <Text className="mt-4 text-sm font-medium text-foreground">{tFields('studyLevel')}</Text>
          <View className="mt-1">
            <ChipPicker
              values={StudyLevel.values}
              selected={studyLevel}
              onSelect={setStudyLevel}
              translateKey="study_level"
              t={tEnums}
            />
          </View>

          <Text className="mt-4 text-sm font-medium text-foreground">
            {tFields('preferredCity')}
          </Text>
          <View className="mt-1">
            <ChipPicker
              values={City.values}
              selected={preferredCity}
              onSelect={setPreferredCity}
              translateKey="city"
              t={tEnums}
            />
          </View>

          <Text className="mt-4 text-sm font-medium text-foreground">{tFields('vereniging')}</Text>
          <TextInput
            className="mb-8 mt-1 rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground"
            value={vereniging}
            onChangeText={setVereniging}
            placeholderTextColor="#999"
          />
        </ScrollView>
      </View>
    </Modal>
  );
}
