import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { UserPlus, BookOpen, Lock, Mail, User } from 'lucide-react';

const Register: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('http://localhost:4000/api/v1/auth/register', {
                name,
                email,
                password,
            });
            login(data.token, data);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 transition-colors duration-300">
            <div className="w-full max-w-md card-minimal p-8 shadow-sm">
                <div className="text-center mb-8">
                    <div className="bg-primary w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <BookOpen className="text-primary-foreground w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Create Account</h2>
                    <p className="text-muted-foreground mt-2 text-sm">Join StudyTrack today</p>
                </div>

                {error && (
                    <div className="bg-destructive/10 text-destructive p-3 rounded-lg mb-6 text-sm border border-destructive/20 text-center font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                className="w-full input-minimal pl-10"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="email"
                                className="w-full input-minimal pl-10"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="password"
                                className="w-full input-minimal pl-10"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full btn-primary flex items-center justify-center space-x-2 mt-6"
                    >
                        <span>Create Account</span>
                        <UserPlus className="w-4 h-4" />
                    </button>
                </form>

                <p className="mt-8 text-center text-muted-foreground text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary font-medium hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
