import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const { currentUser } = useAuth();
  const [tasks, setTasks]         = useState([]);
  const [loadingTasks, setLoading] = useState(false);

  const refreshTasks = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const { tasks } = await api.tasks.list(filters);
      setTasks(tasks);
    } catch {}
    finally { setLoading(false); }
  }, []);

  // ── Load tasks when user logs in / changes ────────────────────
  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      return;
    }
    refreshTasks();
  }, [currentUser?.id]);

  // ── Poll every 30 s so the list stays live ─────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const id = setInterval(() => refreshTasks(), 30_000);
    return () => clearInterval(id);
  }, [currentUser?.id, refreshTasks]);

  // ── Task CRUD ─────────────────────────────────────────────────
  const createTask = useCallback(async (data) => {
    try {
      const { task } = await api.tasks.create(data);
      setTasks((prev) => [task, ...prev]);
      return { success: true, task };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const updateTask = useCallback(async (id, data) => {
    try {
      const { task } = await api.tasks.update(id, data);
      setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
      return { success: true, task };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const deleteTask = useCallback(async (id) => {
    try {
      await api.tasks.remove(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // ── Notes ─────────────────────────────────────────────────────
  const getNotes = useCallback(async (taskId) => {
    try {
      const { notes } = await api.notes.list(taskId);
      return { success: true, notes };
    } catch (err) {
      return { success: false, error: err.message, notes: [] };
    }
  }, []);

  const addNote = useCallback(async (taskId, text, attachments = []) => {
    try {
      const { note } = await api.notes.add({ taskId, text, attachments });
      // Increment notes count in local state
      setTasks((prev) => prev.map((t) =>
        t.id === taskId ? { ...t, notesCount: (t.notesCount || 0) + 1 } : t
      ));
      return { success: true, note };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const deleteNote = useCallback(async (noteId, taskId) => {
    try {
      await api.notes.remove(noteId);
      setTasks((prev) => prev.map((t) =>
        t.id === taskId ? { ...t, notesCount: Math.max(0, (t.notesCount || 1) - 1) } : t
      ));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // ── Selectors ─────────────────────────────────────────────────
  const getTaskById      = (id)     => tasks.find((t) => t.id === id) || null;
  const getTasksByStatus = (status) => tasks.filter((t) => t.status === status);
  const getTasksByUser   = (userId) => tasks.filter((t) => t.assignedTo === userId);

  const getStats = () => ({
    total:      tasks.length,
    pending:    tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    completed:  tasks.filter((t) => t.status === 'completed').length,
  });

  return (
    <TaskContext.Provider value={{
      tasks, loadingTasks,
      refreshTasks, createTask, updateTask, deleteTask,
      getNotes, addNote, deleteNote,
      getTaskById, getTasksByStatus, getTasksByUser, getStats,
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export const useTask = () => useContext(TaskContext);
