import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { SIDEBAR_WIDTH } from '../../theme';

const PAGE_TITLES: Record<string, string> = {
  '/':            'Dashboard',
  '/tasks':       'Task Queue',
  '/tasks/mine':  'My Tasks',
  '/approvals':   'Approval Inbox',
  '/workflows':   'Workflows',
  '/workflows/new': 'New Workflow',
  '/admin':       'Admin Overview',
};

function getTitle(pathname: string): string {
  if (pathname.startsWith('/tasks/') && pathname !== '/tasks/mine') return 'Task Detail';
  if (pathname.startsWith('/workflows/') && pathname !== '/workflows/new') return 'Workflow Detail';
  return PAGE_TITLES[pathname] ?? 'TaskGrid';
}

export default function AppLayout() {
  const location = useLocation();
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, ml: `${SIDEBAR_WIDTH}px` }}>
        <Topbar title={getTitle(location.pathname)} />
        <Box
          component="main"
          sx={{
            flex: 1,
            p: '28px 32px',
            mt: '58px',
            maxWidth: '100%',
            overflowX: 'hidden',
            animation: 'fadeSlideIn 0.25s ease both',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
