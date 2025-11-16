
import React, { useState } from 'react';
import { Card } from './ui/Card';
import { SparklesIcon } from './icons/IconComponents';
import { AutomationRule } from '../types';

interface AutomationSettingsProps {
    rules: AutomationRule[];
    onUpdateRule: (ruleId: string, updates: Partial<AutomationRule>) => void;
}

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

const ChannelToggle: React.FC<{ label: string; isEnabled: boolean; onToggle: () => void; }> = ({ label, isEnabled, onToggle }) => (
    <label className="flex items-center space-x-2 cursor-pointer">
        <input type="checkbox" checked={isEnabled} onChange={onToggle} className="rounded border-gray-300 text-primary-600 shadow-sm focus:ring-primary-500" />
        <span className="text-sm text-gray-600">{label}</span>
    </label>
);


const AutomationRuleItem: React.FC<{ rule: AutomationRule; onUpdateRule: (id: string, updates: Partial<AutomationRule>) => void; }> = ({ rule, onUpdateRule }) => (
    <div className="p-4 border rounded-lg bg-gray-50/50">
        <div className="flex justify-between items-start">
            <div>
                <h4 className="font-semibold text-gray-800">{rule.title}</h4>
                <p className="text-sm text-gray-500 mt-1 max-w-xl">{rule.description}</p>
            </div>
            <ToggleSwitch isEnabled={rule.isEnabled} onToggle={() => onUpdateRule(rule.id, { isEnabled: !rule.isEnabled })} />
        </div>
        {rule.channels && rule.isEnabled && (
            <div className="mt-4 pt-4 border-t border-gray-200">
                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Notification Channels</h5>
                <div className="flex items-center space-x-6">
                    <ChannelToggle 
                        label="Dashboard" 
                        isEnabled={rule.channels.dashboard} 
                        onToggle={() => onUpdateRule(rule.id, { channels: { ...rule.channels!, dashboard: !rule.channels!.dashboard }})} 
                    />
                    <ChannelToggle 
                        label="Email (Simulated)" 
                        isEnabled={rule.channels.email} 
                        onToggle={() => onUpdateRule(rule.id, { channels: { ...rule.channels!, email: !rule.channels!.email }})} 
                    />
                    <ChannelToggle 
                        label="WhatsApp (Simulated)" 
                        isEnabled={rule.channels.whatsapp} 
                        onToggle={() => onUpdateRule(rule.id, { channels: { ...rule.channels!, whatsapp: !rule.channels!.whatsapp }})} 
                    />
                </div>
            </div>
        )}
    </div>
);

export const AutomationSettings: React.FC<AutomationSettingsProps> = ({ rules, onUpdateRule }) => {
    return (
        <Card>
            <div className="flex items-center mb-6">
                 <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full mr-4">
                    <SparklesIcon className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Automation Rules</h2>
                    <p className="text-sm text-gray-500">Automate repetitive tasks to save time and improve lead engagement.</p>
                </div>
            </div>
            <div className="space-y-4">
                {rules.map(rule => (
                    <AutomationRuleItem key={rule.id} rule={rule} onUpdateRule={onUpdateRule} />
                ))}
            </div>
        </Card>
    );
};
