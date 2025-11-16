import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Lead, Agent, Property, Client, WhatsAppTemplate, AutomationRule, Activity, ApiError, Notification } from '../types';
import { MOCK_AGENTS, MOCK_PROPERTIES, MOCK_CLIENTS, MOCK_TEAMS, MOCK_WHATSAPP_TEMPLATES, INITIAL_AUTOMATION_RULES, MOCK_LEADS, MOCK_NOTIFICATIONS } from '../constants';
import { getTagFromScore } from '../utils';
import { freeFeaturesService } from '../services/freeFeaturesService';
import { useToast } from './ToastContext';

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
    
    addLead: (leadData: Omit<Lead, 'id' | 'activities' | 'lastContacted' | 'createdAt' | 'tasks'>) => void;
    updateLead: (updatedLead: Lead) => void;
    deleteLead: (leadId: string | number) => void;
    addActivityToLead: (leadId: string | number, activityData: Omit<Activity, 'id' | 'timestamp' | 'agent'>, agentName: string) => void;
    runLeadScoring: (leadId: string | number) => void;
    
    addProperty: (propData: Omit<Property, 'id' | 'stats'>) => void;
    updateProperty: (updatedProp: Property) => void;
    deleteProperty: (propId: string | number) => void;

    addClient: (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateClient: (updatedClient: Client) => void;
    deleteClient: (clientId: string | number) => void;

    addAgent: (agentData: Omit<Agent, 'id'>) => void;
    updateAgent: (updatedAgent: Agent) => void;
    deleteAgent: (agentId: string | number) => void;

    createTeam: (teamName: string) => void;
    renameTeam: (oldName: string, newName: string) => void;
    deleteTeam: (teamName: string) => void;
    
    updateWhatsappTemplate: (template: WhatsAppTemplate) => void;
    addWhatsappTemplate: (template: Omit<WhatsAppTemplate, 'id'>) => void;
    deleteWhatsappTemplate: (id: string | number) => void;
    
    updateAutomationRule: (ruleId: string, updates: Partial<AutomationRule>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { showToast } = useToast();

    // Core Data State - now initialized with empty arrays
    const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
    const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);
    const [properties, setProperties] = useState<Property[]>(MOCK_PROPERTIES);
    const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
    const [automationRules, setAutomationRules] = useState<AutomationRule[]>(INITIAL_AUTOMATION_RULES);
    const [whatsappTemplates, setWhatsappTemplates] = useState<WhatsAppTemplate[]>(MOCK_WHATSAPP_TEMPLATES);
    const [teams, setTeams] = useState<string[]>(MOCK_TEAMS);
    const [leadScores, setLeadScores] = useState<Map<string | number, number | null>>(new Map());

    // --- LEAD HANDLERS ---
    const updateLead = useCallback((updatedLead: Lead) => {
        setLeads(prevLeads => prevLeads.map(l =>
            l.id === updatedLead.id ? { ...l, ...updatedLead } : l
        ));
    }, []);
    
    const addLead = (leadData: Omit<Lead, 'id' | 'activities' | 'lastContacted' | 'createdAt' | 'tasks'>) => {
        const newLead: Lead = {
            ...leadData,
            id: Date.now(),
            createdAt: new Date().toISOString(),
            lastContacted: new Date().toISOString(),
            activities: [],
            tasks: [],
        };
        setLeads(prev => [newLead, ...prev]);
        showToast('Lead added successfully!');
    };
    
    const deleteLead = (leadId: number | string) => {
        if (window.confirm('Are you sure you want to delete this lead?')) {
            setLeads(prev => prev.filter(l => l.id !== leadId));
            showToast('Lead deleted.');
        }
    };
    
    const addActivityToLead = useCallback((leadId: string | number, activityData: Omit<Activity, 'id' | 'timestamp' | 'agent'>, agentName: string) => {
        setLeads(prevLeads => prevLeads.map(lead => {
            if (lead.id === leadId) {
                const newActivity: Activity = {
                    ...activityData,
                    id: Date.now(), 
                    timestamp: new Date().toISOString(),
                    agent: agentName,
                };
                return {
                    ...lead,
                    activities: [newActivity, ...lead.activities],
                    lastContacted: new Date().toISOString(),
                };
            }
            return lead;
        }));
        showToast(`Logged ${activityData.type} successfully.`);
    }, [showToast]);
    
    const runLeadScoring = useCallback((leadId: string | number) => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return;

        setLeadScores(prev => new Map(prev).set(leadId, null)); // Set to loading
        
        // Simulate a short delay for UX, then run the free scoring function
        setTimeout(() => {
            try {
                const score = freeFeaturesService.scoreLead(lead);
                setLeadScores(prev => new Map(prev).set(leadId, score));
                updateLead({ ...lead, tag: getTagFromScore(score) });
            } catch (e) {
                setLeadScores(prev => new Map(prev).set(leadId, -1)); // Set to error
            }
        }, 500);
    }, [leads, updateLead]);

    // --- AGENT & TEAM HANDLERS ---
    const updateAgent = (updatedAgent: Agent) => {
        setAgents(prev => prev.map(a => a.id === updatedAgent.id ? { ...a, ...updatedAgent } : a));
    };

    const addAgent = (agentData: Omit<Agent, 'id'>) => {
        const newAgent: Agent = { id: Date.now(), isActive: true, ...agentData } as Agent;
        setAgents(p => [...p, newAgent]);
        showToast('Agent saved!');
    };

    const deleteAgent = (agentId: number | string) => {
        setAgents(p => p.filter(a => a.id !== agentId));
        showToast('Agent deleted.');
    }

    const createTeam = (teamName: string) => {
        if (teams.find(t => t.toLowerCase() === teamName.toLowerCase())) {
            showToast(`Team "${teamName}" already exists.`, 'error');
            return;
        }
        setTeams(prev => [...prev, teamName]);
        showToast(`Team "${teamName}" created!`, 'success');
    };

    const renameTeam = (oldName: string, newName: string) => {
        if (teams.find(t => t.toLowerCase() === newName.toLowerCase() && t.toLowerCase() !== oldName.toLowerCase())) {
            showToast(`Team name "${newName}" is already in use.`, 'error');
            return;
        }
        setTeams(prev => prev.map(t => t === oldName ? newName : t));
        setAgents(prev => prev.map(a => a.team === oldName ? { ...a, team: newName } : a));
        showToast(`Team "${oldName}" was renamed to "${newName}".`, 'success');
    };

    const deleteTeam = (teamName: string) => {
        if (window.confirm(`Are you sure you want to delete the team "${teamName}"? Members will be moved to "Unassigned".`)) {
            setTeams(prev => prev.filter(t => t !== teamName));
            setAgents(prev => prev.map(a => a.team === teamName ? { ...a, team: 'Unassigned' } : a));
            showToast(`Team "${teamName}" deleted.`, 'success');
        }
    };
    
    // --- PROPERTY HANDLERS ---
    const addProperty = (propData: Omit<Property, 'id' | 'stats'>) => {
        const newProp = {id: Date.now(), stats: {views:0, inquiries:0, conversions:0}, ...propData};
        setProperties(p => [...p, newProp]);
        showToast('Property added successfully!');
    };

    const updateProperty = (updatedProp: Property) => {
        setProperties(p => p.map(pr => pr.id === updatedProp.id ? updatedProp : pr));
        showToast('Property updated successfully!');
    };

    const deleteProperty = (propId: string | number) => {
        setProperties(p => p.filter(pr => pr.id !== propId));
        showToast('Property deleted.');
    };
    
    // --- CLIENT HANDLERS ---
    const addClient = (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newClient = {id: Date.now(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...clientData};
        setClients(p => [...p, newClient]);
        showToast('Client saved!');
    };
    
    const updateClient = (updatedClient: Client) => {
        setClients(p => p.map(c => c.id === updatedClient.id ? updatedClient : c));
        showToast('Client updated!');
    };

    const deleteClient = (clientId: string | number) => {
        setClients(p => p.filter(c => c.id !== clientId));
        showToast('Client deleted.');
    };

    // --- TEMPLATE & RULE HANDLERS ---
    const updateWhatsappTemplate = (template: WhatsAppTemplate) => setWhatsappTemplates(p => p.map(wt => wt.id === template.id ? template : wt));
    const addWhatsappTemplate = (template: Omit<WhatsAppTemplate, 'id'>) => setWhatsappTemplates(p => [...p, {id: Date.now(), ...template}]);
    const deleteWhatsappTemplate = (id: string | number) => setWhatsappTemplates(p => p.filter(wt => wt.id !== id));
    const updateAutomationRule = (ruleId: string, updates: Partial<AutomationRule>) => setAutomationRules(p => p.map(r => r.id === ruleId ? {...r, ...updates} : r));

    const value = {
        leads, agents, properties, clients, teams, whatsappTemplates, automationRules, notifications, leadScores, setNotifications,
        addLead, updateLead, deleteLead, addActivityToLead, runLeadScoring,
        addProperty, updateProperty, deleteProperty,
        addClient, updateClient, deleteClient,
        addAgent, updateAgent, deleteAgent,
        createTeam, renameTeam, deleteTeam,
        updateWhatsappTemplate, addWhatsappTemplate, deleteWhatsappTemplate,
        updateAutomationRule,
    };

    return (
        <AppContext.Provider value={value as AppContextType}>
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