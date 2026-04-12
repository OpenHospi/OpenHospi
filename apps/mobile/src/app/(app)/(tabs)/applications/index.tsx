import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { MaterialIcons } from '@expo/vector-icons';
import { Dot, FileText } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { NativeEmptyState } from '@/components/feedback/native-empty-state';
import { ThemedBadge } from '@/components/native/badge';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { ListSeparator } from '@/components/layout/list-separator';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticLight, hapticPullToRefreshSnap } from '@/lib/haptics';
import { isIOS } from '@/lib/platform';
import { useApplications } from '@/services/applications';
import { getStoragePublicUrl } from '@/lib/storage-url';
import type { UserApplication } from '@openhospi/shared/api-types';

function ApplicationCard({ item, onPress }: { item: UserApplication; onPress: () => void }) {
  const { colors } = useTheme();
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t } = useTranslation('translation', { keyPrefix: 'app.applications' });

  const coverUrl = item.roomCoverPhotoUrl
    ? getStoragePublicUrl(item.roomCoverPhotoUrl, 'room-photos')
    : null;

  return (
    <Pressable
      onPress={() => {
        hapticLight();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${item.roomTitle}, ${tEnums(`application_status.${item.status}`)}`}
      android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
      style={({ pressed }) => [
        styles.applicationRow,
        pressed && Platform.OS === 'ios' ? { opacity: 0.7 } : undefined,
      ]}>
      {coverUrl ? (
        <Image
          source={{ uri: coverUrl }}
          style={[styles.applicationImage, { borderRadius: radius.md }]}
          contentFit="cover"
          cachePolicy="disk"
        />
      ) : (
        <View
          style={[
            styles.applicationImage,
            styles.applicationPlaceholder,
            { backgroundColor: colors.muted, borderRadius: radius.md },
          ]}>
          {isIOS ? (
            <SymbolView name="house" size={24} tintColor={colors.tertiaryForeground} />
          ) : (
            <MaterialIcons name="home" size={24} color={colors.tertiaryForeground} />
          )}
        </View>
      )}
      <View style={styles.applicationContent}>
        <ThemedText variant="headline" numberOfLines={1}>
          {item.roomTitle}
        </ThemedText>
        <View style={styles.metaRow}>
          <ThemedText variant="footnote" color={colors.tertiaryForeground}>
            {tEnums(`city.${item.roomCity}`)}
          </ThemedText>
          <Dot size={14} color={colors.tertiaryForeground} />
          {isIOS ? (
            <SymbolView name="eurosign" size={12} tintColor={colors.tertiaryForeground} />
          ) : (
            <MaterialIcons name="euro" size={12} color={colors.tertiaryForeground} />
          )}
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
    </Pressable>
  );
}

function SkeletonRow() {
  return (
    <View style={styles.applicationRow}>
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
  const router = useRouter();

  const { data: applications, isPending, refetch, isRefetching } = useApplications();

  const handleRefresh = () => {
    hapticPullToRefreshSnap();
    refetch();
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: t('title'),
        }}
      />
      {isPending ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : (
        <FlashList
          data={applications ?? []}
          keyExtractor={(item) => item.id}
          contentInsetAdjustmentBehavior="automatic"
          renderItem={({ item }: { item: UserApplication }) => (
            <ApplicationCard
              item={item}
              onPress={() =>
                router.push({
                  pathname: '/(app)/application/[id]',
                  params: { id: item.id },
                })
              }
            />
          )}
          ItemSeparatorComponent={() => <ListSeparator insetLeft={96} />}
          ListEmptyComponent={
            <NativeEmptyState sfSymbol="doc.text" icon={FileText} title={t('empty')} />
          }
          refreshing={isRefetching}
          onRefresh={handleRefresh}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  applicationRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  applicationImage: {
    width: 64,
    height: 64,
  },
  applicationPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  applicationContent: {
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
