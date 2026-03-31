import { T } from '../../utils/theme';

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, className = '' }) {
  return (
    <div
      className={className}
      style={{
        background: T.surface,
        borderRadius: 20,
        boxShadow: T.cardShadow,
        border: `1.5px solid ${T.border}`,
        padding: '24px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color = T.primary, sub }) {
  return (
    <div
      style={{
        background: T.surface,
        borderRadius: 20,
        boxShadow: T.cardShadow,
        border: `1.5px solid ${T.border}`,
        padding: '20px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = T.cardShadowHover; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = T.cardShadow; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 16, flexShrink: 0,
        background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color: T.textPrimary, fontFamily: 'Outfit, sans-serif', lineHeight: 1.1 }}>
          {value ?? '—'}
        </div>
        <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({ children, onClick, variant = 'primary', size = 'md', disabled = false, style = {}, type = 'button' }) {
  const sizes = { sm: { padding: '6px 14px', fontSize: 13 }, md: { padding: '10px 22px', fontSize: 14 }, lg: { padding: '13px 28px', fontSize: 15 } };
  const variants = {
    primary: { background: T.primary, color: '#fff', boxShadow: T.btnShadow, border: 'none' },
    secondary: { background: T.primaryLight, color: T.primary, border: `1.5px solid ${T.primaryMid}`, boxShadow: 'none' },
    danger: { background: T.dangerLight, color: T.danger, border: `1.5px solid ${T.danger}30`, boxShadow: 'none' },
    ghost: { background: 'transparent', color: T.textSecondary, border: `1.5px solid ${T.border}`, boxShadow: 'none' },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        ...sizes[size],
        ...variants[variant],
        borderRadius: 12,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        fontFamily: 'Outfit, sans-serif',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        transition: 'opacity 0.15s, transform 0.15s',
        ...style,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.opacity = '0.88'; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.opacity = '1'; }}
    >
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, type = 'text', value, onChange, placeholder, required, min, max, step, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary }}>
          {label}{required && <span style={{ color: T.danger }}> *</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        style={{
          padding: '10px 14px',
          borderRadius: 12,
          border: `1.5px solid ${T.border}`,
          background: '#faf9ff',
          fontSize: 14,
          color: T.textPrimary,
          outline: 'none',
          boxShadow: T.inputShadow,
          fontFamily: 'DM Sans, sans-serif',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => { e.target.style.borderColor = T.primaryMid; }}
        onBlur={(e) => { e.target.style.borderColor = T.border; }}
      />
    </div>
  );
}

// ── Textarea ──────────────────────────────────────────────────────────────────
export function Textarea({ label, value, onChange, placeholder, rows = 3, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary }}>{label}</label>}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        style={{
          padding: '10px 14px',
          borderRadius: 12,
          border: `1.5px solid ${T.border}`,
          background: '#faf9ff',
          fontSize: 14,
          color: T.textPrimary,
          outline: 'none',
          boxShadow: T.inputShadow,
          fontFamily: 'DM Sans, sans-serif',
          resize: 'vertical',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => { e.target.style.borderColor = T.primaryMid; }}
        onBlur={(e) => { e.target.style.borderColor = T.border; }}
      />
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ label, value, onChange, options = [], required, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary }}>
          {label}{required && <span style={{ color: T.danger }}> *</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        required={required}
        style={{
          padding: '10px 14px',
          borderRadius: 12,
          border: `1.5px solid ${T.border}`,
          background: '#faf9ff',
          fontSize: 14,
          color: T.textPrimary,
          outline: 'none',
          boxShadow: T.inputShadow,
          fontFamily: 'DM Sans, sans-serif',
          cursor: 'pointer',
        }}
        onFocus={(e) => { e.target.style.borderColor = T.primaryMid; }}
        onBlur={(e) => { e.target.style.borderColor = T.border; }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, color = T.primary }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 99,
      background: `${color}18`, color, fontSize: 11, fontWeight: 700,
      border: `1px solid ${color}30`,
    }}>
      {children}
    </span>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(30,21,53,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: T.surface, borderRadius: 24, width: '100%', maxWidth: width,
          boxShadow: '0 20px 60px rgba(124,58,237,0.18)', border: `1.5px solid ${T.border}`,
          maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          padding: '20px 24px', borderBottom: `1.5px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 17, color: T.textPrimary }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              background: T.primaryLight, border: 'none', borderRadius: 10,
              width: 32, height: 32, cursor: 'pointer', color: T.primary,
              fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}

// ── SectionTitle ──────────────────────────────────────────────────────────────
export function SectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 18, color: T.textPrimary }}>{children}</h2>
      {action}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, message }) {
  return (
    <div style={{
      padding: '48px 24px', textAlign: 'center',
      color: T.textMuted, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
    }}>
      {Icon && <Icon size={40} color={T.primaryMid} />}
      <p style={{ fontSize: 14 }}>{message || 'No entries yet. Add your first entry above.'}</p>
    </div>
  );
}

// ── Alert ─────────────────────────────────────────────────────────────────────
export function Alert({ type = 'info', children }) {
  const styles = {
    info: { bg: T.infoLight, color: T.info },
    success: { bg: T.successLight, color: T.success },
    warning: { bg: T.warningLight, color: T.warning },
    danger: { bg: T.dangerLight, color: T.danger },
  };
  const s = styles[type];
  return (
    <div style={{
      background: s.bg, color: s.color, padding: '12px 16px',
      borderRadius: 12, fontSize: 13, fontWeight: 500,
      border: `1px solid ${s.color}30`,
    }}>
      {children}
    </div>
  );
}

// ── FormGrid ──────────────────────────────────────────────────────────────────
export function FormGrid({ children, cols = 2 }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 16,
    }}>
      {children}
    </div>
  );
}

// ── DataTable ─────────────────────────────────────────────────────────────────
export function DataTable({ columns, rows, onDelete, currentUserId, isAdmin }) {
  if (!rows.length) return <EmptyState message="No entries logged yet." />;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px', fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{
                textAlign: 'left', padding: '8px 12px',
                color: T.textSecondary, fontWeight: 600, fontSize: 12,
                whiteSpace: 'nowrap',
              }}>{c.label}</th>
            ))}
            {onDelete && <th style={{ width: 40 }}></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} style={{
              background: T.surface,
              borderRadius: 12,
              boxShadow: '0 1px 6px rgba(124,58,237,0.05)',
            }}>
              {columns.map((c) => (
                <td key={c.key} style={{
                  padding: '10px 12px',
                  color: T.textPrimary,
                  borderTop: `1.5px solid ${T.border}`,
                  borderBottom: `1.5px solid ${T.border}`,
                  whiteSpace: 'nowrap',
                }}>
                  {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                </td>
              ))}
              {onDelete && (isAdmin || row.userId === currentUserId) && (
                <td style={{ padding: '10px 8px', borderTop: `1.5px solid ${T.border}`, borderBottom: `1.5px solid ${T.border}` }}>
                  <button
                    onClick={() => onDelete(row.id)}
                    style={{
                      background: T.dangerLight, border: 'none', borderRadius: 8,
                      width: 28, height: 28, cursor: 'pointer', color: T.danger,
                      fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >✕</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
