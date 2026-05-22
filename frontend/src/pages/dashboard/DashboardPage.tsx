import {
  Grid, Card, CardContent, Typography, Box, Skeleton,
  Divider, Chip, Avatar, Button,
} from '@mui/material';
import {
  AssignmentRounded, HourglassTopRounded, ThumbsUpDownRounded,
  CheckCircleRounded, AccountTreeRounded,
  ArrowForwardRounded, FiberManualRecordRounded, EastRounded,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid,
} from 'recharts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { adminApi } from '../../api/approvals';
import { tasksApi } from '../../api/tasks';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import MetricCard from '../../components/common/MetricCard';
import StatusChip from '../../components/common/StatusChip';
import AIInsightsPanel from '../../components/dashboard/AIInsightsPanel';
import type { TaskStatus } from '../../types/task';

dayjs.extend(relativeTime);

const STATUS_COLORS: Record<string, string> = {
  CREATED: '#94a3b8', ASSIGNED: '#3b82f6', IN_PROGRESS: '#f59e0b',
  PENDING_APPROVAL: '#8b5cf6', COMPLETED: '#10b981',
  REJECTED: '#f43f5e', ESCALATED: '#f97316', CANCELLED: '#cbd5e1',
};

const PIE_COLORS = ['#94a3b8', '#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#f43f5e', '#f97316'];

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
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle1">{title}</Typography>
        {count !== undefined && (
          <Chip label={count} size="small"
            sx={{ height: 18, fontSize: '0.68rem', bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 700 }} />
        )}
      </Box>
      {action && (
        <Button
          size="small" endIcon={<EastRounded sx={{ fontSize: 13 }} />}
          onClick={() => navigate(action)}
          sx={{ color: '#6366f1', fontSize: '0.75rem', fontWeight: 600, p: '2px 6px', minWidth: 0 }}
        >
          View all
        </Button>
      )}
    </Box>
  );
}

export default function DashboardPage() {
  const navigate  = useNavigate();
  const { user }  = useAuthStore();
  const hour      = dayjs().hour();
  const greeting  = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.stats,
    refetchInterval: 30000,
  });

  const { data: myTasks } = useQuery({
    queryKey: ['my-tasks-dashboard'],
    queryFn: () => tasksApi.mine({ limit: 6 }),
  });

  const { data: pendingTasks } = useQuery({
    queryKey: ['tasks-pending-approval'],
    queryFn: () => tasksApi.list({ status: 'PENDING_APPROVAL', limit: 6 }),
  });

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
    <Box sx={{ animation: 'fadeSlideIn 0.3s ease both' }}>

      {/* ── Greeting hero ──────────────────────────────── */}
      <Box sx={{
        mb: 3.5, p: '20px 24px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        borderRadius: 3, position: 'relative', overflow: 'hidden',
        '&::after': {
          content: '""', position: 'absolute', right: -60, top: -60,
          width: 240, height: 240, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        },
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 44, height: 44, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontWeight: 700, fontSize: '1.125rem' }}>
              {user?.full_name?.charAt(0)}
            </Avatar>
            <Box>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 500, lineHeight: 1 }}>
                {greeting}
              </Typography>
              <Typography sx={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em', mt: 0.25 }}>
                {user?.full_name?.split(' ')[0]} 👋
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
            <Typography sx={{ color: '#475569', fontSize: '0.75rem', fontWeight: 600 }}>
              {dayjs().format('dddd, MMMM D')}
            </Typography>
            <Typography sx={{ color: '#6366f1', fontSize: '0.8125rem', fontWeight: 600, mt: 0.25 }}>
              AI analysis ready
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Metrics ───────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { title: 'Open Tasks', color: '#3b82f6', bg: '#eff6ff', icon: <AssignmentRounded />,
            value: stats ? stats.tasks.created + stats.tasks.assigned : 0,
            subtitle: 'Awaiting action', trend: { value: 12, label: '' } },
          { title: 'In Progress', color: '#f59e0b', bg: '#fffbeb', icon: <HourglassTopRounded />,
            value: stats?.tasks.in_progress ?? 0,
            subtitle: 'Active right now', trend: { value: 5, label: '' } },
          { title: 'Pending Approval', color: '#8b5cf6', bg: '#f5f3ff', icon: <ThumbsUpDownRounded />,
            value: stats?.tasks.pending_approval ?? 0,
            subtitle: 'Awaiting decision', trend: { value: -3, label: '' } },
          { title: 'Completed Today', color: '#10b981', bg: '#ecfdf5', icon: <CheckCircleRounded />,
            value: stats?.tasks.completed_today ?? 0,
            subtitle: 'Last 24 hours', trend: { value: 18, label: '' } },
        ].map((m) => (
          <Grid item xs={12} sm={6} lg={3} key={m.title}>
            <MetricCard {...m} loading={statsLoading} />
          </Grid>
        ))}
      </Grid>

      {/* ── Charts ────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={7}>
          <Card sx={{ height: 300 }}>
            <CardContent sx={{ p: '20px 20px 0 !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1">Weekly Throughput</Typography>
                  <Typography variant="caption" color="text.secondary">Completed vs escalated tasks</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  {[{ color: '#10b981', label: 'Completed' }, { color: '#f97316', label: 'Escalated' }].map((l) => (
                    <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: l.color }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{l.label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={areaData} margin={{ top: 0, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gComplete" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gEscalate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                  cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                />
                <Area type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2}
                  fill="url(#gComplete)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
                <Area type="monotone" dataKey="escalated" name="Escalated" stroke="#f97316" strokeWidth={2}
                  fill="url(#gEscalate)" dot={false} activeDot={{ r: 4, fill: '#f97316' }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ height: 300 }}>
            <CardContent sx={{ p: '20px !important' }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="subtitle1">Status Distribution</Typography>
                <Typography variant="caption" color="text.secondary">
                  {statsLoading ? <Skeleton width={100} component="span" /> : `${totalTasks} total tasks`}
                </Typography>
              </Box>
              {statsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
                  <Skeleton variant="circular" width={160} height={160} />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ResponsiveContainer width={160} height={220}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="45%" innerRadius={52} outerRadius={72}
                        paddingAngle={3} dataKey="value" strokeWidth={0}>
                        {pieData.map((entry, i) => (
                          <Cell key={entry.name} fill={STATUS_COLORS[entry.key] ?? PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {pieData.map((entry, i) => (
                      <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.625 }}>
                          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: STATUS_COLORS[entry.key] ?? PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                          <Typography sx={{ fontSize: '0.72rem', color: '#475569', fontWeight: 500 }}>{entry.name}</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a' }}>{entry.value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── AI Operational Intelligence ─────────────── */}
      <Box sx={{ mb: 3 }}>
        <AIInsightsPanel stats={stats} statsLoading={statsLoading} />
      </Box>

      {/* ── My Tasks + Pending Approvals ─────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: '20px !important' }}>
              <SectionHeader title="My Tasks" action="/tasks/mine" count={myTasks?.total} />
              {!myTasks?.items.length ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <CheckCircleRounded sx={{ fontSize: 32, color: '#10b981', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">No tasks assigned to you</Typography>
                </Box>
              ) : (
                <Box>
                  {myTasks.items.slice(0, 6).map((task, i) => (
                    <Box key={task.id} onClick={() => navigate(`/tasks/${task.id}`)} sx={{ cursor: 'pointer' }}>
                      <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 1.25, py: 1.375,
                        '&:hover .task-title': { color: '#6366f1' },
                      }}>
                        <FiberManualRecordRounded sx={{ fontSize: 8, color: STATUS_COLORS[task.status] ?? '#94a3b8', flexShrink: 0 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography className="task-title" sx={{
                            fontWeight: 600, fontSize: '0.8125rem', color: '#0f172a',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.15s',
                          }}>
                            {task.title}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                            <StatusChip status={task.status as TaskStatus} />
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>· {dayjs(task.updated_at).fromNow()}</Typography>
                          </Box>
                        </Box>
                        <ArrowForwardRounded sx={{ fontSize: 14, color: '#cbd5e1', flexShrink: 0 }} />
                      </Box>
                      {i < myTasks.items.length - 1 && <Divider />}
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: '20px !important' }}>
              <SectionHeader title="Pending Approvals" action="/approvals" count={pendingTasks?.total} />
              {!pendingTasks?.items.length ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <CheckCircleRounded sx={{ fontSize: 32, color: '#10b981', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">All caught up! No pending approvals.</Typography>
                </Box>
              ) : (
                <Box>
                  {pendingTasks.items.slice(0, 6).map((task, i) => (
                    <Box key={task.id} onClick={() => navigate(`/tasks/${task.id}`)} sx={{ cursor: 'pointer' }}>
                      <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 1.25, py: 1.375,
                        '&:hover .task-title': { color: '#6366f1' },
                      }}>
                        <Box sx={{
                          width: 28, height: 28, borderRadius: '7px', flexShrink: 0,
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <AccountTreeRounded sx={{ fontSize: 13, color: 'white' }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography className="task-title" sx={{
                            fontWeight: 600, fontSize: '0.8125rem', color: '#0f172a',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.15s',
                          }}>
                            {task.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            WF-{task.workflow_id} · {dayjs(task.updated_at).fromNow()}
                          </Typography>
                        </Box>
                        <ArrowForwardRounded sx={{ fontSize: 14, color: '#cbd5e1', flexShrink: 0 }} />
                      </Box>
                      {i < pendingTasks.items.length - 1 && <Divider />}
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
