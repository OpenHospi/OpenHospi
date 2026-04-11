import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { LOCALE_CONFIG, SUPPORTED_LOCALES, type Locale } from '@openhospi/i18n';

import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import {
  AppBottomSheetModal as BottomSheet,
  type BottomSheetModal,
} from '@/components/shared/bottom-sheet';
import { ThemedBadge } from '@/components/primitives/themed-badge';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedSkeleton } from '@/components/primitives/themed-skeleton';
import { ThemedSwitch } from '@/components/primitives/themed-switch';
import { ThemedText } from '@/components/primitives/themed-text';
import { ThemedTextarea } from '@/components/primitives/themed-textarea';
import { GroupedSection } from '@/components/layout/grouped-section';
import { ListCell } from '@/components/layout/list-cell';
import { ListSeparator } from '@/components/layout/list-separator';
import { useTheme } from '@/design';
import { hapticDelete, hapticFormSubmitSuccess, hapticLight } from '@/lib/haptics';
import { authClient } from '@/lib/auth-client';
import { queryClient } from '@/lib/query-client';
import { registerForPushNotifications } from '@/lib/notifications';
import {
  useConsent,
  useDeleteAccount,
  useExportData,
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

export default function SettingsScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.settings' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tConsent } = useTranslation('translation', { keyPrefix: 'app.consent' });
  const { i18n } = useTranslation();
  const { colors } = useTheme();
  const locale = i18n.language as Locale;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}>
      <View style={styles.descriptionWrapper}>
        <ThemedText variant="footnote" color={colors.tertiaryForeground}>
          {t('description')}
        </ThemedText>
      </View>

      <SectionTitle title={t('tabs.general')} />
      <LanguageSetting locale={locale} changeLanguage={i18n.changeLanguage} t={t} />
      <View style={styles.sectionGap} />
      <PushNotificationSetting t={t} />

      <SectionTitle title={t('tabs.privacy')} />
      <ConsentSection t={t} tConsent={tConsent} />
      <View style={styles.sectionGap} />
      <DataExportSetting t={t} />
      <View style={styles.sectionGap} />
      <DataRequestSetting t={t} tCommon={tCommon} />

      <SectionTitle title={t('tabs.account')} />
      <SessionsSection t={t} tCommon={tCommon} />

      <SectionTitle title={t('dangerZone.title')} />
      <DeleteAccountSetting t={t} tCommon={tCommon} />
    </ScrollView>
  );
}

function SectionTitle({ title }: { title: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.sectionTitleWrapper}>
      <ThemedText
        variant="footnote"
        color={colors.tertiaryForeground}
        style={styles.sectionTitleText}>
        {title.toUpperCase()}
      </ThemedText>
    </View>
  );
}

function LanguageSetting({
  locale,
  changeLanguage,
  t,
}: {
  locale: Locale;
  changeLanguage: (lng: string) => Promise<TFunction>;
  t: TFunction;
}) {
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);

  return (
    <GroupedSection>
      <ListCell
        label={t('tabs.general')}
        value={LOCALE_CONFIG[locale].name}
        onPress={() => sheetRef.current?.present()}
      />

      <BottomSheet ref={sheetRef} title={t('tabs.general')} enableDynamicSizing scrollable={false}>
        <View style={styles.sheetContent}>
          {SUPPORTED_LOCALES.map((loc) => (
            <Pressable
              key={loc}
              style={[
                styles.localeRow,
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
    </GroupedSection>
  );
}

function PushNotificationSetting({ t }: { t: TFunction }) {
  const [enabled, setEnabled] = useState(false);

  const handleToggle = useCallback(async (value: boolean) => {
    setEnabled(value);
    if (value) {
      const token = await registerForPushNotifications();
      if (!token) setEnabled(false);
    }
  }, []);

  return (
    <GroupedSection>
      <ListCell
        label={t('pushNotifications.title')}
        rightContent={<ThemedSwitch value={enabled} onValueChange={handleToggle} />}
      />
    </GroupedSection>
  );
}

function ConsentSection({ t, tConsent }: { t: TFunction; tConsent: TFunction }) {
  const { colors } = useTheme();
  const { data: consents, isPending } = useConsent();
  const updateConsent = useUpdateConsent();

  if (isPending) {
    return (
      <GroupedSection>
        <View style={styles.loadingCell}>
          <ThemedSkeleton width="60%" height={14} />
          <ThemedSkeleton width="40%" height={14} />
          <ThemedSkeleton width="50%" height={14} />
        </View>
      </GroupedSection>
    );
  }

  const purposes = ['essential', 'functional', 'push_notifications', 'analytics'] as const;

  return (
    <GroupedSection>
      <View style={styles.consentHeader}>
        <ThemedText variant="headline">{t('privacy.consentManagement.title')}</ThemedText>
        <ThemedText variant="footnote" color={colors.tertiaryForeground}>
          {t('privacy.consentManagement.description')}
        </ThemedText>
      </View>
      {purposes.map((purpose, index) => {
        const consent = consents?.find((c: { purpose: string }) => c.purpose === purpose);
        const isEssential = purpose === 'essential';

        return (
          <View key={purpose}>
            <ListSeparator />
            <View style={styles.consentRow}>
              <View style={styles.consentLabel}>
                <ThemedText variant="body">{tConsent(`purposes.${purpose}.name`)}</ThemedText>
                <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                  {tConsent(`purposes.${purpose}.description`)}
                </ThemedText>
              </View>
              <ThemedSwitch
                value={isEssential ? true : (consent?.granted ?? false)}
                disabled={isEssential || updateConsent.isPending}
                onValueChange={(granted: boolean) => updateConsent.mutate({ purpose, granted })}
              />
            </View>
          </View>
        );
      })}
    </GroupedSection>
  );
}

function DataExportSetting({ t }: { t: TFunction }) {
  const exportData = useExportData();

  return (
    <GroupedSection>
      <View style={styles.cardContent}>
        <ThemedText variant="headline">{t('dataExport.title')}</ThemedText>
        <ThemedText variant="footnote" color={useTheme().colors.tertiaryForeground}>
          {t('dataExport.description')}
        </ThemedText>
        <ThemedButton
          size="sm"
          style={styles.inlineButton}
          onPress={() => {
            hapticFormSubmitSuccess();
            exportData.mutate();
          }}
          loading={exportData.isPending}>
          {t('dataExport.button')}
        </ThemedButton>
      </View>
    </GroupedSection>
  );
}

function DataRequestSetting({ t, tCommon }: { t: TFunction; tCommon: TFunction }) {
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
    <GroupedSection>
      <View style={styles.cardContent}>
        <ThemedText variant="headline">{t('privacy.dataRequest.title')}</ThemedText>
        <ThemedText variant="footnote" color={colors.tertiaryForeground}>
          {t('privacy.dataRequest.description')}
        </ThemedText>
        <ThemedButton
          variant="outline"
          size="sm"
          style={styles.inlineButton}
          onPress={() => sheetRef.current?.present()}>
          {t('privacy.dataRequest.submitButton')}
        </ThemedButton>
      </View>

      <BottomSheet
        ref={sheetRef}
        title={t('privacy.dataRequest.title')}
        snapPoints={['75%']}
        footer={
          <View style={styles.sheetFooter}>
            <ThemedButton
              variant="outline"
              style={styles.footerButton}
              onPress={() => sheetRef.current?.dismiss()}>
              {tCommon('cancel')}
            </ThemedButton>
            <ThemedButton
              style={styles.footerButton}
              onPress={handleSubmit}
              loading={submitRequest.isPending}
              disabled={!selectedType}>
              {tCommon('submit')}
            </ThemedButton>
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
                  styles.typeOption,
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
    </GroupedSection>
  );
}

function SessionsSection({ t, tCommon }: { t: TFunction; tCommon: TFunction }) {
  const { colors } = useTheme();
  const { data: sessions, isPending } = useSessions();
  const revokeSession = useRevokeSession();

  return (
    <GroupedSection>
      <View style={styles.consentHeader}>
        <ThemedText variant="headline">{t('account.sessions.title')}</ThemedText>
        <ThemedText variant="footnote" color={colors.tertiaryForeground}>
          {t('account.sessions.description')}
        </ThemedText>
      </View>

      {isPending ? (
        <View style={styles.loadingCell}>
          <ThemedSkeleton width="80%" height={14} />
          <ThemedSkeleton width="60%" height={14} />
        </View>
      ) : !sessions?.length ? (
        <View style={styles.emptyCell}>
          <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
            {t('account.sessions.empty')}
          </ThemedText>
        </View>
      ) : (
        sessions.map((session: any) => (
          <View key={session.id}>
            <ListSeparator />
            <View style={styles.sessionRow}>
              <View style={styles.sessionInfo}>
                <View style={styles.sessionNameRow}>
                  <ThemedText variant="body" numberOfLines={1} style={styles.sessionName}>
                    {session.userAgent ?? 'Unknown device'}
                  </ThemedText>
                  {session.isCurrent && (
                    <ThemedBadge variant="secondary" label={t('account.sessions.current')} />
                  )}
                </View>
                <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                  {t('account.sessions.lastActive', {
                    date: new Date(session.createdAt).toLocaleDateString(),
                  })}
                </ThemedText>
              </View>
              {!session.isCurrent && (
                <ThemedButton
                  variant="outline"
                  size="sm"
                  onPress={() => revokeSession.mutate(session.id)}
                  loading={revokeSession.isPending}>
                  <ThemedText variant="caption1" weight="500" color={colors.destructive}>
                    {t('account.sessions.revokeButton')}
                  </ThemedText>
                </ThemedButton>
              )}
            </View>
          </View>
        ))
      )}
    </GroupedSection>
  );
}

function DeleteAccountSetting({ t, tCommon }: { t: TFunction; tCommon: TFunction }) {
  const { colors } = useTheme();
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
      <View style={styles.cardContent}>
        <ThemedText variant="footnote" color={colors.tertiaryForeground}>
          {t('dangerZone.description')}
        </ThemedText>
        <ThemedButton
          variant="destructive"
          size="sm"
          style={styles.inlineButton}
          onPress={handleDelete}
          loading={deleteAccount.isPending}>
          {t('dangerZone.deleteButton')}
        </ThemedButton>
      </View>
    </GroupedSection>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  descriptionWrapper: {
    paddingHorizontal: 32,
    paddingTop: 16,
  },
  sectionTitleWrapper: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitleText: {
    letterSpacing: 0.5,
  },
  sectionGap: {
    height: 12,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  localeRow: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  consentHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 4,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  consentLabel: {
    flex: 1,
    paddingRight: 16,
    gap: 2,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  inlineButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  loadingCell: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  emptyCell: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sessionInfo: {
    flex: 1,
    paddingRight: 12,
    gap: 2,
  },
  sessionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionName: {
    flex: 1,
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  footerButton: {
    flex: 1,
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
  typeOption: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
  },
});
