import {
  encodeSafetyNumberQR,
  fromBase64,
  generateSafetyNumber,
  verifySafetyNumberQR,
} from '@openhospi/crypto';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-native-qrcode-svg';

import { PlatformSurface } from '@/components/layout/platform-surface';
import { NativeButton } from '@/components/native/button';
import { NativeIcon } from '@/components/native/icon';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { useSession } from '@/lib/auth-client';
import { getProtocolStore } from '@/lib/crypto/stores';
import { hapticError, hapticLight, hapticSuccess } from '@/lib/haptics';
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
  const { colors } = useTheme();
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
      hapticError();
      setScanResult('mismatch');
    } else {
      hapticSuccess();
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

      {state.type === 'loading' ? (
        <View
          style={[styles.centeredGap, { backgroundColor: colors.background }]}
          accessibilityRole="progressbar"
          accessibilityLabel={t('loading')}>
          <NativeIcon
            name="checkmark.shield.fill"
            androidName="verified-user"
            size={48}
            color={colors.tertiaryForeground}
          />
          <View style={styles.skeletonGroup}>
            <ThemedSkeleton width={180} height={180} />
            <ThemedSkeleton width={220} height={14} />
          </View>
          <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
            {t('loading')}
          </ThemedText>
        </View>
      ) : null}

      {state.type === 'error' ? (
        <View
          style={[styles.errorContainer, { backgroundColor: colors.background }]}
          accessibilityRole="alert">
          <NativeIcon
            name="exclamationmark.shield.fill"
            androidName="gpp-maybe"
            size={48}
            color={colors.tertiaryForeground}
          />
          <ThemedText
            variant="subheadline"
            color={colors.tertiaryForeground}
            style={styles.textCenter}>
            {t('unavailable')}
          </ThemedText>
          <NativeButton label={t('close')} variant="outline" onPress={() => router.back()} />
        </View>
      ) : null}

      {state.type === 'ready' && !scanning ? (
        <ScrollView
          style={[styles.flex1, { backgroundColor: colors.background }]}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.readyScrollContent}>
          <ThemedText
            variant="subheadline"
            color={colors.secondaryForeground}
            style={styles.textCenter}>
            {t('description', { name: peerName })}
          </ThemedText>

          <View style={styles.qrContainer}>
            <PlatformSurface variant="card" style={styles.qrBox}>
              <QRCode value={state.qrPayload} size={200} backgroundColor="white" />
            </PlatformSurface>
          </View>

          <PlatformSurface variant="card" style={styles.safetyNumberBox}>
            <ThemedText
              variant="caption1"
              weight="600"
              color={colors.tertiaryForeground}
              style={styles.safetyLabel}>
              {t('title').toUpperCase()}
            </ThemedText>
            {formatSafetyNumber(state.safetyNumber).map((row, i) => (
              <ThemedText
                key={i}
                variant="body"
                weight="600"
                color={colors.foreground}
                style={styles.safetyNumberRow}>
                {row}
              </ThemedText>
            ))}
          </PlatformSurface>

          <ThemedText
            variant="caption1"
            color={colors.tertiaryForeground}
            style={[styles.textCenter, styles.instructions]}>
            {t('instructions')}
          </ThemedText>

          <NativeButton
            label={t('scan_tab')}
            style={styles.scanButton}
            systemImage="qrcode.viewfinder"
            materialIcon="qr-code-scanner"
            onPress={() => {
              hapticLight();
              scanProcessedRef.current = false;
              setScanResult(null);
              setScanning(true);
            }}
            accessibilityLabel={t('scan_tab')}
            accessibilityHint={t('scan_instructions')}
          />
        </ScrollView>
      ) : null}

      {state.type === 'ready' && scanning ? (
        <View style={[styles.flex1, { backgroundColor: colors.background }]}>
          <CameraSection
            onScan={handleScanResult}
            scanResult={scanResult}
            onClose={() => setScanning(false)}
          />
        </View>
      ) : null}
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
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const insets = useSafeAreaInsets();

  if (!permission) {
    return (
      <View style={styles.centered} accessibilityRole="progressbar">
        <ThemedSkeleton width={240} height={240} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <NativeIcon
          name="camera.fill"
          androidName="photo-camera"
          size={48}
          color={colors.tertiaryForeground}
        />
        <ThemedText
          variant="subheadline"
          color={colors.secondaryForeground}
          style={styles.textCenter}>
          {permission.canAskAgain ? t('camera_permission') : t('camera_permission_settings')}
        </ThemedText>
        {permission.canAskAgain ? (
          <NativeButton label={t('grant_camera')} onPress={requestPermission} />
        ) : (
          <NativeButton
            label={t('open_settings')}
            variant="outline"
            onPress={() => Linking.openSettings()}
          />
        )}
        <NativeButton label={t('close')} variant="ghost" onPress={onClose} />
      </View>
    );
  }

  const overlayBg =
    scanResult === 'match'
      ? 'rgba(34,197,94,0.8)'
      : scanResult === 'mismatch'
        ? 'rgba(239,68,68,0.8)'
        : 'transparent';

  return (
    <View style={styles.flex1}>
      <CameraView
        style={styles.flex1}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => onScan(data)}
      />

      {scanResult ? (
        <View
          style={[styles.scanOverlay, { backgroundColor: overlayBg }]}
          accessibilityRole="alert"
          accessibilityLabel={scanResult === 'match' ? t('verified') : t('mismatch')}>
          <NativeIcon
            name={scanResult === 'match' ? 'checkmark.circle.fill' : 'exclamationmark.shield.fill'}
            androidName={scanResult === 'match' ? 'check-circle' : 'gpp-maybe'}
            size={64}
            color="white"
          />
          <ThemedText variant="headline" color="white" style={styles.scanResultText}>
            {scanResult === 'match' ? t('verified') : t('mismatch')}
          </ThemedText>
        </View>
      ) : null}

      <View style={[styles.cameraBottom, { paddingBottom: insets.bottom + 60 }]}>
        <ThemedText
          variant="subheadline"
          color="white"
          style={[styles.textCenter, styles.scanInstructions]}>
          {t('scan_instructions')}
        </ThemedText>
        <NativeButton label={t('close')} variant="secondary" onPress={onClose} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredGap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  skeletonGroup: {
    alignItems: 'center',
    gap: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  textCenter: {
    textAlign: 'center',
  },
  readyScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 20,
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrBox: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  safetyNumberBox: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  safetyLabel: {
    marginBottom: 4,
    letterSpacing: 1,
  },
  safetyNumberRow: {
    fontFamily: 'Courier',
    letterSpacing: 3,
  },
  instructions: {
    paddingHorizontal: 8,
  },
  scanButton: {
    marginTop: 12,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanResultText: {
    marginTop: 12,
  },
  cameraBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  scanInstructions: {
    marginBottom: 16,
  },
});
