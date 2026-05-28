import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ListFilter, CheckCircle2, ShieldCheck, Users, LayoutGrid, UserX, UserCheck } from 'lucide-react';
import { adminApi } from '@/api/approvals';
import { usersApi } from '@/api/users';
import { apiError } from '@/api/client';
import MetricCard from '@/components/common/MetricCard';
import PageHeader from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { TaskStatus } from '@/types/task';

dayjs.extend(relativeTime);

const ROLE_CFG: Record<string, { color: string; bg: string; classes: string }> = {
  admin:    { color: '#dc2626', bg: '#fee2e2', classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  manager:  { color: '#6366f1', bg: '#ede9fe', classes: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  operator: { color: '#059669', bg: '#d1fae5', classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  viewer:   { color: '#64748b', bg: '#f1f5f9', classes: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
};

const ENTITY_TYPES = ['all', 'task', 'workflow', 'user', 'approval'];
const AI_SYSTEMS = [
  { label: 'Task Routing Model',     health: 98, status: 'Operational', color: '#10b981', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { label: 'SLA Prediction Engine',  health: 94, status: 'Operational', color: '#10b981', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { label: 'Escalation Classifier',  health: 87, status: 'Degraded',    color: '#f59e0b', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { label: 'Workload Balancer',       health: 100, status: 'Operational', color: '#10b981', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
];

export default function AdminPage() {
  const qc = useQueryClient();
  const [tab, setTab]           = useState<'users' | 'audit'>('users');
  const [entityFilter, setEntityFilter] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; userId: number | null; action: 'deactivate' | 'reactivate' }>({
    open: false, userId: null, action: 'deactivate',
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.stats,
    refetchInterval: 30000,
  });

  const { data: auditLogsData, isLoading: logsLoading } = useQuery({
    queryKey: ['audit-logs', entityFilter],
    queryFn: () => adminApi.auditLogs({ entity_type: entityFilter === 'all' ? undefined : entityFilter, limit: 50 }),
  });
  const auditLogs = auditLogsData?.items ?? [];

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list({ limit: 50 }),
  });

  const deactivateMut = useMutation({
    mutationFn: (id: number) => usersApi.deactivate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setConfirmDialog({ open: false, userId: null, action: 'deactivate' }); toast.success('User deactivated.'); },
    onError: (e) => toast.error(apiError(e)),
  });

  const reactivateMut = useMutation({
    mutationFn: (id: number) => usersApi.reactivate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setConfirmDialog({ open: false, userId: null, action: 'reactivate' }); toast.success('User reactivated.'); },
    onError: (e) => toast.error(apiError(e)),
  });

  const handleConfirm = () => {
    if (!confirmDialog.userId) return;
    if (confirmDialog.action === 'deactivate') deactivateMut.mutate(confirmDialog.userId);
    else reactivateMut.mutate(confirmDialog.userId);
  };

  const isMutating = deactivateMut.isPending || reactivateMut.isPending;

  return (
    <div className="space-y-5">
      <PageHeader title="Admin Overview" subtitle="System health, users, and audit logs" />

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Tasks',       icon: <ListFilter   className="size-5" />, color: '#6366f1', bg: '#ede9fe', value: stats?.tasks?.total ?? 0,              loading: statsLoading },
          { title: 'Active Workflows',  icon: <CheckCircle2 className="size-5" />, color: '#10b981', bg: '#d1fae5', value: stats?.workflows?.active ?? 0,         loading: statsLoading },
          { title: 'Pending Approvals', icon: <ShieldCheck  className="size-5" />, color: '#f59e0b', bg: '#fef3c7', value: stats?.tasks?.pending_approval ?? 0,   loading: statsLoading },
          { title: 'Total Users',       icon: <Users        className="size-5" />, color: '#8b5cf6', bg: '#ede9fe', value: stats?.users?.total ?? 0,               loading: statsLoading },
        ].map((m) => <MetricCard key={m.title} {...m} />)}
      </div>

      {/* AI System Health */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-card">
        <p className="text-sm font-bold text-foreground mb-4">AI System Health</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {AI_SYSTEMS.map((item) => (
            <div key={item.label} className="border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
                <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-[0.6rem] font-bold', item.bg)}>{item.status}</span>
              </div>
              <p className="text-2xl font-extrabold mb-2" style={{ color: item.color }}>{item.health}%</p>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${item.health}%`, background: item.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 bg-muted p-1 rounded-lg w-fit">
        {([['users', 'User Management'], ['audit', 'Audit Log']] as const).map(([val, label]) => (
          <button key={val} onClick={() => setTab(val)}
            className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
              tab === val ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {label}
          </button>
        ))}
      </div>

      {/* User Management */}
      {tab === 'users' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
          {usersLoading && <div className="h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 animate-pulse" />}
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['User', 'Role', 'Status', 'Last Login', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {usersLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    ))}</tr>
                  ))
                : users?.items.map((user) => {
                    const roleCfg = ROLE_CFG[user.role] ?? ROLE_CFG.viewer;
                    return (
                      <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                              {user.full_name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{user.full_name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold capitalize', roleCfg.classes)}>{user.role}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
                            user.is_active
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                          )}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3"><span className="text-xs text-muted-foreground">{user.last_login_at ? dayjs(user.last_login_at).fromNow() : 'Never'}</span></td>
                        <td className="px-4 py-3"><span className="text-xs text-muted-foreground">{dayjs(user.created_at).format('MMM D, YYYY')}</span></td>
                        <td className="px-4 py-3">
                          {user.is_active ? (
                            <button
                              onClick={() => setConfirmDialog({ open: true, userId: user.id, action: 'deactivate' })}
                              className="p-1.5 rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors text-rose-500"
                              title="Deactivate user"
                            >
                              <UserX className="size-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmDialog({ open: true, userId: user.id, action: 'reactivate' })}
                              className="p-1.5 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-emerald-600"
                              title="Reactivate user"
                            >
                              <UserCheck className="size-3.5" />
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Audit Log */}
      {tab === 'audit' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
          <div className="px-5 py-4 border-b border-border flex items-center gap-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Filter by entity</p>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-44 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs capitalize">{t === 'all' ? 'All Types' : t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {logsLoading && <div className="h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 animate-pulse" />}
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Time', 'Actor', 'Action', 'Entity', 'Status Change'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {auditLogs.map((log: any) => {
                const fromStatus = log.before_state?.status as TaskStatus | undefined;
                const toStatus   = log.after_state?.status  as TaskStatus | undefined;
                return (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-mono text-muted-foreground">{dayjs(log.created_at).format('MMM D HH:mm')}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-semibold text-foreground">{log.actor_id ? `User #${log.actor_id}` : 'System'}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[0.6rem] font-semibold bg-muted text-muted-foreground capitalize">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs text-muted-foreground capitalize">{log.entity_type} #{log.entity_id}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      {fromStatus && toStatus ? (
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={fromStatus} />
                          <span className="text-muted-foreground text-xs">→</span>
                          <StatusBadge status={toStatus} />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!logsLoading && !auditLogs.length && (
            <div className="py-8 text-center text-sm text-muted-foreground">No audit log entries found.</div>
          )}
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(o) => !o && !isMutating && setConfirmDialog({ open: false, userId: null, action: 'deactivate' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.action === 'deactivate' ? 'Deactivate User?' : 'Reactivate User?'}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmDialog.action === 'deactivate'
              ? 'This user will no longer be able to log in. Their existing task assignments will remain.'
              : 'This user will be able to log in and access TaskGrid again.'}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, userId: null, action: 'deactivate' })} disabled={isMutating}>Cancel</Button>
            <Button
              variant={confirmDialog.action === 'deactivate' ? 'destructive' : 'default'}
              onClick={handleConfirm}
              disabled={isMutating}
            >
              {isMutating ? 'Processing…' : confirmDialog.action === 'deactivate' ? 'Deactivate' : 'Reactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
