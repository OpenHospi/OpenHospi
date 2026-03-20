import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { Copy, RefreshCw } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DatePickerSheet } from '@/components/date-picker-sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { API_BASE_URL } from '@/lib/constants';
import { useMyRoom, useRegenerateShareLink, useUpdateShareLinkSettings } from '@/services/my-rooms';

export default function ShareLinkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms.shareLink' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const { data: room, isLoading } = useMyRoom(id);
  const regenerate = useRegenerateShareLink();
  const updateSettings = useUpdateShareLinkSettings();

  const [copied, setCopied] = useState(false);

  const shareUrl = room?.shareLink ? `${API_BASE_URL}/share/${room.shareLink}` : null;

  const handleCopy = async () => {
    if (!shareUrl) return;
    await Clipboard.setStringAsync(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    Alert.alert(t('regenerate'), t('regenerateConfirm'), [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: t('regenerate'),
        onPress: () => regenerate.mutate(id),
      },
    ]);
  };

  const handleUpdateExpiry = (date: Date) => {
    updateSettings.mutate({
      roomId: id,
      data: { shareLinkExpiresAt: date.toISOString(), shareLinkMaxUses: room?.shareLinkMaxUses },
    });
  };

  const handleUpdateMaxUses = (value: string) => {
    const maxUses = value ? Number(value) : null;
    updateSettings.mutate({
      roomId: id,
      data: {
        shareLinkExpiresAt: room?.shareLinkExpiresAt || null,
        shareLinkMaxUses: maxUses,
      },
    });
  };

  if (isLoading || !room) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        className="bg-background">
        <ActivityIndicator className="accent-primary" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled">
        {/* Share Link */}
        <Card style={{ gap: 12 }}>
          <Text className="text-foreground font-semibold">{t('title')}</Text>
          {shareUrl ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
              }}
              className="border-input bg-muted/50">
              <Text className="text-foreground text-xs" numberOfLines={1} style={{ flex: 1 }}>
                {shareUrl}
              </Text>
              <Button variant="ghost" size="icon" onPress={handleCopy}>
                <Copy size={16} className="text-foreground" />
              </Button>
            </View>
          ) : (
            <Text variant="muted" className="text-sm">
              {t('noExpiry')}
            </Text>
          )}

          {copied && <Text className="text-primary text-sm font-semibold">{t('copied')}</Text>}

          <Text variant="muted" className="text-xs">
            {t('useCount', { count: room.shareLinkUseCount })}
          </Text>
        </Card>

        {/* Settings */}
        <Card style={{ gap: 12 }}>
          <View style={{ gap: 8 }}>
            <Label>{t('expiry')}</Label>
            <DatePickerSheet
              title={t('expiry')}
              value={room.shareLinkExpiresAt ? new Date(room.shareLinkExpiresAt) : new Date()}
              onChange={handleUpdateExpiry}
              minimumDate={new Date()}
            />
          </View>

          <View style={{ gap: 8 }}>
            <Label>{t('maxUses')}</Label>
            <Input
              value={room.shareLinkMaxUses ? String(room.shareLinkMaxUses) : ''}
              onChangeText={handleUpdateMaxUses}
              placeholder={t('noLimit')}
              keyboardType="numeric"
            />
          </View>
        </Card>

        {/* Regenerate */}
        <Button variant="outline" onPress={handleRegenerate} disabled={regenerate.isPending}>
          {regenerate.isPending ? (
            <ActivityIndicator className="accent-foreground" />
          ) : (
            <>
              <RefreshCw size={16} className="text-foreground" />
              <Text>{t('regenerate')}</Text>
            </>
          )}
        </Button>
      </ScrollView>
    </View>
  );
}
