import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { GroupedSection } from '@/components/layout/grouped-section';
import { ListCell } from '@/components/layout/list-cell';
import { NativeButton } from '@/components/native/button';
import { NativeDivider } from '@/components/native/divider';
import { NativeIcon } from '@/components/native/icon';
import { ThemedText } from '@/components/native/text';
import { ThemedTextarea } from '@/components/native/textarea';
import { useTheme } from '@/design';
import { hapticFormSubmitSuccess, hapticSelection } from '@/lib/haptics';
import { useSubmitDataRequest } from '@/services/settings';

const DATA_REQUEST_TYPES = [
  'access',
  'rectification',
  'erasure',
  'restriction',
  'portability',
  'objection',
] as const;

export default function SettingsDataRequestModal() {
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.settings' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { colors, spacing } = useTheme();

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const submitRequest = useSubmitDataRequest();

  const handleSelect = (type: string) => {
    hapticSelection();
    setSelectedType(type);
  };

  const handleSubmit = () => {
    if (!selectedType) return;
    submitRequest.mutate(
      { type: selectedType, description: description || undefined },
      {
        onSuccess: () => {
          hapticFormSubmitSuccess();
          Alert.alert(t('privacy.dataRequest.success'));
          router.back();
        },
      }
    );
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { gap: spacing.lg, padding: spacing.lg }]}>
        <View style={{ gap: spacing.sm }}>
          <ThemedText variant="subheadline" weight="500">
            {t('privacy.dataRequest.typeLabel')}
          </ThemedText>
          <GroupedSection inset={false}>
            {DATA_REQUEST_TYPES.map((type, index) => {
              const isSelected = selectedType === type;
              return (
                <View key={type}>
                  {index > 0 ? <NativeDivider /> : null}
                  <ListCell
                    label={t(`privacy.dataRequest.types.${type}`)}
                    onPress={() => handleSelect(type)}
                    chevron={false}
                    rightContent={
                      isSelected ? (
                        <NativeIcon
                          name="checkmark"
                          androidName="check"
                          size={18}
                          color={colors.primary}
                        />
                      ) : null
                    }
                    accessibilityState={{ selected: isSelected }}
                  />
                </View>
              );
            })}
          </GroupedSection>
        </View>

        <View style={{ gap: spacing.sm }}>
          <ThemedText variant="subheadline" weight="500">
            {t('privacy.dataRequest.descriptionLabel')}
          </ThemedText>
          <ThemedTextarea
            placeholder={t('privacy.dataRequest.descriptionPlaceholder')}
            value={description}
            onChangeText={setDescription}
            minHeight={100}
            accessibilityLabel={t('privacy.dataRequest.descriptionLabel')}
          />
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.border,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: spacing['2xl'],
            gap: spacing.sm,
          },
        ]}>
        <NativeButton
          label={tCommon('submit')}
          onPress={handleSubmit}
          loading={submitRequest.isPending}
          disabled={!selectedType || submitRequest.isPending}
        />
        <NativeButton label={tCommon('cancel')} variant="outline" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {},
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
  },
});
