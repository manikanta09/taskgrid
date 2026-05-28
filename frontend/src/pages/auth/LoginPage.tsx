import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { apiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const FEATURES = [
  { icon: '⚡', title: 'Intelligent Routing', desc: 'AI-powered task assignment based on role, capacity, and SLA priority.' },
  { icon: '🔄', title: 'Multi-Step Workflows', desc: 'Design approval chains and automation flows with a no-code builder.' },
  { icon: '📊', title: 'Real-Time Analytics', desc: 'Live dashboards with SLA tracking, escalation alerts, and completion rates.' },
  { icon: '🔒', title: 'Enterprise Security', desc: 'RBAC, full audit trails, and compliance-ready activity logging.' },
];

const DEMO_USERS = [
  { role: 'Admin',    email: 'admin@taskgrid.io',   pw: 'admin123',   color: '#f87171', bg: '#fee2e2' },
  { role: 'Manager',  email: 'manager@taskgrid.io', pw: 'manager123', color: '#818cf8', bg: '#ede9fe' },
  { role: 'Operator', email: 'ops1@taskgrid.io',    pw: 'ops123',     color: '#34d399', bg: '#d1fae5' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail]     = useState('admin@taskgrid.io');
  const [password, setPassword] = useState('admin123');
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

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
    <div className="flex min-h-screen bg-[#0a0f1e]">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-[46%] p-14 relative overflow-hidden border-r border-white/5"
        style={{ background: 'linear-gradient(160deg, #0c1225 0%, #111827 60%, #0c1836 100%)' }}>
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        {/* Glow orbs */}
        <div className="absolute -top-32 -left-20 size-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-24 -right-10 size-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)' }} />

        {/* Brand */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <Zap className="size-5 text-white" />
          </div>
          <div>
            <div className="text-base font-extrabold text-slate-100 tracking-tight">TaskGrid</div>
            <div className="text-[0.6rem] font-bold uppercase tracking-widest text-indigo-400">Enterprise</div>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10 py-16">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[2.25rem] font-extrabold text-slate-50 leading-tight tracking-tight mb-3"
          >
            Orchestrate work at{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              enterprise scale
            </span>
          </motion.h2>
          <p className="text-[#6b7280] text-base leading-relaxed max-w-sm">
            Automate multi-step approval workflows, enforce SLAs, and give your team a single pane of glass for every task.
          </p>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-5 mb-10">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              className="flex gap-3"
            >
              <div className="size-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-base flex-shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="text-[#e2e8f0] font-semibold text-sm">{f.title}</p>
                <p className="text-[#4b5563] text-[0.8125rem] leading-relaxed mt-0.5">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testimonial */}
        <div className="relative z-10 p-4 rounded-xl bg-white/3 border border-white/6">
          <div className="flex gap-0.5 mb-2">{Array.from({ length: 5 }).map((_, i) => <span key={i} className="text-amber-400 text-sm">★</span>)}</div>
          <p className="text-[#d1d5db] text-[0.8125rem] leading-relaxed italic">
            "TaskGrid reduced our approval cycle time by 67% in the first quarter."
          </p>
          <p className="text-[#4b5563] text-xs mt-2 font-semibold">— Head of Operations, Fortune 500</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative bg-slate-50 dark:bg-[#0f172a]"
        style={{ backgroundImage: 'radial-gradient(rgba(99,102,241,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-[380px]"
        >
          {/* Mobile brand */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8 justify-center">
            <div className="size-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Zap className="size-4.5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">TaskGrid</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Sign in</h1>
          <p className="text-sm text-muted-foreground mb-6">Access your TaskGrid workspace</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="pl-9" required autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="password" type={showPw ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10" required autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" variant="gradient" size="lg" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center gap-2">Continue <ArrowRight className="size-4" /></span>
              )}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-slate-50 dark:bg-[#0f172a] text-xs text-muted-foreground">Demo access</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {DEMO_USERS.map((c) => (
              <button
                key={c.role}
                type="button"
                onClick={() => { setEmail(c.email); setPassword(c.pw); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-indigo-300 hover:shadow-glow transition-all duration-150 text-left dark:hover:border-indigo-700"
              >
                <div className="size-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ background: c.bg, color: c.color }}>
                  {c.role[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{c.role}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                </div>
                <CheckCircle2 className="size-4 text-border flex-shrink-0" />
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground/50 mt-6">
            Protected by enterprise-grade security · TLS 1.3
          </p>
        </motion.div>
      </div>
    </div>
  );
}
