<div align="center">

# 🍽️ PLATR (LUFT POS & Enterprise ERP)

### The Next-Gen Real-Time Restaurant Operating System

**Real-Time Orders · Floor Telemetry · Kitchen KDS Board · Interactive Table Service · Enterprise Manager Command Center**

<br />

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vibeathon-6-0-orcin.vercel.app)

<br />

> **Built for Vibeathon 6.0** — A complete multi-role platform linking customers, floor servers, kitchen chefs, delivery riders, and enterprise managers in real time.

</div>

---

## 🚀 Live Demo & Demo Accounts

**Vercel Production Deployment:** [https://vibeathon-6-0-orcin.vercel.app](https://vibeathon-6-0-orcin.vercel.app)

### Demo Credentials:
| Portal Role | Email | Password | Access URL |
|---|---|---|---|
| **Executive Manager (BETA)** | `manager@platr.com` / `my.manager@platr.com` | `my.manager@platr.com` | `/manager` |
| **Kitchen & Waiter Staff** | `staff@platr.com` / `my.staff@platr.com` | `my.staff@platr.com` | `/staff/kitchen` & `/staff/waiter` |
| **Guest Customer** | Guest Checkout / Direct Login | N/A | `/menu` & `/reservations` |

---

## 🌟 Key Platform Modules

### 🧑‍💼 Customer Experience
- **Interactive Menu & Cart:** Filter dishes, customize notes, and place orders with instant local and WebSocket persistence.
- **Table Reservations:** Reserve dining tables with real-time validation and instant sync to the Manager Dashboard.
- **Order Tracking:** Track order status progression (`pending → preparing → ready → completed / delivered`).

### 🧑‍🍳 Kitchen & Staff Operations
- **Kitchen KDS Board (`/staff/kitchen`):** Dual-view order workflow with status progression, dish cancellation, and real-time audio toast alerts.
- **Floor & Waiter Management (`/staff/waiter`):** Live table grid (`T-01` to `T-06`), interactive quick requests (`+ Water`, `+ Extra Sauce`, `Request Bill`), and individual request resolution ("Mark Done").
- **Delivery Dispatch (`/staff/delivery`):** Assign riders and track delivery order fulfillment.

### 📊 Executive Manager Command Center (`/manager` — BETA v1.0)
- **Live Command Center:** Real-time revenue metrics, SLA fulfillment rates, and top-selling dishes.
- **Live Orders Directory:** Bi-directional sync across Supabase Realtime, Zustand Store, and BroadcastChannels for manual status overrides.
- **Table Reservations Manager:** Real-time visibility into all upcoming guest table bookings.

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
