-- Time Tracker App - Supabase Database Setup
-- Run this SQL in your Supabase SQL editor

-- Create the time_logs table
create table public.time_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  title text,
  project text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
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

-- Optional: Create an index for better performance when querying by user_id and date
create index idx_time_logs_user_date on public.time_logs(user_id, start_time);

-- Migration: Add new columns to existing table (run this if you already have the table)
-- alter table public.time_logs add column title text;
-- alter table public.time_logs add column project text;
-- alter table public.time_logs add column description text; 