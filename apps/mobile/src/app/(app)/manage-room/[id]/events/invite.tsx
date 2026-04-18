import { INVITABLE_APPLICATION_STATUSES } from '@openhospi/shared/enums';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AnimatedPressable } from '@/components/shared/animated-pressable';
import { NativeEmptyState } from '@/components/feedback/native-empty-state';
import { ThemedAvatar } from '@/components/native/avatar';
import { ThemedBadge } from '@/components/native/badge';
import { NativeButton } from '@/components/native/button';
import { ThemedCheckbox } from '@/components/native/checkbox';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { NativeDivider } from '@/components/native/divider';
import { BlurBottomBar } from '@/components/layout/blur-bottom-bar';
import { useTheme } from '@/design';
import { hapticLight } from '@/lib/haptics';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useBatchInvite, useRoomApplicants } from '@/services/my-rooms';
import type { RoomApplicant } from '@openhospi/shared/api-types';

function SkeletonInviteList() {
  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 5 }, (_, i) => (
        <View key={i} style={styles.skeletonRow}>
          <ThemedSkeleton width={22} height={22} rounded="sm" />
          <ThemedSkeleton width={40} height={40} rounded="full" />
          <ThemedSkeleton width="50%" height={16} />
          <ThemedSkeleton width={60} height={24} rounded="full" />
        </View>
      ))}
    </View>
  );
}

export default function InviteApplicantsScreen() {
  const { id, eventId } = useLocalSearchParams<{ id: string; eventId: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms.invite' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { colors } = useTheme();

  const { data: allApplicants, isLoading } = useRoomApplicants(id);
  const batchInvite = useBatchInvite();

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const invitable = allApplicants?.filter((a) =>
    (INVITABLE_APPLICATION_STATUSES as readonly string[]).includes(a.status)
  );

  const toggleSelect = (applicationId: string) => {
    hapticLight();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(applicationId)) {
        next.delete(applicationId);
      } else {
        next.add(applicationId);
      }
      return next;
    });
  };

  const selectAllLiked = () => {
    hapticLight();
    const liked = invitable?.filter((a) => a.status === 'liked') ?? [];
    setSelected(new Set(liked.map((a) => a.applicationId)));
  };

  const handleInvite = async () => {
    await batchInvite.mutateAsync({
      roomId: id,
      eventId,
      applicationIds: [...selected],
    });
    router.back();
  };

  if (isLoading) {
    return <SkeletonInviteList />;
  }

  if (!invitable || invitable.length === 0) {
    return (
      <NativeEmptyState
        sfSymbol="person.crop.rectangle.stack"
        title={t('inviteApplicants')}
        subtitle={t('noInvitable')}
      />
    );
  }

  const renderApplicant = ({ item }: { item: RoomApplicant }) => {
    const avatarUri = item.avatarUrl
      ? getStoragePublicUrl(item.avatarUrl, 'profile-photos')
      : undefined;
    const isSelected = selected.has(item.applicationId);

    return (
      <AnimatedPressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={`${item.firstName} ${item.lastName}`}
        onPress={() => toggleSelect(item.applicationId)}>
        <View style={[styles.applicantRow, { backgroundColor: colors.background }]}>
          <ThemedCheckbox
            checked={isSelected}
            onCheckedChange={() => toggleSelect(item.applicationId)}
          />
          <ThemedAvatar source={avatarUri} fallback={item.firstName.charAt(0)} size={40} />
          <ThemedText variant="subheadline" style={styles.flex1}>
            {item.firstName} {item.lastName}
          </ThemedText>
          <ThemedBadge variant="secondary" label={tEnums(`application_status.${item.status}`)} />
        </View>
      </AnimatedPressable>
    );
  };

  return (
    <View style={[styles.flex1, { backgroundColor: colors.background }]}>
      <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
        <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
          {t('selected', { count: selected.size })}
        </ThemedText>
        <NativeButton
          label={t('selectAllLiked')}
          variant="outline"
          size="sm"
          onPress={selectAllLiked}
        />
      </View>

      <FlashList
        contentInsetAdjustmentBehavior="automatic"
        data={invitable}
        keyExtractor={(item) => item.applicationId}
        renderItem={renderApplicant}
        ItemSeparatorComponent={NativeDivider}
      />

      <BlurBottomBar>
        <NativeButton
          label={t('submit', { count: selected.size })}
          onPress={handleInvite}
          disabled={selected.size === 0 || batchInvite.isPending}
        />
      </BlurBottomBar>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  toolbar: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  applicantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  skeletonContainer: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
