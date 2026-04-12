import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { LOCALE_CONFIG, SUPPORTED_LOCALES, type Locale } from '@openhospi/i18n';

import { useTranslation } from 'react-i18next';
import {
  AppBottomSheetModal as BottomSheet,
  type BottomSheetModal,
} from '@/components/shared/bottom-sheet';
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

      {/* General */}
      <SectionHeader title={t('tabs.general')} />
      <GroupedSection>
        <LanguageCell locale={locale} changeLanguage={i18n.changeLanguage} t={t} />
        <NativeDivider />
        <PushNotificationCell t={t} />
      </GroupedSection>

      {/* Privacy */}
      <SectionHeader title={t('tabs.privacy')} />
      <ConsentSection t={t} tConsent={tConsent} />

      <GroupedSection>
        <DataExportCell t={t} />
      </GroupedSection>

      <GroupedSection>
        <DataRequestCell t={t} tCommon={tCommon} />
      </GroupedSection>

      {/* Account */}
      <SectionHeader title={t('tabs.account')} />
      <SessionsSection t={t} tCommon={tCommon} />

      {/* Danger Zone */}
      <SectionHeader title={t('dangerZone.title')} />
      <DeleteAccountSection t={t} tCommon={tCommon} />
    </ScrollView>
  );
}

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

function LanguageCell({
  locale,
  changeLanguage,
  t,
}: {
  locale: Locale;
  changeLanguage: (lng: string) => Promise<unknown>;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);

  return (
    <>
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
    </>
  );
}

function PushNotificationCell({ t }: { t: ReturnType<typeof useTranslation>['t'] }) {
  const [enabled, setEnabled] = useState(false);

  const handleToggle = useCallback(async (value: boolean) => {
    setEnabled(value);
    if (value) {
      const token = await registerForPushNotifications();
      if (!token) setEnabled(false);
    }
  }, []);

  return (
    <ListCell
      label={t('pushNotifications.title')}
      rightContent={<NativeToggle isOn={enabled} onToggle={handleToggle} />}
      chevron={false}
    />
  );
}

function ConsentSection({
  t,
  tConsent,
}: {
  t: ReturnType<typeof useTranslation>['t'];
  tConsent: ReturnType<typeof useTranslation>['t'];
}) {
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
      {purposes.map((purpose, index) => {
        const consent = consents?.find((c: { purpose: string }) => c.purpose === purpose);
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

function DataExportCell({ t }: { t: ReturnType<typeof useTranslation>['t'] }) {
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

function DataRequestCell({
  t,
  tCommon,
}: {
  t: ReturnType<typeof useTranslation>['t'];
  tCommon: ReturnType<typeof useTranslation>['t'];
}) {
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
    </>
  );
}

function SessionsSection({
  t,
  tCommon,
}: {
  t: ReturnType<typeof useTranslation>['t'];
  tCommon: ReturnType<typeof useTranslation>['t'];
}) {
  const { colors } = useTheme();
  const { data: sessions, isPending } = useSessions();
  const revokeSession = useRevokeSession();

  if (isPending) {
    return (
      <GroupedSection>
        <View style={styles.loadingCell}>
          <ThemedSkeleton width="80%" height={14} />
          <ThemedSkeleton width="60%" height={14} />
        </View>
      </GroupedSection>
    );
  }

  if (!sessions?.length) {
    return (
      <GroupedSection>
        <ListCell label={t('account.sessions.empty')} chevron={false} />
      </GroupedSection>
    );
  }

  return (
    <GroupedSection>
      {sessions.map((session: any, index: number) => (
        <View key={session.id}>
          {index > 0 && <NativeDivider />}
          <ListCell
            label={session.userAgent ?? 'Unknown device'}
            value={t('account.sessions.lastActive', {
              date: new Date(session.createdAt).toLocaleDateString(),
            })}
            rightContent={
              session.isCurrent ? (
                <ThemedBadge variant="secondary" label={t('account.sessions.current')} />
              ) : (
                <NativeButton
                  label={t('account.sessions.revokeButton')}
                  variant="destructive"
                  size="sm"
                  onPress={() => revokeSession.mutate(session.id)}
                  loading={revokeSession.isPending}
                />
              )
            }
            chevron={false}
          />
        </View>
      ))}
    </GroupedSection>
  );
}

function DeleteAccountSection({
  t,
  tCommon,
}: {
  t: ReturnType<typeof useTranslation>['t'];
  tCommon: ReturnType<typeof useTranslation>['t'];
}) {
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
  localeRow: {
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingCell: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
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
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
  },
});
