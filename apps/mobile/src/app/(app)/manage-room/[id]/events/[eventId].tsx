import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedAvatar } from '@/components/native/avatar';
import { ThemedBadge } from '@/components/native/badge';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { GroupedSection } from '@/components/layout/grouped-section';
import { ListCell } from '@/components/layout/list-cell';
import { ListSeparator } from '@/components/layout/list-separator';
import { BlurBottomBar } from '@/components/layout/blur-bottom-bar';
import { useTheme } from '@/design';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useCancelEvent, useEventDetail } from '@/services/my-rooms';
import type { EventInvitee } from '@openhospi/shared/api-types';
import type { BadgeVariant } from '@/components/native/badge';

const RSVP_BADGE_VARIANT: Record<string, BadgeVariant> = {
  attending: 'primary',
  not_attending: 'destructive',
  maybe: 'secondary',
  pending: 'outline',
};

function SkeletonEventDetail() {
  return (
    <View style={styles.skeletonContainer}>
      <ThemedSkeleton width="60%" height={22} />
      <ThemedSkeleton width="50%" height={16} />
      <ThemedSkeleton width="40%" height={16} />
      <ThemedSkeleton width="100%" height={60} rounded="lg" />
      <ThemedSkeleton width="30%" height={14} />
      <ThemedSkeleton width="100%" height={120} rounded="lg" />
    </View>
  );
}

export default function EventDetailScreen() {
  const { id, eventId } = useLocalSearchParams<{ id: string; eventId: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms.events' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { colors } = useTheme();

  const { data: event, isLoading } = useEventDetail(id, eventId);
  const cancelEvent = useCancelEvent();

  if (isLoading || !event) {
    return <SkeletonEventDetail />;
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

  const timeDisplay = `${event.timeStart}${event.timeEnd ? ` - ${event.timeEnd}` : ''}`;

  return (
    <View style={[styles.flex1, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.flex1}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentPadding}>
          {/* Title + status */}
          <View style={styles.titleRow}>
            <ThemedText variant="title3">{event.title}</ThemedText>
            {isCancelled && <ThemedBadge variant="destructive" label={t('cancelled')} />}
          </View>

          {/* Event info */}
          <GroupedSection inset={false}>
            <ListCell label={t('fields.date')} value={event.eventDate} />
            <ListSeparator />
            <ListCell label={t('fields.startTime')} value={timeDisplay} />
            {event.location && (
              <>
                <ListSeparator />
                <ListCell label={t('fields.location')} value={event.location} />
              </>
            )}
            {event.maxAttendees && (
              <>
                <ListSeparator />
                <ListCell label={t('fields.maxAttendees')} value={String(event.maxAttendees)} />
              </>
            )}
          </GroupedSection>

          {event.description && (
            <GroupedSection inset={false}>
              <View style={styles.sectionContent}>
                <ThemedText variant="body" weight="600">
                  {t('fields.description')}
                </ThemedText>
                <ThemedText variant="subheadline">{event.description}</ThemedText>
              </View>
            </GroupedSection>
          )}

          {event.notes && (
            <GroupedSection inset={false}>
              <View style={styles.sectionContent}>
                <ThemedText variant="body" weight="600">
                  {t('fields.notes')}
                </ThemedText>
                <ThemedText
                  variant="subheadline"
                  color={colors.tertiaryForeground}
                  style={styles.italic}>
                  {event.notes}
                </ThemedText>
              </View>
            </GroupedSection>
          )}

          {/* Attending summary */}
          <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
            {t('attendingCount', {
              attending: event.invitees.filter((i) => i.status === 'attending').length,
              total: event.invitees.length,
            })}
          </ThemedText>

          {/* Invitees */}
          <GroupedSection inset={false}>
            <View style={styles.sectionContent}>
              <ThemedText variant="body" weight="600">
                {t('invitees')}
              </ThemedText>
              {event.invitees.length === 0 ? (
                <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
                  {t('noInvitees')}
                </ThemedText>
              ) : (
                event.invitees.map((invitee, index) => (
                  <View key={invitee.invitationId}>
                    {index > 0 && <ListSeparator />}
                    <InviteeRow invitee={invitee} tEnums={tEnums} />
                  </View>
                ))
              )}
            </View>
          </GroupedSection>
        </View>
      </ScrollView>

      {!isCancelled && (
        <BlurBottomBar>
          <ThemedButton
            onPress={() =>
              router.push({
                pathname: '/(app)/manage-room/[id]/events/invite',
                params: { id, eventId },
              })
            }>
            {t('invitees')}
          </ThemedButton>
          <ThemedButton variant="destructive" onPress={handleCancel}>
            {t('cancelEvent')}
          </ThemedButton>
        </BlurBottomBar>
      )}
    </View>
  );
}

function InviteeRow({
  invitee,
  tEnums,
}: {
  invitee: EventInvitee;
  tEnums: (key: string) => string;
}) {
  const avatarUri = invitee.avatarUrl
    ? getStoragePublicUrl(invitee.avatarUrl, 'profile-photos')
    : undefined;

  return (
    <View style={styles.inviteeRow}>
      <ThemedAvatar source={avatarUri} fallback={invitee.firstName.charAt(0)} size={40} />
      <ThemedText variant="subheadline" style={styles.flex1}>
        {invitee.firstName} {invitee.lastName}
      </ThemedText>
      <ThemedBadge
        variant={RSVP_BADGE_VARIANT[invitee.status ?? 'pending'] ?? 'outline'}
        label={tEnums(`invitation_status.${invitee.status ?? 'pending'}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  contentPadding: {
    padding: 16,
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionContent: {
    padding: 16,
    gap: 8,
  },
  italic: {
    fontStyle: 'italic',
  },
  inviteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  skeletonContainer: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
});
