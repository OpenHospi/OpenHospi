import { MAX_LIFESTYLE_TAGS, MIN_LIFESTYLE_TAGS } from '@openhospi/shared/constants';
import { LifestyleTag } from '@openhospi/shared/enums';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';
import { useProfile, useUpdateProfile } from '@/services/profile';

export default function EditLifestyleScreen() {
  const router = useRouter();
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums.lifestyle_tag' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding' });

  const { data: profile } = useProfile();
  const [selected, setSelected] = useState<string[]>(profile?.lifestyleTags ?? []);
  const updateProfile = useUpdateProfile();

  function toggle(tag: string) {
    setSelected((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= MAX_LIFESTYLE_TAGS) return prev;
      return [...prev, tag];
    });
  }

  function handleSave() {
    if (selected.length < MIN_LIFESTYLE_TAGS) return;
    updateProfile.mutate(
      { lifestyleTags: selected },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert('Error'),
      }
    );
  }

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
        <Text variant="muted" className="text-sm">
          {t('tagCounter', {
            count: selected.length,
            max: MAX_LIFESTYLE_TAGS,
            min: MIN_LIFESTYLE_TAGS,
          })}
        </Text>
        <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {LifestyleTag.values.map((tag) => {
            const isSelected = selected.includes(tag);
            return (
              <Pressable key={tag} onPress={() => toggle(tag)}>
                <Badge
                  variant={isSelected ? 'default' : 'outline'}
                  className="rounded-lg px-3 py-1.5">
                  <Text>{tEnums(tag)}</Text>
                </Badge>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View
        style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
        className="border-border border-t">
        <Button
          className="h-14 rounded-xl"
          onPress={handleSave}
          disabled={updateProfile.isPending || selected.length < MIN_LIFESTYLE_TAGS}>
          <Text>{tCommon('save')}</Text>
        </Button>
      </View>
    </View>
  );
}
