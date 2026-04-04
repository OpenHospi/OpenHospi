import * as Calendar from 'expo-calendar';
import { Alert, Linking, Platform } from 'react-native';

// ── Calendar Permission ─────────────────────────────────────

async function ensureCalendarPermission(): Promise<boolean> {
  const { status: existingStatus } = await Calendar.getCalendarPermissionsAsync();

  if (existingStatus === 'granted') return true;

  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

// ── Get Default Calendar ────────────────────────────────────

async function getDefaultCalendarId(): Promise<string | null> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  if (Platform.OS === 'ios') {
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    return defaultCalendar?.id ?? calendars[0]?.id ?? null;
  }

  // Android: prefer the primary Google Calendar
  const primary = calendars.find((c) => c.isPrimary && c.allowsModifications);
  const writable = calendars.find((c) => c.allowsModifications);
  return primary?.id ?? writable?.id ?? null;
}

// ── Add Event to Calendar ───────────────────────────────────

type EventDetails = {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
};

export async function addEventToCalendar(event: EventDetails): Promise<boolean> {
  const hasPermission = await ensureCalendarPermission();
  if (!hasPermission) {
    Alert.alert(
      'Calendar permission required',
      'Please grant calendar access in your device settings to add events.'
    );
    return false;
  }

  const calendarId = await getDefaultCalendarId();
  if (!calendarId) {
    Alert.alert('No calendar found', 'No writable calendar was found on this device.');
    return false;
  }

  await Calendar.createEventAsync(calendarId, {
    title: event.title,
    startDate: event.startDate,
    endDate: event.endDate,
    location: event.location,
    notes: event.notes,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  return true;
}

// ── Subscribe to iCal Feed ──────────────────────────────────
// Opens the system calendar subscription flow with the iCal URL.

export async function subscribeToFeed(calendarToken: string) {
  const webcalUrl = `webcal://openhospi.nl/api/calendar/${calendarToken}`;
  const canOpen = await Linking.canOpenURL(webcalUrl);

  if (canOpen) {
    await Linking.openURL(webcalUrl);
  } else {
    // Fallback: try https URL which some calendar apps handle
    const httpsUrl = `https://openhospi.nl/api/calendar/${calendarToken}`;
    await Linking.openURL(httpsUrl);
  }
}
