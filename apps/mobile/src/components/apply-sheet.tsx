import {
  MAX_PERSONAL_MESSAGE_LENGTH,
  MIN_PERSONAL_MESSAGE_LENGTH,
} from '@openhospi/shared/constants';
import { useState } from 'react';
import { Alert, Modal, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useApplyToRoom } from '@/services/rooms';

type Props = {
  visible: boolean;
  onClose: () => void;
  roomId: string;
};

export function ApplySheet({ visible, onClose, roomId }: Props) {
  const { t } = useTranslation('translation', { keyPrefix: 'app.roomDetail' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const [message, setMessage] = useState('');
  const applyToRoom = useApplyToRoom();

  function handleSubmit() {
    if (message.trim().length < MIN_PERSONAL_MESSAGE_LENGTH) {
      return;
    }

    applyToRoom.mutate(
      { roomId, data: { personalMessage: message.trim() } },
      {
        onSuccess: () => {
          Alert.alert(t('applySuccess'));
          setMessage('');
          onClose();
        },
        onError: (err) => {
          Alert.alert(err.message);
        },
      }
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View className="bg-background flex-1">
        {/* Drag indicator */}
        <View className="items-center pt-3">
          <View className="bg-muted-foreground/30 h-1 w-10 rounded-full" />
        </View>

        <View className="flex-row items-center justify-between px-4 py-3">
          <Button variant="ghost" onPress={onClose}>
            <Text>{tCommon('close')}</Text>
          </Button>
          <Text className="text-base font-semibold">{tCommon('apply')}</Text>
          <View style={{ width: 50 }} />
        </View>
        <Separator />

        <View className="flex-1 px-4 pt-6">
          <View className="gap-2">
            <Label>{t('personalMessage')}</Label>
            <Textarea
              value={message}
              onChangeText={setMessage}
              placeholder={t('personalMessagePlaceholder')}
              maxLength={MAX_PERSONAL_MESSAGE_LENGTH}
              numberOfLines={8}
              className="min-h-[160px] rounded-xl"
            />
            <Text variant="muted" className="text-right text-xs">
              {message.length}/{MAX_PERSONAL_MESSAGE_LENGTH} (min {MIN_PERSONAL_MESSAGE_LENGTH})
            </Text>
          </View>
        </View>

        <View className="border-border border-t px-4 pt-3 pb-6">
          <Button
            className="h-14 rounded-xl"
            onPress={handleSubmit}
            disabled={applyToRoom.isPending || message.trim().length < MIN_PERSONAL_MESSAGE_LENGTH}>
            <Text>{tCommon('submit')}</Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
}
