import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { T, ROLE_LABELS, ROLE_COLORS } from '../../utils/theme';
import {
  LayoutDashboard, Globe, MapPin, DollarSign, Search, Phone,
  Video, Share2, Users, Settings, ChevronLeft, ChevronRight, LogOut,
  FileSpreadsheet,
} from 'lucide-react';

const NAV = {
  admin: [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/settings', icon: Settings, label: 'Team & Settings' },
    { path: '/admin/export', icon: FileSpreadsheet, label: 'Export Report' },
  ],
  webmanager: [
    { path: '/web', icon: Globe, label: 'Website' },
    { path: '/web/gmb', icon: MapPin, label: 'Google My Business' },
    { path: '/web/ads', icon: DollarSign, label: 'Google Ads' },
    { path: '/web/seo', icon: Search, label: 'SEO' },
  ],
  telecaller: [
    { path: '/tele', icon: Phone, label: 'Call Logs' },
  ],
  videoeditor: [
    { path: '/video', icon: Video, label: 'Video Logs' },
  ],
  socialmanager: [
    { path: '/social', icon: Share2, label: 'Social Logs' },
  ],
};

export function Sidebar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!currentUser) return null;

  const links = NAV[currentUser.role] || [];
  const roleColor = ROLE_COLORS[currentUser.role] || T.primary;

  return (
    <aside style={{
      width: collapsed ? 64 : 236,
      minHeight: '100vh',
      background: T.surface,
      borderRight: `1.5px solid ${T.border}`,
      boxShadow: '2px 0 16px rgba(124,58,237,0.06)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
      flexShrink: 0,
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 12px' : '22px 20px',
        borderBottom: `1.5px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12, flexShrink: 0,
          background: `linear-gradient(135deg, ${T.primary}, #a78bfa)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
        }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 15, fontFamily: 'Outfit, sans-serif' }}>A</span>
        </div>
        {!collapsed && (
          <span style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 800,
            fontSize: 17, color: T.textPrimary, whiteSpace: 'nowrap',
          }}>Aikya Digital</span>
        )}
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {links.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path || (path !== '/admin' && path !== '/web' && path !== '/tele' && path !== '/video' && path !== '/social' && location.pathname.startsWith(path));
          const exactActive = location.pathname === path;
          const isActive = path.split('/').length > 2 ? location.pathname === path : exactActive || (path === location.pathname);

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '10px 14px' : '10px 14px',
                borderRadius: 12, border: 'none', cursor: 'pointer',
                background: isActive ? T.primaryLight : 'transparent',
                color: isActive ? T.primary : T.textSecondary,
                fontWeight: isActive ? 600 : 500,
                fontSize: 14, fontFamily: 'DM Sans, sans-serif',
                textAlign: 'left', width: '100%',
                transition: 'background 0.15s, color 0.15s',
                overflow: 'hidden', whiteSpace: 'nowrap',
                borderLeft: isActive ? `3px solid ${T.primary}` : '3px solid transparent',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = T.primaryLight + '80'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User Info */}
      <div style={{
        padding: collapsed ? '12px 10px' : '14px 16px',
        borderTop: `1.5px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12, flexShrink: 0,
          background: roleColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: 13, fontFamily: 'Outfit, sans-serif',
          boxShadow: `0 4px 10px ${roleColor}40`,
        }}>
          {currentUser.avatar}
        </div>
        {!collapsed && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, truncate: true, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser.name}
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>
              {ROLE_LABELS[currentUser.role]}
            </div>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={logout}
            title="Logout"
            style={{
              background: T.dangerLight, border: 'none', borderRadius: 8,
              width: 28, height: 28, cursor: 'pointer', color: T.danger,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <LogOut size={13} />
          </button>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed((p) => !p)}
        style={{
          position: 'absolute', top: 24, right: -13,
          width: 26, height: 26, borderRadius: '50%',
          background: T.surface, border: `1.5px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: T.primary, boxShadow: T.cardShadow,
          zIndex: 20,
        }}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </aside>
  );
}
