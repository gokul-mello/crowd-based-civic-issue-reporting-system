import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('civic_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
          }
        } catch (err) {
          console.warn('Session expired or invalid:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    fetchMe();
  }, [token]);

  const loginCitizen = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('civic_token', res.data.token);
      localStorage.setItem('civic_role', 'citizen');
      setToken(res.data.token);
      setUser(res.data.user);
    }
    return res.data;
  };

  const registerCitizen = async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (res.data.success) {
      localStorage.setItem('civic_token', res.data.token);
      localStorage.setItem('civic_role', 'citizen');
      setToken(res.data.token);
      setUser(res.data.user);
    }
    return res.data;
  };

  const loginAuthority = async (email, password) => {
    const res = await api.post('/auth/authority/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('civic_token', res.data.token);
      localStorage.setItem('civic_role', 'authority');
      setToken(res.data.token);
      setUser(res.data.user);
    }
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('civic_token');
    localStorage.removeItem('civic_role');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data) => {
    const res = await api.put('/auth/profile', data);
    if (res.data.success) {
      setUser(res.data.user);
    }
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isCitizen: user?.role === 'citizen',
        isAuthority: user?.role === 'authority',
        loginCitizen,
        registerCitizen,
        loginAuthority,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
