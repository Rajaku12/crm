"""
Chatbot Service
Handles chatbot conversations, lead qualification, and integration
"""
from django.utils import timezone
from datetime import timedelta
from ..models import Chatbot, ChatbotConversation, ChatbotMessage, ChatbotQualificationRule, Lead, Agent
import uuid
import json
import logging
import re

logger = logging.getLogger(__name__)


def generate_conversation_id():
    """Generate unique conversation ID"""
    return f"conv_{timezone.now().strftime('%Y%m%d')}_{str(uuid.uuid4())[:8]}"


def start_conversation(chatbot, visitor_id=None, visitor_name=None, visitor_email=None, 
                      visitor_phone=None, visitor_ip=None, user_agent=None):
    """
    Start a new chatbot conversation
    
    Args:
        chatbot: Chatbot instance
        visitor_id: Visitor identifier
        visitor_name: Visitor name
        visitor_email: Visitor email
        visitor_phone: Visitor phone
        visitor_ip: Visitor IP address
        user_agent: User agent string
    
    Returns:
        ChatbotConversation instance
    """
    conversation_id = generate_conversation_id()
    
    conversation = ChatbotConversation.objects.create(
        conversation_id=conversation_id,
        chatbot=chatbot,
        visitor_id=visitor_id,
        visitor_name=visitor_name,
        visitor_email=visitor_email,
        visitor_phone=visitor_phone,
        visitor_ip=visitor_ip,
        user_agent=user_agent,
        status=ChatbotConversation.Status.ACTIVE
    )
    
    # Send welcome message
    if chatbot.welcome_message:
        send_bot_message(conversation, chatbot.welcome_message)
    
    # Start qualification if enabled
    if chatbot.qualification_enabled:
        ask_next_qualification_question(conversation)
    
    return conversation


def send_user_message(conversation, content, intent=None, confidence=None, entities=None):
    """
    Send a user message in conversation
    
    Args:
        conversation: ChatbotConversation instance
        content: Message content
        intent: Detected intent (optional)
        confidence: Intent confidence (optional)
        entities: Extracted entities (optional)
    
    Returns:
        ChatbotMessage instance
    """
    message = ChatbotMessage.objects.create(
        conversation=conversation,
        message_type=ChatbotMessage.MessageType.USER,
        content=content,
        intent=intent,
        confidence=confidence,
        entities=entities or []
    )
    
    # Update conversation last message time
    conversation.last_message_at = timezone.now()
    conversation.save()
    
    # Process message and get bot response
    bot_response = process_message(conversation, message)
    
    return message, bot_response


def send_bot_message(conversation, content, quick_replies=None):
    """
    Send a bot message in conversation
    
    Args:
        conversation: ChatbotConversation instance
        content: Message content
        quick_replies: Quick reply buttons (optional)
    
    Returns:
        ChatbotMessage instance
    """
    message = ChatbotMessage.objects.create(
        conversation=conversation,
        message_type=ChatbotMessage.MessageType.BOT,
        content=content,
        quick_replies=quick_replies or []
    )
    
    conversation.last_message_at = timezone.now()
    conversation.save()
    
    return message


def process_message(conversation, user_message):
    """
    Process user message and generate bot response
    
    Args:
        conversation: ChatbotConversation instance
        user_message: ChatbotMessage instance (user message)
    
    Returns:
        Bot response message
    """
    chatbot = conversation.chatbot
    
    # Extract information from message
    extract_visitor_info(conversation, user_message)
    
    # If qualification is in progress, handle qualification
    if chatbot.qualification_enabled and conversation.status == ChatbotConversation.Status.ACTIVE:
        qualification_result = handle_qualification_answer(conversation, user_message)
        if qualification_result:
            return qualification_result
    
    # Process with chatbot provider
    if chatbot.provider == Chatbot.Provider.CUSTOM:
        response = process_custom_chatbot(conversation, user_message)
    elif chatbot.provider == Chatbot.Provider.OPENAI:
        response = process_openai_chatbot(conversation, user_message, chatbot)
    elif chatbot.provider == Chatbot.Provider.GEMINI:
        response = process_gemini_chatbot(conversation, user_message, chatbot)
    else:
        response = chatbot.fallback_message
    
    # Send bot response
    bot_message = send_bot_message(conversation, response)
    
    return bot_message


def extract_visitor_info(conversation, message):
    """
    Extract visitor information from message
    
    Args:
        conversation: ChatbotConversation instance
        message: ChatbotMessage instance
    """
    content = message.content.lower()
    
    # Extract email
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, message.content)
    if emails and not conversation.visitor_email:
        conversation.visitor_email = emails[0]
    
    # Extract phone
    phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
    phones = re.findall(phone_pattern, message.content)
    if phones and not conversation.visitor_phone:
        # Clean phone number
        phone = ''.join(filter(str.isdigit, phones[0] if isinstance(phones[0], tuple) else phones[0]))
        if len(phone) >= 10:
            conversation.visitor_phone = phone
    
    # Extract name (simple pattern matching)
    if 'my name is' in content or 'i am' in content or 'i\'m' in content:
        # Try to extract name (simplified)
        parts = message.content.split()
        for i, part in enumerate(parts):
            if part.lower() in ['name', 'is', 'am', 'i\'m'] and i + 1 < len(parts):
                name = parts[i + 1].strip('.,!?')
                if name and len(name) > 2 and not conversation.visitor_name:
                    conversation.visitor_name = name
                    break
    
    conversation.save()


def handle_qualification_answer(conversation, message):
    """
    Handle qualification question answer
    
    Args:
        conversation: ChatbotConversation instance
        message: ChatbotMessage instance
    
    Returns:
        Bot response message or None
    """
    chatbot = conversation.chatbot
    rules = chatbot.qualification_rules.filter(is_active=True).order_by('order')
    
    # Get current question index from metadata
    current_index = conversation.metadata.get('qualification_index', 0)
    
    if current_index < len(rules):
        current_rule = rules[current_index]
        
        # Store answer
        answer = message.content
        conversation.qualification_data[current_rule.field_name] = answer
        
        # Calculate score for this answer
        score = calculate_qualification_score(current_rule, answer)
        current_score = conversation.qualification_score or 0
        conversation.qualification_score = current_score + score
        
        conversation.save()
        
        # Move to next question
        next_index = current_index + 1
        conversation.metadata['qualification_index'] = next_index
        conversation.save()
        
        if next_index < len(rules):
            # Ask next question
            return ask_next_qualification_question(conversation)
        else:
            # Qualification complete
            return complete_qualification(conversation)
    
    return None


def ask_next_qualification_question(conversation):
    """
    Ask next qualification question
    
    Args:
        conversation: ChatbotConversation instance
    
    Returns:
        Bot message with question
    """
    chatbot = conversation.chatbot
    rules = chatbot.qualification_rules.filter(is_active=True).order_by('order')
    
    current_index = conversation.metadata.get('qualification_index', 0)
    
    if current_index < len(rules):
        rule = rules[current_index]
        question = rule.question
        
        # Add quick replies if choice type
        quick_replies = []
        if rule.field_type == 'choice' and rule.options:
            quick_replies = rule.options
        
        bot_message = send_bot_message(conversation, question, quick_replies)
        return bot_message
    
    return None


def calculate_qualification_score(rule, answer):
    """
    Calculate qualification score for an answer
    
    Args:
        rule: ChatbotQualificationRule instance
        answer: Answer string
    
    Returns:
        Score (integer)
    """
    scoring_rules = rule.scoring_rules or {}
    
    if not scoring_rules:
        return 0
    
    # Simple scoring logic
    # Can be enhanced with more complex rules
    answer_lower = answer.lower()
    
    # Check for positive keywords
    positive_keywords = scoring_rules.get('positive_keywords', [])
    negative_keywords = scoring_rules.get('negative_keywords', [])
    
    score = 0
    
    for keyword in positive_keywords:
        if keyword.lower() in answer_lower:
            score += scoring_rules.get('positive_score', 10)
    
    for keyword in negative_keywords:
        if keyword.lower() in answer_lower:
            score -= scoring_rules.get('negative_score', 10)
    
    # Check exact match for choice type
    if rule.field_type == 'choice' and answer in rule.options:
        option_score = scoring_rules.get('option_scores', {}).get(answer, 0)
        score += option_score
    
    return max(0, min(100, score))  # Clamp between 0 and 100


def complete_qualification(conversation):
    """
    Complete qualification process
    
    Args:
        conversation: ChatbotConversation instance
    
    Returns:
        Bot response message
    """
    chatbot = conversation.chatbot
    qualification_score = conversation.qualification_score or 0
    
    # Determine if qualified (threshold can be configured)
    qualification_threshold = chatbot.config.get('qualification_threshold', 50)
    is_qualified = qualification_score >= qualification_threshold
    
    conversation.is_qualified = is_qualified
    conversation.status = ChatbotConversation.Status.QUALIFIED if is_qualified else ChatbotConversation.Status.NOT_QUALIFIED
    conversation.save()
    
    # Create lead if auto_create_lead is enabled
    if chatbot.auto_create_lead and (is_qualified or chatbot.config.get('create_lead_always', False)):
        lead = create_lead_from_conversation(conversation)
        conversation.lead = lead
        conversation.save()
        
        # Auto-assign agent if enabled
        if chatbot.auto_assign_agent:
            assign_agent_to_conversation(conversation)
    
    # Send completion message
    if is_qualified:
        response = chatbot.config.get('qualified_message', 
            "Thank you! You've been qualified. One of our agents will contact you shortly.")
    else:
        response = chatbot.config.get('not_qualified_message',
            "Thank you for your interest. We'll review your information and get back to you.")
    
    bot_message = send_bot_message(conversation, response)
    return bot_message


def create_lead_from_conversation(conversation):
    """
    Create lead from conversation
    
    Args:
        conversation: ChatbotConversation instance
    
    Returns:
        Lead instance
    """
    # Check if lead already exists
    if conversation.lead:
        return conversation.lead
    
    # Try to find existing lead
    lead = None
    if conversation.visitor_email:
        lead = Lead.objects.filter(email=conversation.visitor_email).first()
    elif conversation.visitor_phone:
        lead = Lead.objects.filter(phone=conversation.visitor_phone).first()
    
    if not lead:
        # Create new lead
        lead = Lead.objects.create(
            name=conversation.visitor_name or 'Chatbot Visitor',
            phone=conversation.visitor_phone or '',
            email=conversation.visitor_email or '',
            source='Chatbot',
            status=Lead.Status.NEW,
            tag=Lead.Tag.HOT if conversation.is_qualified else Lead.Tag.WARM,
            description=f"Qualification score: {conversation.qualification_score}\n"
                       f"Qualification data: {json.dumps(conversation.qualification_data, indent=2)}"
        )
        
        # Create activity for chatbot interaction
        from ..models import Activity
        Activity.objects.create(
            lead=lead,
            agent_name='Chatbot',
            type=Activity.Type.CHATBOT,
            notes=f"Chatbot conversation: {conversation.conversation_id}\n"
                  f"Messages: {conversation.message_count}\n"
                  f"Qualification score: {conversation.qualification_score}",
            timestamp=conversation.started_at
        )
    
    return lead


def assign_agent_to_conversation(conversation):
    """
    Assign agent to conversation
    
    Args:
        conversation: ChatbotConversation instance
    
    Returns:
        Updated conversation
    """
    # Simple round-robin assignment
    # Can be enhanced with load balancing, skills matching, etc.
    agent = Agent.objects.filter(is_active=True).first()
    
    if agent:
        conversation.assigned_agent = agent
        conversation.assigned_at = timezone.now()
        conversation.save()
    
    return conversation


def process_custom_chatbot(conversation, message):
    """Process message with custom chatbot logic"""
    # Simple keyword-based responses
    content = message.content.lower()
    
    responses = {
        'hello': 'Hello! How can I help you today?',
        'hi': 'Hi there! What can I do for you?',
        'price': 'Our prices vary based on the property. Could you tell me your budget range?',
        'location': 'We have properties in multiple locations. Which area are you interested in?',
        'contact': 'I can connect you with one of our agents. Could you share your contact details?',
    }
    
    for keyword, response in responses.items():
        if keyword in content:
            return response
    
    return conversation.chatbot.fallback_message


def process_openai_chatbot(conversation, message, chatbot):
    """Process message with OpenAI"""
    # TODO: Implement OpenAI integration
    # This would use OpenAI API to generate responses
    return chatbot.fallback_message


def process_gemini_chatbot(conversation, message, chatbot):
    """Process message with Google Gemini"""
    # TODO: Implement Gemini integration
    # This would use Gemini API to generate responses
    return chatbot.fallback_message

