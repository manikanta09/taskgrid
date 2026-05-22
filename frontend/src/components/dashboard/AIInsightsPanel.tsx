import { useState, useEffect, useMemo, useRef, type ReactNode } from 'react';
import {
  Box, Card, Typography, Chip, Button, Grid, Skeleton, Tooltip,
  IconButton, LinearProgress,
} from '@mui/material';
import {
  AutoAwesomeRounded, RefreshRounded, TimerRounded, GroupsRounded,
  CallSplitRounded, PolicyRounded, SpeedRounded, WarningAmberRounded,
  CheckCircleRounded, ErrorRounded, NorthRounded, SouthRounded,
  HelpOutlineRounded,
} from '@mui/icons-material';

// ─── Types ─────────────────────────────────────────────────────

type Severity = 'critical' | 'warning' | 'info' | 'positive';

interface Insight {
  id: string;
  category: string;
  severity: Severity;
  icon: ReactNode;
  title: string;
  body: string;
  confidence: number;
  metric: string;
  metricTrend?: 'up' | 'down' | 'neutral';
  actionLabel?: string;
}

interface StatsShape {
  tasks: {
    total: number; created: number; assigned: number; in_progress: number;
    pending_approval: number; completed: number; completed_today: number;
    escalated: number; rejected: number; cancelled: number;
  };
  workflows: { total: number; active: number; draft: number; archived: number };
  users: { total: number; active: number };
}

interface Props {
  stats?: StatsShape;
  statsLoading?: boolean;
}

// ─── Severity palette ───────────────────────────────────────────

const SEV: Record<Severity, { label: string; color: string; bg: string; border: string; dim: string }> = {
  critical: { label: 'Critical', color: '#f43f5e', bg: '#fff1f2', border: '#fecdd3', dim: '#be123c' },
  warning:  { label: 'Warning',  color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', dim: '#b45309' },
  info:     { label: 'Insight',  color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', dim: '#4f46e5' },
  positive: { label: 'Healthy',  color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', dim: '#047857' },
};

// ─── Mock AI engine ─────────────────────────────────────────────

function computeInsights(stats?: StatsShape): Insight[] {
  const t = stats?.tasks;
  const inProg      = t?.in_progress      ?? 0;
  const escalated   = t?.escalated        ?? 0;
  const rejected    = t?.rejected         ?? 0;
  const pendingAppr = t?.pending_approval ?? 0;
  const created     = t?.created          ?? 0;
  const assigned    = t?.assigned         ?? 0;
  const total       = t?.total            ?? 0;
  const completedToday = t?.completed_today ?? 0;
  const activeUsers = stats?.users?.active ?? 5;

  // ── SLA Breach Predictor ──────────────────────────────────────
  // tasks spending >1.5× their expected step duration → high-risk
  const slaRiskCount = Math.max(0, Math.ceil((inProg + escalated) * 0.42));
  const slaHours     = +(2.1 + slaRiskCount * 0.9).toFixed(1);
  const slaSeverity: Severity = slaRiskCount >= 3 ? 'critical' : slaRiskCount > 0 ? 'warning' : 'positive';

  // ── Workload Balance ──────────────────────────────────────────
  const activeTasks  = inProg + assigned;
  const avgLoad      = activeUsers > 0 ? +(activeTasks / activeUsers).toFixed(1) : 0;
  // synthetic top-assignee load: assume one person has ~38% of active tasks
  const topLoad      = activeTasks > 0 ? Math.min(70, Math.round(28 + activeTasks * 2.8)) : 0;
  const wlSeverity: Severity = topLoad > 55 ? 'warning' : topLoad > 35 ? 'info' : 'positive';

  // ── Smart Routing ─────────────────────────────────────────────
  // unassigned tasks that match available operator profiles
  const routeCount   = created;
  const timeSaved    = +(routeCount * 2.1).toFixed(1);
  const routeSev: Severity = routeCount > 3 ? 'warning' : routeCount > 0 ? 'info' : 'positive';

  // ── QA Risk Score ─────────────────────────────────────────────
  // penalise rejections (heavy) and escalations (moderate)
  const qaRaw   = 100 - (rejected * 14 + escalated * 7);
  const qaScore = Math.max(20, Math.min(100, Math.round(qaRaw)));
  const qaSev: Severity = qaScore < 55 ? 'critical' : qaScore < 75 ? 'warning' : 'positive';

  // ── Bottleneck Detection ──────────────────────────────────────
  // the approval gate is a bottleneck when pending_approval ≥ 60% of in-progress
  const bottleneckRatio = inProg > 0 ? pendingAppr / inProg : pendingAppr > 0 ? 2 : 0;
  const bnAvgWait       = +(4.2 + bottleneckRatio * 1.8).toFixed(1);
  const bnSev: Severity = bottleneckRatio >= 1.5 ? 'critical' : bottleneckRatio >= 0.6 ? 'warning' : 'positive';

  return [
    {
      id: 'sla_breach',
      category: 'SLA Predictor',
      severity: slaSeverity,
      icon: <TimerRounded />,
      title: slaRiskCount > 0
        ? `${slaRiskCount} task${slaRiskCount > 1 ? 's' : ''} at SLA risk`
        : 'All tasks within SLA window',
      body: slaRiskCount > 0
        ? `Model detects ${slaRiskCount} task${slaRiskCount > 1 ? 's' : ''} likely to breach SLA within ${slaHours}h based on step age, complexity score, and historical patterns.`
        : 'No SLA violations predicted in the next 24 hours. Current workflow velocity is on track.',
      confidence: 87,
      metric: slaRiskCount > 0 ? `${slaRiskCount} at risk` : '0 at risk',
      metricTrend: slaRiskCount > 0 ? 'up' : 'neutral',
      actionLabel: slaRiskCount > 0 ? 'View at-risk tasks' : undefined,
    },
    {
      id: 'workload',
      category: 'Workload Balance',
      severity: wlSeverity,
      icon: <GroupsRounded />,
      title: topLoad > 55
        ? `Workload imbalance detected`
        : activeTasks > 0 ? `Load distribution normal` : 'No active workload',
      body: activeTasks > 0
        ? `Top assignee carries ~${topLoad}% of active tasks (avg ${avgLoad} per operator). ${topLoad > 55 ? `Redistributing 2–3 tasks could improve team throughput by ~18%.` : `Distribution is within healthy variance.`}`
        : 'No tasks are currently assigned. Queue is empty.',
      confidence: 79,
      metric: activeTasks > 0 ? `${topLoad}% skew` : 'Empty queue',
      metricTrend: topLoad > 55 ? 'up' : 'neutral',
      actionLabel: topLoad > 55 ? 'Rebalance tasks' : undefined,
    },
    {
      id: 'routing',
      category: 'Smart Routing',
      severity: routeSev,
      icon: <CallSplitRounded />,
      title: routeCount > 0
        ? `${routeCount} routing suggestion${routeCount > 1 ? 's' : ''} ready`
        : 'Routing is optimal',
      body: routeCount > 0
        ? `Auto-routing ${routeCount} unassigned task${routeCount > 1 ? 's' : ''} to matched operators based on skill profile, availability, and current SLA priority would save an estimated ${timeSaved}h.`
        : 'All tasks are correctly routed. No reassignments recommended by the model.',
      confidence: 92,
      metric: routeCount > 0 ? `~${timeSaved}h saved` : 'Optimal',
      metricTrend: routeCount > 0 ? 'down' : 'neutral',
      actionLabel: routeCount > 0 ? 'Apply suggestions' : undefined,
    },
    {
      id: 'qa_risk',
      category: 'QA Risk Score',
      severity: qaSev,
      icon: <PolicyRounded />,
      title: `Quality score: ${qaScore} / 100`,
      body: qaScore < 55
        ? `High rework signal: ${rejected} rejected and ${escalated} escalated this period. Review step instructions, assignee training, or add validation checkpoints before submission.`
        : qaScore < 75
        ? `Moderate quality risk. ${rejected + escalated} tasks required intervention. Model recommends reviewing the most common rejection reasons.`
        : `Strong output quality. Low rejection and escalation rates indicate healthy workflow execution and effective operator guidance.`,
      confidence: 88,
      metric: `${qaScore}/100`,
      metricTrend: qaScore >= 75 ? 'up' : 'down',
    },
    {
      id: 'bottleneck',
      category: 'Bottleneck Detection',
      severity: bnSev,
      icon: <SpeedRounded />,
      title: bnSev !== 'positive'
        ? `Approval gate backlog building`
        : 'No bottlenecks detected',
      body: bnSev !== 'positive'
        ? `${pendingAppr} task${pendingAppr !== 1 ? 's' : ''} queued at the approval step vs ${inProg} actively in progress. Avg wait: ~${bnAvgWait}h. Consider delegating approvals or auto-approving low-risk submissions.`
        : 'Task flow is balanced across all workflow stages. No accumulation detected at any step.',
      confidence: 94,
      metric: bnSev !== 'positive' ? `~${bnAvgWait}h wait` : 'Flowing',
      metricTrend: bnSev !== 'positive' ? 'up' : 'neutral',
      actionLabel: bnSev !== 'positive' ? 'View approval queue' : undefined,
    },
  ];
}

function computeHealthScore(insights: Insight[]): number {
  const weights: Record<Severity, number> = { critical: 0, warning: 0.5, info: 0.85, positive: 1 };
  const avg = insights.reduce((s, ins) => s + weights[ins.severity], 0) / insights.length;
  return Math.round(avg * 100);
}

// ─── Health gauge (SVG arc) ─────────────────────────────────────

function HealthGauge({ score, size = 88 }: { score: number; size?: number }) {
  const color  = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#f43f5e';
  const label  = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'At Risk';
  const r      = size * 0.42;
  const cx     = size / 2;
  const cy     = size / 2;
  const circ   = 2 * Math.PI * r;
  const dash   = (score / 100) * circ;

  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90, ${cx}, ${cy})`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={size * 0.07} />
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke={color} strokeWidth={size * 0.07}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
        </g>
        <text x={cx} y={cy - 4} textAnchor="middle" fill="white"
          fontSize={size * 0.19} fontWeight="800" fontFamily="Inter, sans-serif">
          {score}
        </text>
        <text x={cx} y={cy + size * 0.14} textAnchor="middle" fill="rgba(255,255,255,0.45)"
          fontSize={size * 0.09} fontWeight="600" fontFamily="Inter, sans-serif" letterSpacing="0.04em">
          {label.toUpperCase()}
        </text>
      </svg>
    </Box>
  );
}

// ─── Confidence bar ─────────────────────────────────────────────

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 90 ? '#10b981' : value >= 75 ? '#6366f1' : '#f59e0b';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ flex: 1, height: 3, bgcolor: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{
          height: '100%', width: `${value}%`, bgcolor: color, borderRadius: 2,
          transition: 'width 1s ease',
        }} />
      </Box>
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color, minWidth: 28, textAlign: 'right' }}>
        {value}%
      </Typography>
    </Box>
  );
}

// ─── Single insight card ────────────────────────────────────────

function InsightCard({ insight, delay }: { insight: Insight; delay: number }) {
  const sev = SEV[insight.severity];
  return (
    <Grid item xs={12} sm={6} lg={insight.id === 'qa_risk' || insight.id === 'bottleneck' ? 6 : 4}>
      <Box
        sx={{
          height: '100%',
          border: `1px solid ${sev.border}`,
          borderRadius: 2.5,
          overflow: 'hidden',
          bgcolor: '#fff',
          display: 'flex', flexDirection: 'column',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          animation: 'fadeSlideIn 0.4s ease both',
          animationDelay: `${delay * 0.07}s`,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 24px rgba(0,0,0,0.07), 0 0 0 1px ${sev.border}`,
          },
        }}
      >
        {/* Accent bar */}
        <Box sx={{ height: 3, bgcolor: sev.color }} />

        <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: '9px', bgcolor: sev.bg, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${sev.border}`,
              '& .MuiSvgIcon-root': { fontSize: 16, color: sev.color },
            }}>
              {insight.icon}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25, flexWrap: 'wrap' }}>
                <Typography sx={{
                  fontSize: '0.65rem', fontWeight: 700, color: sev.dim,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  {insight.category}
                </Typography>
                <Chip
                  label={sev.label}
                  size="small"
                  sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: sev.bg, color: sev.color, border: 'none' }}
                />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', lineHeight: 1.3 }}>
                {insight.title}
              </Typography>
            </Box>

            {/* Metric badge */}
            <Box sx={{
              flexShrink: 0, px: 1, py: 0.5, borderRadius: 1.5,
              bgcolor: sev.bg, border: `1px solid ${sev.border}`,
              display: 'flex', alignItems: 'center', gap: 0.375,
            }}>
              {insight.metricTrend === 'up' && <NorthRounded sx={{ fontSize: 9, color: sev.color }} />}
              {insight.metricTrend === 'down' && <SouthRounded sx={{ fontSize: 9, color: sev.color }} />}
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: sev.dim, whiteSpace: 'nowrap' }}>
                {insight.metric}
              </Typography>
            </Box>
          </Box>

          {/* Body */}
          <Typography sx={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.6, flex: 1 }}>
            {insight.body}
          </Typography>

          {/* Footer */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: insight.actionLabel ? 1.25 : 0 }}>
              <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, minWidth: 64 }}>
                Confidence
              </Typography>
              <Box sx={{ flex: 1 }}>
                <ConfidenceBar value={insight.confidence} />
              </Box>
            </Box>
            {insight.actionLabel && (
              <Button
                size="small" variant="outlined" fullWidth
                sx={{
                  borderColor: sev.border, color: sev.dim, bgcolor: sev.bg,
                  fontSize: '0.75rem', fontWeight: 600, py: 0.5,
                  '&:hover': { borderColor: sev.color, bgcolor: sev.bg, boxShadow: 'none' },
                }}
              >
                {insight.actionLabel}
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Grid>
  );
}

// ─── Skeleton card ──────────────────────────────────────────────

function InsightSkeleton({ wide }: { wide?: boolean }) {
  return (
    <Grid item xs={12} sm={6} lg={wide ? 6 : 4}>
      <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2.5, overflow: 'hidden', bgcolor: '#fff' }}>
        <Skeleton variant="rectangular" height={3} sx={{ bgcolor: '#e2e8f0' }} />
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 1.25, mb: 1.5 }}>
            <Skeleton variant="rounded" width={32} height={32} sx={{ borderRadius: 1.5, flexShrink: 0 }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width="40%" height={12} sx={{ mb: 0.5 }} />
              <Skeleton width="75%" height={14} />
            </Box>
            <Skeleton width={52} height={28} sx={{ borderRadius: 1.5 }} />
          </Box>
          <Skeleton height={11} sx={{ mb: 0.5 }} />
          <Skeleton height={11} width="85%" sx={{ mb: 0.5 }} />
          <Skeleton height={11} width="70%" sx={{ mb: 2 }} />
          <Skeleton height={6} sx={{ borderRadius: 1 }} />
        </Box>
      </Box>
    </Grid>
  );
}

// ─── Summary stat pill ──────────────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <Box sx={{
      px: 1.75, py: 1, borderRadius: 2,
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.08)',
      textAlign: 'center',
    }}>
      <Typography sx={{ color, fontWeight: 800, fontSize: '1.0625rem', lineHeight: 1 }}>{value}</Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: 600, lineHeight: 1.4, mt: 0.25, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </Typography>
    </Box>
  );
}

// ─── Main panel ─────────────────────────────────────────────────

export default function AIInsightsPanel({ stats, statsLoading }: Props) {
  const [scanKey, setScanKey] = useState(0);
  const [analyzing, setAnalyzing] = useState(true);
  const [progress, setProgress]   = useState(0);
  const lastAnalyzed               = useRef<Date>(new Date());

  useEffect(() => {
    if (statsLoading) return;           // wait for real data first
    setAnalyzing(true);
    setProgress(0);
    lastAnalyzed.current = new Date();

    const steps = [8, 23, 41, 58, 72, 85, 93, 100];
    const timers: ReturnType<typeof setTimeout>[] = [];

    steps.forEach((target, i) => {
      timers.push(setTimeout(() => setProgress(target), i * 220));
    });

    timers.push(setTimeout(() => setAnalyzing(false), steps.length * 220 + 120));
    return () => timers.forEach(clearTimeout);
  }, [scanKey, statsLoading]);         // re-run on manual refresh

  const insights     = useMemo(() => computeInsights(stats), [stats]);
  const healthScore  = useMemo(() => computeHealthScore(insights), [insights]);

  const criticalCount = insights.filter((i) => i.severity === 'critical').length;
  const warningCount  = insights.filter((i) => i.severity === 'warning').length;
  const healthyCount  = insights.filter((i) => i.severity === 'positive').length;

  const isLoading = statsLoading || analyzing;

  return (
    <Card sx={{ overflow: 'hidden' }}>
      {/* ── Dark header ──────────────────────────────── */}
      <Box
        sx={{
          p: '20px 24px',
          background: 'linear-gradient(135deg, #0c1225 0%, #111827 60%, #0c1836 100%)',
          position: 'relative', overflow: 'hidden',
          '&::before': {
            content: '""', position: 'absolute',
            top: -40, right: -40, width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', position: 'relative' }}>
          {/* Brand + title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 200 }}>
            <Box sx={{
              width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99,102,241,0.5)',
            }}>
              <AutoAwesomeRounded sx={{ color: 'white', fontSize: 19 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.015em', lineHeight: 1 }}>
                  AI Operational Intelligence
                </Typography>
                <Chip
                  label="Live"
                  size="small"
                  sx={{
                    height: 17, fontSize: '0.6rem', fontWeight: 700,
                    bgcolor: 'rgba(99,102,241,0.2)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)',
                    animation: analyzing ? 'none' : undefined,
                  }}
                />
              </Box>
              <Typography sx={{ color: '#374151', fontSize: '0.72rem', fontWeight: 500, mt: 0.25 }}>
                {isLoading
                  ? 'Scanning workflow data…'
                  : `Last analyzed · ${lastAnalyzed.current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </Typography>
            </Box>
          </Box>

          {/* Summary pills */}
          {!isLoading && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {criticalCount > 0 && <StatPill label="Critical" value={criticalCount} color="#f43f5e" />}
              {warningCount > 0  && <StatPill label="Warnings" value={warningCount}  color="#f59e0b" />}
              <StatPill label="Healthy" value={healthyCount} color="#10b981" />
            </Box>
          )}

          {/* Health gauge */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {isLoading ? (
              <Box sx={{ width: 88, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Skeleton variant="circular" width={72} height={72} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
              </Box>
            ) : (
              <Tooltip title={`System health score: ${healthScore}/100`} arrow placement="left">
                <Box><HealthGauge score={healthScore} /></Box>
              </Tooltip>
            )}
            <Tooltip title="Refresh analysis" arrow>
              <IconButton
                size="small"
                onClick={() => setScanKey((k) => k + 1)}
                disabled={isLoading}
                sx={{ color: '#4b5563', '&:hover': { color: '#9ca3af', bgcolor: 'rgba(255,255,255,0.06)' } }}
              >
                <RefreshRounded fontSize="small" sx={{ transition: 'transform 0.3s', transform: isLoading ? 'rotate(180deg)' : 'rotate(0)' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Scan progress bar */}
        <Box sx={{ mt: 2, height: 2, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={{
            height: '100%', borderRadius: 1,
            background: isLoading
              ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
              : 'linear-gradient(90deg, #10b981, #34d399)',
            width: isLoading ? `${progress}%` : '100%',
            transition: 'width 0.2s ease, background 0.5s ease',
          }} />
        </Box>
      </Box>

      {/* ── Insight cards ─────────────────────────────── */}
      <Box sx={{ p: 2.5, bgcolor: '#fafbfc' }}>
        {isLoading ? (
          <Grid container spacing={2}>
            <InsightSkeleton />
            <InsightSkeleton />
            <InsightSkeleton />
            <InsightSkeleton wide />
            <InsightSkeleton wide />
          </Grid>
        ) : (
          <Grid container spacing={2}>
            {insights.slice(0, 3).map((ins, i) => (
              <InsightCard key={ins.id} insight={ins} delay={i} />
            ))}
            {insights.slice(3).map((ins, i) => (
              <InsightCard key={ins.id} insight={ins} delay={i + 3} />
            ))}
          </Grid>
        )}

        {/* Footer */}
        {!isLoading && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 1 }}>
            <HelpOutlineRounded sx={{ fontSize: 13, color: '#94a3b8' }} />
            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Confidence scores reflect model certainty, not event probability. Analysis runs on live task and workflow data. Suggestions require human review before action.
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
}
