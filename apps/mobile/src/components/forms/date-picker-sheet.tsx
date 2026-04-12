import DateTimePicker from '@expo/ui/datetimepicker';

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
