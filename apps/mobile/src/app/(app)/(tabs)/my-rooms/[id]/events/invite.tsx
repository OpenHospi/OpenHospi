import { INVITABLE_APPLICATION_STATUSES } from '@openhospi/shared/enums';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedBadge } from '@/components/primitives/themed-badge';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedText } from '@/components/primitives/themed-text';
import { useTheme } from '@/design';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useBatchInvite, useRoomApplicants } from '@/services/my-rooms';
import type { RoomApplicant } from '@openhospi/shared/api-types';

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
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!invitable || invitable.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <ThemedText variant="body" color={colors.tertiaryForeground} style={styles.textCenter}>
          {t('noInvitable')}
        </ThemedText>
      </View>
    );
  }

  const renderApplicant = ({ item }: { item: RoomApplicant }) => {
    const avatarUri = item.avatarUrl
      ? getStoragePublicUrl(item.avatarUrl, 'profile-photos')
      : undefined;
    const isSelected = selected.has(item.applicationId);

    return (
      <Pressable onPress={() => toggleSelect(item.applicationId)}>
        <View style={[styles.applicantRow, { borderBottomColor: colors.border }]}>
          <View
            style={[
              styles.checkbox,
              {
                borderColor: isSelected ? colors.primary : colors.border,
                backgroundColor: isSelected ? colors.primary : 'transparent',
              },
            ]}>
            {isSelected && <Check size={14} color={colors.primaryForeground} />}
          </View>
          <View style={[styles.avatarCircle, { backgroundColor: colors.muted }]}>
            {avatarUri && <Image source={{ uri: avatarUri }} style={styles.avatarImage} />}
          </View>
          <ThemedText variant="subheadline" style={styles.flex1}>
            {item.firstName} {item.lastName}
          </ThemedText>
          <ThemedBadge variant="secondary" label={tEnums(`application_status.${item.status}`)} />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.flex1, { backgroundColor: colors.background }]}>
      <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
        <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
          {t('selected', { count: selected.size })}
        </ThemedText>
        <ThemedButton variant="outline" size="sm" onPress={selectAllLiked}>
          {t('selectAllLiked')}
        </ThemedButton>
      </View>

      <FlatList
        data={invitable}
        keyExtractor={(item) => item.applicationId}
        renderItem={renderApplicant}
      />

      <View
        style={[
          styles.bottomBar,
          { borderTopColor: colors.border, backgroundColor: colors.background },
        ]}>
        <ThemedButton
          onPress={handleInvite}
          disabled={selected.size === 0 || batchInvite.isPending}>
          {t('submit', { count: selected.size })}
        </ThemedButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  textCenter: {
    textAlign: 'center',
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  bottomBar: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
