import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineShieldCheck, HiOutlineExclamationCircle, HiOutlineLockClosed } from 'react-icons/hi';

export const AuthorityLoginPage = () => {
  const { loginAuthority } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/authority/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginAuthority(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to the backend server. Please make sure the backend API is running on port 5000 and MongoDB is connected.');
      } else {
        setError(
          err.response?.data?.message || 'Invalid government authority credentials or unauthorized role.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@civicconnect.gov.in');
    setPassword('Admin@Civic2026!');
    setError('');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-900">
      <div className="w-full max-w-md bg-slate-950 rounded-3xl shadow-2xl border border-slate-800 p-8 sm:p-10 text-white">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-teal-500/10 border border-teal-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-teal-400">
            <HiOutlineShieldCheck className="w-8 h-8" />
          </div>
          <span className="text-[10px] tracking-widest font-black uppercase text-teal-400 bg-teal-950 px-2.5 py-0.5 rounded-full border border-teal-800">
            Official Access Only
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight mt-3">
            Government Authority Portal
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Departmental grievance triage, inspection assignments, and civic resolution panel.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-sm flex items-start gap-2.5">
            <HiOutlineExclamationCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Official Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@civicconnect.gov.in"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Authority Secure Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 px-4 rounded-xl font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 focus:ring-4 focus:ring-teal-400/30 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <HiOutlineLockClosed className="w-4 h-4" />
            <span>{loading ? 'Verifying Credentials...' : 'Sign In as Government Official'}</span>
          </button>
        </form>

        {/* Demo official button */}
        <div className="mt-5">
          <button
            type="button"
            onClick={handleFillDemo}
            className="w-full py-2 px-3 rounded-lg border border-teal-500/40 bg-teal-950/40 hover:bg-teal-900/50 text-teal-300 text-xs font-semibold transition-colors"
          >
            ⚡ Auto-fill Chief Commissioner Demo Credentials
          </button>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500 pt-6 border-t border-slate-800">
          Citizen looking to report an issue?{' '}
          <Link to="/login" className="font-bold text-teal-400 hover:underline">
            Citizen Portal Login
          </Link>
        </div>
      </div>
    </div>
  );
};
