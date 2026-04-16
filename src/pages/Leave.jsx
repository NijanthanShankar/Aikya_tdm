import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { T } from '../utils/theme';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import {
  Card, StatCard, SectionTitle, EmptyState, Spinner, Badge,
  Button, Modal, Input, Textarea, Select, Alert, AvatarCircle,
} from '../components/ui';
import {
  CalendarOff, Plus, Clock, CheckCircle2, XCircle, Ban,
  Briefcase, ThermometerSun, Calendar, Coffee, Home, Gift, HelpCircle,
  Send, Filter,
} from 'lucide-react';

// ── Leave type config ─────────────────────────────────────────
const TYPE_CONFIG = {
  casual:       { label: 'Casual Leave',      icon: Coffee,          color: '#3b82f6', emoji: '🏖️' },
  sick:         { label: 'Sick Leave',         icon: ThermometerSun,  color: '#ef4444', emoji: '🤒' },
  earned:       { label: 'Earned Leave',       icon: Gift,            color: '#10b981', emoji: '🎁' },
  half_day:     { label: 'Half Day',           icon: Clock,           color: '#f59e0b', emoji: '⏳' },
  wfh:          { label: 'Work From Home',     icon: Home,            color: '#8b5cf6', emoji: '🏠' },
  compensatory: { label: 'Compensatory Off',   icon: Calendar,        color: '#ec4899', emoji: '🔄' },
  other:        { label: 'Other Leave',        icon: HelpCircle,      color: '#64748b', emoji: '📋' },
};

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#f59e0b', bg: '#fef3c7', icon: Clock       },
  approved:  { label: 'Approved',  color: '#10b981', bg: '#d1fae5', icon: CheckCircle2 },
  rejected:  { label: 'Rejected',  color: '#ef4444', bg: '#fee2e2', icon: XCircle      },
  cancelled: { label: 'Cancelled', color: '#64748b', bg: '#f1f5f9', icon: Ban          },
};

// ── Helper to format dates safely ─────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Leave() {
  const { currentUser } = useAuth();

  const [leaves,      setLeaves]      = useState([]);
  const [balance,     setBalance]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showApply,   setShowApply]   = useState(false);
  const [filter,      setFilter]      = useState('all');
  const [cancelId,    setCancelId]    = useState(null);
  const [cancelling,  setCancelling]  = useState(false);

  // Apply form
  const [form, setForm] = useState({ leaveType: 'casual', fromDate: '', toDate: '', reason: '' });
  const [applying, setApplying] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const year = new Date().getFullYear();

  // Load data
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lRes, bRes] = await Promise.all([
        api.leave.list(year),
        api.leave.balance(year),
      ]);
      setLeaves(lRes.leaves || []);
      setBalance(bRes.balance || []);
    } catch {}
    setLoading(false);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!form.fromDate || !form.toDate || !form.reason.trim()) {
      setFormError('Please fill all required fields.'); return;
    }
    setApplying(true);
    try {
      const { leave } = await api.leave.apply(form);
      setLeaves((prev) => [leave, ...prev]);
      setShowApply(false);
      setForm({ leaveType: 'casual', fromDate: '', toDate: '', reason: '' });
      setFormSuccess('Leave applied successfully! Manager will review it.');
      // Refresh balance
      const bRes = await api.leave.balance(year);
      setBalance(bRes.balance || []);
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err) {
      setFormError(err.message);
    }
    setApplying(false);
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    try {
      const { leave } = await api.leave.update(cancelId, { status: 'cancelled' });
      setLeaves((prev) => prev.map((l) => l.id === cancelId ? leave : l));
      setCancelId(null);
    } catch {}
    setCancelling(false);
  };

  const filteredLeaves = filter === 'all' ? leaves : leaves.filter((l) => l.status === filter);

  const pendingCount  = leaves.filter((l) => l.status === 'pending').length;
  const approvedCount = leaves.filter((l) => l.status === 'approved').length;
  const rejectedCount = leaves.filter((l) => l.status === 'rejected').length;
  const totalUsed     = leaves.filter((l) => l.status === 'approved').reduce((s, l) => s + l.numDays, 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'DM Sans, sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header title="Leave Management" subtitle="Apply for leave and track your leave balance" />

        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>

          {formSuccess && (
            <div style={{ background: T.successLight, border: `1.5px solid ${T.success}30`, borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: T.success, fontWeight: 600, fontSize: 14 }}>
              <CheckCircle2 size={18} /> {formSuccess}
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
          ) : (
            <>
              {/* ── Stats ─────────────────────────────────── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 16, marginBottom: 24 }}>
                <StatCard label="Total Used"       value={`${totalUsed}d`}    icon={CalendarOff}  color={T.primary} />
                <StatCard label="Pending"          value={pendingCount}       icon={Clock}        color={T.warning} />
                <StatCard label="Approved"         value={approvedCount}      icon={CheckCircle2} color={T.success} />
                <StatCard label="Rejected"         value={rejectedCount}      icon={XCircle}      color={T.danger} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

                {/* ── Left: Leave Requests ─────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <Card style={{ padding: '20px 24px' }}>
                    <SectionTitle action={
                      <Button onClick={() => { setShowApply(true); setFormError(''); setFormSuccess(''); }}>
                        <Plus size={15} /> Apply Leave
                      </Button>
                    }>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CalendarOff size={18} color={T.primary} /> My Leave Requests
                      </span>
                    </SectionTitle>

                    {/* Filter pills */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                      {[
                        { key: 'all',       label: 'All',       count: leaves.length   },
                        { key: 'pending',   label: 'Pending',   count: pendingCount    },
                        { key: 'approved',  label: 'Approved',  count: approvedCount   },
                        { key: 'rejected',  label: 'Rejected',  count: rejectedCount   },
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

                    {filteredLeaves.length === 0 ? (
                      <EmptyState icon={CalendarOff} message="No leave requests found" sub="Click 'Apply Leave' to submit a new request." />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {filteredLeaves.map((leave) => {
                          const tc = TYPE_CONFIG[leave.leaveType] || TYPE_CONFIG.other;
                          const sc = STATUS_CONFIG[leave.status]  || STATUS_CONFIG.pending;
                          const StatusIcon = sc.icon;
                          return (
                            <div key={leave.id} style={{
                              background: T.bg, borderRadius: 16, padding: '16px 18px',
                              border: `1.5px solid ${T.border}`,
                              transition: 'box-shadow 0.15s',
                            }}
                              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = T.cardShadowHover; }}
                              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{
                                    width: 38, height: 38, borderRadius: 12, background: `${tc.color}15`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                  }}>
                                    <tc.icon size={18} color={tc.color} />
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: T.textPrimary }}>{tc.label}</div>
                                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
                                      {formatDate(leave.fromDate)}{leave.fromDate !== leave.toDate ? ` → ${formatDate(leave.toDate)}` : ''} · {leave.numDays} day{leave.numDays !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                </div>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  padding: '4px 12px', borderRadius: 99, background: sc.bg,
                                  color: sc.color, fontSize: 11, fontWeight: 700,
                                  border: `1px solid ${sc.color}30`,
                                }}>
                                  <StatusIcon size={12} /> {sc.label}
                                </span>
                              </div>

                              <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 8, lineHeight: 1.5 }}>
                                📝 {leave.reason}
                              </div>

                              {leave.adminNote && (
                                <div style={{ background: sc.bg, borderRadius: 10, padding: '8px 12px', fontSize: 12, color: sc.color, marginBottom: 8 }}>
                                  💬 Manager: {leave.adminNote}
                                </div>
                              )}

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 11, color: T.textMuted }}>
                                  Applied: {formatDate(leave.createdAt?.split(/[T ]/)[0])}
                                  {leave.approvedByName && ` · ${leave.status === 'approved' ? 'Approved' : 'Reviewed'} by ${leave.approvedByName}`}
                                </span>
                                {leave.status === 'pending' && (
                                  <button
                                    onClick={() => setCancelId(leave.id)}
                                    style={{
                                      background: T.dangerLight, border: 'none', borderRadius: 8,
                                      padding: '4px 12px', cursor: 'pointer', color: T.danger,
                                      fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
                                    }}
                                  >
                                    <Ban size={11} /> Cancel
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                </div>

                {/* ── Right: Leave Balance ─────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Card style={{ padding: '18px 20px' }}>
                    <SectionTitle>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Briefcase size={16} color={T.primary} /> Leave Balance — {year}
                      </span>
                    </SectionTitle>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {balance.map((b) => {
                        const tc = TYPE_CONFIG[b.type] || TYPE_CONFIG.other;
                        const pct = b.total > 0 ? (b.used / b.total) * 100 : 0;
                        return (
                          <div key={b.type} style={{
                            padding: '12px 14px', borderRadius: 14, background: T.bg,
                            border: `1.5px solid ${T.border}`,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 16 }}>{tc.emoji}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>{tc.label}</span>
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: b.remaining > 0 ? tc.color : T.danger }}>
                                {b.remaining}/{b.total}
                              </span>
                            </div>
                            {/* Progress bar */}
                            <div style={{ height: 6, borderRadius: 99, background: `${tc.color}18`, overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', borderRadius: 99, background: tc.color,
                                width: `${Math.min(pct, 100)}%`, transition: 'width 0.4s ease',
                              }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                              <span style={{ fontSize: 10, color: T.textMuted }}>Used: {b.used}</span>
                              <span style={{ fontSize: 10, color: T.textMuted }}>Remaining: {b.remaining}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Quick apply card */}
                  <Card style={{ padding: '18px 20px', background: `linear-gradient(135deg, ${T.primary}08, ${T.primary}15)` }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>🏖️</div>
                      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: T.textPrimary, marginBottom: 4 }}>
                        Need some time off?
                      </div>
                      <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 14 }}>
                        Submit a leave request and your manager will be notified instantly.
                      </div>
                      <Button onClick={() => { setShowApply(true); setFormError(''); }}>
                        <Send size={14} /> Apply Now
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── Apply Leave Modal ────────────────────────────── */}
      <Modal open={showApply} onClose={() => setShowApply(false)} title="Apply for Leave" width={520}>
        <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Select
            label="Leave Type" id="leave-type" required
            value={form.leaveType}
            onChange={(e) => {
              const type = e.target.value;
              setForm((p) => ({
                ...p,
                leaveType: type,
                toDate: type === 'half_day' ? p.fromDate : p.toDate,
              }));
            }}
            options={Object.entries(TYPE_CONFIG).map(([k, v]) => ({ value: k, label: `${v.emoji} ${v.label}` }))}
          />

          <div style={{ display: 'grid', gridTemplateColumns: form.leaveType === 'half_day' ? '1fr' : '1fr 1fr', gap: 12 }}>
            <Input
              label={form.leaveType === 'half_day' ? 'Date' : 'From Date'}
              type="date" id="leave-from" required
              value={form.fromDate}
              onChange={(e) => {
                const v = e.target.value;
                setForm((p) => ({
                  ...p,
                  fromDate: v,
                  toDate: p.leaveType === 'half_day' ? v : (p.toDate < v ? v : p.toDate),
                }));
              }}
            />
            {form.leaveType !== 'half_day' && (
              <Input
                label="To Date" type="date" id="leave-to" required
                value={form.toDate}
                min={form.fromDate}
                onChange={(e) => setForm((p) => ({ ...p, toDate: e.target.value }))}
              />
            )}
          </div>

          {/* Day count preview */}
          {form.fromDate && form.toDate && (
            <div style={{ background: T.primaryLight, borderRadius: 12, padding: '10px 14px', fontSize: 13, color: T.primary, fontWeight: 600 }}>
              📅 {form.leaveType === 'half_day' ? '0.5 day' : (() => {
                const s = new Date(form.fromDate);
                const e = new Date(form.toDate);
                const d = Math.round((e - s) / 86400000) + 1;
                return `${d} day${d !== 1 ? 's' : ''}`;
              })()}
              {' '}· {formatDate(form.fromDate)}{form.fromDate !== form.toDate ? ` → ${formatDate(form.toDate)}` : ''}
            </div>
          )}

          <Textarea
            label="Reason" id="leave-reason" required rows={3}
            placeholder="Enter the reason for your leave..."
            value={form.reason}
            onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
          />

          {formError && <Alert type="danger">{formError}</Alert>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={() => setShowApply(false)}>Cancel</Button>
            <Button type="submit" disabled={applying}>
              {applying ? <><Spinner size={14} color="#fff" /> Applying…</> : <><Send size={14} /> Submit Request</>}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Cancel Confirm Modal ─────────────────────────── */}
      <Modal open={!!cancelId} onClose={() => setCancelId(null)} title="Cancel Leave Request" width={400}>
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <p style={{ fontSize: 15, color: T.textPrimary, fontWeight: 600, margin: '0 0 8px' }}>Are you sure?</p>
          <p style={{ fontSize: 13, color: T.textSecondary, margin: '0 0 20px' }}>This will cancel your pending leave request. This action cannot be undone.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Button variant="ghost" onClick={() => setCancelId(null)}>Keep it</Button>
            <Button variant="danger" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? 'Cancelling…' : '❌ Yes, Cancel'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
