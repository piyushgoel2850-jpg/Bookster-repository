import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  const { refreshStats } = useGame();

  const [dailyGoal, setDailyGoal] = useState<number>(10);
  const [timePref, setTimePref] = useState<string>('Evening');
  const [dailyReminder, setDailyReminder] = useState(true);
  const [streakAlerts, setStreakAlerts] = useState(true);
  const [friendNudges, setFriendNudges] = useState(false);
  const [reminderTime, setReminderTime] = useState('20:00');

  // Success indicator
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setDailyGoal(profile.daily_goal_minutes);
      setTimePref(profile.preferred_reading_time);

      // Pre-fill time based on preferred reading time
      if (profile.preferred_reading_time === 'Morning') setReminderTime('08:00');
      else if (profile.preferred_reading_time === 'Commute') setReminderTime('17:30');
      else if (profile.preferred_reading_time === 'Lunch Break') setReminderTime('12:30');
      else if (profile.preferred_reading_time === 'Evening') setReminderTime('19:30');
      else if (profile.preferred_reading_time === 'Before Bed') setReminderTime('21:30');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        daily_goal_minutes: dailyGoal,
        preferred_reading_time: timePref,
      });
      await refreshStats();
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        navigate('/profile');
      }, 1500);
    } catch (e) {
      console.error('Error saving settings updates:', e);
    }
  };

  const handleResetData = () => {
    if (
      confirm(
        'WARNING: This will wipe all local storage data, including your streak, level, books, and logged reflections. Are you sure you want to proceed?'
      )
    ) {
      // Clear bookster items
      Object.keys(localStorage)
        .filter((key) => key.startsWith('bookster_'))
        .forEach((key) => localStorage.removeItem(key));
      
      alert('Data reset successfully! Redirecting to onboarding.');
      window.location.href = '/onboarding';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-8 max-w-md mx-auto relative select-none">
      
      {/* Top Header */}
      <header className="flex items-center justify-between mb-8 border-b border-slate-900 pb-4">
        <button
          onClick={() => navigate('/profile')}
          className="text-slate-400 hover:text-slate-200 text-sm font-bold cursor-pointer"
        >
          ← Back
        </button>
        <h1 className="text-lg font-black text-white">Settings</h1>
        <div className="w-10" /> {/* balance spacing */}
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        {saved && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl text-center">
            ✨ Settings saved successfully!
          </div>
        )}

        {/* Goal Configurations */}
        <section className="space-y-4">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Habit Goals</h3>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400">Daily Reading Goal (Minutes)</label>
            <input
              type="number"
              min="1"
              max="180"
              required
              value={dailyGoal}
              onChange={(e) => setDailyGoal(parseInt(e.target.value) || 10)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl px-4 py-3 outline-none focus:border-orange-500 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400">Preferred Reading Time</label>
            <select
              value={timePref}
              onChange={(e) => setTimePref(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl px-4 py-3 outline-none focus:border-orange-500 text-sm"
            >
              <option value="Morning">Morning 🌅</option>
              <option value="Commute">Commute 🚌</option>
              <option value="Lunch Break">Lunch Break 🥪</option>
              <option value="Evening">Evening 🌇</option>
              <option value="Before Bed">Before Bed 🛏️</option>
            </select>
          </div>
        </section>

        {/* Notification Settings */}
        <section className="space-y-4 pt-2">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Reminders</h3>

          <div className="space-y-3">
            {/* Toggle Daily Reminder */}
            <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-2xl border border-slate-900 text-xs">
              <div>
                <span className="block font-bold text-slate-300">Daily reminder nudges</span>
                <span className="text-[10px] text-slate-500">Alert me when it is time to read</span>
              </div>
              <button
                type="button"
                onClick={() => setDailyReminder(!dailyReminder)}
                className={`w-10 h-6 rounded-full p-0.5 transition duration-300 ${
                  dailyReminder ? 'bg-orange-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition duration-300 ${
                    dailyReminder ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Time Picker */}
            {dailyReminder && (
              <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-2xl border border-slate-900 text-xs">
                <span className="font-bold text-slate-300">Reminder Time</span>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-100 text-center font-bold"
                />
              </div>
            )}

            {/* Toggle Streak Alert */}
            <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-2xl border border-slate-900 text-xs">
              <div>
                <span className="block font-bold text-slate-300">Streak-risk alerts</span>
                <span className="text-[10px] text-slate-500">Nudge me if my active streak is at risk</span>
              </div>
              <button
                type="button"
                onClick={() => setStreakAlerts(!streakAlerts)}
                className={`w-10 h-6 rounded-full p-0.5 transition duration-300 ${
                  streakAlerts ? 'bg-orange-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition duration-300 ${
                    streakAlerts ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle Friend activity Nudge */}
            <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-2xl border border-slate-900 text-xs">
              <div>
                <span className="block font-bold text-slate-300">Friend activity notifications</span>
                <span className="text-[10px] text-slate-500">Notify me on friends reading streaks updates</span>
              </div>
              <button
                type="button"
                onClick={() => setFriendNudges(!friendNudges)}
                className={`w-10 h-6 rounded-full p-0.5 transition duration-300 ${
                  friendNudges ? 'bg-orange-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition duration-300 ${
                    friendNudges ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="pt-6 space-y-4">
          <button
            type="submit"
            className="w-full py-4 bg-orange-500 hover:bg-orange-400 transition font-black rounded-2xl text-white shadow-xl cursor-pointer text-center text-sm"
          >
            Save Configuration
          </button>
          <button
            type="button"
            onClick={handleResetData}
            className="w-full py-3 bg-transparent text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition font-bold rounded-2xl text-xs cursor-pointer text-center"
          >
            Reset Application Data
          </button>
        </div>
      </form>
    </div>
  );
};
export default Settings;
