import { Vereniging } from '@openhospi/shared/enums';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { NativeButton } from '@/components/native/button';
import { ThemedInput } from '@/components/native/input';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticFormSubmitError, hapticFormSubmitSuccess, hapticLight } from '@/lib/haptics';
import { useProfile, useUpdateProfile } from '@/services/profile';
import { useTranslation } from 'react-i18next';

export default function EditVerenigingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const headerHeight = useHeaderHeight();
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums.vereniging' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tPlaceholders } = useTranslation('translation', {
    keyPrefix: 'app.onboarding.placeholders',
  });

  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [selected, setSelected] = useState<string | null>(profile?.vereniging ?? null);
  const [search, setSearch] = useState('');

  const filtered = Vereniging.values.filter((v) => {
    if (!search.trim()) return true;
    const label = tEnums(v);
    return label.toLowerCase().includes(search.trim().toLowerCase());
  });

  function handleSave() {
    updateProfile.mutate(
      { vereniging: selected || undefined },
      {
        onSuccess: () => {
          hapticFormSubmitSuccess();
          router.back();
        },
        onError: () => {
          hapticFormSubmitError();
          Alert.alert('Error');
        },
      }
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchArea, { paddingTop: headerHeight + 12 }]}>
        <ThemedInput
          value={search}
          onChangeText={setSearch}
          placeholder={tPlaceholders('searchVereniging')}
          autoFocus
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const isSelected = item === selected;
          return (
            <Pressable
              onPress={() => {
                hapticLight();
                setSelected(isSelected ? null : item);
              }}
              style={[styles.listItem, isSelected && { backgroundColor: colors.primary + '1A' }]}>
              <ThemedText
                variant="body"
                weight={isSelected ? '600' : undefined}
                color={isSelected ? colors.primary : colors.foreground}>
                {tEnums(item)}
              </ThemedText>
            </Pressable>
          );
        }}
      />

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <NativeButton
          label={tCommon('save')}
          onPress={handleSave}
          disabled={updateProfile.isPending}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchArea: {
    paddingHorizontal: 16,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
