# 🚀 Production Deployment Guide - Render Hosting

**Complete Step-by-Step Guide to Deploy Zenith Estate CRM to Production on Render**

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Step 1: Prepare Repository](#step-1-prepare-repository)
3. [Step 2: Create Render Account](#step-2-create-render-account)
4. [Step 3: Deploy PostgreSQL Database](#step-3-deploy-postgresql-database)
5. [Step 4: Deploy Django Backend](#step-4-deploy-django-backend)
6. [Step 5: Deploy React Frontend](#step-5-deploy-react-frontend)
7. [Step 6: Configure Environment Variables](#step-6-configure-environment-variables)
8. [Step 7: Run Migrations & Create Admin](#step-7-run-migrations--create-admin)
9. [Step 8: Verify Deployment](#step-8-verify-deployment)
10. [Step 9: Production Testing](#step-9-production-testing)
11. [Troubleshooting](#troubleshooting)
12. [Post-Deployment](#post-deployment)

---

## ✅ Pre-Deployment Checklist

Before starting deployment, ensure:

- [x] ✅ All code is committed to Git
- [x] ✅ Code is pushed to GitHub repository
- [x] ✅ All tests pass locally
- [x] ✅ No critical bugs (verified)
- [x] ✅ Production settings configured
- [x] ✅ Build scripts are ready
- [x] ✅ Environment variables documented

---

## Step 1: Prepare Repository

### 1.1 Push Code to GitHub

```bash
# Navigate to project root
cd zenith-estate-crm

# Check git status
git status

# Add all files
git add .

# Commit changes
git commit -m "Production-ready: All bugs fixed, ready for deployment"

# Push to GitHub
git push origin main
```

**Verify on GitHub:**
- ✅ All files are present
- ✅ No sensitive files (.env, db.sqlite3) are committed
- ✅ `.gitignore` is properly configured

### 1.2 Verify Required Files

Ensure these files exist in your repository:

**Backend Files:**
- ✅ `backend/requirements.txt`
- ✅ `backend/manage.py`
- ✅ `backend/zenith_crm/settings.py`
- ✅ `backend/zenith_crm/wsgi.py`
- ✅ `backend/build.sh`
- ✅ `backend/render.yaml` (optional)

**Frontend Files:**
- ✅ `frontend/package.json`
- ✅ `frontend/vite.config.ts`
- ✅ `frontend/index.html`

---

## Step 2: Create Render Account

1. **Go to Render**: https://render.com
2. **Sign Up**: Click "Get Started for Free"
3. **Connect GitHub**: 
   - Choose "Sign up with GitHub"
   - Authorize Render to access your repositories
4. **Verify Email**: Check your email and verify your account

---

## Step 3: Deploy PostgreSQL Database

### 3.1 Create Database Service

1. In Render Dashboard, click **"New +"** button
2. Select **"PostgreSQL"**
3. Configure Database:

**Settings:**
- **Name**: `zenith-crm-db`
- **Database**: `zenith_crm` (auto-filled)
- **User**: `zenith_user` (auto-generated)
- **Region**: Choose closest to your users (e.g., `Oregon (US West)`)
- **PostgreSQL Version**: Latest stable (14+)
- **Plan**: 
  - **Free** (for testing - 90 days free, then $7/month)
  - **Starter** ($7/month - recommended for production)

4. Click **"Create Database"**

### 3.2 Save Database Credentials

**⚠️ CRITICAL: Save these immediately!**

After creation, Render displays:
- **Internal Database URL**: `postgresql://zenith_user:xxxxx@dpg-xxxxx-a.oregon-postgres.render.com:5432/zenith_crm`
- **External Database URL**: (for local connections)
- **Host**: `dpg-xxxxx-a.oregon-postgres.render.com`
- **Port**: `5432`
- **Database Name**: `zenith_crm`
- **User**: `zenith_user`
- **Password**: `xxxxx` (shown once - **COPY THIS NOW!**)

**Save these in a secure location!**

---

## Step 4: Deploy Django Backend

### 4.1 Create Web Service

1. In Render Dashboard, click **"New +"**
2. Select **"Web Service"**
3. Connect Repository:
   - Click **"Connect account"** if not connected
   - Select your GitHub account
   - Choose repository: `zenith-estate-crm`
   - Click **"Connect"**

### 4.2 Configure Backend Service

**Basic Settings:**
- **Name**: `zenith-crm-backend`
- **Region**: Same as database (e.g., `Oregon (US West)`)
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend`
- **Runtime**: `Python 3`
- **Build Command**: 
  ```bash
  pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate --no-input
  ```
- **Start Command**: 
  ```bash
  gunicorn zenith_crm.wsgi:application
  ```

**Instance Type:**
- **Free**: 512 MB RAM (for testing)
- **Starter**: $7/month, 512 MB RAM (recommended for production)
- **Standard**: $25/month, 2 GB RAM (for higher traffic)

**Auto-Deploy:**
- ✅ Enable "Auto-Deploy" (deploys on every push to main branch)

Click **"Create Web Service"**

### 4.3 Initial Deployment

The service will start building. This may take 3-5 minutes.

**Watch for:**
- ✅ Build completes successfully
- ✅ Service shows "Live" status
- ⚠️ If build fails, check logs (see Troubleshooting)

---

## Step 5: Deploy React Frontend

### 5.1 Create Static Site

1. In Render Dashboard, click **"New +"**
2. Select **"Static Site"**
3. Connect Repository:
   - Select your GitHub account
   - Choose repository: `zenith-estate-crm`
   - Click **"Connect"**

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

**Auto-Deploy:**
- ✅ Enable "Auto-Deploy"

Click **"Create Static Site"**

### 5.3 Initial Build

The frontend will build. This may take 2-4 minutes.

**Note**: We'll add environment variables in the next step.

---

## Step 6: Configure Environment Variables

### 6.1 Backend Environment Variables

Go to **Backend Service** → **Environment** tab → Click **"Add Environment Variable"**

Add these variables one by one:

#### Required Variables:

```bash
# Django Settings
DJANGO_SETTINGS_MODULE=zenith_crm.settings
SECRET_KEY=<generate-secure-key>
DEBUG=False
ALLOWED_HOSTS=zenith-crm-backend.onrender.com
USE_SQLITE=False

# Database (from Step 3.2)
DATABASE_URL=<your-internal-database-url-from-render>

# CORS (use your frontend URL - we'll update after frontend is deployed)
CORS_ALLOWED_ORIGINS=https://zenith-crm-frontend.onrender.com

# Python Version
PYTHON_VERSION=3.11.0
```

#### Generate SECRET_KEY:

**Option 1: Using Python**
```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

**Option 2: Using OpenSSL**
```bash
openssl rand -hex 32
```

**Option 3: Online Generator**
- Visit: https://djecrety.ir/
- Copy the generated key

**Important Notes:**
- Replace `<your-internal-database-url-from-render>` with the actual DATABASE_URL from Step 3.2
- Replace `zenith-crm-backend.onrender.com` with your actual backend service URL
- Replace `zenith-crm-frontend.onrender.com` with your actual frontend service URL (update after frontend deploys)

### 6.2 Frontend Environment Variables

Go to **Frontend Service** → **Environment** tab → Click **"Add Environment Variable"**

Add:

```bash
VITE_API_BASE_URL=https://zenith-crm-backend.onrender.com/api
```

**Important**: Replace `zenith-crm-backend.onrender.com` with your actual backend URL.

### 6.3 Update CORS After Frontend Deploys

After frontend is deployed, update backend's `CORS_ALLOWED_ORIGINS`:

1. Go to Backend Service → Environment
2. Edit `CORS_ALLOWED_ORIGINS`
3. Update to: `https://zenith-crm-frontend.onrender.com` (your actual frontend URL)
4. Save Changes
5. Service will automatically redeploy

---

## Step 7: Run Migrations & Create Admin

### 7.1 Run Migrations

Migrations should run automatically during build (included in build command).

**To verify or run manually:**

1. Go to Backend Service → **Shell** tab
2. Run:
   ```bash
   python manage.py migrate
   ```
3. You should see: `Operations to perform: Apply all migrations...`

### 7.2 Create Admin User

1. Go to Backend Service → **Shell** tab
2. Run:
   ```bash
   python manage.py createsuperuser
   ```
3. Follow prompts:
   - **Username**: `admin` (or your choice)
   - **Email**: `admin@yourcompany.com`
   - **Password**: Enter a strong password (save it securely!)
   - **Password (again)**: Confirm password

**Alternative: Use Management Script**

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
    admin.set_password('YourSecurePassword123!')  # CHANGE THIS!
    admin.save()
    print('✅ Admin user created successfully!')
else:
    admin.set_password('YourSecurePassword123!')  # CHANGE THIS!
    admin.save()
    print('✅ Admin user password updated!')
```

Run in Shell:
```bash
python create_admin.py
```

---

## Step 8: Verify Deployment

### 8.1 Check Backend Health

1. **Visit Backend URL**: `https://zenith-crm-backend.onrender.com/api/`
   - Should return JSON response or 404 (both are OK)

2. **Test API Endpoint**:
   ```bash
   curl https://zenith-crm-backend.onrender.com/api/
   ```

3. **Check Logs**: Backend Service → **Logs** tab
   - Look for: "Starting gunicorn"
   - No error messages

### 8.2 Check Frontend

1. **Visit Frontend URL**: `https://zenith-crm-frontend.onrender.com`
   - Should load the login page
   - Check browser console (F12) for errors

2. **Verify API Connection**:
   - Open browser DevTools → Network tab
   - Try to login
   - Check if API calls are made to backend

### 8.3 Test Login

1. Go to frontend URL
2. Login with admin credentials created in Step 7.2
3. Verify you can access the dashboard

---

## Step 9: Production Testing

### 9.1 Functional Testing Checklist

Test each feature:

- [ ] **Authentication**
  - [ ] Login works
  - [ ] Logout works
  - [ ] Token refresh works

- [ ] **Dashboard**
  - [ ] Loads correctly
  - [ ] Charts display
  - [ ] Metrics show data

- [ ] **Leads Management**
  - [ ] View leads list
  - [ ] Create new lead
  - [ ] Edit lead
  - [ ] Delete lead

- [ ] **Properties**
  - [ ] View properties
  - [ ] Add property
  - [ ] Edit property

- [ ] **Payments**
  - [ ] View payment overview
  - [ ] Create booking payment
  - [ ] View receipts
  - [ ] Payment schedules

- [ ] **Reports**
  - [ ] Generate reports
  - [ ] Charts display correctly

- [ ] **Settings**
  - [ ] Access settings
  - [ ] Update configurations

### 9.2 Performance Testing

- [ ] Page load times are acceptable (< 3 seconds)
- [ ] API responses are fast (< 1 second)
- [ ] No console errors
- [ ] Images load correctly

### 9.3 Security Testing

- [ ] HTTPS is enabled (check URL has `https://`)
- [ ] Cannot access admin panel without login
- [ ] API requires authentication
- [ ] CORS is configured correctly

---

## 🔧 Troubleshooting

### Issue 1: Build Fails

**Symptoms**: Service shows "Build Failed"

**Solutions**:
1. Check Build Logs:
   - Go to Service → **Logs** tab
   - Look for error messages
   - Common issues:
     - Missing dependencies in `requirements.txt`
     - Syntax errors in code
     - Missing environment variables

2. Common Fixes:
   ```bash
   # Verify requirements.txt has all packages
   # Check for typos in build command
   # Ensure Python version matches runtime.txt
   ```

### Issue 2: Database Connection Failed

**Symptoms**: `django.db.utils.OperationalError` in logs

**Solutions**:
1. Verify `DATABASE_URL` is correct:
   - Go to Database → **Info** tab
   - Copy Internal Database URL
   - Update in Backend Environment Variables

2. Check Database is Running:
   - Database service should show "Available"

3. Verify Environment Variable:
   - Backend → Environment → Check `DATABASE_URL` exists
   - No extra spaces or quotes

### Issue 3: Static Files Not Loading

**Symptoms**: 404 errors for CSS/JS files

**Solutions**:
1. Verify Build Command includes:
   ```bash
   python manage.py collectstatic --no-input
   ```

2. Check `STATIC_ROOT` in settings.py:
   ```python
   STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
   ```

3. Verify WhiteNoise is installed:
   ```bash
   # In requirements.txt
   whitenoise==6.6.0
   ```

### Issue 4: CORS Errors

**Symptoms**: `Access-Control-Allow-Origin` errors in browser console

**Solutions**:
1. Update `CORS_ALLOWED_ORIGINS`:
   - Backend → Environment
   - Add frontend URL: `https://zenith-crm-frontend.onrender.com`
   - Include `https://` protocol
   - No trailing slash

2. Verify CORS middleware is enabled in settings.py

### Issue 5: Frontend Can't Connect to Backend

**Symptoms**: Network errors, API calls fail

**Solutions**:
1. Verify `VITE_API_BASE_URL`:
   - Frontend → Environment
   - Should be: `https://zenith-crm-backend.onrender.com/api`
   - No trailing slash

2. Check Backend is Running:
   - Visit backend URL directly
   - Should return response

3. Verify CORS is configured (see Issue 4)

### Issue 6: Service Crashes on Start

**Symptoms**: Service shows "Unhealthy" or crashes

**Solutions**:
1. Check Start Command:
   ```bash
   gunicorn zenith_crm.wsgi:application
   ```

2. Check Logs for specific error

3. Verify Port Binding:
   - Render uses `$PORT` environment variable
   - Gunicorn should bind to `0.0.0.0:$PORT`
   - Update start command if needed:
     ```bash
     gunicorn zenith_crm.wsgi:application --bind 0.0.0.0:$PORT
     ```

### Issue 7: Migrations Not Running

**Symptoms**: Database tables missing

**Solutions**:
1. Run manually in Shell:
   ```bash
   python manage.py migrate
   ```

2. Check Build Command includes:
   ```bash
   python manage.py migrate --no-input
   ```

### Issue 8: Admin User Creation Fails

**Solutions**:
1. Use Shell to create:
   ```bash
   python manage.py createsuperuser
   ```

2. Or use management script (see Step 7.2)

---

## 📋 Post-Deployment

### 9.1 Monitor Services

**Daily Checks:**
- [ ] Services are running (green status)
- [ ] No error logs
- [ ] Response times are acceptable

**Weekly Checks:**
- [ ] Review error logs
- [ ] Check database size
- [ ] Monitor resource usage

### 9.2 Set Up Monitoring (Optional)

1. **Render Metrics**: Built-in monitoring in dashboard
2. **External Monitoring**: 
   - UptimeRobot (free)
   - Pingdom
   - StatusCake

### 9.3 Backup Strategy

**Database Backups:**
- Render provides automatic backups for paid plans
- Free tier: Manual backups recommended

**Manual Backup:**
```bash
# In Render Shell
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### 9.4 Update Documentation

- [ ] Update team on deployment URLs
- [ ] Share admin credentials securely
- [ ] Document environment variables
- [ ] Create runbook for common issues

---

## 🔐 Security Checklist

Before going live, verify:

- [ ] ✅ `DEBUG=False` in production
- [ ] ✅ Strong `SECRET_KEY` set
- [ ] ✅ `ALLOWED_HOSTS` includes your domain
- [ ] ✅ HTTPS enabled (automatic on Render)
- [ ] ✅ CORS configured correctly
- [ ] ✅ Admin password is strong
- [ ] ✅ No sensitive data in code
- [ ] ✅ Environment variables are secure
- [ ] ✅ Database credentials are protected

---

## 📊 Service URLs Reference

After deployment, you'll have:

- **Backend API**: `https://zenith-crm-backend.onrender.com`
- **Frontend App**: `https://zenith-crm-frontend.onrender.com`
- **Admin Panel**: `https://zenith-crm-backend.onrender.com/admin/`
- **API Root**: `https://zenith-crm-backend.onrender.com/api/`

**Note**: Replace `zenith-crm-backend` and `zenith-crm-frontend` with your actual service names.

---

## 💰 Cost Estimation

### Free Tier (Testing)
- Backend: Free (with limitations)
- Frontend: Free
- Database: Free for 90 days, then $7/month
- **Total**: $0 (first 90 days), then $7/month

### Production (Starter)
- Backend: $7/month
- Frontend: Free (static site)
- Database: $7/month
- **Total**: ~$14/month

### Production (Standard)
- Backend: $25/month
- Frontend: Free
- Database: $20/month
- **Total**: ~$45/month

---

## ✅ Final Checklist

Before marking as production-ready:

- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] Admin user created
- [ ] CORS configured correctly
- [ ] Static files collected
- [ ] All features tested
- [ ] No critical errors in logs
- [ ] HTTPS working
- [ ] Performance is acceptable
- [ ] Security checklist completed
- [ ] Team has access
- [ ] Documentation updated

---

## 🆘 Support & Resources

**Render Documentation:**
- https://render.com/docs

**Django Deployment:**
- https://docs.djangoproject.com/en/4.2/howto/deployment/

**Vite Deployment:**
- https://vitejs.dev/guide/static-deploy.html

**Render Support:**
- Email: support@render.com
- Community: https://community.render.com

---

## 📝 Quick Command Reference

**Check Backend Logs:**
- Render Dashboard → Backend Service → Logs

**Run Shell Commands:**
- Render Dashboard → Backend Service → Shell

**Restart Service:**
- Render Dashboard → Service → Manual Deploy → Clear build cache & deploy

**View Environment Variables:**
- Render Dashboard → Service → Environment

---

**Last Updated**: 2024  
**Version**: 2.0 (Production-Ready)  
**Status**: ✅ All bugs fixed, production-ready

---

## 🎯 Quick Start Summary

1. ✅ Push code to GitHub
2. ✅ Create Render account
3. ✅ Create PostgreSQL database → Save DATABASE_URL
4. ✅ Create Backend Web Service → Add environment variables
5. ✅ Create Frontend Static Site → Add VITE_API_BASE_URL
6. ✅ Run migrations → Create admin user
7. ✅ Test all features
8. ✅ Go live! 🚀

---

**Ready to deploy? Start with Step 1!** 🎉

