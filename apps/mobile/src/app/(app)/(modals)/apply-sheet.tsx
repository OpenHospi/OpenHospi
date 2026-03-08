import {
  MAX_PERSONAL_MESSAGE_LENGTH,
  MIN_PERSONAL_MESSAGE_LENGTH,
} from '@openhospi/shared/constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useApplyToRoom } from '@/services/rooms';

export default function ApplySheetScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.roomDetail' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const [message, setMessage] = useState('');
  const applyToRoom = useApplyToRoom();

  function handleSubmit() {
    if (message.trim().length < MIN_PERSONAL_MESSAGE_LENGTH) return;

    applyToRoom.mutate(
      { roomId, data: { personalMessage: message.trim() } },
      {
        onSuccess: () => {
          Alert.alert(t('applySuccess'));
          router.back();
        },
        onError: (err) => {
          Alert.alert(err.message);
        },
      }
    );
  }

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 24 }}>
        <View style={{ gap: 8 }}>
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

      <View
        style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
        className="border-border border-t">
        <Button
          className="h-14 rounded-xl"
          onPress={handleSubmit}
          disabled={applyToRoom.isPending || message.trim().length < MIN_PERSONAL_MESSAGE_LENGTH}>
          <Text>{tCommon('submit')}</Text>
        </Button>
      </View>
    </View>
  );
}
