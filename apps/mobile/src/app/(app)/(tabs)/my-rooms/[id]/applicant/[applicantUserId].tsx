import { ReviewDecision } from '@openhospi/shared/enums';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PhotoCarousel } from '@/components/photo-carousel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useRoomApplicants, useSubmitReview, useUpdateApplicantStatus } from '@/services/my-rooms';

const DECISIONS = [ReviewDecision.like, ReviewDecision.maybe, ReviewDecision.reject] as const;

const DECISION_STYLE: Record<string, string> = {
  [ReviewDecision.like]: 'bg-green-100 border-green-500 dark:bg-green-950',
  [ReviewDecision.maybe]: 'bg-yellow-100 border-yellow-500 dark:bg-yellow-950',
  [ReviewDecision.reject]: 'bg-red-100 border-red-500 dark:bg-red-950',
};

export default function ApplicantDetailScreen() {
  const { id, applicantUserId } = useLocalSearchParams<{ id: string; applicantUserId: string }>();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms.applicants' });
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const { data: applicants, isLoading } = useRoomApplicants(id);
  const submitReview = useSubmitReview();
  const updateStatus = useUpdateApplicantStatus();

  const applicant = applicants?.find((a) => a.userId === applicantUserId);

  const existingReview = applicant?.reviews.find((r) => r.reviewerId !== applicantUserId);
  const [decision, setDecision] = useState<string | null>(existingReview?.decision ?? null);
  const [notes, setNotes] = useState(existingReview?.notes ?? '');

  if (isLoading || !applicant) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        className="bg-background">
        <ActivityIndicator className="accent-primary" />
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
    <View style={{ flex: 1 }} className="bg-background">
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Photos */}
        {applicant.photos.length > 0 && (
          <PhotoCarousel photos={applicant.photos} bucket="profile-photos" />
        )}

        <View style={{ padding: 16, gap: 16 }}>
          {/* Name + Status */}
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text className="text-foreground text-xl font-bold">
              {applicant.firstName} {applicant.lastName}
            </Text>
            <Badge variant="secondary">
              <Text>{tEnums(`application_status.${applicant.status}`)}</Text>
            </Badge>
          </View>

          {/* About */}
          <View style={{ gap: 8 }}>
            <Text className="text-foreground font-semibold">{t('aboutThem')}</Text>
            {applicant.bio && <Text className="text-foreground text-sm">{applicant.bio}</Text>}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {age != null && (
                <Text variant="muted" className="text-sm">
                  {age} {t('yearsOld')}
                </Text>
              )}
              {applicant.studyProgram && (
                <Text variant="muted" className="text-sm">
                  {applicant.studyProgram}
                </Text>
              )}
              {applicant.studyLevel && (
                <Text variant="muted" className="text-sm">
                  {tEnums(`study_level.${applicant.studyLevel}`)}
                </Text>
              )}
            </View>
          </View>

          {/* Lifestyle */}
          {applicant.lifestyleTags.length > 0 && (
            <View style={{ gap: 8 }}>
              <Text className="text-foreground font-semibold">{t('lifestyle')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {applicant.lifestyleTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="rounded-lg px-2 py-1">
                    <Text>{tEnums(`lifestyle_tag.${tag}`)}</Text>
                  </Badge>
                ))}
              </View>
            </View>
          )}

          {/* Personal message */}
          {applicant.personalMessage && (
            <View style={{ gap: 8 }}>
              <Text className="text-foreground font-semibold">{t('personalMessage')}</Text>
              <Text className="text-foreground text-sm">{applicant.personalMessage}</Text>
            </View>
          )}

          {/* Your review */}
          <View style={{ gap: 12 }}>
            <Text className="text-foreground font-semibold">{t('yourReview')}</Text>

            <Text variant="muted" className="text-sm">
              {t('decision')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {DECISIONS.map((d) => (
                <Button
                  key={d}
                  variant="outline"
                  size="sm"
                  className={cn('flex-1 border', decision === d && DECISION_STYLE[d])}
                  onPress={() => setDecision(d)}>
                  <Text>{t(d)}</Text>
                </Button>
              ))}
            </View>

            <Text variant="muted" className="text-sm">
              {t('notes')}
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder={t('notesPlaceholder')}
              multiline
              numberOfLines={3}
              className="border-border bg-background text-foreground rounded-lg border p-3 text-sm"
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />

            <Button onPress={handleSubmitReview} disabled={!decision || submitReview.isPending}>
              <Text>{t('submitReview')}</Text>
            </Button>
          </View>

          {/* Existing reviews from housemates */}
          {applicant.reviews.length > 0 && (
            <View style={{ gap: 8 }}>
              <Text className="text-foreground font-semibold">Reviews</Text>
              {applicant.reviews.map((review) => (
                <View
                  key={review.reviewerId}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text className="text-foreground text-sm font-medium">{review.reviewerName}</Text>
                  <Badge variant="secondary">
                    <Text>{t(review.decision)}</Text>
                  </Badge>
                  {review.notes && (
                    <Text variant="muted" className="text-xs" style={{ flex: 1 }}>
                      {review.notes}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom action */}
      <View
        style={{ padding: 16, paddingBottom: 32 }}
        className="border-border bg-background border-t">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {applicant.status !== 'accepted' && applicant.status !== 'rejected' && (
            <>
              <View style={{ flex: 1 }}>
                <Button
                  variant="outline"
                  onPress={() => handleStatusAction('rejected', t('rejected'))}>
                  <Text>{t('rejected')}</Text>
                </Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button onPress={() => handleStatusAction('accepted', t('accept'))}>
                  <Text>{t('accept')}</Text>
                </Button>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
