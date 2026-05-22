import {
  Box, Card, CardContent, Typography, Button, Grid, Chip, Avatar, Alert,
  Divider, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, Stepper, Step, StepLabel,
  Stack, Snackbar,
} from '@mui/material';
import {
  ArrowBackRounded, PlayArrowRounded, SendRounded, EscalatorWarningRounded,
  CancelRounded, CheckCircleRounded, ThumbUpRounded, ThumbDownRounded,
  AssignmentIndRounded, PersonRounded,
} from '@mui/icons-material';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { tasksApi } from '../../api/tasks';
import { approvalsApi } from '../../api/approvals';
import { useAuthStore } from '../../store/authStore';
import StatusChip from '../../components/common/StatusChip';
import PriorityChip from '../../components/common/PriorityChip';
import { apiError } from '../../api/client';
import type { TaskStatus, TaskPriority } from '../../types/task';

dayjs.extend(relativeTime);

const ACTION_ICONS: Record<string, React.ReactNode> = {
  'task.created':   <CheckCircleRounded sx={{ fontSize: 14 }} />,
  'task.assigned':  <AssignmentIndRounded sx={{ fontSize: 14 }} />,
  'task.claimed':   <PersonRounded sx={{ fontSize: 14 }} />,
  'task.started':   <PlayArrowRounded sx={{ fontSize: 14 }} />,
  'task.submitted': <SendRounded sx={{ fontSize: 14 }} />,
  'task.approved':  <ThumbUpRounded sx={{ fontSize: 14 }} />,
  'task.rejected':  <ThumbDownRounded sx={{ fontSize: 14 }} />,
  'task.escalated': <EscalatorWarningRounded sx={{ fontSize: 14 }} />,
  'task.cancelled': <CancelRounded sx={{ fontSize: 14 }} />,
  'task.completed': <CheckCircleRounded sx={{ fontSize: 14 }} />,
};

const DOT_COLORS: Record<string, 'success' | 'error' | 'warning' | 'primary' | 'grey'> = {
  'task.created': 'grey', 'task.completed': 'success', 'task.approved': 'success',
  'task.rejected': 'error', 'task.escalated': 'warning', 'task.cancelled': 'error',
};

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [approveDialog, setApproveDialog] = useState<'approve' | 'reject' | null>(null);
  const [submitDialog, setSubmitDialog] = useState(false);
  const [escalateDialog, setEscalateDialog] = useState(false);
  const [approveComment, setApproveComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [submitNotes, setSubmitNotes] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [toast, setToast] = useState('');

  const taskId = Number(id);

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.get(taskId),
  });

  const { data: timeline } = useQuery({
    queryKey: ['task-timeline', id],
    queryFn: () => tasksApi.timeline(taskId),
    enabled: !!id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['task', id] });
    qc.invalidateQueries({ queryKey: ['task-timeline', id] });
    qc.invalidateQueries({ queryKey: ['tasks'] });
  };

  const claimMut = useMutation({
    mutationFn: () => tasksApi.claim(taskId),
    onSuccess: () => { invalidate(); setToast('Task claimed!'); },
  });
  const startMut = useMutation({
    mutationFn: () => tasksApi.start(taskId),
    onSuccess: () => { invalidate(); setToast('Task started!'); },
  });
  const submitMut = useMutation({
    mutationFn: () => tasksApi.submit(taskId, { outcome: 'completed', notes: submitNotes }),
    onSuccess: () => { invalidate(); setSubmitDialog(false); setToast('Submitted for approval!'); },
  });
  const completeMut = useMutation({
    mutationFn: () => tasksApi.complete(taskId),
    onSuccess: () => { invalidate(); setToast('Task completed!'); },
  });
  const approveMut = useMutation({
    mutationFn: () => approvalsApi.approve(taskId, approveComment || undefined),
    onSuccess: () => { invalidate(); setApproveDialog(null); setToast('Task approved!'); },
  });
  const rejectMut = useMutation({
    mutationFn: () => approvalsApi.reject(taskId, rejectReason),
    onSuccess: () => { invalidate(); setApproveDialog(null); setToast('Task rejected.'); },
  });
  const escalateMut = useMutation({
    mutationFn: () => tasksApi.escalate(taskId, { reason: escalateReason }),
    onSuccess: () => { invalidate(); setEscalateDialog(false); setToast('Task escalated.'); },
  });
  const cancelMut = useMutation({
    mutationFn: () => tasksApi.cancel(taskId),
    onSuccess: () => { invalidate(); setToast('Task cancelled.'); },
  });

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (!task) return <Alert severity="error">Task not found.</Alert>;

  const isAssignee = task.current_assignee?.id === user?.id;
  const canAct = isAssignee || user?.role === 'admin' || user?.role === 'manager';
  const canApprove = user?.role === 'admin' || user?.role === 'manager';

  return (
    <Box>
      <Button startIcon={<ArrowBackRounded />} onClick={() => navigate(-1)} sx={{ mb: 2, color: '#64748b' }}>
        Back
      </Button>

      {/* Task header */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: '24px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace' }}>#{task.id}</Typography>
                <StatusChip status={task.status as TaskStatus} size="medium" />
                <PriorityChip priority={task.priority as TaskPriority} size="medium" />
              </Box>
              <Typography variant="h5" sx={{ mb: 1 }}>{task.title}</Typography>
              <Stack direction="row" spacing={3} flexWrap="wrap">
                <Box>
                  <Typography variant="caption" color="text.secondary">Workflow</Typography>
                  <Typography variant="subtitle2">WF-{task.workflow_id}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Current Step</Typography>
                  <Typography variant="subtitle2">Step {task.current_step}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Assignee</Typography>
                  <Typography variant="subtitle2">{task.current_assignee?.full_name ?? 'Unassigned'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Created by</Typography>
                  <Typography variant="subtitle2">{task.created_by.full_name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Created</Typography>
                  <Typography variant="subtitle2">{dayjs(task.created_at).format('MMM D, YYYY HH:mm')}</Typography>
                </Box>
                {task.due_at && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Due</Typography>
                    <Typography variant="subtitle2" sx={{ color: dayjs(task.due_at).isBefore(dayjs()) ? '#ef4444' : 'inherit' }}>
                      {dayjs(task.due_at).format('MMM D, YYYY HH:mm')}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>

            {/* Action buttons */}
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {task.status === 'CREATED' && (
                <Button variant="contained" startIcon={<AssignmentIndRounded />}
                  onClick={() => claimMut.mutate()} disabled={claimMut.isPending}>
                  Claim Task
                </Button>
              )}
              {task.status === 'ASSIGNED' && canAct && (
                <Button variant="contained" color="primary" startIcon={<PlayArrowRounded />}
                  onClick={() => startMut.mutate()} disabled={startMut.isPending}>
                  Start
                </Button>
              )}
              {task.status === 'IN_PROGRESS' && canAct && (
                <>
                  <Button variant="contained" color="primary" startIcon={<SendRounded />}
                    onClick={() => setSubmitDialog(true)}>
                    Submit for Approval
                  </Button>
                  <Button variant="outlined" color="success" startIcon={<CheckCircleRounded />}
                    onClick={() => completeMut.mutate()} disabled={completeMut.isPending}>
                    Complete
                  </Button>
                  <Button variant="outlined" color="warning" startIcon={<EscalatorWarningRounded />}
                    onClick={() => setEscalateDialog(true)}>
                    Escalate
                  </Button>
                </>
              )}
              {task.status === 'PENDING_APPROVAL' && canApprove && (
                <>
                  <Button variant="contained" color="success" startIcon={<ThumbUpRounded />}
                    onClick={() => { setApproveComment(''); setApproveDialog('approve'); }}>
                    Approve
                  </Button>
                  <Button variant="outlined" color="error" startIcon={<ThumbDownRounded />}
                    onClick={() => { setRejectReason(''); setApproveDialog('reject'); }}>
                    Reject
                  </Button>
                </>
              )}
              {!['COMPLETED', 'CANCELLED'].includes(task.status) &&
                (user?.role === 'admin' || user?.role === 'manager') && (
                <Button variant="outlined" color="error" size="small" startIcon={<CancelRounded />}
                  onClick={() => cancelMut.mutate()} disabled={cancelMut.isPending}>
                  Cancel
                </Button>
              )}
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Timeline */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Activity Timeline</Typography>
              {timeline?.length ? (
                <Box sx={{ position: 'relative' }}>
                  {timeline.map((entry, i) => (
                    <Box key={entry.id} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Box sx={{
                          width: 30, height: 30, borderRadius: '50%', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          bgcolor: `${DOT_COLORS[entry.action] === 'success' ? '#d1fae5' : DOT_COLORS[entry.action] === 'error' ? '#fee2e2' : DOT_COLORS[entry.action] === 'warning' ? '#fef3c7' : '#f1f5f9'}`,
                          color: DOT_COLORS[entry.action] === 'success' ? '#10b981' : DOT_COLORS[entry.action] === 'error' ? '#ef4444' : DOT_COLORS[entry.action] === 'warning' ? '#f59e0b' : '#6366f1',
                          flexShrink: 0,
                        }}>
                          {ACTION_ICONS[entry.action] ?? <CheckCircleRounded sx={{ fontSize: 14 }} />}
                        </Box>
                        {i < timeline.length - 1 && (
                          <Box sx={{ width: 2, flex: 1, bgcolor: '#e2e8f0', my: 0.5, minHeight: 20 }} />
                        )}
                      </Box>
                      <Box sx={{ pb: i < timeline.length - 1 ? 1 : 0 }}>
                        <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                          {entry.action.replace('task.', '').replace('.', ' ')}
                        </Typography>
                        {entry.after_state && typeof entry.after_state === 'object' && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {Object.entries(entry.after_state)
                              .filter(([k]) => !['status'].includes(k))
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(' · ')}
                          </Typography>
                        )}
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          {dayjs(entry.created_at).format('MMM D, YYYY HH:mm')}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">No activity recorded yet.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Payload + metadata */}
        <Grid item xs={12} md={5}>
          {task.payload && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>Task Data</Typography>
                {Object.entries(task.payload).map(([key, val]) => (
                  <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid #f1f5f9' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                      {key.replace(/_/g, ' ')}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#0f172a' }}>
                      {String(val)}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}
          {task.outcome_data && (
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>Outcome Data</Typography>
                {Object.entries(task.outcome_data).map(([key, val]) => (
                  <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid #f1f5f9' }}>
                    <Typography variant="caption" color="text.secondary">{key.replace(/_/g, ' ')}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{String(val)}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Submit dialog */}
      <Dialog open={submitDialog} onClose={() => setSubmitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Submit for Approval</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={3} label="Notes (optional)" value={submitNotes}
            onChange={(e) => setSubmitNotes(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setSubmitDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => submitMut.mutate()} disabled={submitMut.isPending}>
            {submitMut.isPending ? 'Submitting…' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve dialog */}
      <Dialog open={approveDialog === 'approve'} onClose={() => setApproveDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Approve Task</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={3} label="Comment (optional)" value={approveComment}
            onChange={(e) => setApproveComment(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setApproveDialog(null)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={() => approveMut.mutate()} disabled={approveMut.isPending}>
            {approveMut.isPending ? 'Approving…' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={approveDialog === 'reject'} onClose={() => setApproveDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reject Task</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={3} label="Reason (required)" required value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setApproveDialog(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => rejectMut.mutate()}
            disabled={rejectMut.isPending || !rejectReason.trim()}>
            {rejectMut.isPending ? 'Rejecting…' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Escalate dialog */}
      <Dialog open={escalateDialog} onClose={() => setEscalateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Escalate Task</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={3} label="Reason (required)" required value={escalateReason}
            onChange={(e) => setEscalateReason(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEscalateDialog(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={() => escalateMut.mutate()}
            disabled={escalateMut.isPending || !escalateReason.trim()}>
            Escalate
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}
