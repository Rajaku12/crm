# Complete Deployment Guide - Zenith Estate CRM

**One comprehensive guide for deploying, configuring, and verifying everything works on Render.**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create Render Services](#step-1-create-render-services)
3. [Step 2: Configure Backend](#step-2-configure-backend)
4. [Step 3: Configure Frontend](#step-3-configure-frontend)
5. [Step 4: Set Environment Variables](#step-4-set-environment-variables)
6. [Step 5: Deploy and Run Migrations](#step-5-deploy-and-run-migrations)
7. [Step 6: Create Admin User](#step-6-create-admin-user)
8. [Step 7: Verify Everything Works](#step-7-verify-everything-works)
9. [API Configuration](#api-configuration)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- GitHub account with code pushed to repository
- Render account (sign up at https://render.com)
- Your backend URL: `https://crm-11o1.onrender.com` (or your actual URL)
- Your frontend URL: (will be created during deployment)

---

## Step 1: Create Render Services

### 1.1 Create Database

1. Go to **Render Dashboard** → **New** → **PostgreSQL**
2. Configure:
   - **Name**: `zenith-crm-db` (or any name)
   - **Database**: `zenith_crm`
   - **User**: `zenith_user`
   - **Region**: `Oregon` (or closest to you)
   - **Plan**: `Starter` (free tier)
3. Click **Create Database**
4. **Wait for database to be ready** (status shows "Available")

### 1.2 Create Backend Service

1. Go to **Render Dashboard** → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `zenith-crm-backend` (or any name)
   - **Region**: `Oregon`
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: 
     ```bash
     pip install --upgrade pip && pip install -r requirements.txt && python manage.py collectstatic --no-input
     ```
   - **Start Command**: 
     ```bash
     python manage.py migrate --no-input && gunicorn zenith_crm.wsgi:application --bind 0.0.0.0:$PORT
     ```
4. Click **Create Web Service**

### 1.3 Create Frontend Service

1. Go to **Render Dashboard** → **New** → **Static Site**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `zenith-crm-frontend` (or any name)
   - **Region**: `Oregon`
   - **Branch**: `main`
   - **Root Directory**: `.` (dot or leave empty)
   - **Build Command**: 
     ```bash
     cd frontend && npm install && npm run build
     ```
   - **Publish Directory**: `frontend/dist`
4. Click **Create Static Site**

---

## Step 2: Configure Backend

### 2.1 Backend Service Settings

Go to **Backend Service** → **Settings** tab, verify:

- **Service Type**: Web Service
- **Root Directory**: `backend`
- **Build Command**: 
  ```bash
  pip install --upgrade pip && pip install -r requirements.txt && python manage.py collectstatic --no-input
  ```
- **Start Command**: 
  ```bash
  python manage.py migrate --no-input && gunicorn zenith_crm.wsgi:application --bind 0.0.0:$PORT
  ```

### 2.2 Link Database to Backend

1. Go to **Backend Service** → **Settings** tab
2. Scroll to **"Connections"** section
3. Click **"Link Database"**
4. Select your database (`zenith-crm-db`)
5. Render will automatically set `DATABASE_URL` environment variable

---

## Step 3: Configure Frontend

### 3.1 Frontend Service Settings

Go to **Frontend Service** → **Settings** tab, verify:

- **Service Type**: Static Site
- **Root Directory**: `.` (dot or empty)
- **Build Command**: 
  ```bash
  cd frontend && npm install && npm run build
  ```
- **Publish Directory**: `frontend/dist`

---

## Step 4: Set Environment Variables

### 4.1 Backend Environment Variables

Go to **Backend Service** → **Environment** tab, add/update:

#### Required Variables:

1. **ALLOWED_HOSTS**
   - **Key**: `ALLOWED_HOSTS`
   - **Value**: `crm-11o1.onrender.com,localhost,127.0.0.1`
   - ⚠️ Replace `crm-11o1.onrender.com` with your actual backend URL

2. **CORS_ALLOWED_ORIGINS**
   - **Key**: `CORS_ALLOWED_ORIGINS`
   - **Value**: `https://your-frontend-url.onrender.com,http://localhost:5173,http://localhost:3000`
   - ⚠️ Replace `your-frontend-url.onrender.com` with your actual frontend URL
   - To find frontend URL: Frontend Service → Settings → Look for "URL"

3. **DEBUG**
   - **Key**: `DEBUG`
   - **Value**: `False`

4. **SECRET_KEY**
   - **Key**: `SECRET_KEY`
   - **Value**: Generate a strong secret key:
     ```bash
     python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
     ```

5. **USE_SQLITE**
   - **Key**: `USE_SQLITE`
   - **Value**: `False`

6. **DATABASE_URL** (Auto-set by Render when you link database)
   - Don't manually set this - Render sets it automatically

#### Optional Variables (for integrations):

- `TWILIO_ACCOUNT_SID` - For Twilio telephony
- `TWILIO_AUTH_TOKEN` - For Twilio telephony
- `RAZORPAY_KEY_ID` - For Razorpay payments
- `RAZORPAY_KEY_SECRET` - For Razorpay payments
- `GEMINI_API_KEY` - For AI features

### 4.2 Frontend Environment Variables

Go to **Frontend Service** → **Environment** tab, add:

1. **VITE_API_BASE_URL**
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://crm-11o1.onrender.com/api`
   - ⚠️ Replace `crm-11o1.onrender.com` with your actual backend URL
   - ⚠️ **NO trailing slash** after `/api`

---

## Step 5: Deploy and Run Migrations

### 5.1 Deploy Backend

1. Go to **Backend Service** → **Manual Deploy** section
2. Click **"Deploy latest commit"**
3. Wait for build to complete
4. Check **Logs** tab for any errors

### 5.2 Run Migrations (if not in start command)

If migrations didn't run automatically:

1. Go to **Backend Service** → **Shell** tab (or use **Logs** → **Shell**)
2. Run:
   ```bash
   python manage.py migrate
   ```
3. Wait for migrations to complete

### 5.3 Deploy Frontend

1. Go to **Frontend Service** → **Manual Deploy** section
2. Click **"Deploy latest commit"**
3. Wait for build to complete
4. Check **Logs** tab for any errors

---

## Step 6: Create Admin User

### 6.1 Using Render Shell

1. Go to **Backend Service** → **Shell** tab
2. Run:
   ```bash
   python manage.py createsuperuser
   ```
3. Follow prompts:
   - Username: (enter username)
   - Email: (enter email)
   - Password: (enter password - must be strong)
   - Password (again): (confirm password)

### 6.2 Verify Admin Access

1. Visit: `https://crm-11o1.onrender.com/admin/`
2. Login with superuser credentials
3. You should see Django admin dashboard

---

## Step 7: Verify Everything Works

### 7.1 Test Backend API

1. **Test Root Endpoint**:
   - Visit: `https://crm-11o1.onrender.com/`
   - Should return: `{"message": "Zenith Estate CRM API", ...}`

2. **Test API Root**:
   - Visit: `https://crm-11o1.onrender.com/api/`
   - Should return: JSON with all available endpoints

3. **Test Admin**:
   - Visit: `https://crm-11o1.onrender.com/admin/`
   - Should show: Django admin login page

### 7.2 Test Frontend

1. **Visit Frontend URL**:
   - Go to: `https://your-frontend-url.onrender.com`
   - Should show: Login page (not blank, not "Not Found")

2. **Test Direct Route**:
   - Visit: `https://your-frontend-url.onrender.com/dashboard`
   - Should load: Dashboard (not "Not Found")

3. **Test Page Refresh**:
   - Navigate to any route
   - Press F5 to refresh
   - Should still work (not "Not Found")

### 7.3 Test API Connection

1. **Open Browser Console** (F12)
2. **Go to Network tab**
3. **Try to login** on frontend
4. **Check Network requests**:
   - Should see requests to: `https://crm-11o1.onrender.com/api/auth/token/`
   - Status should be: `200 OK` (not CORS errors)

### 7.4 Test Login

1. **Open Frontend**
2. **Try to login** with admin credentials
3. **Should successfully login** and redirect to dashboard

---

## API Configuration

### API Base URL

**Frontend Environment Variable:**
```
VITE_API_BASE_URL=https://crm-11o1.onrender.com/api
```

**Where to set:**
- Render Dashboard → Frontend Service → Environment tab

### API Endpoints

All API endpoints are under `/api/`:

- **Authentication**:
  - Login: `POST /api/auth/token/`
  - Register: `POST /api/auth/register/`
  - Refresh Token: `POST /api/auth/token/refresh/`

- **Resources**:
  - Leads: `/api/leads/`
  - Agents: `/api/agents/`
  - Properties: `/api/properties/`
  - Clients: `/api/clients/`
  - Call Logs: `/api/call-logs/`
  - Telephony Config: `/api/telephony-configs/`

### CORS Configuration

**Backend Environment Variable:**
```
CORS_ALLOWED_ORIGINS=https://your-frontend-url.onrender.com,http://localhost:5173,http://localhost:3000
```

**Where to set:**
- Render Dashboard → Backend Service → Environment tab

**Important:**
- Include `https://` protocol
- No trailing slashes
- Separate multiple origins with commas

---

## Troubleshooting

### Issue 1: Backend Shows "Not Found" for `/api/`

**Solution:**
- Verify backend code is deployed (check latest commit)
- Check backend logs for errors
- Verify `ALLOWED_HOSTS` includes your backend URL

### Issue 2: Frontend Shows "Not Found"

**Solution:**
1. **If using Static Site:**
   - Verify **Publish Directory** is `frontend/dist`
   - Check build logs - `index.html` should exist in `frontend/dist`
   - Verify **Root Directory** is `.` (dot)

2. **If still not working:**
   - Change service type to **Web Service**
   - Update **Root Directory** to `frontend`
   - Update **Start Command** to: `npm start`
   - Redeploy

### Issue 3: CORS Errors in Browser

**Symptoms:** Browser console shows `Access-Control-Allow-Origin` errors

**Solution:**
1. Go to Backend Service → Environment tab
2. Update `CORS_ALLOWED_ORIGINS`:
   ```
   https://your-frontend-url.onrender.com,http://localhost:5173,http://localhost:3000
   ```
3. Make sure:
   - Includes `https://` protocol
   - No trailing slash
   - Frontend URL is correct
4. Redeploy backend

### Issue 4: Database Connection Failed

**Symptoms:** Backend logs show `django.db.utils.OperationalError`

**Solution:**
1. Verify database is running (status shows "Available")
2. Check database is linked to backend:
   - Backend Service → Settings → Connections
   - Should show linked database
3. Verify `DATABASE_URL` is set (auto-set by Render)
4. Check database credentials are correct

### Issue 5: Build Fails

**Backend Build Fails:**
- Check build logs for specific error
- Verify `requirements.txt` has all packages
- Check Python version matches (3.11.0)
- Verify build command is correct

**Frontend Build Fails:**
- Check build logs for specific error
- Verify `package.json` has all dependencies
- Check Node.js version is compatible
- Verify build command is correct

### Issue 6: Service Crashes on Start

**Solution:**
1. Check **Logs** tab for error messages
2. Verify **Start Command** is correct:
   ```bash
   python manage.py migrate --no-input && gunicorn zenith_crm.wsgi:application --bind 0.0.0.0:$PORT
   ```
3. Check if port binding is correct (`$PORT` is used by Render)
4. Verify all environment variables are set

### Issue 7: Migrations Not Running

**Solution:**
1. Start command should include: `python manage.py migrate --no-input`
2. Or run manually in Shell:
   ```bash
   python manage.py migrate
   ```

### Issue 8: Static Files Not Loading

**Solution:**
1. Verify build command includes: `python manage.py collectstatic --no-input`
2. Check `STATIC_ROOT` in settings.py
3. Verify WhiteNoise is installed (`whitenoise==6.6.0` in requirements.txt)

### Issue 9: Frontend Can't Connect to Backend

**Symptoms:** Network errors, API calls fail

**Solution:**
1. Verify `VITE_API_BASE_URL` is set correctly:
   ```
   https://crm-11o1.onrender.com/api
   ```
2. Check backend is running (status shows "Live")
3. Test backend directly: `https://crm-11o1.onrender.com/api/`
4. Verify CORS is configured (see Issue 3)

---

## Quick Reference Checklist

### Backend Configuration:
- [ ] Service Type: Web Service
- [ ] Root Directory: `backend`
- [ ] Build Command: `pip install --upgrade pip && pip install -r requirements.txt && python manage.py collectstatic --no-input`
- [ ] Start Command: `python manage.py migrate --no-input && gunicorn zenith_crm.wsgi:application --bind 0.0.0.0:$PORT`
- [ ] Database linked to backend
- [ ] `ALLOWED_HOSTS` environment variable set
- [ ] `CORS_ALLOWED_ORIGINS` environment variable set
- [ ] `DEBUG` = `False`
- [ ] `SECRET_KEY` set
- [ ] `USE_SQLITE` = `False`
- [ ] Service deployed and running

### Frontend Configuration:
- [ ] Service Type: Static Site (or Web Service)
- [ ] Root Directory: `.` (for Static Site) or `frontend` (for Web Service)
- [ ] Build Command: `cd frontend && npm install && npm run build`
- [ ] Publish Directory: `frontend/dist` (for Static Site)
- [ ] Start Command: `npm start` (for Web Service, if using server.js)
- [ ] `VITE_API_BASE_URL` environment variable set
- [ ] Service deployed and running

### Verification:
- [ ] Backend root URL works: `https://crm-11o1.onrender.com/`
- [ ] Backend API works: `https://crm-11o1.onrender.com/api/`
- [ ] Backend admin works: `https://crm-11o1.onrender.com/admin/`
- [ ] Frontend loads: `https://your-frontend-url.onrender.com`
- [ ] Frontend routes work (no "Not Found")
- [ ] Frontend can connect to backend (no CORS errors)
- [ ] Login works on frontend
- [ ] Admin user created and can login

---

## Support

If you encounter issues not covered here:

1. **Check Service Logs**: Render Dashboard → Service → Logs tab
2. **Check Build Logs**: Render Dashboard → Service → Events tab
3. **Verify Environment Variables**: All required variables are set correctly
4. **Test Backend Directly**: Use browser or curl to test API endpoints
5. **Check Browser Console**: F12 → Console tab for frontend errors

---

## Important URLs

After deployment, save these URLs:

- **Backend API**: `https://crm-11o1.onrender.com/api/`
- **Backend Admin**: `https://crm-11o1.onrender.com/admin/`
- **Frontend**: `https://your-frontend-url.onrender.com`

---

**Last Updated**: November 2024
**Version**: 1.0

