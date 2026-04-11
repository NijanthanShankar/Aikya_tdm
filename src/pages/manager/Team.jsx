import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTask } from '../../context/TaskContext';
import { T, ROLE_LABELS, ROLE_COLORS } from '../../utils/theme';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';
import {
  Button, Card, SectionTitle, Modal, Input, Select,
  Alert, FormGrid, AvatarCircle, Badge, EmptyState, Spinner,
} from '../../components/ui';
import { Plus, Users, Trash2, Pencil, CheckCircle2, Clock, Loader2 } from 'lucide-react';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'member', department: '', phone: '' };

export default function Team() {
  const { users, createUser, updateUser, deleteUser } = useAuth();
  const { tasks } = useTask();

  const [modalOpen, setModalOpen]   = useState(false);
  const [editUser,  setEditUser]    = useState(null);
  const [form,      setForm]        = useState(EMPTY_FORM);
  const [saving,    setSaving]      = useState(false);
  const [formError, setFormError]   = useState('');

  const members = users; // show all including admins

  const openCreate = () => {
    setEditUser(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role, department: user.department || '', phone: user.phone || '' });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) { setFormError('Name and email are required.'); return; }
    if (!editUser && !form.password) { setFormError('Password is required for new users.'); return; }
    setSaving(true);
    setFormError('');
    const payload = { ...form };
    if (!payload.password) delete payload.password;
    const result = editUser ? await updateUser(editUser.id, payload) : await createUser(payload);
    setSaving(false);
    if (!result.success) { setFormError(result.error); return; }
    setModalOpen(false);
  };

  const handleDelete = async (user) => {
    if (!confirm(`Remove ${user.name} from the team? Their tasks will remain.`)) return;
    const result = await deleteUser(user.id);
    if (!result.success) alert(result.error);
  };

  const upd = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const getUserTaskStats = (userId) => {
    const ut = tasks.filter((t) => t.assignedTo === userId);
    return {
      total:      ut.length,
      completed:  ut.filter((t) => t.status === 'completed').length,
      inProgress: ut.filter((t) => t.status === 'in_progress').length,
      pending:    ut.filter((t) => t.status === 'pending').length,
    };
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'DM Sans, sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header title="Team Management" subtitle={`${users.filter(u => u.role === 'member').length} team member${users.filter(u => u.role === 'member').length !== 1 ? 's' : ''}`} />

        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          <Card style={{ padding: '20px 24px' }}>
            <SectionTitle action={<Button onClick={openCreate}><Plus size={16} /> Add Member</Button>}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Users size={18} color={T.primary} /> All Team Members</span>
            </SectionTitle>

            {members.length === 0 ? (
              <EmptyState icon={Users} message="No team members yet" sub="Click 'Add Member' to create your first team account." />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {members.map((user) => {
                  const stats     = getUserTaskStats(user.id);
                  const roleColor = ROLE_COLORS[user.role] || T.primary;
                  return (
                    <div
                      key={user.id}
                      style={{
                        background: T.bg, borderRadius: 18, border: `1.5px solid ${T.border}`,
                        padding: '18px 20px',
                      }}
                    >
                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                        <AvatarCircle name={user.name} avatar={user.avatar} color={roleColor} avatarUrl={user.avatarUrl} size={46} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                          <div style={{ marginTop: 4 }}>
                            <Badge color={roleColor}>{ROLE_LABELS[user.role]}</Badge>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openEdit(user)} style={{ background: T.primaryLight, border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(user)} style={{ background: T.dangerLight, border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: T.danger, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Details */}
                      {(user.department || user.phone) && (
                        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                          {user.department && <span style={{ fontSize: 12, color: T.textSecondary }}>🏢 {user.department}</span>}
                          {user.phone && <span style={{ fontSize: 12, color: T.textSecondary }}>📞 {user.phone}</span>}
                        </div>
                      )}

                      {/* Task stats */}
                      {user.role === 'member' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                          {[
                            { label: 'Pending',     value: stats.pending,    color: T.statusPending,    icon: Clock         },
                            { label: 'In Progress', value: stats.inProgress, color: T.statusInProgress, icon: Loader2       },
                            { label: 'Done',        value: stats.completed,  color: T.statusCompleted,  icon: CheckCircle2  },
                          ].map(({ label, value, color, icon: Icon }) => (
                            <div key={label} style={{ textAlign: 'center', padding: '8px 6px', borderRadius: 10, background: `${color}12` }}>
                              <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'Outfit, sans-serif' }}>{value}</div>
                              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{label}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </main>
      </div>

      {/* ── Create / Edit Modal ───────────────────────── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editUser ? `Edit: ${editUser.name}` : 'Add Team Member'} width={520}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <FormGrid cols={2}>
            <Input label="Full Name"  value={form.name}  onChange={upd('name')}  placeholder="e.g. Priya Sharma"      required id="tm-name" />
            <Input label="Email"      value={form.email} onChange={upd('email')} placeholder="priya@company.com"      required type="email" id="tm-email" />
          </FormGrid>
          <FormGrid cols={2}>
            <Input label="Department" value={form.department} onChange={upd('department')} placeholder="e.g. Design"  id="tm-dept" />
            <Input label="Phone"      value={form.phone}      onChange={upd('phone')}      placeholder="+91 9876543210" id="tm-phone" />
          </FormGrid>
          <FormGrid cols={2}>
            <Select
              label="Role"
              value={form.role}
              onChange={upd('role')}
              options={[{ value: 'member', label: 'Team Member' }, { value: 'admin', label: 'Manager' }]}
              id="tm-role"
            />
            <Input
              label={editUser ? 'New Password (leave blank to keep)' : 'Password'}
              type="password"
              value={form.password}
              onChange={upd('password')}
              placeholder={editUser ? '••••••' : 'Min 6 characters'}
              required={!editUser}
              id="tm-password"
            />
          </FormGrid>

          {formError && <Alert type="danger">{formError}</Alert>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editUser ? 'Update Member' : 'Create Member'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
