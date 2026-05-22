import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Tabs, Tab, IconButton, Tooltip, LinearProgress,
  TextField, InputAdornment, Avatar, Pagination, Stack,
} from '@mui/material';
import {
  SearchRounded, VisibilityRounded, AssignmentIndRounded, FlagRounded,
} from '@mui/icons-material';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { tasksApi } from '../../api/tasks';
import StatusChip from '../../components/common/StatusChip';
import PriorityChip from '../../components/common/PriorityChip';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import type { TaskStatus } from '../../types/task';

dayjs.extend(relativeTime);

type TabVal = 'all' | TaskStatus;

const TABS: { value: TabVal; label: string }[] = [
  { value: 'all', label: 'All Tasks' },
  { value: 'CREATED', label: 'Unassigned' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'ESCALATED', label: 'Escalated' },
  { value: 'COMPLETED', label: 'Completed' },
];

export default function TaskQueuePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMine = location.pathname === '/tasks/mine';
  const [tab, setTab] = useState<TabVal>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 15;

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', { tab, page, mine: isMine }],
    queryFn: () => {
      const params = { status: tab === 'all' ? undefined : tab, page, limit: LIMIT };
      return isMine ? tasksApi.mine(params) : tasksApi.list(params);
    },
  });

  const filtered = search
    ? data?.items.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
    : data?.items;

  return (
    <Box>
      <PageHeader
        title={isMine ? 'My Tasks' : 'Task Queue'}
        subtitle={`${data?.total ?? 0} total tasks`}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(1); }}
          sx={{ flex: 1, '& .MuiTabs-root': { minHeight: 40 } }}
          variant="scrollable" scrollButtons="auto">
          {TABS.map((t) => (
            <Tab key={t.value} value={t.value} label={t.label}
              sx={{ minHeight: 40, py: 1, fontSize: '0.8125rem' }} />
          ))}
        </Tabs>

        <TextField
          size="small" placeholder="Search tasks…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
          sx={{ width: 220 }}
        />
      </Box>

      <Card>
        {isLoading && <LinearProgress sx={{ borderRadius: '12px 12px 0 0' }} />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Task</TableCell>
                <TableCell>Workflow</TableCell>
                <TableCell>Assignee</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Due / Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered?.map((task) => (
                <TableRow
                  key={task.id} hover sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <TableCell>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                      #{task.id}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 260 }}>
                    <Typography variant="subtitle2" sx={{ color: '#0f172a',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Step {task.current_step}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: '#475569' }}>
                      WF-{task.workflow_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {task.current_assignee ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.65rem',
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                          {task.current_assignee.full_name.charAt(0)}
                        </Avatar>
                        <Typography variant="caption">{task.current_assignee.full_name.split(' ')[0]}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#cbd5e1' }}>Unassigned</Typography>
                    )}
                  </TableCell>
                  <TableCell><StatusChip status={task.status as TaskStatus} /></TableCell>
                  <TableCell><PriorityChip priority={task.priority as any} /></TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {task.due_at
                        ? `Due ${dayjs(task.due_at).fromNow()}`
                        : dayjs(task.updated_at).fromNow()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="View detail">
                        <IconButton size="small" onClick={() => navigate(`/tasks/${task.id}`)}>
                          <VisibilityRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {task.status === 'CREATED' && (
                        <Tooltip title="Claim task">
                          <IconButton size="small" color="primary">
                            <AssignmentIndRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {!isLoading && !filtered?.length && <EmptyState message="No tasks match the current filter." />}
        {data && data.pages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
            <Pagination count={data.pages} page={page} onChange={(_, p) => setPage(p)} size="small" />
          </Box>
        )}
      </Card>
    </Box>
  );
}
