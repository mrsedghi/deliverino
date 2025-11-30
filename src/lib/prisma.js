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
    // In production (Vercel), ensure DATABASE_URL is set
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

    // Store in global to prevent multiple instances
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prismaInstance;
    } else {
      // In production, also store to prevent re-initialization
      globalForPrisma.prisma = prismaInstance;
    }
  }
} catch (error) {
  // If initialization fails, it's likely because:
  // 1. Prisma Client wasn't generated (run: npx prisma generate)
  // 2. DATABASE_URL is missing
  // 3. Prisma Client version mismatch
  
  console.error("❌ Prisma Client initialization failed:", error.message);
  console.error("Error details:", error);
  
  if (error.message.includes("adapter") || error.message.includes("accelerateUrl")) {
    console.error("\n🔧 Fix: Run the following command:");
    console.error("   npx prisma generate");
    console.error("\nThis will regenerate the Prisma Client with the correct configuration.");
    console.error("Make sure DATABASE_URL is set in your environment variables.");
  }
  
  // In production, we should still try to create a basic instance
  // to prevent complete failure, but log the error
  if (process.env.NODE_ENV === "production") {
    console.error("⚠️ Production error: Prisma Client not initialized. Check build logs.");
  }
  
  // Export null so calling code can handle it gracefully
  prismaInstance = null;
}

export const prisma = prismaInstance;
