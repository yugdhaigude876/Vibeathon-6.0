<div align="center">

# 🍽️ PLATR (LUFT POS & Enterprise ERP)

### The Next-Gen Real-Time Restaurant Operating System — Phase 2 Release

**Real-Time Orders · Floor Telemetry · Kitchen KDS Board · Interactive Table Service · Enterprise Manager Command Center · Digital VIP Pass QR Generator · 5-Second Automated Payment Gateway**

<br />

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vibeathon-6-0-orcin.vercel.app)

<br />

> **Built for Vibeathon 6.0 (Phase 1 & Phase 2 Selection)** — A complete multi-role enterprise platform linking customers, floor servers, kitchen chefs, cashier POS, delivery riders, and executive managers in real time.

</div>

---

## 🌟 What's New in Phase 2

### 💳 1. 5-Second Automated Payment Gateway Simulation
- **Universal 5-Second Payment Window**: As per Phase 2 requirements, all payment entry points (Customer Checkout, Cashier POS Register, and Order Bill Settlement) display an active 5-second verification countdown (`5s ➔ 4s ➔ 3s ➔ 2s ➔ 1s`).
- **Auto-Approval & Auto-Close**: Payment confirmation is assumed within 5 seconds, after which the payment modal automatically closes, marks the order as `COMPLETED & PAID`, and redirects to live order tracking.

### 🎟️ 2. Digital Royal VIP Reservation Pass & Host QR Scanner
- **Dynamic VIP Ticket Pass (`/reservations`)**: Every confirmed table reservation generates a downloadable **Royal VIP Pass** with a dynamic QR Code, Pass Reference (`#VIP-XXXXXX`), guest count, date/time, assigned table (`Table T-04 VIP Lounge`), Print (`window.print()`), and Share options.
- **Host VIP Pass Check-In Scanner (`/manager`)**: Staff and managers can scan or enter customer VIP Pass QR codes in the Table Reservations manager tab to check in guests and assign tables instantly.

### ⏱️ 3. Preparation Progress Stepper with Dotted Connecting Lines
- **Dotted Connector Track (`/orders/[id]`)**: Styled with explicit gold-accented dotted connector lines between milestone nodes for both Desktop (horizontal) and Mobile (vertical) viewports.
- **High-Contrast Status Badges**: Dynamic status badges (`COMPLETED ✓` in glowing emerald green, `ACTIVE ⚡` in gold, `PASSED ✓`, `PENDING`).

### 💻 4. Fast Cashier POS Register & Multi-Payment Split (`/staff/cashier`)
- **Touchscreen Register Panel**: Quick bill print, coupon discounts (`LUFT10`, `ROYAL20`), tip calculator (0%, 5%, 10%, 15%), and cash change due calculator.
- **Multi-Split Mode**: Allocate exact payment splits across Cash, Credit Card, UPI QR, and Loyalty Points.

### 📊 5. Fully Synchronized Executive Management Command Center (`/manager`)
- **Executive Revenue KPI Cards**: Live Today's Revenue, Weekly Revenue, Average Order Value (AOV), Completed Orders SLA count, and Business Health Score.
- **Live Orders Directory**: Filterable table with multi-channel real-time status progression (`Pending ➔ Preparing ➔ Ready ➔ Completed`).
- **Luft Menu Stock Control**: Live `In Stock` / `Out of Stock` toggles connected directly to the Luft Main Dining (Bandra) menu.
- **Table Occupancy & Heatmap**: 12 tables displaying live floor statuses (*Available, Occupied, Reserved*).

### 🔔 6. 1-Click "Call Waiter" Service Bell Widget
- **Instant Table Assistance (`/orders/[id]`)**: Customers tracking their active dining order can tap 1-click assistance buttons:
  - 💧 **Bring Water**
  - 🧻 **Extra Napkins**
  - 🍴 **Request Cutlery**
  - 🙋 **Call Host to Table**
- **Real-Time Staff Broadcast**: Instantly broadcasts a priority request alert via `BroadcastChannel` to the Waiter Dashboard (`/staff/waiter`).


---

## 🚀 Live Demo & Demo Accounts

**Vercel Production Deployment:** [https://vibeathon-6-0-orcin.vercel.app](https://vibeathon-6-0-orcin.vercel.app)

### Demo Credentials:
| Portal Role | Email | Password | Access URL |
|---|---|---|---|
| **Executive Manager (Phase 2)** | `manager@platr.com` / `my.manager@platr.com` | `my.manager@platr.com` | `/manager` |
| **Kitchen KDS & Waiter Staff** | `staff@platr.com` / `my.staff@platr.com` | `my.staff@platr.com` | `/staff/kitchen` & `/staff/waiter` |
| **Fast Cashier POS Register** | `staff@platr.com` | `my.staff@platr.com` | `/staff/cashier` |
| **Guest Customer** | Guest Checkout / Direct Login | N/A | `/menu` & `/reservations` |

---

## 🌟 Key Platform Modules

### 🧑‍💼 Customer Experience
- **Interactive Menu & Cart (`/menu`):** Filter dishes, customize notes, and place orders with instant local and WebSocket persistence.
- **Table Reservations & VIP Pass (`/reservations`):** Reserve dining tables, generate Digital Royal VIP Passes with dynamic QR Codes, and view booking history.
- **Order Tracking & Bill Settlement (`/orders/[id]`):** Track real-time preparation progress with dotted connecting lines, and settle bills via UPI QR, Card, or Cash using the 5-second auto-closing payment window.

### 🧑‍🍳 Kitchen, Cashier & Staff Operations
- **Fast Cashier POS Register (`/staff/cashier`):** Multi-split payments (Cash, Card, UPI, Loyalty Points), tip calculator, coupon code application, and 5-second QR verification.
- **Kitchen KDS Board (`/staff/kitchen`):** Live order workflow (`Pending ➔ Preparing ➔ Ready ➔ Completed`), dish cancellation, prep timers, and audio alerts.
- **Floor & Waiter Management (`/staff/waiter`):** Interactive 12-table floor grid, customer request ticket queue, and bill split helper.
- **Delivery Dispatch (`/staff/delivery`):** Assign delivery riders and verify delivery OTPs.

### 📊 Executive Manager Command Center (`/manager`)
- **Executive Revenue Metrics:** Live Today's Revenue, Weekly Revenue, Average Order Value (AOV), Completed SLA Count, and Health Score.
- **Live Orders Directory:** Bi-directional real-time sync across Supabase Realtime, Zustand Store, and BroadcastChannels.
- **Host VIP Pass Scanner:** Scan/verify guest VIP passes for priority table check-in.
- **Luft Menu Stock Control:** Instant live availability toggles for Luft Main Dining menu items.

---

## 🔒 Role-Based Security & Access Control

| Layer | Implementation |
|---|---|
| **Middleware RBAC** | Next.js Edge Middleware enforces role-based routing on every request |
| **API Role Guards** | Every API endpoint validates the caller's role via `profiles` table |
| **Client-Side Guards** | `useRoleGuard()` hook prevents unauthorized component rendering |
| **Rate Limiting** | In-memory rate limiter: 10 orders/min, 5 reservations/min, 30 menu toggles/min |
| **Price Validation** | Server-side price enforcement — client prices are always cross-checked |
| **Customer Isolation** | `customer_id` always set server-side from `auth.uid()` |
| **Supabase RLS** | Row Level Security policies isolate data per user and role at the DB layer |

---

## 🗺️ Application Routes

### Customer Routes
| Path | Access | Description |
|---|---|---|
| `/menu` | Customer only | Browse menu, add to cart |
| `/checkout` | Customer only | Review cart & 5-second auto-close payment checkout |
| `/orders` | Customer only | Order history and tracking |
| `/orders/[id]` | Customer only | Live order tracker with dotted progress stepper & Pay Bill modal |
| `/reservations` | Customer only | Book a table & generate Digital VIP Ticket Pass |

### Staff Routes
| Path | Access | Description |
|---|---|---|
| `/staff/kitchen` | Staff + Manager | Kitchen Display System (KDS) |
| `/staff/cashier` | Staff + Manager | Fast Cashier POS Register & Multi-Payment Split |
| `/staff/waiter` | Staff + Manager | Floor plan tables & customer request queue |
| `/staff/delivery` | Staff + Manager | Delivery rider dispatch & OTP verification |
| `/staff/dashboard` | Staff + Manager | Staff navigation hub |

### Manager Routes
| Path | Access | Description |
|---|---|---|
| `/manager` | Manager only | Executive Command Center, live orders, host VIP pass scanner, stock control |

---

## ⚡ Real-Time Architecture

PLATR uses **Supabase Realtime** WebSockets with PostgreSQL `LISTEN/NOTIFY`, `BroadcastChannel('luft_live_orders_channel')`, and CustomEvents to push live updates across all clients with zero page refreshes.

```
Customer places order / pays bill
        │
        ▼
   POST /api/orders  ──►  Supabase DB (orders table)
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
             KDS Kitchen    Manager      Cashier POS
             (live toast)  Dashboard    & Order Tracker
            auto-updates  live revenue   status synced
```

---

## 🚀 Quick Start

**Prerequisites:** Node.js 18+, a [Supabase](https://supabase.com) project

```bash
# 1. Clone the repo
git clone https://github.com/yugdhaigude876/Vibeathon-6.0.git
cd Vibeathon-6.0

# 2. Install dependencies
npm install

# 3. Configure environment (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 4. Start dev server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** — you'll be redirected to `/login` if not authenticated.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15.1 (App Router) |
| **Hosting** | Vercel Serverless Edge Platform |
| **Language** | TypeScript 5 |
| **Auth & Database** | Supabase (Auth + PostgreSQL + Realtime WebSockets) |
| **State & Sync** | Zustand + BroadcastChannel + LocalStorage Event Sync |
| **Styling & Icons** | Tailwind CSS + Lucide Icons + Glassmorphic Royal Theme |

---

<div align="center">
  <sub>Built with ❤️ for <strong>Vibeathon 6.0 (Phase 2 Selection)</strong> · Powered by Next.js + Supabase + Vercel</sub>
</div>
