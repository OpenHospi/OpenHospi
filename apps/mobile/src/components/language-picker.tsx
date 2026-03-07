import { SUPPORTED_LOCALES, type SupportedLocale } from '@openhospi/shared/constants';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { FlagImage } from '@/components/flag-image';
import { useLocale } from '@/i18n';

function getLanguageLabel(locale: SupportedLocale): string {
  const label = new Intl.DisplayNames([locale], { type: 'language' }).of(locale);
  if (!label) return locale;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function LanguagePicker() {
  const { locale, setLocale } = useLocale();
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable
        className="flex-row items-center gap-1.5 rounded-lg bg-secondary/50 px-3 py-1.5"
        onPress={() => setVisible(true)}
      >
        <FlagImage locale={locale} size={18} />
        <Text className="text-sm font-medium uppercase text-foreground">{locale}</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/50"
          onPress={() => setVisible(false)}
        >
          <View
            className="w-64 rounded-2xl bg-card p-4 shadow-lg"
            onStartShouldSetResponder={() => true}
          >
            {SUPPORTED_LOCALES.map((loc) => {
              const isSelected = loc === locale;
              return (
                <Pressable
                  key={loc}
                  className={`flex-row items-center gap-3 rounded-xl px-4 py-3 ${isSelected ? 'bg-primary/10' : ''}`}
                  onPress={() => {
                    setLocale(loc);
                    setVisible(false);
                  }}
                >
                  <FlagImage locale={loc} size={24} />
                  <Text
                    className={`flex-1 text-base ${isSelected ? 'font-semibold text-primary' : 'text-foreground'}`}
                  >
                    {getLanguageLabel(loc)}
                  </Text>
                  {isSelected && <Text className="text-primary">&#10003;</Text>}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
