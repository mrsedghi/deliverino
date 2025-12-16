"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Box, Typography, CircularProgress } from "@mui/material";

export default function ProtectedRoute({ children, requiredRole = null, redirectTo = "/login" }) {
  const { user, isLoading, isAuthenticated, isProfileComplete } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      // Enforce profile completion (except on the completion page itself)
      if (!isProfileComplete && typeof window !== "undefined") {
        const path = window.location?.pathname || "";
        if (path !== "/profile-completion") {
          router.push("/profile-completion");
          return;
        }
      }

      if (requiredRole && user?.role !== requiredRole) {
        // Redirect based on user role
        if (user?.role === "ADMIN") {
          router.push("/admin");
        } else if (user?.role === "COURIER") {
          router.push("/courier");
        } else {
          router.push("/");
        }
        return;
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router, redirectTo, isProfileComplete]);

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (!isProfileComplete) {
    return null; // Will redirect
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
