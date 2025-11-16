import React, { useState, useEffect, useRef } from 'react';
import { Agent } from '../../types';
import { INDIAN_STATES, MOCK_TEAMS, ROLE_PERMISSIONS } from '../../constants';

interface AgentFormProps {
    agent: Agent | null;
    onSave: (agentData: Agent | Omit<Agent, 'id'>) => void;
    onCancel: () => void;
    onDirtyChange: (isDirty: boolean) => void;
}

/**
 * A form component for creating and editing agent profiles.
 * Includes validation, dirty state tracking, and accessibility improvements.
 */
export const AgentForm: React.FC<AgentFormProps> = ({ agent, onSave, onCancel, onDirtyChange }) => {
    const initialState = {
        name: '',
        email: '',
        contact: '',
        role: 'Agent' as Agent['role'],
        avatarUrl: `https://i.pravatar.cc/150?u=${Date.now()}`,
        team: 'Unassigned',
        dob: '',
        pan: '',
        dealsIn: '',
        address: '',
        city: '',
        state: '',
        pinCode: '',
    };

    const [formState, setFormState] = useState(initialState);
    const [errors, setErrors] = useState<Partial<Record<keyof typeof initialState, string>>>({});
    
    // Store the initial state to compare for changes
    const initialFormStateRef = useRef(initialState);

    useEffect(() => {
        const stateToSet = agent ? {
            name: agent.name || '',
            email: agent.email || '',
            contact: agent.contact || '',
            role: agent.role || 'Agent',
            avatarUrl: agent.avatarUrl || '',
            team: agent.team || 'Unassigned',
            dob: agent.dob || '',
            pan: agent.pan || '',
            dealsIn: agent.dealsIn || '',
            address: agent.address || '',
            city: agent.city || '',
            state: agent.state || '',
            pinCode: agent.pinCode || '',
        } : initialState;
        
        setFormState(stateToSet);
        initialFormStateRef.current = stateToSet;
        setErrors({});
    }, [agent]);
    
    // Effect to check for form changes and notify parent
    useEffect(() => {
        const isDirty = JSON.stringify(formState) !== JSON.stringify(initialFormStateRef.current);
        onDirtyChange(isDirty);
    }, [formState, onDirtyChange]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const validate = (): boolean => {
        const newErrors: Partial<typeof initialState> = {};
        
        if (!formState.name.trim()) newErrors.name = "Agent Name is required.";
        if (!formState.email.trim()) {
            newErrors.email = "Email is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
            newErrors.email = "Please enter a valid email format.";
        }
        if (!formState.contact?.trim()) {
            newErrors.contact = "Contact number is required.";
        } else if (!/^\d{10}$/.test(formState.contact.trim())) {
            newErrors.contact = "Please enter a valid 10-digit contact number.";
        }
        if (formState.pan?.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formState.pan.trim().toUpperCase())) {
            newErrors.pan = "Please enter a valid 10-character PAN format (e.g., ABCDE1234F).";
        }
        if (formState.pinCode?.trim() && !/^\d{6}$/.test(formState.pinCode.trim())) {
            newErrors.pinCode = "Please enter a valid 6-digit Pin Code.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const finalData = {
                ...formState,
                team: formState.team === 'Unassigned' ? undefined : formState.team,
            };
            if (agent) {
                onSave({ ...agent, ...finalData });
            } else {
                onSave(finalData);
            }
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="pt-4 border-t space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">{agent ? 'Edit Agent' : 'Add New Agent'}</h3>

            <section>
                <h4 className="text-md font-semibold text-gray-700 mb-3 pb-2 border-b">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="agent-name" className="block text-sm font-medium text-gray-700">Agent Name *</label>
                        <input type="text" id="agent-name" name="name" value={formState.name} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'agent-name-error' : undefined} />
                        {errors.name && <p id="agent-name-error" className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label htmlFor="agent-email" className="block text-sm font-medium text-gray-700">Agent Email *</label>
                        <input type="email" id="agent-email" name="email" value={formState.email} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'agent-email-error' : undefined} />
                        {errors.email && <p id="agent-email-error" className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                        <label htmlFor="agent-contact" className="block text-sm font-medium text-gray-700">Agent Contact *</label>
                        <input type="text" id="agent-contact" name="contact" value={formState.contact} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" aria-invalid={!!errors.contact} aria-describedby={errors.contact ? 'agent-contact-error' : undefined} />
                        {errors.contact && <p id="agent-contact-error" className="text-red-500 text-xs mt-1">{errors.contact}</p>}
                    </div>
                </div>
            </section>

            <section>
                <h4 className="text-md font-semibold text-gray-700 mb-3 pb-2 border-b">Official Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="agent-role" className="block text-sm font-medium text-gray-700">Role</label>
                        <select id="agent-role" name="role" value={formState.role} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                            {Object.keys(ROLE_PERMISSIONS).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="agent-team" className="block text-sm font-medium text-gray-700">Team</label>
                        <select id="agent-team" name="team" value={formState.team} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                            {MOCK_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="agent-dealsIn" className="block text-sm font-medium text-gray-700">Deals In</label>
                        <input type="text" id="agent-dealsIn" name="dealsIn" value={formState.dealsIn} onChange={handleInputChange} placeholder="e.g., Residential, Commercial" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                    </div>
                </div>
            </section>

            <section>
                <h4 className="text-md font-semibold text-gray-700 mb-3 pb-2 border-b">Personal & Identification</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="agent-dob" className="block text-sm font-medium text-gray-700">Date of Birth</label>
                        <input type="date" id="agent-dob" name="dob" value={formState.dob} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label htmlFor="agent-pan" className="block text-sm font-medium text-gray-700">PAN</label>
                        <input type="text" id="agent-pan" name="pan" value={formState.pan} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm uppercase" placeholder="ABCDE1234F" aria-invalid={!!errors.pan} aria-describedby={errors.pan ? 'agent-pan-error' : undefined} />
                        {errors.pan && <p id="agent-pan-error" className="text-red-500 text-xs mt-1">{errors.pan}</p>}
                    </div>
                </div>
            </section>
            
            <section>
                <h4 className="text-md font-semibold text-gray-700 mb-3 pb-2 border-b">Address Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3">
                        <label htmlFor="agent-address" className="block text-sm font-medium text-gray-700">Address</label>
                        <textarea id="agent-address" name="address" value={formState.address} onChange={handleInputChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
                    </div>
                    <div>
                        <label htmlFor="agent-city" className="block text-sm font-medium text-gray-700">City</label>
                        <input type="text" id="agent-city" name="city" value={formState.city} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label htmlFor="agent-state" className="block text-sm font-medium text-gray-700">State</label>
                        <select id="agent-state" name="state" value={formState.state} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                            <option value="">Select State</option>
                            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="agent-pinCode" className="block text-sm font-medium text-gray-700">Pin Code</label>
                        <input type="text" id="agent-pinCode" name="pinCode" value={formState.pinCode} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" aria-invalid={!!errors.pinCode} aria-describedby={errors.pinCode ? 'agent-pinCode-error' : undefined} />
                        {errors.pinCode && <p id="agent-pinCode-error" className="text-red-500 text-xs mt-1">{errors.pinCode}</p>}
                    </div>
                </div>
            </section>

            <div className="mt-6 flex justify-end space-x-2">
                <button type="button" onClick={() => setFormState(initialState)} className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Reset</button>
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-primary-700">{agent ? 'Update Agent' : 'Save Agent'}</button>
            </div>
        </form>
    );
};
