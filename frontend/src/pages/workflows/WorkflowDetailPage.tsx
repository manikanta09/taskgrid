import {
  Box, Card, CardContent, Typography, Chip, Button, Grid,
  Stepper, Step, StepLabel, StepContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Alert, Stack,
} from '@mui/material';
import { ArrowBackRounded, PlayArrowRounded, RocketLaunchRounded, PersonRounded } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { workflowsApi } from '../../api/workflows';
import StatusChip from '../../components/common/StatusChip';
import PriorityChip from '../../components/common/PriorityChip';
import type { TaskStatus, TaskPriority } from '../../types/task';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:    { label: 'Draft',    color: '#64748b', bg: '#f1f5f9' },
  ACTIVE:   { label: 'Active',   color: '#065f46', bg: '#d1fae5' },
  ARCHIVED: { label: 'Archived', color: '#475569', bg: '#e2e8f0' },
};

const ROLE_COLORS: Record<string, string> = {
  admin: '#ef4444', manager: '#6366f1', operator: '#10b981', viewer: '#64748b',
};

export default function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: wf, isLoading } = useQuery({
    queryKey: ['workflow', id],
    queryFn: () => workflowsApi.get(Number(id)),
  });

  const { data: tasks } = useQuery({
    queryKey: ['workflow-tasks', id],
    queryFn: () => workflowsApi.tasks(Number(id), { limit: 20 }),
    enabled: !!id,
  });

  const publishMut = useMutation({
    mutationFn: () => workflowsApi.publish(Number(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflow', id] }),
  });

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (!wf) return <Alert severity="error">Workflow not found.</Alert>;

  const cfg = STATUS_LABELS[wf.status];

  return (
    <Box>
      <Button startIcon={<ArrowBackRounded />} onClick={() => navigate('/workflows')} sx={{ mb: 2, color: '#64748b' }}>
        Back to Workflows
      </Button>

      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: '24px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <Typography variant="h5">{wf.name}</Typography>
                <Chip label={cfg.label} size="small" sx={{ color: cfg.color, bgcolor: cfg.bg, fontWeight: 600 }} />
              </Box>
              {wf.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{wf.description}</Typography>
              )}
              <Stack direction="row" spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Steps</Typography>
                  <Typography variant="subtitle2">{wf.steps.length}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Created by</Typography>
                  <Typography variant="subtitle2">{wf.created_by.full_name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Created</Typography>
                  <Typography variant="subtitle2">{dayjs(wf.created_at).format('MMM D, YYYY')}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Task instances</Typography>
                  <Typography variant="subtitle2">{tasks?.total ?? '–'}</Typography>
                </Box>
              </Stack>
            </Box>
            <Stack direction="row" spacing={1}>
              {wf.status === 'DRAFT' && (
                <Button variant="contained" color="success" startIcon={<PlayArrowRounded />}
                  onClick={() => publishMut.mutate()} disabled={publishMut.isPending}>
                  Publish
                </Button>
              )}
              {wf.status === 'ACTIVE' && (
                <Button variant="contained" startIcon={<RocketLaunchRounded />}
                  onClick={() => navigate('/workflows')}>
                  Trigger Task
                </Button>
              )}
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Step definition */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Workflow Steps</Typography>
              <Stepper orientation="vertical" activeStep={-1}>
                {wf.steps.map((step) => (
                  <Step key={step.step} active>
                    <StepLabel
                      StepIconProps={{
                        sx: {
                          '&.MuiStepIcon-root': { color: '#6366f1' },
                          '&.MuiStepIcon-root.Mui-active': { color: '#6366f1' },
                        },
                      }}
                    >
                      <Typography variant="subtitle2">{step.name}</Typography>
                    </StepLabel>
                    <StepContent>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        <Chip
                          icon={<PersonRounded sx={{ fontSize: 12 }} />}
                          label={step.assignee_role}
                          size="small"
                          sx={{
                            bgcolor: `${ROLE_COLORS[step.assignee_role]}18`,
                            color: ROLE_COLORS[step.assignee_role] ?? '#64748b',
                            fontWeight: 600,
                          }}
                        />
                        {step.sla_hours && (
                          <Chip label={`${step.sla_hours}h SLA`} size="small"
                            sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 600 }} />
                        )}
                      </Box>
                      {step.instructions && (
                        <Typography variant="caption" color="text.secondary">{step.instructions}</Typography>
                      )}
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>

        {/* Task instances */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ pb: '0 !important' }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Task Instances</Typography>
            </CardContent>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Task</TableCell>
                    <TableCell>Assignee</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks?.items.map((task) => (
                    <TableRow key={task.id} hover sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/tasks/${task.id}`)}>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#0f172a' }}>
                          #{task.id} {task.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {task.current_assignee?.full_name ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell><StatusChip status={task.status as TaskStatus} /></TableCell>
                      <TableCell><PriorityChip priority={task.priority as TaskPriority} /></TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(task.updated_at).format('MMM D')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {!tasks?.items.length && (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No tasks yet. Trigger one from the workflow list.</Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
