"""
MySQL Database Setup Script for Zenith Estate CRM
This script helps set up the MySQL database
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'zenith_crm.settings')
django.setup()

from django.conf import settings
from django.core.management import execute_from_command_line
try:
    import mysql.connector
    from mysql.connector import Error
    MYSQL_AVAILABLE = True
except ImportError:
    try:
        import MySQLdb
        MYSQL_AVAILABLE = True
    except ImportError:
        MYSQL_AVAILABLE = False
        print("⚠️  MySQL connector not available. Install with: pip install mysql-connector-python")

def create_database():
    """Create MySQL database if it doesn't exist"""
    db_config = settings.DATABASES['default']
    
    print("\n" + "="*50)
    print("MySQL Database Setup")
    print("="*50)
    
    # Get database credentials
    db_name = db_config['NAME']
    db_user = db_config['USER']
    db_password = db_config['PASSWORD']
    db_host = db_config['HOST']
    db_port = db_config['PORT']
    
    print(f"\nDatabase Configuration:")
    print(f"  Name: {db_name}")
    print(f"  User: {db_user}")
    print(f"  Host: {db_host}")
    print(f"  Port: {db_port}")
    
    if not MYSQL_AVAILABLE:
        print("❌ MySQL connector not available")
        return False
    
    try:
        # Connect to MySQL server (without database)
        print(f"\nConnecting to MySQL server...")
        if 'mysql.connector' in sys.modules:
            connection = mysql.connector.connect(
                host=db_host,
                port=int(db_port),
                user=db_user,
                password=db_password
            )
        else:
            import MySQLdb
            connection = MySQLdb.connect(
                host=db_host,
                port=int(db_port),
                user=db_user,
                passwd=db_password
            )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            # Create database if it doesn't exist
            print(f"\nCreating database '{db_name}'...")
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print(f"✅ Database '{db_name}' created successfully!")
            
            cursor.close()
            connection.close()
            return True
            
    except Error as e:
        print(f"\n❌ Error connecting to MySQL: {e}")
        print("\nPlease check:")
        print("  1. MySQL server is running")
        print("  2. MySQL credentials in .env file are correct")
        print("  3. MySQL user has CREATE DATABASE privilege")
        return False

def run_migrations():
    """Run Django migrations"""
    print("\n" + "="*50)
    print("Running Migrations")
    print("="*50)
    
    try:
        execute_from_command_line(['manage.py', 'migrate'])
        print("\n✅ Migrations completed successfully!")
        return True
    except Exception as e:
        print(f"\n❌ Migration error: {e}")
        return False

def create_superuser():
    """Create admin superuser"""
    print("\n" + "="*50)
    print("Creating Admin User")
    print("="*50)
    print("\nYou can create a superuser manually by running:")
    print("  python manage.py createsuperuser")
    print("\nOr use the default credentials:")
    print("  Username: admin")
    print("  Password: admin123")

if __name__ == '__main__':
    print("\n🚀 Starting MySQL Database Setup...\n")
    
    # Check if MySQL is configured
    if settings.DATABASES['default']['ENGINE'] != 'django.db.backends.mysql':
        print("⚠️  MySQL is not configured in settings.py")
        print("   Set USE_SQLITE=False in .env file")
        sys.exit(1)
    
    # Create database
    if create_database():
        # Run migrations
        if run_migrations():
            # Create superuser info
            create_superuser()
            print("\n" + "="*50)
            print("✅ Setup Complete!")
            print("="*50)
            print("\nNext steps:")
            print("  1. Create admin user: python manage.py createsuperuser")
            print("  2. Start server: python manage.py runserver")
        else:
            sys.exit(1)
    else:
        sys.exit(1)

