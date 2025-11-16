"""
SMS Integration Service
Supports Twilio and Textlocal
"""
from ..models import IntegrationConfig


def send_sms(to, message, integration_config=None):
    """
    Send SMS using configured integration
    
    Args:
        to: Recipient phone number
        message: SMS message
        integration_config: IntegrationConfig instance (optional)
    
    Returns:
        Boolean indicating success
    """
    if not integration_config:
        integration_config = IntegrationConfig.objects.filter(
            type=IntegrationConfig.IntegrationType.SMS,
            is_enabled=True
        ).first()
    
    if not integration_config:
        return False
    
    provider = integration_config.provider.lower()
    config = integration_config.config
    
    if provider == 'twilio':
        return send_via_twilio(to, message, config)
    elif provider == 'textlocal':
        return send_via_textlocal(to, message, config)
    else:
        return False


def send_via_twilio(to, message, config):
    """Send SMS via Twilio"""
    try:
        from twilio.rest import Client
        
        client = Client(config.get('account_sid'), config.get('auth_token'))
        
        message = client.messages.create(
            body=message,
            from_=config.get('from_number'),
            to=to
        )
        return message.sid is not None
    except Exception as e:
        print(f"Twilio error: {e}")
        return False


def send_via_textlocal(to, message, config):
    """Send SMS via Textlocal"""
    try:
        import requests
        
        url = "https://api.textlocal.in/send/"
        params = {
            'apikey': config.get('api_key'),
            'numbers': to,
            'message': message,
            'sender': config.get('sender_id', 'TXTLCL')
        }
        
        response = requests.get(url, params=params)
        return response.status_code == 200
    except Exception as e:
        print(f"Textlocal error: {e}")
        return False

