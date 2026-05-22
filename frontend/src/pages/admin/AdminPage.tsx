import {
  Box, Card, CardContent, Typography, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Avatar, Chip, Button, LinearProgress,
  Tab, Tabs, MenuItem, TextField, Alert, IconButton, Tooltip, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  PersonRounded, AdminPanelSettingsRounded, BlockRounded, CheckCircleRounded,
  FilterListRounded,
} from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { adminApi } from '../../api/approvals';
import { usersApi } from '../../api/users';
import { apiError } from '../../api/client';
import MetricCard from '../../components/common/MetricCard';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import type { TaskStatus } from '../../types/task';

dayjs.extend(relativeTime);

const ROLE_CFG: Record<string, { color: string; bg: string }> = {
  admin:    { color: '#dc2626', bg: '#fee2e2' },
  manager:  { color: '#6366f1', bg: '#ede9fe' },
  operator: { color: '#059669', bg: '#d1fae5' },
  viewer:   { color: '#64748b', bg: '#f1f5f9' },
};

const ENTITY_TYPES = ['all', 'task', 'workflow', 'user', 'approval'];

export default function AdminPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState(0);
  const [entityFilter, setEntityFilter] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; userId: number | null; action: 'deactivate' | 'reactivate' }>({
    open: false, userId: null, action: 'deactivate',
  });
  const [error, setError] = useState('');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.stats,
    refetchInterval: 30000,
  });

  const { data: auditLogsData, isLoading: logsLoading } = useQuery({
    queryKey: ['audit-logs', entityFilter],
    queryFn: () => adminApi.auditLogs({ entity_type: entityFilter === 'all' ? undefined : entityFilter, limit: 50 }),
  });
  const auditLogs = auditLogsData?.items ?? [];

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list({ limit: 50 }),
  });

  const deactivateMut = useMutation({
    mutationFn: (id: number) => usersApi.deactivate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setConfirmDialog({ open: false, userId: null, action: 'deactivate' }); },
    onError: (e) => setError(apiError(e)),
  });

  const reactivateMut = useMutation({
    mutationFn: (id: number) => usersApi.reactivate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setConfirmDialog({ open: false, userId: null, action: 'deactivate' }); },
    onError: (e) => setError(apiError(e)),
  });

  const handleConfirm = () => {
    if (!confirmDialog.userId) return;
    setError('');
    if (confirmDialog.action === 'deactivate') {
      deactivateMut.mutate(confirmDialog.userId);
    } else {
      reactivateMut.mutate(confirmDialog.userId);
    }
  };

  const isMutating = deactivateMut.isPending || reactivateMut.isPending;

  return (
    <Box>
      <PageHeader title="Admin Overview" subtitle="System health, users, and audit logs" />

      {/* Stats */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Tasks"
            value={stats?.tasks?.total ?? 0}
            icon={<FilterListRounded />}
            color="#6366f1" bg="#ede9fe"
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Workflows"
            value={stats?.workflows?.active ?? 0}
            icon={<CheckCircleRounded />}
            color="#10b981" bg="#d1fae5"
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Pending Approvals"
            value={stats?.tasks?.pending_approval ?? 0}
            icon={<AdminPanelSettingsRounded />}
            color="#f59e0b" bg="#fef3c7"
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Users"
            value={stats?.users?.total ?? 0}
            icon={<PersonRounded />}
            color="#8b5cf6" bg="#ede9fe"
            loading={statsLoading}
          />
        </Grid>
      </Grid>

      {/* AI Health Indicators (mock) */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>AI System Health</Typography>
          <Grid container spacing={2}>
            {[
              { label: 'Task Routing Model', health: 98, status: 'Operational', color: '#10b981' },
              { label: 'SLA Prediction Engine', health: 94, status: 'Operational', color: '#10b981' },
              { label: 'Escalation Classifier', health: 87, status: 'Degraded', color: '#f59e0b' },
              { label: 'Workload Balancer', health: 100, status: 'Operational', color: '#10b981' },
            ].map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item.label}>
                <Box sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>{item.label}</Typography>
                    <Chip label={item.status} size="small"
                      sx={{ fontSize: '0.65rem', height: 20, color: item.color,
                        bgcolor: item.color === '#10b981' ? '#d1fae5' : '#fef3c7', fontWeight: 600 }} />
                  </Box>
                  <Typography variant="h6" sx={{ color: item.color, fontWeight: 700 }}>{item.health}%</Typography>
                  <LinearProgress
                    variant="determinate" value={item.health}
                    sx={{ mt: 1, height: 4, borderRadius: 2,
                      '& .MuiLinearProgress-bar': { bgcolor: item.color },
                      bgcolor: '#f1f5f9' }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="User Management" />
        <Tab label="Audit Log" />
      </Tabs>

      {/* User Management */}
      {tab === 0 && (
        <Card>
          {usersLoading && <LinearProgress sx={{ borderRadius: '12px 12px 0 0' }} />}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users?.items.map((user) => {
                  const roleCfg = ROLE_CFG[user.role] ?? ROLE_CFG.viewer;
                  return (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            {user.full_name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ color: '#0f172a' }}>{user.full_name}</Typography>
                            <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={user.role} size="small"
                          sx={{ color: roleCfg.color, bgcolor: roleCfg.bg, fontWeight: 600, textTransform: 'capitalize' }} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.is_active ? 'Active' : 'Inactive'}
                          size="small"
                          sx={{
                            color: user.is_active ? '#065f46' : '#dc2626',
                            bgcolor: user.is_active ? '#d1fae5' : '#fee2e2',
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {user.last_login_at ? dayjs(user.last_login_at).fromNow() : 'Never'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(user.created_at).format('MMM D, YYYY')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          {user.is_active ? (
                            <Tooltip title="Deactivate user">
                              <IconButton size="small" color="error"
                                onClick={() => setConfirmDialog({ open: true, userId: user.id, action: 'deactivate' })}>
                                <BlockRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Reactivate user">
                              <IconButton size="small" color="success"
                                onClick={() => setConfirmDialog({ open: true, userId: user.id, action: 'reactivate' })}>
                                <CheckCircleRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Audit Log */}
      {tab === 1 && (
        <Card>
          <CardContent sx={{ pb: '12px !important' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="subtitle2">Filter by entity:</Typography>
              <TextField
                select size="small" value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                sx={{ width: 160 }}
              >
                {ENTITY_TYPES.map((t) => (
                  <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t === 'all' ? 'All Types' : t}</MenuItem>
                ))}
              </TextField>
            </Box>
          </CardContent>
          {logsLoading && <LinearProgress />}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Actor</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Entity</TableCell>
                  <TableCell>Status Change</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.map((log: any) => {
                  const fromStatus = log.before_state?.status as TaskStatus | undefined;
                  const toStatus = log.after_state?.status as TaskStatus | undefined;
                  return (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                          {dayjs(log.created_at).format('MMM D HH:mm')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {log.actor_id ? `User #${log.actor_id}` : 'System'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={log.action.replace(/_/g, ' ')} size="small"
                          sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#f1f5f9', color: '#475569', textTransform: 'capitalize' }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: '#475569', textTransform: 'capitalize' }}>
                          {log.entity_type} #{log.entity_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {fromStatus && toStatus ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <StatusChip status={fromStatus} />
                            <Typography variant="caption" color="text.secondary">→</Typography>
                            <StatusChip status={toStatus} />
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          {!logsLoading && !auditLogs.length && (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No audit log entries found.</Typography>
            </Box>
          )}
        </Card>
      )}

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => !isMutating && setConfirmDialog({ open: false, userId: null, action: 'deactivate' })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {confirmDialog.action === 'deactivate' ? 'Deactivate User?' : 'Reactivate User?'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography variant="body2" color="text.secondary">
            {confirmDialog.action === 'deactivate'
              ? 'This user will no longer be able to log in. Their existing task assignments will remain.'
              : 'This user will be able to log in and access TaskGrid again.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setConfirmDialog({ open: false, userId: null, action: 'deactivate' })} disabled={isMutating}>Cancel</Button>
          <Button
            variant="contained"
            color={confirmDialog.action === 'deactivate' ? 'error' : 'success'}
            onClick={handleConfirm}
            disabled={isMutating}
          >
            {isMutating ? 'Processing…' : confirmDialog.action === 'deactivate' ? 'Deactivate' : 'Reactivate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
