import { LOCALE_CONFIG, SUPPORTED_LOCALES, type Locale } from '@openhospi/i18n';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

export function LanguagePicker() {
  const { i18n } = useTranslation();
  const locale = i18n.language as Locale;
  const insets = useSafeAreaInsets();

  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 4,
    right: 4,
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-lg">
          <Text className="uppercase">{locale}</Text>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent insets={contentInsets} sideOffset={2} className="w-48" align="end">
        <DropdownMenuGroup>
          {SUPPORTED_LOCALES.map((loc) => {
            const isSelected = loc === locale;
            return (
              <DropdownMenuItem key={loc} onPress={() => i18n.changeLanguage(loc)}>
                <Text className={isSelected ? 'font-semibold' : ''}>{LOCALE_CONFIG[loc].name}</Text>
                {isSelected && <Icon as={Check} className="ml-auto size-4 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
