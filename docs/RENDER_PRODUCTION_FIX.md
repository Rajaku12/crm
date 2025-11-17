# Render Production Fix Guide

## Issues Fixed

### 1. ✅ API Root Endpoint (`/api/` showing "not found")
**Problem**: Accessing `https://crm-11o1.onrender.com/api/` showed "not found"

**Solution**: Added API root view that shows all available endpoints

**What was changed**:
- Added `api_root` function in `backend/api/urls.py`
- Now `/api/` returns a JSON response with all available endpoints

**Test**: Visit `https://crm-11o1.onrender.com/api/` - you should see a JSON response with endpoint information

---

### 2. ✅ Frontend Blank Page
**Problem**: Frontend shows blank page after deployment

**Causes**:
- CORS not configured for production frontend URL
- `VITE_API_BASE_URL` not set correctly
- Frontend can't connect to backend API

---

## Step-by-Step Fix Instructions

### Step 1: Update Backend Environment Variables on Render

1. Go to your **Backend Service** on Render Dashboard
2. Navigate to **Environment** tab
3. Add/Update these environment variables:

```bash
# Backend URL (your actual backend URL)
ALLOWED_HOSTS=crm-11o1.onrender.com,localhost,127.0.0.1

# CORS - Add your frontend URL here
# Replace 'your-frontend-url.onrender.com' with your actual frontend URL
CORS_ALLOWED_ORIGINS=https://your-frontend-url.onrender.com,http://localhost:5173,http://localhost:3000

# Database (should already be set by Render)
DATABASE_URL=<auto-set-by-render>

# Security
SECRET_KEY=<your-secret-key>
DEBUG=False
```

**Important**: 
- Replace `your-frontend-url.onrender.com` with your actual frontend service URL from Render
- If you don't know your frontend URL, check your Frontend Service settings on Render

---

### Step 2: Update Frontend Environment Variables on Render

1. Go to your **Frontend Service** on Render Dashboard
2. Navigate to **Environment** tab
3. Add this environment variable:

```bash
VITE_API_BASE_URL=https://crm-11o1.onrender.com/api
```

**Important**: 
- Make sure there's NO trailing slash after `/api`
- The URL should be exactly: `https://crm-11o1.onrender.com/api`

---

### Step 3: Verify Backend is Working

1. **Test Root Endpoint**:
   ```
   https://crm-11o1.onrender.com/
   ```
   Should return: `{"message": "Zenith Estate CRM API", ...}`

2. **Test API Root**:
   ```
   https://crm-11o1.onrender.com/api/
   ```
   Should return: JSON with all available endpoints

3. **Test Authentication Endpoint**:
   ```
   https://crm-11o1.onrender.com/api/auth/token/
   ```
   Should return: `{"detail": "Authentication credentials were not provided."}` (this is expected for GET request)

---

### Step 4: Redeploy Services

After updating environment variables:

1. **Backend**: 
   - Go to Backend Service → **Manual Deploy** → **Deploy latest commit**
   - Or wait for auto-deploy if you pushed code

2. **Frontend**:
   - Go to Frontend Service → **Manual Deploy** → **Deploy latest commit**
   - Or wait for auto-deploy if you pushed code

---

### Step 5: Verify Frontend is Working

1. Open your frontend URL in browser
2. Open browser Developer Tools (F12)
3. Check **Console** tab for errors
4. Check **Network** tab:
   - Look for requests to `https://crm-11o1.onrender.com/api/`
   - Check if they return 200 OK or show CORS errors

---

## Common Issues & Solutions

### Issue: CORS Error in Browser Console
**Error**: `Access to fetch at 'https://crm-11o1.onrender.com/api/...' from origin 'https://your-frontend.onrender.com' has been blocked by CORS policy`

**Solution**:
1. Make sure `CORS_ALLOWED_ORIGINS` in backend includes your frontend URL
2. Format: `https://your-frontend-url.onrender.com` (no trailing slash)
3. Redeploy backend after updating

---

### Issue: Frontend Still Shows Blank Page
**Possible Causes**:
1. `VITE_API_BASE_URL` not set correctly
2. Frontend build failed
3. JavaScript errors in console

**Solution**:
1. Check Frontend Service logs on Render
2. Check browser console for errors
3. Verify `VITE_API_BASE_URL` is set correctly
4. Rebuild frontend: Frontend Service → **Manual Deploy**

---

### Issue: API Returns 404
**Error**: `GET https://crm-11o1.onrender.com/api/ 404 Not Found`

**Solution**:
1. Make sure you've pushed the latest code (with API root fix)
2. Check backend logs on Render
3. Verify backend is running: Check Backend Service status

---

### Issue: API Returns 500 Internal Server Error
**Solution**:
1. Check Backend Service logs on Render
2. Check database connection
3. Verify all environment variables are set
4. Check if migrations ran: Backend logs should show migration status

---

## Quick Checklist

- [ ] Backend `ALLOWED_HOSTS` includes `crm-11o1.onrender.com`
- [ ] Backend `CORS_ALLOWED_ORIGINS` includes frontend URL
- [ ] Frontend `VITE_API_BASE_URL` is set to `https://crm-11o1.onrender.com/api`
- [ ] Both services redeployed after environment variable changes
- [ ] Backend `/api/` endpoint returns JSON (not 404)
- [ ] Frontend loads without blank page
- [ ] Browser console shows no CORS errors
- [ ] Network tab shows successful API calls

---

## Testing URLs

### Backend URLs:
- Root: `https://crm-11o1.onrender.com/`
- API Root: `https://crm-11o1.onrender.com/api/`
- Admin: `https://crm-11o1.onrender.com/admin/`
- Login: `https://crm-11o1.onrender.com/api/auth/token/` (POST)

### Frontend URL:
- Your frontend service URL from Render dashboard

---

## Next Steps After Fix

1. **Create Admin User** (if not done):
   ```bash
   # On Render, use Shell or run this in build command temporarily
   python manage.py createsuperuser
   ```

2. **Test Login**:
   - Open frontend
   - Try to login with admin credentials
   - Check if API calls work

3. **Monitor Logs**:
   - Check both backend and frontend logs on Render
   - Look for any errors or warnings

---

## Support

If issues persist:
1. Check Render service logs
2. Check browser console for errors
3. Verify all environment variables are correct
4. Ensure latest code is deployed

