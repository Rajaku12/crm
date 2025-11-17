

import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';

// Core components (loaded immediately - needed for initial render)
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LeadDetailPanel } from './components/LeadDetailPanel';
import { PropertyDetailPanel } from './components/PropertyDetailPanel';
import { FingerprintScanner } from './components/ui/Card';

// Lazy load route components (code splitting)
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const LeadsTable = lazy(() => import('./components/LeadsTable').then(m => ({ default: m.LeadsTable })));
const Calls = lazy(() => import('./components/Calls').then(m => ({ default: m.Calls })));
const Properties = lazy(() => import('./components/Properties').then(m => ({ default: m.Properties })));
const Settings = lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));
const TasksPlanner = lazy(() => import('./components/TasksPlanner').then(m => ({ default: m.TasksPlanner })));
const Supervision = lazy(() => import('./components/Supervision').then(m => ({ default: m.Supervision })));
const ClientsPage = lazy(() => import('./components/ClientsPage').then(m => ({ default: m.ClientsPage })));
const AgentsPage = lazy(() => import('./components/AgentsPage').then(m => ({ default: m.AgentsPage })));
const Attendance = lazy(() => import('./components/Attendance').then(m => ({ default: m.Attendance })));
const Reports = lazy(() => import('./components/Reports').then(m => ({ default: m.Reports })));
const ProfilePage = lazy(() => import('./components/ProfilePage').then(m => ({ default: m.ProfilePage })));
const PaymentsWrapper = lazy(() => import('./components/PaymentsWrapper').then(m => ({ default: m.PaymentsWrapper })));

// Lazy load modals (only loaded when needed)
const AddLeadModal = lazy(() => import('./components/AddLeadModal').then(m => ({ default: m.AddLeadModal })));
const EditLeadModal = lazy(() => import('./components/modals/EditLeadModal').then(m => ({ default: m.EditLeadModal })));
const LogCallModal = lazy(() => import('./components/modals/LogCallModal').then(m => ({ default: m.LogCallModal })));
const SendWhatsAppModal = lazy(() => import('./components/modals/SendWhatsAppModal').then(m => ({ default: m.SendWhatsAppModal })));
const LogEmailModal = lazy(() => import('./components/modals/LogEmailModal').then(m => ({ default: m.LogEmailModal })));
const AddVoiceNoteModal = lazy(() => import('./components/modals/AddVoiceNoteModal').then(m => ({ default: m.AddVoiceNoteModal })));
const AddPropertyModal = lazy(() => import('./components/modals/AddPropertyModal').then(m => ({ default: m.AddPropertyModal })));
const EditPropertyModal = lazy(() => import('./components/modals/EditPropertyModal').then(m => ({ default: m.EditPropertyModal })));

// Data and types
import { Lead, Agent, Property, ActivityType, Activity, Client } from './types';

// Services
// FIX: Changed import to use namespace import for freeFeaturesService as it exports multiple functions.
import * as freeFeaturesService from './services/freeFeaturesService';
import * as apiService from './services/apiService';

// Context
import { useAppContext } from './contexts/AppContext';
import { useToast } from './contexts/ToastContext';
import { useAuth } from './contexts/AuthContext';

export type View = 'dashboard' | 'leads' | 'clients' | 'agents' | 'calls' | 'tasks' | 'reports' | 'properties' | 'settings' | 'supervision' | 'attendance' | 'profile' | 'payments' | 'booking-payments' | 'receipts' | 'ledger' | 'refunds' | 'bank-reconciliation';

const App: React.FC = () => {
    const { 
        leads, agents, properties, notifications, setNotifications, runLeadScoring, 
        addActivityToLead, updateLead, deleteLead, updateProperty, deleteProperty,
        updateAgent, addAgent, deleteAgent, addClient, updateClient, deleteClient, addProperty,
        teams, whatsappTemplates, automationRules, leadScores, createTeam, renameTeam, deleteTeam,
        addWhatsappTemplate, updateWhatsappTemplate, deleteWhatsappTemplate, updateAutomationRule,
        isLoading
    } = useAppContext();
    
    const { showToast } = useToast();
    const { user: currentUser, isAuthenticated, isLoading: authLoading, logout } = useAuth();
    
    // UI State
    const [view, setView] = useState<View>('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Selection State
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

    // Modal State
    const [modalState, setModalState] = useState({
        addLead: false,
        editLead: null as Lead | null,
        logCall: false,
        sendWhatsApp: false,
        logEmail: false,
        addNote: false,
        addVoiceNote: false,
        addProperty: false,
        editProperty: null as Property | null,
    });

    // Async Operation State
    const [isScanning, setIsScanning] = useState(false);
    const [reportSummary, setReportSummary] = useState('');
    const [activeCallLeadId, setActiveCallLeadId] = useState<string | number | null>(null);

    // --- LOGOUT ---
    const handleLogout = () => {
        logout();
    };

    const handleAddActivity = useCallback((activityData: Omit<Activity, 'id' | 'timestamp' | 'agent'>) => {
        if (!selectedLead || !currentUser) return;
        addActivityToLead(selectedLead.id, activityData, currentUser.name);
        setModalState(prev => ({ ...prev, logCall: false, sendWhatsApp: false, logEmail: false, addNote: false, addVoiceNote: false }));
    }, [selectedLead, currentUser, addActivityToLead]);

    // --- FREE FEATURE HANDLERS ---
    const handleSummarizeCall = useCallback((leadId: string | number, activityId: string | number) => {
        const lead = leads.find(l => l.id === leadId);
        const callActivity = lead?.activities.find(a => a.id === activityId);
        if (!lead || !callActivity) return;

        const summary = freeFeaturesService.summarizeCall(lead, callActivity);
        addActivityToLead(leadId, {
            type: ActivityType.AISummary,
            notes: summary,
            sourceActivityId: activityId,
        }, 'System');
        showToast("Summary generated!", "success");
    }, [leads, addActivityToLead, showToast]);

    const handleAnalyzeQuality = useCallback((leadId: string | number, activityId: string | number) => {
        const lead = leads.find(l => l.id === leadId);
        const callActivity = lead?.activities.find(a => a.id === activityId);
        if (!lead || !callActivity) return;
        
        const score = freeFeaturesService.analyzeCallQuality(callActivity);
        const updatedActivities = lead.activities.map(a => a.id === activityId ? { ...a, qualityScore: score } : a);
        updateLead({ ...lead, activities: updatedActivities });
        showToast("Call quality analyzed!", "success");
    }, [leads, updateLead, showToast]);
    
    // Auto-analyze call content when a new call is added
    useEffect(() => {
        const callToAnalyze = leads.flatMap(l => l.activities).find(a => a.type === ActivityType.Call && a.outcome && !a.sentiment);
        if (callToAnalyze) {
            const lead = leads.find(l => l.activities.some(a => a.id === callToAnalyze.id));
            if (!lead) return;
            
            const { sentiment } = freeFeaturesService.analyzeCallContent(callToAnalyze);
            const updatedActivities = lead.activities.map(a => a.id === callToAnalyze.id ? { ...a, sentiment } : a);
            updateLead({ ...lead, activities: updatedActivities });
        }
    }, [leads, updateLead]);

    // --- OTHER HANDLERS ---
    const handleCheckIn = (agentId: string | number, method: 'Manual' | 'Fingerprint') => {
        const check = () => {
            const agent = agents.find(a => a.id === agentId);
            if(agent) {
                const newRecord = { id: Date.now(), agentId, checkInTime: new Date().toISOString(), method, location: 'Office HQ' };
                const updatedAgent = { ...agent, attendance: [...(agent.attendance || []), newRecord] };
                updateAgent(updatedAgent);
            }
        }
        if (method === 'Fingerprint') {
            setIsScanning(true);
            setTimeout(() => { setIsScanning(false); check(); }, 2000);
        } else {
            check();
        }
    };
    
    const handleCheckOut = (agentId: string | number, method: 'Manual' | 'Fingerprint') => {
        const check = () => {
            const agent = agents.find(a => a.id === agentId);
            if(agent && agent.attendance) {
                const lastRecord = agent.attendance.filter(r => !r.checkOutTime).sort((a,b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())[0];
                if (lastRecord) {
                    const checkOutTime = new Date();
                    const duration = Math.round((checkOutTime.getTime() - new Date(lastRecord.checkInTime).getTime()) / 60000);
                    const updatedRecord = { ...lastRecord, checkOutTime: checkOutTime.toISOString(), duration };
                    const updatedAgent = { ...agent, attendance: agent.attendance.map(r => r.id === lastRecord.id ? updatedRecord : r) };
                    updateAgent(updatedAgent);
                }
            }
        }
        if (method === 'Fingerprint') {
            setIsScanning(true);
            setTimeout(() => { setIsScanning(false); check(); }, 2000);
        } else {
            check();
        }
    };
    
    const handleInitiateCall = async (leadId: string | number) => {
        try {
            const lead = leads.find(l => l.id === leadId);
            if (!lead) {
                showToast('Lead not found', 'error');
                return;
            }
            
            // Validate phone number
            if (!lead.phone || lead.phone.trim().length < 10) {
                showToast('Lead phone number is invalid. Please update the lead\'s phone number.', 'error');
                return;
            }
            
            // Show loading state
            showToast('Initiating call...', 'success');
            
            // Initiate call via API
            const callLog = await apiService.initiateCall(leadId, lead.phone);
            
            // Set active call lead ID for tracking
        setActiveCallLeadId(leadId);
            
            // Show success message with call details
            const callStatus = callLog?.status || 'initiated';
            showToast(`Call ${callStatus} successfully to ${lead.phone}`, 'success');
            
        } catch (error: any) {
            console.error('Call initiation error:', error);
            
            // Extract error message
            let errorMessage = 'Failed to initiate call';
            
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            } else if (error?.message) {
                errorMessage = error.message;
            }
            
            // Provide user-friendly error messages
            if (errorMessage.includes('No telephony provider')) {
                errorMessage = 'No telephony provider configured. Please set up Twilio or another provider in Settings → Integrations.';
            } else if (errorMessage.includes('authentication') || errorMessage.includes('credentials')) {
                errorMessage = 'Telephony provider authentication failed. Please check your API credentials.';
            } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
                errorMessage = 'Lead not found. Please refresh the page and try again.';
            }
            
            showToast(errorMessage, 'error');
        }
    };

    useEffect(() => {
        const handleVisibilityChange = () => {
            setTimeout(() => {
                if (document.visibilityState === 'visible' && activeCallLeadId) {
                    const leadToLog = leads.find(l => l.id === activeCallLeadId);
                    if (leadToLog) {
                        setSelectedLead(leadToLog);
                        setModalState(p => ({ ...p, logCall: true }));
                    }
                    setActiveCallLeadId(null);
                }
            }, 300);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [activeCallLeadId, leads]);

    const handleUpdateCurrentAgent = (updatedAgent: Agent) => {
        updateAgent(updatedAgent);
        // Note: currentUser is managed by AuthContext, it will update automatically
    }

    // Loading fallback component
    const LoadingFallback = () => (
        <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            <span className="ml-4 text-gray-600">Loading...</span>
        </div>
    );

    const renderView = () => {
        switch (view) {
            case 'dashboard': 
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <Dashboard onSelectLead={setSelectedLead} currentUser={currentUser!} />
                    </Suspense>
                );
            case 'leads': 
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <LeadsTable 
                            onSelectLead={setSelectedLead} 
                            onAddLeadClick={() => setModalState(p => ({ ...p, addLead: true }))} 
                            currentUser={currentUser!} 
                            onOpenWhatsAppForLead={(lead) => { setSelectedLead(lead); setModalState(p => ({ ...p, sendWhatsApp: true })) }} 
                            onEditLead={(lead) => setModalState(p => ({ ...p, editLead: lead }))} 
                            onDeleteLead={deleteLead} 
                            onInitiateCall={handleInitiateCall}
                        />
                    </Suspense>
                );
            case 'payments': 
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <PaymentsWrapper />
                    </Suspense>
                );
            case 'calls': 
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <Calls onSelectLead={setSelectedLead} currentUser={currentUser!} onGenerateSummary={handleSummarizeCall} onAnalyzeQuality={handleAnalyzeQuality} />
                    </Suspense>
                );
            case 'properties': 
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <Properties properties={properties} onSelectProperty={setSelectedProperty} onAddPropertyClick={() => setModalState(p => ({ ...p, addProperty: true }))} />
                    </Suspense>
                );
            case 'tasks': 
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <TasksPlanner leads={leads} agents={agents} currentUser={currentUser!} onSelectLead={setSelectedLead} onUpdateLead={updateLead} showToast={showToast} />
                    </Suspense>
                );
            case 'settings': 
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <Settings 
                            agents={agents}
                            teams={teams}
                            onUpdateAgent={updateAgent}
                            onCreateTeam={createTeam}
                            onRenameTeam={renameTeam}
                            onDeleteTeam={deleteTeam}
                            setView={setView} 
                            whatsappTemplates={whatsappTemplates}
                            onAddTemplate={addWhatsappTemplate}
                            onUpdateTemplate={updateWhatsappTemplate}
                            onDeleteTemplate={deleteWhatsappTemplate}
                            automationRules={automationRules}
                            onUpdateAutomationRule={updateAutomationRule}
                        />
                    </Suspense>
                );
            case 'supervision': 
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <Supervision />
                    </Suspense>
                );
            case 'attendance': 
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <Attendance currentUser={currentUser!} onCheckIn={handleCheckIn} onCheckOut={handleCheckOut} isScanning={isScanning} />
                    </Suspense>
                );
            case 'clients': 
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <ClientsPage onSaveClient={(client) => { 'id' in client ? updateClient(client as Client) : addClient(client) }} onDeleteClient={deleteClient} currentUser={currentUser!} />
                    </Suspense>
                );
            case 'agents': 
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <AgentsPage onSaveAgent={(agent) => { 'id' in agent ? updateAgent(agent as Agent) : addAgent(agent) }} onDeleteAgent={deleteAgent} />
                    </Suspense>
                );
            case 'reports': 
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <Reports currentUser={currentUser!} onGenerateSummary={(title, data) => { setReportSummary(freeFeaturesService.summarizeReportData(title, data)); }} aiSummary={reportSummary} />
                    </Suspense>
                );
            case 'profile': 
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <ProfilePage currentUser={currentUser!} onUpdateProfile={handleUpdateCurrentAgent} />
                    </Suspense>
                );
            default: return <div>Not Implemented</div>;
        }
    };
    
    // Show login screen if not authenticated
    if (!isAuthenticated || authLoading) {
        if (authLoading) {
            return <div className="flex items-center justify-center h-screen bg-gray-100 text-gray-700 font-semibold">Loading...</div>;
        }
        return <LoginScreen />;
    }

    // Show loading if data is still loading
    if (isLoading || !currentUser) {
        return <div className="flex items-center justify-center h-screen bg-gray-100 text-gray-700 font-semibold">Loading...</div>;
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <FingerprintScanner isOpen={isScanning} />
            <Sidebar view={view} setView={setView} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} currentUser={currentUser} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    currentUser={currentUser} 
                    onMenuClick={() => setSidebarOpen(true)}
                    onSelectLeadById={(id) => { const lead = leads.find(l => l.id === id); if (lead) setSelectedLead(lead); }}
                    onLogout={handleLogout}
                    onProfileClick={() => setView('profile')}
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    {renderView()}
                </main>
            </div>
            {selectedLead && (
                <LeadDetailPanel 
                    lead={selectedLead} 
                    onClose={() => setSelectedLead(null)}
                    currentUser={currentUser}
                    agents={agents}
                    properties={properties}
                    onUpdateLead={updateLead}
                    leadScores={leadScores}
                    onAddActivity={handleAddActivity}
                    onAddVoiceNoteClick={() => setModalState(p => ({ ...p, addVoiceNote: true }))}
                    onRescoreLead={runLeadScoring}
                    onOpenLogCall={() => setModalState(p => ({ ...p, logCall: true }))}
                    onOpenWhatsApp={() => setModalState(p => ({ ...p, sendWhatsApp: true }))}
                    onOpenLogEmail={() => setModalState(p => ({ ...p, logEmail: true }))}
                    onOpenAddNote={() => setModalState(p => ({ ...p, addNote: true }))}
                    onSummarizeCall={handleSummarizeCall}
                    onInitiateCall={handleInitiateCall}
                />
            )}
            {selectedProperty && (
                <PropertyDetailPanel
                    property={selectedProperty}
                    leads={leads}
                    onClose={() => setSelectedProperty(null)}
                    onUpdateProperty={updateProperty}
                    onDeleteProperty={(id) => { deleteProperty(id); setSelectedProperty(null); }}
                    onSelectLead={setSelectedLead}
                    onEditClick={() => setModalState(p => ({...p, editProperty: selectedProperty}))}
                />
            )}

            {/* Modals - Lazy loaded only when needed */}
            {modalState.addLead && (
                <Suspense fallback={null}>
                    <AddLeadModal isOpen={modalState.addLead} onClose={() => setModalState(p => ({ ...p, addLead: false }))} />
                </Suspense>
            )}
            {modalState.editLead && (
                <Suspense fallback={null}>
                    <EditLeadModal isOpen={!!modalState.editLead} onClose={() => setModalState(p => ({ ...p, editLead: null }))} onUpdateLead={(l) => {updateLead(l); setModalState(p => ({...p, editLead: null}))}} lead={modalState.editLead} />
                </Suspense>
            )}
            {modalState.logCall && (
                <Suspense fallback={null}>
                    <LogCallModal 
                        isOpen={modalState.logCall} 
                        onClose={() => setModalState(p => ({...p, logCall: false}))} 
                        onSave={(data) => handleAddActivity({type: ActivityType.Call, ...data})}
                        leadPhone={selectedLead?.phone || ''}
                        leadName={selectedLead?.name || ''}
                    />
                </Suspense>
            )}
            {modalState.sendWhatsApp && (
                <Suspense fallback={null}>
                    <SendWhatsAppModal isOpen={modalState.sendWhatsApp} onClose={() => setModalState(p => ({ ...p, sendWhatsApp: false }))} onSave={data => handleAddActivity({type: ActivityType.WhatsApp, notes: data.message})} lead={selectedLead} currentUser={currentUser} />
                </Suspense>
            )}
            {modalState.logEmail && (
                <Suspense fallback={null}>
                    <LogEmailModal isOpen={modalState.logEmail} onClose={() => setModalState(p => ({ ...p, logEmail: false }))} onSave={data => handleAddActivity({type: ActivityType.Email, subject: data.subject, notes: data.body})} title="Log Email" bodyPlaceholder='Enter email body...' lead={selectedLead} />
                </Suspense>
            )}
            {modalState.addNote && (
                <Suspense fallback={null}>
                    <LogEmailModal isOpen={modalState.addNote} onClose={() => setModalState(p => ({ ...p, addNote: false }))} onSave={data => handleAddActivity({type: ActivityType.Note, notes: data.body})} title="Add Note" bodyPlaceholder='Enter your note...' hideSubject lead={selectedLead} />
                </Suspense>
            )}
            {modalState.addVoiceNote && (
                <Suspense fallback={null}>
                    <AddVoiceNoteModal isOpen={modalState.addVoiceNote} onClose={() => setModalState(p => ({ ...p, addVoiceNote: false }))} onSave={data => handleAddActivity({type: ActivityType.VoiceNote, ...data})} />
                </Suspense>
            )}
            {modalState.addProperty && (
                <Suspense fallback={null}>
                    <AddPropertyModal isOpen={modalState.addProperty} onClose={() => setModalState(p => ({ ...p, addProperty: false }))} onAddProperty={(prop) => { addProperty(prop); setModalState(p => ({...p, addProperty: false})) }} />
                </Suspense>
            )}
            {modalState.editProperty && (
                <Suspense fallback={null}>
                    <EditPropertyModal isOpen={!!modalState.editProperty} onClose={() => setModalState(p => ({ ...p, editProperty: null }))} property={modalState.editProperty} onUpdateProperty={(prop) => { updateProperty(prop); setModalState(p => ({ ...p, editProperty: null })); setSelectedProperty(prop); }} />
                </Suspense>
            )}
        </div>
    );
};

export default App;