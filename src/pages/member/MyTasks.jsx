import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTask } from '../../context/TaskContext';
import { T } from '../../utils/theme';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';
import {
  TaskCard, Card, EmptyState, Spinner, StatCard, Select,
} from '../../components/ui';
import { CheckSquare, Clock, Loader2, CheckCircle2 } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '',            label: 'All Tasks'   },
  { value: 'pending',     label: 'Pending'     },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed'   },
];

export default function MyTasks() {
  const { currentUser } = useAuth();
  const { tasks, loadingTasks, getStats } = useTask();
  const navigate = useNavigate();
  const [filterStatus, setFilter] = useState('');

  const myTasks  = tasks.filter((t) => t.assignedTo === currentUser?.id);
  const filtered = filterStatus ? myTasks.filter((t) => t.status === filterStatus) : myTasks;

  const stats = {
    total:      myTasks.length,
    pending:    myTasks.filter((t) => t.status === 'pending').length,
    inProgress: myTasks.filter((t) => t.status === 'in_progress').length,
    completed:  myTasks.filter((t) => t.status === 'completed').length,
  };

  const overdue = myTasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'DM Sans, sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header
          title={`My Tasks`}
          subtitle={`Hello ${currentUser?.name?.split(' ')[0]} 👋 — you have ${stats.pending + stats.inProgress} active task${stats.pending + stats.inProgress !== 1 ? 's' : ''}`}
        />

        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>

          {loadingTasks ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><Spinner size={32} /></div>
          ) : (
            <>
              {/* ── Stat summary ──────────────────────────── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                <StatCard label="Total Assigned" value={stats.total}      icon={CheckSquare}  color={T.primary}          />
                <StatCard label="Pending"          value={stats.pending}    icon={Clock}         color={T.statusPending}    />
                <StatCard label="In Progress"      value={stats.inProgress} icon={Loader2}       color={T.statusInProgress} />
                <StatCard label="Completed"        value={stats.completed}  icon={CheckCircle2}  color={T.statusCompleted}  />
              </div>

              {/* ── Overdue warning ───────────────────────── */}
              {overdue.length > 0 && (
                <div style={{ background: T.dangerLight, border: `1.5px solid ${T.danger}30`, borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>⚠️</span>
                  <div>
                    <div style={{ fontWeight: 700, color: T.danger, fontSize: 14 }}>You have {overdue.length} overdue task{overdue.length !== 1 ? 's' : ''}!</div>
                    <div style={{ fontSize: 12, color: T.danger, marginTop: 2 }}>Please update your manager on these tasks as soon as possible.</div>
                  </div>
                </div>
              )}

              {/* ── Filter bar ────────────────────────────── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilter(opt.value)}
                      style={{
                        padding: '7px 16px', borderRadius: 99, border: 'none', cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600,
                        background: filterStatus === opt.value ? T.primary : T.surface,
                        color:      filterStatus === opt.value ? '#fff' : T.textSecondary,
                        boxShadow:  filterStatus === opt.value ? T.btnShadow : T.cardShadow,
                        transition: 'all 0.15s',
                      }}
                    >
                      {opt.label}
                      {opt.value && ` (${myTasks.filter((t) => t.status === opt.value || !opt.value).length})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Task grid ─────────────────────────────── */}
              {filtered.length === 0 ? (
                <EmptyState
                  icon={CheckSquare}
                  message={filterStatus ? `No ${filterStatus.replace('_', ' ')} tasks` : 'No tasks assigned yet'}
                  sub={filterStatus ? 'Try a different filter.' : 'Your manager will assign tasks to you soon.'}
                />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                  {filtered.map((task) => (
                    <TaskCard key={task.id} task={task} onClick={() => navigate(`/tasks/${task.id}`)} />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
