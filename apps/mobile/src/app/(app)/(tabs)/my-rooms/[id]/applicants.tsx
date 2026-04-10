import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedAvatar } from '@/components/primitives/themed-avatar';
import { ThemedBadge } from '@/components/primitives/themed-badge';
import { ThemedText } from '@/components/primitives/themed-text';
import { useTheme } from '@/design';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useMarkApplicationsSeen, useRoomApplicants } from '@/services/my-rooms';
import type { RoomApplicant } from '@openhospi/shared/api-types';
import type { BadgeVariant } from '@/components/primitives/themed-badge';

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  sent: 'outline',
  seen: 'secondary',
  liked: 'primary',
  maybe: 'secondary',
  rejected: 'destructive',
  hospi: 'primary',
  accepted: 'primary',
  not_chosen: 'destructive',
};

export default function ApplicantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms.applicants' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { colors } = useTheme();

  const { data: applicants, isLoading } = useRoomApplicants(id);
  const markSeen = useMarkApplicationsSeen();
  const markedRef = useRef(false);

  useEffect(() => {
    if (!markedRef.current && applicants?.some((a) => a.status === 'sent')) {
      markedRef.current = true;
      markSeen.mutate(id);
    }
  }, [applicants, id, markSeen]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!applicants || applicants.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <ThemedText variant="body" color={colors.tertiaryForeground} style={styles.textCenter}>
          {t('empty')}
        </ThemedText>
      </View>
    );
  }

  const renderApplicant = ({ item }: { item: RoomApplicant }) => {
    const avatarUri = item.avatarUrl
      ? getStoragePublicUrl(item.avatarUrl, 'profile-photos')
      : undefined;

    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/(app)/(tabs)/my-rooms/[id]/applicant/[applicantUserId]',
            params: { id, applicantUserId: item.userId },
          })
        }>
        <View style={[styles.applicantRow, { borderBottomColor: colors.border }]}>
          <ThemedAvatar source={avatarUri} fallback={item.firstName.charAt(0)} size={48} />
          <View style={styles.applicantInfo}>
            <ThemedText variant="body" weight="600">
              {item.firstName} {item.lastName}
            </ThemedText>
            {item.studyProgram && (
              <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
                {item.studyProgram}
              </ThemedText>
            )}
            <ThemedText variant="caption1" color={colors.tertiaryForeground}>
              {t('applied')} {new Date(item.appliedAt).toLocaleDateString()}
            </ThemedText>
          </View>
          <ThemedBadge
            variant={STATUS_BADGE_VARIANT[item.status] ?? 'outline'}
            label={tEnums(`application_status.${item.status}`)}
          />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.flex1, { backgroundColor: colors.background }]}>
      <FlatList
        data={applicants}
        keyExtractor={(item) => item.applicationId}
        renderItem={renderApplicant}
      />
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
  applicantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  applicantInfo: {
    flex: 1,
    gap: 2,
  },
});
