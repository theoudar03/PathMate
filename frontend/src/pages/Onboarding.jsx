import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import ChipSelect from '../components/onboarding/ChipSelect';
import VoiceInputButton from '../components/onboarding/VoiceInputButton';
import TranslateText from '../components/common/TranslateText';

const DEPARTMENTS = [
  'CSE', 'CSE(AI&ML)', 'AI&DS', 'CSBS', 'ECE', 'EEE', 'ICE', 'Civil', 'IT', 'MECH'
];

const INTERESTS = [
  'Coding', 'Robotics & Hardware', 'Arts & Crafts', 'Debate & Public Speaking',
  'Sports & Athletics', 'Volunteering', 'Tamil Culture', 'Other'
];

// Helper: client-side syntax validation for username
const validateUsernameLocal = (username) => {
  if (!username) return 'usernameRequired';
  if (username.length < 4) return 'usernameMinLen';
  if (username.length > 20) return 'usernameMaxLen';
  if (!/^[a-z0-9_.]+$/.test(username)) return 'usernameFormatError';
  if (/^[0-9]/.test(username)) return 'usernameStartNumber';
  if (/[._]$/.test(username)) return 'usernameEndSpecial';
  if (/\.\./.test(username) || /__/.test(username) || /\._/.test(username) || /_\./.test(username)) {
    return 'usernameConsecutiveSpecial';
  }
  const reserved = ['admin', 'administrator', 'support', 'system', 'sce', 'pathmate', 'root'];
  if (reserved.includes(username.toLowerCase())) return 'usernameReserved';
  return null;
};

// Helper: check if password matches strength criteria
const validatePasswordLocal = (password) => {
  if (!password) return 'passwordRequired';
  if (password.length < 8) return 'passwordMinLen';
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  if (!hasUpper || !hasLower || !hasNumbers || !hasSpecial) {
    return 'passwordCriteria';
  }
  return null;
};

const Onboarding = ({ isOpen, onClose, onOpenLogin }) => {
  const navigate = useNavigate();
  const { completeOnboarding, t, language } = useApp();
  const otpRefs = useRef([]);

  // Onboarding Stepper Steps (1 to 5)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: Personal Details
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Live personal email format validator
  useEffect(() => {
    if (!email) {
      setEmailError('');
      return;
    }
    const cleanEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError(t('invalidEmail') || 'Invalid email address format');
    } else {
      setEmailError('');
    }
  }, [email]);

  const [preferredLang, setPreferredLang] = useState('en');
  const [gender, setGender] = useState('Male'); // 'Male' | 'Female'
  const [hosteller, setHosteller] = useState(null); // true = Hosteller, false = Day Scholar
  const [hostelBlock, setHostelBlock] = useState('Boys Hostel');
  const [travelMode, setTravelMode] = useState('own_transport'); // 'college_bus' | 'own_transport'

  // Step 2: Department & Interests
  const [department, setDepartment] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [customNotes, setCustomNotes] = useState('');
  const [otherInterestText, setOtherInterestText] = useState('');

  // Step 3: Account Credentials
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState(null); // null | { loading: bool, available: bool, reason: string }
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('Weak'); // Weak | Fair | Good | Strong

  const [finalCreds, setFinalCreds] = useState(null); // { user, token }

  // Step 4b: OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);

  useEffect(() => {
    if (otpResendCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [otpResendCooldown]);

  // Debounced API username validation
  useEffect(() => {
    if (!username) {
      setUsernameStatus(null);
      return;
    }

    // Client-side quick check first
    const clientErr = validateUsernameLocal(username);
    if (clientErr) {
      setUsernameStatus({ loading: false, available: false, reason: clientErr });
      return;
    }

    setUsernameStatus({ loading: true, available: false, reason: 'checkingAvailability' });

    const delayDebounce = setTimeout(() => {
      fetch(`/auth/check-username?username=${encodeURIComponent(username.toLowerCase())}`)
        .then(res => res.json())
        .then(data => {
          if (data.available) {
            setUsernameStatus({ loading: false, available: true, reason: 'usernameAvailable' });
          } else {
            setUsernameStatus({ loading: false, available: false, reason: 'usernameTaken' });
          }
        })
        .catch(err => {
          console.error("Error checking username:", err);
          setUsernameStatus({ loading: false, available: false, reason: 'usernameTaken' });
        });
    }, 450); // 450ms debounce delay

    return () => clearTimeout(delayDebounce);
  }, [username]);

  // Live password strength assessor
  useEffect(() => {
    if (!password) {
      setPasswordStrength('Weak');
      return;
    }
    if (password.length < 8) {
      setPasswordStrength('Weak');
      return;
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    if (password.length >= 12 && hasUpper && hasLower && hasNumbers && hasSpecial) {
      setPasswordStrength('Strong');
    } else if (password.length >= 8 && hasUpper && hasLower && hasNumbers && hasSpecial) {
      setPasswordStrength('Good');
    } else {
      setPasswordStrength('Fair');
    }
  }, [password]);

  // Step 4: Run backend account registration - Prompt user to confirm email first
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setShowEmailConfirmModal(true);
  };

  const confirmAndSendOtp = async () => {
    setShowEmailConfirmModal(false);
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/auth/register/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          roll_number: rollNumber.trim() || null,
          email: email.trim() || null,
          preferred_language: preferredLang,
          hosteller: hosteller,
          department: department,
          interests: selectedInterests,
          custom_notes: customNotes.trim() || null,
          hostel_block: hosteller ? hostelBlock : null,
          username: username.toLowerCase().trim(),
          password: password,
          gender: gender,
          travel_mode: hosteller ? 'own_transport' : travelMode
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      // Open OTP Verification Dialog Modal
      setShowOtpModal(true);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpResendCooldown(60);
      setOtpError('');
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed. Please check inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (codeStr) => {
    setOtpLoading(true);
    setOtpError('');

    try {
      const res = await fetch('/auth/register/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          roll_number: rollNumber.trim() || null,
          email: email.trim() || null,
          preferred_language: preferredLang,
          hosteller: hosteller,
          department: department,
          interests: selectedInterests,
          custom_notes: customNotes.trim() || null,
          hostel_block: hosteller ? hostelBlock : null,
          username: username.toLowerCase().trim(),
          password: password,
          gender: gender,
          travel_mode: hosteller ? 'own_transport' : travelMode,
          otp: codeStr
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Incorrect code or verification failed');
      }

      setFinalCreds({ user: data.user, token: data.token });
      setOtpSuccess(true);
      
      // Auto-transition to Step 5 after brief delay for premium experience
      setTimeout(() => {
        setShowOtpModal(false);
        setOtpSuccess(false);
        setStep(5);
      }, 1000);
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpResendCooldown > 0) return;
    setOtpLoading(true);
    setOtpError('');

    try {
      const res = await fetch('/auth/register/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          roll_number: rollNumber.trim() || null,
          email: email.trim() || null,
          preferred_language: preferredLang,
          hosteller: hosteller,
          department: department,
          interests: selectedInterests,
          custom_notes: customNotes.trim() || null,
          hostel_block: hosteller ? hostelBlock : null,
          username: username.toLowerCase().trim(),
          password: password,
          gender: gender,
          travel_mode: hosteller ? 'own_transport' : travelMode
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend verification code');
      }

      setOtpDigits(['', '', '', '', '', '']);
      setOtpResendCooldown(60);
      setOtpError('');
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleChangeOtpDigit = (index, value) => {
    const cleanVal = value.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    // Autofocus next input if filled
    if (cleanVal && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto verify if all digits are filled
    const codeStr = newDigits.join('');
    if (codeStr.length === 6 && !newDigits.includes('')) {
      handleVerifyOtp(codeStr);
    }
  };

  const handleKeyDownOtpDigit = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePasteOtp = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '').slice(0, 6);
    if (text) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = text[i] || '';
      }
      setOtpDigits(newDigits);

      // Focus appropriate box
      const targetIndex = Math.min(text.length, 5);
      otpRefs.current[targetIndex]?.focus();

      // Auto verify if complete
      if (text.length === 6) {
        handleVerifyOtp(text);
      }
    }
  };

  // Complete onboarding and enter app
  const handleEnterPortal = () => {
    if (finalCreds && finalCreds.user && finalCreds.token) {
      completeOnboarding(finalCreds.user, finalCreds.token);
      onClose();
      navigate('/');
    }
  };

  // Step Nav validation checks
  const canNextStep1 = fullName.trim().length > 0 && hosteller !== null && email.trim().length > 0 && !emailError;
  const canNextStep2 = department !== '' && selectedInterests.length > 0;
  const canNextStep3 = 
    usernameStatus?.available && 
    validatePasswordLocal(password) === null && 
    password === confirmPassword;

  return (
    <div className="fixed inset-0 bg-surface text-onSurface z-50 overflow-y-auto flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans select-none animate-fade-in">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-surfaceVariant pb-4 max-w-3xl w-full mx-auto select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary text-onPrimary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[16px] font-bold">account_balance</span>
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wide text-primary uppercase">SCE PathMate</h1>
            <span className="text-[8px] text-onSurfaceVariant uppercase font-bold tracking-wider">{t('freshersPortal')}</span>
          </div>
        </div>
        <button
          onClick={() => { if (confirm(t('cancelOnboardingConfirm'))) onClose(); }}
          className="text-xs font-bold text-onSurfaceVariant hover:text-primary transition-colors flex items-center gap-1 border border-outline/35 rounded-full px-3 py-1 bg-surfaceContainerLow"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
          {t('exitBtn')}
        </button>
      </div>

      {/* Main Container */}
      <div className="my-auto max-w-2xl w-full mx-auto py-6">
        
        {/* Stepper Progress Header */}
        <div className="flex justify-between items-center mb-8 px-4 sm:px-10 select-none">
          {[
            { nr: 1, key: 'stepPersonal' },
            { nr: 2, key: 'stepProfile' },
            { nr: 3, key: 'stepCredentials' },
            { nr: 4, key: 'stepSummary' },
            { nr: 5, key: 'stepWelcome' }
          ].map((s) => {
            const isActive = step === s.nr;
            const isCompleted = step > s.nr;
            return (
              <div key={s.nr} className="flex flex-col items-center relative flex-1">
                {/* Connector line */}
                {s.nr < 5 && (
                  <div
                    className={`absolute top-4 left-[50%] right-[-50%] h-[2px] z-0 ${
                      step > s.nr ? 'bg-primary' : 'bg-outline/20'
                    }`}
                  />
                )}
                
                {/* Circle */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-all ${
                    isActive
                      ? 'bg-primary text-onPrimary ring-4 ring-primary/20 shadow-md'
                      : isCompleted
                      ? 'bg-primary text-onPrimary shadow-sm'
                      : 'bg-surfaceContainerHigh text-onSurfaceVariant border border-outline/25'
                  }`}
                >
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-[16px] font-black">check</span>
                  ) : (
                    s.nr
                  )}
                </div>
                
                {/* Label */}
                <span
                  className={`text-[9px] sm:text-[10px] font-extrabold uppercase mt-2 tracking-wider text-center leading-tight ${
                    isActive ? 'text-primary block' : 'text-onSurfaceVariant/60 hidden sm:block'
                  }`}
                >
                  {t(s.key)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Stepper Card */}
        <div className="bg-surfaceContainerLowest border border-surfaceVariant/60 rounded-[28px] p-6 sm:p-8 shadow-elevation2">
          
          {errorMsg && (
            <div className="bg-errorContainer text-onErrorContainer border border-error/20 rounded-2xl p-4 mb-5 text-xs font-semibold leading-normal flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-error flex-shrink-0 mt-0.5">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-left">
                <h3 className="text-lg font-black text-onSurface">{t('personalInfo')}</h3>
                <p className="text-xs text-onSurfaceVariant mt-1">{t('personalSubtitle')}</p>
              </div>

              <div className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1 text-left">
                  <label htmlFor="reg-fullname" className="text-[10px] font-bold text-onSurfaceVariant uppercase tracking-wider">
                    {t('fullName')} <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-3 text-onSurfaceVariant/70 text-[18px]">person</span>
                    <input
                      id="reg-fullname"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t('enterNamePlaceholder')}
                      className="w-full pl-10 pr-4 py-2.5 border border-outline/35 rounded-2xl text-sm bg-surfaceContainerLowest focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Roll Number & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Roll Number */}
                  <div className="space-y-1 text-left">
                    <label htmlFor="reg-roll" className="text-[10px] font-bold text-onSurfaceVariant uppercase tracking-wider">
                      {t('rollNumber')} <span className="text-onSurfaceVariant/60">({t('optional')})</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-3 text-onSurfaceVariant/70 text-[18px]">tag</span>
                      <input
                        id="reg-roll"
                        type="text"
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value)}
                        placeholder={t('rollPlaceholder')}
                        className="w-full pl-10 pr-4 py-2.5 border border-outline/35 rounded-2xl text-sm bg-surfaceContainerLowest focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1 text-left">
                    <label htmlFor="reg-email" className="text-[10px] font-bold text-onSurfaceVariant uppercase tracking-wider">
                      {t('personalEmailAddress') || 'Personal Email Address'} <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-3 text-onSurfaceVariant/70 text-[18px]">mail</span>
                      <input
                        id="reg-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        placeholder={t('emailPlaceholder')}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-2xl text-sm bg-surfaceContainerLowest focus:ring-1 focus:ring-primary outline-none ${emailError ? 'border-error focus:ring-error' : 'border-outline/35 focus:border-primary'}`}
                      />
                    </div>
                    {emailError && (
                      <p className="text-[10px] text-error font-medium mt-1 leading-tight">{emailError}</p>
                    )}
                  </div>
                </div>

                {/* Language Preference */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-bold text-onSurfaceVariant uppercase tracking-wider block">
                    {t('preferredLanguage')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { code: 'en', label: 'English' },
                      { code: 'ta', label: 'தமிழ்' },
                      { code: 'hi', label: 'हिन्दी' }
                    ].map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => setPreferredLang(l.code)}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all duration-150 ease-in-out cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 outline-none ${
                          preferredLang === l.code
                            ? 'bg-primary border-primary text-white shadow-elevation2'
                            : 'border-outline/25 bg-surface text-primary hover:bg-primaryContainer/20 hover:text-[#123669]'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gender Selection */}
                <div className="space-y-2 text-left animate-fade-in">
                  <label className="text-[10px] font-bold text-onSurfaceVariant uppercase tracking-wider block">
                    {t('gender') || 'Gender'} <span className="text-error">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setGender('Male');
                        if (hostelBlock === 'Girls Hostel') {
                          setHostelBlock('Boys Hostel');
                        }
                      }}
                      className={`py-3 px-4 text-xs font-bold rounded-2xl border transition-all duration-150 ease-in-out cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 outline-none flex items-center justify-center gap-2 ${
                        gender === 'Male'
                          ? 'bg-primary border-primary text-white shadow-elevation2'
                          : 'border-outline/25 bg-surface text-primary hover:bg-primaryContainer/20 hover:text-[#123669]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">male</span>
                      {t('genderMale') || 'Male'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGender('Female');
                        setHostelBlock('Girls Hostel');
                      }}
                      className={`py-3 px-4 text-xs font-bold rounded-2xl border transition-all duration-150 ease-in-out cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 outline-none flex items-center justify-center gap-2 ${
                        gender === 'Female'
                          ? 'bg-primary border-primary text-white shadow-elevation2'
                          : 'border-outline/25 bg-surface text-primary hover:bg-primaryContainer/20 hover:text-[#123669]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">female</span>
                      {t('genderFemale') || 'Female'}
                    </button>
                  </div>
                </div>

                {/* Stay Type */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-bold text-onSurfaceVariant uppercase tracking-wider block">
                    {t('stayType')} <span className="text-error">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setHosteller(true);
                        setTravelMode('own_transport');
                      }}
                      className={`py-3 px-4 text-xs font-bold rounded-2xl border transition-all duration-150 ease-in-out cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 outline-none flex items-center justify-center gap-2 ${
                        hosteller === true
                          ? 'bg-primary border-primary text-white shadow-elevation2'
                          : 'border-outline/25 bg-surface text-primary hover:bg-primaryContainer/20 hover:text-[#123669]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">hotel</span>
                      {t('hosteller')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setHosteller(false)}
                      className={`py-3 px-4 text-xs font-bold rounded-2xl border transition-all duration-150 ease-in-out cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 outline-none flex items-center justify-center gap-2 ${
                        hosteller === false
                          ? 'bg-primary border-primary text-white shadow-elevation2'
                          : 'border-outline/25 bg-surface text-primary hover:bg-primaryContainer/20 hover:text-[#123669]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">directions_bus</span>
                      {t('dayScholar')}
                    </button>
                  </div>
                </div>

                {/* Mode of Travel (Conditional on Day Scholar) */}
                {hosteller === false && (
                  <div className="space-y-1.5 text-left animate-slide-up">
                    <label htmlFor="reg-travelMode" className="text-[10px] font-bold text-onSurfaceVariant uppercase tracking-wider block">
                      {t('travelMode') || 'Mode of Travel'} <span className="text-error">*</span>
                    </label>
                    <select
                      id="reg-travelMode"
                      value={travelMode}
                      onChange={(e) => setTravelMode(e.target.value)}
                      className="w-full px-3 py-2.5 border border-outline/35 rounded-2xl text-sm bg-surfaceContainerLowest focus:border-primary focus:ring-1 focus:ring-primary outline-none font-semibold text-onSurface"
                    >
                      <option value="own_transport">{t('ownTransport') || 'Out Bus / Own Vehicle'}</option>
                      <option value="college_bus">{t('collegeBus') || 'College Bus'}</option>
                    </select>
                  </div>
                )}

                {/* Hostel Block Selection */}
                {hosteller === true && (
                  <div className="space-y-1.5 text-left animate-slide-up">
                    <label htmlFor="reg-hostelBlock" className="text-[10px] font-bold text-onSurfaceVariant uppercase tracking-wider">
                      {t('hostelBlockLabel')}
                    </label>
                    <select
                      id="reg-hostelBlock"
                      value={hostelBlock}
                      onChange={(e) => setHostelBlock(e.target.value)}
                      className="w-full px-3 py-2.5 border border-outline/35 rounded-2xl text-sm bg-surfaceContainerLowest focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    >
                      {gender === 'Female' ? (
                        <option value="Girls Hostel">{t('hostelGirlsBlockOption') || 'Girls Hostel'}</option>
                      ) : (
                        <option value="Boys Hostel">{t('hostelBBlockOption') || 'Boys Hostel'}</option>
                      )}
                    </select>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-surfaceVariant/60 pt-5 flex justify-between items-center">
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5 cursor-pointer bg-transparent border-0 outline-none"
                >
                  <span className="material-symbols-outlined text-[16px] font-bold">login</span>
                  <span>{t('alreadyAccountText') || 'Already have an account'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!canNextStep1}
                  className="bg-primary hover:bg-primaryHover text-white text-xs font-bold py-2.5 px-6 rounded-full disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-1.5 min-h-[44px]"
                  style={{ boxShadow: '0 1px 3px rgba(27,77,166,0.2), 0 4px 12px rgba(27,77,166,0.16)' }}
                >
                  <span>{t('continue')}</span>
                  <span className="material-symbols-outlined text-[16px] font-bold">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Department & Interests */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-left">
                <h3 className="text-lg font-black text-onSurface">{t('deptInterests')}</h3>
                <p className="text-xs text-onSurfaceVariant mt-1">{t('deptSubtitle')}</p>
              </div>

              <div className="space-y-4">
                {/* Department Selection */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="reg-department" className="text-[10px] font-bold text-onSurfaceVariant uppercase tracking-wider">
                    {t('enggDept')} <span className="text-error">*</span>
                  </label>
                  <select
                    id="reg-department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 border border-outline/35 rounded-2xl text-sm bg-surfaceContainerLowest focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="">{t('selectDept')}</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Stated Interests */}
                <div className="space-y-1 text-left">
                  <ChipSelect
                    options={INTERESTS}
                    selected={selectedInterests}
                    onChange={setSelectedInterests}
                    multiple={true}
                    label={t('interestsQuestion')}
                    otherText={otherInterestText}
                    onOtherTextChange={setOtherInterestText}
                    placeholder={t('interestOtherPlaceholder')}
                  />
                </div>

                {/* Custom Notes & Voice Input */}
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center">
                    <label htmlFor="reg-customnotes" className="text-[10px] font-bold text-onSurfaceVariant uppercase tracking-wider">
                      {t('describeGoals')}
                    </label>
                    <VoiceInputButton
                      onTranscript={(text) => setCustomNotes(prev => prev + " " + text)}
                      onError={(err) => {
                        if (err) setErrorMsg(err);
                      }}
                    />
                  </div>
                  <textarea
                    id="reg-customnotes"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    rows={3}
                    placeholder={t('tellAboutSelf')}
                    className="w-full px-4 py-3 border border-outline/35 rounded-2xl text-sm bg-surfaceContainerLowest focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none font-sans text-onSurface"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-surfaceVariant/60 pt-5 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="border border-outline/30 hover:bg-surfaceContainerHigh text-primary text-xs font-bold py-2.5 px-5 rounded-full flex items-center gap-1.5 min-h-[44px]"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span>{t('back')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!canNextStep2}
                  className="bg-primary hover:bg-primaryHover text-white text-xs font-bold py-2.5 px-6 rounded-full disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-1.5 min-h-[44px]"
                  style={{ boxShadow: '0 1px 3px rgba(27,77,166,0.2), 0 4px 12px rgba(27,77,166,0.16)' }}
                >
                  <span>{t('continue')}</span>
                  <span className="material-symbols-outlined text-[16px] font-bold">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Account Credentials */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in text-left">
              <div>
                <h3 className="text-lg font-black text-onSurface">{t('chooseCreds')}</h3>
                <p className="text-xs text-onSurfaceVariant mt-1">{t('credsSubtitle')}</p>
              </div>

              <div className="space-y-4">
                {/* Username Input */}
                <div className="space-y-1">
                  <label htmlFor="reg-username" className="text-[10px] font-bold text-onSurfaceVariant uppercase tracking-wider">
                    {t('chooseUsername')} <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-3 text-onSurfaceVariant/70 text-[18px] select-none">person</span>
                    <input
                      id="reg-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="e.g. anitha_kumar"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-2xl text-sm bg-surfaceContainerLowest focus:ring-1 focus:ring-primary outline-none transition-colors ${
                        usernameStatus ? (usernameStatus.available ? 'border-success' : 'border-error') : 'border-outline/35'
                      }`}
                    />
                  </div>
                  
                  {/* Real-time Debounced Status */}
                  {usernameStatus && (
                    <div className="text-[11px] font-semibold mt-1 transition-all flex items-center gap-1">
                      {usernameStatus.loading ? (
                        <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : usernameStatus.available ? (
                        <span className="text-success flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] font-bold">check_circle</span>
                          {t(usernameStatus.reason)}
                        </span>
                      ) : (
                        <span className="text-error flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">cancel</span>
                          {t(usernameStatus.reason)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <label htmlFor="reg-password" className="text-[10px] font-bold text-onSurfaceVariant uppercase tracking-wider">
                    {t('setPassword')} <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-3 text-onSurfaceVariant/70 text-[18px] select-none">lock</span>
                    <input
                      id="reg-password"
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="w-full pl-10 pr-10 py-2.5 border border-outline/35 rounded-2xl text-sm bg-surfaceContainerLowest focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-3 text-onSurfaceVariant/70"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  
                  {/* Live Password Strength Meter */}
                  {password && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-onSurfaceVariant uppercase">{t('strength')}:</span>
                        <span
                          className={`uppercase tracking-wide font-black ${
                            passwordStrength === 'Strong'
                              ? 'text-success'
                              : passwordStrength === 'Good'
                              ? 'text-primary'
                              : passwordStrength === 'Fair'
                              ? 'text-orange-500'
                              : 'text-error'
                          }`}
                        >
                          {passwordStrength}
                        </span>
                      </div>
                      <div className="w-full bg-outline/20 h-1 rounded-full overflow-hidden flex gap-0.5">
                        <div className={`h-full flex-1 ${passwordStrength === 'Weak' ? 'bg-error' : passwordStrength === 'Fair' ? 'bg-orange-400' : passwordStrength === 'Good' ? 'bg-primary' : 'bg-success'}`} />
                        <div className={`h-full flex-1 ${['Fair', 'Good', 'Strong'].includes(passwordStrength) ? (passwordStrength === 'Fair' ? 'bg-orange-400' : passwordStrength === 'Good' ? 'bg-primary' : 'bg-success') : 'bg-transparent'}`} />
                        <div className={`h-full flex-1 ${['Good', 'Strong'].includes(passwordStrength) ? (passwordStrength === 'Good' ? 'bg-primary' : 'bg-success') : 'bg-transparent'}`} />
                        <div className={`h-full flex-1 ${passwordStrength === 'Strong' ? 'bg-success' : 'bg-transparent'}`} />
                      </div>
                      {validatePasswordLocal(password) && (
                        <p className="text-[10px] text-error font-medium mt-1 leading-tight">
                          {t(validatePasswordLocal(password))}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-1">
                  <label htmlFor="reg-confirm" className="text-[10px] font-bold text-onSurfaceVariant uppercase tracking-wider">
                    {t('confirmPassword')} <span className="text-error">*</span>
                  </label>
                  <input
                    id="reg-confirm"
                    type={showPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-4 py-2.5 border border-outline/35 rounded-2xl text-sm bg-surfaceContainerLowest focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[10px] text-error font-medium mt-1">{t('passwordsMatch')}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-surfaceVariant/60 pt-5 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="border border-outline/30 hover:bg-surfaceContainerHigh text-primary text-xs font-bold py-2.5 px-5 rounded-full flex items-center gap-1.5 min-h-[44px]"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span>{t('back')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(4)}
                  disabled={!canNextStep3}
                  className="bg-primary hover:bg-primaryHover text-white text-xs font-bold py-2.5 px-6 rounded-full disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-1.5 min-h-[44px]"
                  style={{ boxShadow: '0 1px 3px rgba(27,77,166,0.2), 0 4px 12px rgba(27,77,166,0.16)' }}
                >
                  <span>{t('verifyProfile')}</span>
                  <span className="material-symbols-outlined text-[16px] font-bold">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Summary / Confirmation */}
          {step === 4 && (
            <form onSubmit={handleRegisterSubmit} className="space-y-5 animate-fade-in text-left">
              <div>
                <h3 className="text-lg font-black text-onSurface">{t('confirmReg')}</h3>
                <p className="text-xs text-onSurfaceVariant mt-1">{t('summarySubtitle')}</p>
              </div>

              {/* Summary Block */}
              <div className="bg-surfaceContainerLow border border-outline/20 rounded-2xl p-5 space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-y-3.5">
                  <div>
                    <span className="text-[10px] font-bold text-onSurfaceVariant uppercase tracking-wider block">{t('fullNameLabel')}</span>
                    <span className="text-sm font-extrabold text-onSurface">{fullName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-onSurfaceVariant uppercase tracking-wider block">{t('streamDept')}</span>
                    <span className="text-sm font-extrabold text-primary">{department}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-onSurfaceVariant uppercase tracking-wider block">{t('stayTypeLabel')}</span>
                    <span className="text-sm font-extrabold text-onSurface">
                      {hosteller ? `${t('hosteller')} (${hostelBlock.split(' ')[0]})` : t('dayScholar')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-onSurfaceVariant uppercase tracking-wider block">{t('registeredUsername')}</span>
                    <span className="text-sm font-mono font-black text-primary">@{username}</span>
                  </div>
                </div>

                <div className="border-t border-outline/15 pt-3">
                  <span className="text-[10px] font-bold text-onSurfaceVariant uppercase tracking-wider block">{t('areasOfInterest')}</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {selectedInterests.map((interest) => (
                      <span key={interest} className="px-2.5 py-1 bg-surfaceContainerHighest text-[11px] font-bold rounded-lg">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-surfaceVariant/60 pt-5 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={loading}
                  className="border border-outline/30 hover:bg-surfaceContainerHigh text-primary text-xs font-bold py-2.5 px-5 rounded-full flex items-center gap-1.5 min-h-[44px]"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span>{t('back')}</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-primaryHover text-white text-xs font-bold py-2.5 px-6 rounded-full shadow-sm flex items-center gap-1.5 min-h-[44px]"
                  style={{ boxShadow: '0 1px 3px rgba(27,77,166,0.2), 0 4px 12px rgba(27,77,166,0.16)' }}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{t('registerAccount')}</span>
                      <span className="material-symbols-outlined text-[16px] font-bold">cloud_upload</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 5: Welcome Complete */}
          {step === 5 && finalCreds && (
            <div className="space-y-6 animate-fade-in text-center py-4">
              {/* Success Badge */}
              <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto shadow-sm">
                <span className="material-symbols-outlined text-[36px] font-bold select-none">check_circle</span>
              </div>

              <div>
                <h3 className="text-xl font-black text-onSurface">{t('setupComplete')}</h3>
                <p className="text-xs text-onSurfaceVariant mt-1">{t('setupCompleteSubtitle')}</p>
              </div>

              <div className="bg-surfaceContainerLow border border-outline/15 rounded-2xl p-4 inline-block mx-auto text-left min-w-[240px]">
                <div className="text-[10px] text-onSurfaceVariant font-bold uppercase tracking-wider">{t('permanentUsername')}</div>
                <div className="text-base font-extrabold text-primary select-all mt-0.5">@{finalCreds.user.username}</div>
              </div>

              <p className="text-xs text-onSurfaceVariant max-w-sm mx-auto leading-relaxed">
                {t('detailsVerified')}
              </p>

              {/* Action Buttons */}
              <div className="border-t border-surfaceVariant/60 pt-5 flex justify-center">
                <button
                  type="button"
                  onClick={handleEnterPortal}
                  className="bg-primary hover:bg-primaryHover text-white text-xs font-bold py-3 px-8 rounded-full shadow-md hover:shadow-elevation1 flex items-center gap-1.5 min-h-[48px]"
                  style={{ boxShadow: '0 1px 3px rgba(27,77,166,0.2), 0 4px 12px rgba(27,77,166,0.16)' }}
                >
                  <span>{t('enterPortal')}</span>
                  <span className="material-symbols-outlined text-[16px] font-bold">rocket_launch</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* EMAIL ADDRESS CONFIRMATION MODAL WARNING POPUP */}
      {showEmailConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="bg-surfaceContainerLowest border border-surfaceVariant/60 rounded-[28px] max-w-sm w-full p-6 text-center shadow-elevation3 relative select-none animate-scale-up">
            
            {/* Warning Logo */}
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[24px]">report</span>
            </div>

            <h3 className="text-lg font-black text-onSurface">{t('confirmEmailTitle') || 'Confirm Your Email Address'}</h3>
            <p className="text-xs text-onSurfaceVariant mt-2 leading-relaxed">
              {t('confirmEmailSubtitle') || 'Please verify that your personal email address is correct. An OTP verification code will be sent here.'}
            </p>

            {/* Email Box Highlight */}
            <div className="my-4 bg-surfaceContainerLow p-3 rounded-xl border border-outline/10 font-mono text-sm font-black text-primary break-all">
              {email}
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => {
                  setShowEmailConfirmModal(false);
                  setStep(1); // Go to step 1 to edit email
                }}
                className="flex-1 border border-outline/35 hover:bg-surfaceContainerHigh text-onSurface text-xs font-bold py-2.5 rounded-full min-h-[40px] cursor-pointer outline-none transition-all active:scale-[0.98]"
              >
                {t('editEmailBtn') || 'Edit Email'}
              </button>

              <button
                type="button"
                onClick={confirmAndSendOtp}
                className="flex-1 bg-primary hover:bg-primaryHover text-white text-xs font-bold py-2.5 rounded-full shadow-md min-h-[40px] cursor-pointer outline-none transition-all active:scale-[0.98]"
              >
                {t('sendOtpBtn') || 'Send OTP'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EMAIL OTP VERIFICATION MODAL OVERLAY */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="bg-surfaceContainerLowest border border-surfaceVariant/60 rounded-[28px] max-w-md w-full p-6 sm:p-8 text-center shadow-elevation3 relative select-none animate-scale-up">
            
            {/* Logo */}
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[24px]">mark_email_read</span>
            </div>

            <h3 className="text-lg font-black text-onSurface">{t('verifyEmailTitle') || 'Verify Your Email Address'}</h3>
            <p className="text-xs text-onSurfaceVariant mt-1.5 leading-relaxed">
              {t('verifyEmailSubtitle') || 'We have sent a verification code to'} <strong className="text-primary block font-extrabold break-all mt-0.5">{email}</strong>
            </p>

            {otpError && (
              <div className="bg-errorContainer text-onErrorContainer border border-error/25 rounded-2xl p-3 mt-4 text-xs font-semibold leading-normal flex items-start gap-2 text-left">
                <span className="material-symbols-outlined text-[15px] text-error flex-shrink-0 mt-0.5">error</span>
                <span>{otpError}</span>
              </div>
            )}

            {/* Inputs Grid */}
            <div className="my-6">
              <label className="text-[10px] font-bold text-onSurfaceVariant uppercase tracking-wider block mb-3 text-left">
                {t('verifyOtpLabel') || '6-Digit Verification Code'}
              </label>
              <div className="flex justify-between gap-2.5" onPaste={handlePasteOtp}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpRefs.current[idx] = el)}
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChangeOtpDigit(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDownOtpDigit(idx, e)}
                    disabled={otpLoading || otpSuccess}
                    className="w-11 h-12 border border-outline/35 rounded-xl text-center text-lg font-black bg-surfaceContainerLowest text-onSurface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-elevation1"
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4 pt-2 border-t border-surfaceVariant/60">
              <div className="flex justify-between items-center text-xs">
                {/* Change Email Option */}
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  disabled={otpLoading || otpSuccess}
                  className="text-primary font-bold hover:underline bg-transparent border-none outline-none cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">edit_note</span>
                  {t('changeEmailBtn') || 'Change Email'}
                </button>

                {/* Resend Countdown / Button */}
                {otpResendCooldown > 0 ? (
                  <span className="text-onSurfaceVariant/60 font-bold">
                    {(t('resendCountdown') || 'Resend in {seconds}s').replace('{seconds}', otpResendCooldown)}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={otpLoading || otpSuccess}
                    className="text-primary font-black hover:underline bg-transparent border-none outline-none cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">refresh</span>
                    {t('resendOtpBtn') || 'Resend Code'}
                  </button>
                )}
              </div>

              {/* Verify Manual Action Button */}
              <button
                type="button"
                onClick={() => handleVerifyOtp(otpDigits.join(''))}
                disabled={otpLoading || otpSuccess || otpDigits.includes('')}
                className="w-full bg-primary hover:bg-primaryHover text-white text-xs font-bold py-3 rounded-full shadow-md flex items-center justify-center gap-2 min-h-[44px]"
              >
                {otpLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : otpSuccess ? (
                  <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                ) : (
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                )}
                <span>
                  {otpLoading 
                    ? (t('otpVerifying') || 'Verifying...') 
                    : otpSuccess 
                      ? (t('otpVerifiedSuccess') || 'Verified!') 
                      : (t('verifyBtn') || 'Verify Code')}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-[10px] text-onSurfaceVariant/60 text-center max-w-xl mx-auto border-t border-surfaceVariant/30 pt-4 w-full select-none">
        {t('footerText')}
      </div>

    </div>
  );
};

export default Onboarding;

