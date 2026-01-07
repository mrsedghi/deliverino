"use client";

import { useState } from "react";
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import { Icon } from "@iconify/react";

export default function MapStyleSelector({ currentStyle, onStyleChange }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const mapStyles = [
    {
      id: "osm",
      name: "Standard",
      icon: "mdi:map",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    {
      id: "carto-light",
      name: "Light",
      icon: "mdi:map-outline",
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    {
      id: "carto-dark",
      name: "Dark",
      icon: "mdi:map-marker",
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    {
      id: "carto-voyager",
      name: "Voyager",
      icon: "mdi:compass-outline",
      url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    {
      id: "stamen-toner",
      name: "Toner",
      icon: "mdi:map-search",
      url: "https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.png",
      attribution:
        'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  ];

  const currentStyleData =
    mapStyles.find((s) => s.id === currentStyle) || mapStyles[0];

  const handleToggle = (e) => {
    setAnchorEl((prev) => (prev ? null : e.currentTarget));
  };

  return (
    <Box
      sx={{
        marginTop: { xs: "200px", sm: "160px" },
        marginLeft: { xs: "20px", sm: "40px" },
        zIndex: 1500,
      }}
    >
      <Tooltip
        title={`Map style: ${currentStyleData.name} (click to change)`}
        arrow
        placement="left"
      >
        <Paper
          elevation={4}
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: "background.paper",
            backdropFilter: "blur(10px)",
          }}
        >
          <IconButton
            onClick={handleToggle}
            size={isMobile ? "medium" : "small"}
            sx={{
              bgcolor: "background.paper",
              width: { xs: 44, sm: 40 },
              height: { xs: 44, sm: 40 },
              "&:hover": { bgcolor: "action.hover" },
            }}
            aria-label="Change map style"
            aria-controls={open ? "map-style-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
          >
            <Icon
              icon={currentStyleData.icon}
              width={isMobile ? 24 : 20}
              height={isMobile ? 24 : 20}
            />
          </IconButton>
        </Paper>
      </Tooltip>

      <Menu
        id="map-style-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        disableScrollLock
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: { xs: 220, sm: 200 },
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: "background.paper",
            backdropFilter: "blur(12px)",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
            maxHeight: 360,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block" }}
          >
            Map style
          </Typography>
          <Typography variant="subtitle2" fontWeight={700}>
            {currentStyleData.name}
          </Typography>
        </Box>
        <Divider />
        {mapStyles.map((style) => {
          const isSelected = currentStyle === style.id;
          return (
            <MenuItem
              key={style.id}
              selected={isSelected}
              onClick={() => {
                onStyleChange(style);
                setAnchorEl(null);
              }}
              sx={{
                py: 1.25,
                "&.Mui-selected": {
                  bgcolor: "action.selected",
                },
                "&.Mui-selected:hover": {
                  bgcolor: "action.selected",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Icon
                  icon={style.icon}
                  width={20}
                  height={20}
                  style={{
                    color: isSelected
                      ? theme.palette.primary.main
                      : theme.palette.text.secondary,
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={style.name}
                primaryTypographyProps={{
                  variant: "body2",
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? "primary.main" : "text.primary",
                }}
              />
              {isSelected && (
                <Icon
                  icon="mdi:check"
                  width={18}
                  height={18}
                  style={{ color: theme.palette.primary.main }}
                />
              )}
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
}
