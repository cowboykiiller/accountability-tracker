// Calendar export helpers — Google Calendar template URLs + .ics generation.
// No OAuth: the user confirms every event themselves, so this works for any
// calendar app (Google, Apple, Outlook) on web and in the iOS shell.
//
// Event shape (all fields optional except title + startDate):
//   {
//     title:      string
//     details:    string
//     startDate:  'YYYY-MM-DD'  (local calendar date)
//     endDate:    'YYYY-MM-DD'  (inclusive; defaults to startDate)
//     startTime:  'HH:MM'       (omit for an all-day event)
//     endTime:    'HH:MM'
//     recurrence: 'FREQ=WEEKLY;BYDAY=SU'  (RRULE body, no 'RRULE:' prefix)
//   }
// Times are deliberately floating (no timezone) — a 7pm reminder should stay
// 7pm wherever the member happens to be.

const compactDate = (isoDate) => isoDate.replaceAll('-', '');

const compactDateTime = (isoDate, time) => `${compactDate(isoDate)}T${time.replace(':', '')}00`;

// All-day ranges use an EXCLUSIVE end date in both formats.
const nextDay = (isoDate) => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

export const googleCalendarUrl = (event) => {
  const { title, details, startDate, endDate, startTime, endTime, recurrence } = event;
  const allDay = !startTime;
  const dates = allDay
    ? `${compactDate(startDate)}/${compactDate(nextDay(endDate || startDate))}`
    : `${compactDateTime(startDate, startTime)}/${compactDateTime(endDate || startDate, endTime || startTime)}`;

  const params = new URLSearchParams({ action: 'TEMPLATE', text: title || '', dates });
  if (details) params.set('details', details);
  if (recurrence) params.set('recur', `RRULE:${recurrence}`);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const escapeICS = (text) =>
  String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

// RFC 5545 wants content lines folded at 75 octets; fold at 74 chars which is
// close enough for the ASCII-heavy content we emit.
const foldLine = (line) => {
  const parts = [];
  let rest = line;
  while (rest.length > 74) {
    parts.push(rest.slice(0, 74));
    rest = ' ' + rest.slice(74);
  }
  parts.push(rest);
  return parts.join('\r\n');
};

export const buildICS = (event) => {
  const { title, details, startDate, endDate, startTime, endTime, recurrence, uid } = event;
  const allDay = !startTime;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Accountability Tracker//EN',
    'BEGIN:VEVENT',
    `UID:${uid || `${Date.now()}-${Math.random().toString(36).slice(2)}@accountability-tracker`}`,
    `DTSTAMP:${stamp}`,
    allDay
      ? `DTSTART;VALUE=DATE:${compactDate(startDate)}`
      : `DTSTART:${compactDateTime(startDate, startTime)}`,
    allDay
      ? `DTEND;VALUE=DATE:${compactDate(nextDay(endDate || startDate))}`
      : `DTEND:${compactDateTime(endDate || startDate, endTime || startTime)}`,
    `SUMMARY:${escapeICS(title || '')}`,
  ];
  if (details) lines.push(`DESCRIPTION:${escapeICS(details)}`);
  if (recurrence) lines.push(`RRULE:${recurrence}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.map(foldLine).join('\r\n') + '\r\n';
};

export const icsFileName = (title) =>
  `${String(title || 'event').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'event'}.ics`;
