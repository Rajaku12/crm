import React, { useState, useMemo } from 'react';
import { Client, Occupation, Agent } from '../../types';
import { Card } from '../ui/Card';
import { EditIcon, TrashIcon } from '../icons/IconComponents';
import { useAppContext } from '../../contexts/AppContext';

interface ClientsTableProps {
    onEdit: (client: Client) => void;
    onDelete: (clientId: string | number) => void;
    currentUser: Agent;
}

const ITEMS_PER_PAGE = 10;

export const ClientsTable: React.FC<ClientsTableProps> = ({ onEdit, onDelete, currentUser }) => {
    const { clients } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [occupationFilter, setOccupationFilter] = useState<Occupation | ''>('');
    const [currentPage, setCurrentPage] = useState(1);
    
    const uniqueCities = useMemo(() => [...new Set(clients.map(c => c.city).filter(Boolean))], [clients]);
    const uniqueOccupations = useMemo(() => [...new Set(clients.map(c => c.occupation).filter(Boolean))], [clients]);

    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            const searchMatch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
            const cityMatch = !cityFilter || client.city === cityFilter;
            const occupationMatch = !occupationFilter || client.occupation === occupationFilter;
            return searchMatch && cityMatch && occupationMatch;
        });
    }, [clients, searchTerm, cityFilter, occupationFilter]);

    const paginatedClients = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredClients.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredClients, currentPage]);

    const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const canModify = currentUser.role !== 'Telecaller' && currentUser.role !== 'Customer Support';

    return (
        <Card>
            <h2 className="text-xl font-bold text-gray-800 mb-4">List of Clients</h2>
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
                <select value={occupationFilter} onChange={e => setOccupationFilter(e.target.value as Occupation | '')} className="p-2 border border-gray-300 rounded-md shadow-sm">
                    <option value="">Filter by Occupation</option>
                    {uniqueOccupations.map(occ => <option key={occ} value={occ}>{occ}</option>)}
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-4 py-3">Client Name</th>
                            <th className="px-4 py-3">Contact</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">City</th>
                            <th className="px-4 py-3">Occupation</th>
                            <th className="px-4 py-3">Lead Source</th>
                            {canModify && <th className="px-4 py-3 text-center">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedClients.length > 0 ? (
                            paginatedClients.map(client => (
                                <tr key={client.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-4 py-4 font-medium text-gray-900">{client.name}</td>
                                    <td className="px-4 py-4">{client.contact}</td>
                                    <td className="px-4 py-4">{client.email}</td>
                                    <td className="px-4 py-4">{client.city || 'N/A'}</td>
                                    <td className="px-4 py-4">{client.occupation}</td>
                                    <td className="px-4 py-4">{client.leadSource}</td>
                                    {canModify && (
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button onClick={() => onEdit(client)} className="p-2 rounded-full text-blue-600 bg-blue-100 hover:bg-blue-200" title="Edit Client">
                                                    <EditIcon className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => onDelete(client.id)} className="p-2 rounded-full text-red-600 bg-red-100 hover:bg-red-200" title="Delete Client">
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                             <tr>
                                <td colSpan={canModify ? 7 : 6} className="text-center py-10 text-gray-500">
                                    <p className="font-semibold">No clients found.</p>
                                    <p className="text-sm">Click 'Add New Client' to get started.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
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
