

import React, { useState, useMemo } from 'react';
import { Lead, Agent, ActivityType, Activity, LeadStatus, Task, CallOutcome, Property, TaskType, ReminderType } from '../types';
import { Tag } from './ui/Tag';
import { PhoneIcon, WhatsAppIcon, EmailIcon, NoteIcon, StatusChangeIcon, SparklesIcon, ChecklistIcon, CalendarIcon, ClockIcon, UserGroupIcon, DocumentTextIcon, BellIcon, ChatBubbleLeftRightIcon, MapPinIcon, MicrophoneIcon, PlayIcon, RefreshIcon } from './icons/IconComponents';
import { calculateResponseTime } from '../utils';
import { LeadScoreBadge } from './ui/LeadScoreBadge';

interface LeadDetailPanelProps {
  lead: Lead | null;
  onClose: () => void;
  agents: Agent[];
  properties: Property[];
  onUpdateLead: (lead: Lead) => void;
  leadScores: Map<string | number, number | null>;
  currentUser: Agent;
  onAddVoiceNoteClick: () => void;
  onRescoreLead: (leadId: string | number) => void;
  onAddActivity: (activityData: Omit<Activity, 'id' | 'timestamp' | 'agent'>) => void;
  onOpenLogCall: () => void;
  onOpenWhatsApp: () => void;
  onOpenLogEmail: () => void;
  onOpenAddNote: () => void;
  onSummarizeCall: (leadId: string | number, activityId: string | number) => void;
  onInitiateCall: (leadId: string | number) => void;
}

type PanelTab = 'activity' | 'tasks';

const ActivityIcon: React.FC<{type: ActivityType}> = ({type}) => {
    const iconClass = "h-5 w-5 text-white";
    const wrapperClass = "rounded-full p-2 mr-4";
    const icons = {
        [ActivityType.Call]: <div className={`${wrapperClass} bg-green-500`}><PhoneIcon className={iconClass} /></div>,
        [ActivityType.WhatsApp]: <div className={`${wrapperClass} bg-teal-500`}><WhatsAppIcon className={iconClass} /></div>,
        [ActivityType.Email]: <div className={`${wrapperClass} bg-blue-500`}><EmailIcon className={iconClass} /></div>,
        [ActivityType.Note]: <div className={`${wrapperClass} bg-yellow-500`}><NoteIcon className={iconClass} /></div>,
        [ActivityType.StatusChange]: <div className={`${wrapperClass} bg-purple-500`}><StatusChangeIcon className={iconClass} /></div>,
        [ActivityType.AssignmentChange]: <div className={`${wrapperClass} bg-gray-500`}><StatusChangeIcon className={iconClass} /></div>,
        [ActivityType.AISummary]: <div className={`${wrapperClass} bg-indigo-500`}><SparklesIcon className={iconClass} /></div>,
        [ActivityType.Chatbot]: <div className={`${wrapperClass} bg-cyan-500`}><ChatBubbleLeftRightIcon className={iconClass} /></div>,
        [ActivityType.SiteVisitCheckIn]: <div className={`${wrapperClass} bg-pink-500`}><MapPinIcon className={iconClass} /></div>,
        [ActivityType.VoiceNote]: <div className={`${wrapperClass} bg-orange-500`}><MicrophoneIcon className={iconClass} /></div>,
    }
    return icons[type] || null;
}

const TaskTypeIcon: React.FC<{ type: TaskType, className?: string }> = ({ type, className = "h-4 w-4" }) => {
    const icons = {
        [TaskType.Call]: <PhoneIcon className={className} />,
        [TaskType.Meeting]: <UserGroupIcon className={className} />,
        [TaskType.Email]: <EmailIcon className={className} />,
        [TaskType.FollowUp]: <ChecklistIcon className={className} />,
        [TaskType.Paperwork]: <DocumentTextIcon className={className} />,
    };
    return icons[type] || <ChecklistIcon className={className} />;
};

const TasksPanel: React.FC<{ lead: Lead; onUpdateLead: (lead: Lead) => void; }> = ({ lead, onUpdateLead }) => {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDate, setNewTaskDate] = useState('');
    const [newTaskTime, setNewTaskTime] = useState('');
    const [newTaskType, setNewTaskType] = useState<TaskType>(TaskType.FollowUp);
    const [newTaskReminder, setNewTaskReminder] = useState<ReminderType>(ReminderType.None);


    const sortedTasks = React.useMemo(() => {
        if (!lead.tasks) return [];
        return [...lead.tasks].sort((a, b) => {
            if (a.isCompleted !== b.isCompleted) {
                return a.isCompleted ? 1 : -1;
            }
            const dateA = new Date(`${a.dueDate}T${a.dueTime || '00:00:00'}`);
            const dateB = new Date(`${b.dueDate}T${b.dueTime || '00:00:00'}`);
            return dateA.getTime() - dateB.getTime();
        });
    }, [lead.tasks]);

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle || !newTaskDate) return;

        const newTask: Task = {
            id: Date.now(),
            title: newTaskTitle,
            dueDate: newTaskDate,
            dueTime: newTaskTime || undefined,
            isCompleted: false,
            type: newTaskType,
            reminder: newTaskReminder,
        };

        const updatedLead = {
            ...lead,
            tasks: [...(lead.tasks || []), newTask],
        };
        onUpdateLead(updatedLead);
        setNewTaskTitle('');
        setNewTaskDate('');
        setNewTaskTime('');
        setNewTaskType(TaskType.FollowUp);
        setNewTaskReminder(ReminderType.None);
    };

    const handleToggleTask = (taskId: string | number) => {
        const updatedTasks = lead.tasks?.map(task => 
            task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
        );
        onUpdateLead({ ...lead, tasks: updatedTasks });
    };

    return (
        <div>
            <form onSubmit={handleAddTask} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
                <h4 className="font-semibold text-gray-700">Add New Task</h4>
                <div>
                     <input
                        type="text"
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        placeholder="Task title..."
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                        required
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     <select value={newTaskType} onChange={e => setNewTaskType(e.target.value as TaskType)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm">
                        {Object.values(TaskType).map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                     <select value={newTaskReminder} onChange={e => setNewTaskReminder(e.target.value as ReminderType)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm">
                        {Object.values(ReminderType).map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                        type="date"
                        value={newTaskDate}
                        onChange={e => setNewTaskDate(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                        required
                    />
                    <input
                        type="time"
                        value={newTaskTime}
                        onChange={e => setNewTaskTime(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                    />
                </div>
                <button type="submit" className="w-full px-4 py-2 bg-primary-600 text-white rounded-md shadow-sm hover:bg-primary-700">Add Task</button>
            </form>

            <ul className="space-y-3">
                {sortedTasks.map(task => (
                    <li key={task.id} className="flex items-start p-3 bg-white rounded-md shadow-sm border">
                        <input
                            type="checkbox"
                            checked={task.isCompleted}
                            onChange={() => handleToggleTask(task.id)}
                            className="h-5 w-5 mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                        <div className="ml-3 flex-grow">
                            <p className={`text-sm font-medium ${task.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{task.title}</p>
                            <div className="flex items-center text-xs text-gray-500 mt-1 space-x-4">
                               <div className="flex items-center">
                                    <TaskTypeIcon type={task.type} />
                                    <span className="ml-1.5">{task.type}</span>
                               </div>
                               <div className={`flex items-center ${task.isCompleted ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <CalendarIcon className="h-4 w-4 mr-1" />
                                    <span>
                                        {(() => {
                                            const d = new Date(`${task.dueDate}T${task.dueTime || '00:00'}`);
                                            const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
                                            if (task.dueTime) {
                                                options.hour = '2-digit';
                                                options.minute = '2-digit';
                                            }
                                            return d.toLocaleString(undefined, options);
                                        })()}
                                    </span>
                               </div>
                               {task.reminder !== ReminderType.None && (
                                   <div className="flex items-center text-gray-500">
                                       <BellIcon className="h-4 w-4 mr-1" />
                                       <span>{task.reminder}</span>
                                   </div>
                               )}
                            </div>
                        </div>
                    </li>
                ))}
                {sortedTasks.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No tasks for this lead yet.</p>}
            </ul>
        </div>
    );
};

const ActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center space-y-1 text-gray-600 hover:text-primary-600 transition-colors w-20">
        <div className="p-3 bg-gray-200 rounded-full group-hover:bg-primary-100">
            {icon}
        </div>
        <span className="text-xs font-medium">{label}</span>
    </button>
);


export const LeadDetailPanel: React.FC<LeadDetailPanelProps> = ({ 
    lead, onClose, agents, properties, onUpdateLead, leadScores, currentUser, 
    onAddVoiceNoteClick, onRescoreLead, onAddActivity, onOpenLogCall,
    onOpenWhatsApp, onOpenLogEmail, onOpenAddNote, onSummarizeCall,
    onInitiateCall
}) => {
  const [activeTab, setActiveTab] = useState<PanelTab>('activity');

  const canReassign = currentUser.role === 'Admin' || currentUser.role === 'Sales Manager';
  const assignableAgents = useMemo(() => {
      if (currentUser.role === 'Admin') {
          return agents;
      }
      if (currentUser.role === 'Sales Manager') {
          return agents.filter(a => a.team === currentUser.team);
      }
      return agents; // Return all agents, but dropdown will be disabled
  }, [agents, currentUser]);

  if (!lead) return null;

  const agent = agents.find(a => a.id === lead.agentId);
  const property = properties.find(p => p.id === lead.propertyId);
  const responseTime = calculateResponseTime(lead);

  const handleStatusChange = (newStatus: LeadStatus) => {
    const activityNote = `Status changed from ${lead.status} to ${newStatus}.`;
    onAddActivity({ type: ActivityType.StatusChange, notes: activityNote });
    onUpdateLead({ ...lead, status: newStatus });
  };
  
  const handleAgentChange = (newAgentId: string | number) => {
    const oldAgentName = agent?.name || 'Unassigned';
    const newAgentName = agents.find(a => a.id === newAgentId)?.name || 'Unassigned';
    if (oldAgentName === newAgentName) return;

    const activityNote = `Lead reassigned from ${oldAgentName} to ${newAgentName}.`;
    const newActivity: Activity = {
        id: Date.now(),
        type: ActivityType.AssignmentChange,
        timestamp: new Date().toISOString(),
        agent: currentUser.name,
        notes: activityNote
    };

    const updatedLead = { 
        ...lead, 
        agentId: newAgentId, 
        activities: [newActivity, ...lead.activities] 
    };
    onUpdateLead(updatedLead);
  };

  const handlePropertyChange = (newPropertyId: string | number) => {
      onUpdateLead({ ...lead, propertyId: newPropertyId });
  };

  const panelClasses = `
    fixed top-0 right-0 w-full max-w-2xl h-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-40
    flex flex-col
    ${lead ? 'translate-x-0' : 'translate-x-full'}
  `;

  const renderScore = () => {
    const score = leadScores.get(lead.id);

    if (score === undefined) {
        return (
            <button
                onClick={() => onRescoreLead(lead.id)}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
            >
                <SparklesIcon className="w-4 h-4 mr-1.5" />
                Score Lead
            </button>
        );
    }

    if (score === null) {
        return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                <SparklesIcon className="w-4 h-4 mr-1.5 animate-pulse" />
                Scoring...
            </span>
        );
    }
    if (score === -1) {
        return (
            <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                    Scoring Error
                </span>
                <button 
                    onClick={() => onRescoreLead(lead.id)} 
                    className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200"
                    title="Retry Scoring"
                >
                    <RefreshIcon className="h-4 w-4" />
                </button>
            </div>
        );
    }
    return (
         <div className="flex items-center gap-2">
            <LeadScoreBadge score={score} />
            <button 
                onClick={() => onRescoreLead(lead.id)} 
                className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200"
                title="Re-score Lead"
            >
                <RefreshIcon className="h-4 w-4" />
            </button>
        </div>
    );
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity ${lead ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}></div>
      <div className={panelClasses}>
        <header className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{lead.name}</h2>
              <p className="text-sm text-gray-500">
                {lead.email} &bull; 
                <a href={`tel:${lead.phone}`} onClick={() => onInitiateCall(lead.id)} className="text-primary-600 hover:underline ml-1">
                    {lead.phone}
                </a>
              </p>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <Tag type={lead.tag} />
                <Tag type={lead.status} />
                {renderScore()}
                {responseTime && (
                    <div className="inline-flex items-center text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                        <ClockIcon className="h-4 w-4 mr-1.5" />
                        Initial Response: {responseTime}
                    </div>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 -mr-2 -mt-2">&times;</button>
          </div>
        </header>
        
        <div className="p-6 border-b bg-gray-50/50">
             <h3 className="text-sm font-semibold text-gray-600 mb-3">Actions</h3>
             <div className="flex justify-around items-center">
                <ActionButton icon={<PhoneIcon className="h-6 w-6"/>} label="Log Call" onClick={onOpenLogCall} />
                <ActionButton icon={<WhatsAppIcon className="h-6 w-6"/>} label="WhatsApp" onClick={onOpenWhatsApp} />
                <ActionButton icon={<EmailIcon className="h-6 w-6"/>} label="Email" onClick={onOpenLogEmail} />
                <ActionButton icon={<NoteIcon className="h-6 w-6"/>} label="Add Note" onClick={onOpenAddNote} />
                <ActionButton icon={<MicrophoneIcon className="h-6 w-6"/>} label="Voice Note" onClick={onAddVoiceNoteClick} />
             </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 border-b">
             <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong className="text-gray-500 block">Source</strong> {lead.source}
                  </div>
                   <div>
                    <strong className="text-gray-500 block">Property Interest</strong>
                     <select 
                      value={lead.propertyId || ''}
                      onChange={(e) => handlePropertyChange(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                      <option value="">None</option>
                      {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <strong className="text-gray-500 block">Assigned Agent</strong>
                     <select 
                      value={String(lead.agentId)} 
                      onChange={(e) => handleAgentChange(e.target.value)}
                      disabled={!canReassign}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md disabled:bg-gray-100"
                    >
                      <option value={0}>Unassigned</option>
                      {assignableAgents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                   <div>
                    <strong className="text-gray-500 block">Status</strong>
                    <select 
                      value={lead.status} 
                      onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                      {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {lead.description && (
                    <div>
                        <strong className="text-gray-500 block">Description</strong>
                        <p className="mt-1 text-gray-800 bg-gray-50 p-3 rounded-md">{lead.description}</p>
                    </div>
                )}
                
                {lead.products && lead.products.length > 0 && (
                    <div>
                        <strong className="text-gray-500 block">Products Interested In</strong>
                        <div className="mt-1 flex flex-wrap gap-2">
                            {lead.products.map(p => <span key={p} className="bg-gray-200 text-gray-800 px-2 py-1 text-xs font-medium rounded-full">{p}</span>)}
                        </div>
                    </div>
                )}

                {lead.services && lead.services.length > 0 && (
                     <div>
                        <strong className="text-gray-500 block">Services Required</strong>
                        <div className="mt-1 flex flex-wrap gap-2">
                            {lead.services.map(s => <span key={s} className="bg-gray-200 text-gray-800 px-2 py-1 text-xs font-medium rounded-full">{s}</span>)}
                        </div>
                    </div>
                )}
              </div>
          </div>
          
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-6 px-6" aria-label="Tabs">
              <button onClick={() => setActiveTab('activity')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'activity' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                Activity
              </button>
              <button onClick={() => setActiveTab('tasks')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'tasks' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                Tasks
              </button>
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === 'activity' ? (
                 <div className="flow-root">
                  <ul className="-mb-8">
                    {lead.activities.map((activity, activityIdx) => {
                       const hasSummary = lead.activities.some(a => a.type === ActivityType.AISummary && a.sourceActivityId === activity.id);
                      
                      return (
                      <li key={activity.id}>
                        <div className="relative pb-8">
                          {activityIdx !== lead.activities.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex items-start space-x-3">
                            <ActivityIcon type={activity.type} />
                            <div className="min-w-0 flex-1">
                              <div>
                                <div className="text-sm">
                                  <p className="font-medium text-gray-900">{activity.type} by {activity.agent}</p>
                                </div>
                                <p className="mt-0.5 text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                              </div>
                              <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                                {activity.subject && <p className="font-semibold">{activity.subject}</p>}
                                <p className="whitespace-pre-wrap">{activity.notes}</p>
                                {activity.location && <p className="text-xs text-gray-500 mt-1">Location: {activity.location}</p>}
                                {activity.audioUrl && (
                                  <div className="mt-2">
                                      <div className="w-full flex items-center space-x-3 p-2 bg-white border rounded-lg">
                                          <button className="p-2 rounded-full bg-primary-600 text-white flex-shrink-0"><PlayIcon className="h-4 w-4" /></button>
                                          <div className="w-full h-1 bg-gray-200 rounded-full">
                                              <div className="w-1/3 h-1 bg-primary-500 rounded-full"></div>
                                          </div>
                                          <span className="text-xs font-mono text-gray-500">0:12</span>
                                      </div>
                                  </div>
                                )}
                                {activity.type === ActivityType.Call && (
                                  <div className="mt-2 flex items-center space-x-2">
                                      <button
                                          onClick={() => onSummarizeCall(lead.id, activity.id)}
                                          disabled={hasSummary}
                                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                      >
                                          <SparklesIcon className="h-4 w-4 mr-1"/>
                                          {hasSummary ? 'Summary Generated' : 'Generate Summary'}
                                      </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    )})}
                  </ul>
                </div>
            ) : (
                <TasksPanel lead={lead} onUpdateLead={onUpdateLead} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};