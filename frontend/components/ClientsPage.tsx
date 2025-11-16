import React, { useState } from 'react';
import { Client, Agent } from '../types';
import { Card } from './ui/Card';
import { ClientForm } from './clients/ClientForm';
import { ClientsTable } from './clients/ClientsTable';

interface ClientsPageProps {
    onSaveClient: (clientData: Client | Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onDeleteClient: (clientId: string | number) => void;
    currentUser: Agent;
}

export const ClientsPage: React.FC<ClientsPageProps> = ({ onSaveClient, onDeleteClient, currentUser }) => {
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    const handleEditClient = (client: Client) => {
        setEditingClient(client);
        setIsFormVisible(true);
    };

    const handleAddNewClick = () => {
        setEditingClient(null);
        setIsFormVisible(true);
    };

    const handleCloseForm = () => {
        setIsFormVisible(false);
        setEditingClient(null);
    };

    const handleSave = (clientData: Client | Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
        onSaveClient(clientData);
        handleCloseForm();
    };
    
    const canAdd = currentUser.role !== 'Telecaller' && currentUser.role !== 'Customer Support';

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">Client Management</h1>
                    {!isFormVisible && canAdd && (
                        <button
                            onClick={handleAddNewClick}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            Add New Client
                        </button>
                    )}
                </div>

                {isFormVisible && (
                    <ClientForm
                        client={editingClient}
                        onSave={handleSave}
                        onCancel={handleCloseForm}
                    />
                )}
            </Card>

            <ClientsTable
                onEdit={handleEditClient}
                onDelete={onDeleteClient}
                currentUser={currentUser}
            />
        </div>
    );
};
