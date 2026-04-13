// Design tokens — Aikya Task Portal Claymorphism palette
export const T = {
  // Base
  bg:           '#f0eeff',
  surface:      '#ffffff',
  border:       '#e9e3ff',
  // Primary violet
  primary:      '#7c3aed',
  primaryLight: '#ede9fe',
  primaryMid:   '#c4b5fd',
  // Role colors
  managerColor: '#7c3aed',
  memberColor:  '#059669',
  // Status colors
  statusPending:    '#f59e0b',
  statusInProgress: '#3b82f6',
  statusCompleted:  '#10b981',
  // Priority colors
  priorityLow:    '#10b981',
  priorityMedium: '#f59e0b',
  priorityHigh:   '#ef4444',
  // Semantic
  success:      '#10b981',
  successLight: '#d1fae5',
  warning:      '#f59e0b',
  warningLight: '#fef3c7',
  danger:       '#ef4444',
  dangerLight:  '#fee2e2',
  info:         '#3b82f6',
  infoLight:    '#dbeafe',
  // Text
  textPrimary:   '#1e1535',
  textSecondary: '#6b7280',
  textMuted:     '#9ca3af',
  // Claymorphism shadows
  cardShadow:      '0 4px 24px rgba(124,58,237,0.08), 0 1px 4px rgba(124,58,237,0.06)',
  cardShadowHover: '0 8px 32px rgba(124,58,237,0.14), 0 2px 8px rgba(124,58,237,0.08)',
  inputShadow:     'inset 0 2px 6px rgba(124,58,237,0.06)',
  btnShadow:       '0 4px 14px rgba(124,58,237,0.35)',
};

export const ROLE_LABELS = {
  admin:  'Manager',
  member: 'Team Member',
};

export const ROLE_COLORS = {
  admin:  '#7c3aed',
  member: '#059669',
};

export const STATUS_LABELS = {
  new: 'New',
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  need_clarification: 'Need Clarification',
  pending_requirements: 'Pending Requirements',
  paused: 'Paused',
};

export const STATUS_COLORS = {
  new: '#8b5cf6',
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  completed: '#10b981',
  need_clarification: '#ec4899',
  pending_requirements: '#f97316',
  paused: '#64748b',
};

export const PRIORITY_LABELS = {
  low:    'Low',
  medium: 'Medium',
  high:   'High',
};

export const PRIORITY_COLORS = {
  low:    '#10b981',
  medium: '#f59e0b',
  high:   '#ef4444',
};
