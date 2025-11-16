"""
Telephony Service
Handles call initiation, recording, transcription, and webhook processing
"""
from django.utils import timezone
from datetime import timedelta
from ..models import CallLog, TelephonyConfig, Lead, Agent, Activity
import uuid
import logging

logger = logging.getLogger(__name__)


def get_default_telephony_config():
    """Get default active telephony configuration"""
    return TelephonyConfig.objects.filter(is_active=True, is_default=True).first()


def initiate_outbound_call(to_number, from_number=None, lead=None, agent=None, telephony_config=None):
    """
    Initiate an outbound call
    
    Args:
        to_number: Destination phone number
        from_number: Source phone number (uses config default if not provided)
        lead: Lead instance (optional)
        agent: Agent instance (optional)
        telephony_config: TelephonyConfig instance (uses default if not provided)
    
    Returns:
        CallLog instance
    
    Raises:
        ValueError: If telephony configuration is missing or invalid
        Exception: If call initiation fails
    """
    # Validate input
    if not to_number:
        raise ValueError("Destination phone number is required")
    
    if not isinstance(to_number, str):
        to_number = str(to_number)
    
    to_number = to_number.strip()
    if len(to_number) < 10:
        raise ValueError("Invalid phone number format")
    
    # Get telephony configuration
    if not telephony_config:
        telephony_config = get_default_telephony_config()
    
    if not telephony_config:
        raise ValueError("No active telephony configuration found. Please configure a telephony provider in Settings → Integrations.")
    
    if not telephony_config.is_active:
        raise ValueError("Telephony configuration is not active. Please activate it in Settings → Integrations.")
    
    # Get from number
    if not from_number:
        from_number = telephony_config.phone_number
    
    if not from_number:
        raise ValueError("Source phone number is required. Please configure a phone number in your telephony settings.")
    
    # Validate provider-specific credentials
    if telephony_config.provider == TelephonyConfig.Provider.TWILIO:
        if not telephony_config.account_sid or not telephony_config.auth_token:
            raise ValueError("Twilio credentials are missing. Please configure Account SID and Auth Token.")
    elif telephony_config.provider == TelephonyConfig.Provider.EXOTEL:
        if not telephony_config.api_key or not telephony_config.auth_token:
            raise ValueError("Exotel credentials are missing. Please configure API Key and API Token.")
    elif telephony_config.provider == TelephonyConfig.Provider.KNOWLARITY:
        if not telephony_config.api_key or not telephony_config.api_secret:
            raise ValueError("Knowlarity credentials are missing. Please configure API Key and API Secret.")
    elif telephony_config.provider == TelephonyConfig.Provider.MYOPERATOR:
        if not telephony_config.api_key or not telephony_config.api_secret:
            raise ValueError("MyOperator credentials are missing. Please configure API Key and API Secret.")
    
    # Create call log
    try:
        call_log = CallLog.objects.create(
            direction=CallLog.Direction.OUTBOUND,
            status=CallLog.Status.INITIATED,
            from_number=from_number,
            to_number=to_number,
            lead=lead,
            agent=agent,
            provider=telephony_config.provider,
            initiated_at=timezone.now()
        )
    except Exception as e:
        logger.error(f"Failed to create call log: {e}", exc_info=True)
        raise ValueError(f"Failed to create call log: {str(e)}")
    
    # Initiate call via provider
    call_sid = None
    provider_error = None
    
    try:
        if telephony_config.provider == TelephonyConfig.Provider.TWILIO:
            call_sid = initiate_twilio_call(
                to_number=to_number,
                from_number=from_number,
                call_log=call_log,
                config=telephony_config
            )
        elif telephony_config.provider == TelephonyConfig.Provider.EXOTEL:
            call_sid = initiate_exotel_call(
                to_number=to_number,
                from_number=from_number,
                call_log=call_log,
                config=telephony_config
            )
        elif telephony_config.provider == TelephonyConfig.Provider.KNOWLARITY:
            call_sid = initiate_knowlarity_call(
                to_number=to_number,
                from_number=from_number,
                call_log=call_log,
                config=telephony_config
            )
        elif telephony_config.provider == TelephonyConfig.Provider.MYOPERATOR:
            call_sid = initiate_myoperator_call(
                to_number=to_number,
                from_number=from_number,
                call_log=call_log,
                config=telephony_config
            )
        else:
            raise ValueError(f"Unsupported telephony provider: {telephony_config.provider}")
        
        if call_sid:
            call_log.call_sid = call_sid
            call_log.save()
        else:
            # Provider call failed but we still have the call log
            call_log.status = CallLog.Status.FAILED
            call_log.save()
            logger.warning(f"Call initiation returned no call_sid for provider {telephony_config.provider}")
            
    except Exception as e:
        # Log the error but don't fail completely - we still have the call log
        provider_error = str(e)
        logger.error(f"Provider call initiation failed: {provider_error}", exc_info=True)
        call_log.status = CallLog.Status.FAILED
        call_log.save()
        
        # Re-raise with user-friendly message
        if 'credentials' in provider_error.lower() or 'authentication' in provider_error.lower():
            raise ValueError("Telephony provider authentication failed. Please check your API credentials.")
        elif 'network' in provider_error.lower() or 'connection' in provider_error.lower():
            raise ValueError("Unable to connect to telephony provider. Please check your internet connection.")
        else:
            raise ValueError(f"Failed to initiate call via {telephony_config.provider}: {provider_error}")
    
    return call_log


def initiate_twilio_call(to_number, from_number, call_log, config):
    """
    Initiate call via Twilio
    
    Args:
        to_number: Destination number
        from_number: Source number
        call_log: CallLog instance
        config: TelephonyConfig instance
    
    Returns:
        Call SID
    
    Raises:
        Exception: If Twilio API call fails
    """
    try:
        from twilio.rest import Client
        from twilio.base.exceptions import TwilioRestException
        
        if not config.account_sid or not config.auth_token:
            raise ValueError("Twilio Account SID and Auth Token are required")
        
        client = Client(config.account_sid, config.auth_token)
        
        # Build callback URLs
        base_url = config.webhook_url or config.config.get('base_url', '')
        status_callback = f"{base_url}/api/webhooks/twilio/status/" if base_url else None
        recording_callback = f"{base_url}/api/webhooks/twilio/recording/" if base_url else None
        
        call = client.calls.create(
            to=to_number,
            from_=from_number,
            status_callback=status_callback,
            status_callback_event=['initiated', 'ringing', 'answered', 'completed'],
            record=config.record_calls,
            recording_status_callback=recording_callback if config.record_calls else None,
            twiml=f'<Response><Say>Connecting you now.</Say></Response>'
        )
        
        if not call or not call.sid:
            raise ValueError("Twilio call creation failed - no call SID returned")
        
        return call.sid
        
    except TwilioRestException as e:
        # Handle Twilio-specific errors
        error_msg = f"Twilio API error: {e.msg}"
        if e.code == 20003:  # Authentication error
            error_msg = "Twilio authentication failed. Please check your Account SID and Auth Token."
        elif e.code == 21211:  # Invalid phone number
            error_msg = f"Invalid phone number format: {to_number}"
        elif e.code == 21608:  # Unverified caller ID
            error_msg = f"Unverified caller ID: {from_number}. Please verify your Twilio phone number."
        logger.error(error_msg, exc_info=True)
        raise ValueError(error_msg)
    except ImportError:
        raise ValueError("Twilio library not installed. Please install it with: pip install twilio")
    except Exception as e:
        error_msg = f"Twilio call initiation error: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise ValueError(error_msg)


def process_twilio_status_webhook(request_data):
    """
    Process Twilio status callback webhook
    
    Args:
        request_data: Request data from Twilio webhook
    
    Returns:
        CallLog instance or None
    """
    call_sid = request_data.get('CallSid')
    call_status = request_data.get('CallStatus')
    from_number = request_data.get('From')
    to_number = request_data.get('To')
    duration = request_data.get('CallDuration')
    
    if not call_sid:
        return None
    
    # Find or create call log
    call_log = CallLog.objects.filter(call_sid=call_sid).first()
    
    if not call_log:
        # Create new call log for inbound call
        call_log = CallLog.objects.create(
            call_sid=call_sid,
            direction=CallLog.Direction.INBOUND,
            from_number=from_number,
            to_number=to_number,
            provider='Twilio',
            initiated_at=timezone.now()
        )
    
    # Map Twilio status to our status
    status_map = {
        'initiated': CallLog.Status.INITIATED,
        'ringing': CallLog.Status.RINGING,
        'answered': CallLog.Status.ANSWERED,
        'completed': CallLog.Status.COMPLETED,
        'busy': CallLog.Status.BUSY,
        'no-answer': CallLog.Status.NO_ANSWER,
        'failed': CallLog.Status.FAILED,
        'canceled': CallLog.Status.CANCELLED,
    }
    
    call_log.status = status_map.get(call_status.lower(), CallLog.Status.INITIATED)
    
    # Update timestamps
    if call_status == 'answered' and not call_log.answered_at:
        call_log.answered_at = timezone.now()
        if call_log.initiated_at:
            ring_duration = (call_log.answered_at - call_log.initiated_at).total_seconds()
            call_log.ring_duration = int(ring_duration)
    
    if call_status == 'completed':
        call_log.ended_at = timezone.now()
        if call_log.answered_at:
            duration_seconds = (call_log.ended_at - call_log.answered_at).total_seconds()
            call_log.duration = int(duration_seconds)
        elif duration:
            call_log.duration = int(duration)
    
    # Store provider data
    call_log.provider_data = request_data
    
    call_log.save()
    
    # Create Activity if call completed and has lead
    if call_log.status == CallLog.Status.COMPLETED and call_log.lead:
        create_call_activity(call_log)
    
    return call_log


def process_twilio_recording_webhook(request_data):
    """
    Process Twilio recording callback webhook
    
    Args:
        request_data: Request data from Twilio recording webhook
    
    Returns:
        CallLog instance or None
    """
    call_sid = request_data.get('CallSid')
    recording_url = request_data.get('RecordingUrl')
    recording_sid = request_data.get('RecordingSid')
    
    if not call_sid:
        return None
    
    call_log = CallLog.objects.filter(call_sid=call_sid).first()
    if call_log:
        call_log.recording_url = recording_url
        call_log.recording_sid = recording_sid
        call_log.save()
        
        # Trigger transcription if enabled
        telephony_config = get_default_telephony_config()
        if telephony_config and telephony_config.transcribe_calls:
            transcribe_call(call_log)
    
    return call_log


def transcribe_call(call_log):
    """
    Transcribe call recording
    
    Args:
        call_log: CallLog instance
    
    Returns:
        Boolean indicating success
    """
    if not call_log.recording_url:
        return False
    
    # TODO: Implement transcription using Twilio or other service
    # For now, this is a placeholder
    
    return False


def create_call_activity(call_log):
    """
    Create Activity from CallLog
    
    Args:
        call_log: CallLog instance
    
    Returns:
        Activity instance
    """
    if not call_log.lead:
        return None
    
    # Determine outcome
    outcome = None
    if call_log.status == CallLog.Status.COMPLETED:
        outcome = Activity.Outcome.SUCCESS
    elif call_log.status == CallLog.Status.NO_ANSWER:
        outcome = Activity.Outcome.NO_ANSWER
    elif call_log.status == CallLog.Status.BUSY:
        outcome = Activity.Outcome.BUSY
    elif call_log.status == CallLog.Status.FAILED:
        outcome = Activity.Outcome.MISSED
    
    activity = Activity.objects.create(
        lead=call_log.lead,
        agent_name=call_log.agent.name if call_log.agent else 'System',
        type=Activity.Type.CALL,
        duration=call_log.duration,
        recording_url=call_log.recording_url,
        outcome=outcome,
        transcript=call_log.transcript,
        sentiment=call_log.sentiment,
        quality_score=call_log.quality_score,
        keywords=call_log.keywords,
        notes=call_log.notes or f"Call from {call_log.from_number} to {call_log.to_number}",
        timestamp=call_log.initiated_at
    )
    
    # Link call log to activity
    call_log.activity = activity
    call_log.save()
    
    return activity


def find_or_create_lead_from_call(call_log):
    """
    Find or create lead from call information
    
    Args:
        call_log: CallLog instance
    
    Returns:
        Lead instance
    """
    if call_log.lead:
        return call_log.lead
    
    # Try to find lead by phone number
    phone = call_log.from_number if call_log.direction == CallLog.Direction.INBOUND else call_log.to_number
    
    lead = Lead.objects.filter(phone=phone).first()
    
    if not lead:
        # Create new lead
        lead = Lead.objects.create(
            name=call_log.caller_name or f"Caller {phone}",
            phone=phone,
            email='',
            source='Phone Call',
            status=Lead.Status.NEW,
            tag=Lead.Tag.COLD,
            agent=call_log.agent
        )
    
    call_log.lead = lead
    call_log.save()
    
    return lead


def initiate_exotel_call(to_number, from_number, call_log, config):
    """
    Initiate call via Exotel
    
    Args:
        to_number: Destination number
        from_number: Source number
        call_log: CallLog instance
        config: TelephonyConfig instance
    
    Returns:
        Call ID
    """
    try:
        import requests
        import base64
        
        subdomain = config.config.get('subdomain', '')
        api_key = config.api_key or config.config.get('api_key', '')
        api_token = config.auth_token or config.config.get('api_token', '')
        
        if not subdomain or not api_key or not api_token:
            logger.error("Exotel configuration incomplete")
            return None
        
        # Exotel API endpoint
        url = f"https://{subdomain}.exotel.com/v1/Accounts/{api_key}/Calls/connect.json"
        
        # Basic authentication
        auth_string = f"{api_key}:{api_token}"
        auth_bytes = auth_string.encode('ascii')
        auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
        
        headers = {
            'Authorization': f'Basic {auth_b64}',
            'Content-Type': 'application/json'
        }
        
        # Build callback URLs
        base_url = config.webhook_url or config.config.get('base_url', '')
        status_callback = f"{base_url}/api/webhooks/exotel/status/" if base_url else None
        
        payload = {
            'From': from_number,
            'To': to_number,
            'CallerId': from_number,
            'StatusCallback': status_callback,
            'Record': 'true' if config.record_calls else 'false'
        }
        
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            return data.get('Call', {}).get('Sid')
        else:
            logger.error(f"Exotel call initiation error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        logger.error(f"Exotel call initiation error: {e}", exc_info=True)
        return None


def initiate_knowlarity_call(to_number, from_number, call_log, config):
    """
    Initiate call via Knowlarity
    
    Args:
        to_number: Destination number
        from_number: Source number
        call_log: CallLog instance
        config: TelephonyConfig instance
    
    Returns:
        Call ID
    """
    try:
        import requests
        import hashlib
        import time
        
        api_key = config.api_key or config.config.get('api_key', '')
        api_secret = config.api_secret or config.config.get('api_secret', '')
        
        if not api_key or not api_secret:
            logger.error("Knowlarity configuration incomplete")
            return None
        
        # Knowlarity API endpoint
        url = "https://www.knowlarity.com/api/v1/call/makecall"
        
        # Generate authentication
        timestamp = str(int(time.time()))
        auth_string = f"{api_key}{api_secret}{timestamp}"
        auth_hash = hashlib.sha256(auth_string.encode()).hexdigest()
        
        headers = {
            'Content-Type': 'application/json',
            'X-API-KEY': api_key,
            'X-AUTH-HASH': auth_hash,
            'X-TIMESTAMP': timestamp
        }
        
        # Build callback URLs
        base_url = config.webhook_url or config.config.get('base_url', '')
        status_callback = f"{base_url}/api/webhooks/knowlarity/status/" if base_url else None
        
        payload = {
            'from': from_number,
            'to': to_number,
            'caller_id': from_number,
            'callback_url': status_callback,
            'record': 'true' if config.record_calls else 'false'
        }
        
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            return data.get('call_id') or data.get('callId')
        else:
            logger.error(f"Knowlarity call initiation error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        logger.error(f"Knowlarity call initiation error: {e}", exc_info=True)
        return None


def initiate_myoperator_call(to_number, from_number, call_log, config):
    """
    Initiate call via MyOperator
    
    Args:
        to_number: Destination number
        from_number: Source number
        call_log: CallLog instance
        config: TelephonyConfig instance
    
    Returns:
        Call ID
    """
    try:
        import requests
        
        api_key = config.api_key or config.config.get('api_key', '')
        api_secret = config.api_secret or config.config.get('api_secret', '')
        
        if not api_key or not api_secret:
            logger.error("MyOperator configuration incomplete")
            return None
        
        # MyOperator API endpoint
        url = "https://api.myoperator.com/v1/call/initiate"
        
        headers = {
            'Content-Type': 'application/json',
            'X-API-KEY': api_key,
            'X-API-SECRET': api_secret
        }
        
        # Build callback URLs
        base_url = config.webhook_url or config.config.get('base_url', '')
        status_callback = f"{base_url}/api/webhooks/myoperator/status/" if base_url else None
        
        payload = {
            'from': from_number,
            'to': to_number,
            'caller_id': from_number,
            'webhook_url': status_callback,
            'record': config.record_calls
        }
        
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            return data.get('call_id') or data.get('callId') or data.get('id')
        else:
            logger.error(f"MyOperator call initiation error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        logger.error(f"MyOperator call initiation error: {e}", exc_info=True)
        return None


def assign_call_to_agent(call_log, agent=None):
    """
    Assign call to agent
    
    Args:
        call_log: CallLog instance
        agent: Agent instance (optional, uses auto-assign if not provided)
    
    Returns:
        Updated CallLog instance
    """
    if agent:
        call_log.agent = agent
    else:
        # Auto-assign logic (round-robin, least busy, etc.)
        # For now, just use the first available agent
        available_agent = Agent.objects.filter(is_active=True).first()
        if available_agent:
            call_log.agent = available_agent
    
    call_log.save()
    return call_log

