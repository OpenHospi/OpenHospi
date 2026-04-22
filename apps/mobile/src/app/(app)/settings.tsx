import { LOCALE_CONFIG, type Locale } from '@openhospi/i18n';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { GroupedSection } from '@/components/layout/grouped-section';
import { ListCell } from '@/components/layout/list-cell';
import { NativeDivider } from '@/components/native/divider';
import { NativeIcon } from '@/components/native/icon';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { NativeToggle } from '@/components/native/toggle';
import { useTheme, type ColorSchemePreference } from '@/design';
import { authClient } from '@/lib/auth-client';
import { showActionSheet } from '@/lib/action-sheet';
import { hapticDelete, hapticFormSubmitSuccess, hapticLight } from '@/lib/haptics';
import { registerForPushNotifications } from '@/lib/notifications';
import { isMaterialYouAvailable } from '@/lib/platform-capabilities';
import { queryClient } from '@/lib/query-client';
import {
  useConsent,
  useDeleteAccount,
  useExportData,
  useProcessingRestriction,
  useRevokeSession,
  useSessions,
  useUpdateConsent,
} from '@/services/settings';
import type { ActiveConsent, SessionInfo } from '@openhospi/shared/api-types';

const CONSENT_PURPOSES = ['essential', 'functional', 'push_notifications', 'analytics'] as const;

const DATA_OVERVIEW_CATEGORIES = [
  { key: 'profile', basis: 'contract', retention: 'untilDeletion' },
  { key: 'photos', basis: 'contract', retention: 'untilDeletion' },
  { key: 'housing', basis: 'contract', retention: 'untilDeletion' },
  { key: 'applications', basis: 'contract', retention: 'untilDeletion' },
  { key: 'chat', basis: 'contract', retention: 'untilDeletion' },
  { key: 'sessions', basis: 'legitimateInterest', retention: '30days' },
  { key: 'moderation', basis: 'legitimateInterest', retention: '90days' },
] as const;

type TFn = ReturnType<typeof useTranslation>['t'];

export default function SettingsScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.settings' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tConsent } = useTranslation('translation', { keyPrefix: 'app.consent' });
  const { colors, spacing } = useTheme();

  const {
    data: consents,
    refetch: refetchConsent,
    isRefetching: isRefetchingConsent,
  } = useConsent();
  const {
    data: sessions,
    refetch: refetchSessions,
    isRefetching: isRefetchingSessions,
  } = useSessions();
  const { refetch: refetchRestriction, isRefetching: isRefetchingRestriction } =
    useProcessingRestriction();

  const isRefetching = isRefetchingConsent || isRefetchingSessions || isRefetchingRestriction;

  const handleRefresh = () => {
    refetchConsent();
    refetchSessions();
    refetchRestriction();
  };

  return (
    <>
      <Stack.Screen options={{ headerTitle: t('title') }} />
      <ScrollView
        style={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: spacing['2xl'], gap: spacing['2xl'] }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}>
        <View style={{ paddingHorizontal: spacing['2xl'], paddingTop: spacing.lg }}>
          <ThemedText variant="footnote" color={colors.tertiaryForeground}>
            {t('description')}
          </ThemedText>
        </View>

        <GroupedSection header={t('tabs.general')}>
          <LanguageCell tCommon={tCommon} />
          <NativeDivider />
          <AppearanceCell tCommon={tCommon} />
          {isMaterialYouAvailable() ? (
            <>
              <NativeDivider />
              <DynamicColorCell />
            </>
          ) : null}
          <NativeDivider />
          <PushNotificationCell t={t} />
          <NativeDivider />
          <CalendarCell t={t} />
        </GroupedSection>

        <ConsentSection header={t('tabs.privacy')} consents={consents} tConsent={tConsent} />

        <DataOverviewSection header={t('privacy.dataOverview.title')} t={t} />

        <GroupedSection header={t('privacy.dataRights.title')}>
          <DataExportCell t={t} />
          <NativeDivider />
          <DataRequestCell t={t} />
          <NativeDivider />
          <ProcessingRestrictionCell t={t} />
          <NativeDivider />
          <ConsentHistoryCell t={t} />
        </GroupedSection>

        <SessionsSection header={t('tabs.account')} t={t} tCommon={tCommon} sessions={sessions} />

        <GroupedSection header={t('dangerZone.title')} footer={t('dangerZone.description')}>
          <DeleteAccountCell t={t} tCommon={tCommon} />
        </GroupedSection>
      </ScrollView>
    </>
  );
}

// ── General ──────────────────────────────────────────────────

function LanguageCell({ tCommon }: { tCommon: TFn }) {
  const router = useRouter();
  const { i18n } = useTranslation();
  const locale = i18n.language as Locale;

  return (
    <ListCell
      label={tCommon('language')}
      value={LOCALE_CONFIG[locale]?.name ?? locale}
      onPress={() => router.push('/(app)/(modals)/settings-language')}
      accessibilityHint={tCommon('language')}
    />
  );
}

const THEME_OPTIONS: ColorSchemePreference[] = ['system', 'light', 'dark'];

function AppearanceCell({ tCommon }: { tCommon: TFn }) {
  const { colorSchemePreference, setColorSchemePreference, isDark } = useTheme();

  const labels: Record<ColorSchemePreference, string> = {
    system: tCommon('system'),
    light: tCommon('light'),
    dark: tCommon('dark'),
  };

  const openPicker = () => {
    showActionSheet(
      tCommon('appearance'),
      THEME_OPTIONS.map((opt) => ({
        label: labels[opt] + (opt === colorSchemePreference ? '  ✓' : ''),
        onPress: () => setColorSchemePreference(opt),
      })),
      tCommon('cancel')
    );
  };

  return (
    <ListCell
      label={tCommon('appearance')}
      value={labels[colorSchemePreference]}
      onPress={openPicker}
      leftContent={
        <NativeIcon
          name={isDark ? 'moon.fill' : 'sun.max.fill'}
          androidName={isDark ? 'dark-mode' : 'light-mode'}
          size={22}
        />
      }
      accessibilityHint={tCommon('appearance')}
    />
  );
}

function DynamicColorCell() {
  const { useDynamicColor, setUseDynamicColor } = useTheme();
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  return (
    <ListCell
      label={tCommon('dynamicColor')}
      rightContent={<NativeToggle isOn={useDynamicColor} onToggle={setUseDynamicColor} />}
      chevron={false}
      leftContent={<NativeIcon name="paintpalette.fill" androidName="palette" size={22} />}
    />
  );
}

function PushNotificationCell({ t }: { t: TFn }) {
  const [enabled, setEnabled] = useState(false);

  const handleToggle = async (value: boolean) => {
    setEnabled(value);
    if (value) {
      const token = await registerForPushNotifications();
      if (!token) setEnabled(false);
    }
  };

  return (
    <ListCell
      label={t('pushNotifications.title')}
      rightContent={<NativeToggle isOn={enabled} onToggle={handleToggle} />}
      chevron={false}
      leftContent={<NativeIcon name="bell.fill" androidName="notifications" size={22} />}
    />
  );
}

function CalendarCell({ t }: { t: TFn }) {
  const router = useRouter();
  return (
    <ListCell
      label={t('calendar.title')}
      onPress={() => router.push('/(app)/(modals)/settings-calendar')}
      leftContent={<NativeIcon name="calendar" androidName="event" size={22} />}
      accessibilityHint={t('calendar.description')}
    />
  );
}

// ── Privacy ──────────────────────────────────────────────────

function ConsentSection({
  header,
  consents,
  tConsent,
}: {
  header: string;
  consents: ActiveConsent[] | undefined;
  tConsent: TFn;
}) {
  const updateConsent = useUpdateConsent();

  return (
    <GroupedSection header={header}>
      {CONSENT_PURPOSES.map((purpose, index) => {
        const consent = consents?.find((c) => c.purpose === purpose);
        const isEssential = purpose === 'essential';

        return (
          <View key={purpose}>
            {index > 0 ? <NativeDivider /> : null}
            <ListCell
              label={tConsent(`purposes.${purpose}.name`)}
              rightContent={
                <NativeToggle
                  isOn={isEssential ? true : (consent?.granted ?? false)}
                  disabled={isEssential || updateConsent.isPending}
                  onToggle={(granted: boolean) => updateConsent.mutate({ purpose, granted })}
                />
              }
              chevron={false}
            />
          </View>
        );
      })}
    </GroupedSection>
  );
}

function DataOverviewSection({ header, t }: { header: string; t: TFn }) {
  const { colors, spacing } = useTheme();

  return (
    <GroupedSection header={header}>
      {DATA_OVERVIEW_CATEGORIES.map((cat, index) => (
        <View key={cat.key}>
          {index > 0 ? <NativeDivider /> : null}
          <View
            style={[
              styles.dataOverviewRow,
              { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, gap: 2 },
            ]}>
            <ThemedText variant="body">
              {t(`privacy.dataOverview.categories.${cat.key}`)}
            </ThemedText>
            <ThemedText variant="caption1" color={colors.tertiaryForeground}>
              {t(`privacy.dataOverview.${cat.basis}`)} ·{' '}
              {t(`privacy.dataOverview.${cat.retention}`)}
            </ThemedText>
          </View>
        </View>
      ))}
    </GroupedSection>
  );
}

function DataExportCell({ t }: { t: TFn }) {
  const exportData = useExportData();

  return (
    <ListCell
      label={t('dataExport.title')}
      onPress={() => {
        hapticFormSubmitSuccess();
        exportData.mutate();
      }}
      accessibilityHint={t('dataExport.description')}
    />
  );
}

function DataRequestCell({ t }: { t: TFn }) {
  const router = useRouter();
  return (
    <ListCell
      label={t('privacy.dataRequest.title')}
      onPress={() => router.push('/(app)/(modals)/settings-data-request')}
      accessibilityHint={t('privacy.dataRequest.description')}
    />
  );
}

function ProcessingRestrictionCell({ t }: { t: TFn }) {
  const router = useRouter();
  const { data: restriction, isPending } = useProcessingRestriction();
  const isRestricted = !!restriction;

  if (isPending) {
    return (
      <View style={styles.loadingCell}>
        <ThemedSkeleton width="60%" height={14} />
      </View>
    );
  }

  return (
    <ListCell
      label={t('privacy.processingRestriction.title')}
      value={isRestricted ? t('privacy.processingRestriction.active') : undefined}
      onPress={() => router.push('/(app)/(modals)/settings-processing-restriction')}
    />
  );
}

function ConsentHistoryCell({ t }: { t: TFn }) {
  const router = useRouter();
  return (
    <ListCell
      label={t('privacy.consentHistory.title')}
      onPress={() => router.push('/(app)/(modals)/settings-consent-history')}
    />
  );
}

// ── Account ──────────────────────────────────────────────────

function parseUserAgent(ua: string | null): { isMobile: boolean; label: string } {
  if (!ua) return { isMobile: true, label: 'OpenHospi App' };
  const isMobile = /mobile|android|iphone|ipad|expo|react.?native|okhttp/i.test(ua);

  if (/expo|react.?native|okhttp/i.test(ua)) return { isMobile: true, label: 'OpenHospi App' };
  if (/safari/i.test(ua) && !/chrome/i.test(ua))
    return { isMobile, label: isMobile ? 'Safari (Mobile)' : 'Safari' };
  if (/firefox/i.test(ua)) return { isMobile, label: isMobile ? 'Firefox (Mobile)' : 'Firefox' };
  if (/edg/i.test(ua)) return { isMobile, label: isMobile ? 'Edge (Mobile)' : 'Edge' };
  if (/chrome/i.test(ua)) return { isMobile, label: isMobile ? 'Chrome (Mobile)' : 'Chrome' };

  return { isMobile, label: isMobile ? 'Mobile device' : 'Desktop' };
}

function SessionsSection({
  header,
  t,
  tCommon,
  sessions,
}: {
  header: string;
  t: TFn;
  tCommon: TFn;
  sessions: SessionInfo[] | undefined;
}) {
  const { colors } = useTheme();
  const revokeSession = useRevokeSession();

  if (!sessions) {
    return (
      <GroupedSection header={header}>
        <View style={styles.loadingCell}>
          <ThemedSkeleton width="80%" height={14} />
          <ThemedSkeleton width="60%" height={14} />
        </View>
      </GroupedSection>
    );
  }

  if (sessions.length === 0) {
    return (
      <GroupedSection header={header}>
        <ListCell label={t('account.sessions.empty')} chevron={false} />
      </GroupedSection>
    );
  }

  return (
    <GroupedSection header={header}>
      {sessions.map((session, index) => {
        const { isMobile, label: deviceLabel } = parseUserAgent(session.userAgent);

        const handleRevoke = session.isCurrent
          ? undefined
          : () => {
              hapticLight();
              showActionSheet(
                deviceLabel,
                [
                  {
                    label: t('account.sessions.revokeButton'),
                    destructive: true,
                    onPress: () => revokeSession.mutate(session.id),
                  },
                ],
                tCommon('cancel')
              );
            };

        return (
          <View key={session.id}>
            {index > 0 ? <NativeDivider /> : null}
            <ListCell
              label={deviceLabel}
              value={
                session.isCurrent
                  ? t('account.sessions.current')
                  : t('account.sessions.lastActive', {
                      date: new Date(session.createdAt).toLocaleDateString(),
                    })
              }
              leftContent={
                <NativeIcon
                  name={isMobile ? 'iphone' : 'desktopcomputer'}
                  androidName={isMobile ? 'smartphone' : 'computer'}
                  size={22}
                  color={colors.tertiaryForeground}
                />
              }
              onPress={handleRevoke}
              chevron={!session.isCurrent}
              accessibilityHint={session.isCurrent ? undefined : t('account.sessions.revokeButton')}
            />
          </View>
        );
      })}
    </GroupedSection>
  );
}

// ── Danger Zone ──────────────────────────────────────────────

function DeleteAccountCell({ t, tCommon }: { t: TFn; tCommon: TFn }) {
  const deleteAccount = useDeleteAccount();

  const handleDelete = () => {
    hapticDelete();
    Alert.alert(t('dangerZone.confirmTitle'), t('dangerZone.confirmDescription'), [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: t('dangerZone.confirmDelete'),
        style: 'destructive',
        onPress: () => {
          hapticDelete();
          Alert.alert(t('dangerZone.confirmTitle'), t('dangerZone.confirmDescription'), [
            { text: tCommon('cancel'), style: 'cancel' },
            {
              text: t('dangerZone.confirmDelete'),
              style: 'destructive',
              onPress: () => {
                deleteAccount.mutate(undefined, {
                  onSuccess: () => {
                    queryClient.clear();
                    authClient.signOut();
                  },
                });
              },
            },
          ]);
        },
      },
    ]);
  };

  return (
    <ListCell
      label={t('dangerZone.deleteButton')}
      destructive
      onPress={handleDelete}
      accessibilityHint={t('dangerZone.confirmDescription')}
    />
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  dataOverviewRow: {},
  loadingCell: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
});
