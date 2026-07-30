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
      totalAmount: Number(orderData.totalAmount || orderData.total_amount || 0),
      total_amount: Number(orderData.totalAmount || orderData.total_amount || 0),
      items: orderData.items || [],
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      estimatedPrepMinutes: 15,
      isVip: Boolean(orderData.isVip),
      specialInstructions: orderData.notes || orderData.specialInstructions || '',
      otp: String(Math.floor(1000 + Math.random() * 9000)),
    }

    if (typeof window !== 'undefined') {
      // 1. Save to platr_user_orders
      try {
        const existing: any[] = JSON.parse(localStorage.getItem('platr_user_orders') || '[]')
        const filtered = existing.filter((o) => o.id !== formattedOrder.id)
        filtered.unshift(formattedOrder)
        localStorage.setItem('platr_user_orders', JSON.stringify(filtered.slice(0, 20)))
      } catch (err) {
        console.warn('platr_user_orders save warning:', err)
      }

      // 2. Broadcast via BroadcastChannel
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('luft_live_orders_channel')
        bc.postMessage({ type: 'NEW_ORDER', order: formattedOrder })
        bc.close()
      }

      // 3. Dispatch local CustomEvent
      window.dispatchEvent(new CustomEvent('luft_new_order_event', { detail: formattedOrder }))

      // 4. Trigger localStorage event for cross-tab sync
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

export function notifyWaiterOfCustomerRequest(requestData: { tableNumber: string; requestText: string; customerName?: string }) {
  try {
    if (typeof window !== 'undefined') {
      const formattedRequest = {
        id: `req_${Date.now()}`,
        tableNumber: requestData.tableNumber || 'T-04',
        table_number: requestData.tableNumber || 'T-04',
        request: requestData.requestText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'pending',
        customerName: requestData.customerName || 'Table Guest',
      }

      // Save to localStorage
      try {
        const existing: any[] = JSON.parse(localStorage.getItem('platr_customer_requests') || '[]')
        existing.unshift(formattedRequest)
        localStorage.setItem('platr_customer_requests', JSON.stringify(existing.slice(0, 20)))
      } catch (err) {
        console.warn('platr_customer_requests save warning:', err)
      }

      // Broadcast via BroadcastChannel
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('luft_waiter_requests_channel')
        bc.postMessage({ type: 'NEW_WAITER_REQUEST', request: formattedRequest })
        bc.close()
      }

      // Dispatch local CustomEvent
      window.dispatchEvent(new CustomEvent('luft_waiter_request_event', { detail: formattedRequest }))
      
      localStorage.setItem('luft_last_waiter_request', JSON.stringify({ ...formattedRequest, timestamp: Date.now() }))
    }
  } catch (err) {
    console.error('Failed to broadcast waiter request:', err)
  }
}

