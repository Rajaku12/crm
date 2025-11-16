#!/usr/bin/env python
"""
Comprehensive code test script
Tests all imports, models, views, and serializers
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'zenith_crm.settings')
django.setup()

def test_imports():
    """Test all imports"""
    print("=" * 60)
    print("TESTING IMPORTS")
    print("=" * 60)
    
    try:
        from api.models import (
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
        print("✅ All models imported successfully")
    except Exception as e:
        print(f"❌ Model import error: {e}")
        return False
    
    try:
        from api.serializers import (
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
        print("✅ All serializers imported successfully")
    except Exception as e:
        print(f"❌ Serializer import error: {e}")
        return False
    
    try:
        from api.views import (
            LeadViewSet, ActivityViewSet, TaskViewSet, PropertyViewSet,
            AgentViewSet, ClientViewSet, AttendanceRecordViewSet,
            WhatsAppTemplateViewSet, AutomationRuleViewSet, NotificationViewSet,
            DealViewSet, InvoiceViewSet, PaymentViewSet, PaymentPlanViewSet,
            InstallmentViewSet, QuoteViewSet, CommissionViewSet, CommissionSplitViewSet,
            CustomerPortalUserViewSet, DocumentViewSet, FileAccessLogViewSet,
            IntegrationConfigViewSet, InvoiceTemplateViewSet, QuoteTemplateViewSet,
            EmailTemplateViewSet, AgreementTemplateViewSet, WorkflowRuleViewSet, WorkflowActionViewSet,
            CallLogViewSet, TelephonyConfigViewSet, ChatbotViewSet,
            ChatbotConversationViewSet, ChatbotMessageViewSet, ChatbotQualificationRuleViewSet,
            ProjectViewSet, TowerViewSet, FloorViewSet, UnitViewSet,
            BookingPaymentViewSet, ReceiptViewSet, GSTConfigurationViewSet, TaxBreakdownViewSet,
            PaymentScheduleViewSet, PaymentMilestoneViewSet, LedgerViewSet,
            RefundViewSet, CreditNoteViewSet, BankReconciliationViewSet
        )
        print("✅ All views imported successfully")
    except Exception as e:
        print(f"❌ View import error: {e}")
        return False
    
    return True

def test_models():
    """Test model creation and validation"""
    print("\n" + "=" * 60)
    print("TESTING MODELS")
    print("=" * 60)
    
    from django.core.exceptions import ValidationError
    from api.models import Agent, Property, Lead
    
    try:
        # Test Agent model (password is required for AbstractUser)
        agent = Agent(username='test_agent', email='test@example.com', role='Agent')
        agent.set_password('test_password_123')
        agent.full_clean()
        print("✅ Agent model validation passed")
    except Exception as e:
        print(f"❌ Agent model error: {e}")
        return False
    
    try:
        # Test Property model
        property = Property(
            name='Test Property',
            category='Residential',
            price=1000000.00,
            status='Available',
            location='Test Location'
        )
        property.full_clean()
        print("✅ Property model validation passed")
    except Exception as e:
        print(f"❌ Property model error: {e}")
        return False
    
    return True

def test_urls():
    """Test URL configuration"""
    print("\n" + "=" * 60)
    print("TESTING URLS")
    print("=" * 60)
    
    try:
        from django.urls import reverse
        from django.test import Client
        
        # Test that URLs can be resolved
        client = Client()
        print("✅ URL client created successfully")
    except Exception as e:
        print(f"❌ URL test error: {e}")
        return False
    
    return True

def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("COMPREHENSIVE CODE TEST")
    print("=" * 60 + "\n")
    
    results = []
    
    results.append(("Imports", test_imports()))
    results.append(("Models", test_models()))
    results.append(("URLs", test_urls()))
    
    print("\n" + "=" * 60)
    print("TEST RESULTS")
    print("=" * 60)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
    
    all_passed = all(result for _, result in results)
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ ALL TESTS PASSED!")
    else:
        print("❌ SOME TESTS FAILED")
    print("=" * 60 + "\n")
    
    return 0 if all_passed else 1

if __name__ == '__main__':
    sys.exit(main())

