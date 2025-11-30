"use client";

import { ThemeProvider as MUIThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { lightTheme, darkTheme } from "@/theme/theme";
import { useMemo, useEffect, useState } from "react";

export default function ThemeProvider({ children }) {
  const [prefersDarkMode, setPrefersDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check system preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setPrefersDarkMode(mediaQuery.matches);

    // Listen for changes
    const handleChange = (e) => {
      setPrefersDarkMode(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const currentTheme = useMemo(() => {
    return prefersDarkMode ? darkTheme : lightTheme;
  }, [prefersDarkMode]);

  // Prevent flash of wrong theme
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <MUIThemeProvider theme={currentTheme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
}
