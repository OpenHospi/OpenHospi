import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import { useRef } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { BottomSheet, type BottomSheetModal } from '@/components/bottom-sheet';
import { Text } from '@/components/ui/text';

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
  const sheetRef = useRef<BottomSheetModal>(null);

  return (
    <>
      <Pressable
        onPress={() => sheetRef.current?.present()}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderWidth: 1,
          borderRadius: 12,
        }}
        className="border-input bg-background">
        <Text className="text-foreground">{formatDisplayDate(value)}</Text>
        <CalendarDays size={16} className="text-muted-foreground" />
      </Pressable>

      <BottomSheet ref={sheetRef} title={title} scrollable={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
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
