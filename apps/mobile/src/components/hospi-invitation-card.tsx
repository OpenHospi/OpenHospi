import { MAX_DECLINE_REASON_LENGTH } from '@openhospi/shared/constants';
import { InvitationStatus } from '@openhospi/shared/enums';
import { Calendar, Check, Clock, HelpCircle, MapPin, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BottomSheet, type BottomSheetModal } from '@/components/bottom-sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
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
        onSuccess: () => Alert.alert(t('rsvpSuccess')),
        onError: () => Alert.alert(t('errors.not_found')),
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
        style={{
          borderLeftWidth: 4,
          borderLeftColor: '#a855f7',
          borderRadius: 12,
          padding: 16,
          gap: 12,
          opacity: isCancelled ? 0.6 : 1,
        }}
        className="border-border bg-card border">
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}>
          <Text className="text-card-foreground text-base font-semibold" style={{ flex: 1 }}>
            {t('hospiTitle')}
          </Text>
          {isCancelled ? (
            <Badge variant="destructive">
              <Text>{t('cancelled')}</Text>
            </Badge>
          ) : (
            hasResponded && (
              <Badge variant="secondary">
                <Text>{tEnums(`invitation_status.${invitation.status}`)}</Text>
              </Badge>
            )
          )}
        </View>

        {/* Event details */}
        <View style={{ gap: 6 }}>
          <Text className="text-card-foreground font-medium">{invitation.eventTitle}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} className="text-muted-foreground" />
            <Text variant="muted" className="text-sm">
              {new Date(invitation.eventDate + 'T00:00:00').toLocaleDateString()}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Clock size={14} className="text-muted-foreground" />
            <Text variant="muted" className="text-sm">
              {invitation.timeStart.slice(0, 5)}
              {invitation.timeEnd ? ` – ${invitation.timeEnd.slice(0, 5)}` : ''}
            </Text>
          </View>
          {invitation.location && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} className="text-muted-foreground" />
              <Text variant="muted" className="text-sm">
                {invitation.location}
              </Text>
            </View>
          )}
        </View>

        {/* Deadline warning */}
        {deadlineText && (
          <Text className="text-sm font-medium" style={{ color: '#ea580c' }}>
            {deadlineText}
          </Text>
        )}

        {/* RSVP buttons — pending */}
        {!isCancelled && invitation.status === InvitationStatus.pending && (
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Button
              size="sm"
              onPress={() => handleRsvp(InvitationStatus.attending)}
              disabled={respondMutation.isPending}
              style={{ flexDirection: 'row', gap: 4 }}>
              {respondMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Check size={14} color="white" />
              )}
              <Text className="text-primary-foreground">{t('attend')}</Text>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onPress={() => handleRsvp(InvitationStatus.maybe)}
              disabled={respondMutation.isPending}
              style={{ flexDirection: 'row', gap: 4 }}>
              <HelpCircle size={14} className="text-foreground" />
              <Text>{t('maybe')}</Text>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onPress={() => handleRsvp(InvitationStatus.not_attending)}
              disabled={respondMutation.isPending}
              style={{ flexDirection: 'row', gap: 4 }}>
              <X size={14} className="text-foreground" />
              <Text>{t('decline')}</Text>
            </Button>
          </View>
        )}

        {/* Change response — attending: can decline */}
        {!isCancelled && invitation.status === InvitationStatus.attending && (
          <Button
            size="sm"
            variant="ghost"
            onPress={() => handleRsvp(InvitationStatus.not_attending)}
            disabled={respondMutation.isPending}
            style={{ flexDirection: 'row', gap: 4, alignSelf: 'flex-start' }}>
            <X size={14} className="text-foreground" />
            <Text>{t('decline')}</Text>
          </Button>
        )}

        {/* Change response — maybe: can attend or decline */}
        {!isCancelled && invitation.status === InvitationStatus.maybe && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button
              size="sm"
              onPress={() => handleRsvp(InvitationStatus.attending)}
              disabled={respondMutation.isPending}
              style={{ flexDirection: 'row', gap: 4 }}>
              {respondMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Check size={14} color="white" />
              )}
              <Text className="text-primary-foreground">{t('attend')}</Text>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onPress={() => handleRsvp(InvitationStatus.not_attending)}
              disabled={respondMutation.isPending}
              style={{ flexDirection: 'row', gap: 4 }}>
              <X size={14} className="text-foreground" />
              <Text>{t('decline')}</Text>
            </Button>
          </View>
        )}
      </View>

      {/* Decline bottom sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        title={t('declineReasonLabel')}
        onDismiss={() => setDeclineReason('')}
        footer={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button
              variant="destructive"
              onPress={handleDeclineSubmit}
              disabled={respondMutation.isPending || !declineReason.trim()}
              style={{ flex: 1 }}>
              {respondMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-destructive-foreground">{t('confirmDecline')}</Text>
              )}
            </Button>
            <Button
              variant="ghost"
              onPress={() => bottomSheetRef.current?.dismiss()}
              disabled={respondMutation.isPending}
              style={{ flex: 1 }}>
              <Text>{tCommon('cancel')}</Text>
            </Button>
          </View>
        }>
        <View style={{ padding: 16, gap: 12 }}>
          <Text variant="muted" className="text-sm">
            {t('declineReasonPlaceholder')}
          </Text>
          <TextInput
            value={declineReason}
            onChangeText={setDeclineReason}
            placeholder={t('declineReasonPlaceholder')}
            maxLength={MAX_DECLINE_REASON_LENGTH}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{
              minHeight: 100,
              padding: 12,
              borderWidth: 1,
              borderRadius: 8,
              fontSize: 14,
            }}
            className="border-input bg-background text-foreground"
          />
        </View>
      </BottomSheet>
    </>
  );
}
