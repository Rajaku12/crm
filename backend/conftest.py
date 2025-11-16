"""
Pytest configuration and fixtures for Django tests
"""
import pytest
from django.contrib.auth import get_user_model
from api.models import Lead, Property, Client, Deal, BookingPayment

User = get_user_model()


@pytest.fixture
def admin_user(db):
    """Create an admin user for testing"""
    return User.objects.create_user(
        username='admin',
        email='admin@test.com',
        password='testpass123',
        role='Admin',
        is_staff=True,
        is_superuser=True
    )


@pytest.fixture
def agent_user(db):
    """Create an agent user for testing"""
    return User.objects.create_user(
        username='agent',
        email='agent@test.com',
        password='testpass123',
        role='Agent',
        first_name='Test',
        last_name='Agent'
    )


@pytest.fixture
def sales_manager_user(db):
    """Create a sales manager user for testing"""
    return User.objects.create_user(
        username='manager',
        email='manager@test.com',
        password='testpass123',
        role='Sales Manager',
        first_name='Test',
        last_name='Manager'
    )


@pytest.fixture
def test_property(db):
    """Create a test property"""
    return Property.objects.create(
        name='Test Property',
        category='Residential',
        price=5000000.00,
        status='Available',
        location='Test Location'
    )


@pytest.fixture
def test_lead(db, agent_user, test_property):
    """Create a test lead"""
    return Lead.objects.create(
        name='Test Lead',
        phone='1234567890',
        email='lead@test.com',
        source='Website',
        status='New',
        tag='Warm',
        agent=agent_user,
        property=test_property
    )


@pytest.fixture
def test_client(db):
    """Create a test client"""
    return Client.objects.create(
        name='Test Client',
        email='client@test.com',
        contact='9876543210'
    )


@pytest.fixture
def test_deal(db, agent_user, test_client, test_property):
    """Create a test deal"""
    return Deal.objects.create(
        client=test_client,
        property=test_property,
        agent=agent_user,
        amount=5000000.00,
        status='Pending'
    )


@pytest.fixture
def authenticated_client(agent_user):
    """Create an authenticated API client"""
    from rest_framework.test import APIClient
    from rest_framework_simplejwt.tokens import RefreshToken
    client = APIClient()
    refresh = RefreshToken.for_user(agent_user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client

