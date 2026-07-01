import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { db } from '../lib/db';
import type { UserBook, Reflection } from '../lib/db';
import { BottomNav } from '../components/BottomNav';

interface BadgeType {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
}

const ALL_POSSIBLE_BADGES: BadgeType[] = [
  {
    id: 'first_step',
    name: 'First Step',
    desc: 'Completed your first reading session.',
    icon: '🌱',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'streak_7',
    name: '7-Day Streak',
    desc: 'Kept your habit alive for 7 days.',
    icon: '🔥',
    color: 'from-orange-500 to-rose-500',
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    desc: 'Completed a session after 9:00 PM.',
    icon: '🦉',
    color: 'from-indigo-500 to-purple-600',
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    desc: 'Completed a session before 9:00 AM.',
    icon: '🌅',
    color: 'from-amber-400 to-orange-500',
  },
  {
    id: 'bookworm',
    name: 'Bookworm',
    desc: 'Finished your first entire book.',
    icon: '🐛',
    color: 'from-sky-500 to-blue-600',
  },
  {
    id: 'genre_explorer',
    name: 'Explorer',
    desc: 'Read stories in 3+ genres.',
    icon: '🧭',
    color: 'from-pink-500 to-rose-600',
  },
];

const SPINE_COLORS = [
  'from-orange-600 to-orange-800 border-orange-500',
  'from-emerald-600 to-emerald-800 border-emerald-500',
  'from-rose-600 to-rose-800 border-rose-500',
  'from-indigo-600 to-indigo-800 border-indigo-500',
  'from-amber-600 to-amber-800 border-amber-500',
  'from-sky-600 to-sky-800 border-sky-500',
];

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { streak, xp, level, badges } = useGame();

  const [finishedBooks, setFinishedBooks] = useState<UserBook[]>([]);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!profile) return;
      try {
        // Books finished
        const books = await db.getUserBooks(profile.id);
        setFinishedBooks(books.filter((b) => b.status === 'finished'));

        // Reflections feed
        const refs = await db.getReflections(profile.id);
        setReflections(refs);

        // Calculate total minutes
        const sessions = await db.getReadingSessions(profile.id);
        const mins = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
        setTotalMinutes(mins);
      } catch (e) {
        console.error('Failed to load profile details:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [profile]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 px-6 pt-6 max-w-md mx-auto relative select-none">
      
      {/* Header Settings Cog */}
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black text-white">Profile</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition cursor-pointer"
            title="Settings"
          >
            ⚙️
          </button>
          <button
            onClick={() => {
              if (confirm('Log out of Bookster?')) {
                signOut().then(() => navigate('/onboarding'));
              }
            }}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800/80 text-xs font-bold text-rose-400 hover:bg-slate-800 cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500 font-bold">
          Loading profile...
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* User Bio Card */}
          <div className="text-center space-y-2">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-orange-500 to-rose-500 flex items-center justify-center text-4xl mx-auto shadow-xl shadow-orange-500/10">
              🦊
            </div>
            <h2 className="text-xl font-black text-white">{profile?.display_name || 'Reader'}</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Level {level} Active Scholar • {xp % 100}/100 XP
            </p>
          </div>

          {/* Stats Section */}
          <section className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl text-center">
              <span className="block text-2xl font-black text-white">{totalMinutes}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Minutes Read</span>
            </div>
            <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl text-center">
              <span className="block text-2xl font-black text-white">{finishedBooks.length}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Books Completed</span>
            </div>
            <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl text-center">
              <span className="block text-2xl font-black text-orange-400">🔥 {streak?.current_streak}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Current Streak</span>
            </div>
            <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl text-center">
              <span className="block text-2xl font-black text-purple-400">⭐ {streak?.longest_streak}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Longest Streak</span>
            </div>
          </section>

          {/* Bookshelf Visual Metaphor */}
          <section className="bg-slate-900/30 border border-slate-900 p-5 rounded-3xl relative overflow-hidden">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Completed Bookshelf</h3>

            {/* Bookshelf frame */}
            <div className="relative border-b-8 border-amber-950 pb-0.5 pt-12 px-4 flex items-end justify-center min-h-[140px] bg-slate-950/40 rounded-2xl gap-1">
              
              {finishedBooks.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-xs text-slate-600 font-bold leading-normal">
                  Your bookshelf is empty. Complete manual books or paths to populate spines!
                </div>
              ) : (
                finishedBooks.map((book, idx) => {
                  const spineColor = SPINE_COLORS[idx % SPINE_COLORS.length];
                  return (
                    <div
                      key={book.id}
                      className={`w-7 hover:w-8 hover:-translate-y-2 transition-all duration-300 rounded-t-md bg-gradient-to-t ${spineColor} border-t-2 border-x flex flex-col justify-end items-center py-2 shadow-md relative group cursor-help`}
                      style={{ height: `${80 + (idx % 3) * 12}px` }}
                      title={`${book.title} by ${book.author}`}
                    >
                      {/* Vertical text spine */}
                      <span
                        className="text-[9px] font-black text-white/80 whitespace-nowrap overflow-hidden text-ellipsis tracking-wide select-none"
                        style={{
                          writingMode: 'vertical-rl',
                          textOrientation: 'mixed',
                          transform: 'rotate(180deg)',
                        }}
                      >
                        {book.title}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Badges System */}
          <section>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Achievements</h3>
            <div className="grid grid-cols-3 gap-3">
              {ALL_POSSIBLE_BADGES.map((item) => {
                const earned = badges.some((b) => b.badge_type === item.id);
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center space-y-1 transition duration-300 ${
                      earned
                        ? `bg-gradient-to-b ${item.color}/10 border-${item.id === 'first_step' ? 'emerald-500/20' : item.id === 'streak_7' ? 'orange-500/20' : 'slate-800'}`
                        : 'bg-slate-900/10 border-slate-900/60 opacity-40'
                    }`}
                  >
                    <span className="text-2xl select-none">{item.icon}</span>
                    <h4 className="text-[10px] font-black text-white leading-tight">{item.name}</h4>
                    <p className="text-[8px] text-slate-500 font-bold leading-tight">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Reflection Feed */}
          <section>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Reflections Log</h3>
            {reflections.length === 0 ? (
              <div className="p-6 text-center bg-slate-900/20 border border-slate-900 rounded-2xl text-slate-600 font-bold text-xs">
                No reflection notes saved yet.
              </div>
            ) : (
              <div className="space-y-4">
                {reflections.map((ref) => (
                  <div key={ref.id} className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                      <span>{new Date(ref.created_at).toLocaleDateString()}</span>
                      <span className="uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded-full">
                        {ref.type === 'text' ? '✍️ Text' : '🎙️ Voice Note'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 italic">
                      "{ref.content || 'Voice Note Recording (Playback Mocked)'}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Bottom spacer nav */}
      <BottomNav />
    </div>
  );
};
export default Profile;
