import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DatePickerSheet } from '@/components/forms/date-picker-sheet';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedInput } from '@/components/primitives/themed-input';
import { ThemedTextarea } from '@/components/primitives/themed-textarea';
import { ThemedText } from '@/components/primitives/themed-text';
import { BlurBottomBar } from '@/components/layout/blur-bottom-bar';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticLight } from '@/lib/haptics';
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
  const { colors } = useTheme();
  const [showAndroid, setShowAndroid] = useState(false);
  const dateValue = value ? parseTimeToDate(value) : new Date();

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.timePickerRow}>
        <ThemedText variant="subheadline" weight="500" style={styles.flex1}>
          {label}
        </ThemedText>
        <DateTimePicker
          value={dateValue}
          mode="time"
          display="compact"
          minuteInterval={5}
          style={styles.iosTimePicker}
          onChange={(_, selectedDate) => {
            if (selectedDate) onChange(formatTime(selectedDate));
          }}
        />
      </View>
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
          styles.timeTrigger,
          { borderColor: colors.input, backgroundColor: colors.background },
        ]}>
        <ThemedText variant="body">{value || label}</ThemedText>
        <Clock size={16} color={colors.tertiaryForeground} />
      </Pressable>

      {showAndroid && (
        <DateTimePicker
          value={dateValue}
          mode="time"
          display="default"
          minuteInterval={5}
          onChange={(_, selectedDate) => {
            setShowAndroid(false);
            if (selectedDate) onChange(formatTime(selectedDate));
          }}
        />
      )}
    </>
  );
}

export default function CreateEventScreen() {
  const { id, eventId } = useLocalSearchParams<{ id: string; eventId?: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms.events' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { colors } = useTheme();

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

      <BlurBottomBar>
        <ThemedButton
          onPress={handleSubmit}
          disabled={!title || !eventDate || !timeStart || isPending}>
          {isEditing ? tCommon('save') : t('createSubmit')}
        </ThemedButton>
      </BlurBottomBar>
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
  iosTimePicker: {
    alignSelf: 'flex-end',
  },
  timeTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
  },
});
