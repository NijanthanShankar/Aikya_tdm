import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    api.auth.me()
      .then(({ user }) => {
        setCurrentUser(user);
        // Both admin and manager need the users list (for task assignment, team view, etc.)
        if (user?.role === 'admin' || user?.role === 'manager') loadUsers();
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadUsers = async () => {
    try {
      const { users } = await api.users.list();
      setUsers(users);
    } catch {}
  };

  const login = async (email, password) => {
    try {
      const { user } = await api.auth.login(email, password);
      setCurrentUser(user);
      if (user.role === 'admin' || user.role === 'manager') await loadUsers();
      return { success: true, user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    await api.auth.logout().catch(() => {});
    setCurrentUser(null);
    setUsers([]);
  };

  // ── Admin: manage team members ────────────────────────────────
  const createUser = async (payload) => {
    try {
      const { user } = await api.users.create(payload);
      setUsers((prev) => [...prev, user]);
      return { success: true, user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateUser = async (id, updates) => {
    try {
      const { user } = await api.users.update(id, updates);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...user } : u)));
      return { success: true, user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteUser = async (id) => {
    try {
      await api.users.remove(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ── Self: update own profile ──────────────────────────────────
  const updateProfile = async (data) => {
    try {
      const { user } = await api.users.updateSelf(data);
      setCurrentUser((prev) => ({ ...prev, ...user }));
      return { success: true, user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.users.changePassword({ currentPassword, newPassword });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser, users, loading,
      login, logout,
      createUser, updateUser, deleteUser, reloadUsers: loadUsers,
      updateProfile, changePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
