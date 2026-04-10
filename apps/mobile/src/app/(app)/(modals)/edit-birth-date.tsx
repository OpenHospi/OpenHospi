import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { ThemedButton } from '@/components/primitives/themed-button';
import { useTheme } from '@/design';
import { hapticFormSubmitError, hapticFormSubmitSuccess } from '@/lib/haptics';
import { useProfile, useUpdateProfile } from '@/services/profile';
import { useTranslation } from 'react-i18next';

function toDateObject(dateStr: string | null | undefined): Date {
  if (dateStr) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date(2000, 0, 1);
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function EditBirthDateScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [date, setDate] = useState(() => toDateObject(profile?.birthDate));

  function handleSave() {
    updateProfile.mutate(
      { birthDate: toISODate(date) },
      {
        onSuccess: () => {
          hapticFormSubmitSuccess();
          router.back();
        },
        onError: () => {
          hapticFormSubmitError();
          Alert.alert('Error');
        },
      }
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.pickerContainer}>
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          minimumDate={new Date(1950, 0, 1)}
          onChange={(_, selectedDate) => {
            if (selectedDate) setDate(selectedDate);
          }}
        />
      </View>

      <View style={styles.footer}>
        <ThemedButton onPress={handleSave} disabled={updateProfile.isPending}>
          {tCommon('save')}
        </ThemedButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pickerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
