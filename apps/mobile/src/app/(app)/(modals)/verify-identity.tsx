import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { Camera, QrCode, ShieldAlert, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import {
  generateSafetyNumber,
  encodeSafetyNumberQR,
  verifySafetyNumberQR,
  fromBase64,
} from '@openhospi/crypto';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useEncryptionKey } from '@/hooks/use-encryption-key';
import { useSession } from '@/lib/auth-client';
import { queryKeys } from '@/services/keys';
import {
  fetchIdentityKeysApi,
  useVerificationStatus,
  useSaveVerification,
} from '@/services/verification';

type ScanResult = 'idle' | 'verified' | 'mismatch' | 'invalid';

function formatSafetyNumberRows(sn: string | undefined): string[] {
  if (!sn) return [];
  const groups = sn.split(' ');
  const rows: string[] = [];
  for (let i = 0; i < groups.length; i += 3) {
    rows.push(groups.slice(i, i + 3).join('  '));
  }
  return rows;
}

export default function VerifyIdentityScreen() {
  const { peerUserId, peerName } = useLocalSearchParams<{
    peerUserId: string;
    peerName: string;
  }>();

  const { t } = useTranslation('translation', {
    keyPrefix: 'app.chat.safety_number',
  });

  const [activeTab, setActiveTab] = useState<'my-code' | 'scan'>('my-code');
  const [scanResult, setScanResult] = useState<ScanResult>('idle');
  const [scanned, setScanned] = useState(false);

  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { status: encryptionStatus } = useEncryptionKey();
  const { isVerified: alreadyVerified, verifiedAt } = useVerificationStatus(peerUserId);
  const saveVerification = useSaveVerification();
  const [permission, requestPermission] = useCameraPermissions();

  const safetyNumberQuery = useQuery({
    queryKey: queryKeys.verification.identityKeys([peerUserId]),
    queryFn: async () => {
      if (!userId || !encryptionStatus) return null;

      const { getMobileSignalStore } = await import('@/lib/crypto/stores');
      const store = getMobileSignalStore();
      const identity = await store.getIdentityKeyPair();

      const [peerKeys] = await fetchIdentityKeysApi([peerUserId]);
      if (!peerKeys) return null;
      const safetyNumber = await generateSafetyNumber(
        userId,
        identity.signingKeyPair.publicKey,
        peerUserId,
        fromBase64(peerKeys.signingPublicKey)
      );
      const qrPayload = encodeSafetyNumberQR(
        userId,
        identity.signingKeyPair.publicKey,
        safetyNumber
      );
      return { safetyNumber, qrPayload, peerSigningKey: peerKeys.signingPublicKey };
    },
    enabled: !!userId && !!encryptionStatus?.hasIdentity,
  });

  function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned || !safetyNumberQuery.data) return;
    setScanned(true);

    const result = verifySafetyNumberQR(data, safetyNumberQuery.data.safetyNumber);

    if (result.valid) {
      if (result.remoteUserId === userId) {
        Alert.alert(t('scan_own_qr'));
        setScanned(false);
        return;
      }

      setScanResult('verified');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      saveVerification.mutate({
        peerUserId: result.remoteUserId,
        signingPublicKey: safetyNumberQuery.data.peerSigningKey,
      });
    } else if (result.remoteUserId) {
      setScanResult('mismatch');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      setScanResult('invalid');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }

  const primaryColor = '#0D9488';

  return (
    <View style={{ flex: 1 }} className="bg-background">
      {/* Tab switcher */}
      <View style={{ flexDirection: 'row', marginHorizontal: 24, marginTop: 16 }}>
        <Pressable
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'my-code' ? primaryColor : 'transparent',
          }}
          onPress={() => {
            setActiveTab('my-code');
            setScanResult('idle');
            setScanned(false);
          }}>
          <Text
            className={
              activeTab === 'my-code' ? 'text-foreground font-semibold' : 'text-muted-foreground'
            }>
            {t('qr_tab')}
          </Text>
        </Pressable>
        <Pressable
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'scan' ? primaryColor : 'transparent',
          }}
          onPress={() => setActiveTab('scan')}>
          <Text
            className={
              activeTab === 'scan' ? 'text-foreground font-semibold' : 'text-muted-foreground'
            }>
            {t('scan_tab')}
          </Text>
        </Pressable>
      </View>

      {/* Tab content */}
      {activeTab === 'my-code' ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ alignItems: 'center', padding: 24, gap: 24 }}>
          {/* QR Code */}
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}>
            {safetyNumberQuery.data?.qrPayload ? (
              <QRCode
                value={safetyNumberQuery.data.qrPayload}
                size={220}
                backgroundColor="#ffffff"
                color="#000000"
              />
            ) : (
              <View
                style={{ width: 220, height: 220, justifyContent: 'center', alignItems: 'center' }}>
                <Text className="text-muted-foreground text-sm">{t('loading')}</Text>
              </View>
            )}
          </View>

          {/* Safety number grid */}
          <View style={{ gap: 4, alignItems: 'center' }}>
            {formatSafetyNumberRows(safetyNumberQuery.data?.safetyNumber).map((row, i) => (
              <Text
                key={i}
                className="text-foreground text-lg tracking-widest"
                style={{ fontFamily: 'monospace' }}>
                {row}
              </Text>
            ))}
          </View>

          {/* Instructions */}
          <Text className="text-muted-foreground text-center text-sm">
            {t('description', { name: peerName })}
          </Text>

          {/* Already verified badge */}
          {alreadyVerified && verifiedAt && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={20} className="text-green-500" />
              <Text className="text-sm font-medium text-green-600">
                {t('already_verified', { date: verifiedAt.toLocaleDateString() })}
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {scanResult === 'idle' ? (
            // Camera scanner or permission request
            !permission?.granted ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 16,
                  padding: 24,
                }}>
                <Camera size={48} className="text-muted-foreground" />
                <Text className="text-muted-foreground text-center text-sm">
                  {permission?.canAskAgain
                    ? t('camera_permission')
                    : t('camera_permission_settings')}
                </Text>
                <Button
                  onPress={
                    permission?.canAskAgain ? requestPermission : () => Linking.openSettings()
                  }>
                  <Text className="text-primary-foreground">
                    {permission?.canAskAgain ? t('grant_camera') : t('open_settings')}
                  </Text>
                </Button>
              </View>
            ) : (
              <>
                <CameraView
                  style={{ flex: 1, borderRadius: 16, overflow: 'hidden', margin: 16 }}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                />
                <Text className="text-muted-foreground text-center text-sm" style={{ padding: 16 }}>
                  {t('scan_instructions')}
                </Text>
              </>
            )
          ) : scanResult === 'verified' ? (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                gap: 16,
                padding: 24,
              }}>
              <Animated.View entering={ZoomIn.duration(300)}>
                <ShieldCheck size={64} className="text-green-500" />
              </Animated.View>
              <Text className="text-foreground text-xl font-semibold">{t('verified')}</Text>
              <Text className="text-muted-foreground text-center text-sm">
                {t('verified_description')}
              </Text>
            </View>
          ) : scanResult === 'mismatch' ? (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                gap: 16,
                padding: 24,
              }}>
              <ShieldAlert size={64} className="text-destructive" />
              <Text className="text-destructive text-xl font-semibold">{t('mismatch')}</Text>
              <Text className="text-muted-foreground text-center text-sm">
                {t('mismatch_description')}
              </Text>
              <Button
                variant="outline"
                onPress={() => {
                  setScanResult('idle');
                  setScanned(false);
                }}>
                <Text className="text-foreground">{t('scan_tab')}</Text>
              </Button>
            </View>
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                gap: 16,
                padding: 24,
              }}>
              <QrCode size={64} className="text-muted-foreground" />
              <Text className="text-muted-foreground text-center text-sm">{t('invalid_qr')}</Text>
              <Button
                variant="outline"
                onPress={() => {
                  setScanResult('idle');
                  setScanned(false);
                }}>
                <Text className="text-foreground">{t('scan_tab')}</Text>
              </Button>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
