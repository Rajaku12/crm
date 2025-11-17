from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from . import views

# API Root View
@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """API root endpoint showing all available endpoints"""
    return Response({
        'message': 'Zenith Estate CRM API',
        'version': '1.0',
        'endpoints': {
            'authentication': {
                'login': '/api/auth/token/',
                'register': '/api/auth/register/',
                'refresh_token': '/api/auth/token/refresh/',
                'verify_token': '/api/auth/token/verify/',
            },
            'resources': {
                'leads': '/api/leads/',
                'agents': '/api/agents/',
                'properties': '/api/properties/',
                'clients': '/api/clients/',
                'deals': '/api/deals/',
                'call_logs': '/api/call-logs/',
                'telephony_configs': '/api/telephony-configs/',
            },
            'documentation': 'Visit /admin/ for Django admin interface',
        }
    })

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'leads', views.LeadViewSet, basename='lead')
router.register(r'agents', views.AgentViewSet, basename='agent')
router.register(r'properties', views.PropertyViewSet, basename='property')
router.register(r'clients', views.ClientViewSet, basename='client')
router.register(r'attendance', views.AttendanceRecordViewSet, basename='attendance')
router.register(r'whatsapp-templates', views.WhatsAppTemplateViewSet, basename='whatsapp-template')
router.register(r'automation-rules', views.AutomationRuleViewSet, basename='automation-rule')
router.register(r'notifications', views.NotificationViewSet, basename='notification')

# Activities and Tasks can be accessed directly or nested under leads
router.register(r'activities', views.ActivityViewSet, basename='activity')
router.register(r'tasks', views.TaskViewSet, basename='task')

# Deal Management
router.register(r'deals', views.DealViewSet, basename='deal')

# Invoice Management
router.register(r'payment-plans', views.PaymentPlanViewSet, basename='payment-plan')
router.register(r'invoices', views.InvoiceViewSet, basename='invoice')
router.register(r'payments', views.PaymentViewSet, basename='payment')
router.register(r'installments', views.InstallmentViewSet, basename='installment')

# Quote Management
router.register(r'quotes', views.QuoteViewSet, basename='quote')

# Commission Management
router.register(r'commissions', views.CommissionViewSet, basename='commission')
router.register(r'commission-splits', views.CommissionSplitViewSet, basename='commission-split')

# Customer Portal
router.register(r'portal-users', views.CustomerPortalUserViewSet, basename='portal-user')
router.register(r'documents', views.DocumentViewSet, basename='document')
router.register(r'file-access-logs', views.FileAccessLogViewSet, basename='file-access-log')

# Integrations
router.register(r'integrations', views.IntegrationConfigViewSet, basename='integration')

# Templates
router.register(r'invoice-templates', views.InvoiceTemplateViewSet, basename='invoice-template')
router.register(r'quote-templates', views.QuoteTemplateViewSet, basename='quote-template')
router.register(r'email-templates', views.EmailTemplateViewSet, basename='email-template')
router.register(r'agreement-templates', views.AgreementTemplateViewSet, basename='agreement-template')

# Workflow Automation
router.register(r'workflow-rules', views.WorkflowRuleViewSet, basename='workflow-rule')
router.register(r'workflow-actions', views.WorkflowActionViewSet, basename='workflow-action')

# Call Logging
router.register(r'call-logs', views.CallLogViewSet, basename='call-log')
router.register(r'telephony-configs', views.TelephonyConfigViewSet, basename='telephony-config')

# Chatbot
router.register(r'chatbots', views.ChatbotViewSet, basename='chatbot')
router.register(r'chatbot-conversations', views.ChatbotConversationViewSet, basename='chatbot-conversation')
router.register(r'chatbot-messages', views.ChatbotMessageViewSet, basename='chatbot-message')
router.register(r'chatbot-qualification-rules', views.ChatbotQualificationRuleViewSet, basename='chatbot-qualification-rule')

# Project Structure
router.register(r'projects', views.ProjectViewSet, basename='project')
router.register(r'towers', views.TowerViewSet, basename='tower')
router.register(r'floors', views.FloorViewSet, basename='floor')
router.register(r'units', views.UnitViewSet, basename='unit')

# Booking Payment Management
router.register(r'booking-payments', views.BookingPaymentViewSet, basename='booking-payment')
router.register(r'receipts', views.ReceiptViewSet, basename='receipt')

# GST & Tax
router.register(r'gst-configurations', views.GSTConfigurationViewSet, basename='gst-configuration')
router.register(r'tax-breakdowns', views.TaxBreakdownViewSet, basename='tax-breakdown')

# Payment Schedules
router.register(r'payment-schedules', views.PaymentScheduleViewSet, basename='payment-schedule')
router.register(r'payment-milestones', views.PaymentMilestoneViewSet, basename='payment-milestone')

# Ledger
router.register(r'ledgers', views.LedgerViewSet, basename='ledger')

# Refunds & Adjustments
router.register(r'refunds', views.RefundViewSet, basename='refund')
router.register(r'credit-notes', views.CreditNoteViewSet, basename='credit-note')

# Bank Reconciliation
router.register(r'bank-reconciliations', views.BankReconciliationViewSet, basename='bank-reconciliation')

urlpatterns = [
    # API Root
    path('', api_root, name='api-root'),
    
    # JWT Authentication endpoints
    path('auth/token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    
    # Webhook endpoints (no authentication required)
    path('webhooks/twilio/status/', views.twilio_status_webhook, name='twilio_status_webhook'),
    path('webhooks/twilio/recording/', views.twilio_recording_webhook, name='twilio_recording_webhook'),
    path('webhooks/chatbot/<int:chatbot_id>/', views.chatbot_webhook, name='chatbot_webhook'),
    
    # Include router URLs
    path('', include(router.urls)),
]

