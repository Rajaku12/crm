import React, { useState } from 'react';
import { Property, Lead } from '../types';
import { LeadsIcon } from './icons/IconComponents';
import { Card } from './ui/Card';

interface PropertyDetailPanelProps {
    property: Property | null;
    leads: Lead[];
    onClose: () => void;
    onUpdateProperty: (property: Property) => void;
    // Fix: Allow string or number for property ID.
    onDeleteProperty: (propertyId: string | number) => void;
    onSelectLead: (lead: Lead) => void;
    onEditClick: () => void;
}

type PanelTab = 'details' | 'media' | 'leads';

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
    }).format(price);
};

export const PropertyDetailPanel: React.FC<PropertyDetailPanelProps> = ({ property, leads, onClose, onUpdateProperty, onDeleteProperty, onSelectLead, onEditClick }) => {
    const [activeTab, setActiveTab] = useState<PanelTab>('details');
    
    if (!property) return null;

    const linkedLeads = leads.filter(lead => lead.propertyId === property.id);

    const panelClasses = `
        fixed top-0 right-0 w-full max-w-2xl h-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-40
        flex flex-col
        ${property ? 'translate-x-0' : 'translate-x-full'}
    `;

    return (
        <>
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity ${property ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}></div>
            <div className={panelClasses}>
                <header className="p-6 border-b">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{property.name}</h2>
                            <p className="text-sm text-gray-500">{property.location}</p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-lg font-bold text-primary-600">{formatPrice(property.price)}</span>
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{property.category}</span>
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">{property.status}</span>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 -mr-2 -mt-2">&times;</button>
                    </div>
                </header>

                <div className="p-6 border-b bg-gray-50/50 grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-2xl font-bold text-gray-800">{property.stats.views}</p>
                        <p className="text-sm font-medium text-gray-500">Views</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-800">{property.stats.inquiries}</p>
                        <p className="text-sm font-medium text-gray-500">Inquiries</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-800">{property.stats.conversions}</p>
                        <p className="text-sm font-medium text-gray-500">Conversions</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                     <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-6 px-6" aria-label="Tabs">
                            <button onClick={() => setActiveTab('details')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Details</button>
                            <button onClick={() => setActiveTab('media')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'media' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Media</button>
                            <button onClick={() => setActiveTab('leads')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'leads' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Linked Leads ({linkedLeads.length})</button>
                        </nav>
                    </div>
                    
                    <div className="p-6">
                        {activeTab === 'details' && (
                             <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
                                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-md">{property.description}</p>
                                <div className="mt-6 flex space-x-3">
                                    <button onClick={onEditClick} className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700">Edit Property</button>
                                     <button onClick={() => { if(window.confirm('Are you sure you want to delete this property?')) onDeleteProperty(property.id) }} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700">Delete Property</button>
                                </div>
                            </div>
                        )}
                        {activeTab === 'media' && (
                             <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Photos</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {property.images.map((img, index) => <img key={index} src={img} alt={`${property.name} photo ${index + 1}`} className="rounded-lg shadow-md aspect-video object-cover" />)}
                                </div>
                                {(property.floorPlanUrl || property.documents) && <div className="mt-6 space-y-2">
                                    {property.floorPlanUrl && <a href={property.floorPlanUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-sm">View Floor Plan</a>}
                                    {property.documents && property.documents.map(doc => <a key={doc.name} href={doc.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-sm block">Download {doc.name}</a>)}
                                </div>}
                            </div>
                        )}
                        {activeTab === 'leads' && (
                             <div>
                                {linkedLeads.length > 0 ? (
                                    <ul className="space-y-3">
                                        {linkedLeads.map(lead => (
                                            <li key={lead.id} onClick={() => onSelectLead(lead)} className="p-3 bg-white rounded-md shadow-sm border flex justify-between items-center cursor-pointer hover:bg-gray-50">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{lead.name}</p>
                                                    <p className="text-sm text-gray-500">{lead.email}</p>
                                                </div>
                                                <span className="text-xs font-medium bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">{lead.status}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center py-8">
                                        <LeadsIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No Linked Leads</h3>
                                        <p className="mt-1 text-sm text-gray-500">Assign this property to leads from their detail page.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};