import { FlashList } from '@shopify/flash-list';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedBadge } from '@/components/native/badge';
import { NativeDivider } from '@/components/native/divider';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { NativeEmptyState } from '@/components/feedback/native-empty-state';
import { useTheme } from '@/design';
import { useConsentHistory } from '@/services/settings';

export default function SettingsConsentHistoryModal() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.settings' });
  const { colors, spacing } = useTheme();
  const { data: history, isPending } = useConsentHistory();

  if (isPending) {
    return (
      <View
        style={[
          styles.flex,
          { backgroundColor: colors.background, padding: spacing.lg, gap: spacing.md },
        ]}>
        <ThemedSkeleton width="80%" height={14} />
        <ThemedSkeleton width="60%" height={14} />
        <ThemedSkeleton width="70%" height={14} />
      </View>
    );
  }

  if (!history?.length) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <NativeEmptyState
          sfSymbol="clock"
          androidIcon="history"
          title={t('privacy.consentHistory.empty')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <FlashList
        data={history}
        keyExtractor={(item, index) => item.id ?? String(index)}
        ItemSeparatorComponent={NativeDivider}
        contentContainerStyle={{ paddingVertical: spacing.sm }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.row,
              { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
            ]}>
            <View style={styles.info}>
              <ThemedText variant="body">{item.purpose}</ThemedText>
              <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                {new Date(item.createdAt).toLocaleDateString()}
              </ThemedText>
            </View>
            <ThemedBadge
              variant={item.granted ? 'success' : 'secondary'}
              label={
                item.granted
                  ? t('privacy.consentHistory.granted')
                  : t('privacy.consentHistory.revoked')
              }
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
    gap: 2,
  },
});
