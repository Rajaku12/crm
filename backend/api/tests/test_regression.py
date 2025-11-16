"""
Regression tests - Ensure previous fixes still work
"""
import pytest
from django.urls import reverse
from rest_framework import status
from api.models import Agent, Lead, Property


@pytest.mark.django_db
class TestRegressionTests:
    """Regression tests to ensure previous fixes still work"""
    
    def test_agent_password_validation_fix(self):
        """Regression: Agent model should accept password properly"""
        # This was a previous bug where password validation failed
        agent = Agent.objects.create_user(
            username='regression_test',
            password='test_password_123',
            role='Agent'
        )
        assert agent.check_password('test_password_123')
        agent.delete()
    
    def test_agent_me_endpoint_permissions(self, authenticated_client, agent_user):
        """Regression: Agent me endpoint should be accessible to all authenticated users"""
        # This was fixed to allow all authenticated users, not just admins
        url = reverse('agent-me')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == agent_user.id
    
    def test_paginated_response_handling(self, authenticated_client, test_property):
        """Regression: API should handle paginated responses correctly"""
        # This was a bug where frontend couldn't handle paginated responses
        url = reverse('property-list')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        # Should have 'results' key for paginated responses
        assert 'results' in response.data or isinstance(response.data, list)
    
    def test_lead_assignment_works(self, agent_user, test_property):
        """Regression: Lead assignment should work correctly"""
        lead = Lead.objects.create(
            name='Regression Test Lead',
            phone='3333333333',
            email='regression@test.com',
            source='Website',
            status='New',
            agent=agent_user,
            property=test_property
        )
        assert lead.agent == agent_user
        assert lead.property == test_property
        lead.delete()
    
    def test_property_stats_calculation(self, test_property, agent_user):
        """Regression: Property stats should calculate without errors"""
        # This was a bug where stats calculation could fail
        stats = test_property.stats
        assert isinstance(stats, dict)
        assert 'inquiries' in stats
        assert 'conversions' in stats

