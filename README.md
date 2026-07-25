# Vibeathon 6.0

A Next.js restaurant platform with Supabase authentication. Customers can sign up, sign in, and access protected areas like the menu, orders, and reservations.

## Features

- **Email / password auth** — sign up and log in with Supabase Auth
- **Google OAuth** — optional social sign-in when enabled in your Supabase project
- **Protected routes** — middleware redirects unauthenticated users to `/login`
- **Profile creation** — new users get a `customer` profile in the `profiles` table
- **Clean logout flow** — `/logout` signs out and returns to login
- **Responsive navigation** — desktop header and mobile sheet menu

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js (App Router) |
| Auth & DB | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) |
| UI | React, Tailwind-style utility classes, Radix UI primitives |
| Icons | Lucide React |

## Project structure

```
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx      # Sign in
│   │   ├── signup/page.tsx     # Sign up + profile insert
│   │   └── logout/page.tsx     # Sign-out redirect flow
│   ├── api/auth/profile/       # POST — create customer profile
│   └── layout.tsx              # Auth gate + navigation shell
├── components/
│   ├── Navigation.tsx          # App nav (dashboard, menu, orders, reservations)
│   └── ui/                     # Shared UI primitives
├── lib/
│   ├── auth.ts                 # Auth helpers (signUp, signIn, signOut, …)
│   ├── supabase.ts             # Browser Supabase client
│   └── utils.ts                # `cn()` classname helper
├── hooks/
│   └── use-toast.ts
└── middleware.ts               # Cookie session + route protection
```

## Getting started

### 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### 2. Environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database — `profiles` table

Ensure a `profiles` table exists (typical columns):

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key; matches `auth.users.id` |
| `email` | `text` | User email |
| `full_name` | `text` | Optional |
| `avatar_url` | `text` | Optional |
| `role` | `text` | Defaults to `customer` |
| `restaurant_id` | `uuid` | Nullable |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

Enable Row Level Security and policies that allow authenticated users to insert/select their own profile.

### 4. Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated visits should redirect to `/login`.

### 5. Google OAuth (optional)

1. In the Supabase dashboard, open **Authentication → Providers → Google**
2. Add your Google OAuth client ID and secret
3. Add the redirect URL Supabase provides to your Google Cloud credentials

## Auth flow

1. Visit `/` or any protected route → redirect to `/login` if not signed in
2. **Sign up** → creates a Supabase user and a `profiles` row (`role: customer`)
3. **Sign in** → session cookies; redirect to `/menu`
4. Authenticated users on `/login` or `/signup` → redirect to `/menu`
5. **Logout** → `/logout` calls `signOut()`, then redirects to `/login`

### Profile API

`POST /api/auth/profile`

```json
{ "email": "user@example.com" }
```

Creates a profile with `role: "customer"` and `restaurant_id: null`.

**Success:** `{ "success": true, "profile": { ... } }`  
**Error:** `{ "error": "message" }`

## Routes

| Path | Access | Description |
| --- | --- | --- |
| `/login` | Public | Email/password + Google sign-in |
| `/signup` | Public | Create account |
| `/logout` | Authenticated | Sign-out flow |
| `/menu` | Protected | Post-login landing |
| `/dashboard` | Protected | Dashboard |
| `/orders` | Protected | Orders |
| `/reservations` | Protected | Reservations |
| `/api/auth/profile` | Authenticated | Create profile |

## License

MIT — see [LICENSE](./LICENSE).
