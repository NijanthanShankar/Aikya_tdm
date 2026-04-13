import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import { api } from '../utils/api';
import { T } from '../utils/theme';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import {
  Button, Card, StatusBadge, PriorityBadge, AvatarCircle, NoteItem,
  FileAttachment, Modal, Input, Textarea, Select, FormGrid, Alert,
  EmptyState, Spinner, SectionTitle,
} from '../components/ui';
import {
  ArrowLeft, Plus, Paperclip, Send, Pencil, Trash2, CheckCircle2,
  MessageSquare, Calendar, User, Tag,
} from 'lucide-react';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, users } = useAuth();
  const { getTaskById, updateTask, deleteTask, addNote, deleteNote } = useTask();
  const isManager = currentUser?.role === 'admin';

  // Task state
  const [task,       setTask]      = useState(null);
  const [taskError,  setTaskError] = useState('');
  const [loadingTask, setLoadingTask] = useState(true);

  // Notes state
  const [notes,        setNotes]        = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Note composer
  const [noteText,     setNoteText]     = useState('');
  const [pendingFiles, setPendingFiles] = useState([]); // { file, previewUrl, uploading, uploaded }
  const [submitting,   setSubmitting]   = useState(false);
  const [noteError,    setNoteError]    = useState('');
  const fileInputRef = useRef(null);

  // Edit task modal
  const [editOpen,    setEditOpen]    = useState(false);
  const [editForm,    setEditForm]    = useState({});
  const [editSaving,  setEditSaving]  = useState(false);
  const [editError,   setEditError]   = useState('');

  // ── Load task ───────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setLoadingTask(true);
    api.tasks.get(id)
      .then(({ task }) => setTask(task))
      .catch((err) => setTaskError(err.message))
      .finally(() => setLoadingTask(false));
  }, [id]);

  // ── Load notes ──────────────────────────────────────────────
  const loadNotes = async () => {
    if (!id) return;
    setLoadingNotes(true);
    try {
      const { notes } = await api.notes.list(id);
      setNotes(notes);
    } catch {}
    finally { setLoadingNotes(false); }
  };

  useEffect(() => { if (!loadingTask && task) loadNotes(); }, [loadingTask, task]);

  // ── Member status update ──────────────────────────────────
  const handleStatusChange = async (newStatus) => {
    const result = await updateTask(id, { status: newStatus });
    if (result.success) setTask(result.task);
  };

  // ── File picker ─────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newEntries = files.map((f) => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      uploading: false,
      uploaded:  null, // { url, name, type, size }
    }));
    setPendingFiles((prev) => [...prev, ...newEntries]);
    e.target.value = ''; // reset input
  };

  const removeFile = (fileId) => {
    setPendingFiles((prev) => {
      const entry = prev.find((f) => f.id === fileId);
      if (entry?.previewUrl) URL.revokeObjectURL(entry.previewUrl);
      return prev.filter((f) => f.id !== fileId);
    });
  };

  // ── Submit note ─────────────────────────────────────────────
  const handleSubmitNote = async () => {
    const text = noteText.trim();
    if (!text && pendingFiles.length === 0) { setNoteError('Please add some text or attach a file.'); return; }
    setSubmitting(true);
    setNoteError('');

    // Upload all pending files
    const attachments = [];
    const updated = [...pendingFiles];

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].uploaded) {
        attachments.push(updated[i].uploaded);
        continue;
      }
      updated[i] = { ...updated[i], uploading: true };
      setPendingFiles([...updated]);
      try {
        const uploaded = await api.upload(updated[i].file);
        updated[i] = { ...updated[i], uploading: false, uploaded };
        attachments.push(uploaded);
      } catch (err) {
        updated[i] = { ...updated[i], uploading: false };
        setNoteError(`Upload failed for "${updated[i].file.name}": ${err.message}`);
        setPendingFiles([...updated]);
        setSubmitting(false);
        return;
      }
      setPendingFiles([...updated]);
    }

    // Submit note
    const result = await addNote(id, text, attachments);
    setSubmitting(false);

    if (result.success) {
      setNotes((prev) => [...prev, result.note]);
      setTask((prev) => ({ ...prev, notesCount: (prev?.notesCount || 0) + 1 }));
      setNoteText('');
      setPendingFiles([]);
    } else {
      setNoteError(result.error);
    }
  };

  // ── Delete note ─────────────────────────────────────────────
  const handleDeleteNote = async (noteId) => {
    if (!confirm('Delete this note?')) return;
    const result = await deleteNote(noteId, id);
    if (result.success) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setTask((prev) => ({ ...prev, notesCount: Math.max(0, (prev?.notesCount || 1) - 1) }));
    }
  };

  // ── Open edit modal ─────────────────────────────────────────
  const openEdit = () => {
    setEditForm({
      title:       task.title,
      description: task.description || '',
      assignedTo:  task.assignedTo  || '',
      dueDate:     task.dueDate     || '',
      priority:    task.priority,
      status:      task.status,
    });
    setEditError('');
    setEditOpen(true);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) { setEditError('Title is required.'); return; }
    setEditSaving(true);
    setEditError('');
    const payload = { ...editForm, assignedTo: editForm.assignedTo || null, dueDate: editForm.dueDate || null };
    const result = await updateTask(id, payload);
    setEditSaving(false);
    if (!result.success) { setEditError(result.error); return; }
    setTask(result.task);
    setEditOpen(false);
  };

  // ── Delete task ─────────────────────────────────────────────
  const handleDeleteTask = async () => {
    if (!confirm('Delete this task and all its notes permanently?')) return;
    const result = await deleteTask(id);
    if (result.success) navigate(isManager ? '/tasks' : '/my-tasks');
  };

  const members = users.filter((u) => u.role === 'member');
  const memberOptions = [{ value: '', label: 'Unassigned' }, ...members.map((u) => ({ value: u.id, label: u.name }))];

  // ── Helpers ─────────────────────────────────────────────────
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const isOverdue = task?.dueDate && new Date(task.dueDate) < new Date() && task?.status !== 'completed';

  // ── Render ───────────────────────────────────────────────────
  if (loadingTask) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: T.bg }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner size={36} />
        </div>
      </div>
    );
  }

  if (taskError || !task) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: T.bg }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontSize: 48 }}>😕</div>
          <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, color: T.textPrimary }}>Task not found</h2>
          <p style={{ color: T.textSecondary }}>{taskError || 'This task doesn\'t exist or you don\'t have access.'}</p>
          <Button onClick={() => navigate(-1)}><ArrowLeft size={16} /> Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'DM Sans, sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header title="Task Detail" subtitle={`${isManager ? 'Manager view' : 'Team member view'}`} />

        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {/* ── Back nav ───────────────────────────────── */}
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: T.textSecondary, fontSize: 13, fontWeight: 600, marginBottom: 20, padding: '6px 12px', borderRadius: 10, transition: 'background 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = T.primaryLight; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >
            <ArrowLeft size={15} /> Back
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

            {/* ── Left Column: Notes Timeline ───────────── */}
            <div>
              {/* Task title & badges */}
              <Card style={{ padding: '24px 28px', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 22, color: T.textPrimary, margin: '0 0 10px' }}>{task.title}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                      {isOverdue && <span style={{ fontSize: 12, color: T.danger, fontWeight: 700 }}>⚠️ Overdue</span>}
                    </div>
                  </div>
                  {isManager && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <Button variant="secondary" size="sm" onClick={openEdit}><Pencil size={13} /> Edit</Button>
                      <Button variant="danger"    size="sm" onClick={handleDeleteTask}><Trash2 size={13} /> Delete</Button>
                    </div>
                  )}
                </div>

                {task.description && (
                  <p style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{task.description}</p>
                )}

                {/* Member: Update Status */}
                {!isManager && (
                  <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Update Status</div>
                    <Select
                      value={task.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      options={[
                        { value: 'new', label: 'New' },
                        { value: 'pending', label: 'Pending' },
                        { value: 'in_progress', label: 'In Progress' },
                        { value: 'need_clarification', label: 'Need Clarification from Member/Manager' },
                        { value: 'pending_requirements', label: 'Pending Requirements / Prior Details' },
                        { value: 'paused', label: 'Paused' },
                        { value: 'completed', label: 'Completed' }
                      ]}
                      style={{ maxWidth: 300 }}
                    />
                  </div>
                )}
              </Card>

              {/* Notes timeline */}
              <Card style={{ padding: '24px 28px' }}>
                <SectionTitle>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MessageSquare size={18} color={T.primary} /> Notes & Updates ({notes.length})</span>
                </SectionTitle>

                {loadingNotes ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}><Spinner /></div>
                ) : notes.length === 0 ? (
                  <EmptyState icon={MessageSquare} message="No notes yet" sub="Be the first to add an update below." />
                ) : (
                  <div style={{ paddingTop: 8 }}>
                    {notes.map((note) => (
                      <NoteItem
                        key={note.id}
                        note={note}
                        canDelete={isManager || note.userId === currentUser?.id}
                        onDelete={handleDeleteNote}
                      />
                    ))}
                  </div>
                )}

                {/* ── Note Composer ─────────────────────── */}
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1.5px solid ${T.border}` }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <AvatarCircle name={currentUser?.name} avatar={currentUser?.avatar} color={T.primary} avatarUrl={currentUser?.avatarUrl} size={36} />
                    <div style={{ flex: 1 }}>
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add a note or update… (Shift+Enter for new line)"
                        rows={3}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitNote(); } }}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          padding: '12px 14px', borderRadius: 14,
                          border: `1.5px solid ${T.border}`, background: '#faf9ff',
                          fontSize: 14, color: T.textPrimary, outline: 'none',
                          fontFamily: 'DM Sans, sans-serif', resize: 'vertical',
                          transition: 'border-color 0.15s',
                        }}
                        onFocus={(e) => { e.target.style.borderColor = T.primaryMid; }}
                        onBlur={(e)  => { e.target.style.borderColor = T.border; }}
                      />

                      {/* Pending file previews */}
                      {pendingFiles.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                          {pendingFiles.map((pf) => (
                            <div key={pf.id} style={{ position: 'relative' }}>
                              {pf.previewUrl ? (
                                <div style={{ position: 'relative', width: 64, height: 64 }}>
                                  <img src={pf.previewUrl} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10, border: `1.5px solid ${T.border}` }} />
                                  {pf.uploading && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)', borderRadius: 10 }}><Spinner size={20} /></div>}
                                  <button onClick={() => removeFile(pf.id)} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: T.danger, border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                                </div>
                              ) : (
                                <FileAttachment attachment={{ name: pf.file.name, url: '#', type: pf.file.type }} onRemove={() => removeFile(pf.id)} />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {noteError && <Alert type="danger" style={{ marginTop: 10 }}>{noteError}</Alert>}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                        <div>
                          <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" style={{ display: 'none' }} onChange={handleFileSelect} />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.primaryLight, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: '7px 14px', cursor: 'pointer', color: T.primary, fontSize: 13, fontWeight: 600 }}
                          >
                            <Paperclip size={14} /> Attach Files
                          </button>
                        </div>
                        <Button onClick={handleSubmitNote} disabled={submitting || (!noteText.trim() && pendingFiles.length === 0)}>
                          {submitting ? <Spinner size={14} color="#fff" /> : <Send size={14} />}
                          {submitting ? 'Sending…' : 'Add Note'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* ── Right Column: Task Info ─────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Assignee */}
              <Card style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Assigned To</div>
                {task.assigneeName ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AvatarCircle name={task.assigneeName} avatar={task.assigneeAvatar} color={task.assigneeColor} size={40} />
                    <div>
                      <div style={{ fontWeight: 700, color: T.textPrimary, fontSize: 14 }}>{task.assigneeName}</div>
                      <div style={{ fontSize: 12, color: T.textMuted }}>Team Member</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: T.textMuted, fontSize: 13 }}>Not assigned</div>
                )}
              </Card>

              {/* Details */}
              <Card style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Task Details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { icon: Calendar, label: 'Due Date',   value: task.dueDate ? <span style={{ color: isOverdue ? T.danger : T.textPrimary }}>{formatDate(task.dueDate)}{isOverdue ? ' ⚠️' : ''}</span> : '—' },
                    { icon: User,     label: 'Created By', value: task.creatorName || '—' },
                    { icon: Calendar, label: 'Created',    value: formatDate(task.createdAt) },
                    { icon: Calendar, label: 'Updated',    value: formatDate(task.updatedAt) },
                    { icon: Tag,      label: 'Notes',      value: `${task.notesCount || notes.length} note${(task.notesCount || notes.length) !== 1 ? 's' : ''}` },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: T.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={13} color={T.primary} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: T.textMuted }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* ── Edit Task Modal ─────────────────────────── */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Task" width={560}>
        <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Input label="Task Title" value={editForm.title || ''} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} required />
          <Textarea label="Description" value={editForm.description || ''} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
          <FormGrid cols={2}>
            <Select label="Assign To" value={editForm.assignedTo || ''} onChange={(e) => setEditForm((p) => ({ ...p, assignedTo: e.target.value }))} options={memberOptions} />
            <Input label="Due Date" type="date" value={editForm.dueDate || ''} onChange={(e) => setEditForm((p) => ({ ...p, dueDate: e.target.value }))} />
          </FormGrid>
          <FormGrid cols={2}>
            <Select label="Priority" value={editForm.priority || 'medium'} onChange={(e) => setEditForm((p) => ({ ...p, priority: e.target.value }))} options={[{ value: 'high', label: 'High 🔴' }, { value: 'medium', label: 'Medium 🟡' }, { value: 'low', label: 'Low 🟢' }]} />
            <Select label="Status" value={editForm.status || 'new'} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))} options={[
              { value: 'new',                  label: 'New' },
              { value: 'pending',              label: 'Pending' },
              { value: 'in_progress',          label: 'In Progress' },
              { value: 'need_clarification',   label: 'Need Clarification' },
              { value: 'pending_requirements', label: 'Pending Requirements' },
              { value: 'paused',               label: 'Paused' },
              { value: 'completed',            label: 'Completed' },
            ]} />
          </FormGrid>
          {editError && <Alert type="danger">{editError}</Alert>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={editSaving}>{editSaving ? 'Saving…' : 'Update Task'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
