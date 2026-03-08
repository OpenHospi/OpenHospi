import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LOCALE_CONFIG, SUPPORTED_LOCALES, type Locale } from '@openhospi/i18n';

import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
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
  const { t } = useTranslation('translation', { keyPrefix: 'app.settings' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tConsent } = useTranslation('translation', { keyPrefix: 'app.consent' });
  const router = useRouter();
  const { i18n } = useTranslation();
  const locale = i18n.language as Locale;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-4 pt-4">
          <Text variant="muted">{t('description')}</Text>
        </View>

        <SectionHeader title={t('tabs.general')} />
        <LanguageSetting locale={locale} changeLanguage={i18n.changeLanguage} t={t} />
        <PushNotificationSetting t={t} />

        <SectionHeader title={t('tabs.privacy')} />
        <ConsentSection t={t} tConsent={tConsent} />
        <DataExportSetting t={t} />
        <DataRequestSetting t={t} tCommon={tCommon} />

        <SectionHeader title={t('tabs.account')} />
        <SessionsSection t={t} tCommon={tCommon} />

        <SectionHeader title={t('dangerZone.title')} />
        <DeleteAccountSetting t={t} tCommon={tCommon} router={router} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View className="px-4 pb-2 pt-6">
      <Text variant="muted" className="text-sm font-semibold uppercase tracking-wide">
        {title}
      </Text>
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
  const [showPicker, setShowPicker] = useState(false);

  return (
    <Card className="mx-4">
      <CardContent>
        <Pressable
          className="flex-row items-center justify-between"
          onPress={() => setShowPicker(true)}
        >
          <Text>{t('tabs.general')}</Text>
          <Text variant="muted">{LOCALE_CONFIG[locale].name}</Text>
        </Pressable>
      </CardContent>

      <Modal visible={showPicker} transparent animationType="fade">
        <Pressable
          className="flex-1 items-center justify-center bg-black/50"
          onPress={() => setShowPicker(false)}
        >
          <Card className="mx-8 w-full max-w-xs">
            <CardContent>
              {SUPPORTED_LOCALES.map((loc) => (
                <Pressable
                  key={loc}
                  className={`flex-row items-center gap-3 rounded-lg px-4 py-3 ${locale === loc ? 'bg-primary/10' : ''}`}
                  onPress={() => {
                    changeLanguage(loc);
                    setShowPicker(false);
                  }}
                >
                  <Text className={locale === loc ? 'font-semibold text-primary' : ''}>
                    {LOCALE_CONFIG[loc].name}
                  </Text>
                </Pressable>
              ))}
            </CardContent>
          </Card>
        </Pressable>
      </Modal>
    </Card>
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
    <Card className="mx-4 mt-3">
      <CardContent className="flex-row items-center justify-between">
        <Text>{t('pushNotifications.title')}</Text>
        <Switch checked={enabled} onCheckedChange={handleToggle} />
      </CardContent>
    </Card>
  );
}

function ConsentSection({ t, tConsent }: { t: TFunction; tConsent: TFunction }) {
  const { data: consents, isPending } = useConsent();
  const updateConsent = useUpdateConsent();

  if (isPending) {
    return (
      <Card className="mx-4">
        <CardContent className="items-center">
          <ActivityIndicator />
        </CardContent>
      </Card>
    );
  }

  const purposes = ['essential', 'functional', 'push_notifications', 'analytics'] as const;

  return (
    <Card className="mx-4">
      <CardHeader>
        <CardTitle>{t('privacy.consentManagement.title')}</CardTitle>
        <Text variant="muted" className="text-sm">
          {t('privacy.consentManagement.description')}
        </Text>
      </CardHeader>
      {purposes.map((purpose) => {
        const consent = consents?.find((c) => c.purpose === purpose);
        const isEssential = purpose === 'essential';

        return (
          <View key={purpose}>
            <Separator />
            <View className="flex-row items-center justify-between px-6 py-3">
              <View className="flex-1 pr-4">
                <Text variant="small">{tConsent(`purposes.${purpose}.name`)}</Text>
                <Text variant="muted" className="text-xs">
                  {tConsent(`purposes.${purpose}.description`)}
                </Text>
              </View>
              <Switch
                checked={isEssential ? true : (consent?.granted ?? false)}
                disabled={isEssential || updateConsent.isPending}
                onCheckedChange={(granted) => updateConsent.mutate({ purpose, granted })}
              />
            </View>
          </View>
        );
      })}
    </Card>
  );
}

function DataExportSetting({ t }: { t: TFunction }) {
  const exportData = useExportData();

  return (
    <Card className="mx-4 mt-3">
      <CardHeader>
        <CardTitle>{t('dataExport.title')}</CardTitle>
        <Text variant="muted" className="text-sm">
          {t('dataExport.description')}
        </Text>
      </CardHeader>
      <CardContent>
        <Button
          size="sm"
          className="self-start"
          onPress={() => exportData.mutate()}
          disabled={exportData.isPending}
        >
          <Text>{exportData.isPending ? '...' : t('dataExport.button')}</Text>
        </Button>
      </CardContent>
    </Card>
  );
}

function DataRequestSetting({ t, tCommon }: { t: TFunction; tCommon: TFunction }) {
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
    <Card className="mx-4 mt-3">
      <CardHeader>
        <CardTitle>{t('privacy.dataRequest.title')}</CardTitle>
        <Text variant="muted" className="text-sm">
          {t('privacy.dataRequest.description')}
        </Text>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onPress={() => setShowModal(true)}
        >
          <Text>{t('privacy.dataRequest.submitButton')}</Text>
        </Button>
      </CardContent>

      <Modal visible={showModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-2xl bg-card px-4 pb-8 pt-6">
            <Text variant="large" className="mb-4">
              {t('privacy.dataRequest.title')}
            </Text>

            <Label className="mb-2">{t('privacy.dataRequest.typeLabel')}</Label>
            {DATA_REQUEST_TYPES.map((type) => (
              <Pressable
                key={type}
                className={`mb-1 rounded-lg px-3 py-2.5 ${selectedType === type ? 'bg-primary/10' : ''}`}
                onPress={() => setSelectedType(type)}
              >
                <Text className={selectedType === type ? 'font-medium text-primary' : ''}>
                  {t(`privacy.dataRequest.types.${type}`)}
                </Text>
              </Pressable>
            ))}

            <Label className="mb-2 mt-3">{t('privacy.dataRequest.descriptionLabel')}</Label>
            <Textarea
              placeholder={t('privacy.dataRequest.descriptionPlaceholder')}
              value={description}
              onChangeText={setDescription}
              numberOfLines={3}
            />

            <View className="mt-4 flex-row gap-3">
              <Button variant="outline" className="flex-1" onPress={() => setShowModal(false)}>
                <Text>{tCommon('cancel')}</Text>
              </Button>
              <Button
                className="flex-1"
                onPress={handleSubmit}
                disabled={!selectedType || submitRequest.isPending}
              >
                <Text>{submitRequest.isPending ? '...' : tCommon('submit')}</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </Card>
  );
}

function SessionsSection({ t, tCommon }: { t: TFunction; tCommon: TFunction }) {
  const { data: sessions, isPending } = useSessions();
  const revokeSession = useRevokeSession();

  return (
    <Card className="mx-4">
      <CardHeader>
        <CardTitle>{t('account.sessions.title')}</CardTitle>
        <Text variant="muted" className="text-sm">
          {t('account.sessions.description')}
        </Text>
      </CardHeader>

      {isPending ? (
        <CardContent className="items-center">
          <ActivityIndicator />
        </CardContent>
      ) : !sessions?.length ? (
        <CardContent>
          <Text variant="muted">{t('account.sessions.empty')}</Text>
        </CardContent>
      ) : (
        sessions.map((session) => (
          <View key={session.id}>
            <Separator />
            <View className="flex-row items-center justify-between px-6 py-3">
              <View className="flex-1 pr-3">
                <View className="flex-row items-center gap-2">
                  <Text variant="small" numberOfLines={1}>
                    {session.userAgent ?? 'Unknown device'}
                  </Text>
                  {session.isCurrent && (
                    <Badge variant="secondary" className="rounded-full">
                      <Text>{t('account.sessions.current')}</Text>
                    </Badge>
                  )}
                </View>
                <Text variant="muted" className="text-xs">
                  {t('account.sessions.lastActive', {
                    date: new Date(session.createdAt).toLocaleDateString(),
                  })}
                </Text>
              </View>
              {!session.isCurrent && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive"
                  onPress={() => revokeSession.mutate(session.id)}
                  disabled={revokeSession.isPending}
                >
                  <Text className="text-destructive">{t('account.sessions.revokeButton')}</Text>
                </Button>
              )}
            </View>
          </View>
        ))
      )}
    </Card>
  );
}

function DeleteAccountSetting({
  t,
  tCommon,
  router,
}: {
  t: TFunction;
  tCommon: TFunction;
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
    <Card className="mx-4 border-destructive/30">
      <CardContent>
        <Text variant="muted" className="text-sm">
          {t('dangerZone.description')}
        </Text>
        <Button
          variant="destructive"
          size="sm"
          className="mt-3 self-start"
          onPress={handleDelete}
          disabled={deleteAccount.isPending}
        >
          <Text>{deleteAccount.isPending ? '...' : t('dangerZone.deleteButton')}</Text>
        </Button>
      </CardContent>
    </Card>
  );
}
