"""
Unit tests for models
"""
import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from api.models import Agent, Lead, Property, Client, Deal, BookingPayment


@pytest.mark.django_db
class TestAgentModel:
    """Unit tests for Agent model"""
    
    def test_create_agent(self):
        """Test creating an agent"""
        agent = Agent.objects.create_user(
            username='testagent',
            email='test@example.com',
            password='testpass123',
            role='Agent',
            first_name='Test',
            last_name='Agent'
        )
        assert agent.username == 'testagent'
        assert agent.role == 'Agent'
        assert agent.name == 'Test Agent'
    
    def test_agent_name_property(self):
        """Test agent name property"""
        agent = Agent.objects.create_user(
            username='test',
            password='testpass123',
            first_name='John',
            last_name='Doe'
        )
        assert agent.name == 'John Doe'
        
        # Test with only first name
        agent2 = Agent.objects.create_user(
            username='test2',
            password='testpass123',
            first_name='Jane'
        )
        assert agent2.name == 'Jane'
        
        # Test with no name
        agent3 = Agent.objects.create_user(
            username='test3',
            password='testpass123'
        )
        assert agent3.name == 'test3'
    
    def test_agent_str_representation(self):
        """Test agent string representation"""
        agent = Agent.objects.create_user(
            username='test',
            password='testpass123',
            role='Agent'
        )
        assert 'Agent' in str(agent)


@pytest.mark.django_db
class TestPropertyModel:
    """Unit tests for Property model"""
    
    def test_create_property(self):
        """Test creating a property"""
        property = Property.objects.create(
            name='Test Property',
            category='Residential',
            price=5000000.00,
            status='Available',
            location='Test Location'
        )
        assert property.name == 'Test Property'
        assert property.category == 'Residential'
        assert property.price == 5000000.00
        assert property.status == 'Available'
    
    def test_property_stats_property(self, test_property):
        """Test property stats calculation"""
        stats = test_property.stats
        assert 'inquiries' in stats
        assert 'conversions' in stats
        assert isinstance(stats['inquiries'], int)
        assert isinstance(stats['conversions'], int)
    
    def test_property_str_representation(self, test_property):
        """Test property string representation"""
        assert test_property.name in str(test_property)
        assert test_property.location in str(test_property)


@pytest.mark.django_db
class TestLeadModel:
    """Unit tests for Lead model"""
    
    def test_create_lead(self, agent_user, test_property):
        """Test creating a lead"""
        lead = Lead.objects.create(
            name='Test Lead',
            phone='1234567890',
            email='lead@test.com',
            source='Website',
            status='New',
            tag='Warm',
            assigned_to=agent_user,
            property=test_property
        )
        assert lead.name == 'Test Lead'
        assert lead.phone == '1234567890'
        assert lead.assigned_to == agent_user
        assert lead.property == test_property
    
    def test_lead_str_representation(self, test_lead):
        """Test lead string representation"""
        assert test_lead.name in str(test_lead)


@pytest.mark.django_db
class TestClientModel:
    """Unit tests for Client model"""
    
    def test_create_client(self):
        """Test creating a client"""
        client = Client.objects.create(
            name='Test Client',
            email='client@test.com',
            phone='9876543210'
        )
        assert client.name == 'Test Client'
        assert client.email == 'client@test.com'
    
    def test_client_str_representation(self, test_client):
        """Test client string representation"""
        assert test_client.name in str(test_client)


@pytest.mark.django_db
class TestDealModel:
    """Unit tests for Deal model"""
    
    def test_create_deal(self, agent_user, test_client, test_property):
        """Test creating a deal"""
        deal = Deal.objects.create(
            client=test_client,
            property=test_property,
            agent=agent_user,
            amount=5000000.00,
            status='Pending'
        )
        assert deal.client == test_client
        assert deal.property == test_property
        assert deal.agent == agent_user
        assert deal.amount == 5000000.00


@pytest.mark.django_db
class TestBookingPaymentModel:
    """Unit tests for BookingPayment model"""
    
    def test_create_booking_payment(self, test_deal):
        """Test creating a booking payment"""
        payment = BookingPayment.objects.create(
            deal=test_deal,
            amount=100000.00,
            payment_date='2024-01-15',
            payment_method='Cheque',
            status='Pending'
        )
        assert payment.deal == test_deal
        assert payment.amount == 100000.00
        assert payment.payment_method == 'Cheque'

