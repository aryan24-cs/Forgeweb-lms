import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import PageLoader from './components/ui/PageLoader';

// Lazy load feature modules for performance optimization
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Leads = lazy(() => import('./pages/Leads'));
const Clients = lazy(() => import('./pages/Clients'));
const Projects = lazy(() => import('./pages/Projects'));
const Payments = lazy(() => import('./pages/Payments'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Salary = lazy(() => import('./pages/Salary'));
const DailyChecklist = lazy(() => import('./pages/DailyChecklist'));
const Notes = lazy(() => import('./pages/Notes'));

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
                style: { background: '#ffffff', color: '#111111', borderRadius: '16px', fontSize: '14px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)' },
            }} />
            <Suspense fallback={<PageLoader label="Loading Module..." />}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/leads" element={<RoleRoute restrictedRoles={['developer', 'client']}><Leads /></RoleRoute>} />
                    <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
                    <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />

                    {/* Restricted Routes — Financial Suite, Analytics, Reports blocked for sales & developer */}
                    <Route path="/payments" element={<RoleRoute restrictedRoles={['sales', 'developer', 'client']}><Payments /></RoleRoute>} />
                    <Route path="/salary" element={<RoleRoute restrictedRoles={['sales', 'developer', 'client']}><Salary /></RoleRoute>} />
                    <Route path="/daily-record" element={<RoleRoute restrictedRoles={['sales', 'developer', 'client']}><DailyChecklist /></RoleRoute>} />
                    <Route path="/analytics" element={<RoleRoute restrictedRoles={['sales', 'developer', 'client']}><Analytics /></RoleRoute>} />
                    <Route path="/reports" element={<RoleRoute restrictedRoles={['sales', 'developer', 'client']}><Reports /></RoleRoute>} />

                    <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                    <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                    {/* Catch-all route to prevent blank pages on unknown routes */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;
