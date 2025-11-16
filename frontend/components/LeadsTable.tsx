import React, { useState, useMemo } from 'react';
import { Card } from './ui/Card';
import { Tag } from './ui/Tag';
import { Lead, LeadStatus, LeadTag } from '../types';
import { AddUserIcon, SparklesIcon, PhoneIcon, WhatsAppIcon, EditIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from './icons/IconComponents';
import { LeadScoreBadge } from './ui/LeadScoreBadge';
import { useAppContext } from '../contexts/AppContext';

interface LeadsTableProps {
  onSelectLead: (lead: Lead) => void;
  onAddLeadClick: () => void;
  currentUser: any;
  onOpenWhatsAppForLead: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string | number) => void;
  onInitiateCall: (leadId: string | number) => void;
}

type LeadWithDetails = Lead & {
    agentName: string;
    leadScore: number;
};

export const LeadsTable: React.FC<LeadsTableProps> = ({ onSelectLead, onAddLeadClick, currentUser, onOpenWhatsAppForLead, onEditLead, onDeleteLead, onInitiateCall }) => {
    const { leads, agents, leadScores } = useAppContext();
    const [filterStatus, setFilterStatus] = useState<LeadStatus | 'All'>('All');
    const [filterTag, setFilterTag] = useState<LeadTag | 'All'>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof LeadWithDetails; direction: 'ascending' | 'descending' } | null>({key: 'lastContacted', direction: 'descending'});

    const visibleLeads = useMemo(() => {
        switch (currentUser.role) {
            case 'Admin':
            case 'Customer Support':
                return leads;
            case 'Sales Manager': {
                const teamAgentIds = agents.filter(a => a.team === currentUser.team).map(a => a.id);
                return leads.filter(l => teamAgentIds.includes(l.agentId));
            }
            case 'Agent':
                return leads.filter(l => l.agentId === currentUser.id);
            case 'Telecaller':
                return leads.filter(l => l.createdBy === currentUser.id);
            default:
                return [];
        }
    }, [leads, agents, currentUser]);

    const leadsWithDetails = useMemo(() => {
        return visibleLeads.map(lead => ({
            ...lead,
            agentName: agents.find(a => a.id === lead.agentId)?.name || 'Unassigned',
            leadScore: leadScores.get(lead.id) ?? -2 
        }));
    }, [visibleLeads, leadScores, agents]);

    const filteredAndSortedLeads = useMemo(() => {
        let sortableLeads = [...leadsWithDetails];

        if (sortConfig !== null) {
            const { key, direction } = sortConfig;
            sortableLeads.sort((a, b) => {
                const valA = a[key];
                const valB = b[key];

                if (valA == null && valB != null) return 1;
                if (valA != null && valB == null) return -1;
                if (valA == null && valB == null) return 0;
    
                let comparison = 0;
                if (key === 'lastContacted' || key === 'createdAt') {
                    comparison = new Date(valA as string).getTime() - new Date(valB as string).getTime();
                } else if (typeof valA === 'number' && typeof valB === 'number') {
                    comparison = valA - valB;
                } else {
                    comparison = String(valA).toLowerCase().localeCompare(String(valB).toLowerCase());
                }
    
                return direction === 'ascending' ? comparison : -comparison;
            });
        }
        
        return sortableLeads.filter(lead => {
            const statusMatch = filterStatus === 'All' || lead.status === filterStatus;
            const tagMatch = filterTag === 'All' || lead.tag === filterTag;
            const searchMatch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                lead.phone.includes(searchTerm);
            return statusMatch && tagMatch && searchMatch;
        });

    }, [leadsWithDetails, filterStatus, filterTag, searchTerm, sortConfig]);

    const requestSort = (key: keyof LeadWithDetails) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: keyof LeadWithDetails) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' 
            ? <ArrowUpIcon className="h-3 w-3 inline-block ml-1 text-gray-400" /> 
            : <ArrowDownIcon className="h-3 w-3 inline-block ml-1 text-gray-400" />;
    }

    const renderScoreCell = (leadId: string | number) => {
        const score = leadScores.get(leadId);
        if (score === undefined) {
             return <span className="text-xs text-gray-400">Not Scored</span>;
        }
        if (score === null) {
             return (
                <div className="flex items-center text-xs text-gray-500">
                    <SparklesIcon className="w-4 h-4 mr-1.5 animate-pulse" />
                    <span>Scoring...</span>
                </div>
            );
        }
        if (score === -1) {
            return <span className="text-xs text-red-500">Error</span>;
        }
        return <LeadScoreBadge score={score} />;
    }

    const canAdd = currentUser.role !== 'Agent' && currentUser.role !== 'Customer Support';
    const canEdit = currentUser.role === 'Admin' || currentUser.role === 'Sales Manager' || currentUser.role === 'Agent';
    const canDelete = currentUser.role === 'Admin' || currentUser.role === 'Sales Manager';

    return (
        <Card className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-800">All Leads</h2>
                    {canAdd && (
                        <button
                            onClick={onAddLeadClick}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            <AddUserIcon className="h-5 w-5 mr-2" />
                            Add Lead
                        </button>
                    )}
                </div>
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Search leads..."
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select
                        className="p-2 border border-gray-300 rounded-md"
                        value={filterTag}
                        onChange={(e) => setFilterTag(e.target.value as LeadTag | 'All')}
                    >
                        <option value="All">All Tags</option>
                        {Object.values(LeadTag).map(tag => <option key={tag} value={tag}>{tag}</option>)}
                    </select>
                    <select
                        className="p-2 border border-gray-300 rounded-md"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as LeadStatus | 'All')}
                    >
                        <option value="All">All Statuses</option>
                        {Object.values(LeadStatus).map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('name')}>Name {getSortIndicator('name')}</th>
                            <th scope="col" className="px-6 py-3">Contact</th>
                            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('agentName')}>Agent {getSortIndicator('agentName')}</th>
                             <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('leadScore')}>Lead Score {getSortIndicator('leadScore')}</th>
                            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('tag')}>Tag {getSortIndicator('tag')}</th>
                            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('status')}>Status {getSortIndicator('status')}</th>
                            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('source')}>Source {getSortIndicator('source')}</th>
                            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('lastContacted')}>Last Contacted {getSortIndicator('lastContacted')}</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedLeads.length > 0 ? (
                            filteredAndSortedLeads.map(lead => (
                                <tr
                                    key={lead.id}
                                    className="bg-white border-b hover:bg-gray-50 cursor-pointer"
                                    onClick={() => onSelectLead(lead)}
                                >
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{lead.name}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span>{lead.phone}</span>
                                            <span className="text-xs text-gray-400">{lead.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{lead.agentName}</td>
                                    <td className="px-6 py-4">{renderScoreCell(lead.id)}</td>
                                    <td className="px-6 py-4"><Tag type={lead.tag} /></td>
                                    <td className="px-6 py-4"><Tag type={lead.status} /></td>
                                    <td className="px-6 py-4">{lead.source}</td>
                                    <td className="px-6 py-4">{new Date(lead.lastContacted).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <a 
                                                href={`tel:${lead.phone}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onInitiateCall(lead.id);
                                                }}
                                                className="p-2 rounded-full text-green-600 bg-green-100 hover:bg-green-200"
                                                title={`Call ${lead.name}`}
                                            >
                                                <PhoneIcon className="h-5 w-5" />
                                            </a>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onOpenWhatsAppForLead(lead);
                                                }}
                                                className="p-2 rounded-full text-teal-600 bg-teal-100 hover:bg-teal-200"
                                                title={`Message ${lead.name} on WhatsApp`}
                                            >
                                                <WhatsAppIcon className="h-5 w-5" />
                                            </button>
                                            {canEdit && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditLead(lead);
                                                    }}
                                                    className="p-2 rounded-full text-blue-600 bg-blue-100 hover:bg-blue-200"
                                                    title={`Edit ${lead.name}`}
                                                >
                                                    <EditIcon className="h-5 w-5" />
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteLead(lead.id);
                                                    }}
                                                    className="p-2 rounded-full text-red-600 bg-red-100 hover:bg-red-200"
                                                    title={`Delete ${lead.name}`}
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={9} className="text-center py-10 text-gray-500">
                                    <p className="font-semibold">No leads found.</p>
                                    {canAdd && <p className="text-sm">Click 'Add Lead' to get started.</p>}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
