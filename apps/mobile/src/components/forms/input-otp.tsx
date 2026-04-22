import { PIN_LENGTH } from '@openhospi/shared/constants';
import { useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticPinEntry } from '@/lib/haptics';

type InputOTPProps = {
  value: string;
  onChangeText: (text: string) => void;
  onFilled?: (value: string) => void;
  length?: number;
  secureTextEntry?: boolean;
  autoFocus?: boolean;
};

export function InputOTP({
  value,
  onChangeText,
  onFilled,
  length = PIN_LENGTH,
  secureTextEntry = false,
  autoFocus = false,
}: InputOTPProps) {
  const inputRef = useRef<TextInput>(null);
  const { colors } = useTheme();

  const halfLength = Math.ceil(length / 2);

  function handleChange(text: string) {
    const filtered = text.replace(/[^0-9]/g, '').slice(0, length);
    if (filtered.length > value.length) {
      hapticPinEntry();
    }
    onChangeText(filtered);
    if (filtered.length === length) {
      onFilled?.(filtered);
    }
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Enter PIN"
      accessibilityHint="Opens numeric keypad to enter PIN"
      onPress={() => inputRef.current?.focus()}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        caretHidden
        style={styles.hiddenInput}
      />
      <View style={styles.boxRow}>
        {Array.from({ length }, (_, i) => {
          const isActive = i === value.length;
          const isFilled = i < value.length;
          const showSeparator = i === halfLength - 1 && i < length - 1;

          const boxBg =
            isActive || isFilled
              ? colors.primary + '0D' // 5% opacity
              : colors.secondaryBackground;
          const boxBorder = isActive
            ? colors.primary
            : isFilled
              ? colors.primary + '66' // 40% opacity
              : colors.separator;

          return (
            <View key={i} style={styles.boxGroup}>
              <View
                style={[
                  styles.box,
                  {
                    backgroundColor: boxBg,
                    borderColor: boxBorder,
                    borderRadius: radius.md,
                  },
                ]}>
                <ThemedText
                  variant="title2"
                  color={isFilled ? colors.foreground : colors.tertiaryForeground}>
                  {isFilled ? (secureTextEntry ? '\u2022' : value[i]) : ''}
                </ThemedText>
              </View>
              {showSeparator && (
                <View
                  style={[styles.separator, { backgroundColor: colors.tertiaryForeground + '4D' }]}
                />
              )}
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },
  boxRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  boxGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  box: {
    width: 44,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  separator: {
    width: 8,
    height: 2,
    borderRadius: 1,
  },
});
