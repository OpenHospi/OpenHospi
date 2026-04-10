import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as Sharing from 'expo-sharing';
import { Share2 } from 'lucide-react-native';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppBottomSheetModal } from '@/components/bottom-sheet';
import { useTheme } from '@/design';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedText } from '@/components/primitives/themed-text';
import { hapticLight } from '@/lib/haptics';

type ShareRoomSheetProps = {
  roomId: string;
  roomTitle: string;
  trigger: React.ReactNode;
};

export function ShareRoomSheet({ roomId, roomTitle, trigger }: ShareRoomSheetProps) {
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const shareUrl = `https://openhospi.nl/room/${roomId}`;

  function handleOpen() {
    hapticLight();
    sheetRef.current?.present();
  }

  async function handleShare() {
    hapticLight();
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(shareUrl, {
        dialogTitle: roomTitle,
      });
    }
    sheetRef.current?.dismiss();
  }

  return (
    <>
      <View onTouchEnd={handleOpen}>{trigger}</View>

      <AppBottomSheetModal
        ref={sheetRef}
        title={roomTitle}
        onClose={() => sheetRef.current?.dismiss()}>
        <View style={styles.content}>
          <ThemedText variant="subheadline" color={colors.mutedForeground} style={styles.centered}>
            {shareUrl}
          </ThemedText>
          <ThemedButton onPress={handleShare} style={styles.shareButton}>
            <Share2 size={18} color={colors.primaryForeground} />
            <ThemedText variant="subheadline" weight="500" color={colors.primaryForeground}>
              Share
            </ThemedText>
          </ThemedButton>
        </View>
      </AppBottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
    alignItems: 'center',
  },
  centered: {
    textAlign: 'center',
  },
  shareButton: {
    width: '100%',
  },
});
