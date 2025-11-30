import { Server } from "socket.io";

let io = null;

/**
 * Initialize Socket.io server
 * @param {http.Server} server - HTTP server instance
 * @returns {Server} Socket.io server instance
 */
export function initSocketServer(server) {
  if (io) {
    return io;
  }

  io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/api/socket",
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Handle courier subscription
    socket.on("courier:subscribe", (courierId) => {
      if (courierId) {
        socket.join(`courier:${courierId}`);
        console.log(`📦 Courier ${courierId} subscribed to channel`);
      }
    });

    // Handle customer subscription
    socket.on("customer:subscribe", (customerId) => {
      if (customerId) {
        socket.join(`customer:${customerId}`);
        console.log(`👤 Customer ${customerId} subscribed to channel`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Get Socket.io server instance
 * @returns {Server|null} Socket.io server instance
 */
export function getSocketServer() {
  return io;
}

/**
 * Emit event to courier channel
 * @param {string} courierId - Courier ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export function emitToCourier(courierId, event, data) {
  if (!io) {
    console.warn("Socket.io server not initialized");
    return;
  }
  io.to(`courier:${courierId}`).emit(event, data);
  console.log(`📤 Emitted ${event} to courier:${courierId}`);
}

/**
 * Emit event to customer channel
 * @param {string} customerId - Customer ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export function emitToCustomer(customerId, event, data) {
  if (!io) {
    console.warn("Socket.io server not initialized");
    return;
  }
  io.to(`customer:${customerId}`).emit(event, data);
  console.log(`📤 Emitted ${event} to customer:${customerId}`);
}

