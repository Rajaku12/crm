
import React from 'react';
import { CallOutcome } from '../../types';
import { ChecklistIcon, ExclamationTriangleIcon, PhoneXMarkIcon, QuestionMarkCircleIcon, InboxIcon } from '../icons/IconComponents';

interface OutcomeBadgeProps {
    outcome: CallOutcome;
}

export const OutcomeBadge: React.FC<OutcomeBadgeProps> = ({ outcome }) => {
    const outcomeConfig: Record<CallOutcome, { icon: React.ReactNode, colorClasses: string }> = {
        [CallOutcome.Success]: {
            icon: <ChecklistIcon className="h-4 w-4" />,
            colorClasses: 'bg-green-100 text-green-800',
        },
        [CallOutcome.Missed]: {
            icon: <ExclamationTriangleIcon className="h-4 w-4" />,
            colorClasses: 'bg-orange-100 text-orange-800',
        },
        [CallOutcome.NoAnswer]: {
            icon: <QuestionMarkCircleIcon className="h-4 w-4" />,
            colorClasses: 'bg-yellow-100 text-yellow-800',
        },
        [CallOutcome.Voicemail]: {
            icon: <InboxIcon className="h-4 w-4" />,
            colorClasses: 'bg-blue-100 text-blue-800',
        },
        [CallOutcome.Busy]: {
            icon: <PhoneXMarkIcon className="h-4 w-4" />,
            colorClasses: 'bg-red-100 text-red-800',
        },
    };

    const config = outcomeConfig[outcome];
    if (!config) {
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{outcome}</span>;
    }

    return (
        <span className={`inline-flex items-center gap-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${config.colorClasses}`}>
            {config.icon}
            {outcome}
        </span>
    );
};
