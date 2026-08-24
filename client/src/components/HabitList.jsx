import { useState } from 'react';
import api from '../api';

const CATEGORY_EMOJI = {
  health: '❤️',
  study: '📚',
  creative: '🎨',
  chore: '🧹',
};

export default function HabitList({ habits, onHabitChange }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('health');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/habits', { name: name.trim(), category });
      setName('');
      setShowForm(false);
      onHabitChange(); // Refresh parent data
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create habit.');
    } finally {
      setLoading(false);
    }
  };

  const handleLog = async (habitId) => {
    try {
      const res = await api.post(`/habits/${habitId}/log`);
      // Show a little feedback
      alert(`✅ Logged! Streak: ${res.data.new_streak} days — Stage: ${res.data.new_stage}`);
      onHabitChange();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to log habit.');
    }
  };

  const handleArchive = async (habitId) => {
    if (!confirm('Archive this habit? The plot will remain but stop growing.')) return;
    try {
      await api.patch(`/habits/${habitId}`, { is_archived: true });
      onHabitChange();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to archive.');
    }
  };

  return (
    <div className="pixel-panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-pixel text-sm">📋 Habits</h2>
        <button
          className="btn-pixel btn-pixel-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Cancel' : '+ New'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 p-3 border-2 border-retro-black bg-white">
          <div className="mb-3">
            <label className="font-pixel text-xs block mb-1">Name</label>
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
            <label className="font-pixel text-xs block mb-1">Category</label>
            <select
              className="pixel-select w-full"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="health">❤️ Health</option>
              <option value="study">📚 Study</option>
              <option value="creative">🎨 Creative</option>
              <option value="chore">🧹 Chore</option>
            </select>
          </div>
          {error && <p className="text-retro-red font-pixel text-xs mb-2">{error}</p>}
          <button type="submit" className="btn-pixel btn-pixel-primary w-full" disabled={loading}>
            {loading ? 'Planting...' : '🌱 Plant Habit'}
          </button>
        </form>
      )}

      {/* Habit List */}
      {habits.length === 0 ? (
        <p className="text-center text-retro-darkgray">No habits yet. Create one to start growing!</p>
      ) : (
        <ul className="space-y-2">
          {habits.map((habit) => (
            <li
              key={habit.id}
              className="flex items-center justify-between p-3 border-2 border-retro-black bg-white"
            >
              <div>
                <span className="mr-2">{CATEGORY_EMOJI[habit.category]}</span>
                <span className="font-bold">{habit.name}</span>
                <span className="ml-3 text-sm text-retro-darkgray">
                  🔥 {habit.current_streak}d streak
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-pixel btn-pixel-primary"
                  onClick={() => handleLog(habit.id)}
                  title="Log today"
                >
                  ✓ Log
                </button>
                <button
                  className="btn-pixel btn-pixel-danger"
                  onClick={() => handleArchive(habit.id)}
                  title="Archive"
                  style={{ fontSize: '0.5rem', padding: '0.3rem 0.5rem' }}
                >
                  🗑
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
