import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, HelpCircle, LogOut, User, Settings, Moon, Sun, ChevronDown } from 'lucide-react';
import { SIDEBAR_WIDTH } from './Sidebar';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/lib/theme';
import { authApi } from '@/api/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TopbarProps { title: string }

const ROLE_BADGE: Record<string, { label: string; classes: string }> = {
  admin:    { label: 'Admin',    classes: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' },
  manager:  { label: 'Manager',  classes: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
  operator: { label: 'Operator', classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  viewer:   { label: 'Viewer',   classes: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
};

export default function Topbar({ title }: TopbarProps) {
  const { user, clearAuth } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const role = user?.role ?? 'viewer';
  const roleBadge = ROLE_BADGE[role] ?? ROLE_BADGE.viewer;

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
    navigate('/login');
  };

  return (
    <TooltipProvider delayDuration={0}>
      <header
        className="fixed top-0 right-0 z-20 flex items-center h-14 px-6 border-b border-border bg-background/90 backdrop-blur-xl"
        style={{ left: SIDEBAR_WIDTH }}
      >
        <h1 className="flex-1 text-[0.9375rem] font-semibold tracking-tight text-foreground">{title}</h1>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
                <HelpCircle className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Help & docs</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground relative">
                <Bell className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>

          <div className="w-px h-5 bg-border mx-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-lg border border-transparent hover:bg-accent hover:border-border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring">
                <Avatar className="size-7">
                  <AvatarFallback className="text-xs">{user?.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-[0.8125rem] font-semibold text-foreground leading-tight">{user?.full_name?.split(' ')[0]}</p>
                  <p className="text-[0.7rem] text-muted-foreground leading-tight">{roleBadge.label}</p>
                </div>
                <ChevronDown className="size-3.5 text-muted-foreground ml-0.5 hidden sm:block" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2.5">
                <div className="flex items-center gap-2.5 mb-2">
                  <Avatar className="size-9">
                    <AvatarFallback>{user?.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{user?.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold', roleBadge.classes)}>
                  {roleBadge.label}
                </span>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="size-4" />
                Profile settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="size-4" />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </TooltipProvider>
  );
}
