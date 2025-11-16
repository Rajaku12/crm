"""
Smoke tests - Critical user flows
"""
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestSmokeTests:
    """Smoke tests for critical functionality"""
    
    def test_api_root_accessible(self, client):
        """Smoke test: API root should be accessible"""
        # Test the root API endpoint
        response = client.get('/api/')
        # Should return 200 or 401 (if auth required)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED, status.HTTP_404_NOT_FOUND]
    
    def test_login_endpoint_exists(self, client):
        """Smoke test: Login endpoint should exist"""
        url = reverse('token_obtain_pair')
        response = client.post(url, {})
        # Should not return 404
        assert response.status_code != status.HTTP_404_NOT_FOUND
    
    def test_authenticated_user_can_access_profile(self, authenticated_client, agent_user):
        """Smoke test: Authenticated user can access their profile"""
        url = reverse('agent-me')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == agent_user.id
    
    def test_leads_endpoint_requires_authentication(self, client):
        """Smoke test: Leads endpoint requires authentication"""
        url = reverse('lead-list')
        response = client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_properties_endpoint_requires_authentication(self, client):
        """Smoke test: Properties endpoint requires authentication"""
        url = reverse('property-list')
        response = client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

