
import { Lead, ActivityType, LeadStatus, CallOutcome, LeadTag } from './types';

export const formatDuration = (totalSeconds: number): string => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return 'N/A';
    if (totalSeconds === 0) return '0s';

    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.slice(0, 2).join(' '); // Show at most 2 units for brevity
};


export const calculateResponseTime = (lead: Lead): string | null => {
    if (!lead.createdAt) return null;

    const creationTime = new Date(lead.createdAt).getTime();
    
    const firstContactActivity = lead.activities
        .filter(a => [ActivityType.Call, ActivityType.WhatsApp, ActivityType.Email].includes(a.type))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0];

    if (!firstContactActivity) return null;

    const firstContactTime = new Date(firstContactActivity.timestamp).getTime();
    const diffInSeconds = Math.round((firstContactTime - creationTime) / 1000);

    return formatDuration(diffInSeconds);
};

export const getTagFromScore = (score: number): LeadTag => {
    if (score >= 70) return LeadTag.Hot;
    if (score >= 40) return LeadTag.Warm;
    return LeadTag.Cold;
};

export const timeSince = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} years ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} months ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} days ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} hours ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} minutes ago`;
    if (seconds < 10) return "just now";
    return `${Math.floor(seconds)} seconds ago`;
};
