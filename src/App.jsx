import { Navigate, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { T } from './utils/theme';

import Login          from './pages/Login';
import Dashboard      from './pages/manager/Dashboard';
import AllTasks       from './pages/manager/AllTasks';
import Team           from './pages/manager/Team';
import AttendanceAdmin from './pages/manager/AttendanceAdmin';
import MyTasks        from './pages/member/MyTasks';
import TaskDetail     from './pages/TaskDetail';
import Profile        from './pages/Profile';
import Attendance     from './pages/Attendance';

// ── Loading splash ─────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 30% 20%, #ddd6fe 0%, #f0eeff 40%, #e0f2fe 100%)', gap: 16 }}>
      <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(124,58,237,0.35)', animation: 'pulse 1.4s ease-in-out infinite' }}>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 24, fontFamily: 'Outfit, sans-serif' }}>A</span>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(0.94)} }`}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: T.textPrimary }}>Aikya Task Portal</div>
        <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 4 }}>Loading…</div>
      </div>
    </div>
  );
}

// ── Role-based home redirect ───────────────────────────────────
function RoleHome() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Navigate to={currentUser.role === 'admin' ? '/dashboard' : '/my-tasks'} replace />;
}

// ── Route guards ───────────────────────────────────────────────
function RequireAuth({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== 'admin') return <Navigate to="/my-tasks" replace />;
  return children;
}

// ── App ────────────────────────────────────────────────────────
export default function App() {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/"      element={<RoleHome />} />

      {/* Manager (admin) routes */}
      <Route path="/dashboard"   element={<RequireAdmin><Dashboard /></RequireAdmin>} />
      <Route path="/tasks"       element={<RequireAdmin><AllTasks /></RequireAdmin>} />
      <Route path="/team"        element={<RequireAdmin><Team /></RequireAdmin>} />
      <Route path="/attendance-admin" element={<RequireAdmin><AttendanceAdmin /></RequireAdmin>} />

      {/* Member routes */}
      <Route path="/my-tasks"    element={<RequireAuth><MyTasks /></RequireAuth>} />
      <Route path="/attendance"  element={<RequireAuth><Attendance /></RequireAuth>} />

      {/* Shared */}
      <Route path="/tasks/:id"   element={<RequireAuth><TaskDetail /></RequireAuth>} />
      <Route path="/profile"     element={<RequireAuth><Profile /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
