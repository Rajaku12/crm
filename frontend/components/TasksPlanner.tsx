
import React, { useState, useMemo } from 'react';
import { Agent, Lead, Task, TaskType, ReminderType } from '../types';
import { Card } from './ui/Card';
import { PhoneIcon, UserGroupIcon, EmailIcon, ChecklistIcon, DocumentTextIcon, CalendarIcon, BellIcon } from './icons/IconComponents';

interface TasksPlannerProps {
    leads: Lead[];
    agents: Agent[];
    currentUser: Agent;
    onSelectLead: (lead: Lead) => void;
    onUpdateLead: (lead: Lead) => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

type TaskStatusFilter = 'All' | 'Pending' | 'Completed';

type TaskWithLead = Task & {
    lead: Lead;
};

const TaskTypeIcon: React.FC<{ type: TaskType, className?: string }> = ({ type, className = "h-5 w-5" }) => {
    const icons = {
        [TaskType.Call]: <PhoneIcon className={className} />,
        [TaskType.Meeting]: <UserGroupIcon className={className} />,
        [TaskType.Email]: <EmailIcon className={className} />,
        [TaskType.FollowUp]: <ChecklistIcon className={className} />,
        [TaskType.Paperwork]: <DocumentTextIcon className={className} />,
    };
    return <div title={type} className="p-2 bg-gray-200 rounded-full">{icons[type] || <ChecklistIcon className={className} />}</div>;
};


const TaskItem: React.FC<{ task: TaskWithLead, onUpdateLead: (lead: Lead) => void, onSelectLead: (lead: Lead) => void }> = ({ task, onUpdateLead, onSelectLead }) => {
    const { lead } = task;

    const handleToggleTask = () => {
        const updatedTasks = lead.tasks?.map(t =>
            t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t
        );
        onUpdateLead({ ...lead, tasks: updatedTasks });
    };

    const isOverdue = !task.isCompleted && new Date(`${task.dueDate}T${task.dueTime || '23:59:59'}`) < new Date();

    return (
        <div className="flex items-center p-3 bg-white rounded-md shadow-sm border transition-shadow hover:shadow-md">
            <input
                type="checkbox"
                checked={task.isCompleted}
                onChange={handleToggleTask}
                className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
            />
            <div className="ml-4 flex-grow flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex-1">
                    <p className={`font-medium ${task.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{task.title}</p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                        <p>For: <button onClick={() => onSelectLead(lead)} className="font-semibold text-primary-600 hover:underline">{lead.name}</button></p>
                    </div>
                </div>
                <div className="flex items-center mt-2 md:mt-0 text-sm">
                    {task.reminder && task.reminder !== ReminderType.None && (
                        <div className="flex items-center mr-4 text-gray-500" title={`Reminder: ${task.reminder}`}>
                            <BellIcon className="h-4 w-4 mr-1.5" />
                            <span className="hidden sm:inline">{task.reminder}</span>
                        </div>
                    )}
                    <div className={`flex items-center mr-4 ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                         <CalendarIcon className="h-4 w-4 mr-1.5" />
                         {new Date(`${task.dueDate}T${task.dueTime || '00:00'}`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                         {task.dueTime && `, ${new Date(`1970-01-01T${task.dueTime}`).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`}
                    </div>
                     <TaskTypeIcon type={task.type} className="h-4 w-4" />
                </div>
            </div>
        </div>
    );
};

const TaskGroup: React.FC<{ title: string; tasks: TaskWithLead[]; onUpdateLead: (lead: Lead) => void; onSelectLead: (lead: Lead) => void; }> = ({ title, tasks, onUpdateLead, onSelectLead }) => {
    if (tasks.length === 0) return null;
    return (
        <div>
            <h3 className="text-md font-semibold text-gray-600 mb-3 px-1">{title} ({tasks.length})</h3>
            <div className="space-y-3">
                {tasks.map(task => <TaskItem key={`${task.lead.id}-${task.id}`} task={task} onUpdateLead={onUpdateLead} onSelectLead={onSelectLead} />)}
            </div>
        </div>
    );
}

export const TasksPlanner: React.FC<TasksPlannerProps> = ({ leads, agents, currentUser, onSelectLead, onUpdateLead, showToast }) => {
    const [selectedAgentId, setSelectedAgentId] = useState<number | string | 'All'>(currentUser.id);
    const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('Pending');
    const [showAddTaskForm, setShowAddTaskForm] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        leadId: '',
        dueDate: '',
        dueTime: '',
        type: TaskType.FollowUp,
        reminder: ReminderType.None
    });


    const allTasks = useMemo(() => {
        let tasks: TaskWithLead[] = [];
        leads.forEach(lead => {
            if(lead.tasks) {
                lead.tasks.forEach(task => {
                    tasks.push({
                        ...task,
                        lead,
                    });
                });
            }
        });
        return tasks.sort((a,b) => {
            const dateA = new Date(`${a.dueDate}T${a.dueTime || '00:00:00'}`);
            const dateB = new Date(`${b.dueDate}T${b.dueTime || '00:00:00'}`);
            return dateA.getTime() - dateB.getTime();
        });
    }, [leads]);
    
    const filteredTasks = useMemo(() => {
        return allTasks.filter(task => {
            const agentMatch = selectedAgentId === 'All' || task.lead.agentId === selectedAgentId;
            const statusMatch = statusFilter === 'All' || (statusFilter === 'Completed' ? task.isCompleted : !task.isCompleted);
            return agentMatch && statusMatch;
        });
    }, [allTasks, selectedAgentId, statusFilter]);

    const taskGroups = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        const endOfWeek = new Date(startOfToday);
        const dayOfWeek = startOfToday.getDay();
        const distanceToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
        endOfWeek.setDate(startOfToday.getDate() + distanceToSunday);
        endOfWeek.setHours(23, 59, 59, 999);

        const overdue: TaskWithLead[] = [];
        const todayTasks: TaskWithLead[] = [];
        const thisWeek: TaskWithLead[] = [];
        const later: TaskWithLead[] = [];

        filteredTasks.forEach(task => {
            if (task.isCompleted) {
                return;
            }
            const dueDate = new Date(`${task.dueDate}T${task.dueTime || '00:00:00'}`);

            if (dueDate < startOfToday) {
                overdue.push(task);
            } else if (dueDate < startOfTomorrow) {
                todayTasks.push(task);
            } else if (dueDate <= endOfWeek) {
                thisWeek.push(task);
            } else {
                later.push(task);
            }
        });

        const completed = statusFilter === 'Completed' || statusFilter === 'All' ? filteredTasks.filter(t => t.isCompleted) : [];

        return { overdue, today: todayTasks, thisWeek, later, completed };
    }, [filteredTasks, statusFilter]);
    
    const handleNewTaskChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewTask(prev => ({ ...prev, [name]: value }));
    };
    
    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.title || !newTask.leadId || !newTask.dueDate) {
            showToast('Please fill in title, lead, and due date.');
            return;
        }

        const leadToUpdate = leads.find(l => l.id === parseInt(newTask.leadId, 10));
        if (!leadToUpdate) return;

        const taskToAdd: Task = {
            id: Date.now(),
            title: newTask.title,
            dueDate: newTask.dueDate,
            dueTime: newTask.dueTime || undefined,
            isCompleted: false,
            type: newTask.type,
            reminder: newTask.reminder,
        };

        const updatedLead = {
            ...leadToUpdate,
            tasks: [...(leadToUpdate.tasks || []), taskToAdd],
        };
        onUpdateLead(updatedLead);
        
        showToast('Task created successfully!', 'success');

        setNewTask({
            title: '',
            leadId: '',
            dueDate: '',
            dueTime: '',
            type: TaskType.FollowUp,
            reminder: ReminderType.None
        });
        setShowAddTaskForm(false);
    };

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Tasks Planner</h1>
                        <p className="text-sm text-gray-500">Manage and track your team's tasks.</p>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto flex-wrap justify-end">
                         <div className="flex items-center rounded-lg bg-gray-100 p-1">
                            {(['Pending', 'Completed', 'All'] as TaskStatusFilter[]).map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${statusFilter === status ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                        <select
                            value={String(selectedAgentId)}
                            onChange={(e) => setSelectedAgentId(e.target.value === 'All' ? 'All' : e.target.value)}
                            className="p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                        >
                            <option value={currentUser.id}>My Tasks</option>
                            <option value="All">All Agents</option>
                            {agents.filter(a => a.id !== currentUser.id).map(agent => (
                                <option key={agent.id} value={agent.id}>{agent.name}</option>
                            ))}
                        </select>
                        <button onClick={() => setShowAddTaskForm(prev => !prev)} className="px-4 py-2 bg-primary-600 text-white rounded-md shadow-sm hover:bg-primary-700 whitespace-nowrap">
                            {showAddTaskForm ? 'Cancel' : 'Add Task'}
                        </button>
                    </div>
                </div>
                 {showAddTaskForm && (
                    <form onSubmit={handleAddTask} className="mt-4 pt-4 border-t">
                        <h3 className="text-md font-semibold text-gray-700 mb-3">Add New Task</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Task Title *</label>
                                <input type="text" name="title" value={newTask.title} onChange={handleNewTaskChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">For Lead *</label>
                                <select name="leadId" value={newTask.leadId} onChange={handleNewTaskChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                    <option value="" disabled>Select a lead</option>
                                    {leads.map(lead => <option key={lead.id} value={lead.id}>{lead.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Due Date *</label>
                                <input type="date" name="dueDate" value={newTask.dueDate} onChange={handleNewTaskChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Due Time</label>
                                <input type="time" name="dueTime" value={newTask.dueTime} onChange={handleNewTaskChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Task Type</label>
                                <select name="type" value={newTask.type} onChange={handleNewTaskChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                    {Object.values(TaskType).map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Reminder</label>
                                <select name="reminder" value={newTask.reminder} onChange={handleNewTaskChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                    {Object.values(ReminderType).map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md shadow-sm hover:bg-primary-700">Save Task</button>
                        </div>
                    </form>
                )}
            </Card>

            <div className="space-y-8">
                <TaskGroup title="Overdue" tasks={taskGroups.overdue} onUpdateLead={onUpdateLead} onSelectLead={onSelectLead} />
                <TaskGroup title="Today" tasks={taskGroups.today} onUpdateLead={onUpdateLead} onSelectLead={onSelectLead} />
                <TaskGroup title="This Week" tasks={taskGroups.thisWeek} onUpdateLead={onUpdateLead} onSelectLead={onSelectLead} />
                <TaskGroup title="Later" tasks={taskGroups.later} onUpdateLead={onUpdateLead} onSelectLead={onSelectLead} />
                <TaskGroup title="Completed" tasks={taskGroups.completed} onUpdateLead={onUpdateLead} onSelectLead={onSelectLead} />
                
                {filteredTasks.length === 0 && (
                     <Card className="text-center py-12">
                        <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">All caught up!</h3>
                        <p className="mt-1 text-sm text-gray-500">There are no tasks matching your current filters.</p>
                    </Card>
                )}
            </div>
        </div>
    );
};