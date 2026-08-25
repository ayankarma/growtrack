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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="pixel-panel w-full max-w-md">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="font-pixel text-xl text-retro-darkgreen mb-2">
            🌱 GrowTrack
          </h1>
          <p className="text-retro-darkgray text-lg">
            Plant Habits. Grow Progress.
          </p>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3 mb-4">
          {isRegister && (
            <div>
              <label className="font-pixel text-xs block mb-1">Display Name</label>
              <input
                type="text"
                className="pixel-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
          )}
          <div>
            <label className="font-pixel text-xs block mb-1">Email</label>
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
            <label className="font-pixel text-xs block mb-1">Password</label>
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

          {error && <p className="text-retro-red font-pixel text-xs">{error}</p>}

          <button
            type="submit"
            className="btn-pixel btn-pixel-primary w-full"
            disabled={loading}
          >
            {loading ? '...' : isRegister ? '🌱 Sign Up' : '🚪 Log In'}
          </button>
        </form>

        {/* Toggle Login/Register */}
        <p className="text-center text-sm mb-4">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            className="underline text-retro-darkgreen font-bold"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
          >
            {isRegister ? 'Log In' : 'Sign Up'}
          </button>
        </p>


      </div>
    </div>
  );
}
