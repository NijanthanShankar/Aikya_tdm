import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { T, ROLE_COLORS } from '../../utils/theme';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';
import {
  Card, StatCard, SectionTitle, EmptyState, Spinner, Badge,
  Button, Modal, Input, Textarea, Select, Alert, AvatarCircle,
} from '../../components/ui';
import {
  CalendarOff, Clock, CheckCircle2, XCircle, Ban, Users,
  ThermometerSun, Calendar, Coffee, Home, Gift, HelpCircle,
  Filter, Briefcase, MessageSquare, Search,
} from 'lucide-react';

// ── Leave type config ─────────────────────────────────────────
const TYPE_CONFIG = {
  casual:       { label: 'Casual Leave',    icon: Coffee,          color: '#3b82f6', emoji: '🏖️' },
  sick:         { label: 'Sick Leave',       icon: ThermometerSun,  color: '#ef4444', emoji: '🤒' },
  earned:       { label: 'Earned Leave',     icon: Gift,            color: '#10b981', emoji: '🎁' },
  half_day:     { label: 'Half Day',         icon: Clock,           color: '#f59e0b', emoji: '⏳' },
  wfh:          { label: 'Work From Home',   icon: Home,            color: '#8b5cf6', emoji: '🏠' },
  compensatory: { label: 'Compensatory Off', icon: Calendar,        color: '#ec4899', emoji: '🔄' },
  other:        { label: 'Other Leave',      icon: HelpCircle,      color: '#64748b', emoji: '📋' },
};

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#f59e0b', bg: '#fef3c7', icon: Clock       },
  approved:  { label: 'Approved',  color: '#10b981', bg: '#d1fae5', icon: CheckCircle2 },
  rejected:  { label: 'Rejected',  color: '#ef4444', bg: '#fee2e2', icon: XCircle      },
  cancelled: { label: 'Cancelled', color: '#64748b', bg: '#f1f5f9', icon: Ban          },
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function LeaveAdmin() {
  const { users } = useAuth();
  const members = users.filter((u) => u.role === 'member');

  const [leaves,      setLeaves]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('pending'); // Default show pending
  const [userFilter,  setUserFilter]  = useState('all');

  // Review modal
  const [reviewLeave,   setReviewLeave]   = useState(null);
  const [reviewAction,  setReviewAction]  = useState(''); // 'approved' | 'rejected'
  const [adminNote,     setAdminNote]     = useState('');
  const [reviewing,     setReviewing]     = useState(false);
  const [reviewError,   setReviewError]   = useState('');

  useEffect(() => { loadLeaves(); }, []);

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const { leaves } = await api.leave.listAll();
      setLeaves(leaves || []);
    } catch {}
    setLoading(false);
  };

  const openReview = (leave, action) => {
    setReviewLeave(leave);
    setReviewAction(action);
    setAdminNote('');
    setReviewError('');
  };

  const handleReview = async () => {
    if (!reviewLeave || !reviewAction) return;
    setReviewing(true); setReviewError('');
    try {
      const { leave } = await api.leave.update(reviewLeave.id, {
        status: reviewAction,
        adminNote: adminNote.trim(),
      });
      setLeaves((prev) => prev.map((l) => l.id === reviewLeave.id ? leave : l));
      setReviewLeave(null);
    } catch (err) {
      setReviewError(err.message);
    }
    setReviewing(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this leave record? This action cannot be undone.')) return;
    try {
      await api.leave.remove(id);
      setLeaves((prev) => prev.filter((l) => l.id !== id));
    } catch {}
  };

  // Filter leaves
  const filtered = leaves.filter((l) => {
    if (filter !== 'all' && l.status !== filter) return false;
    if (userFilter !== 'all' && l.userId !== userFilter) return false;
    return true;
  });

  const pendingCount  = leaves.filter((l) => l.status === 'pending').length;
  const approvedCount = leaves.filter((l) => l.status === 'approved').length;
  const rejectedCount = leaves.filter((l) => l.status === 'rejected').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'DM Sans, sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header title="Leave Management" subtitle="Review and manage team leave requests" />

        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>

          {/* Pending banner */}
          {pendingCount > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '1.5px solid #fde047',
              borderRadius: 14, padding: '14px 18px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 22 }}>⏰</span>
              <div>
                <div style={{ fontWeight: 700, color: '#854d0e' }}>
                  {pendingCount} leave request{pendingCount !== 1 ? 's' : ''} awaiting your review
                </div>
                <div style={{ fontSize: 12, color: '#92400e' }}>Please review and respond promptly.</div>
              </div>
              <button
                onClick={() => setFilter('pending')}
                style={{ marginLeft: 'auto', padding: '6px 16px', borderRadius: 10, background: '#fff', border: '1.5px solid #fde047', cursor: 'pointer', fontWeight: 700, fontSize: 12, color: '#854d0e' }}
              >
                Review Now →
              </button>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
          ) : (
            <>
              {/* ── Stats ─────────────────────────────────── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                <StatCard label="Total Requests" value={leaves.length}   icon={CalendarOff}  color={T.primary} />
                <StatCard label="Pending"        value={pendingCount}    icon={Clock}        color={T.warning} />
                <StatCard label="Approved"       value={approvedCount}   icon={CheckCircle2} color={T.success} />
                <StatCard label="Rejected"       value={rejectedCount}   icon={XCircle}      color={T.danger} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

                {/* ── Left: Leave Requests ─────────────────── */}
                <Card style={{ padding: '20px 24px' }}>
                  <SectionTitle>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CalendarOff size={18} color={T.primary} /> All Leave Requests
                    </span>
                  </SectionTitle>

                  {/* Filter pills */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                    {[
                      { key: 'all',       label: 'All',       count: leaves.length   },
                      { key: 'pending',   label: '⏳ Pending',   count: pendingCount  },
                      { key: 'approved',  label: '✅ Approved',  count: approvedCount },
                      { key: 'rejected',  label: '❌ Rejected',  count: rejectedCount },
                    ].map(({ key, label, count }) => (
                      <button
                        key={key}
                        onClick={() => setFilter(key)}
                        style={{
                          padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
                          background: filter === key ? T.primary : T.primaryLight,
                          color: filter === key ? '#fff' : T.primary,
                          fontWeight: 600, fontSize: 12, fontFamily: 'DM Sans, sans-serif',
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}
                      >
                        {label}
                        <span style={{
                          background: filter === key ? 'rgba(255,255,255,0.25)' : `${T.primary}18`,
                          padding: '1px 7px', borderRadius: 99, fontSize: 11,
                        }}>{count}</span>
                      </button>
                    ))}
                  </div>

                  {filtered.length === 0 ? (
                    <EmptyState icon={CalendarOff} message="No leave requests found" sub="Requests from team members will appear here." />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {filtered.map((leave) => {
                        const tc = TYPE_CONFIG[leave.leaveType] || TYPE_CONFIG.other;
                        const sc = STATUS_CONFIG[leave.status]  || STATUS_CONFIG.pending;
                        const StatusIcon = sc.icon;
                        return (
                          <div key={leave.id} style={{
                            background: T.bg, borderRadius: 16, padding: '16px 18px',
                            border: `1.5px solid ${leave.status === 'pending' ? '#fde04780' : T.border}`,
                          }}>
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                              <AvatarCircle name={leave.userName} avatar={leave.userAvatar} color={ROLE_COLORS.member} size={36} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, color: T.textPrimary }}>
                                  {leave.userName}
                                  {leave.department && <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 8 }}>{leave.department}</span>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                  <span style={{ fontSize: 12, color: tc.color, fontWeight: 700 }}>{tc.emoji} {tc.label}</span>
                                  <span style={{ fontSize: 11, color: T.textMuted }}>·</span>
                                  <span style={{ fontSize: 12, color: T.textSecondary }}>
                                    {formatDate(leave.fromDate)}{leave.fromDate !== leave.toDate ? ` → ${formatDate(leave.toDate)}` : ''} · {leave.numDays}d
                                  </span>
                                </div>
                              </div>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
                                padding: '4px 12px', borderRadius: 99, background: sc.bg,
                                color: sc.color, fontSize: 11, fontWeight: 700,
                                border: `1px solid ${sc.color}30`,
                              }}>
                                <StatusIcon size={12} /> {sc.label}
                              </span>
                            </div>

                            {/* Reason */}
                            <div style={{ fontSize: 13, color: T.textSecondary, padding: '8px 12px', background: T.surface, borderRadius: 10, marginBottom: 10, lineHeight: 1.5 }}>
                              📝 {leave.reason}
                            </div>

                            {leave.adminNote && (
                              <div style={{ background: sc.bg, borderRadius: 10, padding: '8px 12px', fontSize: 12, color: sc.color, marginBottom: 10 }}>
                                💬 Your note: {leave.adminNote}
                              </div>
                            )}

                            {/* Action row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                              {leave.status === 'pending' && (
                                <>
                                  <Button size="sm" variant="danger" onClick={() => openReview(leave, 'rejected')}>
                                    <XCircle size={13} /> Reject
                                  </Button>
                                  <Button size="sm" variant="success" onClick={() => openReview(leave, 'approved')}>
                                    <CheckCircle2 size={13} /> Approve
                                  </Button>
                                </>
                              )}
                              {leave.status !== 'pending' && (
                                <button
                                  onClick={() => handleDelete(leave.id)}
                                  style={{
                                    background: T.dangerLight, border: 'none', borderRadius: 8,
                                    padding: '4px 10px', cursor: 'pointer', color: T.danger,
                                    fontSize: 11, fontWeight: 600,
                                  }}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                {/* ── Right sidebar ────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Member filter */}
                  <Card style={{ padding: '18px 20px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                      <Filter size={12} style={{ marginRight: 6 }} /> Filter by Member
                    </div>
                    <select
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 12,
                        border: `1.5px solid ${T.border}`, background: '#faf9ff',
                        fontSize: 14, color: T.textPrimary, outline: 'none',
                        fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
                      }}
                    >
                      <option value="all">All Members</option>
                      {members.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </Card>

                  {/* Quick stats by type */}
                  <Card style={{ padding: '18px 20px' }}>
                    <SectionTitle>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Briefcase size={16} color={T.primary} /> By Type
                      </span>
                    </SectionTitle>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {Object.entries(TYPE_CONFIG).map(([key, tc]) => {
                        const count = leaves.filter((l) => l.leaveType === key && l.status === 'approved').length;
                        if (count === 0) return null;
                        return (
                          <div key={key} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 12px', borderRadius: 10, background: T.bg,
                            border: `1px solid ${T.border}`,
                          }}>
                            <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{tc.emoji}</span>
                              <span style={{ fontWeight: 600, color: T.textPrimary }}>{tc.label}</span>
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: tc.color }}>{count}</span>
                          </div>
                        );
                      })}
                      {leaves.filter((l) => l.status === 'approved').length === 0 && (
                        <p style={{ fontSize: 13, color: T.textMuted, textAlign: 'center', padding: 8 }}>No approved leaves yet.</p>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── Review Modal ─────────────────────────────────── */}
      <Modal
        open={!!reviewLeave}
        onClose={() => setReviewLeave(null)}
        title={reviewAction === 'approved' ? '✅ Approve Leave' : '❌ Reject Leave'}
        width={460}
      >
        {reviewLeave && (() => {
          const tc = TYPE_CONFIG[reviewLeave.leaveType] || TYPE_CONFIG.other;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Leave summary */}
              <div style={{ background: T.bg, borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <AvatarCircle name={reviewLeave.userName} avatar={reviewLeave.userAvatar} color={ROLE_COLORS.member} size={32} />
                  <div>
                    <div style={{ fontWeight: 700, color: T.textPrimary, fontSize: 14 }}>{reviewLeave.userName}</div>
                    <div style={{ fontSize: 12, color: tc.color, fontWeight: 600 }}>{tc.emoji} {tc.label}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                  <div><span style={{ color: T.textMuted }}>From:</span> <strong>{formatDate(reviewLeave.fromDate)}</strong></div>
                  <div><span style={{ color: T.textMuted }}>To:</span> <strong>{formatDate(reviewLeave.toDate)}</strong></div>
                  <div style={{ gridColumn: 'span 2' }}><span style={{ color: T.textMuted }}>Days:</span> <strong>{reviewLeave.numDays}</strong></div>
                </div>
                <div style={{ marginTop: 8, fontSize: 13, color: T.textSecondary }}>
                  📝 {reviewLeave.reason}
                </div>
              </div>

              <Textarea
                label={`Note to ${reviewLeave.userName} (optional)`}
                id="admin-note"
                rows={2}
                placeholder={reviewAction === 'approved'
                  ? 'e.g. Approved. Enjoy your time off!'
                  : 'e.g. Sorry, this conflicts with a deadline. Please reschedule.'}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />

              {reviewError && <Alert type="danger">{reviewError}</Alert>}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Button variant="ghost" onClick={() => setReviewLeave(null)}>Cancel</Button>
                <Button
                  variant={reviewAction === 'approved' ? 'success' : 'danger'}
                  onClick={handleReview}
                  disabled={reviewing}
                >
                  {reviewing ? 'Processing…' : reviewAction === 'approved' ? '✅ Approve' : '❌ Reject'}
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
