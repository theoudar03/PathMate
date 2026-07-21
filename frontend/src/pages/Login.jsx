import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

const CAMPUS_BG_URL = '/assets/campus-bg.jpg';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { completeOnboarding, t } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Auto-fill remembered username if saved
  useEffect(() => {
    const savedUser = localStorage.getItem('pm_remembered_username');
    if (savedUser) {
      setUsername(savedUser);
      setRememberMe(true);
    }
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg(t('pleaseEnterBoth') || 'Please enter both Username/Register Number and Password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please check your credentials.');
      }

      if (data.success && data.token && data.user) {
        // Save or clear remembered username
        if (rememberMe) {
          localStorage.setItem('pm_remembered_username', username.trim());
        } else {
          localStorage.removeItem('pm_remembered_username');
        }

        completeOnboarding(data.user, data.token);

        // Redirect to intended route if present, else default to /dashboard
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        throw new Error('Unexpected authentication response from server.');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 text-onSurface font-sans overflow-hidden">
      
      {/* Background Campus Image with Gradient Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter blur-[6px] scale-105 transition-transform duration-1000 z-0" 
        style={{ backgroundImage: `url('${CAMPUS_BG_URL}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-primary/30 z-1" />

      {/* Main Glassmorphic Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-xl border border-white/30 rounded-[32px] p-7 sm:p-9 shadow-2xl animate-fade-in text-left">
        
        {/* Branding & Logo */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary text-onPrimary flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[24px] font-bold select-none">account_balance</span>
            </div>
            <div>
              <h2 className="text-xs font-black tracking-widest text-primary uppercase">Saranathan College</h2>
              <h1 className="text-xl font-black text-onSurface tracking-tight">PathMate Portal</h1>
            </div>
          </div>
        </div>

        {/* Header Title */}
        <div className="mb-6">
          <h3 className="text-2xl font-black tracking-tight text-onSurface">Student Sign In</h3>
          <p className="text-xs text-onSurfaceVariant font-medium mt-1">
            Access your student portal, clubs, study hub, and campus tools securely.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-errorContainer text-onErrorContainer border border-error/30 rounded-2xl p-3.5 mb-5 text-xs font-semibold flex items-start gap-2.5 animate-slide-up shadow-sm">
            <span className="material-symbols-outlined text-[18px] text-error flex-shrink-0 mt-0.5 select-none">error</span>
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          
          {/* Username / Register Number */}
          <div className="space-y-1.5">
            <label htmlFor="login-username" className="block text-[11px] font-bold text-onSurfaceVariant uppercase tracking-wider">
              Username or Register Number
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-onSurfaceVariant/60 text-[20px] select-none">person</span>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setErrorMsg(''); }}
                placeholder="e.g. SCE2025CSE001 or username"
                disabled={loading}
                className="w-full pl-11 pr-4 py-3 border border-outline/30 rounded-2xl text-sm bg-surfaceContainerLow/60 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200 text-onSurface font-medium placeholder:text-onSurfaceVariant/40"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="login-password" className="block text-[11px] font-bold text-onSurfaceVariant uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[11px] font-bold text-primary hover:underline outline-none"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-onSurfaceVariant/60 text-[20px] select-none">lock</span>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                placeholder="••••••••"
                disabled={loading}
                className="w-full pl-11 pr-11 py-3 border border-outline/30 rounded-2xl text-sm bg-surfaceContainerLow/60 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200 text-onSurface font-medium placeholder:text-onSurfaceVariant/40"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-onSurfaceVariant/60 hover:text-onSurface p-0.5 rounded-full transition-colors outline-none"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <span className="material-symbols-outlined text-[20px] select-none">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-onSurfaceVariant select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-outline/40 text-primary focus:ring-primary/20 cursor-pointer"
              />
              <span>Remember Register Number</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-primary hover:bg-primaryHover text-onPrimary font-black text-sm py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed min-h-[50px]"
            style={{ boxShadow: '0 4px 14px rgba(27,77,166,0.3)' }}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Authenticating...</span>
              </div>
            ) : (
              <>
                <span>Sign In to Student Portal</span>
                <span className="material-symbols-outlined text-[18px] font-bold">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Links & Navigation */}
        <div className="mt-7 pt-5 border-t border-outline/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-onSurfaceVariant">
          <div>
            Don't have an account?{' '}
            <Link to="/welcome" className="font-extrabold text-primary hover:underline">
              Register Here
            </Link>
          </div>
          <Link to="/admin/login" className="font-extrabold text-secondary hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
            <span>Admin Portal</span>
          </Link>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-outline/30 rounded-[28px] max-w-md w-full p-6 text-left shadow-2xl relative animate-scale-up">
            
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute right-4 top-4 text-onSurfaceVariant hover:text-onSurface p-1.5 rounded-full hover:bg-surfaceContainerHigh transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="w-10 h-10 rounded-2xl bg-secondaryContainer text-onSecondaryContainer flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[22px]">lock_reset</span>
            </div>

            <h3 className="text-xl font-black text-onSurface mb-2">Password Reset Assistance</h3>
            <p className="text-xs text-onSurfaceVariant leading-relaxed mb-4">
              To reset your PathMate portal password, please verify your official Saranathan Register Number with your Department HOD or College IT Administrator.
            </p>

            <div className="bg-surfaceContainerHigh/60 rounded-2xl p-4 border border-outline/20 text-xs space-y-2 mb-6">
              <div className="font-bold text-onSurface">Contact Admin Office:</div>
              <div className="text-onSurfaceVariant">📧 Email: admin@saranathan.ac.in</div>
              <div className="text-onSurfaceVariant">📍 Location: Central Office, Santhanam Block</div>
            </div>

            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full bg-primary text-onPrimary font-bold text-xs py-3 rounded-xl shadow-md hover:bg-primaryHover transition-all"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="relative z-10 text-[11px] text-white/70 text-center font-medium mt-6 select-none">
        © 2026 Saranathan College of Engineering — PathMate Official Portal
      </div>

    </div>
  );
};

export default Login;
