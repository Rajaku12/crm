"""
Commission Calculation Service
Handles commission calculation, splits, and approval workflow
"""
from decimal import Decimal
from ..models import Deal, Commission, CommissionSplit, Agent


def calculate_commission(deal, agent, commission_type='Percentage', commission_percentage=None, fixed_amount=None, role=None):
    """
    Calculate commission for an agent on a deal
    
    Args:
        deal: Deal instance
        agent: Agent instance
        commission_type: 'Fixed' or 'Percentage'
        commission_percentage: Percentage if type is Percentage
        fixed_amount: Fixed amount if type is Fixed
        role: Role of the agent (Agent, Broker, Referral Partner)
    
    Returns:
        Commission instance
    """
    if commission_type == Commission.Type.PERCENTAGE:
        if not commission_percentage:
            raise ValueError("commission_percentage required for percentage-based commission")
        calculated_amount = deal.deal_value * (Decimal(commission_percentage) / 100)
    else:  # Fixed
        if not fixed_amount:
            raise ValueError("fixed_amount required for fixed commission")
        calculated_amount = Decimal(fixed_amount)
    
    commission = Commission.objects.create(
        deal=deal,
        agent=agent,
        commission_type=commission_type,
        commission_percentage=commission_percentage,
        fixed_amount=fixed_amount,
        calculated_amount=calculated_amount,
        role=role or 'Agent',
        status=Commission.Status.PENDING
    )
    
    return commission


def create_commission_split(commission, splits_data):
    """
    Create commission splits for multiple agents
    
    Args:
        commission: Commission instance
        splits_data: List of dicts with 'agent_id', 'split_percentage', 'role'
    
    Returns:
        List of CommissionSplit instances
    """
    total_percentage = sum(split['split_percentage'] for split in splits_data)
    if total_percentage != 100:
        raise ValueError(f"Total split percentage must be 100%, got {total_percentage}%")
    
    split_instances = []
    for split_data in splits_data:
        agent = Agent.objects.get(id=split_data['agent_id'])
        allocated_amount = commission.calculated_amount * (Decimal(split_data['split_percentage']) / 100)
        
        split = CommissionSplit.objects.create(
            commission=commission,
            agent=agent,
            split_percentage=split_data['split_percentage'],
            allocated_amount=allocated_amount,
            role=split_data.get('role', 'Agent')
        )
        split_instances.append(split)
    
    return split_instances


def auto_calculate_commission_on_deal_close(deal):
    """
    Automatically calculate commission when deal is closed
    
    Args:
        deal: Deal instance that was just closed
    
    Returns:
        Commission instance or None
    """
    if deal.stage != Deal.Stage.CLOSED:
        return None
    
    agent = deal.agent
    
    # Get commission configuration for agent (would be from settings or agent profile)
    # For now, use default 2% commission
    commission_percentage = 2.0
    
    commission = calculate_commission(
        deal=deal,
        agent=agent,
        commission_type=Commission.Type.PERCENTAGE,
        commission_percentage=commission_percentage,
        role='Agent'
    )
    
    return commission


def approve_commission(commission):
    """
    Approve a commission
    
    Args:
        commission: Commission instance
    
    Returns:
        Updated Commission instance
    """
    commission.status = Commission.Status.APPROVED
    commission.save()
    return commission


def mark_commission_paid(commission, paid_date=None, payment_reference=None):
    """
    Mark commission as paid
    
    Args:
        commission: Commission instance
        paid_date: Date when commission was paid
        payment_reference: Payment reference number
    
    Returns:
        Updated Commission instance
    """
    from django.utils import timezone
    
    commission.status = Commission.Status.PAID
    commission.paid_date = paid_date or timezone.now().date()
    commission.payment_reference = payment_reference
    commission.save()
    return commission


def get_agent_commission_summary(agent, start_date=None, end_date=None):
    """
    Get commission summary for an agent
    
    Args:
        agent: Agent instance
        start_date: Start date for filtering
        end_date: End date for filtering
    
    Returns:
        Dictionary with commission statistics
    """
    from django.db.models import Sum
    from django.utils import timezone
    
    queryset = Commission.objects.filter(agent=agent)
    
    if start_date:
        queryset = queryset.filter(created_at__gte=start_date)
    if end_date:
        queryset = queryset.filter(created_at__lte=end_date)
    
    summary = {
        'total_earned': queryset.filter(status=Commission.Status.PAID).aggregate(
            total=Sum('calculated_amount')
        )['total'] or Decimal('0'),
        'pending': queryset.filter(status=Commission.Status.PENDING).aggregate(
            total=Sum('calculated_amount')
        )['total'] or Decimal('0'),
        'approved': queryset.filter(status=Commission.Status.APPROVED).aggregate(
            total=Sum('calculated_amount')
        )['total'] or Decimal('0'),
        'total_commissions': queryset.count(),
        'paid_commissions': queryset.filter(status=Commission.Status.PAID).count(),
    }
    
    return summary

