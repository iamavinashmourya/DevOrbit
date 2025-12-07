import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Loader2, Zap } from 'lucide-react';

interface QuickAddProps {
    onActivityAdded: () => void;
}

const QuickAdd: React.FC<QuickAddProps> = ({ onActivityAdded }) => {
    const { user } = useAuth();
    const [type, setType] = useState('learn');
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        setLoading(true);
        try {
            await axios.post(
                'http://localhost:4000/api/v1/activities',
                {
                    type,
                    title,
                    startTime: new Date().toISOString(),
                    endTime: new Date().toISOString(),
                },
                {
                    headers: { Authorization: `Bearer ${user?.token}` },
                }
            );
            setTitle('');
            onActivityAdded();
        } catch (error) {
            console.error('Error adding activity', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full -mr-10 -mt-10"></div>

            <h2 className="text-xl font-bold text-white mb-6 flex items-center relative z-10">
                <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                Quick Log
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Type</label>
                    <div className="relative">
                        <select
                            className="w-full input-futuristic appearance-none cursor-pointer"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="learn">Learning</option>
                            <option value="dsa">DSA Practice</option>
                            <option value="project">Project Work</option>
                            <option value="assignment">Assignment</option>
                            <option value="timepass">Timepass</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            ▼
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Activity</label>
                    <input
                        type="text"
                        className="w-full input-futuristic"
                        placeholder="What are you working on?"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Logging...</span>
                        </>
                    ) : (
                        <>
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            <span>Log Activity</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default QuickAdd;
