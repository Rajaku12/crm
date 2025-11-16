import React from 'react';
import { Card } from '../ui/Card';

interface MetricCardProps {
    title: string;
    data: { value: number; change: number };
    icon: React.ReactNode;
    color: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, data, icon, color }) => {
    const isPositive = data.change >= 0;
    
    return (
        <Card>
            <div className="flex items-center justify-between">
                <div className={`p-3 rounded-full ${color}`}>
                    {icon}
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-3xl font-bold text-gray-800">{data.value.toLocaleString()}</p>
                </div>
            </div>
            <div className="mt-4 flex items-center">
                <span className={`px-2 py-1 text-xs font-semibold rounded-md ${isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {isPositive ? '↑' : '↓'} {Math.abs(data.change)}%
                </span>
                <p className="ml-2 text-xs text-gray-500">from yesterday (mock)</p>
            </div>
        </Card>
    );
};
