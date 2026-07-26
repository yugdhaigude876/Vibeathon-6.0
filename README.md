<div align="center">

# 🍽️ PLATR

### The Modern Restaurant Operating System

**Real-time orders · Smart reservations · Kitchen display system · Role-based access · Enterprise security**

<br />

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](./LICENSE)

<br />

> **Built for Vibeathon 6.0** — a full-stack restaurant platform that connects customers, kitchen staff, and managers in real time.

</div>

---

## 🌟 What is PLATR?

PLATR is a **full-stack restaurant operating system** built for the modern hospitality industry. It replaces paper menus, verbal orders, and disconnected spreadsheets with a unified digital platform — live, reactive, and role-aware.

Every actor in the restaurant — the **customer** browsing the menu, the **chef** reading the Kitchen Display System, and the **manager** watching live revenue metrics — operates on the same real-time data layer powered by Supabase.

---

## ✨ Feature Overview

### 🧑‍💼 For Customers
| Feature | Details |
|---|---|
| **Smart Menu** | Browse items by category, see live availability status |
| **Cart & Checkout** | Add items to cart, review order, place with one click |
| **Order Tracking** | View your active and past orders with status updates |
| **Table Reservations** | Book tables with date, time, and party-size validation |
| **Persistent Cart** | Cart state saved to `localStorage` across sessions |

### 🧑‍🍳 For Kitchen Staff
| Feature | Details |
|---|---|
| **Kitchen Display System (KDS)** | Two-column live board — "In Progress" & "Completed / Ready" |
| **Real-Time Order Feed** | New orders appear instantly via Supabase Realtime WebSockets |
| **New Order Toasts** | 🔔 Toast notification fires automatically on each new order |
| **Status Progression** | Advance orders from `pending → preparing → ready → completed` |
| **Menu Availability Toggle** | Mark items 86'd or back in stock without leaving the KDS |

### 📊 For Managers
| Feature | Details |
|---|---|
| **Live Dashboard** | Revenue, order count, and status metrics update in real time |
| **Order Management** | Full order history with customer details and item breakdown |
| **Inventory Control** | Toggle menu item availability from the manager panel |
| **Table Management** | Monitor table occupancy and reservations |
| **Staff Oversight** | View all active staff sessions and order activity |

### 🔐 Security & Access Control
| Layer | Implementation |
|---|---|
| **Middleware RBAC** | Next.js Edge Middleware enforces role-based routing on every request |
| **API Role Guards** | Every API endpoint validates the caller's role via `profiles` table |
| **Client-Side Guards** | `useRoleGuard()` hook prevents unauthorized component rendering |
| **Rate Limiting** | In-memory rate limiter: 10 orders/min, 5 reservations/min, 30 menu toggles/min |
| **Price Validation** | Server-side price enforcement — client prices are always cross-checked |
| **Customer Isolation** | `customer_id` always set server-side from `auth.uid()` — never trusted from the body |
| **Input Validation** | Date/time windows, party size bounds, menu item existence checks |
| **Supabase RLS** | Row Level Security policies isolate data per user and role at the DB layer |

---

## 🗺️ Application Routes

### Customer Routes
| Path | Access | Description |
|---|---|---|
| `/menu` | Customer only | Browse menu, add to cart |
| `/checkout` | Customer only | Review cart and place order |
| `/orders` | Customer only | Order history and tracking |
| `/orders/[id]` | Customer only | Single order detail view |
| `/reservations` | Customer only | Book a table |

### Staff Routes
| Path | Access | Description |
|---|---|---|
| `/staff/kitchen` | Staff + Manager | Kitchen Display System (KDS) |
| `/staff/queue` | Staff + Manager | Queue management view |

### Manager Routes
| Path | Access | Description |
|---|---|---|
| `/manager` | Manager only | Live dashboard & analytics |
| `/manager/inventory` | Manager only | Menu item management |
| `/manager/tables` | Manager only | Table & reservation overview |

### Auth & Public
| Path | Access | Description |
|---|---|---|
| `/login` | Public | Sign in (email + Google OAuth) |
| `/signup` | Public | Create account |
| `/logout` | Authenticated | Secure sign-out flow |
| `/dashboard` | All roles | Role-aware hub |

### API Routes
| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/auth/profile` | `POST` | Public | Create user profile on sign-up |
| `/api/orders` | `POST` | Customer | Place an order (validated + rate-limited) |
| `/api/menu/[id]` | `PUT` | Staff / Manager | Toggle menu item availability |
| `/api/reservations` | `POST` | Customer | Create a reservation (validated + rate-limited) |
| `/api/ai/assistant` | `POST` | Authenticated | AI assistant endpoint |

---

## 🔒 Role-Based Access Matrix

| Route | Customer | Staff | Manager |
|---|:---:|:---:|:---:|
| `/menu` `/orders` `/reservations` `/checkout` | ✅ | ❌ → `/dashboard` | ❌ → `/dashboard` |
| `/staff/*` | ❌ → `/dashboard` | ✅ | ✅ |
| `/manager/*` | ❌ → `/dashboard` | ❌ → `/dashboard` | ✅ |
| `/dashboard` | ✅ | ✅ | ✅ |
| `PUT /api/menu/[id]` | ❌ 403 | ✅ | ✅ |
| `POST /api/orders` | ✅ | ❌ 403 | ❌ 403 |
| `POST /api/reservations` | ✅ | ❌ 403 | ❌ 403 |

---

## ⚡ Real-Time Architecture

PLATR uses **Supabase Realtime** WebSockets with PostgreSQL `LISTEN/NOTIFY` to push live updates across all clients with zero polling.

```
Customer places order
        │
        ▼
  POST /api/orders  ──►  Supabase DB (orders table)
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
             KDS Board     Manager      Orders
            (new toast)   Dashboard     Page
           auto-updates   live metrics  live status
```

**Realtime hooks** (`lib/supabaseHooks.ts`):
- `useRealtimeOrders()` — subscribes to all order changes
- `useRealtimeMenuItems()` — subscribes to menu item availability changes
- `useRealtimeReservations()` — subscribes to reservation changes

---

## 🚀 Quick Start

**Prerequisites:** Node.js 18+, a [Supabase](https://supabase.com) project

```bash
# 1. Clone the repo
git clone https://github.com/yugdhaigude876/Vibeathon-6.0.git
cd Vibeathon-6.0

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.local.example .env.local
# Edit .env.local and add your Supabase credentials:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 4. Start the dev server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** — you'll be redirected to `/login` if not authenticated.

---

## 🗄️ Database Schema

### `profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK — mirrors `auth.users.id` |
| `email` | `text` | User email |
| `full_name` | `text` | Optional display name |
| `avatar_url` | `text` | Optional avatar |
| `role` | `text` | `customer` / `staff` / `manager` |
| `restaurant_id` | `uuid` | Nullable FK to restaurants |
| `created_at` | `timestamptz` | Auto-set |
| `updated_at` | `timestamptz` | Auto-set |

### `orders`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `customer_id` | `uuid` | FK → `auth.users.id` |
| `status` | `text` | `pending / preparing / ready / completed` |
| `total_amount` | `numeric` | Server-calculated (tamper-proof) |
| `notes` | `text` | Optional order notes |
| `table_number` | `text` | Optional |
| `created_at` | `timestamptz` | Auto-set |

### `order_items`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `order_id` | `uuid` | FK → `orders.id` |
| `menu_item_id` | `uuid` | FK → `menu_items.id` |
| `quantity` | `int` | |
| `unit_price` | `numeric` | Server-enforced price |

### `menu_items`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `name` | `text` | Item name |
| `price` | `numeric` | Canonical price |
| `is_available` | `bool` | Toggled by staff/manager |
| `category` | `text` | Optional grouping |

### `reservations`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `customer_id` | `uuid` | FK → `auth.users.id` (server-set) |
| `reservation_date` | `date` | Must be today or future |
| `reservation_time` | `time` | Must be 11 AM – 10 PM |
| `party_size` | `int` | Must be 1–10 |
| `status` | `text` | `confirmed / cancelled` |

---

## 🛡️ Supabase RLS Policies

Run the following SQL in your Supabase SQL Editor to enable Row Level Security:

```sql
-- ORDERS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers view own orders" ON orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "API can insert orders" ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Staff view all orders" ON orders FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('staff', 'manager')
);
CREATE POLICY "Staff update order status" ON orders FOR UPDATE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('staff', 'manager')
);

-- MENU ITEMS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view menu" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Staff can update menu" ON menu_items FOR UPDATE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('staff', 'manager')
);

-- RESERVATIONS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers view own reservations" ON reservations FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customers create reservations" ON reservations FOR INSERT WITH CHECK (
  auth.uid() = customer_id AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'customer'
);
CREATE POLICY "Staff view all reservations" ON reservations FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('staff', 'manager')
);

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Auth creates profiles" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Staff view all profiles" ON profiles FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('staff', 'manager')
);
```

---

## 🧩 Project Structure

```
PLATR/
├── app/
│   ├── (auth)/
│   │   ├── login/              Sign in (email + Google OAuth)
│   │   ├── signup/             Account creation + profile seeding
│   │   └── logout/             Secure sign-out + redirect
│   ├── api/
│   │   ├── auth/profile/       POST — create customer profile
│   │   ├── orders/             POST — place order (role + rate limited)
│   │   ├── menu/[id]/          PUT — toggle availability (staff/manager only)
│   │   ├── reservations/       POST — book table (validated + rate limited)
│   │   └── ai/assistant/       POST — AI assistant
│   ├── checkout/               Cart review + order placement
│   ├── dashboard/              Role-aware hub
│   ├── manager/                Manager dashboard, inventory, tables
│   ├── menu/                   Customer menu browse
│   ├── orders/                 Order history + [id] detail
│   ├── reservations/           Table booking
│   └── staff/
│       ├── kitchen/            KDS — two-column live order board
│       └── queue/              Staff queue view
├── components/
│   ├── Navigation.tsx          App chrome (desktop nav + mobile sheet)
│   ├── CartSheet.tsx           Sliding cart drawer
│   └── ui/                     Radix UI primitives (buttons, cards, dialogs…)
├── context/
│   └── cartContext.tsx         Cart state with localStorage persistence
├── hooks/
│   ├── useRoleGuard.ts         Client-side role enforcement hook
│   └── use-toast.ts            Toast notification hook
├── lib/
│   ├── auth.ts                 signUp / signIn / signOut helpers
│   ├── supabase.ts             Browser Supabase client
│   ├── supabaseHooks.ts        useRealtimeOrders / MenuItems / Reservations
│   ├── rateLimiter.ts          In-memory per-user rate limiting
│   ├── requestValidation.ts    Reusable API validation helpers
│   └── utils.ts                cn() class-merge utility
└── middleware.ts               Edge RBAC — enforces routing by role
```

---

## 🧪 Demo Accounts

| Portal | Role | Email | Password | Landing |
|---|---|---|---|---|
| **Manager** | `manager` | `manager@platr.com` | `ManagerPass123!` | `/manager` |
| **Staff / Kitchen** | `staff` | `staff@platr.com` | `StaffPass123!` | `/staff/kitchen` |
| **Customer** | `customer` | Google OAuth or email sign-up | Self-registered | `/menu` |

To assign roles to existing accounts:
```sql
UPDATE profiles SET role = 'manager' WHERE email = 'manager@platr.com';
UPDATE profiles SET role = 'staff'   WHERE email = 'staff@platr.com';
```

---

## 🔧 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server → `localhost:3000` |
| `npm run build` | Production build with type checking |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint check |

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15.1 (App Router) |
| **Language** | TypeScript 5 |
| **Auth & Database** | Supabase (Auth + PostgreSQL + Realtime) |
| **ORM** | Supabase JS Client (`@supabase/ssr`) |
| **Styling** | Tailwind CSS 3 |
| **UI Primitives** | Radix UI + Lucide Icons |
| **State** | React Context (cart), React hooks (realtime) |
| **Security** | Edge Middleware + API Guards + RLS + Rate Limiting |

---

## 🗺️ Roadmap

- [ ] **AI Menu Assistant** — natural-language item recommendations via `/api/ai/assistant`
- [ ] **Push Notifications** — browser push for order status updates
- [ ] **Multi-restaurant Support** — tenant isolation per `restaurant_id`
- [ ] **Analytics Dashboard** — revenue charts, peak hours, popular items
- [ ] **QR Code Ordering** — scan table QR → auto-fill table number in cart
- [ ] **Loyalty Points System** — reward repeat customers
- [ ] **Mobile App** — React Native companion for staff
- [ ] **Redis Rate Limiting** — replace in-memory limiter for multi-instance deployments
- [ ] **Webhook Support** — notify POS systems on order events

---

## 📄 License

MIT — see [LICENSE](./LICENSE).

<br />

<div align="center">
  <sub>Built with ❤️ for <strong>Vibeathon 6.0</strong> · Powered by Next.js + Supabase</sub>
</div>
