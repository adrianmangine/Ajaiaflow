import { createContext, useContext, useState, useEffect } from 'react';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (stored && token) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);
  const loginUser = (token, userData) => { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(userData)); setUser(userData); };
  const logoutUser = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); };
  return <AuthContext.Provider value={{ user, loading, loginUser, logoutUser }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
