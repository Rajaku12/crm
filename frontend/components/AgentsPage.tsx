import React, { useState } from 'react';
import { Agent } from '../types';
import { Card } from './ui/Card';
import { AgentForm } from './agents/AgentForm';
import { AgentTable } from './agents/AgentTable';

interface AgentsPageProps {
    onSaveAgent: (agentData: Agent | Omit<Agent, 'id'>) => void;
    onDeleteAgent: (agentId: number | string) => void;
}

/**
 * Main page component for managing agents.
 * It orchestrates the AgentForm and AgentTable components and handles unsaved changes.
 */
export const AgentsPage: React.FC<AgentsPageProps> = ({ onSaveAgent, onDeleteAgent }) => {
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [isFormDirty, setIsFormDirty] = useState(false);

    const promptUnsavedChanges = (): boolean => {
        if (isFormDirty) {
            return window.confirm('You have unsaved changes. Are you sure you want to discard them?');
        }
        return true;
    };

    const handleEditAgent = (agent: Agent) => {
        if (promptUnsavedChanges()) {
            setEditingAgent(agent);
            setIsFormVisible(true);
            setIsFormDirty(false); // Reset dirty state for the new form
        }
    };

    const handleAddNewClick = () => {
        if (promptUnsavedChanges()) {
            setEditingAgent(null);
            setIsFormVisible(true);
            setIsFormDirty(false);
        }
    };

    const handleCloseForm = () => {
        if (promptUnsavedChanges()) {
            setIsFormVisible(false);
            setEditingAgent(null);
            setIsFormDirty(false);
        }
    };
    
    const handleSave = (agentData: Agent | Omit<Agent, 'id'>) => {
        onSaveAgent(agentData);
        setIsFormVisible(false);
        setEditingAgent(null);
        setIsFormDirty(false);
    };

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">Agent Management</h1>
                    {!isFormVisible && (
                        <button
                            onClick={handleAddNewClick}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            Add New Agent
                        </button>
                    )}
                </div>

                {isFormVisible && (
                    <AgentForm
                        agent={editingAgent}
                        onSave={handleSave}
                        onCancel={handleCloseForm}
                        onDirtyChange={setIsFormDirty}
                    />
                )}
            </Card>

            <AgentTable
                onEdit={handleEditAgent}
                onDelete={onDeleteAgent}
            />
        </div>
    );
};
