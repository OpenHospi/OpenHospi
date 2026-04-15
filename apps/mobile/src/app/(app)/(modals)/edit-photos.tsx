import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { SymbolView } from 'expo-symbols';
import { MaterialIcons } from '@expo/vector-icons';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ProfilePhoto } from '@openhospi/shared/api-types';
import { MAX_PROFILE_PHOTOS } from '@openhospi/shared/constants';

import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import type { Colors } from '@/design/tokens/colors';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { isIOS } from '@/lib/platform';
import { showActionSheet } from '@/lib/action-sheet';
import { hapticMedium, hapticFormSubmitSuccess } from '@/lib/haptics';
import { getStoragePublicUrl } from '@/lib/storage-url';
import {
  useDeleteProfilePhoto,
  useProfile,
  useReorderProfilePhotos,
  useUploadProfilePhoto,
} from '@/services/profile';

// ── Constants ────────────────────────────────────────────────

const ITEM_HEIGHT = 76;
const THUMBNAIL_SIZE = 56;
const LIST_MARGIN = 16;

function itemTop(index: number): number {
  'worklet';
  return index * ITEM_HEIGHT;
}

/**
 * Given the top-Y of the floating clone (relative to the list container),
 * returns which row index it should snap to.
 * Using the clone's TOP edge gives snap = 0 when panDelta = 0.
 */
function snapIndex(cloneTopY: number): number {
  'worklet';
  return Math.max(0, Math.min(MAX_PROFILE_PHOTOS - 1, Math.round(cloneTopY / ITEM_HEIGHT)));
}

// ── DraggableRow ──────────────────────────────────────────────

type DraggableRowProps = {
  rowIndex: number;
  photo: ProfilePhoto | null;
  isFirst: boolean;
  slotLabel: string;
  primaryLabel: string;
  colors: Colors;
  draggingIndex: SharedValue<number>;
  floatBaseY: SharedValue<number>;
  panDeltaY: SharedValue<number>;
  dragStartTranslation: SharedValue<number>;
  onTap: () => void;
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
  onCommitSwap: (from: number, to: number) => void;
};

function DraggableRow({
  rowIndex,
  photo,
  isFirst,
  slotLabel,
  primaryLabel,
  colors,
  draggingIndex,
  floatBaseY,
  panDeltaY,
  dragStartTranslation,
  onTap,
  onDragStart,
  onDragEnd,
  onCommitSwap,
}: DraggableRowProps) {
  const photoUrl = photo ? getStoragePublicUrl(photo.url, 'profile-photos') : null;
  const primaryColor = colors.primary;

  const animatedRowStyle = useAnimatedStyle(() => {
    const active = draggingIndex.value;
    const isActive = active === rowIndex;

    if (isActive) {
      return { opacity: 0.15 };
    }
    if (active < 0) {
      return { opacity: 1 };
    }

    const dropTarget = snapIndex(floatBaseY.value + panDeltaY.value);
    const isDropTarget = dropTarget === rowIndex;
    return {
      opacity: 1,
      backgroundColor: isDropTarget ? colors.accent : colors.tertiaryBackground,
    };
  });

  const gesture = useMemo(() => {
    const tap = Gesture.Tap()
      .maxDuration(300)
      .onStart(() => scheduleOnRN(onTap));

    if (!photo) {
      return tap;
    }

    const pan = Gesture.Pan()
      .activateAfterLongPress(220)
      .onStart((e) => {
        // Capture translation at activation so the clone doesn't jump if the
        // finger already moved during the long-press hold window.
        dragStartTranslation.value = e.translationY;
        floatBaseY.value = itemTop(rowIndex);
        panDeltaY.value = 0;
        draggingIndex.value = rowIndex;
        scheduleOnRN(onDragStart, rowIndex);
        scheduleOnRN(hapticMedium);
      })
      .onUpdate((e) => {
        const delta = e.translationY - dragStartTranslation.value;
        const minDelta = -itemTop(rowIndex);
        const maxDelta = itemTop(MAX_PROFILE_PHOTOS - 1 - rowIndex);
        panDeltaY.value = Math.max(minDelta, Math.min(maxDelta, delta));
      })
      .onEnd(() => {
        const to = snapIndex(floatBaseY.value + panDeltaY.value);
        const from = rowIndex;
        draggingIndex.value = -1;
        panDeltaY.value = 0;
        scheduleOnRN(onDragEnd);
        if (from !== to) {
          scheduleOnRN(onCommitSwap, from, to);
        }
      });

    return Gesture.Exclusive(pan, tap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo?.id, rowIndex]);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.row,
          {
            position: 'absolute',
            top: itemTop(rowIndex),
            left: 0,
            right: 0,
            height: ITEM_HEIGHT,
            backgroundColor: colors.tertiaryBackground,
          },
          animatedRowStyle,
        ]}>
        {rowIndex > 0 && <View style={[styles.separator, { backgroundColor: colors.separator }]} />}

        {/* Drag handle — only shown for filled slots */}
        <View style={styles.gripContainer}>
          {photo &&
            (isIOS ? (
              <SymbolView
                name="line.3.horizontal"
                size={16}
                tintColor={colors.tertiaryForeground}
              />
            ) : (
              <MaterialIcons name="drag-indicator" size={22} color={colors.tertiaryForeground} />
            ))}
        </View>

        {/* Thumbnail or empty placeholder */}
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={[styles.thumbnail, { borderRadius: radius.md }]}
            contentFit="cover"
            cachePolicy="disk"
          />
        ) : (
          <View
            style={[
              styles.thumbnail,
              styles.emptyThumb,
              { backgroundColor: colors.muted, borderRadius: radius.md },
            ]}>
            {isIOS ? (
              <SymbolView name="plus" size={18} tintColor={colors.tertiaryForeground} />
            ) : (
              <MaterialIcons name="add" size={20} color={colors.tertiaryForeground} />
            )}
          </View>
        )}

        {/* Label */}
        <View style={styles.labelContainer}>
          {isFirst && photo && (
            <View style={[styles.primaryPill, { backgroundColor: `${primaryColor}20` }]}>
              <ThemedText variant="caption2" weight="600" color={primaryColor}>
                {primaryLabel}
              </ThemedText>
            </View>
          )}
          <ThemedText
            variant="body"
            weight={photo ? '500' : '400'}
            color={photo ? colors.foreground : colors.tertiaryForeground}
            numberOfLines={1}>
            {slotLabel}
          </ThemedText>
        </View>

        {/* Right accessory */}
        <View style={styles.rightAccessory}>
          {photo ? (
            isIOS ? (
              <SymbolView name="ellipsis" size={16} tintColor={colors.tertiaryForeground} />
            ) : (
              <MaterialIcons name="more-horiz" size={22} color={colors.tertiaryForeground} />
            )
          ) : isIOS ? (
            <SymbolView name="chevron.right" size={12} tintColor={colors.tertiaryForeground} />
          ) : (
            <MaterialIcons name="chevron-right" size={18} color={colors.tertiaryForeground} />
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

// ── FloatingClone ─────────────────────────────────────────────

function FloatingClone({
  draggingIndex,
  floatBaseY,
  panDeltaY,
  photo,
  slotLabel,
  primaryLabel,
  isFirst,
  colors,
}: {
  draggingIndex: SharedValue<number>;
  floatBaseY: SharedValue<number>;
  panDeltaY: SharedValue<number>;
  photo: ProfilePhoto | null;
  slotLabel: string;
  primaryLabel: string;
  isFirst: boolean;
  colors: Colors;
}) {
  const photoUrl = photo ? getStoragePublicUrl(photo.url, 'profile-photos') : null;
  const primaryColor = colors.primary;

  const animatedStyle = useAnimatedStyle(() => {
    const active = draggingIndex.value >= 0;
    return {
      position: 'absolute',
      left: 0,
      right: 0,
      top: floatBaseY.value + panDeltaY.value,
      height: ITEM_HEIGHT,
      zIndex: 999,
      opacity: active ? 1 : 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: active ? 0.18 : 0,
      shadowRadius: 10,
      elevation: active ? 8 : 0,
      transform: [{ scale: active ? 1.025 : 1 }],
    };
  });

  if (!photo || !photoUrl) return null;

  return (
    <Animated.View
      style={[animatedStyle, { backgroundColor: colors.tertiaryBackground }]}
      pointerEvents="none">
      <View style={styles.row}>
        <View style={styles.gripContainer}>
          {isIOS ? (
            <SymbolView name="line.3.horizontal" size={16} tintColor={colors.tertiaryForeground} />
          ) : (
            <MaterialIcons name="drag-indicator" size={22} color={colors.tertiaryForeground} />
          )}
        </View>
        <Image
          source={{ uri: photoUrl }}
          style={[styles.thumbnail, { borderRadius: radius.md }]}
          contentFit="cover"
          cachePolicy="memory"
        />
        <View style={styles.labelContainer}>
          {isFirst && (
            <View style={[styles.primaryPill, { backgroundColor: `${primaryColor}20` }]}>
              <ThemedText variant="caption2" weight="600" color={primaryColor}>
                {primaryLabel}
              </ThemedText>
            </View>
          )}
          <ThemedText variant="body" weight="500" color={colors.foreground} numberOfLines={1}>
            {slotLabel}
          </ThemedText>
        </View>
        <View style={styles.rightAccessory}>
          {isIOS ? (
            <SymbolView name="ellipsis" size={16} tintColor={colors.tertiaryForeground} />
          ) : (
            <MaterialIcons name="more-horiz" size={22} color={colors.tertiaryForeground} />
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ── EditPhotosScreen ─────────────────────────────────────────

const SLOT_KEYS = ['slot1', 'slot2', 'slot3', 'slot4', 'slot5'] as const;

export default function EditPhotosScreen() {
  const { colors } = useTheme();
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tSlots } = useTranslation('translation', { keyPrefix: 'app.onboarding.photoSlots' });
  const { t: tOnboarding } = useTranslation('translation', { keyPrefix: 'app.onboarding' });

  const { data: profile, isPending } = useProfile();
  const uploadPhoto = useUploadProfilePhoto();
  const deletePhoto = useDeleteProfilePhoto();
  const reorderPhotos = useReorderProfilePhotos();

  // ── List state ──────────────────────────────────────────────

  const [gridItems, setGridItems] = useState<(ProfilePhoto | null)[]>(() =>
    Array(MAX_PROFILE_PHOTOS).fill(null)
  );
  const gridItemsRef = useRef(gridItems);
  gridItemsRef.current = gridItems;

  // Sync local display order from server data whenever profile changes.
  useEffect(() => {
    if (!profile) return;
    const sorted = [...profile.photos].sort((a, b) => a.slot - b.slot);
    const next = Array<ProfilePhoto | null>(MAX_PROFILE_PHOTOS).fill(null);
    sorted.forEach((p, i) => {
      next[i] = p;
    });
    setGridItems(next);
  }, [profile]);

  // ── Drag shared values ──────────────────────────────────────

  const draggingIndex = useSharedValue(-1);
  const floatBaseY = useSharedValue(0);
  const panDeltaY = useSharedValue(0);
  const dragStartTranslation = useSharedValue(0);

  // Track which row is shown in the floating clone (React state, JS thread).
  const [floatingRowIndex, setFloatingRowIndex] = useState(-1);

  const handleDragStart = useCallback((index: number) => {
    setFloatingRowIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    setFloatingRowIndex(-1);
  }, []);

  const handleCommitSwap = useCallback(
    (from: number, to: number) => {
      setFloatingRowIndex(-1);
      const current = [...gridItemsRef.current];
      [current[from], current[to]] = [current[to], current[from]];
      setGridItems(current);
      // Only mutate when there are photos to reorder.
      const orderIds = current.filter(Boolean).map((p) => p!.id);
      if (orderIds.length > 0) {
        reorderPhotos.mutate(orderIds);
      }
    },
    [reorderPhotos]
  );

  // ── Upload / delete ─────────────────────────────────────────

  async function handlePick(slot: number) {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    uploadPhoto.mutate(
      {
        file: {
          uri: asset.uri,
          name: asset.fileName ?? `photo-${slot}.jpg`,
          type: asset.mimeType ?? 'image/jpeg',
        },
        slot,
      },
      { onSuccess: () => hapticFormSubmitSuccess() }
    );
  }

  function handleDelete(slot: number) {
    Alert.alert(tCommon('delete'), '', [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: tCommon('delete'),
        style: 'destructive',
        onPress: () => deletePhoto.mutate(slot),
      },
    ]);
  }

  function handlePhotoTap(photo: ProfilePhoto) {
    showActionSheet(
      tSlots(SLOT_KEYS[photo.slot - 1]),
      [
        { label: tCommon('edit'), onPress: () => handlePick(photo.slot) },
        { label: tCommon('delete'), destructive: true, onPress: () => handleDelete(photo.slot) },
      ],
      tCommon('cancel')
    );
  }

  // ── Loading skeleton ─────────────────────────────────────────

  if (isPending || !profile) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic">
        <View
          style={[
            styles.listContainer,
            {
              backgroundColor: colors.tertiaryBackground,
              height: MAX_PROFILE_PHOTOS * ITEM_HEIGHT,
            },
          ]}>
          {Array.from({ length: MAX_PROFILE_PHOTOS }, (_, i) => (
            <View
              key={i}
              style={[
                styles.row,
                {
                  position: 'absolute',
                  top: i * ITEM_HEIGHT,
                  left: 0,
                  right: 0,
                  height: ITEM_HEIGHT,
                },
              ]}>
              {i > 0 && <View style={[styles.separator, { backgroundColor: colors.separator }]} />}
              <View style={styles.gripContainer} />
              <ThemedSkeleton
                width={THUMBNAIL_SIZE}
                height={THUMBNAIL_SIZE}
                style={{ borderRadius: radius.md }}
              />
              <View style={styles.labelContainer}>
                <ThemedSkeleton width="60%" height={14} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  const floatingPhoto = floatingRowIndex >= 0 ? gridItems[floatingRowIndex] : null;
  const floatingSlotLabel = floatingRowIndex >= 0 ? tSlots(SLOT_KEYS[floatingRowIndex]) : '';

  // ── Render ───────────────────────────────────────────────────

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      contentInsetAdjustmentBehavior="automatic"
      scrollEnabled={false}>
      <ThemedText variant="caption1" color={colors.tertiaryForeground} style={styles.hint}>
        {tOnboarding('dragToReorder')}
      </ThemedText>

      <View
        style={[
          styles.listContainer,
          { backgroundColor: colors.tertiaryBackground, height: MAX_PROFILE_PHOTOS * ITEM_HEIGHT },
        ]}>
        {gridItems.map((photo, index) => (
          <DraggableRow
            key={photo?.id ?? `empty-${index}`}
            rowIndex={index}
            photo={photo}
            isFirst={index === 0}
            slotLabel={tSlots(SLOT_KEYS[index])}
            primaryLabel={tOnboarding('required')}
            colors={colors}
            draggingIndex={draggingIndex}
            floatBaseY={floatBaseY}
            panDeltaY={panDeltaY}
            dragStartTranslation={dragStartTranslation}
            onTap={photo ? () => handlePhotoTap(photo) : () => handlePick(index + 1)}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onCommitSwap={handleCommitSwap}
          />
        ))}

        <FloatingClone
          draggingIndex={draggingIndex}
          floatBaseY={floatBaseY}
          panDeltaY={panDeltaY}
          photo={floatingPhoto ?? null}
          slotLabel={floatingSlotLabel}
          primaryLabel={tOnboarding('required')}
          isFirst={floatingRowIndex === 0}
          colors={colors}
        />
      </View>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: LIST_MARGIN,
  },
  hint: {
    textAlign: 'center',
    marginBottom: 12,
  },
  listContainer: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 12,
  },
  separator: {
    position: 'absolute',
    top: 0,
    left: 12 + 24 + 12,
    right: 0,
    height: 1,
  },
  gripContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
  },
  emptyThumb: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    flex: 1,
    gap: 3,
  },
  primaryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rightAccessory: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
