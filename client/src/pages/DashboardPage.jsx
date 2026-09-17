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

  // Time-of-day detection for background theming
  const [timeClass, setTimeClass] = useState('theme-day');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 8) setTimeClass('theme-dawn');
    else if (hour >= 8 && hour < 17) setTimeClass('theme-day');
    else if (hour >= 17 && hour < 20) setTimeClass('theme-dusk');
    else setTimeClass('theme-night');
  }, []);

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
      <div className="loading-screen">
        <div className="text-4xl animate-float">🌱</div>
        <p className="loading-text">Loading your farm...</p>
      </div>
    );
  }

  // Calculate some stats
  const totalStreak = habits.reduce((sum, h) => sum + h.current_streak, 0);
  const activePlants = plots.filter(p => p.habit_id !== null).length;
  const maturePlants = plots.filter(p => ['mature_tree', 'fruiting_tree'].includes(p.growth_stage)).length;

  return (
    <div className={`min-h-screen p-4 max-w-4xl mx-auto ${timeClass}`}>
      {/* Header Banner */}
      <header className="app-header pixel-panel-wood mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Animated clouds in header */}
        <div className="cloud">☁️</div>
        <div className="cloud">☁️</div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="text-3xl animate-sway">🌻</div>
          <div>
            <h1 className="font-pixel text-sm md:text-base text-retro-white" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.5)' }}>
              {user?.display_name}'s Farm
            </h1>
            <p className="font-pixel text-[0.45rem] text-retro-gold mt-1 uppercase tracking-widest">
              GrowTrack • Day {Math.max(1, totalStreak)}
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 self-end sm:self-auto">
          <button className="btn-pixel btn-pixel-danger" onClick={logout}>
            🚪 Save & Quit
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="stats-bar mb-6 justify-center sm:justify-start">
        <div className="stat-item">
          <span className="stat-icon">🔥</span>
          <span>Total Fire:</span>
          <span className="stat-value">{totalStreak}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🌱</span>
          <span>Planted:</span>
          <span className="stat-value">{activePlants}/36</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🌳</span>
          <span>Mature:</span>
          <span className="stat-value">{maturePlants}</span>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-start">
        {/* Left: Garden */}
        <div className="flex justify-center">
          <GardenGrid plots={plots} />
        </div>

        {/* Right: Habits */}
        <div>
          <HabitList habits={habits} onHabitChange={fetchData} />
        </div>
      </div>
    </div>
  );
}
