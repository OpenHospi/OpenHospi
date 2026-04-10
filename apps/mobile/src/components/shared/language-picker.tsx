import { LOCALE_CONFIG, SUPPORTED_LOCALES } from '@openhospi/i18n';
import { Globe } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/primitives/themed-text';
import { useTheme } from '@/design';
import { hapticLight } from '@/lib/haptics';

export function LanguagePicker() {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  if (Platform.OS === 'ios') {
    return <IOSPicker locale={locale} changeLanguage={i18n.changeLanguage} />;
  }

  return <AndroidPicker locale={locale} changeLanguage={i18n.changeLanguage} />;
}

function IOSPicker({
  locale,
  changeLanguage,
}: {
  locale: string;
  changeLanguage: (lng: string) => void;
}) {
  const { Menu, Button: ExpoButton } = require('@expo/ui/swift-ui');

  return (
    <Menu label="Language" systemImage="globe">
      {SUPPORTED_LOCALES.map((loc) => (
        <ExpoButton
          key={loc}
          label={LOCALE_CONFIG[loc].name}
          onPress={() => {
            hapticLight();
            changeLanguage(loc);
          }}
        />
      ))}
    </Menu>
  );
}

function AndroidPicker({
  locale,
  changeLanguage,
}: {
  locale: string;
  changeLanguage: (lng: string) => void;
}) {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const { DropdownMenu, DropdownMenuItem } = require('@expo/ui/jetpack-compose');

  return (
    <DropdownMenu expanded={isOpen} onDismissRequest={() => setIsOpen(false)}>
      <DropdownMenu.Trigger>
        <Pressable
          onPress={() => {
            hapticLight();
            setIsOpen(true);
          }}
          hitSlop={8}>
          <Globe size={22} color={colors.tertiaryForeground} />
        </Pressable>
      </DropdownMenu.Trigger>
      <DropdownMenu.Items>
        {SUPPORTED_LOCALES.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => {
              hapticLight();
              changeLanguage(loc);
              setIsOpen(false);
            }}>
            <ThemedText
              variant="body"
              weight={loc === locale ? '600' : '400'}
              color={loc === locale ? colors.primary : colors.foreground}>
              {LOCALE_CONFIG[loc].name}
            </ThemedText>
          </DropdownMenuItem>
        ))}
      </DropdownMenu.Items>
    </DropdownMenu>
  );
}
