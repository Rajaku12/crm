import { Lead, Agent, ActivityType, LeadStatus, TaskType } from "../types";
import { DashboardStats, CallsVsDealsData, ChartData, DailyPerformanceData, RecentFollowUp } from "../components/dashboard/dashboardTypes";

export type DateFilterOption = 'today' | 'week' | 'month' | 'all';

const filterByDate = (items: (Lead | { timestamp: string })[], filter: DateFilterOption) => {
    if (filter === 'all') return items;
    
    const now = new Date();
    let startDate = new Date();

    if (filter === 'today') {
        startDate.setHours(0, 0, 0, 0);
    } else if (filter === 'week') {
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
    } else if (filter === 'month') {
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
    }

    return items.filter(item => {
        const itemDateStr = 'createdAt' in item ? item.createdAt : item.timestamp;
        const itemDate = new Date(itemDateStr);
        return itemDate >= startDate;
    });
};

export const getDashboardStats = (
    allLeads: Lead[],
    allAgents: Agent[],
    dateFilter: DateFilterOption,
    agentFilter: number | string | 'all'
): { stats: DashboardStats; charts: any; followUps: RecentFollowUp[] } => {
    
    // Use loose equality (==) here to handle '1' == 1, since select values are strings.
    const leads = agentFilter === 'all'
        ? allLeads
        : allLeads.filter(lead => lead.agentId == agentFilter);
        
    const filteredLeads = filterByDate(leads, dateFilter) as Lead[];

    const allCalls = leads.flatMap(l => l.activities).filter(a => a.type === ActivityType.Call);
    const filteredCalls = filterByDate(allCalls, dateFilter) as (typeof allCalls);

    const allTasks = leads.flatMap(l => l.tasks?.map(t => ({ ...t, lead: l })) || []);

    // --- METRICS ---
    const totalAttemptedCalls = filteredCalls.length;
    const totalInterested = filteredLeads.filter(l => [LeadStatus.SiteVisit, LeadStatus.Negotiation].includes(l.status)).length;
    const totalDealsDone = filteredLeads.filter(l => l.status === LeadStatus.Closed).length;
    
    // Un-attempted needs to check all leads for the filtered agent(s), not just date-filtered ones
    const unAttemptedLeads = leads.filter(l => !l.activities.some(a => a.type === ActivityType.Call)).length;
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const todaysPendingCalls = allTasks.filter(t => 
        !t.isCompleted &&
        t.type === TaskType.Call &&
        t.dueDate === todayStr
    ).length;

    const totalLeads = leads.length;

    const oldPendingFollowUps = allTasks.filter(t => 
        !t.isCompleted &&
        t.type === TaskType.FollowUp &&
        new Date(t.dueDate) < now
    ).length;

    const stats: DashboardStats = {
        totalAttemptedCalls: { value: totalAttemptedCalls, change: 5 },
        totalInterested: { value: totalInterested, change: 2 },
        totalDealsDone: { value: totalDealsDone, change: 1 },
        unAttemptedLeads: { value: unAttemptedLeads, change: -3 },
        todaysPendingCalls: { value: todaysPendingCalls, change: 0 },
        totalLeads: { value: totalLeads, change: 10 },
        oldPendingFollowUps: { value: oldPendingFollowUps, change: 4 },
    };

    // --- CHARTS ---
    const callsVsDealsData: CallsVsDealsData[] = [{
        name: 'Performance',
        calls: totalAttemptedCalls,
        deals: totalDealsDone
    }];

    const interestedCount = filteredLeads.filter(l => [LeadStatus.SiteVisit, LeadStatus.Negotiation].includes(l.status)).length;
    const notInterestedCount = filteredLeads.filter(l => [LeadStatus.Rejected, LeadStatus.Lost].includes(l.status)).length;

    const interestData: ChartData[] = [
        { name: 'Interested', value: interestedCount },
        { name: 'Not Interested', value: notInterestedCount },
    ];
    
    const leadsByStatus = filteredLeads.reduce((acc, lead) => {
        const status = lead.status || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const leadsByStatusData: ChartData[] = Object.entries(leadsByStatus).map(([name, value]) => ({ name, value }));


    const callsByDay = filteredCalls.reduce((acc, call) => {
        const date = new Date(call.timestamp).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const dailyPerformanceData: DailyPerformanceData[] = Object.entries(callsByDay)
        .map(([date, calls]) => ({ date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), calls }))
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    // --- RECENT FOLLOW UPS ---
    const followUps: RecentFollowUp[] = allTasks
        .filter(t => t.type === TaskType.FollowUp && !t.isCompleted)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5)
        .map(t => ({
            id: t.id,
            leadName: t.lead.name,
            followUpDate: new Date(t.dueDate).toLocaleDateString(),
            status: t.lead.status
        }));
        
    return {
        stats,
        charts: {
            callsVsDealsData,
            interestData,
            dailyPerformanceData,
            leadsByStatusData
        },
        followUps
    };
};