import React, { useState, useEffect } from 'react';
import { Client, Occupation, ClientLeadSource } from '../../types';
import { INDIAN_STATES, OCCUPATION_OPTIONS, CLIENT_LEAD_SOURCES } from '../../constants';

interface ClientFormProps {
    client: Client | null;
    onSave: (clientData: Client | Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onCancel: () => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({ client, onSave, onCancel }) => {
    const initialState = {
        name: '',
        contact: '',
        email: '',
        dob: '',
        pan: '',
        address: '',
        city: '',
        state: '',
        pinCode: '',
        occupation: Occupation.Other,
        organization: '',
        designation: '',
        leadSource: ClientLeadSource.Other,
    };

    const [formState, setFormState] = useState(initialState);
    const [errors, setErrors] = useState<Partial<Record<keyof typeof initialState, string>>>({});

    useEffect(() => {
        if (client) {
            setFormState({
                name: client.name || '',
                contact: client.contact || '',
                email: client.email || '',
                dob: client.dob || '',
                pan: client.pan || '',
                address: client.address || '',
                city: client.city || '',
                state: client.state || '',
                pinCode: client.pinCode || '',
                occupation: client.occupation || Occupation.Other,
                organization: client.organization || '',
                designation: client.designation || '',
                leadSource: client.leadSource || ClientLeadSource.Other,
            });
        } else {
            setFormState(initialState);
        }
        setErrors({});
    }, [client]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const validate = (): boolean => {
        const newErrors: Partial<typeof initialState> = {};
        const trimmedName = formState.name.trim();
        const trimmedContact = formState.contact.trim();
        const trimmedEmail = formState.email.trim();
        const trimmedPan = formState.pan?.trim().toUpperCase() || '';
        const trimmedPinCode = formState.pinCode?.trim() || '';

        if (!trimmedName) newErrors.name = "Client Name is required.";

        // Stricter 10-digit phone number validation
        if (!trimmedContact) {
            newErrors.contact = "Contact number is required.";
        } else if (!/^\d{10}$/.test(trimmedContact)) {
            newErrors.contact = "Please enter a valid 10-digit contact number.";
        }

        // Stricter email format validation
        if (!trimmedEmail) {
            newErrors.email = "Email is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            newErrors.email = "Please enter a valid email format (e.g., name@example.com).";
        }

        // Stricter PAN format validation
        if (trimmedPan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(trimmedPan)) {
            newErrors.pan = "Please enter a valid 10-character PAN format (e.g., ABCDE1234F).";
        }
        
        if (trimmedPinCode && !/^\d{6}$/.test(trimmedPinCode)) {
            newErrors.pinCode = "Please enter a valid 6-digit Pin Code.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            if (client) {
                onSave({ ...client, ...formState });
            } else {
                onSave(formState);
            }
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="pt-4 border-t">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{client ? 'Edit Client' : 'Add New Client'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="client-name" className="block text-sm font-medium text-gray-700">Client Name *</label>
                    <input type="text" id="client-name" name="name" value={formState.name} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'client-name-error' : undefined} />
                    {errors.name && <p id="client-name-error" className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                    <label htmlFor="client-contact" className="block text-sm font-medium text-gray-700">Client Contact *</label>
                    <input type="text" id="client-contact" name="contact" value={formState.contact} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" aria-invalid={!!errors.contact} aria-describedby={errors.contact ? 'client-contact-error' : undefined} />
                    {errors.contact && <p id="client-contact-error" className="text-red-500 text-xs mt-1">{errors.contact}</p>}
                </div>
                <div>
                    <label htmlFor="client-email" className="block text-sm font-medium text-gray-700">Client Mail *</label>
                    <input type="email" id="client-email" name="email" value={formState.email} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'client-email-error' : undefined} />
                    {errors.email && <p id="client-email-error" className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                    <label htmlFor="client-dob" className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <input type="date" id="client-dob" name="dob" value={formState.dob} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                    <label htmlFor="client-pan" className="block text-sm font-medium text-gray-700">PAN</label>
                    <input type="text" id="client-pan" name="pan" value={formState.pan} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" aria-invalid={!!errors.pan} aria-describedby={errors.pan ? 'client-pan-error' : undefined} />
                    {errors.pan && <p id="client-pan-error" className="text-red-500 text-xs mt-1">{errors.pan}</p>}
                </div>
                 <div>
                    <label htmlFor="client-city" className="block text-sm font-medium text-gray-700">City</label>
                    <input type="text" id="client-city" name="city" value={formState.city} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                    <label htmlFor="client-state" className="block text-sm font-medium text-gray-700">State</label>
                    <select id="client-state" name="state" value={formState.state} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                        <option value="">Select State</option>
                        {INDIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="client-pinCode" className="block text-sm font-medium text-gray-700">Pin Code</label>
                    <input type="text" id="client-pinCode" name="pinCode" value={formState.pinCode} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" aria-invalid={!!errors.pinCode} aria-describedby={errors.pinCode ? 'client-pinCode-error' : undefined} />
                    {errors.pinCode && <p id="client-pinCode-error" className="text-red-500 text-xs mt-1">{errors.pinCode}</p>}
                </div>
                 <div>
                    <label htmlFor="client-occupation" className="block text-sm font-medium text-gray-700">Occupation</label>
                    <select id="client-occupation" name="occupation" value={formState.occupation} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                        {OCCUPATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="client-organization" className="block text-sm font-medium text-gray-700">Organization</label>
                    <input type="text" id="client-organization" name="organization" value={formState.organization} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                    <label htmlFor="client-designation" className="block text-sm font-medium text-gray-700">Designation</label>
                    <input type="text" id="client-designation" name="designation" value={formState.designation} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                </div>
                 <div>
                    <label htmlFor="client-leadSource" className="block text-sm font-medium text-gray-700">Lead Source</label>
                    <select id="client-leadSource" name="leadSource" value={formState.leadSource} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                        {CLIENT_LEAD_SOURCES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                    <label htmlFor="client-address" className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea id="client-address" name="address" value={formState.address} onChange={handleInputChange} rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-primary-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-primary-700">
                    {client ? 'Update Client' : 'Save Client'}
                </button>
            </div>
        </form>
    );
};