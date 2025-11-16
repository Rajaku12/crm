import React, { useState, useEffect } from 'react';
import { Property, PropertyCategory, PropertyStatus } from '../../types';
import { CloseIcon } from '../icons/IconComponents';

interface EditPropertyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdateProperty: (propertyData: Property) => void;
    property: Property | null;
}

// Simplified form state for what's editable
type EditablePropertyFields = Omit<Property, 'id' | 'stats' | 'documents'>;

export const EditPropertyModal: React.FC<EditPropertyModalProps> = ({ isOpen, onClose, onUpdateProperty, property }) => {
    
    const [formState, setFormState] = useState<Partial<EditablePropertyFields>>({});
    const [errors, setErrors] = useState<Partial<Record<keyof EditablePropertyFields, string>>>({});

    useEffect(() => {
        if (property) {
            setFormState({
                name: property.name,
                category: property.category,
                price: property.price,
                status: property.status,
                location: property.location,
                description: property.description,
                images: property.images || [],
                floorPlanUrl: property.floorPlanUrl || '',
            });
        }
        if (!isOpen) {
            setErrors({});
        }
    }, [property, isOpen]);
    
    if (!isOpen || !property) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) || 0 : value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        // handle empty input gracefully
        if (value.trim() === '') {
            setFormState(prev => ({...prev, images: []}));
        } else {
            setFormState(prev => ({...prev, images: value.split(',').map(url => url.trim())}));
        }
    }

    const validate = () => {
        const newErrors: Partial<Record<keyof EditablePropertyFields, string>> = {};
        if (!formState.name) newErrors.name = "Property Name is required";
        if (!formState.location) newErrors.location = "Location is required";
        if (!formState.price || formState.price <= 0) newErrors.price = "Price must be a positive number";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onUpdateProperty({
                ...property,
                ...formState,
            } as Property);
            onClose();
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
                        <h2 className="text-xl font-bold text-gray-800">Edit Property</h2>
                        <button type="button" onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                            <CloseIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Property Name *</label>
                                <input type="text" name="name" value={formState.name || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                                {renderError('name')}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Location *</label>
                                <input type="text" name="location" value={formState.location || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                                {renderError('location')}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Price (USD) *</label>
                                <input type="number" name="price" value={formState.price || 0} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                                {renderError('price')}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category *</label>
                                <select name="category" value={formState.category} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                    {Object.values(PropertyCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Status *</label>
                                <select name="status" value={formState.status} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                    {Object.values(PropertyStatus).map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </div>
                        </div>

                         <div>
                            <label className="block text-sm font-medium text-gray-700">Image URLs (comma-separated)</label>
                            <input type="text" name="images" value={formState.images?.join(', ') || ''} onChange={handleImageChange} placeholder="e.g. https://.../img1.jpg, https://.../img2.jpg" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Floor Plan URL</label>
                            <input type="text" name="floorPlanUrl" value={formState.floorPlanUrl || ''} onChange={handleInputChange} placeholder="https://.../floorplan.pdf" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea name="description" value={formState.description || ''} onChange={handleInputChange} rows={4} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-primary-700">
                            Update Property
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};