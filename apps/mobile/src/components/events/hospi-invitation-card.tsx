import { InvitationStatus } from '@openhospi/shared/enums';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedBadge } from '@/components/native/badge';
import { NativeButton } from '@/components/native/button';
import { NativeIcon } from '@/components/native/icon';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { registerPickerCallback } from '@/lib/picker-callbacks';
import { useRespondToInvitation } from '@/services/invitations';
import type { UserInvitation } from '@openhospi/shared/api-types';

type Props = {
  invitation: UserInvitation;
  applicationId: string;
};

export function HospiInvitationCard({ invitation, applicationId }: Props) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.invitations' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { colors } = useTheme();
  const router = useRouter();

  const respondMutation = useRespondToInvitation();

  const isCancelled = !!invitation.cancelledAt;
  const isDeclined = invitation.status === InvitationStatus.not_attending;
  const hasResponded = invitation.status !== InvitationStatus.pending;

  const now = Date.now();
  const deadlineSoon =
    invitation.rsvpDeadline &&
    !isCancelled &&
    !isDeclined &&
    new Date(invitation.rsvpDeadline).getTime() - now < 48 * 60 * 60 * 1000 &&
    new Date(invitation.rsvpDeadline).getTime() > now;

  function submitResponse(status: string, declineReason?: string) {
    respondMutation.mutate(
      {
        invitationId: invitation.invitationId,
        applicationId,
        data: { status, ...(declineReason ? { declineReason } : {}) },
      },
      {
        onSuccess: () => {
          hapticSuccess();
          Alert.alert(t('rsvpSuccess'));
        },
        onError: () => {
          hapticError();
          Alert.alert(t('errors.not_found'));
        },
      }
    );
  }

  function handleRsvp(status: string) {
    if (status === InvitationStatus.not_attending) {
      const callbackId = registerPickerCallback<string>((reason) => {
        submitResponse(InvitationStatus.not_attending, reason);
      });
      router.push({
        pathname: '/(app)/(modals)/decline-invitation',
        params: { callbackId },
      });
      return;
    }
    submitResponse(status);
  }

  const deadlineText = deadlineSoon
    ? t('deadlineSoon', {
        deadline: new Date(invitation.rsvpDeadline!).toLocaleDateString(),
      })
    : null;

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: colors.border,
          backgroundColor: colors.card,
          opacity: isCancelled ? 0.6 : 1,
        },
      ]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText variant="body" weight="600" color={colors.cardForeground} style={styles.flex1}>
          {t('hospiTitle')}
        </ThemedText>
        {isCancelled ? (
          <ThemedBadge variant="destructive" label={t('cancelled')} />
        ) : (
          hasResponded && (
            <ThemedBadge
              variant="secondary"
              label={tEnums(`invitation_status.${invitation.status}`)}
            />
          )
        )}
      </View>

      {/* Event details */}
      <View style={styles.details}>
        <ThemedText variant="body" weight="500" color={colors.cardForeground}>
          {invitation.eventTitle}
        </ThemedText>
        <View style={styles.detailRow}>
          <NativeIcon name="calendar" size={14} color={colors.mutedForeground} />
          <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
            {new Date(invitation.eventDate + 'T00:00:00').toLocaleDateString()}
          </ThemedText>
        </View>
        <View style={styles.detailRow}>
          <NativeIcon
            name="clock"
            androidName="schedule"
            size={14}
            color={colors.mutedForeground}
          />
          <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
            {invitation.timeStart.slice(0, 5)}
            {invitation.timeEnd ? ` – ${invitation.timeEnd.slice(0, 5)}` : ''}
          </ThemedText>
        </View>
        {invitation.location && (
          <View style={styles.detailRow}>
            <NativeIcon
              name="mappin"
              androidName="place"
              size={14}
              color={colors.mutedForeground}
            />
            <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
              {invitation.location}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Deadline warning */}
      {deadlineText && (
        <ThemedText variant="subheadline" weight="500" style={{ color: colors.warning }}>
          {deadlineText}
        </ThemedText>
      )}

      {/* RSVP buttons — pending */}
      {!isCancelled && invitation.status === InvitationStatus.pending && (
        <View style={styles.buttonRow}>
          <NativeButton
            label={t('attend')}
            size="sm"
            onPress={() => handleRsvp(InvitationStatus.attending)}
            disabled={respondMutation.isPending}
            loading={respondMutation.isPending}
            style={styles.rsvpButton}
            systemImage="checkmark"
            materialIcon="check"
          />
          <NativeButton
            label={t('maybe')}
            size="sm"
            variant="outline"
            onPress={() => handleRsvp(InvitationStatus.maybe)}
            disabled={respondMutation.isPending}
            style={styles.rsvpButton}
            systemImage="questionmark"
            materialIcon="help-outline"
          />
          <NativeButton
            label={t('decline')}
            size="sm"
            variant="outline"
            onPress={() => handleRsvp(InvitationStatus.not_attending)}
            disabled={respondMutation.isPending}
            style={styles.rsvpButton}
            systemImage="xmark"
            materialIcon="close"
          />
        </View>
      )}

      {/* Change response — attending: can decline */}
      {!isCancelled && invitation.status === InvitationStatus.attending && (
        <NativeButton
          label={t('decline')}
          size="sm"
          variant="ghost"
          onPress={() => handleRsvp(InvitationStatus.not_attending)}
          disabled={respondMutation.isPending}
          style={{ ...styles.rsvpButton, ...styles.selfStart }}
          systemImage="xmark"
          materialIcon="close"
        />
      )}

      {/* Change response — maybe: can attend or decline */}
      {!isCancelled && invitation.status === InvitationStatus.maybe && (
        <View style={styles.buttonRow}>
          <NativeButton
            label={t('attend')}
            size="sm"
            onPress={() => handleRsvp(InvitationStatus.attending)}
            disabled={respondMutation.isPending}
            loading={respondMutation.isPending}
            style={styles.rsvpButton}
            systemImage="checkmark"
            materialIcon="check"
          />
          <NativeButton
            label={t('decline')}
            size="sm"
            variant="ghost"
            onPress={() => handleRsvp(InvitationStatus.not_attending)}
            disabled={respondMutation.isPending}
            style={styles.rsvpButton}
            systemImage="xmark"
            materialIcon="close"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderStartWidth: 4,
    borderStartColor: '#a855f7',
    borderRadius: radius.lg,
    padding: 16,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  flex1: {
    flex: 1,
  },
  details: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  rsvpButton: {
    flexDirection: 'row',
    gap: 4,
  },
  selfStart: {
    alignSelf: 'flex-start',
  },
});
