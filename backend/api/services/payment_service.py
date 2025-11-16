"""
Payment Tracking Service
Handles payment reminders, overdue detection, and payment gateway integration
"""
from django.utils import timezone
from datetime import timedelta
from ..models import Invoice, Payment, Installment, PaymentPlan
import uuid


def generate_payment_id():
    """Generate unique payment ID"""
    return f"PAY-{timezone.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"


def record_payment(invoice, amount, method, transaction_id=None, reference_number=None, notes=None, created_by=None):
    """
    Record a payment for an invoice
    
    Args:
        invoice: Invoice instance
        amount: Payment amount
        method: Payment method (from Payment.Method choices)
        transaction_id: Transaction ID from payment gateway
        reference_number: Reference number
        notes: Additional notes
        created_by: Agent who recorded the payment
    
    Returns:
        Payment instance
    """
    payment_id = generate_payment_id()
    
    payment = Payment.objects.create(
        payment_id=payment_id,
        invoice=invoice,
        amount=amount,
        method=method,
        transaction_id=transaction_id,
        payment_date=timezone.now(),
        reference_number=reference_number,
        notes=notes,
        created_by=created_by
    )
    
    # Update invoice status
    update_invoice_status(invoice)
    
    return payment


def update_invoice_status(invoice):
    """Update invoice status based on payments"""
    paid_amount = invoice.paid_amount
    total_amount = invoice.total_amount
    
    if paid_amount >= total_amount:
        invoice.status = Invoice.Status.PAID
    elif paid_amount > 0:
        invoice.status = Invoice.Status.PARTIALLY_PAID
    elif invoice.due_date < timezone.now().date():
        invoice.status = Invoice.Status.OVERDUE
    elif invoice.status == Invoice.Status.DRAFT:
        invoice.status = Invoice.Status.UNPAID
    
    invoice.save()


def send_payment_reminder(invoice):
    """
    Send payment reminder for invoice
    
    Args:
        invoice: Invoice instance
    
    Returns:
        Boolean indicating success
    """
    # TODO: Implement reminder sending via email/SMS/WhatsApp
    # This should use the integration services
    
    # For now, just log the reminder
    return True


def check_due_payments():
    """Check for payments due soon and send reminders"""
    today = timezone.now().date()
    due_soon_date = today + timedelta(days=3)  # 3 days before due date
    
    due_invoices = Invoice.objects.filter(
        due_date__lte=due_soon_date,
        due_date__gte=today,
        status__in=[Invoice.Status.UNPAID, Invoice.Status.DUE, Invoice.Status.SENT]
    )
    
    reminders_sent = 0
    for invoice in due_invoices:
        if send_payment_reminder(invoice):
            reminders_sent += 1
    
    return reminders_sent


def process_payment_gateway_callback(payment_gateway, transaction_data):
    """
    Process payment gateway callback/webhook
    
    Args:
        payment_gateway: Payment gateway name (razorpay, stripe, etc.)
        transaction_data: Transaction data from gateway
    
    Returns:
        Payment instance
    """
    # TODO: Implement payment gateway callback processing
    # This should verify the transaction and create payment record
    
    # Placeholder implementation
    return None


def create_installments_from_payment_plan(payment_plan):
    """
    Create installments for a payment plan
    
    Args:
        payment_plan: PaymentPlan instance
    
    Returns:
        List of Installment instances
    """
    from datetime import timedelta
    from calendar import monthrange
    
    installments = []
    current_date = payment_plan.start_date
    
    def add_months(date, months):
        """Add months to a date"""
        month = date.month - 1 + months
        year = date.year + month // 12
        month = month % 12 + 1
        day = min(date.day, monthrange(year, month)[1])
        return date.replace(year=year, month=month, day=day)
    
    def add_years(date, years):
        """Add years to a date"""
        try:
            return date.replace(year=date.year + years)
        except ValueError:
            # Handle leap year edge case
            return date.replace(year=date.year + years, day=28)
    
    # Determine date increment based on frequency
    for i in range(1, payment_plan.number_of_installments + 1):
        if payment_plan.frequency == PaymentPlan.Frequency.MONTHLY:
            due_date = add_months(payment_plan.start_date, i - 1)
        elif payment_plan.frequency == PaymentPlan.Frequency.QUARTERLY:
            due_date = add_months(payment_plan.start_date, (i - 1) * 3)
        elif payment_plan.frequency == PaymentPlan.Frequency.YEARLY:
            due_date = add_years(payment_plan.start_date, i - 1)
        else:
            # Custom - default to monthly
            due_date = add_months(payment_plan.start_date, i - 1)
        
        installment = Installment.objects.create(
            payment_plan=payment_plan,
            installment_number=i,
            due_date=due_date,
            amount=payment_plan.installment_amount
        )
        installments.append(installment)
    
    return installments


def mark_installment_paid(installment, payment):
    """
    Mark installment as paid
    
    Args:
        installment: Installment instance
        payment: Payment instance
    """
    installment.is_paid = True
    installment.paid_amount = payment.amount
    installment.paid_date = payment.payment_date.date()
    installment.invoice = payment.invoice
    installment.save()

