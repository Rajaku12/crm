import React, { useState, useEffect } from 'react';
import { CloseIcon } from '../icons/IconComponents';
import { Lead } from '../../types';

interface LogEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { subject?: string; body: string; }) => void;
    title: string;
    bodyPlaceholder: string;
    hideSubject?: boolean;
    lead: Lead | null;
}

export const LogEmailModal: React.FC<LogEmailModalProps> = ({ isOpen, onClose, onSave, title, bodyPlaceholder, hideSubject = false, lead }) => {
    const initialState = {
        subject: '',
        body: '',
    };
    const [formState, setFormState] = useState(initialState);
    
    useEffect(() => {
        if(isOpen) {
            setFormState(initialState);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!formState.body) return;
        onSave(formState);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                        <button type="button" onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                            <CloseIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        {!hideSubject && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Subject</label>
                                <input 
                                    type="text"
                                    value={formState.subject}
                                    onChange={(e) => setFormState(prev => ({...prev, subject: e.target.value}))}
                                    placeholder="Enter email subject" 
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        )}
                        <div>
                            {hideSubject ? (
                                <label className="block text-sm font-medium text-gray-700">Note *</label>
                            ) : (
                                <label className="block text-sm font-medium text-gray-700">Body *</label>
                            )}
                            <textarea 
                                value={formState.body}
                                onChange={(e) => setFormState(prev => ({...prev, body: e.target.value}))}
                                rows={6} 
                                placeholder={bodyPlaceholder}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-primary-700">
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};