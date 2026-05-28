import { cn } from '@/lib/utils';
import type { TaskPriority } from '@/types/task';

const PRIORITY_CFG: Record<TaskPriority, { label: string; classes: string; dot: string }> = {
  low:      { label: 'Low',      dot: '#94a3b8', classes: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
  medium:   { label: 'Medium',   dot: '#3b82f6', classes: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' },
  high:     { label: 'High',     dot: '#f59e0b', classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
  critical: { label: 'Critical', dot: '#f43f5e', classes: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' },
};

interface Props { priority: TaskPriority; className?: string }

export function PriorityBadge({ priority, className }: Props) {
  const cfg = PRIORITY_CFG[priority] ?? PRIORITY_CFG.medium;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold', cfg.classes, className)}>
      <span className="size-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}
