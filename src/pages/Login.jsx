import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white text-slate-900">
            {/* Left side - Login Form */}
            <div className="w-full lg flex items-center justify-center p-8 lg relative z-10">
                <div className="w-full max-w-[420px] animate-slideIn">
                    {/* Logo Section */}
                    <div className="mb-10 lg ">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white text-xl font-black mb-6 shadow-xl shadow-indigo-600/20">
                            FW
                        </div>
                        <h1 className="text-3xl sm font-black tracking-tight mb-2 text-slate-800">Welcome Back</h1>
                        <p className="text-slate-500 font-medium">Please enter your details to sign in.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm font-medium p-4 rounded-xl mb-6 border border-red-100 flex items-start gap-3">
                            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="fw-input py-3 text-base"
                                placeholder="name@forgeweb.in"
                                required
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-bold text-slate-700">Password</label>
                                <a href="#" className="text-sm font-semibold text-indigo-600 hover transition-colors">Forgot password?</a>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="fw-input py-3 text-base"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-indigo-600 hover text-white font-bold rounded-xl transition-all duration-300 shadow-[0_8px_20px_-4px_rgba(79,70,229,0.3)] hover _12px_24px_-6px_rgba(79,70,229,0.4)] hover .5 disabled disabled  text-base flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Signing in...
                                </>
                            ) : (
                                'Sign In to Dashboard'
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                        <p className="text-sm text-slate-400 font-medium">
                            Secure Access • ForgeWeb LMS
                        </p>
                    </div>
                </div>
            </div>

            {/* Right side - Decoration */}
            <div className="hidden lg w-1/2 bg-slate-50/50 border-l border-slate-200/50 items-center justify-center relative overflow-hidden">
                {/* Visual Interest Backgrounds */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-200/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-sky-200/40 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3"></div>

                <div className="relative z-10 max-w-lg text-center px-12 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                    <div className="w-24 h-24 mx-auto bg-white/80 rounded-2xl shadow-xl shadow-slate-200/50 backdrop-blur-sm flex items-center justify-center mb-10 border border-slate-200/50">
                        <svg className="w-12 h-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118.75 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                        </svg>
                    </div>
                    <h2 className="text-4xl font-black mb-5 tracking-tight text-slate-800">Accelerate your workflow.</h2>
                    <p className="text-lg text-slate-500 leading-relaxed font-medium max-w-md mx-auto">
                        Manage leads, track revenue, and centralize your agency operations with a remarkably beautiful platform.
                    </p>

                    {/* User avatars cluster */}
                    <div className="flex items-center justify-center gap-4 mt-12 bg-white/60 p-4 rounded-2xl backdrop-blur-md border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] inline-flex">
                        <div className="flex -space-x-4">
                            <div className="w-12 h-12 rounded-full border-[3px] border-white bg-emerald-500 shadow-md flex items-center justify-center text-white text-sm font-bold">A</div>
                            <div className="w-12 h-12 rounded-full border-[3px] border-white bg-blue-500 shadow-md flex items-center justify-center text-white text-sm font-bold">V</div>
                            <div className="w-12 h-12 rounded-full border-[3px] border-white bg-amber-500 shadow-md flex items-center justify-center text-white text-sm font-bold">S</div>
                        </div>
                        <div className="text-left pl-2">
                            <p className="text-sm font-bold text-slate-800">Your entire team is here</p>
                            <p className="text-[13px] text-slate-500 font-medium">Join 3+ active members</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
