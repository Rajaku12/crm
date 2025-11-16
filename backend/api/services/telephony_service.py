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
    """
    if not telephony_config:
        telephony_config = get_default_telephony_config()
    
    if not telephony_config:
        raise ValueError("No active telephony configuration found")
    
    if not from_number:
        from_number = telephony_config.phone_number
    
    # Create call log
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
    
    # Initiate call via provider
    if telephony_config.provider == TelephonyConfig.Provider.TWILIO:
        call_sid = initiate_twilio_call(
            to_number=to_number,
            from_number=from_number,
            call_log=call_log,
            config=telephony_config
        )
        call_log.call_sid = call_sid
        call_log.save()
    
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
    """
    try:
        from twilio.rest import Client
        
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
        
        return call.sid
    except Exception as e:
        # Log error but don't fail
        logger.error(f"Twilio call initiation error: {e}", exc_info=True)
        return None


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

