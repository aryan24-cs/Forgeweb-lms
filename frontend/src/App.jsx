import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import PageLoader from './components/ui/PageLoader';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import Payments from './pages/Payments';
import Analytics from './pages/Analytics';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Salary from './pages/Salary';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <PageLoader label="Authenticating Secure Session..." />;
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
                <Route path="/leads" element={<RoleRoute restrictedRoles={['developer', 'client']}><Leads /></RoleRoute>} />
                <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
                <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />

                {/* Restricted Routes — Financial Suite, Analytics, Reports blocked for sales & developer */}
                <Route path="/payments" element={<RoleRoute restrictedRoles={['sales', 'developer', 'client']}><Payments /></RoleRoute>} />
                <Route path="/salary" element={<RoleRoute restrictedRoles={['sales', 'developer', 'client']}><Salary /></RoleRoute>} />
                <Route path="/analytics" element={<RoleRoute restrictedRoles={['sales', 'developer', 'client']}><Analytics /></RoleRoute>} />
                <Route path="/reports" element={<RoleRoute restrictedRoles={['sales', 'developer', 'client']}><Reports /></RoleRoute>} />

                <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
