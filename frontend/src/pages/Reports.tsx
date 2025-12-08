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
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    const COLORS = ['#22d3ee', '#a855f7', '#f472b6', '#34d399', '#fbbf24'];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="border-b border-border pb-6">
                <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center">
                    <BarChart2 className="w-8 h-8 mr-3 text-primary" />
                    Monthly Report
                </h1>
                <p className="text-muted-foreground mt-2">Insights into your learning and habits.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card-minimal p-6">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                        </div>
                        <h2 className="text-lg font-bold text-foreground">Daily Activity</h2>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportData?.dailyTotals}>
                                <XAxis dataKey="_id.day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--card)',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border)',
                                        color: 'var(--card-foreground)',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                    cursor={{ fill: 'var(--muted)' }}
                                />
                                <Bar dataKey="totalMinutes" fill="#2563eb" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card-minimal p-6">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <PieIcon className="w-5 h-5 text-purple-500" />
                        </div>
                        <h2 className="text-lg font-bold text-foreground">Category Distribution</h2>
                    </div>
                    <div className="h-72">
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
                                    contentStyle={{
                                        backgroundColor: 'var(--card)',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border)',
                                        color: 'var(--card-foreground)',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {reportData?.categoryDistribution.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-sm text-muted-foreground capitalize">{entry._id}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card-minimal p-6">
                <h2 className="text-lg font-bold text-foreground mb-6">Top Timepass Domains</h2>
                <div className="overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-left text-sm text-muted-foreground">
                        <thead className="bg-muted text-foreground font-semibold">
                            <tr>
                                <th className="px-6 py-4">Domain / Activity</th>
                                <th className="px-6 py-4 text-right">Duration</th>
                                <th className="px-6 py-4 text-right">Percentage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {reportData?.topTimepass.map((item: any, index: number) => (
                                <tr key={index} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-foreground">{item._id || 'Manual Entry'}</td>
                                    <td className="px-6 py-4 text-right">{item.totalMinutes} min</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full bg-red-500 rounded-full" style={{ width: '45%' }}></div>
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
