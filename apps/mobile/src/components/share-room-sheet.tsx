import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as Sharing from 'expo-sharing';
import { Share2 } from 'lucide-react-native';
import { useRef } from 'react';
import { View } from 'react-native';

import { AppBottomSheetModal } from '@/components/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { hapticLight } from '@/lib/haptics';

type ShareRoomSheetProps = {
  roomId: string;
  roomTitle: string;
  trigger: React.ReactNode;
};

export function ShareRoomSheet({ roomId, roomTitle, trigger }: ShareRoomSheetProps) {
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
        <View style={{ padding: 16, gap: 16, alignItems: 'center' }}>
          <Text className="text-muted-foreground text-center text-sm">{shareUrl}</Text>
          <Button onPress={handleShare} style={{ width: '100%' }}>
            <Share2 size={18} className="text-primary-foreground" />
            <Text className="text-primary-foreground font-medium">Share</Text>
          </Button>
        </View>
      </AppBottomSheetModal>
    </>
  );
}
