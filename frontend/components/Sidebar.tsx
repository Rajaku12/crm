import React from 'react';
import { DashboardIcon, LeadsIcon, PhoneIcon, ReportsIcon, SettingsIcon, BuildingOfficeIcon, ChecklistIcon, EyeIcon, CalendarIcon, UserGroupIcon, UserCogIcon } from './icons/IconComponents';
import { Agent } from '../types';

// Fix: Add 'profile' to View type to match App.tsx
type View = 'dashboard' | 'leads' | 'clients' | 'agents' | 'calls' | 'tasks' | 'reports' | 'properties' | 'settings' | 'supervision' | 'attendance' | 'profile';

interface SidebarProps {
  view: View;
  setView: (view: View) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentUser: Agent;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <li
    onClick={onClick}
    className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors duration-200 ${
      isActive
        ? 'bg-primary-700 text-white shadow-lg'
        : 'text-gray-300 hover:bg-primary-800 hover:text-white'
    }`}
  >
    {icon}
    <span className="ml-4 text-sm font-medium">{label}</span>
  </li>
);

export const Sidebar: React.FC<SidebarProps> = ({ view, setView, sidebarOpen, setSidebarOpen, currentUser }) => {
    const handleNavigation = (newView: View) => {
        setView(newView);
        if(window.innerWidth < 768) { // md breakpoint
            setSidebarOpen(false);
        }
    };

    const sidebarClasses = `
        bg-primary-900 text-white w-64 h-full flex flex-col space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform
        md:relative md:translate-x-0 transition duration-200 ease-in-out z-30
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    `;

    // Navigation items are defined with the roles that can see them.
    const allNavItems = [
        { view: 'dashboard', label: 'Dashboard', icon: <DashboardIcon className="h-6 w-6" />, roles: ['Admin', 'Sales Manager', 'Agent', 'Telecaller'] },
        { view: 'clients', label: 'Clients', icon: <UserGroupIcon className="h-6 w-6" />, roles: ['Admin', 'Sales Manager', 'Agent', 'Customer Support'] },
        { view: 'agents', label: 'Agents', icon: <UserCogIcon className="h-6 w-6" />, roles: ['Admin', 'Sales Manager'] },
        { view: 'leads', label: 'Leads', icon: <LeadsIcon className="h-6 w-6" />, roles: ['Admin', 'Sales Manager', 'Agent', 'Telecaller', 'Customer Support'] },
        { view: 'calls', label: 'Calls', icon: <PhoneIcon className="h-6 w-6" />, roles: ['Admin', 'Sales Manager', 'Agent'] },
        { view: 'tasks', label: 'Tasks Planner', icon: <ChecklistIcon className="h-6 w-6" />, roles: ['Admin', 'Sales Manager', 'Agent'] },
        { view: 'attendance', label: 'Attendance', icon: <CalendarIcon className="h-6 w-6" />, roles: ['Admin', 'Sales Manager', 'Agent', 'Telecaller'] },
        { view: 'properties', label: 'Properties', icon: <BuildingOfficeIcon className="h-6 w-6" />, roles: ['Admin', 'Sales Manager', 'Agent'] },
        { view: 'payments', label: 'Payments', icon: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>, roles: ['Admin', 'Sales Manager', 'Agent'] },
        { view: 'reports', label: 'Reports', icon: <ReportsIcon className="h-6 w-6" />, roles: ['Admin', 'Sales Manager'] },
        { view: 'supervision', label: 'Supervision', icon: <EyeIcon className="h-6 w-6" />, roles: ['Admin'] },
    ];

    const settingsItem = { view: 'settings', label: 'Settings', icon: <SettingsIcon className="h-6 w-6" />, roles: ['Admin'] };

    // Filter navigation items based on the current user's role.
    const accessibleNavItems = allNavItems.filter(item => item.roles.includes(currentUser.role));
    const canSeeSettings = settingsItem.roles.includes(currentUser.role);


    return (
        <>
        {sidebarOpen && <div className="fixed inset-0 bg-black opacity-50 z-20 md:hidden" onClick={() => setSidebarOpen(false)}></div>}
        <div className={sidebarClasses}>
        <div className="text-white text-2xl font-extrabold flex items-center justify-center px-4 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.496 2.132a1 1 0 00-1.024.032L2.25 7.682A1 1 0 002 8.5v8a1 1 0 001 1h3.5a1 1 0 001-1v-2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5V17a1 1 0 001 1h3.5a1 1 0 001-1v-8a1 1 0 00-.276-1.318L10.496 2.132z" clipRule="evenodd" />
            </svg>
            <span>Zenith Estate</span>
        </div>

        <nav className="flex-1 overflow-y-auto">
            <ul className="space-y-2">
                {accessibleNavItems.map((item) => (
                     <NavItem 
                        key={item.view}
                        icon={item.icon}
                        label={item.label}
                        isActive={view === item.view}
                        onClick={() => handleNavigation(item.view as View)}
                    />
                ))}
            </ul>
        </nav>

        {canSeeSettings && currentUser.role === 'Admin' && (
            <div className="flex-shrink-0 mt-auto">
                <hr className="my-4 border-primary-700" />
                <NavItem 
                    icon={settingsItem.icon}
                    label={settingsItem.label}
                    isActive={view === settingsItem.view}
                    onClick={() => handleNavigation(settingsItem.view as View)}
                />
            </div>
        )}
        </div>
        </>
    );
};