import * as XLSX from 'xlsx';

const ROLE_LABELS = {
  admin: 'Admin', webmanager: 'Web Manager', telecaller: 'Telecaller',
  videoeditor: 'Video Editor', socialmanager: 'Social Media Manager',
};

const getUserName = (users, id) => { const u = users.find(x => x.id === id); return u ? u.name : 'Unknown'; };
const getUserRole = (users, id) => { const u = users.find(x => x.id === id); return u ? (ROLE_LABELS[u.role] || u.role) : 'Unknown'; };

function fmt(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

// ── Styles ──────────────────────────────────────────────────────
const HDR = {
  font:      { bold: true, color: { rgb: 'FFFFFF' }, sz: 11, name: 'Calibri' },
  fill:      { patternType: 'solid', fgColor: { rgb: '6D28D9' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
  border:    { top: { style: 'thin', color: { rgb: 'FFFFFF' } }, bottom: { style: 'thin', color: { rgb: 'FFFFFF' } }, left: { style: 'thin', color: { rgb: 'FFFFFF' } }, right: { style: 'thin', color: { rgb: 'FFFFFF' } } },
};
const ROW_A = { font: { sz: 10, name: 'Calibri' }, fill: { patternType: 'solid', fgColor: { rgb: 'F5F3FF' } }, alignment: { vertical: 'center' }, border: { top: { style: 'hair', color: { rgb: 'DDD6FE' } }, bottom: { style: 'hair', color: { rgb: 'DDD6FE' } }, left: { style: 'hair', color: { rgb: 'DDD6FE' } }, right: { style: 'hair', color: { rgb: 'DDD6FE' } } } };
const ROW_B = { ...ROW_A, fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } } };
const NUM_ALIGN = { horizontal: 'right', vertical: 'center' };

// ── Filter helpers ───────────────────────────────────────────────

// Remove rows that have zero/empty for all non-meta fields
function filterRows(rows, metaKeys = ['date','createdAt']) {
  return rows.filter(row => {
    return Object.entries(row).some(([k, v]) => {
      if (metaKeys.includes(k)) return false;
      if (v === null || v === undefined || v === '') return false;
      if (typeof v === 'number' && v === 0) return false;
      if (typeof v === 'string' && v.trim() === '') return false;
      return true;
    });
  });
}

// Remove columns that have no non-empty/non-zero values across all rows
function filterCols(colDefs, rows) {
  // Always keep meta columns
  const ALWAYS_KEEP = ['Date', 'Team Member', 'Role', 'Campaign Name', 'Keyword', 'Platform', 'Platform / Type', 'Status', 'Platform / Project Type'];
  return colDefs.filter(col => {
    if (ALWAYS_KEEP.includes(col.header)) {
      // Only keep meta cols if at least one row has a value for them
      return rows.some(r => {
        const v = col.value(r);
        return v !== null && v !== undefined && v !== '' && v !== 0;
      });
    }
    return rows.some(r => {
      const v = col.value(r);
      if (v === null || v === undefined || v === '') return false;
      if (typeof v === 'number' && v === 0) return false;
      if (typeof v === 'string' && v.trim() === '') return false;
      return true;
    });
  });
}

// ── Build styled worksheet ───────────────────────────────────────
function buildSheet(allColDefs, allRows) {
  // 1. Filter out blank rows
  const rows = filterRows(allRows);

  if (!rows.length) {
    const ws = XLSX.utils.aoa_to_sheet([['No entries have been logged yet.']]);
    ws['!cols'] = [{ wch: 40 }];
    return ws;
  }

  // 2. Filter out columns with no data
  const colDefs = filterCols(allColDefs, rows);

  if (!colDefs.length) {
    const ws = XLSX.utils.aoa_to_sheet([['No data available.']]);
    ws['!cols'] = [{ wch: 40 }];
    return ws;
  }

  const ws = {};
  const R  = rows.length;
  const C  = colDefs.length;

  // Headers
  colDefs.forEach((col, ci) => {
    const addr = XLSX.utils.encode_cell({ r: 0, c: ci });
    ws[addr] = { v: col.header, t: 's', s: HDR };
  });

  // Data rows
  rows.forEach((row, ri) => {
    const base = ri % 2 === 0 ? ROW_A : ROW_B;
    colDefs.forEach((col, ci) => {
      const addr = XLSX.utils.encode_cell({ r: ri + 1, c: ci });
      const raw  = col.value(row);
      const isNum = typeof raw === 'number';
      // Show empty string instead of 0 for optional numeric fields
      const display = (isNum && raw === 0) ? '' : (raw ?? '');
      ws[addr] = {
        v: display,
        t: (isNum && raw !== 0) ? 'n' : 's',
        s: { ...base, alignment: isNum ? { ...NUM_ALIGN } : base.alignment },
      };
    });
  });

  ws['!ref']  = XLSX.utils.encode_range({ s: { r:0, c:0 }, e: { r:R, c:C-1 } });
  ws['!cols'] = colDefs.map(col => ({ wch: col.width || 16 }));
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  return ws;
}

// ── Main export ──────────────────────────────────────────────────
export function exportAllData({ data, users }) {
  const wb = XLSX.utils.book_new();
  wb.Props = { Title: 'Aikya Digital Marketing Report', Author: 'Aikya Digital Marketing', CreatedDate: new Date() };

  // ── Website ──────────────────────────────────────────────────
  XLSX.utils.book_append_sheet(wb, buildSheet([
    { header: 'Date',                width: 14, value: r => fmt(r.date) },
    { header: 'Team Member',         width: 20, value: r => getUserName(users, r.userId) },
    { header: 'Daily Traffic',       width: 14, value: r => Number(r.traffic)           || 0 },
    { header: 'Leads Generated',     width: 16, value: r => Number(r.leads)             || 0 },
    { header: 'Conversions',         width: 13, value: r => Number(r.conversions)       || 0 },
    { header: 'Bounce Rate (%)',      width: 14, value: r => Number(r.bounceRate)        || 0 },
    { header: 'Pages Created',       width: 14, value: r => Number(r.pagesCreated)      || 0 },
    { header: 'Blog Posts',          width: 12, value: r => Number(r.blogPosts)         || 0 },
    { header: 'SEO Optimizations',   width: 18, value: r => Number(r.seoOptimizations)  || 0 },
    { header: 'Bugs Fixed',          width: 12, value: r => Number(r.bugsFixed)         || 0 },
    { header: 'Speed Improvements',  width: 18, value: r => Number(r.speedImprovements) || 0 },
    { header: 'Notes',               width: 30, value: r => r.notes || '' },
    { header: 'Logged On',           width: 16, value: r => fmt(r.createdAt) },
  ], data.websiteEntries), '🌐 Website');

  // ── GMB ──────────────────────────────────────────────────────
  XLSX.utils.book_append_sheet(wb, buildSheet([
    { header: 'Date',               width: 14, value: r => fmt(r.date) },
    { header: 'Team Member',        width: 20, value: r => getUserName(users, r.userId) },
    { header: 'Posts Published',    width: 16, value: r => Number(r.posts)      || 0 },
    { header: 'Reviews Gained',     width: 15, value: r => Number(r.reviews)    || 0 },
    { header: 'Current Rating',     width: 14, value: r => Number(r.rating)     || 0 },
    { header: 'Calls Received',     width: 14, value: r => Number(r.calls)      || 0 },
    { header: 'Direction Requests', width: 18, value: r => Number(r.directions) || 0 },
    { header: 'Messages Received',  width: 18, value: r => Number(r.messages)   || 0 },
    { header: 'Notes',              width: 30, value: r => r.notes || '' },
    { header: 'Logged On',          width: 16, value: r => fmt(r.createdAt) },
  ], data.gmbEntries), '📍 GMB');

  // ── Google Ads ───────────────────────────────────────────────
  XLSX.utils.book_append_sheet(wb, buildSheet([
    { header: 'Date',                  width: 14, value: r => fmt(r.date) },
    { header: 'Team Member',           width: 20, value: r => getUserName(users, r.userId) },
    { header: 'Campaign Name',         width: 26, value: r => r.campaignName || '' },
    { header: 'Budget Spent (₹)',      width: 16, value: r => Number(r.budgetSpent)  || 0 },
    { header: 'Impressions',           width: 14, value: r => Number(r.impressions)  || 0 },
    { header: 'Clicks',                width: 10, value: r => Number(r.clicks)       || 0 },
    { header: 'CTR (%)',               width: 10, value: r => {
        const i = Number(r.impressions), c = Number(r.clicks);
        return i ? parseFloat(((c/i)*100).toFixed(2)) : 0;
    }},
    { header: 'CPC (₹)',               width: 10, value: r => {
        const c = Number(r.clicks), b = Number(r.budgetSpent);
        return c ? parseFloat((b/c).toFixed(2)) : 0;
    }},
    { header: 'Conversions',           width: 13, value: r => Number(r.conversions)  || 0 },
    { header: 'Cost/Conversion (₹)',   width: 18, value: r => {
        const conv = Number(r.conversions), b = Number(r.budgetSpent);
        return conv ? parseFloat((b/conv).toFixed(2)) : 0;
    }},
    { header: 'Notes',                 width: 28, value: r => r.notes || '' },
    { header: 'Logged On',             width: 16, value: r => fmt(r.createdAt) },
  ], data.adsEntries), '💰 Google Ads');

  // ── SEO ──────────────────────────────────────────────────────
  XLSX.utils.book_append_sheet(wb, buildSheet([
    { header: 'Date',          width: 14, value: r => fmt(r.date) },
    { header: 'Team Member',   width: 20, value: r => getUserName(users, r.userId) },
    { header: 'Keyword',       width: 28, value: r => r.keyword || '' },
    { header: 'Search Volume', width: 14, value: r => Number(r.searchVolume) || 0 },
    { header: 'Current Rank',  width: 13, value: r => Number(r.currentRank)  || 0 },
    { header: 'Previous Rank', width: 14, value: r => Number(r.previousRank) || 0 },
    { header: 'Rank Change',   width: 13, value: r => {
        const p = Number(r.previousRank), c = Number(r.currentRank);
        return (p && c) ? (p - c) : 0;
    }},
    { header: 'Backlinks',     width: 12, value: r => Number(r.backlinks) || 0 },
    { header: 'Notes',         width: 28, value: r => r.notes || '' },
    { header: 'Logged On',     width: 16, value: r => fmt(r.createdAt) },
  ], data.seoEntries), '🔍 SEO');

  // ── Telecaller ───────────────────────────────────────────────
  XLSX.utils.book_append_sheet(wb, buildSheet([
    { header: 'Date',                   width: 14, value: r => fmt(r.date) },
    { header: 'Team Member',            width: 20, value: r => getUserName(users, r.userId) },
    { header: 'Calls Made',             width: 13, value: r => Number(r.callsMade)             || 0 },
    { header: 'Conversions',            width: 13, value: r => Number(r.conversions)            || 0 },
    { header: 'Conversion Rate (%)',    width: 18, value: r => {
        const calls = Number(r.callsMade), conv = Number(r.conversions);
        return calls ? parseFloat(((conv/calls)*100).toFixed(1)) : 0;
    }},
    { header: 'Appointments Scheduled', width: 22, value: r => Number(r.appointmentsScheduled) || 0 },
    { header: 'Notes',                  width: 30, value: r => r.notes || '' },
    { header: 'Logged On',              width: 16, value: r => fmt(r.createdAt) },
  ], data.telecallerEntries), '📞 Telecaller');

  // ── Video ────────────────────────────────────────────────────
  XLSX.utils.book_append_sheet(wb, buildSheet([
    { header: 'Date',                  width: 14, value: r => fmt(r.date) },
    { header: 'Team Member',           width: 20, value: r => getUserName(users, r.userId) },
    { header: 'Role',                  width: 18, value: r => getUserRole(users, r.userId) },
    { header: 'Platform / Type',       width: 16, value: r => r.platform     || '' },
    { header: 'Videos Edited',         width: 14, value: r => Number(r.videosEdited) || 0 },
    { header: 'Video Shoots',          width: 14, value: r => Number(r.videoShoots)  || 0 },
    { header: 'Status',                width: 14, value: r => r.status       || '' },
    { header: 'Notes',                 width: 30, value: r => r.notes        || '' },
    { header: 'Logged On',             width: 16, value: r => fmt(r.createdAt) },
  ], data.videoEntries), '🎬 Video');

  // ── Social Media ─────────────────────────────────────────────
  XLSX.utils.book_append_sheet(wb, buildSheet([
    { header: 'Date',                width: 14, value: r => fmt(r.date) },
    { header: 'Team Member',         width: 20, value: r => getUserName(users, r.userId) },
    { header: 'Platform',            width: 14, value: r => r.platform          || '' },
    { header: 'Posts Published',     width: 16, value: r => Number(r.postsPublished)  || 0 },
    { header: 'Reach',               width: 14, value: r => Number(r.reach)           || 0 },
    { header: 'Engagement',          width: 14, value: r => Number(r.engagement)      || 0 },
    { header: 'Engagement Rate (%)', width: 18, value: r => {
        const reach = Number(r.reach), eng = Number(r.engagement);
        return reach ? parseFloat(((eng/reach)*100).toFixed(2)) : 0;
    }},
    { header: 'Followers Gained',    width: 16, value: r => Number(r.followersGained) || 0 },
    { header: 'Notes',               width: 30, value: r => r.notes || '' },
    { header: 'Logged On',           width: 16, value: r => fmt(r.createdAt) },
  ], data.socialEntries), '📱 Social Media');

  // ── Team Summary ─────────────────────────────────────────────
  const summaryRows = users.map(u => ({
    name:    u.name,
    role:    ROLE_LABELS[u.role] || u.role,
    website: data.websiteEntries.filter(e => e.userId === u.id).length,
    gmb:     data.gmbEntries.filter(e => e.userId === u.id).length,
    ads:     data.adsEntries.filter(e => e.userId === u.id).length,
    seo:     data.seoEntries.filter(e => e.userId === u.id).length,
    tele:    data.telecallerEntries.filter(e => e.userId === u.id).length,
    video:   data.videoEntries.filter(e => e.userId === u.id).length,
    social:  data.socialEntries.filter(e => e.userId === u.id).length,
    total:   [
      ...data.websiteEntries, ...data.gmbEntries, ...data.adsEntries, ...data.seoEntries,
      ...data.telecallerEntries, ...data.videoEntries, ...data.socialEntries,
    ].filter(e => e.userId === u.id).length,
  })).filter(r => r.total > 0); // only show members who logged something

  XLSX.utils.book_append_sheet(wb, buildSheet([
    { header: 'Team Member',    width: 22, value: r => r.name    },
    { header: 'Role',           width: 20, value: r => r.role    },
    { header: 'Website Logs',  width: 14, value: r => r.website  },
    { header: 'GMB Logs',      width: 12, value: r => r.gmb      },
    { header: 'Ads Logs',      width: 12, value: r => r.ads      },
    { header: 'SEO Logs',      width: 12, value: r => r.seo      },
    { header: 'Call Logs',     width: 12, value: r => r.tele     },
    { header: 'Video Logs',    width: 12, value: r => r.video    },
    { header: 'Social Logs',   width: 12, value: r => r.social   },
    { header: 'Total Entries', width: 14, value: r => r.total    },
  ], summaryRows), '👥 Team Summary');

  // ── Save ─────────────────────────────────────────────────────
  XLSX.writeFile(wb, `Aikya_Report_${new Date().toISOString().slice(0, 10)}.xlsx`, { compression: true });
}
