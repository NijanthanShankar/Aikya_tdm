import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTask } from '../../context/TaskContext';
import { T } from '../../utils/theme';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';
import {
  Button, Card, SectionTitle, TaskCard, Select, Input,
  Modal, Textarea, Alert, FormGrid, EmptyState, Spinner,
} from '../../components/ui';
import { Plus, ClipboardList, Search, Filter } from 'lucide-react';

const PRIORITY_OPTIONS = [
  { value: '',       label: 'All Priorities' },
  { value: 'high',   label: 'High'           },
  { value: 'medium', label: 'Medium'         },
  { value: 'low',    label: 'Low'            },
];

const STATUS_OPTIONS = [
  { value: '',            label: 'All Statuses'  },
  { value: 'new',         label: 'New'           },
  { value: 'pending',     label: 'Pending'       },
  { value: 'in_progress', label: 'In Progress'   },
  { value: 'completed',   label: 'Completed'     },
  { value: 'need_clarification', label: 'Need Clarification' },
  { value: 'pending_requirements', label: 'Pending Requirements' },
  { value: 'paused',      label: 'Paused'        },
];

const EMPTY_FORM = {
  title: '', description: '', assignedTo: '', dueDate: '',
  priority: 'medium', status: 'new',
};

export default function AllTasks() {
  const { users }    = useAuth();
  const { tasks, loadingTasks, createTask, updateTask, deleteTask } = useTask();
  const navigate = useNavigate();

  // Filters
  const [search,     setSearch]     = useState('');
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterUser,     setFilterUser]     = useState('');

  // Modal state
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editTask,   setEditTask]   = useState(null); // null = create
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState('');

  // Filtered tasks
  const filtered = tasks.filter((t) => {
    if (filterStatus   && t.status   !== filterStatus)   return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterUser     && t.assignedTo !== filterUser)   return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !(t.description || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const members = users.filter((u) => u.role === 'member');
  const memberOptions = [{ value: '', label: 'Unassigned' }, ...members.map((u) => ({ value: u.id, label: u.name }))];
  const filterMemberOptions = [{ value: '', label: 'All Members' }, ...members.map((u) => ({ value: u.id, label: u.name }))];

  const openCreate = () => {
    setEditTask(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (task, e) => {
    e.stopPropagation();
    setEditTask(task);
    setForm({
      title:       task.title,
      description: task.description || '',
      assignedTo:  task.assignedTo  || '',
      dueDate:     task.dueDate     || '',
      priority:    task.priority,
      status:      task.status,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError('Task title is required.'); return; }
    setSaving(true);
    setFormError('');
    const payload = { ...form, assignedTo: form.assignedTo || null, dueDate: form.dueDate || null };
    const result  = editTask ? await updateTask(editTask.id, payload) : await createTask(payload);
    setSaving(false);
    if (!result.success) { setFormError(result.error); return; }
    setModalOpen(false);
  };

  const handleDelete = async (taskId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this task and all its notes?')) return;
    await deleteTask(taskId);
  };

  const upd = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'DM Sans, sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header title="All Tasks" subtitle={`${tasks.length} total task${tasks.length !== 1 ? 's' : ''}`} />

        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>

          {/* ── Toolbar ──────────────────────────────────── */}
          <Card style={{ padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
              {/* Search */}
              <div style={{ flex: '1 1 220px', position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks…"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px 10px 36px', borderRadius: 12, border: `1.5px solid ${T.border}`, background: '#faf9ff', fontSize: 14, color: T.textPrimary, outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
                />
              </div>

              <Select value={filterStatus}   onChange={(e) => setFilterStatus(e.target.value)}   options={STATUS_OPTIONS}       style={{ flex: '0 0 160px' }} />
              <Select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} options={PRIORITY_OPTIONS}     style={{ flex: '0 0 160px' }} />
              <Select value={filterUser}     onChange={(e) => setFilterUser(e.target.value)}     options={filterMemberOptions}  style={{ flex: '0 0 180px' }} />

              <Button onClick={openCreate} style={{ flexShrink: 0 }}>
                <Plus size={16} /> New Task
              </Button>
            </div>
          </Card>

          {/* ── Tasks Grid ───────────────────────────────── */}
          {loadingTasks ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><Spinner size={32} /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={ClipboardList} message="No tasks found" sub={search || filterStatus || filterPriority || filterUser ? 'Try clearing your filters.' : 'Click "New Task" to create the first one.'} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {filtered.map((task) => (
                <div key={task.id} style={{ position: 'relative' }}>
                  <TaskCard task={task} onClick={() => navigate(`/tasks/${task.id}`)} />
                  {/* Edit/Delete overlay */}
                  <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6, opacity: 0, transition: 'opacity 0.15s' }} className="task-actions">
                    <button onClick={(e) => openEdit(task, e)} style={{ background: T.primaryLight, border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: T.primary, fontWeight: 600 }}>Edit</button>
                    <button onClick={(e) => handleDelete(task.id, e)} style={{ background: T.dangerLight, border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: T.danger, fontWeight: 600 }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ── Create / Edit Modal ──────────────────────── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTask ? 'Edit Task' : 'Create New Task'} width={560}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Input label="Task Title" value={form.title} onChange={upd('title')} placeholder="e.g. Design Q2 report cover" required />
          <Textarea label="Description" value={form.description} onChange={upd('description')} placeholder="What needs to be done?" rows={3} />

          <FormGrid cols={2}>
            <Select
              label="Assign To"
              value={form.assignedTo}
              onChange={upd('assignedTo')}
              options={memberOptions}
            />
            <Input label="Due Date" type="date" value={form.dueDate} onChange={upd('dueDate')} />
          </FormGrid>

          <FormGrid cols={2}>
            <Select
              label="Priority"
              value={form.priority}
              onChange={upd('priority')}
              options={[{ value: 'high', label: 'High 🔴' }, { value: 'medium', label: 'Medium 🟡' }, { value: 'low', label: 'Low 🟢' }]}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={upd('status')}
              options={[
                { value: 'new', label: 'New' },
                { value: 'pending', label: 'Pending' },
                { value: 'completed', label: 'Completed' },
              ]}
            />
          </FormGrid>

          {formError && <Alert type="danger">{formError}</Alert>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editTask ? 'Update Task' : 'Create Task'}</Button>
          </div>
        </form>
      </Modal>

      <style>{`.task-actions { opacity: 0 !important; } div:hover > .task-actions { opacity: 1 !important; }`}</style>
    </div>
  );
}
