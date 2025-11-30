"use client";

import { io } from "socket.io-client";

let socket = null;

/**
 * Initialize Socket.io client connection
 * @param {string} url - Socket.io server URL
 * @returns {Socket} Socket.io client instance
 */
export function initSocketClient(url = null) {
  if (socket && socket.connected) {
    return socket;
  }

  const serverUrl = url || process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
  
  socket = io(serverUrl, {
    path: "/api/socket",
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    console.log("🔌 Socket.io connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("🔌 Socket.io disconnected");
  });

  socket.on("connect_error", (error) => {
    console.error("Socket.io connection error:", error);
  });

  return socket;
}

/**
 * Get Socket.io client instance
 * @returns {Socket|null} Socket.io client instance
 */
export function getSocketClient() {
  if (!socket) {
    return initSocketClient();
  }
  return socket;
}

/**
 * Subscribe to courier channel
 * @param {string} courierId - Courier ID
 */
export function subscribeToCourier(courierId) {
  const client = getSocketClient();
  if (client && courierId) {
    client.emit("courier:subscribe", courierId);
    console.log(`📦 Subscribed to courier channel: ${courierId}`);
  }
}

/**
 * Subscribe to customer channel
 * @param {string} customerId - Customer ID
 */
export function subscribeToCustomer(customerId) {
  const client = getSocketClient();
  if (client && customerId) {
    client.emit("customer:subscribe", customerId);
    console.log(`👤 Subscribed to customer channel: ${customerId}`);
  }
}

/**
 * Disconnect Socket.io client
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("🔌 Socket.io disconnected");
  }
}

