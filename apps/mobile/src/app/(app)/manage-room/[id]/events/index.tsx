import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, X } from 'lucide-react-native';
import { useMemo } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AnimatedPressable } from '@/components/shared/animated-pressable';
import { SwipeableRow } from '@/components/shared/swipeable-row';
import { NativeEmptyState } from '@/components/feedback/native-empty-state';
import { ThemedBadge } from '@/components/primitives/themed-badge';
import { ThemedSkeleton } from '@/components/primitives/themed-skeleton';
import { ThemedText } from '@/components/primitives/themed-text';
import { ListSeparator } from '@/components/layout/list-separator';
import { BlurBottomBar } from '@/components/layout/blur-bottom-bar';
import { ThemedButton } from '@/components/primitives/themed-button';
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
  const { colors } = useTheme();

  const { data: events, isLoading } = useRoomEvents(id);
  const cancelEvent = useCancelEvent();

  const today = new Date().toISOString().split('T')[0];

  const listItems = useMemo(() => {
    if (!events) return [];

    const upcoming: EventSummary[] = [];
    const past: EventSummary[] = [];
    for (const event of events) {
      if (event.eventDate >= today) {
        upcoming.push(event);
      } else {
        past.push(event);
      }
    }

    const items: ListItem[] = [];
    if (upcoming.length > 0) {
      items.push({ type: 'header', title: t('upcoming') });
      for (const e of upcoming) items.push({ type: 'event', data: e });
    }
    if (past.length > 0) {
      items.push({ type: 'header', title: t('past') });
      for (const e of past) items.push({ type: 'event', data: e });
    }
    return items;
  }, [events, today, t]);

  if (isLoading) {
    return <SkeletonEventsList />;
  }

  if (!events || events.length === 0) {
    return (
      <NativeEmptyState
        sfSymbol="calendar"
        icon={Calendar}
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
            icon: X,
            color: '#fff',
            backgroundColor: colors.destructive,
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
        ItemSeparatorComponent={ListSeparator}
      />
      <BlurBottomBar>
        <ThemedButton
          onPress={() =>
            router.push({
              pathname: '/(app)/manage-room/[id]/events/create',
              params: { id },
            })
          }>
          {t('create')}
        </ThemedButton>
      </BlurBottomBar>
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
