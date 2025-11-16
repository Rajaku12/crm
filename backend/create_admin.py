"""
Management script to create admin user for production deployment
Run this in Render Shell after deployment
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'zenith_crm.settings')
django.setup()

from api.models import Agent

def create_admin():
    """Create or update admin user"""
    username = os.environ.get('ADMIN_USERNAME', 'admin')
    email = os.environ.get('ADMIN_EMAIL', 'admin@zenithestate.com')
    password = os.environ.get('ADMIN_PASSWORD', 'ChangeThisPassword123!')
    
    admin, created = Agent.objects.get_or_create(
        username=username,
        defaults={
            'email': email,
            'role': 'Admin',
            'is_staff': True,
            'is_superuser': True,
            'first_name': 'Admin',
            'last_name': 'User',
        }
    )
    
    if created:
        admin.set_password(password)
        admin.save()
        print(f'✅ Admin user "{username}" created successfully!')
        print(f'   Email: {email}')
        print(f'   Password: {password}')
        print('⚠️  IMPORTANT: Change the password after first login!')
    else:
        admin.set_password(password)
        admin.save()
        print(f'✅ Admin user "{username}" password updated!')
        print(f'   Email: {email}')
        print(f'   New Password: {password}')

if __name__ == '__main__':
    create_admin()
