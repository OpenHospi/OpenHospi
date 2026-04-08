import BottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { X } from 'lucide-react-native';
import { useColorScheme, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { NAV_THEME } from '@/lib/theme';

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />;
}

// ── Standard Bottom Sheet ──────────────────────────────────

type AppBottomSheetProps = {
  snapPoints: (string | number)[];
  children: React.ReactNode;
  title?: string;
  footer?: React.ReactNode;
  scrollable?: boolean;
  onDismiss?: () => void;
  ref?: React.Ref<BottomSheet>;
};

export function AppBottomSheet({
  snapPoints,
  children,
  title,
  footer,
  scrollable = true,
  onDismiss,
  ref,
}: AppBottomSheetProps) {
  const colorScheme: 'light' | 'dark' = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = NAV_THEME[colorScheme];

  return (
    <BottomSheet
      ref={ref}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onDismiss}
      backgroundStyle={{ backgroundColor: theme.colors.card }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore">
      {title && (
        <>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}>
            <Text className="text-base font-semibold">{title}</Text>
          </View>
          <Separator />
        </>
      )}
      {scrollable ? (
        <BottomSheetScrollView
          contentContainerStyle={{ paddingBottom: footer ? 0 : 32 }}
          keyboardShouldPersistTaps="handled">
          {children}
        </BottomSheetScrollView>
      ) : (
        <BottomSheetView style={{ flex: 1 }}>{children}</BottomSheetView>
      )}
      {footer && (
        <View
          className="border-border border-t"
          style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}>
          {footer}
        </View>
      )}
    </BottomSheet>
  );
}

// ── Modal Bottom Sheet ─────────────────────────────────────

type AppBottomSheetModalProps = {
  snapPoints?: (string | number)[];
  enableDynamicSizing?: boolean;
  children: React.ReactNode;
  title?: string;
  footer?: React.ReactNode;
  scrollable?: boolean;
  onDismiss?: () => void;
  onClose?: () => void;
  ref?: React.Ref<BottomSheetModal>;
};

export function AppBottomSheetModal({
  snapPoints,
  enableDynamicSizing = true,
  children,
  title,
  footer,
  scrollable = true,
  onDismiss,
  onClose,
  ref,
}: AppBottomSheetModalProps) {
  const colorScheme: 'light' | 'dark' = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = NAV_THEME[colorScheme];

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing={enableDynamicSizing}
      enablePanDownToClose
      onDismiss={onDismiss}
      backgroundStyle={{ backgroundColor: theme.colors.card }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore">
      {title && (
        <>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}>
            <Text className="text-base font-semibold">{title}</Text>
            <Button variant="ghost" size="icon" onPress={onClose ?? onDismiss}>
              <X size={20} className="text-muted-foreground" />
            </Button>
          </View>
          <Separator />
        </>
      )}
      {scrollable ? (
        <BottomSheetScrollView
          contentContainerStyle={{ paddingBottom: footer ? 0 : 32 }}
          keyboardShouldPersistTaps="handled">
          {children}
        </BottomSheetScrollView>
      ) : (
        <BottomSheetView style={{ flex: 1 }}>{children}</BottomSheetView>
      )}
      {footer && (
        <View
          className="border-border border-t"
          style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}>
          {footer}
        </View>
      )}
    </BottomSheetModal>
  );
}

export { BottomSheetModal };
export type { BottomSheetBackdropProps };
