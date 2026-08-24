import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import GardenGrid from '../components/GardenGrid';
import HabitList from '../components/HabitList';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [habits, setHabits] = useState([]);
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [habitsRes, plotsRes] = await Promise.all([
        api.get('/habits'),
        api.get('/garden'),
      ]);
      setHabits(habitsRes.data.habits);
      setPlots(plotsRes.data.plots);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-pixel text-sm animate-pulse">Loading your garden...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <h1 className="font-pixel text-sm text-retro-darkgreen">
          🌱 GrowTrack
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm">
            👤 {user?.display_name}
          </span>
          <button className="btn-pixel" onClick={logout} style={{ fontSize: '0.5rem', padding: '0.3rem 0.6rem' }}>
            Logout
          </button>
        </div>
      </header>

      {/* Garden */}
      <div className="mb-6">
        <GardenGrid plots={plots} />
      </div>

      {/* Habits */}
      <HabitList habits={habits} onHabitChange={fetchData} />
    </div>
  );
}
