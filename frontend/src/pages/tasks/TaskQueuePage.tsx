import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, ArrowRight } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { tasksApi } from '@/api/tasks';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TaskStatus } from '@/types/task';

dayjs.extend(relativeTime);

type TabVal = 'all' | TaskStatus;

const TABS: { value: TabVal; label: string }[] = [
  { value: 'all',              label: 'All' },
  { value: 'CREATED',          label: 'Unassigned' },
  { value: 'ASSIGNED',         label: 'Assigned' },
  { value: 'IN_PROGRESS',      label: 'In Progress' },
  { value: 'PENDING_APPROVAL', label: 'Pending' },
  { value: 'ESCALATED',        label: 'Escalated' },
  { value: 'COMPLETED',        label: 'Completed' },
];

const LIMIT = 15;

export default function TaskQueuePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMine = location.pathname === '/tasks/mine';
  const [tab, setTab]       = useState<TabVal>('all');
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', { tab, page, mine: isMine }],
    queryFn: () => {
      const params = { status: tab === 'all' ? undefined : tab, page, limit: LIMIT };
      return isMine ? tasksApi.mine(params) : tasksApi.list(params);
    },
  });

  const filtered = search
    ? data?.items.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
    : data?.items;

  return (
    <div>
      <PageHeader
        title={isMine ? 'My Tasks' : 'Task Queue'}
        subtitle={`${data?.total ?? 0} total tasks`}
      />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-0.5 bg-muted p-1 rounded-lg flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => { setTab(t.value); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
                tab === t.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 w-52 h-8 text-sm" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        {isLoading && <div className="h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 animate-pulse" />}
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {['Task', 'Status', 'Priority', 'Assignee', 'Updated', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  ))}</tr>
                ))
              : filtered?.map((task) => (
                  <motion.tr
                    key={task.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground flex-shrink-0">#{task.id}</span>
                        <span className="text-sm font-semibold text-foreground truncate max-w-[200px] group-hover:text-primary transition-colors">
                          {task.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={task.status as TaskStatus} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={task.priority as any} /></td>
                    <td className="px-4 py-3"><span className="text-sm text-muted-foreground">{task.current_assignee?.full_name ?? '—'}</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-muted-foreground">{dayjs(task.updated_at).fromNow()}</span></td>
                    <td className="px-4 py-3"><ArrowRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" /></td>
                  </motion.tr>
                ))
            }
          </tbody>
        </table>
        {!isLoading && !filtered?.length && <EmptyState message="No tasks found" description="Try adjusting your filters." />}
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-muted-foreground">Page {page} of {data.pages}</span>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
