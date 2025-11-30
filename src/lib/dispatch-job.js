/**
 * Background job to handle expired offers
 * Runs periodically to check for expired offers and retry dispatch
 */

import { prisma } from "./prisma";
import { handleExpiredOffers } from "./dispatch";

let jobInterval = null;
const JOB_INTERVAL_MS = 10000; // Run every 10 seconds

/**
 * Start the dispatch job
 */
export function startDispatchJob() {
  if (jobInterval) {
    console.log("Dispatch job already running");
    return;
  }

  console.log("Starting dispatch job...");
  
  jobInterval = setInterval(async () => {
    try {
      // Find all orders in DISPATCHING status
      const dispatchingOrders = await prisma.order.findMany({
        where: {
          status: "DISPATCHING",
        },
        select: {
          id: true,
        },
      });

      // Process each order
      for (const order of dispatchingOrders) {
        try {
          await handleExpiredOffers(order.id);
        } catch (error) {
          console.error(`Error processing order ${order.id}:`, error);
        }
      }
    } catch (error) {
      console.error("Error in dispatch job:", error);
    }
  }, JOB_INTERVAL_MS);
}

/**
 * Stop the dispatch job
 */
export function stopDispatchJob() {
  if (jobInterval) {
    clearInterval(jobInterval);
    jobInterval = null;
    console.log("Dispatch job stopped");
  }
}

// Auto-start in development (in production, use proper job queue)
if (process.env.NODE_ENV !== "production") {
  // Start job when module is imported
  if (typeof window === "undefined") {
    startDispatchJob();
  }
}

