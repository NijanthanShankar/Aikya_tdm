import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { T, ROLE_LABELS, ROLE_COLORS } from '../../utils/theme';
import {
  LayoutDashboard, CheckSquare, Users, User, LogOut,
  ChevronLeft, ChevronRight, ClipboardList, CalendarCheck,
} from 'lucide-react';
import { AvatarCircle } from '../ui';

const NAV = {
  admin: [
    { path: '/dashboard',          icon: LayoutDashboard, label: 'Dashboard'   },
    { path: '/tasks',              icon: ClipboardList,   label: 'All Tasks'   },
    { path: '/team',               icon: Users,           label: 'Team'        },
    { path: '/attendance-admin',   icon: CalendarCheck,   label: 'Attendance'  },
    { path: '/profile',            icon: User,            label: 'My Profile'  },
  ],
  member: [
    { path: '/my-tasks',   icon: CheckSquare, label: 'My Tasks'   },
    { path: '/attendance', icon: CalendarCheck, label: 'Attendance' },
    { path: '/profile',    icon: User,          label: 'My Profile' },
  ],
};

export function Sidebar() {
  const { currentUser, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!currentUser) return null;

  const links     = NAV[currentUser.role] || NAV.member;
  const roleColor = ROLE_COLORS[currentUser.role] || T.primary;

  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path) && path.length > 1);

  return (
    <aside style={{
      width: collapsed ? 64 : 236,
      minHeight: '100vh',
      background: T.surface,
      borderRight: `1.5px solid ${T.border}`,
      boxShadow: '2px 0 16px rgba(124,58,237,0.06)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
      flexShrink: 0, position: 'relative', zIndex: 10,
    }}>

      {/* Logo */}
      <div style={{ padding: collapsed ? '20px 14px' : '22px 20px', borderBottom: `1.5px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, flexShrink: 0, background: `linear-gradient(135deg, ${T.primary}, #a78bfa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 15, fontFamily: 'Outfit, sans-serif' }}>A</span>
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 15, color: T.textPrimary, whiteSpace: 'nowrap', lineHeight: 1.2 }}>Aikya Task</div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 11, color: T.textMuted, whiteSpace: 'nowrap' }}>HR Portal</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {links.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 12,
                border: 'none', cursor: 'pointer',
                background: active ? T.primaryLight : 'transparent',
                color: active ? T.primary : T.textSecondary,
                fontWeight: active ? 600 : 500,
                fontSize: 14, fontFamily: 'DM Sans, sans-serif',
                textAlign: 'left', width: '100%',
                transition: 'background 0.15s, color 0.15s',
                overflow: 'hidden', whiteSpace: 'nowrap',
                borderLeft: active ? `3px solid ${T.primary}` : '3px solid transparent',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = T.primaryLight + '80'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User info */}
      <div style={{ padding: collapsed ? '12px 10px' : '14px 16px', borderTop: `1.5px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
        <AvatarCircle
          name={currentUser.name}
          avatar={currentUser.avatar}
          color={roleColor}
          avatarUrl={currentUser.avatarUrl}
          size={36}
        />
        {!collapsed && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.name}</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>{ROLE_LABELS[currentUser.role]}</div>
          </div>
        )}
        {!collapsed && (
          <button onClick={logout} title="Logout" style={{ background: T.dangerLight, border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', color: T.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <LogOut size={13} />
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((p) => !p)}
        style={{ position: 'absolute', top: 24, right: -13, width: 26, height: 26, borderRadius: '50%', background: T.surface, border: `1.5px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.primary, boxShadow: T.cardShadow, zIndex: 20 }}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </aside>
  );
}
