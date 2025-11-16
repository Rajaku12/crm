import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Agent, Notification } from '../types';
import { BellIcon, LogoutIcon, InboxIcon, UserCircleIcon } from './icons/IconComponents';
import { timeSince } from '../utils';
import { useAppContext } from '../contexts/AppContext';

interface HeaderProps {
    currentUser: Agent;
    onMenuClick: () => void;
    onSelectLeadById: (id: string | number) => void;
    onLogout: () => void;
    onProfileClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onMenuClick, onSelectLeadById, onLogout, onProfileClick }) => {
    const { notifications, setNotifications } = useAppContext();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [notificationRef, profileMenuRef]);

    const onNotificationClick = (id: string | number) => {
        setNotifications(p => p.map(n => n.id === id ? {...n, isRead: true} : n));
    };

    const onMarkAllAsRead = () => {
        setNotifications(p => p.map(n => ({...n, isRead: true})));
    };

    const handleNotificationItemClick = (notification: Notification) => {
        onNotificationClick(notification.id);
        onSelectLeadById(notification.leadId);
        setIsNotificationsOpen(false);
    };

    return (
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
            <button onClick={onMenuClick} className="text-gray-500 focus:outline-none md:hidden">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
            </button>
            <div className="hidden md:block">
                <h1 className="text-2xl font-bold text-gray-800">Welcome back, {currentUser.name.split(' ')[0]}!</h1>
                <p className="text-sm text-gray-500">Here's your real-time overview of the CRM.</p>
            </div>

            <div className="flex items-center space-x-4">
                <div className="relative" ref={notificationRef}>
                    <button onClick={() => setIsNotificationsOpen(prev => !prev)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 focus:outline-none">
                        <BellIcon className="w-6 h-6 text-gray-600" />
                    </button>
                    {unreadCount > 0 && <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>}
                    
                    {isNotificationsOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden z-20 flex flex-col">
                           <div className="py-2 px-4 border-b font-semibold text-gray-700">Notifications</div>
                           <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                               {notifications.map(notification => (
                                   <li key={notification.id} onClick={() => handleNotificationItemClick(notification)} className={`p-3 hover:bg-gray-50 cursor-pointer ${!notification.isRead ? 'bg-primary-50' : ''}`}>
                                       <p className="font-semibold text-sm text-gray-800">{notification.type}</p>
                                       <p className="text-sm text-gray-600">{notification.message}</p>
                                       <p className="text-xs text-gray-400 mt-1">{timeSince(new Date(notification.timestamp))}</p>
                                   </li>
                               ))}
                               {notifications.length === 0 && (
                                   <li className="p-8 text-center text-sm text-gray-500">
                                       <InboxIcon className="mx-auto h-12 w-12 text-gray-400" />
                                       <h3 className="mt-2 font-medium text-gray-900">All caught up!</h3>
                                       <p className="mt-1">You have no new notifications.</p>
                                   </li>
                               )}
                           </ul>
                           {notifications.some(n => !n.isRead) && (
                                <div className="py-2 px-4 border-t bg-gray-50">
                                    <button 
                                        onClick={onMarkAllAsRead}
                                        className="w-full text-center text-sm font-medium text-primary-600 hover:text-primary-800"
                                    >
                                        Mark all as read
                                    </button>
                                </div>
                           )}
                        </div>
                    )}
                </div>
                <div className="relative" ref={profileMenuRef}>
                    <button onClick={() => setIsProfileMenuOpen(prev => !prev)} className="flex items-center space-x-3 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-10 h-10 rounded-full" />
                        <div className="hidden md:block text-left">
                            <p className="font-semibold text-gray-800 text-sm">{currentUser.name}</p>
                            <p className="text-xs text-gray-500">{currentUser.role}</p>
                        </div>
                    </button>
                    {isProfileMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                            <button
                                onClick={() => { onProfileClick(); setIsProfileMenuOpen(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                                <UserCircleIcon className="w-5 h-5 mr-2 text-gray-500" />
                                My Profile
                            </button>
                            <button
                                onClick={onLogout}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                                <LogoutIcon className="w-5 h-5 mr-2 text-gray-500" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
