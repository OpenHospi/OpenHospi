import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticLight } from '@/lib/haptics';
import { ThemedText } from '@/components/primitives/themed-text';

type DatePickerSheetProps = {
  value: Date;
  onChange: (date: Date) => void;
  title: string;
  maximumDate?: Date;
  minimumDate?: Date;
};

function formatDisplayDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${d}-${m}-${y}`;
}

export function DatePickerSheet({
  value,
  onChange,
  maximumDate,
  minimumDate,
}: DatePickerSheetProps) {
  const { colors } = useTheme();
  const [showAndroid, setShowAndroid] = useState(false);

  if (Platform.OS === 'ios') {
    return (
      <DateTimePicker
        value={value}
        mode="date"
        display="compact"
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        style={styles.iosPicker}
        onChange={(_, selectedDate) => {
          if (selectedDate) onChange(selectedDate);
        }}
      />
    );
  }

  return (
    <>
      <Pressable
        onPress={() => {
          hapticLight();
          setShowAndroid(true);
        }}
        style={[
          styles.trigger,
          {
            borderColor: colors.input,
            backgroundColor: colors.background,
          },
        ]}>
        <ThemedText variant="body">{formatDisplayDate(value)}</ThemedText>
        <CalendarDays size={16} color={colors.mutedForeground} />
      </Pressable>

      {showAndroid && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={(_, selectedDate) => {
            setShowAndroid(false);
            if (selectedDate) onChange(selectedDate);
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
  },
  iosPicker: {
    alignSelf: 'flex-start',
  },
});
