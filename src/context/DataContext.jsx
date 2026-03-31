import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

const STORES = [
  'websiteEntries','gmbEntries','adsEntries','seoEntries',
  'telecallerEntries','videoEntries','socialEntries',
];
const EMPTY = Object.fromEntries(STORES.map(s => [s, []]));

export function DataProvider({ children }) {
  const { currentUser } = useAuth();
  const [data, setData]           = useState(EMPTY);
  const [loadingData, setLoading] = useState(false);
  const fetchedForRef             = useRef(null); // track which userId we fetched for

  // ── Load all entries when user changes ─────────────────────────
  useEffect(() => {
    if (!currentUser) {
      setData(EMPTY);
      fetchedForRef.current = null;
      return;
    }
    // Avoid double-fetch if already loaded for this user (React StrictMode / re-renders)
    if (fetchedForRef.current === currentUser.id) return;
    fetchedForRef.current = currentUser.id;

    setLoading(true);
    api.entries.listAll()
      .then(({ entries }) => {
        const grouped = { ...EMPTY };
        STORES.forEach(s => grouped[s] = []);
        entries.forEach(e => {
          if (grouped[e.store]) grouped[e.store].push(e);
        });
        setData(grouped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser?.id]);

  // ── Re-fetch a single store from DB (ensures no duplicates) ─────
  const refreshStore = useCallback(async (store) => {
    try {
      const { entries } = await api.entries.list(store);
      setData(prev => ({ ...prev, [store]: entries }));
    } catch {}
  }, []);

  // ── Add entry → save to DB then refresh that store ────────────
  const addEntry = useCallback(async (store, entryData) => {
    const result = await api.entries.add(store, entryData);
    await refreshStore(store); // always pull fresh from DB — no duplicates possible
    return result.entry;
  }, [refreshStore]);

  // ── Delete entry → remove from DB then refresh that store ──────
  const deleteEntry = useCallback(async (store, id) => {
    await api.entries.remove(id);
    await refreshStore(store);
  }, [refreshStore]);

  const getByUser  = (store, userId) => data[store].filter(e => e.userId === userId);
  const getAll     = (store) => data[store];

  const getAdminSummary = () => {
    const w = data.websiteEntries;
    const g = data.gmbEntries;
    const a = data.adsEntries;
    const t = data.telecallerEntries;
    const v = data.videoEntries;
    const s = data.socialEntries;
    return {
      totalWebsiteTraffic: w.reduce((x,e) => x+(Number(e.traffic)||0), 0),
      totalLeads:          w.reduce((x,e) => x+(Number(e.leads)||0),   0),
      totalCalls:          t.reduce((x,e) => x+(Number(e.callsMade)||0), 0),
      totalConversions:    t.reduce((x,e) => x+(Number(e.conversions)||0), 0),
      totalVideos:         v.length,
      totalAdSpend:        a.reduce((x,e) => x+(Number(e.budgetSpent)||0), 0),
      totalGmbReviews:     g.reduce((x,e) => x+(Number(e.reviews)||0), 0),
      totalSocialReach:    s.reduce((x,e) => x+(Number(e.reach)||0),   0),
      websiteEntryCount:   w.length,
      gmbEntryCount:       g.length,
      adsEntryCount:       a.length,
      seoEntryCount:       data.seoEntries.length,
      teleEntryCount:      t.length,
      videoEntryCount:     v.length,
      socialEntryCount:    s.length,
    };
  };

  return (
    <DataContext.Provider value={{ data, loadingData, addEntry, deleteEntry, getByUser, getAll, getAdminSummary }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
