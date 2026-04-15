import { LOCALE_CONFIG, SUPPORTED_LOCALES } from '@openhospi/i18n';
import { Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Check, Globe } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  AppBottomSheetModal as BottomSheet,
  type BottomSheetModal,
} from '@/components/shared/bottom-sheet';
import { ThemedInput } from '@/components/native/input';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticLight } from '@/lib/haptics';

function LanguageHeaderPicker() {
  const { i18n, t } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [search, setSearch] = useState('');
  const locale = i18n.language;

  const filtered = SUPPORTED_LOCALES.filter((loc) => {
    if (!search.trim()) return true;
    return LOCALE_CONFIG[loc].name.toLowerCase().includes(search.trim().toLowerCase());
  });

  return (
    <>
      <Pressable
        onPress={() => {
          hapticLight();
          sheetRef.current?.present();
        }}
        hitSlop={8}>
        {Platform.OS === 'ios' ? (
          <SymbolView name="globe" size={22} tintColor={colors.primary} />
        ) : (
          <Globe size={22} color={colors.primary} />
        )}
      </Pressable>

      <BottomSheet
        ref={sheetRef}
        title={t('language')}
        scrollable={false}
        snapPoints={['50%']}
        enableDynamicSizing={false}
        onDismiss={() => setSearch('')}>
        <View style={styles.sheetBody}>
          <View style={styles.searchContainer}>
            <ThemedInput value={search} onChangeText={setSearch} placeholder={t('search')} />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = item === locale;
              return (
                <Pressable
                  onPress={() => {
                    hapticLight();
                    i18n.changeLanguage(item);
                    sheetRef.current?.dismiss();
                    setSearch('');
                  }}
                  android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
                  style={[
                    styles.localeRow,
                    isSelected && { backgroundColor: colors.primary + '1A' },
                  ]}>
                  <ThemedText
                    variant="body"
                    weight={isSelected ? '600' : '400'}
                    color={isSelected ? colors.primary : colors.foreground}>
                    {LOCALE_CONFIG[item].name}
                  </ThemedText>
                  {isSelected && <Check size={18} color={colors.primary} strokeWidth={2.5} />}
                </Pressable>
              );
            }}
          />
        </View>
      </BottomSheet>
    </>
  );
}

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitle: '',
        headerTransparent: true,
        headerShadowVisible: false,
        headerRight: () => <LanguageHeaderPicker />,
      }}
    />
  );
}

const styles = StyleSheet.create({
  sheetBody: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  localeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
});
