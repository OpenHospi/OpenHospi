import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { Copy, RefreshCw } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedSkeleton } from '@/components/native/skeleton';

import { DatePickerSheet } from '@/components/forms/date-picker-sheet';
import { NativeButton } from '@/components/native/button';
import { ThemedInput } from '@/components/primitives/themed-input';
import { ThemedText } from '@/components/native/text';
import { GroupedSection } from '@/components/layout/grouped-section';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { API_BASE_URL } from '@/lib/constants';
import { useMyRoom, useRegenerateShareLink, useUpdateShareLinkSettings } from '@/services/my-rooms';

export default function ShareLinkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms.shareLink' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { colors } = useTheme();

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
      <View style={styles.skeletonContainer}>
        <ThemedSkeleton width="100%" height={100} rounded="lg" />
        <ThemedSkeleton width="100%" height={120} rounded="lg" />
        <ThemedSkeleton width="100%" height={44} rounded="lg" />
      </View>
    );
  }

  return (
    <View style={[styles.flex1, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.flex1}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Share Link */}
        <GroupedSection style={styles.noMargin}>
          <View style={styles.cardInner}>
            <ThemedText variant="body" weight="600">
              {t('title')}
            </ThemedText>
            {shareUrl ? (
              <View
                style={[
                  styles.linkBox,
                  { borderColor: colors.separator, backgroundColor: `${colors.muted}80` },
                ]}>
                <ThemedText variant="caption1" numberOfLines={1} style={styles.flex1}>
                  {shareUrl}
                </ThemedText>
                <Pressable onPress={handleCopy} hitSlop={8}>
                  <Copy size={16} color={colors.foreground} />
                </Pressable>
              </View>
            ) : (
              <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
                {t('noExpiry')}
              </ThemedText>
            )}

            {copied && (
              <ThemedText variant="subheadline" weight="600" color={colors.primary}>
                {t('copied')}
              </ThemedText>
            )}

            <ThemedText variant="caption1" color={colors.tertiaryForeground}>
              {t('useCount', { count: room.shareLinkUseCount })}
            </ThemedText>
          </View>
        </GroupedSection>

        {/* Settings */}
        <GroupedSection style={styles.noMargin}>
          <View style={styles.cardInner}>
            <View style={styles.fieldGroup}>
              <ThemedText variant="subheadline" weight="500">
                {t('expiry')}
              </ThemedText>
              <DatePickerSheet
                title={t('expiry')}
                value={room.shareLinkExpiresAt ? new Date(room.shareLinkExpiresAt) : new Date()}
                onChange={handleUpdateExpiry}
                minimumDate={new Date()}
              />
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText variant="subheadline" weight="500">
                {t('maxUses')}
              </ThemedText>
              <ThemedInput
                value={room.shareLinkMaxUses ? String(room.shareLinkMaxUses) : ''}
                onChangeText={handleUpdateMaxUses}
                placeholder={t('noLimit')}
                keyboardType="numeric"
              />
            </View>
          </View>
        </GroupedSection>

        {/* Regenerate */}
        <NativeButton
          label={t('regenerate')}
          variant="outline"
          onPress={handleRegenerate}
          loading={regenerate.isPending}
          systemImage="arrow.clockwise"
          materialIcon="refresh"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  skeletonContainer: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  noMargin: {
    marginHorizontal: 0,
  },
  cardInner: {
    padding: 16,
    gap: 12,
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  fieldGroup: {
    gap: 8,
  },
  regenerateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
