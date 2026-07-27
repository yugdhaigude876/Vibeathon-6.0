import { create } from './createStore'
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
  ExtendedOrderItem,
} from './staffTypes'

interface StaffStoreState {
  // Staff Role & Shift
  profile: StaffProfile
  setRole: (role: StaffRole) => void
  toggleClockIn: () => void
  toggleBreak: () => void
  incrementBreakSeconds: () => void

  // Orders State
  orders: EnterpriseOrder[]
  updateOrderStatus: (orderId: string, status: OrderWorkflowStatus) => void
  rejectOrder: (orderId: string, reason?: string) => void
  dispatchOrder: (orderId: string, riderName?: string) => void
  assignDeliveryRider: (orderId: string, riderName: string) => void
  cancelOrderItem: (orderId: string, itemId: string) => void
  addOrder: (order: EnterpriseOrder) => void

  // Tables State
  tables: WaiterTable[]
  updateTableStatus: (tableId: string, status: WaiterTable['status']) => void
  assignWaiterToTable: (tableId: string, waiterName: string) => void
  reserveTable: (tableId: string, guestName: string, time: string, guestCount: number) => void
  mergeTables: (targetTableId: string, sourceTableId: string) => void
  splitBill: (orderId: string, splitParts: number) => void
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
  clearAllNotifications: () => void

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
  breakSeconds: 0,
  hoursWorkedToday: 5.5,
  performanceScore: 96,
}

const INITIAL_ORDERS: EnterpriseOrder[] = []

const INITIAL_TABLES: WaiterTable[] = [
  { id: 't1', tableNumber: 'T-01', capacity: 2, occupancy: 0, status: 'available', currentBillAmount: 0, customerRequests: [] },
  { id: 't2', tableNumber: 'T-02', capacity: 4, occupancy: 0, status: 'available', currentBillAmount: 0, customerRequests: [] },
  { id: 't3', tableNumber: 'T-03', capacity: 6, occupancy: 0, status: 'available', currentBillAmount: 0, customerRequests: [] },
  { id: 't4', tableNumber: 'T-04', capacity: 4, occupancy: 0, status: 'available', currentBillAmount: 0, customerRequests: [] },
  { id: 't5', tableNumber: 'T-05', capacity: 2, occupancy: 0, status: 'available', currentBillAmount: 0, customerRequests: [] },
  { id: 't6', tableNumber: 'T-06', capacity: 8, occupancy: 0, status: 'available', currentBillAmount: 0, customerRequests: [] },
]

const INITIAL_REQUESTS: CustomerTicketRequest[] = []

const INITIAL_INVENTORY: InventoryAlert[] = [
  { id: 'inv-1', ingredient: 'Truffle Oil (500ml)', remainingQty: '120 ml', expectedOutTime: 'In ~2 hours', priority: 'critical', isOutOfStock: false },
  { id: 'inv-2', ingredient: 'Fresh Avocado', remainingQty: '4 units', expectedOutTime: 'In ~1 hour', priority: 'high', isOutOfStock: false },
]

const INITIAL_NOTIFICATIONS: StaffNotification[] = []

export const useStaffStore = create<StaffStoreState>((set) => ({
  profile: INITIAL_PROFILE,
  setRole: (role: StaffRole) =>
    set((state: StaffStoreState) => ({
      profile: { ...state.profile, role },
    })),
  toggleClockIn: () =>
    set((state: StaffStoreState) => ({
      profile: {
        ...state.profile,
        clockedIn: !state.profile.clockedIn,
        clockInTime: !state.profile.clockedIn ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
      },
    })),
  toggleBreak: () =>
    set((state: StaffStoreState) => ({
      profile: {
        ...state.profile,
        breakStatus: state.profile.breakStatus === 'break' ? 'none' : 'break',
      },
    })),
  incrementBreakSeconds: () =>
    set((state: StaffStoreState) => ({
      profile: {
        ...state.profile,
        breakSeconds: (state.profile.breakSeconds || 0) + 1,
      },
    })),

  orders: INITIAL_ORDERS,
  updateOrderStatus: (orderId: string, status: OrderWorkflowStatus) =>
    set((state: StaffStoreState) => {
      const targetId = (orderId || '').toLowerCase()
      const updatedOrders = state.orders.map((ord: EnterpriseOrder) => {
        const matches =
          (ord.id || '').toLowerCase() === targetId ||
          (ord.displayId || '').toLowerCase() === targetId ||
          (ord.id || '').toLowerCase().includes(targetId) ||
          targetId.includes((ord.id || '').toLowerCase())

        return matches ? { ...ord, status } : ord
      })

      if (typeof window !== 'undefined') {
        try {
          // 1. Sync to local user orders cache
          const localOrders = JSON.parse(localStorage.getItem('platr_user_orders') || '[]')
          const updatedLocal = localOrders.map((o: any) => {
            const matches =
              (o.id || '').toLowerCase() === targetId ||
              (o.displayId || '').toLowerCase() === targetId ||
              (o.id || '').toLowerCase().includes(targetId) ||
              targetId.includes((o.id || '').toLowerCase())

            return matches ? { ...o, status } : o
          })
          localStorage.setItem('platr_user_orders', JSON.stringify(updatedLocal))

          // 2. Broadcast status update across tabs
          if ('BroadcastChannel' in window) {
            const bc = new BroadcastChannel('luft_live_orders_channel')
            bc.postMessage({ type: 'STATUS_UPDATE', orderId, status })
            bc.close()
          }

          // 3. Dispatch local event
          window.dispatchEvent(
            new CustomEvent('luft_order_status_update', {
              detail: { orderId, status, timestamp: Date.now() },
            })
          )

          // 4. Update storage event trigger
          localStorage.setItem(
            'luft_last_status_update',
            JSON.stringify({ orderId, status, broadcastTimestamp: Date.now() })
          )
        } catch (err) {
          console.warn('Live order status sync warning:', err)
        }
      }

      return { orders: updatedOrders }
    }),
  rejectOrder: (orderId: string, reason = 'Kitchen capacity full') =>
    set((state: StaffStoreState) => ({
      orders: state.orders.map((ord: EnterpriseOrder) =>
        ord.id === orderId || ord.displayId === orderId ? { ...ord, status: 'cancelled', cancelledReason: reason } : ord
      ),
      notifications: [
        {
          id: `n-${Date.now()}`,
          title: `❌ Order ${orderId} Cancelled`,
          message: `Order was rejected. Reason: ${reason}`,
          timestamp: 'Just now',
          type: 'cancelled',
          read: false,
        },
        ...state.notifications,
      ],
    })),
  dispatchOrder: (orderId: string, riderName = 'Rider Vikram Singh') =>
    set((state: StaffStoreState) => ({
      orders: state.orders.map((ord: EnterpriseOrder) =>
        ord.id === orderId || ord.displayId === orderId
          ? { ...ord, status: 'picked_up', deliveryStatus: 'out_for_delivery', assignedDeliveryStaff: riderName }
          : ord
      ),
    })),
  assignDeliveryRider: (orderId: string, riderName: string) =>
    set((state: StaffStoreState) => ({
      orders: state.orders.map((ord: EnterpriseOrder) =>
        ord.id === orderId || ord.displayId === orderId ? { ...ord, assignedDeliveryStaff: riderName, deliveryStatus: 'assigned' } : ord
      ),
    })),
  cancelOrderItem: (orderId: string, itemId: string) =>
    set((state: StaffStoreState) => ({
      orders: state.orders.map((ord: EnterpriseOrder) => {
        if (ord.id !== orderId && ord.displayId !== orderId) return ord
        const updatedItems = ord.items.map((item: ExtendedOrderItem) =>
          item.id === itemId ? { ...item, isCancelled: true } : item
        )
        const newTotal = updatedItems
          .filter((i: ExtendedOrderItem) => !i.isCancelled)
          .reduce((sum: number, i: ExtendedOrderItem) => sum + i.price * i.quantity, 0)
        return { ...ord, items: updatedItems, totalAmount: newTotal }
      }),
    })),
  addOrder: (order: EnterpriseOrder) =>
    set((state: StaffStoreState) => ({
      orders: [order, ...state.orders.filter((o) => o.id !== order.id && o.displayId !== order.displayId)],
    })),

  tables: INITIAL_TABLES,
  updateTableStatus: (tableId: string, status: WaiterTable['status']) =>
    set((state: StaffStoreState) => ({
      tables: state.tables.map((tbl: WaiterTable) => {
        if (tbl.id !== tableId) return tbl
        if (status === 'available') {
          return {
            ...tbl,
            status: 'available',
            occupancy: 0,
            currentBillAmount: 0,
            customerRequests: [],
            currentOrderId: undefined,
            notes: undefined,
          }
        }
        return { ...tbl, status }
      }),
// Notifications
  notifications: StaffNotification[]
  markNotificationRead: (id: string) => void
  clearAllNotifications: () => void

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
  breakSeconds: 0,
  hoursWorkedToday: 5.5,
  performanceScore: 96,
}

const INITIAL_ORDERS: EnterpriseOrder[] = []

const INITIAL_TABLES: WaiterTable[] = [
  { id: 't1', tableNumber: 'T-01', capacity: 2, occupancy: 0, status: 'available', currentBillAmount: 0, customerRequests: [] },
  { id: 't2', tableNumber: 'T-02', capacity: 4, occupancy: 0, status: 'available', currentBillAmount: 0, customerRequests: [] },
  { id: 't3', tableNumber: 'T-03', capacity: 6, occupancy: 0, status: 'available', currentBillAmount: 0, customerRequests: [] },
  { id: 't4', tableNumber: 'T-04', capacity: 4, occupancy: 0, status: 'available', currentBillAmount: 0, customerRequests: [] },
  { id: 't5', tableNumber: 'T-05', capacity: 2, occupancy: 0, status: 'available', currentBillAmount: 0, customerRequests: [] },
  { id: 't6', tableNumber: 'T-06', capacity: 8, occupancy: 0, status: 'available', currentBillAmount: 0, customerRequests: [] },
]

const INITIAL_REQUESTS: CustomerTicketRequest[] = []

const INITIAL_INVENTORY: InventoryAlert[] = [
  { id: 'inv-1', ingredient: 'Truffle Oil (500ml)', remainingQty: '120 ml', expectedOutTime: 'In ~2 hours', priority: 'critical', isOutOfStock: false },
  { id: 'inv-2', ingredient: 'Fresh Avocado', remainingQty: '4 units', expectedOutTime: 'In ~1 hour', priority: 'high', isOutOfStock: false },
]

const INITIAL_NOTIFICATIONS: StaffNotification[] = []

export const useStaffStore = create<StaffStoreState>((set) => ({
  profile: INITIAL_PROFILE,
  setRole: (role: StaffRole) =>
    set((state: StaffStoreState) => ({
      profile: { ...state.profile, role },
    })),
  toggleClockIn: () =>
    set((state: StaffStoreState) => ({
      profile: {
        ...state.profile,
        clockedIn: !state.profile.clockedIn,
        clockInTime: !state.profile.clockedIn ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
      },
    })),
  toggleBreak: () =>
    set((state: StaffStoreState) => ({
      profile: {
        ...state.profile,
        breakStatus: state.profile.breakStatus === 'break' ? 'none' : 'break',
      },
    })),
  incrementBreakSeconds: () =>
    set((state: StaffStoreState) => ({
      profile: {
        ...state.profile,
        breakSeconds: (state.profile.breakSeconds || 0) + 1,
      },
    })),

  orders: INITIAL_ORDERS,
  updateOrderStatus: (orderId: string, status: OrderWorkflowStatus) =>
    set((state: StaffStoreState) => {
      const targetId = (orderId || '').toLowerCase()
      const updatedOrders = state.orders.map((ord: EnterpriseOrder) => {
        const matches =
          (ord.id || '').toLowerCase() === targetId ||
          (ord.displayId || '').toLowerCase() === targetId ||
          (ord.id || '').toLowerCase().includes(targetId) ||
          targetId.includes((ord.id || '').toLowerCase())

        return matches ? { ...ord, status } : ord
      })

      if (typeof window !== 'undefined') {
        try {
          // 1. Sync to local user orders cache
          const localOrders = JSON.parse(localStorage.getItem('platr_user_orders') || '[]')
          const updatedLocal = localOrders.map((o: any) => {
            const matches =
              (o.id || '').toLowerCase() === targetId ||
              (o.displayId || '').toLowerCase() === targetId ||
              (o.id || '').toLowerCase().includes(targetId) ||
              targetId.includes((o.id || '').toLowerCase())

            return matches ? { ...o, status } : o
          })
          localStorage.setItem('platr_user_orders', JSON.stringify(updatedLocal))

          // 2. Broadcast status update across tabs
          if ('BroadcastChannel' in window) {
            const bc = new BroadcastChannel('luft_live_orders_channel')
            bc.postMessage({ type: 'STATUS_UPDATE', orderId, status })
            bc.close()
          }

          // 3. Dispatch local event
          window.dispatchEvent(
            new CustomEvent('luft_order_status_update', {
              detail: { orderId, status, timestamp: Date.now() },
            })
          )

          // 4. Update storage event trigger
          localStorage.setItem(
            'luft_last_status_update',
            JSON.stringify({ orderId, status, broadcastTimestamp: Date.now() })
          )
        } catch (err) {
          console.warn('Live order status sync warning:', err)
        }
      }

      return { orders: updatedOrders }
    }),
  rejectOrder: (orderId: string, reason = 'Kitchen capacity full') =>
    set((state: StaffStoreState) => ({
      orders: state.orders.map((ord: EnterpriseOrder) =>
        ord.id === orderId || ord.displayId === orderId ? { ...ord, status: 'cancelled', cancelledReason: reason } : ord
      ),
      notifications: [
        {
          id: `n-${Date.now()}`,
          title: `❌ Order ${orderId} Cancelled`,
          message: `Order was rejected. Reason: ${reason}`,
          timestamp: 'Just now',
          type: 'cancelled',
          read: false,
        },
        ...state.notifications,
      ],
    })),
  dispatchOrder: (orderId: string, riderName = 'Rider Vikram Singh') =>
    set((state: StaffStoreState) => ({
      orders: state.orders.map((ord: EnterpriseOrder) =>
        ord.id === orderId || ord.displayId === orderId
          ? { ...ord, status: 'picked_up', deliveryStatus: 'out_for_delivery', assignedDeliveryStaff: riderName }
          : ord
      ),
    })),
  assignDeliveryRider: (orderId: string, riderName: string) =>
    set((state: StaffStoreState) => ({
      orders: state.orders.map((ord: EnterpriseOrder) =>
        ord.id === orderId || ord.displayId === orderId ? { ...ord, assignedDeliveryStaff: riderName, deliveryStatus: 'assigned' } : ord
      ),
    })),
  cancelOrderItem: (orderId: string, itemId: string) =>
    set((state: StaffStoreState) => ({
      orders: state.orders.map((ord: EnterpriseOrder) => {
        if (ord.id !== orderId && ord.displayId !== orderId) return ord
        const updatedItems = ord.items.map((item: ExtendedOrderItem) =>
          item.id === itemId ? { ...item, isCancelled: true } : item
        )
        const newTotal = updatedItems
          .filter((i: ExtendedOrderItem) => !i.isCancelled)
          .reduce((sum: number, i: ExtendedOrderItem) => sum + i.price * i.quantity, 0)
        return { ...ord, items: updatedItems, totalAmount: newTotal }
      }),
    })),
  addOrder: (order: EnterpriseOrder) =>
    set((state: StaffStoreState) => ({
      orders: [order, ...state.orders.filter((o) => o.id !== order.id && o.displayId !== order.displayId)],
    })),

  tables: INITIAL_TABLES,
  updateTableStatus: (tableId: string, status: WaiterTable['status']) =>
    set((state: StaffStoreState) => ({
      tables: state.tables.map((tbl: WaiterTable) => {
        if (tbl.id !== tableId) return tbl
        if (status === 'available') {
          return {
            ...tbl,
            status: 'available',
            occupancy: 0,
            currentBillAmount: 0,
            customerRequests: [],
            currentOrderId: undefined,
            notes: undefined,
          }
        }
        return { ...tbl, status }
      }),
    })),
  assignWaiterToTable: (tableId: string, waiterName: string) =>
    set((state: StaffStoreState) => ({
      tables: state.tables.map((tbl: WaiterTable) => (tbl.id === tableId ? { ...tbl, assignedWaiter: waiterName } : tbl)),
    })),
  reserveTable: (tableId: string, guestName: string, time: string, guestCount: number) =>
    set((state: StaffStoreState) => ({
      tables: state.tables.map((tbl: WaiterTable) =>
        tbl.id === tableId
          ? {
              ...tbl,
              status: 'reserved',
              reservationName: guestName,
              reservationTime: time,
              occupancy: 0,
              capacity: Math.max(tbl.capacity, guestCount),
              notes: `Reserved for ${time} (${guestName})`,
            }
          : tbl
      ),
    })),
  mergeTables: (targetTableId: string, sourceTableId: string) =>
    set((state: StaffStoreState) => {
      const targetTable = state.tables.find((t: WaiterTable) => t.id === targetTableId)
      const sourceTable = state.tables.find((t: WaiterTable) => t.id === sourceTableId)
      if (!targetTable || !sourceTable) return state

      const combinedBill = targetTable.currentBillAmount + sourceTable.currentBillAmount
      const combinedOccupancy = targetTable.occupancy + sourceTable.occupancy

      return {
        tables: state.tables.map((tbl: WaiterTable) => {
          if (tbl.id === targetTableId) {
            return {
              ...tbl,
              occupancy: combinedOccupancy,
              currentBillAmount: combinedBill,
              mergedWithTableNumber: sourceTable.tableNumber,
              notes: `Merged with ${sourceTable.tableNumber}`,
            }
          }
          if (tbl.id === sourceTableId) {
            return {
              ...tbl,
              status: 'occupied',
              currentBillAmount: 0,
              mergedWithTableNumber: targetTable.tableNumber,
              notes: `Merged into ${targetTable.tableNumber}`,
            }
          }
          return tbl
        }),
      }
    }),
  splitBill: (orderId: string, splitParts: number) =>
    set((state: StaffStoreState) => ({
      orders: state.orders.map((ord: EnterpriseOrder) => {
        if (ord.id !== orderId && ord.displayId !== orderId) return ord
        const equalPart = Math.round(ord.totalAmount / Math.max(1, splitParts))
        const parts = Array(splitParts).fill(equalPart)
        return { ...ord, splitBills: parts }
      }),
    })),
  addRequestToTable: (tableId: string, request: string) =>
    set((state: StaffStoreState) => ({
      tables: state.tables.map((tbl: WaiterTable) =>
        tbl.id === tableId
          ? {
              ...tbl,
              customerRequests: Array.from(new Set([...tbl.customerRequests, request])),
              status: tbl.status === 'available' ? 'occupied' : tbl.status,
              occupancy: tbl.occupancy === 0 ? 1 : tbl.occupancy,
            }
          : tbl
      ),
    })),
  removeCustomerRequestFromTable: (tableId: string, request: string) =>
    set((state: StaffStoreState) => ({
      tables: state.tables.map((tbl: WaiterTable) =>
        tbl.id === tableId
          ? { ...tbl, customerRequests: tbl.customerRequests.filter((r) => r !== request) }
          : tbl
      ),
    })),
  clearTableRequests: (tableId: string) =>
    set((state: StaffStoreState) => ({
      tables: state.tables.map((tbl: WaiterTable) => (tbl.id === tableId ? { ...tbl, customerRequests: [] } : tbl)),
    })),

  requests: INITIAL_REQUESTS,
  updateRequestStatus: (requestId: string, status: CustomerTicketRequest['status']) =>
    set((state: StaffStoreState) => ({
      requests: state.requests.map((req: CustomerTicketRequest) => (req.id === requestId ? { ...req, status } : req)),
    })),
  addCustomerRequest: (req: Omit<CustomerTicketRequest, 'id' | 'time' | 'status'>) =>
    set((state: StaffStoreState) => {
      const newReq: CustomerTicketRequest = {
        ...req,
        id: `req-${Date.now()}`,
        time: 'Just now',
        status: 'pending',
      }
      return {
        requests: [newReq, ...state.requests],
        tables: state.tables.map((tbl) =>
          tbl.tableNumber === req.tableNumber
            ? {
                ...tbl,
                customerRequests: Array.from(new Set([...tbl.customerRequests, req.type])),
                status: tbl.status === 'available' ? 'occupied' : tbl.status,
                occupancy: tbl.occupancy === 0 ? 1 : tbl.occupancy,
              }
            : tbl
        ),
      }
    }),

  inventoryAlerts: INITIAL_INVENTORY,
  toggleStockStatus: (alertId: string) =>
    set((state: StaffStoreState) => ({
      inventoryAlerts: state.inventoryAlerts.map((inv: InventoryAlert) =>
        inv.id === alertId ? { ...inv, isOutOfStock: !inv.isOutOfStock } : inv
      ),
    })),

  notifications: INITIAL_NOTIFICATIONS,
  markNotificationRead: (id: string) =>
    set((state: StaffStoreState) => ({
      notifications: state.notifications.map((n: StaffNotification) => (n.id === id ? { ...n, read: true } : n)),
    })),
  clearAllNotifications: () =>
    set((state: StaffStoreState) => ({
      notifications: state.notifications.map((n: StaffNotification) => ({ ...n, read: true })),
    })),

  performance: {
    ordersCompleted: 0,
    avgCookingTimeMins: 0,
    avgServingTimeMins: 0,
    customerRating: 5.0,
    cancelledOrders: 0,
    delayedOrders: 0,
    efficiencyScore: 100,
    rank: 1,
  },
}))

export const resetAllSystemData = () => {
  useStaffStore.setState({
    orders: INITIAL_ORDERS,
    tables: INITIAL_TABLES,
    requests: INITIAL_REQUESTS,
    inventoryAlerts: INITIAL_INVENTORY,
    notifications: INITIAL_NOTIFICATIONS,
  })
}
