import { supabase } from '../lib/supabaseClient';
import { SEED_STORIES } from '../data/stories';
import type { SeedStory } from '../data/stories';

export interface UserProfile {
  id: string;
  display_name: string;
  daily_goal_minutes: number;
  preferred_reading_time: string;
  created_at?: string;
}

export interface Streak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_read_date: string | null; // YYYY-MM-DD
  freezes_available: number;
}

export interface XPLog {
  id?: string;
  user_id: string;
  amount: number;
  source: string;
  created_at: string;
}

export interface UserBook {
  id: string;
  user_id: string;
  title: string;
  author: string;
  total_length: number; // pages/minutes
  progress_percent: number;
  status: 'reading' | 'finished';
  created_at: string;
}

export interface ReadingSession {
  id: string;
  user_id: string;
  content_id?: string | null;
  book_id?: string | null;
  duration_minutes: number;
  completed_at: string;
}

export interface Reflection {
  id: string;
  user_id: string;
  session_id: string;
  type: 'text' | 'voice' | 'skip';
  content: string;
  created_at: string;
}

export interface Badge {
  id: string;
  user_id: string;
  badge_type: string;
  earned_at: string;
}

export interface MilestoneVideo {
  id: string;
  user_id: string;
  trigger_type: string;
  video_url: string;
  visibility: 'private' | 'shared';
  created_at: string;
}

const isSupabaseConfigured = (): boolean => {
  return !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
};

// Helper: LocalStorage operations
const getLocal = <T>(key: string, defaultValue: T): T => {
  const item = localStorage.getItem(`bookster_${key}`);
  return item ? JSON.parse(item) : defaultValue;
};

const setLocal = <T>(key: string, value: T): void => {
  localStorage.setItem(`bookster_${key}`, JSON.stringify(value));
};

// Database APIs
export const db = {
  // Profiles
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase profile select error, falling back to local:', e);
      }
    }
    const profiles = getLocal<UserProfile[]>('profiles', []);
    return profiles.find((p) => p.id === userId) || null;
  },

  async saveProfile(profile: UserProfile): Promise<UserProfile> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .upsert(profile)
          .select()
          .single();
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase profile save error, falling back to local:', e);
      }
    }
    const profiles = getLocal<UserProfile[]>('profiles', []);
    const idx = profiles.findIndex((p) => p.id === profile.id);
    if (idx >= 0) profiles[idx] = profile;
    else profiles.push(profile);
    setLocal('profiles', profiles);
    return profile;
  },

  // Streaks
  async getStreak(userId: string): Promise<Streak | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('streaks')
          .select('*')
          .eq('user_id', userId)
          .single();
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase streak error, falling back to local:', e);
      }
    }
    const streaks = getLocal<Streak[]>('streaks', []);
    let userStreak = streaks.find((s) => s.user_id === userId);
    if (!userStreak) {
      userStreak = {
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_read_date: null,
        freezes_available: 1,
      };
      streaks.push(userStreak);
      setLocal('streaks', streaks);
    }
    return userStreak;
  },

  async saveStreak(streak: Streak): Promise<Streak> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('streaks')
          .upsert(streak)
          .select()
          .single();
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase streak save error, falling back to local:', e);
      }
    }
    const streaks = getLocal<Streak[]>('streaks', []);
    const idx = streaks.findIndex((s) => s.user_id === streak.user_id);
    if (idx >= 0) streaks[idx] = streak;
    else streaks.push(streak);
    setLocal('streaks', streaks);
    return streak;
  },

  // XP Logs
  async getXP(userId: string): Promise<number> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('xp_log')
          .select('amount')
          .eq('user_id', userId);
        if (!error && data) {
          return data.reduce((sum: number, item: any) => sum + item.amount, 0);
        }
      } catch (e) {
        console.warn('Supabase XP fetch error, falling back to local:', e);
      }
    }
    const logs = getLocal<XPLog[]>('xp_logs', []);
    return logs
      .filter((l) => l.user_id === userId)
      .reduce((sum, log) => sum + log.amount, 0);
  },

  async addXP(userId: string, amount: number, source: string): Promise<number> {
    const newLog: XPLog = {
      user_id: userId,
      amount,
      source,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('xp_log').insert(newLog);
        if (!error) return await this.getXP(userId);
      } catch (e) {
        console.warn('Supabase XP insert error, falling back to local:', e);
      }
    }

    const logs = getLocal<XPLog[]>('xp_logs', []);
    logs.push({ ...newLog, id: Math.random().toString() });
    setLocal('xp_logs', logs);
    return this.getXP(userId);
  },

  // Content Pieces
  async getContentPieces(): Promise<SeedStory[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('content_pieces')
          .select('*')
          .order('title', { ascending: true });
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn('Supabase content fetch error, falling back to local:', e);
      }
    }
    return SEED_STORIES;
  },

  // User Books
  async getUserBooks(userId: string): Promise<UserBook[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('user_books')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase books select error, falling back to local:', e);
      }
    }
    const books = getLocal<UserBook[]>('user_books', []);
    return books.filter((b) => b.user_id === userId);
  },

  async addUserBook(
    userId: string,
    title: string,
    author: string,
    totalLength: number
  ): Promise<UserBook> {
    const newBook: Omit<UserBook, 'id'> = {
      user_id: userId,
      title,
      author,
      total_length: totalLength,
      progress_percent: 0,
      status: 'reading',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('user_books')
          .insert(newBook)
          .select()
          .single();
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase book insert error, falling back to local:', e);
      }
    }

    const books = getLocal<UserBook[]>('user_books', []);
    const id = Math.random().toString();
    const createdBook = { ...newBook, id };
    books.push(createdBook);
    setLocal('user_books', books);
    return createdBook;
  },

  async updateUserBookProgress(
    userId: string,
    bookId: string,
    progressPercent: number
  ): Promise<void> {
    const status = progressPercent >= 100 ? 'finished' : 'reading';

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('user_books')
          .update({ progress_percent: progressPercent, status })
          .eq('id', bookId)
          .eq('user_id', userId);
        if (!error) return;
      } catch (e) {
        console.warn('Supabase book update error, falling back to local:', e);
      }
    }

    const books = getLocal<UserBook[]>('user_books', []);
    const book = books.find((b) => b.id === bookId && b.user_id === userId);
    if (book) {
      book.progress_percent = progressPercent;
      book.status = status;
      setLocal('user_books', books);
    }
  },

  async deleteUserBook(userId: string, bookId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('user_books')
          .delete()
          .eq('id', bookId)
          .eq('user_id', userId);
        if (!error) return;
      } catch (e) {
        console.warn('Supabase book delete error, falling back to local:', e);
      }
    }

    const books = getLocal<UserBook[]>('user_books', []);
    const filtered = books.filter((b) => !(b.id === bookId && b.user_id === userId));
    setLocal('user_books', filtered);
  },

  // Reading Sessions
  async addReadingSession(
    userId: string,
    durationMinutes: number,
    contentId?: string | null,
    bookId?: string | null
  ): Promise<ReadingSession> {
    const session: Omit<ReadingSession, 'id'> = {
      user_id: userId,
      duration_minutes: durationMinutes,
      content_id: contentId || null,
      book_id: bookId || null,
      completed_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('reading_sessions')
          .insert(session)
          .select()
          .single();
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase session insert error, falling back to local:', e);
      }
    }

    const sessions = getLocal<ReadingSession[]>('reading_sessions', []);
    const id = Math.random().toString();
    const createdSession = { ...session, id };
    sessions.push(createdSession);
    setLocal('reading_sessions', sessions);
    return createdSession;
  },

  async getReadingSessions(userId: string): Promise<ReadingSession[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('reading_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false });
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase session fetch error, falling back to local:', e);
      }
    }
    const sessions = getLocal<ReadingSession[]>('reading_sessions', []);
    return sessions.filter((s) => s.user_id === userId);
  },

  // Reflections
  async addReflection(
    userId: string,
    sessionId: string,
    type: 'text' | 'voice' | 'skip',
    content: string
  ): Promise<Reflection> {
    const ref: Omit<Reflection, 'id'> = {
      user_id: userId,
      session_id: sessionId,
      type,
      content,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('reflections')
          .insert(ref)
          .select()
          .single();
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase reflection insert error, falling back to local:', e);
      }
    }

    const reflections = getLocal<Reflection[]>('reflections', []);
    const id = Math.random().toString();
    const createdReflection = { ...ref, id };
    reflections.push(createdReflection);
    setLocal('reflections', reflections);
    return createdReflection;
  },

  async getReflections(userId: string): Promise<Reflection[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('reflections')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase reflections fetch error, falling back to local:', e);
      }
    }
    const reflections = getLocal<Reflection[]>('reflections', []);
    return reflections.filter((r) => r.user_id === userId);
  },

  // Badges
  async getBadges(userId: string): Promise<Badge[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('badges')
          .select('*')
          .eq('user_id', userId)
          .order('earned_at', { ascending: false });
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase badges fetch error, falling back to local:', e);
      }
    }
    const badges = getLocal<Badge[]>('badges', []);
    return badges.filter((b) => b.user_id === userId);
  },

  async awardBadge(userId: string, badgeType: string): Promise<Badge | null> {
    const existing = await this.getBadges(userId);
    if (existing.some((b) => b.badge_type === badgeType)) {
      return null; // Already earned
    }

    const badge: Omit<Badge, 'id'> = {
      user_id: userId,
      badge_type: badgeType,
      earned_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('badges')
          .insert(badge)
          .select()
          .single();
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase badge insert error, falling back to local:', e);
      }
    }

    const badges = getLocal<Badge[]>('badges', []);
    const id = Math.random().toString();
    const createdBadge = { ...badge, id };
    badges.push(createdBadge);
    setLocal('badges', badges);
    return createdBadge;
  },

  // Milestone Videos
  async addMilestoneVideo(
    userId: string,
    triggerType: string,
    videoUrl: string,
    visibility: 'private' | 'shared'
  ): Promise<MilestoneVideo> {
    const video: Omit<MilestoneVideo, 'id'> = {
      user_id: userId,
      trigger_type: triggerType,
      video_url: videoUrl,
      visibility,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('milestone_videos')
          .insert(video)
          .select()
          .single();
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase video insert error, falling back to local:', e);
      }
    }

    const videos = getLocal<MilestoneVideo[]>('milestone_videos', []);
    const id = Math.random().toString();
    const createdVideo = { ...video, id };
    videos.push(createdVideo);
    setLocal('milestone_videos', videos);
    return createdVideo;
  },

  async getMilestoneVideos(userId: string): Promise<MilestoneVideo[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('milestone_videos')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase videos fetch error, falling back to local:', e);
      }
    }
    const videos = getLocal<MilestoneVideo[]>('milestone_videos', []);
    return videos.filter((v) => v.user_id === userId);
  },
};
