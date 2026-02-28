import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import Payments from './pages/Payments';
import Analytics from './pages/Analytics';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-slate-50 ">
            <div className="text-center">
                <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm text-slate-500">Loading...</p>
            </div>
        </div>
    );
    if (!user) return <Navigate to="/login" replace />;
    return (
        <DataProvider>
            <Layout>{children}</Layout>
        </DataProvider>
    );
};

const RoleRoute = ({ children, restrictedRoles = [] }) => {
    const { user } = useAuth();
    if (restrictedRoles.includes(user?.role)) return <Navigate to="/" replace />;
    return <ProtectedRoute>{children}</ProtectedRoute>;
};

function App() {
    return (
        <BrowserRouter>
            <Toaster position="top-right" toastOptions={{
                style: { background: '#1e293b', color: '#fff', borderRadius: '12px', fontSize: '14px' },
            }} />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
                <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
                <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />

                {/* Restricted Routes */}
                <Route path="/payments" element={<RoleRoute restrictedRoles={['sales']}><Payments /></RoleRoute>} />
                <Route path="/analytics" element={<RoleRoute restrictedRoles={['sales']}><Analytics /></RoleRoute>} />
                <Route path="/reports" element={<RoleRoute restrictedRoles={['sales']}><Reports /></RoleRoute>} />

                <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
