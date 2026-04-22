import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AnimatedPressable } from '@/components/shared/animated-pressable';
import { SwipeableRow } from '@/components/shared/swipeable-row';
import { NativeEmptyState } from '@/components/feedback/native-empty-state';
import { ThemedBadge } from '@/components/native/badge';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { NativeDivider } from '@/components/native/divider';
import { PlatformSurface } from '@/components/layout/platform-surface';
import { NativeButton } from '@/components/native/button';
import { useTheme } from '@/design';
import { useCancelEvent, useRoomEvents } from '@/services/my-rooms';
import type { EventSummary } from '@openhospi/shared/api-types';

type ListItem = { type: 'header'; title: string } | { type: 'event'; data: EventSummary };

function SkeletonEventsList() {
  return (
    <View style={styles.skeletonContainer}>
      <ThemedSkeleton width="30%" height={14} />
      <ThemedSkeleton width="70%" height={18} />
      <ThemedSkeleton width="50%" height={14} />
      <ThemedSkeleton width="30%" height={12} />
      <View style={styles.skeletonSpacer} />
      <ThemedSkeleton width="70%" height={18} />
      <ThemedSkeleton width="50%" height={14} />
      <ThemedSkeleton width="30%" height={12} />
    </View>
  );
}

export default function EventsListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms.events' });
  const { bottom } = useSafeAreaInsets();
  const { colors, spacing } = useTheme();

  const { data: events, isLoading } = useRoomEvents(id);
  const cancelEvent = useCancelEvent();

  const today = new Date().toISOString().split('T')[0];

  const listItems: ListItem[] = [];
  if (events) {
    const upcoming: EventSummary[] = [];
    const past: EventSummary[] = [];
    for (const event of events) {
      if (event.eventDate >= today) {
        upcoming.push(event);
      } else {
        past.push(event);
      }
    }

    if (upcoming.length > 0) {
      listItems.push({ type: 'header', title: t('upcoming') });
      for (const e of upcoming) listItems.push({ type: 'event', data: e });
    }
    if (past.length > 0) {
      listItems.push({ type: 'header', title: t('past') });
      for (const e of past) listItems.push({ type: 'event', data: e });
    }
  }

  if (isLoading) {
    return <SkeletonEventsList />;
  }

  if (!events || events.length === 0) {
    return (
      <NativeEmptyState
        sfSymbol="calendar"
        title={t('title')}
        subtitle={t('empty')}
        actionLabel={t('create')}
        onAction={() =>
          router.push({
            pathname: '/(app)/manage-room/[id]/events/create',
            params: { id },
          })
        }
      />
    );
  }

  const handleCancel = (event: EventSummary) => {
    Alert.alert(t('cancelConfirmTitle'), t('cancelConfirmDescription'), [
      { text: t('keepEvent'), style: 'cancel' },
      {
        text: t('confirmCancel'),
        style: 'destructive',
        onPress: () => cancelEvent.mutate({ roomId: id, eventId: event.id }),
      },
    ]);
  };

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      return (
        <View style={[styles.sectionHeader, { backgroundColor: `${colors.muted}4D` }]}>
          <ThemedText variant="subheadline" weight="600">
            {item.title}
          </ThemedText>
        </View>
      );
    }

    const event = item.data;
    const isCancelled = !!event.cancelledAt;

    const swipeActions = !isCancelled
      ? [
          {
            iconName: 'xmark',
            color: '#fff',
            backgroundColor: colors.destructive,
            accessibilityLabel: t('cancelEvent'),
            onPress: () => handleCancel(event),
          },
        ]
      : undefined;

    return (
      <SwipeableRow rightActions={swipeActions}>
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={event.title}
          onPress={() =>
            router.push({
              pathname: '/(app)/manage-room/[id]/events/[eventId]',
              params: { id, eventId: event.id },
            })
          }>
          <View
            style={[
              styles.eventRow,
              {
                opacity: isCancelled ? 0.5 : 1,
                backgroundColor: colors.background,
              },
            ]}>
            <View style={styles.eventTitleRow}>
              <ThemedText variant="body" weight="600">
                {event.title}
              </ThemedText>
              {isCancelled && <ThemedBadge variant="destructive" label={t('cancelled')} />}
            </View>
            <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
              {event.eventDate} {event.timeStart}
              {event.timeEnd ? ` - ${event.timeEnd}` : ''}
            </ThemedText>
            {event.location && (
              <ThemedText variant="subheadline" color={colors.tertiaryForeground}>
                {event.location}
              </ThemedText>
            )}
            <ThemedText variant="caption1" color={colors.tertiaryForeground}>
              {t('attendingCount', { attending: event.attendingCount, total: event.invitedCount })}
            </ThemedText>
          </View>
        </AnimatedPressable>
      </SwipeableRow>
    );
  };

  return (
    <View style={[styles.flex1, { backgroundColor: colors.background }]}>
      <FlashList
        contentInsetAdjustmentBehavior="automatic"
        data={listItems}
        keyExtractor={(item) => (item.type === 'header' ? `h-${item.title}` : item.data.id)}
        renderItem={renderItem}
        getItemType={(item) => item.type}
        ItemSeparatorComponent={NativeDivider}
      />
      <PlatformSurface
        variant="chrome"
        edge="bottom"
        glass="regular"
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: Math.max(bottom, spacing.lg),
          gap: spacing.sm,
        }}>
        <NativeButton
          label={t('create')}
          onPress={() =>
            router.push({
              pathname: '/(app)/manage-room/[id]/events/create',
              params: { id },
            })
          }
        />
      </PlatformSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  eventRow: {
    padding: 16,
    gap: 4,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skeletonContainer: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  skeletonSpacer: {
    height: 8,
  },
});
