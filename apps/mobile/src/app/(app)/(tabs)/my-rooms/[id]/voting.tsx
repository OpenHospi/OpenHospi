import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedText } from '@/components/primitives/themed-text';
import { useTheme } from '@/design';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useSubmitVotes, useVotableApplicants, useVoteBoard } from '@/services/my-rooms';
import type { VotableApplicant } from '@openhospi/shared/api-types';

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

  // Initialize rankings from applicants data
  if (applicants && applicants.length > 0 && !initialized) {
    setRankings([...applicants]);
    setInitialized(true);
  }

  if (loadingApplicants || loadingBoard) {
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
          {t('noApplicants')}
        </ThemedText>
      </View>
    );
  }

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...rankings];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setRankings(next);
  };

  const moveDown = (index: number) => {
    if (index === rankings.length - 1) return;
    const next = [...rankings];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setRankings(next);
  };

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
      <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentPadding}>
          {/* Description */}
          <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
            {t('description')}
          </ThemedText>

          {/* Your ranking */}
          <View style={styles.section}>
            <ThemedText variant="body" weight="600">
              {t('yourRanking')}
            </ThemedText>
            {rankings.map((applicant, index) => {
              const avatarUri = applicant.avatarUrl
                ? getStoragePublicUrl(applicant.avatarUrl, 'profile-photos')
                : undefined;

              return (
                <View
                  key={applicant.userId}
                  style={[styles.rankRow, { borderBottomColor: colors.border }]}>
                  <ThemedText variant="body" weight="bold" style={styles.rankNumber}>
                    {index + 1}
                  </ThemedText>
                  <View style={[styles.avatarCircle, { backgroundColor: colors.muted }]}>
                    {avatarUri && <Image source={{ uri: avatarUri }} style={styles.avatarImage} />}
                  </View>
                  <ThemedText variant="subheadline" style={styles.flex1}>
                    {applicant.firstName} {applicant.lastName}
                  </ThemedText>
                  <View style={styles.arrowRow}>
                    <Pressable
                      onPress={() => moveUp(index)}
                      disabled={index === 0}
                      accessibilityLabel={t('moveUp')}>
                      <ChevronUp size={20} color={index === 0 ? colors.muted : colors.foreground} />
                    </Pressable>
                    <Pressable
                      onPress={() => moveDown(index)}
                      disabled={index === rankings.length - 1}
                      accessibilityLabel={t('moveDown')}>
                      <ChevronDown
                        size={20}
                        color={index === rankings.length - 1 ? colors.muted : colors.foreground}
                      />
                    </Pressable>
                  </View>
                </View>
              );
            })}

            <ThemedButton onPress={handleSubmit} disabled={submitVotes.isPending}>
              {t('submitVotes')}
            </ThemedButton>
          </View>

          {/* Vote board */}
          {board && (
            <View style={styles.section}>
              <Pressable onPress={() => setShowBoard(!showBoard)}>
                <View style={styles.boardHeader}>
                  <ThemedText variant="body" weight="600">
                    {t('voteBoard')}
                  </ThemedText>
                  {showBoard ? (
                    <ChevronUp size={16} color={colors.foreground} />
                  ) : (
                    <ChevronDown size={16} color={colors.foreground} />
                  )}
                </View>
              </Pressable>

              {showBoard && (
                <View style={styles.boardContent}>
                  {/* Aggregated rankings */}
                  <View style={[styles.boardHeaderRow, { borderBottomColor: colors.border }]}>
                    <ThemedText variant="caption1" weight="600" style={styles.flex1}>
                      {t('applicant')}
                    </ThemedText>
                    <ThemedText variant="caption1" weight="600" style={styles.totalColumn}>
                      {t('total')}
                    </ThemedText>
                  </View>
                  {board.aggregated.map((agg) => {
                    const applicant = board.applicants.find((a) => a.userId === agg.applicantId);
                    return (
                      <View
                        key={agg.applicantId}
                        style={[styles.boardRow, { borderBottomColor: colors.border }]}>
                        <ThemedText variant="subheadline" style={styles.flex1}>
                          {applicant
                            ? `${applicant.firstName} ${applicant.lastName}`
                            : agg.applicantId}
                        </ThemedText>
                        <ThemedText variant="subheadline" style={styles.totalColumn}>
                          {agg.totalRank} ({agg.voteCount})
                        </ThemedText>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
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
  scrollContent: {
    paddingBottom: 100,
  },
  contentPadding: {
    padding: 16,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rankNumber: {
    width: 24,
    textAlign: 'center',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 36,
    height: 36,
  },
  arrowRow: {
    flexDirection: 'row',
    gap: 4,
  },
  boardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  boardContent: {
    gap: 4,
  },
  boardHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  boardRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  totalColumn: {
    width: 60,
    textAlign: 'right',
  },
});
