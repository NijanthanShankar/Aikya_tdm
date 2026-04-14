import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAttendance, formatTime, formatHours, isSundayDate } from '../context/AttendanceContext';
import { T } from '../utils/theme';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { Card, StatCard, SectionTitle, EmptyState, Spinner, AvatarCircle } from '../components/ui';
import { CalendarCheck, Clock, CheckCircle2, XCircle, MapPin, TrendingUp } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Attendance() {
  const { currentUser } = useAuth();
  const { fetchHistory, isHolidayDate, getHolidayName, holidays } = useAttendance();

  const now     = new Date();
  const [year,  setYear]    = useState(now.getFullYear());
  const [month, setMonth]   = useState(now.getMonth()); // 0-indexed
  const [records,    setRecords]    = useState([]);
  const [loadingRec, setLoadingRec] = useState(false);

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  useEffect(() => {
    setLoadingRec(true);
    fetchHistory(monthStr).then(({ records }) => {
      setRecords(records || []);
      setLoadingRec(false);
    });
  }, [monthStr]);

  // Build calendar grid
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow    = new Date(year, month, 1).getDay(); // 0=Sun

  const recordMap = {};
  records.forEach((r) => { recordMap[r.date] = r; });

  const getDayStatus = (dayNum) => {
    const d   = new Date(year, month, dayNum);
    // Use local date parts to avoid IST→UTC midnight shift
    const str = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    if (d.getDay() === 0)   return { type: 'sunday',  label: 'Sunday' };
    if (isHolidayDate(str)) return { type: 'holiday', label: getHolidayName(str) || 'Holiday' };
    if (recordMap[str])     return { type: recordMap[str].checkoutTime ? 'full' : 'partial', label: recordMap[str].checkoutTime ? `${formatTime(recordMap[str].checkinTime)} – ${formatTime(recordMap[str].checkoutTime)}` : `In: ${formatTime(recordMap[str].checkinTime)}`, hours: recordMap[str].workHours };
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const launchDate = new Date(2026, 3, 14); // April 14 2026 — attendance tracking starts
    const isPast = d < today;
    const isBeforeLaunch = d < launchDate;
    if (isPast && !isBeforeLaunch) return { type: 'absent', label: 'Absent' };
    return { type: 'future', label: '' };
  };

  const colorMap = { sunday: '#e5e7eb', holiday: '#fde68a', full: '#bbf7d0', partial: '#bfdbfe', absent: '#fecaca', future: T.bg };
  const textMap  = { sunday: '#6b7280', holiday: '#92400e', full: '#15803d', partial: '#1d4ed8', absent: '#b91c1c', future: T.textMuted };
  const labelMap = { sunday: '🌴', holiday: '🎉', full: '✅', partial: '⏳', absent: '❌', future: '' };

  // Stats
  const workingDays = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter((d) => {
    const date = new Date(year, month, d);
    const str  = date.toISOString().slice(0, 10);
    return date.getDay() !== 0 && !isHolidayDate(str);
  }).length;
  const presentCount = records.filter((r) => r.checkoutTime).length;
  const totalHours   = records.reduce((s, r) => s + (r.workHours || 0), 0);
  const avgHours     = presentCount > 0 ? (totalHours / presentCount).toFixed(1) : 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'DM Sans, sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header title="My Attendance" subtitle="Track your daily login, logout, and hours worked" />

        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 16, marginBottom: 24 }}>
            <StatCard label="Working Days"  value={workingDays}               icon={CalendarCheck} color={T.primary}          />
            <StatCard label="Days Present"  value={presentCount}              icon={CheckCircle2}  color={T.statusCompleted}  />
            <StatCard label="Days Absent"   value={Math.max(0, workingDays - presentCount - (now.getMonth() === month && now.getFullYear() === year ? 1 : 0))} icon={XCircle} color={T.danger} />
            <StatCard label="Avg Hours/Day" value={`${avgHours}h`}            icon={Clock}         color={T.statusInProgress} />
            <StatCard label="Total Hours"   value={`${totalHours.toFixed(1)}h`} icon={TrendingUp}  color="#8b5cf6"            />
          </div>

          {/* Month selector + calendar */}
          <Card style={{ padding: '20px 24px', marginBottom: 24 }}>
            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <button onClick={() => { const d = new Date(year, month - 1, 1); setYear(d.getFullYear()); setMonth(d.getMonth()); }} style={{ background: T.primaryLight, border: 'none', borderRadius: 10, padding: '6px 16px', cursor: 'pointer', color: T.primary, fontWeight: 600 }}>← Prev</button>
              <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 18, color: T.textPrimary }}>{MONTHS[month]} {year}</span>
              <button onClick={() => { const d = new Date(year, month + 1, 1); setYear(d.getFullYear()); setMonth(d.getMonth()); }} style={{ background: T.primaryLight, border: 'none', borderRadius: 10, padding: '6px 16px', cursor: 'pointer', color: T.primary, fontWeight: 600 }}>Next →</button>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
              {[['full','#bbf7d0','✅ Present'],['partial','#bfdbfe','⏳ Checked In'],['absent','#fecaca','❌ Absent'],['holiday','#fde68a','🎉 Holiday'],['sunday','#e5e7eb','🌴 Sunday']].map(([type, bg, lbl]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.textSecondary }}>
                  <div style={{ width: 14, height: 14, borderRadius: 4, background: bg }} />
                  {lbl}
                </div>
              ))}
            </div>

            {/* Weekday headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: d === 'Sun' ? T.danger : T.textMuted, padding: '4px 0' }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            {loadingRec ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} /></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {Array.from({ length: firstDow }, (_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day    = i + 1;
                  const status = getDayStatus(day);
                  const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
                  return (
                    <div key={day} style={{
                      borderRadius: 10,
                      background: colorMap[status.type] || T.bg,
                      border: isToday ? `2px solid ${T.primary}` : '2px solid transparent',
                      padding: '8px 4px', textAlign: 'center', minHeight: 68,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: textMap[status.type] || T.textMuted }}>{day}</div>
                      <div style={{ fontSize: 16, marginTop: 2 }}>{labelMap[status.type]}</div>
                      {status.hours && <div style={{ fontSize: 10, color: '#15803d', fontWeight: 600, marginTop: 2 }}>{formatHours(status.hours)}</div>}
                      {isToday && <div style={{ fontSize: 9, color: T.primary, fontWeight: 700, marginTop: 2 }}>TODAY</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Detailed log table */}
          <Card style={{ padding: '20px 24px' }}>
            <SectionTitle><span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={18} color={T.primary} /> Daily Log — {MONTHS[month]} {year}</span></SectionTitle>
            {records.length === 0 ? (
              <EmptyState icon={CalendarCheck} message="No records for this month" sub="Your attendance will appear here once you start checking in." />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px', fontSize: 13 }}>
                  <thead>
                    <tr>{['Date','Check In','Check Out','Hours','Location (In)','Status'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: T.textMuted, fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {[...records].sort((a, b) => b.date.localeCompare(a.date)).map((r) => (
                      <tr key={r.id} style={{ background: T.surface, borderRadius: 12 }}>
                        <td style={{ padding: '10px 12px', borderTop: `1.5px solid ${T.border}`, borderBottom: `1.5px solid ${T.border}`, borderLeft: `1.5px solid ${T.border}`, borderRadius: '12px 0 0 12px', whiteSpace: 'nowrap', fontWeight: 600, color: T.textPrimary }}>{new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td style={{ padding: '10px 12px', borderTop: `1.5px solid ${T.border}`, borderBottom: `1.5px solid ${T.border}`, color: '#059669', fontWeight: 600 }}>{formatTime(r.checkinTime)}</td>
                        <td style={{ padding: '10px 12px', borderTop: `1.5px solid ${T.border}`, borderBottom: `1.5px solid ${T.border}`, color: r.checkoutTime ? T.primary : T.warning, fontWeight: 600 }}>{r.checkoutTime ? formatTime(r.checkoutTime) : '⏳ Not checked out'}</td>
                        <td style={{ padding: '10px 12px', borderTop: `1.5px solid ${T.border}`, borderBottom: `1.5px solid ${T.border}`, color: T.textPrimary, fontWeight: 700 }}>{formatHours(r.workHours)}</td>
                        <td style={{ padding: '10px 12px', borderTop: `1.5px solid ${T.border}`, borderBottom: `1.5px solid ${T.border}`, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: T.textSecondary }}>
                          {r.checkinLocation && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} /> {r.checkinLocation}</span>}
                        </td>
                        <td style={{ padding: '10px 12px', borderTop: `1.5px solid ${T.border}`, borderBottom: `1.5px solid ${T.border}`, borderRight: `1.5px solid ${T.border}`, borderRadius: '0 12px 12px 0' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: r.checkoutTime ? '#bbf7d0' : '#bfdbfe', color: r.checkoutTime ? '#15803d' : '#1d4ed8' }}>
                            {r.checkoutTime ? 'Complete' : 'In Progress'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}
