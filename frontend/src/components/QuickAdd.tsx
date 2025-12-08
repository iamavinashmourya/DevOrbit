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
        <div className="card-minimal p-6">
            <h2 className="text-sm font-bold text-foreground mb-6 flex items-center tracking-wide">
                <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                QUICK LOG
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Type</label>
                    <div className="relative">
                        <select
                            className="w-full input-minimal appearance-none cursor-pointer"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="learn">Learning</option>
                            <option value="dsa">DSA Practice</option>
                            <option value="project">Project Work</option>
                            <option value="assignment">Assignment</option>
                            <option value="timepass">Timepass</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-xs">
                            ▼
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Activity</label>
                    <input
                        type="text"
                        className="w-full input-minimal"
                        placeholder="What are you working on?"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Logging...</span>
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                <span>Log Activity</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default QuickAdd;
