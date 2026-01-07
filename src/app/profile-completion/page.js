"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Icon } from "@iconify/react";

export default function ProfileCompletionPage() {
  const router = useRouter();
  const { user, token, isLoading, isAuthenticated, isProfileComplete, refreshUser } = useAuth();

  const [fullName, setFullName] = useState("");
  const [nationalCode, setNationalCode] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && isProfileComplete) {
      if (user?.role === "ADMIN") router.push("/admin");
      else if (user?.role === "COURIER") router.push("/courier");
      else router.push("/");
    }
  }, [isLoading, isAuthenticated, isProfileComplete, user?.role, router]);

  useEffect(() => {
    if (user?.fullName) setFullName(user.fullName.startsWith("User ") ? "" : user.fullName);
    if (typeof user?.nationalCode === "string") setNationalCode(user.nationalCode);
  }, [user]);

  const canSave = useMemo(() => {
    const u = fullName.trim();
    const n = nationalCode.trim();
    return u.length >= 2 && /^\d{8,20}$/.test(n);
  }, [fullName, nationalCode]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    if (!token) return setError("Token not found. Please login again.");
    if (!canSave) return;

    setSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName, nationalCode }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save profile");

      // Update localStorage user immediately for smooth UX
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

      await refreshUser();

      if (data.user?.role === "ADMIN") router.push("/admin");
      else if (data.user?.role === "COURIER") router.push("/courier");
      else router.push("/");
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        bgcolor: "background.default",
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, #0b1220 0%, #111827 100%)"
            : "linear-gradient(135deg, rgba(102,126,234,0.18) 0%, rgba(118,75,162,0.16) 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: 4,
            bgcolor: (t) =>
              t.palette.mode === "dark"
                ? "rgba(18,18,18,0.92)"
                : "rgba(255,255,255,0.92)",
            backdropFilter: "blur(14px)",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack spacing={2.5}>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 3,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 10px 24px rgba(59,130,246,0.25)",
                }}
              >
                <Icon icon="mdi:account-edit" width={28} height={28} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" fontWeight={800} color="text.primary">
                  Complete your profile
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  We need your full name and national code before you can use the app.
                </Typography>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" icon={<Icon icon="mdi:alert-circle" />}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSave}>
              <Stack spacing={2}>
                <TextField
                  label="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  fullWidth
                  required
                  disabled={saving}
                  InputProps={{
                    startAdornment: (
                      <Icon
                        icon="mdi:account-outline"
                        width={20}
                        height={20}
                        style={{ marginRight: 8, opacity: 0.6 }}
                      />
                    ),
                  }}
                />
                <TextField
                  label="National Code"
                  value={nationalCode}
                  onChange={(e) => setNationalCode(e.target.value.replace(/\D/g, "").slice(0, 20))}
                  fullWidth
                  required
                  disabled={saving}
                  inputProps={{ inputMode: "numeric" }}
                  helperText="Digits only (8-20)"
                  InputProps={{
                    startAdornment: (
                      <Icon
                        icon="mdi:card-account-details-outline"
                        width={20}
                        height={20}
                        style={{ marginRight: 8, opacity: 0.6 }}
                      />
                    ),
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={!canSave || saving}
                  startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Icon icon="mdi:content-save" />}
                  sx={{ py: 1.4 }}
                >
                  {saving ? "Saving..." : "Save & Continue"}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}


