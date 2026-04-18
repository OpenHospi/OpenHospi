import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AnimatedPressable } from '@/components/shared/animated-pressable';
import { SwipeableRow } from '@/components/shared/swipeable-row';
import { NativeEmptyState } from '@/components/feedback/native-empty-state';
import { ThemedAvatar } from '@/components/native/avatar';
import { ThemedBadge } from '@/components/native/badge';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { NativeDivider } from '@/components/native/divider';
import { useTheme } from '@/design';
import { getStoragePublicUrl } from '@/lib/storage-url';
import {
  useMarkApplicationsSeen,
  useRoomApplicants,
  useUpdateApplicantStatus,
} from '@/services/my-rooms';
import type { RoomApplicant } from '@openhospi/shared/api-types';
import type { BadgeVariant } from '@/components/native/badge';

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  sent: 'outline',
  seen: 'secondary',
  liked: 'primary',
  maybe: 'secondary',
  rejected: 'destructive',
  hospi: 'primary',
  accepted: 'primary',
  not_chosen: 'destructive',
};

function SkeletonApplicantRow() {
  return (
    <View style={styles.skeletonRow}>
      <ThemedSkeleton width={48} height={48} rounded="full" />
      <View style={styles.skeletonInfo}>
        <ThemedSkeleton width="60%" height={16} />
        <ThemedSkeleton width="40%" height={12} />
      </View>
      <ThemedSkeleton width={60} height={24} rounded="full" />
    </View>
  );
}

function SkeletonApplicantsList() {
  return (
    <View style={styles.skeletonContainer}>
      <SkeletonApplicantRow />
      <SkeletonApplicantRow />
      <SkeletonApplicantRow />
      <SkeletonApplicantRow />
      <SkeletonApplicantRow />
    </View>
  );
}

export default function ApplicantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms.applicants' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { colors } = useTheme();

  const { data: applicants, isLoading } = useRoomApplicants(id);
  const markSeen = useMarkApplicationsSeen();
  const updateStatus = useUpdateApplicantStatus();
  const markedRef = useRef(false);

  useEffect(() => {
    if (!markedRef.current && applicants?.some((a) => a.status === 'sent')) {
      markedRef.current = true;
      markSeen.mutate(id);
    }
  }, [applicants, id, markSeen]);

  if (isLoading) {
    return <SkeletonApplicantsList />;
  }

  if (!applicants || applicants.length === 0) {
    return (
      <NativeEmptyState
        sfSymbol="person.crop.rectangle.stack"
        title={t('title')}
        subtitle={t('empty')}
      />
    );
  }

  const handleAccept = (applicant: RoomApplicant) => {
    Alert.alert(t('accept'), t('acceptConfirmDescription', { name: applicant.firstName }), [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: tCommon('confirm'),
        onPress: () =>
          updateStatus.mutate({
            roomId: id,
            applicationId: applicant.applicationId,
            status: 'accepted',
          }),
      },
    ]);
  };

  const handleReject = (applicant: RoomApplicant) => {
    Alert.alert(t('rejected'), t('acceptConfirmDescription', { name: applicant.firstName }), [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: tCommon('confirm'),
        style: 'destructive',
        onPress: () =>
          updateStatus.mutate({
            roomId: id,
            applicationId: applicant.applicationId,
            status: 'rejected',
          }),
      },
    ]);
  };

  const navigateToProfile = (applicant: RoomApplicant) => {
    router.push({
      pathname: '/(app)/manage-room/[id]/applicant/[applicantUserId]',
      params: { id, applicantUserId: applicant.userId },
    });
  };

  const renderApplicant = ({ item }: { item: RoomApplicant }) => {
    const avatarUri = item.avatarUrl
      ? getStoragePublicUrl(item.avatarUrl, 'profile-photos')
      : undefined;

    const canAction = item.status !== 'accepted' && item.status !== 'rejected';

    const swipeActions = canAction
      ? [
          {
            iconName: 'checkmark',
            color: '#fff',
            backgroundColor: '#16a34a',
            onPress: () => handleAccept(item),
          },
          {
            iconName: 'xmark',
            color: '#fff',
            backgroundColor: '#ef4444',
            onPress: () => handleReject(item),
          },
        ]
      : undefined;

    const row = (
      <SwipeableRow rightActions={swipeActions}>
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={`${item.firstName} ${item.lastName}`}
          onPress={() => navigateToProfile(item)}>
          <View style={[styles.applicantRow, { backgroundColor: colors.background }]}>
            <ThemedAvatar source={avatarUri} fallback={item.firstName.charAt(0)} size={48} />
            <View style={styles.applicantInfo}>
              <ThemedText variant="body" weight="600">
                {item.firstName} {item.lastName}
              </ThemedText>
              {item.studyProgram && (
                <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
                  {item.studyProgram}
                </ThemedText>
              )}
              <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                {t('applied')} {new Date(item.appliedAt).toLocaleDateString()}
              </ThemedText>
            </View>
            <ThemedBadge
              variant={STATUS_BADGE_VARIANT[item.status] ?? 'outline'}
              label={tEnums(`application_status.${item.status}`)}
            />
          </View>
        </AnimatedPressable>
      </SwipeableRow>
    );

    if (Platform.OS === 'ios' && canAction) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Host, ContextMenu, Button: ExpoButton } = require('@expo/ui/swift-ui');

      return (
        <Host matchContents>
          <ContextMenu>
            <ContextMenu.Items>
              <ExpoButton
                label={t('viewProfile')}
                systemImage="person.circle"
                onPress={() => navigateToProfile(item)}
              />
              <ExpoButton
                label={t('accept')}
                systemImage="checkmark.circle"
                onPress={() => handleAccept(item)}
              />
              <ExpoButton
                label={t('rejected')}
                systemImage="xmark.circle"
                role="destructive"
                onPress={() => handleReject(item)}
              />
            </ContextMenu.Items>
            <ContextMenu.Trigger>{row}</ContextMenu.Trigger>
          </ContextMenu>
        </Host>
      );
    }

    return row;
  };

  return (
    <View style={[styles.flex1, { backgroundColor: colors.background }]}>
      <FlashList
        contentInsetAdjustmentBehavior="automatic"
        data={applicants}
        keyExtractor={(item) => item.applicationId}
        renderItem={renderApplicant}
        ItemSeparatorComponent={NativeDivider}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  applicantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  applicantInfo: {
    flex: 1,
    gap: 2,
  },
  skeletonContainer: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skeletonInfo: {
    flex: 1,
    gap: 6,
  },
});
