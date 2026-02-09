# Swave Social - Operations Platform

A powerful, high-performance operations dashboard for social media agencies, built with React, Vite, Supabase, and Firebase.

![Swave Hero](https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=1080)

## 🚀 Features

- **Master Feed**: Comprehensive view of all social posts across clients and platforms.
- **Workflow Management**: Toggle between Feed, **Calendar View**, and **Kanban Board** for seamless planning.
- **Brand Kits**: Managed visual identities for clients, including custom logos and color palettes.
- **Finance Module**: Automated invoicing, service tracking, and revenue reporting.
- **Asset Library**: Integrated Firebase storage for high-quality media assets (images/videos).
- **Daily Briefing**: Smart summaries to keep the team aligned on today's priorities.
- **Dark Mode / Glassmorphism**: Premium UI designed for focus and productivity.

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS (Vanilla CSS focus)
- **Icons**: Lucide React
- **Backend & DB**: Supabase (PostgreSQL)
- **Storage**: Firebase Storage
- **Routing**: React Router DOM

## 📂 Project Structure

```text
├── components/          # Reusable UI components (Master Feed, Finance, etc.)
├── services/            # API clients (Supabase, Firebase, Local DB)
├── types/               # TypeScript interfaces and enums
├── App.tsx              # Main application entry and routing
├── database_schema.sql  # Core database structure
└── supabase_setup.sql   # Supplemental SQL fixes and RPCs
```

## ⚙️ Setup Instructions

### 1. Database (Supabase)
1. Create a project at [Supabase](https://supabase.com).
2. Run `database_schema.sql` in the SQL Editor.
3. **Crucial Fix**: If your project uses text-based service IDs, run:
   ```sql
   ALTER TABLE services ALTER COLUMN id TYPE text;
   ```

### 2. Storage (Firebase)
1. Create a bucket in [Firebase Console](https://console.firebase.google.com).
2. Apply the rules from `firebase_storage.rules`.
3. Update `services/firebaseConfig.ts` with your credentials.

### 3. Connection
Update `services/supabaseClient.ts` with your `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

### 4. Local Development
```bash
npm install
npm run dev
```

## 🔐 Credentials (Initial)
- **Admin**: `admin@swave.agency` / `admin123`

---
*Built for Swave Social Growth Agency.*
