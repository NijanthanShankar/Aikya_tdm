import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { exportAllData } from '../../utils/exportUtils';
import { Layout } from '../../components/layout/Layout';
import { Card, Button, StatCard, Alert, SectionTitle } from '../../components/ui';
import { T } from '../../utils/theme';
import { FileSpreadsheet, Download, Globe, MapPin, DollarSign, Search, Phone, Video, Share2, Users } from 'lucide-react';

export default function ExportPage() {
  const { data, getAdminSummary } = useData();
  const { users } = useAuth();
  const [exported, setExported] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const summary     = getAdminSummary();
  const totalEntries =
    data.websiteEntries.length + data.gmbEntries.length + data.adsEntries.length +
    data.seoEntries.length + data.telecallerEntries.length +
    data.videoEntries.length + data.socialEntries.length;

  const sheetInfo = [
    { name: '🌐 Website',           icon: Globe,          count: data.websiteEntries.length,     color: T.primary,      desc: 'Traffic, leads, conversions, bounce rate, page work' },
    { name: '📍 Google My Business', icon: MapPin,         count: data.gmbEntries.length,         color: T.webColor,     desc: 'Posts, reviews, calls, direction requests' },
    { name: '💰 Google Ads',         icon: DollarSign,     count: data.adsEntries.length,         color: T.warning,      desc: 'Campaigns with auto-calculated CTR, CPC, CPA' },
    { name: '🔍 SEO',                icon: Search,         count: data.seoEntries.length,         color: T.info,         desc: 'Keywords, rankings, backlinks, rank changes' },
    { name: '📞 Telecaller',         icon: Phone,          count: data.telecallerEntries.length,  color: T.teleColor,    desc: 'Calls, leads, conversions, follow-ups + conv. rate' },
    { name: '🎬 Video',              icon: Video,          count: data.videoEntries.length,       color: T.videoColor,   desc: 'Videos edited, video shoots, platform, status' },
    { name: '📱 Social Media',       icon: Share2,         count: data.socialEntries.length,      color: T.socialColor,  desc: 'Posts, reach, engagement, followers + eng. rate' },
    { name: '👥 Team Summary',       icon: Users,          count: users.length,                   color: T.primary,      desc: 'Total entries per team member across all sections' },
  ];

  const handleExport = () => {
    if (totalEntries === 0) return;
    setLoading(true);
    try {
      exportAllData({ data, users });
      setExported(true);
      setTimeout(() => setExported(false), 4000);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Export Report" subtitle="Download all team data as a formatted Excel spreadsheet">
      <div style={{ maxWidth: 820, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          <StatCard label="Total Entries"  value={totalEntries}  icon={FileSpreadsheet} color={T.primary} />
          <StatCard label="Team Members"   value={users.length}  icon={Users}           color={T.success} />
          <StatCard label="Excel Sheets"   value={8}             icon={FileSpreadsheet} color={T.info}    sub="in the export" />
        </div>

        {/* Sheet preview */}
        <Card>
          <SectionTitle>What's included in the export</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sheetInfo.map(sh => {
              const Icon = sh.icon;
              return (
                <div key={sh.name} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 14px', borderRadius: 14,
                  background: T.bg, border: `1.5px solid ${T.border}`,
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 12,
                    background: `${sh.color}16`, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={16} color={sh.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary }}>{sh.name}</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 1 }}>{sh.desc}</div>
                  </div>
                  <div style={{
                    background: `${sh.color}16`, color: sh.color,
                    borderRadius: 8, padding: '4px 12px',
                    fontSize: 12, fontWeight: 700,
                    border: `1px solid ${sh.color}30`,
                    flexShrink: 0,
                  }}>
                    {sh.count} {sh.name === '👥 Team Summary' ? 'members' : 'rows'}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Export action */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 18, flexShrink: 0,
              background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(124,58,237,0.3)',
            }}>
              <FileSpreadsheet size={26} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 17, color: T.textPrimary, marginBottom: 4 }}>
                Export as Excel Spreadsheet
              </div>
              <p style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.6 }}>
                Downloads a styled <strong>.xlsx</strong> file with <strong>8 colour-coded sheets</strong> — 
                purple headers, alternating row colours, auto-column widths, and frozen header rows. 
                CTR, CPC, CPA, conversion rates, and engagement rates are all auto-calculated.
              </p>
            </div>
            <Button onClick={handleExport} size="lg" disabled={loading || totalEntries === 0} style={{ flexShrink: 0 }}>
              <Download size={16} /> {loading ? 'Exporting…' : 'Download Report'}
            </Button>
          </div>

          {exported && (
            <div style={{ marginTop: 14 }}>
              <Alert type="success">✅ Report downloaded! Check your Downloads folder.</Alert>
            </div>
          )}
          {totalEntries === 0 && (
            <div style={{ marginTop: 14 }}>
              <Alert type="warning">No data logged yet. Ask team members to add entries first.</Alert>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
