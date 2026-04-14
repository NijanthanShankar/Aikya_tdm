import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

const AttendanceContext = createContext(null);

// ── Helpers ───────────────────────────────────────────────────
export function isSundayDate(dateStr) {
  // Parse as local date to avoid timezone shift
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay() === 0;
}

export function isTodaySunday() {
  return new Date().getDay() === 0;
}

export function formatHours(hours) {
  if (hours === null || hours === undefined) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export function formatTime(datetimeStr) {
  if (!datetimeStr) return '—';
  return new Date(datetimeStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Get GPS location + reverse-geocode (OpenStreetMap Nominatim, free, no key needed)
export async function getLocationInfo() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: null, lng: null, location: 'Location not supported by browser' });
      return;
    }
    const timeout = setTimeout(() => {
      resolve({ lat: null, lng: null, location: 'Location timed out' });
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        clearTimeout(timeout);
        const lat = pos.coords.latitude.toFixed(7);
        const lng = pos.coords.longitude.toFixed(7);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const parts = data.display_name?.split(',') || [];
          const location = parts.slice(0, 4).join(', ').trim() || `${lat}, ${lng}`;
          resolve({ lat, lng, location });
        } catch {
          resolve({ lat, lng, location: `${parseFloat(lat).toFixed(4)}°N, ${parseFloat(lng).toFixed(4)}°E` });
        }
      },
      (err) => {
        clearTimeout(timeout);
        const msgs = {
          1: 'Location permission denied',
          2: 'Location unavailable',
          3: 'Location request timed out',
        };
        resolve({ lat: null, lng: null, location: msgs[err.code] || 'Location error' });
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  });
}

// ── Provider ──────────────────────────────────────────────────
export function AttendanceProvider({ children }) {
  const { currentUser } = useAuth();

  const [todayRecord,  setTodayRecord]  = useState(null);
  const [holidays,     setHolidays]     = useState([]);
  const [loadingToday, setLoadingToday] = useState(false);
  const [initialized,  setInitialized]  = useState(false);

  // Load today's record and holidays on login
  useEffect(() => {
    if (!currentUser) {
      setTodayRecord(null);
      setHolidays([]);
      setInitialized(false);
      return;
    }
    Promise.all([loadToday(), loadHolidays()]).finally(() => setInitialized(true));
  }, [currentUser?.id]);

  // Poll today's record every 60 s so status stays live
  useEffect(() => {
    if (!currentUser) return;
    const id = setInterval(() => loadToday(), 60_000);
    return () => clearInterval(id);
  }, [currentUser?.id]);

  const loadToday = async () => {
    if (!currentUser) return;
    setLoadingToday(true);
    try {
      const { record } = await api.attendance.today();
      setTodayRecord(record);
    } catch {}
    finally { setLoadingToday(false); }
  };

  const loadHolidays = async () => {
    try {
      const { holidays } = await api.holidays.list(new Date().getFullYear());
      setHolidays(holidays || []);
    } catch {}
  };

  // ── Status helpers ─────────────────────────────────────────
  const isHolidayDate = useCallback((dateStr) => {
    // Build local YYYY-MM-DD string to avoid IST→UTC shift
    const d = dateStr ? (() => { const [y,m,dd] = dateStr.split('-').map(Number); return new Date(y, m-1, dd); })() : new Date();
    const fmt = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return holidays.some((h) => h.date === fmt);
  }, [holidays]);

  const getHolidayName = useCallback((dateStr) => {
    const d = dateStr ? (() => { const [y,m,dd] = dateStr.split('-').map(Number); return new Date(y, m-1, dd); })() : new Date();
    const fmt = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return holidays.find((h) => h.date === fmt)?.name || null;
  }, [holidays]);

  const todayStatus = (() => {
    if (isTodaySunday()) return 'sunday';
    if (isHolidayDate()) return 'holiday';
    if (!todayRecord) return 'not_checked_in';
    if (todayRecord.checkoutTime) return 'checked_out';
    return 'checked_in';
  })();

  // ── Actions ────────────────────────────────────────────────
  const checkIn = async (locationInfo) => {
    try {
      const { record } = await api.attendance.checkIn(locationInfo);
      setTodayRecord(record);
      return { success: true, record };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const checkOut = async (locationInfo) => {
    try {
      const { record } = await api.attendance.checkOut(locationInfo);
      setTodayRecord(record);
      return { success: true, record };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const fetchHistory = async (month, userId) => {
    try {
      const params = { month };
      if (userId) params.user_id = userId;
      const { records } = await api.attendance.history(params);
      return { success: true, records };
    } catch (err) {
      return { success: false, error: err.message, records: [] };
    }
  };

  const fetchAllToday = async () => {
    try {
      const { records } = await api.attendance.allToday();
      return { success: true, records };
    } catch (err) {
      return { success: false, error: err.message, records: [] };
    }
  };

  const adjustRecord = async (id, data) => {
    try {
      const { record } = await api.attendance.adjust(id, data);
      return { success: true, record };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ── Holiday management (admin) ─────────────────────────────
  const addHoliday = async (date, name) => {
    try {
      const { holiday } = await api.holidays.add({ date, name });
      setHolidays((prev) => [...prev, holiday].sort((a, b) => a.date.localeCompare(b.date)));
      return { success: true, holiday };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const removeHoliday = async (id) => {
    try {
      await api.holidays.remove(id);
      setHolidays((prev) => prev.filter((h) => h.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return (
    <AttendanceContext.Provider value={{
      todayRecord, holidays, loadingToday, initialized, todayStatus,
      isHolidayDate, getHolidayName,
      checkIn, checkOut, loadToday,
      fetchHistory, fetchAllToday, adjustRecord,
      addHoliday, removeHoliday,
    }}>
      {children}
    </AttendanceContext.Provider>
  );
}

export const useAttendance = () => useContext(AttendanceContext);
