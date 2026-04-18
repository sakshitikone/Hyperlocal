// src/pages/AuthPage.jsx — Combined Login & Register
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AuthPage = () => {
  const [mode, setMode]       = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const { login, register }   = useAuth();
  const navigate              = useNavigate();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'register' && form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        // Try to get user's location
        let lat = 19.076, lng = 72.8777;
        try {
          const pos = await new Promise((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch { /* use defaults */ }
        await register({ name: form.name, email: form.email, password: form.password, lat, lng });
      }
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--clr-bg)' }}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{ background: 'var(--clr-surface)', borderRight: '1px solid var(--clr-border)' }}>
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--clr-accent) 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="relative">
          <span className="font-display text-3xl font-bold" style={{ color: 'var(--clr-accent2)' }}>
            Hyper<span style={{ color: 'var(--clr-text)' }}>Local</span>
          </span>
        </div>

        <div className="relative space-y-6">
          <h1 className="font-display text-5xl font-bold leading-tight" style={{ color: 'var(--clr-text)' }}>
            Help your<br />community,<br />
            <span style={{ color: 'var(--clr-accent2)' }}>in real-time.</span>
          </h1>
          <p className="text-lg" style={{ color: 'var(--clr-subtext)' }}>
            Request or offer resources within your campus or neighborhood — food, tools, rides, study help, and more.
          </p>
          <div className="flex flex-col gap-3">
            {['📍 Hyperlocal matching', '⚡ Real-time chat', '🔔 Instant notifications', '⭐ Community trust ratings'].map((f) => (
              <div key={f} className="flex items-center gap-3 text-sm" style={{ color: 'var(--clr-subtext)' }}>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs" style={{ color: 'var(--clr-muted)' }}>© 2024 HyperLocal</p>
      </div>

      {/* Right auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <span className="font-display text-2xl font-bold" style={{ color: 'var(--clr-accent2)' }}>
              Hyper<span style={{ color: 'var(--clr-text)' }}>Local</span>
            </span>
          </div>

          <h2 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--clr-text)' }}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-sm mb-8" style={{ color: 'var(--clr-subtext)' }}>
            {mode === 'login' ? 'Sign in to your community.' : 'Join your local community.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label">Full Name</label>
                <input className="input" name="name" placeholder="Alex Johnson" value={form.name} onChange={handleChange} required />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input className="input" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
            </div>
            {mode === 'register' && (
              <div>
                <label className="label">Confirm Password</label>
                <input className="input" name="confirmPassword" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={handleChange} required />
              </div>
            )}

            <button type="submit" className="btn-primary w-full py-3 mt-2" disabled={loading}>
              {loading ? <span className="spinner w-4 h-4" /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p className="text-sm text-center mt-6" style={{ color: 'var(--clr-subtext)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="font-medium" style={{ color: 'var(--clr-accent2)' }}>
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
