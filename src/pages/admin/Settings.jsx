import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/layout/Layout';
import { Card, Button, Input, Select, Badge, Modal, Alert, SectionTitle } from '../../components/ui';
import { T, ROLE_LABELS, ROLE_COLORS } from '../../utils/theme';
import { Plus, Edit2, Trash2, Shield, Eye, EyeOff } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'webmanager',    label: 'Web Manager' },
  { value: 'telecaller',    label: 'Telecaller' },
  { value: 'videoeditor',   label: 'Video Editor' },
  { value: 'socialmanager', label: 'Social Media Manager' },
  { value: 'admin',         label: 'Admin' },
];

function UserForm({ initial = {}, onSave, onCancel, isEdit = false }) {
  const [name,     setName]     = useState(initial.name  || '');
  const [email,    setEmail]    = useState(initial.email || '');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState(initial.role  || 'webmanager');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || (!isEdit && !password)) {
      setError('Please fill all required fields.'); return;
    }
    if (password && password.length < 6) {
      setError('Password must be at least 6 characters.'); return;
    }
    const payload = { name: name.trim(), email: email.trim(), role };
    if (password) payload.password = password;
    setLoading(true);
    setError('');
    const result = await onSave(payload);
    setLoading(false);
    if (result && !result.success) setError(result.error);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && <Alert type="danger">{error}</Alert>}
      <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Patel" required />
      <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="priya@company.com" required />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary }}>
          Password{!isEdit && <span style={{ color: T.danger }}> *</span>}
          {isEdit && <span style={{ color: T.textMuted, fontWeight: 400 }}> (leave blank to keep current)</span>}
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isEdit ? 'New password (optional)' : 'Min 6 characters'}
            required={!isEdit}
            style={{
              width: '100%', padding: '10px 44px 10px 14px',
              borderRadius: 12, border: `1.5px solid ${T.border}`,
              background: '#faf9ff', fontSize: 14, color: T.textPrimary,
              outline: 'none', fontFamily: 'DM Sans, sans-serif',
            }}
          />
          <button type="button" onClick={() => setShowPass(p => !p)} style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted,
            display: 'flex', alignItems: 'center',
          }}>
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)} options={ROLE_OPTIONS} required />
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
        <Button variant="ghost" onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Account'}</Button>
      </div>
    </form>
  );
}

export default function AdminSettings() {
  const { users, createUser, updateUser, deleteUser, currentUser } = useAuth();
  const [createOpen,     setCreateOpen]     = useState(false);
  const [editUser,       setEditUser]       = useState(null);
  const [deleteConfirm,  setDeleteConfirm]  = useState(null);
  const [successMsg,     setSuccessMsg]     = useState('');
  const [deleteLoading,  setDeleteLoading]  = useState(false);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleCreate = async (payload) => {
    const result = await createUser(payload);
    if (result.success) { setCreateOpen(false); showSuccess(`Account created for ${payload.name}.`); }
    return result;
  };

  const handleEdit = async (payload) => {
    const result = await updateUser(editUser.id, payload);
    if (result.success) { setEditUser(null); showSuccess('Account updated successfully.'); }
    return result;
  };

  const handleDelete = async (id) => {
    setDeleteLoading(true);
    const result = await deleteUser(id);
    setDeleteLoading(false);
    if (result.success) { setDeleteConfirm(null); showSuccess('Account deleted.'); }
  };

  return (
    <Layout title="Team & Settings" subtitle="Manage team accounts and roles">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {successMsg && <Alert type="success">{successMsg}</Alert>}

        <Card>
          <SectionTitle action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={14} /> Add Team Member
            </Button>
          }>
            Team Members ({users.length})
          </SectionTitle>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {users.map((u) => {
              const color = ROLE_COLORS[u.role] || T.primary;
              const isMe  = u.id === currentUser?.id;
              return (
                <div key={u.id} style={{
                  background: T.bg, borderRadius: 16, padding: '16px 18px',
                  border: `1.5px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14, background: color, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: 'Outfit, sans-serif',
                    boxShadow: `0 4px 12px ${color}40`,
                  }}>{u.avatar}</div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary }}>{u.name}</span>
                      {isMe && <Badge color={T.info}>You</Badge>}
                    </div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                    <div style={{ marginTop: 5 }}><Badge color={color}>{ROLE_LABELS[u.role]}</Badge></div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => setEditUser(u)} title="Edit" style={{
                      background: T.primaryLight, border: 'none', borderRadius: 8,
                      width: 30, height: 30, cursor: 'pointer', color: T.primary,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}><Edit2 size={13} /></button>
                    <button onClick={() => setDeleteConfirm(u)} title="Delete" style={{
                      background: T.dangerLight, border: 'none', borderRadius: 8,
                      width: 30, height: 30, cursor: 'pointer', color: T.danger,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}><Trash2 size={13} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card style={{ background: T.infoLight, border: `1.5px solid ${T.info}30` }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Shield size={18} color={T.info} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.info, marginBottom: 4 }}>Security Notice</div>
              <p style={{ fontSize: 13, color: T.info, lineHeight: 1.6 }}>
                Team members can only see and edit their own data. Only admins can create accounts, view all entries, and export reports.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Team Member">
        <UserForm onSave={handleCreate} onCancel={() => setCreateOpen(false)} />
      </Modal>

      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit Team Member">
        {editUser && <UserForm initial={editUser} onSave={handleEdit} onCancel={() => setEditUser(null)} isEdit />}
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Account" width={380}>
        {deleteConfirm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 14, color: T.textSecondary }}>
              Are you sure you want to delete the account for <strong>{deleteConfirm.name}</strong>? All their data entries will also be deleted. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleDelete(deleteConfirm.id)} disabled={deleteLoading}>
                {deleteLoading ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
