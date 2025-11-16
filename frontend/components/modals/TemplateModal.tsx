import React, { useState, useEffect } from 'react';
import { WhatsAppTemplate } from '../../types';
import { CloseIcon } from '../icons/IconComponents';

interface TemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (template: Omit<WhatsAppTemplate, 'id'>) => void;
    template?: WhatsAppTemplate | null;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose, onSave, template }) => {
    const [name, setName] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(template?.name || '');
            setContent(template?.content || '');
        }
    }, [isOpen, template]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !content) {
            alert('Please fill in both name and content.');
            return;
        }
        onSave({ name, content });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">{template ? 'Edit Template' : 'Add New Template'}</h2>
                        <button type="button" onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                            <CloseIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Template Name *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Welcome Message"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Message Content *</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={6}
                                placeholder="Type your message here..."
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                required
                            />
                            <p className="mt-2 text-xs text-gray-500">
                                Use placeholders like <code className="bg-gray-200 px-1 rounded-sm">{`{{lead_name}}`}</code>, <code className="bg-gray-200 px-1 rounded-sm">{`{{agent_name}}`}</code>, <code className="bg-gray-200 px-1 rounded-sm">{`{{property_name}}`}</code>.
                            </p>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-primary-700">Save Template</button>
                    </div>
                </form>
            </div>
        </div>
    );
};