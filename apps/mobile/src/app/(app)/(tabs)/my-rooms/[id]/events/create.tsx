import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DatePickerSheet } from '@/components/date-picker-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useCreateEvent, useEventDetail, useUpdateEvent } from '@/services/my-rooms';

export default function CreateEventScreen() {
  const { id, eventId } = useLocalSearchParams<{ id: string; eventId?: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms.events' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

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
    <View style={{ flex: 1 }} className="bg-background">
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={{ gap: 4 }}>
          <Text className="text-foreground text-sm font-medium">{t('fields.title')}</Text>
          <Input value={title} onChangeText={setTitle} placeholder={t('fields.title')} />
        </View>

        <View style={{ gap: 4 }}>
          <Text className="text-foreground text-sm font-medium">{t('fields.date')}</Text>
          <DatePickerSheet
            value={eventDate ? new Date(eventDate) : new Date()}
            onChange={(date) => setEventDate(date.toISOString().split('T')[0])}
            title={t('fields.date')}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text className="text-foreground text-sm font-medium">{t('fields.startTime')}</Text>
            <Input value={timeStart} onChangeText={setTimeStart} placeholder="14:00" />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text className="text-foreground text-sm font-medium">{t('fields.endTime')}</Text>
            <Input value={timeEnd} onChangeText={setTimeEnd} placeholder="16:00" />
          </View>
        </View>

        <View style={{ gap: 4 }}>
          <Text className="text-foreground text-sm font-medium">{t('fields.location')}</Text>
          <Input value={location} onChangeText={setLocation} placeholder={t('fields.location')} />
        </View>

        <View style={{ gap: 4 }}>
          <Text className="text-foreground text-sm font-medium">{t('fields.description')}</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t('fields.description')}
            multiline
            numberOfLines={3}
            className="border-border bg-background text-foreground rounded-lg border p-3 text-sm"
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
        </View>

        <View style={{ gap: 4 }}>
          <Text className="text-foreground text-sm font-medium">{t('fields.maxAttendees')}</Text>
          <Input
            value={maxAttendees}
            onChangeText={setMaxAttendees}
            placeholder={t('fields.maxAttendees')}
            keyboardType="numeric"
          />
        </View>

        <View style={{ gap: 4 }}>
          <Text className="text-foreground text-sm font-medium">{t('fields.notes')}</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={t('fields.notes')}
            multiline
            numberOfLines={2}
            className="border-border bg-background text-foreground rounded-lg border p-3 text-sm"
            style={{ minHeight: 60, textAlignVertical: 'top' }}
          />
        </View>
      </ScrollView>

      <View
        style={{ padding: 16, paddingBottom: 32 }}
        className="border-border bg-background border-t">
        <Button onPress={handleSubmit} disabled={!title || !eventDate || !timeStart || isPending}>
          <Text>{isEditing ? tCommon('save') : t('createSubmit')}</Text>
        </Button>
      </View>
    </View>
  );
}
