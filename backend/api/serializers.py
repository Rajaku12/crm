from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import (
    Agent, Property, Lead, Activity, Task, Client,
    AttendanceRecord, WhatsAppTemplate, AutomationRule, Notification,
    Deal, Invoice, Payment, PaymentPlan, Installment, Quote,
    Commission, CommissionSplit, CustomerPortalUser, Document, FileAccessLog,
    IntegrationConfig, InvoiceTemplate, QuoteTemplate, EmailTemplate,
    AgreementTemplate, WorkflowRule, WorkflowAction,
    CallLog, TelephonyConfig, Chatbot, ChatbotConversation, ChatbotMessage, ChatbotQualificationRule,
    Project, Tower, Floor, Unit, BookingPayment, Receipt, GSTConfiguration, TaxBreakdown,
    PaymentSchedule, PaymentMilestone, Ledger, Refund, CreditNote, BankReconciliation
)


class AgentSerializer(serializers.ModelSerializer):
    """Serializer for Agent model"""
    name = serializers.SerializerMethodField()
    reports_to_id = serializers.PrimaryKeyRelatedField(
        source='reports_to',
        queryset=Agent.objects.all(),
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Agent
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 'name',
            'role', 'team', 'contact', 'dob', 'pan', 'deals_in', 'address',
            'city', 'state', 'pin_code', 'avatar_url', 'monthly_calls_target',
            'monthly_sales_target', 'reports_to', 'reports_to_id', 'is_active',
            'date_joined'
        )
        read_only_fields = ('id', 'date_joined')
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
        }
    
    def get_name(self, obj):
        """Return full name or username"""
        if obj.first_name or obj.last_name:
            return f"{obj.first_name} {obj.last_name}".strip()
        return obj.username
    
    def create(self, validated_data):
        """Create a new agent with password"""
        password = validated_data.pop('password', None)
        agent = Agent.objects.create(**validated_data)
        if password:
            agent.set_password(password)
            agent.save()
        return agent
    
    def update(self, instance, validated_data):
        """Update agent, handling password separately"""
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class PropertySerializer(serializers.ModelSerializer):
    """Serializer for Property model"""
    stats = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = (
            'id', 'name', 'category', 'price', 'status', 'location',
            'description', 'images', 'floor_plan_url', 'stats',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_stats(self, obj):
        """Calculate and return property statistics"""
        return obj.stats


class ActivitySerializer(serializers.ModelSerializer):
    """Serializer for Activity model"""
    agent = serializers.CharField(source='agent_name', read_only=True)
    agent_name = serializers.CharField(write_only=True, required=False)
    source_activity_id = serializers.PrimaryKeyRelatedField(
        source='source_activity',
        queryset=Activity.objects.all(),
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Activity
        fields = (
            'id', 'lead', 'agent', 'agent_name', 'type', 'notes', 'timestamp',
            'duration', 'recording_url', 'outcome', 'quality_score',
            'sentiment', 'keywords', 'transcript', 'subject', 'location',
            'audio_url', 'source_activity', 'source_activity_id'
        )
        read_only_fields = ('id', 'timestamp')
    
    def create(self, validated_data):
        """Create activity, setting agent_name from request user if not provided"""
        agent_name = validated_data.pop('agent_name', None)
        if not agent_name and self.context.get('request'):
            user = self.context['request'].user
            agent_name = user.name
        validated_data['agent_name'] = agent_name or 'System'
        return super().create(validated_data)


class TaskSerializer(serializers.ModelSerializer):
    """Serializer for Task model"""
    
    class Meta:
        model = Task
        fields = (
            'id', 'lead', 'title', 'due_date', 'due_time', 'is_completed',
            'type', 'reminder'
        )
        read_only_fields = ('id',)


class LeadSerializer(serializers.ModelSerializer):
    """Serializer for Lead model with nested activities and tasks"""
    activities = ActivitySerializer(many=True, read_only=True)
    tasks = TaskSerializer(many=True, read_only=True)
    agent_id = serializers.PrimaryKeyRelatedField(
        source='agent',
        queryset=Agent.objects.all(),
        write_only=True,
        required=False
    )
    property_id = serializers.PrimaryKeyRelatedField(
        source='property',
        queryset=Property.objects.all(),
        required=False,
        allow_null=True,
        write_only=True
    )
    agent = serializers.SerializerMethodField()
    property = PropertySerializer(read_only=True)
    created_by = serializers.SerializerMethodField()
    
    class Meta:
        model = Lead
        fields = (
            'id', 'name', 'phone', 'email', 'tag', 'status', 'source',
            'agent', 'agent_id', 'created_by', 'property', 'property_id',
            'description', 'products', 'services', 'last_contacted',
            'created_at', 'updated_at', 'activities', 'tasks'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'last_contacted')
    
    def get_agent(self, obj):
        """Return agent details"""
        return {
            'id': obj.agent.id,
            'name': obj.agent.name,
            'email': obj.agent.email,
        }
    
    def get_created_by(self, obj):
        """Return created_by user ID"""
        if obj.created_by:
            return obj.created_by.id
        return None
    
    def create(self, validated_data):
        """Create lead, setting created_by and agent from request user if not provided"""
        request = self.context.get('request')
        if request:
            if 'created_by' not in validated_data:
                validated_data['created_by'] = request.user
            if 'agent' not in validated_data:
                validated_data['agent'] = request.user
        return super().create(validated_data)


class ClientSerializer(serializers.ModelSerializer):
    """Serializer for Client model"""
    leadSource = serializers.CharField(source='lead_source', read_only=True)
    lead_source = serializers.CharField(write_only=True)
    
    class Meta:
        model = Client
        fields = (
            'id', 'name', 'contact', 'email', 'dob', 'pan', 'address',
            'city', 'state', 'pin_code', 'occupation', 'organization',
            'designation', 'lead_source', 'leadSource', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class AttendanceRecordSerializer(serializers.ModelSerializer):
    """Serializer for AttendanceRecord model"""
    agent_id = serializers.PrimaryKeyRelatedField(
        source='agent',
        queryset=Agent.objects.all(),
        write_only=True
    )
    agent = AgentSerializer(read_only=True)
    
    class Meta:
        model = AttendanceRecord
        fields = (
            'id', 'agent', 'agent_id', 'check_in_time', 'check_out_time',
            'duration', 'method', 'location'
        )
        read_only_fields = ('id',)


class WhatsAppTemplateSerializer(serializers.ModelSerializer):
    """Serializer for WhatsAppTemplate model"""
    
    class Meta:
        model = WhatsAppTemplate
        fields = ('id', 'name', 'content')
        read_only_fields = ('id',)


class AutomationRuleSerializer(serializers.ModelSerializer):
    """Serializer for AutomationRule model"""
    channels = serializers.SerializerMethodField()
    
    class Meta:
        model = AutomationRule
        fields = (
            'id', 'title', 'description', 'is_enabled', 'channels',
            'channels_dashboard', 'channels_email', 'channels_whatsapp'
        )
        read_only_fields = ('id',)
    
    def get_channels(self, obj):
        """Return channels as dictionary"""
        return obj.channels
    
    def create(self, validated_data):
        """Create automation rule with channels"""
        channels_data = validated_data.pop('channels', {})
        rule = AutomationRule.objects.create(**validated_data)
        if channels_data:
            rule.channels_dashboard = channels_data.get('dashboard', True)
            rule.channels_email = channels_data.get('email', False)
            rule.channels_whatsapp = channels_data.get('whatsapp', False)
            rule.save()
        return rule
    
    def update(self, instance, validated_data):
        """Update automation rule with channels"""
        channels_data = validated_data.pop('channels', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if channels_data is not None:
            instance.channels_dashboard = channels_data.get('dashboard', instance.channels_dashboard)
            instance.channels_email = channels_data.get('email', instance.channels_email)
            instance.channels_whatsapp = channels_data.get('whatsapp', instance.channels_whatsapp)
        instance.save()
        return instance


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""
    
    class Meta:
        model = Notification
        fields = (
            'id', 'lead_name', 'lead_id', 'type', 'message',
            'timestamp', 'is_read'
        )
        read_only_fields = ('id', 'timestamp')


# Authentication Serializers
class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = Agent
        fields = (
            'username', 'email', 'password', 'password2', 'first_name',
            'last_name', 'role', 'team', 'contact'
        )
    
    def validate(self, attrs):
        """Validate that passwords match"""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        """Create new user"""
        validated_data.pop('password2')
        user = Agent.objects.create_user(**validated_data)
        return user


# ==================== DEAL SERIALIZERS ====================

class DealSerializer(serializers.ModelSerializer):
    """Serializer for Deal model"""
    lead_name = serializers.CharField(source='lead.name', read_only=True)
    property_name = serializers.CharField(source='property.name', read_only=True)
    agent_name = serializers.CharField(source='agent.name', read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True)
    
    class Meta:
        model = Deal
        fields = (
            'id', 'lead', 'lead_name', 'property', 'property_name',
            'deal_value', 'stage', 'agent', 'agent_name', 'client', 'client_name',
            'booking_date', 'agreement_date', 'registry_date', 'notes',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


# ==================== INVOICE SERIALIZERS ====================

class PaymentPlanSerializer(serializers.ModelSerializer):
    """Serializer for PaymentPlan model"""
    deal_info = serializers.SerializerMethodField()
    
    class Meta:
        model = PaymentPlan
        fields = (
            'id', 'deal', 'deal_info', 'name', 'frequency', 'installment_amount',
            'total_amount', 'number_of_installments', 'start_date',
            'auto_reminder', 'auto_invoice', 'is_active', 'created_at'
        )
        read_only_fields = ('id', 'created_at')
    
    def get_deal_info(self, obj):
        return {
            'id': obj.deal.id,
            'lead_name': obj.deal.lead.name,
            'property_name': obj.deal.property.name
        }


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model"""
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    
    class Meta:
        model = Payment
        fields = (
            'id', 'payment_id', 'invoice', 'invoice_number', 'amount', 'method',
            'transaction_id', 'payment_date', 'reference_number', 'notes',
            'created_by', 'created_by_name', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for Invoice model"""
    deal_info = serializers.SerializerMethodField()
    client_info = serializers.SerializerMethodField()
    payments = PaymentSerializer(many=True, read_only=True)
    paid_amount = serializers.ReadOnlyField()
    remaining_amount = serializers.ReadOnlyField()
    
    class Meta:
        model = Invoice
        fields = (
            'id', 'invoice_number', 'deal', 'deal_info', 'client', 'client_info',
            'amount', 'tax_amount', 'total_amount', 'due_date', 'status',
            'trigger_point', 'payment_plan', 'installment_number', 'pdf_url',
            'email_sent', 'email_sent_at', 'tax_config', 'notes',
            'payments', 'paid_amount', 'remaining_amount',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'paid_amount', 'remaining_amount')
    
    def get_deal_info(self, obj):
        return {
            'id': obj.deal.id,
            'lead_name': obj.deal.lead.name,
            'property_name': obj.deal.property.name,
            'deal_value': str(obj.deal.deal_value)
        }
    
    def get_client_info(self, obj):
        if obj.client:
            return {
                'id': obj.client.id,
                'name': obj.client.name,
                'email': obj.client.email,
                'contact': obj.client.contact
            }
        return None


class InstallmentSerializer(serializers.ModelSerializer):
    """Serializer for Installment model"""
    payment_plan_name = serializers.CharField(source='payment_plan.name', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True, allow_null=True)
    
    class Meta:
        model = Installment
        fields = (
            'id', 'payment_plan', 'payment_plan_name', 'invoice', 'invoice_number',
            'installment_number', 'due_date', 'amount', 'paid_amount', 'is_paid',
            'paid_date', 'reminder_sent', 'reminder_sent_at', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


# ==================== QUOTE SERIALIZERS ====================

class QuoteSerializer(serializers.ModelSerializer):
    """Serializer for Quote model"""
    lead_name = serializers.CharField(source='lead.name', read_only=True)
    property_name = serializers.CharField(source='property.name', read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True, allow_null=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True, allow_null=True)
    manager_name = serializers.CharField(source='manager.name', read_only=True, allow_null=True)
    documents = serializers.SerializerMethodField()
    
    class Meta:
        model = Quote
        fields = (
            'id', 'quote_number', 'lead', 'lead_name', 'property', 'property_name',
            'client', 'client_name', 'status', 'validity_date',
            'unit_size', 'unit_type', 'facing', 'amenities',
            'base_price', 'discount', 'tax_amount', 'total_amount',
            'payment_schedule', 'client_approval_status', 'client_approval_date',
            'manager_approval_status', 'manager_approval_date', 'manager', 'manager_name',
            'converted_to_deal', 'pdf_url', 'email_sent', 'email_sent_at',
            'notes', 'version', 'parent_quote', 'created_by', 'created_by_name',
            'created_at', 'updated_at', 'documents'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_documents(self, obj):
        return [{'id': doc.id, 'name': doc.name, 'type': doc.type, 'file_url': doc.file_url}
                for doc in obj.documents.all()]


# ==================== COMMISSION SERIALIZERS ====================

class CommissionSplitSerializer(serializers.ModelSerializer):
    """Serializer for CommissionSplit model"""
    agent_name = serializers.CharField(source='agent.name', read_only=True)
    
    class Meta:
        model = CommissionSplit
        fields = (
            'id', 'commission', 'agent', 'agent_name', 'split_percentage',
            'allocated_amount', 'role', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


class CommissionSerializer(serializers.ModelSerializer):
    """Serializer for Commission model"""
    agent_name = serializers.CharField(source='agent.name', read_only=True)
    deal_info = serializers.SerializerMethodField()
    splits = CommissionSplitSerializer(many=True, read_only=True)
    
    class Meta:
        model = Commission
        fields = (
            'id', 'deal', 'deal_info', 'agent', 'agent_name', 'commission_type',
            'commission_percentage', 'fixed_amount', 'calculated_amount', 'status',
            'role', 'paid_date', 'payment_reference', 'notes', 'splits',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_deal_info(self, obj):
        return {
            'id': obj.deal.id,
            'lead_name': obj.deal.lead.name,
            'property_name': obj.deal.property.name,
            'deal_value': str(obj.deal.deal_value)
        }


# ==================== CUSTOMER PORTAL SERIALIZERS ====================

class CustomerPortalUserSerializer(serializers.ModelSerializer):
    """Serializer for CustomerPortalUser model"""
    client_name = serializers.CharField(source='client.name', read_only=True, allow_null=True)
    
    class Meta:
        model = CustomerPortalUser
        fields = (
            'id', 'email', 'phone', 'user_type', 'client', 'client_name',
            'lead', 'is_active', 'last_login', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'last_login')
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer for Document model"""
    uploaded_by_name = serializers.CharField(source='uploaded_by.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Document
        fields = (
            'id', 'deal', 'quote', 'lead', 'type', 'name', 'file_url',
            'file_type', 'is_watermarked', 'requires_otp', 'uploaded_by',
            'uploaded_by_name', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class FileAccessLogSerializer(serializers.ModelSerializer):
    """Serializer for FileAccessLog model"""
    document_name = serializers.CharField(source='document.name', read_only=True)
    portal_user_email = serializers.CharField(source='portal_user.email', read_only=True, allow_null=True)
    
    class Meta:
        model = FileAccessLog
        fields = (
            'id', 'document', 'document_name', 'portal_user', 'portal_user_email',
            'ip_address', 'user_agent', 'accessed_at', 'otp_verified'
        )
        read_only_fields = ('id', 'accessed_at')


# ==================== INTEGRATION SERIALIZERS ====================

class IntegrationConfigSerializer(serializers.ModelSerializer):
    """Serializer for IntegrationConfig model"""
    
    class Meta:
        model = IntegrationConfig
        fields = (
            'id', 'name', 'type', 'provider', 'is_enabled', 'config',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


# ==================== TEMPLATE SERIALIZERS ====================

class InvoiceTemplateSerializer(serializers.ModelSerializer):
    """Serializer for InvoiceTemplate model"""
    
    class Meta:
        model = InvoiceTemplate
        fields = ('id', 'name', 'html_template', 'is_default', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class QuoteTemplateSerializer(serializers.ModelSerializer):
    """Serializer for QuoteTemplate model"""
    
    class Meta:
        model = QuoteTemplate
        fields = ('id', 'name', 'html_template', 'is_default', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class EmailTemplateSerializer(serializers.ModelSerializer):
    """Serializer for EmailTemplate model"""
    
    class Meta:
        model = EmailTemplate
        fields = ('id', 'name', 'subject', 'html_body', 'is_default', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class AgreementTemplateSerializer(serializers.ModelSerializer):
    """Serializer for AgreementTemplate model"""
    
    class Meta:
        model = AgreementTemplate
        fields = ('id', 'name', 'html_template', 'is_default', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


# ==================== WORKFLOW SERIALIZERS ====================

class WorkflowActionSerializer(serializers.ModelSerializer):
    """Serializer for WorkflowAction model"""
    
    class Meta:
        model = WorkflowAction
        fields = (
            'id', 'workflow_rule', 'action_type', 'action_config', 'order', 'is_enabled'
        )
        read_only_fields = ('id',)


class WorkflowRuleSerializer(serializers.ModelSerializer):
    """Serializer for WorkflowRule model"""
    actions = WorkflowActionSerializer(many=True, read_only=True)
    
    class Meta:
        model = WorkflowRule
        fields = (
            'id', 'name', 'description', 'trigger', 'trigger_conditions',
            'is_enabled', 'actions', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


# ==================== CALL LOGGING SERIALIZERS ====================

class CallLogSerializer(serializers.ModelSerializer):
    """Serializer for CallLog model"""
    lead_name = serializers.CharField(source='lead.name', read_only=True, allow_null=True)
    agent_name = serializers.CharField(source='agent.name', read_only=True, allow_null=True)
    is_completed = serializers.ReadOnlyField()
    was_answered = serializers.ReadOnlyField()
    
    class Meta:
        model = CallLog
        fields = (
            'id', 'call_sid', 'lead', 'lead_name', 'agent', 'agent_name',
            'direction', 'status', 'call_type', 'from_number', 'to_number',
            'caller_name', 'initiated_at', 'answered_at', 'ended_at',
            'duration', 'ring_duration', 'recording_url', 'recording_sid',
            'transcript', 'transcript_url', 'quality_score', 'sentiment',
            'keywords', 'summary', 'provider', 'provider_data', 'cost',
            'currency', 'notes', 'outcome', 'activity', 'is_completed',
            'was_answered', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'is_completed', 'was_answered')


class TelephonyConfigSerializer(serializers.ModelSerializer):
    """Serializer for TelephonyConfig model"""
    
    class Meta:
        model = TelephonyConfig
        fields = (
            'id', 'name', 'provider', 'is_active', 'is_default',
            'account_sid', 'auth_token', 'api_key', 'api_secret',
            'phone_number', 'phone_number_sid', 'webhook_url',
            'status_callback_url', 'recording_callback_url',
            'record_calls', 'transcribe_calls', 'auto_assign_to_agent',
            'config', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
        extra_kwargs = {
            'auth_token': {'write_only': True},
            'api_secret': {'write_only': True},
        }


# ==================== CHATBOT SERIALIZERS ====================

class ChatbotQualificationRuleSerializer(serializers.ModelSerializer):
    """Serializer for ChatbotQualificationRule model"""
    
    class Meta:
        model = ChatbotQualificationRule
        fields = (
            'id', 'chatbot', 'name', 'question', 'field_name', 'field_type',
            'options', 'required', 'order', 'scoring_rules', 'is_active',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class ChatbotMessageSerializer(serializers.ModelSerializer):
    """Serializer for ChatbotMessage model"""
    
    class Meta:
        model = ChatbotMessage
        fields = (
            'id', 'conversation', 'message_type', 'content', 'intent',
            'confidence', 'entities', 'quick_replies', 'timestamp', 'metadata'
        )
        read_only_fields = ('id', 'timestamp')


class ChatbotConversationSerializer(serializers.ModelSerializer):
    """Serializer for ChatbotConversation model"""
    chatbot_name = serializers.CharField(source='chatbot.name', read_only=True)
    lead_name = serializers.CharField(source='lead.name', read_only=True, allow_null=True)
    assigned_agent_name = serializers.CharField(source='assigned_agent.name', read_only=True, allow_null=True)
    messages = ChatbotMessageSerializer(many=True, read_only=True)
    message_count = serializers.ReadOnlyField()
    duration = serializers.ReadOnlyField()
    
    class Meta:
        model = ChatbotConversation
        fields = (
            'id', 'conversation_id', 'chatbot', 'chatbot_name', 'lead', 'lead_name',
            'visitor_id', 'visitor_name', 'visitor_email', 'visitor_phone',
            'visitor_ip', 'user_agent', 'status', 'started_at', 'ended_at',
            'last_message_at', 'qualification_data', 'qualification_score',
            'is_qualified', 'assigned_agent', 'assigned_agent_name', 'assigned_at',
            'metadata', 'messages', 'message_count', 'duration',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'message_count', 'duration')


class ChatbotSerializer(serializers.ModelSerializer):
    """Serializer for Chatbot model"""
    qualification_rules = ChatbotQualificationRuleSerializer(many=True, read_only=True)
    conversations_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Chatbot
        fields = (
            'id', 'name', 'provider', 'status', 'api_key', 'api_secret',
            'project_id', 'agent_id', 'welcome_message', 'fallback_message',
            'qualification_enabled', 'auto_create_lead', 'auto_assign_agent',
            'qualification_questions', 'website_url', 'widget_code',
            'config', 'qualification_rules', 'conversations_count',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'conversations_count')
        extra_kwargs = {
            'api_key': {'write_only': True},
            'api_secret': {'write_only': True},
        }
    
    def get_conversations_count(self, obj):
        """Get count of conversations for this chatbot"""
        return obj.conversations.count()


# ==================== PROJECT STRUCTURE SERIALIZERS ====================

class ProjectSerializer(serializers.ModelSerializer):
    """Serializer for Project model"""
    towers_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = (
            'id', 'name', 'code', 'location', 'city', 'state', 'builder_name',
            'builder_pan', 'builder_gstin', 'builder_address', 'builder_signature_url',
            'builder_qr_code_url', 'rera_number', 'status', 'towers_count',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'towers_count')
    
    def get_towers_count(self, obj):
        return obj.towers.count()


class TowerSerializer(serializers.ModelSerializer):
    """Serializer for Tower model"""
    project_name = serializers.CharField(source='project.name', read_only=True)
    floors_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Tower
        fields = (
            'id', 'project', 'project_name', 'name', 'code', 'total_floors',
            'floors_count', 'created_at'
        )
        read_only_fields = ('id', 'created_at', 'floors_count')
    
    def get_floors_count(self, obj):
        return obj.floors.count()


class FloorSerializer(serializers.ModelSerializer):
    """Serializer for Floor model"""
    tower_name = serializers.CharField(source='tower.name', read_only=True)
    project_name = serializers.CharField(source='tower.project.name', read_only=True)
    units_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Floor
        fields = (
            'id', 'tower', 'tower_name', 'project_name', 'floor_number', 'name',
            'units_count', 'created_at'
        )
        read_only_fields = ('id', 'created_at', 'units_count')
    
    def get_units_count(self, obj):
        return obj.units.count()


class UnitSerializer(serializers.ModelSerializer):
    """Serializer for Unit model"""
    full_address = serializers.SerializerMethodField()
    project_name = serializers.CharField(source='floor.tower.project.name', read_only=True)
    tower_name = serializers.CharField(source='floor.tower.name', read_only=True)
    floor_number = serializers.IntegerField(source='floor.floor_number', read_only=True)
    
    class Meta:
        model = Unit
        fields = (
            'id', 'floor', 'property_link', 'unit_number', 'unit_type',
            'carpet_area', 'built_up_area', 'super_area', 'base_price', 'status',
            'full_address', 'project_name', 'tower_name', 'floor_number', 'created_at'
        )
        read_only_fields = ('id', 'created_at', 'full_address')
    
    def get_full_address(self, obj):
        return obj.get_full_address()


# ==================== BOOKING PAYMENT SERIALIZERS ====================

class BookingPaymentSerializer(serializers.ModelSerializer):
    """Serializer for BookingPayment model"""
    client_name = serializers.CharField(source='client.name', read_only=True)
    unit_address = serializers.CharField(source='unit.full_address', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True, allow_null=True)
    approved_by_name = serializers.CharField(source='approved_by.name', read_only=True, allow_null=True)
    
    class Meta:
        model = BookingPayment
        fields = (
            'id', 'booking_id', 'deal', 'unit', 'unit_address', 'client', 'client_name',
            'amount', 'payment_method', 'transaction_id', 'reference_number', 'payment_date',
            'status', 'cheque_number', 'cheque_date', 'cheque_bank', 'cheque_cleared',
            'cheque_cleared_date', 'rtgs_neft_utr', 'upi_reference', 'receipt_generated',
            'receipt_pdf_url', 'whatsapp_sent', 'email_sent', 'notes', 'created_by',
            'created_by_name', 'approved_by', 'approved_by_name', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'booking_id', 'created_at', 'updated_at', 'receipt_generated')


class ReceiptSerializer(serializers.ModelSerializer):
    """Serializer for Receipt model"""
    client_name = serializers.CharField(source='client.name', read_only=True)
    unit_address = serializers.CharField(source='unit.full_address', read_only=True)
    
    class Meta:
        model = Receipt
        fields = (
            'id', 'receipt_number', 'receipt_type', 'booking_payment', 'payment', 'refund',
            'deal', 'client', 'client_name', 'unit', 'unit_address', 'amount',
            'payment_method', 'transaction_reference', 'receipt_date', 'pdf_url',
            'email_sent', 'whatsapp_sent', 'created_at'
        )
        read_only_fields = ('id', 'receipt_number', 'created_at')


# ==================== GST & TAX SERIALIZERS ====================

class GSTConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for GSTConfiguration model"""
    
    class Meta:
        model = GSTConfiguration
        fields = (
            'id', 'property_type', 'charge_type', 'gst_rate', 'hsn_code',
            'is_active', 'effective_from', 'effective_to', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


class TaxBreakdownSerializer(serializers.ModelSerializer):
    """Serializer for TaxBreakdown model"""
    
    class Meta:
        model = TaxBreakdown
        fields = (
            'id', 'invoice', 'charge_type', 'base_amount', 'gst_rate',
            'cgst_amount', 'sgst_amount', 'igst_amount', 'total_tax',
            'total_amount', 'hsn_code'
        )
        read_only_fields = ('id',)


# ==================== PAYMENT SCHEDULE SERIALIZERS ====================

class PaymentMilestoneSerializer(serializers.ModelSerializer):
    """Serializer for PaymentMilestone model"""
    
    class Meta:
        model = PaymentMilestone
        fields = (
            'id', 'payment_schedule', 'milestone_name', 'milestone_percentage',
            'amount', 'due_date', 'completed', 'completed_date', 'order'
        )
        read_only_fields = ('id',)


class PaymentScheduleSerializer(serializers.ModelSerializer):
    """Serializer for PaymentSchedule model"""
    milestones = PaymentMilestoneSerializer(many=True, read_only=True)
    deal_info = serializers.CharField(source='deal.__str__', read_only=True)
    
    class Meta:
        model = PaymentSchedule
        fields = (
            'id', 'deal', 'deal_info', 'plan_type', 'name', 'total_contract_value',
            'booking_amount', 'number_of_installments', 'auto_reminder',
            'reminder_days_before', 'auto_invoice', 'is_active', 'milestones', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


# ==================== LEDGER SERIALIZERS ====================

class LedgerSerializer(serializers.ModelSerializer):
    """Serializer for Ledger model"""
    customer_name = serializers.CharField(source='customer.name', read_only=True, allow_null=True)
    unit_address = serializers.CharField(source='unit.full_address', read_only=True, allow_null=True)
    project_name = serializers.CharField(source='project.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Ledger
        fields = (
            'id', 'ledger_type', 'customer', 'customer_name', 'unit', 'unit_address',
            'project', 'project_name', 'transaction_date', 'transaction_type',
            'reference_number', 'description', 'debit', 'credit', 'balance', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


# ==================== REFUND SERIALIZERS ====================

class RefundSerializer(serializers.ModelSerializer):
    """Serializer for Refund model"""
    deal_info = serializers.CharField(source='deal.__str__', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.name', read_only=True, allow_null=True)
    approved_by_name = serializers.CharField(source='approved_by.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Refund
        fields = (
            'id', 'refund_id', 'deal', 'deal_info', 'booking_payment', 'payment',
            'amount', 'reason', 'cancellation_charges', 'net_refund_amount', 'status',
            'notes', 'requested_by', 'requested_by_name', 'approved_by', 'approved_by_name',
            'approved_at', 'processed_at', 'created_at'
        )
        read_only_fields = ('id', 'refund_id', 'created_at')


class CreditNoteSerializer(serializers.ModelSerializer):
    """Serializer for CreditNote model"""
    deal_info = serializers.CharField(source='deal.__str__', read_only=True)
    
    class Meta:
        model = CreditNote
        fields = (
            'id', 'credit_note_number', 'deal', 'deal_info', 'amount', 'reason',
            'applied_to_invoice', 'created_at'
        )
        read_only_fields = ('id', 'credit_note_number', 'created_at')


# ==================== BANK RECONCILIATION SERIALIZERS ====================

class BankReconciliationSerializer(serializers.ModelSerializer):
    """Serializer for BankReconciliation model"""
    reconciled_by_name = serializers.CharField(source='reconciled_by.name', read_only=True, allow_null=True)
    
    class Meta:
        model = BankReconciliation
        fields = (
            'id', 'bank_name', 'account_number', 'transaction_date', 'transaction_type',
            'amount', 'reference_number', 'utr_number', 'description', 'status',
            'matched_payment', 'matched_booking', 'reconciled_by', 'reconciled_by_name',
            'reconciled_at', 'created_at'
        )
        read_only_fields = ('id', 'created_at')

