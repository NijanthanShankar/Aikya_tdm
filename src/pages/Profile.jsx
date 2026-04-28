import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { T, ROLE_LABELS, ROLE_COLORS } from '../utils/theme';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import {
  Button, Card, Input, Textarea, Alert, FormGrid, AvatarCircle,
  SectionTitle, Badge, Spinner,
} from '../components/ui';
import { User, Mail, Phone, Building2, Lock, Camera, CheckCircle2, Upload, Trash2, ImagePlus } from 'lucide-react';

export default function Profile() {
  const { currentUser, updateProfile, changePassword } = useAuth();
  const roleColor = ROLE_COLORS[currentUser?.role] || T.primary;
  const fileInputRef = useRef(null);

  // Profile form
  const [profile, setProfile] = useState({
    name:       currentUser?.name       || '',
    email:      currentUser?.email      || '',
    phone:      currentUser?.phone      || '',
    department: currentUser?.department || '',
    avatarUrl:  currentUser?.avatarUrl  || '',
  });
  const [savingProfile,   setSavingProfile]   = useState(false);
  const [profileSuccess,  setProfileSuccess]  = useState(false);
  const [profileError,    setProfileError]    = useState('');
  const [uploading,       setUploading]       = useState(false);
  const [uploadProgress,  setUploadProgress]  = useState('');

  // Password form
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPass,  setSavingPass]   = useState(false);
  const [passSuccess, setPassSuccess]  = useState(false);
  const [passError,   setPassError]    = useState('');
  const [showPass,    setShowPass]     = useState(false);

  const profileUpd = (k) => (e) => setProfile((p) => ({ ...p, [k]: e.target.value }));
  const passUpd    = (k) => (e) => setPasswords((p) => ({ ...p, [k]: e.target.value }));

  // ── Handle avatar upload ─────────────────────────────────────
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setProfileError('Please select an image file (JPG, PNG, GIF, or WebP).');
      return;
    }

    // Validate file size (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setProfileError('Image must be smaller than 5 MB.');
      return;
    }

    setUploading(true);
    setProfileError('');
    setUploadProgress('Uploading photo...');

    try {
      const result = await api.upload(file);
      setProfile((p) => ({ ...p, avatarUrl: result.url }));
      setUploadProgress('Photo uploaded! Click "Save Changes" to apply.');
      setTimeout(() => setUploadProgress(''), 4000);
    } catch (err) {
      setProfileError('Upload failed: ' + err.message);
    }
    setUploading(false);

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAvatar = () => {
    setProfile((p) => ({ ...p, avatarUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Save profile ─────────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile.name.trim() || !profile.email.trim()) { setProfileError('Name and email are required.'); return; }
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess(false);
    const result = await updateProfile(profile);
    setSavingProfile(false);
    if (result.success) {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } else {
      setProfileError(result.error);
    }
  };

  // ── Change password ──────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setPassError('All fields are required.'); return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPassError('New passwords do not match.'); return;
    }
    if (passwords.newPassword.length < 6) {
      setPassError('Password must be at least 6 characters.'); return;
    }
    setSavingPass(true);
    setPassError('');
    setPassSuccess(false);
    const result = await changePassword(passwords.currentPassword, passwords.newPassword);
    setSavingPass(false);
    if (result.success) {
      setPassSuccess(true);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPassSuccess(false), 4000);
    } else {
      setPassError(result.error);
    }
  };

  // Recomputed avatar for preview
  const words  = profile.name.trim().split(' ');
  const avatar = (words[0]?.[0] || '?').toUpperCase() + (words[1]?.[0] || '').toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'DM Sans, sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header title="My Profile" subtitle="Manage your account information and security" />

        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>

            {/* ── Left: Avatar & Info Card ────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Avatar */}
              <Card style={{ padding: '28px 24px', textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                  {/* Avatar with upload overlay */}
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={profile.name} style={{ width: 100, height: 100, borderRadius: 30, objectFit: 'cover', boxShadow: `0 8px 24px ${roleColor}30`, border: `3px solid ${roleColor}25` }} />
                    ) : (
                      <div style={{ width: 100, height: 100, borderRadius: 30, background: `linear-gradient(135deg, ${roleColor}, ${roleColor}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Outfit', fontWeight: 800, fontSize: 36, boxShadow: `0 8px 24px ${roleColor}30`, border: `3px solid ${roleColor}25` }}>
                        {avatar}
                      </div>
                    )}
                    {/* Upload overlay button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      style={{
                        position: 'absolute', bottom: -4, right: -4,
                        width: 34, height: 34, borderRadius: 12,
                        background: T.primary, border: `3px solid ${T.cardBg}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: uploading ? 'wait' : 'pointer',
                        boxShadow: '0 4px 12px rgba(124,58,237,0.35)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(124,58,237,0.5)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(124,58,237,0.35)'; }}
                      title="Upload profile photo"
                    >
                      {uploading ? (
                        <Spinner size={14} color="#fff" />
                      ) : (
                        <Camera size={15} color="#fff" strokeWidth={2.5} />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleAvatarUpload}
                      style={{ display: 'none' }}
                    />
                  </div>

                  {/* Upload hint */}
                  {uploading && (
                    <div style={{ fontSize: 12, color: T.primary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Spinner size={12} color={T.primary} /> Uploading...
                    </div>
                  )}
                  {uploadProgress && !uploading && (
                    <div style={{ fontSize: 11, color: T.success, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={12} /> {uploadProgress}
                    </div>
                  )}

                  <div>
                    <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 18, color: T.textPrimary }}>{profile.name || 'Your Name'}</div>
                    <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>{profile.email}</div>
                    <div style={{ marginTop: 8 }}><Badge color={roleColor}>{ROLE_LABELS[currentUser?.role]}</Badge></div>
                  </div>

                  {profile.department && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.textSecondary }}>
                      <Building2 size={14} /> {profile.department}
                    </div>
                  )}
                  {profile.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.textSecondary }}>
                      <Phone size={14} /> {profile.phone}
                    </div>
                  )}

                  {/* Quick actions for avatar */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      style={{
                        padding: '6px 14px', borderRadius: 10, border: `1.5px solid ${T.primary}25`,
                        background: T.primaryLight, color: T.primary, fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                        fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = `${T.primary}20`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = T.primaryLight; }}
                    >
                      <ImagePlus size={13} /> {profile.avatarUrl ? 'Change' : 'Upload'} Photo
                    </button>
                    {profile.avatarUrl && (
                      <button
                        onClick={handleRemoveAvatar}
                        style={{
                          padding: '6px 14px', borderRadius: 10, border: `1.5px solid ${T.danger}25`,
                          background: T.dangerLight || '#fee2e2', color: T.danger, fontSize: 12, fontWeight: 700,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                          fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = `${T.danger}15`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = T.dangerLight || '#fee2e2'; }}
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: T.textMuted, margin: 0, textAlign: 'center', lineHeight: 1.4 }}>
                    JPG, PNG, GIF or WebP · Max 5 MB
                  </p>
                </div>
              </Card>

              {/* Account Info */}
              <Card style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Account Info</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { icon: User,      label: 'Role',       value: ROLE_LABELS[currentUser?.role] },
                    { icon: Mail,      label: 'Email',      value: currentUser?.email || '—' },
                    { icon: Building2, label: 'Department', value: currentUser?.department || 'Not set' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 8, background: T.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={12} color={T.primary} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* ── Right: Edit Forms ───────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Profile form */}
              <Card style={{ padding: '24px 28px' }}>
                <SectionTitle>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><User size={18} color={T.primary} /> Profile Information</span>
                </SectionTitle>

                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <FormGrid cols={2}>
                    <Input label="Full Name" value={profile.name} onChange={profileUpd('name')} required placeholder="Your full name" id="pf-name" />
                    <Input label="Email Address" type="email" value={profile.email} onChange={profileUpd('email')} required placeholder="you@company.com" id="pf-email" />
                  </FormGrid>
                  <FormGrid cols={2}>
                    <Input label="Phone Number" value={profile.phone} onChange={profileUpd('phone')} placeholder="+91 9876543210" id="pf-phone" />
                    <Input label="Department" value={profile.department} onChange={profileUpd('department')} placeholder="e.g. Design" id="pf-dept" />
                  </FormGrid>

                  {profileError   && <Alert type="danger">{profileError}</Alert>}
                  {profileSuccess && <Alert type="success"><CheckCircle2 size={14} style={{ display: 'inline', marginRight: 6 }} />Profile updated successfully!</Alert>}

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button type="submit" disabled={savingProfile}>
                      {savingProfile ? <><Spinner size={14} color="#fff" /> Saving…</> : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Password form */}
              <Card style={{ padding: '24px 28px' }}>
                <SectionTitle>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Lock size={18} color={T.primary} /> Change Password</span>
                </SectionTitle>

                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <Input
                    label="Current Password"
                    type={showPass ? 'text' : 'password'}
                    value={passwords.currentPassword}
                    onChange={passUpd('currentPassword')}
                    placeholder="Your current password"
                    required
                    id="cp-current"
                  />
                  <FormGrid cols={2}>
                    <Input
                      label="New Password"
                      type={showPass ? 'text' : 'password'}
                      value={passwords.newPassword}
                      onChange={passUpd('newPassword')}
                      placeholder="Min 6 characters"
                      required
                      id="cp-new"
                    />
                    <Input
                      label="Confirm New Password"
                      type={showPass ? 'text' : 'password'}
                      value={passwords.confirmPassword}
                      onChange={passUpd('confirmPassword')}
                      placeholder="Repeat new password"
                      required
                      id="cp-confirm"
                    />
                  </FormGrid>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: T.textSecondary }}>
                    <input type="checkbox" checked={showPass} onChange={(e) => setShowPass(e.target.checked)} style={{ cursor: 'pointer' }} />
                    Show passwords
                  </label>

                  {passError   && <Alert type="danger">{passError}</Alert>}
                  {passSuccess && <Alert type="success"><CheckCircle2 size={14} style={{ display: 'inline', marginRight: 6 }} />Password changed successfully!</Alert>}

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button type="submit" disabled={savingPass} variant="secondary">
                      {savingPass ? <><Spinner size={14} color={T.primary} /> Changing…</> : <><Lock size={14} /> Change Password</>}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
