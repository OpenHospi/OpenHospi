import { DateTimePicker } from '@expo/ui/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { DatePickerSheet } from '@/components/forms/date-picker-sheet';
import { NativeButton } from '@/components/native/button';
import { ThemedInput } from '@/components/native/input';
import { ThemedTextarea } from '@/components/native/textarea';
import { ThemedText } from '@/components/native/text';
import { PlatformSurface } from '@/components/layout/platform-surface';
import { useTheme } from '@/design';
import { useCreateEvent, useEventDetail, useUpdateEvent } from '@/services/my-rooms';

function parseTimeToDate(timeStr: string): Date {
  const d = new Date();
  const [h, m] = timeStr.split(':').map(Number);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function NativeTimePicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (time: string) => void;
  label: string;
}) {
  const dateValue = value ? parseTimeToDate(value) : new Date();

  return (
    <View style={styles.timePickerRow}>
      <ThemedText variant="subheadline" weight="500" style={styles.flex1}>
        {label}
      </ThemedText>
      <DateTimePicker
        value={dateValue}
        mode="time"
        display="compact"
        onValueChange={(_event, selectedDate) => {
          onChange(formatTime(selectedDate));
        }}
      />
    </View>
  );
}

export default function CreateEventScreen() {
  const { id, eventId } = useLocalSearchParams<{ id: string; eventId?: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms.events' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { bottom } = useSafeAreaInsets();
  const { colors, spacing } = useTheme();

  const { data: existingEvent } = useEventDetail(id, eventId ?? '');
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  const [title, setTitle] = useState(existingEvent?.title ?? '');
  const [eventDate, setEventDate] = useState(existingEvent?.eventDate ?? '');
  const [timeStart, setTimeStart] = useState(existingEvent?.timeStart ?? '');
  const [timeEnd, setTimeEnd] = useState(existingEvent?.timeEnd ?? '');
  const [location, setLocation] = useState(existingEvent?.location ?? '');
  const [description, setDescription] = useState(existingEvent?.description ?? '');
  const [maxAttendees, setMaxAttendees] = useState(existingEvent?.maxAttendees?.toString() ?? '');
  const [notes, setNotes] = useState(existingEvent?.notes ?? '');

  const isEditing = !!eventId;
  const isPending = createEvent.isPending || updateEvent.isPending;

  const handleSubmit = async () => {
    const data = {
      title,
      eventDate,
      timeStart,
      timeEnd: timeEnd || undefined,
      location: location || undefined,
      description: description || undefined,
      maxAttendees: maxAttendees ? Number(maxAttendees) : undefined,
      notes: notes || undefined,
    };

    if (isEditing) {
      await updateEvent.mutateAsync({ roomId: id, eventId: eventId!, data });
    } else {
      await createEvent.mutateAsync({ roomId: id, data });
    }
    router.back();
  };

  return (
    <View style={[styles.flex1, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.flex1}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('fields.title')}
          </ThemedText>
          <ThemedInput value={title} onChangeText={setTitle} placeholder={t('fields.title')} />
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('fields.date')}
          </ThemedText>
          <DatePickerSheet
            value={eventDate ? new Date(eventDate) : new Date()}
            onChange={(date) => setEventDate(date.toISOString().split('T')[0])}
            title={t('fields.date')}
          />
        </View>

        <View style={styles.timeRow}>
          <View style={styles.timeField}>
            <NativeTimePicker
              value={timeStart}
              onChange={setTimeStart}
              label={t('fields.startTime')}
            />
          </View>
          <View style={styles.timeField}>
            <NativeTimePicker value={timeEnd} onChange={setTimeEnd} label={t('fields.endTime')} />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('fields.location')}
          </ThemedText>
          <ThemedInput
            value={location}
            onChangeText={setLocation}
            placeholder={t('fields.location')}
          />
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('fields.description')}
          </ThemedText>
          <ThemedTextarea
            value={description}
            onChangeText={setDescription}
            placeholder={t('fields.description')}
            minHeight={80}
          />
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('fields.maxAttendees')}
          </ThemedText>
          <ThemedInput
            value={maxAttendees}
            onChangeText={setMaxAttendees}
            placeholder={t('fields.maxAttendees')}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText variant="subheadline" weight="500">
            {t('fields.notes')}
          </ThemedText>
          <ThemedTextarea
            value={notes}
            onChangeText={setNotes}
            placeholder={t('fields.notes')}
            minHeight={60}
          />
        </View>
      </ScrollView>

      <PlatformSurface
        variant="chrome"
        edge="bottom"
        glass="regular"
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: Math.max(bottom, spacing.lg),
          gap: spacing.sm,
        }}>
        <NativeButton
          label={isEditing ? tCommon('save') : t('createSubmit')}
          onPress={handleSubmit}
          disabled={!title || !eventDate || !timeStart || isPending}
        />
      </PlatformSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 100,
  },
  fieldGroup: {
    gap: 4,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeField: {
    flex: 1,
    gap: 4,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
