import { Server } from "socket.io";

// Initialize Socket.io server (singleton pattern)
if (!global.io) {
  // This will be initialized on first API call
  // In production, consider using a custom Next.js server
}

export default function handler(req, res) {
  // Initialize Socket.io if not already done
  if (!res.socket.server.io) {
    console.log("Initializing Socket.io server...");
    
    const io = new Server(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
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

    res.socket.server.io = io;
    global.io = io; // Store globally for use in other modules
  }

  res.end();
}

// Export helper functions for emitting events
export function getSocketIO() {
  return global.io || (typeof global !== "undefined" ? global.io : null);
}

export function emitToCourier(courierId, event, data) {
  const io = getSocketIO();
  if (!io) {
    console.warn("Socket.io server not initialized");
    return;
  }
  io.to(`courier:${courierId}`).emit(event, data);
  console.log(`📤 Emitted ${event} to courier:${courierId}`);
}

export function emitToCustomer(customerId, event, data) {
  const io = getSocketIO();
  if (!io) {
    console.warn("Socket.io server not initialized");
    return;
  }
  io.to(`customer:${customerId}`).emit(event, data);
  console.log(`📤 Emitted ${event} to customer:${customerId}`);
}

