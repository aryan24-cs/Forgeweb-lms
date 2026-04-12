import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';

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
        <div className="min-h-screen flex bg-[#FAFAFA] text-slate-900">
            {/* Left side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10 bg-white shadow-[20px_0_60px_-15px_rgba(0,0,0,0.05)]">
                <div className="w-full max-w-[420px] animate-slideIn">
                    {/* Logo Section */}
                    <div className="mb-6 lg:mb-8">
                        <div className="mb-2">
                            <img src={logoImg} alt="ForgeWeb Logo" className="h-[60px] mb-5 w-auto object-contain mix-blend-multiply pointer-events-none" />
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2 text-[#111111]">Welcome <span className="font-serif italic text-primary font-normal">Back</span></h1>
                        <p className="text-slate-500 font-medium text-lg mt-3">Please enter your details to sign in.</p>
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
                            <label className="block text-sm font-bold text-[#111111] mb-2 uppercase tracking-wide">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="fw-input py-3.5 text-base"
                                placeholder="name@forgeweb.in"
                                required
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-bold text-[#111111] uppercase tracking-wide">Password</label>
                                <a href="#" className="text-sm font-bold text-primary hover:text-primary-hover transition-colors">Forgot password?</a>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="fw-input py-3.5 text-base"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full fw-btn-primary text-lg mt-4 flex items-center justify-center gap-2"
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

                    <div className="mt-12 pt-6 text-center">
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">
                            ForgeWeb LMS
                        </p>
                    </div>
                </div>
            </div>

            {/* Right side - Decoration */}
            <div className="hidden lg:flex w-1/2 bg-[#FAFAFA] items-center justify-center relative overflow-hidden" 
                 style={{ 
                    backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                 }}>
                {/* Visual Interest Backgrounds */}
                <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 mix-blend-multiply"></div>
                <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-sky-300/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 mix-blend-multiply"></div>

                <div className="relative z-10 max-w-lg text-center px-12 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                    <h2 className="text-5xl font-black mb-6 tracking-tight text-[#111111]">Accelerate your <span className="font-serif italic text-primary font-normal">workflow</span>.</h2>
                    <p className="text-lg text-slate-500 leading-relaxed font-medium max-w-md mx-auto">
                        Manage leads, track revenue, and centralize your agency operations with a remarkably beautiful platform.
                    </p>

                    {/* User avatars cluster */}
                    <div className="flex items-center justify-center gap-4 mt-16 bg-white/80 p-5 rounded-full backdrop-blur-xl border border-white shadow-[0_20px_40px_rgba(0,0,0,0.04)] inline-flex">
                        <div className="flex -space-x-4">
                            <div className="w-12 h-12 rounded-full border-[3px] border-white bg-[#111111] shadow-md flex items-center justify-center text-white text-sm font-bold">A</div>
                            <div className="w-12 h-12 rounded-full border-[3px] border-white bg-primary shadow-md flex items-center justify-center text-white text-sm font-bold">V</div>
                            <div className="w-12 h-12 rounded-full border-[3px] border-white bg-sky-500 shadow-md flex items-center justify-center text-white text-sm font-bold">S</div>
                        </div>
                        <div className="text-left pl-2 pr-4">
                            <p className="text-sm font-bold text-[#111111]">Your entire team is here</p>
                            <p className="text-[13px] text-slate-500 font-medium tracking-wide">Join 3+ active members</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
