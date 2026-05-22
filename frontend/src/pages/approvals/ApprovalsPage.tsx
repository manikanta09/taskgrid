import {
  Box, Grid, Card, CardContent, CardActions, Typography, Button,
  Avatar, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, LinearProgress, Divider,
} from '@mui/material';
import {
  ThumbUpRounded, ThumbDownRounded, TimerRounded, AccountTreeRounded,
} from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { approvalsApi } from '../../api/approvals';
import { apiError } from '../../api/client';
import PriorityChip from '../../components/common/PriorityChip';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import type { Task, TaskPriority } from '../../types/task';

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals-pending'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      setSelected(null);
    },
    onError: (e) => setError(apiError(e)),
  });

  const rejectMut = useMutation({
    mutationFn: (taskId: number) => approvalsApi.reject(taskId, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals-pending'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      setSelected(null);
    },
    onError: (e) => setError(apiError(e)),
  });

  const handleAction = () => {
    if (!selected) return;
    setError('');
    if (selected.action === 'approve') {
      approveMut.mutate(selected.task.id);
    } else {
      if (!comment.trim()) { setError('Rejection reason is required.'); return; }
      rejectMut.mutate(selected.task.id);
    }
  };

  const isPending = approveMut.isPending || rejectMut.isPending;

  return (
    <Box>
      <PageHeader
        title="Approval Inbox"
        subtitle={`${pending?.length ?? 0} tasks awaiting your decision`}
      />

      {isLoading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {!isLoading && !pending?.length ? (
        <Card sx={{ py: 6 }}>
          <EmptyState message="No pending approvals. You're all caught up!" />
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {pending?.map((task) => {
            const waitTime = dayjs(task.updated_at).fromNow();
            return (
              <Grid item xs={12} sm={6} lg={4} key={task.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column',
                  border: '1px solid #e2e8f0', transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.1)' } }}>
                  <CardContent sx={{ flex: 1, pb: 1 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                      <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#ede9fe', flexShrink: 0 }}>
                        <AccountTreeRounded sx={{ fontSize: 18, color: '#7c3aed' }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          color: '#0f172a',
                        }}>
                          {task.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Workflow #{task.workflow_id} · Step {task.current_step}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace', flexShrink: 0 }}>
                        #{task.id}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <PriorityChip priority={task.priority as TaskPriority} />
                    </Box>

                    <Divider sx={{ mb: 1.5 }} />

                    {/* Submitted by */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: '#6366f1' }}>
                        {task.current_assignee?.full_name?.charAt(0) ?? '?'}
                      </Avatar>
                      <Typography variant="caption" color="text.secondary">
                        Submitted by {task.current_assignee?.full_name ?? 'Unknown'}
                      </Typography>
                    </Box>

                    {/* Wait time */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <TimerRounded sx={{ fontSize: 14, color: '#f59e0b' }} />
                      <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                        Waiting {waitTime}
                      </Typography>
                    </Box>

                    {/* Payload preview */}
                    {task.payload && (
                      <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                        {Object.entries(task.payload).slice(0, 3).map(([k, v]) => (
                          <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.25 }}>
                            <Typography variant="caption" color="text.secondary">{k.replace(/_/g, ' ')}</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>{String(v)}</Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
                    <Button
                      variant="contained" color="success" size="small" fullWidth
                      startIcon={<ThumbUpRounded />}
                      onClick={() => { setComment(''); setError(''); setSelected({ task, action: 'approve' }); }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined" color="error" size="small" fullWidth
                      startIcon={<ThumbDownRounded />}
                      onClick={() => { setComment(''); setError(''); setSelected({ task, action: 'reject' }); }}
                    >
                      Reject
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Decision dialog */}
      <Dialog open={!!selected} onClose={() => !isPending && setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selected?.action === 'approve' ? '✅ Approve Task' : '❌ Reject Task'}
        </DialogTitle>
        <DialogContent>
          {selected && (
            <Box sx={{ mb: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle2">{selected.task.title}</Typography>
              <Typography variant="caption" color="text.secondary">Task #{selected.task.id}</Typography>
            </Box>
          )}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            fullWidth multiline rows={3}
            label={selected?.action === 'approve' ? 'Comment (optional)' : 'Reason (required)'}
            required={selected?.action === 'reject'}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={selected?.action === 'approve' ? 'Add an approval note…' : 'Explain why this task is being rejected…'}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setSelected(null)} disabled={isPending}>Cancel</Button>
          <Button
            variant="contained"
            color={selected?.action === 'approve' ? 'success' : 'error'}
            onClick={handleAction}
            disabled={isPending}
          >
            {isPending ? 'Processing…' : selected?.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
