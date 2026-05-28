import { cn } from '@/lib/utils';
import type { TaskStatus } from '@/types/task';

const STATUS_CFG: Record<TaskStatus, { label: string; classes: string }> = {
  CREATED:          { label: 'Unassigned',       classes: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  ASSIGNED:         { label: 'Assigned',         classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  IN_PROGRESS:      { label: 'In Progress',      classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
  PENDING_APPROVAL: { label: 'Pending Approval', classes: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400' },
  COMPLETED:        { label: 'Completed',        classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  REJECTED:         { label: 'Rejected',         classes: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' },
  ESCALATED:        { label: 'Escalated',        classes: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' },
  CANCELLED:        { label: 'Cancelled',        classes: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500' },
};

export const STATUS_DOT_COLOR: Record<TaskStatus, string> = {
  CREATED: '#94a3b8', ASSIGNED: '#3b82f6', IN_PROGRESS: '#f59e0b',
  PENDING_APPROVAL: '#8b5cf6', COMPLETED: '#10b981', REJECTED: '#f43f5e',
  ESCALATED: '#f97316', CANCELLED: '#cbd5e1',
};

interface Props { status: TaskStatus; className?: string }

export function StatusBadge({ status, className }: Props) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.CREATED;
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold', cfg.classes, className)}>
      {cfg.label}
    </span>
  );
}
