
# Swave Social - Production Setup Guide

## 1. Database Setup (Supabase)
1. Log in to your [Supabase Dashboard](https://supabase.com).
2. Create a new project.
3. Go to the **SQL Editor** in the left sidebar.
4. Open the `database_schema.sql` file provided in this project (if available) or check the project documentation for the schema.
5. **IMPORTANT:** After creating your tables, run the fix script below to ensure the `services` table supports custom IDs.

## 2. Environment Variables
1. Go to `services/supabaseClient.ts`.
2. Replace `SUPABASE_URL` and `SUPABASE_ANON_KEY` with your project's credentials (found in Supabase Settings > API).
3. Go to `services/firebaseConfig.ts`.
4. Replace the `firebaseConfig` object with your actual Firebase project settings.

## 3. Storage Setup (Firebase)
1. Go to the [Firebase Console](https://console.firebase.google.com).
2. Navigate to **Storage** and click "Get Started" to create a bucket.
3. Go to the **Rules** tab.
4. Copy the content of `firebase_storage.rules` and paste it there.
5. **Important:** For a live production app, ensure you set up Firebase Authentication and remove the `|| true` condition in the rules to prevent public write access.

## 4. Initial Login
- **Email:** `admin@swave.agency`
- **Password:** `admin123`
- *Note:* You can change this password immediately in the "Team" settings tab after logging in.

## 5. Troubleshooting
### "invalid input syntax for type uuid" Error
If you see an error regarding `svc_basic` or UUIDs when initializing the database (especially in the Finance module), it means the `services` table expects a strict UUID but the app uses readable text IDs.

Run this SQL command in your Supabase SQL Editor to fix it:
```sql
ALTER TABLE services ALTER COLUMN id TYPE text;
```
