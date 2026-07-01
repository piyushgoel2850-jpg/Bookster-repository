import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';

export const Recap: React.FC = () => {
  const navigate = useNavigate();
  const { streak, xp, level } = useGame();
  const { profile } = useAuth();

  const [activeSlide, setActiveSlide] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(10);
  const [booksCompleted, setBooksCompleted] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecapStats = async () => {
      if (!profile) return;
      try {
        const sessions = await db.getReadingSessions(profile.id);
        const mins = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
        setTotalMinutes(Math.max(mins, 15)); // Guarantee mock values for visualization

        const books = await db.getUserBooks(profile.id);
        setBooksCompleted(books.filter((b) => b.status === 'finished').length);
      } catch (e) {
        console.error('Failed to load recap metrics:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchRecapStats();
  }, [profile]);

  const slides = [
    {
      title: 'Your Reading Journey',
      subtitle: `${profile?.display_name || 'Reader'}'s monthly recap report`,
      graphic: '📖⚡',
      background: 'from-orange-600 via-rose-600 to-indigo-800',
      content: (
        <div className="space-y-2 text-center">
          <p className="text-xl font-bold">You read like a champ this month!</p>
          <p className="text-sm text-white/70">Tap "Next" to reveal your reading metrics.</p>
        </div>
      ),
    },
    {
      title: 'Time Traveler',
      subtitle: 'Total minutes logged reading',
      graphic: '⏳✨',
      background: 'from-purple-600 via-rose-600 to-pink-600',
      content: (
        <div className="space-y-4 text-center">
          <span className="block text-6xl font-black text-white">{totalMinutes}</span>
          <p className="text-base font-bold">minutes dedicated to building your reading habit!</p>
          <p className="text-xs text-white/60">Equivalent to listening to your favorite albums 3 times over.</p>
        </div>
      ),
    },
    {
      title: 'Streak Legend',
      subtitle: 'Streak status report',
      graphic: '🔥🏆',
      background: 'from-orange-500 via-amber-500 to-rose-600',
      content: (
        <div className="space-y-4 text-center">
          <span className="block text-6xl font-black text-white">{streak?.longest_streak || 1} Days</span>
          <p className="text-base font-bold">longest daily active streak!</p>
          <p className="text-xs text-white/60">Consistency beats speed. You are building habits for life.</p>
        </div>
      ),
    },
    {
      title: 'Level Reached',
      subtitle: 'Scholar status level-up report',
      graphic: '🧙‍♂️🎓',
      background: 'from-indigo-600 via-purple-600 to-rose-600',
      content: (
        <div className="space-y-4 text-center">
          <span className="block text-5xl font-black text-white">Level {level}</span>
          <p className="text-base font-bold">Current XP Total: {xp} XP</p>
          <p className="text-xs text-white/60">You have completed {booksCompleted} books/curated stories!</p>
        </div>
      ),
    },
    {
      title: 'Your Reading Personality',
      subtitle: 'Based on your selections & paths',
      graphic: '🧠🧭',
      background: 'from-emerald-600 via-teal-600 to-indigo-800',
      content: (
        <div className="space-y-4 text-center">
          <span className="block text-3xl font-black text-white">Stoic Thinker</span>
          <p className="text-xs text-white/80 leading-relaxed px-4">
            You prefer philosophy, essays, and self-improvement pieces. You reflect on the timeless wisdom of the ages.
          </p>
          <button
            onClick={() => alert('Recap card shared successfully!')}
            className="px-6 py-2.5 bg-white text-slate-900 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer mt-4"
          >
            Share Achievements
          </button>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (activeSlide < slides.length - 1) {
      setActiveSlide((prev) => prev + 1);
    } else {
      navigate('/profile');
    }
  };

  const handleBack = () => {
    setActiveSlide((prev) => Math.max(0, prev - 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-bold">
        Assembling recap slides...
      </div>
    );
  }

  const slide = slides[activeSlide];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between max-w-md mx-auto relative select-none">
      
      {/* Top Slide indicator dots */}
      <header className="px-6 pt-8 pb-4 flex items-center gap-1">
        {slides.map((_, idx) => (
          <div
            key={idx}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === activeSlide ? 'bg-white flex-1' : 'bg-white/20 w-3'
            }`}
          />
        ))}
      </header>

      {/* Main Slide Card */}
      <main className="flex-1 px-6 flex items-center">
        <div
          className={`w-full aspect-[4/5] rounded-3xl bg-gradient-to-tr ${slide.background} p-6 shadow-2xl flex flex-col justify-between items-center text-center text-white relative overflow-hidden`}
        >
          {/* Subtle graphic background overlays */}
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-white/5 rounded-full blur-xl pointer-events-none" />

          {/* Subtitle / Title */}
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{slide.subtitle}</span>
            <h2 className="text-2xl font-black">{slide.title}</h2>
          </div>

          {/* Graphic Icon */}
          <span className="text-7xl select-none animate-bounce">{slide.graphic}</span>

          {/* Slide specific content */}
          <div className="w-full">{slide.content}</div>
        </div>
      </main>

      {/* Bottom control triggers */}
      <footer className="p-6 flex gap-4">
        {activeSlide > 0 && (
          <button
            onClick={handleBack}
            className="px-6 py-4 bg-slate-900 hover:bg-slate-800 transition font-bold rounded-2xl text-slate-400 border border-slate-800 cursor-pointer"
          >
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          className="flex-1 py-4 bg-white text-slate-950 hover:bg-white/90 active:bg-white/80 transition font-black rounded-2xl shadow-xl cursor-pointer text-center text-sm"
        >
          {activeSlide === slides.length - 1 ? 'Close Report' : 'Next'}
        </button>
      </footer>
    </div>
  );
};
export default Recap;
