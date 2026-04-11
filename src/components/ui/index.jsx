import { T, STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '../../utils/theme';
import {
  CheckCircle2, Clock, AlertCircle, ArrowUp, Minus, ArrowDown,
  FileText, ImageIcon, File, X,
} from 'lucide-react';

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: T.surface,
        borderRadius: 20,
        boxShadow: T.cardShadow,
        border: `1.5px solid ${T.border}`,
        padding: '24px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s, transform 0.2s',
        ...style,
      }}
      onMouseEnter={onClick ? (e) => { e.currentTarget.style.boxShadow = T.cardShadowHover; e.currentTarget.style.transform = 'translateY(-2px)'; } : undefined}
      onMouseLeave={onClick ? (e) => { e.currentTarget.style.boxShadow = T.cardShadow; e.currentTarget.style.transform = 'translateY(0)'; } : undefined}
    >
      {children}
    </div>
  );
}

// ── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color = T.primary, sub }) {
  return (
    <div
      style={{
        background: T.surface, borderRadius: 20,
        boxShadow: T.cardShadow, border: `1.5px solid ${T.border}`,
        padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16,
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
        <div style={{ fontSize: 26, fontWeight: 800, color: T.textPrimary, fontFamily: 'Outfit, sans-serif', lineHeight: 1.1 }}>{value ?? '—'}</div>
        <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({ children, onClick, variant = 'primary', size = 'md', disabled = false, style = {}, type = 'button' }) {
  const sizes    = { sm: { padding: '6px 14px', fontSize: 13 }, md: { padding: '10px 22px', fontSize: 14 }, lg: { padding: '13px 28px', fontSize: 15 } };
  const variants = {
    primary:   { background: T.primary,      color: '#fff',           boxShadow: T.btnShadow, border: 'none' },
    secondary: { background: T.primaryLight, color: T.primary,        border: `1.5px solid ${T.primaryMid}`, boxShadow: 'none' },
    danger:    { background: T.dangerLight,  color: T.danger,         border: `1.5px solid ${T.danger}30`,   boxShadow: 'none' },
    ghost:     { background: 'transparent',  color: T.textSecondary,  border: `1.5px solid ${T.border}`,     boxShadow: 'none' },
    success:   { background: T.successLight, color: T.success,        border: `1.5px solid ${T.success}30`,  boxShadow: 'none' },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        ...sizes[size], ...variants[variant],
        borderRadius: 12, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        fontFamily: 'Outfit, sans-serif',
        display: 'inline-flex', alignItems: 'center', gap: 6,
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
export function Input({ label, type = 'text', value, onChange, placeholder, required, min, max, step, style = {}, id }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary }}>
          {label}{required && <span style={{ color: T.danger }}> *</span>}
        </label>
      )}
      <input
        id={id} type={type} value={value} onChange={onChange}
        placeholder={placeholder} required={required} min={min} max={max} step={step}
        style={{
          padding: '10px 14px', borderRadius: 12,
          border: `1.5px solid ${T.border}`, background: '#faf9ff',
          fontSize: 14, color: T.textPrimary, outline: 'none',
          boxShadow: T.inputShadow, fontFamily: 'DM Sans, sans-serif',
          transition: 'border-color 0.15s', width: '100%', boxSizing: 'border-box',
        }}
        onFocus={(e) => { e.target.style.borderColor = T.primaryMid; }}
        onBlur={(e)  => { e.target.style.borderColor = T.border; }}
      />
    </div>
  );
}

// ── Textarea ──────────────────────────────────────────────────────────────────
export function Textarea({ label, value, onChange, placeholder, rows = 3, style = {}, id }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && <label htmlFor={id} style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary }}>{label}</label>}
      <textarea
        id={id} value={value} onChange={onChange} placeholder={placeholder} rows={rows}
        style={{
          padding: '10px 14px', borderRadius: 12,
          border: `1.5px solid ${T.border}`, background: '#faf9ff',
          fontSize: 14, color: T.textPrimary, outline: 'none',
          boxShadow: T.inputShadow, fontFamily: 'DM Sans, sans-serif',
          resize: 'vertical', transition: 'border-color 0.15s',
          width: '100%', boxSizing: 'border-box',
        }}
        onFocus={(e) => { e.target.style.borderColor = T.primaryMid; }}
        onBlur={(e)  => { e.target.style.borderColor = T.border; }}
      />
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ label, value, onChange, options = [], required, style = {}, id }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary }}>
          {label}{required && <span style={{ color: T.danger }}> *</span>}
        </label>
      )}
      <select
        id={id} value={value} onChange={onChange} required={required}
        style={{
          padding: '10px 14px', borderRadius: 12,
          border: `1.5px solid ${T.border}`, background: '#faf9ff',
          fontSize: 14, color: T.textPrimary, outline: 'none',
          boxShadow: T.inputShadow, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
          width: '100%', boxSizing: 'border-box',
        }}
        onFocus={(e) => { e.target.style.borderColor = T.primaryMid; }}
        onBlur={(e)  => { e.target.style.borderColor = T.border; }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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

// ── StatusBadge ───────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || T.textMuted;
  const label = STATUS_LABELS[status] || status;
  const icons = { pending: Clock, in_progress: AlertCircle, completed: CheckCircle2 };
  const Icon  = icons[status] || Clock;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 12px', borderRadius: 99,
      background: `${color}15`, color, fontSize: 12, fontWeight: 700,
      border: `1.5px solid ${color}30`,
    }}>
      <Icon size={13} />
      {label}
    </span>
  );
}

// ── PriorityBadge ─────────────────────────────────────────────────────────────
export function PriorityBadge({ priority }) {
  const color = PRIORITY_COLORS[priority] || T.textMuted;
  const label = PRIORITY_LABELS[priority] || priority;
  const icons = { high: ArrowUp, medium: Minus, low: ArrowDown };
  const Icon  = icons[priority] || Minus;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 99,
      background: `${color}15`, color, fontSize: 11, fontWeight: 700,
      border: `1px solid ${color}25`,
    }}>
      <Icon size={11} />
      {label}
    </span>
  );
}

// ── AvatarCircle ──────────────────────────────────────────────────────────────
export function AvatarCircle({ name, avatar, color = T.primary, size = 36, avatarUrl }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl} alt={name}
        style={{ width: size, height: size, borderRadius: size / 2.5, objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2.8, flexShrink: 0,
      background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 800, fontSize: size * 0.38, fontFamily: 'Outfit, sans-serif',
      boxShadow: `0 4px 10px ${color}40`,
    }}>
      {avatar || (name ? name.charAt(0).toUpperCase() : '?')}
    </div>
  );
}

// ── TaskCard ──────────────────────────────────────────────────────────────────
export function TaskCard({ task, onClick }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  return (
    <div
      onClick={onClick}
      style={{
        background: T.surface, borderRadius: 20,
        boxShadow: T.cardShadow, border: `1.5px solid ${isOverdue ? T.danger + '40' : T.border}`,
        padding: '18px 20px', cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = T.cardShadowHover; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = T.cardShadow; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: T.textPrimary, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.title}
          </div>
          {task.description && (
            <div style={{ fontSize: 13, color: T.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.description}
            </div>
          )}
        </div>
        <PriorityBadge priority={task.priority} />
      </div>

      {/* Status + assignee row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <StatusBadge status={task.status} />
        {task.assigneeName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <AvatarCircle name={task.assigneeName} avatar={task.assigneeAvatar} color={task.assigneeColor} size={26} />
            <span style={{ fontSize: 12, color: T.textSecondary, fontWeight: 500 }}>{task.assigneeName}</span>
          </div>
        )}
      </div>

      {/* Footer row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
        <span style={{ fontSize: 12, color: isOverdue ? T.danger : T.textMuted }}>
          {task.dueDate ? `📅 Due: ${new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}${isOverdue ? ' ⚠️ Overdue' : ''}` : 'No due date'}
        </span>
        {task.notesCount > 0 && (
          <span style={{ fontSize: 12, color: T.textMuted }}>💬 {task.notesCount} note{task.notesCount !== 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  );
}

// ── NoteItem ──────────────────────────────────────────────────────────────────
export function NoteItem({ note, onDelete, canDelete }) {
  const date = new Date(note.createdAt);
  const formattedDate = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const formattedTime = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
      {/* Timeline dot */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <AvatarCircle name={note.userName} avatar={note.userAvatar} color={note.userColor} size={36} />
        <div style={{ flex: 1, width: 2, background: T.border, marginTop: 8, minHeight: 20 }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, background: T.primaryLight, borderRadius: 16, padding: '14px 16px', border: `1.5px solid ${T.border}`, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
          <div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14, color: T.textPrimary }}>{note.userName}</span>
            <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 8 }}>{note.userRole === 'admin' ? '👑 Manager' : '👤 Member'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: T.textMuted }}>{formattedDate} · {formattedTime}</span>
            {canDelete && (
              <button onClick={() => onDelete(note.id)} style={{ background: T.dangerLight, border: 'none', borderRadius: 8, width: 26, height: 26, cursor: 'pointer', color: T.danger, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {note.text && <p style={{ fontSize: 14, color: T.textPrimary, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{note.text}</p>}

        {note.attachments?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: note.text ? 12 : 0 }}>
            {note.attachments.map((att, i) => (
              <FileAttachment key={i} attachment={att} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── FileAttachment ────────────────────────────────────────────────────────────
export function FileAttachment({ attachment, onRemove }) {
  const isImage = attachment.type?.startsWith('image/');
  const isPDF   = attachment.type === 'application/pdf';
  const Icon    = isImage ? ImageIcon : isPDF ? FileText : File;

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', borderRadius: 10,
        background: T.surface, border: `1.5px solid ${T.border}`,
        textDecoration: 'none', color: T.primary, fontSize: 12, fontWeight: 600,
        transition: 'background 0.15s',
        maxWidth: 200,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = T.primaryLight; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = T.surface; }}
      onClick={(e) => { if (onRemove) e.preventDefault(); }}
    >
      <Icon size={14} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>
        {attachment.name}
      </span>
      {onRemove && (
        <X size={12} style={{ flexShrink: 0, cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); onRemove(); }} />
      )}
    </a>
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
        <div style={{ padding: '20px 24px', borderBottom: `1.5px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 17, color: T.textPrimary }}>{title}</span>
          <button onClick={onClose} style={{ background: T.primaryLight, border: 'none', borderRadius: 10, width: 32, height: 32, cursor: 'pointer', color: T.primary, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
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
      <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 18, color: T.textPrimary, margin: 0 }}>{children}</h2>
      {action}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, message, sub }) {
  return (
    <div style={{ padding: '60px 24px', textAlign: 'center', color: T.textMuted, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {Icon && <div style={{ width: 64, height: 64, borderRadius: 20, background: T.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={28} color={T.primaryMid} /></div>}
      <p style={{ fontSize: 15, fontWeight: 600, color: T.textSecondary, margin: 0 }}>{message || 'Nothing here yet.'}</p>
      {sub && <p style={{ fontSize: 13, margin: 0 }}>{sub}</p>}
    </div>
  );
}

// ── Alert ─────────────────────────────────────────────────────────────────────
export function Alert({ type = 'info', children }) {
  const styles = {
    info:    { bg: T.infoLight,    color: T.info    },
    success: { bg: T.successLight, color: T.success },
    warning: { bg: T.warningLight, color: T.warning },
    danger:  { bg: T.dangerLight,  color: T.danger  },
  };
  const s = styles[type];
  return (
    <div style={{ background: s.bg, color: s.color, padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 500, border: `1px solid ${s.color}30` }}>
      {children}
    </div>
  );
}

// ── FormGrid ──────────────────────────────────────────────────────────────────
export function FormGrid({ children, cols = 2 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
      {children}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 24, color = T.primary }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        border: `3px solid ${color}30`,
        borderTop: `3px solid ${color}`,
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  );
}
