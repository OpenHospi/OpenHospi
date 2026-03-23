import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { getStoragePublicUrl } from '@/lib/storage-url';
import { useSubmitVotes, useVotableApplicants, useVoteBoard } from '@/services/my-rooms';
import type { VotableApplicant } from '@openhospi/shared/api-types';

export default function VotingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms.voting' });

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
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        className="bg-background">
        <ActivityIndicator className="accent-primary" />
      </View>
    );
  }

  if (!applicants || applicants.length === 0) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}
        className="bg-background">
        <Text variant="muted" className="text-center text-base">
          {t('noApplicants')}
        </Text>
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
    <View style={{ flex: 1 }} className="bg-background">
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ padding: 16, gap: 16 }}>
          {/* Description */}
          <Text variant="muted" className="text-sm">
            {t('description')}
          </Text>

          {/* Your ranking */}
          <View style={{ gap: 8 }}>
            <Text className="text-foreground font-semibold">{t('yourRanking')}</Text>
            {rankings.map((applicant, index) => {
              const avatarUri = applicant.avatarUrl
                ? getStoragePublicUrl(applicant.avatarUrl, 'profile-photos')
                : undefined;

              return (
                <View
                  key={applicant.userId}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 8,
                  }}
                  className="border-border border-b">
                  <Text className="text-foreground w-6 text-center font-bold">{index + 1}</Text>
                  <View
                    className="bg-muted overflow-hidden rounded-full"
                    style={{ width: 36, height: 36 }}>
                    {avatarUri && (
                      <Image source={{ uri: avatarUri }} style={{ width: 36, height: 36 }} />
                    )}
                  </View>
                  <Text className="text-foreground text-sm" style={{ flex: 1 }}>
                    {applicant.firstName} {applicant.lastName}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <Pressable
                      onPress={() => moveUp(index)}
                      disabled={index === 0}
                      accessibilityLabel={t('moveUp')}>
                      <ChevronUp
                        size={20}
                        className={index === 0 ? 'text-muted' : 'text-foreground'}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => moveDown(index)}
                      disabled={index === rankings.length - 1}
                      accessibilityLabel={t('moveDown')}>
                      <ChevronDown
                        size={20}
                        className={index === rankings.length - 1 ? 'text-muted' : 'text-foreground'}
                      />
                    </Pressable>
                  </View>
                </View>
              );
            })}

            <Button onPress={handleSubmit} disabled={submitVotes.isPending}>
              <Text>{t('submitVotes')}</Text>
            </Button>
          </View>

          {/* Vote board */}
          {board && (
            <View style={{ gap: 8 }}>
              <Pressable onPress={() => setShowBoard(!showBoard)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text className="text-foreground font-semibold">{t('voteBoard')}</Text>
                  {showBoard ? (
                    <ChevronUp size={16} className="text-foreground" />
                  ) : (
                    <ChevronDown size={16} className="text-foreground" />
                  )}
                </View>
              </Pressable>

              {showBoard && (
                <View style={{ gap: 4 }}>
                  {/* Aggregated rankings */}
                  <View
                    style={{
                      flexDirection: 'row',
                      paddingVertical: 8,
                      paddingHorizontal: 4,
                    }}
                    className="border-border border-b">
                    <Text className="text-foreground text-xs font-semibold" style={{ flex: 1 }}>
                      {t('applicant')}
                    </Text>
                    <Text
                      className="text-foreground text-xs font-semibold"
                      style={{ width: 60, textAlign: 'right' }}>
                      {t('total')}
                    </Text>
                  </View>
                  {board.aggregated.map((agg) => {
                    const applicant = board.applicants.find((a) => a.userId === agg.applicantId);
                    return (
                      <View
                        key={agg.applicantId}
                        style={{
                          flexDirection: 'row',
                          paddingVertical: 6,
                          paddingHorizontal: 4,
                        }}
                        className="border-border border-b">
                        <Text className="text-foreground text-sm" style={{ flex: 1 }}>
                          {applicant
                            ? `${applicant.firstName} ${applicant.lastName}`
                            : agg.applicantId}
                        </Text>
                        <Text
                          className="text-foreground text-sm"
                          style={{ width: 60, textAlign: 'right' }}>
                          {agg.totalRank} ({agg.voteCount})
                        </Text>
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
