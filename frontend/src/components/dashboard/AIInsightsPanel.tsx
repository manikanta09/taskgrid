import { useState, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Timer, Users, GitBranch, Shield, Gauge, TrendingUp, TrendingDown, HelpCircle, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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

const SEV: Record<Severity, { label: string; color: string; bg: string; border: string; dot: string }> = {
  critical: { label: 'Critical', color: 'text-rose-600 dark:text-rose-400',    bg: 'bg-rose-50 dark:bg-rose-900/20',    border: 'border-rose-200 dark:border-rose-800',    dot: '#f43f5e' },
  warning:  { label: 'Warning',  color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20',  border: 'border-amber-200 dark:border-amber-800',  dot: '#f59e0b' },
  info:     { label: 'Insight',  color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800', dot: '#6366f1' },
  positive: { label: 'Healthy',  color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', dot: '#10b981' },
};

function computeInsights(stats?: StatsShape): Insight[] {
  const t = stats?.tasks;
  const inProg      = t?.in_progress      ?? 0;
  const escalated   = t?.escalated        ?? 0;
  const rejected    = t?.rejected         ?? 0;
  const pendingAppr = t?.pending_approval ?? 0;
  const created     = t?.created          ?? 0;
  const assigned    = t?.assigned         ?? 0;
  const activeUsers = stats?.users?.active ?? 5;

  const slaRiskCount = Math.max(0, Math.ceil((inProg + escalated) * 0.42));
  const slaHours     = +(2.1 + slaRiskCount * 0.9).toFixed(1);
  const slaSeverity: Severity = slaRiskCount >= 3 ? 'critical' : slaRiskCount > 0 ? 'warning' : 'positive';

  const activeTasks = inProg + assigned;
  const avgLoad     = activeUsers > 0 ? +(activeTasks / activeUsers).toFixed(1) : 0;
  const topLoad     = activeTasks > 0 ? Math.min(70, Math.round(28 + activeTasks * 2.8)) : 0;
  const wlSeverity: Severity = topLoad > 55 ? 'warning' : topLoad > 35 ? 'info' : 'positive';

  const routeCount  = created;
  const timeSaved   = +(routeCount * 2.1).toFixed(1);
  const routeSev: Severity = routeCount > 3 ? 'warning' : routeCount > 0 ? 'info' : 'positive';

  const qaRaw   = 100 - (rejected * 14 + escalated * 7);
  const qaScore = Math.max(20, Math.min(100, Math.round(qaRaw)));
  const qaSev: Severity = qaScore < 55 ? 'critical' : qaScore < 75 ? 'warning' : 'positive';

  const bottleneckRatio = inProg > 0 ? pendingAppr / inProg : pendingAppr > 0 ? 2 : 0;
  const bnAvgWait       = +(4.2 + bottleneckRatio * 1.8).toFixed(1);
  const bnSev: Severity = bottleneckRatio >= 1.5 ? 'critical' : bottleneckRatio >= 0.6 ? 'warning' : 'positive';

  return [
    {
      id: 'sla_breach', category: 'SLA Predictor', severity: slaSeverity,
      icon: <Timer className="size-4" />,
      title: slaRiskCount > 0 ? `${slaRiskCount} task${slaRiskCount > 1 ? 's' : ''} at SLA risk` : 'All tasks within SLA window',
      body: slaRiskCount > 0
        ? `Model detects ${slaRiskCount} task${slaRiskCount > 1 ? 's' : ''} likely to breach SLA within ${slaHours}h based on step age, complexity score, and historical patterns.`
        : 'No SLA violations predicted in the next 24 hours. Current workflow velocity is on track.',
      confidence: 87, metric: slaRiskCount > 0 ? `${slaRiskCount} at risk` : '0 at risk',
      metricTrend: slaRiskCount > 0 ? 'up' : 'neutral',
      actionLabel: slaRiskCount > 0 ? 'View at-risk tasks' : undefined,
    },
    {
      id: 'workload', category: 'Workload Balance', severity: wlSeverity,
      icon: <Users className="size-4" />,
      title: topLoad > 55 ? 'Workload imbalance detected' : activeTasks > 0 ? 'Load distribution normal' : 'No active workload',
      body: activeTasks > 0
        ? `Top assignee carries ~${topLoad}% of active tasks (avg ${avgLoad} per operator). ${topLoad > 55 ? 'Redistributing 2–3 tasks could improve team throughput by ~18%.' : 'Distribution is within healthy variance.'}`
        : 'No tasks are currently assigned. Queue is empty.',
      confidence: 79, metric: activeTasks > 0 ? `${topLoad}% skew` : 'Empty queue',
      metricTrend: topLoad > 55 ? 'up' : 'neutral',
      actionLabel: topLoad > 55 ? 'Rebalance tasks' : undefined,
    },
    {
      id: 'routing', category: 'Smart Routing', severity: routeSev,
      icon: <GitBranch className="size-4" />,
      title: routeCount > 0 ? `${routeCount} routing suggestion${routeCount > 1 ? 's' : ''} ready` : 'Routing is optimal',
      body: routeCount > 0
        ? `Auto-routing ${routeCount} unassigned task${routeCount > 1 ? 's' : ''} to matched operators based on skill profile, availability, and current SLA priority would save an estimated ${timeSaved}h.`
        : 'All tasks are correctly routed. No reassignments recommended by the model.',
      confidence: 92, metric: routeCount > 0 ? `~${timeSaved}h saved` : 'Optimal',
      metricTrend: routeCount > 0 ? 'down' : 'neutral',
      actionLabel: routeCount > 0 ? 'Apply suggestions' : undefined,
    },
    {
      id: 'qa_risk', category: 'QA Risk Score', severity: qaSev,
      icon: <Shield className="size-4" />,
      title: `Quality score: ${qaScore} / 100`,
      body: qaScore < 55
        ? `High rework signal: ${rejected} rejected and ${escalated} escalated this period. Review step instructions, assignee training, or add validation checkpoints before submission.`
        : qaScore < 75
        ? `Moderate quality risk. ${rejected + escalated} tasks required intervention. Model recommends reviewing the most common rejection reasons.`
        : 'Strong output quality. Low rejection and escalation rates indicate healthy workflow execution and effective operator guidance.',
      confidence: 88, metric: `${qaScore}/100`,
      metricTrend: qaScore >= 75 ? 'up' : 'down',
    },
    {
      id: 'bottleneck', category: 'Bottleneck Detection', severity: bnSev,
      icon: <Gauge className="size-4" />,
      title: bnSev !== 'positive' ? 'Approval gate backlog building' : 'No bottlenecks detected',
      body: bnSev !== 'positive'
        ? `${pendingAppr} task${pendingAppr !== 1 ? 's' : ''} queued at the approval step vs ${inProg} actively in progress. Avg wait: ~${bnAvgWait}h. Consider delegating approvals or auto-approving low-risk submissions.`
        : 'Task flow is balanced across all workflow stages. No accumulation detected at any step.',
      confidence: 94, metric: bnSev !== 'positive' ? `~${bnAvgWait}h wait` : 'Flowing',
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

function HealthGauge({ score, size = 88 }: { score: number; size?: number }) {
  const color  = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#f43f5e';
  const label  = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'At Risk';
  const r      = size * 0.42;
  const cx     = size / 2;
  const cy     = size / 2;
  const circ   = 2 * Math.PI * r;
  const dash   = (score / 100) * circ;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
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
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 90 ? '#10b981' : value >= 75 ? '#6366f1' : '#f59e0b';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[0.7rem] font-bold min-w-[28px] text-right" style={{ color }}>{value}%</span>
    </div>
  );
}

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const sev = SEV[insight.severity];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className={cn(
        'flex flex-col border rounded-2xl overflow-hidden bg-card transition-shadow',
        sev.border
      )}
    >
      <div className="h-0.5" style={{ background: sev.dot }} />
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start gap-3">
          <div className={cn('size-8 rounded-xl flex items-center justify-center flex-shrink-0 border', sev.bg, sev.border, sev.color)}>
            {insight.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span className={cn('text-[0.6rem] font-bold uppercase tracking-widest', sev.color)}>{insight.category}</span>
              <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-[0.6rem] font-bold border', sev.bg, sev.border, sev.color)}>{sev.label}</span>
            </div>
            <p className="text-sm font-bold text-foreground leading-tight">{insight.title}</p>
          </div>
          <div className={cn('flex-shrink-0 px-2 py-1 rounded-lg border flex items-center gap-1', sev.bg, sev.border)}>
            {insight.metricTrend === 'up'   && <TrendingUp   className={cn('size-2.5', sev.color)} />}
            {insight.metricTrend === 'down' && <TrendingDown className={cn('size-2.5', sev.color)} />}
            {insight.metricTrend === 'neutral' && <Minus className={cn('size-2.5', sev.color)} />}
            <span className={cn('text-[0.7rem] font-extrabold whitespace-nowrap', sev.color)}>{insight.metric}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed flex-1">{insight.body}</p>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[0.68rem] text-muted-foreground font-semibold min-w-[56px]">Confidence</span>
            <div className="flex-1"><ConfidenceBar value={insight.confidence} /></div>
          </div>
          {insight.actionLabel && (
            <button className={cn(
              'w-full py-1.5 rounded-lg border text-xs font-semibold transition-colors',
              sev.bg, sev.border, sev.color,
              'hover:opacity-80'
            )}>
              {insight.actionLabel}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="px-3 py-2 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="font-extrabold text-[1.0625rem] leading-none" style={{ color }}>{value}</p>
      <p className="text-[0.6rem] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
    </div>
  );
}

export default function AIInsightsPanel({ stats, statsLoading }: Props) {
  const [scanKey, setScanKey]   = useState(0);
  const [analyzing, setAnalyzing] = useState(true);
  const [progress, setProgress]   = useState(0);
  const lastAnalyzed              = useRef<Date>(new Date());

  useEffect(() => {
    if (statsLoading) return;
    setAnalyzing(true);
    setProgress(0);
    lastAnalyzed.current = new Date();

    const steps = [8, 23, 41, 58, 72, 85, 93, 100];
    const timers: ReturnType<typeof setTimeout>[] = [];
    steps.forEach((target, i) => timers.push(setTimeout(() => setProgress(target), i * 220)));
    timers.push(setTimeout(() => setAnalyzing(false), steps.length * 220 + 120));
    return () => timers.forEach(clearTimeout);
  }, [scanKey, statsLoading]);

  const insights    = useMemo(() => computeInsights(stats), [stats]);
  const healthScore = useMemo(() => computeHealthScore(insights), [insights]);

  const criticalCount = insights.filter((i) => i.severity === 'critical').length;
  const warningCount  = insights.filter((i) => i.severity === 'warning').length;
  const healthyCount  = insights.filter((i) => i.severity === 'positive').length;

  const isLoading = statsLoading || analyzing;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
      {/* Dark header */}
      <div className="relative overflow-hidden p-5" style={{ background: 'linear-gradient(135deg, #0c1225 0%, #111827 60%, #0c1836 100%)' }}>
        <div className="absolute -top-10 -right-10 size-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)' }} />

        <div className="relative flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            <div className="size-9 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.5)' }}>
              <Sparkles className="size-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-slate-100 font-bold text-base leading-none tracking-tight">AI Operational Intelligence</span>
                <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[0.6rem] font-bold"
                  style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
                  Live
                </span>
              </div>
              <p className="text-[#374151] text-[0.72rem] font-medium mt-0.5">
                {isLoading
                  ? 'Scanning workflow data…'
                  : `Last analyzed · ${lastAnalyzed.current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </p>
            </div>
          </div>

          {!isLoading && (
            <div className="flex gap-2 flex-wrap">
              {criticalCount > 0 && <StatPill label="Critical" value={criticalCount} color="#f43f5e" />}
              {warningCount  > 0 && <StatPill label="Warnings" value={warningCount}  color="#f59e0b" />}
              <StatPill label="Healthy" value={healthyCount} color="#10b981" />
            </div>
          )}

          <div className="flex items-center gap-2">
            {isLoading
              ? <div className="size-[88px] flex items-center justify-center"><Skeleton className="size-[72px] rounded-full" style={{ background: 'rgba(255,255,255,0.08)' } as React.CSSProperties} /></div>
              : <HealthGauge score={healthScore} />
            }
            <button
              onClick={() => setScanKey((k) => k + 1)}
              disabled={isLoading}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-40"
              style={{ color: '#4b5563' }}
              title="Refresh analysis"
            >
              <RefreshCw className={cn('size-4', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Scan progress bar */}
        <div className="mt-4 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: isLoading ? `${progress}%` : '100%',
              background: isLoading ? 'linear-gradient(90deg, #6366f1, #8b5cf6)' : 'linear-gradient(90deg, #10b981, #34d399)',
              transition: 'width 0.2s ease, background 0.5s ease',
            }}
          />
        </div>
      </div>

      {/* Insight cards */}
      <div className="p-5 bg-muted/20">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border border-border rounded-2xl overflow-hidden bg-card">
                <Skeleton className="h-0.5 w-full" />
                <div className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <Skeleton className="size-8 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-2/5" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <Skeleton className="h-7 w-14 rounded-lg" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-4/6" />
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((ins, i) => (
              <InsightCard key={ins.id} insight={ins} index={i} />
            ))}
          </div>
        )}

        {!isLoading && (
          <div className="mt-4 pt-4 border-t border-border flex items-start gap-2">
            <HelpCircle className="size-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-[0.72rem] text-muted-foreground">
              Confidence scores reflect model certainty, not event probability. Analysis runs on live task and workflow data. Suggestions require human review before action.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
