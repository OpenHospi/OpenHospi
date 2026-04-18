import type { ApplicationStatus } from '@openhospi/shared/enums';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { HospiInvitationCard } from '@/components/events/hospi-invitation-card';
import { GroupedSection } from '@/components/layout/grouped-section';
import { ThemedBadge } from '@/components/native/badge';
import { NativeButton } from '@/components/native/button';
import { NativeIcon } from '@/components/native/icon';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticDelete } from '@/lib/haptics';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useApplicationDetail, useWithdrawApplication } from '@/services/applications';

const TIMELINE_STEPS: ApplicationStatus[] = ['sent', 'seen', 'liked', 'hospi', 'accepted'];
const TERMINAL_STATUSES: ApplicationStatus[] = ['rejected', 'not_chosen', 'withdrawn'];

function StatusTimeline({ currentStatus }: { currentStatus: ApplicationStatus }) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.applications.timeline' });
  const { colors } = useTheme();

  const isTerminal = TERMINAL_STATUSES.includes(currentStatus);
  const currentIndex = TIMELINE_STEPS.indexOf(currentStatus);

  return (
    <View>
      {TIMELINE_STEPS.map((step, index) => {
        const isReached = currentIndex >= index;
        const isLast = index === TIMELINE_STEPS.length - 1;

        return (
          <View key={step} style={styles.timelineStep}>
            <View style={styles.timelineLine}>
              <View
                style={[
                  styles.timelineDot,
                  { backgroundColor: isReached ? colors.primary : colors.muted },
                ]}
              />
              {!isLast ? (
                <View
                  style={[
                    styles.timelineConnector,
                    { backgroundColor: isReached ? colors.primary : colors.muted },
                  ]}
                />
              ) : null}
            </View>
            <ThemedText
              variant="subheadline"
              weight={isReached ? '500' : '400'}
              color={isReached ? colors.foreground : colors.mutedForeground}
              style={styles.timelineLabel}>
              {t(step)}
            </ThemedText>
          </View>
        );
      })}

      {isTerminal ? (
        <View style={styles.timelineStep}>
          <View style={styles.timelineLine}>
            <View
              style={[styles.timelineDot, { backgroundColor: colors.destructive, marginTop: 4 }]}
            />
          </View>
          <ThemedText
            variant="subheadline"
            weight="500"
            color={colors.destructive}
            style={styles.timelineLabel}>
            {t(currentStatus)}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

function LoadingState() {
  const { colors, spacing } = useTheme();
  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic">
      <ThemedSkeleton width="100%" height={200} rounded="sm" />
      <View style={[styles.content, { gap: spacing['2xl'], padding: spacing.lg }]}>
        <ThemedSkeleton width="70%" height={28} />
        <ThemedSkeleton width="50%" height={18} />
        <ThemedSkeleton width="100%" height={120} rounded="lg" />
        <ThemedSkeleton width="100%" height={80} rounded="lg" />
      </View>
    </ScrollView>
  );
}

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.applications' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { colors, spacing } = useTheme();

  const { data: app, isPending } = useApplicationDetail(id);
  const withdrawMutation = useWithdrawApplication();

  const canWithdraw = app && !TERMINAL_STATUSES.includes(app.status);

  const handleWithdraw = () => {
    hapticDelete();
    Alert.alert(t('withdrawConfirmTitle'), t('withdrawConfirmDescription'), [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: t('withdraw'),
        style: 'destructive',
        onPress: () => {
          withdrawMutation.mutate(id, {
            onSuccess: () => router.back(),
          });
        },
      },
    ]);
  };

  if (isPending) {
    return <LoadingState />;
  }

  if (!app) {
    return (
      <SafeAreaView
        style={[
          styles.centered,
          { backgroundColor: colors.background, paddingHorizontal: spacing['3xl'] },
        ]}>
        <ThemedText variant="body" color={colors.tertiaryForeground} style={styles.textCenter}>
          {t('errors.not_found')}
        </ThemedText>
      </SafeAreaView>
    );
  }

  const coverUrl = app.roomCoverPhotoUrl
    ? getStoragePublicUrl(app.roomCoverPhotoUrl, 'room-photos')
    : null;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView
        style={styles.flex}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: canWithdraw ? 96 : spacing.lg }}>
        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            style={styles.coverImage}
            contentFit="cover"
            accessibilityLabel={app.roomTitle}
          />
        ) : (
          <View style={[styles.placeholderCover, { backgroundColor: colors.muted }]}>
            <NativeIcon name="house" androidName="home" size={48} color={colors.mutedForeground} />
          </View>
        )}

        <View style={[styles.content, { gap: spacing['2xl'], padding: spacing.lg }]}>
          <View>
            <ThemedText variant="title2">{app.roomTitle}</ThemedText>
            <View style={styles.metaRow}>
              <ThemedText variant="body" color={colors.tertiaryForeground}>
                {tEnums(`city.${app.roomCity}`)}
              </ThemedText>
              {app.roomHouseType ? (
                <>
                  <NativeIcon
                    name="circle.fill"
                    iosName="circle.fill"
                    androidName="fiber-manual-record"
                    size={4}
                    color={colors.mutedForeground}
                  />
                  <ThemedText variant="body" color={colors.tertiaryForeground}>
                    {tEnums(`house_type.${app.roomHouseType}`)}
                  </ThemedText>
                </>
              ) : null}
              {app.roomSizeM2 ? (
                <>
                  <NativeIcon
                    name="circle.fill"
                    iosName="circle.fill"
                    androidName="fiber-manual-record"
                    size={4}
                    color={colors.mutedForeground}
                  />
                  <ThemedText variant="body" color={colors.tertiaryForeground}>
                    {app.roomSizeM2}m²
                  </ThemedText>
                </>
              ) : null}
            </View>
            <View style={styles.priceRow}>
              <NativeIcon
                name="eurosign"
                androidName="euro-symbol"
                size={18}
                color={colors.primary}
              />
              <ThemedText variant="headline" color={colors.primary}>
                {app.roomRentPrice}
                {tCommon('perMonth')}
              </ThemedText>
            </View>
          </View>

          <View>
            <ThemedBadge
              variant="secondary"
              label={tEnums(`application_status.${app.status}`)}
              style={{ alignSelf: 'flex-start', borderRadius: radius.full }}
            />
            <ThemedText
              variant="caption1"
              color={colors.tertiaryForeground}
              style={{ marginTop: spacing.xs }}>
              {t('appliedOn', { date: new Date(app.appliedAt).toLocaleDateString() })}
            </ThemedText>
          </View>

          <View>
            <ThemedText variant="body" weight="600" style={{ marginBottom: spacing.md }}>
              {t('timeline.title')}
            </ThemedText>
            <StatusTimeline currentStatus={app.status} />
          </View>

          {app.invitation ? (
            <HospiInvitationCard invitation={app.invitation} applicationId={app.id} />
          ) : null}

          {app.personalMessage ? (
            <View>
              <ThemedText variant="body" weight="600" style={{ marginBottom: spacing.sm }}>
                {t('yourMessage')}
              </ThemedText>
              <GroupedSection inset={false}>
                <View style={{ padding: spacing.lg }}>
                  <ThemedText variant="subheadline">{app.personalMessage}</ThemedText>
                </View>
              </GroupedSection>
            </View>
          ) : null}

          <NativeButton
            label={t('viewRoom')}
            variant="outline"
            systemImage="house"
            materialIcon="home"
            onPress={() =>
              router.push({ pathname: '/(app)/room/[id]', params: { id: app.roomId } })
            }
            accessibilityHint={app.roomTitle}
          />
        </View>
      </ScrollView>

      {canWithdraw ? (
        <View
          style={[
            styles.bottomBar,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.background,
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.md,
              paddingBottom: spacing['2xl'],
            },
          ]}>
          <NativeButton
            label={t('withdraw')}
            variant="destructive"
            onPress={handleWithdraw}
            loading={withdrawMutation.isPending}
            disabled={withdrawMutation.isPending}
            accessibilityHint={t('withdrawConfirmDescription')}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCenter: {
    textAlign: 'center',
  },
  coverImage: {
    width: '100%',
    height: 200,
  },
  placeholderCover: {
    height: 200,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {},
  metaRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  timelineStep: {
    flexDirection: 'row',
  },
  timelineLine: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: radius.sm,
    marginTop: 4,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    minHeight: 24,
  },
  timelineLabel: {
    marginStart: 8,
    paddingBottom: 16,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
