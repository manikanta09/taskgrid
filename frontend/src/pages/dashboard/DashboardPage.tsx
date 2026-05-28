import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid,
} from 'recharts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ClipboardList, Hourglass, ThumbsUp, CheckCircle2, GitBranch, ArrowRight, Circle } from 'lucide-react';
import { adminApi } from '@/api/approvals';
import { tasksApi } from '@/api/tasks';
import { useAuthStore } from '@/store/authStore';
import MetricCard from '@/components/common/MetricCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import AIInsightsPanel from '@/components/dashboard/AIInsightsPanel';
import { Skeleton } from '@/components/ui/skeleton';
import type { TaskStatus } from '@/types/task';

dayjs.extend(relativeTime);

const STATUS_COLORS: Record<string, string> = {
  CREATED: '#94a3b8', ASSIGNED: '#3b82f6', IN_PROGRESS: '#f59e0b',
  PENDING_APPROVAL: '#8b5cf6', COMPLETED: '#10b981',
  REJECTED: '#f43f5e', ESCALATED: '#f97316', CANCELLED: '#cbd5e1',
};
const PIE_COLORS = ['#94a3b8','#3b82f6','#f59e0b','#8b5cf6','#10b981','#f43f5e','#f97316'];

const areaData = [
  { name: 'Mon', completed: 4, escalated: 1 },
  { name: 'Tue', completed: 7, escalated: 0 },
  { name: 'Wed', completed: 5, escalated: 2 },
  { name: 'Thu', completed: 9, escalated: 1 },
  { name: 'Fri', completed: 6, escalated: 1 },
  { name: 'Sat', completed: 2, escalated: 0 },
  { name: 'Sun', completed: 3, escalated: 0 },
];

function SectionHeader({ title, action, count }: { title: string; action?: string; count?: number }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <p className="text-sm font-bold text-foreground">{title}</p>
        {count !== undefined && (
          <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-bold bg-muted text-muted-foreground">{count}</span>
        )}
      </div>
      {action && (
        <button onClick={() => navigate(action)} className="flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:text-indigo-600 transition-colors">
          View all <ArrowRight className="size-3" />
        </button>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const hour     = dayjs().hour();
  const greeting = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.stats,
    refetchInterval: 30000,
  });

  const { data: myTasks }      = useQuery({ queryKey: ['my-tasks-dashboard'],     queryFn: () => tasksApi.mine({ limit: 6 }) });
  const { data: pendingTasks } = useQuery({ queryKey: ['tasks-pending-approval'], queryFn: () => tasksApi.list({ status: 'PENDING_APPROVAL', limit: 6 }) });

  const pieData = stats
    ? [
        { name: 'Created',     value: stats.tasks.created,         key: 'CREATED' },
        { name: 'Assigned',    value: stats.tasks.assigned,         key: 'ASSIGNED' },
        { name: 'In Progress', value: stats.tasks.in_progress,      key: 'IN_PROGRESS' },
        { name: 'Pending',     value: stats.tasks.pending_approval, key: 'PENDING_APPROVAL' },
        { name: 'Completed',   value: stats.tasks.completed,        key: 'COMPLETED' },
        { name: 'Escalated',   value: stats.tasks.escalated,        key: 'ESCALATED' },
        { name: 'Rejected',    value: stats.tasks.rejected,         key: 'REJECTED' },
      ].filter((d) => d.value > 0)
    : [];

  const totalTasks = stats
    ? stats.tasks.created + stats.tasks.assigned + stats.tasks.in_progress +
      stats.tasks.pending_approval + stats.tasks.completed + stats.tasks.escalated +
      stats.tasks.rejected + stats.tasks.cancelled
    : 0;

  return (
    <div className="space-y-5">
      {/* Greeting hero */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl p-5"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' }}
      >
        <div className="absolute -top-16 -right-16 size-60 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)' }} />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {user?.full_name?.charAt(0)}
            </div>
            <div>
              <p className="text-slate-400 text-[0.8125rem] font-medium leading-none">{greeting}</p>
              <p className="text-slate-100 font-bold text-xl tracking-tight mt-1">{user?.full_name?.split(' ')[0]} 👋</p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-slate-500 text-xs font-semibold">{dayjs().format('dddd, MMMM D')}</p>
            <p className="text-indigo-400 text-[0.8125rem] font-semibold mt-0.5">AI analysis ready</p>
          </div>
        </div>
      </motion.div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Open Tasks',       icon: <ClipboardList className="size-5" />, color: '#3b82f6', bg: '#eff6ff', value: stats ? stats.tasks.created + stats.tasks.assigned : 0, subtitle: 'Awaiting action',   trend: { value: 12, label: '' } },
          { title: 'In Progress',      icon: <Hourglass      className="size-5" />, color: '#f59e0b', bg: '#fffbeb', value: stats?.tasks.in_progress ?? 0,      subtitle: 'Active right now',  trend: { value: 5,  label: '' } },
          { title: 'Pending Approval', icon: <ThumbsUp       className="size-5" />, color: '#8b5cf6', bg: '#f5f3ff', value: stats?.tasks.pending_approval ?? 0, subtitle: 'Awaiting decision', trend: { value: -3, label: '' } },
          { title: 'Completed Today',  icon: <CheckCircle2   className="size-5" />, color: '#10b981', bg: '#ecfdf5', value: stats?.tasks.completed_today ?? 0,   subtitle: 'Last 24 hours',     trend: { value: 18, label: '' } },
        ].map((m) => (
          <MetricCard key={m.title} {...m} loading={statsLoading} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-5">
        {/* Area chart */}
        <div className="md:col-span-4 bg-card border border-border rounded-xl p-5 shadow-card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-foreground">Weekly Throughput</p>
              <p className="text-xs text-muted-foreground">Completed vs escalated tasks</p>
            </div>
            <div className="flex gap-3">
              {[{ color: '#10b981', label: 'Completed' }, { color: '#f97316', label: 'Escalated' }].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full" style={{ background: l.color }} />
                  <span className="text-xs text-muted-foreground">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={areaData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gComplete" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="gEscalate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f97316" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid hsl(var(--border))', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', background: 'hsl(var(--card))' }} />
              <Area type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2} fill="url(#gComplete)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
              <Area type="monotone" dataKey="escalated" name="Escalated"  stroke="#f97316" strokeWidth={2} fill="url(#gEscalate)" dot={false} activeDot={{ r: 4, fill: '#f97316' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="md:col-span-3 bg-card border border-border rounded-xl p-5 shadow-card">
          <p className="text-sm font-bold text-foreground mb-0.5">Status Distribution</p>
          <p className="text-xs text-muted-foreground mb-4">
            {statsLoading ? <Skeleton className="h-3 w-20 inline-block" /> : `${totalTasks} total tasks`}
          </p>
          {statsLoading ? (
            <div className="flex justify-center pt-4"><Skeleton className="size-40 rounded-full" /></div>
          ) : (
            <div className="flex items-center gap-2">
              <ResponsiveContainer width={150} height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" innerRadius={48} outerRadius={68} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, i) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.key] ?? PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid hsl(var(--border))', fontSize: 12, background: 'hsl(var(--card))' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="size-1.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[entry.key] ?? PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-[0.72rem] text-muted-foreground font-medium">{entry.name}</span>
                    </div>
                    <span className="text-[0.72rem] font-bold text-foreground">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Insights */}
      <AIInsightsPanel stats={stats} statsLoading={statsLoading} />

      {/* My Tasks + Pending Approvals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* My Tasks */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-card">
          <SectionHeader title="My Tasks" action="/tasks/mine" count={myTasks?.total} />
          {!myTasks?.items.length ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No tasks assigned to you</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {myTasks.items.slice(0, 6).map((task) => (
                <div key={task.id} onClick={() => navigate(`/tasks/${task.id}`)}
                  className="flex items-center gap-3 py-3 cursor-pointer group">
                  <Circle className="size-2 flex-shrink-0" style={{ color: STATUS_COLORS[task.status] ?? '#94a3b8', fill: STATUS_COLORS[task.status] ?? '#94a3b8' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.8125rem] font-semibold text-foreground group-hover:text-indigo-500 transition-colors truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusBadge status={task.status as TaskStatus} />
                      <span className="text-xs text-muted-foreground">· {dayjs(task.updated_at).fromNow()}</span>
                    </div>
                  </div>
                  <ArrowRight className="size-3.5 text-border flex-shrink-0 group-hover:text-muted-foreground transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Approvals */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-card">
          <SectionHeader title="Pending Approvals" action="/approvals" count={pendingTasks?.total} />
          {!pendingTasks?.items.length ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">All caught up! No pending approvals.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {pendingTasks.items.slice(0, 6).map((task) => (
                <div key={task.id} onClick={() => navigate(`/tasks/${task.id}`)}
                  className="flex items-center gap-3 py-3 cursor-pointer group">
                  <div className="size-7 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    <GitBranch className="size-3 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.8125rem] font-semibold text-foreground group-hover:text-indigo-500 transition-colors truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">WF-{task.workflow_id} · {dayjs(task.updated_at).fromNow()}</p>
                  </div>
                  <ArrowRight className="size-3.5 text-border flex-shrink-0 group-hover:text-muted-foreground transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
