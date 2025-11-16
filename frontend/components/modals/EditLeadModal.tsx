import React, { useState, useEffect } from 'react';
import { Agent, Lead, LeadStatus, LeadTag, Property, PropertyStatus } from '../../types';
import { CloseIcon } from '../icons/IconComponents';
import { LEAD_SOURCES, PRODUCT_OPTIONS, SERVICE_OPTIONS } from '../../constants';
import { useAppContext } from '../../contexts/AppContext';

interface EditLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdateLead: (leadData: Lead) => void;
    lead: Lead | null;
}

export const EditLeadModal: React.FC<EditLeadModalProps> = ({ isOpen, onClose, onUpdateLead, lead }) => {
    const { agents, properties } = useAppContext();
    const [formState, setFormState] = useState<Partial<Lead>>({});
    const [errors, setErrors] = useState<Partial<Record<keyof Lead, string>>>({});

    useEffect(() => {
        if (lead) {
            setFormState({
                ...lead,
                propertyId: lead.propertyId || undefined
            });
        }
    }, [lead, isOpen]);
    
    if (!isOpen || !lead) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let processedValue: string | number | undefined = value;
        if (name === 'agentId' || name === 'propertyId') {
            processedValue = value ? parseInt(value, 10) : undefined;
        }
        setFormState(prev => ({ ...prev, [name]: processedValue }));
    };
    
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'products' | 'services') => {
        const { value, checked } = e.target;
        setFormState(prev => {
            const currentValues = prev[field] || [];
            if (checked) {
                return { ...prev, [field]: [...currentValues, value] };
            } else {
                return { ...prev, [field]: currentValues.filter(item => item !== value) };
            }
        });
    };
    
    const validate = () => {
        const newErrors: Partial<Record<keyof Lead, string>> = {};
        if (!formState.name) newErrors.name = "Full Name is required";
        if (!formState.email) newErrors.email = "Email Address is required";
        else if (!/\S+@\S+\.\S+/.test(formState.email)) newErrors.email = "Email address is invalid";
        if (!formState.phone) newErrors.phone = "Contact Number is required";
        if (!formState.source) newErrors.source = "Lead Source is required";
        if (!formState.agentId) newErrors.agentId = "Assigning an agent is required";
        if (!formState.status) newErrors.status = "Status is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onUpdateLead(formState as Lead);
        }
    };
    
    const renderError = (field: keyof typeof errors) => {
        return errors[field] ? <p className="text-red-500 text-xs mt-1">{errors[field]}</p> : null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Edit Lead</h2>
                        <button type="button" onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                            <CloseIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                                <input type="text" name="name" value={formState.name || ''} onChange={handleInputChange} placeholder="Enter lead's full name" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                                {renderError('name')}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email Address *</label>
                                <input type="email" name="email" value={formState.email || ''} onChange={handleInputChange} placeholder="Enter email address" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                                {renderError('email')}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Contact Number *</label>
                                <input type="tel" name="phone" value={formState.phone || ''} onChange={handleInputChange} placeholder="Enter contact number" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500" />
                                {renderError('phone')}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Lead Source *</label>
                                <select name="source" value={formState.source || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500">
                                    <option value="">Select lead source</option>
                                    {LEAD_SOURCES.map(source => <option key={source} value={source}>{source}</option>)}
                                </select>
                                {renderError('source')}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Property of Interest</label>
                             <select name="propertyId" value={formState.propertyId || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500">
                                <option value="">Select a property (optional)</option>
                                {properties.filter(p => p.status === PropertyStatus.Available).map(prop => <option key={prop.id} value={prop.id}>{prop.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Products</label>
                            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                                {PRODUCT_OPTIONS.map(product => (
                                    <label key={product} className="flex items-center space-x-2">
                                        <input type="checkbox" value={product} checked={formState.products?.includes(product) || false} onChange={e => handleCheckboxChange(e, 'products')} className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-offset-0 focus:ring-primary-200 focus:ring-opacity-50" />
                                        <span className="text-sm text-gray-600">{product}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Services</label>
                            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                                {SERVICE_OPTIONS.map(service => (
                                    <label key={service} className="flex items-center space-x-2">
                                        <input type="checkbox" value={service} checked={formState.services?.includes(service) || false} onChange={e => handleCheckboxChange(e, 'services')} className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-offset-0 focus:ring-primary-200 focus:ring-opacity-50" />
                                        <span className="text-sm text-gray-600">{service}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Assign Agent *</label>
                                <select name="agentId" value={formState.agentId || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500">
                                    <option value={0}>Select agent</option>
                                    {agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                                </select>
                                {renderError('agentId')}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status *</label>
                                <select name="status" value={formState.status || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500">
                                    {Object.values(LeadStatus).map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                                {renderError('status')}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tag *</label>
                                <select name="tag" value={formState.tag || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500">
                                    {Object.values(LeadTag).map(tag => <option key={tag} value={tag}>{tag}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea name="description" value={formState.description || ''} onChange={handleInputChange} rows={4} placeholder="Enter additional details about the lead..." className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"></textarea>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
