import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DatePickerSheet } from '@/components/forms/date-picker-sheet';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedInput } from '@/components/primitives/themed-input';
import { ThemedTextarea } from '@/components/primitives/themed-textarea';
import { ThemedText } from '@/components/primitives/themed-text';
import { useTheme } from '@/design';
import { useCreateEvent, useEventDetail, useUpdateEvent } from '@/services/my-rooms';

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
      <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent}>
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
            <ThemedText variant="subheadline" weight="500">
              {t('fields.startTime')}
            </ThemedText>
            <ThemedInput value={timeStart} onChangeText={setTimeStart} placeholder="14:00" />
          </View>
          <View style={styles.timeField}>
            <ThemedText variant="subheadline" weight="500">
              {t('fields.endTime')}
            </ThemedText>
            <ThemedInput value={timeEnd} onChangeText={setTimeEnd} placeholder="16:00" />
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

      <View
        style={[
          styles.bottomBar,
          { borderTopColor: colors.border, backgroundColor: colors.background },
        ]}>
        <ThemedButton
          onPress={handleSubmit}
          disabled={!title || !eventDate || !timeStart || isPending}>
          {isEditing ? tCommon('save') : t('createSubmit')}
        </ThemedButton>
      </View>
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
  bottomBar: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
