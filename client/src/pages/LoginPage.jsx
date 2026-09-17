import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const { login, register, loginWithGoogle } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, displayName);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await loginWithGoogle(credentialResponse.credential);
    } catch (err) {
      setError('Google login failed.');
    }
  };

  return (
    <div className="login-scene">
      {/* Background Decorations */}
      <div className="cloud" style={{ top: '10%', animationDuration: '40s' }}>☁️</div>
      <div className="cloud" style={{ top: '25%', animationDuration: '30s', animationDelay: '-10s', fontSize: '2rem' }}>☁️</div>
      <div className="cloud" style={{ top: '40%', animationDuration: '50s', animationDelay: '-20s', opacity: 0.3 }}>☁️</div>
      
      <div className="scene-decoration" style={{ left: '10%' }}>🌳</div>
      <div className="scene-decoration" style={{ right: '15%', transform: 'scale(0.8)' }}>🪴</div>
      <div className="scene-decoration" style={{ left: '25%', bottom: '90px', fontSize: '1rem' }}>🌱</div>
      <div className="scene-decoration" style={{ right: '30%', bottom: '70px', fontSize: '1.2rem' }}>🌿</div>

      {/* Login Card (Notice Board) */}
      <div className="login-card">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3 animate-float">🌱</div>
          <h1 className="login-title text-xl mb-2">
            GrowTrack
          </h1>
          <p className="font-pixel text-[0.55rem] uppercase tracking-widest text-retro-darkwood">
            Plant Habits. Grow Progress.
          </p>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6 relative z-10">
          {isRegister && (
            <div>
              <label className="font-pixel text-xs block mb-1 text-retro-darkwood">Display Name</label>
              <input
                type="text"
                className="pixel-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Farmer name"
                required
              />
            </div>
          )}
          <div>
            <label className="font-pixel text-xs block mb-1 text-retro-darkwood">Email</label>
            <input
              type="email"
              className="pixel-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="font-pixel text-xs block mb-1 text-retro-darkwood">Password</label>
            <input
              type="password"
              className="pixel-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="bg-retro-softred text-white p-2 border-2 border-[#c0392b] font-pixel text-[0.55rem] text-center shadow-pixel-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-pixel btn-pixel-primary w-full py-3"
            disabled={loading}
          >
            {loading ? '...' : isRegister ? '🌱 Start Journey' : '🚪 Enter Farm'}
          </button>
        </form>

        {/* Toggle Login/Register */}
        <div className="text-center">
          <p className="text-retro-darkgray text-sm mb-2 font-bold">
            {isRegister ? 'Already have a farm?' : "New to the valley?"}
          </p>
          <button
            className="btn-pixel btn-pixel-gold"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            type="button"
          >
            {isRegister ? 'Return to Login' : 'Create New Farm'}
          </button>
        </div>
      </div>
    </div>
  );
}
