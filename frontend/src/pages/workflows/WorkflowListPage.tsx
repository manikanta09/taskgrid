import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Button, Typography, Tabs, Tab, IconButton, Tooltip, Alert, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Snackbar, Stack,
} from '@mui/material';
import {
  AddRounded, PlayArrowRounded, ArchiveRounded, VisibilityRounded,
  AccountTreeRounded, RocketLaunchRounded,
} from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { workflowsApi } from '../../api/workflows';
import { apiError } from '../../api/client';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import type { WorkflowStatus } from '../../types/workflow';

const STATUS_CFG: Record<WorkflowStatus, { label: string; color: string; bg: string }> = {
  DRAFT:    { label: 'Draft',    color: '#64748b', bg: '#f1f5f9' },
  ACTIVE:   { label: 'Active',   color: '#065f46', bg: '#d1fae5' },
  ARCHIVED: { label: 'Archived', color: '#475569', bg: '#e2e8f0' },
};

type TabVal = 'all' | WorkflowStatus;

export default function WorkflowListPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabVal>('all');
  const [toast, setToast] = useState('');
  const [triggerDialog, setTriggerDialog] = useState<{ open: boolean; workflowId: number | null }>({ open: false, workflowId: null });
  const [triggerForm, setTriggerForm] = useState({ title: '', priority: 'medium' });

  const { data, isLoading } = useQuery({
    queryKey: ['workflows', tab],
    queryFn: () => workflowsApi.list({ status: tab === 'all' ? undefined : tab, limit: 50 }),
  });

  const publishMut = useMutation({
    mutationFn: (id: number) => workflowsApi.publish(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workflows'] }); setToast('Workflow published!'); },
  });

  const archiveMut = useMutation({
    mutationFn: (id: number) => workflowsApi.archive(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workflows'] }); setToast('Workflow archived.'); },
  });

  const triggerMut = useMutation({
    mutationFn: ({ id, form }: { id: number; form: typeof triggerForm }) =>
      workflowsApi.trigger(id, { title: form.title || undefined, priority: form.priority as any }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      setTriggerDialog({ open: false, workflowId: null });
      setToast(`Task #${data.task_id} created!`);
      navigate('/tasks');
    },
  });

  return (
    <Box>
      <PageHeader
        title="Workflows"
        subtitle={`${data?.total ?? 0} workflow definitions`}
        action={
          <Button variant="contained" startIcon={<AddRounded />} onClick={() => navigate('/workflows/new')}>
            New Workflow
          </Button>
        }
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2.5 }}>
        {(['all', 'ACTIVE', 'DRAFT', 'ARCHIVED'] as TabVal[]).map((t) => (
          <Tab key={t} value={t} label={t === 'all' ? 'All' : STATUS_CFG[t as WorkflowStatus]?.label ?? t} />
        ))}
      </Tabs>

      <Card>
        {isLoading && <LinearProgress sx={{ borderRadius: '12px 12px 0 0' }} />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Steps</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.items.map((wf) => {
                const cfg = STATUS_CFG[wf.status];
                return (
                  <TableRow key={wf.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: '#ede9fe' }}>
                          <AccountTreeRounded sx={{ fontSize: 16, color: '#7c3aed' }} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: '#0f172a' }}>{wf.name}</Typography>
                          {wf.description && (
                            <Typography variant="caption" color="text.secondary"
                              sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {wf.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={`${wf.steps.length} steps`} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={cfg.label} size="small" sx={{ color: cfg.color, bgcolor: cfg.bg, fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{wf.created_by.full_name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {dayjs(wf.updated_at).format('MMM D, YYYY')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="View detail">
                          <IconButton size="small" onClick={() => navigate(`/workflows/${wf.id}`)}>
                            <VisibilityRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {wf.status === 'DRAFT' && (
                          <Tooltip title="Publish">
                            <IconButton size="small" color="success" onClick={() => publishMut.mutate(wf.id)}>
                              <PlayArrowRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {wf.status === 'ACTIVE' && (
                          <>
                            <Tooltip title="Trigger task">
                              <IconButton size="small" color="primary"
                                onClick={() => { setTriggerForm({ title: '', priority: 'medium' }); setTriggerDialog({ open: true, workflowId: wf.id }); }}>
                                <RocketLaunchRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Archive">
                              <IconButton size="small" onClick={() => archiveMut.mutate(wf.id)}>
                                <ArchiveRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {!isLoading && !data?.items.length && (
          <EmptyState message="No workflows found. Create your first workflow." />
        )}
      </Card>

      {/* Trigger dialog */}
      <Dialog open={triggerDialog.open} onClose={() => setTriggerDialog({ open: false, workflowId: null })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Trigger New Task</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="Task Title (optional)" value={triggerForm.title}
            onChange={(e) => setTriggerForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Auto-generated if empty" sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth select label="Priority" value={triggerForm.priority}
            onChange={(e) => setTriggerForm((f) => ({ ...f, priority: e.target.value }))}
          >
            {['low','medium','high','critical'].map((p) => (
              <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>{p}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setTriggerDialog({ open: false, workflowId: null })}>Cancel</Button>
          <Button variant="contained" onClick={() => triggerMut.mutate({ id: triggerDialog.workflowId!, form: triggerForm })}
            disabled={triggerMut.isPending}>
            {triggerMut.isPending ? 'Creating…' : 'Create Task'}
          </Button>
        </DialogActions>
        {triggerMut.isError && <Alert severity="error" sx={{ mx: 2, mb: 2 }}>{apiError(triggerMut.error)}</Alert>}
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}
