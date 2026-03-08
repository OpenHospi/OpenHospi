import { LOCALE_CONFIG, SUPPORTED_LOCALES, type Locale } from '@openhospi/i18n';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, Text, View } from 'react-native';

export function LanguagePicker() {
  const { i18n } = useTranslation();
  const locale = i18n.language as Locale;
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable
        className="flex-row items-center gap-1.5 rounded-lg bg-secondary/50 px-3 py-1.5"
        onPress={() => setVisible(true)}
      >
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
                    i18n.changeLanguage(loc);
                    setVisible(false);
                  }}
                >
                  <Text
                    className={`flex-1 text-base ${isSelected ? 'font-semibold text-primary' : 'text-foreground'}`}
                  >
                    {LOCALE_CONFIG[loc].name}
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
