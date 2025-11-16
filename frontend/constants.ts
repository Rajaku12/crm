import { Lead, Agent, LeadTag, LeadStatus, ActivityType, CallOutcome, Property, PropertyCategory, PropertyStatus, TaskType, ReminderType, WhatsAppTemplate, Notification, AutomationRule, Client, Occupation, ClientLeadSource } from './types';

export const MOCK_AGENTS: Agent[] = [
    { 
        id: 1, 
        name: 'Alex Morgan', 
        email: 'alex.morgan@zenith.com',
        role: 'Admin', 
        avatarUrl: 'https://i.pravatar.cc/150?u=alex', 
        team: 'Alpha Team', 
        monthlyCallsTarget: 150, 
        monthlySalesTarget: 5,
        isActive: true,
        contact: '9876543210',
        pan: 'ABCDE1234F',
        dealsIn: 'Residential, Commercial',
        city: 'Miami',
        state: 'Florida',
        attendance: [
            {
                id: 1,
                agentId: 1,
                checkInTime: '2024-08-01T09:02:00Z',
                checkOutTime: '2024-08-01T17:35:00Z',
                duration: 513,
                method: 'Manual',
                location: 'Office HQ',
            },
            {
                id: 2,
                agentId: 1,
                checkInTime: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
                checkOutTime: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
                duration: 495,
                method: 'Fingerprint',
                location: 'Client Site A',
            },
            {
                id: 3,
                agentId: 1,
                checkInTime: new Date(new Date().setHours(9, 5, 0, 0)).toISOString(),
                method: 'Manual',
                location: 'Office HQ',
            }
        ]
    },
    { 
        id: 2, 
        name: 'Jessica Chen', 
        email: 'jessica.chen@zenith.com', 
        role: 'Sales Manager', 
        avatarUrl: 'https://i.pravatar.cc/150?u=jessica', 
        team: 'Alpha Team', 
        monthlyCallsTarget: 120, 
        monthlySalesTarget: 8,
        isActive: true,
        attendance: [],
        contact: '9123456780',
        pan: 'FGHIJ5678K',
        dealsIn: 'Residential',
        city: 'Mumbai',
        state: 'Maharashtra',
        reportsTo: '1', // Reports to Alex Morgan
    },
    { 
        id: 3, 
        name: 'Michael Lee', 
        email: 'michael.lee@zenith.com', 
        role: 'Agent', 
        avatarUrl: 'https://i.pravatar.cc/150?u=michael', 
        team: 'Bravo Team', 
        monthlyCallsTarget: 100, 
        monthlySalesTarget: 3,
        isActive: true,
        attendance: [],
        contact: '9988776655',
        dealsIn: 'Commercial',
        city: 'Delhi',
        state: 'Delhi',
        reportsTo: '2', // Reports to Jessica Chen
    },
    { 
        id: 4, 
        name: 'Sarah Evans', 
        email: 'sarah.evans@zenith.com', 
        role: 'Telecaller', 
        avatarUrl: 'https://i.pravatar.cc/150?u=sarah', 
        team: 'Bravo Team', 
        monthlyCallsTarget: 200, 
        monthlySalesTarget: 1,
        isActive: true,
        attendance: [],
        contact: '9000011111',
        dealsIn: 'Residential',
        city: 'Bangalore',
        state: 'Karnataka',
        reportsTo: '2', // Reports to Jessica Chen
    },
    { 
        id: 5, 
        name: 'Chris Green', 
        email: 'chris.green@zenith.com', 
        role: 'Customer Support', 
        avatarUrl: 'https://i.pravatar.cc/150?u=chris', 
        team: 'Support Team',
        isActive: false,
        attendance: [],
        reportsTo: '1', // Reports to Alex Morgan
    },
];

export const MOCK_TEAMS: string[] = ['Alpha Team', 'Bravo Team', 'Support Team', 'Unassigned'];

export const ROLE_PERMISSIONS: Record<Agent['role'], string[]> = {
    'Admin': [
        'Full access to all CRM features',
        'Manage users, roles, and teams',
        'Configure system settings and integrations',
        'View all leads, calls, and reports',
        'Delete sensitive records',
    ],
    'Sales Manager': [
        'View and manage all leads for their team',
        'Assign leads to agents within their team',
        'Access team performance reports',
        'Cannot manage users or system settings',
    ],
    'Agent': [
        'Access and manage their own assigned leads',
        'Log calls, send messages, and manage tasks',
        'View their own performance dashboard',
        'Cannot view leads of other agents',
    ],
    'Telecaller': [
        'Add new leads to the system',
        'View leads they have personally created',
        'Limited access to lead details and history',
    ],
    'Customer Support': [
        'Read-only access to all leads',
        'Read-only access to all clients',
        'Cannot modify any data',
        'Cannot access user management or settings',
    ],
};

// Use empty arrays for transactional mock data
export const MOCK_PROPERTIES: Property[] = [];
export const MOCK_LEADS: Lead[] = [];
export const MOCK_CLIENTS: Client[] = [];
export const MOCK_NOTIFICATIONS: Notification[] = [];

export const LEAD_SOURCES: string[] = ['Website Form', 'Facebook Ads', 'Google Ads', 'MagicBricks', '99acres', 'Referral', 'Walk-in'];
export const PRODUCT_OPTIONS: string[] = ['Villa', 'Condo', 'Family Home', 'Loft', 'Commercial Space'];
export const SERVICE_OPTIONS: string[] = ['Mortgage Assistance', 'Legal Consultation', 'Interior Design', 'Property Management'];

export const MOCK_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
    { id: 1, name: 'Welcome Message', content: 'Hi {{lead_name}}, thank you for your interest in Zenith Estate. My name is {{agent_name}} and I will be assisting you. How can I help you today?' },
    { id: 2, name: 'Property Details', content: 'Hi {{lead_name}}, as requested, here are the details for the property: {{property_name}}. You can view more here: [link]. Let me know if you would like to schedule a visit!' },
    { id: 3, name: 'Site Visit Confirmation', content: 'Hi {{lead_name}}, this is a confirmation for your site visit to {{property_name}} on {{date}} at {{time}}. We look forward to seeing you!' },
    { id: 4, name: 'Payment Reminder', content: 'Hi {{lead_name}}, this is a friendly reminder that your payment of {{amount}} is due on {{date}}. Please let us know if you have any questions.' },
];

export const INITIAL_AUTOMATION_RULES: AutomationRule[] = [
    {
        id: 'stale-lead-reminder',
        title: 'Automatic Follow-Up Reminders',
        description: 'Send alerts if an active lead hasn’t been contacted within 24 hours.',
        isEnabled: true,
        channels: {
            dashboard: true,
            email: false,
            whatsapp: false,
        }
    },
    {
        id: 'missed-call-task',
        title: 'Create Follow-up for Missed Calls',
        description: 'If a call to a lead is marked as "Missed", automatically create a high-priority follow-up task for the assigned agent.',
        isEnabled: true,
    },
    {
        id: 'cold-lead-nurture',
        title: 'Nurture Cold Leads',
        description: 'For leads tagged as "Cold" with no activity for 14 days, send an automated check-in email to re-engage them.',
        isEnabled: false,
    },
     {
        id: 'site-visit-feedback',
        title: 'Post Site Visit Feedback Request',
        description: '24 hours after a "Site Visit" status is logged, send an automated message asking for feedback.',
        isEnabled: true,
    },
];

export const INDIAN_STATES: string[] = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"
];

export const OCCUPATION_OPTIONS: Occupation[] = Object.values(Occupation);
export const CLIENT_LEAD_SOURCES: ClientLeadSource[] = Object.values(ClientLeadSource);
