import { ReviewDecision } from '@openhospi/shared/enums';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { PhotoCarousel } from '@/components/photo-carousel';
import { ThemedBadge } from '@/components/primitives/themed-badge';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedInput } from '@/components/primitives/themed-input';
import { ThemedText } from '@/components/primitives/themed-text';
import { GroupedSection } from '@/components/layout/grouped-section';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticLight } from '@/lib/haptics';
import { useRoomApplicants, useSubmitReview, useUpdateApplicantStatus } from '@/services/my-rooms';

const DECISIONS = [ReviewDecision.like, ReviewDecision.maybe, ReviewDecision.reject] as const;

function getDecisionColor(d: string): { bg: string; border: string } {
  switch (d) {
    case ReviewDecision.like:
      return { bg: 'rgba(22, 163, 74, 0.1)', border: '#16a34a' };
    case ReviewDecision.maybe:
      return { bg: 'rgba(234, 179, 8, 0.1)', border: '#eab308' };
    case ReviewDecision.reject:
      return { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444' };
    default:
      return { bg: 'transparent', border: 'transparent' };
  }
}

export default function ApplicantDetailScreen() {
  const { id, applicantUserId } = useLocalSearchParams<{ id: string; applicantUserId: string }>();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms.applicants' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();

  const { data: applicants, isLoading } = useRoomApplicants(id);
  const submitReview = useSubmitReview();
  const updateStatus = useUpdateApplicantStatus();

  const applicant = applicants?.find((a: { userId: string }) => a.userId === applicantUserId);

  const existingReview = applicant?.reviews.find(
    (r: { reviewerId: string }) => r.reviewerId !== applicantUserId
  );
  const [decision, setDecision] = useState<string | null>(existingReview?.decision ?? null);
  const [notes, setNotes] = useState(existingReview?.notes ?? '');

  if (isLoading || !applicant) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const age = applicant.birthDate
    ? Math.floor(
        (Date.now() - new Date(applicant.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  const handleSubmitReview = () => {
    if (!decision) return;
    submitReview.mutate({
      roomId: id,
      applicantUserId,
      data: { decision, notes: notes || undefined },
    });
  };

  const handleStatusAction = (newStatus: string, label: string) => {
    Alert.alert(label, t('acceptConfirmDescription', { name: applicant.firstName }), [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: tCommon('confirm'),
        style: 'destructive',
        onPress: () =>
          updateStatus.mutate({
            roomId: id,
            applicationId: applicant.applicationId,
            status: newStatus,
          }),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {applicant.photos.length > 0 && (
          <PhotoCarousel photos={applicant.photos} bucket="profile-photos" />
        )}

        <View style={styles.body}>
          <View style={styles.nameRow}>
            <ThemedText variant="title2">
              {applicant.firstName} {applicant.lastName}
            </ThemedText>
            <ThemedBadge
              variant="secondary"
              label={tEnums(`application_status.${applicant.status}`)}
            />
          </View>

          <GroupedSection>
            <View style={styles.sectionContent}>
              <ThemedText variant="headline">{t('aboutThem')}</ThemedText>
              {applicant.bio && (
                <ThemedText variant="body" color={colors.secondaryForeground}>
                  {applicant.bio}
                </ThemedText>
              )}
              <View style={styles.metaWrap}>
                {age != null && (
                  <ThemedText variant="footnote" color={colors.tertiaryForeground}>
                    {age} {t('yearsOld')}
                  </ThemedText>
                )}
                {applicant.studyProgram && (
                  <ThemedText variant="footnote" color={colors.tertiaryForeground}>
                    {applicant.studyProgram}
                  </ThemedText>
                )}
                {applicant.studyLevel && (
                  <ThemedText variant="footnote" color={colors.tertiaryForeground}>
                    {tEnums(`study_level.${applicant.studyLevel}`)}
                  </ThemedText>
                )}
              </View>
            </View>
          </GroupedSection>

          {applicant.lifestyleTags.length > 0 && (
            <GroupedSection>
              <View style={styles.sectionContent}>
                <ThemedText variant="headline">{t('lifestyle')}</ThemedText>
                <View style={styles.tagWrap}>
                  {applicant.lifestyleTags.map((tag: string) => (
                    <ThemedBadge
                      key={tag}
                      variant="secondary"
                      label={tEnums(`lifestyle_tag.${tag}`)}
                    />
                  ))}
                </View>
              </View>
            </GroupedSection>
          )}

          {applicant.personalMessage && (
            <GroupedSection>
              <View style={styles.sectionContent}>
                <ThemedText variant="headline">{t('personalMessage')}</ThemedText>
                <ThemedText variant="body" color={colors.secondaryForeground}>
                  {applicant.personalMessage}
                </ThemedText>
              </View>
            </GroupedSection>
          )}

          <GroupedSection>
            <View style={styles.sectionContent}>
              <ThemedText variant="headline">{t('yourReview')}</ThemedText>

              <ThemedText variant="footnote" color={colors.tertiaryForeground}>
                {t('decision')}
              </ThemedText>
              <View style={styles.decisionRow}>
                {DECISIONS.map((d) => {
                  const isSelected = decision === d;
                  const decisionColors = getDecisionColor(d);

                  return (
                    <Pressable
                      key={d}
                      onPress={() => {
                        hapticLight();
                        setDecision(d);
                      }}
                      style={[
                        styles.decisionButton,
                        {
                          borderColor: isSelected ? decisionColors.border : colors.border,
                          backgroundColor: isSelected ? decisionColors.bg : 'transparent',
                          borderRadius: radius.md,
                        },
                      ]}>
                      <ThemedText variant="subheadline" weight="500">
                        {t(d)}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <ThemedText variant="footnote" color={colors.tertiaryForeground}>
                {t('notes')}
              </ThemedText>
              <ThemedInput
                value={notes}
                onChangeText={setNotes}
                placeholder={t('notesPlaceholder')}
              />

              <ThemedButton
                onPress={handleSubmitReview}
                loading={submitReview.isPending}
                disabled={!decision}>
                {t('submitReview')}
              </ThemedButton>
            </View>
          </GroupedSection>

          {applicant.reviews.length > 0 && (
            <GroupedSection>
              <View style={styles.sectionContent}>
                <ThemedText variant="headline">Reviews</ThemedText>
                {applicant.reviews.map((review) => (
                  <View key={review.reviewerId} style={styles.reviewRow}>
                    <ThemedText variant="subheadline" weight="500">
                      {review.reviewerName}
                    </ThemedText>
                    <ThemedBadge variant="secondary" label={t(review.decision)} />
                    {review.notes && (
                      <ThemedText
                        variant="caption1"
                        color={colors.tertiaryForeground}
                        style={styles.reviewNotes}>
                        {review.notes}
                      </ThemedText>
                    )}
                  </View>
                ))}
              </View>
            </GroupedSection>
          )}
        </View>
      </ScrollView>

      {applicant.status !== 'accepted' && applicant.status !== 'rejected' && (
        <View
          style={[
            styles.bottomBar,
            {
              borderTopColor: colors.separator,
              paddingBottom: Math.max(bottom, 16),
            },
          ]}>
          <ThemedButton
            variant="outline"
            style={styles.bottomButton}
            onPress={() => handleStatusAction('rejected', t('rejected'))}>
            {t('rejected')}
          </ThemedButton>
          <ThemedButton
            style={styles.bottomButton}
            onPress={() => handleStatusAction('accepted', t('accept'))}>
            {t('accept')}
          </ThemedButton>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  body: {
    padding: 16,
    gap: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionContent: {
    padding: 16,
    gap: 12,
  },
  metaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  decisionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  decisionButton: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewNotes: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomButton: {
    flex: 1,
  },
});
