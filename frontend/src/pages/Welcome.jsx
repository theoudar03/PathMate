import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import Onboarding from './Onboarding';
import TranslateText from '../components/common/TranslateText';

const CAMPUS_BG_URL = '/assets/campus-bg.jpg';

const Welcome = () => {
  const navigate = useNavigate();
  const { completeOnboarding, resetAllData, t } = useApp();
  
  // Dialog State: null | 'login' | 'register'
  const [activeDialog, setActiveDialog] = useState(null);

  // Login Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg(t('pleaseEnterBoth'));
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
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.success && data.token) {
        completeOnboarding(data.user, data.token);
        setActiveDialog(null);
        navigate('/');
      } else {
        throw new Error('Unexpected authentication response');
      }
    } catch (err) {
      setErrorMsg(err.message === 'Authentication failed' || err.message === 'Incorrect username or password.' ? t('incorrectCreds') : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between p-6 sm:p-10 text-white font-sans overflow-hidden">
      
      {/* Background Campus Photo - recognisable, scale factor prevents edge white artifacts */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter blur-[7px] scale-105 transition-transform duration-700 z-0" 
        style={{ backgroundImage: `url('${CAMPUS_BG_URL}')` }}
      />
      <div className="absolute inset-0 bg-black/45 z-1" />

      {/* Top Banner (College & Portal Branding) */}
      <div className="relative z-10 flex flex-col items-center text-center pt-4 animate-fade-in select-none">
        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-lg backdrop-blur-md">
          <span className="material-symbols-outlined text-[32px] text-white font-bold select-none">account_balance</span>
        </div>
        <h2 className="text-xs sm:text-sm font-black tracking-widest text-gray-200 mt-3 uppercase leading-none">
          {t('saranathanTitle')}
        </h2>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1.5 uppercase leading-none">
          PathMate
        </h1>
        <span className="text-[10px] sm:text-xs text-primaryContainer bg-primary/40 border border-primary/20 px-3 py-1 rounded-full font-black tracking-wider uppercase mt-2">
          {t('freshersPortal')}
        </span>
      </div>

      {/* Middle Welcome Content (Institutional overview) */}
      <div className="relative z-10 my-auto text-center max-w-2xl mx-auto space-y-6 pt-10 pb-6 select-none">
        <div className="space-y-3">
          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            {t('welcomeTitle')}
          </h3>
          <p className="text-sm sm:text-base text-gray-200 font-semibold leading-relaxed">
            {t('welcomeSubtitle')}
          </p>
        </div>

        {/* Institution Highlights (Chips/Cards) */}
        <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto pt-2">
          {[
            { key: 'foundedHighlight', icon: 'history' },
            { key: 'nbaHighlight', icon: 'verified' },
            { key: 'naacHighlight', icon: 'workspace_premium' },
            { key: 'annaHighlight', icon: 'school' },
            { key: 'aicteHighlight', icon: 'task_alt' },
            { key: 'campusHighlight', icon: 'landscape' },
            { key: 'deptsHighlight', icon: 'widgets' },
            { key: 'busesHighlight', icon: 'directions_bus' }
          ].map((item) => (
            <span
              key={item.key}
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-full px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[14px] text-accent select-none font-bold">{item.icon}</span>
              {t(item.key)}
            </span>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-6">
          <button
            type="button"
            onClick={() => { resetAllData(); setActiveDialog('register'); }}
            className="w-full sm:w-auto bg-primary hover:bg-primaryHover text-white font-extrabold text-xs py-3.5 px-8 rounded-full shadow-lg transition-all flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.98]"
            style={{ boxShadow: '0 1px 3px rgba(27,77,166,0.2), 0 4px 12px rgba(27,77,166,0.16)' }}
          >
            <span className="material-symbols-outlined text-[16px] font-bold">rocket_launch</span>
            <span>{t('getStarted')}</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveDialog('login')}
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-xs py-3.5 px-8 rounded-full shadow-md transition-all flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[16px]">login</span>
            <span>{t('alreadyAccount')}</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-[10px] text-gray-400 text-center select-none pt-4 border-t border-white/10 w-full max-w-lg mx-auto">
        {t('footerText')}
      </div>

      {/* LOGIN DIALOG MODAL */}
      {activeDialog === 'login' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4 animate-fade-in">
        <div className="bg-white border border-outline/40 text-onSurface rounded-[24px] w-full max-w-[480px] p-7 sm:p-8 text-left relative animate-scale-up"
             style={{ boxShadow: '0 8px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(0,0,0,0.06)' }}>
            
            {/* Close Button */}
            <button
              onClick={() => { setActiveDialog(null); setErrorMsg(''); }}
              className="absolute right-4 top-4 text-onSurfaceVariant hover:text-onSurface p-1.5 rounded-full hover:bg-surfaceContainerHigh transition-colors"
              aria-label="Close dialog"
            >
              <span className="material-symbols-outlined text-[20px] select-none">close</span>
            </button>

            {/* Logo and Heading */}
            <div className="flex items-center gap-3 mb-4 select-none">
              <div className="w-8 h-8 rounded-lg bg-primary text-onPrimary flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[16px] font-bold">account_balance</span>
              </div>
              <div>
                <h4 className="text-xs font-black tracking-wide text-primary uppercase">SCE PathMate</h4>
                <span className="text-[8px] text-onSurfaceVariant uppercase font-bold tracking-wider">
                  {t('authGate')}
                </span>
              </div>
            </div>

            <h2 className="text-xl font-black tracking-tight">{t('welcomeBack')}</h2>
            <p className="text-xs text-onSurfaceVariant mt-1">{t('loginSubtitle')}</p>

            {/* Error Message */}
            {errorMsg && (
              <div className="bg-errorContainer text-onErrorContainer border border-error/20 rounded-2xl p-3.5 mt-4 text-xs font-semibold flex items-start gap-2 animate-slide-up">
                <span className="material-symbols-outlined text-[16px] text-error flex-shrink-0 mt-0.5">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4 pt-4">
              
              {/* Username Input */}
              <div className="space-y-1">
                <label htmlFor="modal-username" className="block text-[10px] font-bold text-onSurfaceVariant uppercase tracking-wider">
                  {t('username')}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-onSurfaceVariant/70 text-[18px] select-none">person</span>
                  <input
                    id="modal-username"
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setErrorMsg(''); }}
                    placeholder={t('username')}
                    disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 border border-outline/40 rounded-xl text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all duration-150 text-onSurface placeholder:text-onSurfaceVariant/50"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label htmlFor="modal-password" className="block text-[10px] font-bold text-onSurfaceVariant uppercase tracking-wider">
                    {t('password')}
                  </label>
                  <button
                    type="button"
                    onClick={() => alert(t('passwordRecoveryAlert'))}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    {t('forgotPassword')}
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-onSurfaceVariant/70 text-[18px] select-none">lock</span>
                  <input
                    id="modal-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full pl-10 pr-10 py-2.5 border border-outline/40 rounded-xl text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all duration-150 text-onSurface placeholder:text-onSurfaceVariant/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-onSurfaceVariant/70 hover:text-onSurface"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined text-[18px] select-none">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-onSurfaceVariant select-none pt-1">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded border-outline/35 cursor-pointer"
                  disabled={loading}
                />
                <span>{t('rememberMe')}</span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primaryHover text-white font-black text-[13px] py-3 px-4 rounded-full disabled:opacity-50 transition-all duration-150 flex items-center justify-center gap-2 mt-2 min-h-[48px] active:scale-[0.98]"
                style={{ boxShadow: '0 1px 3px rgba(27,77,166,0.2), 0 4px 12px rgba(27,77,166,0.16)' }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px] font-bold">login</span>
                    <span>{t('login')}</span>
                  </>
                )}
              </button>
            </form>

            {/* Create Account Selector */}
            <div className="mt-5 border-t border-surfaceVariant/60 pt-4 text-center text-xs">
              <span className="text-onSurfaceVariant">{t('firstTime')}</span>
              <button
                type="button"
                onClick={() => { setActiveDialog('register'); setErrorMsg(''); }}
                className="ml-1.5 font-black text-primary hover:underline"
                disabled={loading}
              >
                {t('createAccount')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN ONBOARDING STEPPER (REGISTER MODE) */}
      {activeDialog === 'register' && (
        <Onboarding 
          isOpen={true} 
          onClose={() => setActiveDialog(null)} 
        />
      )}

    </div>
  );
};

export default Welcome;

