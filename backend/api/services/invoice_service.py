"""
Invoice Generation Service
Handles PDF generation, email sending, and automated invoice creation
"""
from django.utils import timezone
from datetime import timedelta
from ..models import Invoice, Deal, PaymentPlan, InvoiceTemplate
import uuid


def generate_invoice_number():
    """Generate unique invoice number"""
    return f"INV-{timezone.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"


def create_invoice_from_deal(deal, trigger_point='Deal Closed', tax_config=None):
    """
    Create invoice automatically when deal is closed or milestone reached
    
    Args:
        deal: Deal instance
        trigger_point: One of Invoice.TriggerPoint choices
        tax_config: Dictionary with tax configuration
    
    Returns:
        Invoice instance
    """
    from ..models import Invoice, Client
    
    # Get or create client from deal
    client = deal.client
    if not client and deal.lead:
        # Try to find existing client or create from lead
        client, _ = Client.objects.get_or_create(
            email=deal.lead.email,
            defaults={
                'name': deal.lead.name,
                'contact': deal.lead.phone,
            }
        )
    
    if not client:
        raise ValueError("Cannot create invoice without client")
    
    # Calculate amounts
    amount = deal.deal_value
    tax_amount = 0
    if tax_config:
        # Calculate tax based on configuration
        tax_rate = tax_config.get('rate', 0)
        tax_amount = amount * (tax_rate / 100)
    
    total_amount = amount + tax_amount
    
    # Generate invoice number
    invoice_number = generate_invoice_number()
    
    # Calculate due date (default: 30 days from now)
    due_date = timezone.now().date() + timedelta(days=30)
    
    # Create invoice
    invoice = Invoice.objects.create(
        invoice_number=invoice_number,
        deal=deal,
        client=client,
        amount=amount,
        tax_amount=tax_amount,
        total_amount=total_amount,
        due_date=due_date,
        status=Invoice.Status.DRAFT,
        trigger_point=trigger_point,
        tax_config=tax_config or {}
    )
    
    return invoice


def generate_invoice_pdf(invoice, template=None):
    """
    Generate PDF from invoice using template
    
    Args:
        invoice: Invoice instance
        template: InvoiceTemplate instance (optional, uses default if not provided)
    
    Returns:
        PDF file path or URL
    """
    # TODO: Implement PDF generation using weasyprint or reportlab
    # This is a placeholder - actual implementation needed
    
    if not template:
        template = InvoiceTemplate.objects.filter(is_default=True).first()
        if not template:
            # Use default template
            template_html = get_default_invoice_template()
        else:
            template_html = template.html_template
    else:
        template_html = template.html_template
    
    # Render template with invoice data
    html_content = render_invoice_template(template_html, invoice)
    
    # Generate PDF (implementation needed)
    # pdf_path = weasyprint.HTML(string=html_content).write_pdf()
    
    # For now, return placeholder
    return None


def render_invoice_template(template_html, invoice):
    """Render invoice template with data"""
    # Replace template variables with actual data
    html = template_html
    html = html.replace('{{invoice_number}}', invoice.invoice_number)
    html = html.replace('{{client_name}}', invoice.client.name)
    html = html.replace('{{amount}}', str(invoice.amount))
    html = html.replace('{{tax_amount}}', str(invoice.tax_amount))
    html = html.replace('{{total_amount}}', str(invoice.total_amount))
    html = html.replace('{{due_date}}', str(invoice.due_date))
    # Add more replacements as needed
    return html


def get_default_invoice_template():
    """Return default invoice template HTML"""
    return """
    <html>
    <head><title>Invoice {{invoice_number}}</title></head>
    <body>
        <h1>Invoice {{invoice_number}}</h1>
        <p>Client: {{client_name}}</p>
        <p>Amount: {{amount}}</p>
        <p>Tax: {{tax_amount}}</p>
        <p>Total: {{total_amount}}</p>
        <p>Due Date: {{due_date}}</p>
    </body>
    </html>
    """


def send_invoice_email(invoice):
    """
    Send invoice via email
    
    Args:
        invoice: Invoice instance
    
    Returns:
        Boolean indicating success
    """
    # TODO: Implement email sending
    # This should use the integration service
    from .integrations.email_service import send_email
    
    # Generate PDF if not exists
    if not invoice.pdf_url:
        pdf_url = generate_invoice_pdf(invoice)
        invoice.pdf_url = pdf_url
        invoice.save()
    
    # Send email
    # send_email(
    #     to=invoice.client.email,
    #     subject=f"Invoice {invoice.invoice_number}",
    #     body="Please find attached invoice",
    #     attachments=[invoice.pdf_url]
    # )
    
    invoice.email_sent = True
    invoice.email_sent_at = timezone.now()
    invoice.save()
    
    return True


def check_overdue_invoices():
    """Check for overdue invoices and update status"""
    today = timezone.now().date()
    overdue_invoices = Invoice.objects.filter(
        due_date__lt=today,
        status__in=[Invoice.Status.UNPAID, Invoice.Status.DUE, Invoice.Status.SENT]
    )
    
    for invoice in overdue_invoices:
        invoice.status = Invoice.Status.OVERDUE
        invoice.save()
    
    return overdue_invoices.count()

