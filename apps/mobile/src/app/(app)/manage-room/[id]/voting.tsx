import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';

import { AnimatedPressable } from '@/components/shared/animated-pressable';
import { ThemedAvatar } from '@/components/native/avatar';
import { NativeButton } from '@/components/native/button';
import { NativeIcon } from '@/components/native/icon';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { GroupedSection } from '@/components/layout/grouped-section';
import { NativeDivider } from '@/components/native/divider';
import { useTheme } from '@/design';
import { SPRING_SNAPPY } from '@/lib/animations';
import { hapticLight, hapticMedium } from '@/lib/haptics';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useSubmitVotes, useVotableApplicants, useVoteBoard } from '@/services/my-rooms';
import type { VotableApplicant } from '@openhospi/shared/api-types';

const ROW_HEIGHT = 60;

function SkeletonVoting() {
  return (
    <View style={styles.skeletonContainer}>
      <ThemedSkeleton width="80%" height={16} />
      <ThemedSkeleton width="40%" height={18} />
      {Array.from({ length: 4 }, (_, i) => (
        <View key={i} style={styles.skeletonRow}>
          <ThemedSkeleton width={24} height={20} />
          <ThemedSkeleton width={36} height={36} rounded="full" />
          <ThemedSkeleton width="50%" height={16} />
          <ThemedSkeleton width={20} height={20} />
        </View>
      ))}
      <ThemedSkeleton width="100%" height={44} rounded="lg" />
    </View>
  );
}

function DraggableItem({
  applicant,
  index,
  totalCount,
  onReorder,
}: {
  applicant: VotableApplicant;
  index: number;
  totalCount: number;
  onReorder: (fromIndex: number, toIndex: number) => void;
}) {
  const { colors } = useTheme();
  const translateY = useSharedValue(0);
  const isActive = useSharedValue(false);
  const zIndex = useSharedValue(0);

  const avatarUri = applicant.avatarUrl
    ? getStoragePublicUrl(applicant.avatarUrl, 'profile-photos')
    : undefined;

  const pan = Gesture.Pan()
    .onStart(() => {
      isActive.value = true;
      zIndex.value = 100;
      runOnJS(hapticMedium)();
    })
    .onUpdate((e) => {
      translateY.value = e.translationY;
    })
    .onEnd(() => {
      const movedSlots = Math.round(translateY.value / ROW_HEIGHT);
      const newIndex = Math.max(0, Math.min(totalCount - 1, index + movedSlots));

      if (newIndex !== index) {
        runOnJS(onReorder)(index, newIndex);
        runOnJS(hapticLight)();
      }

      translateY.value = withSpring(0, SPRING_SNAPPY);
      isActive.value = false;
      zIndex.value = 0;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    zIndex: zIndex.value,
    opacity: isActive.value ? 0.9 : 1,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <View style={[styles.rankRow, { borderBottomColor: colors.separator }]}>
        <ThemedText variant="body" weight="bold" style={styles.rankNumber}>
          {index + 1}
        </ThemedText>
        <ThemedAvatar source={avatarUri} fallback={applicant.firstName.charAt(0)} size={36} />
        <ThemedText variant="subheadline" style={styles.flex1}>
          {applicant.firstName} {applicant.lastName}
        </ThemedText>
        <GestureDetector gesture={pan}>
          <Animated.View style={styles.dragHandle}>
            <NativeIcon
              name="line.3.horizontal"
              androidName="drag-indicator"
              size={20}
              color={colors.tertiaryForeground}
            />
          </Animated.View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
}

export default function VotingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms.voting' });
  const { colors } = useTheme();

  const { data: applicants, isLoading: loadingApplicants } = useVotableApplicants(id);
  const { data: board, isLoading: loadingBoard } = useVoteBoard(id);
  const submitVotes = useSubmitVotes();

  const [rankings, setRankings] = useState<VotableApplicant[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [showBoard, setShowBoard] = useState(false);

  if (applicants && applicants.length > 0 && !initialized) {
    setRankings([...applicants]);
    setInitialized(true);
  }

  const handleReorder = (fromIndex: number, toIndex: number) => {
    setRankings((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  if (loadingApplicants || loadingBoard) {
    return <SkeletonVoting />;
  }

  if (!applicants || applicants.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <ThemedText variant="body" color={colors.tertiaryForeground} style={styles.textCenter}>
          {t('noApplicants')}
        </ThemedText>
      </View>
    );
  }

  const handleSubmit = () => {
    submitVotes.mutate({
      roomId: id,
      rankings: rankings.map((a, i) => ({
        applicantId: a.userId,
        rank: i + 1,
      })),
    });
  };

  return (
    <View style={[styles.flex1, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.flex1}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentPadding}>
          <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
            {t('description')}
          </ThemedText>

          {/* Ranking */}
          <GroupedSection inset={false}>
            <View style={styles.sectionHeader}>
              <ThemedText variant="body" weight="600">
                {t('yourRanking')}
              </ThemedText>
            </View>
            {rankings.map((applicant, index) => (
              <DraggableItem
                key={applicant.userId}
                applicant={applicant}
                index={index}
                totalCount={rankings.length}
                onReorder={handleReorder}
              />
            ))}
          </GroupedSection>

          <NativeButton
            label={t('submitVotes')}
            onPress={handleSubmit}
            disabled={submitVotes.isPending}
          />

          {/* Vote board */}
          {board && (
            <GroupedSection inset={false}>
              <AnimatedPressable
                onPress={() => {
                  hapticLight();
                  setShowBoard(!showBoard);
                }}>
                <View style={styles.boardToggle}>
                  <ThemedText variant="body" weight="600">
                    {t('voteBoard')}
                  </ThemedText>
                  <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                    {showBoard ? '▲' : '▼'}
                  </ThemedText>
                </View>
              </AnimatedPressable>

              {showBoard && (
                <View style={styles.boardContent}>
                  <NativeDivider />
                  <View style={[styles.boardHeaderRow, { borderBottomColor: colors.separator }]}>
                    <ThemedText variant="caption1" weight="600" style={styles.flex1}>
                      {t('applicant')}
                    </ThemedText>
                    <ThemedText variant="caption1" weight="600" style={styles.totalColumn}>
                      {t('total')}
                    </ThemedText>
                  </View>
                  {board.aggregated.map((agg) => {
                    const match = board.applicants.find((a) => a.userId === agg.applicantId);
                    return (
                      <View
                        key={agg.applicantId}
                        style={[styles.boardRow, { borderBottomColor: colors.separator }]}>
                        <ThemedText variant="subheadline" style={styles.flex1}>
                          {match ? `${match.firstName} ${match.lastName}` : agg.applicantId}
                        </ThemedText>
                        <ThemedText variant="subheadline" style={styles.totalColumn}>
                          {agg.totalRank} ({agg.voteCount})
                        </ThemedText>
                      </View>
                    );
                  })}
                </View>
              )}
            </GroupedSection>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
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
  scrollContent: {
    paddingBottom: 100,
  },
  contentPadding: {
    padding: 16,
    gap: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    height: ROW_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rankNumber: {
    width: 24,
    textAlign: 'center',
  },
  dragHandle: {
    padding: 8,
  },
  boardToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  boardContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  boardHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  boardRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  totalColumn: {
    width: 60,
    textAlign: 'right',
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
