import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyUser = async () => {
            const token = localStorage.getItem('fw_token');
            if (token) {
                try {
                    // Force a verify request to the backend
                    const res = await api.get('/auth/me');
                    setUser(res.data);
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

    const logout = () => {
        localStorage.removeItem('fw_token');
        localStorage.removeItem('fw_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
