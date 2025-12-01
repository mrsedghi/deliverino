"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Snackbar,
  Card,
  CardContent,
  Fade,
  Zoom,
} from "@mui/material";
import { Icon } from "@iconify/react";

export default function OTPLogin() {
  const router = useRouter();
  const [step, setStep] = useState("role"); // "role", "phone", or "otp"
  const [selectedRole, setSelectedRole] = useState(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // Check if already logged in and redirect
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userStr = localStorage.getItem("user");
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        // Redirect based on role
        if (user.role === "ADMIN") {
          router.push("/admin");
        } else if (user.role === "COURIER") {
          router.push("/courier");
        } else {
          router.push("/");
        }
      } catch (error) {
        // Invalid user data, continue with login
        console.error("Error parsing user data:", error);
      }
    }
  }, [router]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send OTP");
      }

      const data = await response.json();
      setStep("otp");
      
      // Start countdown (60 seconds)
      setCountdown(60);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Show OTP code in Snackbar (always show in all environments)
      if (data.code) {
        setOtpCode(data.code);
        setSnackbarOpen(true);
        console.log("OTP Code:", data.code);
      } else {
        // If code is not in response, still show snackbar with message
        setOtpCode("Check your phone for SMS");
        setSnackbarOpen(true);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Generate a default name from phone (last 4 digits)
      // In production, you might want to ask for name separately
      const defaultName = `User ${phone.slice(-4)}`;
      
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone, 
          code: otp, 
          role: selectedRole,
          name: defaultName, // Use last 4 digits as default name
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to verify OTP");
      }

      const data = await response.json();
      
      // Store token and user data
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Small delay to ensure localStorage is set
      await new Promise(resolve => setTimeout(resolve, 100));

      // Redirect based on role
      if (data.user.role === "ADMIN") {
        router.push("/admin");
      } else if (data.user.role === "COURIER") {
        router.push("/courier");
      } else {
        router.push("/");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = () => {
    if (countdown > 0) return;
    setOtp("");
    handleSendOTP({ preventDefault: () => {} });
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setStep("phone");
  };

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
            ? "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)"
            : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          width: "200%",
          height: "200%",
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)"
              : "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
          animation: "float 20s infinite linear",
          "@keyframes float": {
            "0%": { transform: "translate(0, 0)" },
            "100%": { transform: "translate(50px, 50px)" },
          },
        },
      }}
    >
      <Container maxWidth="sm">
        <Fade in timeout={500}>
          <Paper
            elevation={24}
            sx={{
              p: 4,
              borderRadius: 4,
              bgcolor: "background.paper",
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(26, 26, 26, 0.95)"
                  : "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decorative elements */}
            <Box
              sx={{
                position: "absolute",
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                borderRadius: "50%",
                background: (theme) =>
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(139, 158, 245, 0.1), rgba(149, 116, 184, 0.1))"
                    : "linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))",
                zIndex: 0,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: -30,
                left: -30,
                width: 150,
                height: 150,
                borderRadius: "50%",
                background: (theme) =>
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(149, 116, 184, 0.1), rgba(139, 158, 245, 0.1))"
                    : "linear-gradient(135deg, rgba(118, 75, 162, 0.1), rgba(102, 126, 234, 0.1))",
                zIndex: 0,
              }}
            />

            <Box sx={{ position: "relative", zIndex: 1 }}>
              {/* Logo/Title */}
              <Box sx={{ textAlign: "center", mb: 4 }}>
                <Zoom in timeout={600}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      mb: 2,
                      boxShadow: (theme) =>
                        theme.palette.mode === "dark"
                          ? "0 8px 32px rgba(139, 158, 245, 0.4)"
                          : "0 8px 32px rgba(102, 126, 234, 0.3)",
                    }}
                  >
                    <Icon icon="mdi:truck-delivery" width={40} height={40} color="white" />
                  </Box>
                </Zoom>
                <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom color="text.primary">
                  Deliverino
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fast & Reliable Delivery Service
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }} icon={<Icon icon="mdi:alert-circle" />}>
                  {error}
                </Alert>
              )}

              {/* Role Selection Step */}
              {step === "role" && (
                <Fade in timeout={400}>
                  <Box>
                    <Typography variant="h6" align="center" gutterBottom fontWeight="600" sx={{ mb: 3 }}>
                      Select Your Role
                    </Typography>
                    <Stack spacing={2}>
                      <Card
                        onClick={() => handleRoleSelect("CUSTOMER")}
                        sx={{
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          border: "2px solid transparent",
                          bgcolor: "background.paper",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: 6,
                            borderColor: "primary.main",
                          },
                        }}
                      >
                        <CardContent>
                          <Stack direction="row" spacing={3} alignItems="center">
                            <Box
                              sx={{
                                width: 60,
                                height: 60,
                                borderRadius: 2,
                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Icon icon="mdi:account" width={32} height={32} color="white" />
                            </Box>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="h6" fontWeight="bold" color="text.primary">
                                Customer
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Order deliveries and track your packages
                              </Typography>
                            </Box>
                            <Icon icon="mdi:chevron-right" width={24} height={24} style={{ color: "inherit" }} />
                          </Stack>
                        </CardContent>
                      </Card>

                      <Card
                        onClick={() => handleRoleSelect("COURIER")}
                        sx={{
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          border: "2px solid transparent",
                          bgcolor: "background.paper",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: 6,
                            borderColor: "primary.main",
                          },
                        }}
                      >
                        <CardContent>
                          <Stack direction="row" spacing={3} alignItems="center">
                            <Box
                              sx={{
                                width: 60,
                                height: 60,
                                borderRadius: 2,
                                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Icon icon="mdi:motorbike" width={32} height={32} color="white" />
                            </Box>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="h6" fontWeight="bold" color="text.primary">
                                Courier
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Accept orders and deliver packages
                              </Typography>
                            </Box>
                            <Icon icon="mdi:chevron-right" width={24} height={24} style={{ color: "inherit" }} />
                          </Stack>
                        </CardContent>
                      </Card>
                    </Stack>
                  </Box>
                </Fade>
              )}

              {/* Phone Number Step */}
              {step === "phone" && (
                <Fade in timeout={400}>
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                      <Button
                        startIcon={<Icon icon="mdi:arrow-left" />}
                        onClick={() => {
                          setStep("role");
                          setSelectedRole(null);
                          setPhone("");
                          setError("");
                        }}
                        sx={{ mr: 2 }}
                      >
                        Back
                      </Button>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" fontWeight="600" color="text.primary">
                          {selectedRole === "COURIER" ? "Courier Login" : "Customer Login"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Enter your phone number to continue
                        </Typography>
                      </Box>
                    </Box>

                    <Box component="form" onSubmit={handleSendOTP}>
                      <Stack spacing={3}>
                        <TextField
                          label="Phone Number"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1234567890"
                          required
                          fullWidth
                          disabled={isLoading}
                          InputProps={{
                            startAdornment: (
                              <Icon icon="mdi:phone" width={20} style={{ marginRight: 8, color: "#999" }} />
                            ),
                          }}
                        />

                        <Button
                          type="submit"
                          variant="contained"
                          fullWidth
                          size="large"
                          disabled={isLoading || !phone}
                          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Icon icon="mdi:send" />}
                          sx={{
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            "&:hover": {
                              background: "linear-gradient(135deg, #5568d3 0%, #653a8f 100%)",
                            },
                            py: 1.5,
                          }}
                        >
                          {isLoading ? "Sending..." : "Send OTP"}
                        </Button>
                      </Stack>
                    </Box>
                  </Box>
                </Fade>
              )}

              {/* OTP Verification Step */}
              {step === "otp" && (
                <Fade in timeout={400}>
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                      <Button
                        startIcon={<Icon icon="mdi:arrow-left" />}
                        onClick={() => {
                          setStep("phone");
                          setOtp("");
                          setError("");
                        }}
                        sx={{ mr: 2 }}
                      >
                        Back
                      </Button>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" fontWeight="600" color="text.primary">
                          Verify OTP
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Enter the code sent to {phone}
                        </Typography>
                      </Box>
                    </Box>

                    <Box component="form" onSubmit={handleVerifyOTP}>
                      <Stack spacing={3}>
                        <TextField
                          label="Enter OTP Code"
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="000000"
                          inputProps={{
                            maxLength: 6,
                            style: {
                              textAlign: "center",
                              fontSize: "2rem",
                              letterSpacing: "0.5em",
                              fontWeight: "bold",
                            },
                          }}
                          required
                          fullWidth
                          disabled={isLoading}
                          InputProps={{
                            startAdornment: (
                              <Icon icon="mdi:lock" width={20} style={{ marginRight: 8, color: "#999" }} />
                            ),
                          }}
                        />

                        <Button
                          type="submit"
                          variant="contained"
                          color="success"
                          fullWidth
                          size="large"
                          disabled={isLoading || otp.length !== 6}
                          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Icon icon="mdi:check-circle" />}
                          sx={{
                            py: 1.5,
                          }}
                        >
                          {isLoading ? "Verifying..." : "Verify OTP"}
                        </Button>

                        <Button
                          type="button"
                          onClick={handleResendOTP}
                          disabled={countdown > 0 || isLoading}
                          fullWidth
                          variant="outlined"
                          startIcon={<Icon icon="mdi:refresh" />}
                        >
                          {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                        </Button>
                      </Stack>
                    </Box>
                  </Box>
                </Fade>
              )}
            </Box>
          </Paper>
        </Fade>

        {/* OTP Code Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={null}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          ClickAwayListenerProps={{ onClickAway: () => {} }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity="info"
            variant="filled"
            sx={{ width: "100%" }}
            icon={<Icon icon="mdi:information" />}
          >
            <Typography variant="body1" fontWeight="bold" gutterBottom>
              OTP Code Sent
            </Typography>
            <Typography variant="h4" fontFamily="monospace" textAlign="center" sx={{ letterSpacing: 2, mt: 1 }}>
              {otpCode}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.9 }}>
              Click the X button to close
            </Typography>
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}
