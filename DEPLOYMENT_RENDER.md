# Complete Deployment Guide for Render

This guide provides step-by-step instructions for deploying the Zenith Estate CRM application (Django Backend + React Frontend) to Render.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Overview](#overview)
3. [Step 1: Prepare Your Repository](#step-1-prepare-your-repository)
4. [Step 2: Create Render Account](#step-2-create-render-account)
5. [Step 3: Deploy MySQL Database](#step-3-deploy-mysql-database)
6. [Step 4: Deploy Django Backend](#step-4-deploy-django-backend)
7. [Step 5: Deploy React Frontend](#step-5-deploy-react-frontend)
8. [Step 6: Configure Environment Variables](#step-6-configure-environment-variables)
9. [Step 7: Run Database Migrations](#step-7-run-database-migrations)
10. [Step 8: Create Admin User](#step-8-create-admin-user)
11. [Step 9: Configure Custom Domains (Optional)](#step-9-configure-custom-domains-optional)
12. [Step 10: Verify Deployment](#step-10-verify-deployment)
13. [Troubleshooting](#troubleshooting)
14. [Maintenance](#maintenance)

---

## Prerequisites

Before starting, ensure you have:

- ✅ A GitHub account
- ✅ Your code pushed to a GitHub repository
- ✅ A Render account (sign up at https://render.com)
- ✅ Basic understanding of Django and React

---

## Overview

The application consists of:
- **Backend**: Django REST Framework API (Python)
- **Frontend**: React + Vite application (Node.js)
- **Database**: MySQL

You'll need to create **3 services** on Render:
1. **MySQL Database** (Managed PostgreSQL/MySQL)
2. **Django Backend** (Web Service)
3. **React Frontend** (Static Site or Web Service)

---

## Step 1: Prepare Your Repository

### 1.1 Ensure Your Code is on GitHub

```bash
# If not already on GitHub, initialize and push
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/zenith-estate-crm.git
git push -u origin main
```

### 1.2 Create Required Files

Ensure these files exist in your repository:

**Backend:**
- `backend/requirements.txt`
- `backend/manage.py`
- `backend/zenith_crm/settings.py`
- `backend/.env.example` (optional, for reference)

**Frontend:**
- `frontend/package.json`
- `frontend/vite.config.ts` or `vite.config.js`
- `frontend/.env.example` (optional, for reference)

### 1.3 Create Build Scripts

Create `backend/build.sh`:

```bash
#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --no-input

# Run migrations
python manage.py migrate --no-input
```

Create `backend/render.yaml` (optional, for Blueprint deployment):

```yaml
services:
  - type: web
    name: zenith-crm-backend
    env: python
    buildCommand: pip install -r requirements.txt && python manage.py collectstatic --no-input
    startCommand: gunicorn zenith_crm.wsgi:application
    envVars:
      - key: DJANGO_SETTINGS_MODULE
        value: zenith_crm.settings
      - key: PYTHON_VERSION
        value: 3.11.0
```

---

## Step 2: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub (recommended) or email
3. Connect your GitHub account
4. Authorize Render to access your repositories

---

## Step 3: Deploy MySQL Database

### 3.1 Create Database Service

1. In Render Dashboard, click **"New +"**
2. Select **"PostgreSQL"** or **"MySQL"** (if available)
   - **Note**: Render primarily offers PostgreSQL. If you need MySQL, consider:
     - Using PostgreSQL (recommended - easier migration)
     - Using an external MySQL service (AWS RDS, PlanetScale, etc.)
     - Using Render's PostgreSQL and updating Django settings

### 3.2 Configure Database

**If using PostgreSQL (Recommended):**

1. **Name**: `zenith-crm-db`
2. **Database**: `zenith_crm`
3. **User**: `zenith_user` (auto-generated)
4. **Region**: Choose closest to your users
5. **PostgreSQL Version**: Latest stable
6. **Plan**: Free tier (for testing) or Starter ($7/month)

### 3.3 Save Database Credentials

After creation, Render will show:
- **Internal Database URL**: `postgresql://user:password@host:port/dbname`
- **Host**: `dpg-xxxxx-a.oregon-postgres.render.com`
- **Port**: `5432`
- **Database Name**: `zenith_crm`
- **User**: `zenith_user`
- **Password**: (shown once - save it!)

**⚠️ IMPORTANT**: Copy and save these credentials immediately!

---

## Step 4: Deploy Django Backend

### 4.1 Create Web Service

1. In Render Dashboard, click **"New +"**
2. Select **"Web Service"**
3. Connect your GitHub repository
4. Select the repository: `zenith-estate-crm`

### 4.2 Configure Backend Service

**Basic Settings:**
- **Name**: `zenith-crm-backend`
- **Region**: Same as database
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend`
- **Runtime**: `Python 3`
- **Build Command**: 
  ```bash
  pip install -r requirements.txt && python manage.py collectstatic --no-input
  ```
- **Start Command**: 
  ```bash
  gunicorn zenith_crm.wsgi:application
  ```

**Instance Type:**
- **Free**: 512 MB RAM (for testing)
- **Starter**: $7/month (recommended for production)

### 4.3 Install Gunicorn

Update `backend/requirements.txt` to include:

```txt
Django==4.2.7
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.0
django-cors-headers==4.3.1
python-decouple==3.8
psycopg2-binary==2.9.9
gunicorn==21.2.0
whitenoise==6.6.0
dj-database-url==2.1.0
```

**Note**: If you're using MySQL instead of PostgreSQL, replace `psycopg2-binary` with `mysqlclient==2.2.0`

### 4.4 Django Settings (Already Configured)

✅ **Good News**: The Django settings have already been updated for production! The `settings.py` file now includes:

- ✅ PostgreSQL support via `DATABASE_URL` (Render's default)
- ✅ MySQL support (fallback option)
- ✅ WhiteNoise for static files
- ✅ Production security settings
- ✅ CORS configuration

**No changes needed** - proceed to environment variables!

**Note**: If you want to review the settings, check `backend/zenith_crm/settings.py`:

```python
import os
from decouple import config
import dj_database_url

# ... existing code ...

# Database Configuration
USE_SQLITE = config('USE_SQLITE', default=False, cast=bool)

if USE_SQLITE:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    # Use Render's database URL or individual settings
    DATABASE_URL = config('DATABASE_URL', default=None)
    
    if DATABASE_URL:
        # Parse DATABASE_URL (for PostgreSQL)
        DATABASES = {
            'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600)
        }
    else:
        # Individual settings (for MySQL)
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.mysql',
                'NAME': config('DB_NAME', default='zenith_crm'),
                'USER': config('DB_USER', default='zenith_user'),
                'PASSWORD': config('DB_PASSWORD'),
                'HOST': config('DB_HOST', default='localhost'),
                'PORT': config('DB_PORT', default='3306'),
                'OPTIONS': {
                    'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
                    'charset': 'utf8mb4',
                }
            }
        }

# Static files (WhiteNoise)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Security settings for production
DEBUG = config('DEBUG', default=False, cast=bool)
SECRET_KEY = config('SECRET_KEY')

ALLOWED_HOSTS = config(
    'ALLOWED_HOSTS',
    default='localhost,127.0.0.1',
    cast=lambda v: [s.strip() for s in v.split(',')]
)

# CORS settings
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000,http://localhost:5173',
    cast=lambda v: [s.strip() for s in v.split(',')]
)

# HTTPS settings
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
```

Add to `backend/requirements.txt`:

```txt
dj-database-url==2.1.0
```

### 4.5 Update WSGI Configuration

Create or update `backend/zenith_crm/wsgi.py`:

```python
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'zenith_crm.settings')

application = get_wsgi_application()
```

---

## Step 5: Deploy React Frontend

### 5.1 Create Static Site (Recommended)

1. In Render Dashboard, click **"New +"**
2. Select **"Static Site"**
3. Connect your GitHub repository
4. Select the repository: `zenith-estate-crm`

### 5.2 Configure Frontend Service

**Basic Settings:**
- **Name**: `zenith-crm-frontend`
- **Branch**: `main`
- **Root Directory**: `frontend`
- **Build Command**: 
  ```bash
  npm install && npm run build
  ```
- **Publish Directory**: `dist`

**Environment Variables:**
- `VITE_API_BASE_URL`: `https://zenith-crm-backend.onrender.com/api`
  - Replace with your actual backend URL

### 5.3 Alternative: Deploy as Web Service

If you need server-side rendering or API routes:

1. Select **"Web Service"** instead
2. **Runtime**: `Node`
3. **Build Command**: `cd frontend && npm install && npm run build`
4. **Start Command**: `cd frontend && npm run preview`
5. **Root Directory**: Leave empty or set to project root

---

## Step 6: Configure Environment Variables

### 6.1 Backend Environment Variables

Go to your backend service → **Environment** tab, add:

```bash
# Django Settings
DJANGO_SETTINGS_MODULE=zenith_crm.settings
SECRET_KEY=your-super-secret-key-here-generate-with-openssl-rand-hex-32
DEBUG=False
ALLOWED_HOSTS=zenith-crm-backend.onrender.com,your-custom-domain.com

# Database (PostgreSQL - if using Render's PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/dbname
# OR for MySQL (external service)
USE_SQLITE=False
DB_NAME=zenith_crm
DB_USER=zenith_user
DB_PASSWORD=your-db-password
DB_HOST=dpg-xxxxx-a.oregon-postgres.render.com
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=https://zenith-crm-frontend.onrender.com,https://your-custom-domain.com

# Python
PYTHON_VERSION=3.11.0
```

**Generate SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

### 6.2 Frontend Environment Variables

Go to your frontend service → **Environment** tab, add:

```bash
VITE_API_BASE_URL=https://zenith-crm-backend.onrender.com/api
```

**Note**: Replace URLs with your actual Render service URLs.

### 6.3 Database Environment Variables

If using external MySQL, add to backend:

```bash
USE_SQLITE=False
DB_NAME=zenith_crm
DB_USER=zenith_user
DB_PASSWORD=your-mysql-password
DB_HOST=your-mysql-host.com
DB_PORT=3306
```

---

## Step 7: Run Database Migrations

### 7.1 Using Render Shell

1. Go to your backend service
2. Click **"Shell"** tab
3. Run migrations:

```bash
python manage.py migrate
```

### 7.2 Using Build Command

Add to your build command:

```bash
pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate --no-input
```

### 7.3 Manual Migration Script

Create `backend/migrate.sh`:

```bash
#!/usr/bin/env bash
python manage.py migrate --no-input
```

---

## Step 8: Create Admin User

### 8.1 Using Render Shell

1. Go to backend service → **Shell**
2. Run:

```bash
python manage.py createsuperuser
```

Follow prompts:
- Username: `admin`
- Email: `admin@example.com`
- Password: (enter secure password)

### 8.2 Using Management Command

Create `backend/create_admin.py`:

```python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'zenith_crm.settings')
django.setup()

from api.models import Agent

# Create or update admin user
admin, created = Agent.objects.get_or_create(
    username='admin',
    defaults={
        'email': 'admin@zenithestate.com',
        'role': 'Admin',
        'is_staff': True,
        'is_superuser': True,
    }
)

if created:
    admin.set_password('admin123')  # Change this!
    admin.save()
    print('Admin user created!')
else:
    print('Admin user already exists')
```

Run in Shell:
```bash
python create_admin.py
```

---

## Step 9: Configure Custom Domains (Optional)

### 9.1 Backend Domain

1. Go to backend service → **Settings**
2. Scroll to **"Custom Domains"**
3. Click **"Add Custom Domain"**
4. Enter: `api.yourdomain.com`
5. Follow DNS configuration instructions
6. Update `ALLOWED_HOSTS` environment variable

### 9.2 Frontend Domain

1. Go to frontend service → **Settings**
2. Add custom domain: `yourdomain.com` or `www.yourdomain.com`
3. Update `VITE_API_BASE_URL` to use custom domain

### 9.3 DNS Configuration

Add these DNS records:

```
Type    Name    Value
A       api     <backend-ip>
CNAME   www     <frontend-url>
A       @       <frontend-ip>
```

---

## Step 10: Verify Deployment

### 10.1 Test Backend API

1. Visit: `https://zenith-crm-backend.onrender.com/api/`
2. Should see API root or 404 (both are OK)
3. Test login: `https://zenith-crm-backend.onrender.com/api/auth/token/`
   - Method: POST
   - Body: `{"username": "admin", "password": "your-password"}`

### 10.2 Test Frontend

1. Visit your frontend URL
2. Try logging in with admin credentials
3. Navigate to different sections
4. Check browser console for errors

### 10.3 Check Logs

- **Backend**: Service → **Logs** tab
- **Frontend**: Service → **Logs** tab
- Look for errors or warnings

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Symptoms**: `django.db.utils.OperationalError`

**Solutions**:
- Verify `DATABASE_URL` is correct
- Check database is running
- Verify firewall rules allow connections
- For external MySQL, ensure host allows Render IPs

#### 2. Static Files Not Loading

**Symptoms**: 404 errors for CSS/JS files

**Solutions**:
- Ensure `collectstatic` runs in build command
- Check `STATIC_ROOT` and `STATIC_URL` settings
- Verify WhiteNoise is installed and configured
- Check `STATICFILES_STORAGE` setting

#### 3. CORS Errors

**Symptoms**: `Access-Control-Allow-Origin` errors in browser

**Solutions**:
- Update `CORS_ALLOWED_ORIGINS` with frontend URL
- Include protocol (`https://`)
- No trailing slashes
- Check backend logs for CORS errors

#### 4. Build Fails

**Symptoms**: Build command exits with error

**Solutions**:
- Check build logs for specific error
- Verify all dependencies in `requirements.txt`
- Ensure Python version matches
- Check for syntax errors

#### 5. Service Crashes on Start

**Symptoms**: Service shows "Unhealthy" status

**Solutions**:
- Check start command is correct
- Verify port binding (Render uses `$PORT` env var)
- Check application logs
- Ensure database is accessible

#### 6. Environment Variables Not Working

**Symptoms**: App uses default values instead of env vars

**Solutions**:
- Verify variable names match exactly
- Check for typos
- Ensure variables are saved (click "Save Changes")
- Restart service after adding variables

### Debug Commands

**Check database connection:**
```bash
python manage.py dbshell
```

**Check environment variables:**
```bash
python manage.py shell
>>> import os
>>> os.environ.get('DATABASE_URL')
```

**View all settings:**
```bash
python manage.py diffsettings
```

---

## Maintenance

### Regular Tasks

1. **Update Dependencies**
   - Update `requirements.txt` and `package.json`
   - Test locally first
   - Deploy updates

2. **Database Backups**
   - Render provides automatic backups for paid plans
   - For free tier, export manually:
   ```bash
   pg_dump $DATABASE_URL > backup.sql
   ```

3. **Monitor Logs**
   - Check logs regularly
   - Set up alerts for errors
   - Monitor service health

4. **Update Secrets**
   - Rotate `SECRET_KEY` periodically
   - Update database passwords
   - Review API keys

### Scaling

**For Higher Traffic:**

1. **Upgrade Plans**
   - Backend: Starter → Standard → Pro
   - Database: Upgrade to higher tier
   - Frontend: Usually fine as static site

2. **Optimize**
   - Enable caching
   - Use CDN for static files
   - Optimize database queries
   - Implement rate limiting

3. **Monitoring**
   - Use Render's built-in metrics
   - Set up external monitoring (Sentry, etc.)
   - Monitor database performance

---

## Quick Reference

### Service URLs Format

- **Backend**: `https://zenith-crm-backend.onrender.com`
- **Frontend**: `https://zenith-crm-frontend.onrender.com`
- **Database**: Internal connection only

### Important Files

- `backend/requirements.txt` - Python dependencies
- `backend/zenith_crm/settings.py` - Django settings
- `frontend/package.json` - Node dependencies
- `frontend/vite.config.ts` - Vite configuration
- `.env` files - Environment variables (not committed)

### Support Resources

- **Render Docs**: https://render.com/docs
- **Django Deployment**: https://docs.djangoproject.com/en/4.2/howto/deployment/
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy.html

---

## Checklist

Before going live, ensure:

- [ ] All environment variables are set
- [ ] Database migrations are run
- [ ] Admin user is created
- [ ] CORS is configured correctly
- [ ] Static files are collected
- [ ] Custom domains are configured (if using)
- [ ] SSL certificates are active
- [ ] Backups are enabled
- [ ] Monitoring is set up
- [ ] Documentation is updated

---

## Cost Estimation

**Free Tier (Testing):**
- Backend: Free (with limitations)
- Frontend: Free
- Database: Free PostgreSQL (90 days, then $7/month)

**Production (Starter):**
- Backend: $7/month
- Frontend: Free (static site)
- Database: $7/month
- **Total**: ~$14/month

**Production (Standard):**
- Backend: $25/month
- Frontend: Free
- Database: $20/month
- **Total**: ~$45/month

---

## Next Steps

After successful deployment:

1. ✅ Test all features
2. ✅ Set up monitoring
3. ✅ Configure backups
4. ✅ Update documentation
5. ✅ Share access with team
6. ✅ Set up CI/CD (optional)

---

**Last Updated**: 2024
**Version**: 1.0

For issues or questions, check Render's documentation or support.

---

## Quick Start Checklist

Follow these steps in order:

1. ✅ **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. ✅ **Create Render account** → https://render.com

3. ✅ **Create PostgreSQL database** on Render
   - Name: `zenith-crm-db`
   - Save `DATABASE_URL` immediately!

4. ✅ **Create Backend Web Service**
   - Connect GitHub repo
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt && python manage.py collectstatic --no-input`
   - Start Command: `gunicorn zenith_crm.wsgi:application`
   - Add environment variables (see Step 6)

5. ✅ **Create Frontend Static Site**
   - Connect GitHub repo
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Add `VITE_API_BASE_URL` environment variable

6. ✅ **Set Environment Variables** (see Step 6 in guide)

7. ✅ **Run Migrations** (see Step 7 in guide)

8. ✅ **Create Admin User** (see Step 8 in guide)

9. ✅ **Test Deployment** (see Step 10 in guide)

---

## Environment Variables Quick Reference

### Backend Variables

```bash
DJANGO_SETTINGS_MODULE=zenith_crm.settings
SECRET_KEY=<generate-with-openssl-rand-hex-32>
DEBUG=False
ALLOWED_HOSTS=zenith-crm-backend.onrender.com
DATABASE_URL=<from-render-database>
CORS_ALLOWED_ORIGINS=https://zenith-crm-frontend.onrender.com
PYTHON_VERSION=3.11.0
```

### Frontend Variables

```bash
VITE_API_BASE_URL=https://zenith-crm-backend.onrender.com/api
```

**Generate SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

---

## Common Commands

**Check backend logs:**
- Render Dashboard → Backend Service → Logs

**Run migrations:**
- Render Dashboard → Backend Service → Shell
- `python manage.py migrate`

**Create admin:**
- Render Dashboard → Backend Service → Shell
- `python manage.py createsuperuser`

**Restart service:**
- Render Dashboard → Service → Manual Deploy → Clear build cache & deploy

---

**Ready to deploy?** Start with Step 1 in the guide above! 🚀

