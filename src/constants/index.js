export const PARTICIPANTS = ['Taylor', 'Brandon', 'John'];

export const PARTICIPANT_COLORS = { 'Taylor': '#8b5cf6', 'Brandon': '#06b6d4', 'John': '#f97316' };

export const OWNER_PARTICIPANT = 'Taylor';

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const HABIT_CATEGORIES = [
  { id: 'Fitness', icon: '💪', color: 'bg-orange-100 text-orange-700', darkColor: 'bg-orange-500/20 text-orange-400' },
  { id: 'Business', icon: '💼', color: 'bg-blue-100 text-blue-700', darkColor: 'bg-blue-500/20 text-blue-400' },
  { id: 'Finance', icon: '💰', color: 'bg-emerald-100 text-emerald-700', darkColor: 'bg-emerald-500/20 text-emerald-400' },
  { id: 'Health', icon: '🏥', color: 'bg-red-100 text-red-700', darkColor: 'bg-red-500/20 text-red-400' },
  { id: 'Learning', icon: '📚', color: 'bg-purple-100 text-purple-700', darkColor: 'bg-purple-500/20 text-purple-400' },
  { id: 'Relationships', icon: '❤️', color: 'bg-pink-100 text-pink-700', darkColor: 'bg-pink-500/20 text-pink-400' },
  { id: 'Spiritual', icon: '🙏', color: 'bg-indigo-100 text-indigo-700', darkColor: 'bg-indigo-500/20 text-indigo-400' }
];

export const STATUS_CONFIG = {
  'Exceeded': { color: '#10b981', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700', darkBg: 'bg-emerald-500/20', darkText: 'text-emerald-400' },
  'Done': { color: '#22c55e', bgColor: 'bg-green-100', textColor: 'text-green-700', darkBg: 'bg-green-500/20', darkText: 'text-green-400' },
  'On Track': { color: '#3b82f6', bgColor: 'bg-blue-100', textColor: 'text-blue-700', darkBg: 'bg-blue-500/20', darkText: 'text-blue-400' },
  'At Risk': { color: '#f59e0b', bgColor: 'bg-amber-100', textColor: 'text-amber-700', darkBg: 'bg-amber-500/20', darkText: 'text-amber-400' },
  'Missed': { color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-700', darkBg: 'bg-red-500/20', darkText: 'text-red-400' },
  'Pending': { color: '#6b7280', bgColor: 'bg-gray-100', textColor: 'text-gray-600', darkBg: 'bg-gray-500/20', darkText: 'text-gray-400' }
};

export const PRIORITY_CONFIG = {
  'High': { color: 'bg-red-500', textColor: 'text-red-600', icon: '🔴' },
  'Medium': { color: 'bg-yellow-500', textColor: 'text-yellow-600', icon: '🟡' },
  'Low': { color: 'bg-blue-500', textColor: 'text-blue-600', icon: '🔵' },
  'Optional': { color: 'bg-gray-400', textColor: 'text-gray-500', icon: '⚪' }
};

export const STREAK_LEVELS = [
  { min: 0, name: 'None', icon: '—', color: 'gray' },
  { min: 1, name: 'Ember', icon: '🔥', color: 'amber' },
  { min: 3, name: 'Flame', icon: '🔥🔥', color: 'orange' },
  { min: 5, name: 'Fire', icon: '💥', color: 'red' },
  { min: 8, name: 'Blaze', icon: '⚡', color: 'purple' },
  { min: 12, name: 'Inferno', icon: '🌟', color: 'blue' },
  { min: 20, name: 'Legendary', icon: '👑', color: 'gold' }
];

export const MASTERY_LEVELS = [
  { min: 0, name: 'Novice', icon: '🌱', color: 'gray' },
  { min: 50, name: 'Apprentice', icon: '🌿', color: 'green' },
  { min: 70, name: 'Journeyman', icon: '🌳', color: 'blue' },
  { min: 85, name: 'Expert', icon: '⭐', color: 'purple' },
  { min: 95, name: 'Master', icon: '💎', color: 'gold' }
];

export const REACTIONS = ['👍', '🔥', '💪', '🎉', '❤️', '👏'];

export const getStreakLevel = (streak) => {
  for (let i = STREAK_LEVELS.length - 1; i >= 0; i--) {
    if (streak >= STREAK_LEVELS[i].min) return STREAK_LEVELS[i];
  }
  return STREAK_LEVELS[0];
};

export const getMasteryLevel = (completionRate) => {
  for (let i = MASTERY_LEVELS.length - 1; i >= 0; i--) {
    if (completionRate >= MASTERY_LEVELS[i].min) return MASTERY_LEVELS[i];
  }
  return MASTERY_LEVELS[0];
};

export const getNextMilestone = (current) => {
  for (let i = 0; i < STREAK_LEVELS.length; i++) {
    if (STREAK_LEVELS[i].min > current) return STREAK_LEVELS[i];
  }
  return null;
};

export const getCurrentMonday = () => {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const mondayDate = new Date(today.getFullYear(), today.getMonth(), diff);
  return mondayDate.toISOString().split('T')[0];
};
