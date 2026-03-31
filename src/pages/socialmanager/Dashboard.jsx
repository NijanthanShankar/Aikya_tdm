import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/layout/Layout';
import {
  Card, Button, Input, Textarea, Select,
  SectionTitle, DataTable, Badge, Alert, FormGrid, StatCard,
} from '../../components/ui';
import { T } from '../../utils/theme';
import { Share2, Eye, Heart, Users, Video, Film, Camera, Save } from 'lucide-react';

// ── Shared options ─────────────────────────────────────────────
const SOCIAL_PLATFORMS = [
  { value: '',          label: 'Select platform…' },
  { value: 'Instagram', label: 'Instagram'  },
  { value: 'Facebook',  label: 'Facebook'   },
  { value: 'LinkedIn',  label: 'LinkedIn'   },
  { value: 'Twitter/X', label: 'Twitter/X'  },
  { value: 'YouTube',   label: 'YouTube'    },
  { value: 'Pinterest', label: 'Pinterest'  },
  { value: 'TikTok',    label: 'TikTok'     },
];

const VIDEO_PLATFORMS = [
  { value: '',          label: 'Select platform…' },
  { value: 'YouTube',   label: 'YouTube'    },
  { value: 'Instagram', label: 'Instagram'  },
  { value: 'Facebook',  label: 'Facebook'   },
  { value: 'LinkedIn',  label: 'LinkedIn'   },
  { value: 'Testimonials',    label: 'Testimonials'     },
  { value: 'Posters',    label: 'Posters'     },
  { value: 'Stories',    label: 'Stories'     },
  { value: 'Other',     label: 'Other'      },
];

const VIDEO_STATUSES = [
  { value: 'completed',   label: 'Completed'   },
  { value: 'in-progress', label: 'In Progress'  },
  { value: 'review',      label: 'In Review'    },
  { value: 'delivered',   label: 'Delivered'    },
];

const STATUS_COLORS = {
  completed: T.success, 'in-progress': T.warning, review: T.info, delivered: T.primary,
};

const tabs = [
  { id: 'social', label: 'Social Media', icon: Share2 },
  { id: 'video',  label: 'Video Logs',   icon: Video  },
];

function TabBar({ active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, padding: 6, background: T.primaryLight, borderRadius: 14, marginBottom: 24 }}>
      {tabs.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => onChange(id)} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: active === id ? T.surface : 'transparent',
          color: active === id ? T.primary : T.textSecondary,
          fontWeight: active === id ? 700 : 500, fontSize: 13,
          boxShadow: active === id ? T.cardShadow : 'none',
          fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
        }}>
          <Icon size={14} />{label}
        </button>
      ))}
    </div>
  );
}

// ── Social Media Tab ───────────────────────────────────────────
function SocialTab({ currentUser }) {
  const { addEntry, deleteEntry, data } = useData();
  const blank = { date: new Date().toISOString().slice(0, 10), platform: '', postsPublished: '', reach: '', engagement: '', followersGained: '', notes: '' };
  const [form, setForm]     = useState(blank);
  const [saved, setSaved]   = useState(false);
  const [loading, setLoading] = useState(false);
  const f = k => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.platform) return;
    setLoading(true);
    await addEntry('socialEntries', form);
    setForm(blank);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const myEntries       = data.socialEntries.filter(e => e.userId === currentUser.id);
  const totalReach      = myEntries.reduce((s, e) => s + (Number(e.reach)            || 0), 0);
  const totalPosts      = myEntries.reduce((s, e) => s + (Number(e.postsPublished)   || 0), 0);
  const totalFollowers  = myEntries.reduce((s, e) => s + (Number(e.followersGained)  || 0), 0);
  const totalEngagement = myEntries.reduce((s, e) => s + (Number(e.engagement)       || 0), 0);

  const cols = [
    { key: 'date',           label: 'Date' },
    { key: 'platform',       label: 'Platform',    render: v => <Badge color={T.socialColor}>{v}</Badge> },
    { key: 'postsPublished', label: 'Posts' },
    { key: 'reach',          label: 'Reach' },
    { key: 'engagement',     label: 'Engagement' },
    { key: 'followersGained',label: 'Followers+' },
    { key: 'engRate',        label: 'Eng. Rate',   render: (_, r) => r.reach ? `${((r.engagement / r.reach) * 100).toFixed(1)}%` : '—' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {myEntries.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px,1fr))', gap: 14 }}>
          <StatCard label="Posts Published"  value={totalPosts}                   icon={Share2} color={T.socialColor} />
          <StatCard label="Total Reach"      value={totalReach.toLocaleString()}  icon={Eye}    color={T.primary}    />
          <StatCard label="Engagement"       value={totalEngagement.toLocaleString()} icon={Heart} color={T.danger}  />
          <StatCard label="Followers Gained" value={totalFollowers}               icon={Users}  color={T.success}    />
        </div>
      )}
      <Card>
        <SectionTitle>Log Social Media Activity</SectionTitle>
        {saved && <Alert type="success" style={{ marginBottom: 14 }}>Entry saved ✓</Alert>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormGrid>
            <Input label="Date" type="date" {...f('date')} required />
            <Select label="Platform" {...f('platform')} options={SOCIAL_PLATFORMS} required />
          </FormGrid>
          <FormGrid>
            <Input label="Posts Published"                    type="number" {...f('postsPublished')} placeholder="e.g. 3"     min="0" />
            <Input label="Reach"                              type="number" {...f('reach')}           placeholder="e.g. 12000" min="0" />
            <Input label="Engagement (likes+comments+shares)" type="number" {...f('engagement')}     placeholder="e.g. 480"   min="0" />
            <Input label="Followers Gained"                   type="number" {...f('followersGained')} placeholder="e.g. 25"   min="0" />
          </FormGrid>
          <Textarea label="Notes" {...f('notes')} placeholder="Top performing content, strategy notes..." rows={2} />
          <Button type="submit" disabled={loading} style={{ alignSelf: 'flex-start' }}>
            <Save size={14} /> {loading ? 'Saving…' : 'Save Entry'}
          </Button>
        </form>
      </Card>
      <Card>
        <SectionTitle>My Social Entries ({myEntries.length})</SectionTitle>
        <DataTable columns={cols} rows={myEntries} onDelete={id => deleteEntry('socialEntries', id)} currentUserId={currentUser.id} />
      </Card>
    </div>
  );
}

// ── Video Logs Tab ─────────────────────────────────────────────
function VideoTab({ currentUser }) {
  const { addEntry, deleteEntry, data } = useData();
  const blank = {
    date: new Date().toISOString().slice(0, 10),
    platform: '', videosEdited: '', videoShoots: '', status: 'completed', notes: '',
  };
  const [form, setForm]     = useState(blank);
  const [saved, setSaved]   = useState(false);
  const [loading, setLoading] = useState(false);
  const f = k => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.platform) return;
    setLoading(true);
    await addEntry('videoEntries', form);
    setForm(blank);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const myEntries   = data.videoEntries.filter(e => e.userId === currentUser.id);
  const totalEdited = myEntries.reduce((s, e) => s + (Number(e.videosEdited) || 0), 0);
  const totalShoots = myEntries.reduce((s, e) => s + (Number(e.videoShoots)  || 0), 0);

  const cols = [
    { key: 'date',         label: 'Date' },
    { key: 'platform',     label: 'Platform',       render: v => <Badge color={T.videoColor}>{v}</Badge> },
    { key: 'videosEdited', label: 'Videos Edited' },
    { key: 'videoShoots',  label: 'Video Shoots' },
    { key: 'status',       label: 'Status',         render: v => <Badge color={STATUS_COLORS[v] || T.textMuted}>{v}</Badge> },
    { key: 'notes',        label: 'Notes',          render: v => v ? v.slice(0, 35) + (v.length > 35 ? '…' : '') : '—' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {myEntries.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px,1fr))', gap: 14 }}>
          <StatCard label="Days Logged"    value={myEntries.length} icon={Video}  color={T.videoColor} />
          <StatCard label="Videos Edited" value={totalEdited}      icon={Film}   color={T.primary}    />
          <StatCard label="Video Shoots"  value={totalShoots}      icon={Camera} color={T.info}       />
        </div>
      )}
      <Card>
        <SectionTitle>Log Video Work</SectionTitle>
        {saved && <Alert type="success" style={{ marginBottom: 14 }}>Video entry saved ✓</Alert>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormGrid>
            <Input label="Date" type="date" {...f('date')} required />
            <Select label="Platform / Project Type" {...f('platform')} options={VIDEO_PLATFORMS} required />
          </FormGrid>
          <FormGrid>
            <Input label="Count of Videos Edited" type="number" {...f('videosEdited')} placeholder="e.g. 3" min="0" />
            <Input label="Count of Video Shoots"  type="number" {...f('videoShoots')}  placeholder="e.g. 1" min="0" />
          </FormGrid>
          <Select label="Status" {...f('status')} options={VIDEO_STATUSES} />
          <Textarea label="Notes" {...f('notes')} placeholder="Project name, client, details..." rows={2} />
          <Button type="submit" disabled={loading} style={{ alignSelf: 'flex-start' }}>
            <Save size={14} /> {loading ? 'Saving…' : 'Save Entry'}
          </Button>
        </form>
      </Card>
      <Card>
        <SectionTitle>My Video Logs ({myEntries.length})</SectionTitle>
        <DataTable columns={cols} rows={myEntries} onDelete={id => deleteEntry('videoEntries', id)} currentUserId={currentUser.id} />
      </Card>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────
export default function SocialManagerDashboard() {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState('social');

  return (
    <Layout title="Social Media Manager" subtitle="Manage your social media and video work">
      <TabBar active={tab} onChange={setTab} />
      {tab === 'social'
        ? <SocialTab  currentUser={currentUser} />
        : <VideoTab   currentUser={currentUser} />
      }
    </Layout>
  );
}
