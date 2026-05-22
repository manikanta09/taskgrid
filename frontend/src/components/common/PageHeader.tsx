import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      mb: 3, pb: 3, borderBottom: '1px solid #f1f5f9',
    }}>
      <Box>
        <Typography variant="h5" sx={{ color: '#0f172a', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.375, lineHeight: 1.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
    </Box>
  );
}
