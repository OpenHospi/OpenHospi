import { LOCALE_CONFIG, SUPPORTED_LOCALES, type Locale } from '@openhospi/i18n';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { GroupedSection } from '@/components/layout/grouped-section';
import { ListCell } from '@/components/layout/list-cell';
import { NativeDivider } from '@/components/native/divider';
import { NativeIcon } from '@/components/native/icon';
import { useTheme } from '@/design';
import { hapticSelection } from '@/lib/haptics';

export default function SettingsLanguageModal() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { colors, spacing } = useTheme();

  const current = i18n.language as Locale;

  const handleSelect = (loc: Locale) => {
    hapticSelection();
    i18n.changeLanguage(loc);
    router.back();
  };

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: spacing.lg }}>
      <GroupedSection accessibilityLabel={tCommon('language')}>
        {SUPPORTED_LOCALES.map((loc, index) => {
          const isSelected = loc === current;
          return (
            <View key={loc}>
              {index > 0 ? <NativeDivider /> : null}
              <ListCell
                label={LOCALE_CONFIG[loc].name}
                onPress={() => handleSelect(loc)}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
