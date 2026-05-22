import {
  AppBar, Toolbar, Typography, IconButton, Box, Tooltip,
  Avatar, Menu, MenuItem, Divider, Badge, ListItemIcon, Chip,
} from '@mui/material';
import {
  NotificationsNoneRounded, LogoutRounded, PersonRounded,
  KeyboardArrowDownRounded, SettingsRounded, HelpOutlineRounded,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { SIDEBAR_WIDTH, BRAND } from '../../theme';

interface TopbarProps { title: string }

const ROLE_CHIP: Record<string, { label: string; color: string; bg: string }> = {
  admin:    { label: 'Admin',    color: '#dc2626', bg: '#fff1f2' },
  manager:  { label: 'Manager',  color: '#6366f1', bg: '#eef2ff' },
  operator: { label: 'Operator', color: '#059669', bg: '#ecfdf5' },
  viewer:   { label: 'Viewer',   color: '#64748b', bg: '#f1f5f9' },
};

export default function Topbar({ title }: TopbarProps) {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const role = user?.role ?? 'viewer';
  const roleCfg = ROLE_CHIP[role] ?? ROLE_CHIP.viewer;

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
        ml: `${SIDEBAR_WIDTH}px`,
        backgroundColor: 'rgba(248,250,252,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${BRAND.slate200}`,
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ minHeight: '58px !important', px: 3 }}>
        {/* Page title */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{
            fontWeight: 700, color: BRAND.slate900, fontSize: '0.9375rem',
            letterSpacing: '-0.02em',
          }}>
            {title}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Help */}
          <Tooltip title="Help & docs" arrow>
            <IconButton size="small" sx={{ color: BRAND.slate400, width: 34, height: 34 }}>
              <HelpOutlineRounded sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications" arrow>
            <IconButton size="small" sx={{ color: BRAND.slate400, width: 34, height: 34 }}>
              <Badge
                badgeContent={0}
                color="error"
                sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 14, height: 14 } }}
              >
                <NotificationsNoneRounded sx={{ fontSize: 18 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Divider */}
          <Box sx={{ width: 1, height: 22, bgcolor: BRAND.slate200, mx: 0.5 }} />

          {/* User menu trigger */}
          <Box
            onClick={(e) => setAnchor(e.currentTarget)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1, ml: 0.5,
              cursor: 'pointer', borderRadius: 2, px: 1.25, py: 0.625,
              border: `1px solid transparent`,
              '&:hover': { bgcolor: BRAND.slate100, borderColor: BRAND.slate200 },
              transition: 'all 0.15s ease',
            }}
          >
            <Avatar
              sx={{
                width: 28, height: 28, fontSize: '0.75rem',
                background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
              }}
            >
              {user?.full_name?.charAt(0)}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography sx={{
                fontWeight: 600, fontSize: '0.8125rem', display: 'block',
                lineHeight: 1.2, color: BRAND.slate900, letterSpacing: '-0.01em',
              }}>
                {user?.full_name?.split(' ')[0]}
              </Typography>
              <Typography sx={{ color: BRAND.slate400, fontSize: '0.68rem', lineHeight: 1 }}>
                {roleCfg.label}
              </Typography>
            </Box>
            <KeyboardArrowDownRounded sx={{ fontSize: 15, color: BRAND.slate400, ml: -0.25 }} />
          </Box>
        </Box>

        <Menu
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={() => setAnchor(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            elevation: 0,
            sx: {
              mt: 1, minWidth: 220, borderRadius: 2.5,
              border: `1px solid ${BRAND.slate200}`,
              boxShadow: '0 20px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.75 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 36, height: 36, background: 'linear-gradient(135deg, #6366f1, #7c3aed)', fontSize: '0.875rem' }}>
                {user?.full_name?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" sx={{ lineHeight: 1.3 }}>{user?.full_name}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>{user?.email}</Typography>
              </Box>
            </Box>
            <Chip
              label={roleCfg.label}
              size="small"
              sx={{ mt: 1.25, bgcolor: roleCfg.bg, color: roleCfg.color, fontWeight: 700, fontSize: '0.68rem', height: 20 }}
            />
          </Box>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem dense sx={{ gap: 1.5, py: 1, px: 2, borderRadius: 1.5, mx: 0.5 }} onClick={() => setAnchor(null)}>
            <ListItemIcon sx={{ minWidth: 'auto' }}><PersonRounded fontSize="small" sx={{ color: BRAND.slate400 }} /></ListItemIcon>
            <Typography variant="body2" fontWeight={500}>Profile settings</Typography>
          </MenuItem>
          <MenuItem dense sx={{ gap: 1.5, py: 1, px: 2, borderRadius: 1.5, mx: 0.5 }} onClick={() => setAnchor(null)}>
            <ListItemIcon sx={{ minWidth: 'auto' }}><SettingsRounded fontSize="small" sx={{ color: BRAND.slate400 }} /></ListItemIcon>
            <Typography variant="body2" fontWeight={500}>Preferences</Typography>
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem
            dense
            onClick={handleLogout}
            sx={{ gap: 1.5, py: 1, px: 2, borderRadius: 1.5, mx: 0.5, mb: 0.5, color: 'error.main',
              '&:hover': { bgcolor: '#fff1f2' } }}
          >
            <ListItemIcon sx={{ minWidth: 'auto' }}><LogoutRounded fontSize="small" color="error" /></ListItemIcon>
            <Typography variant="body2" fontWeight={600} color="error.main">Sign out</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
