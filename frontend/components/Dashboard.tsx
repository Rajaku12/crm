import React, { useState, useMemo } from 'react';
import { Lead, Agent } from '../types';
import { MetricCard } from './dashboard/MetricCard';
import { ChartsSection } from './dashboard/ChartsSection';
import { RecentFollowUps } from './dashboard/RecentFollowUps';
import { getDashboardStats, DateFilterOption } from '../services/dashboardService';
import { PhoneIcon, HeartIcon, PhoneXMarkIcon, ClockIcon, LeadsIcon, ExclamationTriangleIcon, CurrencyDollarIcon } from './icons/IconComponents';
import { useAppContext } from '../contexts/AppContext';

interface DashboardPageProps {
  onSelectLead: (lead: Lead) => void;
  currentUser: Agent;
}

export const Dashboard: React.FC<DashboardPageProps> = ({ onSelectLead, currentUser }) => {
    const { leads, agents } = useAppContext();
    const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
    const [agentFilter, setAgentFilter] = useState<number | string | 'all'>(
        (currentUser.role === 'Admin' || currentUser.role === 'Sales Manager') ? 'all' : currentUser.id
    );

    const { stats, charts, followUps } = useMemo(() => {
        return getDashboardStats(leads, agents, dateFilter, agentFilter);
    }, [leads, agents, dateFilter, agentFilter]);
    
    const visibleAgents = useMemo(() => {
        if (currentUser.role === 'Admin') return agents;
        if (currentUser.role === 'Sales Manager') return agents.filter(a => a.team === currentUser.team);
        return [currentUser];
    }, [agents, currentUser]);

    const metricCards = [
        { title: "Total Attempted Calls", data: stats.totalAttemptedCalls, icon: <PhoneIcon className="h-6 w-6" />, color: "text-blue-600 bg-blue-100" },
        { title: "Total Interested", data: stats.totalInterested, icon: <HeartIcon className="h-6 w-6" />, color: "text-pink-600 bg-pink-100" },
        { title: "Total Deals Done", data: stats.totalDealsDone, icon: <CurrencyDollarIcon className="h-6 w-6" />, color: "text-green-600 bg-green-100" },
        { title: "Un-Attempted Leads", data: stats.unAttemptedLeads, icon: <PhoneXMarkIcon className="h-6 w-6" />, color: "text-red-600 bg-red-100" },
        { title: "Today’s Pending Calls", data: stats.todaysPendingCalls, icon: <ClockIcon className="h-6 w-6" />, color: "text-yellow-600 bg-yellow-100" },
        { title: "Total Leads", data: stats.totalLeads, icon: <LeadsIcon className="h-6 w-6" />, color: "text-indigo-600 bg-indigo-100" },
        { title: "Old Pending Follow-Ups", data: stats.oldPendingFollowUps, icon: <ExclamationTriangleIcon className="h-6 w-6" />, color: "text-orange-600 bg-orange-100" },
    ];
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-sm text-gray-500">Analytics overview for your sales team.</p>
                </div>
                <div className="flex items-center gap-2">
                    <select 
                        value={dateFilter} 
                        onChange={e => setDateFilter(e.target.value as DateFilterOption)} 
                        className="p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                        title="Date filter"
                        aria-label="Select date filter"
                    >
                        <option value="all">All Time</option>
                        <option value="month">This Month</option>
                        <option value="week">This Week</option>
                        <option value="today">Today</option>
                    </select>
                    {(currentUser.role === 'Admin' || currentUser.role === 'Sales Manager') && (
                        <select 
                            value={agentFilter} 
                            onChange={e => setAgentFilter(e.target.value)} 
                            className="p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                            title="Agent filter"
                            aria-label="Select agent filter"
                        >
                            <option value="all">All Agents</option>
                            {visibleAgents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                        </select>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {metricCards.map(card => (
                    <MetricCard key={card.title} {...card} />
                ))}
            </div>
            
            <ChartsSection {...charts} />
            
            <RecentFollowUps followUps={followUps} />
        </div>
    );
};
