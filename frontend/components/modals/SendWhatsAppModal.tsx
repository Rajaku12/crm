import React, { useState, useEffect } from 'react';
import { CloseIcon, SparklesIcon } from '../icons/IconComponents';
import { Agent, Lead } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';

interface SendWhatsAppModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { message: string }) => void;
    lead: Lead | null;
    currentUser: Agent;
}

export const SendWhatsAppModal: React.FC<SendWhatsAppModalProps> = ({ isOpen, onClose, onSave, lead, currentUser }) => {
    const { whatsappTemplates } = useAppContext();
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [message, setMessage] = useState('');
    const [suggestionIndex, setSuggestionIndex] = useState(0);

    useEffect(() => {
        if(isOpen) {
            setSelectedTemplate('');
            setMessage('');
            setSuggestionIndex(0);
        }
    }, [isOpen]);

    const personalizeTemplate = (content: string) => {
        if (!lead) return content;
        return content
            .replace(/{{lead_name}}/g, lead.name)
            .replace(/{{agent_name}}/g, currentUser.name);
    };

    useEffect(() => {
        if (selectedTemplate && lead) {
            const template = whatsappTemplates.find(t => t.name === selectedTemplate);
            if (template) {
                setMessage(personalizeTemplate(template.content));
            }
        }
    }, [selectedTemplate, lead, currentUser, whatsappTemplates]);

    if (!isOpen) return null;

    const handleQuickSuggestion = () => {
        if (whatsappTemplates.length === 0) return;
        const nextIndex = (suggestionIndex + 1) % whatsappTemplates.length;
        const suggestedTemplate = whatsappTemplates[nextIndex];
        setMessage(personalizeTemplate(suggestedTemplate.content));
        setSuggestionIndex(nextIndex);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message) return;
        onSave({ message });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Send WhatsApp to {lead?.name}</h2>
                        <button type="button" onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                            <CloseIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Use a Template</label>
                            <select 
                                value={selectedTemplate}
                                onChange={(e) => setSelectedTemplate(e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">Select a template...</option>
                                {whatsappTemplates.map(template => (
                                    <option key={template.id} value={template.name}>{template.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-medium text-gray-700">Message *</label>
                                <button
                                    type="button"
                                    onClick={handleQuickSuggestion}
                                    className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800"
                                >
                                    <SparklesIcon className="w-4 h-4 mr-1" />
                                    Use Quick Suggestion
                                </button>
                            </div>
                            <textarea 
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={6} 
                                placeholder="Type your message here..." 
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-primary-700">
                            Send & Log
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};