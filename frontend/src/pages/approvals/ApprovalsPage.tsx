import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ThumbsUp, ThumbsDown, Clock, GitBranch, CheckCircle2 } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { approvalsApi } from '@/api/approvals';
import { apiError } from '@/api/client';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Task, TaskPriority } from '@/types/task';

dayjs.extend(relativeTime);

export default function ApprovalsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<{ task: Task; action: 'approve' | 'reject' } | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const { data: pending, isLoading } = useQuery({
    queryKey: ['approvals-pending'],
    queryFn: approvalsApi.pending,
    refetchInterval: 15000,
  });

  const approveMut = useMutation({
    mutationFn: (taskId: number) => approvalsApi.approve(taskId, comment || undefined),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['approvals-pending'] }); qc.invalidateQueries({ queryKey: ['tasks'] }); setSelected(null); toast.success('Task approved!'); },
    onError: (e) => setError(apiError(e)),
  });

  const rejectMut = useMutation({
    mutationFn: (taskId: number) => approvalsApi.reject(taskId, comment),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['approvals-pending'] }); qc.invalidateQueries({ queryKey: ['tasks'] }); setSelected(null); toast.success('Task rejected.'); },
    onError: (e) => setError(apiError(e)),
  });

  const handleAction = () => {
    if (!selected) return;
    setError('');
    if (selected.action === 'approve') approveMut.mutate(selected.task.id);
    else rejectMut.mutate(selected.task.id);
  };

  const openDialog = (task: Task, action: 'approve' | 'reject') => {
    setComment('');
    setError('');
    setSelected({ task, action });
  };

  return (
    <div>
      <PageHeader title="Approval Inbox" subtitle={`${pending?.length ?? 0} tasks awaiting decision`} />

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      )}

      {!isLoading && !pending?.length && (
        <EmptyState
          icon={<CheckCircle2 className="size-7 text-emerald-500" />}
          message="All caught up!"
          description="No tasks are awaiting your approval right now."
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {pending?.map((task) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all cursor-pointer group"
            onClick={() => navigate(`/tasks/${task.id}`)}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="size-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                <GitBranch className="size-4 text-violet-600 dark:text-violet-400" />
              </div>
              <PriorityBadge priority={task.priority as TaskPriority} />
            </div>

            <p className="text-sm font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">{task.title}</p>
            <p className="text-xs text-muted-foreground mb-4">
              <Clock className="inline size-3 mr-1 -mt-0.5" />
              {dayjs(task.updated_at).fromNow()} · WF-{task.workflow_id}
            </p>

            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm" variant="default"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => openDialog(task, 'approve')}
              >
                <ThumbsUp className="size-3.5" /> Approve
              </Button>
              <Button
                size="sm" variant="outline"
                className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-900/20"
                onClick={() => openDialog(task, 'reject')}
              >
                <ThumbsDown className="size-3.5" /> Reject
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={selected?.action === 'approve' ? 'text-emerald-600' : 'text-rose-600'}>
              {selected?.action === 'approve' ? 'Approve Task' : 'Reject Task'}
            </DialogTitle>
            <DialogDescription className="truncate">{selected?.task.title}</DialogDescription>
          </DialogHeader>

          {error && <div className="px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 text-sm">{error}</div>}

          <Textarea
            placeholder={selected?.action === 'approve' ? 'Approval comment (optional)…' : 'Reason for rejection (required)…'}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required={selected?.action === 'reject'}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button
              onClick={handleAction}
              disabled={(selected?.action === 'reject' && !comment.trim()) || approveMut.isPending || rejectMut.isPending}
              className={selected?.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              variant={selected?.action === 'reject' ? 'destructive' : 'default'}
            >
              {selected?.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
