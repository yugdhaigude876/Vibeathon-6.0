export type StaffRole = 'chef' | 'cashier' | 'waiter' | 'delivery' | 'manager' | 'staff'

export interface StaffProfile {
  name: string
  role: StaffRole
  branch: string
  shift: 'Morning (08:00 - 16:00)' | 'Evening (16:00 - 00:00)' | 'Night (00:00 - 08:00)'
  avatarUrl: string
  clockedIn: boolean
  clockInTime?: string | null
  breakStatus?: 'none' | 'break'
  breakSeconds?: number
  hoursWorkedToday: number
  performanceScore: number
}

export type OrderWorkflowStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'quality_check'
  | 'ready'
  | 'picked_up'
  | 'delivered'
  | 'cancelled'

export type OrderType = 'dine_in' | 'pickup' | 'delivery'

export interface ExtendedOrderItem {
  id: string
  name: string
  quantity: number
  price: number
  spiceLevel?: 'Mild' | 'Medium' | 'Spicy' | 'Extra Hot'
  allergies?: string[]
  specialNotes?: string
  isCancelled?: boolean
}

export interface EnterpriseOrder {
  id: string
  displayId: string
  createdAt: string
  status: OrderWorkflowStatus
  orderType: OrderType
  customerName: string
  phone?: string
  address?: string
  tableNumber?: string | number
  items: ExtendedOrderItem[]
  totalAmount: number
  specialInstructions?: string
  estimatedPrepMinutes: number
  priority: 'normal' | 'urgent' | 'vip'
  isVip: boolean
  otp?: string
  assignedDeliveryStaff?: string
  deliveryStatus?: 'unassigned' | 'assigned' | 'out_for_delivery' | 'delivered'
  splitBills?: number[]
  cancelledReason?: string
}

export interface WaiterTable {
  id: string
  tableNumber: string
  capacity: number
  occupancy: number
  status: 'available' | 'occupied' | 'reserved' | 'billing' | 'cleaning'
  assignedWaiter?: string
  currentOrderId?: string
  currentBillAmount: number
  customerRequests: string[]
  notes?: string
  mergedWithTableNumber?: string
  reservationName?: string
  reservationTime?: string
}

export interface CustomerTicketRequest {
  id: string
  tableNumber: string
  type: 'Water' | 'Extra Sauce' | 'Extra Plates' | 'Tissue' | 'Spoon' | 'Call Waiter' | 'Cancel Item' | 'Birthday Celebration' | 'Special Note'
  note?: string
  time: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'normal' | 'high' | 'urgent'
  assignedStaff?: string
}

export interface InventoryAlert {
  id: string
  ingredient: string
  remainingQty: string
  expectedOutTime: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  isOutOfStock: boolean
}

export interface StaffPerformanceStats {
  ordersCompleted: number
  avgCookingTimeMins: number
  avgServingTimeMins: number
  customerRating: number
  cancelledOrders: number
  delayedOrders: number
  efficiencyScore: number
  rank: number
}

export interface StaffNotification {
  id: string
  title: string
  message: string
  timestamp: string
  type: 'urgent_order' | 'vip' | 'large_order' | 'cancelled' | 'request' | 'shift' | 'inventory'
  read: boolean
}

