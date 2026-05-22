import { Box, Chip } from '@mui/material';
import type { TaskStatus } from '../../types/task';

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string; dot: string }> = {
  CREATED:          { label: 'Created',         color: '#475569', bg: '#f1f5f9', dot: '#94a3b8' },
  ASSIGNED:         { label: 'Assigned',         color: '#1d4ed8', bg: '#eff6ff', dot: '#3b82f6' },
  IN_PROGRESS:      { label: 'In Progress',      color: '#b45309', bg: '#fffbeb', dot: '#f59e0b' },
  PENDING_APPROVAL: { label: 'Pending Approval', color: '#6d28d9', bg: '#f5f3ff', dot: '#8b5cf6' },
  COMPLETED:        { label: 'Completed',        color: '#047857', bg: '#ecfdf5', dot: '#10b981' },
  REJECTED:         { label: 'Rejected',         color: '#be123c', bg: '#fff1f2', dot: '#f43f5e' },
  ESCALATED:        { label: 'Escalated',        color: '#c2410c', bg: '#fff7ed', dot: '#f97316' },
  CANCELLED:        { label: 'Cancelled',        color: '#64748b', bg: '#f8fafc', dot: '#cbd5e1' },
};

interface Props { status: TaskStatus; size?: 'small' | 'medium' }

export default function StatusChip({ status, size = 'small' }: Props) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: '#475569', bg: '#f1f5f9', dot: '#94a3b8' };
  return (
    <Chip
      size={size}
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.625 }}>
          <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: cfg.dot, flexShrink: 0 }} />
          {cfg.label}
        </Box>
      }
      sx={{
        color: cfg.color, bgcolor: cfg.bg, fontWeight: 600, border: 'none',
        '& .MuiChip-label': { display: 'flex', alignItems: 'center' },
      }}
    />
  );
}
