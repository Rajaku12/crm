import React, { useMemo } from 'react';
import { Agent, Lead, Activity, ActivityType, LeadStatus } from '../../types';
import { Card } from '../ui/Card';
import { ChartBarIcon, PhoneIcon, BuildingOfficeIcon, UserGroupIcon, TrendingUpIcon } from '../icons/IconComponents';

interface PerformanceDashboardProps {
    currentUser: Agent;
    agents: Agent[];
    leads: Lead[];
}

interface PerformanceMetrics {
    totalLeads: number;
    activeLeads: number;
    convertedLeads: number;
    totalCalls: number;
    successfulCalls: number;
    totalSales: number;
    conversionRate: number;
    callSuccessRate: number;
    monthlyCallsProgress: number;
    monthlySalesProgress: number;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
    currentUser,
    agents,
    leads,
}) => {
    // Get users to show performance for
    const usersToShow = useMemo(() => {
        if (currentUser.role === 'Admin') {
            return agents;
        } else if (currentUser.role === 'Sales Manager') {
            return agents.filter(a => 
                a.team === currentUser.team && 
                (a.role === 'Agent' || a.role === 'Telecaller')
            );
        } else {
            return [currentUser];
        }
    }, [currentUser, agents]);

    // Calculate performance for each user
    const userPerformance = useMemo(() => {
        return usersToShow.map(user => {
            const userLeads = leads.filter(l => l.agentId === user.id);
            const allActivities = userLeads.flatMap(l => l.activities);
            const calls = allActivities.filter(a => a.type === ActivityType.Call);
            const successfulCalls = calls.filter(c => c.outcome === 'Success');
            const convertedLeads = userLeads.filter(l => 
                l.status === LeadStatus.Approved || l.status === LeadStatus.Closed
            );

            const metrics: PerformanceMetrics = {
                totalLeads: userLeads.length,
                activeLeads: userLeads.filter(l => 
                    l.status !== LeadStatus.Closed && 
                    l.status !== LeadStatus.Rejected && 
                    l.status !== LeadStatus.Lost
                ).length,
                convertedLeads: convertedLeads.length,
                totalCalls: calls.length,
                successfulCalls: successfulCalls.length,
                totalSales: convertedLeads.length,
                conversionRate: userLeads.length > 0 
                    ? (convertedLeads.length / userLeads.length) * 100 
                    : 0,
                callSuccessRate: calls.length > 0 
                    ? (successfulCalls.length / calls.length) * 100 
                    : 0,
                monthlyCallsProgress: user.monthlyCallsTarget 
                    ? (calls.length / user.monthlyCallsTarget) * 100 
                    : 0,
                monthlySalesProgress: user.monthlySalesTarget 
                    ? (convertedLeads.length / user.monthlySalesTarget) * 100 
                    : 0,
            };

            return { user, metrics };
        });
    }, [usersToShow, leads]);

    const MetricCard: React.FC<{
        title: string;
        value: string | number;
        subtitle?: string;
        icon: React.ReactNode;
        progress?: number;
        color?: 'blue' | 'green' | 'yellow' | 'purple';
    }> = ({ title, value, subtitle, icon, progress, color = 'blue' }) => {
        const colorClasses = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            yellow: 'bg-yellow-100 text-yellow-600',
            purple: 'bg-purple-100 text-purple-600',
        };

        return (
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                        {icon}
                    </div>
                    {progress !== undefined && (
                        <div className="text-right">
                            <div className="text-2xl font-bold text-gray-800">{value}</div>
                            {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-600">{title}</h3>
                    {progress === undefined && (
                        <div className="text-2xl font-bold text-gray-800">{value}</div>
                    )}
                    {progress !== undefined && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${
                                    progress >= 100 ? 'bg-green-500' :
                                    progress >= 75 ? 'bg-blue-500' :
                                    progress >= 50 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                        </div>
                    )}
                </div>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            {userPerformance.map(({ user, metrics }) => (
                <div key={user.id} className="space-y-6">
                    {/* User Header */}
                    <Card className="p-6">
                        <div className="flex items-center space-x-4">
                            <img
                                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff`}
                                alt={user.name}
                                className="h-16 w-16 rounded-full border-4 border-primary-100"
                            />
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                                <p className="text-gray-500">{user.email}</p>
                                <div className="flex items-center space-x-4 mt-2">
                                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                                        {user.role}
                                    </span>
                                    {user.team && (
                                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                            {user.team}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            title="Total Leads"
                            value={metrics.totalLeads}
                            icon={<UserGroupIcon className="h-6 w-6" />}
                            color="blue"
                        />
                        <MetricCard
                            title="Active Leads"
                            value={metrics.activeLeads}
                            icon={<TrendingUpIcon className="h-6 w-6" />}
                            color="green"
                        />
                        <MetricCard
                            title="Converted Leads"
                            value={metrics.convertedLeads}
                            icon={<BuildingOfficeIcon className="h-6 w-6" />}
                            color="purple"
                        />
                        <MetricCard
                            title="Total Calls"
                            value={metrics.totalCalls}
                            icon={<PhoneIcon className="h-6 w-6" />}
                            color="yellow"
                        />
                    </div>

                    {/* Progress Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <MetricCard
                            title="Conversion Rate"
                            value={`${metrics.conversionRate.toFixed(1)}%`}
                            subtitle={`${metrics.convertedLeads} out of ${metrics.totalLeads} leads`}
                            icon={<ChartBarIcon className="h-6 w-6" />}
                            progress={metrics.conversionRate}
                            color="green"
                        />
                        <MetricCard
                            title="Call Success Rate"
                            value={`${metrics.callSuccessRate.toFixed(1)}%`}
                            subtitle={`${metrics.successfulCalls} out of ${metrics.totalCalls} calls`}
                            icon={<PhoneIcon className="h-6 w-6" />}
                            progress={metrics.callSuccessRate}
                            color="blue"
                        />
                    </div>

                    {/* Monthly Targets */}
                    {(user.monthlyCallsTarget || user.monthlySalesTarget) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {user.monthlyCallsTarget && (
                                <MetricCard
                                    title="Monthly Calls Target"
                                    value={metrics.totalCalls}
                                    subtitle={`Target: ${user.monthlyCallsTarget} calls`}
                                    icon={<PhoneIcon className="h-6 w-6" />}
                                    progress={metrics.monthlyCallsProgress}
                                    color="blue"
                                />
                            )}
                            {user.monthlySalesTarget && (
                                <MetricCard
                                    title="Monthly Sales Target"
                                    value={metrics.totalSales}
                                    subtitle={`Target: ${user.monthlySalesTarget} sales`}
                                    icon={<BuildingOfficeIcon className="h-6 w-6" />}
                                    progress={metrics.monthlySalesProgress}
                                    color="green"
                                />
                            )}
                        </div>
                    )}

                    {/* Detailed Stats Table */}
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Statistics</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Metric</th>
                                        <th className="px-4 py-3 text-right">Value</th>
                                        <th className="px-4 py-3 text-right">Percentage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    <tr>
                                        <td className="px-4 py-3 font-medium text-gray-900">Total Leads</td>
                                        <td className="px-4 py-3 text-right text-gray-600">{metrics.totalLeads}</td>
                                        <td className="px-4 py-3 text-right text-gray-500">100%</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-medium text-gray-900">Active Leads</td>
                                        <td className="px-4 py-3 text-right text-gray-600">{metrics.activeLeads}</td>
                                        <td className="px-4 py-3 text-right text-gray-500">
                                            {metrics.totalLeads > 0 
                                                ? `${((metrics.activeLeads / metrics.totalLeads) * 100).toFixed(1)}%`
                                                : '0%'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-medium text-gray-900">Converted Leads</td>
                                        <td className="px-4 py-3 text-right text-gray-600">{metrics.convertedLeads}</td>
                                        <td className="px-4 py-3 text-right text-green-600 font-semibold">
                                            {metrics.conversionRate.toFixed(1)}%
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-medium text-gray-900">Total Calls</td>
                                        <td className="px-4 py-3 text-right text-gray-600">{metrics.totalCalls}</td>
                                        <td className="px-4 py-3 text-right text-gray-500">-</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-medium text-gray-900">Successful Calls</td>
                                        <td className="px-4 py-3 text-right text-gray-600">{metrics.successfulCalls}</td>
                                        <td className="px-4 py-3 text-right text-blue-600 font-semibold">
                                            {metrics.callSuccessRate.toFixed(1)}%
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            ))}
        </div>
    );
};

