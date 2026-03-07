import {
  MAX_PERSONAL_MESSAGE_LENGTH,
  MIN_PERSONAL_MESSAGE_LENGTH,
} from '@openhospi/shared/constants';
import { useState } from 'react';
import { Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';

import { useTranslations } from '@/i18n';
import { useApplyToRoom } from '@/services/rooms';

type Props = {
  visible: boolean;
  onClose: () => void;
  roomId: string;
};

export function ApplySheet({ visible, onClose, roomId }: Props) {
  const t = useTranslations('app.roomDetail');
  const tCommon = useTranslations('common.labels');

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
      },
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background p-4">
        <View className="flex-row items-center justify-between pb-4">
          <Pressable onPress={onClose}>
            <Text className="text-base text-muted-foreground">{tCommon('close')}</Text>
          </Pressable>
          <Text className="text-base font-semibold text-foreground">{tCommon('apply')}</Text>
          <View style={{ width: 50 }} />
        </View>

        <Text className="text-sm font-medium text-foreground">{t('personalMessage')}</Text>
        <TextInput
          className="mt-1 min-h-[150px] rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground"
          value={message}
          onChangeText={setMessage}
          placeholder={t('personalMessagePlaceholder')}
          placeholderTextColor="#999"
          multiline
          textAlignVertical="top"
          maxLength={MAX_PERSONAL_MESSAGE_LENGTH}
        />
        <Text className="mt-1 text-right text-xs text-muted-foreground">
          {message.length}/{MAX_PERSONAL_MESSAGE_LENGTH} (min {MIN_PERSONAL_MESSAGE_LENGTH})
        </Text>

        <Pressable
          className="mt-4 items-center rounded-xl bg-primary py-3.5 active:opacity-80"
          onPress={handleSubmit}
          disabled={applyToRoom.isPending || message.trim().length < MIN_PERSONAL_MESSAGE_LENGTH}
        >
          <Text className="text-base font-semibold text-primary-foreground">
            {tCommon('submit')}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}
