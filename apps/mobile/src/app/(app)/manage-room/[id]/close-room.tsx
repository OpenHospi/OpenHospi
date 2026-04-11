import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AnimatedPressable } from '@/components/shared/animated-pressable';
import { ThemedAvatar } from '@/components/primitives/themed-avatar';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedSkeleton } from '@/components/primitives/themed-skeleton';
import { ThemedText } from '@/components/primitives/themed-text';
import { BlurBottomBar } from '@/components/layout/blur-bottom-bar';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticLight } from '@/lib/haptics';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useCloseRoom, useCloseRoomApplicants } from '@/services/my-rooms';

function SkeletonCloseRoom() {
  return (
    <View style={styles.skeletonContainer}>
      <ThemedSkeleton width="80%" height={16} />
      <ThemedSkeleton width="50%" height={18} />
      <ThemedSkeleton width="60%" height={14} />
      {Array.from({ length: 3 }, (_, i) => (
        <View key={i} style={styles.skeletonRow}>
          <ThemedSkeleton width={40} height={40} rounded="full" />
          <ThemedSkeleton width="50%" height={16} />
          <ThemedSkeleton width={20} height={20} rounded="full" />
        </View>
      ))}
    </View>
  );
}

export default function CloseRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms.closeRoom' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { colors } = useTheme();

  const { data: applicants, isLoading } = useCloseRoomApplicants(id);
  const closeRoom = useCloseRoom();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) {
    return <SkeletonCloseRoom />;
  }

  const handleClose = (withChoice: boolean) => {
    const title = t('confirmTitle');
    const message = withChoice ? t('confirmWithChoice') : t('confirmWithoutChoice');

    Alert.alert(title, message, [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: t('confirm'),
        style: 'destructive',
        onPress: async () => {
          await closeRoom.mutateAsync({
            roomId: id,
            chosenApplicationId: withChoice ? (selectedId ?? undefined) : undefined,
          });
          router.replace('/(app)/(tabs)/my-rooms');
        },
      },
    ]);
  };

  return (
    <View style={[styles.flex1, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.flex1}
        contentContainerStyle={styles.scrollContent}>
        <ThemedText variant="subheadline">{t('description')}</ThemedText>

        {applicants && applicants.length > 0 ? (
          <View style={styles.applicantSection}>
            <ThemedText variant="body" weight="600">
              {t('chooseApplicant')}
            </ThemedText>
            <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
              {t('chooseHint')}
            </ThemedText>

            {applicants.map((applicant) => {
              const avatarUri = applicant.avatarUrl
                ? getStoragePublicUrl(applicant.avatarUrl, 'profile-photos')
                : undefined;
              const isSelected = selectedId === applicant.applicationId;

              return (
                <AnimatedPressable
                  key={applicant.applicationId}
                  onPress={() => {
                    hapticLight();
                    setSelectedId(isSelected ? null : applicant.applicationId);
                  }}>
                  <View
                    style={[
                      styles.applicantCard,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? `${colors.primary}1A` : 'transparent',
                        borderRadius: radius.lg,
                      },
                    ]}>
                    <ThemedAvatar
                      source={avatarUri}
                      fallback={applicant.firstName.charAt(0)}
                      size={40}
                    />
                    <View style={styles.flex1}>
                      <ThemedText variant="subheadline" weight="500">
                        {applicant.firstName} {applicant.lastName}
                      </ThemedText>
                      {applicant.totalRank != null && (
                        <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                          {t('rankScore', { score: applicant.totalRank })}
                        </ThemedText>
                      )}
                    </View>
                    <View
                      style={[
                        styles.radioCircle,
                        {
                          borderColor: isSelected ? colors.primary : colors.tertiaryForeground,
                          backgroundColor: isSelected ? colors.primary : 'transparent',
                        },
                      ]}
                    />
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>
        ) : (
          <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
            {t('noApplicants')}
          </ThemedText>
        )}
      </ScrollView>

      <BlurBottomBar>
        {selectedId && (
          <ThemedButton variant="destructive" onPress={() => handleClose(true)}>
            {t('closeWithChoice')}
          </ThemedButton>
        )}
        <ThemedButton variant="outline" onPress={() => handleClose(false)}>
          {t('closeWithoutChoice')}
        </ThemedButton>
      </BlurBottomBar>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  applicantSection: {
    gap: 8,
  },
  applicantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderWidth: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  skeletonContainer: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
