import { motion } from 'framer-motion';
import {
  LayoutDashboard, ListTodo, CheckSquare, ThumbsUp,
  GitBranch, Shield, CheckCircle2, Zap,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

export const SIDEBAR_WIDTH = 240;

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  roles: string[];
}

const NAV_SECTIONS: { heading?: string; items: NavItem[] }[] = [
  {
    items: [
      { label: 'Dashboard',  icon: <LayoutDashboard className="size-4" />, path: '/',           roles: ['admin','manager','operator','viewer'] },
      { label: 'Task Queue', icon: <ListTodo className="size-4" />,        path: '/tasks',      roles: ['admin','manager','operator','viewer'] },
      { label: 'My Tasks',   icon: <CheckSquare className="size-4" />,     path: '/tasks/mine', roles: ['admin','manager','operator'] },
    ],
  },
  {
    heading: 'Manage',
    items: [
      { label: 'Approvals', icon: <ThumbsUp className="size-4" />,    path: '/approvals',  roles: ['admin','manager'] },
      { label: 'Workflows', icon: <GitBranch className="size-4" />,   path: '/workflows',  roles: ['admin','manager'] },
    ],
  },
  {
    heading: 'System',
    items: [
      { label: 'Admin', icon: <Shield className="size-4" />, path: '/admin', roles: ['admin'] },
    ],
  },
];

const ROLE_COLORS: Record<string, string> = {
  admin: '#f87171', manager: '#818cf8', operator: '#34d399', viewer: '#94a3b8',
};
const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin', manager: 'Manager', operator: 'Operator', viewer: 'Viewer',
};

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const role = user?.role ?? 'viewer';

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className="fixed top-0 left-0 h-screen flex flex-col z-30"
        style={{ width: SIDEBAR_WIDTH, background: '#0a0f1e', borderRight: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Brand */}
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
              <Zap className="size-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-100 tracking-tight leading-none">TaskGrid</div>
              <div className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-indigo-400 leading-tight">Enterprise</div>
            </div>
          </div>
        </div>

        <div className="mx-4 h-px bg-white/5" />

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-3 overflow-y-auto overflow-x-hidden space-y-4">
          {NAV_SECTIONS.map((section, si) => {
            const visible = section.items.filter((i) => i.roles.includes(role));
            if (!visible.length) return null;
            return (
              <div key={si}>
                {section.heading && (
                  <p className="px-3 mb-1.5 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-slate-600">
                    {section.heading}
                  </p>
                )}
                <ul className="space-y-0.5">
                  {visible.map((item) => {
                    const isActive = location.pathname === item.path ||
                      (item.path !== '/' && location.pathname.startsWith(item.path));
                    return (
                      <li key={item.path}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => navigate(item.path)}
                              className={cn(
                                'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative',
                                isActive
                                  ? 'bg-indigo-500/10 text-indigo-300'
                                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                              )}
                            >
                              {isActive && (
                                <motion.div
                                  layoutId="active-sidebar"
                                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-400 rounded-r"
                                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                              )}
                              <span className={isActive ? 'text-indigo-400' : ''}>{item.icon}</span>
                              {item.label}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right">{item.label}</TooltipContent>
                        </Tooltip>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Status badge */}
        <div className="mx-2.5 mb-2 px-3 py-2 rounded-lg bg-emerald-500/8 border border-emerald-500/12">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
            <span className="text-[0.6875rem] text-slate-500 font-semibold">All systems operational</span>
          </div>
        </div>

        <div className="mx-2.5 h-px bg-white/5" />

        {/* User */}
        <div className="px-3 py-3 flex items-center gap-2.5">
          <Avatar className="size-8 flex-shrink-0">
            <AvatarFallback className="text-xs">{user?.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[0.8125rem] font-semibold text-slate-300 truncate leading-tight">{user?.full_name}</p>
            <p className="text-[0.6875rem] font-semibold leading-tight" style={{ color: ROLE_COLORS[role] }}>
              {ROLE_LABELS[role]}
            </p>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
