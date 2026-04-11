import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance, formatTime, formatHours, isSundayDate } from '../../context/AttendanceContext';
import { T, ROLE_COLORS } from '../../utils/theme';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';
import {
  Card, SectionTitle, StatCard, AvatarCircle, EmptyState,
  Spinner, Modal, Input, Alert, Badge, Button,
} from '../../components/ui';
import {
  CalendarCheck, Users, Clock, CheckCircle2, XCircle,
  Plus, Trash2, MapPin, AlertCircle,
} from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function AttendanceAdmin() {
  const { users } = useAuth();
  const { holidays, addHoliday, removeHoliday, fetchHistory, fetchAllToday, adjustRecord, isHolidayDate, getHolidayName } = useAttendance();

  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedUser, setSelectedUser] = useState('all');

  const [todayRecords, setTodayRecords] = useState([]);
  const [allRecords,   setAllRecords]   = useState([]);
  const [loadingToday, setLoadingToday] = useState(false);
  const [loadingHist,  setLoadingHist]  = useState(false);

  // Holiday modal
  const [hModal,   setHModal]   = useState(false);
  const [hDate,    setHDate]    = useState('');
  const [hName,    setHName]    = useState('');
  const [hSaving,  setHSaving]  = useState(false);
  const [hError,   setHError]   = useState('');

  // Adjust modal
  const [adjustModal,  setAdjustModal]  = useState(null);
  const [adjustForm,   setAdjustForm]   = useState({});
  const [adjustSaving, setAdjustSaving] = useState(false);
  const [adjustError,  setAdjustError]  = useState('');

  const members = users.filter((u) => u.role === 'member');
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Load today's records
  useEffect(() => {
    setLoadingToday(true);
    fetchAllToday().then(({ records }) => { setTodayRecords(records || []); setLoadingToday(false); });
  }, []);

  // Load monthly records for selected user
  useEffect(() => {
    if (selectedUser === 'all') return;
    setLoadingHist(true);
    fetchHistory(monthStr, selectedUser).then(({ records }) => { setAllRecords(records || []); setLoadingHist(false); });
  }, [monthStr, selectedUser]);

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!hDate || !hName.trim()) { setHError('Date and name required.'); return; }
    setHSaving(true); setHError('');
    const result = await addHoliday(hDate, hName.trim());
    setHSaving(false);
    if (result.success) { setHModal(false); setHDate(''); setHName(''); }
    else setHError(result.error);
  };

  const openAdjust = (record) => {
    setAdjustModal(record);
    setAdjustForm({
      checkinTime:  record.checkinTime  || '',
      checkoutTime: record.checkoutTime || '',
      status:       record.status || 'present',
      notes:        record.notes  || '',
    });
    setAdjustError('');
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    setAdjustSaving(true); setAdjustError('');
    const result = await adjustRecord(adjustModal.id, adjustForm);
    setAdjustSaving(false);
    if (result.success) {
      setTodayRecords((prev) => prev.map((r) => r.id === adjustModal.id ? result.record : r));
      setAllRecords((prev) => prev.map((r) => r.id === adjustModal.id ? result.record : r));
      setAdjustModal(null);
    } else {
      setAdjustError(result.error);
    }
  };

  // Today's live status for all members
  const checkedInIds = todayRecords.filter((r) => !r.checkoutTime).map((r) => r.userId);
  const checkedOutIds = todayRecords.filter((r) => r.checkoutTime).map((r) => r.userId);

  const todayIsSunday  = now.getDay() === 0;
  const todayHolidayName = getHolidayName?.();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'DM Sans, sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header title="Attendance Management" subtitle="Live check-in status, monthly reports, and public holidays" />

        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>

          {/* ── Holiday/Sunday banner ─────────────────────── */}
          {(todayIsSunday || todayHolidayName) && (
            <div style={{ background: '#fefce8', border: '1.5px solid #fde047', borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>{todayIsSunday ? '🌴' : '🎉'}</span>
              <div>
                <div style={{ fontWeight: 700, color: '#854d0e' }}>{todayIsSunday ? 'Today is Sunday — Weekly Holiday' : `Today is a Public Holiday: ${todayHolidayName}`}</div>
                <div style={{ fontSize: 12, color: '#92400e' }}>Attendance is not required today.</div>
              </div>
            </div>
          )}

          {/* ── Quick stats ───────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
            <StatCard label="Total Members"  value={members.length}           icon={Users}        color={T.primary}          />
            <StatCard label="Checked In"     value={checkedInIds.length}      icon={CheckCircle2} color={T.statusCompleted}  />
            <StatCard label="Checked Out"    value={checkedOutIds.length}     icon={XCircle}      color={T.statusInProgress} />
            <StatCard label="Not Checked In" value={members.length - todayRecords.length} icon={AlertCircle} color={T.danger} />
            <StatCard label="Holidays This Year" value={holidays.length + 52} icon={CalendarCheck} color="#f59e0b" sub="(incl. Sundays)" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>

            {/* ── Left: Live today + monthly report ───────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Today's Status */}
              <Card style={{ padding: '20px 24px' }}>
                <SectionTitle><span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CalendarCheck size={18} color={T.primary} /> Today's Live Status</span></SectionTitle>

                {loadingToday ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner size={28} /></div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {members.map((member) => {
                      const rec = todayRecords.find((r) => r.userId === member.id);
                      return (
                        <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: T.bg, border: `1.5px solid ${T.border}` }}>
                          <AvatarCircle name={member.name} avatar={member.avatar} color={ROLE_COLORS.member} avatarUrl={member.avatarUrl} size={36} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</div>
                            {member.department && <div style={{ fontSize: 11, color: T.textMuted }}>{member.department}</div>}
                          </div>
                          {rec ? (
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                                <span style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>IN {formatTime(rec.checkinTime)}</span>
                                {rec.checkoutTime && <span style={{ fontSize: 12, color: T.primary, fontWeight: 700 }}>→ OUT {formatTime(rec.checkoutTime)}</span>}
                              </div>
                              {rec.checkinLocation && (
                                <div style={{ fontSize: 10, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', marginTop: 2 }}>
                                  <MapPin size={9} /> <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.checkinLocation}</span>
                                </div>
                              )}
                              {rec.workHours && <div style={{ fontSize: 11, color: T.primary, fontWeight: 700, marginTop: 2 }}>{formatHours(rec.workHours)}</div>}
                              <button onClick={() => openAdjust(rec)} style={{ fontSize: 11, color: T.primary, background: T.primaryLight, border: `1px solid ${T.border}`, borderRadius: 6, padding: '2px 8px', cursor: 'pointer', marginTop: 4, fontWeight: 600 }}>Adjust</button>
                            </div>
                          ) : (
                            <span style={{ padding: '4px 12px', borderRadius: 99, background: todayIsSunday || todayHolidayName ? '#fefce8' : T.dangerLight, color: todayIsSunday || todayHolidayName ? '#854d0e' : T.danger, fontSize: 11, fontWeight: 700 }}>
                              {todayIsSunday ? '🌴 Sunday' : todayHolidayName ? '🎉 Holiday' : '❌ Not Checked In'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {members.length === 0 && <EmptyState icon={Users} message="No team members added yet" />}
                  </div>
                )}
              </Card>

              {/* Monthly report for selected member */}
              {selectedUser !== 'all' && (
                <Card style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <SectionTitle><span>Monthly Report</span></SectionTitle>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { const d = new Date(year, month - 1, 1); setYear(d.getFullYear()); setMonth(d.getMonth()); }} style={{ background: T.primaryLight, border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', color: T.primary, fontWeight: 600, fontSize: 12 }}>←</button>
                      <span style={{ fontWeight: 700, color: T.textPrimary, fontSize: 14, display: 'flex', alignItems: 'center', padding: '0 8px' }}>{MONTHS[month]} {year}</span>
                      <button onClick={() => { const d = new Date(year, month + 1, 1); setYear(d.getFullYear()); setMonth(d.getMonth()); }} style={{ background: T.primaryLight, border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', color: T.primary, fontWeight: 600, fontSize: 12 }}>→</button>
                    </div>
                  </div>

                  {loadingHist ? <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner /></div> : (
                    allRecords.length === 0
                      ? <EmptyState icon={CalendarCheck} message="No attendance records for this month" />
                      : (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 5px', fontSize: 13 }}>
                            <thead><tr>{['Date','Check In','Check Out','Duration','Location',''].map((h) => (
                              <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: T.textMuted, fontWeight: 600, fontSize: 11 }}>{h}</th>
                            ))}</tr></thead>
                            <tbody>
                              {[...allRecords].sort((a,b) => b.date.localeCompare(a.date)).map((r) => (
                                <tr key={r.id} style={{ background: T.surface }}>
                                  <td style={{ padding: '9px 10px', borderTop: `1.5px solid ${T.border}`, borderBottom: `1.5px solid ${T.border}`, borderLeft: `1.5px solid ${T.border}`, borderRadius: '10px 0 0 10px', fontWeight: 600 }}>{new Date(r.date).toLocaleDateString('en-IN', { day:'numeric',month:'short' })}</td>
                                  <td style={{ padding: '9px 10px', borderTop: `1.5px solid ${T.border}`, borderBottom: `1.5px solid ${T.border}`, color: '#059669', fontWeight: 600 }}>{formatTime(r.checkinTime)}</td>
                                  <td style={{ padding: '9px 10px', borderTop: `1.5px solid ${T.border}`, borderBottom: `1.5px solid ${T.border}`, color: r.checkoutTime ? T.primary : T.warning, fontWeight: 600 }}>{r.checkoutTime ? formatTime(r.checkoutTime) : '—'}</td>
                                  <td style={{ padding: '9px 10px', borderTop: `1.5px solid ${T.border}`, borderBottom: `1.5px solid ${T.border}`, fontWeight: 700 }}>{formatHours(r.workHours)}</td>
                                  <td style={{ padding: '9px 10px', borderTop: `1.5px solid ${T.border}`, borderBottom: `1.5px solid ${T.border}`, maxWidth: 160, overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap', color: T.textMuted, fontSize: 12 }}>{r.checkinLocation}</td>
                                  <td style={{ padding: '9px 10px', borderTop: `1.5px solid ${T.border}`, borderBottom: `1.5px solid ${T.border}`, borderRight: `1.5px solid ${T.border}`, borderRadius: '0 10px 10px 0' }}>
                                    <button onClick={() => openAdjust(r)} style={{ fontSize: 11, color: T.primary, background: T.primaryLight, border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                  )}
                </Card>
              )}
            </div>

            {/* ── Right: Filters + Holidays ────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Member filter */}
              <Card style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>View Member Report</div>
                <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${T.border}`, background: '#faf9ff', fontSize: 14, color: T.textPrimary, outline: 'none', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}>
                  <option value="all">— Select a member —</option>
                  {members.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </Card>

              {/* Public Holidays */}
              <Card style={{ padding: '18px 20px' }}>
                <SectionTitle action={<button onClick={() => { setHModal(true); setHDate(''); setHName(''); setHError(''); }} style={{ display: 'flex', alignItems: 'center', gap: 4, background: T.primaryLight, border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', color: T.primary, fontWeight: 700, fontSize: 12 }}><Plus size={13} /> Add</button>}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CalendarCheck size={16} color={T.primary} /> Public Holidays</span>
                </SectionTitle>

                <div style={{ marginBottom: 10, padding: '8px 12px', background: '#e0f2fe', borderRadius: 10, fontSize: 12, color: '#0369a1' }}>
                  🌴 <strong>Sundays</strong> are always holidays (automatic)
                </div>

                {holidays.length === 0 ? (
                  <p style={{ fontSize: 13, color: T.textMuted, textAlign: 'center', padding: '12px 0' }}>No public holidays added yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
                    {holidays.filter((h) => h.date.startsWith(year.toString())).map((h) => (
                      <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, background: '#fefce8', border: '1px solid #fde047' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#854d0e' }}>{h.name}</div>
                          <div style={{ fontSize: 11, color: '#92400e' }}>{new Date(h.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </div>
                        <button onClick={() => { if (confirm(`Remove "${h.name}"?`)) removeHoliday(h.id); }} style={{ background: T.dangerLight, border: 'none', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', color: T.danger, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Year filter for holidays */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                <button onClick={() => setYear(y => y - 1)} style={{ background: T.primaryLight, border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', color: T.primary, fontWeight: 600, fontSize: 12 }}>← {year - 1}</button>
                <span style={{ fontWeight: 700, color: T.textPrimary }}>{year}</span>
                <button onClick={() => setYear(y => y + 1)} style={{ background: T.primaryLight, border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', color: T.primary, fontWeight: 600, fontSize: 12 }}>{year + 1} →</button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Holiday Modal */}
      <Modal open={hModal} onClose={() => setHModal(false)} title="Add Public Holiday" width={400}>
        <form onSubmit={handleAddHoliday} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Holiday Date" type="date" value={hDate} onChange={(e) => setHDate(e.target.value)} required id="h-date" />
          <Input label="Holiday Name" value={hName} onChange={(e) => setHName(e.target.value)} placeholder="e.g. Diwali, Christmas" required id="h-name" />
          {hError && <Alert type="danger">{hError}</Alert>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={() => setHModal(false)}>Cancel</Button>
            <Button type="submit" disabled={hSaving}>{hSaving ? 'Adding…' : 'Add Holiday'}</Button>
          </div>
        </form>
      </Modal>

      {/* Adjust Attendance Modal */}
      <Modal open={!!adjustModal} onClose={() => setAdjustModal(null)} title="Adjust Attendance Record" width={460}>
        {adjustModal && (
          <form onSubmit={handleAdjust} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: T.bg, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: T.textSecondary }}>
              <strong>{adjustModal.userName}</strong> · {new Date(adjustModal.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <Input label="Check-in Time" type="datetime-local" value={adjustForm.checkinTime?.replace(' ', 'T').slice(0, 16) || ''} onChange={(e) => setAdjustForm((p) => ({ ...p, checkinTime: e.target.value }))} id="adj-in" />
            <Input label="Check-out Time (leave blank if not done)" type="datetime-local" value={adjustForm.checkoutTime?.replace(' ', 'T').slice(0, 16) || ''} onChange={(e) => setAdjustForm((p) => ({ ...p, checkoutTime: e.target.value }))} id="adj-out" />
            {adjustError && <Alert type="danger">{adjustError}</Alert>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button type="button" variant="ghost" onClick={() => setAdjustModal(null)}>Cancel</Button>
              <Button type="submit" disabled={adjustSaving}>{adjustSaving ? 'Saving…' : 'Update Record'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
