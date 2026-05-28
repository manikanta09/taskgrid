import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, Eye, Play, Archive, Rocket, GitBranch } from 'lucide-react';
import dayjs from 'dayjs';
import { workflowsApi } from '@/api/workflows';
import { apiError } from '@/api/client';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { WorkflowStatus } from '@/types/workflow';

const STATUS_CFG: Record<WorkflowStatus, { label: string; classes: string }> = {
  DRAFT:    { label: 'Draft',    classes: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  ACTIVE:   { label: 'Active',   classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  ARCHIVED: { label: 'Archived', classes: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500' },
};

type TabVal = 'all' | WorkflowStatus;

export default function WorkflowListPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabVal>('all');
  const [triggerDialog, setTriggerDialog] = useState<{ open: boolean; workflowId: number | null }>({ open: false, workflowId: null });
  const [triggerForm, setTriggerForm] = useState({ title: '', priority: 'medium' });

  const { data, isLoading } = useQuery({
    queryKey: ['workflows', tab],
    queryFn: () => workflowsApi.list({ status: tab === 'all' ? undefined : tab, limit: 50 }),
  });

  const publishMut = useMutation({
    mutationFn: (id: number) => workflowsApi.publish(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workflows'] }); toast.success('Workflow published!'); },
    onError: (e) => toast.error(apiError(e)),
  });

  const archiveMut = useMutation({
    mutationFn: (id: number) => workflowsApi.archive(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workflows'] }); toast.success('Workflow archived.'); },
    onError: (e) => toast.error(apiError(e)),
  });

  const triggerMut = useMutation({
    mutationFn: ({ id, form }: { id: number; form: typeof triggerForm }) =>
      workflowsApi.trigger(id, { title: form.title || undefined, priority: form.priority as any }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      setTriggerDialog({ open: false, workflowId: null });
      toast.success(`Task #${data.task_id} created!`);
      navigate('/tasks');
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const tabs: TabVal[] = ['all', 'ACTIVE', 'DRAFT', 'ARCHIVED'];

  return (
    <div>
      <PageHeader
        title="Workflows"
        subtitle={`${data?.total ?? 0} workflow definitions`}
        action={<Button variant="gradient" onClick={() => navigate('/workflows/new')}><Plus className="size-4" />New Workflow</Button>}
      />

      <div className="flex items-center gap-0.5 bg-muted p-1 rounded-lg w-fit mb-5">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
              tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {t === 'all' ? 'All' : STATUS_CFG[t as WorkflowStatus]?.label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        {isLoading && <div className="h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 animate-pulse" />}
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {['Workflow', 'Steps', 'Status', 'Created By', 'Updated', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  ))}</tr>
                ))
              : data?.items.map((wf) => {
                  const cfg = STATUS_CFG[wf.status];
                  return (
                    <motion.tr key={wf.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                            <GitBranch className="size-4 text-violet-600 dark:text-violet-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{wf.name}</p>
                            {wf.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{wf.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold bg-muted text-muted-foreground">
                          {wf.steps.length} steps
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold', cfg.classes)}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3"><span className="text-sm text-muted-foreground">{wf.created_by.full_name}</span></td>
                      <td className="px-4 py-3"><span className="text-xs text-muted-foreground">{dayjs(wf.updated_at).format('MMM D, YYYY')}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => navigate(`/workflows/${wf.id}`)} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <Eye className="size-3.5" />
                          </button>
                          {wf.status === 'DRAFT' && (
                            <button onClick={() => publishMut.mutate(wf.id)} className="p-1.5 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-emerald-600">
                              <Play className="size-3.5" />
                            </button>
                          )}
                          {wf.status === 'ACTIVE' && (
                            <>
                              <button onClick={() => { setTriggerForm({ title: '', priority: 'medium' }); setTriggerDialog({ open: true, workflowId: wf.id }); }}
                                className="p-1.5 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors text-indigo-600">
                                <Rocket className="size-3.5" />
                              </button>
                              <button onClick={() => archiveMut.mutate(wf.id)} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                                <Archive className="size-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
            }
          </tbody>
        </table>
        {!isLoading && !data?.items.length && <EmptyState message="No workflows found" description="Create your first workflow to get started." action={<Button variant="gradient" onClick={() => navigate('/workflows/new')}><Plus className="size-4" />New Workflow</Button>} />}
      </div>

      <Dialog open={triggerDialog.open} onOpenChange={(o) => !o && setTriggerDialog({ open: false, workflowId: null })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Trigger New Task</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Task Title (optional)</Label>
              <Input value={triggerForm.title} onChange={(e) => setTriggerForm((f) => ({ ...f, title: e.target.value }))} placeholder="Auto-generated if empty" />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={triggerForm.priority} onValueChange={(v) => setTriggerForm((f) => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['low','medium','high','critical'].map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTriggerDialog({ open: false, workflowId: null })}>Cancel</Button>
            <Button variant="gradient" onClick={() => triggerMut.mutate({ id: triggerDialog.workflowId!, form: triggerForm })} disabled={triggerMut.isPending}>
              {triggerMut.isPending ? 'Creating…' : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
