import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LOCALE_CONFIG, SUPPORTED_LOCALES, type Locale } from '@openhospi/i18n';

import { useLocale, useTranslations } from '@/i18n';
import { authClient } from '@/lib/auth-client';
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
  const t = useTranslations('app.settings');
  const tCommon = useTranslations('common.labels');
  const tConsent = useTranslations('app.consent');
  const router = useRouter();
  const { locale, setLocale } = useLocale();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-4 pt-4">
          <Text className="text-sm text-muted-foreground">{t('description')}</Text>
        </View>

        {/* General */}
        <SectionHeader title={t('tabs.general')} />
        <LanguageSetting locale={locale} setLocale={setLocale} t={t} />
        <PushNotificationSetting t={t} />

        {/* Privacy & Data */}
        <SectionHeader title={t('tabs.privacy')} />
        <ConsentSection t={t} tConsent={tConsent} />
        <DataExportSetting t={t} />
        <DataRequestSetting t={t} tCommon={tCommon} />

        {/* Account */}
        <SectionHeader title={t('tabs.account')} />
        <SessionsSection t={t} tCommon={tCommon} />

        {/* Danger Zone */}
        <SectionHeader title={t('dangerZone.title')} />
        <DeleteAccountSetting t={t} tCommon={tCommon} router={router} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View className="px-4 pb-2 pt-6">
      <Text className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </Text>
    </View>
  );
}

function LanguageSetting({
  locale,
  setLocale,
  t,
}: {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View className="mx-4 rounded-xl border border-border bg-card p-4">
      <Pressable
        className="flex-row items-center justify-between"
        onPress={() => setShowPicker(true)}
      >
        <Text className="text-base text-foreground">{t('tabs.general')}</Text>
        <Text className="text-base text-muted-foreground">{LOCALE_CONFIG[locale].name}</Text>
      </Pressable>

      <Modal visible={showPicker} transparent animationType="fade">
        <Pressable
          className="flex-1 items-center justify-center bg-black/50"
          onPress={() => setShowPicker(false)}
        >
          <View className="mx-8 w-full max-w-xs rounded-xl bg-card p-4">
            {SUPPORTED_LOCALES.map((loc) => (
              <Pressable
                key={loc}
                className={`flex-row items-center gap-3 rounded-lg px-4 py-3 ${locale === loc ? 'bg-primary/10' : ''}`}
                onPress={() => {
                  setLocale(loc);
                  setShowPicker(false);
                }}
              >
                <Text
                  className={`text-base ${locale === loc ? 'font-semibold text-primary' : 'text-foreground'}`}
                >
                  {LOCALE_CONFIG[loc].name}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function PushNotificationSetting({ t }: { t: ReturnType<typeof useTranslations> }) {
  const [enabled, setEnabled] = useState(false);

  const handleToggle = useCallback(async (value: boolean) => {
    setEnabled(value);
    if (value) {
      const token = await registerForPushNotifications();
      if (!token) setEnabled(false);
    }
  }, []);

  return (
    <View className="mx-4 mt-3 flex-row items-center justify-between rounded-xl border border-border bg-card p-4">
      <Text className="text-base text-foreground">{t('pushNotifications.title')}</Text>
      <Switch value={enabled} onValueChange={handleToggle} />
    </View>
  );
}

function ConsentSection({
  t,
  tConsent,
}: {
  t: ReturnType<typeof useTranslations>;
  tConsent: ReturnType<typeof useTranslations>;
}) {
  const { data: consents, isPending } = useConsent();
  const updateConsent = useUpdateConsent();

  if (isPending) {
    return (
      <View className="mx-4 items-center rounded-xl border border-border bg-card p-4">
        <ActivityIndicator />
      </View>
    );
  }

  const purposes = ['essential', 'functional', 'push_notifications', 'analytics'] as const;

  return (
    <View className="mx-4 rounded-xl border border-border bg-card">
      <View className="p-4 pb-2">
        <Text className="text-base font-semibold text-foreground">
          {t('privacy.consentManagement.title')}
        </Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          {t('privacy.consentManagement.description')}
        </Text>
      </View>
      {purposes.map((purpose) => {
        const consent = consents?.find((c) => c.purpose === purpose);
        const isEssential = purpose === 'essential';

        return (
          <View
            key={purpose}
            className="flex-row items-center justify-between border-t border-border px-4 py-3"
          >
            <View className="flex-1 pr-4">
              <Text className="text-sm font-medium text-foreground">
                {tConsent(`purposes.${purpose}.name`)}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {tConsent(`purposes.${purpose}.description`)}
              </Text>
            </View>
            <Switch
              value={isEssential ? true : (consent?.granted ?? false)}
              disabled={isEssential || updateConsent.isPending}
              onValueChange={(granted) => updateConsent.mutate({ purpose, granted })}
            />
          </View>
        );
      })}
    </View>
  );
}

function DataExportSetting({ t }: { t: ReturnType<typeof useTranslations> }) {
  const exportData = useExportData();

  return (
    <View className="mx-4 mt-3 rounded-xl border border-border bg-card p-4">
      <Text className="text-base font-semibold text-foreground">{t('dataExport.title')}</Text>
      <Text className="mt-1 text-sm text-muted-foreground">{t('dataExport.description')}</Text>
      <Pressable
        className="mt-3 self-start rounded-lg bg-primary px-4 py-2"
        onPress={() => exportData.mutate()}
        disabled={exportData.isPending}
      >
        <Text className="text-sm font-medium text-primary-foreground">
          {exportData.isPending ? '...' : t('dataExport.button')}
        </Text>
      </Pressable>
    </View>
  );
}

function DataRequestSetting({
  t,
  tCommon,
}: {
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}) {
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const submitRequest = useSubmitDataRequest();

  const handleSubmit = () => {
    if (!selectedType) return;
    submitRequest.mutate(
      { type: selectedType, description: description || undefined },
      {
        onSuccess: () => {
          setShowModal(false);
          setSelectedType(null);
          setDescription('');
          Alert.alert(t('privacy.dataRequest.success'));
        },
      },
    );
  };

  return (
    <View className="mx-4 mt-3 rounded-xl border border-border bg-card p-4">
      <Text className="text-base font-semibold text-foreground">
        {t('privacy.dataRequest.title')}
      </Text>
      <Text className="mt-1 text-sm text-muted-foreground">
        {t('privacy.dataRequest.description')}
      </Text>
      <Pressable
        className="mt-3 self-start rounded-lg border border-border px-4 py-2"
        onPress={() => setShowModal(true)}
      >
        <Text className="text-sm font-medium text-foreground">
          {t('privacy.dataRequest.submitButton')}
        </Text>
      </Pressable>

      <Modal visible={showModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-2xl bg-card px-4 pb-8 pt-6">
            <Text className="mb-4 text-lg font-semibold text-foreground">
              {t('privacy.dataRequest.title')}
            </Text>

            <Text className="mb-2 text-sm font-medium text-foreground">
              {t('privacy.dataRequest.typeLabel')}
            </Text>
            {DATA_REQUEST_TYPES.map((type) => (
              <Pressable
                key={type}
                className={`mb-1 rounded-lg px-3 py-2.5 ${selectedType === type ? 'bg-primary/10' : ''}`}
                onPress={() => setSelectedType(type)}
              >
                <Text
                  className={`text-sm ${selectedType === type ? 'font-medium text-primary' : 'text-foreground'}`}
                >
                  {t(`privacy.dataRequest.types.${type}`)}
                </Text>
              </Pressable>
            ))}

            <Text className="mb-2 mt-3 text-sm font-medium text-foreground">
              {t('privacy.dataRequest.descriptionLabel')}
            </Text>
            <TextInput
              className="rounded-lg border border-border bg-background p-3 text-sm text-foreground"
              placeholder={t('privacy.dataRequest.descriptionPlaceholder')}
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />

            <View className="mt-4 flex-row gap-3">
              <Pressable
                className="flex-1 rounded-lg border border-border py-3"
                onPress={() => setShowModal(false)}
              >
                <Text className="text-center text-sm font-medium text-foreground">
                  {tCommon('cancel')}
                </Text>
              </Pressable>
              <Pressable
                className="flex-1 rounded-lg bg-primary py-3"
                onPress={handleSubmit}
                disabled={!selectedType || submitRequest.isPending}
              >
                <Text className="text-center text-sm font-medium text-primary-foreground">
                  {submitRequest.isPending ? '...' : tCommon('submit')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SessionsSection({
  t,
  tCommon,
}: {
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}) {
  const { data: sessions, isPending } = useSessions();
  const revokeSession = useRevokeSession();

  return (
    <View className="mx-4 rounded-xl border border-border bg-card">
      <View className="p-4 pb-2">
        <Text className="text-base font-semibold text-foreground">
          {t('account.sessions.title')}
        </Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          {t('account.sessions.description')}
        </Text>
      </View>

      {isPending ? (
        <View className="items-center p-4">
          <ActivityIndicator />
        </View>
      ) : !sessions?.length ? (
        <View className="px-4 pb-4">
          <Text className="text-sm text-muted-foreground">{t('account.sessions.empty')}</Text>
        </View>
      ) : (
        sessions.map((session) => (
          <View
            key={session.id}
            className="flex-row items-center justify-between border-t border-border px-4 py-3"
          >
            <View className="flex-1 pr-3">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                  {session.userAgent ?? 'Unknown device'}
                </Text>
                {session.isCurrent && (
                  <View className="rounded-full bg-primary/10 px-2 py-0.5">
                    <Text className="text-xs font-medium text-primary">
                      {t('account.sessions.current')}
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-xs text-muted-foreground">
                {t('account.sessions.lastActive', {
                  date: new Date(session.createdAt).toLocaleDateString(),
                })}
              </Text>
            </View>
            {!session.isCurrent && (
              <Pressable
                className="rounded-lg border border-destructive px-3 py-1.5"
                onPress={() => revokeSession.mutate(session.id)}
                disabled={revokeSession.isPending}
              >
                <Text className="text-xs font-medium text-destructive">
                  {t('account.sessions.revokeButton')}
                </Text>
              </Pressable>
            )}
          </View>
        ))
      )}
    </View>
  );
}

function DeleteAccountSetting({
  t,
  tCommon,
  router,
}: {
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
  router: ReturnType<typeof useRouter>;
}) {
  const deleteAccount = useDeleteAccount();

  const handleDelete = () => {
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
                    authClient.signOut();
                    router.replace('/(auth)/login');
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
    <View className="mx-4 rounded-xl border border-destructive/30 bg-card p-4">
      <Text className="text-sm text-muted-foreground">{t('dangerZone.description')}</Text>
      <Pressable
        className="mt-3 self-start rounded-lg bg-destructive px-4 py-2"
        onPress={handleDelete}
        disabled={deleteAccount.isPending}
      >
        <Text className="text-sm font-medium text-destructive-foreground">
          {deleteAccount.isPending ? '...' : t('dangerZone.deleteButton')}
        </Text>
      </Pressable>
    </View>
  );
}
