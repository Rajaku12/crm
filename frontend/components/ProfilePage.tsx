import React, { useState, useMemo, useEffect } from 'react';
import { Agent, Lead, Activity, ActivityType } from '../types';
import { Card } from './ui/Card';
import { INDIAN_STATES } from '../constants';
import { useToast } from '../contexts/ToastContext';
import { useAppContext } from '../contexts/AppContext';
import { 
    UserCircleIcon, 
    UserGroupIcon, 
    ChartBarIcon, 
    PlusIcon,
    EditIcon,
    TrashIcon,
    PhoneIcon,
    BuildingOfficeIcon
} from './icons/IconComponents';
import { AddUserModal } from './modals/AddUserModal';
import { PerformanceDashboard } from './profile/PerformanceDashboard';
import { TeamManagement } from './profile/TeamManagement';

interface ProfilePageProps {
    currentUser: Agent;
    onUpdateProfile: (updatedAgent: Agent) => void;
}

type ProfileTab = 'profile' | 'team' | 'performance';

export const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser, onUpdateProfile }) => {
    const { showToast } = useToast();
    const { agents, leads, addAgent, updateAgent, deleteAgent } = useAppContext();
    const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
    const [formState, setFormState] = useState<Agent>({
        ...currentUser,
        name: currentUser.name || currentUser.email?.split('@')[0] || '',
    });
    const [errors, setErrors] = useState<Partial<Record<keyof Agent, string>>>({});
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<Agent | null>(null);

    // Sync formState with currentUser changes
    useEffect(() => {
        setFormState({
            ...currentUser,
            name: currentUser.name || currentUser.email?.split('@')[0] || '',
        });
    }, [currentUser]);

    // Determine which tabs to show based on role
    const availableTabs = useMemo(() => {
        const tabs: { key: ProfileTab; label: string; icon: React.ReactNode }[] = [
            { key: 'profile', label: 'My Profile', icon: <UserCircleIcon className="h-5 w-5" /> }
        ];
        
        if (currentUser.role === 'Admin' || currentUser.role === 'Sales Manager') {
            tabs.push({ key: 'team', label: 'Team Management', icon: <UserGroupIcon className="h-5 w-5" /> });
        }
        
        if (currentUser.role === 'Admin' || currentUser.role === 'Sales Manager' || currentUser.role === 'Agent') {
            tabs.push({ key: 'performance', label: 'Performance', icon: <ChartBarIcon className="h-5 w-5" /> });
        }
        
        return tabs;
    }, [currentUser.role]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };
    
    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof Agent, string>> = {};
        if (!formState.name.trim()) newErrors.name = "Your name is required.";
        if (formState.contact && !/^\d{10}$/.test(formState.contact.trim())) {
            newErrors.contact = "Please enter a valid 10-digit contact number.";
        }
        if (formState.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formState.pan.trim().toUpperCase())) {
            newErrors.pan = "Please enter a valid 10-character PAN format.";
        }
        if (formState.pinCode && !/^\d{6}$/.test(formState.pinCode.trim())) {
            newErrors.pinCode = "Please enter a valid 6-digit Pin Code.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onUpdateProfile(formState);
            showToast('Profile updated successfully!', 'success');
        }
    };

    // Get users that current user can manage
    const manageableUsers = useMemo(() => {
        if (currentUser.role === 'Admin') {
            return agents.filter(a => a.id !== currentUser.id);
        } else if (currentUser.role === 'Sales Manager') {
            return agents.filter(a => 
                a.id !== currentUser.id && 
                (a.role === 'Agent' || a.role === 'Telecaller') && 
                a.team === currentUser.team
            );
        }
        return [];
    }, [agents, currentUser]);

    const TabButton: React.FC<{ tab: { key: ProfileTab; label: string; icon: React.ReactNode } }> = ({ tab }) => (
        <button
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.key
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
            {tab.icon}
            <span>{tab.label}</span>
        </button>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Profile & Management</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {currentUser.role === 'Admin' 
                            ? 'Manage your profile, team, and view performance metrics'
                            : currentUser.role === 'Sales Manager'
                            ? 'Manage your profile, team members, and track team performance'
                            : 'Manage your profile and view your performance'}
                    </p>
                </div>
                {(currentUser.role === 'Admin' || currentUser.role === 'Sales Manager') && (
                    <button
                        onClick={() => {
                            setEditingUser(null);
                            setShowAddUserModal(true);
                        }}
                        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        {currentUser.role === 'Admin' ? 'Add User' : 'Add Team Member'}
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 border-b border-gray-200">
                {availableTabs.map(tab => (
                    <TabButton key={tab.key} tab={tab} />
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'profile' && (
                <Card>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex items-center space-x-6 pb-6 border-b">
                            <div className="relative">
                                <img 
                                    src={formState.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formState.name)}&background=3b82f6&color=fff`} 
                                    alt={formState.name} 
                                    className="w-24 h-24 rounded-full border-4 border-primary-100" 
                                />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">{formState.name}</h2>
                                <p className="text-gray-500">{formState.email}</p>
                                <span className="inline-block mt-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                                    {formState.role}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Basic Info */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={formState.name} 
                                    onChange={handleInputChange} 
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                                <input 
                                    type="email" 
                                    value={formState.email} 
                                    readOnly 
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
                                <input 
                                    type="text" 
                                    value={formState.role} 
                                    readOnly 
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                                />
                            </div>
                            
                            {/* Personal Details */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                <input 
                                    type="text" 
                                    name="contact" 
                                    value={formState.contact || ''} 
                                    onChange={handleInputChange} 
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                />
                                {errors.contact && <p className="text-red-500 text-xs mt-1">{errors.contact}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                <input 
                                    type="date" 
                                    name="dob" 
                                    value={formState.dob || ''} 
                                    onChange={handleInputChange} 
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">PAN</label>
                                <input 
                                    type="text" 
                                    name="pan" 
                                    value={formState.pan || ''} 
                                    onChange={handleInputChange} 
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm uppercase focus:ring-primary-500 focus:border-primary-500"
                                />
                                {errors.pan && <p className="text-red-500 text-xs mt-1">{errors.pan}</p>}
                            </div>
                            
                            {/* Address */}
                            <div className="lg:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea 
                                    name="address" 
                                    value={formState.address || ''} 
                                    onChange={handleInputChange} 
                                    rows={2} 
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                <input 
                                    type="text" 
                                    name="city" 
                                    value={formState.city || ''} 
                                    onChange={handleInputChange} 
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                <select 
                                    name="state" 
                                    value={formState.state || ''} 
                                    onChange={handleInputChange} 
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="">Select State</option>
                                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pin Code</label>
                                <input 
                                    type="text" 
                                    name="pinCode" 
                                    value={formState.pinCode || ''} 
                                    onChange={handleInputChange} 
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                />
                                {errors.pinCode && <p className="text-red-500 text-xs mt-1">{errors.pinCode}</p>}
                            </div>
                        </div>

                        <div className="pt-5 border-t">
                            <div className="flex justify-end">
                                <button 
                                    type="submit" 
                                    className="px-6 py-2 bg-primary-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-primary-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </form>
                </Card>
            )}

            {activeTab === 'team' && (
                <TeamManagement
                    currentUser={currentUser}
                    manageableUsers={manageableUsers}
                    onEditUser={(user) => {
                        setEditingUser(user);
                        setShowAddUserModal(true);
                    }}
                    onDeleteUser={(userId) => {
                        if (window.confirm('Are you sure you want to delete this user?')) {
                            deleteAgent(userId);
                            showToast('User deleted successfully', 'success');
                        }
                    }}
                    onUpdateUser={updateAgent}
                />
            )}

            {activeTab === 'performance' && (
                <PerformanceDashboard
                    currentUser={currentUser}
                    agents={agents}
                    leads={leads}
                />
            )}

            {/* Add/Edit User Modal */}
            {showAddUserModal && (
                <AddUserModal
                    isOpen={showAddUserModal}
                    onClose={() => {
                        setShowAddUserModal(false);
                        setEditingUser(null);
                    }}
                    onSave={(userData) => {
                        if (editingUser) {
                            updateAgent({ ...editingUser, ...userData });
                            showToast('User updated successfully', 'success');
                        } else {
                            addAgent(userData as Agent);
                            showToast('User created successfully', 'success');
                        }
                        setShowAddUserModal(false);
                        setEditingUser(null);
                    }}
                    editingUser={editingUser}
                    currentUserRole={currentUser.role}
                    existingTeams={[...new Set(agents.map(a => a.team).filter(Boolean))]}
                />
            )}
        </div>
    );
};
