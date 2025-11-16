import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Agent, Lead, ActivityType, CallOutcome, LeadStatus, Property, PropertyCategory, Activity } from '../types';
import { Card } from './ui/Card';
import { formatDuration } from '../utils';
import { SparklesIcon } from './icons/IconComponents';
import { CustomReportBuilder, CustomReportTemplate } from './CustomReportBuilder';
import { useAppContext } from '../contexts/AppContext';

interface ReportsProps {
    currentUser: Agent;
    onGenerateSummary: (reportTitle: string, data: any) => void;
    aiSummary: string;
}

type ReportTab = 'sales' | 'agent' | 'leads' | 'calls' | 'custom';
type DateFilter = 'all' | '7' | '30';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#64748b'];
const SENTIMENT_COLORS = {
    'Positive': '#10b981',
    'Neutral': '#f97316',
    'Negative': '#ef4444',
};


const SummaryCard: React.FC<{ title: string, value: string | number, subtext?: string }> = ({ title, value, subtext }) => (
    <div className="bg-gray-50 p-4 rounded-lg text-center">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
);

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

// --- SALES PERFORMANCE ---
const SalesPerformanceReport: React.FC<{ data: any }> = ({ data: salesData }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard title="Total Revenue" value={salesData.totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })} />
                <SummaryCard title="Properties Sold" value={salesData.totalSales} />
                <SummaryCard title="Average Deal Size" value={salesData.avgDealSize.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })} />
            </div>
            <div>
                <h3 className="font-semibold text-lg text-gray-700 mb-4">Revenue by Property Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={salesData.categoryChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                             {salesData.categoryChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};


// --- AGENT PERFORMANCE ---
const ProgressBar: React.FC<{ value: number, max: number }> = ({ value, max }) => {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    const color = percentage >= 100 ? 'bg-green-500' : 'bg-primary-600';
    return (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className={`${color} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

const AgentPerformanceReport: React.FC<{ data: any[] }> = ({ data: agentReports }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th className="px-6 py-3">Agent</th>
                        <th className="px-6 py-3">Leads Handled</th>
                        <th className="px-6 py-3">Calls Made</th>
                        <th className="px-6 py-3">Sales Closed</th>
                        <th className="px-6 py-3">Calls Target</th>
                        <th className="px-6 py-3">Sales Target</th>
                    </tr>
                </thead>
                <tbody>
                    {agentReports.map(report => (
                        <tr key={report.id} className="bg-white border-b hover:bg-gray-50">
                             <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                <div className="flex items-center space-x-3">
                                    <img src={report.avatarUrl} alt={report.name} className="h-8 w-8 rounded-full"/>
                                    <span>{report.name}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">{report.totalLeads}</td>
                            <td className="px-6 py-4">{report.totalCalls}</td>
                            <td className="px-6 py-4">{report.totalSales}</td>
                            <td className="px-6 py-4">
                                {report.callsTarget ? (
                                    <div className="w-32"><ProgressBar value={report.totalCalls} max={report.callsTarget} /><div className="text-xs text-gray-500 mt-1">{report.totalCalls} / {report.callsTarget}</div></div>
                                ) : 'N/A'}
                            </td>
                             <td className="px-6 py-4">
                                {report.salesTarget ? (
                                    <div className="w-32"><ProgressBar value={report.totalSales} max={report.salesTarget} /><div className="text-xs text-gray-500 mt-1">{report.totalSales} / {report.salesTarget}</div></div>
                                ) : 'N/A'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// --- LEAD ANALYSIS ---
const LeadAnalysisReport: React.FC<{ data: any }> = ({ data: leadData }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SummaryCard title="New Leads" value={leadData.totalLeads} />
                <SummaryCard title="Conversion Rate" value={`${leadData.conversionRate}%`} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div>
                    <h3 className="font-semibold text-lg text-gray-700 mb-4">Lead Funnel</h3>
                    <ResponsiveContainer width="100%" height={300}>
                       <BarChart data={leadData.statusChartData} layout="vertical" margin={{ left: 20 }}>
                           <CartesianGrid strokeDasharray="3 3" />
                           <XAxis type="number" />
                           <YAxis type="category" dataKey="name" width={80} />
                           <Tooltip content={<CustomTooltip />} />
                           <Bar dataKey="count" fill="#3b82f6" name="Leads" />
                       </BarChart>
                    </ResponsiveContainer>
                </div>
                <div>
                    <h3 className="font-semibold text-lg text-gray-700 mb-4">Leads by Source</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={leadData.sourceChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {leadData.sourceChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// --- CALL ANALYTICS ---
const CallAnalyticsReport: React.FC<{ data: any }> = ({ data: callData }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard title="Total Calls" value={callData.totalCalls} />
                <SummaryCard title="Total Talk Time" value={formatDuration(callData.totalTalkTime)} />
                <SummaryCard title="Avg. Call Duration" value={formatDuration(Math.round(callData.avgDuration))} />
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div>
                    <h3 className="font-semibold text-lg text-gray-700 mb-4">Call Outcomes</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={callData.outcomeChartData}>
                           <CartesianGrid strokeDasharray="3 3" />
                           <XAxis dataKey="name" />
                           <YAxis />
                           <Tooltip content={<CustomTooltip />} />
                           <Bar dataKey="count" fill="#10b981" name="Calls" />
                       </BarChart>
                    </ResponsiveContainer>
                </div>
                <div>
                    <h3 className="font-semibold text-lg text-gray-700 mb-4">Overall Sentiment Analysis</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={callData.sentimentChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {callData.sentimentChartData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                 <div>
                    <h3 className="font-semibold text-lg text-gray-700 mb-4">Sentiment by Agent</h3>
                     <ResponsiveContainer width="100%" height={300}>
                       <BarChart data={callData.sentimentByAgentData} margin={{ left: 10 }}>
                           <CartesianGrid strokeDasharray="3 3" />
                           <XAxis dataKey="name" />
                           <YAxis />
                           <Tooltip content={<CustomTooltip />} />
                           <Legend />
                           <Bar dataKey="Positive" stackId="a" fill={SENTIMENT_COLORS.Positive} />
                           <Bar dataKey="Neutral" stackId="a" fill={SENTIMENT_COLORS.Neutral} />
                           <Bar dataKey="Negative" stackId="a" fill={SENTIMENT_COLORS.Negative} />
                       </BarChart>
                    </ResponsiveContainer>
                </div>
                <div>
                    <h3 className="font-semibold text-lg text-gray-700 mb-4">Average Call Duration Over Time</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={callData.durationOverTimeData} margin={{ right: 20 }}>
                           <CartesianGrid strokeDasharray="3 3" />
                           <XAxis dataKey="date" />
                           <YAxis label={{ value: 'Seconds', angle: -90, position: 'insideLeft' }} />
                           <Tooltip content={<CustomTooltip />} />
                           <Legend />
                           <Line type="monotone" dataKey="avgDuration" name="Avg. Duration (s)" stroke="#8b5cf6" activeDot={{ r: 8 }} />
                       </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};


export const Reports: React.FC<ReportsProps> = ({ currentUser, onGenerateSummary, aiSummary }) => {
    const { agents, leads, properties } = useAppContext();
    const [activeTab, setActiveTab] = useState<ReportTab>('sales');
    const [agentFilter, setAgentFilter] = useState<number | 'all'>('all');
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');
    const [savedTemplates, setSavedTemplates] = useState<CustomReportTemplate[]>([]);

    const visibleAgents = useMemo(() => {
        if(currentUser.role === 'Admin') return agents;
        if(currentUser.role === 'Sales Manager') return agents.filter(a => a.team === currentUser.team);
        return [currentUser];
    }, [agents, currentUser]);

    const filteredLeads = useMemo(() => {
        let filtered = [...leads];
        
        if (dateFilter !== 'all') {
            const days = parseInt(dateFilter, 10);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            filtered = filtered.filter(l => new Date(l.createdAt) >= cutoffDate);
        }

        if (agentFilter !== 'all') {
            filtered = filtered.filter(l => l.agentId === agentFilter);
        } else {
            const visibleAgentIds = new Set(visibleAgents.map(a => a.id));
            filtered = filtered.filter(l => visibleAgentIds.has(l.agentId));
        }
        
        return filtered;
    }, [leads, visibleAgents, agentFilter, dateFilter]);
    
    // --- DATA CALCULATIONS MOVED TO PARENT ---
    const salesData = useMemo(() => {
        const closedLeads = filteredLeads.filter(l => l.status === LeadStatus.Closed && l.propertyId);
        const totalRevenue = closedLeads.reduce((sum, lead) => {
            const property = properties.find(p => p.id === lead.propertyId);
            return sum + (property?.price || 0);
        }, 0);
        const totalSales = closedLeads.length;
        const avgDealSize = totalSales > 0 ? totalRevenue / totalSales : 0;

        const salesByCategory = closedLeads.reduce((acc, lead) => {
            const property = properties.find(p => p.id === lead.propertyId);
            if (property) {
                const category = property.category;
                acc[category] = (acc[category] || 0) + property.price;
            }
            return acc;
        }, {} as Record<PropertyCategory, number>);
        
        const categoryChartData = Object.entries(salesByCategory).map(([name, value]) => ({ name, value }));

        return { totalRevenue, totalSales, avgDealSize, categoryChartData };
    }, [filteredLeads, properties]);

    const agentReports = useMemo(() => {
        return visibleAgents.map(agent => {
            const agentLeads = filteredLeads.filter(l => l.agentId === agent.id);
            const agentCalls = agentLeads.flatMap(l => l.activities.filter(a => a.type === ActivityType.Call && a.agent === agent.name));
            const totalSales = agentLeads.filter(l => l.status === LeadStatus.Closed).length;
            
            return {
                id: agent.id,
                name: agent.name,
                avatarUrl: agent.avatarUrl,
                totalLeads: agentLeads.length,
                totalCalls: agentCalls.length,
                totalSales,
                callsTarget: agent.monthlyCallsTarget,
                salesTarget: agent.monthlySalesTarget,
            };
        });
    }, [filteredLeads, visibleAgents]);
    
    const leadData = useMemo(() => {
        const totalLeads = filteredLeads.length;
        const closedLeads = filteredLeads.filter(l => l.status === LeadStatus.Closed).length;
        const conversionRate = totalLeads > 0 ? (closedLeads / totalLeads * 100).toFixed(1) : 0;
        
        const leadsBySource = filteredLeads.reduce((acc, lead) => {
            const source = lead.source || 'Unknown';
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const sourceChartData = Object.entries(leadsBySource).map(([name, value]) => ({ name, value }));

        const leadsByStatus = filteredLeads.reduce((acc, lead) => {
            acc[lead.status] = (acc[lead.status] || 0) + 1;
            return acc;
        }, {} as Record<LeadStatus, number>);
        
        const funnelOrder: LeadStatus[] = [LeadStatus.New, LeadStatus.Contacted, LeadStatus.SiteVisit, LeadStatus.Negotiation, LeadStatus.Approved, LeadStatus.Closed];
        const statusChartData = funnelOrder.map(status => ({ name: status, count: leadsByStatus[status] || 0 }));

        return { totalLeads, conversionRate, sourceChartData, statusChartData };
    }, [filteredLeads]);

    const allCalls = useMemo(() => {
      return leads.flatMap(lead =>
        lead.activities
          .filter(activity => activity.type === ActivityType.Call)
          .map(call => ({ ...call, lead: lead, agent: agents.find(a => a.name === call.agent) }))
      );
    }, [leads, agents]);

    const filteredCalls = useMemo(() => {
        const filteredLeadIds = new Set(filteredLeads.map(l => l.id));
        return allCalls.filter(c => filteredLeadIds.has(c.lead.id));
    }, [allCalls, filteredLeads]);

    const callData = useMemo(() => {
        const totalCalls = filteredCalls.length;
        const totalTalkTime = filteredCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
        const avgDuration = totalCalls > 0 ? totalTalkTime / totalCalls : 0;
        
        const callsByOutcome = filteredCalls.reduce((acc, call) => {
            const outcome = call.outcome || 'N/A';
            acc[outcome] = (acc[outcome] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const outcomeChartData = Object.entries(callsByOutcome).map(([name, count]) => ({ name, count }));

        const callsBySentiment = filteredCalls.reduce((acc, call) => {
             if (call.sentiment) {
                 acc[call.sentiment] = (acc[call.sentiment] || 0) + 1;
             }
             return acc;
        }, {} as Record<string, number>);
        const sentimentChartData = Object.entries(callsBySentiment).map(([name, value]) => ({ name, value }));
        
        const sentimentByAgent = filteredCalls.reduce((acc, call) => {
            if (call.agent && call.sentiment) {
                const agentName = call.agent.name;
                if (!acc[agentName]) {
                    acc[agentName] = { name: agentName, Positive: 0, Neutral: 0, Negative: 0 };
                }
                acc[agentName][call.sentiment]++;
            }
            return acc;
        }, {} as Record<string, { name: string; Positive: number; Neutral: number; Negative: number; }>);
        const sentimentByAgentData = Object.values(sentimentByAgent);

        const callsByDate = filteredCalls.reduce((acc, call) => {
            const date = new Date(call.timestamp).toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = { totalDuration: 0, callCount: 0 };
            }
            acc[date].totalDuration += (call.duration || 0);
            acc[date].callCount++;
            return acc;
        }, {} as Record<string, { totalDuration: number; callCount: number }>);

        const durationOverTimeData = Object.entries(callsByDate)
            .map(([date, data]) => {
                const { totalDuration, callCount } = data as { totalDuration: number; callCount: number };
                return {
                    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    avgDuration: callCount > 0 ? Math.round(totalDuration / callCount) : 0,
                };
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return { totalCalls, totalTalkTime, avgDuration, outcomeChartData, sentimentChartData, sentimentByAgentData, durationOverTimeData };
    }, [filteredCalls]);

    const handleGenerateSummary = () => {
        let reportData;
        const reportTitle = `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Performance Report`;

        switch(activeTab) {
            case 'sales':
                 reportData = salesData;
                 break;
            case 'agent':
                 reportData = agentReports.map(({ name, totalLeads, totalCalls, totalSales }) => ({ name, totalLeads, totalCalls, totalSales }));
                 break;
            case 'leads':
                 reportData = leadData;
                 break;
            case 'calls':
                 reportData = callData;
                 break;
            default:
                reportData = { error: "Unknown report type" };
        }
        
        onGenerateSummary(reportTitle, reportData);
    };

    const TabButton: React.FC<{label: string, tabName: ReportTab}> = ({ label, tabName }) => (
        <button
            onClick={() => {
                setActiveTab(tabName);
            }}
            className={`whitespace-nowrap py-3 px-4 font-semibold text-sm rounded-t-lg transition-colors ${
                activeTab === tabName
                    ? 'border-b-2 border-primary-600 text-primary-600 bg-primary-50'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
        >
            {label}
        </button>
    );

    return (
        <Card>
            <div className="flex flex-col md:flex-row justify-between items-start mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Reports & Analytics</h1>
                    <p className="text-sm text-gray-500">Data-driven insights into your sales and team performance.</p>
                </div>
                {activeTab !== 'custom' && (
                  <button 
                      onClick={handleGenerateSummary} 
                      className="mt-4 md:mt-0 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                  >
                      <SparklesIcon className="w-5 h-5 mr-2" />
                      Generate Summary
                  </button>
                )}
            </div>
             {aiSummary && activeTab !== 'custom' && (
                <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                    <h3 className="font-bold text-primary-800 text-md mb-2">Generated Summary</h3>
                    <div className="prose prose-sm max-w-none text-primary-900" dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\n/g, '<br />') }} />
                </div>
            )}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <select 
                    value={dateFilter} 
                    onChange={e => setDateFilter(e.target.value as DateFilter)} 
                    className="p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                    title="Date filter"
                    aria-label="Select date filter"
                >
                    <option value="all">All Time</option>
                    <option value="30">Last 30 Days</option>
                    <option value="7">Last 7 Days</option>
                </select>
                <select 
                    value={agentFilter} 
                    onChange={e => setAgentFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))} 
                    className="p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                    title="Agent filter"
                    aria-label="Select agent filter"
                >
                    <option value="all">All Agents</option>
                    {visibleAgents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                </select>
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                    <TabButton label="Sales Performance" tabName="sales" />
                    <TabButton label="Agent Performance" tabName="agent" />
                    <TabButton label="Lead Analysis" tabName="leads" />
                    <TabButton label="Call Analytics" tabName="calls" />
                    <TabButton label="Custom Report" tabName="custom" />
                </nav>
            </div>
            
            <div className="mt-6">
                {activeTab === 'sales' && <SalesPerformanceReport data={salesData} />}
                {activeTab === 'agent' && <AgentPerformanceReport data={agentReports} />}
                {activeTab === 'leads' && <LeadAnalysisReport data={leadData} />}
                {activeTab === 'calls' && <CallAnalyticsReport data={callData} />}
                {activeTab === 'custom' && (
                    <CustomReportBuilder
                        leads={filteredLeads}
                        agents={visibleAgents}
                        properties={properties}
                        calls={filteredCalls as (Omit<Activity, "agent"> & { lead: Lead; agent?: Agent | undefined; })[]}
                        savedTemplates={savedTemplates}
                        onSaveTemplate={(template) => setSavedTemplates(prev => [...prev, template])}
                    />
                )}
            </div>
        </Card>
    );
};