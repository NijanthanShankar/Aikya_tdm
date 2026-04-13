import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTask } from '../../context/TaskContext';
import { T, ROLE_COLORS } from '../../utils/theme';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';
import {
  StatCard, Card, SectionTitle, TaskCard, StatusBadge, AvatarCircle,
  PriorityBadge, Spinner, EmptyState
} from '../../components/ui';
import {
  ClipboardList, Clock, Loader2, CheckCircle2, Users, TrendingUp, Bell,
} from 'lucide-react';

export default function Dashboard() {
  const { users } = useAuth();
  const { tasks, loadingTasks, getStats } = useTask();
  const navigate  = useNavigate();
  const stats     = getStats();

  // Recent tasks (last 5 updated)
  const recentTasks = [...tasks].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 6);

  // Per-member task stats
  const memberStats = users
    .filter((u) => u.role === 'member')
    .map((u) => {
      const mt      = tasks.filter((t) => t.assignedTo === u.id);
      const done    = mt.filter((t) => t.status === 'completed').length;
      const total   = mt.length;
      const rate    = total > 0 ? Math.round((done / total) * 100) : 0;
      const overdue = mt.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length;
      return { ...u, total, done, rate, inProgress: mt.filter((t) => t.status === 'in_progress').length, overdue };
    });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'DM Sans, sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header title="Manager Dashboard" subtitle="Overview of all tasks and team performance" />

        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>

          {loadingTasks ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <Spinner size={32} />
            </div>
          ) : (
            <>
              {/* ── Stat Cards ─────────────────────────────────── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
                <StatCard label="Total Tasks"   value={stats.total}      icon={ClipboardList} color={T.primary}          />
                <StatCard label="Pending"        value={stats.pending}    icon={Clock}         color={T.statusPending}    />
                <StatCard label="In Progress"    value={stats.inProgress} icon={Loader2}       color={T.statusInProgress} />
                <StatCard label="Completed"      value={stats.completed}  icon={CheckCircle2}  color={T.statusCompleted}  />
                <StatCard label="Team Members"   value={users.filter(u => u.role === 'member').length} icon={Users} color="#8b5cf6" />
              </div>

              {/* ── Team Performance + Recent Tasks ────────────── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>

                {/* Team Performance */}
                <Card style={{ padding: '20px 24px' }}>
                  <SectionTitle>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><TrendingUp size={18} color={T.primary} /> Team Performance</span>
                  </SectionTitle>
                  {memberStats.length === 0 ? (
                    <EmptyState icon={Users} message="No team members yet" sub="Add members in the Team section" />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {memberStats.map((m) => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <AvatarCircle name={m.name} avatar={m.avatar} color={ROLE_COLORS.member} avatarUrl={m.avatarUrl} size={36} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                              <span style={{ fontSize: 12, color: T.textMuted, flexShrink: 0, marginLeft: 8 }}>{m.done}/{m.total}</span>
                            </div>
                            {/* Progress bar */}
                            <div style={{ height: 6, borderRadius: 99, background: T.border, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${m.rate}%`, background: m.rate === 100 ? T.success : T.primary, borderRadius: 99, transition: 'width 0.4s' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                              <span style={{ fontSize: 11, color: T.textMuted }}>{m.rate}% complete</span>
                              {m.overdue > 0 && <span style={{ fontSize: 11, color: T.danger }}> · ⚠️ {m.overdue} overdue</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Quick Task Status */}
                <Card style={{ padding: '20px 24px' }}>
                  <SectionTitle>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Bell size={18} color={T.primary} /> Priority Alerts</span>
                  </SectionTitle>
                  {(() => {
                    const overdue  = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed');
                    const highPrio = tasks.filter((t) => t.priority === 'high' && t.status !== 'completed');
                    const unassigned = tasks.filter((t) => !t.assignedTo);
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                          { label: 'Overdue tasks',    count: overdue.length,    color: T.danger,   bg: T.dangerLight   },
                          { label: 'High priority',    count: highPrio.length,   color: '#f97316',  bg: '#fff7ed'       },
                          { label: 'Unassigned tasks', count: unassigned.length, color: T.warning,  bg: T.warningLight  },
                          { label: 'Completed today',  count: tasks.filter(t => t.status === 'completed' && new Date(t.updatedAt).toDateString() === new Date().toDateString()).length, color: T.success, bg: T.successLight },
                        ].map(({ label, count, color, bg }) => (
                          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: bg, border: `1px solid ${color}20` }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: T.textPrimary }}>{label}</span>
                            <span style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'Outfit, sans-serif' }}>{count}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </Card>
              </div>

              {/* ── Recent Tasks ─────────────────────────────────── */}
              <Card style={{ padding: '20px 24px' }}>
                <SectionTitle action={
                  <button
                    onClick={() => navigate('/tasks')}
                    style={{ fontSize: 13, color: T.primary, fontWeight: 600, background: T.primaryLight, border: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: 10 }}
                  >
                    View all →
                  </button>
                }>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ClipboardList size={18} color={T.primary} /> Recent Tasks</span>
                </SectionTitle>

                {recentTasks.length === 0 ? (
                  <EmptyState icon={ClipboardList} message="No tasks yet" sub="Create your first task from the Tasks page" />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                    {recentTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onClick={() => navigate(`/tasks/${task.id}`)} />
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
