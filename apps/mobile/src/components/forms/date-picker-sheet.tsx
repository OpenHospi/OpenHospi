import { DateTimePicker } from '@expo/ui/datetimepicker';
import { StyleSheet, View } from 'react-native';

type DatePickerSheetProps = {
  value: Date;
  onChange: (date: Date) => void;
  title: string;
  maximumDate?: Date;
  minimumDate?: Date;
};

export function DatePickerSheet({
  value,
  onChange,
  maximumDate,
  minimumDate,
}: DatePickerSheetProps) {
  return (
    <DateTimePicker
      style={styles.picker}
      value={value}
      mode="date"
      display="compact"
      maximumDate={maximumDate}
      minimumDate={minimumDate}
      onValueChange={(_event, selectedDate) => {
        onChange(selectedDate);
      }}
    />
  );
}

const styles = StyleSheet.create({
  picker: {
    width: 140,
    height: 34,
  },
});
