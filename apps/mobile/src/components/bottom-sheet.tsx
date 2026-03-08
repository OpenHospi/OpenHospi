import { X } from 'lucide-react-native';
import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';

export type BottomSheetModal = {
  present: () => void;
  dismiss: () => void;
};

type BottomSheetProps = {
  title?: string;
  snapPoints?: (string | number)[];
  enableDynamicSizing?: boolean;
  children: React.ReactNode;
  scrollable?: boolean;
  footer?: React.ReactNode;
  onDismiss?: () => void;
};

export const BottomSheet = forwardRef<BottomSheetModal, BottomSheetProps>(function BottomSheet(
  { title, children, scrollable = true, footer, onDismiss },
  ref
) {
  const [visible, setVisible] = useState(false);

  useImperativeHandle(ref, () => ({
    present: () => setVisible(true),
    dismiss: () => {
      setVisible(false);
      onDismiss?.();
    },
  }));

  const handleDismiss = useCallback(() => {
    setVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleDismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="bg-background flex-1">
        {title && (
          <>
            <View className="flex-row items-center justify-between px-4 py-3">
              <Text className="text-base font-semibold">{title}</Text>
              <Button variant="ghost" size="icon" onPress={handleDismiss}>
                <X size={20} className="text-muted-foreground" />
              </Button>
            </View>
            <Separator />
          </>
        )}
        {scrollable ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: footer ? 0 : 32 }}
            keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>{children}</View>
        )}
        {footer && <View className="border-border border-t px-4 pt-3 pb-6">{footer}</View>}
      </KeyboardAvoidingView>
    </Modal>
  );
});
