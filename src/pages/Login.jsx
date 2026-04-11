import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { T } from '../utils/theme';
import { Input, Button, Alert } from '../components/ui';
import { Eye, EyeOff, CheckSquare } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setError('');
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    navigate(result.user.role === 'admin' ? '/dashboard' : '/my-tasks');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 30% 20%, #ddd6fe 0%, #f0eeff 40%, #e0f2fe 100%)', padding: 20 }}>

      {/* Background blobs */}
      <div style={{ position: 'fixed', top: -100, left: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(167,139,250,0.18)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -80, right: -60, width: 360, height: 360, borderRadius: '50%', background: 'rgba(125,211,252,0.14)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative' }}>
        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderRadius: 28, border: '1.5px solid rgba(196,181,253,0.5)', boxShadow: '0 20px 60px rgba(124,58,237,0.14)', padding: '44px 40px' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(124,58,237,0.35)' }}>
              <CheckSquare size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 20, color: T.textPrimary, lineHeight: 1.2 }}>Aikya Task Portal</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 1 }}>HR Task Management System</div>
            </div>
          </div>

          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 22, color: T.textPrimary, margin: '0 0 6px' }}>
            Welcome back 👋
          </h2>
          <p style={{ fontSize: 14, color: T.textSecondary, marginBottom: 28 }}>
            Sign in to manage tasks and track your team's progress.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              id="login-email"
            />

            {/* Password with toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="login-password" style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary }}>
                Password <span style={{ color: T.danger }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{ width: '100%', padding: '10px 44px 10px 14px', boxSizing: 'border-box', borderRadius: 12, border: `1.5px solid ${T.border}`, background: '#faf9ff', fontSize: 14, color: T.textPrimary, outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
                />
                <button type="button" onClick={() => setShowPass((p) => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex', alignItems: 'center' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <Alert type="danger">{error}</Alert>}

            <Button type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </Button>
          </form>

          <div style={{ marginTop: 24, padding: '16px', background: T.primaryLight, borderRadius: 14, border: `1px solid ${T.border}` }}>
            <p style={{ fontSize: 12, color: T.textSecondary, margin: 0, textAlign: 'center' }}>
              Don't have an account? Contact your <strong>Manager</strong> to create one.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 11, color: T.textMuted, marginTop: 16 }}>
          Aikya Task Portal © {new Date().getFullYear()} · Secure HR System
        </p>
      </div>
    </div>
  );
}
