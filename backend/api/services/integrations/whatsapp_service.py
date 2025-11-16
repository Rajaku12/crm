"""
WhatsApp Integration Service
Supports Meta WhatsApp Cloud API
"""
from ..models import IntegrationConfig


def send_whatsapp(to, message, template_name=None, template_params=None, integration_config=None):
    """
    Send WhatsApp message using configured integration
    
    Args:
        to: Recipient phone number (with country code, e.g., +919876543210)
        message: Message text (or template name if using template)
        template_name: Template name (if using template)
        template_params: Template parameters
        integration_config: IntegrationConfig instance (optional)
    
    Returns:
        Boolean indicating success
    """
    if not integration_config:
        integration_config = IntegrationConfig.objects.filter(
            type=IntegrationConfig.IntegrationType.WHATSAPP,
            is_enabled=True
        ).first()
    
    if not integration_config:
        return False
    
    provider = integration_config.provider.lower()
    config = integration_config.config
    
    if provider == 'meta' or provider == 'whatsapp cloud api':
        return send_via_meta_whatsapp(to, message, template_name, template_params, config)
    else:
        return False


def send_via_meta_whatsapp(to, message, template_name, template_params, config):
    """Send WhatsApp message via Meta Cloud API"""
    try:
        import requests
        
        url = f"https://graph.facebook.com/v18.0/{config.get('phone_number_id')}/messages"
        headers = {
            'Authorization': f"Bearer {config.get('access_token')}",
            'Content-Type': 'application/json'
        }
        
        if template_name:
            # Send template message
            payload = {
                'messaging_product': 'whatsapp',
                'to': to,
                'type': 'template',
                'template': {
                    'name': template_name,
                    'language': {'code': 'en'},
                    'components': template_params or []
                }
            }
        else:
            # Send text message
            payload = {
                'messaging_product': 'whatsapp',
                'to': to,
                'type': 'text',
                'text': {'body': message}
            }
        
        response = requests.post(url, json=payload, headers=headers)
        return response.status_code == 200
    except Exception as e:
        print(f"Meta WhatsApp error: {e}")
        return False

