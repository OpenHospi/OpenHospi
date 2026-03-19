import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  encodeSafetyNumberQR,
  fromBase64,
  generateSafetyNumber,
  verifySafetyNumberQR,
} from '@openhospi/crypto';
import { CircleCheck, ScanLine, ShieldAlert, ShieldCheck } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-native-qrcode-svg';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { getProtocolStore } from '@/lib/crypto/stores';
import { useSession } from '@/lib/auth-client';
import { useConversationDetail } from '@/services/chat';
import { fetchIdentityKeysApi } from '@/services/verification';

type ScreenState =
  | { type: 'loading' }
  | { type: 'error' }
  | { type: 'ready'; safetyNumber: string; qrPayload: string };

type ScanResult = 'match' | 'mismatch' | null;

export default function VerifyScreen() {
  const { conversationId, userId: peerUserId } = useLocalSearchParams<{
    conversationId: string;
    userId: string;
  }>();
  const { t } = useTranslation('translation', { keyPrefix: 'app.chat.safety_number' });
  const { data: session } = useSession();
  const localUserId = session?.user?.id;
  const router = useRouter();
  const { data: detail } = useConversationDetail(conversationId);

  const peerName = detail?.members.find((m) => m.userId === peerUserId)?.firstName ?? peerUserId;

  const [state, setState] = useState<ScreenState>({ type: 'loading' });
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const scanProcessedRef = useRef(false);

  useEffect(() => {
    if (!localUserId) return;
    let cancelled = false;

    (async () => {
      try {
        const store = getProtocolStore();
        const [keyPair, serverKeys] = await Promise.all([
          store.getIdentityKeyPair().catch(() => null),
          fetchIdentityKeysApi([peerUserId]),
        ]);
        const localIdentityKey = keyPair?.publicKey ?? null;

        if (cancelled) return;

        const remoteKey = serverKeys[0];
        if (!localIdentityKey || !remoteKey) {
          setState({ type: 'error' });
          return;
        }

        const remoteIdentityKey = fromBase64(remoteKey.identityPublicKey);
        const safetyNumber = generateSafetyNumber(
          localUserId,
          localIdentityKey,
          peerUserId,
          remoteIdentityKey
        );
        const qrPayload = encodeSafetyNumberQR(localUserId, localIdentityKey, safetyNumber);

        setState({ type: 'ready', safetyNumber, qrPayload });
      } catch {
        if (!cancelled) setState({ type: 'error' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [localUserId, peerUserId]);

  function formatSafetyNumber(sn: string): string[] {
    const groups: string[] = [];
    for (let i = 0; i < sn.length; i += 5) {
      groups.push(sn.slice(i, i + 5));
    }
    const rows: string[] = [];
    for (let i = 0; i < groups.length; i += 3) {
      rows.push(groups.slice(i, i + 3).join('  '));
    }
    return rows;
  }

  function handleScanResult(data: string) {
    if (scanProcessedRef.current || state.type !== 'ready') return;
    scanProcessedRef.current = true;

    const { valid, remoteUserId } = verifySafetyNumberQR(data, state.safetyNumber);

    if (remoteUserId === localUserId || !valid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setScanResult('mismatch');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScanResult('match');
    }

    setTimeout(() => {
      setScanResult(null);
      scanProcessedRef.current = false;
    }, 3000);
  }

  return (
    <>
      <Stack.Screen options={{ title: peerName, headerBackTitle: t('close') }} />

      {state.type === 'loading' && (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}
          className="bg-background">
          <ShieldCheck size={48} className="text-muted-foreground" />
          <ActivityIndicator />
          <Text variant="muted" className="text-sm">
            {t('loading')}
          </Text>
        </View>
      )}

      {state.type === 'error' && (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 }}
          className="bg-background">
          <ShieldAlert size={48} className="text-muted-foreground" />
          <Text variant="muted" className="text-center text-sm">
            {t('unavailable')}
          </Text>
          <Button variant="outline" onPress={() => router.back()}>
            <Text className="text-foreground">{t('close')}</Text>
          </Button>
        </View>
      )}

      {state.type === 'ready' && !scanning && (
        <ScrollView
          style={{ flex: 1 }}
          className="bg-background"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 }}>
          {/* Description */}
          <Text variant="muted" className="text-center text-sm">
            {t('description', { name: peerName })}
          </Text>

          {/* QR Code */}
          <View style={{ alignItems: 'center', marginTop: 28 }}>
            <View
              style={{ padding: 16, borderRadius: 12, alignItems: 'center' }}
              className="bg-white shadow-sm">
              <QRCode value={state.qrPayload} size={180} />
            </View>
          </View>

          {/* Safety number — single code block */}
          <View
            style={{
              marginTop: 28,
              borderRadius: 10,
              paddingVertical: 16,
              paddingHorizontal: 20,
              gap: 8,
              alignItems: 'center',
            }}
            className="bg-muted">
            {formatSafetyNumber(state.safetyNumber).map((row, i) => (
              <Text
                key={i}
                style={{ fontFamily: 'Courier', letterSpacing: 3 }}
                className="text-foreground text-base font-semibold">
                {row}
              </Text>
            ))}
          </View>

          {/* Instructions */}
          <Text variant="muted" className="mt-6 text-center text-xs" style={{ marginTop: 24 }}>
            {t('instructions')}
          </Text>

          {/* Scan button */}
          <Button
            style={{ marginTop: 32 }}
            onPress={() => {
              scanProcessedRef.current = false;
              setScanResult(null);
              setScanning(true);
            }}>
            <ScanLine size={18} className="text-primary-foreground" />
            <Text className="text-primary-foreground font-medium">{t('scan_tab')}</Text>
          </Button>
        </ScrollView>
      )}

      {state.type === 'ready' && scanning && (
        <View style={{ flex: 1 }} className="bg-background">
          <CameraSection
            onScan={handleScanResult}
            scanResult={scanResult}
            onClose={() => setScanning(false)}
          />
        </View>
      )}
    </>
  );
}

function CameraSection({
  onScan,
  scanResult,
  onClose,
}: {
  onScan: (data: string) => void;
  scanResult: ScanResult;
  onClose: () => void;
}) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.chat.safety_number' });
  const [permission, requestPermission] = useCameraPermissions();
  const insets = useSafeAreaInsets();

  if (!permission) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 }}>
        <Text variant="muted" className="text-center text-sm">
          {permission.canAskAgain ? t('camera_permission') : t('camera_permission_settings')}
        </Text>
        {permission.canAskAgain ? (
          <Button onPress={requestPermission}>
            <Text className="text-primary-foreground">{t('grant_camera')}</Text>
          </Button>
        ) : (
          <Button variant="outline" onPress={() => Linking.openSettings()}>
            <Text className="text-foreground">{t('open_settings')}</Text>
          </Button>
        )}
        <Button variant="ghost" onPress={onClose}>
          <Text className="text-foreground">{t('close')}</Text>
        </Button>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => onScan(data)}
      />

      {/* Scan result overlay */}
      {scanResult && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          className={scanResult === 'match' ? 'bg-green-500/80' : 'bg-destructive/80'}>
          {scanResult === 'match' ? (
            <CircleCheck size={64} color="white" />
          ) : (
            <ShieldAlert size={64} color="white" />
          )}
          <Text className="mt-3 text-lg font-semibold text-white" style={{ marginTop: 12 }}>
            {scanResult === 'match' ? t('verified') : t('mismatch')}
          </Text>
        </View>
      )}

      {/* Bottom bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 60,
          paddingTop: 16,
        }}>
        <Text className="text-center text-sm text-white" style={{ marginBottom: 16 }}>
          {t('scan_instructions')}
        </Text>
        <Button variant="secondary" onPress={onClose}>
          <Text className="text-secondary-foreground">{t('close')}</Text>
        </Button>
      </View>
    </View>
  );
}
