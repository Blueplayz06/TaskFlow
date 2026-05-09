import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('All fields are required'); return; }
    setLoading(true);
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-[Syne,sans-serif] text-3xl font-bold bg-gradient-to-r from-violet-300 via-violet-400 to-blue-400 bg-clip-text text-transparent">
            TaskFlow
          </h1>
          <p className="text-[#9090a8] text-sm mt-1">Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div className="bg-[#17171e] border border-[#2e2e3a] rounded-2xl p-6">
          {error && (
            <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email">
              <input
                type="email"
                className="auth-input"
                placeholder="you@company.com"
                value={form.email}
                onChange={set('email')}
                autoFocus
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                className="auth-input"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#9090a8] mt-4">
          No account?{' '}
          <Link to="/register" className="text-violet-400 hover:text-violet-300 transition-colors">
            Create one
          </Link>
        </p>
      </div>

      <style>{`
        .auth-input {
          width: 100%;
          background: #1e1e28;
          border: 1px solid #2e2e3a;
          border-radius: 8px;
          padding: 9px 12px;
          color: #f0f0f5;
          font-size: 13.5px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color .12s;
        }
        .auth-input:focus { border-color: #7c6ff7; }
        .auth-input::placeholder { color: #5a5a72; }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#9090a8] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

