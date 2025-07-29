# Database Migration Guide

If you already have the time tracking app running with the old database schema, you'll need to add the new columns for work session details.

## Migration SQL

Run this SQL in your Supabase SQL editor to add the new columns:

```sql
-- Add new columns to existing time_logs table
ALTER TABLE public.time_logs ADD COLUMN title text;
ALTER TABLE public.time_logs ADD COLUMN project text;
ALTER TABLE public.time_logs ADD COLUMN description text;
```

## What's New

The enhanced time tracking now supports:

- **Session Title**: A descriptive title for your work session
- **Project**: Which project you were working on
- **Description**: Detailed notes about what you accomplished

These fields are all optional - your existing logs will continue to work perfectly!

## New Features Added

1. **Work Session Modal**: Beautiful dialog when stopping work to capture session details
2. **Enhanced Logs Page**: New `/logs` route with detailed session views
3. **Project Tracking**: See which projects you're spending time on
4. **Rich Session History**: View titles, descriptions, and project categorization

## Fallbacks

- Existing logs without details will show as "Untitled Session"
- All new fields are optional - you can skip adding details if you're in a hurry
- The app works exactly the same as before, just with optional enhancements

Enjoy your enhanced time tracking experience! 🚀 