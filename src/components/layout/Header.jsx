import { useAuth } from '../../context/AuthContext';
import { T, ROLE_LABELS } from '../../utils/theme';
import { LogOut } from 'lucide-react';

export function Header({ title, subtitle }) {
  const { currentUser, logout } = useAuth();

  return (
    <header style={{
      padding: '16px 28px',
      background: 'rgba(240,238,255,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: `1.5px solid ${T.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 5,
    }}>
      <div>
        <h1 style={{
          fontFamily: 'Outfit, sans-serif', fontWeight: 800,
          fontSize: 20, color: T.textPrimary, lineHeight: 1.2,
        }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: T.textSecondary, marginTop: 2 }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{currentUser?.name}</span>
          <span style={{ fontSize: 11, color: T.textMuted }}>{ROLE_LABELS[currentUser?.role]}</span>
        </div>
        <button
          onClick={logout}
          title="Logout"
          style={{
            background: T.dangerLight, border: 'none', borderRadius: 10,
            width: 34, height: 34, cursor: 'pointer', color: T.danger,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
