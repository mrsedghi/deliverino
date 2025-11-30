/**
 * Notification service for couriers
 * Supports FCM, WebSocket, and in-memory for development
 */

// In-memory notification store for development
const notificationStore = new Map();

/**
 * Send notification to a courier
 * @param {string} courierId - Courier ID
 * @param {Object} payload - Notification payload
 * @param {string} payload.type - Notification type (e.g., 'order_offer', 'order_update')
 * @param {Object} payload.data - Notification data
 * @returns {Promise<boolean>} Success status
 */
export async function sendToCourier(courierId, payload) {
  console.log(`📱 Notification to courier ${courierId}:`, payload);

  // Store notification in memory (for development/testing)
  if (!notificationStore.has(courierId)) {
    notificationStore.set(courierId, []);
  }
  notificationStore.get(courierId).push({
    ...payload,
    timestamp: new Date(),
    read: false,
  });

  // In production, implement:
  // 1. FCM push notification
  // 2. WebSocket real-time notification
  // 3. SMS fallback (optional)

  // FCM stub (would use firebase-admin in production)
  // await sendFCMNotification(courierId, payload);

  // WebSocket stub (would use Socket.io or similar)
  // await sendWebSocketNotification(courierId, payload);

  return true;
}

/**
 * Get notifications for a courier (in-memory, for development)
 * @param {string} courierId - Courier ID
 * @returns {Array} Array of notifications
 */
export function getCourierNotifications(courierId) {
  return notificationStore.get(courierId) || [];
}

/**
 * Mark notification as read
 * @param {string} courierId - Courier ID
 * @param {string} notificationId - Notification ID
 */
export function markNotificationRead(courierId, notificationId) {
  const notifications = notificationStore.get(courierId);
  if (notifications) {
    const notification = notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }
}

/**
 * Clear notifications for a courier
 * @param {string} courierId - Courier ID
 */
export function clearCourierNotifications(courierId) {
  notificationStore.delete(courierId);
}

// WebSocket connection map (for real-time notifications)
const wsConnections = new Map();

/**
 * Register WebSocket connection for a courier
 * @param {string} courierId - Courier ID
 * @param {WebSocket} ws - WebSocket connection
 */
export function registerWebSocket(courierId, ws) {
  wsConnections.set(courierId, ws);
  console.log(`🔌 WebSocket registered for courier ${courierId}`);

  ws.on("close", () => {
    wsConnections.delete(courierId);
    console.log(`🔌 WebSocket disconnected for courier ${courierId}`);
  });
}

/**
 * Send notification via WebSocket if connected
 * @param {string} courierId - Courier ID
 * @param {Object} payload - Notification payload
 */
export function sendWebSocketNotification(courierId, payload) {
  const ws = wsConnections.get(courierId);
  if (ws && ws.readyState === 1) {
    // WebSocket.OPEN = 1
    ws.send(JSON.stringify(payload));
    return true;
  }
  return false;
}

