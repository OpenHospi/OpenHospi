import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { queryKeys } from '@/services/keys';

export default function SecurityStep() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding.security' });
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  async function handleSetup() {
    setLoading(true);
    try {
      // TODO: Implement Signal Protocol key setup in Phase 5
      await queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status() });
    } catch (error) {
      console.error('[SecurityStep] Setup failed:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <ActivityIndicator size="large" />
        <Text variant="muted" className="text-sm">
          {t('generating_keys')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: 24 }}>
      <View>
        <Text className="text-foreground font-semibold">{t('e2ee_title')}</Text>
        <Text variant="muted" style={{ marginTop: 8 }} className="text-sm">
          {t('e2ee_description')}
        </Text>
      </View>

      <Button onPress={handleSetup}>
        <Text>{t('setup_pin')}</Text>
      </Button>
    </ScrollView>
  );
}
