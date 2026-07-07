import React, { useEffect, useRef, useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { googleCalendarUrl, buildICS, icsFileName } from '../lib/calendar';

// On iOS the share sheet covers every calendar app (Apple Calendar, the Google
// Calendar app, Outlook) without OAuth, so native gets one tap → share sheet.
// Web gets a two-option menu: Google Calendar tab or an .ics download.
const AddToCalendarButton = ({ event, darkMode, label }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const shareNative = async () => {
    try {
      const written = await Filesystem.writeFile({
        path: icsFileName(event.title),
        data: buildICS(event),
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });
      await Share.share({ title: event.title, url: written.uri });
    } catch (err) {
      // Dismissing the share sheet rejects — only surface real failures.
      if (!/cancel/i.test(String(err?.message))) {
        console.error('Calendar share failed:', err);
        alert('Could not open the share sheet. Try again.');
      }
    }
  };

  const downloadICS = () => {
    const blob = new Blob([buildICS(event)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = icsFileName(event.title);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  const openGoogle = () => {
    window.open(googleCalendarUrl(event), '_blank', 'noopener');
    setMenuOpen(false);
  };

  const isNative = Capacitor.isNativePlatform();

  const buttonClass = label
    ? `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
        darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`
    : `p-1.5 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`;

  const menuItemClass = `w-full text-left px-3 py-2 text-sm ${
    darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
  }`;

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => (isNative ? shareNative() : setMenuOpen(o => !o))}
        className={buttonClass}
        title="Add to calendar"
      >
        <CalendarPlus className={label ? 'w-4 h-4 text-emerald-500' : 'w-3.5 h-3.5 text-emerald-500'} />
        {label && <span>{label}</span>}
      </button>
      {menuOpen && (
        <div
          className={`absolute right-0 top-full mt-1 z-20 w-44 rounded-lg border shadow-lg overflow-hidden ${
            darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
          }`}
        >
          <button onClick={openGoogle} className={menuItemClass}>Google Calendar</button>
          <button onClick={downloadICS} className={menuItemClass}>Apple / Outlook (.ics)</button>
        </div>
      )}
    </div>
  );
};

export default AddToCalendarButton;
