import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, GripVertical, Save } from 'lucide-react';
import { workflowsApi } from '@/api/workflows';
import { apiError } from '@/api/client';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface StepForm {
  name: string;
  assignee_role: string;
  sla_hours: string;
  instructions: string;
  requires_approval: boolean;
}

const ROLES = ['admin', 'manager', 'operator', 'viewer'];
const emptyStep = (): StepForm => ({ name: '', assignee_role: 'operator', sla_hours: '', instructions: '', requires_approval: false });

export default function WorkflowBuilderPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<StepForm[]>([emptyStep()]);
  const [error, setError] = useState('');

  const createMut = useMutation({
    mutationFn: () => workflowsApi.create({
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
      toast.success('Workflow created!');
      navigate(`/workflows/${data.id}`);
    },
    onError: (e) => setError(apiError(e)),
  });

  const updateStep = (i: number, field: keyof StepForm, value: string | boolean) =>
    setSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  const handleSubmit = () => {
    setError('');
    if (!name.trim()) { setError('Workflow name is required.'); return; }
    if (steps.some((s) => !s.name.trim())) { setError('All steps must have a name.'); return; }
    createMut.mutate();
  };

  return (
    <div className="max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate('/workflows')} className="mb-4 gap-1.5 text-muted-foreground">
        <ArrowLeft className="size-3.5" /> Back to Workflows
      </Button>

      <PageHeader title="New Workflow" subtitle="Define steps, roles, and SLAs for your workflow." />

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Basics */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-card space-y-4">
          <div className="space-y-1.5">
            <Label>Workflow Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Invoice Approval Process" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the purpose of this workflow…" />
          </div>
        </div>

        {/* Steps */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Steps ({steps.length})</p>
            <Button variant="outline" size="sm" onClick={() => setSteps((p) => [...p, emptyStep()])}>
              <Plus className="size-3.5" /> Add Step
            </Button>
          </div>

          <div className="space-y-4">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-border rounded-xl p-4 bg-muted/20"
              >
                <div className="flex items-center gap-2 mb-3">
                  <GripVertical className="size-4 text-muted-foreground/50 flex-shrink-0" />
                  <div className="size-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-sm font-semibold text-foreground flex-1">Step {i + 1}</span>
                  {steps.length > 1 && (
                    <button onClick={() => setSteps((p) => p.filter((_, idx) => idx !== i))} className="p-1 rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/30 text-muted-foreground hover:text-rose-600 transition-colors">
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label>Step Name *</Label>
                    <Input value={step.name} onChange={(e) => updateStep(i, 'name', e.target.value)} placeholder="e.g. Manager Review" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Assignee Role</Label>
                    <Select value={step.assignee_role} onValueChange={(v) => updateStep(i, 'assignee_role', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>SLA Hours</Label>
                    <Input type="number" value={step.sla_hours} onChange={(e) => updateStep(i, 'sla_hours', e.target.value)} placeholder="Optional" min={1} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Instructions</Label>
                    <Input value={step.instructions} onChange={(e) => updateStep(i, 'instructions', e.target.value)} placeholder="Instructions for the assignee…" />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox" id={`approval-${i}`}
                      checked={step.requires_approval}
                      onChange={(e) => updateStep(i, 'requires_approval', e.target.checked)}
                      className="size-4 rounded border-border accent-indigo-600 cursor-pointer"
                    />
                    <Label htmlFor={`approval-${i}`} className="cursor-pointer font-normal text-muted-foreground">
                      Requires manager approval
                    </Label>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/workflows')}>Cancel</Button>
          <Button variant="gradient" onClick={handleSubmit} disabled={createMut.isPending}>
            <Save className="size-4" />
            {createMut.isPending ? 'Creating…' : 'Create Workflow'}
          </Button>
        </div>
      </div>
    </div>
  );
}
