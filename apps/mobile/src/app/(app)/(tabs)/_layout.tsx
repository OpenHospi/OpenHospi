import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';

import { isTerminalApplicationStatus } from '@openhospi/shared/enums';

import { isGlassEffectAPIAvailable } from '@/lib/platform-capabilities';
import { useApplications } from '@/services/applications';
import { useConversations } from '@/services/chat';

export default function TabLayout() {
  const { t } = useTranslation('translation', { keyPrefix: 'breadcrumbs' });

  const { data: conversations } = useConversations();
  const { data: applications } = useApplications();

  const unreadCount = (conversations ?? []).reduce((sum, c) => sum + c.unreadCount, 0);
  const activeAppCount = (applications ?? []).filter(
    (a) => !isTerminalApplicationStatus(a.status)
  ).length;

  return (
    <NativeTabs minimizeBehavior="onScrollDown" blurEffect="systemMaterial">
      <NativeTabs.Trigger name="discover">
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
        <NativeTabs.Trigger.Label>{t('discover')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="my-rooms">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>{t('my-rooms')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chat">
        <NativeTabs.Trigger.Icon
          sf={{
            default: 'bubble.left.and.bubble.right',
            selected: 'bubble.left.and.bubble.right.fill',
          }}
          md="forum"
        />
        <NativeTabs.Trigger.Label>{t('chat')}</NativeTabs.Trigger.Label>
        {unreadCount > 0 && (
          <NativeTabs.Trigger.Badge>
            {unreadCount > 99 ? '99+' : String(unreadCount)}
          </NativeTabs.Trigger.Badge>
        )}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="applications">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'doc.text', selected: 'doc.text.fill' }}
          md="description"
        />
        <NativeTabs.Trigger.Label>{t('applications')}</NativeTabs.Trigger.Label>
        {activeAppCount > 0 && (
          <NativeTabs.Trigger.Badge>
            {activeAppCount > 99 ? '99+' : String(activeAppCount)}
          </NativeTabs.Trigger.Badge>
        )}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
          md="account_circle"
        />
        <NativeTabs.Trigger.Label>{t('profile')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      {isGlassEffectAPIAvailable() ? (
        <NativeTabs.BottomAccessory>{null}</NativeTabs.BottomAccessory>
      ) : null}
    </NativeTabs>
  );
}
