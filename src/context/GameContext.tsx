import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/db';
import type { Streak, Badge } from '../lib/db';

interface CompletionResult {
  xpGained: number;
  streakIncremented: boolean;
  goalMetToday: boolean;
  newLevelReached: boolean;
  unlockedBadges: string[];
}

interface GameContextType {
  streak: Streak | null;
  xp: number;
  level: number;
  dailyActiveMinutes: number;
  badges: Badge[];
  loading: boolean;
  refreshStats: () => Promise<void>;
  completeSession: (duration: number, contentId?: string | null, bookId?: string | null) => Promise<CompletionResult>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [streak, setStreak] = useState<Streak | null>(null);
  const [xp, setXp] = useState<number>(0);
  const [dailyActiveMinutes, setDailyActiveMinutes] = useState<number>(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const level = 1 + Math.floor(xp / 100);

  const getLocalDateString = () => {
    // Returns YYYY-MM-DD in local time
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  };

  const getYesterdayDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  };

  const refreshStats = async () => {
    if (!user) {
      setStreak(null);
      setXp(0);
      setDailyActiveMinutes(0);
      setBadges([]);
      setLoading(false);
      return;
    }

    try {
      // 1. Get streak
      const s = await db.getStreak(user.id);
      setStreak(s);

      // 2. Get XP
      const currentXp = await db.getXP(user.id);
      setXp(currentXp);

      // 3. Get badges
      const userBadges = await db.getBadges(user.id);
      setBadges(userBadges);

      // 4. Calculate today's reading minutes
      const today = getLocalDateString();
      const sessions = await db.getReadingSessions(user.id);
      const todayMinutes = sessions
        .filter((sess) => sess.completed_at.startsWith(today))
        .reduce((sum, sess) => sum + sess.duration_minutes, 0);
      setDailyActiveMinutes(todayMinutes);
    } catch (e) {
      console.error('Error refreshing game stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStats();
  }, [user]);

  const completeSession = async (
    durationMinutes: number,
    contentId?: string | null,
    bookId?: string | null
  ): Promise<CompletionResult> => {
    if (!user) throw new Error('User must be logged in to log a session.');

    const result: CompletionResult = {
      xpGained: 0,
      streakIncremented: false,
      goalMetToday: false,
      newLevelReached: false,
      unlockedBadges: [],
    };

    // 1. Save reading session in database
    await db.addReadingSession(user.id, durationMinutes, contentId, bookId);

    // 2. Calculate base XP (10 XP per minute read)
    let sessionXp = durationMinutes * 10;
    result.xpGained += sessionXp;

    // 3. Calculate today's total active minutes
    const todayStr = getLocalDateString();
    const yesterdayStr = getYesterdayDateString();
    const goalTarget = profile?.daily_goal_minutes || 10;

    const previousDailyMinutes = dailyActiveMinutes;
    const newDailyMinutes = previousDailyMinutes + durationMinutes;
    setDailyActiveMinutes(newDailyMinutes);

    // Check if daily goal is met
    if (newDailyMinutes >= goalTarget && previousDailyMinutes < goalTarget) {
      result.goalMetToday = true;
      // Goal achievement bonus: +50 XP
      result.xpGained += 50;
    }

    // 4. Update Streak
    let currentStreakData = streak || {
      user_id: user.id,
      current_streak: 0,
      longest_streak: 0,
      last_read_date: null,
      freezes_available: 1,
    };

    const lastRead = currentStreakData.last_read_date;
    let newStreak = currentStreakData.current_streak;

    if (lastRead === todayStr) {
      // Already read today, streak stays the same
      result.streakIncremented = false;
    } else if (lastRead === yesterdayStr || lastRead === null) {
      // First read today, last read was yesterday or never
      newStreak += 1;
      result.streakIncremented = true;
    } else {
      // Last read was older than yesterday, streak reset/refreshed
      newStreak = 1;
      result.streakIncremented = true;
    }

    const newLongest = Math.max(newStreak, currentStreakData.longest_streak);
    const updatedStreak: Streak = {
      ...currentStreakData,
      current_streak: newStreak,
      longest_streak: newLongest,
      last_read_date: todayStr,
    };

    const savedStreak = await db.saveStreak(updatedStreak);
    setStreak(savedStreak);

    // 5. Add XP
    const prevLevel = level;
    const finalXp = await db.addXP(user.id, result.xpGained, 'session');
    setXp(finalXp);

    const newLevel = 1 + Math.floor(finalXp / 100);
    if (newLevel > prevLevel) {
      result.newLevelReached = true;
    }

    // 6. Badge Checks & Awards
    const badgesUnlockedThisSession: string[] = [];

    // Rule A: First reading session
    const firstSessionBadge = await db.awardBadge(user.id, 'first_step');
    if (firstSessionBadge) badgesUnlockedThisSession.push('First Step');

    // Rule B: 7-day streak
    if (newStreak >= 7) {
      const streak7Badge = await db.awardBadge(user.id, 'streak_7');
      if (streak7Badge) badgesUnlockedThisSession.push('7-Day Streak');
    }

    // Rule C: Time of day checks
    const currentHour = new Date().getHours();
    if (currentHour >= 21) {
      const nightOwlBadge = await db.awardBadge(user.id, 'night_owl');
      if (nightOwlBadge) badgesUnlockedThisSession.push('Night Owl');
    } else if (currentHour <= 9) {
      const earlyBirdBadge = await db.awardBadge(user.id, 'early_bird');
      if (earlyBirdBadge) badgesUnlockedThisSession.push('Early Bird');
    }

    result.unlockedBadges = badgesUnlockedThisSession;

    // Refresh badges state
    const freshBadges = await db.getBadges(user.id);
    setBadges(freshBadges);

    return result;
  };

  return (
    <GameContext.Provider
      value={{
        streak,
        xp,
        level,
        dailyActiveMinutes,
        badges,
        loading,
        refreshStats,
        completeSession,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
