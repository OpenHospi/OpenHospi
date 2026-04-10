import { MAX_DECLINE_REASON_LENGTH } from '@openhospi/shared/constants';
import { InvitationStatus } from '@openhospi/shared/enums';
import { Calendar, Check, Clock, HelpCircle, MapPin, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { hapticSuccess, hapticError } from '@/lib/haptics';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';

import {
  AppBottomSheetModal as BottomSheet,
  type BottomSheetModal,
} from '@/components/bottom-sheet';
import { ThemedBadge } from '@/components/primitives/themed-badge';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedText } from '@/components/primitives/themed-text';
import { useRespondToInvitation } from '@/services/invitations';
import type { UserInvitation } from '@openhospi/shared/api-types';

type Props = {
  invitation: UserInvitation;
  applicationId: string;
};

export function HospiInvitationCard({ invitation, applicationId }: Props) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.invitations' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { colors } = useTheme();

  const respondMutation = useRespondToInvitation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [declineReason, setDeclineReason] = useState('');

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

  function handleRsvp(status: string) {
    if (status === InvitationStatus.not_attending) {
      bottomSheetRef.current?.present();
      return;
    }
    respondMutation.mutate(
      {
        invitationId: invitation.invitationId,
        applicationId,
        data: { status },
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

  function handleDeclineSubmit() {
    if (!declineReason.trim()) return;
    respondMutation.mutate(
      {
        invitationId: invitation.invitationId,
        applicationId,
        data: {
          status: InvitationStatus.not_attending,
          declineReason: declineReason.trim(),
        },
      },
      {
        onSuccess: () => {
          bottomSheetRef.current?.dismiss();
          setDeclineReason('');
          Alert.alert(t('rsvpSuccess'));
        },
        onError: () => Alert.alert(t('errors.not_found')),
      }
    );
  }

  const deadlineText = deadlineSoon
    ? t('deadlineSoon', {
        deadline: new Date(invitation.rsvpDeadline!).toLocaleDateString(),
      })
    : null;

  return (
    <>
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
          <ThemedText variant="body" weight="600" color={colors.cardForeground} style={{ flex: 1 }}>
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
            <Calendar size={14} color={colors.mutedForeground} />
            <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
              {new Date(invitation.eventDate + 'T00:00:00').toLocaleDateString()}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Clock size={14} color={colors.mutedForeground} />
            <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
              {invitation.timeStart.slice(0, 5)}
              {invitation.timeEnd ? ` – ${invitation.timeEnd.slice(0, 5)}` : ''}
            </ThemedText>
          </View>
          {invitation.location && (
            <View style={styles.detailRow}>
              <MapPin size={14} color={colors.mutedForeground} />
              <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
                {invitation.location}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Deadline warning */}
        {deadlineText && (
          <ThemedText variant="subheadline" weight="500" style={{ color: '#ea580c' }}>
            {deadlineText}
          </ThemedText>
        )}

        {/* RSVP buttons -- pending */}
        {!isCancelled && invitation.status === InvitationStatus.pending && (
          <View style={styles.buttonRow}>
            <ThemedButton
              size="sm"
              onPress={() => handleRsvp(InvitationStatus.attending)}
              disabled={respondMutation.isPending}
              style={styles.rsvpButton}>
              {respondMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Check size={14} color="white" />
              )}
              <ThemedText variant="subheadline" weight="600" color={colors.primaryForeground}>
                {t('attend')}
              </ThemedText>
            </ThemedButton>
            <ThemedButton
              size="sm"
              variant="outline"
              onPress={() => handleRsvp(InvitationStatus.maybe)}
              disabled={respondMutation.isPending}
              style={styles.rsvpButton}>
              <HelpCircle size={14} color={colors.foreground} />
              <ThemedText variant="subheadline" weight="600">
                {t('maybe')}
              </ThemedText>
            </ThemedButton>
            <ThemedButton
              size="sm"
              variant="outline"
              onPress={() => handleRsvp(InvitationStatus.not_attending)}
              disabled={respondMutation.isPending}
              style={styles.rsvpButton}>
              <X size={14} color={colors.foreground} />
              <ThemedText variant="subheadline" weight="600">
                {t('decline')}
              </ThemedText>
            </ThemedButton>
          </View>
        )}

        {/* Change response -- attending: can decline */}
        {!isCancelled && invitation.status === InvitationStatus.attending && (
          <ThemedButton
            size="sm"
            variant="ghost"
            onPress={() => handleRsvp(InvitationStatus.not_attending)}
            disabled={respondMutation.isPending}
            style={[styles.rsvpButton, { alignSelf: 'flex-start' }]}>
            <X size={14} color={colors.foreground} />
            <ThemedText variant="subheadline" weight="600">
              {t('decline')}
            </ThemedText>
          </ThemedButton>
        )}

        {/* Change response -- maybe: can attend or decline */}
        {!isCancelled && invitation.status === InvitationStatus.maybe && (
          <View style={styles.buttonRow}>
            <ThemedButton
              size="sm"
              onPress={() => handleRsvp(InvitationStatus.attending)}
              disabled={respondMutation.isPending}
              style={styles.rsvpButton}>
              {respondMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Check size={14} color="white" />
              )}
              <ThemedText variant="subheadline" weight="600" color={colors.primaryForeground}>
                {t('attend')}
              </ThemedText>
            </ThemedButton>
            <ThemedButton
              size="sm"
              variant="ghost"
              onPress={() => handleRsvp(InvitationStatus.not_attending)}
              disabled={respondMutation.isPending}
              style={styles.rsvpButton}>
              <X size={14} color={colors.foreground} />
              <ThemedText variant="subheadline" weight="600">
                {t('decline')}
              </ThemedText>
            </ThemedButton>
          </View>
        )}
      </View>

      {/* Decline bottom sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        title={t('declineReasonLabel')}
        onDismiss={() => setDeclineReason('')}
        footer={
          <View style={styles.buttonRow}>
            <ThemedButton
              variant="destructive"
              onPress={handleDeclineSubmit}
              disabled={respondMutation.isPending || !declineReason.trim()}
              style={{ flex: 1 }}>
              {respondMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <ThemedText variant="subheadline" weight="600" color={colors.destructiveForeground}>
                  {t('confirmDecline')}
                </ThemedText>
              )}
            </ThemedButton>
            <ThemedButton
              variant="ghost"
              onPress={() => bottomSheetRef.current?.dismiss()}
              disabled={respondMutation.isPending}
              style={{ flex: 1 }}>
              {tCommon('cancel')}
            </ThemedButton>
          </View>
        }>
        <View style={styles.sheetContent}>
          <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
            {t('declineReasonPlaceholder')}
          </ThemedText>
          <TextInput
            value={declineReason}
            onChangeText={setDeclineReason}
            placeholder={t('declineReasonPlaceholder')}
            maxLength={MAX_DECLINE_REASON_LENGTH}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor={colors.tertiaryForeground}
            style={[
              styles.textArea,
              {
                borderColor: colors.input,
                backgroundColor: colors.background,
                color: colors.foreground,
              },
            ]}
          />
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 4,
    borderLeftColor: '#a855f7',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  sheetContent: {
    padding: 16,
    gap: 12,
  },
  textArea: {
    minHeight: 100,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    fontSize: 14,
  },
});
