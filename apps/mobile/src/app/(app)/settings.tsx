import { useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';

import { LOCALE_CONFIG, SUPPORTED_LOCALES, type Locale } from '@openhospi/i18n';

import { AppBottomSheetModal as BottomSheet } from '@/components/shared/bottom-sheet';
import { ThemedBadge } from '@/components/native/badge';
import { NativeButton } from '@/components/native/button';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { NativeToggle } from '@/components/native/toggle';
import { ThemedText } from '@/components/native/text';
import { ThemedTextarea } from '@/components/native/textarea';
import { GroupedSection } from '@/components/layout/grouped-section';
import { ListCell } from '@/components/layout/list-cell';
import { NativeDivider } from '@/components/native/divider';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticDelete, hapticFormSubmitSuccess, hapticLight } from '@/lib/haptics';
import { isIOS } from '@/lib/platform';
import { showActionSheet } from '@/lib/action-sheet';
import { authClient } from '@/lib/auth-client';
import { queryClient } from '@/lib/query-client';
import { registerForPushNotifications } from '@/lib/notifications';
import { API_BASE_URL } from '@/lib/constants';
import {
  useActivateProcessingRestriction,
  useCalendarToken,
  useConsent,
  useConsentHistory,
  useDeleteAccount,
  useExportData,
  useLiftProcessingRestriction,
  useProcessingRestriction,
  useRegenerateCalendarToken,
  useRevokeSession,
  useSessions,
  useSubmitDataRequest,
  useUpdateConsent,
} from '@/services/settings';

const DATA_REQUEST_TYPES = [
  'access',
  'rectification',
  'erasure',
  'restriction',
  'portability',
  'objection',
] as const;

const DATA_OVERVIEW_CATEGORIES = [
  { key: 'profile', basis: 'contract', retention: 'untilDeletion' },
  { key: 'photos', basis: 'contract', retention: 'untilDeletion' },
  { key: 'housing', basis: 'contract', retention: 'untilDeletion' },
  { key: 'applications', basis: 'contract', retention: 'untilDeletion' },
  { key: 'chat', basis: 'contract', retention: 'untilDeletion' },
  { key: 'sessions', basis: 'legitimateInterest', retention: '30days' },
  { key: 'moderation', basis: 'legitimateInterest', retention: '90days' },
] as const;

const CONSENT_PURPOSES = ['essential', 'functional', 'push_notifications', 'analytics'] as const;

export default function SettingsScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.settings' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tConsent } = useTranslation('translation', { keyPrefix: 'app.consent' });
  const { i18n } = useTranslation();
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const locale = i18n.language as Locale;

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
        contentContainerStyle={{ paddingBottom: bottom + 16 }}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}>
        <View style={styles.descriptionWrapper}>
          <ThemedText variant="footnote" color={colors.tertiaryForeground}>
            {t('description')}
          </ThemedText>
        </View>

        {/* General */}
        <SectionHeader title={t('tabs.general')} />
        <GroupedSection>
          <LanguageCell locale={locale} changeLanguage={i18n.changeLanguage} tCommon={tCommon} />
          <NativeDivider />
          <PushNotificationCell t={t} />
          <NativeDivider />
          <CalendarCell t={t} tCommon={tCommon} />
        </GroupedSection>

        {/* Privacy */}
        <SectionHeader title={t('tabs.privacy')} />
        <ConsentSection consents={consents} tConsent={tConsent} />

        <SectionHeader title={t('privacy.dataOverview.title')} />
        <DataOverviewSection t={t} />

        <SectionHeader title={t('privacy.dataRights.title')} />
        <GroupedSection>
          <DataExportCell t={t} />
          <NativeDivider />
          <DataRequestCell t={t} tCommon={tCommon} />
          <NativeDivider />
          <ProcessingRestrictionCell t={t} tCommon={tCommon} />
          <NativeDivider />
          <ConsentHistoryCell t={t} />
        </GroupedSection>

        {/* Account */}
        <SectionHeader title={t('tabs.account')} />
        <SessionsSection t={t} tCommon={tCommon} sessions={sessions} />

        {/* Danger Zone */}
        <SectionHeader title={t('dangerZone.title')} />
        <DeleteAccountSection t={t} tCommon={tCommon} />
      </ScrollView>
    </>
  );
}

// ── Shared sub-components ──────────────────────────────────

type TFn = ReturnType<typeof useTranslation>['t'];

function SectionHeader({ title }: { title: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.sectionHeader}>
      <ThemedText
        variant="footnote"
        color={colors.tertiaryForeground}
        style={styles.sectionHeaderText}>
        {title.toUpperCase()}
      </ThemedText>
    </View>
  );
}

// ── General ────────────────────────────────────────────────

function LanguageCell({
  locale,
  changeLanguage,
  tCommon,
}: {
  locale: Locale;
  changeLanguage: (lng: string) => Promise<unknown>;
  tCommon: TFn;
}) {
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);

  return (
    <>
      <ListCell
        label={tCommon('language')}
        value={LOCALE_CONFIG[locale].name}
        onPress={() => sheetRef.current?.present()}
      />

      <BottomSheet
        ref={sheetRef}
        title={tCommon('language')}
        enableDynamicSizing
        scrollable={false}>
        <View style={styles.sheetContent}>
          {SUPPORTED_LOCALES.map((loc) => (
            <Pressable
              key={loc}
              style={[
                styles.optionRow,
                locale === loc ? { backgroundColor: colors.accent } : undefined,
              ]}
              android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
              onPress={() => {
                hapticLight();
                changeLanguage(loc);
                sheetRef.current?.dismiss();
              }}>
              <ThemedText
                variant="body"
                weight={locale === loc ? '600' : '400'}
                color={locale === loc ? colors.primary : colors.foreground}>
                {LOCALE_CONFIG[loc].name}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    </>
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
    />
  );
}

function CalendarCell({ t, tCommon }: { t: TFn; tCommon: TFn }) {
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const { data: tokenData, isPending } = useCalendarToken();
  const regenerateToken = useRegenerateCalendarToken();

  const handleSubscribe = () => {
    if (!tokenData?.token) return;
    const httpsUrl = `${API_BASE_URL}/api/calendar/${tokenData.token}`;
    const webcalUrl = httpsUrl.replace(/^https?:\/\//, 'webcal://');
    Linking.openURL(webcalUrl);
  };

  const handleRegenerate = () => {
    Alert.alert(t('calendar.regenerateButton'), t('calendar.regenerateConfirm'), [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: tCommon('confirm'),
        onPress: () => {
          regenerateToken.mutate(undefined, {
            onSuccess: () => hapticFormSubmitSuccess(),
          });
        },
      },
    ]);
  };

  return (
    <>
      <ListCell label={t('calendar.title')} onPress={() => sheetRef.current?.present()} />

      <BottomSheet
        ref={sheetRef}
        title={t('calendar.title')}
        enableDynamicSizing
        scrollable={false}>
        <View style={styles.sheetBody}>
          <ThemedText variant="footnote" color={colors.tertiaryForeground}>
            {t('calendar.description')}
          </ThemedText>

          {isPending ? (
            <ThemedSkeleton width="100%" height={44} />
          ) : (
            <>
              <NativeButton
                label={t('calendar.subscribeButton')}
                onPress={handleSubscribe}
                disabled={!tokenData?.token}
              />
              <NativeButton
                label={t('calendar.regenerateButton')}
                variant="outline"
                onPress={handleRegenerate}
                loading={regenerateToken.isPending}
              />
            </>
          )}

          <ThemedText variant="caption1" color={colors.tertiaryForeground}>
            {t('calendar.warning')}
          </ThemedText>
        </View>
      </BottomSheet>
    </>
  );
}

// ── Privacy ────────────────────────────────────────────────

function ConsentSection({
  consents,
  tConsent,
}: {
  consents: { purpose: string; granted: boolean }[] | undefined;
  tConsent: TFn;
}) {
  const updateConsent = useUpdateConsent();

  return (
    <GroupedSection>
      {CONSENT_PURPOSES.map((purpose, index) => {
        const consent = consents?.find((c) => c.purpose === purpose);
        const isEssential = purpose === 'essential';

        return (
          <View key={purpose}>
            {index > 0 && <NativeDivider />}
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

function DataOverviewSection({ t }: { t: TFn }) {
  const { colors } = useTheme();

  return (
    <GroupedSection>
      {DATA_OVERVIEW_CATEGORIES.map((cat, index) => (
        <View key={cat.key}>
          {index > 0 && <NativeDivider />}
          <View style={styles.dataOverviewRow}>
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
    />
  );
}

function DataRequestCell({ t, tCommon }: { t: TFn; tCommon: TFn }) {
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const submitRequest = useSubmitDataRequest();

  const handleSubmit = () => {
    if (!selectedType) return;
    submitRequest.mutate(
      { type: selectedType, description: description || undefined },
      {
        onSuccess: () => {
          hapticFormSubmitSuccess();
          sheetRef.current?.dismiss();
          setSelectedType(null);
          setDescription('');
          Alert.alert(t('privacy.dataRequest.success'));
        },
      }
    );
  };

  return (
    <>
      <ListCell
        label={t('privacy.dataRequest.title')}
        onPress={() => sheetRef.current?.present()}
      />

      <BottomSheet
        ref={sheetRef}
        title={t('privacy.dataRequest.title')}
        snapPoints={['75%']}
        enableDynamicSizing={false}
        footer={
          <View style={styles.sheetFooter}>
            <NativeButton
              label={tCommon('cancel')}
              variant="outline"
              style={styles.footerButton}
              onPress={() => sheetRef.current?.dismiss()}
            />
            <NativeButton
              label={tCommon('submit')}
              style={styles.footerButton}
              onPress={handleSubmit}
              loading={submitRequest.isPending}
              disabled={!selectedType}
            />
          </View>
        }>
        <View style={styles.sheetBody}>
          <View style={styles.sheetSection}>
            <ThemedText variant="subheadline" weight="500" style={styles.sheetLabel}>
              {t('privacy.dataRequest.typeLabel')}
            </ThemedText>
            {DATA_REQUEST_TYPES.map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.optionRow,
                  selectedType === type ? { backgroundColor: colors.accent } : undefined,
                ]}
                android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
                onPress={() => {
                  hapticLight();
                  setSelectedType(type);
                }}>
                <ThemedText
                  variant="body"
                  weight={selectedType === type ? '500' : '400'}
                  color={selectedType === type ? colors.primary : colors.foreground}>
                  {t(`privacy.dataRequest.types.${type}`)}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <View style={styles.sheetSection}>
            <ThemedText variant="subheadline" weight="500" style={styles.sheetLabel}>
              {t('privacy.dataRequest.descriptionLabel')}
            </ThemedText>
            <ThemedTextarea
              placeholder={t('privacy.dataRequest.descriptionPlaceholder')}
              value={description}
              onChangeText={setDescription}
              minHeight={80}
            />
          </View>
        </View>
      </BottomSheet>
    </>
  );
}

function ProcessingRestrictionCell({ t, tCommon }: { t: TFn; tCommon: TFn }) {
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [reason, setReason] = useState('');
  const { data: restriction, isPending } = useProcessingRestriction();
  const activateRestriction = useActivateProcessingRestriction();
  const liftRestriction = useLiftProcessingRestriction();

  const isRestricted = !!restriction;

  const handleActivate = () => {
    if (reason.length < 10) return;
    activateRestriction.mutate(
      { reason },
      {
        onSuccess: () => {
          hapticFormSubmitSuccess();
          sheetRef.current?.dismiss();
          setReason('');
          Alert.alert(t('privacy.processingRestriction.activateSuccess'));
        },
      }
    );
  };

  const handleLift = () => {
    liftRestriction.mutate(undefined, {
      onSuccess: () => {
        hapticFormSubmitSuccess();
        sheetRef.current?.dismiss();
        Alert.alert(t('privacy.processingRestriction.liftSuccess'));
      },
    });
  };

  if (isPending) {
    return (
      <View style={styles.loadingCell}>
        <ThemedSkeleton width="60%" height={14} />
      </View>
    );
  }

  return (
    <>
      <ListCell
        label={t('privacy.processingRestriction.title')}
        value={isRestricted ? t('privacy.processingRestriction.active') : undefined}
        onPress={() => sheetRef.current?.present()}
      />

      <BottomSheet
        ref={sheetRef}
        title={t('privacy.processingRestriction.title')}
        enableDynamicSizing
        scrollable={false}>
        <View style={styles.sheetBody}>
          <ThemedText variant="footnote" color={colors.tertiaryForeground}>
            {t('privacy.processingRestriction.description')}
          </ThemedText>

          {isRestricted ? (
            <>
              <ThemedBadge variant="warning" label={t('privacy.processingRestriction.active')} />
              <NativeButton
                label={t('privacy.processingRestriction.liftButton')}
                variant="outline"
                onPress={handleLift}
                loading={liftRestriction.isPending}
              />
            </>
          ) : (
            <>
              <ThemedTextarea
                placeholder={t('privacy.processingRestriction.reasonPlaceholder')}
                value={reason}
                onChangeText={setReason}
                minHeight={80}
              />
              <NativeButton
                label={t('privacy.processingRestriction.activateButton')}
                variant="destructive"
                onPress={handleActivate}
                loading={activateRestriction.isPending}
                disabled={reason.length < 10}
              />
            </>
          )}
        </View>
      </BottomSheet>
    </>
  );
}

function ConsentHistoryCell({ t }: { t: TFn }) {
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const { data: history, isPending } = useConsentHistory();

  return (
    <>
      <ListCell
        label={t('privacy.consentHistory.title')}
        onPress={() => sheetRef.current?.present()}
      />

      <BottomSheet
        ref={sheetRef}
        title={t('privacy.consentHistory.title')}
        snapPoints={['60%']}
        enableDynamicSizing={false}>
        <View style={styles.sheetBody}>
          {isPending ? (
            <View style={styles.loadingCell}>
              <ThemedSkeleton width="80%" height={14} />
              <ThemedSkeleton width="60%" height={14} />
              <ThemedSkeleton width="70%" height={14} />
            </View>
          ) : !history?.length ? (
            <ThemedText variant="footnote" color={colors.tertiaryForeground}>
              {t('privacy.consentHistory.empty')}
            </ThemedText>
          ) : (
            history.map((record, index) => (
              <View key={record.id ?? index}>
                {index > 0 && <NativeDivider />}
                <View style={styles.historyRow}>
                  <View style={styles.historyInfo}>
                    <ThemedText variant="body">{record.purpose}</ThemedText>
                    <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                      {new Date(record.createdAt).toLocaleDateString()}
                    </ThemedText>
                  </View>
                  <ThemedBadge
                    variant={record.granted ? 'success' : 'secondary'}
                    label={
                      record.granted
                        ? t('privacy.consentHistory.granted')
                        : t('privacy.consentHistory.revoked')
                    }
                  />
                </View>
              </View>
            ))
          )}
        </View>
      </BottomSheet>
    </>
  );
}

// ── Account ────────────────────────────────────────────────

function parseUserAgent(ua: string | null): { isMobile: boolean; label: string } {
  if (!ua) return { isMobile: true, label: 'OpenHospi App' };
  const isMobile = /mobile|android|iphone|ipad|expo|react.?native|okhttp/i.test(ua);

  // React Native / Expo app sessions
  if (/expo|react.?native|okhttp/i.test(ua)) return { isMobile: true, label: 'OpenHospi App' };

  // Browsers
  if (/safari/i.test(ua) && !/chrome/i.test(ua))
    return { isMobile, label: isMobile ? 'Safari (Mobile)' : 'Safari' };
  if (/firefox/i.test(ua)) return { isMobile, label: isMobile ? 'Firefox (Mobile)' : 'Firefox' };
  if (/edg/i.test(ua)) return { isMobile, label: isMobile ? 'Edge (Mobile)' : 'Edge' };
  if (/chrome/i.test(ua)) return { isMobile, label: isMobile ? 'Chrome (Mobile)' : 'Chrome' };

  return { isMobile, label: isMobile ? 'Mobile device' : 'Desktop' };
}

function SessionsSection({
  t,
  tCommon,
  sessions,
}: {
  t: TFn;
  tCommon: TFn;
  sessions: any[] | undefined;
}) {
  const { colors } = useTheme();
  const revokeSession = useRevokeSession();

  if (!sessions) {
    return (
      <GroupedSection>
        <View style={styles.loadingCell}>
          <ThemedSkeleton width="80%" height={14} />
          <ThemedSkeleton width="60%" height={14} />
        </View>
      </GroupedSection>
    );
  }

  if (sessions.length === 0) {
    return (
      <GroupedSection>
        <ListCell label={t('account.sessions.empty')} chevron={false} />
      </GroupedSection>
    );
  }

  return (
    <GroupedSection>
      {sessions.map((session: any, index: number) => {
        const { isMobile, label: deviceLabel } = parseUserAgent(session.userAgent);
        const icon = isIOS ? (
          <SymbolView
            name={isMobile ? 'iphone' : 'desktopcomputer'}
            size={18}
            tintColor={colors.tertiaryForeground}
          />
        ) : (
          <MaterialIcons
            name={isMobile ? 'smartphone' : 'computer'}
            size={18}
            color={colors.tertiaryForeground}
          />
        );

        const handleRevoke = session.isCurrent
          ? undefined
          : () => {
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
            {index > 0 && <NativeDivider />}
            <ListCell
              label={deviceLabel}
              value={
                session.isCurrent
                  ? t('account.sessions.current')
                  : t('account.sessions.lastActive', {
                      date: new Date(session.createdAt).toLocaleDateString(),
                    })
              }
              leftContent={icon}
              onPress={handleRevoke}
              chevron={!session.isCurrent}
            />
          </View>
        );
      })}
    </GroupedSection>
  );
}

// ── Danger Zone ────────────────────────────────────────────

function DeleteAccountSection({ t, tCommon }: { t: TFn; tCommon: TFn }) {
  const deleteAccount = useDeleteAccount();

  const handleDelete = () => {
    hapticDelete();
    Alert.alert(t('dangerZone.confirmTitle'), t('dangerZone.confirmDescription'), [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: t('dangerZone.confirmDelete'),
        style: 'destructive',
        onPress: () => {
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
    <GroupedSection>
      <ListCell label={t('dangerZone.deleteButton')} destructive onPress={handleDelete} />
    </GroupedSection>
  );
}

// ── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  descriptionWrapper: {
    paddingHorizontal: 32,
    paddingTop: 16,
  },
  sectionHeader: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionHeaderText: {
    letterSpacing: 0.5,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sheetBody: {
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sheetSection: {
    gap: 8,
  },
  sheetLabel: {
    marginBottom: 4,
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
  optionRow: {
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
  },
  dataOverviewRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 2,
  },
  loadingCell: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  historyInfo: {
    flex: 1,
    gap: 2,
  },
});
