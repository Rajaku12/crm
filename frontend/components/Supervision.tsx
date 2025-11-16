import React, { useState, useEffect } from 'react';
import { Agent } from '../types';
import { Card } from './ui/Card';
import { PhoneIcon, TargetIcon } from './icons/IconComponents';
import { MOCK_LEADS } from '../constants'; 
import { useAppContext } from '../contexts/AppContext';

const LiveCallMonitor: React.FC = () => {
    const { agents } = useAppContext();
    const [liveCalls, setLiveCalls] = useState<any[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const activeAgents = agents.filter(a => a.role === 'Agent' || a.role === 'Telecaller');
            const newLiveCalls = activeAgents
                .filter(() => Math.random() > 0.6) 
                .map(agent => ({
                    agent,
                    lead: MOCK_LEADS[Math.floor(Math.random() * MOCK_LEADS.length)],
                    startTime: Date.now() - Math.random() * 300 * 1000, 
                }));
            setLiveCalls(newLiveCalls);
        }, 5000); 

        return () => clearInterval(interval);
    }, [agents]);

    const CallDuration: React.FC<{ startTime: number }> = ({ startTime }) => {
        const [duration, setDuration] = useState(Date.now() - startTime);
        useEffect(() => {
            const timer = setInterval(() => {
                setDuration(Date.now() - startTime);
            }, 1000);
            return () => clearInterval(timer);
        }, [startTime]);
        return <span>{new Date(duration).toISOString().substr(14, 5)}</span>;
    };

    return (
         <Card>
            <div className="flex items-center mb-6">
                 <div className="p-3 bg-red-100 text-red-600 rounded-full mr-4">
                    <PhoneIcon className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Live Call Monitoring</h2>
                    <p className="text-sm text-gray-500">Monitor ongoing agent calls in real-time (Simulation).</p>
                </div>
            </div>
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Agent</th>
                            <th className="px-6 py-3">Lead</th>
                            <th className="px-6 py-3">Duration</th>
                            <th className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {liveCalls.map(({ agent, lead, startTime }) => (
                            <tr key={agent.id} className="bg-white border-b">
                                <td className="px-6 py-4 font-medium text-gray-900">{agent.name}</td>
                                <td className="px-6 py-4">{lead?.name || 'N/A'}</td>
                                <td className="px-6 py-4 font-mono"><CallDuration startTime={startTime} /></td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center space-x-2">
                                        <button onClick={() => alert(`Listening to ${agent.name}'s call...`)} className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">Listen</button>
                                        <button onClick={() => alert(`Whispering to ${agent.name}...`)} className="px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200">Whisper</button>
                                        <button onClick={() => alert(`Barging into ${agent.name}'s call...`)} className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200">Barge</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {liveCalls.length === 0 && <p className="text-center text-gray-500 py-8">No active calls right now.</p>}
            </div>
        </Card>
    );
};

const AgentTargets: React.FC = () => {
    const { agents, updateAgent } = useAppContext();
    const [targets, setTargets] = useState<Record<string | number, { calls: string, sales: string }>>({});

    useEffect(() => {
        const initialTargets = agents.reduce((acc, agent) => {
            acc[agent.id] = {
                calls: agent.monthlyCallsTarget?.toString() || '',
                sales: agent.monthlySalesTarget?.toString() || ''
            };
            return acc;
        }, {} as Record<string | number, { calls: string, sales: string }>);
        setTargets(initialTargets);
    }, [agents]);
    
    const handleTargetChange = (agentId: number | string, field: 'calls' | 'sales', value: string) => {
        setTargets(prev => ({
            ...prev,
            [agentId]: { ...prev[agentId], [field]: value }
        }));
    };

    const handleSaveChanges = () => {
        agents.forEach(agent => {
            const agentTargets = targets[agent.id];
            const updatedAgent = {
                ...agent,
                monthlyCallsTarget: parseInt(agentTargets.calls, 10) || 0,
                monthlySalesTarget: parseInt(agentTargets.sales, 10) || 0
            };
            updateAgent(updatedAgent);
        });
        alert('Targets saved successfully!');
    };

    return (
        <Card>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                    <div className="p-3 bg-green-100 text-green-600 rounded-full mr-4">
                        <TargetIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Agent Monthly Targets</h2>
                        <p className="text-sm text-gray-500">Set monthly call and sales goals for your team members.</p>
                    </div>
                </div>
                 <button onClick={handleSaveChanges} className="px-4 py-2 bg-primary-600 text-white rounded-md shadow-sm hover:bg-primary-700">
                    Save Changes
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                     <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Agent</th>
                            <th className="px-6 py-3">Monthly Calls Target</th>
                            <th className="px-6 py-3">Monthly Sales Target</th>
                        </tr>
                    </thead>
                    <tbody>
                        {agents.map(agent => (
                            <tr key={agent.id} className="bg-white border-b">
                                <td className="px-6 py-4 font-medium text-gray-900">{agent.name}</td>
                                <td className="px-6 py-4">
                                    <input
                                        type="number"
                                        value={targets[agent.id]?.calls || ''}
                                        onChange={(e) => handleTargetChange(agent.id, 'calls', e.target.value)}
                                        className="w-32 p-2 border border-gray-300 rounded-md shadow-sm"
                                        placeholder="e.g., 150"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                     <input
                                        type="number"
                                        value={targets[agent.id]?.sales || ''}
                                        onChange={(e) => handleTargetChange(agent.id, 'sales', e.target.value)}
                                        className="w-32 p-2 border border-gray-300 rounded-md shadow-sm"
                                        placeholder="e.g., 5"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export const Supervision: React.FC = () => {
    const [activeTab, setActiveTab] = useState('monitor');

    const TabButton: React.FC<{label: string, tabName: string}> = ({ label, tabName }) => (
        <button
            onClick={() => setActiveTab(tabName)}
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
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Supervision Tools</h1>
            
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <TabButton label="Live Call Monitoring" tabName="monitor" />
                    <TabButton label="Agent Targets" tabName="targets" />
                </nav>
            </div>

            <div className="mt-6">
                {activeTab === 'monitor' && <LiveCallMonitor />}
                {activeTab === 'targets' && <AgentTargets />}
            </div>
        </div>
    );
};
