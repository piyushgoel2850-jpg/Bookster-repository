-- Bookster Database Schema Script
-- Run this script in your Supabase Project's SQL Editor to initialize all tables and security policies.

-- 1. Profiles/Users Table (mapped to Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  daily_goal_minutes integer default 10 not null,
  preferred_reading_time text default 'Evening' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

create policy "Users can view their own profile." on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile." on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

-- 2. Streaks Table
create table if not exists public.streaks (
  user_id uuid references auth.users on delete cascade primary key,
  current_streak integer default 0 not null,
  longest_streak integer default 0 not null,
  last_read_date date,
  freezes_available integer default 1 not null
);

alter table public.streaks enable row level security;

create policy "Users can view their own streak." on public.streaks
  for select using (auth.uid() = user_id);

create policy "Users can update their own streak." on public.streaks
  for update using (auth.uid() = user_id);

create policy "Users can insert their own streak." on public.streaks
  for insert with check (auth.uid() = user_id);

-- 3. XP Log Table
create table if not exists public.xp_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  amount integer not null,
  source text not null, -- 'session', 'reflection', 'milestone'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.xp_log enable row level security;

create policy "Users can view their own XP logs." on public.xp_log
  for select using (auth.uid() = user_id);

create policy "Users can insert their own XP logs." on public.xp_log
  for insert with check (auth.uid() = user_id);

-- 4. Content Pieces (Short stories/essays for reading paths)
create table if not exists public.content_pieces (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  author text not null,
  genre_tags text[] not null,
  estimated_minutes integer not null,
  body_text text not null,
  is_public_domain boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.content_pieces enable row level security;

create policy "Anyone can view content pieces." on public.content_pieces
  for select using (true);

-- 5. User Books Table (External books manually added)
create table if not exists public.user_books (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  author text not null,
  total_length integer not null, -- pages or minutes
  progress_percent integer default 0 not null,
  status text default 'reading' not null, -- 'reading', 'finished'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_books enable row level security;

create policy "Users can view their own books." on public.user_books
  for select using (auth.uid() = user_id);

create policy "Users can modify their own books." on public.user_books
  for all using (auth.uid() = user_id);

-- 6. Reading Sessions Log
create table if not exists public.reading_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  content_id uuid references public.content_pieces(id) on delete set null,
  book_id uuid references public.user_books(id) on delete cascade,
  duration_minutes integer not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.reading_sessions enable row level security;

create policy "Users can view their own sessions." on public.reading_sessions
  for select using (auth.uid() = user_id);

create policy "Users can insert their own sessions." on public.reading_sessions
  for insert with check (auth.uid() = user_id);

-- 7. Reflections Table
create table if not exists public.reflections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  session_id uuid references public.reading_sessions(id) on delete cascade not null,
  type text not null, -- 'text', 'voice', 'skip'
  content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.reflections enable row level security;

create policy "Users can view their own reflections." on public.reflections
  for select using (auth.uid() = user_id);

create policy "Users can insert their own reflections." on public.reflections
  for insert with check (auth.uid() = user_id);

-- 8. Milestone Videos Table
create table if not exists public.milestone_videos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  trigger_type text not null, -- 'book_finished', 'streak_7', etc.
  video_url text not null,
  visibility text default 'private' not null, -- 'private', 'shared'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.milestone_videos enable row level security;

create policy "Users can view their own milestone videos." on public.milestone_videos
  for select using (auth.uid() = user_id);

create policy "Users can modify their own milestone videos." on public.milestone_videos
  for all using (auth.uid() = user_id);

-- 9. Badges Table
create table if not exists public.badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  badge_type text not null, -- 'streak_7', 'sci_fi_explorer', etc.
  earned_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.badges enable row level security;

create policy "Users can view their own badges." on public.badges
  for select using (auth.uid() = user_id);

create policy "Users can insert their own badges." on public.badges
  for insert with check (auth.uid() = user_id);

-- 10. Friendships Table
create table if not exists public.friendships (
  user_id uuid references auth.users on delete cascade not null,
  friend_id uuid references auth.users on delete cascade not null,
  status text default 'pending' not null, -- 'pending', 'active'
  primary key (user_id, friend_id)
);

alter table public.friendships enable row level security;

create policy "Users can manage their friendships." on public.friendships
  for all using (auth.uid() = user_id or auth.uid() = friend_id);
