import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/primitives/themed-text';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { useTranslation } from 'react-i18next';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.card, { borderColor: colors.border }]}>
          <ThemedText variant="headline">Page not found</ThemedText>
          <Link href="/" style={styles.link}>
            <ThemedText variant="body" color={colors.primary} style={styles.linkText}>
              {tCommon('back')}
            </ThemedText>
          </Link>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  link: {
    marginTop: 16,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
});
