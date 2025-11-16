import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Card } from '../ui/Card';
import { ChartData, DailyPerformanceData } from './dashboardTypes';

interface ChartsSectionProps {
    callsVsDealsData: { name: string; calls: number; deals: number }[];
    interestData: ChartData[];
    dailyPerformanceData: DailyPerformanceData[];
    leadsByStatusData: ChartData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
                <p className="font-semibold text-sm text-gray-700">{label}</p>
                {payload.map((p: any, i: number) => (
                    <p key={i} style={{ color: p.color }} className="text-xs">{`${p.name}: ${p.value.toLocaleString()}`}</p>
                ))}
            </div>
        );
    }
    return null;
};

const PIE_COLORS = ['#3b82f6', '#ef4444', '#f97316', '#8b5cf6', '#10b981', '#64748b', '#ec4899'];

export const ChartsSection: React.FC<ChartsSectionProps> = ({ callsVsDealsData, interestData, dailyPerformanceData, leadsByStatusData }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Call Performance</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyPerformanceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} name="Calls Made" />
                    </LineChart>
                </ResponsiveContainer>
            </Card>
            <Card>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Leads by Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={leadsByStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                            {leadsByStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </Card>
            <Card>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Interested vs. Not Interested</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={interestData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                            {interestData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </Card>
            <Card>
                 <h3 className="text-lg font-semibold text-gray-800 mb-4">Calls Attempted vs. Deals Done</h3>
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={callsVsDealsData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="calls" fill="#3b82f6" name="Calls Attempted" />
                        <Bar dataKey="deals" fill="#10b981" name="Deals Done" />
                    </BarChart>
                 </ResponsiveContainer>
            </Card>
        </div>
    );
};