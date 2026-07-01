import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { UserBook, CoachMessage } from '../lib/db';
import type { SeedStory } from '../data/stories';
import { coachEngine } from '../lib/coachEngine';
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
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // Session timer
  const [seconds, setSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // Completion modal flow
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [sessionResults, setSessionResults] = useState<any | null>(null);

  // Reflection states
  const [reflectionStep, setReflectionStep] = useState<
    'welcome' | 'text' | 'voice' | 'success' | 'recap-welcome' | 'recap-quiz' | 'recap-done' | 'done'
  >('welcome');
  const [reflectionText, setReflectionText] = useState('');
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceRecorded, setVoiceRecorded] = useState(false);

  // Recap Quiz States
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answersCorrectCount, setAnswersCorrectCount] = useState(0);

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
      const sessions = await db.getReadingSessions(user.id);
      if (sessions.length > 0) {
        await db.addReflection(user.id, sessions[0].id, type, content);
      }

      if (type !== 'skip') {
        // Save the user's message to the Coach conversation log
        const userMsg: CoachMessage = {
          id: Math.random().toString(),
          user_id: user.id,
          book_id: book?.id || story?.id || null,
          sender: 'user',
          content: type === 'voice' ? `🎙️ [Voice Reflection]: ${content}` : `✍️ [Reflection]: ${content}`,
          created_at: new Date().toISOString()
        };
        await db.saveCoachMessage(userMsg);

        // Process with Reading Coach to award bonus XP (+10 XP) and get follow-up coach reply
        await coachEngine.processReflection(user.id, content, book?.id || story?.id || null);

        // Award Reflection Bonus XP (+15 XP)
        await db.addXP(user.id, 15, 'reflection');
        await refreshStats();
        setReflectionStep('success');
        return;
      }
    } catch (e) {
      console.error('Failed to save reflection:', e);
    }

    handleCheckRecapTransition();
  };

  const handleCheckRecapTransition = () => {
    if (story && story.recap_questions && story.recap_questions.length > 0) {
      setReflectionStep('recap-welcome');
    } else {
      handleFinishNavigation();
    }
  };

  const handleStartRecap = () => {
    setCurrentQuestionIdx(0);
    setSelectedOptionIdx(null);
    setShowFeedback(false);
    setAnswersCorrectCount(0);
    setReflectionStep('recap-quiz');
  };

  const handleSelectOption = (idx: number) => {
    if (showFeedback) return;
    setSelectedOptionIdx(idx);
    setShowFeedback(true);

    const questions = story?.recap_questions || [];
    const isCorrect = idx === questions[currentQuestionIdx].correct_index;
    if (isCorrect) {
      setAnswersCorrectCount((prev) => prev + 1);
    }

    setTimeout(() => {
      if (currentQuestionIdx < questions.length - 1) {
        setCurrentQuestionIdx((prev) => prev + 1);
        setSelectedOptionIdx(null);
        setShowFeedback(false);
      } else {
        // Finished all questions!
        handleCompleteRecap();
      }
    }, 1500);
  };

  const handleCompleteRecap = async () => {
    if (user) {
      // Award recap bonus XP (+10 XP)
      await db.addXP(user.id, 10, 'story-recap');
      await refreshStats();
    }
    setReflectionStep('recap-done');
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
    dark: 'bg-[#120f0d] text-[#FAF6EE]/80',
    light: 'bg-[#FAF6EE] text-[#2C2724]',
    sepia: 'bg-[#faf5ea] text-[#3c2f2f]',
  };

  return (
    <div className={`min-h-screen ${themeClasses[theme]} transition-colors duration-300 pb-36 relative select-none`}>
      {/* Top Header Options */}
      <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-30 bg-inherit border-b border-current/10">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-full hover:bg-current/10 transition cursor-pointer text-xs font-black"
        >
          ✕ CLOSE
        </button>

        {/* Live Timer Counter */}
        <div className="flex items-center gap-2 px-3 py-1 bg-current/5 border border-current/10 rounded-full font-mono text-sm font-black">
          <span className="w-2 h-2 rounded-full bg-[#d35d3b] animate-pulse" />
          <span>{formatTime(seconds)}</span>
        </div>

        {/* Aa Settings Toggle */}
        <button
          onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
          className="px-3.5 py-1.5 rounded-full hover:bg-current/10 transition border border-current/25 flex items-center gap-1.5 text-xs font-black tracking-wider uppercase cursor-pointer"
        >
          <span>Aa</span>
          <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${showSettingsDrawer ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </header>

      {/* Floating Display Settings Panel */}
      {showSettingsDrawer && (
        <div className="absolute top-16 left-6 right-6 bg-[#faf6ee] text-[#2c2724] border-2 border-[#d35d3b] p-5 rounded-3xl shadow-2xl z-40 space-y-4 select-none animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center pb-2 border-b border-[#2c2724]/10">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#d35d3b]">Reader Settings</span>
            <button
              onClick={() => setShowSettingsDrawer(false)}
              className="text-[#2c2724]/60 hover:text-[#d35d3b] text-xs font-black"
            >
              ✕
            </button>
          </div>

          {/* Theme Selector (Day / Night / Sepia) */}
          <div className="space-y-2">
            <span className="text-[9px] font-black text-[#2c2724]/60 uppercase tracking-widest block">Reading Theme</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`py-2.5 px-1 rounded-2xl text-[9px] font-black uppercase tracking-wider flex flex-col items-center justify-center gap-1 border cursor-pointer transition ${
                  theme === 'light'
                    ? 'bg-[#d35d3b] text-white border-[#d35d3b] shadow-md shadow-[#d35d3b]/10'
                    : 'bg-[#FAF6EE] text-[#2c2724]/60 border-[#2c2724]/10 hover:bg-[#2c2724]/5'
                }`}
              >
                <span className="text-base">☀️</span>
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`py-2.5 px-1 rounded-2xl text-[9px] font-black uppercase tracking-wider flex flex-col items-center justify-center gap-1 border cursor-pointer transition ${
                  theme === 'dark'
                    ? 'bg-[#d35d3b] text-white border-[#d35d3b] shadow-md shadow-[#d35d3b]/10'
                    : 'bg-[#FAF6EE] text-[#2c2724]/60 border-[#2c2724]/10 hover:bg-[#2c2724]/5'
                }`}
              >
                <span className="text-base">🌙</span>
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('sepia')}
                className={`py-2.5 px-1 rounded-2xl text-[9px] font-black uppercase tracking-wider flex flex-col items-center justify-center gap-1 border cursor-pointer transition ${
                  theme === 'sepia'
                    ? 'bg-[#d35d3b] text-white border-[#d35d3b] shadow-md shadow-[#d35d3b]/10'
                    : 'bg-[#FAF6EE] text-[#2c2724]/60 border-[#2c2724]/10 hover:bg-[#2c2724]/5'
                }`}
              >
                <span className="text-base">🍂</span>
                <span>Sepia</span>
              </button>
            </div>
          </div>

          {/* Font Sizing Controls */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-[9px] font-black text-[#2c2724]/60 uppercase tracking-widest">Font Size</span>
              <span className="text-xs font-black text-[#d35d3b]">{fontSize}px</span>
            </div>
            <div className="flex items-center gap-3 bg-[#2c2724]/5 border border-[#2c2724]/10 rounded-2xl p-1">
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.max(14, s - 2))}
                className="flex-1 py-2 font-black text-xs hover:text-[#d35d3b] cursor-pointer"
              >
                A-
              </button>
              <div className="w-px h-6 bg-[#2c2724]/10" />
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.min(28, s + 2))}
                className="flex-1 py-2 font-black text-xs hover:text-[#d35d3b] cursor-pointer"
              >
                A+
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reader Body Text Container */}
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="text-center mb-8 border-b border-current/10 pb-6">
          <h1 className="text-2xl font-black font-serif mb-2">{story ? story.title : book?.title}</h1>
          <p className="text-current/60 text-xs italic">by {story ? story.author : book?.author}</p>
        </div>

        {/* Scaled Text Area */}
        <article
          className="leading-relaxed whitespace-pre-wrap select-text font-serif focus:outline-none tracking-wide text-justify"
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
          className="w-full py-4 bg-[#d35d3b] hover:bg-[#d35d3b]/90 active:scale-[0.98] transition font-black rounded-2xl text-white shadow-xl text-center cursor-pointer text-xs uppercase tracking-wider"
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
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          navigate(`/coach?bookId=${book?.id || story?.id || 'general'}`);
                        }}
                        className="w-full py-4 bg-gradient-to-tr from-[#d35d3b] to-[#f09f80] text-white hover:opacity-90 active:scale-98 transition font-black rounded-2xl shadow-lg cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                      >
                        🦉 Discuss with Reading Coach
                      </button>
                      <button
                        onClick={() => handleCheckRecapTransition()}
                        className="w-full py-3.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white active:scale-98 transition font-bold rounded-2xl shadow-md cursor-pointer text-xs uppercase tracking-wider"
                      >
                        Maybe later
                      </button>
                    </div>
                  </div>
                )}

                {/* Recap Screen 1: Welcome/Invite */}
                {reflectionStep === 'recap-welcome' && (
                  <div className="space-y-6 py-4 select-none">
                    <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto text-4xl shadow-xl shadow-purple-500/20 animate-pulse">
                      🧠
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-white">Story Recap Challenge!</h3>
                      <p className="text-slate-400 text-xs leading-relaxed px-4">
                        Take a quick, playful recap to see how well you remember this story & claim a <span className="text-orange-400 font-bold">+10 XP bonus!</span>
                      </p>
                    </div>
                    <div className="space-y-3 pt-2">
                      <button
                        onClick={handleStartRecap}
                        className="w-full py-4 bg-orange-500 hover:bg-orange-400 transition font-black rounded-2xl text-white shadow-xl cursor-pointer"
                      >
                        Let's Play!
                      </button>
                      <button
                        type="button"
                        onClick={handleFinishNavigation}
                        className="w-full text-center text-xs text-slate-500 hover:text-slate-400 font-bold py-1 transition cursor-pointer"
                      >
                        Skip Recap (No pressure!)
                      </button>
                    </div>
                  </div>
                )}

                {/* Recap Screen 2: Quiz Game */}
                {reflectionStep === 'recap-quiz' && story?.recap_questions && (
                  <div className="space-y-5 text-left select-none">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Mini-Game</span>
                      <span className="text-[10px] font-bold text-slate-500">
                        Q: {currentQuestionIdx + 1} of {story.recap_questions.length}
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-white leading-relaxed">
                      {story.recap_questions[currentQuestionIdx].question}
                    </h4>

                    <div className="space-y-2">
                      {story.recap_questions[currentQuestionIdx].options.map((opt, idx) => {
                        const correctIdx = story.recap_questions?.[currentQuestionIdx]?.correct_index;
                        const isSelected = selectedOptionIdx === idx;
                        const isCorrect = idx === correctIdx;

                        let cardStyle = 'bg-slate-950/40 border-slate-850 hover:border-orange-500/50 hover:bg-slate-900/40';
                        if (showFeedback) {
                          if (isCorrect) {
                            cardStyle = 'bg-emerald-500/10 border-emerald-500 text-emerald-400';
                          } else if (isSelected) {
                            cardStyle = 'bg-rose-500/10 border-rose-500 text-rose-400';
                          } else {
                            cardStyle = 'bg-slate-950/20 border-slate-900 opacity-40';
                          }
                        }

                        return (
                          <button
                            key={opt}
                            disabled={showFeedback}
                            onClick={() => handleSelectOption(idx)}
                            className={`w-full p-3.5 text-left rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center justify-between ${cardStyle}`}
                          >
                            <span>{opt}</span>
                            {showFeedback && isCorrect && <span className="text-emerald-400">✓</span>}
                            {showFeedback && isSelected && !isCorrect && <span className="text-rose-400">✗</span>}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={handleFinishNavigation}
                        className="text-[10px] text-slate-500 hover:text-slate-400 font-bold transition cursor-pointer"
                      >
                        Skip recap quiz
                      </button>
                    </div>
                  </div>
                )}

                {/* Recap Screen 3: Completed Recap */}
                {reflectionStep === 'recap-done' && (
                  <div className="space-y-6 py-4 select-none">
                    <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center mx-auto text-4xl shadow-xl shadow-emerald-500/20 animate-bounce">
                      🎉
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-white">Recap Finished!</h3>
                      <p className="text-slate-400 text-xs leading-relaxed px-4">
                        You answered <span className="text-emerald-400 font-bold">{answersCorrectCount} correct</span>! 
                        Claimed your <span className="text-orange-400 font-black">+10 XP bonus!</span>
                      </p>
                    </div>
                    <button
                      onClick={handleFinishNavigation}
                      className="w-full py-4 bg-white text-slate-950 hover:bg-slate-100 active:scale-98 transition font-black rounded-2xl shadow-lg cursor-pointer"
                    >
                      Done & Return
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
