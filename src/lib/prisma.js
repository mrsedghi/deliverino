import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

let prisma;

if (!globalForPrisma._prisma) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing from .env");
  }

  // Prisma 6: Can safely use log config without issues
  globalForPrisma._prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" 
      ? ["error", "warn", "query"] 
      : ["error"],
  });
}

prisma = globalForPrisma._prisma;

export { prisma };
