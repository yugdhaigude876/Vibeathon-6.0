import { create } from './createStore'

export interface Branch {
  id: string
  name: string
  location: string
  revenueToday: number
  activeOrders: number
  tableOccupancyRate: number
  status: 'active' | 'busy' | 'closed'
}

export interface UserAccount {
  id: string
  name: string
  email: string
  role: 'customer' | 'chef' | 'cashier' | 'waiter' | 'delivery' | 'manager' | 'admin' | 'staff'
  branch: string
  status: 'active' | 'suspended' | 'deactivated'
  createdAt: string
  attendanceRate?: number
  ordersProcessed?: number
}

export interface CustomerCRM {
  id: string
  name: string
  email: string
  phone: string
  totalOrders: number
  lifetimeValue: number
  avgOrderValue: number
  rating: number
  rewardPoints: number
  tier: 'Gold' | 'Platinum' | 'VIP' | 'Regular'
  status: 'active' | 'blacklisted'
  favouriteCategory?: string
  lastVisit?: string
}

export interface MarketingCampaign {
  id: string
  name: string
  code: string
  discount: string
  type: 'Coupon' | 'Promo' | 'Flash Sale' | 'Happy Hour'
  redemptions: number
  revenueGenerated: number
  status: 'active' | 'scheduled' | 'ended'
}

export interface AIInsightCard {
  id: string
  title: string
  category: 'Demand' | 'Inventory' | 'Waste' | 'Staffing' | 'Pricing'
  description: string
  impact: 'High' | 'Medium' | 'Critical'
  actionableSuggestion: string
  predictionMetric?: string
}

export interface MenuItemMatrix {
  id: string
  name: string
  category: string
  price: number
  costPrice: number
  profitMargin: number
  salesCount: number
  revenue: number
  classification: 'Star' | 'Cash Cow' | 'Puzzle' | 'Dog'
  recommendation: string
}

export interface AuditLogItem {
  id: string
  timestamp: string
  user: string
  role: string
  action: string
  module: string
  details: string
  severity: 'info' | 'warning' | 'critical'
}

interface ManagerStoreState {
  // Branches
  branches: Branch[]
  selectedBranchId: string
  setSelectedBranchId: (id: string) => void

  // Users Management
  users: UserAccount[]
  toggleUserStatus: (userId: string) => void

  // CRM
  customers: CustomerCRM[]
  toggleBlacklistCustomer: (customerId: string) => void

  // Marketing
  campaigns: MarketingCampaign[]

  // AI Insights & Recommendations
  insights: AIInsightCard[]

  // Menu Matrix
  menuMatrix: MenuItemMatrix[]

  // Audit Logs
  auditLogs: AuditLogItem[]
  addAuditLog: (log: Omit<AuditLogItem, 'id' | 'timestamp'>) => void

  // Financial & BI Metrics
  financials: {
    businessHealthScore: number
    totalRevenue: number
    revenueToday: number
    revenueThisWeek: number
    revenueThisMonth: number
    totalProfit: number
    foodCost: number
    labourCost: number
    operatingExpenses: number
    netProfitMargin: number
    gstCollected: number
    refundsProcessed: number
  }

  // Predictive Analytics
  forecasts: {
    tomorrowRevenue: number
    tomorrowOrders: number
    recommendedChefs: number
    expectedPeakHour: string
    predictedWasteKg: number
  }
}

const INITIAL_BRANCHES: Branch[] = [
  { id: 'b1', name: 'Luft Main Dining (Bandra)', location: 'Bandra West, Mumbai', revenueToday: 148500, activeOrders: 14, tableOccupancyRate: 85, status: 'active' },
  { id: 'b2', name: 'Luft Rooftop Lounge (Juhu)', location: 'Juhu Tara Road, Mumbai', revenueToday: 192000, activeOrders: 19, tableOccupancyRate: 92, status: 'busy' },
  { id: 'b3', name: 'Luft Express (Powai)', location: 'Hiranandani, Powai', revenueToday: 84000, activeOrders: 8, tableOccupancyRate: 60, status: 'active' },
]

const INITIAL_USERS: UserAccount[] = [
  { id: 'u1', name: 'Sylborn Furtado', email: 'sylbornfurtado19@gmail.com', role: 'manager', branch: 'Luft Main Dining (Bandra)', status: 'active', createdAt: '2026-01-10', attendanceRate: 98, ordersProcessed: 1420 },
  { id: 'u2', name: 'Alex Rivera', email: 'staff@platr.com', role: 'chef', branch: 'Luft Main Dining (Bandra)', status: 'active', createdAt: '2026-02-01', attendanceRate: 95, ordersProcessed: 890 },
  { id: 'u3', name: 'Manager Samira', email: 'manager@platr.com', role: 'manager', branch: 'Luft Rooftop Lounge (Juhu)', status: 'active', createdAt: '2026-01-15', attendanceRate: 100, ordersProcessed: 1850 },
  { id: 'u4', name: 'Rohan Sharma', email: 'cashier@platr.com', role: 'cashier', branch: 'Luft Express (Powai)', status: 'active', createdAt: '2026-02-12', attendanceRate: 92, ordersProcessed: 640 },
  { id: 'u5', name: 'Priya Verma', email: 'waiter@platr.com', role: 'waiter', branch: 'Luft Main Dining (Bandra)', status: 'active', createdAt: '2026-02-18', attendanceRate: 96, ordersProcessed: 510 },
]

const INITIAL_CUSTOMERS: CustomerCRM[] = [
  { id: 'c1', name: 'Aarav Mehta', email: 'aarav.m@gmail.com', phone: '+91 98200 12345', totalOrders: 42, lifetimeValue: 68400, avgOrderValue: 1628, rating: 4.9, rewardPoints: 2450, tier: 'VIP', status: 'active', favouriteCategory: 'Tandoor & Grills', lastVisit: 'Yesterday' },
  { id: 'c2', name: 'Rhea Kapoor', email: 'rhea.k@yahoo.com', phone: '+91 98201 67890', totalOrders: 28, lifetimeValue: 41200, avgOrderValue: 1471, rating: 4.8, rewardPoints: 1600, tier: 'Platinum', status: 'active', favouriteCategory: 'Woodfired Pizza', lastVisit: '3 days ago' },
  { id: 'c3', name: 'Karan Shah', email: 'karan.s@outlook.com', phone: '+91 98202 54321', totalOrders: 15, lifetimeValue: 21500, avgOrderValue: 1433, rating: 4.7, rewardPoints: 850, tier: 'Gold', status: 'active', favouriteCategory: 'Cocktails', lastVisit: '1 week ago' },
  { id: 'c4', name: 'Ananya Roy', email: 'ananya.r@gmail.com', phone: '+91 98203 99887', totalOrders: 6, lifetimeValue: 7800, avgOrderValue: 1300, rating: 4.2, rewardPoints: 250, tier: 'Regular', status: 'active', favouriteCategory: 'Desserts', lastVisit: '2 weeks ago' },
]

const INITIAL_CAMPAIGNS: MarketingCampaign[] = [
  { id: 'm1', name: 'Weekend Gala 20% OFF', code: 'WEEKEND20', discount: '20%', type: 'Promo', redemptions: 148, revenueGenerated: 182000, status: 'active' },
  { id: 'm2', name: 'Rooftop Sunset Happy Hour', code: 'SUNSET50', discount: 'Flat ₹500', type: 'Happy Hour', redemptions: 92, revenueGenerated: 145000, status: 'active' },
  { id: 'm3', name: 'First Order Delight', code: 'WELCOME100', discount: '₹100 Off', type: 'Coupon', redemptions: 310, revenueGenerated: 215000, status: 'active' },
]

const INITIAL_INSIGHTS: AIInsightCard[] = [
  { id: 'i1', title: 'Peak Demand Alert: Friday 8 PM', category: 'Demand', description: 'Historical data shows 35% surge in cocktail & appetizer orders this Friday night.', impact: 'High', actionableSuggestion: 'Schedule +2 bartenders and prep 30 extra Truffle Fries portions.', predictionMetric: '+35% expected order volume' },
  { id: 'i2', title: 'Ingredient Waste Reduction Opportunity', category: 'Waste', description: 'Avocado inventory shows a 12% unused decay risk within 48 hours.', impact: 'Medium', actionableSuggestion: 'Run a 15% promo on Avocado Crostini & Guacamole Bowls.', predictionMetric: 'Save ₹4,800 in waste' },
  { id: 'i3', title: 'Menu Margin Optimization', category: 'Pricing', description: 'Truffle Pasta has a 78% customer satisfaction score with low price sensitivity.', impact: 'High', actionableSuggestion: 'Increase price by 4.5% to boost gross margin without reducing demand.', predictionMetric: '+₹24,000 monthly profit' },
  { id: 'i4', title: 'Low Stock Auto-Trigger', category: 'Inventory', description: 'San Marzano Tomatocan stock will drop below reorder point by tomorrow noon.', impact: 'Critical', actionableSuggestion: 'Trigger auto-PO to supplier (FreshFarm Co.).', predictionMetric: 'Auto reorder threshold hit' },
]

const INITIAL_MATRIX: MenuItemMatrix[] = [
  { id: 'pm1', name: 'Truffle Mushroom Risotto', category: 'Mains', price: 750, costPrice: 190, profitMargin: 74.6, salesCount: 420, revenue: 315000, classification: 'Star', recommendation: 'Promote as Chef Special' },
  { id: 'pm2', name: 'Classic Woodfired Margherita', category: 'Pizza', price: 550, costPrice: 110, profitMargin: 80.0, salesCount: 680, revenue: 374000, classification: 'Cash Cow', recommendation: 'Maintain high quality & speed' },
  { id: 'pm3', name: 'Smoked Salmon Carpaccio', category: 'Starters', price: 920, costPrice: 420, profitMargin: 54.3, salesCount: 85, revenue: 78200, classification: 'Puzzle', recommendation: 'Pair with wine promo to boost sales' },
  { id: 'pm4', name: 'Steamed Edamame (Salted)', category: 'Sides', price: 380, costPrice: 210, profitMargin: 44.7, salesCount: 60, revenue: 22800, classification: 'Dog', recommendation: 'Replace with Artisanal Garlic Bread' },
]

const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  { id: 'al1', timestamp: '2026-07-27 14:30:12', user: 'admin.manager@platr.com', role: 'manager', action: 'Price Update', module: 'Menu ERP', details: 'Updated Truffle Risotto price from ₹720 to ₹750', severity: 'info' },
  { id: 'al2', timestamp: '2026-07-27 13:15:45', user: 'kitchen.staff@platr.com', role: 'chef', action: 'Inventory Depletion', module: 'Inventory', details: 'Marked 5kg Fresh Basil as consumed', severity: 'info' },
  { id: 'al3', timestamp: '2026-07-27 11:00:00', user: 'admin.manager@platr.com', role: 'admin', action: 'Role Update', module: 'User Management', details: 'Promoted Priya Verma to Senior Waiter', severity: 'warning' },
]

export const useManagerStore = create<ManagerStoreState>((set) => ({
  branches: INITIAL_BRANCHES,
  selectedBranchId: 'b1',
  setSelectedBranchId: (id: string) => set({ selectedBranchId: id }),

  users: INITIAL_USERS,
  toggleUserStatus: (userId: string) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' } : u
      ),
    })),

  customers: INITIAL_CUSTOMERS,
  toggleBlacklistCustomer: (customerId: string) =>
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId ? { ...c, status: c.status === 'active' ? 'blacklisted' : 'active' } : c
      ),
    })),

  campaigns: INITIAL_CAMPAIGNS,

  insights: INITIAL_INSIGHTS,

  menuMatrix: INITIAL_MATRIX,

  auditLogs: INITIAL_AUDIT_LOGS,
  addAuditLog: (log) =>
    set((state) => ({
      auditLogs: [
        {
          id: `al_${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          ...log,
        },
        ...state.auditLogs,
      ],
    })),

  financials: {
    businessHealthScore: 94,
    totalRevenue: 424500,
    revenueToday: 148500,
    revenueThisWeek: 980000,
    revenueThisMonth: 4120000,
    totalProfit: 1324000,
    foodCost: 24.5,
    labourCost: 18.2,
    operatingExpenses: 145000,
    netProfitMargin: 32.1,
    gstCollected: 21225,
    refundsProcessed: 1200,
  },

  forecasts: {
    tomorrowRevenue: 162000,
    tomorrowOrders: 115,
    recommendedChefs: 4,
    expectedPeakHour: '8:00 PM - 9:30 PM',
    predictedWasteKg: 2.1,
  },
}))
