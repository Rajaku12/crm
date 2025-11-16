import React, { useMemo, useState, useEffect } from 'react';
import { Agent } from '../types';
import { Card } from './ui/Card';
import { FingerPrintIcon } from './icons/IconComponents';
import { useAppContext } from '../contexts/AppContext';

interface AttendanceProps {
    currentUser: Agent;
    onCheckIn: (agentId: number | string, method: 'Manual' | 'Fingerprint') => void;
    onCheckOut: (agentId: number | string, method: 'Manual' | 'Fingerprint') => void;
    isScanning: boolean;
}

export const Attendance: React.FC<AttendanceProps> = ({ currentUser, onCheckIn, onCheckOut, isScanning }) => {
    const { agents } = useAppContext();
    const canViewAll = currentUser.role === 'Admin' || currentUser.role === 'Sales Manager';
    const viewableAgents = useMemo(() => {
        if (currentUser.role === 'Admin') return agents;
        if (currentUser.role === 'Sales Manager') return agents.filter(a => a.team === currentUser.team);
        return [currentUser];
    }, [agents, currentUser]);
    
    const [selectedAgentId, setSelectedAgentId] = useState<number | string>(currentUser.id);
    const [timeFrame, setTimeFrame] = useState<'week' | 'month'>('week');
    const [checkInMethod, setCheckInMethod] = useState<'Manual' | 'Fingerprint'>('Fingerprint');

    const selectedAgent = useMemo(() => agents.find(a => a.id === selectedAgentId), [agents, selectedAgentId]);

    const attendanceRecords = useMemo(() => {
        if (!selectedAgent || !selectedAgent.attendance) return [];
        return [...selectedAgent.attendance].sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());
    }, [selectedAgent]);
    
    const today = new Date().toISOString().split('T')[0];
    const [duration, setDuration] = useState('');

    const todaysRecord = useMemo(() => {
        if (!currentUser.attendance) return null;
        return currentUser.attendance
            .filter(rec => rec.checkInTime.startsWith(today))
            .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())[0];
    }, [currentUser.attendance, today]);

    useEffect(() => {
        let interval: number;
        if (todaysRecord && !todaysRecord.checkOutTime) {
            const updateDuration = () => {
                const now = new Date();
                const start = new Date(todaysRecord.checkInTime);
                const diffMinutes = Math.floor((now.getTime() - start.getTime()) / 60000);
                const hours = Math.floor(diffMinutes / 60);
                const minutes = diffMinutes % 60;
                setDuration(`${hours}h ${minutes}m`);
            };
            updateDuration();
            interval = window.setInterval(updateDuration, 1000);
        }
        return () => clearInterval(interval);
    }, [todaysRecord]);

    let status: 'Not Checked In' | 'Checked In' | 'Checked Out' = 'Not Checked In';
    let checkInTime: string | null = null;
    if (todaysRecord) {
        checkInTime = new Date(todaysRecord.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (todaysRecord.checkOutTime) {
            status = 'Checked Out';
        } else {
            status = 'Checked In';
        }
    }

    const statusConfig = {
        'Not Checked In': { color: 'bg-yellow-100 text-yellow-800', message: 'You are not checked in yet.' },
        'Checked In': { color: 'bg-green-100 text-green-800', message: `Checked in at ${checkInTime}. Session: ${duration}` },
        'Checked Out': { color: 'bg-gray-100 text-gray-800', message: `Checked out for the day.` },
    };

    const totalDuration = useMemo(() => {
        if (!attendanceRecords) return { hours: 0, minutes: 0 };

        const now = new Date();
        let filteredRecords = [];

        if (timeFrame === 'week') {
            const firstDayOfWeek = new Date();
            firstDayOfWeek.setDate(now.getDate() - now.getDay());
            firstDayOfWeek.setHours(0, 0, 0, 0);
            filteredRecords = attendanceRecords.filter(record => new Date(record.checkInTime) >= firstDayOfWeek);
        } else { // month
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            filteredRecords = attendanceRecords.filter(record => new Date(record.checkInTime) >= firstDayOfMonth);
        }

        const totalMinutes = filteredRecords.reduce((sum, record) => sum + (record.duration || 0), 0);
        
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return { hours, minutes };
    }, [attendanceRecords, timeFrame]);

    const formatTime = (isoString?: string) => {
        if (!isoString) return 'Pending';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <Card>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Attendance History</h1>
                    <p className="text-sm text-gray-500">Review check-in and check-out records.</p>
                </div>
                {canViewAll && (
                    <select
                        value={String(selectedAgentId)}
                        onChange={(e) => setSelectedAgentId(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md shadow-sm text-sm w-full md:w-auto"
                    >
                        {viewableAgents.map(agent => (
                            <option key={agent.id} value={agent.id}>{agent.id === currentUser.id ? `${agent.name} (You)` : agent.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {selectedAgentId === currentUser.id && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Your Current Status</h3>
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div>
                            <div className="flex items-center">
                                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusConfig[status].color}`}>
                                    {status}
                                </span>
                                <p className="ml-4 text-sm text-gray-600">{statusConfig[status].message}</p>
                            </div>
                        </div>
                        <div className="mt-4 md:mt-0 flex items-center space-x-2">
                            {status !== 'Checked Out' && (
                                <div className="flex items-center rounded-lg bg-gray-200 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setCheckInMethod('Manual')}
                                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                                            checkInMethod === 'Manual' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:bg-gray-300'
                                        }`}
                                    >
                                        Manual
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCheckInMethod('Fingerprint')}
                                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors flex items-center ${
                                            checkInMethod === 'Fingerprint' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:bg-gray-300'
                                        }`}
                                    >
                                        <FingerPrintIcon className="h-4 w-4 mr-2" />
                                        Fingerprint
                                    </button>
                                </div>
                            )}
                            {status === 'Not Checked In' && (
                                <button onClick={() => onCheckIn(currentUser.id, checkInMethod)} disabled={isScanning} className="flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 transition-colors disabled:bg-primary-400 disabled:cursor-wait w-36 justify-center">
                                    {checkInMethod === 'Fingerprint' && <FingerPrintIcon className={`h-5 w-5 mr-2 ${isScanning ? 'animate-pulse' : ''}`}/>}
                                    {isScanning ? 'Scanning...' : 'Check In'}
                                </button>
                            )}
                            {status === 'Checked In' && (
                                <button onClick={() => onCheckOut(currentUser.id, checkInMethod)} disabled={isScanning} className="flex items-center px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-wait w-36 justify-center">
                                    {checkInMethod === 'Fingerprint' && <FingerPrintIcon className={`h-5 w-5 mr-2 ${isScanning ? 'animate-pulse' : ''}`}/>}
                                    {isScanning ? 'Scanning...' : 'Check Out'}
                                </button>
                            )}
                            {status === 'Checked Out' && (
                                <button disabled className="px-6 py-3 bg-gray-400 text-white font-semibold rounded-lg cursor-not-allowed w-36 justify-center">
                                    Checked Out
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-6 p-4 bg-gray-50 rounded-lg flex flex-col md:flex-row justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Total Hours for {selectedAgent?.name.split(' ')[0]}</h3>
                    <p className="text-3xl font-bold text-primary-600 mt-1">{totalDuration.hours}<span className="text-xl font-medium text-gray-500">h</span> {totalDuration.minutes}<span className="text-xl font-medium text-gray-500">m</span></p>
                </div>
                <div className="flex items-center rounded-lg bg-gray-200 p-1 mt-4 md:mt-0">
                    <button
                        onClick={() => setTimeFrame('week')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${timeFrame === 'week' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:bg-gray-300'}`}
                    >
                        This Week
                    </button>
                    <button
                        onClick={() => setTimeFrame('month')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${timeFrame === 'month' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:bg-gray-300'}`}
                    >
                        This Month
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Check In</th>
                            <th scope="col" className="px-6 py-3">Check Out</th>
                            <th scope="col" className="px-6 py-3">Duration (Minutes)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendanceRecords.map(record => (
                            <tr key={record.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{formatDate(record.checkInTime)}</td>
                                <td className="px-6 py-4 text-green-600 font-semibold">{formatTime(record.checkInTime)}</td>
                                <td className="px-6 py-4 text-red-600 font-semibold">{formatTime(record.checkOutTime)}</td>
                                <td className="px-6 py-4">{record.duration ?? 'Pending'}</td>
                            </tr>
                        ))}
                         {attendanceRecords.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-gray-500">No attendance records found for this user.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
