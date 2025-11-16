"""
Unit tests for API views
"""
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from api.models import Lead, Property, Client, Deal


@pytest.mark.django_db
class TestAuthentication:
    """Unit tests for authentication endpoints"""
    
    def test_login_success(self, client, agent_user):
        """Test successful login"""
        url = reverse('token_obtain_pair')
        response = client.post(url, {
            'username': 'agent',
            'password': 'testpass123'
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
    
    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials"""
        url = reverse('token_obtain_pair')
        response = client.post(url, {
            'username': 'invalid',
            'password': 'wrong'
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_token_refresh(self, client, agent_user):
        """Test token refresh"""
        # First get tokens
        login_url = reverse('token_obtain_pair')
        login_response = client.post(login_url, {
            'username': 'agent',
            'password': 'testpass123'
        })
        refresh_token = login_response.data['refresh']
        
        # Refresh token
        refresh_url = reverse('token_refresh')
        response = client.post(refresh_url, {
            'refresh': refresh_token
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data


@pytest.mark.django_db
class TestLeadViewSet:
    """Unit tests for Lead ViewSet"""
    
    def test_list_leads_authenticated(self, authenticated_client, test_lead):
        """Test listing leads when authenticated"""
        url = reverse('lead-list')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
    
    def test_list_leads_unauthenticated(self, client):
        """Test listing leads when not authenticated"""
        url = reverse('lead-list')
        response = client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_lead(self, authenticated_client, agent_user, test_property):
        """Test creating a lead"""
        url = reverse('lead-list')
        data = {
            'name': 'New Lead',
            'phone': '9999999999',
            'email': 'newlead@test.com',
            'source': 'Website',
            'status': 'New',
            'tag': 'Warm',
            'agent': agent_user.id,
            'property': test_property.id
        }
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'New Lead'
    
    def test_retrieve_lead(self, authenticated_client, test_lead):
        """Test retrieving a single lead"""
        url = reverse('lead-detail', kwargs={'pk': test_lead.id})
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == test_lead.id


@pytest.mark.django_db
class TestPropertyViewSet:
    """Unit tests for Property ViewSet"""
    
    def test_list_properties(self, authenticated_client, test_property):
        """Test listing properties"""
        url = reverse('property-list')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
    
    def test_create_property(self, authenticated_client):
        """Test creating a property"""
        url = reverse('property-list')
        data = {
            'name': 'New Property',
            'category': 'Residential',
            'price': '6000000.00',
            'status': 'Available',
            'location': 'New Location'
        }
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'New Property'


@pytest.mark.django_db
class TestClientViewSet:
    """Unit tests for Client ViewSet"""
    
    def test_list_clients(self, authenticated_client, test_client):
        """Test listing clients"""
        url = reverse('client-list')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
    
    def test_create_client(self, authenticated_client):
        """Test creating a client"""
        url = reverse('client-list')
        data = {
            'name': 'New Client',
            'email': 'newclient@test.com',
            'contact': '8888888888'
        }
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'New Client'

