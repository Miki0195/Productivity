# Database Migration Guide

This guide will walk you through setting up the complete database schema for the Time Tracker application, including the new Notes & Goals functionality.

## 1. Time Logs Table (Original)

```sql
-- Create time_logs table
create table public.time_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  title text,
  project text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.time_logs enable row level security;

-- Create policy to allow users to only see their own logs
create policy "Users can view their own time logs" on public.time_logs
  for select using (auth.uid() = user_id);

-- Create policy to allow users to insert their own logs
create policy "Users can insert their own time logs" on public.time_logs
  for insert with check (auth.uid() = user_id);

-- Create policy to allow users to update their own logs
create policy "Users can update their own time logs" on public.time_logs
  for update using (auth.uid() = user_id);

-- Create policy to allow users to delete their own logs
create policy "Users can delete their own time logs" on public.time_logs
  for delete using (auth.uid() = user_id);
```

## 2. Notes & Goals Tables (New)

```sql
-- Create folders table
CREATE TABLE IF NOT EXISTS public.folders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    color text NOT NULL DEFAULT '#3B82F6',
    parent_id uuid REFERENCES public.folders(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create notes table
CREATE TABLE IF NOT EXISTS public.notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL,
    title text NOT NULL,
    content text NOT NULL DEFAULT '',
    is_favorite boolean DEFAULT false NOT NULL,
    is_archived boolean DEFAULT false NOT NULL,
    tags text[] DEFAULT '{}' NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create goals table
CREATE TABLE IF NOT EXISTS public.goals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    is_completed boolean DEFAULT false NOT NULL,
    priority text CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium' NOT NULL,
    due_date date,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for folders
CREATE POLICY "Users can view their own folders" ON public.folders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders" ON public.folders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" ON public.folders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" ON public.folders
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for notes
CREATE POLICY "Users can view their own notes" ON public.notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes" ON public.notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON public.notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" ON public.notes
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for goals
CREATE POLICY "Users can view their own goals" ON public.goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON public.goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON public.goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON public.goals
    FOR DELETE USING (auth.uid() = user_id);

-- Create functions to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_folders_updated_at 
    BEFORE UPDATE ON public.folders 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_notes_updated_at 
    BEFORE UPDATE ON public.notes 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_goals_updated_at 
    BEFORE UPDATE ON public.goals 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS folders_user_id_idx ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS folders_parent_id_idx ON public.folders(parent_id);
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS notes_folder_id_idx ON public.notes(folder_id);
CREATE INDEX IF NOT EXISTS notes_is_archived_idx ON public.notes(is_archived);
CREATE INDEX IF NOT EXISTS notes_is_favorite_idx ON public.notes(is_favorite);
CREATE INDEX IF NOT EXISTS notes_tags_idx ON public.notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS goals_user_id_idx ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS goals_folder_id_idx ON public.goals(folder_id);
CREATE INDEX IF NOT EXISTS goals_is_completed_idx ON public.goals(is_completed);
CREATE INDEX IF NOT EXISTS goals_due_date_idx ON public.goals(due_date);
```

## How to Apply Migration

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the SQL code from sections 1 and 2 above
4. Run the queries

## Features Enabled

### Time Tracking (Original)
- User authentication
- Time session tracking
- Project categorization
- Session analytics

### Notes & Goals (New)
- **Folder Organization**: Create colorful folders to organize notes and goals
- **Rich Notes**: Create, edit, and delete notes with tags
- **Goal Tracking**: Set goals with priorities and due dates
- **Search & Filter**: Search across notes and goals, filter by favorites, recent items
- **Archive System**: Archive old notes without deleting them
- **Favorites**: Mark important notes as favorites for quick access
- **User-specific**: All data is user-isolated with Row Level Security

The new Notes page provides a modern, feature-rich note-taking and goal management experience integrated seamlessly with your existing time tracking app! 