import BottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { X } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/native/text';
import { ListSeparator } from '@/components/layout/list-separator';
import { useTheme } from '@/design';
import { hapticLight, hapticSheetSnap } from '@/lib/haptics';

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
  const { colors } = useTheme();

  return (
    <BottomSheet
      ref={ref}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onDismiss}
      onChange={(index) => {
        if (index >= 0) hapticSheetSnap();
      }}
      backgroundStyle={{ backgroundColor: colors.tertiaryBackground }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore">
      {title && (
        <>
          <View style={styles.header}>
            <ThemedText variant="headline">{title}</ThemedText>
          </View>
          <ListSeparator insetLeft={0} />
        </>
      )}
      {scrollable ? (
        <BottomSheetScrollView
          contentContainerStyle={{ paddingBottom: footer ? 0 : 32 }}
          keyboardShouldPersistTaps="handled">
          {children}
        </BottomSheetScrollView>
      ) : (
        <BottomSheetView style={styles.viewContainer}>{children}</BottomSheetView>
      )}
      {footer && (
        <View style={[styles.footer, { borderTopColor: colors.separator }]}>{footer}</View>
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
  const { colors } = useTheme();

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing={enableDynamicSizing}
      enablePanDownToClose
      onDismiss={onDismiss}
      onChange={(index) => {
        if (index >= 0) hapticSheetSnap();
      }}
      backgroundStyle={{ backgroundColor: colors.tertiaryBackground }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore">
      {title && (
        <>
          <View style={styles.header}>
            <ThemedText variant="headline" style={styles.headerTitle}>
              {title}
            </ThemedText>
            <Pressable
              onPress={() => {
                hapticLight();
                (onClose ?? onDismiss)?.();
              }}
              hitSlop={8}>
              <X size={20} color={colors.tertiaryForeground} />
            </Pressable>
          </View>
          <ListSeparator insetLeft={0} />
        </>
      )}
      {scrollable ? (
        <BottomSheetScrollView
          contentContainerStyle={{ paddingBottom: footer ? 0 : 32 }}
          keyboardShouldPersistTaps="handled">
          {children}
        </BottomSheetScrollView>
      ) : (
        <BottomSheetView style={styles.viewContainer}>{children}</BottomSheetView>
      )}
      {footer && (
        <View style={[styles.footer, { borderTopColor: colors.separator }]}>{footer}</View>
      )}
    </BottomSheetModal>
  );
}

export { BottomSheetModal };
export type { BottomSheetBackdropProps };

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    flex: 1,
  },
  viewContainer: {
    flex: 1,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
});
