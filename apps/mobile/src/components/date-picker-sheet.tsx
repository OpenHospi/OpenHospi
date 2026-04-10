import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import { useRef } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import {
  AppBottomSheetModal as BottomSheet,
  type BottomSheetModal,
} from '@/components/bottom-sheet';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
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
  title,
  maximumDate,
  minimumDate,
}: DatePickerSheetProps) {
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);

  return (
    <>
      <Pressable
        onPress={() => sheetRef.current?.present()}
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

      <BottomSheet ref={sheetRef} title={title} scrollable={false}>
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={value}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            onChange={(_, selectedDate) => {
              if (selectedDate) onChange(selectedDate);
            }}
          />
        </View>
      </BottomSheet>
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
  pickerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
