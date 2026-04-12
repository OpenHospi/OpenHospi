import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Dot, Euro, Home } from 'lucide-react-native';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { HospiInvitationCard } from '@/components/events/hospi-invitation-card';
import { ThemedBadge } from '@/components/primitives/themed-badge';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedText } from '@/components/primitives/themed-text';
import { GroupedSection } from '@/components/layout/grouped-section';
import { useTranslation } from 'react-i18next';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useApplicationDetail, useWithdrawApplication } from '@/services/applications';
import type { ApplicationStatus } from '@openhospi/shared/enums';

const TIMELINE_STEPS: ApplicationStatus[] = ['sent', 'seen', 'liked', 'hospi', 'accepted'];

function StatusTimeline({ currentStatus }: { currentStatus: ApplicationStatus }) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.applications.timeline' });
  const { colors } = useTheme();

  const terminalStatuses = ['rejected', 'not_chosen', 'withdrawn'] as const;
  const isTerminal = (terminalStatuses as readonly string[]).includes(currentStatus);

  const currentIndex = TIMELINE_STEPS.indexOf(currentStatus);

  return (
    <View style={{ gap: 0 }}>
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
              {!isLast && (
                <View
                  style={[
                    styles.timelineConnector,
                    { backgroundColor: isReached ? colors.primary : colors.muted },
                  ]}
                />
              )}
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

      {isTerminal && (
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
            style={{ marginLeft: 8 }}>
            {t(currentStatus)}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.applications' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { colors } = useTheme();

  const { data: app, isPending } = useApplicationDetail(id);
  const withdrawMutation = useWithdrawApplication();

  const canWithdraw =
    app && !(['rejected', 'accepted', 'not_chosen', 'withdrawn'] as string[]).includes(app.status);

  const handleWithdraw = () => {
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
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!app) {
    return (
      <SafeAreaView
        style={[styles.centered, { backgroundColor: colors.background, paddingHorizontal: 32 }]}>
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
        contentInsetAdjustmentBehavior="automatic"
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: canWithdraw ? 80 : 16 }}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.coverImage} contentFit="cover" />
        ) : (
          <View style={[styles.placeholderCover, { backgroundColor: colors.muted }]}>
            <Home size={48} color={colors.mutedForeground} />
          </View>
        )}

        <View style={styles.content}>
          <View>
            <ThemedText variant="title2">{app.roomTitle}</ThemedText>
            <View style={styles.metaRow}>
              <ThemedText variant="body" color={colors.tertiaryForeground}>
                {tEnums(`city.${app.roomCity}`)}
              </ThemedText>
              {app.roomHouseType && (
                <>
                  <Dot size={16} color={colors.mutedForeground} />
                  <ThemedText variant="body" color={colors.tertiaryForeground}>
                    {tEnums(`house_type.${app.roomHouseType}`)}
                  </ThemedText>
                </>
              )}
              {app.roomSizeM2 && (
                <>
                  <Dot size={16} color={colors.mutedForeground} />
                  <ThemedText variant="body" color={colors.tertiaryForeground}>
                    {app.roomSizeM2}m²
                  </ThemedText>
                </>
              )}
            </View>
            <View style={styles.priceRow}>
              <Euro size={18} color={colors.primary} />
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
              style={{ marginTop: 4 }}>
              {t('appliedOn', { date: new Date(app.appliedAt).toLocaleDateString() })}
            </ThemedText>
          </View>

          <View>
            <ThemedText variant="body" weight="600" style={{ marginBottom: 12 }}>
              {t('timeline.title')}
            </ThemedText>
            <StatusTimeline currentStatus={app.status} />
          </View>

          {app.invitation && (
            <HospiInvitationCard invitation={app.invitation} applicationId={app.id} />
          )}

          {app.personalMessage && (
            <View>
              <ThemedText variant="body" weight="600" style={{ marginBottom: 8 }}>
                {t('yourMessage')}
              </ThemedText>
              <GroupedSection>
                <View style={{ padding: 16 }}>
                  <ThemedText variant="subheadline">{app.personalMessage}</ThemedText>
                </View>
              </GroupedSection>
            </View>
          )}

          <ThemedButton
            variant="outline"
            onPress={() =>
              router.push({ pathname: '/(app)/room/[id]', params: { id: app.roomId } })
            }>
            {t('viewRoom')}
          </ThemedButton>
        </View>
      </ScrollView>

      {canWithdraw && (
        <View
          style={[
            styles.bottomBar,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}>
          <ThemedButton
            variant="destructive"
            onPress={handleWithdraw}
            disabled={withdrawMutation.isPending}>
            {withdrawMutation.isPending ? '...' : t('withdraw')}
          </ThemedButton>
        </View>
      )}
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
  content: {
    gap: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  metaRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 8,
    paddingBottom: 16,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
