import React, { useMemo, useState } from 'react';
import { BookOpen, Plus, Edit3, Trash2, Star, X, AlertCircle } from 'lucide-react';
import {
  BOOK_STATUSES,
  BOOK_STATUS_CONFIG,
  HABIT_CATEGORIES,
  PARTICIPANT_COLORS
} from '../constants';

const DEFAULT_CATEGORY = 'Learning';
const DEFAULT_STATUS = 'Want to Read';

const emptyForm = () => ({
  title: '',
  author: '',
  status: DEFAULT_STATUS,
  rating: null,
  note: '',
  category: DEFAULT_CATEGORY,
  pageCount: '',
  dateStarted: '',
  dateFinished: ''
});

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const yearOf = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.getFullYear();
};

const isoToDateInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

const dateInputToIso = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T12:00:00`);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
};

const StarRating = ({ value, onChange, readOnly = false, size = 'md', darkMode }) => {
  const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => {
        const filled = value && n <= value;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(value === n ? null : n)}
            className={readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
          >
            <Star
              className={`${sizeClass} ${filled ? 'fill-amber-400 text-amber-400' : darkMode ? 'text-gray-600' : 'text-gray-300'}`}
            />
          </button>
        );
      })}
    </div>
  );
};

const BookCard = ({ book, isMine, onEdit, onDelete, darkMode }) => {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = BOOK_STATUS_CONFIG[book.status] || BOOK_STATUS_CONFIG[DEFAULT_STATUS];
  const categoryCfg = HABIT_CATEGORIES.find(c => c.id === book.category) || HABIT_CATEGORIES.find(c => c.id === DEFAULT_CATEGORY);
  const categoryColor = darkMode ? categoryCfg?.darkColor : categoryCfg?.color;

  let relevantDateLabel = '';
  let relevantDateIso = null;
  if (book.status === 'Finished' || book.status === 'Abandoned') {
    relevantDateIso = book.dateFinished;
    relevantDateLabel = book.status === 'Finished' ? 'Finished' : 'Stopped';
  } else if (book.status === 'Reading') {
    relevantDateIso = book.dateStarted;
    relevantDateLabel = 'Started';
  } else {
    relevantDateIso = book.dateAdded;
    relevantDateLabel = 'Added';
  }

  return (
    <div className={`rounded-xl p-4 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold leading-snug ${darkMode ? 'text-white' : 'text-gray-900'}`}>{book.title}</h4>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>by {book.author}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {categoryCfg && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColor}`}>
                {categoryCfg.icon} {categoryCfg.id}
              </span>
            )}
            {book.pageCount ? (
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{book.pageCount} pages</span>
            ) : null}
            {book.rating ? <StarRating value={book.rating} readOnly size="sm" darkMode={darkMode} /> : null}
          </div>
        </div>
        {isMine && (
          <div className="flex flex-col gap-1">
            <button
              onClick={onEdit}
              className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              title="Edit"
            >
              <Edit3 className="w-4 h-4 text-blue-500" />
            </button>
            <button
              onClick={onDelete}
              className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )}
      </div>

      {relevantDateIso && (
        <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {relevantDateLabel} {formatDate(relevantDateIso)}
        </p>
      )}

      {book.note && (
        <div className="mt-2">
          <p className={`text-sm whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'} ${expanded ? '' : 'line-clamp-2'}`}>
            {book.note}
          </p>
          {book.note.length > 80 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className={`text-xs mt-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline`}
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const BookFormModal = ({ open, mode, initial, onClose, onSubmit, darkMode }) => {
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

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.author.trim()) {
      setError('Title and author are required.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      console.error('Save book failed:', err);
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
        className={`w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {mode === 'edit' ? 'Edit Book' : 'Add Book'}
          </h3>
          <button onClick={onClose} className={darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className={labelClass}>Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update({ title: e.target.value })}
              className={inputClass}
              placeholder="The Almanack of Naval Ravikant"
            />
          </div>

          <div>
            <label className={labelClass}>Author *</label>
            <input
              type="text"
              value={form.author}
              onChange={(e) => update({ author: e.target.value })}
              className={inputClass}
              placeholder="Eric Jorgenson"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={form.status}
                onChange={(e) => update({ status: e.target.value })}
                className={inputClass}
              >
                {BOOK_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select
                value={form.category}
                onChange={(e) => update({ category: e.target.value })}
                className={inputClass}
              >
                {HABIT_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.id}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Pages</label>
              <input
                type="number"
                min="0"
                value={form.pageCount}
                onChange={(e) => update({ pageCount: e.target.value })}
                className={inputClass}
                placeholder="288"
              />
            </div>
            <div>
              <label className={labelClass}>Rating</label>
              <StarRating value={form.rating} onChange={(n) => update({ rating: n })} darkMode={darkMode} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Date Started</label>
              <input
                type="date"
                value={isoToDateInput(form.dateStarted)}
                onChange={(e) => update({ dateStarted: dateInputToIso(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Date Finished</label>
              <input
                type="date"
                value={isoToDateInput(form.dateFinished)}
                onChange={(e) => update({ dateFinished: dateInputToIso(e.target.value) })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Note</label>
            <textarea
              value={form.note}
              onChange={(e) => update({ note: e.target.value })}
              className={`${inputClass} min-h-[80px] resize-y`}
              placeholder="What stood out to you?"
            />
          </div>

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
              {submitting ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Add Book'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BooksPage = ({
  books = [],
  myParticipant,
  allParticipants = [],
  user,
  darkMode,
  saveBook,
  deleteBook
}) => {
  const [activeTab, setActiveTab] = useState('Reading');
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [modalState, setModalState] = useState({ open: false, mode: 'add', initial: emptyForm(), bookId: null });

  const yearOptions = useMemo(() => {
    const years = new Set();
    books.forEach(b => {
      [b.dateAdded, b.dateStarted, b.dateFinished].forEach(d => {
        const y = yearOf(d);
        if (y) years.add(y);
      });
    });
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a).map(String);
  }, [books]);

  const dateForYearFilter = (book) => {
    if (book.status === 'Finished' || book.status === 'Abandoned') return book.dateFinished || book.dateAdded;
    return book.dateAdded;
  };

  const tabBooks = useMemo(() => {
    return books
      .filter(b => b.status === activeTab)
      .filter(b => {
        if (yearFilter === 'all') return true;
        const y = yearOf(dateForYearFilter(b));
        return y === Number(yearFilter);
      });
  }, [books, activeTab, yearFilter]);

  const tabCounts = useMemo(() => {
    const counts = {};
    BOOK_STATUSES.forEach(s => {
      counts[s] = books.filter(b => {
        if (b.status !== s) return false;
        if (yearFilter === 'all') return true;
        const y = yearOf(dateForYearFilter(b));
        return y === Number(yearFilter);
      }).length;
    });
    return counts;
  }, [books, yearFilter]);

  const grouped = useMemo(() => {
    const map = new Map();
    allParticipants.forEach(p => map.set(p, []));
    tabBooks.forEach(b => {
      const key = b.participant || 'Unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(b);
    });
    map.forEach((list) => {
      list.sort((a, b) => {
        const aDate = a.dateFinished || a.dateStarted || a.dateAdded || '';
        const bDate = b.dateFinished || b.dateStarted || b.dateAdded || '';
        return bDate.localeCompare(aDate);
      });
    });
    return Array.from(map.entries()).filter(([, list]) => list.length > 0);
  }, [tabBooks, allParticipants]);

  const openAdd = () => {
    if (!myParticipant) return;
    setModalState({ open: true, mode: 'add', initial: emptyForm(), bookId: null });
  };

  const openEdit = (book) => {
    setModalState({
      open: true,
      mode: 'edit',
      bookId: book.id,
      initial: {
        title: book.title || '',
        author: book.author || '',
        status: book.status || DEFAULT_STATUS,
        rating: book.rating ?? null,
        note: book.note || '',
        category: book.category || DEFAULT_CATEGORY,
        pageCount: book.pageCount ?? '',
        dateStarted: book.dateStarted || '',
        dateFinished: book.dateFinished || ''
      }
    });
  };

  const closeModal = () => setModalState(prev => ({ ...prev, open: false }));

  const handleSubmit = async (form) => {
    const nowIso = new Date().toISOString();
    const original = modalState.mode === 'edit' ? books.find(b => b.id === modalState.bookId) : null;
    const pageCount = form.pageCount === '' || form.pageCount === null ? null : Number(form.pageCount);

    let dateStarted = form.dateStarted || (original?.dateStarted ?? null);
    let dateFinished = form.dateFinished || (original?.dateFinished ?? null);

    if (form.status === 'Reading' && !dateStarted) dateStarted = nowIso;
    if ((form.status === 'Finished' || form.status === 'Abandoned') && !dateFinished) dateFinished = nowIso;

    const payload = {
      participant: original?.participant || myParticipant,
      createdBy: original?.createdBy || user.uid,
      title: form.title.trim(),
      author: form.author.trim(),
      status: form.status,
      rating: form.rating ?? null,
      note: form.note || '',
      category: form.category || DEFAULT_CATEGORY,
      pageCount,
      dateAdded: original?.dateAdded || nowIso,
      dateStarted: dateStarted || null,
      dateFinished: dateFinished || null,
      updatedAt: nowIso
    };

    await saveBook(modalState.bookId, payload);
  };

  const handleDelete = async (book) => {
    if (!window.confirm(`Delete "${book.title}"? This cannot be undone.`)) return;
    try {
      await deleteBook(book.id);
    } catch (err) {
      console.error('Delete book failed:', err);
      alert('Could not delete the book. Try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <BookOpen className="w-6 h-6 text-purple-500" />
          Books
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className={`text-sm rounded-lg px-3 py-1.5 border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
            <option value="all">All time</option>
          </select>
          <button
            onClick={openAdd}
            disabled={!myParticipant}
            title={!myParticipant ? "Link your profile to a participant before adding books" : 'Add a book'}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-opacity ${
              !myParticipant
                ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90'
            }`}
          >
            <Plus className="w-4 h-4" />
            Add Book
          </button>
        </div>
      </div>

      {!myParticipant && (
        <div className={`p-3 rounded-lg border flex items-start gap-2 ${darkMode ? 'bg-amber-900/30 border-amber-500/40 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-900'}`}>
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Your profile isn't linked to a participant.</p>
            <p className="text-xs mt-0.5 opacity-90">You can browse everyone's books but can't add your own until this is fixed.</p>
          </div>
        </div>
      )}

      <div className={`flex flex-wrap gap-1 p-1 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        {BOOK_STATUSES.map(status => {
          const cfg = BOOK_STATUS_CONFIG[status];
          const isActive = activeTab === status;
          return (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`flex-1 min-w-[110px] py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                isActive
                  ? darkMode ? 'bg-gray-700 text-white shadow' : 'bg-white text-gray-900 shadow'
                  : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{cfg.icon}</span>
              <span>{cfg.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                {tabCounts[status] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {grouped.length === 0 ? (
        <div className={`rounded-xl p-8 text-center border-2 border-dashed ${darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No books here for {yearFilter === 'all' ? 'all time' : yearFilter} yet.</p>
          {myParticipant && (
            <button
              onClick={openAdd}
              className="mt-3 text-sm text-purple-500 hover:underline"
            >
              Add your first book →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(([participant, list]) => {
            const color = PARTICIPANT_COLORS[participant] || '#6b7280';
            return (
              <div key={participant}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {participant}
                    <span className={`ml-2 text-xs font-normal ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {list.length} {list.length === 1 ? 'book' : 'books'}
                    </span>
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {list.map(book => (
                    <BookCard
                      key={book.id}
                      book={book}
                      isMine={user && book.createdBy === user.uid}
                      onEdit={() => openEdit(book)}
                      onDelete={() => handleDelete(book)}
                      darkMode={darkMode}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BookFormModal
        open={modalState.open}
        mode={modalState.mode}
        initial={modalState.initial}
        onClose={closeModal}
        onSubmit={handleSubmit}
        darkMode={darkMode}
      />
    </div>
  );
};

export default BooksPage;
