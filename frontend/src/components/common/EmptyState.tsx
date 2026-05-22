import { Box, Typography, Button } from '@mui/material';
import type { ReactNode } from 'react';

interface Props {
  message?: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export default function EmptyState({
  message = 'Nothing here yet',
  description,
  action,
  icon,
}: Props) {
  return (
    <Box
      sx={{
        py: 9, px: 3, textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        animation: 'fadeSlideIn 0.3s ease both',
      }}
    >
      <Box
        sx={{
          width: 72, height: 72, borderRadius: '20px',
          background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          mb: 2.5, position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: -6,
            borderRadius: '26px',
            border: '1.5px dashed #e2e8f0',
          },
          '& .MuiSvgIcon-root': { fontSize: 30, color: '#94a3b8' },
        }}
      >
        {icon ?? (
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4M9 5a2 2 0 012-2h2a2 2 0 012 2"
              stroke="#c4cdd6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a', mb: 0.5 }}>
        {message}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320, mb: 2.5, lineHeight: 1.6 }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: description ? 0 : 2 }}>{action}</Box>}
    </Box>
  );
}
