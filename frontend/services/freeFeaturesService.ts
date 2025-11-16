import { Activity, CallOutcome, Lead, LeadStatus, LeadTag } from '../types';

// --- Free, Rule-Based Lead Scoring ---
export const scoreLead = (lead: Lead): number => {
    let score = 0;

    // 1. Score based on Status (max 100)
    const statusPoints: Partial<Record<LeadStatus, number>> = {
        [LeadStatus.New]: 5,
        [LeadStatus.Contacted]: 15,
        [LeadStatus.SiteVisit]: 40,
        [LeadStatus.Negotiation]: 60,
        [LeadStatus.Approved]: 80,
        [LeadStatus.Closed]: 100,
        [LeadStatus.Rejected]: -10,
        [LeadStatus.Lost]: -20,
    };
    score += statusPoints[lead.status] || 0;

    // 2. Score based on Tag (max 20)
    const tagPoints: Partial<Record<LeadTag, number>> = {
        [LeadTag.Hot]: 20,
        [LeadTag.Warm]: 10,
    };
    score += tagPoints[lead.tag] || 0;

    // 3. Score based on Recency (max 10)
    const lastContactedDate = new Date(lead.lastContacted);
    const daysSinceContact = (new Date().getTime() - lastContactedDate.getTime()) / (1000 * 3600 * 24);
    if (daysSinceContact <= 3) {
        score += 10;
    } else if (daysSinceContact > 14) {
        score -= 15;
    }

    // 4. Score based on Activity count (max 20)
    score += Math.min(lead.activities.length * 2, 20);
    
    // Normalize score to be between 0 and 100
    const normalizedScore = Math.max(0, Math.min(Math.round(score / 1.5), 100));

    return normalizedScore;
};


// --- Free, Rule-Based Call Analysis ---
export const analyzeCallQuality = (callActivity: Activity): number => {
    let score = 3; // Start with a neutral score
    if (callActivity.outcome === CallOutcome.Success) score += 1;
    if ((callActivity.duration || 0) > 300) score += 1; // Over 5 minutes
    if (callActivity.outcome === CallOutcome.Missed || callActivity.outcome === CallOutcome.NoAnswer) score -= 1;
    if (callActivity.notes.length < 20) score -=1;

    return Math.max(1, Math.min(score, 5)); // Clamp score between 1 and 5
};

export const analyzeCallContent = (callActivity: Activity): { sentiment: 'Positive' | 'Neutral' | 'Negative' } => {
    const positiveWords = ['great', 'deal', 'interested', 'happy', 'perfect', 'yes', 'agree', 'purchase'];
    const negativeWords = ['problem', 'not', 'issue', 'cancel', 'expensive', 'wait', 'difficult'];
    
    const notes = callActivity.notes.toLowerCase();
    let sentimentScore = 0;

    positiveWords.forEach(word => {
        if (notes.includes(word)) sentimentScore++;
    });
    negativeWords.forEach(word => {
        if (notes.includes(word)) sentimentScore--;
    });
    
    if (sentimentScore > 0) return { sentiment: 'Positive' };
    if (sentimentScore < 0) return { sentiment: 'Negative' };
    return { sentiment: 'Neutral' };
};

// --- Free, Template-Based Summaries ---
export const summarizeCall = (lead: Lead, callActivity: Activity): string => {
    const duration = callActivity.duration ? `${Math.floor(callActivity.duration / 60)}m ${callActivity.duration % 60}s` : 'N/A';
    const notesPreview = callActivity.notes.substring(0, 100) + (callActivity.notes.length > 100 ? '...' : '');

    return `Generated Summary:
- **Lead:** ${lead.name}
- **Outcome:** ${callActivity.outcome || 'N/A'}
- **Duration:** ${duration}
- **Notes:** ${notesPreview}`;
};

export const summarizeReportData = (reportTitle: string, data: any): string => {
    let summary = `**Summary for ${reportTitle}**\n\n`;

    if (data.totalRevenue !== undefined) {
        summary += `*   **Total Revenue:** ${data.totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}\n`;
    }
    if (data.totalSales !== undefined) {
        summary += `*   **Total Properties Sold:** ${data.totalSales}\n`;
    }
    if (data.totalLeads !== undefined) {
        summary += `*   **Total New Leads:** ${data.totalLeads}\n`;
    }
    if (data.conversionRate !== undefined) {
        summary += `*   **Conversion Rate:** ${data.conversionRate}%\n`;
    }
     if (data.totalCalls !== undefined) {
        summary += `*   **Total Calls Made:** ${data.totalCalls}\n`;
    }

    return summary;
};
