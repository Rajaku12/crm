from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    Agent, Property, Lead, Activity, Task, Client,
    AttendanceRecord, WhatsAppTemplate, AutomationRule, Notification,
    Deal, Invoice, Payment, PaymentPlan, Installment, Quote,
    Commission, CommissionSplit, CustomerPortalUser, Document, FileAccessLog,
    IntegrationConfig, InvoiceTemplate, QuoteTemplate, EmailTemplate,
    AgreementTemplate, WorkflowRule, WorkflowAction,
    CallLog, TelephonyConfig, Chatbot, ChatbotConversation, ChatbotMessage, ChatbotQualificationRule
)


@admin.register(Agent)
class AgentAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'role', 'team', 'is_active', 'is_staff')
    list_filter = ('role', 'team', 'is_active', 'is_staff')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('CRM Information', {
            'fields': ('role', 'avatar_url', 'team', 'monthly_calls_target', 
                      'monthly_sales_target', 'reports_to', 'contact', 'dob', 
                      'pan', 'deals_in', 'address', 'city', 'state', 'pin_code')
        }),
    )


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'status', 'location')
    list_filter = ('category', 'status')
    search_fields = ('name', 'location', 'description')


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'email', 'tag', 'status', 'agent', 'source')
    list_filter = ('tag', 'status', 'source', 'agent')
    search_fields = ('name', 'phone', 'email')
    raw_id_fields = ('agent', 'created_by', 'property')


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ('lead', 'type', 'agent_name', 'timestamp')
    list_filter = ('type', 'timestamp')
    search_fields = ('lead__name', 'agent_name', 'notes')


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('lead', 'title', 'type', 'due_date', 'is_completed')
    list_filter = ('type', 'is_completed', 'due_date')
    search_fields = ('title', 'lead__name')


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact', 'email', 'occupation', 'lead_source')
    list_filter = ('occupation', 'lead_source')
    search_fields = ('name', 'contact', 'email')


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ('agent', 'check_in_time', 'check_out_time', 'duration')
    list_filter = ('check_in_time', 'method')
    search_fields = ('agent__username',)


@admin.register(WhatsAppTemplate)
class WhatsAppTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'content')
    search_fields = ('name', 'content')


@admin.register(AutomationRule)
class AutomationRuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_enabled')
    list_filter = ('is_enabled',)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('lead_name', 'type', 'is_read', 'timestamp')
    list_filter = ('type', 'is_read', 'timestamp')
    search_fields = ('lead_name', 'message')


# ==================== DEAL ADMIN ====================

@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = ('id', 'lead', 'property', 'deal_value', 'stage', 'agent', 'created_at')
    list_filter = ('stage', 'agent', 'created_at')
    search_fields = ('lead__name', 'property__name', 'agent__username')
    raw_id_fields = ('lead', 'property', 'agent', 'client')


# ==================== INVOICE ADMIN ====================

@admin.register(PaymentPlan)
class PaymentPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'deal', 'frequency', 'installment_amount', 'number_of_installments', 'is_active')
    list_filter = ('frequency', 'is_active', 'auto_reminder', 'auto_invoice')
    search_fields = ('name', 'deal__lead__name')
    raw_id_fields = ('deal',)


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'deal', 'client', 'total_amount', 'status', 'due_date', 'created_at')
    list_filter = ('status', 'trigger_point', 'due_date', 'created_at')
    search_fields = ('invoice_number', 'deal__lead__name', 'client__name')
    raw_id_fields = ('deal', 'client', 'payment_plan')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('payment_id', 'invoice', 'amount', 'method', 'payment_date', 'created_by')
    list_filter = ('method', 'payment_date', 'created_at')
    search_fields = ('payment_id', 'transaction_id', 'invoice__invoice_number')
    raw_id_fields = ('invoice', 'created_by')


@admin.register(Installment)
class InstallmentAdmin(admin.ModelAdmin):
    list_display = ('payment_plan', 'installment_number', 'amount', 'due_date', 'is_paid', 'paid_date')
    list_filter = ('is_paid', 'due_date', 'reminder_sent')
    search_fields = ('payment_plan__name',)
    raw_id_fields = ('payment_plan', 'invoice')


# ==================== QUOTE ADMIN ====================

@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display = ('quote_number', 'lead', 'property', 'status', 'total_amount', 'validity_date', 'created_at')
    list_filter = ('status', 'client_approval_status', 'manager_approval_status', 'created_at')
    search_fields = ('quote_number', 'lead__name', 'property__name')
    raw_id_fields = ('lead', 'property', 'client', 'created_by', 'manager', 'converted_to_deal', 'parent_quote')


# ==================== COMMISSION ADMIN ====================

@admin.register(Commission)
class CommissionAdmin(admin.ModelAdmin):
    list_display = ('deal', 'agent', 'commission_type', 'calculated_amount', 'status', 'paid_date')
    list_filter = ('commission_type', 'status', 'role', 'paid_date')
    search_fields = ('deal__lead__name', 'agent__username')
    raw_id_fields = ('deal', 'agent')


@admin.register(CommissionSplit)
class CommissionSplitAdmin(admin.ModelAdmin):
    list_display = ('commission', 'agent', 'split_percentage', 'allocated_amount', 'role')
    list_filter = ('role',)
    search_fields = ('agent__username', 'commission__deal__lead__name')
    raw_id_fields = ('commission', 'agent')


# ==================== CUSTOMER PORTAL ADMIN ====================

@admin.register(CustomerPortalUser)
class CustomerPortalUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'phone', 'user_type', 'is_active', 'last_login', 'created_at')
    list_filter = ('user_type', 'is_active', 'created_at')
    search_fields = ('email', 'phone')
    raw_id_fields = ('client', 'lead')


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'deal', 'quote', 'lead', 'uploaded_by', 'created_at')
    list_filter = ('type', 'is_watermarked', 'requires_otp', 'created_at')
    search_fields = ('name', 'deal__lead__name')
    raw_id_fields = ('deal', 'quote', 'lead', 'uploaded_by')


@admin.register(FileAccessLog)
class FileAccessLogAdmin(admin.ModelAdmin):
    list_display = ('document', 'portal_user', 'ip_address', 'accessed_at', 'otp_verified')
    list_filter = ('otp_verified', 'accessed_at')
    search_fields = ('document__name', 'portal_user__email')
    raw_id_fields = ('document', 'portal_user')


# ==================== INTEGRATION ADMIN ====================

@admin.register(IntegrationConfig)
class IntegrationConfigAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'provider', 'is_enabled', 'created_at')
    list_filter = ('type', 'provider', 'is_enabled')
    search_fields = ('name', 'provider')


# ==================== TEMPLATE ADMIN ====================

@admin.register(InvoiceTemplate)
class InvoiceTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_default', 'created_at')
    list_filter = ('is_default', 'created_at')
    search_fields = ('name',)


@admin.register(QuoteTemplate)
class QuoteTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_default', 'created_at')
    list_filter = ('is_default', 'created_at')
    search_fields = ('name',)


@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'subject', 'is_default', 'created_at')
    list_filter = ('is_default', 'created_at')
    search_fields = ('name', 'subject')


@admin.register(AgreementTemplate)
class AgreementTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_default', 'created_at')
    list_filter = ('is_default', 'created_at')
    search_fields = ('name',)


# ==================== WORKFLOW ADMIN ====================

@admin.register(WorkflowRule)
class WorkflowRuleAdmin(admin.ModelAdmin):
    list_display = ('name', 'trigger', 'is_enabled', 'created_at')
    list_filter = ('trigger', 'is_enabled', 'created_at')
    search_fields = ('name', 'description')


@admin.register(WorkflowAction)
class WorkflowActionAdmin(admin.ModelAdmin):
    list_display = ('workflow_rule', 'action_type', 'order', 'is_enabled')
    list_filter = ('action_type', 'is_enabled')
    search_fields = ('workflow_rule__name',)
    raw_id_fields = ('workflow_rule',)


# ==================== CALL LOGGING ADMIN ====================

@admin.register(CallLog)
class CallLogAdmin(admin.ModelAdmin):
    list_display = ('call_sid', 'from_number', 'to_number', 'direction', 'status', 'duration', 'lead', 'agent', 'initiated_at')
    list_filter = ('direction', 'status', 'provider', 'initiated_at')
    search_fields = ('call_sid', 'from_number', 'to_number', 'lead__name', 'agent__username')
    raw_id_fields = ('lead', 'agent', 'activity')
    readonly_fields = ('initiated_at', 'answered_at', 'ended_at', 'created_at', 'updated_at')


@admin.register(TelephonyConfig)
class TelephonyConfigAdmin(admin.ModelAdmin):
    list_display = ('name', 'provider', 'is_active', 'is_default', 'phone_number', 'created_at')
    list_filter = ('provider', 'is_active', 'is_default')
    search_fields = ('name', 'phone_number')


# ==================== CHATBOT ADMIN ====================

@admin.register(Chatbot)
class ChatbotAdmin(admin.ModelAdmin):
    list_display = ('name', 'provider', 'status', 'qualification_enabled', 'auto_create_lead', 'created_at')
    list_filter = ('provider', 'status', 'qualification_enabled', 'auto_create_lead')
    search_fields = ('name',)


@admin.register(ChatbotConversation)
class ChatbotConversationAdmin(admin.ModelAdmin):
    list_display = ('conversation_id', 'chatbot', 'visitor_name', 'visitor_email', 'status', 'is_qualified', 'qualification_score', 'started_at')
    list_filter = ('status', 'is_qualified', 'chatbot', 'started_at')
    search_fields = ('conversation_id', 'visitor_name', 'visitor_email', 'visitor_phone')
    raw_id_fields = ('chatbot', 'lead', 'assigned_agent')
    readonly_fields = ('started_at', 'ended_at', 'last_message_at', 'created_at', 'updated_at')


@admin.register(ChatbotMessage)
class ChatbotMessageAdmin(admin.ModelAdmin):
    list_display = ('conversation', 'message_type', 'content', 'intent', 'confidence', 'timestamp')
    list_filter = ('message_type', 'timestamp')
    search_fields = ('content', 'conversation__conversation_id')
    raw_id_fields = ('conversation',)
    readonly_fields = ('timestamp',)


@admin.register(ChatbotQualificationRule)
class ChatbotQualificationRuleAdmin(admin.ModelAdmin):
    list_display = ('chatbot', 'name', 'field_name', 'field_type', 'required', 'order', 'is_active')
    list_filter = ('field_type', 'required', 'is_active', 'chatbot')
    search_fields = ('name', 'question', 'chatbot__name')
    raw_id_fields = ('chatbot',)

