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
    <div className="min-h-screen bg-[#120f0d] text-[#faf6ee] pb-28 px-6 pt-6 max-w-md mx-auto relative overflow-hidden select-none">
      {/* Background Sunset Candle Glows */}
      <div className="absolute top-10 left-[-40px] w-56 h-56 bg-[#d35d3b]/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-1/2 right-[-40px] w-56 h-56 bg-[#f9d382]/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Header Settings Cog */}
      <header className="flex items-center justify-between mb-8 relative z-10 border-b border-[#FAF6EE]/10 pb-4">
        <h1 className="text-xl font-extrabold font-serif text-white tracking-tight">The Study Room</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/settings')}
            className="px-3 py-2 rounded-xl bg-[#FAF6EE]/5 border border-[#FAF6EE]/15 hover:border-[#d35d3b] transition cursor-pointer text-xs font-black"
            title="Settings"
          >
            ⚙️ Settings
          </button>
          <button
            onClick={() => {
              if (confirm('Log out of Bookster?')) {
                signOut().then(() => navigate('/onboarding'));
              }
            }}
            className="px-3 py-2 rounded-xl bg-[#d35d3b]/15 border border-[#d35d3b]/30 text-xs font-bold text-[#d35d3b] hover:bg-[#d35d3b]/25 cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#FAF6EE]/60 font-bold">
          ✍️ Reading your reading log profile...
        </div>
      ) : (
        <div className="space-y-8 relative z-10">
          
          {/* User Bio Card */}
          <div className="text-center space-y-2">
            <div className="w-20 h-20 rounded-3xl bg-[#faf6ee] border-2 border-[#d35d3b] flex items-center justify-center text-4xl mx-auto shadow-xl">
              🦊
            </div>
            <h2 className="text-xl font-black font-serif text-white">{profile?.display_name || 'Reader'}</h2>
            <p className="text-[10px] font-black text-[#f09f80] uppercase tracking-widest">
              Level {level} Scholar • {xp % 100}/100 XP
            </p>
          </div>

          {/* Stats Section: Parchment Card block grid */}
          <section className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#faf6ee] text-[#2c2724] border border-[#FAF6EE]/20 rounded-3xl text-center interactive-card glow-card">
              <span className="block text-2xl font-black font-serif text-[#d35d3b]">{totalMinutes}</span>
              <span className="text-[9px] text-[#2c2724]/60 font-black uppercase tracking-widest">Minutes Read</span>
            </div>
            <div className="p-4 bg-[#faf6ee] text-[#2c2724] border border-[#FAF6EE]/20 rounded-3xl text-center interactive-card glow-card">
              <span className="block text-2xl font-black font-serif text-[#d35d3b]">{finishedBooks.length}</span>
              <span className="text-[9px] text-[#2c2724]/60 font-black uppercase tracking-widest">Completed</span>
            </div>
            <div className="p-4 bg-[#faf6ee] text-[#2c2724] border border-[#FAF6EE]/20 rounded-3xl text-center interactive-card glow-card">
              <span className="block text-2xl font-black font-serif text-[#d35d3b]">🔥 {streak?.current_streak}</span>
              <span className="text-[9px] text-[#2c2724]/60 font-black uppercase tracking-widest">Active Streak</span>
            </div>
            <div className="p-4 bg-[#faf6ee] text-[#2c2724] border border-[#FAF6EE]/20 rounded-3xl text-center interactive-card glow-card">
              <span className="block text-2xl font-black font-serif text-[#d35d3b]">⭐ {streak?.longest_streak}</span>
              <span className="text-[9px] text-[#2c2724]/60 font-black uppercase tracking-widest">Record Streak</span>
            </div>
          </section>

          {/* Bookshelf Visual Metaphor */}
          <section className="bg-[#1e1a18]/60 border border-[#FAF6EE]/15 p-5 rounded-3xl relative overflow-hidden">
            <h3 className="text-[10px] font-black text-[#f09f80] uppercase tracking-widest mb-4">Antique Bookcase</h3>

            {/* Bookshelf frame */}
            <div className="relative border-b-8 border-[#3c2a21] pb-0.5 pt-12 px-4 flex items-end justify-center min-h-[140px] bg-[#120f0d]/60 rounded-2xl gap-1.5">
              
              {finishedBooks.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-xs text-[#FAF6EE]/40 font-bold leading-normal">
                  Your bookcase is empty. Complete books or paths to populate spines!
                </div>
              ) : (
                finishedBooks.map((book, idx) => {
                  const spineColor = SPINE_COLORS[idx % SPINE_COLORS.length];
                  return (
                    <div
                      key={book.id}
                      className={`w-7 hover:w-9 hover:-translate-y-3 hover:scale-105 transition-all duration-300 rounded-t-md bg-gradient-to-t ${spineColor} border-t-2 border-x flex flex-col justify-end items-center py-2 shadow-lg relative group cursor-help`}
                      style={{ height: `${80 + (idx % 3) * 12}px` }}
                    >
                      {/* Interactive Tooltip Card: Ghibli ticket note */}
                      <div className="absolute bottom-full mb-3 hidden group-hover:flex flex-col bg-[#faf6ee] text-[#2c2724] border-2 border-[#d35d3b] p-2.5 rounded-2xl text-left w-36 shadow-2xl z-30 pointer-events-none select-none">
                        <span className="text-[10px] font-black font-serif text-[#2c2724] leading-tight truncate block">{book.title}</span>
                        <span className="text-[9px] text-[#2c2724]/60 font-bold leading-normal truncate block">by {book.author}</span>
                        <span className="text-[8px] text-[#d35d3b] font-black uppercase tracking-wider mt-1.5 block">🏆 Finished</span>
                      </div>

                      {/* Vertical text spine */}
                      <span
                        className="text-[9px] font-black text-white/85 whitespace-nowrap overflow-hidden text-ellipsis tracking-wide select-none"
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
            <h3 className="text-[10px] font-black text-[#f09f80] uppercase tracking-widest mb-4">Medallions & Badges</h3>
            <div className="grid grid-cols-3 gap-3">
              {ALL_POSSIBLE_BADGES.map((item) => {
                const earned = badges.some((b) => b.badge_type === item.id);
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center space-y-1 transition duration-300 ${
                      earned
                        ? `bg-[#faf6ee] text-[#2c2724] border-[#d35d3b]/30 shadow-md interactive-card`
                        : 'bg-[#1e1a18]/60 border-[#FAF6EE]/5 opacity-30'
                    }`}
                  >
                    <span className="text-2xl select-none">{item.icon}</span>
                    <h4 className="text-[10px] font-black font-serif text-current leading-tight">{item.name}</h4>
                    <p className="text-[8px] text-current/60 font-semibold leading-tight">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Reflection Feed */}
          <section>
            <h3 className="text-[10px] font-black text-[#f09f80] uppercase tracking-widest mb-4">Study reflections Log</h3>
            {reflections.length === 0 ? (
              <div className="p-6 text-center bg-[#1e1a18]/60 border border-[#FAF6EE]/10 rounded-3xl text-[#FAF6EE]/40 font-bold text-xs">
                No reflection notes saved yet.
              </div>
            ) : (
              <div className="space-y-4 text-left">
                {reflections.map((ref) => (
                  <div key={ref.id} className="p-4 bg-[#faf5ea] text-[#2c2724] border border-[#d35d3b]/20 rounded-3xl space-y-2 relative shadow-md">
                    {/* Top border decor */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#d35d3b] rounded-t-3xl" />
                    
                    <div className="flex items-center justify-between text-[8px] font-black text-[#2c2724]/50">
                      <span>{new Date(ref.created_at).toLocaleDateString()}</span>
                      <span className="uppercase tracking-widest bg-[#2c2724]/5 text-[#d35d3b] px-2 py-0.5 rounded-full border border-[#d35d3b]/10">
                        {ref.type === 'text' ? '✍️ Notes' : ref.type === 'voice' ? '🎙️ Voice' : '🎥 Video'}
                      </span>
                    </div>
                    <p className="text-xs text-[#2c2724]/85 italic font-medium font-serif leading-relaxed">
                      "{ref.content || 'Voice summary clip saved'}"
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
