import { Card, CardContent, Box, Typography, Skeleton } from '@mui/material';
import type { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: string;
  bg: string;
  subtitle?: string;
  loading?: boolean;
  trend?: { value: number; label: string };
}

export default function MetricCard({ title, value, icon, color, bg, subtitle, loading, trend }: MetricCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 12px 28px rgba(0,0,0,0.09)',
        },
      }}
    >
      {/* Accent bar */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: color, borderRadius: '14px 14px 0 0' }} />

      <CardContent sx={{ p: '20px 20px 16px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography
            variant="overline"
            sx={{ color: '#64748b', fontSize: '0.6875rem', letterSpacing: '0.08em', fontWeight: 700, lineHeight: 1 }}
          >
            {title}
          </Typography>
          <Box
            sx={{
              width: 36, height: 36, borderRadius: '10px', bgcolor: bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              '& .MuiSvgIcon-root': { color, fontSize: 18 },
            }}
          >
            {icon}
          </Box>
        </Box>

        {loading ? (
          <Skeleton width={64} height={44} sx={{ borderRadius: 2 }} />
        ) : (
          <Typography
            sx={{ fontWeight: 800, fontSize: '2rem', lineHeight: 1, color: '#0f172a', letterSpacing: '-0.04em' }}
          >
            {value}
          </Typography>
        )}

        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {subtitle && (
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Box sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.25,
              px: 0.75, py: 0.125, borderRadius: 4,
              bgcolor: trend.value >= 0 ? '#ecfdf5' : '#fff1f2',
              color: trend.value >= 0 ? '#059669' : '#dc2626',
            }}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700 }}>
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
