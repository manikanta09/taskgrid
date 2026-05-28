import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar, { SIDEBAR_WIDTH } from './Sidebar';
import Topbar from './Topbar';
import { Toaster } from 'sonner';

const PAGE_TITLES: Record<string, string> = {
  '/':              'Dashboard',
  '/tasks':         'Task Queue',
  '/tasks/mine':    'My Tasks',
  '/approvals':     'Approval Inbox',
  '/workflows':     'Workflows',
  '/workflows/new': 'New Workflow',
  '/admin':         'Admin Overview',
};

function getTitle(pathname: string): string {
  if (pathname.startsWith('/tasks/') && pathname !== '/tasks/mine') return 'Task Detail';
  if (pathname.startsWith('/workflows/') && pathname !== '/workflows/new') return 'Workflow Detail';
  return PAGE_TITLES[pathname] ?? 'TaskGrid';
}

export default function AppLayout() {
  const location = useLocation();
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0" style={{ marginLeft: SIDEBAR_WIDTH }}>
        <Topbar title={getTitle(location.pathname)} />
        <main className="flex-1 px-8 pb-8" style={{ paddingTop: 'calc(56px + 28px)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: 'bg-card border border-border text-foreground shadow-modal rounded-xl text-sm font-medium',
          },
        }}
      />
    </div>
  );
}
