
import React, { useState, useMemo } from 'react';
import { Card } from './ui/Card';
import { Property, PropertyCategory, PropertyStatus } from '../types';
import { BuildingOfficeIcon } from './icons/IconComponents';

interface PropertiesProps {
  properties: Property[];
  onSelectProperty: (property: Property) => void;
  onAddPropertyClick: () => void;
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};

const statusColorMap: { [key in PropertyStatus]: string } = {
    [PropertyStatus.Available]: 'bg-green-100 text-green-800',
    [PropertyStatus.Sold]: 'bg-red-100 text-red-800',
    [PropertyStatus.Rented]: 'bg-purple-100 text-purple-800',
    [PropertyStatus.UnderOffer]: 'bg-yellow-100 text-yellow-800',
};

export const Properties: React.FC<PropertiesProps> = ({ properties, onSelectProperty, onAddPropertyClick }) => {
    const [filterStatus, setFilterStatus] = useState<PropertyStatus | 'All'>('All');
    const [filterCategory, setFilterCategory] = useState<PropertyCategory | 'All'>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });

    const filteredAndSortedProperties = useMemo(() => {
        let sortableProperties = [...properties];

        if (sortConfig !== null) {
            sortableProperties.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        
        return sortableProperties.filter(property => {
            const statusMatch = filterStatus === 'All' || property.status === filterStatus;
            const categoryMatch = filterCategory === 'All' || property.category === filterCategory;
            const searchMatch = property.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                property.location.toLowerCase().includes(searchTerm.toLowerCase());
            return statusMatch && categoryMatch && searchMatch;
        });

    }, [properties, filterStatus, filterCategory, searchTerm, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    }

    return (
        <Card className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-800">All Properties</h2>
                    <button
                        onClick={onAddPropertyClick}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                        Add Property
                    </button>
                </div>
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Search name or location..."
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select
                        className="p-2 border border-gray-300 rounded-md"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value as PropertyCategory | 'All')}
                    >
                        <option value="All">All Categories</option>
                        {Object.values(PropertyCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <select
                        className="p-2 border border-gray-300 rounded-md"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as PropertyStatus | 'All')}
                    >
                        <option value="All">All Statuses</option>
                        {Object.values(PropertyStatus).map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('name')}>Name {getSortIndicator('name')}</th>
                            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('category')}>Category {getSortIndicator('category')}</th>
                            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('price')}>Price {getSortIndicator('price')}</th>
                            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('status')}>Status {getSortIndicator('status')}</th>
                            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('location')}>Location {getSortIndicator('location')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedProperties.map(property => (
                            <tr
                                key={property.id}
                                className="bg-white border-b hover:bg-gray-50 cursor-pointer"
                                onClick={() => onSelectProperty(property)}
                            >
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{property.name}</td>
                                <td className="px-6 py-4">{property.category}</td>
                                <td className="px-6 py-4 font-semibold">{formatPrice(property.price)}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColorMap[property.status]}`}>
                                        {property.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{property.location}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
