import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { Lead, Agent, Property, Client, WhatsAppTemplate, AutomationRule, Activity, ApiError, Notification } from '../types';
import { getTagFromScore } from '../utils';
import { geminiService } from '../services/geminiService';
import { useToast } from './ToastContext';
import { GeminiApiCaller } from '../types';
import { useAuth } from './AuthContext';
import * as apiService from '../services/apiService';

interface AppContextType {
    leads: Lead[];
    agents: Agent[];
    properties: Property[];
    clients: Client[];
    teams: string[];
    whatsappTemplates: WhatsAppTemplate[];
    automationRules: AutomationRule[];
    notifications: Notification[];
    leadScores: Map<string | number, number | null>;
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    isLoading: boolean;
    refreshData: () => Promise<void>;
    
    addLead: (leadData: Omit<Lead, 'id' | 'activities' | 'lastContacted' | 'createdAt' | 'tasks'>) => Promise<void>;
    updateLead: (updatedLead: Lead) => Promise<void>;
    deleteLead: (leadId: string | number) => Promise<void>;
    addActivityToLead: (leadId: string | number, activityData: Omit<Activity, 'id' | 'timestamp' | 'agent'>, agentName: string) => Promise<void>;
    runLeadScoring: (leadId: string | number) => Promise<void>;
    
    addProperty: (propData: Omit<Property, 'id' | 'stats'>) => Promise<void>;
    updateProperty: (updatedProp: Property) => Promise<void>;
    deleteProperty: (propId: string | number) => Promise<void>;

    addClient: (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateClient: (updatedClient: Client) => Promise<void>;
    deleteClient: (clientId: string | number) => Promise<void>;

    addAgent: (agentData: Omit<Agent, 'id'>) => Promise<void>;
    updateAgent: (updatedAgent: Agent) => Promise<void>;
    deleteAgent: (agentId: string | number) => Promise<void>;

    createTeam: (teamName: string) => Promise<void>;
    renameTeam: (oldName: string, newName: string) => Promise<void>;
    deleteTeam: (teamName: string) => Promise<void>;
    
    updateWhatsappTemplate: (template: WhatsAppTemplate) => Promise<void>;
    addWhatsappTemplate: (template: Omit<WhatsAppTemplate, 'id'>) => Promise<void>;
    deleteWhatsappTemplate: (id: string | number) => Promise<void>;
    
    updateAutomationRule: (ruleId: string, updates: Partial<AutomationRule>) => Promise<void>;
    
    callApi: GeminiApiCaller;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { showToast } = useToast();
    const { isAuthenticated } = useAuth();

    // Core Data State
    const [leads, setLeads] = useState<Lead[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
    const [whatsappTemplates, setWhatsappTemplates] = useState<WhatsAppTemplate[]>([]);
    const [teams, setTeams] = useState<string[]>([]);
    const [leadScores, setLeadScores] = useState<Map<string | number, number | null>>(new Map());
    const [isLoading, setIsLoading] = useState(true);

    const callApi: GeminiApiCaller = useCallback(async (apiCall) => {
        try {
            return await apiCall();
        } catch (error) {
            const apiError = error as ApiError;
            console.error('API Call Failed:', apiError.message);
            showToast(`Error: ${apiError.message}`, 'error');
            throw apiError;
        }
    }, [showToast]);

    // Load initial data
    const loadData = useCallback(async () => {
        if (!isAuthenticated) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const [leadsData, agentsData, propertiesData, clientsData, notificationsData, templatesData, rulesData, teamsData] = await Promise.all([
                apiService.getLeads().catch(() => []),
                apiService.getAgents().catch(() => []),
                apiService.getProperties().catch(() => []),
                apiService.getClients().catch(() => []),
                apiService.getNotifications().catch(() => []),
                apiService.getWhatsAppTemplates().catch(() => []),
                apiService.getAutomationRules().catch(() => []),
                apiService.getTeams().catch(() => []),
            ]);

            setLeads(leadsData);
            setAgents(agentsData);
            setProperties(propertiesData);
            setClients(clientsData);
            setNotifications(notificationsData);
            setWhatsappTemplates(templatesData);
            setAutomationRules(rulesData);
            setTeams(teamsData);
        } catch (error) {
            console.error('Failed to load data:', error);
            showToast('Failed to load data. Please refresh the page.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, showToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // --- LEAD HANDLERS ---
    const updateLead = useCallback(async (updatedLead: Lead) => {
        try {
            const lead = await apiService.updateLead(updatedLead.id, updatedLead);
            setLeads(prevLeads => prevLeads.map(l => l.id === updatedLead.id ? lead : l));
            showToast('Lead updated successfully!', 'success');
        } catch (error) {
            showToast('Failed to update lead.', 'error');
            throw error;
        }
    }, [showToast]);
    
    const addLead = useCallback(async (leadData: Omit<Lead, 'id' | 'activities' | 'lastContacted' | 'createdAt' | 'tasks'>) => {
        try {
            const newLead = await apiService.createLead(leadData);
            setLeads(prev => [newLead, ...prev]);
            showToast('Lead added successfully!', 'success');
        } catch (error) {
            showToast('Failed to add lead.', 'error');
            throw error;
        }
    }, [showToast]);
    
    const deleteLead = useCallback(async (leadId: number | string) => {
        if (window.confirm('Are you sure you want to delete this lead?')) {
            try {
                await apiService.deleteLead(leadId);
                setLeads(prev => prev.filter(l => l.id !== leadId));
                showToast('Lead deleted.', 'success');
            } catch (error) {
                showToast('Failed to delete lead.', 'error');
            }
        }
    }, [showToast]);
    
    const addActivityToLead = useCallback(async (leadId: string | number, activityData: Omit<Activity, 'id' | 'timestamp' | 'agent'>, agentName: string) => {
        try {
            const activity = await apiService.addActivityToLead(leadId, activityData, agentName);
            setLeads(prevLeads => prevLeads.map(lead => {
                if (lead.id === leadId) {
                    return {
                        ...lead,
                        activities: [activity, ...lead.activities],
                        lastContacted: activity.timestamp,
                    };
                }
                return lead;
            }));
            showToast(`Logged ${activityData.type} successfully.`, 'success');
        } catch (error) {
            showToast('Failed to log activity.', 'error');
            throw error;
        }
    }, [showToast]);
    
    const runLeadScoring = useCallback(async (leadId: string | number) => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return;

        setLeadScores(prev => new Map(prev).set(leadId, null)); // Set to loading
        try {
            const score = await geminiService.scoreLead(callApi, lead);
            setLeadScores(prev => new Map(prev).set(leadId, score));
            await updateLead({ ...lead, tag: getTagFromScore(score) });
        } catch (e) {
            setLeadScores(prev => new Map(prev).set(leadId, -1)); // Set to error
        }
    }, [leads, callApi, updateLead]);

    // --- AGENT & TEAM HANDLERS ---
    const updateAgent = useCallback(async (updatedAgent: Agent) => {
        try {
            const agent = await apiService.updateAgent(updatedAgent.id, updatedAgent);
            setAgents(prev => prev.map(a => a.id === updatedAgent.id ? agent : a));
            showToast('Agent updated successfully!', 'success');
        } catch (error) {
            showToast('Failed to update agent.', 'error');
            throw error;
        }
    }, [showToast]);

    const addAgent = useCallback(async (agentData: Omit<Agent, 'id'>) => {
        try {
            const newAgent = await apiService.createAgent(agentData);
            setAgents(p => [...p, newAgent]);
            showToast('Agent saved!', 'success');
        } catch (error) {
            showToast('Failed to save agent.', 'error');
            throw error;
        }
    }, [showToast]);

    const deleteAgent = useCallback(async (agentId: number | string) => {
        try {
            await apiService.deleteAgent(agentId);
            setAgents(p => p.filter(a => a.id !== agentId));
            showToast('Agent deleted.', 'success');
        } catch (error) {
            showToast('Failed to delete agent.', 'error');
        }
    }, [showToast]);

    const createTeam = useCallback(async (teamName: string) => {
        if (teams.find(t => t.toLowerCase() === teamName.toLowerCase())) {
            showToast(`Team "${teamName}" already exists.`, 'error');
            return;
        }
        // Note: Teams are managed through agents, so we just update local state
        // In a real implementation, you might want to create a team endpoint
        setTeams(prev => [...prev, teamName]);
        showToast(`Team "${teamName}" created!`, 'success');
    }, [teams, showToast]);

    const renameTeam = useCallback(async (oldName: string, newName: string) => {
        if (teams.find(t => t.toLowerCase() === newName.toLowerCase() && t.toLowerCase() !== oldName.toLowerCase())) {
            showToast(`Team name "${newName}" is already in use.`, 'error');
            return;
        }
        // Update agents with the new team name
        const agentsToUpdate = agents.filter(a => a.team === oldName);
        for (const agent of agentsToUpdate) {
            try {
                await apiService.updateAgent(agent.id, { ...agent, team: newName });
            } catch (error) {
                console.error(`Failed to update agent ${agent.id}:`, error);
            }
        }
        setTeams(prev => prev.map(t => t === oldName ? newName : t));
        await loadData(); // Refresh agents
        showToast(`Team "${oldName}" was renamed to "${newName}".`, 'success');
    }, [teams, agents, showToast, loadData]);

    const deleteTeam = useCallback(async (teamName: string) => {
        if (window.confirm(`Are you sure you want to delete the team "${teamName}"? Members will be moved to "Unassigned".`)) {
            // Update agents to remove team
            const agentsToUpdate = agents.filter(a => a.team === teamName);
            for (const agent of agentsToUpdate) {
                try {
                    await apiService.updateAgent(agent.id, { ...agent, team: undefined });
                } catch (error) {
                    console.error(`Failed to update agent ${agent.id}:`, error);
                }
            }
            setTeams(prev => prev.filter(t => t !== teamName));
            await loadData(); // Refresh agents
            showToast(`Team "${teamName}" deleted.`, 'success');
        }
    }, [agents, showToast, loadData]);
    
    // --- PROPERTY HANDLERS ---
    const addProperty = useCallback(async (propData: Omit<Property, 'id' | 'stats'>) => {
        try {
            const newProp = await apiService.createProperty(propData);
            setProperties(p => [newProp, ...p]);
            showToast('Property added successfully!', 'success');
        } catch (error) {
            showToast('Failed to add property.', 'error');
            throw error;
        }
    }, [showToast]);

    const updateProperty = useCallback(async (updatedProp: Property) => {
        try {
            const prop = await apiService.updateProperty(updatedProp.id, updatedProp);
            setProperties(p => p.map(pr => pr.id === updatedProp.id ? prop : pr));
            showToast('Property updated successfully!', 'success');
        } catch (error) {
            showToast('Failed to update property.', 'error');
            throw error;
        }
    }, [showToast]);

    const deleteProperty = useCallback(async (propId: string | number) => {
        try {
            await apiService.deleteProperty(propId);
            setProperties(p => p.filter(pr => pr.id !== propId));
            showToast('Property deleted.', 'success');
        } catch (error) {
            showToast('Failed to delete property.', 'error');
        }
    }, [showToast]);
    
    // --- CLIENT HANDLERS ---
    const addClient = useCallback(async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            const newClient = await apiService.createClient(clientData);
            setClients(p => [newClient, ...p]);
            showToast('Client saved!', 'success');
        } catch (error) {
            showToast('Failed to save client.', 'error');
            throw error;
        }
    }, [showToast]);
    
    const updateClient = useCallback(async (updatedClient: Client) => {
        try {
            const client = await apiService.updateClient(updatedClient.id, updatedClient);
            setClients(p => p.map(c => c.id === updatedClient.id ? client : c));
            showToast('Client updated!', 'success');
        } catch (error) {
            showToast('Failed to update client.', 'error');
            throw error;
        }
    }, [showToast]);

    const deleteClient = useCallback(async (clientId: string | number) => {
        try {
            await apiService.deleteClient(clientId);
            setClients(p => p.filter(c => c.id !== clientId));
            showToast('Client deleted.', 'success');
        } catch (error) {
            showToast('Failed to delete client.', 'error');
        }
    }, [showToast]);

    // --- TEMPLATE & RULE HANDLERS ---
    const updateWhatsappTemplate = useCallback(async (template: WhatsAppTemplate) => {
        try {
            const updated = await apiService.updateWhatsAppTemplate(template.id, template);
            setWhatsappTemplates(p => p.map(wt => wt.id === template.id ? updated : wt));
            showToast('Template updated!', 'success');
        } catch (error) {
            showToast('Failed to update template.', 'error');
        }
    }, [showToast]);

    const addWhatsappTemplate = useCallback(async (template: Omit<WhatsAppTemplate, 'id'>) => {
        try {
            const newTemplate = await apiService.createWhatsAppTemplate(template);
            setWhatsappTemplates(p => [...p, newTemplate]);
            showToast('Template added!', 'success');
        } catch (error) {
            showToast('Failed to add template.', 'error');
        }
    }, [showToast]);

    const deleteWhatsappTemplate = useCallback(async (id: string | number) => {
        try {
            await apiService.deleteWhatsAppTemplate(id);
            setWhatsappTemplates(p => p.filter(wt => wt.id !== id));
            showToast('Template deleted!', 'success');
        } catch (error) {
            showToast('Failed to delete template.', 'error');
        }
    }, [showToast]);

    const updateAutomationRule = useCallback(async (ruleId: string, updates: Partial<AutomationRule>) => {
        try {
            const updated = await apiService.updateAutomationRule(ruleId, updates);
            setAutomationRules(p => p.map(r => r.id === ruleId ? updated : r));
            showToast('Rule updated!', 'success');
        } catch (error) {
            showToast('Failed to update rule.', 'error');
        }
    }, [showToast]);

    const refreshData = useCallback(async () => {
        await loadData();
    }, [loadData]);

    const value = {
        leads, agents, properties, clients, teams, whatsappTemplates, automationRules, notifications, leadScores, setNotifications,
        isLoading, refreshData,
        addLead, updateLead, deleteLead, addActivityToLead, runLeadScoring,
        addProperty, updateProperty, deleteProperty,
        addClient, updateClient, deleteClient,
        addAgent, updateAgent, deleteAgent,
        createTeam, renameTeam, deleteTeam,
        updateWhatsappTemplate, addWhatsappTemplate, deleteWhatsappTemplate,
        updateAutomationRule,
        callApi,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
