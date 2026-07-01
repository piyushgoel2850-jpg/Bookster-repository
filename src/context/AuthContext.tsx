import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { db } from '../lib/db';
import type { UserProfile } from '../lib/db';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  isMock: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setOnboardingData: (displayName: string, dailyGoal: number, timePref: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isSupabaseConfigured = (): boolean => {
  return !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock] = useState(!isSupabaseConfigured());

  // Listen to Supabase auth events
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // Mock mode initialization
      const mockSession = localStorage.getItem('bookster_mock_session');
      if (mockSession) {
        const u = JSON.parse(mockSession);
        setUser(u);
        db.getProfile(u.id).then((p) => {
          setProfile(p);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
      return;
    }

    // Supabase mode initialization
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        db.getProfile(session.user.id).then((p) => setProfile(p));
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        db.getProfile(session.user.id).then((p) => setProfile(p));
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      // Mock validation
      const mockUsers = JSON.parse(localStorage.getItem('bookster_mock_users') || '[]');
      const found = mockUsers.find((u: any) => u.email === email && u.password === password);
      if (found) {
        const sessionUser = { id: found.id, email: found.email };
        localStorage.setItem('bookster_mock_session', JSON.stringify(sessionUser));
        setUser(sessionUser);
        const p = await db.getProfile(found.id);
        setProfile(p);
        return { error: null };
      }
      return { error: new Error('Invalid email or password.') };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };
      setUser(data.user);
      const p = await db.getProfile(data.user!.id);
      setProfile(p);
      return { error: null };
    } catch (e) {
      return { error: e };
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    if (!isSupabaseConfigured()) {
      // Mock registration
      const mockUsers = JSON.parse(localStorage.getItem('bookster_mock_users') || '[]');
      if (mockUsers.some((u: any) => u.email === email)) {
        return { error: new Error('User already exists with this email.') };
      }
      const newId = 'mock-' + Math.random().toString(36).substr(2, 9);
      const newUser = { id: newId, email, password };
      mockUsers.push(newUser);
      localStorage.setItem('bookster_mock_users', JSON.stringify(mockUsers));

      const newProfile: UserProfile = {
        id: newId,
        display_name: displayName,
        daily_goal_minutes: 10,
        preferred_reading_time: 'Evening',
      };
      await db.saveProfile(newProfile);

      const sessionUser = { id: newId, email };
      localStorage.setItem('bookster_mock_session', JSON.stringify(sessionUser));
      setUser(sessionUser);
      setProfile(newProfile);
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error };
      
      const newProfile: UserProfile = {
        id: data.user!.id,
        display_name: displayName,
        daily_goal_minutes: 10,
        preferred_reading_time: 'Evening',
      };
      await db.saveProfile(newProfile);
      
      setUser(data.user);
      setProfile(newProfile);
      return { error: null };
    } catch (e) {
      return { error: e };
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      localStorage.removeItem('bookster_mock_session');
      setUser(null);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const newProfile = { ...profile, ...updates };
    const saved = await db.saveProfile(newProfile);
    setProfile(saved);
  };

  const setOnboardingData = async (displayName: string, dailyGoal: number, timePref: string) => {
    if (user) {
      await updateProfile({
        display_name: displayName,
        daily_goal_minutes: dailyGoal,
        preferred_reading_time: timePref,
      });
    } else {
      // Temporarily store in local storage to apply after sign up/login
      localStorage.setItem(
        'bookster_pending_onboarding',
        JSON.stringify({ displayName, dailyGoal, timePref })
      );
    }
  };

  // Sync pending onboarding after user logging in
  useEffect(() => {
    if (user && profile) {
      const pending = localStorage.getItem('bookster_pending_onboarding');
      if (pending) {
        const { displayName, dailyGoal, timePref } = JSON.parse(pending);
        updateProfile({
          display_name: displayName,
          daily_goal_minutes: dailyGoal,
          preferred_reading_time: timePref,
        }).then(() => {
          localStorage.removeItem('bookster_pending_onboarding');
        });
      }
    }
  }, [user, profile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isMock,
        signIn,
        signUp,
        signOut,
        updateProfile,
        setOnboardingData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
