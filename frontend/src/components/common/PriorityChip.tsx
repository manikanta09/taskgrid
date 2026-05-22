import { Box, Chip } from '@mui/material';
import type { TaskPriority } from '../../types/task';

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string; bars: number }> = {
  low:      { label: 'Low',      color: '#0369a1', bg: '#f0f9ff', bars: 1 },
  medium:   { label: 'Medium',   color: '#b45309', bg: '#fffbeb', bars: 2 },
  high:     { label: 'High',     color: '#c2410c', bg: '#fff7ed', bars: 3 },
  critical: { label: 'Critical', color: '#be123c', bg: '#fff1f2', bars: 4 },
};

interface Props { priority: TaskPriority; size?: 'small' | 'medium' }

function PriorityBars({ count, active, color }: { count: number; active: number; color: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '1.5px', height: 9 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Box
          key={i}
          sx={{
            width: 3,
            height: `${40 + i * 20}%`,
            borderRadius: '1px',
            bgcolor: i < active ? color : `${color}30`,
            flexShrink: 0,
          }}
        />
      ))}
    </Box>
  );
}

export default function PriorityChip({ priority, size = 'small' }: Props) {
  const cfg = PRIORITY_CONFIG[priority] ?? { label: priority, color: '#475569', bg: '#f1f5f9', bars: 1 };
  return (
    <Chip
      size={size}
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <PriorityBars count={4} active={cfg.bars} color={cfg.color} />
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
