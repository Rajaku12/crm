import React, { useMemo, useState } from 'react';
import { Card } from './ui/Card';
import { Tag } from './ui/Tag';
import { Lead, Agent, ActivityType, CallOutcome, Activity, ActivitySentiment } from '../types';
import { PhoneIcon, PlayIcon, CloseIcon, SparklesIcon, DownloadIcon, TagIcon, SentimentPositiveIcon, SentimentNeutralIcon, SentimentNegativeIcon, DocumentTextIcon } from './icons/IconComponents';
import { StarRating } from './ui/StarRating';
import { formatDuration } from '../utils';
import { OutcomeBadge } from './ui/OutcomeBadge';
import { useAppContext } from '../contexts/AppContext';

type CallWithLead = Activity & { 
    lead: Lead; 
    agent?: Agent;
};

interface CallsProps {
  onSelectLead: (lead: Lead) => void;
  currentUser: Agent;
  onGenerateSummary: (leadId: string | number, activityId: string | number) => void;
  onAnalyzeQuality: (leadId: string | number, activityId: string | number) => void;
}

const formatSeconds = (seconds: number): string => {
    if (isNaN(seconds) || seconds <= 0) return 'N/A';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    let parts = [];
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || m === 0) parts.push(`${s}s`);
    return parts.join(' ');
}

const SentimentDisplay: React.FC<{ sentiment: ActivitySentiment }> = ({ sentiment }) => {
    const sentimentConfig = {
        Positive: { icon: <SentimentPositiveIcon className="h-5 w-5 text-green-500" />, text: 'Positive', color: 'text-green-600' },
        Neutral: { icon: <SentimentNeutralIcon className="h-5 w-5 text-yellow-500" />, text: 'Neutral', color: 'text-yellow-600' },
        Negative: { icon: <SentimentNegativeIcon className="h-5 w-5 text-red-500" />, text: 'Negative', color: 'text-red-600' },
    };
    const config = sentimentConfig[sentiment];
    return (
        <div className={`flex items-center space-x-2 font-semibold ${config.color}`}>
            {config.icon}
            <span>{config.text}</span>
        </div>
    );
};

const CallRecordingModal: React.FC<{ recording: CallWithLead | null; onClose: () => void; }> = ({ recording, onClose }) => {
    if (!recording) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary-100 text-primary-600 rounded-full">
                           <PhoneIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Call Recording & Analysis</h3>
                            <p className="text-sm text-gray-500">Review the conversation details</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                        <CloseIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                        <div><p className="font-semibold text-gray-800">{recording.lead.name}</p><p className="text-gray-500">Lead</p></div>
                        <div><p className="font-semibold text-gray-800">{recording.agent?.name || 'Unassigned'}</p><p className="text-gray-500">Agent</p></div>
                        <div><p className="font-semibold text-gray-800">{new Date(recording.timestamp).toLocaleString()}</p><p className="text-gray-500">Date & Time</p></div>
                        <div><p className="font-semibold text-gray-800">{formatSeconds(recording.duration || 0)}</p><p className="text-gray-500">Duration</p></div>
                        <div><Tag type={recording.lead.tag} /><p className="text-gray-500 mt-1">Interest Level</p></div>
                        <div>{recording.outcome && <OutcomeBadge outcome={recording.outcome} /> }<p className="text-gray-500 mt-1">Outcome</p></div>
                    </div>

                    {recording.sentiment && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                             <h4 className="font-semibold text-gray-700 text-sm mb-2">Rule-Based Analysis</h4>
                             <div className="flex items-center justify-between">
                                 <div><SentimentDisplay sentiment={recording.sentiment} /><p className="text-gray-500 text-xs mt-1">Sentiment</p></div>
                             </div>
                        </div>
                    )}

                    {recording.notes && (
                        <div>
                            <h4 className="font-semibold text-gray-700 text-sm mb-2">Call Notes</h4>
                            <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-800 max-h-24 overflow-y-auto"><p>{recording.notes}</p></div>
                        </div>
                    )}
                    
                    {recording.recordingUrl && (
                        <>
                            <audio controls autoPlay className="w-full rounded-lg h-12">
                                <source 
                                    src={recording.recordingUrl} 
                                    type={recording.recordingUrl.startsWith('data:') ? 'audio/webm' : 'audio/mpeg'} 
                                />
                                Your browser does not support the audio element.
                            </audio>
                            
                            {recording.recordingUrl.startsWith('data:') ? (
                                <button
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = recording.recordingUrl!;
                                        link.download = `${recording.lead.name.replace(' ', '_')}_call_${recording.id}.webm`;
                                        link.click();
                                    }}
                                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                >
                                    <DownloadIcon className="h-5 w-5 mr-2" />
                                    Download Recording
                                </button>
                            ) : (
                                <a 
                                    href={recording.recordingUrl} 
                                    download={`${recording.lead.name.replace(' ', '_')}_call_${recording.id}.mp3`} 
                                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                >
                                    <DownloadIcon className="h-5 w-5 mr-2" />
                                    Download Recording
                                </a>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <Card className="flex items-center p-4">
        <div className="p-3 mr-4 bg-primary-100 text-primary-600 rounded-full">{icon}</div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </Card>
);

export const Calls: React.FC<CallsProps> = ({ onSelectLead, currentUser, onGenerateSummary, onAnalyzeQuality }) => {
    const { leads, agents } = useAppContext();
    const [playingRecording, setPlayingRecording] = useState<CallWithLead | null>(null);
    const [filterAgent, setFilterAgent] = useState<number | string | 'All'>(currentUser.role === 'Agent' || currentUser.role === 'Telecaller' ? currentUser.id : 'All');
    
    const visibleLeads = useMemo(() => {
        switch (currentUser.role) {
            case 'Admin':
                return leads;
            case 'Sales Manager': {
                const teamAgentIds = agents.filter(a => a.team === currentUser.team).map(a => a.id);
                return leads.filter(l => teamAgentIds.includes(l.agentId));
            }
            case 'Agent':
            case 'Telecaller':
                return leads.filter(l => l.agentId === currentUser.id);
            default:
                return [];
        }
    }, [leads, agents, currentUser]);
    
    const allCalls = useMemo(() => {
        return visibleLeads.flatMap(lead => 
            lead.activities
                .filter(activity => activity.type === ActivityType.Call)
                .map(call => ({ ...call, lead, agent: agents.find(a => a.name === call.agent) }))
        ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [visibleLeads, agents]);

    const filteredCalls = useMemo(() => {
        if (filterAgent === 'All') return allCalls;
        return allCalls.filter(call => call.agent?.id === filterAgent);
    }, [allCalls, filterAgent]);
    
    const callStats = useMemo(() => {
        const callsToAnalyze = filterAgent === 'All' ? allCalls : filteredCalls;
        const totalCalls = callsToAnalyze.length;
        const missedCalls = callsToAnalyze.filter(c => c.outcome === CallOutcome.Missed).length;
        const totalTalkTime = callsToAnalyze.reduce((sum, call) => sum + (call.duration || 0), 0);
        const successfulCalls = callsToAnalyze.filter(call => call.outcome === CallOutcome.Success).length;
        const successRate = totalCalls > 0 ? ((successfulCalls / totalCalls) * 100).toFixed(1) : '0.0';
        const avgDuration = totalCalls > 0 ? totalTalkTime / totalCalls : 0;
        return { totalCalls, missedCalls, totalTalkTime, successRate, avgDuration };
    }, [allCalls, filteredCalls, filterAgent]);

    return (
        <div className="space-y-6">
            <CallRecordingModal recording={playingRecording} onClose={() => setPlayingRecording(null)} />
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Calls</h1>
                <p className="text-sm text-gray-500">Track and manage your sales calls.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard title="Total Calls" value={callStats.totalCalls.toString()} icon={<PhoneIcon className="h-6 w-6"/>} />
                <StatCard title="Missed Calls" value={callStats.missedCalls.toString()} icon={<PhoneIcon className="h-6 w-6 text-red-500"/>} />
                <StatCard title="Talk Time" value={formatDuration(callStats.totalTalkTime)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                <StatCard title="Success Rate" value={`${callStats.successRate}%`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                <StatCard title="Avg Duration" value={formatSeconds(Math.round(callStats.avgDuration))} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
            </div>
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Recent Calls</h2>
                     {(currentUser.role === 'Admin' || currentUser.role === 'Sales Manager') && (
                        <select value={String(filterAgent)} onChange={(e) => setFilterAgent(e.target.value === 'All' ? 'All' : e.target.value)} className="p-2 border border-gray-300 rounded-md shadow-sm text-sm">
                            <option value="All">All Agents</option>
                            {agents.filter(agent => {
                                if (currentUser.role === 'Sales Manager') {
                                    return agent.team === currentUser.team;
                                }
                                return true;
                            }).map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                        </select>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-4 py-3">Contact</th>
                                <th scope="col" className="px-4 py-3">Agent</th>
                                <th scope="col" className="px-4 py-3">Duration</th>
                                <th scope="col" className="px-4 py-3">Outcome</th>
                                <th scope="col" className="px-4 py-3">Quality Score</th>
                                <th scope="col" className="px-4 py-3">Sentiment</th>
                                <th scope="col" className="px-4 py-3">Date & Time</th>
                                <th scope="col" className="px-4 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCalls.map(call => {
                                const hasSummary = call.lead.activities.some(a => 
                                    a.type === ActivityType.AISummary && a.sourceActivityId === call.id
                                );

                                return (
                                <tr key={call.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-4 py-4 font-medium text-gray-900 whitespace-nowrap cursor-pointer hover:text-primary-600" onClick={() => onSelectLead(call.lead)}>{call.lead.name}</td>
                                    <td className="px-4 py-4">{call.agent?.name || 'Unassigned'}</td>
                                    <td className="px-4 py-4">{formatSeconds(call.duration || 0)}</td>
                                    <td className="px-4 py-4">
                                        {call.outcome && <OutcomeBadge outcome={call.outcome} />}
                                    </td>
                                    <td className="px-4 py-4">
                                        {call.qualityScore ? (
                                            <StarRating score={call.qualityScore} />
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAnalyzeQuality(call.lead.id, call.id);
                                                }}
                                                className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                                title="Analyze Call Quality"
                                            >
                                                <SparklesIcon className="h-4 w-4 mr-1.5"/>
                                                Analyze
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        {call.sentiment ? (
                                            <SentimentDisplay sentiment={call.sentiment} />
                                        ) : (
                                            <div className="text-xs text-gray-500">Not Analyzed</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">{new Date(call.timestamp).toLocaleDateString()}</td>
                                    <td className="px-4 py-4 text-center">
                                        <div className="flex items-center justify-center space-x-1">
                                            {call.recordingUrl && <button onClick={() => setPlayingRecording(call as CallWithLead)} className="p-1 rounded-full text-primary-600 hover:bg-primary-100" title="Play Recording"><PlayIcon className="h-5 w-5" /></button>}
                                            
                                            <button 
                                                onClick={() => onGenerateSummary(call.lead.id, call.id)}
                                                disabled={hasSummary}
                                                className="p-1 rounded-full text-blue-600 hover:bg-blue-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:bg-transparent" 
                                                title={hasSummary ? "Summary exists" : "Generate Summary"}
                                            >
                                                <SparklesIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                )}
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};