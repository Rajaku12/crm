"""
Sanity tests - Basic functionality checks
"""
import pytest
from django.contrib.auth import get_user_model
from api.models import Agent, Property, Lead, Client

User = get_user_model()


@pytest.mark.django_db
class TestSanityTests:
    """Sanity tests for basic functionality"""
    
    def test_database_connection(self):
        """Sanity test: Database should be accessible"""
        # Try to create and retrieve a user
        user = User.objects.create_user(
            username='sanity_test',
            password='testpass123'
        )
        assert User.objects.filter(username='sanity_test').exists()
        user.delete()
    
    def test_agent_model_works(self):
        """Sanity test: Agent model should work"""
        agent = Agent.objects.create_user(
            username='sanity_agent',
            password='testpass123',
            role='Agent'
        )
        assert agent.role == 'Agent'
        assert Agent.objects.filter(username='sanity_agent').exists()
        agent.delete()
    
    def test_property_model_works(self):
        """Sanity test: Property model should work"""
        property = Property.objects.create(
            name='Sanity Test Property',
            category='Residential',
            price=1000000.00,
            status='Available',
            location='Test'
        )
        assert property.name == 'Sanity Test Property'
        assert Property.objects.filter(name='Sanity Test Property').exists()
        property.delete()
    
    def test_lead_model_works(self, agent_user, test_property):
        """Sanity test: Lead model should work"""
        lead = Lead.objects.create(
            name='Sanity Test Lead',
            phone='1111111111',
            email='sanity@test.com',
            source='Website',
            status='New',
            agent=agent_user,
            property=test_property
        )
        assert lead.name == 'Sanity Test Lead'
        assert Lead.objects.filter(name='Sanity Test Lead').exists()
        lead.delete()
    
    def test_client_model_works(self):
        """Sanity test: Client model should work"""
        client = Client.objects.create(
            name='Sanity Test Client',
            email='sanity@test.com',
            contact='2222222222'
        )
        assert client.name == 'Sanity Test Client'
        assert Client.objects.filter(name='Sanity Test Client').exists()
        client.delete()

