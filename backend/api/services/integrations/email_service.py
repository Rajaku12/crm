"""
Email Integration Service
Supports SMTP, SendGrid, and AWS SES
"""
from ..models import IntegrationConfig


def send_email(to, subject, body, html_body=None, attachments=None, integration_config=None):
    """
    Send email using configured integration
    
    Args:
        to: Recipient email address
        subject: Email subject
        body: Plain text body
        html_body: HTML body (optional)
        attachments: List of file paths or URLs
        integration_config: IntegrationConfig instance (optional, uses default if not provided)
    
    Returns:
        Boolean indicating success
    """
    if not integration_config:
        integration_config = IntegrationConfig.objects.filter(
            type=IntegrationConfig.IntegrationType.EMAIL,
            is_enabled=True
        ).first()
    
    if not integration_config:
        # Fallback to Django's default email backend
        from django.core.mail import send_mail
        send_mail(subject, body, None, [to], html_message=html_body)
        return True
    
    provider = integration_config.provider.lower()
    config = integration_config.config
    
    if provider == 'smtp':
        return send_via_smtp(to, subject, body, html_body, attachments, config)
    elif provider == 'sendgrid':
        return send_via_sendgrid(to, subject, body, html_body, attachments, config)
    elif provider == 'ses' or provider == 'aws ses':
        return send_via_ses(to, subject, body, html_body, attachments, config)
    else:
        # Default to Django email
        from django.core.mail import send_mail
        send_mail(subject, body, None, [to], html_message=html_body)
        return True


def send_via_smtp(to, subject, body, html_body, attachments, config):
    """Send email via SMTP"""
    from django.core.mail import EmailMultiAlternatives
    
    email = EmailMultiAlternatives(subject, body, config.get('from_email'), [to])
    if html_body:
        email.attach_alternative(html_body, "text/html")
    
    if attachments:
        for attachment in attachments:
            email.attach_file(attachment)
    
    email.send()
    return True


def send_via_sendgrid(to, subject, body, html_body, attachments, config):
    """Send email via SendGrid"""
    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail, Attachment
        
        sg = sendgrid.SendGridAPIClient(api_key=config.get('api_key'))
        
        message = Mail(
            from_email=config.get('from_email'),
            to_emails=to,
            subject=subject,
            plain_text_content=body,
            html_content=html_body
        )
        
        if attachments:
            for attachment in attachments:
                # Handle attachment (would need file reading logic)
                pass
        
        response = sg.send(message)
        return response.status_code == 202
    except Exception as e:
        print(f"SendGrid error: {e}")
        return False


def send_via_ses(to, subject, body, html_body, attachments, config):
    """Send email via AWS SES"""
    try:
        import boto3
        
        ses_client = boto3.client(
            'ses',
            aws_access_key_id=config.get('aws_access_key_id'),
            aws_secret_access_key=config.get('aws_secret_access_key'),
            region_name=config.get('region', 'us-east-1')
        )
        
        response = ses_client.send_email(
            Source=config.get('from_email'),
            Destination={'ToAddresses': [to]},
            Message={
                'Subject': {'Data': subject},
                'Body': {
                    'Text': {'Data': body},
                    'Html': {'Data': html_body} if html_body else None
                }
            }
        )
        return response['ResponseMetadata']['HTTPStatusCode'] == 200
    except Exception as e:
        print(f"AWS SES error: {e}")
        return False

