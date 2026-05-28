import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  ArrowLeft, Play, Send, AlertTriangle, XCircle, CheckCircle2, ThumbsUp, ThumbsDown,
  UserCheck, User, Clock, GitBranch, Flag,
} from 'lucide-react';
import { tasksApi } from '@/api/tasks';
import { approvalsApi } from '@/api/approvals';
import { useAuthStore } from '@/store/authStore';
import { apiError } from '@/api/client';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { TaskStatus, TaskPriority } from '@/types/task';

dayjs.extend(relativeTime);

const TIMELINE_ICONS: Record<string, React.ReactNode> = {
  'task.created':   <CheckCircle2 className="size-3.5" />,
  'task.assigned':  <UserCheck className="size-3.5" />,
  'task.claimed':   <User className="size-3.5" />,
  'task.started':   <Play className="size-3.5" />,
  'task.submitted': <Send className="size-3.5" />,
  'task.approved':  <ThumbsUp className="size-3.5" />,
  'task.rejected':  <ThumbsDown className="size-3.5" />,
  'task.escalated': <AlertTriangle className="size-3.5" />,
  'task.cancelled': <XCircle className="size-3.5" />,
  'task.completed': <CheckCircle2 className="size-3.5" />,
};

const TIMELINE_COLORS: Record<string, string> = {
  'task.completed': 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
  'task.approved':  'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
  'task.rejected':  'text-rose-600 bg-rose-100 dark:bg-rose-900/30',
  'task.escalated': 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
  'task.cancelled': 'text-slate-500 bg-slate-100 dark:bg-slate-800',
};

type DialogType = 'approve' | 'reject' | 'submit' | 'escalate' | null;

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const taskId = Number(id);

  const [dialog, setDialog]         = useState<DialogType>(null);
  const [comment, setComment]       = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [submitNotes, setSubmitNotes]   = useState('');
  const [escalateReason, setEscalateReason] = useState('');

  const { data: task, isLoading } = useQuery({ queryKey: ['task', id], queryFn: () => tasksApi.get(taskId) });
  const { data: timeline }        = useQuery({ queryKey: ['task-timeline', id], queryFn: () => tasksApi.timeline(taskId), enabled: !!id });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['task', id] });
    qc.invalidateQueries({ queryKey: ['task-timeline', id] });
    qc.invalidateQueries({ queryKey: ['tasks'] });
  };

  const makeMut = (fn: () => Promise<any>, msg: string) =>
    useMutation({ mutationFn: fn, onSuccess: () => { invalidate(); toast.success(msg); setDialog(null); }, onError: (e) => toast.error(apiError(e)) });

  const claimMut    = makeMut(() => tasksApi.claim(taskId), 'Task claimed!');
  const startMut    = makeMut(() => tasksApi.start(taskId), 'Task started!');
  const completeMut = makeMut(() => tasksApi.complete(taskId), 'Task completed!');
  const submitMut   = makeMut(() => tasksApi.submit(taskId, { outcome: 'completed', notes: submitNotes }), 'Submitted for approval!');
  const approveMut  = makeMut(() => approvalsApi.approve(taskId, comment || undefined), 'Task approved!');
  const rejectMut   = makeMut(() => approvalsApi.reject(taskId, rejectReason), 'Task rejected.');
  const escalateMut = makeMut(() => tasksApi.escalate(taskId, { reason: escalateReason }), 'Task escalated.');
  const cancelMut   = makeMut(() => tasksApi.cancel(taskId), 'Task cancelled.');

  const isAdmin   = user?.role === 'admin';
  const isManager = user?.role === 'manager' || isAdmin;
  const isAssignee = task?.current_assignee?.id === user?.id;

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
  if (!task) return <div className="text-muted-foreground p-8 text-center">Task not found.</div>;

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-1.5 text-muted-foreground">
        <ArrowLeft className="size-3.5" /> Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header card */}
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-6 shadow-card">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground">#{task.id}</span>
                  <StatusBadge status={task.status as TaskStatus} />
                  <PriorityBadge priority={task.priority as TaskPriority} />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">{task.title}</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
              {[
                { icon: <GitBranch className="size-3.5" />, label: 'Workflow', value: `WF-${task.workflow_id}` },
                { icon: <User className="size-3.5" />,      label: 'Assignee', value: task.current_assignee?.full_name ?? 'Unassigned' },
                { icon: <Clock className="size-3.5" />,     label: 'Created',  value: dayjs(task.created_at).fromNow() },
                { icon: <Flag className="size-3.5" />,      label: 'Step',     value: `Step ${task.current_step}` },
              ].map((m) => (
                <div key={m.label}>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">{m.icon}{m.label}</div>
                  <div className="text-sm font-semibold text-foreground truncate">{m.value}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Action buttons */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-card">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Actions</p>
            <div className="flex flex-wrap gap-2">
              {task.status === 'CREATED' && (
                <Button size="sm" variant="outline" onClick={() => claimMut.mutate()} disabled={claimMut.isPending}>
                  <UserCheck className="size-3.5" /> Claim Task
                </Button>
              )}
              {task.status === 'ASSIGNED' && isAssignee && (
                <Button size="sm" onClick={() => startMut.mutate()} disabled={startMut.isPending}>
                  <Play className="size-3.5" /> Start Task
                </Button>
              )}
              {task.status === 'IN_PROGRESS' && isAssignee && (
                <Button size="sm" onClick={() => setDialog('submit')}>
                  <Send className="size-3.5" /> Submit for Approval
                </Button>
              )}
              {task.status === 'PENDING_APPROVAL' && isManager && (
                <>
                  <Button size="sm" variant="default" onClick={() => setDialog('approve')} className="bg-emerald-600 hover:bg-emerald-700">
                    <ThumbsUp className="size-3.5" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDialog('reject')} className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-900/20">
                    <ThumbsDown className="size-3.5" /> Reject
                  </Button>
                </>
              )}
              {task.status === 'ASSIGNED' && (
                <Button size="sm" variant="outline" onClick={() => completeMut.mutate()} disabled={completeMut.isPending}>
                  <CheckCircle2 className="size-3.5" /> Complete
                </Button>
              )}
              {!['COMPLETED','CANCELLED'].includes(task.status) && (
                <Button size="sm" variant="ghost" onClick={() => setDialog('escalate')} className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                  <AlertTriangle className="size-3.5" /> Escalate
                </Button>
              )}
              {!['COMPLETED','CANCELLED'].includes(task.status) && isManager && (
                <Button size="sm" variant="ghost" onClick={() => cancelMut.mutate()} disabled={cancelMut.isPending} className="text-muted-foreground">
                  <XCircle className="size-3.5" /> Cancel
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-card h-fit">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Activity Timeline</p>
          <div className="space-y-4">
            {timeline?.map((log: any, i: number) => (
              <div key={log.id} className="flex gap-3">
                <div className={cn(
                  'size-6 rounded-full flex items-center justify-center flex-shrink-0',
                  TIMELINE_COLORS[log.action] ?? 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30'
                )}>
                  {TIMELINE_ICONS[log.action] ?? <Clock className="size-3" />}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-xs font-semibold text-foreground capitalize">
                    {log.action.replace('task.', '').replace('.', ' ')}
                  </p>
                  <p className="text-[0.6875rem] text-muted-foreground">{dayjs(log.created_at).fromNow()}</p>
                </div>
              </div>
            ))}
            {!timeline?.length && <p className="text-sm text-muted-foreground">No activity yet.</p>}
          </div>
        </div>
      </div>

      {/* Submit dialog */}
      <Dialog open={dialog === 'submit'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit for Approval</DialogTitle><DialogDescription>Add completion notes (optional)</DialogDescription></DialogHeader>
          <Textarea placeholder="Notes about what was done…" value={submitNotes} onChange={(e) => setSubmitNotes(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={() => submitMut.mutate()} disabled={submitMut.isPending}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve dialog */}
      <Dialog open={dialog === 'approve'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Approve Task</DialogTitle><DialogDescription>Add an optional comment</DialogDescription></DialogHeader>
          <Textarea placeholder="Approval comment (optional)…" value={comment} onChange={(e) => setComment(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={() => approveMut.mutate()} disabled={approveMut.isPending} className="bg-emerald-600 hover:bg-emerald-700">Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={dialog === 'reject'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Task</DialogTitle><DialogDescription>Reason is required</DialogDescription></DialogHeader>
          <Textarea placeholder="Reason for rejection…" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} required />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => rejectMut.mutate()} disabled={!rejectReason.trim() || rejectMut.isPending}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalate dialog */}
      <Dialog open={dialog === 'escalate'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Escalate Task</DialogTitle><DialogDescription>Provide escalation reason</DialogDescription></DialogHeader>
          <Textarea placeholder="Why is this being escalated?…" value={escalateReason} onChange={(e) => setEscalateReason(e.target.value)} required />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={() => escalateMut.mutate()} disabled={!escalateReason.trim() || escalateMut.isPending} className="bg-amber-500 hover:bg-amber-600">Escalate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
