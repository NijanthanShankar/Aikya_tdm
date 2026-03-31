import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/layout/Layout';
import { Card, Button, Input, Textarea, SectionTitle, DataTable, Alert, FormGrid, StatCard } from '../../components/ui';
import { T } from '../../utils/theme';
import { Phone, TrendingUp, CalendarCheck, Save } from 'lucide-react';

export default function TelecallerDashboard() {
  const { addEntry, deleteEntry, data } = useData();
  const { currentUser } = useAuth();

  const blank = {
    date: new Date().toISOString().slice(0, 10),
    callsMade: '',
    conversions: '',
    appointmentsScheduled: '',
    notes: '',
  };
  const [form, setForm]     = useState(blank);
  const [saved, setSaved]   = useState(false);
  const [loading, setLoading] = useState(false);
  const f = k => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.callsMade) return;
    setLoading(true);
    await addEntry('telecallerEntries', form);
    setForm(blank);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const myEntries    = data.telecallerEntries.filter(e => e.userId === currentUser.id);
  const totalCalls   = myEntries.reduce((s, e) => s + (Number(e.callsMade)             || 0), 0);
  const totalConv    = myEntries.reduce((s, e) => s + (Number(e.conversions)            || 0), 0);
  const totalAppts   = myEntries.reduce((s, e) => s + (Number(e.appointmentsScheduled) || 0), 0);

  const cols = [
    { key: 'date',                  label: 'Date' },
    { key: 'callsMade',             label: 'Calls Made' },
    { key: 'conversions',           label: 'Conversions' },
    { key: 'convRate',              label: 'Conv. Rate', render: (_, r) => r.callsMade ? `${((r.conversions / r.callsMade) * 100).toFixed(1)}%` : '—' },
    { key: 'appointmentsScheduled', label: 'Appointments' },
    { key: 'notes',                 label: 'Notes', render: v => v ? v.slice(0, 35) + (v.length > 35 ? '…' : '') : '—' },
  ];

  return (
    <Layout title="Telecaller" subtitle="Log your daily call performance">
      {myEntries.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Total Calls"           value={totalCalls}  icon={Phone}         color={T.teleColor} />
          <StatCard label="Conversions"           value={totalConv}   icon={TrendingUp}    color={T.success}   />
          <StatCard label="Appointments Scheduled" value={totalAppts} icon={CalendarCheck} color={T.primary}   />
        </div>
      )}

      <Card style={{ marginBottom: 20 }}>
        <SectionTitle>Log Today's Performance</SectionTitle>
        {saved && <Alert type="success" style={{ marginBottom: 14 }}>Entry saved ✓</Alert>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Date" type="date" {...f('date')} required />
          <FormGrid>
            <Input label="Calls Made"             type="number" {...f('callsMade')}             placeholder="e.g. 45" min="0" required />
            <Input label="Conversions"            type="number" {...f('conversions')}            placeholder="e.g. 3"  min="0" />
            <Input label="Appointments Scheduled" type="number" {...f('appointmentsScheduled')} placeholder="e.g. 5"  min="0" />
          </FormGrid>
          <Textarea label="Notes / Call Summary" {...f('notes')} placeholder="Key highlights, next steps, issues..." rows={2} />
          <Button type="submit" disabled={loading} style={{ alignSelf: 'flex-start' }}>
            <Save size={14} /> {loading ? 'Saving…' : 'Save Entry'}
          </Button>
        </form>
      </Card>

      <Card>
        <SectionTitle>My Call Logs ({myEntries.length})</SectionTitle>
        <DataTable
          columns={cols}
          rows={myEntries}
          onDelete={id => deleteEntry('telecallerEntries', id)}
          currentUserId={currentUser.id}
        />
      </Card>
    </Layout>
  );
}
