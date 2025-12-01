/**
 * Authentication middleware for API routes
 * Provides reusable authentication and authorization logic
 */

import { extractTokenFromHeader, verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

/**
 * Authenticate request and get user
 * @param {Object} req - Request object
 * @returns {Object} { user, decoded, error }
 */
export async function authenticateRequest(req) {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return {
      user: null,
      decoded: null,
      error: { status: 401, message: "Authorization token required" },
    };
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) {
    return {
      user: null,
      decoded: null,
      error: { status: 401, message: "Invalid or expired token" },
    };
  }

  // Get user from database
  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return {
        user: null,
        decoded: null,
        error: { status: 404, message: "User not found" },
      };
    }

    return { user, decoded, error: null };
  } catch (error) {
    console.error("Error fetching user:", error);
    return {
      user: null,
      decoded: null,
      error: { status: 500, message: "Database error" },
    };
  }
}

/**
 * Require authentication middleware
 * @param {Function} handler - API route handler
 * @returns {Function} Wrapped handler
 */
export function requireAuth(handler) {
  return async (req, res) => {
    const { user, error } = await authenticateRequest(req);

    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    // Attach user to request
    req.user = user;
    return handler(req, res);
  };
}

/**
 * Require specific role middleware
 * @param {string|string[]} allowedRoles - Role(s) allowed
 * @param {Function} handler - API route handler
 * @returns {Function} Wrapped handler
 */
export function requireRole(allowedRoles, handler) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (req, res) => {
    const { user, error } = await authenticateRequest(req);

    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }

    // Attach user to request
    req.user = user;
    return handler(req, res);
  };
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 * @param {Function} handler - API route handler
 * @returns {Function} Wrapped handler
 */
export function optionalAuth(handler) {
  return async (req, res) => {
    const { user } = await authenticateRequest(req);
    req.user = user; // Can be null
    return handler(req, res);
  };
}

