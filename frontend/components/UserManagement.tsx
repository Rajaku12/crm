import React, { useState, useMemo, useEffect } from 'react';
import { Agent } from '../types';
import { Card } from './ui/Card';
import { ROLE_PERMISSIONS } from '../constants';
import { ShieldCheckIcon, CloseIcon, AddUserIcon, UserOffIcon, UserCircleIcon, TrashIcon, EditIcon, UserGroupIcon, UserMinusIcon } from './icons/IconComponents';
import { View } from '../App';

interface UserManagementProps {
    agents: Agent[];
    teams: string[];
    onUpdateAgent: (agent: Agent) => void;
    onCreateTeam: (teamName: string) => void;
    onRenameTeam: (oldName: string, newName: string) => void;
    onDeleteTeam: (teamName: string) => void;
    setView: (view: View) => void;
}

const PermissionsModal: React.FC<{ role: Agent['role'], onClose: () => void }> = ({ role, onClose }) => {
    const permissions = ROLE_PERMISSIONS[role];
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                 <div className="p-6 border-b flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{role} Permissions</h3>
                        <p className="text-sm text-gray-500">Access rights for this role.</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                        <CloseIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6">
                    <ul className="space-y-3">
                        {permissions.map((permission, index) => (
                            <li key={index} className="flex items-start">
                                <ShieldCheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{permission}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const UsersView: React.FC<Omit<UserManagementProps, 'teams' | 'onCreateTeam' | 'onRenameTeam' | 'onDeleteTeam'>> = ({ agents, onUpdateAgent, setView }) => {
    const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<Agent['role'] | null>(null);
    const [filters, setFilters] = useState({ search: '', role: 'All', team: 'All', status: 'Active' });

    const filteredAgents = useMemo(() => {
        return agents.filter(agent => {
            const statusMatch = filters.status === 'All' || (filters.status === 'Active' ? agent.isActive : !agent.isActive);
            const roleMatch = filters.role === 'All' || agent.role === filters.role;
            const teamMatch = filters.role === 'All' || agent.team === filters.team || (filters.team === 'Unassigned' && !agent.team);
            const searchMatch = agent.name.toLowerCase().includes(filters.search.toLowerCase()) || agent.email.toLowerCase().includes(filters.search.toLowerCase());
            return statusMatch && roleMatch && teamMatch && searchMatch;
        });
    }, [agents, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleToggleActivation = (agent: Agent) => {
        onUpdateAgent({ ...agent, isActive: !agent.isActive });
    };
    
    const uniqueTeams = useMemo(() => [...new Set(agents.map(a => a.team).filter(Boolean))], [agents]);

    return (
        <>
            {selectedRoleForPermissions && <PermissionsModal role={selectedRoleForPermissions} onClose={() => setSelectedRoleForPermissions(null)} />}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Manage Users</h2>
                    <p className="text-sm text-gray-500 mt-1">Assign roles, manage teams, and set user status.</p>
                </div>
                <button
                    onClick={() => setView('agents')}
                    className="mt-4 md:mt-0 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    <AddUserIcon className="h-5 w-5 mr-2" />
                    Invite User
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <input type="text" name="search" placeholder="Search by name or email..." value={filters.search} onChange={handleFilterChange} className="p-2 border border-gray-300 rounded-md shadow-sm"/>
                <select name="role" value={filters.role} onChange={handleFilterChange} className="p-2 border border-gray-300 rounded-md shadow-sm"><option value="All">All Roles</option>{Object.keys(ROLE_PERMISSIONS).map(r => <option key={r} value={r}>{r}</option>)}</select>
                <select name="team" value={filters.team} onChange={handleFilterChange} className="p-2 border border-gray-300 rounded-md shadow-sm"><option value="All">All Teams</option><option value="Unassigned">Unassigned</option>{uniqueTeams.map(t => <option key={t} value={t}>{t}</option>)}</select>
                <select name="status" value={filters.status} onChange={handleFilterChange} className="p-2 border border-gray-300 rounded-md shadow-sm"><option value="Active">Active</option><option value="Deactivated">Deactivated</option><option value="All">All</option></select>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">User</th>
                            <th scope="col" className="px-6 py-3">Role & Permissions</th>
                            <th scope="col" className="px-6 py-3">Team</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAgents.map(agent => (
                            <tr key={agent.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                    <div className="flex items-center space-x-3">
                                        <img src={agent.avatarUrl} alt={agent.name} className="h-10 w-10 rounded-full" />
                                        <div>
                                            <div className="font-semibold">{agent.name}</div>
                                            <div className="text-xs text-gray-500">{agent.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-800">{agent.role}</div>
                                    <button onClick={() => setSelectedRoleForPermissions(agent.role)} className="inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-800">
                                        <ShieldCheckIcon className="h-4 w-4 mr-1" />
                                        View Permissions
                                    </button>
                                </td>
                                <td className="px-6 py-4">{agent.team || 'Unassigned'}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${agent.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {agent.isActive ? 'Active' : 'Deactivated'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center space-x-2">
                                        <button onClick={() => setView('agents')} title="Edit User" className="p-2 rounded-full text-gray-500 hover:bg-gray-200"><EditIcon className="h-5 w-5"/></button>
                                        <button onClick={() => handleToggleActivation(agent)} title={agent.isActive ? 'Deactivate User' : 'Activate User'} className="p-2 rounded-full text-gray-500 hover:bg-gray-200">
                                            {agent.isActive ? <UserOffIcon className="h-5 w-5"/> : <UserCircleIcon className="h-5 w-5"/>}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

const TeamsView: React.FC<UserManagementProps> = ({ agents, teams, onUpdateAgent, onCreateTeam, onRenameTeam, onDeleteTeam }) => {
    // Component logic for team management will go here
    return <div>Team Management View</div>;
}


export const UserManagement: React.FC<UserManagementProps> = (props) => {
    const [view, setView] = useState<'users' | 'teams'>('users');

     const TabButton: React.FC<{label: string, tabName: 'users' | 'teams'}> = ({ label, tabName }) => (
        <button
            onClick={() => setView(tabName)}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                view === tabName
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
            {label}
        </button>
    );

    return (
        <Card>
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <TabButton label="Users" tabName="users" />
                    <TabButton label="Teams" tabName="teams" />
                </nav>
            </div>
            {view === 'users' ? <UsersView {...props} /> : <TeamsView {...props} />}
        </Card>
    );
};
