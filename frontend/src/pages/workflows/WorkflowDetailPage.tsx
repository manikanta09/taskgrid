import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Rocket, User, Clock, GitBranch } from 'lucide-react';
import dayjs from 'dayjs';
import { workflowsApi } from '@/api/workflows';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { TaskStatus, TaskPriority } from '@/types/task';

const STATUS_CFG: Record<string, { label: string; classes: string }> = {
  DRAFT:    { label: 'Draft',    classes: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  ACTIVE:   { label: 'Active',   classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  ARCHIVED: { label: 'Archived', classes: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500' },
};

const ROLE_COLORS: Record<string, string> = {
  admin: '#ef4444', manager: '#6366f1', operator: '#10b981', viewer: '#64748b',
};

export default function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: wf, isLoading } = useQuery({ queryKey: ['workflow', id], queryFn: () => workflowsApi.get(Number(id)) });
  const { data: tasks }         = useQuery({ queryKey: ['workflow-tasks', id], queryFn: () => workflowsApi.tasks(Number(id), { limit: 20 }), enabled: !!id });

  const publishMut = useMutation({
    mutationFn: () => workflowsApi.publish(Number(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflow', id] }),
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-48 w-full" /></div>;
  if (!wf) return <div className="text-muted-foreground p-8 text-center">Workflow not found.</div>;

  const cfg = STATUS_CFG[wf.status];

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate('/workflows')} className="mb-4 gap-1.5 text-muted-foreground">
        <ArrowLeft className="size-3.5" /> Back to Workflows
      </Button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-6 shadow-card mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold tracking-tight text-foreground">{wf.name}</h1>
              <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold', cfg.classes)}>{cfg.label}</span>
            </div>
            {wf.description && <p className="text-sm text-muted-foreground mb-4">{wf.description}</p>}
            <div className="flex items-center gap-6">
              {[
                { label: 'Steps', value: wf.steps.length },
                { label: 'Created by', value: wf.created_by.full_name },
                { label: 'Created', value: dayjs(wf.created_at).format('MMM D, YYYY') },
                { label: 'Task instances', value: tasks?.total ?? '–' },
              ].map((m) => (
                <div key={m.label}>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-sm font-semibold text-foreground">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {wf.status === 'DRAFT' && (
              <Button variant="default" onClick={() => publishMut.mutate()} disabled={publishMut.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                <Play className="size-4" /> Publish
              </Button>
            )}
            {wf.status === 'ACTIVE' && (
              <Button variant="gradient" onClick={() => navigate('/workflows')}>
                <Rocket className="size-4" /> Trigger Task
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Steps */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-card h-fit">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Workflow Steps</p>
          <div className="space-y-3">
            {wf.steps.map((step, i) => (
              <div key={step.step} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="size-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {step.step}
                  </div>
                  {i < wf.steps.length - 1 && <div className="flex-1 w-px bg-border mt-1.5" />}
                </div>
                <div className="pb-4 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{step.name}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold"
                      style={{ background: `${ROLE_COLORS[step.assignee_role]}15`, color: ROLE_COLORS[step.assignee_role] ?? '#64748b' }}>
                      <User className="size-2.5" />{step.assignee_role}
                    </span>
                    {step.sla_hours && (
                      <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Clock className="size-2.5" />{step.sla_hours}h SLA
                      </span>
                    )}
                    {step.requires_approval && (
                      <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                        Needs Approval
                      </span>
                    )}
                  </div>
                  {step.instructions && <p className="text-xs text-muted-foreground mt-1">{step.instructions}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task instances */}
        <div className="lg:col-span-3 bg-card border border-border rounded-xl overflow-hidden shadow-card">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Task Instances</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Task','Assignee','Status','Priority','Updated'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasks?.items.map((task) => (
                <tr key={task.id} className="hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => navigate(`/tasks/${task.id}`)}>
                  <td className="px-4 py-2.5">
                    <span className="text-xs font-mono text-muted-foreground mr-1.5">#{task.id}</span>
                    <span className="text-sm font-medium text-foreground">{task.title}</span>
                  </td>
                  <td className="px-4 py-2.5"><span className="text-sm text-muted-foreground">{task.current_assignee?.full_name ?? '—'}</span></td>
                  <td className="px-4 py-2.5"><StatusBadge status={task.status as TaskStatus} /></td>
                  <td className="px-4 py-2.5"><PriorityBadge priority={task.priority as TaskPriority} /></td>
                  <td className="px-4 py-2.5"><span className="text-xs text-muted-foreground">{dayjs(task.updated_at).format('MMM D')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!tasks?.items.length && (
            <div className="py-10 text-center text-sm text-muted-foreground">No tasks yet. Trigger one from the workflow list.</div>
          )}
        </div>
      </div>
    </div>
  );
}
