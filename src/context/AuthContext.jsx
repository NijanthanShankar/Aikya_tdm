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
        if (user?.role === 'admin') loadUsers();
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
      if (user.role === 'admin') await loadUsers();
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
      if (currentUser?.id === id) setCurrentUser((prev) => ({ ...prev, ...user }));
      return { success: true };
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

  return (
    <AuthContext.Provider value={{
      currentUser, users, loading,
      login, logout, createUser, updateUser, deleteUser,
      reloadUsers: loadUsers,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
