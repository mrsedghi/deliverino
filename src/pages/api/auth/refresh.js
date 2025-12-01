/**
 * Refresh user data endpoint
 * Validates token and returns updated user data
 */

import { requireAuth } from "@/lib/auth-middleware";

async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // User is already attached by requireAuth middleware
    return res.status(200).json({
      user: req.user,
      token: req.headers.authorization?.replace("Bearer ", ""), // Return same token
    });
  } catch (error) {
    console.error("Error in refresh:", error);
    return res.status(500).json({
      error: "Failed to refresh user data",
      message: error.message,
    });
  }
}

export default requireAuth(handler);

