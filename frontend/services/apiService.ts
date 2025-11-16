import { 
    Lead, Agent, Property, Client, Activity, Task, 
    WhatsAppTemplate, AutomationRule, Notification,
    AttendanceRecord, ApiError, Deal,
    Project, Tower, Floor, Unit, BookingPayment, Receipt,
    PaymentSchedule, PaymentMilestone, Ledger, Refund, BankReconciliation
} from '../types';

/**
 * API Service for communicating with Django REST Framework backend
 * Handles JWT authentication and all CRUD operations
 */

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Get stored access token
 */
export const getAccessToken = (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Get stored refresh token
 */
export const getRefreshToken = (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Store tokens
 */
export const setTokens = (access: string, refresh: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
};

/**
 * Clear tokens (logout)
 */
export const clearTokens = (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
    return !!getAccessToken();
};

/**
 * Make API request with authentication
 */
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getAccessToken();
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        // Handle token refresh on 401
        if (response.status === 401 && token) {
            const refreshed = await refreshToken();
            if (refreshed) {
                // Retry request with new token
                headers['Authorization'] = `Bearer ${getAccessToken()}`;
                const retryResponse = await fetch(url, {
                    ...options,
                    headers,
                });
                if (!retryResponse.ok) {
                    throw new ApiError(
                        `Request failed: ${retryResponse.statusText}`,
                        retryResponse.status
                    );
                }
                return await retryResponse.json();
            } else {
                clearTokens();
                throw new ApiError('Authentication failed. Please login again.', 401);
            }
        }

        if (!response.ok) {
            let errorMessage = `Request failed: ${response.statusText}`;
            let errorData: any = {};
            
            try {
                const text = await response.text();
                if (text) {
                    errorData = JSON.parse(text);
                    errorMessage = errorData.error || 
                                  errorData.detail || 
                                  errorData.message || 
                                  (typeof errorData === 'string' ? errorData : errorMessage);
                    
                    // Handle validation errors
                    if (errorData.non_field_errors) {
                        errorMessage = Array.isArray(errorData.non_field_errors) 
                            ? errorData.non_field_errors.join(', ') 
                            : errorData.non_field_errors;
                    } else if (typeof errorData === 'object' && !errorData.error && !errorData.detail && !errorData.message) {
                        // Handle field-specific errors
                        const fieldErrors = Object.entries(errorData)
                            .map(([field, errors]) => {
                                const errorList = Array.isArray(errors) ? errors : [errors];
                                return `${field}: ${errorList.join(', ')}`;
                            })
                            .join('; ');
                        if (fieldErrors) {
                            errorMessage = fieldErrors;
                        }
                    }
                }
            } catch (parseError) {
                // If JSON parsing fails, use the text or default message
                errorMessage = `Request failed: ${response.statusText} (${response.status})`;
            }
            
            throw new ApiError(errorMessage, response.status);
        }

        // Handle empty responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        return {} as T;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(
            error instanceof Error ? error.message : 'Network error occurred',
            0
        );
    }
}

/**
 * Refresh access token using refresh token
 */
async function refreshToken(): Promise<boolean> {
    const refresh = getRefreshToken();
    if (!refresh) {
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh }),
        });

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        setTokens(data.access, refresh);
        return true;
    } catch {
        return false;
    }
}

// ==================== AUTHENTICATION ====================

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface LoginResponse {
    access: string;
    refresh: string;
    user?: Agent;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
    password2: string;
    first_name?: string;
    last_name?: string;
    role?: Agent['role'];
    team?: string;
    contact?: string;
}

/**
 * Login user
 */
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/token/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            errorData.detail || 'Invalid credentials',
            response.status
        );
    }

    const data = await response.json();
    setTokens(data.access, data.refresh);

    // Fetch user profile
    try {
        const user = await getCurrentUser();
        return { ...data, user };
    } catch {
        return data;
    }
};

/**
 * Register new user
 */
export const register = async (data: RegisterData): Promise<Agent> => {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            errorData.detail || errorData.message || 'Registration failed',
            response.status
        );
    }

    const result = await response.json();
    return transformAgent(result.user || result);
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<Agent> => {
    const data = await apiRequest<any>('/agents/me/');
    return transformAgent(data);
};

/**
 * Logout user
 */
export const logout = (): void => {
    clearTokens();
};

// ==================== LEADS ====================

/**
 * Transform backend lead to frontend format
 */
function transformLead(data: any): Lead {
    return {
        id: data.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        tag: data.tag,
        status: data.status,
        source: data.source,
        agentId: typeof data.agent === 'object' ? data.agent.id : data.agent_id || data.agent,
        createdAt: data.created_at,
        lastContacted: data.last_contacted,
        propertyId: data.property ? (typeof data.property === 'object' ? data.property.id : data.property_id) : undefined,
        description: data.description || '',
        products: data.products || [],
        services: data.services || [],
        activities: (data.activities || []).map(transformActivity),
        tasks: (data.tasks || []).map(transformTask),
        createdBy: data.created_by ? (typeof data.created_by === 'object' ? data.created_by.id.toString() : data.created_by.toString()) : undefined,
    };
}

/**
 * Transform frontend lead to backend format
 */
function transformLeadInput(lead: Partial<Lead>): any {
    return {
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        tag: lead.tag,
        status: lead.status,
        source: lead.source,
        agent_id: lead.agentId,
        property_id: lead.propertyId,
        description: lead.description,
        products: lead.products,
        services: lead.services,
    };
}

/**
 * Get all leads
 */
export const getLeads = async (): Promise<Lead[]> => {
    const data = await apiRequest<any>('/leads/');
    const results = Array.isArray(data) ? data : (data.results || []);
    return results.map(transformLead);
};

/**
 * Get single lead by ID
 */
export const getLead = async (id: string | number): Promise<Lead> => {
    const data = await apiRequest<any>(`/leads/${id}/`);
    return transformLead(data);
};

/**
 * Create new lead
 */
export const createLead = async (leadData: Omit<Lead, 'id' | 'activities' | 'lastContacted' | 'createdAt' | 'tasks'>): Promise<Lead> => {
    const data = await apiRequest<any>('/leads/', {
        method: 'POST',
        body: JSON.stringify(transformLeadInput(leadData)),
    });
    return transformLead(data);
};

/**
 * Update lead
 */
export const updateLead = async (id: string | number, leadData: Partial<Lead>): Promise<Lead> => {
    const data = await apiRequest<any>(`/leads/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(transformLeadInput(leadData)),
    });
    return transformLead(data);
};

/**
 * Delete lead
 */
export const deleteLead = async (id: string | number): Promise<void> => {
    await apiRequest(`/leads/${id}/`, {
        method: 'DELETE',
    });
};

// ==================== ACTIVITIES ====================

/**
 * Transform backend activity to frontend format
 */
function transformActivity(data: any): Activity {
    return {
        id: data.id,
        type: data.type,
        timestamp: data.timestamp,
        agent: data.agent || data.agent_name,
        notes: data.notes || '',
        duration: data.duration,
        recordingUrl: data.recording_url,
        outcome: data.outcome,
        qualityScore: data.quality_score,
        sentiment: data.sentiment,
        keywords: data.keywords || [],
        subject: data.subject,
        transcript: data.transcript,
        location: data.location,
        audioUrl: data.audio_url,
        sourceActivityId: data.source_activity ? (typeof data.source_activity === 'object' ? data.source_activity.id : data.source_activity) : undefined,
    };
}

/**
 * Transform frontend activity to backend format
 */
function transformActivityInput(activity: Partial<Activity>, agentName?: string): any {
    return {
        type: activity.type,
        notes: activity.notes,
        duration: activity.duration,
        recording_url: activity.recordingUrl,
        outcome: activity.outcome,
        quality_score: activity.qualityScore,
        sentiment: activity.sentiment,
        keywords: activity.keywords,
        subject: activity.subject,
        transcript: activity.transcript,
        location: activity.location,
        audio_url: activity.audioUrl,
        agent_name: agentName,
        source_activity_id: activity.sourceActivityId,
    };
}

/**
 * Get activities for a lead
 */
export const getLeadActivities = async (leadId: string | number): Promise<Activity[]> => {
    const data = await apiRequest<any>(`/leads/${leadId}/activities/`);
    const results = Array.isArray(data) ? data : (data.results || []);
    return results.map(transformActivity);
};

/**
 * Add activity to lead
 */
export const addActivityToLead = async (
    leadId: string | number,
    activityData: Omit<Activity, 'id' | 'timestamp' | 'agent'>,
    agentName: string
): Promise<Activity> => {
    const data = await apiRequest<any>(`/leads/${leadId}/add_activity/`, {
        method: 'POST',
        body: JSON.stringify(transformActivityInput(activityData, agentName)),
    });
    return transformActivity(data);
};

/**
 * Create activity
 */
export const createActivity = async (activityData: Omit<Activity, 'id' | 'timestamp' | 'agent'>, agentName: string): Promise<Activity> => {
    const data = await apiRequest<any>('/activities/', {
        method: 'POST',
        body: JSON.stringify(transformActivityInput(activityData, agentName)),
    });
    return transformActivity(data);
};

// ==================== TASKS ====================

/**
 * Transform backend task to frontend format
 */
function transformTask(data: any): Task {
    return {
        id: data.id,
        title: data.title,
        dueDate: data.due_date,
        dueTime: data.due_time,
        isCompleted: data.is_completed,
        type: data.type,
        reminder: data.reminder,
    };
}

/**
 * Transform frontend task to backend format
 */
function transformTaskInput(task: Partial<Task>): any {
    return {
        title: task.title,
        due_date: task.dueDate,
        due_time: task.dueTime,
        is_completed: task.isCompleted,
        type: task.type,
        reminder: task.reminder,
    };
}

/**
 * Get tasks for a lead
 */
export const getLeadTasks = async (leadId: string | number): Promise<Task[]> => {
    const data = await apiRequest<any>(`/leads/${leadId}/tasks/`);
    const results = Array.isArray(data) ? data : (data.results || []);
    return results.map(transformTask);
};

/**
 * Create task
 */
export const createTask = async (leadId: string | number, taskData: Omit<Task, 'id'>): Promise<Task> => {
    const data = await apiRequest<any>('/tasks/', {
        method: 'POST',
        body: JSON.stringify({
            ...transformTaskInput(taskData),
            lead: leadId,
        }),
    });
    return transformTask(data);
};

/**
 * Update task
 */
export const updateTask = async (id: string | number, taskData: Partial<Task>): Promise<Task> => {
    const data = await apiRequest<any>(`/tasks/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(transformTaskInput(taskData)),
    });
    return transformTask(data);
};

/**
 * Complete task
 */
export const completeTask = async (id: string | number): Promise<Task> => {
    const data = await apiRequest<any>(`/tasks/${id}/complete/`, {
        method: 'POST',
    });
    return transformTask(data);
};

/**
 * Delete task
 */
export const deleteTask = async (id: string | number): Promise<void> => {
    await apiRequest(`/tasks/${id}/`, {
        method: 'DELETE',
    });
};

// ==================== PROPERTIES ====================

/**
 * Transform backend property to frontend format
 */
function transformProperty(data: any): Property {
    return {
        id: data.id,
        name: data.name,
        category: data.category,
        price: parseFloat(data.price),
        status: data.status,
        location: data.location,
        description: data.description || '',
        images: data.images || [],
        floorPlanUrl: data.floor_plan_url,
        stats: data.stats || { views: 0, inquiries: 0, conversions: 0 },
    };
}

/**
 * Transform frontend property to backend format
 */
function transformPropertyInput(property: Partial<Property>): any {
    return {
        name: property.name,
        category: property.category,
        price: property.price,
        status: property.status,
        location: property.location,
        description: property.description,
        images: property.images,
        floor_plan_url: property.floorPlanUrl,
    };
}

/**
 * Get all properties
 */
export const getProperties = async (): Promise<Property[]> => {
    const data = await apiRequest<any>('/properties/');
    const results = Array.isArray(data) ? data : (data.results || []);
    return results.map(transformProperty);
};

/**
 * Get single property by ID
 */
export const getProperty = async (id: string | number): Promise<Property> => {
    const data = await apiRequest<any>(`/properties/${id}/`);
    return transformProperty(data);
};

/**
 * Create property
 */
export const createProperty = async (propertyData: Omit<Property, 'id' | 'stats'>): Promise<Property> => {
    const data = await apiRequest<any>('/properties/', {
        method: 'POST',
        body: JSON.stringify(transformPropertyInput(propertyData)),
    });
    return transformProperty(data);
};

/**
 * Update property
 */
export const updateProperty = async (id: string | number, propertyData: Partial<Property>): Promise<Property> => {
    const data = await apiRequest<any>(`/properties/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(transformPropertyInput(propertyData)),
    });
    return transformProperty(data);
};

/**
 * Delete property
 */
export const deleteProperty = async (id: string | number): Promise<void> => {
    await apiRequest(`/properties/${id}/`, {
        method: 'DELETE',
    });
};

// ==================== AGENTS ====================

/**
 * Transform backend agent to frontend format
 */
function transformAgent(data: any): Agent {
    return {
        id: data.id,
        name: data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.username,
        email: data.email,
        role: data.role,
        avatarUrl: data.avatar_url || '',
        team: data.team,
        monthlyCallsTarget: data.monthly_calls_target,
        monthlySalesTarget: data.monthly_sales_target,
        reportsTo: data.reports_to ? (typeof data.reports_to === 'object' ? data.reports_to.id.toString() : data.reports_to.toString()) : undefined,
        isActive: data.is_active !== undefined ? data.is_active : true,
        contact: data.contact,
        dob: data.dob,
        pan: data.pan,
        dealsIn: data.deals_in,
        address: data.address,
        city: data.city,
        state: data.state,
        pinCode: data.pin_code,
    };
}

/**
 * Transform frontend agent to backend format
 */
function transformAgentInput(agent: Partial<Agent>): any {
    const nameParts = agent.name?.split(' ') || [];
    return {
        username: agent.email?.split('@')[0] || agent.name?.toLowerCase().replace(/\s+/g, '_'),
        email: agent.email,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        role: agent.role,
        avatar_url: agent.avatarUrl,
        team: agent.team,
        monthly_calls_target: agent.monthlyCallsTarget,
        monthly_sales_target: agent.monthlySalesTarget,
        reports_to: agent.reportsTo,
        is_active: agent.isActive,
        contact: agent.contact,
        dob: agent.dob,
        pan: agent.pan,
        deals_in: agent.dealsIn,
        address: agent.address,
        city: agent.city,
        state: agent.state,
        pin_code: agent.pinCode,
    };
}

/**
 * Get all agents
 */
export const getAgents = async (): Promise<Agent[]> => {
    const data = await apiRequest<any>('/agents/');
    const results = Array.isArray(data) ? data : (data.results || []);
    return results.map(transformAgent);
};

/**
 * Get single agent by ID
 */
export const getAgent = async (id: string | number): Promise<Agent> => {
    const data = await apiRequest<any>(`/agents/${id}/`);
    return transformAgent(data);
};

/**
 * Create agent
 */
export const createAgent = async (agentData: Omit<Agent, 'id'>): Promise<Agent> => {
    const data = await apiRequest<any>('/agents/', {
        method: 'POST',
        body: JSON.stringify(transformAgentInput(agentData)),
    });
    return transformAgent(data);
};

/**
 * Update agent
 */
export const updateAgent = async (id: string | number, agentData: Partial<Agent>): Promise<Agent> => {
    const data = await apiRequest<any>(`/agents/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(transformAgentInput(agentData)),
    });
    return transformAgent(data);
};

/**
 * Delete agent
 */
export const deleteAgent = async (id: string | number): Promise<void> => {
    await apiRequest(`/agents/${id}/`, {
        method: 'DELETE',
    });
};

/**
 * Get all teams
 */
export const getTeams = async (): Promise<string[]> => {
    const data = await apiRequest<string[]>('/agents/teams/');
    return Array.isArray(data) ? data : [];
};

// ==================== CALLS ====================

/**
 * Initiate a call to a lead
 */
export const initiateCall = async (leadId: string | number, toNumber?: string): Promise<any> => {
    const data = await apiRequest<any>(`/leads/${leadId}/initiate_call/`, {
        method: 'POST',
        body: JSON.stringify({ to_number: toNumber }),
    });
    return data;
};

/**
 * Get call logs
 */
export const getCallLogs = async (): Promise<any[]> => {
    const data = await apiRequest<any>('/call-logs/');
    if (Array.isArray(data)) {
        return data;
    } else if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return data.results;
    }
    return [];
};

// ==================== CLIENTS ====================

/**
 * Transform backend client to frontend format
 */
function transformClient(data: any): Client {
    return {
        id: data.id,
        name: data.name,
        contact: data.contact,
        email: data.email,
        dob: data.dob,
        pan: data.pan,
        address: data.address,
        city: data.city,
        state: data.state,
        pinCode: data.pin_code,
        occupation: data.occupation,
        organization: data.organization,
        designation: data.designation,
        leadSource: data.leadSource || data.lead_source,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    };
}

/**
 * Transform frontend client to backend format
 */
function transformClientInput(client: Partial<Client>): any {
    return {
        name: client.name,
        contact: client.contact,
        email: client.email,
        dob: client.dob,
        pan: client.pan,
        address: client.address,
        city: client.city,
        state: client.state,
        pin_code: client.pinCode,
        occupation: client.occupation,
        organization: client.organization,
        designation: client.designation,
        lead_source: client.leadSource,
    };
}

/**
 * Get all clients
 */
export const getClients = async (): Promise<Client[]> => {
    const data = await apiRequest<any>('/clients/');
    const results = Array.isArray(data) ? data : (data.results || []);
    return results.map(transformClient);
};

/**
 * Get single client by ID
 */
export const getClient = async (id: string | number): Promise<Client> => {
    const data = await apiRequest<any>(`/clients/${id}/`);
    return transformClient(data);
};

/**
 * Create client
 */
export const createClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
    const data = await apiRequest<any>('/clients/', {
        method: 'POST',
        body: JSON.stringify(transformClientInput(clientData)),
    });
    return transformClient(data);
};

/**
 * Update client
 */
export const updateClient = async (id: string | number, clientData: Partial<Client>): Promise<Client> => {
    const data = await apiRequest<any>(`/clients/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(transformClientInput(clientData)),
    });
    return transformClient(data);
};

/**
 * Delete client
 */
export const deleteClient = async (id: string | number): Promise<void> => {
    await apiRequest(`/clients/${id}/`, {
        method: 'DELETE',
    });
};

// ==================== WHATSAPP TEMPLATES ====================

/**
 * Transform backend template to frontend format
 */
function transformWhatsAppTemplate(data: any): WhatsAppTemplate {
    return {
        id: data.id,
        name: data.name,
        content: data.content,
    };
}

/**
 * Get all WhatsApp templates
 */
export const getWhatsAppTemplates = async (): Promise<WhatsAppTemplate[]> => {
    const data = await apiRequest<any>('/whatsapp-templates/');
    const results = Array.isArray(data) ? data : (data.results || []);
    return results.map(transformWhatsAppTemplate);
};

/**
 * Create WhatsApp template
 */
export const createWhatsAppTemplate = async (templateData: Omit<WhatsAppTemplate, 'id'>): Promise<WhatsAppTemplate> => {
    const data = await apiRequest<any>('/whatsapp-templates/', {
        method: 'POST',
        body: JSON.stringify({
            name: templateData.name,
            content: templateData.content,
        }),
    });
    return transformWhatsAppTemplate(data);
};

/**
 * Update WhatsApp template
 */
export const updateWhatsAppTemplate = async (id: string | number, templateData: Partial<WhatsAppTemplate>): Promise<WhatsAppTemplate> => {
    const data = await apiRequest<any>(`/whatsapp-templates/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
            name: templateData.name,
            content: templateData.content,
        }),
    });
    return transformWhatsAppTemplate(data);
};

/**
 * Delete WhatsApp template
 */
export const deleteWhatsAppTemplate = async (id: string | number): Promise<void> => {
    await apiRequest(`/whatsapp-templates/${id}/`, {
        method: 'DELETE',
    });
};

// ==================== AUTOMATION RULES ====================

/**
 * Transform backend automation rule to frontend format
 */
function transformAutomationRule(data: any): AutomationRule {
    return {
        id: data.id.toString(),
        title: data.title,
        description: data.description,
        isEnabled: data.is_enabled,
        channels: data.channels || {
            dashboard: data.channels_dashboard || false,
            email: data.channels_email || false,
            whatsapp: data.channels_whatsapp || false,
        },
    };
}

/**
 * Get all automation rules
 */
export const getAutomationRules = async (): Promise<AutomationRule[]> => {
    const data = await apiRequest<any>('/automation-rules/');
    const results = Array.isArray(data) ? data : (data.results || []);
    return results.map(transformAutomationRule);
};

/**
 * Update automation rule
 */
export const updateAutomationRule = async (id: string, ruleData: Partial<AutomationRule>): Promise<AutomationRule> => {
    const data = await apiRequest<any>(`/automation-rules/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
            title: ruleData.title,
            description: ruleData.description,
            is_enabled: ruleData.isEnabled,
            channels_dashboard: ruleData.channels?.dashboard,
            channels_email: ruleData.channels?.email,
            channels_whatsapp: ruleData.channels?.whatsapp,
        }),
    });
    return transformAutomationRule(data);
};

// ==================== NOTIFICATIONS ====================

/**
 * Transform backend notification to frontend format
 */
function transformNotification(data: any): Notification {
    return {
        id: data.id,
        leadName: data.lead_name,
        leadId: data.lead_id,
        type: data.type,
        message: data.message,
        timestamp: data.timestamp,
        isRead: data.is_read,
    };
}

/**
 * Get all notifications
 */
export const getNotifications = async (): Promise<Notification[]> => {
    const data = await apiRequest<any>('/notifications/');
    const results = Array.isArray(data) ? data : (data.results || []);
    return results.map(transformNotification);
};

/**
 * Mark notification as read
 */
export const markNotificationRead = async (id: string | number): Promise<Notification> => {
    const data = await apiRequest<any>(`/notifications/${id}/mark_read/`, {
        method: 'POST',
    });
    return transformNotification(data);
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsRead = async (): Promise<void> => {
    await apiRequest('/notifications/mark_all_read/', {
        method: 'POST',
    });
};

// ==================== ATTENDANCE ====================

/**
 * Transform backend attendance record to frontend format
 */
function transformAttendanceRecord(data: any): AttendanceRecord {
    return {
        id: data.id,
        agentId: typeof data.agent === 'object' ? data.agent.id : data.agent_id || data.agent,
        checkInTime: data.check_in_time,
        checkOutTime: data.check_out_time,
        duration: data.duration,
        method: data.method,
        location: data.location,
    };
}

/**
 * Get attendance records
 */
export const getAttendanceRecords = async (): Promise<AttendanceRecord[]> => {
    const data = await apiRequest<any>('/attendance/');
    const results = Array.isArray(data) ? data : (data.results || []);
    return results.map(transformAttendanceRecord);
};

/**
 * Create attendance record
 */
export const createAttendanceRecord = async (recordData: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> => {
    const data = await apiRequest<any>('/attendance/', {
        method: 'POST',
        body: JSON.stringify({
            agent_id: recordData.agentId,
            check_in_time: recordData.checkInTime,
            check_out_time: recordData.checkOutTime,
            duration: recordData.duration,
            method: recordData.method,
            location: recordData.location,
        }),
    });
    return transformAttendanceRecord(data);
};

// ==================== DEALS ====================

export const getDeals = async (): Promise<Deal[]> => {
    const data = await apiRequest<any[]>('/deals/');
    return data.map((deal: any) => ({
        id: deal.id,
        lead: deal.lead,
        property: deal.property,
        stage: deal.stage,
        agent: deal.agent,
        client: deal.client,
        booking_date: deal.booking_date,
        agreement_date: deal.agreement_date,
        registry_date: deal.registry_date,
        notes: deal.notes,
        created_at: deal.created_at,
        updated_at: deal.updated_at,
    }));
};

// ==================== PAYMENT MANAGEMENT API ====================

// Project Structure APIs
export const getProjects = async (): Promise<Project[]> => {
    const data = await apiRequest<Project[]>('/projects/');
    return data;
};

export const getProject = async (id: number): Promise<Project> => {
    const data = await apiRequest<Project>(`/projects/${id}/`);
    return data;
};

export const createProject = async (projectData: Partial<Project>): Promise<Project> => {
    const data = await apiRequest<Project>('/projects/', {
        method: 'POST',
        body: JSON.stringify(projectData),
    });
    return data;
};

export const getTowers = async (projectId?: number): Promise<Tower[]> => {
    const url = projectId ? `/towers/?project=${projectId}` : '/towers/';
    const data = await apiRequest<Tower[]>(url);
    return data;
};

export const getFloors = async (towerId?: number): Promise<Floor[]> => {
    const url = towerId ? `/floors/?tower=${towerId}` : '/floors/';
    const data = await apiRequest<Floor[]>(url);
    return data;
};

export const getUnits = async (floorId?: number): Promise<Unit[]> => {
    const url = floorId ? `/units/?floor=${floorId}` : '/units/';
    const data = await apiRequest<Unit[]>(url);
    return data;
};

export const getUnit = async (id: number): Promise<Unit> => {
    const data = await apiRequest<Unit>(`/units/${id}/`);
    return data;
};

// Booking Payment APIs
export const getBookingPayments = async (): Promise<BookingPayment[]> => {
    const data = await apiRequest<any>('/booking-payments/');
    // Handle both array and paginated response
    if (Array.isArray(data)) {
        return data;
    } else if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return data.results;
    }
    return [];
};

export const getBookingPayment = async (id: number): Promise<BookingPayment> => {
    const data = await apiRequest<BookingPayment>(`/booking-payments/${id}/`);
    return data;
};

export const createBookingPayment = async (paymentData: Partial<BookingPayment>): Promise<BookingPayment> => {
    const data = await apiRequest<BookingPayment>('/booking-payments/', {
        method: 'POST',
        body: JSON.stringify(paymentData),
    });
    return data;
};

export const updateBookingPayment = async (id: number, paymentData: Partial<BookingPayment>): Promise<BookingPayment> => {
    const data = await apiRequest<BookingPayment>(`/booking-payments/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(paymentData),
    });
    return data;
};

export const approveBookingPayment = async (id: number): Promise<{ status: string }> => {
    const data = await apiRequest<{ status: string }>(`/booking-payments/${id}/approve/`, {
        method: 'POST',
    });
    return data;
};

export const clearCheque = async (id: number): Promise<{ status: string }> => {
    const data = await apiRequest<{ status: string }>(`/booking-payments/${id}/clear_cheque/`, {
        method: 'POST',
    });
    return data;
};

export const generateReceipt = async (id: number): Promise<{ message: string }> => {
    const data = await apiRequest<{ message: string }>(`/booking-payments/${id}/generate_receipt/`, {
        method: 'POST',
    });
    return data;
};

export const sendReceipt = async (id: number, method: 'email' | 'whatsapp'): Promise<{ message: string }> => {
    const data = await apiRequest<{ message: string }>(`/booking-payments/${id}/send_receipt/`, {
        method: 'POST',
        body: JSON.stringify({ method }),
    });
    return data;
};

// Receipt APIs
export const getReceipts = async (): Promise<Receipt[]> => {
    const data = await apiRequest<any>('/receipts/');
    if (Array.isArray(data)) {
        return data;
    } else if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return data.results;
    }
    return [];
};

export const getReceipt = async (id: number): Promise<Receipt> => {
    const data = await apiRequest<Receipt>(`/receipts/${id}/`);
    return data;
};

export const downloadReceipt = async (id: number): Promise<{ pdf_url: string }> => {
    const data = await apiRequest<{ pdf_url: string }>(`/receipts/${id}/download/`);
    return data;
};

// Payment Schedule APIs
export const getPaymentSchedules = async (dealId?: number): Promise<PaymentSchedule[]> => {
    const url = dealId ? `/payment-schedules/?deal=${dealId}` : '/payment-schedules/';
    const data = await apiRequest<any>(url);
    if (Array.isArray(data)) {
        return data;
    } else if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return data.results;
    }
    return [];
};

export const createPaymentSchedule = async (scheduleData: Partial<PaymentSchedule>): Promise<PaymentSchedule> => {
    const data = await apiRequest<PaymentSchedule>('/payment-schedules/', {
        method: 'POST',
        body: JSON.stringify(scheduleData),
    });
    return data;
};

export const generateInstallments = async (id: number): Promise<{ message: string }> => {
    const data = await apiRequest<{ message: string }>(`/payment-schedules/${id}/generate_installments/`, {
        method: 'POST',
    });
    return data;
};

// Ledger APIs
export const getLedgers = async (type?: string, customerId?: number, unitId?: number, projectId?: number): Promise<Ledger[]> => {
    let url = '/ledgers/';
    const params = new URLSearchParams();
    if (type) params.append('ledger_type', type);
    if (customerId) params.append('customer', customerId.toString());
    if (unitId) params.append('unit', unitId.toString());
    if (projectId) params.append('project', projectId.toString());
    if (params.toString()) url += `?${params.toString()}`;
    const data = await apiRequest<any>(url);
    if (Array.isArray(data)) {
        return data;
    } else if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return data.results;
    }
    return [];
};

export const getLedgerStatement = async (type: string, customerId?: number, unitId?: number, projectId?: number): Promise<Ledger[]> => {
    const params = new URLSearchParams({ type });
    if (customerId) params.append('customer', customerId.toString());
    if (unitId) params.append('unit', unitId.toString());
    if (projectId) params.append('project', projectId.toString());
    const data = await apiRequest<Ledger[]>(`/ledgers/statement/?${params.toString()}`);
    return data;
};

// Refund APIs
export const getRefunds = async (): Promise<Refund[]> => {
    const data = await apiRequest<any>('/refunds/');
    if (Array.isArray(data)) {
        return data;
    } else if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return data.results;
    }
    return [];
};

export const createRefund = async (refundData: Partial<Refund>): Promise<Refund> => {
    const data = await apiRequest<Refund>('/refunds/', {
        method: 'POST',
        body: JSON.stringify(refundData),
    });
    return data;
};

export const approveRefund = async (id: number): Promise<{ status: string }> => {
    const data = await apiRequest<{ status: string }>(`/refunds/${id}/approve/`, {
        method: 'POST',
    });
    return data;
};

export const processRefund = async (id: number): Promise<{ status: string }> => {
    const data = await apiRequest<{ status: string }>(`/refunds/${id}/process/`, {
        method: 'POST',
    });
    return data;
};

// Bank Reconciliation APIs
export const getBankReconciliations = async (): Promise<BankReconciliation[]> => {
    const data = await apiRequest<any>('/bank-reconciliations/');
    if (Array.isArray(data)) {
        return data;
    } else if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return data.results;
    }
    return [];
};

export const createBankReconciliation = async (reconciliationData: Partial<BankReconciliation>): Promise<BankReconciliation> => {
    const data = await apiRequest<BankReconciliation>('/bank-reconciliations/', {
        method: 'POST',
        body: JSON.stringify(reconciliationData),
    });
    return data;
};

export const matchPayment = async (id: number, paymentId?: number, bookingId?: number): Promise<{ status: string }> => {
    const data = await apiRequest<{ status: string }>(`/bank-reconciliations/${id}/match_payment/`, {
        method: 'POST',
        body: JSON.stringify({ payment_id: paymentId, booking_id: bookingId }),
    });
    return data;
};

