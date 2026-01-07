"use client";

import { Card, CardContent, Typography, Box, Chip, Stack, Skeleton, useTheme, useMediaQuery } from "@mui/material";
import { Icon } from "@iconify/react";
import { useMemo } from "react";

const modeIcons = {
  WALKING: "mdi:walk",
  SCOOTER: "mdi:scooter",
  BICYCLE: "mdi:bicycle",
  MOTORCYCLE: "mdi:motorbike",
  CAR: "mdi:car",
};

const modeLabels = {
  WALKING: "Walking",
  SCOOTER: "Scooter",
  BICYCLE: "Bicycle",
  MOTORCYCLE: "Motorcycle",
  CAR: "Car",
};

const modeColors = {
  WALKING: "#10b981",
  SCOOTER: "#3b82f6",
  BICYCLE: "#8b5cf6",
  MOTORCYCLE: "#f59e0b",
  CAR: "#ef4444",
};

export default function ModeCard({
  mode,
  fare,
  estimatedDuration,
  enabled,
  reason,
  isSelected,
  isSuggested,
  onClick,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const modeColor = useMemo(() => modeColors[mode] || theme.palette.primary.main, [mode, theme]);

  if (!mode) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardContent>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={20} />
          <Skeleton variant="text" width="50%" height={20} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      variant={isSelected ? "elevation" : "outlined"}
      elevation={isSelected ? 6 : 0}
      onClick={enabled ? onClick : undefined}
      sx={{
        cursor: enabled ? "pointer" : "not-allowed",
        opacity: enabled ? 1 : 0.65,
        border: isSelected ? 2.5 : 1.5,
        borderColor: isSelected 
          ? modeColor 
          : enabled 
          ? "divider" 
          : "action.disabled",
        height: "100%",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "visible",
        animation: isSelected ? "slideIn 0.3s ease-out" : "none",
        "@keyframes slideIn": {
          "0%": {
            transform: "scale(0.95)",
            opacity: 0.8,
          },
          "100%": {
            transform: "scale(1)",
            opacity: 1,
          },
        },
        "&:hover": enabled
          ? {
              borderColor: modeColor,
              boxShadow: isSelected ? 8 : 4,
              transform: "translateY(-4px) scale(1.02)",
              borderWidth: 2.5,
            }
          : {},
        "&:active": enabled
          ? {
              transform: "translateY(-2px) scale(0.98)",
            }
          : {},
        ...(isSelected && {
          "&::before": {
            content: '""',
            position: "absolute",
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            borderRadius: "inherit",
            background: `linear-gradient(135deg, ${modeColor}22, ${modeColor}11)`,
            zIndex: -1,
          },
        }),
      }}
      role={enabled ? "button" : undefined}
      tabIndex={enabled ? 0 : undefined}
      onKeyDown={(e) => {
        if (enabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`${modeLabels[mode] || mode} delivery mode${isSelected ? " (selected)" : ""}${isSuggested ? " (suggested)" : ""}`}
      aria-pressed={isSelected}
    >
      <CardContent sx={{ p: { xs: 2, sm: 1.75 }, "&:last-child": { pb: { xs: 2, sm: 1.75 } } }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box
            sx={{
              width: { xs: 56, sm: 52 },
              height: { xs: 56, sm: 52 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: enabled 
                ? modeColor 
                : theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.06)",
              borderRadius: 2.5,
              flexShrink: 0,
              transition: "all 0.2s ease-in-out",
              ...(isSelected && {
                boxShadow: `0 4px 12px ${modeColor}40`,
                transform: "scale(1.05)",
              }),
            }}
          >
            <Icon
              icon={modeIcons[mode] || "mdi:help-circle"}
              width={isMobile ? 32 : 28}
              height={isMobile ? 32 : 28}
              color={enabled ? "#fff" : theme.palette.text.disabled}
            />
          </Box>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack 
              direction="row" 
              spacing={1} 
              alignItems="center" 
              mb={1}
              flexWrap="wrap"
              sx={{ gap: 0.75 }}
            >
              <Typography 
                variant={isMobile ? "subtitle1" : "subtitle2"} 
                fontWeight={isSelected ? 700 : 600}
                sx={{
                  fontSize: { xs: "1rem", sm: "0.9375rem" },
                  color: isSelected ? modeColor : "text.primary",
                  transition: "color 0.2s ease",
                }}
                noWrap
              >
                {modeLabels[mode] || mode}
              </Typography>
              {isSuggested && (
                <Chip 
                  label="Suggested" 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                  sx={{
                    height: { xs: 24, sm: 22 },
                    fontSize: { xs: "0.6875rem", sm: "0.625rem" },
                    fontWeight: 600,
                    borderColor: modeColor,
                    color: modeColor,
                  }}
                />
              )}
              {isSelected && (
                <Chip 
                  label="Selected" 
                  size="small" 
                  sx={{
                    height: { xs: 24, sm: 22 },
                    fontSize: { xs: "0.6875rem", sm: "0.625rem" },
                    fontWeight: 600,
                    bgcolor: modeColor,
                    color: "#fff",
                  }}
                />
              )}
            </Stack>
            {enabled ? (
              <Stack spacing={0.75}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Icon 
                    icon="mdi:currency-usd" 
                    width={16} 
                    height={16}
                    style={{ color: theme.palette.text.secondary, opacity: 0.7 }}
                  />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.9375rem", sm: "0.875rem" } }}
                  >
                    <strong style={{ color: theme.palette.text.primary, fontSize: "1.1em" }}>
                      ${fare?.toFixed(2)}
                    </strong>
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Icon 
                    icon="mdi:clock-outline" 
                    width={16} 
                    height={16}
                    style={{ color: theme.palette.text.secondary, opacity: 0.7 }}
                  />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.9375rem", sm: "0.875rem" } }}
                  >
                    <strong style={{ color: theme.palette.text.primary, fontSize: "1.1em" }}>
                      {estimatedDuration} min
                    </strong>
                  </Typography>
                </Box>
              </Stack>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                <Icon 
                  icon="mdi:alert-circle-outline" 
                  width={16} 
                  height={16}
                  style={{ color: theme.palette.error.main }}
                />
                <Typography 
                  variant="body2" 
                  color="error"
                  sx={{ fontSize: { xs: "0.875rem", sm: "0.8125rem" } }}
                >
                  {reason || "Not available"}
                </Typography>
              </Box>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
