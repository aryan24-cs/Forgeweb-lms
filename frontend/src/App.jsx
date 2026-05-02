import React, { Suspense, lazy, memo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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

// Shared authenticated shell — mounted ONCE, persists across all route changes
// This prevents Layout/DataProvider/Sidebar/Topbar from unmounting/remounting
const AuthenticatedShell = memo(() => {
    const { user, loading } = useAuth();
    if (loading) return <PageLoader label="Authenticating Secure Session..." />;
    if (!user) return <Navigate to="/login" replace />;
    return (
        <DataProvider>
            <Layout>
                <Suspense fallback={<PageLoader label="Loading Module..." />}>
                    <Outlet />
                </Suspense>
            </Layout>
        </DataProvider>
    );
});

AuthenticatedShell.displayName = 'AuthenticatedShell';

const RoleGate = ({ restrictedRoles = [], children }) => {
    const { user } = useAuth();
    if (restrictedRoles.includes(user?.role)) return <Navigate to="/" replace />;
    return children;
};

function App() {
    return (
        <BrowserRouter>
            <Toaster position="top-right" toastOptions={{
                style: { background: '#ffffff', color: '#111111', borderRadius: '16px', fontSize: '14px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)' },
            }} />
            <Routes>
                <Route path="/login" element={
                    <Suspense fallback={<PageLoader label="Loading..." />}>
                        <Login />
                    </Suspense>
                } />

                {/* Single authenticated shell — Layout & DataProvider mounted ONCE */}
                <Route element={<AuthenticatedShell />}>
                    <Route index element={<Dashboard />} />
                    <Route path="leads" element={<RoleGate restrictedRoles={['developer', 'client', 'intern', 'employee']}><Leads /></RoleGate>} />
                    <Route path="clients" element={<RoleGate restrictedRoles={['intern']}><Clients /></RoleGate>} />
                    <Route path="projects" element={<RoleGate restrictedRoles={['intern']}><Projects /></RoleGate>} />

                    {/* Restricted Routes — Financial Suite, Analytics, Reports blocked for sales & developer */}
                    <Route path="payments" element={<RoleGate restrictedRoles={['sales', 'developer', 'client', 'intern', 'employee']}><Payments /></RoleGate>} />
                    <Route path="salary" element={<RoleGate restrictedRoles={['sales', 'developer', 'client', 'intern', 'employee']}><Salary /></RoleGate>} />
                    <Route path="daily-record" element={<RoleGate restrictedRoles={['sales', 'developer', 'client', 'intern']}><DailyChecklist /></RoleGate>} />
                    <Route path="analytics" element={<RoleGate restrictedRoles={['sales', 'developer', 'client', 'intern', 'employee']}><Analytics /></RoleGate>} />
                    <Route path="reports" element={<RoleGate restrictedRoles={['sales', 'developer', 'client', 'intern', 'employee']}><Reports /></RoleGate>} />

                    <Route path="tasks" element={<Tasks />} />
                    <Route path="notes" element={<Notes />} />
                    <Route path="settings" element={<Settings />} />
                </Route>

                {/* Catch-all route to prevent blank pages on unknown routes */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
