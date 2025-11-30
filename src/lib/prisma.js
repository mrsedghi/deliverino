import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// Prisma 7: Standard initialization
// The client reads DATABASE_URL from environment automatically
// If you see adapter/accelerateUrl errors, run: npx prisma generate

let prismaInstance = null;

try {
  // Check if Prisma Client is already initialized
  if (globalForPrisma.prisma) {
    prismaInstance = globalForPrisma.prisma;
  } else {
    // Standard PrismaClient initialization
    // Prisma 7 reads DATABASE_URL from environment automatically
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prismaInstance;
    }
  }
} catch (error) {
  // If initialization fails, it's likely because:
  // 1. Prisma Client wasn't generated (run: npx prisma generate)
  // 2. DATABASE_URL is missing
  // 3. Prisma Client version mismatch
  
  console.error("❌ Prisma Client initialization failed:", error.message);
  
  if (error.message.includes("adapter") || error.message.includes("accelerateUrl")) {
    console.error("\n🔧 Fix: Run the following command:");
    console.error("   npx prisma generate");
    console.error("\nThis will regenerate the Prisma Client with the correct configuration.");
    console.error("Make sure DATABASE_URL is set in your .env file.");
  }
  
  // Export null so calling code can handle it gracefully
  prismaInstance = null;
}

export const prisma = prismaInstance;
