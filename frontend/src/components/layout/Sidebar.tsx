import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, Divider, Avatar, Tooltip,
} from '@mui/material';
import {
  DashboardRounded, AccountTreeRounded, AssignmentRounded,
  ThumbsUpDownRounded, AdminPanelSettingsRounded, TaskAltRounded,
  FiberManualRecordRounded,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { SIDEBAR_WIDTH, BRAND } from '../../theme';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  roles: string[];
}

const NAV_SECTIONS: { heading?: string; items: NavItem[] }[] = [
  {
    items: [
      { label: 'Dashboard',  icon: <DashboardRounded />,         path: '/',           roles: ['admin','manager','operator','viewer'] },
      { label: 'Task Queue', icon: <AssignmentRounded />,         path: '/tasks',      roles: ['admin','manager','operator','viewer'] },
      { label: 'My Tasks',   icon: <TaskAltRounded />,            path: '/tasks/mine', roles: ['admin','manager','operator'] },
    ],
  },
  {
    heading: 'Manage',
    items: [
      { label: 'Approvals',  icon: <ThumbsUpDownRounded />,       path: '/approvals',  roles: ['admin','manager'] },
      { label: 'Workflows',  icon: <AccountTreeRounded />,         path: '/workflows',  roles: ['admin','manager'] },
    ],
  },
  {
    heading: 'System',
    items: [
      { label: 'Admin',      icon: <AdminPanelSettingsRounded />,  path: '/admin',      roles: ['admin'] },
    ],
  },
];

const ROLE_META: Record<string, { label: string; color: string }> = {
  admin:    { label: 'Admin',    color: '#f87171' },
  manager:  { label: 'Manager',  color: '#818cf8' },
  operator: { label: 'Operator', color: '#34d399' },
  viewer:   { label: 'Viewer',   color: '#94a3b8' },
};

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const role = user?.role ?? 'viewer';
  const roleMeta = ROLE_META[role] ?? ROLE_META.viewer;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          boxSizing: 'border-box',
          background: '#0a0f1e',
          color: '#e2e8f0',
          border: 'none',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Brand */}
      <Box sx={{ px: 2.5, pt: 3, pb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38, height: 38, borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 16px rgba(99,102,241,0.5)',
            }}
          >
            <TaskAltRounded sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{
              color: '#f1f5f9', fontWeight: 800, fontSize: '1rem',
              letterSpacing: '-0.02em', lineHeight: 1,
            }}>
              TaskGrid
            </Typography>
            <Typography sx={{ color: '#475569', fontSize: '0.65rem', fontWeight: 600, lineHeight: 1.4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Enterprise
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2, mb: 1 }} />

      {/* Navigation */}
      <Box sx={{ flex: 1, px: 1.5, py: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_SECTIONS.map((section, si) => {
          const visible = section.items.filter((item) => item.roles.includes(role));
          if (!visible.length) return null;
          return (
            <Box key={si} sx={{ mb: 2.5 }}>
              {section.heading && (
                <Typography sx={{
                  color: '#2d3748', fontSize: '0.6rem', fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  px: 1.5, mb: 1, display: 'block',
                }}>
                  {section.heading}
                </Typography>
              )}
              <List dense disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {visible.map((item) => {
                  const isActive = location.pathname === item.path ||
                    (item.path !== '/' && location.pathname.startsWith(item.path));
                  return (
                    <ListItem key={item.path} disablePadding>
                      <Tooltip title={item.label} placement="right" arrow disableHoverListener>
                        <ListItemButton
                          onClick={() => navigate(item.path)}
                          sx={{
                            borderRadius: '8px',
                            py: 0.875,
                            px: 1.5,
                            position: 'relative',
                            overflow: 'hidden',
                            backgroundColor: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                            '&::before': isActive ? {
                              content: '""',
                              position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                              width: 3, height: '55%', borderRadius: '0 3px 3px 0',
                              background: '#818cf8',
                            } : {},
                            '&:hover': {
                              backgroundColor: isActive ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                            },
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          <ListItemIcon sx={{
                            color: isActive ? '#818cf8' : '#374151',
                            minWidth: 34,
                            '& .MuiSvgIcon-root': {
                              fontSize: 18,
                              transition: 'color 0.15s ease',
                            },
                          }}>
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{
                              fontSize: '0.875rem',
                              fontWeight: isActive ? 600 : 500,
                              color: isActive ? '#c7d2fe' : '#6b7280',
                              letterSpacing: '-0.005em',
                            }}
                          />
                        </ListItemButton>
                      </Tooltip>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          );
        })}
      </Box>

      {/* Status bar */}
      <Box sx={{ mx: 1.5, mb: 1.5, p: 1.25, borderRadius: 2, bgcolor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.12)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FiberManualRecordRounded sx={{ fontSize: 8, color: '#10b981', animation: 'pulseGlow 2s infinite' }} />
          <Typography sx={{ fontSize: '0.6875rem', color: '#6b7280', fontWeight: 600 }}>
            All systems operational
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 1.5 }} />

      {/* User profile */}
      <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar
          sx={{
            width: 32, height: 32, fontSize: '0.8125rem',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            flexShrink: 0,
          }}
        >
          {user?.full_name?.charAt(0)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{
            color: '#d1d5db', fontWeight: 600, fontSize: '0.8125rem',
            display: 'block', lineHeight: 1.3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user?.full_name}
          </Typography>
          <Typography sx={{ fontSize: '0.6875rem', color: roleMeta.color, fontWeight: 600, lineHeight: 1.3 }}>
            {roleMeta.label}
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
}
