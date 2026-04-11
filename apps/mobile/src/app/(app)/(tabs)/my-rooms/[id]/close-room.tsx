import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedText } from '@/components/primitives/themed-text';
import { useTheme } from '@/design';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useCloseRoom, useCloseRoomApplicants } from '@/services/my-rooms';

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
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
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
      <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent}>
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
                <Pressable
                  key={applicant.applicationId}
                  onPress={() => setSelectedId(isSelected ? null : applicant.applicationId)}>
                  <View
                    style={[
                      styles.applicantCard,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? `${colors.primary}1A` : 'transparent',
                      },
                    ]}>
                    <View style={[styles.avatarCircle, { backgroundColor: colors.muted }]}>
                      {avatarUri && (
                        <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                      )}
                    </View>
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
                </Pressable>
              );
            })}
          </View>
        ) : (
          <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
            {t('noApplicants')}
          </ThemedText>
        )}
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { borderTopColor: colors.border, backgroundColor: colors.background },
        ]}>
        {selectedId && (
          <ThemedButton variant="destructive" onPress={() => handleClose(true)}>
            {t('closeWithChoice')}
          </ThemedButton>
        )}
        <ThemedButton variant="outline" onPress={() => handleClose(false)}>
          {t('closeWithoutChoice')}
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
    borderRadius: 10,
    borderWidth: 1,
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
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  bottomBar: {
    padding: 16,
    paddingBottom: 32,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
