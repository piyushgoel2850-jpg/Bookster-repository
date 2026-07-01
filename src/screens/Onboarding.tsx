import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GENRES = [
  'Fiction',
  'Sci-Fi',
  'Mystery',
  'Self-Improvement',
  'Career',
  'Philosophy',
  'Non-Fiction',
  'Essays',
  'News',
];

const READ_TIMES = [
  { value: 5, label: '5 min / day', desc: 'Casual' },
  { value: 10, label: '10 min / day', desc: 'Recommended' },
  { value: 20, label: '20 min / day', desc: 'Serious' },
  { value: 30, label: '30 min / day', desc: 'Intense' },
];

const TIME_PREFS = [
  { value: 'Morning', icon: '🌅' },
  { value: 'Commute', icon: '🚌' },
  { value: 'Lunch Break', icon: '🥪' },
  { value: 'Evening', icon: '🌇' },
  { value: 'Before Bed', icon: '🛏️' },
];

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, signIn, setOnboardingData } = useAuth();

  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [dailyGoal, setDailyGoal] = useState<number>(10);
  const [customGoal, setCustomGoal] = useState<string>('');
  const [timePref, setTimePref] = useState<string>('Evening');
  const [displayName, setDisplayName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const [isLogin, setIsLogin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    if (!isLogin && !displayName) {
      setErrorMsg('Please enter your name.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    try {
      const finalGoal = dailyGoal === 999 ? parseInt(customGoal) || 10 : dailyGoal;
      await setOnboardingData(displayName || 'Reader', finalGoal, timePref);

      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMsg(error.message || 'Login failed.');
          setSubmitting(false);
          return;
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          setErrorMsg(error.message || 'Registration failed.');
          setSubmitting(false);
          return;
        }
      }
      navigate('/');
    } catch (e: any) {
      setErrorMsg(e.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between max-w-md mx-auto relative px-6 py-8 overflow-hidden select-none">
      {/* Background radial highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-orange-500/10 blur-3xl pointer-events-none -z-10" />

      {/* Step Progress Bar (Only visible after step 1 and when not logging in) */}
      {step > 1 && (
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mb-6 flex">
          <div
            className="bg-orange-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      )}

      {/* Step 1: Pitch Screen */}
      {step === 1 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8 my-auto">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-orange-500 to-rose-500 flex items-center justify-center shadow-xl shadow-orange-500/20 animate-pulse">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3">
              Meet <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">Bookster</span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed px-4">
              Build a daily reading habit through gamified streaks, levels, and XP. 
              Duolingo meets Goodreads, built for your mind.
            </p>
          </div>
          <div className="w-full pt-8 space-y-4">
            <button
              onClick={handleNext}
              className="w-full py-4 bg-orange-500 hover:bg-orange-400 active:bg-orange-600 transition font-bold rounded-2xl text-white shadow-lg shadow-orange-500/20 cursor-pointer text-center"
            >
              Get Started
            </button>
            <button
              onClick={() => {
                setIsLogin(true);
                setStep(5);
              }}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 transition font-bold rounded-2xl text-slate-300 border border-slate-800 cursor-pointer text-center"
            >
              I Already Have an Account
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Genres Multi-select */}
      {step === 2 && (
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-2xl font-extrabold text-white">What do you want to read?</h2>
            <p className="text-slate-400 text-sm">Select topics you find interesting. We'll curate short pieces for you.</p>
            <div className="flex flex-wrap gap-3 pt-4">
              {GENRES.map((genre) => {
                const selected = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`px-4 py-2.5 rounded-2xl text-sm font-bold border transition duration-200 cursor-pointer ${
                      selected
                        ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="pt-8 flex gap-4">
            <button
              onClick={handleBack}
              className="px-6 py-4 bg-slate-900 hover:bg-slate-800 transition font-bold rounded-2xl text-slate-400 border border-slate-800 cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={selectedGenres.length === 0}
              className="flex-1 py-4 bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-400 transition font-bold rounded-2xl text-white shadow-lg cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Daily Goal Target */}
      {step === 3 && (
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-2xl font-extrabold text-white">Choose your daily goal</h2>
            <p className="text-slate-400 text-sm">How many minutes do you want to commit to reading each day?</p>
            <div className="space-y-3 pt-4">
              {READ_TIMES.map((time) => {
                const selected = dailyGoal === time.value;
                return (
                  <button
                    key={time.value}
                    onClick={() => {
                      setDailyGoal(time.value);
                      setCustomGoal('');
                    }}
                    className={`w-full p-4 rounded-2xl flex items-center justify-between border transition duration-200 cursor-pointer ${
                      selected
                        ? 'bg-orange-500/10 border-orange-500 text-orange-400 font-extrabold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold">{time.label}</span>
                    <span className="text-xs uppercase opacity-80">{time.desc}</span>
                  </button>
                );
              })}

              {/* Custom Goal Option */}
              <div
                onClick={() => setDailyGoal(999)}
                className={`w-full p-4 rounded-2xl flex items-center justify-between border transition duration-200 cursor-pointer ${
                  dailyGoal === 999
                    ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="font-bold">Custom minutes</span>
                {dailyGoal === 999 && (
                  <input
                    type="number"
                    min="1"
                    max="180"
                    placeholder="Enter min"
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-center font-bold text-slate-100 outline-none focus:border-orange-500"
                  />
                )}
              </div>
            </div>
          </div>
          <div className="pt-8 flex gap-4">
            <button
              onClick={handleBack}
              className="px-6 py-4 bg-slate-900 hover:bg-slate-800 transition font-bold rounded-2xl text-slate-400 border border-slate-800 cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={dailyGoal === 999 && !customGoal}
              className="flex-1 py-4 bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-400 transition font-bold rounded-2xl text-white shadow-lg cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Time Preference */}
      {step === 4 && (
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-2xl font-extrabold text-white">When do you usually read?</h2>
            <p className="text-slate-400 text-sm">We'll send you custom nudge notifications during these windows.</p>
            <div className="space-y-3 pt-4">
              {TIME_PREFS.map((pref) => {
                const selected = timePref === pref.value;
                return (
                  <button
                    key={pref.value}
                    onClick={() => setTimePref(pref.value)}
                    className={`w-full p-4 rounded-2xl flex items-center gap-4 border transition duration-200 cursor-pointer ${
                      selected
                        ? 'bg-orange-500/10 border-orange-500 text-orange-400 font-extrabold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-2xl">{pref.icon}</span>
                    <span className="font-bold">{pref.value}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="pt-8 flex gap-4">
            <button
              onClick={handleBack}
              className="px-6 py-4 bg-slate-900 hover:bg-slate-800 transition font-bold rounded-2xl text-slate-400 border border-slate-800 cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-4 bg-orange-500 hover:bg-orange-400 transition font-bold rounded-2xl text-white shadow-lg cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Sign Up / Sign In Auth Screen */}
      {step === 5 && (
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-2xl font-extrabold text-white">
              {isLogin ? 'Welcome Back!' : 'Create your account'}
            </h2>
            <p className="text-slate-400 text-sm">
              {isLogin ? 'Log in to continue syncing your habits.' : 'Lock in your daily streak goal.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl">
                  {errorMsg}
                </div>
              )}

              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Display Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Alex"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-100 rounded-2xl px-4 py-3 outline-none"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-100 rounded-2xl px-4 py-3 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-100 rounded-2xl px-4 py-3 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 mt-6 bg-orange-500 hover:bg-orange-400 active:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold rounded-2xl text-white shadow-lg cursor-pointer text-center"
              >
                {submitting ? 'Please wait...' : isLogin ? 'Log In' : 'Create Free Account'}
              </button>
            </form>

            <div className="relative flex items-center justify-center my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-900" />
              </div>
              <span className="relative px-3 bg-slate-950 text-xs font-bold uppercase tracking-widest text-slate-600">
                Or
              </span>
            </div>

            <button
              onClick={() => alert('Google authentication is mocked. Please use email/password.')}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 transition font-bold rounded-2xl text-slate-300 border border-slate-800 flex items-center justify-center gap-3 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="pt-8 flex justify-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg('');
              }}
              className="text-sm font-bold text-orange-500 hover:text-orange-400 cursor-pointer"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Log In'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
