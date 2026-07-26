import { create } from 'zustand'

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
  role: 'customer' | 'staff' | 'manager' | 'admin'
  branch: string
  status: 'active' | 'suspended' | 'deactivated'
  createdAt: string
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

  // AI Insights
  insights: AIInsightCard[]

  // Financial Metrics
  financials: {
    totalRevenue: number
    revenueToday: number
    revenueThisWeek: number
    revenueThisMonth: number
    totalProfit: number
    foodCost: number
    labourCost: number
    operatingExpenses: number
    netProfitMargin: number
  }
}

const INITIAL_BRANCHES: Branch[] = [
  { id: 'b1', name: 'Luft Main Dining (Bandra)', location: 'Bandra West, Mumbai', revenueToday: 148500, activeOrders: 14, tableOccupancyRate: 85, status: 'active' },
  { id: 'b2', name: 'Luft Rooftop Lounge (Juhu)', location: 'Juhu Tara Road, Mumbai', revenueToday: 192000, activeOrders: 19, tableOccupancyRate: 92, status: 'busy' },
  { id: 'b3', name: 'Luft Express (Powai)', location: 'Hiranandani, Powai', revenueToday: 84000, activeOrders: 8, tableOccupancyRate: 60, status: 'active' },
]

const INITIAL_USERS: UserAccount[] = [
  { id: 'u1', name: 'Sylborn Furtado', email: 'sylbornfurtado19@gmail.com', role: 'manager', branch: 'Luft Main Dining (Bandra)', status: 'active', createdAt: '2026-01-10' },
  { id: 'u2', name: 'Alex Rivera', email: 'staff@platr.com', role: 'staff', branch: 'Luft Main Dining (Bandra)', status: 'active', createdAt: '2026-02-01' },
  { id: 'u3', name: 'Manager Samira', email: 'manager@platr.com', role: 'manager', branch: 'Luft Rooftop Lounge (Juhu)', status: 'active', createdAt: '2026-01-15' },
  { id: 'u4', name: 'Aarav Sharma', email: 'aarav@gmail.com', role: 'customer', branch: 'Luft Main Dining (Bandra)', status: 'active', createdAt: '2026-03-05' },
]

const INITIAL_CUSTOMERS: CustomerCRM[] = [
  { id: 'c1', name: 'Aarav Sharma', email: 'aarav@gmail.com', phone: '+91 98201 44512', totalOrders: 18, lifetimeValue: 34200, avgOrderValue: 1900, rating: 4.9, rewardPoints: 1450, tier: 'VIP', status: 'active' },
  { id: 'c2', name: 'Priya Mehta', email: 'priya@gmail.com', phone: '+91 99302 11098', totalOrders: 12, lifetimeValue: 18600, avgOrderValue: 1550, rating: 4.8, rewardPoints: 890, tier: 'Platinum', status: 'active' },
  { id: 'c3', name: 'Rohan Gupta', email: 'rohan@gmail.com', phone: '+91 98112 33455', totalOrders: 6, lifetimeValue: 8400, avgOrderValue: 1400, rating: 4.5, rewardPoints: 320, tier: 'Gold', status: 'active' },
]

const INITIAL_CAMPAIGNS: MarketingCampaign[] = [
  { id: 'm1', name: 'Weekend Luft Gourmet Special', code: 'LUFT10', discount: '10% OFF', type: 'Coupon', redemptions: 142, revenueGenerated: 128000, status: 'active' },
  { id: 'm2', name: 'PLATR VIP Dining Pass', code: 'PLATR20', discount: '20% OFF', type: 'Promo', redemptions: 88, revenueGenerated: 94000, status: 'active' },
  { id: 'm3', name: 'Midnight Sushi Flash Sale', code: 'SUSHI30', discount: '30% OFF', type: 'Flash Sale', redemptions: 64, revenueGenerated: 58000, status: 'ended' },
]

const INITIAL_INSIGHTS: AIInsightCard[] = [
  { id: 'ai-1', title: 'High Truffle Mushroom Demand Forecast', category: 'Demand', description: 'Weekend reservations indicate a +45% spike in Dimsum & Tapas orders.', impact: 'High', actionableSuggestion: 'Increase Truffle Oil & Mushroom stock orders by 2.5kg before Friday.' },
  { id: 'ai-2', title: 'Food Waste Reduction Warning', category: 'Waste', description: 'Avocado inventory stock-out risk detected during 8:00 PM peak dining hours.', impact: 'Critical', actionableSuggestion: 'Reallocate 4 units from Juhu branch or trigger immediate supplier restock.' },
  { id: 'ai-3', title: 'Dynamic Pricing Recommendation', category: 'Pricing', description: 'Butter Chicken Tacos demand elasticity allows a 5% margin optimization during peak dinner hours.', impact: 'Medium', actionableSuggestion: 'Adjust peak pricing rule from ₹480 to ₹510.' },
]

export const useManagerStore = create<ManagerStoreState>((set) => ({
  branches: INITIAL_BRANCHES,
  selectedBranchId: 'b1',
  setSelectedBranchId: (id) => set({ selectedBranchId: id }),

  users: INITIAL_USERS,
  toggleUserStatus: (userId) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === userId ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' } : u)),
    })),

  customers: INITIAL_CUSTOMERS,
  toggleBlacklistCustomer: (customerId) =>
    set((state) => ({
      customers: state.customers.map((c) => (c.id === customerId ? { ...c, status: c.status === 'active' ? 'blacklisted' : 'active' } : c)),
    })),

  campaigns: INITIAL_CAMPAIGNS,
  insights: INITIAL_INSIGHTS,

  financials: {
    totalRevenue: 4245000,
    revenueToday: 148500,
    revenueThisWeek: 984000,
    revenueThisMonth: 3820000,
    totalProfit: 1240000,
    foodCost: 32, // 32%
    labourCost: 24, // 24%
    operatingExpenses: 18, // 18%
    netProfitMargin: 26, // 26%
  },
}))
