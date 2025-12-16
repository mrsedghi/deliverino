"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Decode JWT token without verification (client-side only)
 * Note: This doesn't verify the signature, only decodes the payload
 */
function decodeToken(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expired
 */
function isTokenExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const router = useRouter();

  const isProfileComplete = (() => {
    if (!user) return false;
    const fullNameOk =
      typeof user.fullName === "string" &&
      user.fullName.trim().length >= 2 &&
      !/^User\s+\d{2,}$/.test(user.fullName.trim()); // default placeholder from OTP flow
    const nationalCodeOk =
      typeof user.nationalCode === "string" &&
      user.nationalCode.trim().length > 0;
    return fullNameOk && nationalCodeOk;
  })();

  // Validate token with server
  const validateToken = useCallback(async (tokenToValidate) => {
    try {
      const response = await fetch("/api/me", {
        headers: {
          Authorization: `Bearer ${tokenToValidate}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return { valid: true, user: data.user };
      } else {
        return { valid: false, error: "Token invalid" };
      }
    } catch (error) {
      console.error("Token validation error:", error);
      return { valid: false, error: "Network error" };
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("auth_token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);

          // Check if token is expired (client-side check)
          if (isTokenExpired(storedToken)) {
            console.log("Token expired, clearing auth");
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user");
            setIsLoading(false);
            return;
          }

          // Validate token with server (optional, can be done on-demand)
          // For now, just set the token and user
          setToken(storedToken);
          setUser(userData);
        } catch (error) {
          console.error("Error parsing user data:", error);
          // Clear invalid data
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = useCallback((token, userData) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(token);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  // Refresh user data from server
  const refreshUser = useCallback(async () => {
    if (!token) return;

    setIsValidating(true);
    try {
      const result = await validateToken(token);
      if (result.valid) {
        setUser(result.user);
        localStorage.setItem("user", JSON.stringify(result.user));
      } else {
        // Token invalid, logout
        logout();
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    } finally {
      setIsValidating(false);
    }
  }, [token, validateToken, logout]);

  const isAuthenticated = !!token && !!user && !isTokenExpired(token);

  return {
    user,
    token,
    isLoading,
    isValidating,
    isAuthenticated,
    isProfileComplete,
    login,
    logout,
    refreshUser,
  };
}

