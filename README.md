# Smart Bookmark App

A real-time, secure bookmark manager built with Next.js (App Router) and Supabase.

## 🔗 Live Demo
https://smart-bookmark-app-ochre-nine.vercel.app/

---

## 🚀 Overview

Smart Bookmark App allows users to:

- Sign in using Google OAuth (no email/password authentication)
- Add bookmarks (title + URL)
- Delete their own bookmarks
- View their bookmarks privately
- See real-time updates across multiple tabs without refreshing

Each user’s data is fully isolated and protected using Row-Level Security (RLS).

---

## 🛠 Tech Stack

- **Frontend:** Next.js (App Router)
- **Backend & Auth:** Supabase
- **Database:** PostgreSQL (via Supabase)
- **Realtime:** Supabase Realtime (Postgres changes)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

---

## 🧱 Architecture

### 1️⃣ Authentication

- Google OAuth handled via Supabase Auth
- No email/password login implemented
- Session is managed client-side using Supabase SDK

### 2️⃣ Database Design

A single `bookmarks` table:

- `id` (UUID, primary key)
- `created_at` (timestamp)
- `user_id` (references auth.users)
- `title`
- `url`

Each bookmark is associated with a specific authenticated user.

### 3️⃣ Security (Row-Level Security)

Row-Level Security (RLS) is enabled on the `bookmarks` table.

Policies enforce:

- Users can only SELECT their own bookmarks
- Users can only INSERT bookmarks with their own `user_id`
- Users can only DELETE their own bookmarks

Policy condition:
auth.uid() = user_id

This ensures database-level protection even if the frontend is manipulated.

### 4️⃣ Real-Time Updates

The app subscribes to Postgres changes using Supabase Realtime.

A channel is created and filtered by:
user_id = authenticated user

Whenever an INSERT or DELETE occurs, bookmarks are refetched automatically.

This enables:
- Multi-tab synchronization
- No page refresh required
- Instant UI updates

---

## ⚡ Key Implementation Decisions

- Used App Router instead of Pages Router for modern Next.js architecture.
- Used Supabase for unified Auth + Database + Realtime integration.
- Implemented backend-level security using RLS instead of relying on frontend filtering.
- Filtered realtime events by `user_id` to avoid unnecessary updates.

---

## 🧪 Challenges Faced & Solutions

### 1. Google OAuth Redirect Issues
Problem: OAuth failed due to incorrect Site URL configuration.
Solution: Updated Supabase Authentication → URL Configuration with correct localhost and production URLs.

### 2. Row-Level Security Blocking Queries
Problem: Initially, queries failed after enabling RLS.
Solution: Created explicit SELECT, INSERT, and DELETE policies allowing access only when `auth.uid() = user_id`.

### 3. Realtime Not Triggering
Problem: Changes were not reflected across tabs.
Solution: Enabled replication for the `bookmarks` table in Supabase and added a filtered realtime channel subscription.

### 4. Import Alias Issues
Problem: `@/lib` alias failed when `src` directory wasn’t used.
Solution: Adjusted import paths to use relative imports.

---

## 🔐 Security Considerations

- All bookmark access is enforced at the database level.
- No sensitive keys are exposed (only public anon key used).
- OAuth-only authentication reduces credential management risk.
- External links use `rel="noopener noreferrer"` for security.

---

## 📦 Deployment

The app is deployed on Vercel.

Environment variables configured in Vercel:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

Production redirect URLs were updated in Supabase to match the Vercel domain.

---

## 📈 Possible Improvements

- Edit bookmark functionality
- Loading states and optimistic UI updates
- URL metadata preview (fetch favicon/title automatically)
- Better UI polish and animations
- Pagination for scalability

---

## 👨‍💻 Author

Built as part of a technical interview assignment.
