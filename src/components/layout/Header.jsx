import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAttendance, getLocationInfo, formatTime, isTodaySunday } from '../../context/AttendanceContext';
import { T, ROLE_LABELS, ROLE_COLORS } from '../../utils/theme';
import { LogOut, User, MapPin, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { AvatarCircle, Spinner } from '../ui';

// ── Tiny live clock ────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14, color: T.textPrimary }}>
      {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
    </span>
  );
}

// ── Check-in/out modal ────────────────────────────────────────
function CheckModal({ type, onConfirm, onClose, todayRecord, holidays }) {
  const [locationInfo, setLocationInfo] = useState(null);
  const [fetching,     setFetching]     = useState(true);
  const [error,        setError]        = useState('');
  const [confirming,   setConfirming]   = useState(false);

  useEffect(() => {
    setFetching(true);
    getLocationInfo().then((info) => {
      setLocationInfo(info);
      setFetching(false);
    });
  }, []);

  const handleConfirm = async () => {
    setConfirming(true);
    const result = await onConfirm(locationInfo);
    setConfirming(false);
    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(30,21,53,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(124,58,237,0.22)', border: `1.5px solid ${T.border}`, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>

        {/* Header band */}
        <div style={{ background: type === 'checkin' ? `linear-gradient(135deg, #059669, #10b981)` : `linear-gradient(135deg, #7c3aed, #a78bfa)`, padding: '24px 28px', color: '#fff' }}>
          <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.85 }}>{type === 'checkin' ? '🟢 Check In' : '🔴 Check Out'}</div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 28, marginTop: 4 }}>{timeStr}</div>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>{dateStr}</div>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {/* Check-out: show duration */}
          {type === 'checkout' && todayRecord?.checkinTime && (
            <div style={{ background: T.primaryLight, borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: T.textMuted }}>Checked in at</div>
              <div style={{ fontWeight: 700, color: T.textPrimary, fontSize: 15 }}>{formatTime(todayRecord.checkinTime)}</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Duration so far: {(() => {
                // Parse IST time manually — new Date(string) may treat it as UTC
                const [dp, tp] = todayRecord.checkinTime.split(/[T ]/);
                const [y, mo, d] = dp.split('-').map(Number);
                const [h, mi, s] = (tp || '00:00:00').split(':').map(Number);
                const checkinLocal = new Date(y, mo - 1, d, h, mi, s || 0);
                const diff = Math.round((Date.now() - checkinLocal.getTime()) / 60000);
                return `${Math.floor(diff / 60)}h ${diff % 60}m`;
              })()}</div>
            </div>
          )}

          {/* Location row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', background: T.bg, borderRadius: 12, marginBottom: 16 }}>
            <MapPin size={16} color={T.primary} style={{ marginTop: 2, flexShrink: 0 }} />
            {fetching ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.textMuted, fontSize: 13 }}>
                <Spinner size={14} /> Fetching location…
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 2 }}>{locationInfo?.lat ? 'Location captured' : 'Location unavailable'}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{locationInfo?.location || 'Unknown'}</div>
                {locationInfo?.lat && (
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{locationInfo.lat}, {locationInfo.lng}</div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div style={{ background: T.dangerLight, color: T.danger, padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          {!fetching && !locationInfo?.lat && (
            <div style={{ background: T.dangerLight, color: T.danger, padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
              ⚠️ Location permission is required. Please enable location access in your browser to check in/out.
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 12, border: `1.5px solid ${T.border}`, background: 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: T.textSecondary }}>Cancel</button>
            <button
              onClick={handleConfirm}
              disabled={fetching || confirming || (!fetching && !locationInfo?.lat)}
              style={{ flex: 2, padding: '11px', borderRadius: 12, border: 'none', background: type === 'checkin' ? '#059669' : T.primary, color: '#fff', cursor: fetching || confirming || (!fetching && !locationInfo?.lat) ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14, opacity: fetching || confirming || (!fetching && !locationInfo?.lat) ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {confirming ? <><Spinner size={14} color="#fff" /> Processing…</> : type === 'checkin' ? '✅ Confirm Check In' : '✅ Confirm Check Out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Header ───────────────────────────────────────────────
export function Header({ title, subtitle }) {
  const { currentUser, logout } = useAuth();
  const { todayRecord, todayStatus, holidays, checkIn, checkOut, getHolidayName } = useAttendance();
  const navigate     = useNavigate();
  const roleColor    = ROLE_COLORS[currentUser?.role] || T.primary;
  const [modal, setModal] = useState(null); // 'checkin' | 'checkout' | null

  const holidayName = getHolidayName?.() || null;

  // Status config
  const statusConfig = {
    sunday:         { label: 'Sunday Holiday 🌴', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    holiday:        { label: `Holiday 🎉 ${holidayName || ''}`, bg: '#fefce8', color: '#854d0e', border: '#fde047' },
    not_checked_in: { label: 'Not Checked In', bg: T.dangerLight, color: T.danger, border: `${T.danger}30` },
    checked_in:     { label: `Checked In · ${formatTime(todayRecord?.checkinTime)}`, bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    checked_out:    { label: `Done · ${formatTime(todayRecord?.checkoutTime)} · ${todayRecord?.workHours ? `${todayRecord.workHours}h` : ''}`, bg: T.primaryLight, color: T.primary, border: T.primaryMid },
  };
  const sc = statusConfig[todayStatus] || statusConfig.not_checked_in;

  return (
    <>
      <header style={{ background: T.surface, borderBottom: `1.5px solid ${T.border}`, padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(124,58,237,0.05)', flexShrink: 0, gap: 16 }}>

        {/* Left: Title */}
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 19, color: T.textPrimary, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 12, color: T.textSecondary, margin: '1px 0 0' }}>{subtitle}</p>}
        </div>

        {/* Center: Attendance widget */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'center' }}>
          {/* Live clock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: T.bg, borderRadius: 99, border: `1.5px solid ${T.border}` }}>
            <Clock size={13} color={T.textMuted} />
            <LiveClock />
          </div>

          {/* Status badge */}
          <div style={{ padding: '6px 14px', borderRadius: 99, background: sc.bg, color: sc.color, border: `1.5px solid ${sc.border}`, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
            {sc.label}
          </div>

          {/* Check-in / Check-out button */}
          {todayStatus === 'not_checked_in' && (
            <button
              onClick={() => setModal('checkin')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 99, background: '#059669', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, boxShadow: '0 4px 12px rgba(5,150,105,0.35)' }}
            >
              <CheckCircle2 size={14} /> Check In
            </button>
          )}
          {todayStatus === 'checked_in' && (
            <button
              onClick={() => setModal('checkout')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 99, background: T.primary, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, boxShadow: T.btnShadow }}
            >
              <XCircle size={14} /> Check Out
            </button>
          )}
          {todayStatus === 'checked_out' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.success }}>
              <CheckCircle2 size={14} /> Work done!
            </div>
          )}
        </div>

        {/* Right: Role + Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ padding: '4px 12px', borderRadius: 99, background: `${roleColor}15`, color: roleColor, fontSize: 11, fontWeight: 700, border: `1px solid ${roleColor}30`, whiteSpace: 'nowrap' }}>
            {ROLE_LABELS[currentUser?.role]}
          </span>
          <button
            onClick={() => navigate('/profile')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 10, transition: 'background 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = T.primaryLight; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >
            <AvatarCircle name={currentUser?.name} avatar={currentUser?.avatar} color={roleColor} avatarUrl={currentUser?.avatarUrl} size={32} />
            <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, fontFamily: 'DM Sans, sans-serif', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.name}</span>
          </button>
          <button onClick={logout} title="Sign out" style={{ background: T.dangerLight, border: 'none', borderRadius: 10, padding: '7px 12px', cursor: 'pointer', color: T.danger, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600 }}>
            <LogOut size={13} /> Out
          </button>
        </div>
      </header>

      {/* Modal */}
      {modal && (
        <CheckModal
          type={modal}
          todayRecord={todayRecord}
          holidays={holidays}
          onConfirm={modal === 'checkin' ? checkIn : checkOut}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
