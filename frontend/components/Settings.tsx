import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Agent, Integration, IntegrationCategory, WhatsAppTemplate, AutomationRule } from '../types';
import { 
    PhoneIcon, WhatsAppIcon, EmailIcon, SparklesIcon,
    TwilioIcon, GmailIcon, OutlookIcon, ZohoIcon, HubSpotIcon, RazorpayIcon, PaytmIcon, GoogleCalendarIcon, LinkIcon
} from './icons/IconComponents';
import { UserManagement } from './UserManagement';
import { View } from '../App';
import { AutomationSettings } from './AutomationSettings';
import { TemplateManager } from './TemplateManager';

interface SettingsProps {
    agents: Agent[];
    teams: string[];
    onUpdateAgent: (agent: Agent) => void;
    onCreateTeam: (teamName: string) => void;
    onRenameTeam: (oldName: string, newName: string) => void;
    onDeleteTeam: (teamName: string) => void;
    setView: (view: View) => void;
    whatsappTemplates: WhatsAppTemplate[];
    onAddTemplate: (template: Omit<WhatsAppTemplate, 'id'>) => void;
    onUpdateTemplate: (template: WhatsAppTemplate) => void;
    onDeleteTemplate: (id: string | number) => void;
    automationRules: AutomationRule[];
    onUpdateAutomationRule: (ruleId: string, updates: Partial<AutomationRule>) => void;
}

const initialIntegrationsData: Omit<Integration, 'logo'>[] = [
    { name: 'Twilio', category: IntegrationCategory.Telephony, connected: true },
    { name: 'Exotel', category: IntegrationCategory.Telephony, connected: false },
    { name: 'Knowlarity', category: IntegrationCategory.Telephony, connected: false },
    { name: 'MyOperator', category: IntegrationCategory.Telephony, connected: false },
    { name: 'WhatsApp Business', category: IntegrationCategory.Messaging, connected: true },
    { name: 'Gmail', category: IntegrationCategory.Email, connected: true },
    { name: 'Outlook', category: IntegrationCategory.Email, connected: false },
    { name: 'SMTP', category: IntegrationCategory.Email, connected: false },
    { name: 'Zoho CRM', category: IntegrationCategory.CRMSync, connected: false },
    { name: 'HubSpot', category: IntegrationCategory.CRMSync, connected: true },
    { name: 'Razorpay', category: IntegrationCategory.Payment, connected: true },
    { name: 'Paytm', category: IntegrationCategory.Payment, connected: false },
    { name: 'Google Calendar', category: IntegrationCategory.Calendar, connected: true },
];

const getIntegrationLogo = (name: string) => {
    const iconClass = "w-8 h-8";
    switch(name) {
        case 'Twilio': return <TwilioIcon className={iconClass} />;
        case 'Exotel': return <PhoneIcon className={`${iconClass} text-blue-500`} />;
        case 'Knowlarity': return <PhoneIcon className={`${iconClass} text-red-500`} />;
        case 'MyOperator': return <PhoneIcon className={`${iconClass} text-green-500`} />;
        case 'WhatsApp Business': return <WhatsAppIcon className={`${iconClass} text-green-600`} />;
        case 'Gmail': return <GmailIcon className={iconClass} />;
        case 'Outlook': return <OutlookIcon className={iconClass} />;
        case 'SMTP': return <EmailIcon className={`${iconClass} text-gray-500`} />;
        case 'Zoho CRM': return <ZohoIcon className={iconClass} />;
        case 'HubSpot': return <HubSpotIcon className={iconClass} />;
        case 'Razorpay': return <RazorpayIcon className={iconClass} />;
        case 'Paytm': return <PaytmIcon className={iconClass} />;
        case 'Google Calendar': return <GoogleCalendarIcon className={iconClass} />;
        default: return <LinkIcon className={iconClass} />;
    }
}

const IntegrationItem: React.FC<{ integration: Integration, onToggle: (name: string) => void }> = ({ integration, onToggle }) => (
    <div className="p-4 border bg-gray-50/50 rounded-lg flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-start mb-4">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-white p-1 shadow-sm">
                {integration.logo}
            </div>
            <div className="ml-4">
                <p className="font-semibold text-gray-800">{integration.name}</p>
                <div className="flex items-center text-xs mt-1">
                    <span className={`h-2 w-2 rounded-full mr-1.5 ${integration.connected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    <span className={integration.connected ? 'text-green-600 font-medium' : 'text-gray-500'}>
                        {integration.connected ? 'Connected' : 'Not Connected'}
                    </span>
                </div>
            </div>
        </div>
        <button 
            onClick={() => onToggle(integration.name)}
            className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                integration.connected 
                ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100' 
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
        >
            {integration.connected ? 'Manage' : 'Connect'}
        </button>
    </div>
);

const Integrations: React.FC = () => {
    const [integrations, setIntegrations] = useState<Integration[]>(() => 
        initialIntegrationsData.map(int => ({ ...int, logo: getIntegrationLogo(int.name) }))
    );

    const handleToggleConnection = (name: string) => {
        setIntegrations(prev => 
            prev.map(int => 
                int.name === name ? { ...int, connected: !int.connected } : int
            )
        );
    };

    const groupedIntegrations = integrations.reduce((acc, int) => {
        if (!acc[int.category]) {
            acc[int.category] = [];
        }
        acc[int.category].push(int);
        return acc;
    }, {} as Record<IntegrationCategory, Integration[]>);

    return (
        <Card>
            <div className="flex items-center mb-6">
                 <div className="p-3 bg-primary-100 text-primary-600 rounded-full mr-4">
                    <SparklesIcon className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Integrations</h2>
                    <p className="text-sm text-gray-500">Connect Zenith Estate with your favorite tools to streamline your workflow.</p>
                </div>
            </div>
            
            {Object.entries(groupedIntegrations).map(([category, items]) => (
                <div key={category} className="mb-8 last:mb-0">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(items as Integration[]).map(integration => (
                            <IntegrationItem 
                                key={integration.name} 
                                integration={integration} 
                                onToggle={handleToggleConnection} 
                            />
                        ))}
                    </div>
                </div>
            ))}
        </Card>
    );
};

const MobileAppSettings: React.FC = () => (
    <Card>
        <div className="flex flex-col md:flex-row items-center">
            <img src="https://i.imgur.com/8Q9g6aC.png" alt="Mobile App" className="w-48 h-auto rounded-lg shadow-md mr-0 md:mr-8 mb-6 md:mb-0" />
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Zenith Estate on the Go</h2>
                <p className="text-gray-600 mt-2">Manage your leads, calls, and tasks from anywhere with our fully-featured mobile app. Get real-time notifications, track site visits with GPS, and add voice notes for quick updates.</p>
                <div className="mt-6 flex space-x-4">
                    <a href="#" className="inline-block">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" className="h-12" />
                    </a>
                    <a href="#" className="inline-block">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on the App Store" className="h-12" />
                    </a>
                </div>
            </div>
        </div>
    </Card>
);

const ToggleSwitch: React.FC<{ isEnabled: boolean; onToggle: () => void; }> = ({ isEnabled, onToggle }) => (
    <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isEnabled ? 'bg-primary-600' : 'bg-gray-200'}`}
    >
        <span
            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`}
        />
    </button>
);

const BiometricsSettings: React.FC = () => {
    const [fingerprintEnabled, setFingerprintEnabled] = useState(true);
    const [gpsEnabled, setGpsEnabled] = useState(false);

    return (
        <Card>
            <h2 className="text-xl font-bold text-gray-800">Biometric & Location Settings</h2>
            <p className="text-sm text-gray-500 mt-1 mb-6">Configure advanced attendance tracking methods for your team.</p>
            <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded-lg bg-gray-50/50">
                    <div>
                        <h4 className="font-semibold text-gray-800">Enable Fingerprint Check-in</h4>
                        <p className="text-sm text-gray-500 mt-1">Allow users to check in/out using biometric fingerprint scanners.</p>
                    </div>
                    <ToggleSwitch isEnabled={fingerprintEnabled} onToggle={() => setFingerprintEnabled(p => !p)} />
                </div>
                <div className="flex justify-between items-center p-4 border rounded-lg bg-gray-50/50">
                    <div>
                        <h4 className="font-semibold text-gray-800">Enable GPS Location on Check-in</h4>
                        <p className="text-sm text-gray-500 mt-1">Capture user's GPS location on check-in/out for field agent tracking.</p>
                    </div>
                    <ToggleSwitch isEnabled={gpsEnabled} onToggle={() => setGpsEnabled(p => !p)} />
                </div>
            </div>
        </Card>
    );
}

export const Settings: React.FC<Omit<SettingsProps, 'onSeedAgents' | 'IS_DEMO_MODE'>> = (props) => {
    const { agents, teams, onUpdateAgent, onCreateTeam, onRenameTeam, onDeleteTeam, setView, whatsappTemplates, onAddTemplate, onUpdateTemplate, onDeleteTemplate, automationRules, onUpdateAutomationRule } = props;
    const [activeTab, setActiveTab] = useState('users');

    const TabButton: React.FC<{label: string, tabName: string}> = ({ label, tabName }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`whitespace-nowrap py-3 px-4 font-semibold text-sm rounded-t-lg transition-colors ${
                activeTab === tabName
                    ? 'border-b-2 border-primary-600 text-primary-600 bg-primary-50'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
            
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <TabButton label="Users & Teams" tabName="users" />
                    <TabButton label="Templates" tabName="templates" />
                    <TabButton label="Biometrics" tabName="biometrics" />
                    <TabButton label="Integrations" tabName="integrations" />
                    <TabButton label="Automation" tabName="automation" />
                    <TabButton label="Mobile App" tabName="mobile" />
                </nav>
            </div>

            <div className="mt-6">
                {activeTab === 'users' && <UserManagement agents={agents} teams={teams} onUpdateAgent={onUpdateAgent} onCreateTeam={onCreateTeam} onRenameTeam={onRenameTeam} onDeleteTeam={onDeleteTeam} setView={setView} />}
                {activeTab === 'templates' && <TemplateManager templates={whatsappTemplates} onAdd={onAddTemplate} onUpdate={onUpdateTemplate} onDelete={onDeleteTemplate} />}
                {activeTab === 'biometrics' && <BiometricsSettings />}
                {activeTab === 'integrations' && <Integrations />}
                {activeTab === 'automation' && <AutomationSettings rules={automationRules} onUpdateRule={onUpdateAutomationRule} />}
                {activeTab === 'mobile' && <MobileAppSettings />}
            </div>
        </div>
    );
};
