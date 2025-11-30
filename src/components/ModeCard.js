"use client";

import { Card, CardContent, Typography, Box, Chip, Stack, Skeleton } from "@mui/material";
import { Icon } from "@iconify/react";

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
  if (!mode) {
    return (
      <Card variant="outlined">
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
      elevation={isSelected ? 4 : 0}
      onClick={enabled ? onClick : undefined}
      sx={{
        cursor: enabled ? "pointer" : "not-allowed",
        opacity: enabled ? 1 : 0.6,
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? "primary.main" : "divider",
        "&:hover": enabled
          ? {
              borderColor: "primary.main",
              boxShadow: 2,
            }
          : {},
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 48,
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: enabled ? "primary.light" : "action.disabledBackground",
              borderRadius: 2,
            }}
          >
            <Icon
              icon={modeIcons[mode] || "mdi:help-circle"}
              width={32}
              height={32}
              color={enabled ? "#fff" : "#999"}
            />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
              <Typography variant="subtitle1" fontWeight="bold">
                {modeLabels[mode] || mode}
              </Typography>
              {isSuggested && (
                <Chip label="Suggested" size="small" color="primary" variant="outlined" />
              )}
              {isSelected && (
                <Chip label="Selected" size="small" color="primary" />
              )}
            </Stack>
            {enabled ? (
              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Fare: <strong>${fare?.toFixed(2)}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ETA: <strong>{estimatedDuration} min</strong>
                </Typography>
              </Stack>
            ) : (
              <Typography variant="body2" color="error">
                {reason || "Not available"}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
