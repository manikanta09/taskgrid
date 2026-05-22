import {
  Box, TextField, Button, Typography, Alert,
  InputAdornment, IconButton, CircularProgress, Divider,
} from '@mui/material';
import {
  EmailRounded, LockRounded, Visibility, VisibilityOff,
  TaskAltRounded, CheckRounded, ArrowForwardRounded,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { apiError } from '../../api/client';

const FEATURES = [
  { icon: '⚡', title: 'Intelligent Routing', desc: 'AI-powered task assignment based on role, capacity, and SLA priority.' },
  { icon: '🔄', title: 'Multi-Step Workflows', desc: 'Design approval chains and automation flows with a no-code builder.' },
  { icon: '📊', title: 'Real-Time Analytics', desc: 'Live dashboards with SLA tracking, escalation alerts, and completion rates.' },
  { icon: '🔒', title: 'Enterprise Security', desc: 'RBAC, full audit trails, and compliance-ready activity logging.' },
];

const DEMO_USERS = [
  { role: 'Admin',    email: 'admin@taskgrid.io',   pw: 'admin123',   color: '#f87171' },
  { role: 'Manager',  email: 'manager@taskgrid.io', pw: 'manager123', color: '#818cf8' },
  { role: 'Operator', email: 'ops1@taskgrid.io',    pw: 'ops123',     color: '#34d399' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('admin@taskgrid.io');
  const [password, setPassword] = useState('admin123');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      setAuth(data.user, data.access_token);
      navigate('/');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0a0f1e' }}>
      {/* ── Left panel ──────────────────────────────────── */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          width: '45%',
          p: '56px 52px',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #0c1225 0%, #111827 60%, #0c1836 100%)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-20%', left: '-10%',
            width: '60%', height: '60%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '-10%', right: '-5%',
            width: '50%', height: '50%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          },
        }}
      >
        {/* Dot grid decoration */}
        <Box sx={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        {/* Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 'auto', position: 'relative' }}>
          <Box sx={{
            width: 42, height: 42, borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(99,102,241,0.5)',
          }}>
            <TaskAltRounded sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.02em', lineHeight: 1 }}>
              TaskGrid
            </Typography>
            <Typography sx={{ color: '#6366f1', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1.4 }}>
              Enterprise
            </Typography>
          </Box>
        </Box>

        {/* Hero copy */}
        <Box sx={{ position: 'relative', py: 6 }}>
          <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '2.25rem', letterSpacing: '-0.03em', lineHeight: 1.2, mb: 2 }}>
            Orchestrate work at{' '}
            <Box component="span" sx={{
              background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              enterprise scale
            </Box>
          </Typography>
          <Typography sx={{ color: '#6b7280', fontSize: '1rem', lineHeight: 1.6, maxWidth: 380 }}>
            Automate multi-step approval workflows, enforce SLAs, and give your team a single pane of glass for every task.
          </Typography>
        </Box>

        {/* Feature list */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, position: 'relative', mb: 4 }}>
          {FEATURES.map((f) => (
            <Box key={f.title} sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: '9px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', flexShrink: 0,
              }}>
                {f.icon}
              </Box>
              <Box>
                <Typography sx={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.3 }}>
                  {f.title}
                </Typography>
                <Typography sx={{ color: '#4b5563', fontSize: '0.8125rem', lineHeight: 1.5, mt: 0.25 }}>
                  {f.desc}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Social proof */}
        <Box sx={{
          p: 2, borderRadius: 2,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          position: 'relative',
        }}>
          <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Box key={i} component="span" sx={{ color: '#f59e0b', fontSize: '0.875rem' }}>★</Box>
            ))}
          </Box>
          <Typography sx={{ color: '#d1d5db', fontSize: '0.8125rem', lineHeight: 1.6, fontStyle: 'italic' }}>
            "TaskGrid reduced our approval cycle time by 67% in the first quarter. The SLA visibility alone paid for the platform."
          </Typography>
          <Typography sx={{ color: '#4b5563', fontSize: '0.75rem', mt: 1, fontWeight: 600 }}>
            — Head of Operations, Fortune 500 Financial Services
          </Typography>
        </Box>
      </Box>

      {/* ── Right panel ─────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: '48px 40px' },
          position: 'relative',
          bgcolor: '#f8fafc',
          backgroundImage: 'radial-gradient(rgba(99,102,241,0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile brand */}
          <Box sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center', gap: 1.5, mb: 4, justifyContent: 'center' }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
            }}>
              <TaskAltRounded sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>TaskGrid</Typography>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.75, letterSpacing: '-0.025em' }}>
            Sign in
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5 }}>
            Access your TaskGrid workspace
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth label="Email address" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} required
                autoComplete="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailRounded sx={{ fontSize: 17, color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth label="Password" type={showPw ? 'text' : 'password'}
                value={password} onChange={(e) => setPassword(e.target.value)} required
                autoComplete="current-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockRounded sx={{ fontSize: 17, color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPw(!showPw)} edge="end" size="small"
                        sx={{ color: '#94a3b8' }}>
                        {showPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit" fullWidth variant="contained" size="large"
                disabled={loading}
                endIcon={!loading && <ArrowForwardRounded />}
                sx={{
                  mt: 0.5, py: 1.375, fontWeight: 700, fontSize: '0.9375rem',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                    boxShadow: '0 8px 28px rgba(99,102,241,0.45)',
                  },
                }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Continue'}
              </Button>
            </Box>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', px: 1.5 }}>Demo access</Typography>
          </Divider>

          {/* Demo credentials */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {DEMO_USERS.map((c) => (
              <Box
                key={c.role}
                onClick={() => { setEmail(c.email); setPassword(c.pw); }}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  p: '10px 14px', borderRadius: 2, cursor: 'pointer',
                  border: '1px solid #e2e8f0', bgcolor: '#fff',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: '#6366f1',
                    boxShadow: '0 0 0 3px rgba(99,102,241,0.08)',
                    bgcolor: '#fafafe',
                  },
                }}
              >
                <Box sx={{
                  width: 28, height: 28, borderRadius: '7px',
                  bgcolor: `${c.color}18`, border: `1.5px solid ${c.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Typography sx={{ color: c.color, fontSize: '0.7rem', fontWeight: 800 }}>
                    {c.role[0]}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#0f172a', lineHeight: 1.3 }}>
                    {c.role}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.3 }}>
                    {c.email}
                  </Typography>
                </Box>
                <CheckRounded sx={{ fontSize: 15, color: '#cbd5e1' }} />
              </Box>
            ))}
          </Box>

          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: '#cbd5e1', mt: 3 }}>
            Protected by enterprise-grade security · TLS 1.3
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
