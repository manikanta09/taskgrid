import {
  Box, Card, CardContent, Typography, Button, TextField, MenuItem,
  IconButton, Alert, Divider, Stack, Chip, LinearProgress,
} from '@mui/material';
import {
  ArrowBackRounded, AddRounded, DeleteRounded, DragIndicatorRounded,
  SaveRounded,
} from '@mui/icons-material';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { workflowsApi } from '../../api/workflows';
import { apiError } from '../../api/client';
import PageHeader from '../../components/common/PageHeader';

interface StepForm {
  name: string;
  assignee_role: string;
  sla_hours: string;
  instructions: string;
  requires_approval: boolean;
}

const ROLES = ['admin', 'manager', 'operator', 'viewer'];

const emptyStep = (): StepForm => ({
  name: '',
  assignee_role: 'operator',
  sla_hours: '',
  instructions: '',
  requires_approval: false,
});

export default function WorkflowBuilderPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<StepForm[]>([emptyStep()]);
  const [error, setError] = useState('');

  const createMut = useMutation({
    mutationFn: () =>
      workflowsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        steps: steps.map((s, i) => ({
          step: i + 1,
          name: s.name.trim(),
          assignee_role: s.assignee_role,
          sla_hours: s.sla_hours ? Number(s.sla_hours) : undefined,
          instructions: s.instructions.trim() || undefined,
          requires_approval: s.requires_approval,
        })),
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['workflows'] });
      navigate(`/workflows/${data.id}`);
    },
    onError: (e) => setError(apiError(e)),
  });

  const updateStep = (i: number, field: keyof StepForm, value: string | boolean) => {
    setSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };

  const addStep = () => setSteps((prev) => [...prev, emptyStep()]);

  const removeStep = (i: number) => {
    if (steps.length <= 1) return;
    setSteps((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = () => {
    setError('');
    if (!name.trim()) { setError('Workflow name is required.'); return; }
    if (steps.some((s) => !s.name.trim())) { setError('All steps must have a name.'); return; }
    createMut.mutate();
  };

  return (
    <Box>
      <Button startIcon={<ArrowBackRounded />} onClick={() => navigate('/workflows')} sx={{ mb: 2, color: '#64748b' }}>
        Back to Workflows
      </Button>

      <PageHeader title="New Workflow" subtitle="Define steps, roles, and SLAs" />

      {createMut.isPending && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        {/* Left — metadata */}
        <Box sx={{ width: { xs: '100%', md: 320 }, flexShrink: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>Workflow Details</Typography>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth label="Workflow Name" required
                  value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Employee Onboarding"
                />
                <TextField
                  fullWidth label="Description" multiline rows={3}
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purpose of this workflow…"
                />
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    New workflows start as <strong>Draft</strong>. Publish them to make them available for task creation.
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* Right — steps */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Workflow Steps</Typography>
                <Chip label={`${steps.length} step${steps.length !== 1 ? 's' : ''}`} size="small"
                  sx={{ bgcolor: '#ede9fe', color: '#7c3aed', fontWeight: 600 }} />
              </Box>

              <Stack spacing={2}>
                {steps.map((step, i) => (
                  <Box key={i} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2,
                    bgcolor: '#fafafa', position: 'relative' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <DragIndicatorRounded sx={{ color: '#cbd5e1', cursor: 'grab' }} />
                      <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#6366f1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700 }}>{i + 1}</Typography>
                      </Box>
                      <Typography variant="subtitle2" sx={{ flex: 1 }}>Step {i + 1}</Typography>
                      {steps.length > 1 && (
                        <IconButton size="small" color="error" onClick={() => removeStep(i)}>
                          <DeleteRounded fontSize="small" />
                        </IconButton>
                      )}
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <TextField
                        fullWidth label="Step Name" required size="small"
                        value={step.name} onChange={(e) => updateStep(i, 'name', e.target.value)}
                        placeholder="e.g. Document Review"
                      />
                      <TextField
                        select fullWidth label="Assignee Role" size="small"
                        value={step.assignee_role} onChange={(e) => updateStep(i, 'assignee_role', e.target.value)}
                      >
                        {ROLES.map((r) => (
                          <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>{r}</MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        fullWidth label="SLA (hours)" size="small" type="number"
                        value={step.sla_hours} onChange={(e) => updateStep(i, 'sla_hours', e.target.value)}
                        placeholder="e.g. 24"
                        inputProps={{ min: 1 }}
                      />
                      <TextField
                        select fullWidth label="Requires Approval" size="small"
                        value={step.requires_approval ? 'yes' : 'no'}
                        onChange={(e) => updateStep(i, 'requires_approval', e.target.value === 'yes')}
                      >
                        <MenuItem value="no">No</MenuItem>
                        <MenuItem value="yes">Yes</MenuItem>
                      </TextField>
                    </Box>

                    <TextField
                      fullWidth label="Instructions" size="small" multiline rows={2}
                      value={step.instructions} onChange={(e) => updateStep(i, 'instructions', e.target.value)}
                      placeholder="Guidance for the assignee…"
                      sx={{ mt: 2 }}
                    />
                  </Box>
                ))}
              </Stack>

              <Button
                startIcon={<AddRounded />} onClick={addStep}
                sx={{ mt: 2, color: '#6366f1', borderColor: '#6366f1' }}
                variant="outlined" size="small"
              >
                Add Step
              </Button>
            </CardContent>
          </Card>

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            <Button onClick={() => navigate('/workflows')} disabled={createMut.isPending}>
              Cancel
            </Button>
            <Button
              variant="contained" startIcon={<SaveRounded />}
              onClick={handleSubmit} disabled={createMut.isPending}
            >
              {createMut.isPending ? 'Creating…' : 'Create Workflow'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
