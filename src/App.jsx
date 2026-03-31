import { Navigate, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { T } from './utils/theme';

import Login                from './pages/Login';
import AdminDashboard       from './pages/admin/Dashboard';
import AdminSettings        from './pages/admin/Settings';
import ExportPage           from './pages/admin/ExportPage';
import WebManagerDashboard  from './pages/webmanager/Dashboard';
import TelecallerDashboard  from './pages/telecaller/Dashboard';
import VideoEditorDashboard from './pages/videoeditor/Dashboard';
import SocialManagerDashboard from './pages/socialmanager/Dashboard';

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 30% 20%, #ddd6fe 0%, #f0eeff 40%, #e0f2fe 100%)',
      gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 6px 18px rgba(124,58,237,0.35)',
        animation: 'pulse 1.4s ease-in-out infinite',
      }}>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 22, fontFamily: 'Outfit, sans-serif' }}>A</span>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(0.94)} }`}</style>
      <span style={{ fontSize: 14, color: T.textSecondary }}>Loading Aikya…</span>
    </div>
  );
}

function RoleHome() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  const map = { admin: '/admin', webmanager: '/web', telecaller: '/tele', videoeditor: '/video', socialmanager: '/social' };
  return <Navigate to={map[currentUser.role] || '/login'} replace />;
}

function RequireAuth({ children, role }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (role && currentUser.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/"      element={<RoleHome />} />

      <Route path="/admin"          element={<RequireAuth role="admin"><AdminDashboard /></RequireAuth>} />
      <Route path="/admin/settings" element={<RequireAuth role="admin"><AdminSettings /></RequireAuth>} />
      <Route path="/admin/export"   element={<RequireAuth role="admin"><ExportPage /></RequireAuth>} />

      <Route path="/web"      element={<RequireAuth role="webmanager"><WebManagerDashboard /></RequireAuth>} />
      <Route path="/web/gmb"  element={<RequireAuth role="webmanager"><WebManagerDashboard /></RequireAuth>} />
      <Route path="/web/ads"  element={<RequireAuth role="webmanager"><WebManagerDashboard /></RequireAuth>} />
      <Route path="/web/seo"  element={<RequireAuth role="webmanager"><WebManagerDashboard /></RequireAuth>} />

      <Route path="/tele"   element={<RequireAuth role="telecaller"><TelecallerDashboard /></RequireAuth>} />
      <Route path="/video"  element={<RequireAuth role="videoeditor"><VideoEditorDashboard /></RequireAuth>} />
      <Route path="/social" element={<RequireAuth role="socialmanager"><SocialManagerDashboard /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
