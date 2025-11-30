"use client";

import { createTheme } from "@mui/material/styles";

// Common theme configuration
const commonTheme = {
  typography: {
    fontFamily: [
      "var(--font-geist-sans)",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "10px 24px",
          fontWeight: 500,
          textTransform: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
};

// Light theme
export const lightTheme = createTheme({
  ...commonTheme,
  palette: {
    mode: "light",
    primary: {
      main: "#667eea",
      light: "#8b9ef5",
      dark: "#4c63d2",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#764ba2",
      light: "#9574b8",
      dark: "#5a3780",
      contrastText: "#ffffff",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
      contrastText: "#ffffff",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
      contrastText: "#ffffff",
    },
    info: {
      main: "#3b82f6",
      light: "#60a5fa",
      dark: "#2563eb",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f9fafb",
      paper: "#ffffff",
    },
    text: {
      primary: "#111827",
      secondary: "#6b7280",
    },
    divider: "rgba(0, 0, 0, 0.12)",
    action: {
      active: "rgba(0, 0, 0, 0.54)",
      hover: "rgba(0, 0, 0, 0.04)",
      selected: "rgba(0, 0, 0, 0.08)",
      disabled: "rgba(0, 0, 0, 0.26)",
      disabledBackground: "rgba(0, 0, 0, 0.12)",
    },
  },
});

// Dark theme
export const darkTheme = createTheme({
  ...commonTheme,
  palette: {
    mode: "dark",
    primary: {
      main: "#8b9ef5",
      light: "#a8b7f8",
      dark: "#667eea",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#9574b8",
      light: "#b396d1",
      dark: "#764ba2",
      contrastText: "#ffffff",
    },
    success: {
      main: "#34d399",
      light: "#6ee7b7",
      dark: "#10b981",
      contrastText: "#000000",
    },
    error: {
      main: "#f87171",
      light: "#fca5a5",
      dark: "#ef4444",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#fbbf24",
      light: "#fcd34d",
      dark: "#f59e0b",
      contrastText: "#000000",
    },
    info: {
      main: "#60a5fa",
      light: "#93c5fd",
      dark: "#3b82f6",
      contrastText: "#ffffff",
    },
    background: {
      default: "#0a0a0a",
      paper: "#1a1a1a",
    },
    text: {
      primary: "#ededed",
      secondary: "#a3a3a3",
    },
    divider: "rgba(255, 255, 255, 0.12)",
    action: {
      active: "rgba(255, 255, 255, 0.54)",
      hover: "rgba(255, 255, 255, 0.08)",
      selected: "rgba(255, 255, 255, 0.16)",
      disabled: "rgba(255, 255, 255, 0.26)",
      disabledBackground: "rgba(255, 255, 255, 0.12)",
    },
  },
});

// Default export (light theme for compatibility)
export const theme = lightTheme;
