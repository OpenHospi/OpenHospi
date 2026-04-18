import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { NativeEmptyState } from '@/components/feedback/native-empty-state';
import { AnimatedPressable } from '@/components/shared/animated-pressable';
import { ThemedBadge } from '@/components/native/badge';
import { NativeDivider } from '@/components/native/divider';
import { NativeIcon } from '@/components/native/icon';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticPullToRefreshSnap } from '@/lib/haptics';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useApplications } from '@/services/applications';
import type { UserApplication } from '@openhospi/shared/api-types';

function ApplicationRow({ item, onPress }: { item: UserApplication; onPress: () => void }) {
  const { colors } = useTheme();
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t } = useTranslation('translation', { keyPrefix: 'app.applications' });

  const coverUrl = item.roomCoverPhotoUrl
    ? getStoragePublicUrl(item.roomCoverPhotoUrl, 'room-photos')
    : null;

  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.roomTitle}, ${tEnums(`application_status.${item.status}`)}`}
      scaleValue={0.99}>
      <View style={styles.row}>
        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            style={[styles.image, { borderRadius: radius.md }]}
            contentFit="cover"
            cachePolicy="disk"
          />
        ) : (
          <View
            style={[
              styles.image,
              styles.placeholder,
              { backgroundColor: colors.muted, borderRadius: radius.md },
            ]}>
            <NativeIcon
              name="house"
              androidName="home"
              size={24}
              color={colors.tertiaryForeground}
            />
          </View>
        )}
        <View style={styles.content}>
          <ThemedText variant="headline" numberOfLines={1}>
            {item.roomTitle}
          </ThemedText>
          <View style={styles.metaRow}>
            <ThemedText variant="footnote" color={colors.tertiaryForeground}>
              {tEnums(`city.${item.roomCity}`)}
            </ThemedText>
            <NativeIcon
              name="dot"
              androidName="fiber-manual-record"
              size={14}
              color={colors.tertiaryForeground}
            />
            <NativeIcon name="eurosign" size={12} color={colors.tertiaryForeground} />
            <ThemedText variant="footnote" color={colors.tertiaryForeground}>
              {item.roomRentPrice}
              {tCommon('perMonth')}
            </ThemedText>
          </View>
          <View style={styles.statusRow}>
            <ThemedBadge variant="secondary" label={tEnums(`application_status.${item.status}`)} />
            <ThemedText variant="caption1" color={colors.tertiaryForeground}>
              {t('appliedOn', { date: new Date(item.appliedAt).toLocaleDateString() })}
            </ThemedText>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

function SkeletonRow() {
  return (
    <View style={styles.row}>
      <ThemedSkeleton width={64} height={64} rounded="md" />
      <View style={styles.skeletonLines}>
        <ThemedSkeleton width="70%" height={16} />
        <ThemedSkeleton width="50%" height={12} />
        <ThemedSkeleton width="30%" height={12} />
      </View>
    </View>
  );
}

export default function ApplicationsScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.applications' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const router = useRouter();
  const [searchText, setSearchText] = useState('');

  const { data: applications, isPending, refetch, isRefetching } = useApplications();

  const filtered = searchText
    ? (applications ?? []).filter((a) =>
        a.roomTitle.toLowerCase().includes(searchText.toLowerCase())
      )
    : (applications ?? []);

  const handleRefresh = () => {
    hapticPullToRefreshSnap();
    refetch();
  };

  return (
    <>
      <Stack.Screen options={{ headerTitle: t('title') }} />
      <Stack.SearchBar
        placeholder={tCommon('search')}
        hideWhenScrolling
        obscureBackground
        onChangeText={(event) => setSearchText(event.nativeEvent.text)}
        onCancelButtonPress={() => setSearchText('')}
      />

      {isPending ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : (
        <FlashList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentInsetAdjustmentBehavior="automatic"
          renderItem={({ item }) => (
            <ApplicationRow
              item={item}
              onPress={() =>
                router.push({
                  pathname: '/(app)/application/[id]',
                  params: { id: item.id },
                })
              }
            />
          )}
          ItemSeparatorComponent={() => <NativeDivider />}
          ListEmptyComponent={
            <NativeEmptyState sfSymbol="doc.text" androidIcon="description" title={t('empty')} />
          }
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  image: {
    width: 64,
    height: 64,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skeletonContainer: {
    flex: 1,
  },
  skeletonLines: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
});
