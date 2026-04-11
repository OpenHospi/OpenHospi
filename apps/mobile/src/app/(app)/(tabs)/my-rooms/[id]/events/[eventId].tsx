import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedBadge } from '@/components/primitives/themed-badge';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedText } from '@/components/primitives/themed-text';
import { useTheme } from '@/design';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useCancelEvent, useEventDetail } from '@/services/my-rooms';
import type { EventInvitee } from '@openhospi/shared/api-types';
import type { BadgeVariant } from '@/components/primitives/themed-badge';

const RSVP_BADGE_VARIANT: Record<string, BadgeVariant> = {
  attending: 'primary',
  not_attending: 'destructive',
  maybe: 'secondary',
  pending: 'outline',
};

export default function EventDetailScreen() {
  const { id, eventId } = useLocalSearchParams<{ id: string; eventId: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms.events' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { colors } = useTheme();

  const { data: event, isLoading } = useEventDetail(id, eventId);
  const cancelEvent = useCancelEvent();

  if (isLoading || !event) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const isCancelled = !!event.cancelledAt;

  const handleCancel = () => {
    Alert.alert(t('cancelConfirmTitle'), t('cancelConfirmDescription'), [
      { text: t('keepEvent'), style: 'cancel' },
      {
        text: t('confirmCancel'),
        style: 'destructive',
        onPress: () => {
          cancelEvent.mutate({ roomId: id, eventId });
          router.back();
        },
      },
    ]);
  };

  const renderInvitee = ({ item }: { item: EventInvitee }) => {
    const avatarUri = item.avatarUrl
      ? getStoragePublicUrl(item.avatarUrl, 'profile-photos')
      : undefined;

    return (
      <View style={[styles.inviteeRow, { borderBottomColor: colors.border }]}>
        <View style={[styles.avatarCircle, { backgroundColor: colors.muted }]}>
          {avatarUri && <Image source={{ uri: avatarUri }} style={styles.avatarImage} />}
        </View>
        <ThemedText variant="subheadline" style={styles.flex1}>
          {item.firstName} {item.lastName}
        </ThemedText>
        <ThemedBadge
          variant={RSVP_BADGE_VARIANT[item.status ?? 'pending'] ?? 'outline'}
          label={tEnums(`invitation_status.${item.status ?? 'pending'}`)}
        />
      </View>
    );
  };

  return (
    <View style={[styles.flex1, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentPadding}>
          {/* Event info */}
          <View style={styles.infoSection}>
            <View style={styles.titleRow}>
              <ThemedText variant="title3">{event.title}</ThemedText>
              {isCancelled && <ThemedBadge variant="destructive" label={t('cancelled')} />}
            </View>

            <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
              {event.eventDate} {event.timeStart}
              {event.timeEnd ? ` - ${event.timeEnd}` : ''}
            </ThemedText>
            {event.location && (
              <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
                {event.location}
              </ThemedText>
            )}
            {event.description && (
              <ThemedText variant="subheadline">{event.description}</ThemedText>
            )}
            {event.notes && (
              <ThemedText
                variant="subheadline"
                color={colors.tertiaryForeground}
                style={styles.italic}>
                {event.notes}
              </ThemedText>
            )}
            {event.maxAttendees && (
              <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                {t('maxAttendees', { count: event.maxAttendees })}
              </ThemedText>
            )}
          </View>

          {/* Attending summary */}
          <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
            {t('attendingCount', {
              attending: event.invitees.filter((i) => i.status === 'attending').length,
              total: event.invitees.length,
            })}
          </ThemedText>

          {/* Invitees */}
          <View style={styles.inviteesSection}>
            <ThemedText variant="body" weight="600">
              {t('invitees')}
            </ThemedText>
            {event.invitees.length === 0 ? (
              <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
                {t('noInvitees')}
              </ThemedText>
            ) : (
              event.invitees.map((invitee) => (
                <View key={invitee.invitationId}>{renderInvitee({ item: invitee })}</View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom actions */}
      {!isCancelled && (
        <View
          style={[
            styles.bottomBar,
            { borderTopColor: colors.border, backgroundColor: colors.background },
          ]}>
          <ThemedButton
            onPress={() =>
              router.push({
                pathname: '/(app)/(tabs)/my-rooms/[id]/events/invite',
                params: { id, eventId },
              })
            }>
            {t('invitees')}
          </ThemedButton>
          <ThemedButton variant="destructive" onPress={handleCancel}>
            {t('cancelEvent')}
          </ThemedButton>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  contentPadding: {
    padding: 16,
    gap: 16,
  },
  infoSection: {
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  italic: {
    fontStyle: 'italic',
  },
  inviteesSection: {
    gap: 8,
  },
  inviteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  bottomBar: {
    padding: 16,
    paddingBottom: 32,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
