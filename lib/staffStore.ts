import { create } from 'zustand'
import {
  StaffProfile,
  StaffRole,
  EnterpriseOrder,
  OrderWorkflowStatus,
  WaiterTable,
  CustomerTicketRequest,
  InventoryAlert,
  StaffNotification,
  StaffPerformanceStats,
} from './staffTypes'

interface StaffStoreState {
  // Staff Role & Shift
  profile: StaffProfile
  setRole: (role: StaffRole) => void
  toggleClockIn: () => void
  toggleBreak: () => void

  // Orders State
  orders: EnterpriseOrder[]
  updateOrderStatus: (orderId: string, status: OrderWorkflowStatus) => void
  addOrder: (order: EnterpriseOrder) => void

  // Tables State
  tables: WaiterTable[]
  updateTableStatus: (tableId: string, status: WaiterTable['status']) => void
  assignWaiterToTable: (tableId: string, waiterName: string) => void
  addRequestToTable: (tableId: string, request: string) => void
  clearTableRequests: (tableId: string) => void

  // Customer Requests Ticket Queue
  requests: CustomerTicketRequest[]
  updateRequestStatus: (requestId: string, status: CustomerTicketRequest['status']) => void
  addCustomerRequest: (req: Omit<CustomerTicketRequest, 'id' | 'time' | 'status'>) => void

  // Inventory Alerts
  inventoryAlerts: InventoryAlert[]
  toggleStockStatus: (alertId: string) => void

  // Notifications
  notifications: StaffNotification[]
  markNotificationRead: (id: string) => void

  // Performance Stats
  performance: StaffPerformanceStats
}

const INITIAL_PROFILE: StaffProfile = {
  name: 'Chef Alex Rivera',
  role: 'chef',
  branch: 'Luft Main Dining (Bandra)',
  shift: 'Evening (16:00 - 00:00)',
  avatarUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80',
  clockedIn: true,
  clockInTime: '16:00 PM',
  breakStatus: 'none',
  hoursWorkedToday: 5.5,
  performanceScore: 96,
}

const INITIAL_ORDERS: EnterpriseOrder[] = [
  {
    id: 'ord-101',
    displayId: '#LUFT-101',
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    status: 'preparing',
    orderType: 'dine_in',
    customerName: 'Aarav Sharma',
    tableNumber: 'T-04',
    totalAmount: 1840,
    estimatedPrepMinutes: 15,
    priority: 'urgent',
    isVip: true,
    specialInstructions: 'Make Asian Tapas extra spicy. Less oil on tacos.',
    items: [
      { id: '1', name: 'Butter Chicken Tacos', quantity: 2, price: 480, spiceLevel: 'Medium' },
      { id: '2', name: 'Truffle Mushroom Dimsum', quantity: 1, price: 540, allergies: ['Gluten'] },
      { id: '3', name: 'Charcoal Grilled Paneer', quantity: 1, price: 340, spiceLevel: 'Spicy' },
    ],
  },
  {
    id: 'ord-102',
    displayId: '#LUFT-102',
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
    status: 'pending',
    orderType: 'delivery',
    customerName: 'Priya Mehta',
    phone: '+91 98201 44512',
    address: 'Flat 402, Sea View Towers, Carter Road, Bandra West',
    totalAmount: 1250,
    estimatedPrepMinutes: 20,
    priority: 'normal',
    isVip: false,
    otp: '4821',
    assignedDeliveryStaff: 'Vikram Singh',
    items: [
      { id: '4', name: 'Grande Burrito Bowl', quantity: 1, price: 590, spiceLevel: 'Mild' },
      { id: '5', name: 'Chipotle Chicken Quesadilla', quantity: 1, price: 660 },
    ],
  },
  {
    id: 'ord-103',
    displayId: '#LUFT-103',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    status: 'ready',
    orderType: 'dine_in',
    customerName: 'Rohan Gupta',
    tableNumber: 'T-02',
    totalAmount: 2400,
    estimatedPrepMinutes: 12,
    priority: 'normal',
    isVip: false,
    items: [
      { id: '6', name: 'Avocado Tartare Tostadas', quantity: 2, price: 520 },
      { id: '7', name: 'Smoked Salmon Sushi Roll', quantity: 2, price: 680 },
    ],
  },
  {
    id: 'ord-104',
    displayId: '#LUFT-104',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    status: 'delivered',
    orderType: 'pickup',
    customerName: 'Neha Kapoor',
    phone: '+91 99302 11098',
    totalAmount: 890,
    estimatedPrepMinutes: 10,
    priority: 'normal',
    isVip: false,
    items: [
      { id: '8', name: 'Crispy Truffle Fries', quantity: 2, price: 320 },
      { id: '9', name: 'Sparkling Citrus Cooler', quantity: 1, price: 250 },
    ],
  },
]

const INITIAL_TABLES: WaiterTable[] = [
  { id: 't1', tableNumber: 'T-01', capacity: 2, occupancy: 2, status: 'occupied', assignedWaiter: 'Rahul Verma', currentOrderId: 'ord-105', currentBillAmount: 1150, customerRequests: ['Water', 'Extra Sauce'] },
  { id: 't2', tableNumber: 'T-02', capacity: 4, occupancy: 4, status: 'billing', assignedWaiter: 'Rahul Verma', currentOrderId: 'ord-103', currentBillAmount: 2400, customerRequests: ['Print Bill'] },
  { id: 't3', tableNumber: 'T-03', capacity: 6, occupancy: 0, status: 'available', currentBillAmount: 0, customerRequests: [] },
  { id: 't4', tableNumber: 'T-04', capacity: 4, occupancy: 3, status: 'occupied', assignedWaiter: 'Simran Kaur', currentOrderId: 'ord-101', currentBillAmount: 1840, customerRequests: ['Call Waiter'] },
  { id: 't5', tableNumber: 'T-05', capacity: 2, occupancy: 0, status: 'reserved', currentBillAmount: 0, customerRequests: [], notes: 'Reserved for 8:30 PM (Mr. Bajaj)' },
  { id: 't6', tableNumber: 'T-06', capacity: 8, occupancy: 0, status: 'cleaning', currentBillAmount: 0, customerRequests: [] },
]

const INITIAL_REQUESTS: CustomerTicketRequest[] = [
  { id: 'req-1', tableNumber: 'T-04', type: 'Call Waiter', note: 'Needs recommendation on wine pairing', time: '2 mins ago', status: 'pending', priority: 'urgent', assignedStaff: 'Simran Kaur' },
  { id: 'req-2', tableNumber: 'T-01', type: 'Extra Sauce', note: 'Chipotle mayo for fries', time: '5 mins ago', status: 'in_progress', priority: 'normal', assignedStaff: 'Rahul Verma' },
  { id: 'req-3', tableNumber: 'T-02', type: 'Water', note: 'Warm water with lemon', time: '10 mins ago', status: 'completed', priority: 'normal', assignedStaff: 'Rahul Verma' },
  { id: 'req-4', tableNumber: 'T-04', type: 'Birthday Celebration', note: 'Bring dessert candle & song at 9 PM', time: '12 mins ago', status: 'pending', priority: 'high' },
]

const INITIAL_INVENTORY: InventoryAlert[] = [
  { id: 'inv-1', ingredient: 'Truffle Oil (500ml)', remainingQty: '120 ml', expectedOutTime: 'In ~2 hours', priority: 'critical', isOutOfStock: false },
  { id: 'inv-2', ingredient: 'Fresh Avocado', remainingQty: '4 units', expectedOutTime: 'In ~1 hour', priority: 'high', isOutOfStock: false },
  { id: 'inv-3', ingredient: 'Paneer Block', remainingQty: '0 kg', expectedOutTime: 'Depleted', priority: 'critical', isOutOfStock: true },
  { id: 'inv-4', ingredient: 'Chipotle Sauce', remainingQty: '450 ml', expectedOutTime: 'In ~5 hours', priority: 'medium', isOutOfStock: false },
]

const INITIAL_NOTIFICATIONS: StaffNotification[] = [
  { id: 'n1', title: '🚨 VIP Table T-04 Order', message: 'Order #LUFT-101 requires extra spice & priority prep.', timestamp: '8m ago', type: 'vip', read: false },
  { id: 'n2', title: '⚠️ Low Stock Alert', message: 'Truffle Oil is below critical threshold (120ml left).', timestamp: '15m ago', type: 'inventory', read: false },
  { id: 'n3', title: '🎂 Celebration Request', message: 'Table T-04 requested Birthday Celebration prep.', timestamp: '12m ago', type: 'request', read: true },
]

export const useStaffStore = create<StaffStoreState>((set) => ({
  profile: INITIAL_PROFILE,
  setRole: (role) =>
    set((state) => ({
      profile: {
        ...state.profile,
        role,
        name:
          role === 'chef'
            ? 'Chef Alex Rivera'
            : role === 'cashier'
            ? 'Cashier Ananya Roy'
            : role === 'waiter'
            ? 'Waiter Rahul Verma'
            : role === 'delivery'
            ? 'Rider Vikram Singh'
            : 'Manager Samira Merchant',
      },
    })),
  toggleClockIn: () =>
    set((state) => ({
      profile: {
        ...state.profile,
        clockedIn: !state.profile.clockedIn,
        clockInTime: !state.profile.clockedIn ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
      },
    })),
  toggleBreak: () =>
    set((state) => ({
      profile: {
        ...state.profile,
        breakStatus: state.profile.breakStatus === 'break' ? 'none' : 'break',
      },
    })),

  orders: INITIAL_ORDERS,
  updateOrderStatus: (orderId, status) =>
    set((state) => ({
      orders: state.orders.map((ord) => (ord.id === orderId ? { ...ord, status } : ord)),
    })),
  addOrder: (order) =>
    set((state) => ({
      orders: [order, ...state.orders],
    })),

  tables: INITIAL_TABLES,
  updateTableStatus: (tableId, status) =>
    set((state) => ({
      tables: state.tables.map((tbl) => (tbl.id === tableId ? { ...tbl, status } : tbl)),
    })),
  assignWaiterToTable: (tableId, waiterName) =>
    set((state) => ({
      tables: state.tables.map((tbl) => (tbl.id === tableId ? { ...tbl, assignedWaiter: waiterName } : tbl)),
    })),
  addRequestToTable: (tableId, request) =>
    set((state) => ({
      tables: state.tables.map((tbl) =>
        tbl.id === tableId ? { ...tbl, customerRequests: Array.from(new Set([...tbl.customerRequests, request])) } : tbl
      ),
    })),
  clearTableRequests: (tableId) =>
    set((state) => ({
      tables: state.tables.map((tbl) => (tbl.id === tableId ? { ...tbl, customerRequests: [] } : tbl)),
    })),

  requests: INITIAL_REQUESTS,
  updateRequestStatus: (requestId, status) =>
    set((state) => ({
      requests: state.requests.map((req) => (req.id === requestId ? { ...req, status } : req)),
    })),
  addCustomerRequest: (req) =>
    set((state) => ({
      requests: [
        {
          ...req,
          id: `req-${Date.now()}`,
          time: 'Just now',
          status: 'pending',
        },
        ...state.requests,
      ],
    })),

  inventoryAlerts: INITIAL_INVENTORY,
  toggleStockStatus: (alertId) =>
    set((state) => ({
      inventoryAlerts: state.inventoryAlerts.map((inv) =>
        inv.id === alertId ? { ...inv, isOutOfStock: !inv.isOutOfStock } : inv
      ),
    })),

  notifications: INITIAL_NOTIFICATIONS,
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  performance: {
    ordersCompleted: 42,
    avgCookingTimeMins: 11.4,
    avgServingTimeMins: 4.2,
    customerRating: 4.9,
    cancelledOrders: 1,
    delayedOrders: 2,
    efficiencyScore: 96,
    rank: 2,
  },
}))
