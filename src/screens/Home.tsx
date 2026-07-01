import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { db } from '../lib/db';
import type { UserBook } from '../lib/db';
import type { SeedStory } from '../data/stories';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 px-6 pt-6 max-w-md mx-auto relative select-none">
      {/* Top Banner Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xl">
            📖
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Level {level}</h2>
            <h1 className="font-extrabold text-white text-base tracking-tight leading-none">
              {profile?.display_name || 'Reader'}
            </h1>
          </div>
        </div>

        {/* Stats Indicator */}
        <div className="flex items-center gap-4">
          {/* XP */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl text-sm font-black">
            ⚡ <span>{xp} XP</span>
          </div>

          {/* Streak Flame */}
          <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-xl text-sm font-black animate-pulse">
            🔥 <span>{streak?.current_streak || 0}</span>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20 text-slate-500 font-bold">
          Loading library dashboard...
        </div>
      ) : (
        <div className="space-y-8">
          {/* Daily Goal Card */}
          <section className="bg-slate-900/60 border border-slate-900 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="text-xs font-black text-orange-500 uppercase tracking-widest mb-1">Daily Habit</h2>
                <h3 className="text-lg font-extrabold text-white">Daily Reading Target</h3>
              </div>
              <span className="text-2xl">⏳</span>
            </div>

            {/* Progress ring/bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline text-sm">
                <span className="font-bold text-slate-300">
                  {dailyActiveMinutes} <span className="text-xs text-slate-500">/ {dailyGoalMinutes} mins</span>
                </span>
                <span className="font-bold text-orange-400 text-xs">{goalProgressPercent}%</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800/40">
                <div
                  className="bg-gradient-to-r from-orange-500 to-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${goalProgressPercent}%` }}
                />
              </div>
            </div>
            {goalProgressPercent >= 100 && (
              <div className="mt-3 text-xs text-emerald-400 font-bold flex items-center gap-1">
                🎉 Daily goal completed! +50 XP Active
              </div>
            )}
          </section>

          {/* Core loop Resume Card */}
          <section className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
            <h2 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-4">Continue Reading</h2>

            {activeBook || activeStory ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-black text-white truncate">
                    {activeBook ? activeBook.title : activeStory?.title}
                  </h3>
                  <p className="text-slate-400 text-sm truncate">
                    by {activeBook ? activeBook.author : activeStory?.author}
                  </p>
                </div>

                {activeBook && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Book Progress</span>
                      <span className="text-white font-bold">{activeBook.progress_percent}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full"
                        style={{ width: `${activeBook.progress_percent}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleResumeStory}
                  className="w-full py-3.5 mt-2 bg-gradient-to-tr from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 active:from-orange-600 active:to-rose-600 transition font-black rounded-2xl text-white shadow-xl shadow-orange-500/10 cursor-pointer text-center"
                >
                  Resume Session
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                      Today's Pick
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {todaysPick?.estimated_minutes} min read
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white truncate">{todaysPick?.title}</h3>
                  <p className="text-slate-400 text-sm truncate">by {todaysPick?.author}</p>
                </div>

                <button
                  onClick={handleResumeStory}
                  className="w-full py-3.5 bg-gradient-to-tr from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 transition font-black rounded-2xl text-white shadow-xl shadow-orange-500/10 cursor-pointer text-center"
                >
                  Start Reading
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
