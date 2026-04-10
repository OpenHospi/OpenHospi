import { LOCALE_CONFIG, SUPPORTED_LOCALES } from '@openhospi/i18n';
import { Globe } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as DropdownMenu from 'zeego/dropdown-menu';

import { useTheme } from '@/design';
import { hapticLight } from '@/lib/haptics';

export function LanguagePicker() {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const { colors } = useTheme();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Pressable hitSlop={8}>
          <Globe size={22} color={colors.tertiaryForeground} />
        </Pressable>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {SUPPORTED_LOCALES.map((loc) => (
          <DropdownMenu.CheckboxItem
            key={loc}
            value={loc === locale ? 'on' : 'off'}
            onValueChange={() => {
              hapticLight();
              i18n.changeLanguage(loc);
            }}>
            <DropdownMenu.ItemTitle>{LOCALE_CONFIG[loc].name}</DropdownMenu.ItemTitle>
          </DropdownMenu.CheckboxItem>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
