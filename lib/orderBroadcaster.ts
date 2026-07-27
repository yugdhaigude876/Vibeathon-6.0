export function notifyStaffOfNewOrder(orderData: any) {
  try {
    const displayId = orderData.displayId || `#ORD-${Math.floor(1000 + Math.random() * 9000)}`
    const formattedOrder = {
      id: orderData.id || `ord-${Date.now()}`,
      displayId: displayId,
      customerName: orderData.customerName || orderData.customer_name || 'Online Customer',
      tableNumber: orderData.tableNumber || orderData.table_number || 'T-02',
      status: 'pending',
      orderType: orderData.orderType || (orderData.tableNumber ? 'dine_in' : 'takeaway'),
      totalAmount: orderData.totalAmount || orderData.total_amount || 0,
      items: orderData.items || [],
      createdAt: new Date().toISOString(),
      estimatedPrepMinutes: 15,
      isVip: Boolean(orderData.isVip),
      specialInstructions: orderData.notes || orderData.specialInstructions || '',
      otp: String(Math.floor(1000 + Math.random() * 9000)),
    }

    if (typeof window !== 'undefined') {
      // 1. Broadcast via BroadcastChannel
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('luft_live_orders_channel')
        bc.postMessage({ type: 'NEW_ORDER', order: formattedOrder })
        bc.close()
      }

      // 2. Dispatch local CustomEvent
      window.dispatchEvent(new CustomEvent('luft_new_order_event', { detail: formattedOrder }))

      // 3. Trigger localStorage event for cross-tab sync
      localStorage.setItem(
        'luft_last_new_order',
        JSON.stringify({ ...formattedOrder, broadcastTimestamp: Date.now() })
      )
    }

    return formattedOrder
  } catch (err) {
    console.error('Failed to broadcast new order:', err)
  }
}
