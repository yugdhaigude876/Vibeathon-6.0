# PLATR

### Vibeathon 6.0 · Restaurant platform

Dark, modern restaurant app built with **Next.js** and **Supabase Auth**. Guests sign up, sign in, and land in a protected shell with menu, orders, reservations, and dashboard.

<br />

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## What you get

| | |
| --- | --- |
| **Auth that sticks** | Email/password + optional Google OAuth via Supabase |
| **Route protection** | Middleware + layout gate keep private pages locked down |
| **Customer profiles** | New accounts land in `profiles` with role `customer` |
| **Clean logout** | Dedicated `/logout` page signs out and returns to login |
| **Responsive shell** | Desktop nav + mobile sheet, email shown in the header |

---

## Quick start

**Requirements:** Node.js 18+, a [Supabase](https://supabase.com) project

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.local.example .env.local
#    → paste NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Run
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** — you’ll be sent to `/login` if you’re not signed in.

> Tip: enable **Google** under Supabase → Authentication → Providers if you want social sign-in.

---

## How auth works

```text
  /  ──(guest)──►  /login
       │
       │  sign up / sign in
       ▼
    /menu   ← landing after auth
       │
       ├── /dashboard
       ├── /orders
       └── /reservations
       │
       └── /logout  ──►  /login
```

1. Guests hitting protected routes go to **`/login`**
2. **Sign up** creates a Supabase user and a profile (`role: customer`)
3. **Sign in** stores the session in cookies and opens **`/menu`**
4. Already signed-in users on `/login` or `/signup` bounce to **`/menu`**
5. **Logout** runs `signOut()`, waits briefly, then returns to **`/login`**

### Profile API

```http
POST /api/auth/profile
Content-Type: application/json

{ "email": "guest@example.com" }
```

| Result | Body |
| --- | --- |
| Success | `{ "success": true, "profile": { … } }` |
| Error | `{ "error": "message" }` |

Inserts with `role: "customer"` and `restaurant_id: null`.

---

## App routes

| Path | Access | Purpose |
| --- | --- | --- |
| `/login` | Public | PLATR login — email/password + Google |
| `/signup` | Public | Create account |
| `/logout` | Auth | Sign-out flow |
| `/menu` | Protected | Post-login home |
| `/dashboard` | Protected | Overview |
| `/orders` | Protected | Orders |
| `/reservations` | Protected | Reservations |
| `/api/auth/profile` | Auth | Create customer profile |

---

## Project layout

```text
PLATR/
├── app/
│   ├── (auth)/
│   │   ├── login/          Sign in
│   │   ├── signup/         Sign up + profile
│   │   └── logout/         Sign-out redirect
│   ├── api/auth/profile/   Profile POST endpoint
│   ├── menu/               Menu page
│   ├── dashboard/          Dashboard
│   ├── orders/             Orders
│   ├── reservations/       Reservations
│   ├── globals.css         Theme tokens
│   ├── layout.tsx          Auth gate + nav shell
│   └── page.tsx            Redirects → /menu
├── components/
│   ├── Navigation.tsx      App chrome
│   └── ui/                 Buttons, cards, inputs, …
├── lib/
│   ├── auth.ts             signUp / signIn / signOut / …
│   ├── supabase.ts         Browser client
│   └── utils.ts            cn() helper
├── hooks/use-toast.ts
└── middleware.ts           Cookie session + redirects
```

---

## Database · `profiles`

Create this table in Supabase (and turn on RLS so users can manage their own row):

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | PK — same as `auth.users.id` |
| `email` | `text` | |
| `full_name` | `text` | Optional |
| `avatar_url` | `text` | Optional |
| `role` | `text` | Default `customer` |
| `restaurant_id` | `uuid` | Nullable |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

---

## Stack

| Piece | Choice |
| --- | --- |
| App framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Auth & backend | Supabase (`@supabase/ssr`) |
| Styling | Tailwind CSS |
| UI primitives | Radix UI + Lucide icons |

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server → `localhost:3000` |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Lint the project |

---

---

## Demo Accounts & Test Credentials

For testing and demonstration during evaluation, use the following credentials on the **Staff & Manager** login tab:

| Portal | Role | ID / Email | Password | Target Route |
| --- | --- | --- | --- | --- |
| **Manager Portal** | `manager` | `manager@platr.com` | `ManagerPass123!` | `/manager` |
| **Staff Portal** | `staff` | `STF-1024` *(or `staff@platr.com`)* | `StaffPass123!` | `/staff` |
| **Customer Portal** | `customer` | Google OAuth or Email Sign-in | *Self registered* | `/menu` |

> **Note**: To create these test accounts in your Supabase project, insert them into `auth.users` and assign their respective roles (`manager` or `staff`) in the `profiles` table:
> ```sql
> UPDATE profiles SET role = 'manager' WHERE email = 'manager@platr.com';
> UPDATE profiles SET role = 'staff' WHERE email = 'staff@platr.com';
> ```

---

## License

MIT — see [LICENSE](./LICENSE).

<br />

<p align="center">
  <sub>Built for Vibeathon 6.0</sub>
</p>

