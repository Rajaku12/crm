import React, { useState, useMemo } from 'react';
import { Agent } from '../../types';
import { Card } from '../ui/Card';
import { EditIcon, TrashIcon } from '../icons/IconComponents';
import { useAppContext } from '../../contexts/AppContext';

interface AgentTableProps {
    onEdit: (agent: Agent) => void;
    onDelete: (agentId: number | string) => void;
}

const ITEMS_PER_PAGE = 10;

/**
 * A table component for displaying, filtering, and managing a list of agents.
 */
export const AgentTable: React.FC<AgentTableProps> = ({ onEdit, onDelete }) => {
    const { agents } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [dealsInFilter, setDealsInFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    
    const uniqueCities = useMemo(() => [...new Set(agents.map(a => a.city).filter(Boolean))], [agents]);
    const uniqueDealsIn = useMemo(() => [...new Set(agents.map(a => a.dealsIn).filter(Boolean))], [agents]);

    const filteredAgents = useMemo(() => {
        return agents.filter(agent => {
            const searchMatch = agent.name.toLowerCase().includes(searchTerm.toLowerCase());
            const cityMatch = !cityFilter || agent.city === cityFilter;
            const dealsInMatch = !dealsInFilter || agent.dealsIn?.toLowerCase().includes(dealsInFilter.toLowerCase());
            return searchMatch && cityMatch && dealsInMatch;
        });
    }, [agents, searchTerm, cityFilter, dealsInFilter]);

    const paginatedAgents = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAgents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredAgents, currentPage]);

    const totalPages = Math.ceil(filteredAgents.length / ITEMS_PER_PAGE);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <Card>
            <h2 className="text-xl font-bold text-gray-800 mb-4">List of Agents</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md shadow-sm"
                />
                <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="p-2 border border-gray-300 rounded-md shadow-sm">
                    <option value="">Filter by City</option>
                    {uniqueCities.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
                 <select value={dealsInFilter} onChange={e => setDealsInFilter(e.target.value)} className="p-2 border border-gray-300 rounded-md shadow-sm">
                    <option value="">Filter by "Deals In"</option>
                    {uniqueDealsIn.map(deal => <option key={deal} value={deal}>{deal}</option>)}
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-4 py-3">Agent Name</th>
                            <th className="px-4 py-3">Contact</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">City</th>
                            <th className="px-4 py-3">Deals In</th>
                            <th className="px-4 py-3">PAN</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedAgents.map(agent => (
                            <tr key={agent.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-4 py-4 font-medium text-gray-900">{agent.name}</td>
                                <td className="px-4 py-4">{agent.contact || 'N/A'}</td>
                                <td className="px-4 py-4">{agent.email}</td>
                                <td className="px-4 py-4">{agent.city || 'N/A'}</td>
                                <td className="px-4 py-4">{agent.dealsIn || 'N/A'}</td>
                                <td className="px-4 py-4">{agent.pan || 'N/A'}</td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center justify-center space-x-2">
                                        <button onClick={() => onEdit(agent)} className="p-2 rounded-full text-blue-600 bg-blue-100 hover:bg-blue-200" title="Edit Agent">
                                            <EditIcon className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => onDelete(agent.id)} className="p-2 rounded-full text-red-600 bg-red-100 hover:bg-red-200" title="Delete Agent">
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {paginatedAgents.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No agents found matching your criteria.</p>
                )}
            </div>
            
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex space-x-1">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 text-sm border rounded-md disabled:opacity-50">Prev</button>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 text-sm border rounded-md disabled:opacity-50">Next</button>
                    </div>
                </div>
            )}
        </Card>
    );
};
