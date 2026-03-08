import { City, Gender, StudyLevel } from '@openhospi/shared/enums';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
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
      }
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View className="bg-background flex-1">
        <View className="flex-row items-center justify-between px-4 py-3">
          <Button variant="ghost" onPress={onClose}>
            <Text>{tCommon('cancel')}</Text>
          </Button>
          <Text className="font-semibold">{tFields('gender')}</Text>
          <Button variant="ghost" onPress={handleSave} disabled={updateProfile.isPending}>
            <Text className="text-primary">{tCommon('save')}</Text>
          </Button>
        </View>
        <Separator />

        <ScrollView className="flex-1 px-4 pt-4">
          <Label>{tFields('gender')}</Label>
          <View className="mt-1">
            <ChipPicker
              values={Gender.values}
              selected={gender}
              onSelect={setGender}
              translateKey="gender"
              t={tEnums}
            />
          </View>

          <Label className="mt-4">{tFields('birthDate')}</Label>
          <Input
            className="mt-1"
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="YYYY-MM-DD"
          />

          <Label className="mt-4">{tFields('studyProgram')}</Label>
          <Input className="mt-1" value={studyProgram} onChangeText={setStudyProgram} />

          <Label className="mt-4">{tFields('studyLevel')}</Label>
          <View className="mt-1">
            <ChipPicker
              values={StudyLevel.values}
              selected={studyLevel}
              onSelect={setStudyLevel}
              translateKey="study_level"
              t={tEnums}
            />
          </View>

          <Label className="mt-4">{tFields('preferredCity')}</Label>
          <View className="mt-1">
            <ChipPicker
              values={City.values}
              selected={preferredCity}
              onSelect={setPreferredCity}
              translateKey="city"
              t={tEnums}
            />
          </View>

          <Label className="mt-4">{tFields('vereniging')}</Label>
          <Input className="mt-1 mb-8" value={vereniging} onChangeText={setVereniging} />
        </ScrollView>
      </View>
    </Modal>
  );
}
