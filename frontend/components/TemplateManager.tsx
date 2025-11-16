
import React, { useState } from 'react';
import { Card } from './ui/Card';
import { WhatsAppTemplate } from '../types';
import { WhatsAppIcon } from './icons/IconComponents';
import { TemplateModal } from './modals/TemplateModal';

interface TemplateManagerProps {
    templates: WhatsAppTemplate[];
    onAdd: (template: Omit<WhatsAppTemplate, 'id'>) => void;
    onUpdate: (template: WhatsAppTemplate) => void;
    onDelete: (id: string | number) => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({ templates, onAdd, onUpdate, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);

    const handleOpenModal = (template: WhatsAppTemplate | null = null) => {
        setEditingTemplate(template);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTemplate(null);
    };

    const handleSave = (templateData: Omit<WhatsAppTemplate, 'id'>) => {
        if (editingTemplate) {
            onUpdate({ ...editingTemplate, ...templateData });
        } else {
            onAdd(templateData);
        }
        handleCloseModal();
    };

    return (
        <>
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-green-100 text-green-600 rounded-full mr-4">
                            <WhatsAppIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">WhatsApp Templates</h2>
                            <p className="text-sm text-gray-500">Create, edit, and manage your reusable message templates.</p>
                        </div>
                    </div>
                    <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-primary-600 text-white rounded-md shadow-sm hover:bg-primary-700">
                        Add Template
                    </button>
                </div>
                <div className="space-y-4">
                    {templates.map(template => (
                        <div key={template.id} className="p-4 border rounded-lg bg-gray-50/50 flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold text-gray-800">{template.name}</h4>
                                <p className="text-sm text-gray-600 mt-2 p-3 bg-white rounded-md border italic">"{template.content}"</p>
                            </div>
                            <div className="flex space-x-2 flex-shrink-0 ml-4">
                                <button onClick={() => handleOpenModal(template)} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100">Edit</button>
                                <button onClick={() => { if(window.confirm('Are you sure?')) onDelete(template.id) }} className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
            <TemplateModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                template={editingTemplate}
            />
        </>
    );
};
