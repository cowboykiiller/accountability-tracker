import React, { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

const pad = (n) => String(n).padStart(2, '0');
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

// Month calendar + upcoming agenda for the dashboard. Shows today, the user's
// vacations, and (when Google Calendar is connected) real calendar events.
const DashboardCalendar = ({
  darkMode,
  className,
  events,
  vacations,
  myParticipant,
  connected,
  authNeeded,
  busy,
  onConnect,
  onRefresh
}) => {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedKey, setSelectedKey] = useState(null);

  const todayKey = keyOf(new Date());

  // 6 fixed weeks starting the Monday on/before the 1st — matches the app's
  // Monday-based weeks.
  const grid = useMemo(() => {
    const offset = (viewDate.getDay() + 6) % 7;
    const start = addDays(viewDate, -offset);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [viewDate]);

  const eventsByDay = useMemo(() => {
    const map = {};
    const push = (k, e) => {
      (map[k] = map[k] || []).push(e);
    };
    for (const e of events) {
      if (!e.startDate) continue;
      if (e.allDay && e.endDateExclusive) {
        let d = new Date(`${e.startDate}T00:00:00`);
        const end = new Date(`${e.endDateExclusive}T00:00:00`);
        let guard = 0;
        while (d < end && guard++ < 62) {
          push(keyOf(d), e);
          d = addDays(d, 1);
        }
      } else {
        push(e.startDate, e);
      }
    }
    return map;
  }, [events]);

  const vacationDays = useMemo(() => {
    const set = new Set();
    vacations
      .filter(v => v.participant === myParticipant && v.startDate && v.endDate)
      .forEach(v => {
        let d = new Date(`${v.startDate}T00:00:00`);
        const end = new Date(`${v.endDate}T00:00:00`);
        let guard = 0;
        while (d <= end && guard++ < 120) {
          set.add(keyOf(d));
          d = addDays(d, 1);
        }
      });
    return set;
  }, [vacations, myParticipant]);

  const agenda = useMemo(() => {
    if (selectedKey) return (eventsByDay[selectedKey] || []).slice(0, 6);
    return events
      .filter(e => e.startDate >= todayKey || (e.endDateExclusive && e.endDateExclusive > todayKey))
      .slice(0, 5);
  }, [selectedKey, eventsByDay, events, todayKey]);

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const shiftMonth = (n) => {
    setViewDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + n);
      return d;
    });
    setSelectedKey(null);
  };

  const timeLabel = (e) =>
    e.startTime
      ? new Date(e.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : 'All day';
  const dateLabel = (e) =>
    new Date(`${e.startDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const tMain = darkMode ? 'text-white' : 'text-gray-900';
  const tSub = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <CalendarIcon className="w-4 h-4 text-[#F5B800] shrink-0" />
          <h2 className={`text-base font-bold truncate ${tMain}`}>{monthLabel}</h2>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => shiftMonth(-1)} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`} title="Previous month">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => shiftMonth(1)} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`} title="Next month">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide mb-1 ${tSub}`}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.map((d) => {
          const k = keyOf(d);
          const inMonth = d.getMonth() === viewDate.getMonth();
          const isToday = k === todayKey;
          const isSelected = k === selectedKey;
          const isVacation = vacationDays.has(k);
          const dayEvents = eventsByDay[k] || [];
          return (
            <button
              key={k}
              onClick={() => setSelectedKey(isSelected ? null : k)}
              className={`relative h-9 rounded-lg text-xs font-medium flex flex-col items-center justify-center transition ${
                isSelected
                  ? 'bg-[#1E3A5F] text-white'
                  : isVacation
                  ? (darkMode ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700')
                  : inMonth
                  ? (darkMode ? 'text-gray-200 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100')
                  : (darkMode ? 'text-gray-600' : 'text-gray-300')
              } ${isToday && !isSelected ? 'ring-2 ring-[#F5B800]' : ''}`}
            >
              {d.getDate()}
              {dayEvents.length > 0 && (
                <span className="flex gap-0.5 mt-0.5">
                  {dayEvents.slice(0, 3).map((_, i) => (
                    <span key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-400'}`} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${tSub}`}>
          {selectedKey
            ? new Date(`${selectedKey}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
            : 'Upcoming'}
        </p>
        {!connected ? (
          <div>
            <p className={`text-sm mb-3 ${tSub}`}>Connect Google Calendar to see your events here.</p>
            <button
              onClick={onConnect}
              disabled={busy}
              className="w-full py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#1E3A5F] to-[#2d4a6f] text-white hover:opacity-90 disabled:opacity-50"
            >
              {busy ? 'Connecting…' : 'Connect Google Calendar'}
            </button>
          </div>
        ) : authNeeded ? (
          <button
            onClick={onRefresh}
            disabled={busy}
            className={`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 ${darkMode ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
          >
            <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
            {busy ? 'Refreshing…' : 'Refresh calendar access'}
          </button>
        ) : agenda.length === 0 ? (
          <p className={`text-sm ${tSub}`}>{selectedKey ? 'Nothing on this day.' : 'No upcoming events.'}</p>
        ) : (
          <div className="space-y-2">
            {agenda.map((e, i) => (
              <div key={`${e.id}-${e.startDate}-${i}`} className={`flex items-center gap-2.5 p-2 rounded-xl ${darkMode ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${tMain}`}>{e.title}</p>
                  <p className={`text-xs ${tSub}`}>{selectedKey ? timeLabel(e) : `${dateLabel(e)} · ${timeLabel(e)}`}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCalendar;
