import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/layout/Layout';
import { Card, Button, Input, Textarea, Select, SectionTitle, DataTable, Badge, Alert, FormGrid } from '../../components/ui';
import { T } from '../../utils/theme';
import { Globe, MapPin, DollarSign, Search, Save } from 'lucide-react';

const tabs = [
  { id: 'website', label: 'Website',             icon: Globe      },
  { id: 'gmb',     label: 'Google My Business',  icon: MapPin     },
  { id: 'ads',     label: 'Google Ads',           icon: DollarSign },
  { id: 'seo',     label: 'SEO',                  icon: Search     },
];

function TabBar({ active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, padding: 6, background: T.primaryLight, borderRadius: 14, marginBottom: 24, flexWrap: 'wrap' }}>
      {tabs.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => onChange(id)} style={{
          flex: 1, minWidth: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: active === id ? T.surface : 'transparent',
          color: active === id ? T.primary : T.textSecondary,
          fontWeight: active === id ? 700 : 500, fontSize: 13,
          boxShadow: active === id ? T.cardShadow : 'none',
          fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
        }}><Icon size={14} />{label}</button>
      ))}
    </div>
  );
}

// ── Website ────────────────────────────────────────────────────
function WebsiteTab() {
  const { addEntry, deleteEntry, data } = useData();
  const { currentUser } = useAuth();
  const blank = { date: new Date().toISOString().slice(0,10), traffic:'', leads:'', conversions:'', bounceRate:'', pagesCreated:'', blogPosts:'', seoOptimizations:'', bugsFixed:'', speedImprovements:'', notes:'' };
  const [form, setForm] = useState(blank);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const f = k => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await addEntry('websiteEntries', form);
    setForm(blank);
    setLoading(false);
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const myEntries = data.websiteEntries.filter(e => e.userId === currentUser.id);
  const cols = [
    { key: 'date', label: 'Date' },
    { key: 'traffic', label: 'Traffic' },
    { key: 'leads', label: 'Leads' },
    { key: 'conversions', label: 'Conv.' },
    { key: 'bounceRate', label: 'Bounce %' },
    { key: 'pagesCreated', label: 'Pages' },
    { key: 'blogPosts', label: 'Blogs' },
    { key: 'notes', label: 'Notes', render: v => v ? v.slice(0,30)+(v.length>30?'…':'') : '—' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <Card>
        <SectionTitle>Log Website Performance</SectionTitle>
        {saved && <Alert type="success" style={{ marginBottom:14 }}>Entry saved ✓</Alert>}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <Input label="Date" type="date" {...f('date')} required />
          <FormGrid>
            <Input label="Daily Traffic"         type="number" {...f('traffic')}          placeholder="e.g. 1200" min="0" />
            <Input label="Leads Generated"        type="number" {...f('leads')}            placeholder="e.g. 15"   min="0" />
            <Input label="Conversions"            type="number" {...f('conversions')}      placeholder="e.g. 3"    min="0" />
            <Input label="Bounce Rate (%)"        type="number" {...f('bounceRate')}       placeholder="e.g. 52"   min="0" max="100" />
            <Input label="Pages Created/Updated"  type="number" {...f('pagesCreated')}    placeholder="e.g. 2"    min="0" />
            <Input label="Blog Posts Added"       type="number" {...f('blogPosts')}        placeholder="e.g. 1"    min="0" />
            <Input label="SEO Optimizations"      type="number" {...f('seoOptimizations')} placeholder="e.g. 4"   min="0" />
            <Input label="Bugs Fixed"             type="number" {...f('bugsFixed')}        placeholder="e.g. 2"    min="0" />
            <Input label="Speed Improvements"     type="number" {...f('speedImprovements')} placeholder="e.g. 1"  min="0" />
          </FormGrid>
          <Textarea label="Notes" {...f('notes')} placeholder="Any additional notes..." rows={2} />
          <Button type="submit" disabled={loading} style={{ alignSelf:'flex-start' }}><Save size={14} /> {loading ? 'Saving…' : 'Save Entry'}</Button>
        </form>
      </Card>
      <Card>
        <SectionTitle>My Website Entries ({myEntries.length})</SectionTitle>
        <DataTable columns={cols} rows={myEntries} onDelete={id => deleteEntry('websiteEntries', id)} currentUserId={currentUser.id} />
      </Card>
    </div>
  );
}

// ── GMB ────────────────────────────────────────────────────────
function GmbTab() {
  const { addEntry, deleteEntry, data } = useData();
  const { currentUser } = useAuth();
  const blank = { date: new Date().toISOString().slice(0,10), posts:'', reviews:'', rating:'', calls:'', directions:'', messages:'', notes:'' };
  const [form, setForm] = useState(blank);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const f = k => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await addEntry('gmbEntries', form);
    setForm(blank);
    setLoading(false);
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const myEntries = data.gmbEntries.filter(e => e.userId === currentUser.id);
  const cols = [
    { key: 'date', label: 'Date' },
    { key: 'posts', label: 'Posts' },
    { key: 'reviews', label: 'Reviews' },
    { key: 'rating', label: 'Rating' },
    { key: 'calls', label: 'Calls' },
    { key: 'directions', label: 'Directions' },
    { key: 'messages', label: 'Messages' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <Card>
        <SectionTitle>Log Google My Business Activity</SectionTitle>
        {saved && <Alert type="success" style={{ marginBottom:14 }}>Entry saved ✓</Alert>}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <Input label="Date" type="date" {...f('date')} required />
          <FormGrid>
            <Input label="Posts Published"    type="number" {...f('posts')}      placeholder="e.g. 3"   min="0" />
            <Input label="Reviews Gained"     type="number" {...f('reviews')}    placeholder="e.g. 5"   min="0" />
            <Input label="Current Rating"     type="number" {...f('rating')}     placeholder="e.g. 4.5" min="0" max="5" step="0.1" />
            <Input label="Calls Received"     type="number" {...f('calls')}      placeholder="e.g. 12"  min="0" />
            <Input label="Direction Requests" type="number" {...f('directions')} placeholder="e.g. 8"   min="0" />
            <Input label="Messages Received"  type="number" {...f('messages')}   placeholder="e.g. 4"   min="0" />
          </FormGrid>
          <Textarea label="Notes" {...f('notes')} placeholder="Summary of GMB activity..." rows={2} />
          <Button type="submit" disabled={loading} style={{ alignSelf:'flex-start' }}><Save size={14} /> {loading ? 'Saving…' : 'Save Entry'}</Button>
        </form>
      </Card>
      <Card>
        <SectionTitle>My GMB Entries ({myEntries.length})</SectionTitle>
        <DataTable columns={cols} rows={myEntries} onDelete={id => deleteEntry('gmbEntries', id)} currentUserId={currentUser.id} />
      </Card>
    </div>
  );
}

// ── Ads ────────────────────────────────────────────────────────
function AdsTab() {
  const { addEntry, deleteEntry, data } = useData();
  const { currentUser } = useAuth();
  const blank = { date: new Date().toISOString().slice(0,10), campaignName:'', budgetSpent:'', impressions:'', clicks:'', conversions:'', notes:'' };
  const [form, setForm] = useState(blank);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const f = k => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.campaignName.trim()) return;
    setLoading(true);
    await addEntry('adsEntries', form);
    setForm(blank);
    setLoading(false);
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const myEntries = data.adsEntries.filter(e => e.userId === currentUser.id);
  const cols = [
    { key: 'date',         label: 'Date' },
    { key: 'campaignName', label: 'Campaign' },
    { key: 'budgetSpent',  label: 'Spend (₹)', render: v => v ? `₹${v}` : '—' },
    { key: 'impressions',  label: 'Impressions' },
    { key: 'clicks',       label: 'Clicks' },
    { key: 'ctr',          label: 'CTR',  render: (_, r) => r.impressions ? `${((r.clicks/r.impressions)*100).toFixed(1)}%` : '—' },
    { key: 'cpc',          label: 'CPC',  render: (_, r) => r.clicks ? `₹${(r.budgetSpent/r.clicks).toFixed(0)}` : '—' },
    { key: 'conversions',  label: 'Conv.' },
    { key: 'cpa',          label: 'CPA',  render: (_, r) => r.conversions ? `₹${(r.budgetSpent/r.conversions).toFixed(0)}` : '—' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <Card>
        <SectionTitle>Log Google Ads Campaign</SectionTitle>
        {saved && <Alert type="success" style={{ marginBottom:14 }}>Campaign logged ✓</Alert>}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <FormGrid>
            <Input label="Date"          type="date" {...f('date')} required />
            <Input label="Campaign Name" {...f('campaignName')} placeholder="e.g. Summer Sale 2025" required />
          </FormGrid>
          <FormGrid>
            <Input label="Budget Spent (₹)" type="number" {...f('budgetSpent')}  placeholder="e.g. 5000"  min="0" />
            <Input label="Impressions"       type="number" {...f('impressions')}  placeholder="e.g. 12000" min="0" />
            <Input label="Clicks"            type="number" {...f('clicks')}       placeholder="e.g. 340"   min="0" />
            <Input label="Conversions"       type="number" {...f('conversions')}  placeholder="e.g. 18"    min="0" />
          </FormGrid>
          <Textarea label="Notes" {...f('notes')} placeholder="Campaign notes, targeting details..." rows={2} />
          <Button type="submit" disabled={loading} style={{ alignSelf:'flex-start' }}><Save size={14} /> {loading ? 'Saving…' : 'Save Campaign'}</Button>
        </form>
      </Card>
      <Card>
        <SectionTitle>My Ad Campaigns ({myEntries.length})</SectionTitle>
        <p style={{ fontSize:12, color:T.textMuted, marginBottom:12 }}>CTR, CPC, CPA auto-calculated.</p>
        <DataTable columns={cols} rows={myEntries} onDelete={id => deleteEntry('adsEntries', id)} currentUserId={currentUser.id} />
      </Card>
    </div>
  );
}

// ── SEO ────────────────────────────────────────────────────────
function SeoTab() {
  const { addEntry, deleteEntry, data } = useData();
  const { currentUser } = useAuth();
  const blank = { date: new Date().toISOString().slice(0,10), keyword:'', searchVolume:'', currentRank:'', previousRank:'', backlinks:'', notes:'' };
  const [form, setForm] = useState(blank);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const f = k => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.keyword.trim()) return;
    setLoading(true);
    await addEntry('seoEntries', form);
    setForm(blank);
    setLoading(false);
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const myEntries = data.seoEntries.filter(e => e.userId === currentUser.id);
  const cols = [
    { key: 'date',         label: 'Date' },
    { key: 'keyword',      label: 'Keyword' },
    { key: 'searchVolume', label: 'Volume' },
    { key: 'currentRank',  label: 'Rank' },
    { key: 'change',       label: 'Change', render: (_, r) => {
      if (!r.previousRank || !r.currentRank) return '—';
      const d = r.previousRank - r.currentRank;
      return <Badge color={d>0?T.success:d<0?T.danger:T.textMuted}>{d>0?`▲${d}`:d<0?`▼${Math.abs(d)}`:'='}</Badge>;
    }},
    { key: 'backlinks', label: 'Backlinks' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <Card>
        <SectionTitle>Log SEO Activity</SectionTitle>
        {saved && <Alert type="success" style={{ marginBottom:14 }}>SEO entry saved ✓</Alert>}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <FormGrid>
            <Input label="Date"    type="date" {...f('date')} required />
            <Input label="Keyword" {...f('keyword')} placeholder="e.g. digital marketing agency" required />
          </FormGrid>
          <FormGrid>
            <Input label="Search Volume"      type="number" {...f('searchVolume')}  placeholder="e.g. 2400" min="0" />
            <Input label="Current Rank"       type="number" {...f('currentRank')}   placeholder="e.g. 12"   min="1" />
            <Input label="Previous Rank"      type="number" {...f('previousRank')}  placeholder="e.g. 18"   min="1" />
            <Input label="Backlinks Created"  type="number" {...f('backlinks')}     placeholder="e.g. 3"    min="0" />
          </FormGrid>
          <Textarea label="Notes" {...f('notes')} placeholder="SEO strategy notes..." rows={2} />
          <Button type="submit" disabled={loading} style={{ alignSelf:'flex-start' }}><Save size={14} /> {loading ? 'Saving…' : 'Save Entry'}</Button>
        </form>
      </Card>
      <Card>
        <SectionTitle>My SEO Entries ({myEntries.length})</SectionTitle>
        <DataTable columns={cols} rows={myEntries} onDelete={id => deleteEntry('seoEntries', id)} currentUserId={currentUser.id} />
      </Card>
    </div>
  );
}

export default function WebManagerDashboard() {
  const location = useLocation();
  const navigate  = useNavigate();
  const pathMap   = { '/web':'/web', '/web/gmb':'/web/gmb', '/web/ads':'/web/ads', '/web/seo':'/web/seo' };
  const tabMap    = { '/web':'website', '/web/gmb':'gmb', '/web/ads':'ads', '/web/seo':'seo' };
  const navMap    = { website:'/web', gmb:'/web/gmb', ads:'/web/ads', seo:'/web/seo' };
  const tab       = tabMap[location.pathname] || 'website';
  const tabViews  = { website:<WebsiteTab/>, gmb:<GmbTab/>, ads:<AdsTab/>, seo:<SeoTab/> };

  return (
    <Layout title="Web Manager" subtitle="Log website, GMB, ads, and SEO performance">
      <TabBar active={tab} onChange={t => navigate(navMap[t])} />
      {tabViews[tab]}
    </Layout>
  );
}
