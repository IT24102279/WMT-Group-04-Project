import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import apiClient, { setAuthToken } from '../services/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem('auth_token'),
          AsyncStorage.getItem('auth_user')
        ]);

        if (storedToken) {
          setAuthToken(storedToken);
          setToken(storedToken);
        }

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.log('Auth bootstrap failed', error?.message || error);
      } finally {
        setIsAuthReady(true);
      }
    };

    bootstrapAuth();
  }, []);

  const login = async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const nextToken = response.data.token;
    const nextUser = response.data.user;

    await Promise.all([
      AsyncStorage.setItem('auth_token', nextToken),
      AsyncStorage.setItem('auth_user', JSON.stringify(nextUser))
    ]);
    setAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  const register = async (payload) => {
    const response = await apiClient.post('/auth/register', payload);
    const nextToken = response.data.token;
    const nextUser = response.data.user;

    await Promise.all([
      AsyncStorage.setItem('auth_token', nextToken),
      AsyncStorage.setItem('auth_user', JSON.stringify(nextUser))
    ]);
    setAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = async () => {
    await Promise.all([
      AsyncStorage.removeItem('auth_token'),
      AsyncStorage.removeItem('auth_user')
    ]);
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthReady,
      login,
      register,
      logout
    }),
    [user, token, isAuthReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
