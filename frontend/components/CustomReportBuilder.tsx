import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, PieChart, Pie, Cell } from 'recharts';
import { Lead, Agent, Property, Activity, LeadStatus, LeadTag, PropertyCategory, PropertyStatus, CallOutcome } from '../types';
import { LEAD_SOURCES, MOCK_TEAMS } from '../constants';


export type ReportModule = 'Leads' | 'Calls' | 'Properties' | 'Agents';
export type OutputType = 'Table' | 'Bar Chart' | 'Pie Chart';
export interface CustomReportConfig {
    module: ReportModule;
    fields: string[];
    outputType: OutputType;
    filters?: Record<string, any>;
}
export interface CustomReportTemplate {
    name: string;
    config: CustomReportConfig;
}

interface CustomReportBuilderProps {
    leads: Lead[];
    agents: Agent[];
    properties: Property[];
    calls: (Omit<Activity, 'agent'> & { lead: Lead; agent?: Agent })[];
    savedTemplates: CustomReportTemplate[];
    onSaveTemplate: (template: CustomReportTemplate) => void;
}

const MODULE_FIELDS: Record<ReportModule, string[]> = {
    'Leads': ['name', 'status', 'tag', 'source', 'agentId', 'createdAt', 'lastContacted'],
    'Calls': ['outcome', 'duration', 'qualityScore', 'sentiment', 'agent.name', 'lead.name', 'timestamp'],
    'Properties': ['name', 'category', 'price', 'status', 'location'],
    'Agents': ['name', 'role', 'team', 'monthlyCallsTarget', 'monthlySalesTarget'],
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#64748b'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
                <p className="font-semibold text-sm text-gray-700">{label}</p>
                {payload.map((p: any, i: number) => (
                    <p key={i} style={{ color: p.color }} className="text-xs">{`${p.name}: ${p.value.toLocaleString()}`}</p>
                ))}
            </div>
        );
    }
    return null;
};

const getNestedValue = (obj: any, path: string) => {
    if (!path) return undefined;
    return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
};

export const CustomReportBuilder: React.FC<CustomReportBuilderProps> = ({
    leads, agents, properties, calls, savedTemplates, onSaveTemplate
}) => {
    const [config, setConfig] = useState<Partial<CustomReportConfig>>({ filters: {} });
    const [generatedData, setGeneratedData] = useState<any[] | null>(null);
    const [templateName, setTemplateName] = useState('');

    const FILTER_CONFIG: Record<string, { type: 'select' | 'number_gt', options?: {label: string, value: string | number}[] }> = {
        // Leads
        'status': { type: 'select', options: Object.values(LeadStatus).map(s => ({label: s, value: s})) },
        'tag': { type: 'select', options: Object.values(LeadTag).map(t => ({label: t, value: t})) },
        'source': { type: 'select', options: LEAD_SOURCES.map(s => ({label: s, value: s})) },
        'agentId': { type: 'select', options: agents.map(a => ({label: a.name, value: a.id})) },
        // Properties
        'category': { type: 'select', options: Object.values(PropertyCategory).map(c => ({label: c, value: c})) },
        // Note: 'status' is ambiguous. We will differentiate based on the module.
        // 'property_status': { type: 'select', options: Object.values(PropertyStatus).map(s => ({label: s, value: s})) },
        'price': { type: 'number_gt' },
        // Calls
        'outcome': { type: 'select', options: Object.values(CallOutcome).map(o => ({label: o, value: o})) },
        'sentiment': { type: 'select', options: ['Positive', 'Neutral', 'Negative'].map(s => ({label: s, value: s})) },
        'agent.name': { type: 'select', options: agents.map(a => ({label: a.name, value: a.name})) },
        // Agents
        'role': { type: 'select', options: ['Admin', 'Sales Manager', 'Agent', 'Telecaller'].map(r => ({label: r, value: r})) },
        'team': { type: 'select', options: MOCK_TEAMS.map(t => ({label: t, value: t})) },
    };
    
    // Special handling for the 'status' field which exists in multiple modules
    if (config.module === 'Properties') {
        FILTER_CONFIG['status'] = { type: 'select', options: Object.values(PropertyStatus).map(s => ({label: s, value: s})) };
    } else if (config.module === 'Leads') {
        FILTER_CONFIG['status'] = { type: 'select', options: Object.values(LeadStatus).map(s => ({label: s, value: s})) };
    }

    const getSourceData = (module: ReportModule) => {
        switch (module) {
            case 'Leads': return leads;
            case 'Agents': return agents;
            case 'Properties': return properties;
            case 'Calls': return calls;
            default: return [];
        }
    };

    const generateReport = (reportConfig: CustomReportConfig) => {
        const data = getSourceData(reportConfig.module);

        let filteredData = [...data];
        if (reportConfig.filters) {
            Object.entries(reportConfig.filters).forEach(([field, value]) => {
                if (value === '' || value === undefined) return;

                if (field.endsWith('_gt')) {
                    const actualField = field.replace('_gt', '');
                    filteredData = filteredData.filter(item => {
                        const itemValue = getNestedValue(item, actualField);
                        return typeof itemValue === 'number' && itemValue > Number(value);
                    });
                } else {
                    filteredData = filteredData.filter(item => {
                        const itemValue = getNestedValue(item, field);
                        return String(itemValue) === String(value);
                    });
                }
            });
        }

        if (reportConfig.outputType === 'Table') {
            const tableData = filteredData.map(item => {
                const row: Record<string, any> = {};
                reportConfig.fields!.forEach(field => {
                    row[field] = getNestedValue(item, field);
                });
                return row;
            });
            setGeneratedData(tableData);
        } else { // Bar or Pie Chart
            const aggregationField = reportConfig.fields[0];
            const counts = filteredData.reduce((acc, item) => {
                const key = getNestedValue(item, aggregationField) || 'N/A';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const chartData = Object.entries(counts).map(([name, count]) => ({ name, count }));
            setGeneratedData(chartData);
        }
    };

    const handleFieldToggle = (field: string) => {
        setConfig(prev => {
            const currentFields = prev.fields || [];
            const newFields = currentFields.includes(field)
                ? currentFields.filter(f => f !== field)
                : [...currentFields, field];
            return { ...prev, fields: newFields };
        });
    };

    const handleFilterChange = (field: string, value: string) => {
        setConfig(prev => ({
            ...prev,
            filters: {
                ...prev.filters,
                [field]: value,
            }
        }));
    };
    
    const handleGenerateReportClick = () => {
        if (!config.module || !config.fields || config.fields.length === 0 || !config.outputType) {
            alert('Please select a module, at least one field, and an output type.');
            return;
        }
        generateReport(config as CustomReportConfig);
    };
    
    const handleSaveTemplate = () => {
        if (!templateName) {
            alert('Please enter a name for the template.');
            return;
        }
        if (!config.module || !config.fields || config.fields.length === 0 || !config.outputType) {
            alert('Cannot save an incomplete report configuration.');
            return;
        }
        onSaveTemplate({ name: templateName, config: config as CustomReportConfig });
        setTemplateName('');
    };

    const handleLoadTemplate = (template: CustomReportTemplate) => {
        setConfig(template.config);
        generateReport(template.config);
    };
    
    const renderFilterInput = (field: string) => {
        const filterInfo = FILTER_CONFIG[field];
        if (!filterInfo) return null;

        if (filterInfo.type === 'number_gt') {
            const filterKey = `${field}_gt`;
            return (
                <div key={filterKey}>
                    <label className="block text-xs font-medium text-gray-600">Min. {field}</label>
                    <input
                        type="number"
                        placeholder="e.g., 500000"
                        value={config.filters?.[filterKey] || ''}
                        onChange={(e) => handleFilterChange(filterKey, e.target.value)}
                        className="p-2 border border-gray-300 rounded-md shadow-sm text-sm w-full mt-1"
                    />
                </div>
            );
        }
        
        if (filterInfo.type === 'select') {
            return (
                <div key={field}>
                    <label className="block text-xs font-medium text-gray-600 capitalize">{field.split('.').pop()}</label>
                    <select
                        value={config.filters?.[field] || ''}
                        onChange={(e) => handleFilterChange(field, e.target.value)}
                        className="p-2 border border-gray-300 rounded-md shadow-sm text-sm w-full mt-1"
                    >
                        <option value="">All</option>
                        {filterInfo.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
            );
        }
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="p-4 border rounded-lg bg-gray-50/50">
                <h3 className="font-semibold text-lg text-gray-700 mb-4">Report Builder</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {/* Step 1 & 2 */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">1. Select Module</label>
                            <select
                                value={config.module || ''}
                                onChange={(e) => setConfig({ module: e.target.value as ReportModule, fields: [], outputType: 'Table', filters: {} })}
                                className="p-2 border border-gray-300 rounded-md shadow-sm text-sm w-full"
                            >
                                <option value="" disabled>Choose data source...</option>
                                {(['Leads', 'Calls', 'Properties', 'Agents'] as ReportModule[]).map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">2. Select Fields</label>
                            <div className="p-3 border border-gray-300 rounded-md bg-white grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                                {config.module ? MODULE_FIELDS[config.module].map(field => (
                                    <label key={field} className="flex items-center space-x-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={config.fields?.includes(field) || false}
                                            onChange={() => handleFieldToggle(field)}
                                            className="rounded border-gray-300 text-primary-600 shadow-sm"
                                        />
                                        <span>{field}</span>
                                    </label>
                                )) : <p className="text-xs text-gray-500 col-span-full">Select a module to see fields.</p>}
                            </div>
                            {config.outputType !== 'Table' && config.fields && config.fields.length > 0 && 
                                <p className="text-xs text-gray-500 mt-1">Chart will be based on the first selected field: <strong>{config.fields[0]}</strong></p>
                            }
                        </div>
                    </div>
                     {/* Step 3 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">3. Apply Filters (Optional)</label>
                        <div className="p-3 border border-gray-300 rounded-md bg-white grid grid-cols-2 md:grid-cols-3 gap-4 min-h-[10rem]">
                            {config.fields?.map(field => renderFilterInput(field)).filter(Boolean).length > 0 ?
                                config.fields?.map(field => renderFilterInput(field))
                                : <p className="text-xs text-gray-500 col-span-full self-center text-center">Select fields to see available filters.</p>
                            }
                        </div>
                    </div>
                </div>
                {/* Step 4 & Generate Button */}
                <div className="mt-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">4. Select Output</label>
                        <div className="flex items-center space-x-2 p-1 bg-gray-200 rounded-lg">
                            {(['Table', 'Bar Chart', 'Pie Chart'] as OutputType[]).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setConfig(prev => ({ ...prev, outputType: type }))}
                                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                                        config.outputType === type ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:bg-gray-300'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleGenerateReportClick} className="self-end px-6 py-2 bg-primary-600 text-white font-semibold rounded-md shadow-sm hover:bg-primary-700 w-full md:w-auto">
                        Generate Report
                    </button>
                </div>
            </div>

            {generatedData && (
                <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg text-gray-700 mb-4">Generated Report</h3>
                    {config.outputType === 'Table' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        {config.fields?.map(field => <th key={field} className="px-4 py-3">{field}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {generatedData.map((row, index) => (
                                        <tr key={index} className="bg-white border-b hover:bg-gray-50">
                                            {config.fields?.map(field => <td key={field} className="px-4 py-4">{String(row[field] === undefined ? 'N/A' : row[field])}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {config.outputType === 'Bar Chart' && (
                         <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={generatedData}>
                               <CartesianGrid strokeDasharray="3 3" />
                               <XAxis dataKey="name" />
                               <YAxis />
                               <Tooltip content={<CustomTooltip />} />
                               <Bar dataKey="count" fill="#3b82f6" name="Count" />
                           </BarChart>
                        </ResponsiveContainer>
                    )}
                    {config.outputType === 'Pie Chart' && (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={generatedData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                    {generatedData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            )}
            
            <div className="p-4 border rounded-lg bg-gray-50/50">
                 <h3 className="font-semibold text-lg text-gray-700 mb-4">Report Templates</h3>
                 <div className="flex flex-col md:flex-row gap-4 mb-4">
                     <input 
                        type="text" 
                        value={templateName} 
                        onChange={(e) => setTemplateName(e.target.value)} 
                        placeholder="New template name..." 
                        className="p-2 border border-gray-300 rounded-md shadow-sm text-sm flex-grow"
                    />
                     <button onClick={handleSaveTemplate} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700">
                        Save Current as Template
                    </button>
                 </div>
                 {savedTemplates.length > 0 && (
                     <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Saved Templates</h4>
                         <div className="flex flex-wrap gap-2">
                             {savedTemplates.map((template, index) => (
                                 <button key={index} onClick={() => handleLoadTemplate(template)} className="px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm hover:bg-gray-100">
                                     {template.name}
                                 </button>
                             ))}
                         </div>
                     </div>
                 )}
            </div>

        </div>
    );
};