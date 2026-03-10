import { PIN_LENGTH } from '@openhospi/shared/constants';
import { useRef } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

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

  const halfLength = Math.ceil(length / 2);

  function handleChange(text: string) {
    const filtered = text.replace(/[^0-9]/g, '').slice(0, length);
    onChangeText(filtered);
    if (filtered.length === length) {
      onFilled?.(filtered);
    }
  }

  return (
    <Pressable onPress={() => inputRef.current?.focus()}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        caretHidden
        style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
      />
      <View
        style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
        {Array.from({ length }, (_, i) => {
          const isActive = i === value.length;
          const isFilled = i < value.length;
          const showSeparator = i === halfLength - 1 && i < length - 1;

          return (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{ width: 44, height: 52, justifyContent: 'center', alignItems: 'center' }}
                className={cn(
                  'rounded-lg border',
                  isActive
                    ? 'border-primary bg-primary/5'
                    : isFilled
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-input bg-background'
                )}>
                <Text
                  className={cn(
                    'text-2xl font-semibold',
                    isFilled ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                  {isFilled ? (secureTextEntry ? '\u2022' : value[i]) : ''}
                </Text>
              </View>
              {showSeparator && (
                <View
                  style={{ width: 8, height: 2, borderRadius: 1 }}
                  className="bg-muted-foreground/30"
                />
              )}
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}
