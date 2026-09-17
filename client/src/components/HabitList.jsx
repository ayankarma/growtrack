import { useState } from 'react';
import api from '../api';
import { useToast } from './ToastNotification';

const CATEGORY_ICONS = {
  health: { icon: '❤️', color: 'category-health' },
  study: { icon: '📘', color: 'category-study' },
  creative: { icon: '🎨', color: 'category-creative' },
  chore: { icon: '🧹', color: 'category-chore' },
};

export default function HabitList({ habits, onHabitChange }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('health');
  const [loading, setLoading] = useState(false);
  
  const { addToast } = useToast();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api.post('/habits', { name: name.trim(), category });
      setName('');
      setShowForm(false);
      onHabitChange(); 
      addToast({
        type: 'success',
        title: 'Planted!',
        message: `New seed planted for ${name.trim()}`
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.error || 'Failed to create habit.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLog = async (habitId) => {
    try {
      const res = await api.post(`/habits/${habitId}/log`);
      onHabitChange();
      
      // Water effect logic would trigger a CSS class on the button temporarily,
      // but for now we'll rely on the toast.
      addToast({
        type: 'info',
        title: 'Watered!',
        message: `Streak: ${res.data.new_streak} days — Stage: ${res.data.new_stage}`
      });

      if (res.data.birds_visiting) {
         addToast({
            type: 'unlock',
            title: 'Rare Event!',
            message: 'Birds have started visiting your tree!',
            duration: 5000
         });
      }

    } catch (err) {
      addToast({
        type: 'error',
        title: 'Cannot Log',
        message: err.response?.data?.error || 'Failed to log habit.'
      });
    }
  };

  const handleArchive = async (habitId) => {
    if (!window.confirm('Archive this habit? The plot will remain but stop growing.')) return;
    try {
      await api.patch(`/habits/${habitId}`, { is_archived: true });
      onHabitChange();
      addToast({
        type: 'info',
        title: 'Archived',
        message: 'Habit archived successfully.'
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.response?.data?.error || 'Failed to archive.'
      });
    }
  };

  return (
    <div className="pixel-panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-pixel text-sm flex items-center gap-2">
          <span>📋</span> Active Quests
        </h2>
        <button
          className="btn-pixel btn-pixel-gold"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Cancel' : '+ New Quest'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="mb-6 animate-fade-in">
          <form onSubmit={handleCreate} className="quest-scroll">
            <div className="mb-3">
              <label className="font-pixel text-xs block mb-1">Quest Name</label>
              <input
                type="text"
                className="pixel-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Morning Run"
                maxLength={50}
              />
            </div>
            <div className="mb-3">
              <label className="font-pixel text-xs block mb-1">Quest Type</label>
              <select
                className="pixel-select w-full"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="health">❤️ Vitality (Health)</option>
                <option value="study">📘 Wisdom (Study)</option>
                <option value="creative">🎨 Imagination (Creative)</option>
                <option value="chore">🧹 Discipline (Chore)</option>
              </select>
            </div>
            
            <button type="submit" className="btn-pixel btn-pixel-primary w-full mt-2" disabled={loading}>
              {loading ? 'Planting...' : '🌱 Accept Quest'}
            </button>
          </form>
        </div>
      )}

      {/* Habit List */}
      {habits.length === 0 ? (
        <div className="text-center p-6 border-2 border-dashed border-retro-darkgray text-retro-darkgray font-pixel text-xs">
          No active quests.<br/><br/>Accept a new quest to start growing!
        </div>
      ) : (
        <ul className="space-y-3">
          {habits.map((habit) => {
            const cat = CATEGORY_ICONS[habit.category] || CATEGORY_ICONS.health;
            const streak = habit.current_streak;
            const isHot = streak >= 7;
            
            return (
              <li
                key={habit.id}
                className={`habit-card ${cat.color}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="category-badge shadow-pixel-sm">
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate text-[1.1rem] leading-tight">
                      {habit.name}
                    </div>
                    <div className={`streak-display ${streak > 0 ? 'active' : ''} ${isHot ? 'hot' : ''}`}>
                      <span className="streak-fire">{streak > 0 ? '🔥' : '💨'}</span>
                      {streak} {streak === 1 ? 'day' : 'days'}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 shrink-0 ml-2">
                  <button
                    className="btn-pixel btn-pixel-water"
                    onClick={() => handleLog(habit.id)}
                    title="Water today"
                  >
                    💧 Water
                  </button>
                  <button
                    className="btn-pixel btn-pixel-danger px-2"
                    onClick={() => handleArchive(habit.id)}
                    title="Archive"
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
