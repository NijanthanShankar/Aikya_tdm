import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/layout/Layout';
import { Card, StatCard } from '../../components/ui';
import { T, ROLE_LABELS, ROLE_COLORS } from '../../utils/theme';
import {
  Globe, MapPin, DollarSign, Phone, Video, Share2, Users, Activity,
  TrendingUp, AlertTriangle, CheckCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#7c3aed', '#059669', '#ea580c', '#db2777', '#0891b2', '#f59e0b'];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: `1.5px solid ${T.border}`, borderRadius: 12, padding: '10px 14px', boxShadow: T.cardShadow, fontSize: 13 }}>
      {label && <div style={{ fontWeight: 700, color: T.textPrimary, marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { data, getAdminSummary } = useData();
  const { users } = useAuth();
  const summary = getAdminSummary();

  // Per-user entry counts
  const teamEntries = users.map((u) => {
    const all = [...data.websiteEntries, ...data.gmbEntries, ...data.adsEntries,
                 ...data.seoEntries, ...data.telecallerEntries, ...data.videoEntries,
                 ...data.socialEntries];
    return { name: u.name, entries: all.filter((e) => e.userId === u.id).length, role: ROLE_LABELS[u.role], color: ROLE_COLORS[u.role] };
  }).sort((a, b) => b.entries - a.entries);

  // Monthly website traffic (last 6 months of entries)
  const now = new Date();
  const monthlyTraffic = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleString('default', { month: 'short' });
    const traffic = data.websiteEntries
      .filter((e) => { const ed = new Date(e.date); return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear(); })
      .reduce((s, e) => s + (Number(e.traffic) || 0), 0);
    const leads = data.websiteEntries
      .filter((e) => { const ed = new Date(e.date); return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear(); })
      .reduce((s, e) => s + (Number(e.leads) || 0), 0);
    return { month: label, traffic, leads };
  });

  // Category distribution for pie
  const categoryData = [
    { name: 'Website', value: summary.websiteEntryCount + summary.gmbEntryCount + summary.adsEntryCount + summary.seoEntryCount },
    { name: 'Telecaller', value: summary.teleEntryCount },
    { name: 'Video', value: summary.videoEntryCount },
    { name: 'Social', value: summary.socialEntryCount },
  ].filter((d) => d.value > 0);

  // Performance alerts
  const alerts = [];
  const noEntryUsers = users.filter((u) => {
    const all = [...data.websiteEntries, ...data.gmbEntries, ...data.adsEntries,
                 ...data.seoEntries, ...data.telecallerEntries, ...data.videoEntries, ...data.socialEntries];
    return all.filter((e) => e.userId === u.id).length === 0;
  });
  if (noEntryUsers.length) {
    alerts.push({ type: 'warning', message: `${noEntryUsers.map((u) => u.name).join(', ')} have not logged any data yet.` });
  }
  if (summary.totalLeads === 0 && summary.websiteEntryCount > 0) {
    alerts.push({ type: 'danger', message: 'No leads tracked in website entries. Update your entries.' });
  }
  if (summary.totalAdSpend > 0 && summary.totalConversions === 0) {
    alerts.push({ type: 'warning', message: 'Ad spend recorded but no conversions logged yet.' });
  }

  const totalEntries = summary.websiteEntryCount + summary.gmbEntryCount + summary.adsEntryCount +
    summary.seoEntryCount + summary.teleEntryCount + summary.videoEntryCount + summary.socialEntryCount;

  return (
    <Layout title="Admin Dashboard" subtitle="Full team performance overview">
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Website Traffic" value={summary.totalWebsiteTraffic.toLocaleString()} icon={Globe} color={T.primary} sub={`${summary.websiteEntryCount} entries`} />
        <StatCard label="Total Leads" value={summary.totalLeads.toLocaleString()} icon={TrendingUp} color={T.success} sub="from website" />
        <StatCard label="Calls Made" value={summary.totalCalls.toLocaleString()} icon={Phone} color={T.teleColor} sub={`${summary.teleEntryCount} entries`} />
        <StatCard label="Ad Spend (₹)" value={`₹${summary.totalAdSpend.toLocaleString()}`} icon={DollarSign} color={T.warning} sub={`${summary.adsEntryCount} campaigns`} />
        <StatCard label="GMB Reviews" value={summary.totalGmbReviews} icon={MapPin} color={T.webColor} sub={`${summary.gmbEntryCount} entries`} />
        <StatCard label="Videos Created" value={summary.totalVideos} icon={Video} color={T.videoColor} sub="total videos" />
        <StatCard label="Social Reach" value={summary.totalSocialReach.toLocaleString()} icon={Share2} color={T.socialColor} sub={`${summary.socialEntryCount} entries`} />
        <StatCard label="Total Entries" value={totalEntries} icon={Activity} color={T.info} sub={`${users.length} team members`} />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Monthly Traffic & Leads */}
        <Card>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: T.textPrimary, marginBottom: 18 }}>
            Website Traffic & Leads (Monthly)
          </h3>
          {monthlyTraffic.some((m) => m.traffic > 0 || m.leads > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyTraffic} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: T.textSecondary }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: T.textMuted }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="traffic" name="Traffic" fill={T.primary} radius={[6, 6, 0, 0]} />
                <Bar dataKey="leads" name="Leads" fill={T.success} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, fontSize: 14 }}>
              No website data logged yet
            </div>
          )}
        </Card>

        {/* Category Distribution */}
        <Card>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: T.textPrimary, marginBottom: 18 }}>
            Entries by Department
          </h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend iconType="circle" iconSize={10} formatter={(v) => <span style={{ fontSize: 12, color: T.textSecondary }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, fontSize: 14 }}>
              No data logged by any team member yet
            </div>
          )}
        </Card>
      </div>

      {/* Team Performance + Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Team Log Count */}
        <Card>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: T.textPrimary, marginBottom: 18 }}>
            Team Entries
          </h3>
          {teamEntries.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {teamEntries.map((m) => (
                <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, background: `${m.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Users size={15} color={m.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{m.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.entries} entries</span>
                    </div>
                    <div style={{ height: 6, background: T.border, borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 99, background: m.color,
                        width: `${Math.min(100, teamEntries[0].entries ? (m.entries / teamEntries[0].entries) * 100 : 0)}%`,
                        transition: 'width 0.4s',
                      }} />
                    </div>
                    <span style={{ fontSize: 11, color: T.textMuted }}>{m.role}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: T.textMuted, fontSize: 14, textAlign: 'center', padding: '24px 0' }}>
              No team entries yet
            </div>
          )}
        </Card>

        {/* Alerts */}
        <Card>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15, color: T.textPrimary, marginBottom: 18 }}>
            Performance Alerts
          </h3>
          {alerts.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '24px 0', color: T.success }}>
              <CheckCircle size={36} color={T.success} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>All good! No alerts at this time.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {alerts.map((a, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  background: a.type === 'danger' ? T.dangerLight : T.warningLight,
                  padding: '12px 14px', borderRadius: 12,
                  border: `1px solid ${a.type === 'danger' ? T.danger : T.warning}30`,
                }}>
                  <AlertTriangle size={15} color={a.type === 'danger' ? T.danger : T.warning} style={{ marginTop: 1, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: a.type === 'danger' ? T.danger : '#92400e' }}>{a.message}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
