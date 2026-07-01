import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { UserBook } from '../lib/db';
import type { SeedStory } from '../data/stories';
import { Confetti } from '../components/Confetti';

const EMOJI_FEELINGS = [
  { emoji: '💡', label: 'Inspired' },
  { emoji: '🧠', label: 'Intrigued' },
  { emoji: '🤔', label: 'Challenged' },
  { emoji: '🧘', label: 'Calm' },
  { emoji: '🔥', label: 'Motivated' }
];

export const Reader: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { xp, completeSession, refreshStats } = useGame();

  const storyId = searchParams.get('storyId');
  const bookId = searchParams.get('bookId');

  const [story, setStory] = useState<SeedStory | null>(null);
  const [book, setBook] = useState<UserBook | null>(null);
  const [loading, setLoading] = useState(true);

  // Settings
  const [fontSize, setFontSize] = useState<number>(18); // px
  const [theme, setTheme] = useState<'dark' | 'light' | 'sepia'>('dark');

  // Session timer
  const [seconds, setSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // Completion modal flow
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [sessionResults, setSessionResults] = useState<any | null>(null);

  // Reflection states
  const [reflectionStep, setReflectionStep] = useState<'welcome' | 'text' | 'voice' | 'success' | 'done'>('welcome');
  const [reflectionText, setReflectionText] = useState('');
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceRecorded, setVoiceRecorded] = useState(false);

  // Local storage cache for last read story
  useEffect(() => {
    if (storyId) {
      localStorage.setItem('bookster_last_story_id', storyId);
    }
  }, [storyId]);

  useEffect(() => {
    const loadContent = async () => {
      try {
        if (storyId) {
          const stories = await db.getContentPieces();
          const matched = stories.find((s) => s.id === storyId);
          if (matched) setStory(matched);
        } else if (bookId && user) {
          const books = await db.getUserBooks(user.id);
          const matched = books.find((b) => b.id === bookId);
          if (matched) setBook(matched);
        }
      } catch (e) {
        console.error('Failed to load reader content:', e);
      } finally {
        setLoading(false);
      }
    };

    loadContent();

    // Start timer
    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [storyId, bookId, user]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  const handleFinishSession = async () => {
    // Stop the timer
    if (timerRef.current) clearInterval(timerRef.current);

    setSavingSession(true);
    setShowCompletionModal(true);

    try {
      // Minimum duration is 1 minute for rewards, otherwise round up
      const durationMinutes = Math.max(1, Math.ceil(seconds / 60));

      const results = await completeSession(durationMinutes, story?.id, book?.id);
      setSessionResults({ ...results, durationMinutes });

      // If we read a book, let's increment its progress percent locally
      if (book && user) {
        const currentProgress = book.progress_percent;
        // Increase progress slightly (simulating reading pages)
        const addedProgress = Math.min(100, currentProgress + 5);
        await db.updateUserBookProgress(user.id, book.id, addedProgress);
      }

      setSavingSession(false);
    } catch (e) {
      console.error('Failed to complete reading session:', e);
      setSavingSession(false);
    }
  };

  const handleSaveReflection = async (type: 'text' | 'voice' | 'skip') => {
    if (!user || !sessionResults) return;

    try {
      const content = type === 'text' ? reflectionText : type === 'voice' ? 'Voice Note Recording (Placeholder)' : '';
      
      // Simulate adding reflection
      // First, get the reading sessions to link to the last one
      const sessions = await db.getReadingSessions(user.id);
      if (sessions.length > 0) {
        await db.addReflection(user.id, sessions[0].id, type, content);
      }

      if (type !== 'skip') {
        // Award Reflection Bonus XP (+15 XP)
        await db.addXP(user.id, 15, 'reflection');
        await refreshStats();
        setReflectionStep('success');
        return;
      }
    } catch (e) {
      console.error('Failed to save reflection:', e);
    }

    handleFinishNavigation();
  };

  const handleFinishNavigation = () => {
    if (!sessionResults) {
      navigate('/');
      return;
    }

    // Check if the user reached a level-up or streak milestone to trigger milestone celebration!
    const isStreakMilestone =
      sessionResults.streakIncremented &&
      (sessionResults.currentStreak === 7 ||
        sessionResults.currentStreak === 30 ||
        sessionResults.currentStreak === 100);

    const isBookCompleted = book && book.progress_percent >= 100;

    if (isStreakMilestone || isBookCompleted) {
      navigate('/milestone');
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-bold">
        Loading clean reader view...
      </div>
    );
  }

  if (!story && !book) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-xl font-bold">Content Not Found</h2>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-orange-500 rounded-xl font-bold text-white">
          Back Home
        </button>
      </div>
    );
  }

  const themeClasses = {
    dark: 'bg-slate-950 text-slate-100',
    light: 'bg-slate-50 text-slate-900',
    sepia: 'bg-orange-50 text-amber-950',
  };

  return (
    <div className={`min-h-screen ${themeClasses[theme]} transition-colors duration-300 pb-36 relative`}>
      {/* Top Header Options */}
      <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-30 bg-inherit border-b border-current/10">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-full hover:bg-current/10 transition cursor-pointer"
        >
          ✕
        </button>

        {/* Live Timer Counter */}
        <div className="flex items-center gap-2 px-3 py-1 bg-current/5 border border-current/10 rounded-full font-mono text-sm font-bold">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span>{formatTime(seconds)}</span>
        </div>

        {/* Appearance Drawer Controls */}
        <div className="flex items-center gap-2">
          {/* Theme Select */}
          <button
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : t === 'light' ? 'sepia' : 'dark'))}
            className="p-2 rounded-full hover:bg-current/10 transition cursor-pointer text-lg"
          >
            {theme === 'dark' ? '☀️' : theme === 'light' ? '🍂' : '🌙'}
          </button>

          {/* Font Controls */}
          <div className="flex items-center gap-1 bg-current/5 border border-current/10 rounded-full px-1">
            <button
              onClick={() => setFontSize((s) => Math.max(14, s - 2))}
              className="px-2 py-1 font-bold text-sm hover:text-orange-500"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize((s) => Math.min(28, s + 2))}
              className="px-2 py-1 font-bold text-sm hover:text-orange-500"
            >
              A+
            </button>
          </div>
        </div>
      </header>

      {/* Reader Body Text Container */}
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="text-center mb-8 border-b border-current/10 pb-6">
          <h1 className="text-3xl font-black mb-2">{story ? story.title : book?.title}</h1>
          <p className="text-current/60 text-sm">by {story ? story.author : book?.author}</p>
        </div>

        {/* Scaled Text Area */}
        <article
          className="leading-relaxed whitespace-pre-wrap select-text font-serif focus:outline-none"
          style={{ fontSize: `${fontSize}px` }}
        >
          {story
            ? story.body_text
            : `Reading Log session for "${book?.title}".\n\nCarry on reading from your physical book, eReader, or Kindle. The Bookster timer will run in the background to log your daily goal active progress and award you points.\n\nTips for building habit:\n- Focus entirely on comprehension.\n- Put away distraction devices.\n- Try to read at least 5-10 pages today.`}
        </article>
      </main>

      {/* Bottom Finish Sticky Panel */}
      <footer className="fixed bottom-0 left-0 right-0 py-6 px-6 bg-inherit border-t border-current/10 max-w-md mx-auto z-20">
        <button
          onClick={handleFinishSession}
          className="w-full py-4 bg-orange-500 hover:bg-orange-400 active:bg-orange-600 transition font-black rounded-2xl text-white shadow-xl text-center cursor-pointer"
        >
          Finish Reading Session
        </button>
      </footer>

      {/* Completion & Reflection Modal Dialog */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6 select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-center relative overflow-hidden space-y-6">
            
            {/* Confetti effect when user finishes */}
            {!savingSession && <Confetti />}

            {savingSession ? (
              <div className="py-12 space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin mx-auto" />
                <p className="text-slate-400 font-bold">Saving session metrics...</p>
              </div>
            ) : (
              <>
                {/* Reflection Screen 1: Welcome / XP & Streak Gained */}
                {reflectionStep === 'welcome' && (
                  <div className="space-y-6">
                    <div className="w-16 h-16 bg-gradient-to-tr from-orange-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-xl shadow-orange-500/10">
                      ⚡
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-2xl font-black text-white">Session Complete!</h2>
                      <p className="text-slate-400 text-sm">
                        You read for <span className="text-white font-bold">{sessionResults?.durationMinutes} mins</span> today.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-2xl">
                        <span className="block text-xl font-bold text-purple-400">+{sessionResults?.xpGained}</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">XP Earned</span>
                      </div>
                      <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-2xl">
                        <span className="block text-xl font-bold text-orange-400">🔥 +1</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Streak Days</span>
                      </div>
                    </div>

                    {/* Reflection XP callout */}
                    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-orange-500/20 rounded-2xl p-4 text-center space-y-1">
                      <span className="text-orange-400 font-black text-xs uppercase tracking-wider block">⚡ Reflection Bonus Active</span>
                      <span className="text-[11px] text-slate-300 font-semibold block">Reflect on today's reading to lock in learnings & claim +15 bonus XP!</span>
                    </div>

                    {/* Quick Emojis selector */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-left pl-1">How did today's reading feel?</p>
                      <div className="flex gap-2">
                        {EMOJI_FEELINGS.map((feel) => (
                          <button
                            key={feel.label}
                            onClick={() => {
                              setReflectionText(`${feel.emoji} Feeling ${feel.label}: `);
                              setReflectionStep('text');
                            }}
                            className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-orange-500/50 hover:scale-105 active:scale-95 transition rounded-2xl text-xl flex flex-col items-center justify-center gap-1 cursor-pointer"
                            title={feel.label}
                          >
                            <span>{feel.emoji}</span>
                            <span className="text-[8px] text-slate-500 font-bold tracking-wide uppercase leading-none">{feel.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {sessionResults?.newLevelReached && (
                      <div className="p-3 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold rounded-xl">
                        🎉 Level Up! You reached level {1 + Math.floor(xp / 100)}!
                      </div>
                    )}

                    {sessionResults?.unlockedBadges?.length > 0 && (
                      <div className="p-3 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold rounded-xl">
                        🏆 Badge Unlocked: {sessionResults.unlockedBadges.join(', ')}!
                      </div>
                    )}

                    <div className="space-y-3 pt-2">
                      <button
                        onClick={() => setReflectionStep('text')}
                        className="w-full py-4 bg-gradient-to-tr from-orange-500 via-rose-500 to-indigo-600 hover:opacity-95 transition font-black rounded-2xl text-white shadow-xl shadow-orange-500/10 cursor-pointer flex items-center justify-center gap-2"
                      >
                        ✍️ Type Reflection (+15 XP ⚡)
                      </button>
                      <div className="pt-2">
                        <button
                          onClick={() => handleSaveReflection('skip')}
                          className="text-xs text-slate-600 hover:text-slate-500 transition cursor-pointer hover:underline"
                        >
                          Skip Reflection (Forfeit +15 XP Bonus)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reflection Screen 2: Text prompt */}
                {reflectionStep === 'text' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-xl font-black text-white">What's one thing that stood out today?</h3>
                      <p className="text-orange-400 font-bold text-xs mt-1">✨ +15 XP reflection bonus will be added</p>
                    </div>
                    <textarea
                      rows={4}
                      value={reflectionText}
                      onChange={(e) => setReflectionText(e.target.value)}
                      placeholder="Write a quick reflection or select an emoji above..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 text-slate-100 rounded-2xl p-4 outline-none text-sm resize-none"
                    />

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setReflectionStep('voice')}
                        className="px-4 py-3.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 font-bold rounded-2xl flex items-center justify-center cursor-pointer"
                        title="Switch to Voice note"
                      >
                        🎙️
                      </button>
                      <button
                        onClick={() => handleSaveReflection('text')}
                        className="flex-1 py-3.5 bg-orange-500 hover:bg-orange-400 transition font-black rounded-2xl text-white cursor-pointer"
                      >
                        Save & Claim +15 XP ⚡
                      </button>
                    </div>
                    <button
                      onClick={() => handleSaveReflection('skip')}
                      className="w-full text-center text-xs text-slate-600 font-bold py-1 hover:text-slate-500 cursor-pointer"
                    >
                      Cancel and forfeit bonus XP
                    </button>
                  </div>
                )}

                {/* Reflection Screen 3: Voice Note Stub */}
                {reflectionStep === 'voice' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-xl font-black text-white">Record a voice reflection</h3>
                      <p className="text-orange-400 font-bold text-xs mt-1">✨ +15 XP reflection bonus will be added</p>
                    </div>

                    <div className="py-8 flex flex-col items-center justify-center">
                      {voiceRecording ? (
                        <div className="space-y-4 text-center">
                          {/* Animated wave */}
                          <div className="flex items-center gap-1 justify-center h-10">
                            <span className="w-1.5 h-6 bg-red-500 rounded-full animate-bounce delay-75" />
                            <span className="w-1.5 h-10 bg-red-500 rounded-full animate-bounce" />
                            <span className="w-1.5 h-8 bg-red-500 rounded-full animate-bounce delay-150" />
                            <span className="w-1.5 h-4 bg-red-500 rounded-full animate-bounce" />
                          </div>
                          <button
                            onClick={() => {
                              setVoiceRecording(false);
                              setVoiceRecorded(true);
                            }}
                            className="px-4 py-2 bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30 rounded-xl"
                          >
                            Stop Recording
                          </button>
                        </div>
                      ) : voiceRecorded ? (
                        <div className="space-y-2">
                          <span className="text-4xl">🎙️✅</span>
                          <p className="text-xs text-slate-500 font-bold">12s recorded</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => setVoiceRecording(true)}
                          className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center text-3xl shadow-xl shadow-red-500/20 cursor-pointer text-white"
                        >
                          🎙️
                        </button>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => setReflectionStep('text')}
                        className="px-4 py-3.5 bg-slate-950 border border-slate-800 text-slate-400 font-bold rounded-2xl cursor-pointer"
                      >
                        Keyboard
                      </button>
                      <button
                        onClick={() => handleSaveReflection('voice')}
                        disabled={!voiceRecorded}
                        className="flex-1 py-3.5 bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-400 transition font-black rounded-2xl text-white cursor-pointer"
                      >
                        Save & Claim +15 XP ⚡
                      </button>
                    </div>
                    <button
                      onClick={() => handleSaveReflection('skip')}
                      className="w-full text-center text-xs text-slate-600 font-bold py-1 hover:text-slate-500 cursor-pointer"
                    >
                      Cancel and forfeit bonus XP
                    </button>
                  </div>
                )}

                {/* Reflection Screen 4: Success state */}
                {reflectionStep === 'success' && (
                  <div className="space-y-6 py-4">
                    <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 via-orange-500 to-yellow-300 rounded-full flex items-center justify-center mx-auto text-4xl shadow-xl shadow-orange-500/20 animate-bounce">
                      🌟
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-white">Reflection Saved!</h3>
                      <p className="text-slate-400 text-sm leading-relaxed px-4">
                        Learnings locked in. You claimed your <span className="text-orange-400 font-black">+15 XP Reflection Bonus!</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleFinishNavigation()}
                      className="w-full py-4 bg-white text-slate-950 hover:bg-slate-900 active:bg-slate-200 transition font-black rounded-2xl shadow-lg cursor-pointer"
                    >
                      Awesome!
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default Reader;
