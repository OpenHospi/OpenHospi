import { LOCALE_CONFIG, SUPPORTED_LOCALES, type Locale } from '@openhospi/i18n';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/design';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedText } from '@/components/primitives/themed-text';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';

export function LanguagePicker() {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 4,
    right: 4,
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ThemedButton variant="outline" size="sm" style={{ borderRadius: 10 }}>
          <ThemedText variant="subheadline" weight="600" style={{ textTransform: 'uppercase' }}>
            {locale}
          </ThemedText>
        </ThemedButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent insets={contentInsets} sideOffset={2} style={{ width: 192 }} align="end">
        <DropdownMenuGroup>
          {SUPPORTED_LOCALES.map((loc) => {
            const isSelected = loc === locale;
            return (
              <DropdownMenuItem key={loc} onPress={() => i18n.changeLanguage(loc)}>
                <ThemedText
                  variant="body"
                  weight={isSelected ? '600' : '400'}
                  color={colors.foreground}>
                  {LOCALE_CONFIG[loc].name}
                </ThemedText>
                {isSelected && <Icon as={Check} size={16} color={colors.primary} />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
