"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Modal,
  Paper,
  Typography,
  LinearProgress,
  Button,
  Stack,
  CircularProgress,
} from "@mui/material";
import { Icon } from "@iconify/react";

export default function WaitingScreen({ orderId, onClose }) {
  const [countdown, setCountdown] = useState(30); // 30 seconds countdown

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  return (
    <Modal
      open={true}
      onClose={onClose}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
    >
      <Paper
        sx={{
          p: 4,
          maxWidth: 400,
          width: "90%",
          textAlign: "center",
        }}
      >
        <Stack spacing={3} alignItems="center">
          <CircularProgress size={60} />
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Order Created!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Waiting for a courier to accept your order...
            </Typography>
          </Box>

          <Paper variant="outlined" sx={{ p: 2, width: "100%" }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Order ID
            </Typography>
            <Typography variant="h6" fontFamily="monospace" fontWeight="bold">
              {orderId}
            </Typography>
          </Paper>

          <Box sx={{ width: "100%" }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Matching with couriers...
            </Typography>
            <LinearProgress
              variant="determinate"
              value={((30 - countdown) / 30) * 100}
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              {countdown > 0 ? `Next update in ${countdown}s` : "Checking for matches..."}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            fullWidth
            onClick={onClose}
            startIcon={<Icon icon="mdi:close" />}
          >
            Close (Order will continue matching)
          </Button>
        </Stack>
      </Paper>
    </Modal>
  );
}
