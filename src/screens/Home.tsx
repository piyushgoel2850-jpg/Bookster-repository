import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { db } from '../lib/db';
import type { UserBook } from '../lib/db';
import type { SeedStory } from '../data/stories';
import { BottomNav } from '../components/BottomNav';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { streak, xp, level, dailyActiveMinutes } = useGame();

  const [activeStory, setActiveStory] = useState<SeedStory | null>(null);
  const [activeBook, setActiveBook] = useState<UserBook | null>(null);
  const [todaysPick, setTodaysPick] = useState<SeedStory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeContent = async () => {
      try {
        const stories = await db.getContentPieces();
        // Seed today's pick as the first story
        if (stories.length > 0) {
          setTodaysPick(stories[0]);
        }

        // Fetch user's books to see if any are in progress
        if (profile) {
          const books = await db.getUserBooks(profile.id);
          const inProgress = books.find((b) => b.status === 'reading');
          if (inProgress) {
            setActiveBook(inProgress);
          } else {
            // Fall back to a story in progress
            const lastSessionStoryId = localStorage.getItem('bookster_last_story_id');
            if (lastSessionStoryId) {
              const matched = stories.find((s) => s.id === lastSessionStoryId);
              if (matched) setActiveStory(matched);
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch home content:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeContent();
  }, [profile]);

  const dailyGoalMinutes = profile?.daily_goal_minutes || 10;
  const goalProgressPercent = Math.min(Math.round((dailyActiveMinutes / dailyGoalMinutes) * 100), 100);

  const handleResumeStory = () => {
    if (activeBook) {
      navigate(`/reader?bookId=${activeBook.id}`);
    } else if (activeStory) {
      navigate(`/reader?storyId=${activeStory.id}`);
    } else if (todaysPick) {
      navigate(`/reader?storyId=${todaysPick.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#120f0d] text-[#faf6ee] pb-28 px-6 pt-6 max-w-md mx-auto relative overflow-hidden select-none">
      {/* Background Soft Sunset Candle Glows */}
      <div className="absolute top-10 left-[-40px] w-56 h-56 bg-[#d35d3b]/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-1/2 right-[-40px] w-56 h-56 bg-[#f9d382]/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Top Banner Header */}
      <header className="flex items-center justify-between mb-8 relative z-10 border-b border-[#FAF6EE]/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#faf6ee] border border-[#d35d3b] flex items-center justify-center text-xl shadow-md transform hover:rotate-12 transition">
            ☕
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <h2 className="text-[10px] font-black text-[#f09f80] uppercase tracking-widest">Cozy Reader</h2>
              <span className="text-[9px] text-[#f9d382] font-black">Level {level}</span>
            </div>
            <h1 className="font-extrabold font-serif text-white text-base leading-none tracking-tight">
              {profile?.display_name || 'Bookster'}
            </h1>
          </div>
        </div>

        {/* Stats Indicator */}
        <div className="flex items-center gap-2">
          {/* XP Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-[#FAF6EE]/5 border border-[#FAF6EE]/15 text-[#faf6ee] rounded-xl text-[10px] font-extrabold tracking-wide shadow-sm hover:border-[#d35d3b] transition cursor-pointer">
            ⚡ <span>{xp} XP</span>
          </div>

          {/* Streak Flame Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-[#d35d3b]/10 border border-[#d35d3b]/30 text-[#d35d3b] rounded-xl text-[10px] font-extrabold tracking-wide shadow-sm animate-pulse hover:scale-105 transition cursor-pointer">
            🔥 <span>{streak?.current_streak || 0}</span>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20 text-slate-500 font-bold">
          ✍️ Opening your study journal...
        </div>
      ) : (
        <div className="space-y-8 relative z-10">
          
          {/* Daily Goal Card: Study Desk layout */}
          <section className="bg-[#faf6ee] text-[#2c2724] border border-[#FAF6EE]/20 rounded-3xl p-5 shadow-2xl relative overflow-hidden interactive-card glow-card group cursor-pointer">
            {/* Top decorative header border */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#d35d3b]" />
            
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="text-[9px] font-black text-[#d35d3b] uppercase tracking-widest mb-1">Study Desk Beats</h2>
                <h3 className="text-base font-black font-serif tracking-tight">Reading Timer Target</h3>
              </div>
              
              {/* Spinning Record disc lofi simulator */}
              <div 
                className="w-10 h-10 rounded-full bg-[#2c2724] border-2 border-[#faf6ee] flex items-center justify-center text-sm shadow-md animate-spin-slow relative shrink-0 select-none"
                title="🎧 Playing cozy lo-fi vibes..."
              >
                💿
                <span className="absolute -top-1.5 -right-1.5 text-[8px] animate-bounce">🎶</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-baseline text-xs">
                <span className="font-bold text-[#2c2724]/80">
                  Logged: <span className="text-[#d35d3b] font-black">{dailyActiveMinutes}</span> / {dailyGoalMinutes} mins
                </span>
                <span className="font-black text-[#d35d3b]">{goalProgressPercent}%</span>
              </div>
              <div className="w-full bg-[#2c2724]/10 h-2.5 rounded-full overflow-hidden border border-[#2c2724]/5">
                <div
                  className="bg-[#d35d3b] h-full rounded-full transition-all duration-700"
                  style={{ width: `${goalProgressPercent}%` }}
                />
              </div>
            </div>
            
            {goalProgressPercent >= 100 && (
              <div className="mt-3 text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 animate-bounce">
                ✨ Goal Met! Lofi record vinyl complete! +50 XP
              </div>
            )}
          </section>

          {/* Core loop Resume Card: Vintage Library Card style */}
          <section className="bg-[#1e1a18]/80 border border-[#FAF6EE]/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden interactive-card glow-card group cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#d35d3b]/5 rounded-full blur-xl pointer-events-none" />
            
            {/* Library stamp card indicator */}
            <div className="flex justify-between items-center mb-4 border-b border-[#FAF6EE]/10 pb-2">
              <h2 className="text-[9px] font-black text-[#f09f80] uppercase tracking-widest">Library Ticket</h2>
              <span className="text-[8px] font-extrabold px-2 py-0.5 rounded-full bg-[#FAF6EE]/5 text-[#FAF6EE]/60 border border-[#FAF6EE]/10 uppercase">
                Active
              </span>
            </div>

            {activeBook || activeStory ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-black font-serif text-white truncate group-hover:text-[#f09f80] transition leading-snug">
                    {activeBook ? activeBook.title : activeStory?.title}
                  </h3>
                  <p className="text-[#f09f80]/80 text-xs italic mt-0.5">
                    by {activeBook ? activeBook.author : activeStory?.author}
                  </p>
                </div>

                {activeBook && (
                  <div className="space-y-1.5 bg-[#FAF6EE]/5 rounded-2xl p-3 border border-[#FAF6EE]/5">
                    <div className="flex justify-between text-[10px] text-[#FAF6EE]/60">
                      <span>Reading Progress</span>
                      <span className="text-white font-extrabold">{activeBook.progress_percent}%</span>
                    </div>
                    <div className="w-full bg-[#1e1a18] h-1.5 rounded-full overflow-hidden border border-[#FAF6EE]/10">
                      <div
                        className="bg-[#d35d3b] h-full rounded-full transition-all duration-300"
                        style={{ width: `${activeBook.progress_percent}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleResumeStory}
                  className="w-full py-3.5 mt-2 bg-[#d35d3b] hover:bg-[#d35d3b]/90 active:scale-[0.98] transition font-black rounded-2xl text-white shadow-xl shadow-[#d35d3b]/10 cursor-pointer text-center text-xs uppercase tracking-wider"
                >
                  📖 Pull off the shelf
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-[#d35d3b]/10 text-[#d35d3b] border border-[#d35d3b]/20 uppercase tracking-widest">
                      Sunlit Pick
                    </span>
                    <span className="text-[10px] text-[#FAF6EE]/60">
                      ⏱️ {todaysPick?.estimated_minutes} min read
                    </span>
                  </div>
                  <h3 className="text-xl font-black font-serif text-white truncate group-hover:text-[#f09f80] transition leading-snug">{todaysPick?.title}</h3>
                  <p className="text-[#f09f80]/80 text-xs italic mt-0.5">by {todaysPick?.author}</p>
                </div>

                <button
                  onClick={handleResumeStory}
                  className="w-full py-3.5 bg-[#d35d3b] hover:bg-[#d35d3b]/90 active:scale-[0.98] transition font-black rounded-2xl text-white shadow-xl shadow-[#d35d3b]/10 cursor-pointer text-center text-xs uppercase tracking-wider"
                >
                  📖 Begin Reading
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Bottom Navigation Menu */}
      <BottomNav />
    </div>
  );
};
