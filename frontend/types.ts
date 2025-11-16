
import React from 'react';

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}

// Fix: Export GeminiApiCaller type.
// FIX: Renamed ApiCaller to GeminiApiCaller to match usage in AppContext.
export type GeminiApiCaller = <T>(apiCall: () => Promise<T>) => Promise<T>;

export enum LeadTag {
    Hot = 'Hot',
    Warm = 'Warm',
    Cold = 'Cold',
}

export enum LeadStatus {
    New = 'New',
    Contacted = 'Contacted',
    SiteVisit = 'Site Visit',
    Negotiation = 'Negotiation',
    Approved = 'Approved',
    Closed = 'Closed',
    Rejected = 'Rejected',
    Lost = 'Lost',
}

export enum ActivityType {
    Call = 'Call',
    WhatsApp = 'WhatsApp',
    Email = 'Email',
    Note = 'Note',
    StatusChange = 'Status Change',
    AISummary = 'AI Summary',
    AssignmentChange = 'Assignment Change',
    Chatbot = 'Chatbot',
    SiteVisitCheckIn = 'Site Visit Check-in',
    VoiceNote = 'Voice Note',
}

export enum CallOutcome {
    Success = 'Success',
    NoAnswer = 'No Answer',
    Voicemail = 'Voicemail',
    Busy = 'Busy',
    Missed = 'Missed',
}

export enum PropertyCategory {
    Residential = 'Residential',
    Commercial = 'Commercial',
}

export enum PropertyStatus {
    Available = 'Available',
    Sold = 'Sold',
    Rented = 'Rented',
    UnderOffer = 'Under Offer',
}

export interface Property {
    id: string | number;
    name: string;
    category: PropertyCategory;
    price: number;
    status: PropertyStatus;
    location: string;
    description: string;
    images: string[];
    floorPlanUrl?: string;
    documents?: { name: string; url: string }[];
    stats: {
        views: number;
        inquiries: number;
        conversions: number;
    };
}

export type ActivitySentiment = 'Positive' | 'Neutral' | 'Negative';

export interface Activity {
    id: string | number;
    type: ActivityType;
    timestamp: string;
    agent: string;
    notes: string;
    duration?: number; // for calls
    recordingUrl?: string; // for calls
    outcome?: CallOutcome; // for calls
    qualityScore?: number; // AI-driven score from 1-5
    sentiment?: ActivitySentiment; // AI-driven sentiment
    keywords?: string[]; // AI-driven keywords
    subject?: string; // for emails
    transcript?: string; // AI-generated transcript
    location?: string; // for site visits
    audioUrl?: string; // for voice notes
    sourceActivityId?: string | number; // For AI-generated activities like summaries
}

export enum TaskType {
    Call = 'Call',
    Meeting = 'Meeting',
    Email = 'Email',
    FollowUp = 'Follow-up',
    Paperwork = 'Paperwork',
}

export enum ReminderType {
    None = 'None',
    FifteenMinutes = '15 minutes before',
    OneHour = '1 hour before',
    OneDay = '1 day before',
}


export interface Task {
    id: string | number;
    title: string;
    dueDate: string;
    dueTime?: string;
    isCompleted: boolean;
    type: TaskType;
    reminder?: ReminderType;
}

export interface Lead {
    id: string | number;
    name: string;
    phone: string;
    email: string;
    tag: LeadTag;
    status: LeadStatus;
    source: string;
    agentId: number | string;
    createdAt: string;
    lastContacted: string;
    propertyId?: string | number;
    description?: string;
    products?: string[];
    services?: string[];
    activities: Activity[];
    tasks?: Task[];
    createdBy?: string; // UID of the user who created the lead
    managerId?: string; // UID of the manager of the assigned agent
}

export interface AttendanceRecord {
    id: string | number;
    agentId: number | string;
    checkInTime: string;
    checkOutTime?: string;
    duration?: number; // in minutes
    method?: 'Manual' | 'Fingerprint';
    location?: string;
}

export interface Agent {
    id: number | string; // Can be number for mock, string (UID) for prod
    name: string;
    email: string;
    role: 'Admin' | 'Sales Manager' | 'Agent' | 'Telecaller' | 'Customer Support';
    avatarUrl: string;
    team?: string;
    monthlyCallsTarget?: number;
    monthlySalesTarget?: number;
    attendance?: AttendanceRecord[];
    reportsTo?: string; // UID of the manager/admin they report to
    isActive?: boolean;
    // New detailed fields
    contact?: string;
    dob?: string;
    pan?: string;
    dealsIn?: string;
    address?: string;
    city?: string;
    state?: string;
    pinCode?: string;
}

export enum IntegrationCategory {
    Telephony = 'Telephony APIs',
    Messaging = 'Messaging & WhatsApp',
    Email = 'Email',
    CRMSync = 'CRM Sync',
    Payment = 'Payment Gateways',
    Calendar = 'Calendar Sync',
    Mobile = 'Mobile App',
}

export interface Integration {
    name: string;
    category: IntegrationCategory;
    logo: React.ReactNode;
    connected: boolean;
}

export interface WhatsAppTemplate {
    id: string | number;
    name: string;
    content: string;
}

export interface Notification {
    id: string | number;
    leadName: string;
    leadId: string | number;
    type: 'New Lead' | 'Missed Call' | 'Task Reminder' | 'Follow-up Reminder';
    message: string;
    timestamp: string;
    isRead: boolean;
}

export interface AutomationRule {
    id: string;
    title: string;
    description: string;
    isEnabled: boolean;
    channels?: {
        dashboard: boolean;
        email: boolean;
        whatsapp: boolean;
    };
}

export enum Occupation {
    SelfEmployed = 'Self Employee',
    GovtEmployee = 'Govt Employee',
    PrivateEmployee = 'Private Employee',
    Other = 'Other',
}

export enum ClientLeadSource {
    Website = 'Website',
    Referral = 'Referral',
    SocialMedia = 'Social Media',
    Direct = 'Direct',
    Other = 'Other',
}

export interface Client {
    id: string | number;
    name: string;
    contact: string;
    email: string;
    dob?: string;
    pan?: string;
    address?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    occupation: Occupation;
    organization?: string;
    designation?: string;
    leadSource: ClientLeadSource;
    createdAt: string;
    updatedAt: string;
}

// ==================== DEAL TYPES ====================

export interface Deal {
    id: number;
    lead?: any;
    property?: any;
    stage: string;
    agent: number;
    client?: number;
    booking_date?: string;
    agreement_date?: string;
    registry_date?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

// ==================== PAYMENT MANAGEMENT TYPES ====================

export interface Project {
    id: number;
    name: string;
    code: string;
    location: string;
    city: string;
    state: string;
    builder_name: string;
    builder_pan?: string;
    builder_gstin?: string;
    builder_address: string;
    builder_signature_url?: string;
    builder_qr_code_url?: string;
    rera_number?: string;
    status: string;
    towers_count?: number;
    created_at: string;
    updated_at: string;
}

export interface Tower {
    id: number;
    project: number;
    project_name?: string;
    name: string;
    code: string;
    total_floors: number;
    floors_count?: number;
    created_at: string;
}

export interface Floor {
    id: number;
    tower: number;
    tower_name?: string;
    project_name?: string;
    floor_number: number;
    name?: string;
    units_count?: number;
    created_at: string;
}

export interface Unit {
    id: number;
    floor: number;
    property_link?: number;
    unit_number: string;
    unit_type: string;
    carpet_area?: number;
    built_up_area?: number;
    super_area?: number;
    base_price: number;
    status: string;
    full_address?: string;
    project_name?: string;
    tower_name?: string;
    floor_number?: number;
    created_at: string;
}

export enum BookingPaymentStatus {
    Pending = 'Pending',
    Received = 'Received',
    Cleared = 'Cleared',
    Bounced = 'Bounced',
    Refunded = 'Refunded',
}

export enum PaymentMethod {
    UPI = 'UPI',
    BankTransfer = 'Bank Transfer',
    Cheque = 'Cheque',
    Cash = 'Cash',
    Online = 'Online',
    Card = 'Card',
    Razorpay = 'Razorpay',
    Stripe = 'Stripe',
    Cashfree = 'Cashfree',
    PayPal = 'PayPal',
}

export interface BookingPayment {
    id: number;
    booking_id: string;
    deal: number;
    unit: number;
    unit_address?: string;
    client: number;
    client_name?: string;
    amount: number;
    payment_method: PaymentMethod;
    transaction_id?: string;
    reference_number?: string;
    payment_date: string;
    status: BookingPaymentStatus;
    cheque_number?: string;
    cheque_date?: string;
    cheque_bank?: string;
    cheque_cleared: boolean;
    cheque_cleared_date?: string;
    rtgs_neft_utr?: string;
    upi_reference?: string;
    receipt_generated: boolean;
    receipt_pdf_url?: string;
    whatsapp_sent: boolean;
    email_sent: boolean;
    notes?: string;
    created_by?: number;
    created_by_name?: string;
    approved_by?: number;
    approved_by_name?: string;
    created_at: string;
    updated_at: string;
}

export enum ReceiptType {
    Booking = 'Booking',
    Installment = 'Installment',
    Final = 'Final',
    Refund = 'Refund',
}

export interface Receipt {
    id: number;
    receipt_number: string;
    receipt_type: ReceiptType;
    booking_payment?: number;
    payment?: number;
    refund?: number;
    deal: number;
    client: number;
    client_name?: string;
    unit: number;
    unit_address?: string;
    amount: number;
    payment_method: string;
    transaction_reference?: string;
    receipt_date: string;
    pdf_url?: string;
    email_sent: boolean;
    whatsapp_sent: boolean;
    created_at: string;
}

export enum PaymentSchedulePlanType {
    ConstructionLinked = 'Construction Linked Plan (CLP)',
    TimeBased = 'Time Based',
    DownPayment = 'Down Payment Plan',
    Custom = 'Custom',
}

export interface PaymentMilestone {
    id: number;
    payment_schedule: number;
    milestone_name: string;
    milestone_percentage: number;
    amount: number;
    due_date?: string;
    completed: boolean;
    completed_date?: string;
    order: number;
}

export interface PaymentSchedule {
    id: number;
    deal: number;
    deal_info?: string;
    plan_type: PaymentSchedulePlanType;
    name: string;
    total_contract_value: number;
    booking_amount: number;
    number_of_installments: number;
    auto_reminder: boolean;
    reminder_days_before: number[];
    auto_invoice: boolean;
    is_active: boolean;
    milestones?: PaymentMilestone[];
    created_at: string;
}

export enum LedgerType {
    Customer = 'Customer',
    Unit = 'Unit',
    Project = 'Project',
}

export interface Ledger {
    id: number;
    ledger_type: LedgerType;
    customer?: number;
    customer_name?: string;
    unit?: number;
    unit_address?: string;
    project?: number;
    project_name?: string;
    transaction_date: string;
    transaction_type: string;
    reference_number?: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    created_at: string;
}

export enum RefundStatus {
    Pending = 'Pending',
    Approved = 'Approved',
    Processed = 'Processed',
    Rejected = 'Rejected',
}

export enum RefundReason {
    ChequeBounced = 'Cheque Bounced',
    BookingCancelled = 'Booking Cancelled',
    ExcessAmount = 'Excess Amount',
    ProjectDelay = 'Project Delay',
    Other = 'Other',
}

export interface Refund {
    id: number;
    refund_id: string;
    deal: number;
    deal_info?: string;
    booking_payment?: number;
    payment?: number;
    amount: number;
    reason: RefundReason;
    cancellation_charges: number;
    net_refund_amount: number;
    status: RefundStatus;
    notes?: string;
    requested_by?: number;
    requested_by_name?: string;
    approved_by?: number;
    approved_by_name?: string;
    approved_at?: string;
    processed_at?: string;
    created_at: string;
}

export enum BankReconciliationStatus {
    Pending = 'Pending',
    Matched = 'Matched',
    Unmatched = 'Unmatched',
}

export interface BankReconciliation {
    id: number;
    bank_name: string;
    account_number: string;
    transaction_date: string;
    transaction_type: string;
    amount: number;
    reference_number?: string;
    utr_number?: string;
    description?: string;
    status: BankReconciliationStatus;
    matched_payment?: number;
    matched_booking?: number;
    reconciled_by?: number;
    reconciled_by_name?: string;
    reconciled_at?: string;
    created_at: string;
}