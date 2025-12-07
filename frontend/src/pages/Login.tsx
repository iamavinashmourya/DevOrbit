import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LogIn, Zap, Lock, Mail } from 'lucide-react';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('http://localhost:4000/api/v1/auth/login', {
                email,
                password,
            });
            login(data.token, data);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="glass-panel p-8 rounded-3xl w-full max-w-md border border-white/10 relative z-10 shadow-2xl shadow-black/50">
                <div className="text-center mb-8">
                    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/30 animate-float">
                        <Zap className="text-white w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h2>
                    <p className="text-slate-400 mt-2">Sign in to continue to StudyTrack</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-6 text-sm border border-red-500/20 flex items-center justify-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                        </div>
                        <input
                            type="email"
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3.5 pl-11 pr-4 text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-600"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                        </div>
                        <input
                            type="password"
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3.5 pl-11 pr-4 text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-600"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all active:scale-95 flex items-center justify-center space-x-2 group"
                    >
                        <span>Sign In</span>
                        <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                <p className="mt-8 text-center text-slate-500">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors">
                        Create account
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
