import { LeadStatus } from "../../types";

export interface DashboardStats {
    totalAttemptedCalls: { value: number; change: number };
    totalInterested: { value: number; change: number };
    totalDealsDone: { value: number; change: number };
    unAttemptedLeads: { value: number; change: number };
    todaysPendingCalls: { value: number; change: number };
    totalLeads: { value: number; change: number };
    oldPendingFollowUps: { value: number; change: number };
}

export interface ChartData {
    name: string;
    value: number;
    // Fix: Added index signature to make the type compatible with the 'recharts' Pie component,
    // which expects a more generic object type that allows for arbitrary properties.
    [key: string]: any;
}

export interface CallsVsDealsData {
    name: string;
    calls: number;
    deals: number;
}

export interface DailyPerformanceData {
    date: string;
    calls: number;
}

export interface RecentFollowUp {
    // Fix: Task IDs can be string or number.
    id: string | number;
    leadName: string;
    followUpDate: string;
    status: LeadStatus;
}