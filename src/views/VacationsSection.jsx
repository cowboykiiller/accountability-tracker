import React, { useMemo, useState } from 'react';
import { Plus, Edit3, Trash2, X, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';

const today = () => new Date().toISOString().split('T')[0];

const dayCount = (start, end) => {
  if (!start || !end) return 0;
  const a = new Date(`${start}T00:00:00Z`);
  const b = new Date(`${end}T00:00:00Z`);
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
};

const formatRange = (start, end) => {
  if (!start || !end) return '';
  const a = new Date(`${start}T00:00:00Z`);
  const b = new Date(`${end}T00:00:00Z`);
  const sameYear = a.getUTCFullYear() === b.getUTCFullYear();
  const optsShort = { month: 'short', day: 'numeric', timeZone: 'UTC' };
  const optsFull = { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' };
  const startStr = sameYear ? a.toLocaleDateString('en-US', optsShort) : a.toLocaleDateString('en-US', optsFull);
  const endStr = b.toLocaleDateString('en-US', optsFull);
  const n = dayCount(start, end);
  return `${startStr} – ${endStr} (${n} day${n === 1 ? '' : 's'})`;
};

const emptyForm = () => ({ startDate: '', endDate: '', note: '' });

const VacationFormModal = ({ open, mode, initial, existingVacations, editingId, onClose, onSubmit, darkMode }) => {
  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (open) {
      setForm(initial);
      setError('');
    }
  }, [open, initial]);

  if (!open) return null;

  const update = (patch) => setForm(prev => ({ ...prev, ...patch }));

  const datesValid = form.startDate && form.endDate && form.endDate >= form.startDate;

  const overlapping = useMemo(() => {
    if (!datesValid) return [];
    return existingVacations.filter(v =>
      v.id !== editingId &&
      v.startDate && v.endDate &&
      v.startDate <= form.endDate && v.endDate >= form.startDate
    );
  }, [form.startDate, form.endDate, existingVacations, editingId, datesValid]);

  const handleSubmit = async () => {
    if (!form.startDate || !form.endDate) {
      setError('Start and end dates are required.');
      return;
    }
    if (form.endDate < form.startDate) {
      setError('End date must be on or after start date.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      console.error('Save vacation failed:', err);
      setError('Could not save. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = `w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:border-[#F5B800] ${
    darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;
  const labelClass = `text-xs font-medium block mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className={`w-full max-w-md rounded-2xl p-6 ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {mode === 'edit' ? 'Edit Vacation' : 'Add Vacation'}
          </h3>
          <button onClick={onClose} className={darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Start date *</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => update({ startDate: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>End date *</label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(e) => update({ endDate: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          {datesValid && (
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {dayCount(form.startDate, form.endDate)} day{dayCount(form.startDate, form.endDate) === 1 ? '' : 's'}
            </p>
          )}

          <div>
            <label className={labelClass}>Note (optional)</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => update({ note: e.target.value })}
              className={inputClass}
              placeholder="Hawaii trip"
            />
          </div>

          {overlapping.length > 0 && (
            <div className={`p-2 rounded-lg text-xs ${darkMode ? 'bg-amber-900/30 text-amber-200' : 'bg-amber-50 text-amber-800'}`}>
              ⚠️ This overlaps with: {overlapping.map(v => v.note || formatRange(v.startDate, v.endDate)).join(', ')}. Saving is allowed.
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className={`flex-1 py-2 rounded-lg font-medium ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2 rounded-lg font-medium bg-gradient-to-r from-[#1E3A5F] to-[#2d4a6f] text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Add Vacation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const VacationRow = ({ vacation, onEdit, onDelete, darkMode }) => (
  <div className={`flex items-start justify-between gap-3 p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        🌴 {formatRange(vacation.startDate, vacation.endDate)}
      </p>
      {vacation.note && (
        <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{vacation.note}</p>
      )}
    </div>
    <div className="flex gap-1">
      <button onClick={onEdit} className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`} title="Edit">
        <Edit3 className="w-3.5 h-3.5 text-blue-500" />
      </button>
      <button onClick={onDelete} className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`} title="Delete">
        <Trash2 className="w-3.5 h-3.5 text-red-500" />
      </button>
    </div>
  </div>
);

const VacationsSection = ({
  vacations,
  myParticipant,
  user,
  darkMode,
  saveVacation,
  deleteVacation
}) => {
  const [modalState, setModalState] = useState({ open: false, mode: 'add', initial: emptyForm(), id: null });

  const myVacations = useMemo(() => {
    if (!myParticipant) return [];
    return vacations
      .filter(v => v.participant === myParticipant)
      .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
  }, [vacations, myParticipant]);

  const t = today();
  const upcoming = myVacations.filter(v => v.startDate > t);
  const current = myVacations.filter(v => v.startDate <= t && v.endDate >= t);
  const past = myVacations.filter(v => v.endDate < t).reverse(); // most recent first

  const openAdd = () => {
    if (!myParticipant) return;
    setModalState({ open: true, mode: 'add', initial: emptyForm(), id: null });
  };

  const openEdit = (vacation) => {
    setModalState({
      open: true,
      mode: 'edit',
      id: vacation.id,
      initial: {
        startDate: vacation.startDate || '',
        endDate: vacation.endDate || '',
        note: vacation.note || ''
      }
    });
  };

  const closeModal = () => setModalState(prev => ({ ...prev, open: false }));

  const handleSubmit = async (form) => {
    const nowIso = new Date().toISOString();
    const original = modalState.mode === 'edit' ? myVacations.find(v => v.id === modalState.id) : null;
    const payload = {
      participant: original?.participant || myParticipant,
      createdBy: original?.createdBy || user.uid,
      startDate: form.startDate,
      endDate: form.endDate,
      note: form.note || '',
      createdAt: original?.createdAt || nowIso,
      updatedAt: nowIso
    };
    await saveVacation(modalState.id, payload);
  };

  const handleDelete = async (vacation) => {
    if (!window.confirm(`Delete vacation ${formatRange(vacation.startDate, vacation.endDate)}?`)) return;
    try {
      await deleteVacation(vacation.id);
    } catch (err) {
      console.error('Delete vacation failed:', err);
      alert('Could not delete the vacation. Try again.');
    }
  };

  const sectionHeader = (label) => (
    <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
      {label}
    </p>
  );

  return (
    <div className={`rounded-xl p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <CalendarIcon className="w-5 h-5 text-emerald-500" />
          Vacations
        </h3>
        <button
          onClick={openAdd}
          disabled={!myParticipant}
          title={!myParticipant ? "Link your profile to a participant to add vacations" : 'Add a vacation'}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity ${
            !myParticipant
              ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Vacation
        </button>
      </div>

      {!myParticipant && (
        <div className={`p-3 rounded-lg border flex items-start gap-2 mb-3 ${darkMode ? 'bg-amber-900/30 border-amber-500/40 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-900'}`}>
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="text-sm">Link your profile to a participant before adding vacations.</p>
        </div>
      )}

      {myParticipant && myVacations.length === 0 && (
        <p className={`text-sm text-center py-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          No vacations yet. Plan a break — full weeks pause your streak and rate.
        </p>
      )}

      {current.length > 0 && (
        <div className="mb-4">
          {sectionHeader('Currently on vacation')}
          <div className="space-y-2">
            {current.map(v => (
              <VacationRow key={v.id} vacation={v} onEdit={() => openEdit(v)} onDelete={() => handleDelete(v)} darkMode={darkMode} />
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mb-4">
          {sectionHeader('Upcoming')}
          <div className="space-y-2">
            {upcoming.map(v => (
              <VacationRow key={v.id} vacation={v} onEdit={() => openEdit(v)} onDelete={() => handleDelete(v)} darkMode={darkMode} />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          {sectionHeader('Past')}
          <div className="space-y-2">
            {past.map(v => (
              <VacationRow key={v.id} vacation={v} onEdit={() => openEdit(v)} onDelete={() => handleDelete(v)} darkMode={darkMode} />
            ))}
          </div>
        </div>
      )}

      <VacationFormModal
        open={modalState.open}
        mode={modalState.mode}
        initial={modalState.initial}
        editingId={modalState.id}
        existingVacations={myVacations}
        onClose={closeModal}
        onSubmit={handleSubmit}
        darkMode={darkMode}
      />
    </div>
  );
};

export default VacationsSection;
