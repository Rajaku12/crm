# 🚀 Render Production Deployment - Step-by-Step Guide

**Complete guide to deploy Zenith Estate CRM to Render hosting platform**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Verify Code is Ready](#step-1-verify-code-is-ready)
3. [Step 2: Create Render Account](#step-2-create-render-account)
4. [Step 3: Deploy PostgreSQL Database](#step-3-deploy-postgresql-database)
5. [Step 4: Deploy Django Backend](#step-4-deploy-django-backend)
6. [Step 5: Deploy React Frontend](#step-5-deploy-react-frontend)
7. [Step 6: Configure Environment Variables](#step-6-configure-environment-variables)
8. [Step 7: Run Migrations & Create Admin](#step-7-run-migrations--create-admin)
9. [Step 8: Verify Deployment](#step-8-verify-deployment)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

✅ **Before starting, ensure:**
- [x] Code is pushed to GitHub: https://github.com/Rajaku12/crm
- [x] GitHub account is ready
- [x] All local tests pass
- [x] No critical bugs

---

## Step 1: Verify Code is Ready

### 1.1 Check Repository

Visit: https://github.com/Rajaku12/crm

Verify these files exist:
- ✅ `backend/requirements.txt`
- ✅ `backend/build.sh`
- ✅ `backend/runtime.txt`
- ✅ `backend/render.yaml`
- ✅ `frontend/package.json`
- ✅ `frontend/vite.config.ts`

### 1.2 Generate Secret Key

**Run this command locally:**

```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

**Save the output** - you'll need it in Step 6.

---

## Step 2: Create Render Account

1. **Go to**: https://render.com
2. **Click**: "Get Started for Free"
3. **Sign up** with your GitHub account
4. **Authorize** Render to access your GitHub repositories
5. **Verify** your email address

---

## Step 3: Deploy PostgreSQL Database

### 3.1 Create Database

1. **In Render Dashboard**, click **"New +"** → **"PostgreSQL"**
2. **Fill in details:**
   - **Name**: `zenith-crm-db` (or your preferred name)
   - **Database**: `zenith_crm`
   - **User**: `zenith_user` (or auto-generated)
   - **Region**: Choose closest to you (e.g., `Oregon`, `Frankfurt`)
   - **PostgreSQL Version**: `15` (or latest)
   - **Plan**: `Free` (for testing) or `Starter` ($7/month) for production
3. **Click**: "Create Database"

### 3.2 Get Database URL

1. **Wait** for database to be created (1-2 minutes)
2. **Click** on your database
3. **Go to**: "Connections" tab
4. **Copy** the **"Internal Database URL"**
   - Format: `postgresql://user:password@host:port/database`
   - **Save this** - you'll need it in Step 6

**⚠️ Important**: Use **Internal Database URL** (not External) for backend service.

---

## Step 4: Deploy Django Backend

### 4.1 Create Web Service

1. **In Render Dashboard**, click **"New +"** → **"Web Service"**
2. **Connect Repository:**
   - Select: **"Connect GitHub"** (if not connected)
   - Find and select: **`Rajaku12/crm`**
   - Click: **"Connect"**

### 4.2 Configure Backend Service

**Fill in the form:**

#### Basic Settings:
- **Name**: `zenith-crm-backend` (or your preferred name)
- **Region**: Same as database (e.g., `Oregon`)
- **Branch**: `main`
- **Root Directory**: `backend` ⚠️ **Important!**
- **Runtime**: `Python 3`
- **Build Command**: 
  ```bash
  pip install --upgrade pip && pip install -r requirements.txt && python manage.py collectstatic --no-input
  ```
- **Start Command**: 
  ```bash
  gunicorn zenith_crm.wsgi:application --bind 0.0.0.0:$PORT
  ```

#### Advanced Settings:
- **Plan**: `Free` (for testing) or `Starter` ($7/month) for production
- **Auto-Deploy**: `Yes` (deploys on every push to main branch)

### 4.3 Create Service

Click **"Create Web Service"**

**⚠️ Don't add environment variables yet** - we'll do that in Step 6.

---

## Step 5: Deploy React Frontend

### 5.1 Create Static Site

1. **In Render Dashboard**, click **"New +"** → **"Static Site"**
2. **Connect Repository:**
   - Select: **`Rajaku12/crm`**
   - Click: **"Connect"**

### 5.2 Configure Frontend Service

**Fill in the form:**

- **Name**: `zenith-crm-frontend` (or your preferred name)
- **Branch**: `main`
- **Root Directory**: `frontend` ⚠️ **Important!**
- **Build Command**: 
  ```bash
  npm install && npm run build
  ```
- **Publish Directory**: `dist` ⚠️ **Important!**

### 5.3 Create Service

Click **"Create Static Site"**

**Note**: Frontend will build, but won't work until backend environment variables are set.

---

## Step 6: Configure Environment Variables

### 6.1 Backend Environment Variables

1. **Go to**: Backend Service → **"Environment"** tab
2. **Click**: **"Add Environment Variable"**
3. **Add these variables one by one:**

#### Required Variables:

```bash
# Django Settings
DJANGO_SETTINGS_MODULE=zenith_crm.settings
SECRET_KEY=<paste-your-secret-key-from-step-1.2>
DEBUG=False
ALLOWED_HOSTS=zenith-crm-backend.onrender.com
USE_SQLITE=False

# Database (from Step 3.2)
DATABASE_URL=<paste-internal-database-url-from-step-3.2>

# CORS (update after frontend deploys)
CORS_ALLOWED_ORIGINS=https://zenith-crm-frontend.onrender.com

# Python Version
PYTHON_VERSION=3.11.0
```

**⚠️ Important Replacements:**
- Replace `<paste-your-secret-key-from-step-1.2>` with the key you generated
- Replace `<paste-internal-database-url-from-step-3.2>` with your database URL
- Replace `zenith-crm-backend.onrender.com` with your actual backend service URL
- Replace `zenith-crm-frontend.onrender.com` with your actual frontend service URL

**How to find your service URLs:**
- Backend URL: Backend Service → "Settings" → Look at the top
- Frontend URL: Frontend Service → "Settings" → Look at the top

### 6.2 Frontend Environment Variables

1. **Go to**: Frontend Service → **"Environment"** tab
2. **Click**: **"Add Environment Variable"**
3. **Add:**

```bash
VITE_API_BASE_URL=https://zenith-crm-backend.onrender.com/api
```

**⚠️ Replace** `zenith-crm-backend.onrender.com` with your actual backend URL.

### 6.3 Save and Deploy

After adding all variables:
- **Backend**: Will automatically redeploy
- **Frontend**: Will automatically redeploy

**Wait** for both services to finish deploying (5-10 minutes).

---

## Step 7: Run Migrations & Create Admin

### 7.1 Run Migrations

1. **Go to**: Backend Service → **"Shell"** tab
2. **Click**: **"Open Shell"**
3. **Run these commands:**

```bash
# Navigate to backend directory
cd backend

# Run migrations
python manage.py migrate

# Verify migrations
python manage.py showmigrations
```

### 7.2 Create Admin User

**In the same shell, run:**

```bash
python manage.py createsuperuser
```

**Follow prompts:**
- Username: `admin` (or your choice)
- Email: `admin@example.com` (or your email)
- Password: Create a strong password (save it!)

### 7.3 Verify Admin

1. **Visit**: `https://your-backend-url.onrender.com/admin/`
2. **Login** with the credentials you just created
3. **Verify** you can access the admin panel

---

## Step 8: Verify Deployment

### 8.1 Test Backend API

1. **Visit**: `https://your-backend-url.onrender.com/api/`
2. **Expected**: Should see API endpoints or JSON response
3. **Test Admin**: `https://your-backend-url.onrender.com/admin/`
4. **Login** and verify it works

### 8.2 Test Frontend

1. **Visit**: `https://your-frontend-url.onrender.com`
2. **Expected**: Should see the login page
3. **Try logging in** with test credentials

### 8.3 Test API Connection

1. **Open browser console** (F12)
2. **Check Network tab** for API calls
3. **Verify** API calls go to: `https://your-backend-url.onrender.com/api/`

### 8.4 Common Issues

**If frontend shows errors:**
- Check browser console for CORS errors
- Verify `CORS_ALLOWED_ORIGINS` includes your frontend URL
- Verify `VITE_API_BASE_URL` is correct

**If backend shows 500 errors:**
- Check backend logs: Backend Service → "Logs" tab
- Verify `DATABASE_URL` is correct
- Verify migrations ran successfully

---

## Troubleshooting

### Backend Won't Start

**Check:**
1. **Logs**: Backend Service → "Logs" tab
2. **Build Command**: Should match exactly
3. **Start Command**: Should include `--bind 0.0.0.0:$PORT`
4. **Environment Variables**: All required variables set

**Common Errors:**

**Error: "No module named 'gunicorn'"**
- **Fix**: Add `gunicorn==21.2.0` to `requirements.txt` (already there)

**Error: "Database connection failed"**
- **Fix**: Verify `DATABASE_URL` is correct (use Internal URL)
- **Fix**: Check database is running

**Error: "ALLOWED_HOSTS"**
- **Fix**: Add your backend URL to `ALLOWED_HOSTS` environment variable

### Frontend Won't Build

**Check:**
1. **Logs**: Frontend Service → "Logs" tab
2. **Build Command**: Should be `npm install && npm run build`
3. **Publish Directory**: Should be `dist`

**Common Errors:**

**Error: "Cannot find module"**
- **Fix**: Verify `package.json` has all dependencies
- **Fix**: Check `node_modules` is not in `.gitignore` (it shouldn't be)

**Error: "API calls failing"**
- **Fix**: Verify `VITE_API_BASE_URL` environment variable is set
- **Fix**: Check backend CORS settings

### Database Issues

**Error: "Migration failed"**
- **Fix**: Run migrations manually in Shell
- **Fix**: Check database connection

**Error: "Table doesn't exist"**
- **Fix**: Run `python manage.py migrate` in Shell

---

## Post-Deployment Checklist

After deployment, verify:

- [ ] ✅ Backend API is accessible
- [ ] ✅ Frontend loads correctly
- [ ] ✅ Admin panel works
- [ ] ✅ Database migrations applied
- [ ] ✅ Admin user created
- [ ] ✅ API endpoints respond
- [ ] ✅ CORS configured correctly
- [ ] ✅ Static files load
- [ ] ✅ No errors in logs
- [ ] ✅ HTTPS working (automatic on Render)

---

## Service URLs Reference

After deployment, you'll have:

- **Backend API**: `https://zenith-crm-backend.onrender.com`
- **Frontend App**: `https://zenith-crm-frontend.onrender.com`
- **Admin Panel**: `https://zenith-crm-backend.onrender.com/admin/`
- **API Root**: `https://zenith-crm-backend.onrender.com/api/`

**Note**: Replace service names with your actual service names.

---

## Cost Estimation

### Free Tier (Testing)
- Backend: Free (with limitations - spins down after inactivity)
- Frontend: Free
- Database: Free for 90 days, then $7/month
- **Total**: $0 (first 90 days), then $7/month

### Production (Starter Plan)
- Backend: $7/month (always on)
- Frontend: Free (static site)
- Database: $7/month
- **Total**: ~$14/month

---

## Next Steps

1. **Set up custom domain** (optional)
2. **Configure email** for production
3. **Set up monitoring** and alerts
4. **Configure backups** for database
5. **Set up CI/CD** for automatic deployments

---

## Support

**Render Documentation:**
- https://render.com/docs

**Django Deployment:**
- https://docs.djangoproject.com/en/4.2/howto/deployment/

**Need Help?**
- Check Render logs for errors
- Review this guide step-by-step
- Check Render community forums

---

**Last Updated**: 2024
**Repository**: https://github.com/Rajaku12/crm

