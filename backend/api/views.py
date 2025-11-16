from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db.models import Q
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from datetime import timedelta
import json

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
from .serializers import (
    AgentSerializer, PropertySerializer, LeadSerializer, ActivitySerializer,
    TaskSerializer, ClientSerializer, AttendanceRecordSerializer,
    WhatsAppTemplateSerializer, AutomationRuleSerializer, NotificationSerializer,
    RegisterSerializer, DealSerializer, InvoiceSerializer, PaymentSerializer,
    PaymentPlanSerializer, InstallmentSerializer, QuoteSerializer,
    CommissionSerializer, CommissionSplitSerializer, CustomerPortalUserSerializer,
    DocumentSerializer, FileAccessLogSerializer, IntegrationConfigSerializer,
    InvoiceTemplateSerializer, QuoteTemplateSerializer, EmailTemplateSerializer,
    AgreementTemplateSerializer, WorkflowRuleSerializer, WorkflowActionSerializer,
    CallLogSerializer, TelephonyConfigSerializer, ChatbotSerializer,
    ChatbotConversationSerializer, ChatbotMessageSerializer, ChatbotQualificationRuleSerializer,
    ProjectSerializer, TowerSerializer, FloorSerializer, UnitSerializer,
    BookingPaymentSerializer, ReceiptSerializer, GSTConfigurationSerializer, TaxBreakdownSerializer,
    PaymentScheduleSerializer, PaymentMilestoneSerializer, LedgerSerializer,
    RefundSerializer, CreditNoteSerializer, BankReconciliationSerializer
)
from .permissions import IsOwnerOrAdminOrReadOnly, IsAdminOrManager, IsAdminOnly


class LeadViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Lead model with role-based filtering
    """
    serializer_class = LeadSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdminOrReadOnly]
    
    def get_queryset(self):
        """
        Filter leads based on user role:
        - Admins/Managers see all leads
        - Agents only see leads assigned to them
        - Telecallers see leads assigned to them
        """
        user = self.request.user
        
        queryset = Lead.objects.select_related('agent', 'property', 'created_by').prefetch_related(
            'activities', 'tasks'
        ).all()
        
        # Admins and Sales Managers see all leads
        if user.is_staff or user.role in [Agent.Role.ADMIN, Agent.Role.SALES_MANAGER]:
            # Optionally filter by team for managers
            if user.role == Agent.Role.SALES_MANAGER and user.team:
                queryset = queryset.filter(agent__team=user.team)
            return queryset
        
        # Agents and Telecallers only see their own leads
        return queryset.filter(agent=user)
    
    def perform_create(self, serializer):
        """Automatically set the creator and agent to the current user"""
        serializer.save(
            created_by=self.request.user,
            agent=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def add_activity(self, request, pk=None):
        """Add an activity to a lead"""
        lead = self.get_object()
        serializer = ActivitySerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save(lead=lead)
            # Update last_contacted
            lead.last_contacted = timezone.now()
            lead.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def activities(self, request, pk=None):
        """Get all activities for a lead"""
        lead = self.get_object()
        activities = lead.activities.all()
        serializer = ActivitySerializer(activities, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def tasks(self, request, pk=None):
        """Get all tasks for a lead"""
        lead = self.get_object()
        tasks = lead.tasks.all()
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)


class ActivityViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Activity model
    """
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdminOrReadOnly]
    
    def get_queryset(self):
        """Filter activities based on user role"""
        user = self.request.user
        queryset = Activity.objects.select_related('lead').all()
        
        # Get lead_id from query params if nested route
        lead_id = self.request.query_params.get('lead_id', None)
        if lead_id:
            queryset = queryset.filter(lead_id=lead_id)
        
        # Admins and Managers see all
        if user.is_staff or user.role in [Agent.Role.ADMIN, Agent.Role.SALES_MANAGER]:
            return queryset
        
        # Others see only activities for their leads
        return queryset.filter(lead__agent=user)
    
    def perform_create(self, serializer):
        """Set agent_name from current user"""
        if not serializer.validated_data.get('agent_name'):
            serializer.save(agent_name=self.request.user.name)


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Task model
    """
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdminOrReadOnly]
    
    def get_queryset(self):
        """Filter tasks based on user role"""
        user = self.request.user
        queryset = Task.objects.select_related('lead').all()
        
        # Get lead_id from query params if nested route
        lead_id = self.request.query_params.get('lead_id', None)
        if lead_id:
            queryset = queryset.filter(lead_id=lead_id)
        
        # Admins and Managers see all
        if user.is_staff or user.role in [Agent.Role.ADMIN, Agent.Role.SALES_MANAGER]:
            return queryset
        
        # Others see only tasks for their leads
        return queryset.filter(lead__agent=user)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark a task as completed"""
        task = self.get_object()
        task.is_completed = True
        task.save()
        serializer = self.get_serializer(task)
        return Response(serializer.data)


class PropertyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Property model
    """
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name', 'location', 'description']
    filterset_fields = ['category', 'status']
    
    def get_queryset(self):
        """All authenticated users can view properties"""
        return Property.objects.all()


class AgentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Agent model
    """
    serializer_class = AgentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrManager]
    search_fields = ['username', 'email', 'first_name', 'last_name', 'team']
    filterset_fields = ['role', 'team', 'is_active']
    
    def get_queryset(self):
        """Admins see all, Managers see their team"""
        user = self.request.user
        
        if user.is_staff or user.role == Agent.Role.ADMIN:
            return Agent.objects.all()
        
        if user.role == Agent.Role.SALES_MANAGER and user.team:
            return Agent.objects.filter(team=user.team)
        
        return Agent.objects.filter(id=user.id)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """Get current user profile - accessible to all authenticated users"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def teams(self, request):
        """Get list of all teams"""
        teams = Agent.objects.values_list('team', flat=True).distinct().exclude(team__isnull=True).exclude(team='')
        return Response(list(teams))


class ClientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Client model
    """
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name', 'contact', 'email']
    filterset_fields = ['occupation', 'lead_source']
    
    def get_queryset(self):
        """All authenticated users can view clients"""
        return Client.objects.all()


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet for AttendanceRecord model
    """
    serializer_class = AttendanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Users see their own attendance, admins/managers see all"""
        user = self.request.user
        
        if user.is_staff or user.role in [Agent.Role.ADMIN, Agent.Role.SALES_MANAGER]:
            return AttendanceRecord.objects.select_related('agent').all()
        
        return AttendanceRecord.objects.filter(agent=user)


class WhatsAppTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for WhatsAppTemplate model
    """
    serializer_class = WhatsAppTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name', 'content']
    
    def get_queryset(self):
        """All authenticated users can view templates"""
        return WhatsAppTemplate.objects.all()


class AutomationRuleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for AutomationRule model
    """
    serializer_class = AutomationRuleSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrManager]
    
    def get_queryset(self):
        """All authenticated users can view rules, but only admins/managers can modify"""
        return AutomationRule.objects.all()


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Notification model (read-only, create via signals or other means)
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Users see notifications related to their leads"""
        user = self.request.user
        
        # Get all lead IDs for this user
        if user.is_staff or user.role in [Agent.Role.ADMIN, Agent.Role.SALES_MANAGER]:
            return Notification.objects.all()
        
        user_lead_ids = Lead.objects.filter(agent=user).values_list('id', flat=True)
        return Notification.objects.filter(lead_id__in=user_lead_ids)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        queryset = self.get_queryset().filter(is_read=False)
        queryset.update(is_read=True)
        return Response({'message': 'All notifications marked as read'})


# Authentication Views
class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token view that includes user data"""
    def post(self, request, *args, **kwargs):
        # Validate and get user first
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.user
        
        # Get the token response from parent
        response = super().post(request, *args, **kwargs)
        
        # Add user data to successful responses
        if response.status_code == 200:
            response.data['user'] = AgentSerializer(user).data
            # JWT library returns 'access' and 'refresh' by default, but ensure compatibility
            if 'access_token' in response.data and 'access' not in response.data:
                response.data['access'] = response.data.pop('access_token')
            if 'refresh_token' in response.data and 'refresh' not in response.data:
                response.data['refresh'] = response.data.pop('refresh_token')
        
        return response


class RegisterView(APIView):
    """User registration endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'User registered successfully',
                'user': AgentSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================== DEAL VIEWSETS ====================

class DealViewSet(viewsets.ModelViewSet):
    """ViewSet for Deal model"""
    serializer_class = DealSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter deals based on user role"""
        user = self.request.user
        queryset = Deal.objects.select_related('lead', 'property', 'agent', 'client').all()
        
        if user.is_staff or user.role in [Agent.Role.ADMIN, Agent.Role.SALES_MANAGER]:
            if user.role == Agent.Role.SALES_MANAGER and user.team:
                queryset = queryset.filter(agent__team=user.team)
            return queryset
        
        return queryset.filter(agent=user)


# ==================== INVOICE VIEWSETS ====================

class PaymentPlanViewSet(viewsets.ModelViewSet):
    """ViewSet for PaymentPlan model"""
    serializer_class = PaymentPlanSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter payment plans based on user role"""
        user = self.request.user
        queryset = PaymentPlan.objects.select_related('deal').all()
        
        if user.is_staff or user.role in [Agent.Role.ADMIN, Agent.Role.SALES_MANAGER]:
            return queryset
        
        return queryset.filter(deal__agent=user)


class InvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for Invoice model"""
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter invoices based on user role"""
        user = self.request.user
        queryset = Invoice.objects.select_related('deal', 'client', 'payment_plan').prefetch_related('payments').all()
        
        if user.is_staff or user.role in [Agent.Role.ADMIN, Agent.Role.SALES_MANAGER]:
            return queryset
        
        return queryset.filter(deal__agent=user)
    
    @action(detail=True, methods=['post'])
    def generate_pdf(self, request, pk=None):
        """Generate PDF for invoice"""
        invoice = self.get_object()
        # TODO: Implement PDF generation
        return Response({'message': 'PDF generation not yet implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)
    
    @action(detail=True, methods=['post'])
    def send_email(self, request, pk=None):
        """Send invoice via email"""
        invoice = self.get_object()
        # TODO: Implement email sending
        return Response({'message': 'Email sending not yet implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for Payment model"""
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter payments based on user role"""
        user = self.request.user
        queryset = Payment.objects.select_related('invoice', 'created_by').all()
        
        if user.is_staff or user.role in [Agent.Role.ADMIN, Agent.Role.SALES_MANAGER]:
            return queryset
        
        return queryset.filter(invoice__deal__agent=user)
    
    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)


class InstallmentViewSet(viewsets.ModelViewSet):
    """ViewSet for Installment model"""
    serializer_class = InstallmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter installments based on user role"""
        user = self.request.user
        queryset = Installment.objects.select_related('payment_plan', 'invoice').all()
        
        if user.is_staff or user.role in [Agent.Role.ADMIN, Agent.Role.SALES_MANAGER]:
            return queryset
        
        return queryset.filter(payment_plan__deal__agent=user)


# ==================== QUOTE VIEWSETS ====================

class QuoteViewSet(viewsets.ModelViewSet):
    """ViewSet for Quote model"""
    serializer_class = QuoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter quotes based on user role"""
        user = self.request.user
        queryset = Quote.objects.select_related('lead', 'property', 'client', 'created_by', 'manager').prefetch_related('documents').all()
        
        if user.is_staff or user.role in [Agent.Role.ADMIN, Agent.Role.SALES_MANAGER]:
            return queryset
        
        return queryset.filter(lead__agent=user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve quote (client or manager)"""
        quote = self.get_object()
        approval_type = request.data.get('type', 'client')  # 'client' or 'manager'
        
        if approval_type == 'client':
            quote.client_approval_status = Quote.Status.APPROVED
            quote.client_approval_date = timezone.now()
        elif approval_type == 'manager':
            quote.manager_approval_status = Quote.Status.APPROVED
            quote.manager_approval_date = timezone.now()
            quote.manager = request.user
        
        quote.save()
        serializer = self.get_serializer(quote)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def request_modification(self, request, pk=None):
        """Request quote modification"""
        quote = self.get_object()
        quote.client_approval_status = Quote.Status.MODIFICATION_REQUESTED
        quote.client_approval_date = timezone.now()
        quote.save()
        serializer = self.get_serializer(quote)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def convert_to_deal(self, request, pk=None):
        """Convert quote to deal"""
        quote = self.get_object()
        if quote.status != Quote.Status.APPROVED:
            return Response({'error': 'Quote must be approved before conversion'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create deal from quote
        deal = Deal.objects.create(
            lead=quote.lead,
            property=quote.property,
            deal_value=quote.total_amount,
            stage=Deal.Stage.BOOKING_DONE,
            agent=quote.lead.agent,
            client=quote.client,
            booking_date=timezone.now().date()
        )
        
        quote.converted_to_deal = deal
        quote.status = Quote.Status.CONVERTED
        quote.save()
        
        serializer = self.get_serializer(quote)
        return Response({
            'quote': serializer.data,
            'deal': DealSerializer(deal).data
        }, status=status.HTTP_201_CREATED)


# ==================== COMMISSION VIEWSETS ====================

class CommissionViewSet(viewsets.ModelViewSet):
    """ViewSet for Commission model"""
    serializer_class = CommissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter commissions based on user role"""
        user = self.request.user
        queryset = Commission.objects.select_related('deal', 'agent').prefetch_related('splits').all()
        
        if user.is_staff or user.role in [Agent.Role.ADMIN, Agent.Role.SALES_MANAGER]:
            return queryset
        
        return queryset.filter(agent=user)
    
    @action(detail=False, methods=['get'])
    def my_commissions(self, request):
        """Get current user's commissions"""
        commissions = self.get_queryset().filter(agent=request.user)
        serializer = self.get_serializer(commissions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get commission summary"""
        from django.db.models import Sum
        user = request.user
        
        queryset = self.get_queryset()
        if not (user.is_staff or user.role in [Agent.Role.ADMIN, Agent.Role.SALES_MANAGER]):
            queryset = queryset.filter(agent=user)
        
        summary = {
            'total_earned': queryset.filter(status=Commission.Status.PAID).aggregate(
                total=Sum('calculated_amount')
            )['total'] or 0,
            'pending': queryset.filter(status=Commission.Status.PENDING).aggregate(
                total=Sum('calculated_amount')
            )['total'] or 0,
            'approved': queryset.filter(status=Commission.Status.APPROVED).aggregate(
                total=Sum('calculated_amount')
            )['total'] or 0,
        }
        return Response(summary)


class CommissionSplitViewSet(viewsets.ModelViewSet):
    """ViewSet for CommissionSplit model"""
    serializer_class = CommissionSplitSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter commission splits based on user role"""
        user = self.request.user
        queryset = CommissionSplit.objects.select_related('commission', 'agent').all()
        
        if user.is_staff or user.role in [Agent.Role.ADMIN, Agent.Role.SALES_MANAGER]:
            return queryset
        
        return queryset.filter(agent=user)


# ==================== CUSTOMER PORTAL VIEWSETS ====================

class CustomerPortalUserViewSet(viewsets.ModelViewSet):
    """ViewSet for CustomerPortalUser model"""
    serializer_class = CustomerPortalUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrManager]
    
    def get_queryset(self):
        """Only admins and managers can view portal users"""
        return CustomerPortalUser.objects.select_related('client', 'lead').all()


class DocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for Document model"""
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter documents based on user role"""
        user = self.request.user
        queryset = Document.objects.select_related('deal', 'quote', 'lead', 'uploaded_by').all()
        
        if user.is_staff or user.role in [Agent.Role.ADMIN, Agent.Role.SALES_MANAGER]:
            return queryset
        
        # Agents see documents for their deals/leads
        return queryset.filter(
            Q(deal__agent=user) | Q(lead__agent=user) | Q(quote__lead__agent=user)
        )


class FileAccessLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for FileAccessLog model (read-only)"""
    serializer_class = FileAccessLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrManager]
    
    def get_queryset(self):
        """Only admins and managers can view access logs"""
        return FileAccessLog.objects.select_related('document', 'portal_user').all()


# ==================== INTEGRATION VIEWSETS ====================

class IntegrationConfigViewSet(viewsets.ModelViewSet):
    """ViewSet for IntegrationConfig model"""
    serializer_class = IntegrationConfigSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOnly]
    
    def get_queryset(self):
        """Only admins can manage integrations"""
        return IntegrationConfig.objects.all()


# ==================== TEMPLATE VIEWSETS ====================

class InvoiceTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for InvoiceTemplate model"""
    serializer_class = InvoiceTemplateSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrManager]
    
    def get_queryset(self):
        """All authenticated users can view templates"""
        return InvoiceTemplate.objects.all()


class QuoteTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for QuoteTemplate model"""
    serializer_class = QuoteTemplateSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrManager]
    
    def get_queryset(self):
        """All authenticated users can view templates"""
        return QuoteTemplate.objects.all()


class EmailTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for EmailTemplate model"""
    serializer_class = EmailTemplateSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrManager]
    
    def get_queryset(self):
        """All authenticated users can view templates"""
        return EmailTemplate.objects.all()


class AgreementTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for AgreementTemplate model"""
    serializer_class = AgreementTemplateSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrManager]
    
    def get_queryset(self):
        """All authenticated users can view templates"""
        return AgreementTemplate.objects.all()


# ==================== WORKFLOW VIEWSETS ====================

class WorkflowRuleViewSet(viewsets.ModelViewSet):
    """ViewSet for WorkflowRule model"""
    serializer_class = WorkflowRuleSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrManager]
    
    def get_queryset(self):
        """All authenticated users can view workflow rules"""
        return WorkflowRule.objects.prefetch_related('actions').all()


class WorkflowActionViewSet(viewsets.ModelViewSet):
    """ViewSet for WorkflowAction model"""
    serializer_class = WorkflowActionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrManager]
    
    def get_queryset(self):
        """All authenticated users can view workflow actions"""
        return WorkflowAction.objects.select_related('workflow_rule').all()


# ==================== CALL LOGGING VIEWSETS ====================

class CallLogViewSet(viewsets.ModelViewSet):
    """ViewSet for CallLog model"""
    serializer_class = CallLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter call logs based on user role"""
        user = self.request.user
        queryset = CallLog.objects.select_related('lead', 'agent', 'activity').all()
        
        if user.is_staff or user.role in [Agent.Role.ADMIN, Agent.Role.SALES_MANAGER]:
            return queryset
        
        return queryset.filter(agent=user)
    
    @action(detail=True, methods=['post'])
    def initiate_call(self, request, pk=None):
        """Initiate outbound call"""
        from .services.telephony_service import initiate_outbound_call
        
        call_log = self.get_object()
        to_number = request.data.get('to_number')
        
        if not to_number:
            return Response({'error': 'to_number is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            new_call = initiate_outbound_call(
                to_number=to_number,
                lead=call_log.lead,
                agent=request.user
            )
            serializer = self.get_serializer(new_call)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class TelephonyConfigViewSet(viewsets.ModelViewSet):
    """ViewSet for TelephonyConfig model"""
    serializer_class = TelephonyConfigSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOnly]
    
    def get_queryset(self):
        """Only admins can manage telephony configs"""
        return TelephonyConfig.objects.all()


# ==================== CHATBOT VIEWSETS ====================

class ChatbotViewSet(viewsets.ModelViewSet):
    """ViewSet for Chatbot model"""
    serializer_class = ChatbotSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrManager]
    
    def get_queryset(self):
        """All authenticated users can view chatbots"""
        return Chatbot.objects.prefetch_related('qualification_rules', 'conversations').all()
    
    @action(detail=True, methods=['get'])
    def widget_code(self, request, pk=None):
        """Get widget embed code for chatbot"""
        chatbot = self.get_object()
        base_url = request.build_absolute_uri('/').rstrip('/')
        widget_code = f"""
        <script>
        (function() {{
            var chatbotId = '{chatbot.id}';
            var baseUrl = '{base_url}';
            var script = document.createElement('script');
            script.src = baseUrl + '/static/chatbot-widget.js';
            script.setAttribute('data-chatbot-id', chatbotId);
            script.setAttribute('data-base-url', baseUrl);
            document.head.appendChild(script);
        }})();
        </script>
        """
        return Response({'widget_code': widget_code})


class ChatbotConversationViewSet(viewsets.ModelViewSet):
    """ViewSet for ChatbotConversation model"""
    serializer_class = ChatbotConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter conversations based on user role"""
        user = self.request.user
        queryset = ChatbotConversation.objects.select_related(
            'chatbot', 'lead', 'assigned_agent'
        ).prefetch_related('messages').all()
        
        if user.is_staff or user.role in [Agent.Role.ADMIN, Agent.Role.SALES_MANAGER]:
            return queryset
        
        return queryset.filter(assigned_agent=user)
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send message in conversation"""
        from .services.chatbot_service import send_user_message
        
        conversation = self.get_object()
        content = request.data.get('content')
        
        if not content:
            return Response({'error': 'content is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user_message, bot_response = send_user_message(
            conversation=conversation,
            content=content,
            intent=request.data.get('intent'),
            confidence=request.data.get('confidence'),
            entities=request.data.get('entities', [])
        )
        
        return Response({
            'user_message': ChatbotMessageSerializer(user_message).data,
            'bot_response': ChatbotMessageSerializer(bot_response).data,
            'conversation': self.get_serializer(conversation).data
        })


class ChatbotMessageViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for ChatbotMessage model (read-only)"""
    serializer_class = ChatbotMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter messages based on user role"""
        user = self.request.user
        queryset = ChatbotMessage.objects.select_related('conversation').all()
        
        conversation_id = self.request.query_params.get('conversation_id')
        if conversation_id:
            queryset = queryset.filter(conversation_id=conversation_id)
        
        if user.is_staff or user.role in [Agent.Role.ADMIN, Agent.Role.SALES_MANAGER]:
            return queryset
        
        return queryset.filter(conversation__assigned_agent=user)


class ChatbotQualificationRuleViewSet(viewsets.ModelViewSet):
    """ViewSet for ChatbotQualificationRule model"""
    serializer_class = ChatbotQualificationRuleSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrManager]
    
    def get_queryset(self):
        """Filter rules by chatbot"""
        queryset = ChatbotQualificationRule.objects.select_related('chatbot').all()
        chatbot_id = self.request.query_params.get('chatbot_id')
        if chatbot_id:
            queryset = queryset.filter(chatbot_id=chatbot_id)
        return queryset


# ==================== WEBHOOK HANDLERS ====================

@csrf_exempt
@api_view(['POST'])
@permission_classes([])  # No authentication required for webhooks
def twilio_status_webhook(request):
    """Handle Twilio status callback webhook"""
    from .services.telephony_service import process_twilio_status_webhook
    
    try:
        call_log = process_twilio_status_webhook(request.POST.dict())
        if call_log:
            return HttpResponse('OK', status=200)
        return HttpResponse('Not Found', status=404)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Twilio webhook error: {e}", exc_info=True)
        return HttpResponse('Error', status=500)


@csrf_exempt
@api_view(['POST'])
@permission_classes([])
def twilio_recording_webhook(request):
    """Handle Twilio recording callback webhook"""
    from .services.telephony_service import process_twilio_recording_webhook
    
    try:
        call_log = process_twilio_recording_webhook(request.POST.dict())
        if call_log:
            return HttpResponse('OK', status=200)
        return HttpResponse('Not Found', status=404)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Twilio recording webhook error: {e}", exc_info=True)
        return HttpResponse('Error', status=500)


@csrf_exempt
@api_view(['POST'])
@permission_classes([])
def chatbot_webhook(request, chatbot_id):
    """Handle chatbot webhook (for external chatbot providers)"""
    from .services.chatbot_service import start_conversation, send_user_message
    from django.utils import timezone
    
    try:
        chatbot = Chatbot.objects.get(id=chatbot_id, status=Chatbot.Status.ACTIVE)
        data = json.loads(request.body) if request.body else {}
        
        # Handle different webhook types
        webhook_type = data.get('type', 'message')
        
        if webhook_type == 'message':
            conversation_id = data.get('conversation_id')
            if conversation_id:
                try:
                    conversation = ChatbotConversation.objects.get(conversation_id=conversation_id)
                except ChatbotConversation.DoesNotExist:
                    # Create new conversation if doesn't exist
                    conversation = start_conversation(
                        chatbot=chatbot,
                        visitor_id=data.get('visitor_id'),
                        visitor_name=data.get('visitor_name'),
                        visitor_email=data.get('visitor_email'),
                        visitor_phone=data.get('visitor_phone'),
                        visitor_ip=request.META.get('REMOTE_ADDR'),
                        user_agent=request.META.get('HTTP_USER_AGENT')
                    )
                
                message, response = send_user_message(
                    conversation=conversation,
                    content=data.get('content', ''),
                    intent=data.get('intent'),
                    confidence=data.get('confidence'),
                    entities=data.get('entities', [])
                )
                return Response({
                    'response': response.content,
                    'conversation_id': conversation.conversation_id
                })
            else:
                # Start new conversation
                conversation = start_conversation(
                    chatbot=chatbot,
                    visitor_id=data.get('visitor_id'),
                    visitor_name=data.get('visitor_name'),
                    visitor_email=data.get('visitor_email'),
                    visitor_phone=data.get('visitor_phone'),
                    visitor_ip=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT')
                )
                return Response({
                    'conversation_id': conversation.conversation_id,
                    'welcome_message': chatbot.welcome_message
                })
        
        return Response({'error': 'Invalid webhook type'}, status=status.HTTP_400_BAD_REQUEST)
    except Chatbot.DoesNotExist:
        return Response({'error': 'Chatbot not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Chatbot webhook error: {e}", exc_info=True)
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== PROJECT STRUCTURE VIEWSETS ====================

class ProjectViewSet(viewsets.ModelViewSet):
    """ViewSet for Project model"""
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name', 'code', 'location', 'city']
    filterset_fields = ['status', 'city', 'state']
    
    def get_queryset(self):
        return Project.objects.prefetch_related('towers').all()


class TowerViewSet(viewsets.ModelViewSet):
    """ViewSet for Tower model"""
    serializer_class = TowerSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name', 'code']
    filterset_fields = ['project']
    
    def get_queryset(self):
        return Tower.objects.select_related('project').prefetch_related('floors').all()


class FloorViewSet(viewsets.ModelViewSet):
    """ViewSet for Floor model"""
    serializer_class = FloorSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['tower']
    
    def get_queryset(self):
        return Floor.objects.select_related('tower', 'tower__project').prefetch_related('units').all()


class UnitViewSet(viewsets.ModelViewSet):
    """ViewSet for Unit model"""
    serializer_class = UnitSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['unit_number', 'unit_type']
    filterset_fields = ['floor', 'status', 'unit_type']
    
    def get_queryset(self):
        return Unit.objects.select_related('floor', 'floor__tower', 'floor__tower__project').all()


# ==================== BOOKING PAYMENT VIEWSETS ====================

class BookingPaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for BookingPayment model"""
    serializer_class = BookingPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['booking_id', 'client__name', 'unit__unit_number']
    filterset_fields = ['status', 'payment_method', 'deal', 'unit']
    
    def get_queryset(self):
        return BookingPayment.objects.select_related(
            'deal', 'unit', 'client', 'created_by', 'approved_by'
        ).all()
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve booking payment"""
        booking = self.get_object()
        booking.status = BookingPayment.Status.RECEIVED
        booking.approved_by = request.user
        booking.save()
        return Response({'status': 'approved'})
    
    @action(detail=True, methods=['post'])
    def clear_cheque(self, request, pk=None):
        """Mark cheque as cleared"""
        booking = self.get_object()
        booking.cheque_cleared = True
        booking.cheque_cleared_date = timezone.now().date()
        booking.status = BookingPayment.Status.CLEARED
        booking.save()
        return Response({'status': 'cheque_cleared'})
    
    @action(detail=True, methods=['post'])
    def generate_receipt(self, request, pk=None):
        """Generate receipt for booking payment"""
        booking = self.get_object()
        # TODO: Implement receipt generation service
        return Response({'message': 'Receipt generation will be implemented'})
    
    @action(detail=True, methods=['post'])
    def send_receipt(self, request, pk=None):
        """Send receipt via WhatsApp/Email"""
        booking = self.get_object()
        method = request.data.get('method', 'email')  # email or whatsapp
        # TODO: Implement receipt sending service
        return Response({'message': f'Receipt sending via {method} will be implemented'})


class ReceiptViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Receipt model (Read-only)"""
    serializer_class = ReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['receipt_number', 'client__name']
    filterset_fields = ['receipt_type', 'deal', 'client']
    
    def get_queryset(self):
        return Receipt.objects.select_related('deal', 'client', 'unit').all()
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download receipt PDF"""
        receipt = self.get_object()
        if receipt.pdf_url:
            return Response({'pdf_url': receipt.pdf_url})
        return Response({'error': 'PDF not generated'}, status=status.HTTP_404_NOT_FOUND)


# ==================== GST & TAX VIEWSETS ====================

class GSTConfigurationViewSet(viewsets.ModelViewSet):
    """ViewSet for GSTConfiguration model"""
    serializer_class = GSTConfigurationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrManager]
    filterset_fields = ['property_type', 'charge_type', 'is_active']
    
    def get_queryset(self):
        return GSTConfiguration.objects.all()


class TaxBreakdownViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for TaxBreakdown model (Read-only)"""
    serializer_class = TaxBreakdownSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['invoice']
    
    def get_queryset(self):
        return TaxBreakdown.objects.select_related('invoice').all()


# ==================== PAYMENT SCHEDULE VIEWSETS ====================

class PaymentScheduleViewSet(viewsets.ModelViewSet):
    """ViewSet for PaymentSchedule model"""
    serializer_class = PaymentScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['deal', 'plan_type', 'is_active']
    
    def get_queryset(self):
        return PaymentSchedule.objects.select_related('deal').prefetch_related('milestones').all()
    
    @action(detail=True, methods=['post'])
    def generate_installments(self, request, pk=None):
        """Generate installments for payment schedule"""
        schedule = self.get_object()
        # TODO: Implement installment generation logic
        return Response({'message': 'Installment generation will be implemented'})


class PaymentMilestoneViewSet(viewsets.ModelViewSet):
    """ViewSet for PaymentMilestone model"""
    serializer_class = PaymentMilestoneSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['payment_schedule', 'completed']
    
    def get_queryset(self):
        return PaymentMilestone.objects.select_related('payment_schedule').all()


# ==================== LEDGER VIEWSETS ====================

class LedgerViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Ledger model (Read-only)"""
    serializer_class = LedgerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['ledger_type', 'customer', 'unit', 'project']
    
    def get_queryset(self):
        return Ledger.objects.select_related('customer', 'unit', 'project').all()
    
    @action(detail=False, methods=['get'])
    def statement(self, request):
        """Get statement of account"""
        ledger_type = request.query_params.get('type', 'Customer')
        customer_id = request.query_params.get('customer')
        unit_id = request.query_params.get('unit')
        project_id = request.query_params.get('project')
        
        queryset = self.get_queryset().filter(ledger_type=ledger_type)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if unit_id:
            queryset = queryset.filter(unit_id=unit_id)
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export ledger to Excel/PDF"""
        # TODO: Implement export functionality
        return Response({'message': 'Export functionality will be implemented'})


# ==================== REFUND VIEWSETS ====================

class RefundViewSet(viewsets.ModelViewSet):
    """ViewSet for Refund model"""
    serializer_class = RefundSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['refund_id', 'deal__lead__name']
    filterset_fields = ['status', 'deal', 'reason']
    
    def get_queryset(self):
        return Refund.objects.select_related(
            'deal', 'booking_payment', 'payment', 'requested_by', 'approved_by'
        ).all()
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve refund request"""
        refund = self.get_object()
        if refund.status != Refund.Status.PENDING:
            return Response({'error': 'Refund already processed'}, status=status.HTTP_400_BAD_REQUEST)
        
        refund.status = Refund.Status.APPROVED
        refund.approved_by = request.user
        refund.approved_at = timezone.now()
        refund.save()
        return Response({'status': 'approved'})
    
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Process approved refund"""
        refund = self.get_object()
        if refund.status != Refund.Status.APPROVED:
            return Response({'error': 'Refund must be approved first'}, status=status.HTTP_400_BAD_REQUEST)
        
        refund.status = Refund.Status.PROCESSED
        refund.processed_at = timezone.now()
        refund.save()
        # TODO: Create ledger entry and receipt
        return Response({'status': 'processed'})


class CreditNoteViewSet(viewsets.ModelViewSet):
    """ViewSet for CreditNote model"""
    serializer_class = CreditNoteSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrManager]
    filterset_fields = ['deal']
    
    def get_queryset(self):
        return CreditNote.objects.select_related('deal', 'applied_to_invoice').all()


# ==================== BANK RECONCILIATION VIEWSETS ====================

class BankReconciliationViewSet(viewsets.ModelViewSet):
    """ViewSet for BankReconciliation model"""
    serializer_class = BankReconciliationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrManager]
    filterset_fields = ['status', 'bank_name', 'account_number']
    
    def get_queryset(self):
        return BankReconciliation.objects.select_related(
            'matched_payment', 'matched_booking', 'reconciled_by'
        ).all()
    
    @action(detail=False, methods=['post'])
    def auto_match(self, request):
        """Auto-match bank transactions with payments"""
        # TODO: Implement auto-matching logic based on reference numbers/UTRs
        return Response({'message': 'Auto-matching will be implemented'})
    
    @action(detail=True, methods=['post'])
    def match_payment(self, request, pk=None):
        """Manually match bank transaction with payment"""
        bank_txn = self.get_object()
        payment_id = request.data.get('payment_id')
        booking_id = request.data.get('booking_id')
        
        if payment_id:
            try:
                payment = Payment.objects.get(id=payment_id)
                bank_txn.matched_payment = payment
                bank_txn.status = BankReconciliation.Status.MATCHED
            except Payment.DoesNotExist:
                return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)
        elif booking_id:
            try:
                booking = BookingPayment.objects.get(id=booking_id)
                bank_txn.matched_booking = booking
                bank_txn.status = BankReconciliation.Status.MATCHED
            except BookingPayment.DoesNotExist:
                return Response({'error': 'Booking payment not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'error': 'payment_id or booking_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        bank_txn.reconciled_by = request.user
        bank_txn.reconciled_at = timezone.now()
        bank_txn.save()
        return Response({'status': 'matched'})

