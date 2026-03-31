import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/layout/Layout';
import {
  Card, Button, Input, Textarea, Select,
  SectionTitle, DataTable, Badge, Alert, FormGrid, StatCard,
} from '../../components/ui';
import { T } from '../../utils/theme';
import { Video, Film, Camera, Save } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'completed',   label: 'Completed'   },
  { value: 'in-progress', label: 'In Progress'  },
  { value: 'review',      label: 'In Review'    },
  { value: 'delivered',   label: 'Delivered'    },
];

const STATUS_COLORS = {
  completed:    T.success,
  'in-progress': T.warning,
  review:        T.info,
  delivered:     T.primary,
};

const PLATFORM_OPTIONS = [
  { value: '',           label: 'Select platform…' },
  { value: 'YouTube',    label: 'YouTube'    },
  { value: 'Instagram',  label: 'Instagram'  },
  { value: 'Facebook',   label: 'Facebook'   },
  { value: 'LinkedIn',   label: 'LinkedIn'   },
  { value: 'Testimonials',     label: 'Testimonials'     },
  { value: 'Poster',     label: 'Poster'     },
  { value: 'Stories',     label: 'Stories'     },
  { value: 'Other',      label: 'Other'      },
];

export default function VideoEditorDashboard() {
  const { addEntry, deleteEntry, data } = useData();
  const { currentUser } = useAuth();

  const blank = {
    date: new Date().toISOString().slice(0, 10),
    platform: '',
    videosEdited: '',
    videoShoots: '',
    status: 'completed',
    notes: '',
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

  const myEntries    = data.videoEntries.filter(e => e.userId === currentUser.id);
  const totalEdited  = myEntries.reduce((s, e) => s + (Number(e.videosEdited) || 0), 0);
  const totalShoots  = myEntries.reduce((s, e) => s + (Number(e.videoShoots)  || 0), 0);
  const delivered    = myEntries.filter(e => e.status === 'delivered').length;

  const cols = [
    { key: 'date',         label: 'Date' },
    { key: 'platform',     label: 'Platform',        render: v => <Badge color={T.videoColor}>{v}</Badge> },
    { key: 'videosEdited', label: 'Videos Edited' },
    { key: 'videoShoots',  label: 'Video Shoots' },
    { key: 'status',       label: 'Status',           render: v => <Badge color={STATUS_COLORS[v] || T.textMuted}>{v}</Badge> },
    { key: 'notes',        label: 'Notes',            render: v => v ? v.slice(0, 35) + (v.length > 35 ? '…' : '') : '—' },
  ];

  return (
    <Layout title="Video Editor" subtitle="Log your video editing and shoot work">
      {myEntries.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Total Days Logged" value={myEntries.length}  icon={Video}  color={T.videoColor} />
          <StatCard label="Videos Edited"     value={totalEdited}       icon={Film}   color={T.primary}    />
          <StatCard label="Video Shoots"      value={totalShoots}       icon={Camera} color={T.info}       />
          <StatCard label="Delivered"         value={delivered}         icon={Video}  color={T.success}    />
        </div>
      )}

      <Card style={{ marginBottom: 20 }}>
        <SectionTitle>Log Video Work</SectionTitle>
        {saved && <Alert type="success" style={{ marginBottom: 14 }}>Entry saved ✓</Alert>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormGrid>
            <Input label="Date" type="date" {...f('date')} required />
            <Select label="Platform / Project Type" {...f('platform')} options={PLATFORM_OPTIONS} required />
          </FormGrid>
          <FormGrid>
            <Input label="Count of Videos Edited" type="number" {...f('videosEdited')} placeholder="e.g. 3" min="0" />
            <Input label="Count of Video Shoots"  type="number" {...f('videoShoots')}  placeholder="e.g. 1" min="0" />
          </FormGrid>
          <Select label="Status" {...f('status')} options={STATUS_OPTIONS} />
          <Textarea label="Notes" {...f('notes')} placeholder="Project name, client, details..." rows={2} />
          <Button type="submit" disabled={loading} style={{ alignSelf: 'flex-start' }}>
            <Save size={14} /> {loading ? 'Saving…' : 'Save Entry'}
          </Button>
        </form>
      </Card>

      <Card>
        <SectionTitle>My Video Logs ({myEntries.length})</SectionTitle>
        <DataTable
          columns={cols}
          rows={myEntries}
          onDelete={id => deleteEntry('videoEntries', id)}
          currentUserId={currentUser.id}
        />
      </Card>
    </Layout>
  );
}
