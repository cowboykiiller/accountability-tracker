// Direct Google Calendar integration (calendar.events scope).
//
// Token strategy: piggyback on the existing Google sign-in. "Connecting"
// re-runs the Google auth flow with the calendar scope added and captures the
// OAuth access token from the credential. Google access tokens live ~1 hour
// and Firebase does NOT refresh them, so the token is cached per-uid in
// localStorage and, when it expires, the next user-initiated calendar action
// transparently re-runs the (already-granted) consent flow — on web that's a
// brief popup, on iOS the native Google Sign-In sheet.
//
// No refresh tokens are stored anywhere (Firestore rules are still
// any-authed-user-can-read — do not park long-lived credentials there).
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { GoogleAuthProvider, reauthenticateWithPopup } from 'firebase/auth';

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const TOKEN_LIFETIME_MS = 55 * 60 * 1000; // refresh 5 min early

const tokenKey = (uid) => `gcalToken:${uid}`;
const connectedKey = (uid) => `gcalConnected:${uid}`;

export const isCalendarConnected = (uid) =>
  !!uid && localStorage.getItem(connectedKey(uid)) === '1';

export const disconnectGoogleCalendar = (uid) => {
  if (!uid) return;
  localStorage.removeItem(connectedKey(uid));
  localStorage.removeItem(tokenKey(uid));
};

const cacheToken = (uid, token) => {
  localStorage.setItem(tokenKey(uid), JSON.stringify({ token, exp: Date.now() + TOKEN_LIFETIME_MS }));
  localStorage.setItem(connectedKey(uid), '1');
};

const cachedToken = (uid) => {
  try {
    const { token, exp } = JSON.parse(localStorage.getItem(tokenKey(uid)) || '{}');
    return token && exp > Date.now() ? token : null;
  } catch {
    return null;
  }
};

// Runs the Google auth flow with the calendar scope and returns a fresh
// access token. Must be called from a user gesture (popup blockers).
export const connectGoogleCalendar = async ({ auth }) => {
  let token;
  if (Capacitor.isNativePlatform()) {
    const result = await FirebaseAuthentication.signInWithGoogle({ scopes: [CALENDAR_SCOPE] });
    token = result.credential?.accessToken;
  } else {
    const provider = new GoogleAuthProvider();
    provider.addScope(CALENDAR_SCOPE);
    // reauthenticate (not signIn) so picking a different Google account fails
    // loudly instead of silently switching whose app session this is.
    const result = await reauthenticateWithPopup(auth.currentUser, provider);
    token = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
  }
  if (!token) throw new Error('Google did not return a calendar access token.');
  cacheToken(auth.currentUser.uid, token);
  return token;
};

// Returns a usable token, re-running the consent flow if the cached one
// expired (only when `interactive`). Returns null when it can't.
export const getCalendarToken = async ({ auth, interactive = false }) => {
  const uid = auth.currentUser?.uid;
  if (!uid || !isCalendarConnected(uid)) return null;
  const cached = cachedToken(uid);
  if (cached) return cached;
  if (!interactive) return null;
  try {
    return await connectGoogleCalendar({ auth });
  } catch (err) {
    console.warn('Calendar re-auth failed:', err);
    return null;
  }
};

const gcalFetch = async (token, path, method, body) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error?.message || `Calendar API ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
};

// All-day event; Calendar wants an EXCLUSIVE end date.
const exclusiveEnd = (isoDate) => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

const vacationEventBody = (vacation) => ({
  summary: vacation.note ? `Vacation: ${vacation.note}` : 'Vacation',
  description: 'Synced from Accountability Tracker — streak and rate pause for full vacation weeks.',
  start: { date: vacation.startDate },
  end: { date: exclusiveEnd(vacation.endDate || vacation.startDate) },
  transparency: 'transparent'
});

// Insert or update the calendar event for a vacation. Returns the event id.
// A 404/410 on update means the user deleted the event from Google Calendar
// directly — recreate it rather than fail.
export const upsertVacationEvent = async (token, vacation) => {
  if (vacation.googleEventId) {
    try {
      await gcalFetch(token, `/${vacation.googleEventId}`, 'PATCH', vacationEventBody(vacation));
      return vacation.googleEventId;
    } catch (err) {
      if (err.status !== 404 && err.status !== 410) throw err;
    }
  }
  const created = await gcalFetch(token, '', 'POST', vacationEventBody(vacation));
  return created.id;
};

// Best-effort delete; already-gone events are success, not failure.
export const deleteCalendarEvent = async (token, eventId) => {
  try {
    await gcalFetch(token, `/${eventId}`, 'DELETE');
  } catch (err) {
    if (err.status !== 404 && err.status !== 410) throw err;
  }
};

// Recurring Sunday-evening reminder in the device's timezone. Returns event id.
export const createWeeklyReminderEvent = async (token) => {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7)); // next Sunday (today if Sunday)
  const pad = (n) => String(n).padStart(2, '0');
  const day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const created = await gcalFetch(token, '', 'POST', {
    summary: 'Log habits — Accountability Tracker',
    description: 'The week closes tonight — log your habits in the Accountability Tracker app.',
    start: { dateTime: `${day}T19:00:00`, timeZone: tz },
    end: { dateTime: `${day}T19:30:00`, timeZone: tz },
    recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=SU'],
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 0 }] }
  });
  return created.id;
};
