# Time Tracker Web App

A full-stack time-tracking web application built with React, Tailwind CSS, shadcn/ui, and Supabase.

## Features

- **User Authentication**: Sign up, sign in, and sign out using Supabase Auth
- **Time Tracking**: Start and stop work sessions with a clean interface
- **Persistent Sessions**: Timer state survives page refreshes using localStorage
- **Daily Logs**: View all time logs for the current day in a responsive table
- **Total Time Calculation**: See total time worked for the day
- **Modern UI**: Clean, responsive design using Tailwind CSS and shadcn/ui components

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (Auth, Database, API)
- **Deployment**: Vercel-ready

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Create Database Table

In your Supabase SQL editor, run the following SQL to create the `time_logs` table:

```sql
-- Create the time_logs table
create table public.time_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
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
```

### 4. Configure Supabase Auth (Optional)

1. Go to Authentication > Settings in your Supabase dashboard
2. Configure email settings and providers as needed
3. For development, you can disable email confirmation in Auth settings

### 5. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel's dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

The app is ready for production deployment on Vercel with no additional configuration needed.

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── Auth.tsx         # Authentication component
│   ├── Dashboard.tsx    # Main dashboard
│   ├── TimeTracker.tsx  # Timer functionality
│   └── TimeLogsTable.tsx # Display time logs
├── contexts/
│   └── AuthContext.tsx  # Authentication context
├── services/
│   └── supabase.ts      # Supabase client setup
├── lib/
│   └── utils.ts         # Utility functions
├── App.tsx              # Main app component
├── main.tsx             # Entry point
└── index.css            # Global styles
```

## Features Details

### Time Tracking
- Click "Start Work" to begin tracking
- Timer displays in HH:MM:SS format with live updates
- Click "Stop Work" to end the session and save to database
- Session persists across page refreshes

### Daily Logs
- Shows all time logs for the current day
- Displays start time, end time, and duration
- Calculates and shows total time worked
- Updates automatically when new logs are added

### Authentication
- Email/password authentication via Supabase
- Secure user sessions
- Row-level security ensures users only see their own data

## Database Schema

### time_logs table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `start_time` (Timestamp with timezone)
- `end_time` (Timestamp with timezone)
- `created_at` (Timestamp with timezone, auto-generated)

## Environment Variables

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes. 