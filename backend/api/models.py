from django.db import models
from django.db.models import Sum
from django.contrib.auth.models import AbstractUser


class Agent(AbstractUser):
    """Custom User Model extending Django's AbstractUser"""
    
    class Role(models.TextChoices):
        ADMIN = 'Admin', 'Admin'
        SALES_MANAGER = 'Sales Manager', 'Sales Manager'
        AGENT = 'Agent', 'Agent'
        TELECALLER = 'Telecaller', 'Telecaller'
        CUSTOMER_SUPPORT = 'Customer Support', 'Customer Support'
    
    # AbstractUser already provides: username, password, email, is_active, is_staff, is_superuser
    role = models.CharField(max_length=50, choices=Role.choices, default=Role.AGENT)
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    team = models.CharField(max_length=100, blank=True, null=True)
    monthly_calls_target = models.PositiveIntegerField(null=True, blank=True)
    monthly_sales_target = models.PositiveIntegerField(null=True, blank=True)
    reports_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinates')
    contact = models.CharField(max_length=20, blank=True, null=True)
    dob = models.DateField(null=True, blank=True)
    pan = models.CharField(max_length=10, blank=True, null=True)
    deals_in = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    pin_code = models.CharField(max_length=10, blank=True, null=True)
    
    @property
    def name(self):
        """Return full name or username"""
        if self.first_name or self.last_name:
            return f"{self.first_name} {self.last_name}".strip()
        return self.username
    
    def __str__(self):
        return f"{self.name} ({self.role})"
    
    class Meta:
        db_table = 'agents'
        verbose_name = 'Agent'
        verbose_name_plural = 'Agents'


class Property(models.Model):
    """Property/Real Estate Model"""
    
    class Category(models.TextChoices):
        RESIDENTIAL = 'Residential', 'Residential'
        COMMERCIAL = 'Commercial', 'Commercial'
    
    class Status(models.TextChoices):
        AVAILABLE = 'Available', 'Available'
        SOLD = 'Sold', 'Sold'
        RENTED = 'Rented', 'Rented'
        UNDER_OFFER = 'Under Offer', 'Under Offer'
    
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=Category.choices)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=50, choices=Status.choices)
    location = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    images = models.JSONField(default=list, blank=True)
    floor_plan_url = models.URLField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Stats will be calculated on-the-fly, not stored
    @property
    def stats(self):
        """Calculate property statistics"""
        from django.db.models import Count
        inquiries = self.leads.count()
        conversions = self.leads.filter(status='Approved').count()
        return {
            'views': 0,  # Can be tracked separately if needed
            'inquiries': inquiries,
            'conversions': conversions,
        }
    
    def __str__(self):
        return f"{self.name} - {self.location}"
    
    class Meta:
        db_table = 'properties'
        verbose_name = 'Property'
        verbose_name_plural = 'Properties'
        ordering = ['-created_at']


class Lead(models.Model):
    """Lead Model"""
    
    class Tag(models.TextChoices):
        HOT = 'Hot', 'Hot'
        WARM = 'Warm', 'Warm'
        COLD = 'Cold', 'Cold'
    
    class Status(models.TextChoices):
        NEW = 'New', 'New'
        CONTACTED = 'Contacted', 'Contacted'
        SITE_VISIT = 'Site Visit', 'Site Visit'
        NEGOTIATION = 'Negotiation', 'Negotiation'
        APPROVED = 'Approved', 'Approved'
        CLOSED = 'Closed', 'Closed'
        REJECTED = 'Rejected', 'Rejected'
        LOST = 'Lost', 'Lost'
    
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    tag = models.CharField(max_length=50, choices=Tag.choices, default=Tag.COLD)
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.NEW)
    source = models.CharField(max_length=100)
    agent = models.ForeignKey(Agent, on_delete=models.PROTECT, related_name='leads')
    created_by = models.ForeignKey(Agent, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_leads')
    property = models.ForeignKey(Property, on_delete=models.SET_NULL, null=True, blank=True, related_name='leads')
    description = models.TextField(blank=True, null=True)
    products = models.JSONField(default=list, blank=True)
    services = models.JSONField(default=list, blank=True)
    last_contacted = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.status}"
    
    class Meta:
        db_table = 'leads'
        verbose_name = 'Lead'
        verbose_name_plural = 'Leads'
        ordering = ['-created_at']


class Activity(models.Model):
    """Activity Model (Child of Lead)"""
    
    class Type(models.TextChoices):
        CALL = 'Call', 'Call'
        WHATSAPP = 'WhatsApp', 'WhatsApp'
        EMAIL = 'Email', 'Email'
        NOTE = 'Note', 'Note'
        STATUS_CHANGE = 'Status Change', 'Status Change'
        AI_SUMMARY = 'AI Summary', 'AI Summary'
        ASSIGNMENT_CHANGE = 'Assignment Change', 'Assignment Change'
        CHATBOT = 'Chatbot', 'Chatbot'
        SITE_VISIT_CHECKIN = 'Site Visit Check-in', 'Site Visit Check-in'
        VOICE_NOTE = 'Voice Note', 'Voice Note'
    
    class Outcome(models.TextChoices):
        SUCCESS = 'Success', 'Success'
        NO_ANSWER = 'No Answer', 'No Answer'
        VOICEMAIL = 'Voicemail', 'Voicemail'
        BUSY = 'Busy', 'Busy'
        MISSED = 'Missed', 'Missed'
    
    class Sentiment(models.TextChoices):
        POSITIVE = 'Positive', 'Positive'
        NEUTRAL = 'Neutral', 'Neutral'
        NEGATIVE = 'Negative', 'Negative'
    
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='activities')
    agent_name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=Type.choices)
    notes = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Call-specific fields
    duration = models.PositiveIntegerField(null=True, blank=True)  # in seconds
    recording_url = models.URLField(max_length=500, blank=True, null=True)
    outcome = models.CharField(max_length=50, choices=Outcome.choices, blank=True, null=True)
    quality_score = models.PositiveSmallIntegerField(null=True, blank=True)  # 1-5
    sentiment = models.CharField(max_length=50, choices=Sentiment.choices, blank=True, null=True)
    keywords = models.JSONField(default=list, blank=True)
    transcript = models.TextField(blank=True, null=True)
    
    # Email-specific
    subject = models.CharField(max_length=255, blank=True, null=True)
    
    # Site visit specific
    location = models.CharField(max_length=255, blank=True, null=True)
    
    # Voice note specific
    audio_url = models.URLField(max_length=500, blank=True, null=True)
    
    # For AI-generated activities
    source_activity = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='generated_activities')
    
    @property
    def agent(self):
        return self.agent_name
    
    def __str__(self):
        return f"{self.type} - {self.lead.name} - {self.timestamp}"
    
    class Meta:
        db_table = 'activities'
        verbose_name = 'Activity'
        verbose_name_plural = 'Activities'
        ordering = ['-timestamp']


class Task(models.Model):
    """Task Model (Child of Lead)"""
    
    class Type(models.TextChoices):
        CALL = 'Call', 'Call'
        MEETING = 'Meeting', 'Meeting'
        EMAIL = 'Email', 'Email'
        FOLLOW_UP = 'Follow-up', 'Follow-up'
        PAPERWORK = 'Paperwork', 'Paperwork'
    
    class Reminder(models.TextChoices):
        NONE = 'None', 'None'
        FIFTEEN_MINUTES = '15 minutes before', '15 minutes before'
        ONE_HOUR = '1 hour before', '1 hour before'
        ONE_DAY = '1 day before', '1 day before'
    
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    due_date = models.DateField()
    due_time = models.TimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    type = models.CharField(max_length=50, choices=Type.choices)
    reminder = models.CharField(max_length=50, choices=Reminder.choices, blank=True, null=True)
    
    def __str__(self):
        return f"{self.title} - {self.lead.name}"
    
    class Meta:
        db_table = 'tasks'
        verbose_name = 'Task'
        verbose_name_plural = 'Tasks'
        ordering = ['due_date', 'due_time']


class Client(models.Model):
    """Client Model"""
    
    class Occupation(models.TextChoices):
        SELF_EMPLOYED = 'Self Employee', 'Self Employee'
        GOVT_EMPLOYEE = 'Govt Employee', 'Govt Employee'
        PRIVATE_EMPLOYEE = 'Private Employee', 'Private Employee'
        OTHER = 'Other', 'Other'
    
    class LeadSource(models.TextChoices):
        WEBSITE = 'Website', 'Website'
        REFERRAL = 'Referral', 'Referral'
        SOCIAL_MEDIA = 'Social Media', 'Social Media'
        DIRECT = 'Direct', 'Direct'
        OTHER = 'Other', 'Other'
    
    name = models.CharField(max_length=255)
    contact = models.CharField(max_length=20)
    email = models.EmailField()
    dob = models.DateField(null=True, blank=True)
    pan = models.CharField(max_length=10, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    pin_code = models.CharField(max_length=10, blank=True, null=True)
    occupation = models.CharField(max_length=50, choices=Occupation.choices)
    organization = models.CharField(max_length=255, blank=True, null=True)
    designation = models.CharField(max_length=255, blank=True, null=True)
    lead_source = models.CharField(max_length=50, choices=LeadSource.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def leadSource(self):
        return self.lead_source
    
    def __str__(self):
        return f"{self.name} - {self.contact}"
    
    class Meta:
        db_table = 'clients'
        verbose_name = 'Client'
        verbose_name_plural = 'Clients'
        ordering = ['-created_at']


class AttendanceRecord(models.Model):
    """Attendance Record Model"""
    
    class Method(models.TextChoices):
        MANUAL = 'Manual', 'Manual'
        FINGERPRINT = 'Fingerprint', 'Fingerprint'
    
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='attendance_records')
    check_in_time = models.DateTimeField()
    check_out_time = models.DateTimeField(null=True, blank=True)
    duration = models.PositiveIntegerField(null=True, blank=True)  # in minutes
    method = models.CharField(max_length=20, choices=Method.choices, default=Method.MANUAL)
    location = models.CharField(max_length=255, blank=True, null=True)
    
    def __str__(self):
        return f"{self.agent.name} - {self.check_in_time.date()}"
    
    class Meta:
        db_table = 'attendance_records'
        verbose_name = 'Attendance Record'
        verbose_name_plural = 'Attendance Records'
        ordering = ['-check_in_time']


class WhatsAppTemplate(models.Model):
    """WhatsApp Template Model"""
    name = models.CharField(max_length=255)
    content = models.TextField()
    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'whatsapp_templates'
        verbose_name = 'WhatsApp Template'
        verbose_name_plural = 'WhatsApp Templates'
        ordering = ['name']


class AutomationRule(models.Model):
    """Automation Rule Model"""
    title = models.CharField(max_length=255)
    description = models.TextField()
    is_enabled = models.BooleanField(default=True)
    # Channels stored as JSON field or separate boolean fields
    channels_dashboard = models.BooleanField(default=True)
    channels_email = models.BooleanField(default=False)
    channels_whatsapp = models.BooleanField(default=False)
    
    @property
    def channels(self):
        return {
            'dashboard': self.channels_dashboard,
            'email': self.channels_email,
            'whatsapp': self.channels_whatsapp,
        }
    
    def __str__(self):
        return self.title
    
    class Meta:
        db_table = 'automation_rules'
        verbose_name = 'Automation Rule'
        verbose_name_plural = 'Automation Rules'
        ordering = ['title']


class Notification(models.Model):
    """Notification Model"""
    
    class Type(models.TextChoices):
        NEW_LEAD = 'New Lead', 'New Lead'
        MISSED_CALL = 'Missed Call', 'Missed Call'
        TASK_REMINDER = 'Task Reminder', 'Task Reminder'
        FOLLOW_UP_REMINDER = 'Follow-up Reminder', 'Follow-up Reminder'
    
    lead_name = models.CharField(max_length=255)
    lead_id = models.PositiveIntegerField()
    type = models.CharField(max_length=50, choices=Type.choices)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.type} - {self.lead_name}"
    
    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-timestamp']


# ==================== DEAL MANAGEMENT ====================

class Deal(models.Model):
    """Deal Model - Links Lead with Property and tracks deal stages"""
    
    class Stage(models.TextChoices):
        LEAD_CREATED = 'Lead Created', 'Lead Created'
        SITE_VISIT = 'Site Visit', 'Site Visit'
        NEGOTIATION = 'Negotiation', 'Negotiation'
        BOOKING_DONE = 'Booking Done', 'Booking Done'
        AGREEMENT_SIGNED = 'Agreement Signed', 'Agreement Signed'
        PAYMENT_PHASE_1 = 'Payment Phase 1', 'Payment Phase 1'
        PAYMENT_PHASE_2 = 'Payment Phase 2', 'Payment Phase 2'
        LOAN_PROCESSING = 'Loan Processing', 'Loan Processing'
        REGISTRY_HANDOVER = 'Registry / Handover', 'Registry / Handover'
        CLOSED = 'Closed', 'Closed'
    
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='deals')
    property = models.ForeignKey(Property, on_delete=models.PROTECT, related_name='deals')
    deal_value = models.DecimalField(max_digits=12, decimal_places=2)
    stage = models.CharField(max_length=50, choices=Stage.choices, default=Stage.LEAD_CREATED)
    agent = models.ForeignKey(Agent, on_delete=models.PROTECT, related_name='deals')
    client = models.ForeignKey(Client, on_delete=models.PROTECT, related_name='deals', null=True, blank=True)
    booking_date = models.DateField(null=True, blank=True)
    agreement_date = models.DateField(null=True, blank=True)
    registry_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Deal #{self.id} - {self.lead.name} - {self.property.name}"
    
    class Meta:
        db_table = 'deals'
        verbose_name = 'Deal'
        verbose_name_plural = 'Deals'
        ordering = ['-created_at']


# ==================== INVOICE MANAGEMENT ====================

class PaymentPlan(models.Model):
    """Payment Plan Model for recurring/installment payments"""
    
    class Frequency(models.TextChoices):
        MONTHLY = 'Monthly', 'Monthly'
        QUARTERLY = 'Quarterly', 'Quarterly'
        YEARLY = 'Yearly', 'Yearly'
        CUSTOM = 'Custom', 'Custom'
    
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name='payment_plans')
    name = models.CharField(max_length=255)
    frequency = models.CharField(max_length=50, choices=Frequency.choices)
    installment_amount = models.DecimalField(max_digits=12, decimal_places=2)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    number_of_installments = models.PositiveIntegerField()
    start_date = models.DateField()
    auto_reminder = models.BooleanField(default=True)
    auto_invoice = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - {self.deal}"
    
    class Meta:
        db_table = 'payment_plans'
        verbose_name = 'Payment Plan'
        verbose_name_plural = 'Payment Plans'


class Invoice(models.Model):
    """Invoice Model"""
    
    class Status(models.TextChoices):
        DRAFT = 'Draft', 'Draft'
        SENT = 'Sent', 'Sent'
        PAID = 'Paid', 'Paid'
        UNPAID = 'Unpaid', 'Unpaid'
        DUE = 'Due', 'Due'
        OVERDUE = 'Overdue', 'Overdue'
        PARTIALLY_PAID = 'Partially Paid', 'Partially Paid'
        CANCELLED = 'Cancelled', 'Cancelled'
    
    class TriggerPoint(models.TextChoices):
        DEAL_CLOSED = 'Deal Closed', 'Deal Closed'
        BOOKING_CONFIRMATION = 'Booking Confirmation', 'Booking Confirmation'
        MILESTONE_REACHED = 'Milestone Reached', 'Milestone Reached'
        MANUAL = 'Manual', 'Manual'
        RECURRING = 'Recurring', 'Recurring'
    
    invoice_number = models.CharField(max_length=100, unique=True)
    invoice_type = models.CharField(max_length=50, default='Tax Invoice')  # Proforma, Tax Invoice, Booking Invoice, etc.
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name='invoices')
    client = models.ForeignKey(Client, on_delete=models.PROTECT, related_name='invoices')
    unit = models.ForeignKey('Unit', on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    project = models.ForeignKey('Project', on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    due_date = models.DateField()
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.DRAFT)
    trigger_point = models.CharField(max_length=50, choices=TriggerPoint.choices, default=TriggerPoint.MANUAL)
    payment_plan = models.ForeignKey(PaymentPlan, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    payment_schedule = models.ForeignKey('PaymentSchedule', on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    installment_number = models.PositiveIntegerField(null=True, blank=True)
    pdf_url = models.URLField(max_length=500, blank=True, null=True)
    qr_code_url = models.URLField(max_length=500, blank=True, null=True)  # UPI QR code
    email_sent = models.BooleanField(default=False)
    email_sent_at = models.DateTimeField(null=True, blank=True)
    whatsapp_sent = models.BooleanField(default=False)
    tax_config = models.JSONField(default=dict, blank=True)  # Store tax configuration
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def paid_amount(self):
        """Calculate total paid amount"""
        return self.payments.aggregate(total=Sum('amount'))['total'] or 0
    
    @property
    def remaining_amount(self):
        """Calculate remaining amount"""
        return self.total_amount - self.paid_amount
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.deal}"
    
    class Meta:
        db_table = 'invoices'
        verbose_name = 'Invoice'
        verbose_name_plural = 'Invoices'
        ordering = ['-created_at']


class Payment(models.Model):
    """Payment Model"""
    
    class Method(models.TextChoices):
        UPI = 'UPI', 'UPI'
        BANK_TRANSFER = 'Bank Transfer', 'Bank Transfer'
        CHEQUE = 'Cheque', 'Cheque'
        CASH = 'Cash', 'Cash'
        ONLINE = 'Online', 'Online'
        CARD = 'Card', 'Card'
        RAZORPAY = 'Razorpay', 'Razorpay'
        STRIPE = 'Stripe', 'Stripe'
        CASHFREE = 'Cashfree', 'Cashfree'
        PAYPAL = 'PayPal', 'PayPal'
    
    payment_id = models.CharField(max_length=100, unique=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=50, choices=Method.choices)
    transaction_id = models.CharField(max_length=255, blank=True, null=True)
    payment_date = models.DateTimeField()
    reference_number = models.CharField(max_length=255, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(Agent, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Payment {self.payment_id} - {self.amount}"
    
    class Meta:
        db_table = 'payments'
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-payment_date']


class Installment(models.Model):
    """Installment Model for tracking recurring payments"""
    
    payment_plan = models.ForeignKey(PaymentPlan, on_delete=models.CASCADE, related_name='installments')
    invoice = models.ForeignKey(Invoice, on_delete=models.SET_NULL, null=True, blank=True, related_name='installment')
    installment_number = models.PositiveIntegerField()
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_paid = models.BooleanField(default=False)
    paid_date = models.DateField(null=True, blank=True)
    reminder_sent = models.BooleanField(default=False)
    reminder_sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Installment {self.installment_number} - {self.payment_plan}"
    
    class Meta:
        db_table = 'installments'
        verbose_name = 'Installment'
        verbose_name_plural = 'Installments'
        ordering = ['due_date']


# ==================== QUOTE MANAGEMENT ====================

class Quote(models.Model):
    """Quote Model"""
    
    class Status(models.TextChoices):
        DRAFT = 'Draft', 'Draft'
        SENT = 'Sent', 'Sent'
        APPROVED = 'Approved', 'Approved'
        MODIFICATION_REQUESTED = 'Modification Requested', 'Modification Requested'
        REJECTED = 'Rejected', 'Rejected'
        EXPIRED = 'Expired', 'Expired'
        CONVERTED = 'Converted', 'Converted'  # Converted to deal
    
    quote_number = models.CharField(max_length=100, unique=True)
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='quotes')
    property = models.ForeignKey(Property, on_delete=models.PROTECT, related_name='quotes')
    client = models.ForeignKey(Client, on_delete=models.PROTECT, related_name='quotes', null=True, blank=True)
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.DRAFT)
    validity_date = models.DateField()
    
    # Property Details
    unit_size = models.CharField(max_length=100, blank=True, null=True)
    unit_type = models.CharField(max_length=100, blank=True, null=True)
    facing = models.CharField(max_length=50, blank=True, null=True)
    amenities = models.JSONField(default=list, blank=True)
    
    # Pricing
    base_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Payment Schedule
    payment_schedule = models.JSONField(default=list, blank=True)  # Array of payment milestones
    
    # Approval
    client_approval_status = models.CharField(max_length=50, choices=Status.choices, null=True, blank=True)
    client_approval_date = models.DateTimeField(null=True, blank=True)
    manager_approval_status = models.CharField(max_length=50, choices=Status.choices, null=True, blank=True)
    manager_approval_date = models.DateTimeField(null=True, blank=True)
    manager = models.ForeignKey(Agent, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_quotes')
    
    # Conversion
    converted_to_deal = models.ForeignKey(Deal, on_delete=models.SET_NULL, null=True, blank=True, related_name='source_quote')
    
    # Documents
    pdf_url = models.URLField(max_length=500, blank=True, null=True)
    email_sent = models.BooleanField(default=False)
    email_sent_at = models.DateTimeField(null=True, blank=True)
    
    notes = models.TextField(blank=True, null=True)
    version = models.PositiveIntegerField(default=1)
    parent_quote = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='versions')
    created_by = models.ForeignKey(Agent, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_quotes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Quote {self.quote_number} - {self.lead.name}"
    
    class Meta:
        db_table = 'quotes'
        verbose_name = 'Quote'
        verbose_name_plural = 'Quotes'
        ordering = ['-created_at']


# ==================== COMMISSION MANAGEMENT ====================

class Commission(models.Model):
    """Commission Model"""
    
    class Type(models.TextChoices):
        FIXED = 'Fixed', 'Fixed'
        PERCENTAGE = 'Percentage', 'Percentage'
    
    class Status(models.TextChoices):
        PENDING = 'Pending', 'Pending'
        APPROVED = 'Approved', 'Approved'
        PAID = 'Paid', 'Paid'
        CANCELLED = 'Cancelled', 'Cancelled'
    
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name='commissions')
    agent = models.ForeignKey(Agent, on_delete=models.PROTECT, related_name='commissions')
    commission_type = models.CharField(max_length=50, choices=Type.choices)
    commission_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    fixed_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    calculated_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.PENDING)
    role = models.CharField(max_length=100, blank=True, null=True)  # Agent / Broker / Referral Partner
    paid_date = models.DateField(null=True, blank=True)
    payment_reference = models.CharField(max_length=255, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Commission - {self.agent.name} - {self.deal}"
    
    class Meta:
        db_table = 'commissions'
        verbose_name = 'Commission'
        verbose_name_plural = 'Commissions'
        ordering = ['-created_at']


class CommissionSplit(models.Model):
    """Commission Split Model for multiple agents sharing commission"""
    
    commission = models.ForeignKey(Commission, on_delete=models.CASCADE, related_name='splits')
    agent = models.ForeignKey(Agent, on_delete=models.PROTECT, related_name='commission_splits')
    split_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    allocated_amount = models.DecimalField(max_digits=12, decimal_places=2)
    role = models.CharField(max_length=100, blank=True, null=True)  # Closer / Referral / Agency / Broker
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Split - {self.agent.name} - {self.split_percentage}%"
    
    class Meta:
        db_table = 'commission_splits'
        verbose_name = 'Commission Split'
        verbose_name_plural = 'Commission Splits'


# ==================== CUSTOMER PORTAL ====================

class CustomerPortalUser(models.Model):
    """Customer Portal User Model"""
    
    class UserType(models.TextChoices):
        BUYER = 'Buyer', 'Buyer'
        SELLER = 'Seller', 'Seller'
        INVESTOR = 'Investor', 'Investor'
    
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    password = models.CharField(max_length=255)  # Hashed password
    user_type = models.CharField(max_length=50, choices=UserType.choices)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='portal_users', null=True, blank=True)
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='portal_users', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    last_login = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.email} - {self.user_type}"
    
    class Meta:
        db_table = 'customer_portal_users'
        verbose_name = 'Customer Portal User'
        verbose_name_plural = 'Customer Portal Users'


class Document(models.Model):
    """Document Model for customer portal"""
    
    class Type(models.TextChoices):
        BOOKING_RECEIPT = 'Booking Receipt', 'Booking Receipt'
        AGREEMENT = 'Agreement', 'Agreement'
        NOC = 'NOC', 'NOC'
        ALLOTMENT_LETTER = 'Allotment Letter', 'Allotment Letter'
        PAYMENT_HISTORY = 'Payment History', 'Payment History'
        FLOOR_PLAN = 'Floor Plan', 'Floor Plan'
        BROCHURE = 'Brochure', 'Brochure'
        CONTRACT = 'Contract', 'Contract'
        OTHER = 'Other', 'Other'
    
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name='documents', null=True, blank=True)
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='documents', null=True, blank=True)
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='documents', null=True, blank=True)
    type = models.CharField(max_length=50, choices=Type.choices)
    name = models.CharField(max_length=255)
    file_url = models.URLField(max_length=500)
    file_type = models.CharField(max_length=50, blank=True, null=True)  # PDF, Image, etc.
    is_watermarked = models.BooleanField(default=False)
    requires_otp = models.BooleanField(default=False)
    uploaded_by = models.ForeignKey(Agent, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.type}"
    
    class Meta:
        db_table = 'documents'
        verbose_name = 'Document'
        verbose_name_plural = 'Documents'
        ordering = ['-created_at']


class FileAccessLog(models.Model):
    """File Access Log Model for tracking document views"""
    
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='access_logs')
    portal_user = models.ForeignKey(CustomerPortalUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='file_access_logs')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True, null=True)
    accessed_at = models.DateTimeField(auto_now_add=True)
    otp_verified = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Access - {self.document.name} - {self.accessed_at}"
    
    class Meta:
        db_table = 'file_access_logs'
        verbose_name = 'File Access Log'
        verbose_name_plural = 'File Access Logs'
        ordering = ['-accessed_at']


# ==================== INTEGRATIONS ====================

class IntegrationConfig(models.Model):
    """Integration Configuration Model"""
    
    class IntegrationType(models.TextChoices):
        EMAIL = 'Email', 'Email'
        SMS = 'SMS', 'SMS'
        WHATSAPP = 'WhatsApp', 'WhatsApp'
        PAYMENT_GATEWAY = 'Payment Gateway', 'Payment Gateway'
        CALENDAR = 'Calendar', 'Calendar'
        FILE_STORAGE = 'File Storage', 'File Storage'
        MAPS = 'Maps', 'Maps'
        LEAD_ADS = 'Lead Ads', 'Lead Ads'
    
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=IntegrationType.choices)
    provider = models.CharField(max_length=100)  # Gmail, Twilio, Razorpay, etc.
    is_enabled = models.BooleanField(default=False)
    config = models.JSONField(default=dict)  # Store API keys, credentials, etc.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.type}"
    
    class Meta:
        db_table = 'integration_configs'
        verbose_name = 'Integration Config'
        verbose_name_plural = 'Integration Configs'


# ==================== TEMPLATES ====================

class InvoiceTemplate(models.Model):
    """Invoice Template Model"""
    
    name = models.CharField(max_length=255)
    html_template = models.TextField()
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'invoice_templates'
        verbose_name = 'Invoice Template'
        verbose_name_plural = 'Invoice Templates'


class QuoteTemplate(models.Model):
    """Quote Template Model"""
    
    name = models.CharField(max_length=255)
    html_template = models.TextField()
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'quote_templates'
        verbose_name = 'Quote Template'
        verbose_name_plural = 'Quote Templates'


class EmailTemplate(models.Model):
    """Email Template Model"""
    
    name = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    html_body = models.TextField()
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'email_templates'
        verbose_name = 'Email Template'
        verbose_name_plural = 'Email Templates'


class AgreementTemplate(models.Model):
    """Agreement Template Model"""
    
    name = models.CharField(max_length=255)
    html_template = models.TextField()
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'agreement_templates'
        verbose_name = 'Agreement Template'
        verbose_name_plural = 'Agreement Templates'


# ==================== WORKFLOW AUTOMATION ====================

class WorkflowRule(models.Model):
    """Workflow Rule Model for automation"""
    
    class Trigger(models.TextChoices):
        DEAL_CLOSED = 'Deal Closed', 'Deal Closed'
        PAYMENT_OVERDUE = 'Payment Overdue', 'Payment Overdue'
        QUOTE_APPROVED = 'Quote Approved', 'Quote Approved'
        MILESTONE_REACHED = 'Milestone Reached', 'Milestone Reached'
        LEAD_STATUS_CHANGED = 'Lead Status Changed', 'Lead Status Changed'
        CUSTOM = 'Custom', 'Custom'
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    trigger = models.CharField(max_length=50, choices=Trigger.choices)
    trigger_conditions = models.JSONField(default=dict)  # Store conditions
    is_enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'workflow_rules'
        verbose_name = 'Workflow Rule'
        verbose_name_plural = 'Workflow Rules'


class WorkflowAction(models.Model):
    """Workflow Action Model"""
    
    class ActionType(models.TextChoices):
        SEND_EMAIL = 'Send Email', 'Send Email'
        SEND_SMS = 'Send SMS', 'Send SMS'
        SEND_WHATSAPP = 'Send WhatsApp', 'Send WhatsApp'
        GENERATE_INVOICE = 'Generate Invoice', 'Generate Invoice'
        CREATE_TASK = 'Create Task', 'Create Task'
        SEND_NOTIFICATION = 'Send Notification', 'Send Notification'
        UPDATE_STATUS = 'Update Status', 'Update Status'
        WEBHOOK = 'Webhook', 'Webhook'
    
    workflow_rule = models.ForeignKey(WorkflowRule, on_delete=models.CASCADE, related_name='actions')
    action_type = models.CharField(max_length=50, choices=ActionType.choices)
    action_config = models.JSONField(default=dict)  # Store action configuration
    order = models.PositiveIntegerField(default=0)
    is_enabled = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.workflow_rule.name} - {self.action_type}"
    
    class Meta:
        db_table = 'workflow_actions'
        verbose_name = 'Workflow Action'
        verbose_name_plural = 'Workflow Actions'
        ordering = ['order']


# ==================== ENHANCED CALL LOGGING ====================

class CallLog(models.Model):
    """Enhanced Call Log Model with Telephony Integration"""
    
    class Direction(models.TextChoices):
        INBOUND = 'Inbound', 'Inbound'
        OUTBOUND = 'Outbound', 'Outbound'
    
    class Status(models.TextChoices):
        INITIATED = 'Initiated', 'Initiated'
        RINGING = 'Ringing', 'Ringing'
        ANSWERED = 'Answered', 'Answered'
        COMPLETED = 'Completed', 'Completed'
        FAILED = 'Failed', 'Failed'
        BUSY = 'Busy', 'Busy'
        NO_ANSWER = 'No Answer', 'No Answer'
        CANCELLED = 'Cancelled', 'Cancelled'
    
    class CallType(models.TextChoices):
        VOICE = 'Voice', 'Voice'
        VIDEO = 'Video', 'Video'
        CONFERENCE = 'Conference', 'Conference'
    
    # Basic call information
    call_sid = models.CharField(max_length=255, unique=True, null=True, blank=True)  # Telephony provider call ID
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='call_logs', null=True, blank=True)
    agent = models.ForeignKey(Agent, on_delete=models.SET_NULL, null=True, blank=True, related_name='call_logs')
    
    # Call details
    direction = models.CharField(max_length=20, choices=Direction.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.INITIATED)
    call_type = models.CharField(max_length=20, choices=CallType.choices, default=CallType.VOICE)
    
    # Phone numbers
    from_number = models.CharField(max_length=20)
    to_number = models.CharField(max_length=20)
    caller_name = models.CharField(max_length=255, blank=True, null=True)
    
    # Timing
    initiated_at = models.DateTimeField()
    answered_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration = models.PositiveIntegerField(null=True, blank=True)  # in seconds
    ring_duration = models.PositiveIntegerField(null=True, blank=True)  # in seconds
    
    # Recording and transcription
    recording_url = models.URLField(max_length=500, blank=True, null=True)
    recording_sid = models.CharField(max_length=255, blank=True, null=True)
    transcript = models.TextField(blank=True, null=True)
    transcript_url = models.URLField(max_length=500, blank=True, null=True)
    
    # Analysis
    quality_score = models.PositiveSmallIntegerField(null=True, blank=True)  # 1-5
    sentiment = models.CharField(max_length=50, choices=Activity.Sentiment.choices, blank=True, null=True)
    keywords = models.JSONField(default=list, blank=True)
    summary = models.TextField(blank=True, null=True)
    
    # Telephony provider info
    provider = models.CharField(max_length=50, blank=True, null=True)  # twilio, etc.
    provider_data = models.JSONField(default=dict, blank=True)  # Store provider-specific data
    
    # Cost tracking
    cost = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    currency = models.CharField(max_length=3, default='USD')
    
    # Notes and outcome
    notes = models.TextField(blank=True, null=True)
    outcome = models.CharField(max_length=50, choices=Activity.Outcome.choices, blank=True, null=True)
    
    # Related activity (if created from Activity)
    activity = models.OneToOneField(Activity, on_delete=models.SET_NULL, null=True, blank=True, related_name='call_log')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def is_completed(self):
        """Check if call is completed"""
        return self.status == self.Status.COMPLETED
    
    @property
    def was_answered(self):
        """Check if call was answered"""
        return self.answered_at is not None
    
    def __str__(self):
        return f"Call {self.call_sid or self.id} - {self.from_number} → {self.to_number}"
    
    class Meta:
        db_table = 'call_logs'
        verbose_name = 'Call Log'
        verbose_name_plural = 'Call Logs'
        ordering = ['-initiated_at']
        indexes = [
            models.Index(fields=['call_sid']),
            models.Index(fields=['lead', '-initiated_at']),
            models.Index(fields=['agent', '-initiated_at']),
            models.Index(fields=['from_number', '-initiated_at']),
        ]


class TelephonyConfig(models.Model):
    """Telephony Provider Configuration"""
    
    class Provider(models.TextChoices):
        TWILIO = 'Twilio', 'Twilio'
        PLIVO = 'Plivo', 'Plivo'
        NEXMO = 'Nexmo', 'Nexmo'
        CUSTOM = 'Custom', 'Custom'
    
    name = models.CharField(max_length=255)
    provider = models.CharField(max_length=50, choices=Provider.choices)
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    
    # API Credentials
    account_sid = models.CharField(max_length=255, blank=True, null=True)
    auth_token = models.CharField(max_length=255, blank=True, null=True)
    api_key = models.CharField(max_length=255, blank=True, null=True)
    api_secret = models.CharField(max_length=255, blank=True, null=True)
    
    # Phone numbers
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    phone_number_sid = models.CharField(max_length=255, blank=True, null=True)
    
    # Webhook configuration
    webhook_url = models.URLField(max_length=500, blank=True, null=True)
    status_callback_url = models.URLField(max_length=500, blank=True, null=True)
    recording_callback_url = models.URLField(max_length=500, blank=True, null=True)
    
    # Settings
    record_calls = models.BooleanField(default=True)
    transcribe_calls = models.BooleanField(default=False)
    auto_assign_to_agent = models.BooleanField(default=True)
    
    # Additional configuration
    config = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.provider}"
    
    class Meta:
        db_table = 'telephony_configs'
        verbose_name = 'Telephony Config'
        verbose_name_plural = 'Telephony Configs'


# ==================== CHATBOT INTEGRATION ====================

class Chatbot(models.Model):
    """Chatbot Configuration Model"""
    
    class Provider(models.TextChoices):
        CUSTOM = 'Custom', 'Custom'
        DIALOGFLOW = 'Dialogflow', 'Dialogflow'
        WATSON = 'Watson', 'Watson'
        RASA = 'Rasa', 'Rasa'
        OPENAI = 'OpenAI', 'OpenAI'
        GEMINI = 'Gemini', 'Gemini'
    
    class Status(models.TextChoices):
        ACTIVE = 'Active', 'Active'
        INACTIVE = 'Inactive', 'Inactive'
        TESTING = 'Testing', 'Testing'
    
    name = models.CharField(max_length=255)
    provider = models.CharField(max_length=50, choices=Provider.choices, default=Provider.CUSTOM)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.INACTIVE)
    
    # Provider configuration
    api_key = models.CharField(max_length=500, blank=True, null=True)
    api_secret = models.CharField(max_length=500, blank=True, null=True)
    project_id = models.CharField(max_length=255, blank=True, null=True)
    agent_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Chatbot settings
    welcome_message = models.TextField(default="Hello! How can I help you today?")
    fallback_message = models.TextField(default="I'm sorry, I didn't understand that. Could you please rephrase?")
    qualification_enabled = models.BooleanField(default=True)
    auto_create_lead = models.BooleanField(default=True)
    auto_assign_agent = models.BooleanField(default=False)
    
    # Qualification questions
    qualification_questions = models.JSONField(default=list, blank=True)  # List of question objects
    
    # Integration
    website_url = models.URLField(max_length=500, blank=True, null=True)
    widget_code = models.TextField(blank=True, null=True)  # Embed code for website
    
    # Configuration
    config = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.provider}"
    
    class Meta:
        db_table = 'chatbots'
        verbose_name = 'Chatbot'
        verbose_name_plural = 'Chatbots'


class ChatbotConversation(models.Model):
    """Chatbot Conversation Model"""
    
    class Status(models.TextChoices):
        ACTIVE = 'Active', 'Active'
        COMPLETED = 'Completed', 'Completed'
        ABANDONED = 'Abandoned', 'Abandoned'
        QUALIFIED = 'Qualified', 'Qualified'
        NOT_QUALIFIED = 'Not Qualified', 'Not Qualified'
    
    conversation_id = models.CharField(max_length=255, unique=True)
    chatbot = models.ForeignKey(Chatbot, on_delete=models.CASCADE, related_name='conversations')
    lead = models.ForeignKey(Lead, on_delete=models.SET_NULL, null=True, blank=True, related_name='chatbot_conversations')
    
    # Visitor information
    visitor_id = models.CharField(max_length=255, blank=True, null=True)
    visitor_name = models.CharField(max_length=255, blank=True, null=True)
    visitor_email = models.CharField(max_length=255, blank=True, null=True)
    visitor_phone = models.CharField(max_length=20, blank=True, null=True)
    visitor_ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True, null=True)
    
    # Conversation details
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    last_message_at = models.DateTimeField(auto_now=True)
    
    # Qualification data
    qualification_data = models.JSONField(default=dict, blank=True)  # Store answers to qualification questions
    qualification_score = models.PositiveSmallIntegerField(null=True, blank=True)  # 0-100
    is_qualified = models.BooleanField(default=False)
    
    # Assignment
    assigned_agent = models.ForeignKey(Agent, on_delete=models.SET_NULL, null=True, blank=True, related_name='chatbot_conversations')
    assigned_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def message_count(self):
        """Get total message count"""
        return self.messages.count()
    
    @property
    def duration(self):
        """Get conversation duration in seconds"""
        if self.ended_at and self.started_at:
            return int((self.ended_at - self.started_at).total_seconds())
        return None
    
    def __str__(self):
        return f"Conversation {self.conversation_id} - {self.visitor_name or 'Anonymous'}"
    
    class Meta:
        db_table = 'chatbot_conversations'
        verbose_name = 'Chatbot Conversation'
        verbose_name_plural = 'Chatbot Conversations'
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['conversation_id']),
            models.Index(fields=['chatbot', '-started_at']),
            models.Index(fields=['lead', '-started_at']),
            models.Index(fields=['visitor_email', '-started_at']),
        ]


class ChatbotMessage(models.Model):
    """Chatbot Message Model"""
    
    class MessageType(models.TextChoices):
        USER = 'User', 'User'
        BOT = 'Bot', 'Bot'
        SYSTEM = 'System', 'System'
    
    conversation = models.ForeignKey(ChatbotConversation, on_delete=models.CASCADE, related_name='messages')
    message_type = models.CharField(max_length=20, choices=MessageType.choices)
    content = models.TextField()
    
    # Intent and entities (for NLP)
    intent = models.CharField(max_length=255, blank=True, null=True)
    confidence = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    entities = models.JSONField(default=list, blank=True)
    
    # Quick replies or buttons
    quick_replies = models.JSONField(default=list, blank=True)
    
    # Timestamp
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    def __str__(self):
        return f"{self.message_type} - {self.content[:50]}"
    
    class Meta:
        db_table = 'chatbot_messages'
        verbose_name = 'Chatbot Message'
        verbose_name_plural = 'Chatbot Messages'
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['conversation', 'timestamp']),
        ]


class ChatbotQualificationRule(models.Model):
    """Chatbot Qualification Rules"""
    
    chatbot = models.ForeignKey(Chatbot, on_delete=models.CASCADE, related_name='qualification_rules')
    name = models.CharField(max_length=255)
    question = models.TextField()
    field_name = models.CharField(max_length=100)  # Field to store answer in qualification_data
    field_type = models.CharField(max_length=50, default='text')  # text, number, choice, boolean
    options = models.JSONField(default=list, blank=True)  # For choice type
    required = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    scoring_rules = models.JSONField(default=dict, blank=True)  # Rules for scoring this answer
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.chatbot.name} - {self.name}"
    
    class Meta:
        db_table = 'chatbot_qualification_rules'
        verbose_name = 'Chatbot Qualification Rule'
        verbose_name_plural = 'Chatbot Qualification Rules'
        ordering = ['order']


# ==================== PROJECT STRUCTURE (Project → Tower → Floor → Unit) ====================

class Project(models.Model):
    """Project Model - Top level in hierarchy"""
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    location = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    builder_name = models.CharField(max_length=255)
    builder_pan = models.CharField(max_length=10, blank=True, null=True)
    builder_gstin = models.CharField(max_length=15, blank=True, null=True)
    builder_address = models.TextField()
    builder_signature_url = models.URLField(max_length=500, blank=True, null=True)  # Digital signature
    builder_qr_code_url = models.URLField(max_length=500, blank=True, null=True)  # GST QR code
    rera_number = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=50, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.code})"
    
    class Meta:
        db_table = 'projects'
        verbose_name = 'Project'
        verbose_name_plural = 'Projects'
        ordering = ['name']


class Tower(models.Model):
    """Tower Model - Part of Project"""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='towers')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50)
    total_floors = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.project.name} - {self.name}"
    
    class Meta:
        db_table = 'towers'
        verbose_name = 'Tower'
        verbose_name_plural = 'Towers'
        unique_together = ['project', 'code']
        ordering = ['name']


class Floor(models.Model):
    """Floor Model - Part of Tower"""
    tower = models.ForeignKey(Tower, on_delete=models.CASCADE, related_name='floors')
    floor_number = models.IntegerField()
    name = models.CharField(max_length=100, blank=True, null=True)  # e.g., "Ground Floor", "Parking"
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.tower} - Floor {self.floor_number}"
    
    class Meta:
        db_table = 'floors'
        verbose_name = 'Floor'
        verbose_name_plural = 'Floors'
        unique_together = ['tower', 'floor_number']
        ordering = ['floor_number']


class Unit(models.Model):
    """Unit Model - Part of Floor, links to Property"""
    floor = models.ForeignKey(Floor, on_delete=models.CASCADE, related_name='units')
    property_link = models.OneToOneField(Property, on_delete=models.CASCADE, related_name='unit', null=True, blank=True)
    unit_number = models.CharField(max_length=50)
    unit_type = models.CharField(max_length=100)  # 2BHK, 3BHK, etc.
    carpet_area = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    built_up_area = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    super_area = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    base_price = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=50, default='Available')  # Available, Booked, Sold, Reserved
    created_at = models.DateTimeField(auto_now_add=True)
    
    def get_full_address(self):
        """Get full unit address"""
        return f"{self.floor.tower.project.name}, {self.floor.tower.name}, Floor {self.floor.floor_number}, Unit {self.unit_number}"
    
    @property
    def full_address(self):
        """Get full unit address as property"""
        return self.get_full_address()
    
    def __str__(self):
        return f"{self.floor.tower.project.name} - {self.unit_number}"
    
    class Meta:
        db_table = 'units'
        verbose_name = 'Unit'
        verbose_name_plural = 'Units'
        unique_together = ['floor', 'unit_number']
        ordering = ['unit_number']


# ==================== BOOKING PAYMENT MANAGEMENT ====================

class BookingPayment(models.Model):
    """Booking Payment Model - Initial token/booking amount"""
    
    class Status(models.TextChoices):
        PENDING = 'Pending', 'Pending'
        RECEIVED = 'Received', 'Received'
        CLEARED = 'Cleared', 'Cleared'
        BOUNCED = 'Bounced', 'Bounced'
        REFUNDED = 'Refunded', 'Refunded'
    
    booking_id = models.CharField(max_length=100, unique=True)
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name='booking_payments')
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT, related_name='booking_payments')
    client = models.ForeignKey(Client, on_delete=models.PROTECT, related_name='booking_payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=50)  # Will use Payment.Method.choices in serializer
    transaction_id = models.CharField(max_length=255, blank=True, null=True)
    reference_number = models.CharField(max_length=255, blank=True, null=True)
    payment_date = models.DateTimeField()
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.PENDING)
    cheque_number = models.CharField(max_length=100, blank=True, null=True)
    cheque_date = models.DateField(blank=True, null=True)
    cheque_bank = models.CharField(max_length=255, blank=True, null=True)
    cheque_cleared = models.BooleanField(default=False)
    cheque_cleared_date = models.DateField(blank=True, null=True)
    rtgs_neft_utr = models.CharField(max_length=100, blank=True, null=True)
    upi_reference = models.CharField(max_length=255, blank=True, null=True)
    receipt_generated = models.BooleanField(default=False)
    receipt_pdf_url = models.URLField(max_length=500, blank=True, null=True)
    whatsapp_sent = models.BooleanField(default=False)
    email_sent = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(Agent, on_delete=models.SET_NULL, null=True, blank=True)
    approved_by = models.ForeignKey(Agent, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_bookings')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Booking {self.booking_id} - {self.amount}"
    
    class Meta:
        db_table = 'booking_payments'
        verbose_name = 'Booking Payment'
        verbose_name_plural = 'Booking Payments'
        ordering = ['-payment_date']


# ==================== RECEIPT GENERATION ====================

class Receipt(models.Model):
    """Receipt Model - Auto-generated receipts for all payments"""
    
    class Type(models.TextChoices):
        BOOKING = 'Booking', 'Booking Receipt'
        INSTALLMENT = 'Installment', 'Installment Receipt'
        FINAL = 'Final', 'Final Payment Receipt'
        REFUND = 'Refund', 'Refund Receipt'
    
    receipt_number = models.CharField(max_length=100, unique=True)
    receipt_type = models.CharField(max_length=50, choices=Type.choices)
    booking_payment = models.ForeignKey(BookingPayment, on_delete=models.SET_NULL, null=True, blank=True, related_name='receipts')
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True, related_name='receipts')
    refund = models.ForeignKey('Refund', on_delete=models.SET_NULL, null=True, blank=True, related_name='receipts')
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name='receipts')
    client = models.ForeignKey(Client, on_delete=models.PROTECT, related_name='receipts')
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT, related_name='receipts')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=50)
    transaction_reference = models.CharField(max_length=255, blank=True, null=True)
    receipt_date = models.DateTimeField()
    pdf_url = models.URLField(max_length=500, blank=True, null=True)
    email_sent = models.BooleanField(default=False)
    whatsapp_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Receipt {self.receipt_number} - {self.amount}"
    
    class Meta:
        db_table = 'receipts'
        verbose_name = 'Receipt'
        verbose_name_plural = 'Receipts'
        ordering = ['-receipt_date']


# ==================== ENHANCED GST & TAX CALCULATION ====================

class GSTConfiguration(models.Model):
    """GST Configuration for different property types and charges"""
    
    class PropertyType(models.TextChoices):
        RESIDENTIAL_UNDER_CONSTRUCTION = 'Residential Under Construction', 'Residential Under Construction'
        RESIDENTIAL_READY_TO_MOVE = 'Residential Ready to Move', 'Residential Ready to Move'
        COMMERCIAL = 'Commercial', 'Commercial'
        PLOT = 'Plot', 'Plot'
    
    class ChargeType(models.TextChoices):
        BASE_PRICE = 'Base Price', 'Base Price'
        PARKING = 'Parking', 'Parking'
        CLUBHOUSE = 'Clubhouse', 'Clubhouse'
        MAINTENANCE = 'Maintenance', 'Maintenance'
        PLC = 'PLC', 'PLC (Preferential Location Charge)'
        FLOOR_RISE = 'Floor Rise', 'Floor Rise'
        OTHER = 'Other', 'Other'
    
    property_type = models.CharField(max_length=50, choices=PropertyType.choices)
    charge_type = models.CharField(max_length=50, choices=ChargeType.choices)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2)  # e.g., 5.00, 12.00, 18.00
    hsn_code = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.property_type} - {self.charge_type} - {self.gst_rate}%"
    
    class Meta:
        db_table = 'gst_configurations'
        verbose_name = 'GST Configuration'
        verbose_name_plural = 'GST Configurations'
        unique_together = ['property_type', 'charge_type', 'effective_from']


class TaxBreakdown(models.Model):
    """Detailed Tax Breakdown for Invoices"""
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='tax_breakdowns')
    charge_type = models.CharField(max_length=50)
    base_amount = models.DecimalField(max_digits=12, decimal_places=2)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2)
    cgst_amount = models.DecimalField(max_digits=12, decimal_places=2)
    sgst_amount = models.DecimalField(max_digits=12, decimal_places=2)
    igst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_tax = models.DecimalField(max_digits=12, decimal_places=2)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    hsn_code = models.CharField(max_length=20, blank=True, null=True)
    
    class Meta:
        db_table = 'tax_breakdowns'
        verbose_name = 'Tax Breakdown'
        verbose_name_plural = 'Tax Breakdowns'


# ==================== ENHANCED PAYMENT PLAN TYPES ====================

class PaymentSchedule(models.Model):
    """Payment Schedule Model - Supports CLP, Time-Based, Down Payment plans"""
    
    class PlanType(models.TextChoices):
        CONSTRUCTION_LINKED = 'Construction Linked Plan (CLP)', 'Construction Linked Plan (CLP)'
        TIME_BASED = 'Time Based', 'Time Based'
        DOWN_PAYMENT = 'Down Payment Plan', 'Down Payment Plan'
        CUSTOM = 'Custom', 'Custom'
    
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name='payment_schedules')
    plan_type = models.CharField(max_length=50, choices=PlanType.choices)
    name = models.CharField(max_length=255)
    total_contract_value = models.DecimalField(max_digits=12, decimal_places=2)
    booking_amount = models.DecimalField(max_digits=12, decimal_places=2)
    number_of_installments = models.PositiveIntegerField()
    auto_reminder = models.BooleanField(default=True)
    reminder_days_before = models.JSONField(default=list)  # [7, 0, 7] means 7 days before, on due date, 7 days after
    auto_invoice = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - {self.deal}"
    
    class Meta:
        db_table = 'payment_schedules'
        verbose_name = 'Payment Schedule'
        verbose_name_plural = 'Payment Schedules'


class PaymentMilestone(models.Model):
    """Construction Milestone for CLP plans"""
    payment_schedule = models.ForeignKey(PaymentSchedule, on_delete=models.CASCADE, related_name='milestones')
    milestone_name = models.CharField(max_length=255)  # e.g., "Foundation", "Slab Casting", "Brickwork"
    milestone_percentage = models.DecimalField(max_digits=5, decimal_places=2)  # % of total
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    due_date = models.DateField(blank=True, null=True)
    completed = models.BooleanField(default=False)
    completed_date = models.DateField(blank=True, null=True)
    order = models.PositiveIntegerField()
    
    class Meta:
        db_table = 'payment_milestones'
        verbose_name = 'Payment Milestone'
        verbose_name_plural = 'Payment Milestones'
        ordering = ['order']


# ==================== ENHANCED INVOICE TYPES ====================

class InvoiceType(models.TextChoices):
    """Invoice Type Choices - Added to Invoice model"""
    PROFORMA = 'Proforma Invoice', 'Proforma Invoice'
    TAX_INVOICE = 'Tax Invoice', 'Tax Invoice'
    BOOKING_INVOICE = 'Booking Invoice', 'Booking Invoice'
    PROJECT_WISE = 'Project Wise Invoice', 'Project Wise Invoice'
    PARKING = 'Parking Invoice', 'Parking Invoice'
    CLUBHOUSE = 'Clubhouse Invoice', 'Clubhouse Invoice'
    MAINTENANCE = 'Maintenance Invoice', 'Maintenance Invoice'


# ==================== LEDGER & STATEMENT OF ACCOUNT ====================

class Ledger(models.Model):
    """Ledger Model - Customer-wise, Unit-wise, Project-wise ledger"""
    
    class LedgerType(models.TextChoices):
        CUSTOMER = 'Customer', 'Customer Ledger'
        UNIT = 'Unit', 'Unit Ledger'
        PROJECT = 'Project', 'Project Ledger'
    
    ledger_type = models.CharField(max_length=50, choices=LedgerType.choices)
    customer = models.ForeignKey(Client, on_delete=models.CASCADE, null=True, blank=True, related_name='ledgers')
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, null=True, blank=True, related_name='ledgers')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True, related_name='ledgers')
    transaction_date = models.DateTimeField()
    transaction_type = models.CharField(max_length=50)  # Payment, Refund, Adjustment, Interest
    reference_number = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField()
    debit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    credit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ledgers'
        verbose_name = 'Ledger Entry'
        verbose_name_plural = 'Ledger Entries'
        ordering = ['-transaction_date']


# ==================== REFUNDS & ADJUSTMENTS ====================

class Refund(models.Model):
    """Refund Model - For cancelled bookings, bounced cheques, etc."""
    
    class Status(models.TextChoices):
        PENDING = 'Pending', 'Pending'
        APPROVED = 'Approved', 'Approved'
        PROCESSED = 'Processed', 'Processed'
        REJECTED = 'Rejected', 'Rejected'
    
    class Reason(models.TextChoices):
        CHEQUE_BOUNCED = 'Cheque Bounced', 'Cheque Bounced'
        BOOKING_CANCELLED = 'Booking Cancelled', 'Booking Cancelled'
        EXCESS_AMOUNT = 'Excess Amount', 'Excess Amount'
        PROJECT_DELAY = 'Project Delay', 'Project Delay'
        OTHER = 'Other', 'Other'
    
    refund_id = models.CharField(max_length=100, unique=True)
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name='refunds')
    booking_payment = models.ForeignKey(BookingPayment, on_delete=models.SET_NULL, null=True, blank=True, related_name='refunds')
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True, related_name='refunds')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.CharField(max_length=50, choices=Reason.choices)
    cancellation_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_refund_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.PENDING)
    notes = models.TextField(blank=True, null=True)
    requested_by = models.ForeignKey(Agent, on_delete=models.SET_NULL, null=True, blank=True, related_name='requested_refunds')
    approved_by = models.ForeignKey(Agent, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_refunds')
    approved_at = models.DateTimeField(null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Refund {self.refund_id} - {self.amount}"
    
    class Meta:
        db_table = 'refunds'
        verbose_name = 'Refund'
        verbose_name_plural = 'Refunds'
        ordering = ['-created_at']


class CreditNote(models.Model):
    """Credit Note for adjustments"""
    credit_note_number = models.CharField(max_length=100, unique=True)
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name='credit_notes')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.TextField()
    applied_to_invoice = models.ForeignKey(Invoice, on_delete=models.SET_NULL, null=True, blank=True, related_name='credit_notes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'credit_notes'
        verbose_name = 'Credit Note'
        verbose_name_plural = 'Credit Notes'


# ==================== BANK RECONCILIATION ====================

class BankReconciliation(models.Model):
    """Bank Reconciliation Model"""
    
    class Status(models.TextChoices):
        PENDING = 'Pending', 'Pending'
        MATCHED = 'Matched', 'Matched'
        UNMATCHED = 'Unmatched', 'Unmatched'
    
    bank_name = models.CharField(max_length=255)
    account_number = models.CharField(max_length=50)
    transaction_date = models.DateField()
    transaction_type = models.CharField(max_length=50)  # Credit, Debit
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reference_number = models.CharField(max_length=255, blank=True, null=True)
    utr_number = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.PENDING)
    matched_payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True, related_name='bank_reconciliations')
    matched_booking = models.ForeignKey(BookingPayment, on_delete=models.SET_NULL, null=True, blank=True, related_name='bank_reconciliations')
    reconciled_by = models.ForeignKey(Agent, on_delete=models.SET_NULL, null=True, blank=True)
    reconciled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'bank_reconciliations'
        verbose_name = 'Bank Reconciliation'
        verbose_name_plural = 'Bank Reconciliations'
        ordering = ['-transaction_date']