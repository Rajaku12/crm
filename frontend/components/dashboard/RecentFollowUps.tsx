import React from 'react';
import { Card } from '../ui/Card';
import { Tag } from '../ui/Tag';
import { RecentFollowUp } from './dashboardTypes';

interface RecentFollowUpsProps {
    followUps: RecentFollowUp[];
}

export const RecentFollowUps: React.FC<RecentFollowUpsProps> = ({ followUps }) => {
    return (
        <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Follow-Ups</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-4 py-3">Lead Name</th>
                            <th className="px-4 py-3">Follow-Up Date</th>
                            <th className="px-4 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {followUps.length > 0 ? followUps.map(followUp => (
                            <tr key={followUp.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-4 py-4 font-medium text-gray-900">{followUp.leadName}</td>
                                <td className="px-4 py-4">{followUp.followUpDate}</td>
                                <td className="px-4 py-4"><Tag type={followUp.status} /></td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={3} className="text-center py-8 text-gray-500">No recent follow-ups.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
