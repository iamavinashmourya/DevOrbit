import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2, TrendingUp, PieChart as PieIcon, BarChart2 } from 'lucide-react';

const Reports: React.FC = () => {
    const { user } = useAuth();
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const { data } = await axios.get('http://localhost:4000/api/v1/reports/monthly', {
                    headers: { Authorization: `Bearer ${user?.token}` },
                });
                setReportData(data);
            } catch (error) {
                console.error('Error fetching report', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchReport();
        }
    }, [user]);

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
    );

    const COLORS = ['#22d3ee', '#a855f7', '#f472b6', '#34d399', '#fbbf24'];

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
                    <BarChart2 className="w-8 h-8 mr-3 text-cyan-400" />
                    Monthly Report
                </h1>
                <p className="text-slate-400 mt-1">Insights into your learning and habits.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-10 -mt-10"></div>
                    <div className="flex items-center space-x-3 mb-6 relative z-10">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-blue-400" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Daily Activity</h2>
                    </div>
                    <div className="h-72 relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportData?.dailyTotals}>
                                <XAxis dataKey="_id.day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar dataKey="totalMinutes" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full -mr-10 -mt-10"></div>
                    <div className="flex items-center space-x-3 mb-6 relative z-10">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <PieIcon className="w-5 h-5 text-purple-400" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Category Distribution</h2>
                    </div>
                    <div className="h-72 relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={reportData?.categoryDistribution}
                                    dataKey="totalMinutes"
                                    nameKey="_id"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                >
                                    {reportData?.categoryDistribution.map((_entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 mt-4 relative z-10">
                        {reportData?.categoryDistribution.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-sm text-slate-400 capitalize">{entry._id}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl">
                <h2 className="text-lg font-bold text-white mb-6">Top Timepass Domains</h2>
                <div className="overflow-hidden rounded-xl border border-white/5">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-white/5 text-slate-200 font-semibold">
                            <tr>
                                <th className="px-6 py-4">Domain / Activity</th>
                                <th className="px-6 py-4 text-right">Duration</th>
                                <th className="px-6 py-4 text-right">Percentage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {reportData?.topTimepass.map((item: any, index: number) => (
                                <tr key={index} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-200">{item._id || 'Manual Entry'}</td>
                                    <td className="px-6 py-4 text-right">{item.totalMinutes} min</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" style={{ width: '45%' }}></div>
                                            </div>
                                            <span>45%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
