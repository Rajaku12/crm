import React, { useState, useMemo } from 'react';
import { Agent } from '../../types';
import { Card } from '../ui/Card';
import { EditIcon, TrashIcon, UserGroupIcon, PhoneIcon, BuildingOfficeIcon } from '../icons/IconComponents';

interface TeamManagementProps {
    currentUser: Agent;
    manageableUsers: Agent[];
    onEditUser: (user: Agent) => void;
    onDeleteUser: (userId: string | number) => void;
    onUpdateUser: (user: Agent) => void;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
    currentUser,
    manageableUsers,
    onEditUser,
    onDeleteUser,
    onUpdateUser,
}) => {
    const [filterTeam, setFilterTeam] = useState<string>('All');
    const [filterRole, setFilterRole] = useState<string>('All');

    const teams = useMemo(() => {
        return [...new Set(manageableUsers.map(u => u.team).filter(Boolean))];
    }, [manageableUsers]);

    const filteredUsers = useMemo(() => {
        return manageableUsers.filter(user => {
            const teamMatch = filterTeam === 'All' || user.team === filterTeam || (filterTeam === 'Unassigned' && !user.team);
            const roleMatch = filterRole === 'All' || user.role === filterRole;
            return teamMatch && roleMatch;
        });
    }, [manageableUsers, filterTeam, filterRole]);

    const groupedByTeam = useMemo(() => {
        const groups: Record<string, Agent[]> = {};
        filteredUsers.forEach(user => {
            const team = user.team || 'Unassigned';
            if (!groups[team]) groups[team] = [];
            groups[team].push(user);
        });
        return groups;
    }, [filteredUsers]);

    const handleToggleActive = (user: Agent) => {
        onUpdateUser({ ...user, isActive: !user.isActive });
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Team</label>
                        <select
                            value={filterTeam}
                            onChange={(e) => setFilterTeam(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="All">All Teams</option>
                            {teams.map(team => (
                                <option key={team} value={team}>{team}</option>
                            ))}
                            <option value="Unassigned">Unassigned</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="All">All Roles</option>
                            {currentUser.role === 'Admin' ? (
                                <>
                                    <option value="Sales Manager">Sales Manager</option>
                                    <option value="Agent">Agent</option>
                                    <option value="Telecaller">Telecaller</option>
                                </>
                            ) : (
                                <>
                                    <option value="Agent">Agent</option>
                                    <option value="Telecaller">Telecaller</option>
                                </>
                            )}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Team Groups */}
            {Object.keys(groupedByTeam).length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No team members found</p>
                    </div>
                </Card>
            ) : (
                Object.entries(groupedByTeam).map(([team, users]) => (
                    <Card key={team}>
                        <div className="flex items-center justify-between mb-4 pb-4 border-b">
                            <div className="flex items-center space-x-3">
                                <UserGroupIcon className="h-6 w-6 text-primary-600" />
                                <h3 className="text-lg font-semibold text-gray-800">{team}</h3>
                                <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                                    {users.length} {users.length === 1 ? 'member' : 'members'}
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Member</th>
                                        <th className="px-4 py-3 text-left">Role</th>
                                        <th className="px-4 py-3 text-left">Contact</th>
                                        <th className="px-4 py-3 text-left">Targets</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                        <th className="px-4 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center space-x-3">
                                                    <img
                                                        src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff`}
                                                        alt={user.name}
                                                        className="h-10 w-10 rounded-full"
                                                    />
                                                    <div>
                                                        <div className="font-medium text-gray-900">{user.name}</div>
                                                        <div className="text-xs text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {user.contact || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-xs space-y-1">
                                                    {user.monthlyCallsTarget && (
                                                        <div className="flex items-center text-gray-600">
                                                            <PhoneIcon className="h-3 w-3 mr-1" />
                                                            Calls: {user.monthlyCallsTarget}
                                                        </div>
                                                    )}
                                                    {user.monthlySalesTarget && (
                                                        <div className="flex items-center text-gray-600">
                                                            <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                                                            Sales: {user.monthlySalesTarget}
                                                        </div>
                                                    )}
                                                    {!user.monthlyCallsTarget && !user.monthlySalesTarget && (
                                                        <span className="text-gray-400">Not set</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    user.isActive !== false
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {user.isActive !== false ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <button
                                                        onClick={() => onEditUser(user)}
                                                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-full"
                                                        title="Edit User"
                                                    >
                                                        <EditIcon className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleActive(user)}
                                                        className={`p-2 rounded-full ${
                                                            user.isActive !== false
                                                                ? 'text-yellow-600 hover:bg-yellow-50'
                                                                : 'text-green-600 hover:bg-green-50'
                                                        }`}
                                                        title={user.isActive !== false ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {user.isActive !== false ? '⏸' : '▶'}
                                                    </button>
                                                    {currentUser.role === 'Admin' && (
                                                        <button
                                                            onClick={() => onDeleteUser(user.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                                                            title="Delete User"
                                                        >
                                                            <TrashIcon className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ))
            )}
        </div>
    );
};

