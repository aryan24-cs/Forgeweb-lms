import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Instant hydration from localStorage — no network delay for initial render
const getStoredUser = () => {
    try {
        const stored = localStorage.getItem('fw_user');
        const token = localStorage.getItem('fw_token');
        if (stored && token) return JSON.parse(stored);
    } catch { }
    return null;
};

export const AuthProvider = ({ children }) => {
    // Start with the cached user so the UI renders INSTANTLY
    const [user, setUser] = useState(getStoredUser);
    // If we have a cached user, don't show loading — render immediately
    const [loading, setLoading] = useState(!getStoredUser());

    useEffect(() => {
        const verifyUser = async () => {
            const token = localStorage.getItem('fw_token');
            if (token) {
                try {
                    // Background verify — UI already rendered with cached user
                    const res = await api.get('/auth/me');
                    setUser(res.data);
                    localStorage.setItem('fw_user', JSON.stringify(res.data));
                } catch (err) {
                    console.error('Session expired or invalid:', err);
                    logout(); // Clear invalid tokens
                }
            }
            setLoading(false);
        };
        verifyUser();
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('fw_token', res.data.token);
        localStorage.setItem('fw_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return res.data;
    };

    const logout = useCallback(() => {
        localStorage.removeItem('fw_token');
        localStorage.removeItem('fw_user');
        localStorage.removeItem('fw_data_cache');
        setUser(null);
    }, []);

    const updateUser = useCallback((userData) => {
        localStorage.setItem('fw_user', JSON.stringify(userData));
        setUser(userData);
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
