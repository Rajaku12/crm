"""
Workflow Automation Service
Handles workflow rule triggers and action execution
"""
from django.utils import timezone
from ..models import WorkflowRule, WorkflowAction, Deal, Invoice, Quote, Lead


def check_workflow_triggers(model_instance, trigger_type):
    """
    Check and execute workflow rules for a given trigger
    
    Args:
        model_instance: Instance that triggered the workflow (Deal, Invoice, Quote, etc.)
        trigger_type: Type of trigger (from WorkflowRule.Trigger choices)
    
    Returns:
        List of executed actions
    """
    # Get enabled workflow rules for this trigger
    rules = WorkflowRule.objects.filter(
        trigger=trigger_type,
        is_enabled=True
    )
    
    executed_actions = []
    
    for rule in rules:
        # Check if conditions are met
        if check_workflow_conditions(rule, model_instance):
            # Execute actions
            actions = rule.actions.filter(is_enabled=True).order_by('order')
            for action in actions:
                result = execute_workflow_action(action, model_instance)
                if result:
                    executed_actions.append(action)
    
    return executed_actions


def check_workflow_conditions(rule, model_instance):
    """
    Check if workflow rule conditions are met
    
    Args:
        rule: WorkflowRule instance
        model_instance: Model instance to check conditions against
    
    Returns:
        Boolean indicating if conditions are met
    """
    conditions = rule.trigger_conditions
    
    if not conditions:
        return True  # No conditions means always execute
    
    # Example condition checking (would need to be more sophisticated)
    # For now, just return True
    return True


def execute_workflow_action(action, model_instance):
    """
    Execute a workflow action
    
    Args:
        action: WorkflowAction instance
        model_instance: Model instance context
    
    Returns:
        Boolean indicating success
    """
    action_type = action.action_type
    config = action.action_config
    
    if action_type == WorkflowAction.ActionType.SEND_EMAIL:
        return execute_send_email_action(action, model_instance, config)
    elif action_type == WorkflowAction.ActionType.SEND_SMS:
        return execute_send_sms_action(action, model_instance, config)
    elif action_type == WorkflowAction.ActionType.SEND_WHATSAPP:
        return execute_send_whatsapp_action(action, model_instance, config)
    elif action_type == WorkflowAction.ActionType.GENERATE_INVOICE:
        return execute_generate_invoice_action(action, model_instance, config)
    elif action_type == WorkflowAction.ActionType.CREATE_TASK:
        return execute_create_task_action(action, model_instance, config)
    elif action_type == WorkflowAction.ActionType.SEND_NOTIFICATION:
        return execute_send_notification_action(action, model_instance, config)
    elif action_type == WorkflowAction.ActionType.UPDATE_STATUS:
        return execute_update_status_action(action, model_instance, config)
    elif action_type == WorkflowAction.ActionType.WEBHOOK:
        return execute_webhook_action(action, model_instance, config)
    else:
        return False


def execute_send_email_action(action, model_instance, config):
    """Execute send email action"""
    from .integrations.email_service import send_email
    
    to = config.get('to') or get_email_from_instance(model_instance)
    subject = config.get('subject', 'Notification')
    body = config.get('body', '')
    
    return send_email(to, subject, body)


def execute_send_sms_action(action, model_instance, config):
    """Execute send SMS action"""
    from .integrations.sms_service import send_sms
    
    to = config.get('to') or get_phone_from_instance(model_instance)
    message = config.get('message', '')
    
    return send_sms(to, message)


def execute_send_whatsapp_action(action, model_instance, config):
    """Execute send WhatsApp action"""
    from .integrations.whatsapp_service import send_whatsapp
    
    to = config.get('to') or get_phone_from_instance(model_instance)
    message = config.get('message', '')
    
    return send_whatsapp(to, message)


def execute_generate_invoice_action(action, model_instance, config):
    """Execute generate invoice action"""
    from .invoice_service import create_invoice_from_deal
    
    if isinstance(model_instance, Deal):
        invoice = create_invoice_from_deal(model_instance, trigger_point='Milestone Reached')
        return invoice is not None
    return False


def execute_create_task_action(action, model_instance, config):
    """Execute create task action"""
    from ..models import Task
    
    if isinstance(model_instance, Lead):
        task = Task.objects.create(
            lead=model_instance,
            title=config.get('title', 'New Task'),
            due_date=timezone.now().date(),
            type=config.get('type', Task.Type.FOLLOW_UP)
        )
        return task is not None
    return False


def execute_send_notification_action(action, model_instance, config):
    """Execute send notification action"""
    from ..models import Notification
    
    if isinstance(model_instance, Lead):
        notification = Notification.objects.create(
            lead_name=model_instance.name,
            lead_id=model_instance.id,
            type=config.get('type', Notification.Type.NEW_LEAD),
            message=config.get('message', 'New notification')
        )
        return notification is not None
    return False


def execute_update_status_action(action, model_instance, config):
    """Execute update status action"""
    status_field = config.get('status_field', 'status')
    new_status = config.get('new_status')
    
    if hasattr(model_instance, status_field):
        setattr(model_instance, status_field, new_status)
        model_instance.save()
        return True
    return False


def execute_webhook_action(action, model_instance, config):
    """Execute webhook action"""
    import requests
    
    url = config.get('url')
    method = config.get('method', 'POST')
    headers = config.get('headers', {})
    payload = config.get('payload', {})
    
    try:
        if method.upper() == 'POST':
            response = requests.post(url, json=payload, headers=headers)
        elif method.upper() == 'GET':
            response = requests.get(url, params=payload, headers=headers)
        else:
            return False
        
        return response.status_code in [200, 201, 202]
    except Exception as e:
        print(f"Webhook error: {e}")
        return False


def get_email_from_instance(instance):
    """Extract email from model instance"""
    if hasattr(instance, 'email'):
        return instance.email
    elif hasattr(instance, 'client') and instance.client:
        return instance.client.email
    elif hasattr(instance, 'lead') and instance.lead:
        return instance.lead.email
    return None


def get_phone_from_instance(instance):
    """Extract phone from model instance"""
    if hasattr(instance, 'phone'):
        return instance.phone
    elif hasattr(instance, 'contact'):
        return instance.contact
    elif hasattr(instance, 'client') and instance.client:
        return instance.client.contact
    elif hasattr(instance, 'lead') and instance.lead:
        return instance.lead.phone
    return None

