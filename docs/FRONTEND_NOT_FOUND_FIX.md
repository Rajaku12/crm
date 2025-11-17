# Frontend "Not Found" Error Fix Guide

## Problem
Frontend shows "Not Found" error when:
- Accessing the frontend URL directly
- Refreshing the page
- Navigating to routes like `/dashboard`, `/leads`, etc.

This happens because React is a Single Page Application (SPA) and all routes should be handled by `index.html`.

---

## Solution 1: Configure Render Static Site for SPA Routing

### Step 1: Verify Frontend Service Type
1. Go to Render Dashboard → Your Frontend Service
2. Check the **Settings** tab
3. Make sure **Service Type** is set to **"Static Site"** (not "Web Service")

### Step 2: Verify Build Configuration
In your Frontend Service settings, verify:

**Root Directory**: `.` (project root) or leave empty

**Build Command**: 
```bash
cd frontend && npm install && npm run build
```

**Publish Directory**: 
```
frontend/dist
```

### Step 3: Add Environment Variable
1. Go to **Environment** tab
2. Add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://crm-11o1.onrender.com/api`

### Step 4: Redeploy
1. Go to **Manual Deploy** section
2. Click **"Deploy latest commit"**
3. Wait for build to complete

---

## Solution 2: Use Custom Headers (If Solution 1 Doesn't Work)

If Render doesn't automatically handle SPA routing, we need to configure custom headers.

### Option A: Configure in Render Dashboard

1. Go to Frontend Service → **Settings** tab
2. Look for **"Headers"** or **"Custom Headers"** section
3. Add these headers:
   ```
   X-Content-Type-Options: nosniff
   X-Frame-Options: DENY
   ```

   **Note**: Render might not have a direct headers configuration. If not available, use Option B.

### Option B: Create a Simple Server (Alternative)

If Render doesn't support SPA routing automatically, we can create a simple Node.js server:

1. Create `frontend/server.js`:
```javascript
const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React routing - return all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
```

2. Update `frontend/package.json`:
```json
{
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

3. Change Frontend Service Type to **"Web Service"** instead of "Static Site"

4. Update Build Command:
```bash
cd frontend && npm install && npm run build
```

5. Update Start Command:
```bash
cd frontend && npm start
```

---

## Solution 3: Verify Build Output

### Check if `index.html` exists in build output:

1. After build completes, check the build logs
2. Verify that `frontend/dist/index.html` exists
3. Check that all JavaScript files are in `frontend/dist/js/`

### If build fails:

1. Check build logs on Render
2. Common issues:
   - Missing dependencies
   - Build command errors
   - Environment variables not set

---

## Solution 4: Quick Fix - Update Render Service Settings

### If using Static Site:

1. **Root Directory**: `.` (empty or project root)
2. **Build Command**: `cd frontend && npm install && npm run build`
3. **Publish Directory**: `frontend/dist`
4. **Environment Variables**:
   - `VITE_API_BASE_URL` = `https://crm-11o1.onrender.com/api`

### If using Web Service:

1. **Root Directory**: `frontend`
2. **Build Command**: `npm install && npm run build`
3. **Start Command**: `npm start` (if using server.js) or `npx serve -s dist -l 3000`
4. **Environment Variables**:
   - `VITE_API_BASE_URL` = `https://crm-11o1.onrender.com/api`
   - `PORT` = `3000` (or leave empty, Render will set it)

---

## Testing After Fix

1. **Test Root URL**: Visit your frontend URL
   - Should load the login page or dashboard (not "Not Found")

2. **Test Direct Route**: Visit `your-frontend-url.onrender.com/dashboard`
   - Should load the dashboard (not "Not Found")

3. **Test Refresh**: 
   - Navigate to a route
   - Refresh the page (F5)
   - Should still load the page (not "Not Found")

4. **Check Browser Console**:
   - Open DevTools (F12)
   - Check Console tab for errors
   - Check Network tab - all requests should return 200 OK

---

## Common Issues

### Issue: Still showing "Not Found"
**Solution**: 
- Verify `frontend/dist/index.html` exists after build
- Check if Publish Directory is correct: `frontend/dist`
- Try Solution 2 (Custom Server)

### Issue: Build fails
**Solution**:
- Check build logs for errors
- Verify `package.json` has all dependencies
- Make sure Node.js version is compatible

### Issue: Blank page (not "Not Found")
**Solution**:
- Check browser console for JavaScript errors
- Verify `VITE_API_BASE_URL` is set correctly
- Check if API is accessible: `https://crm-11o1.onrender.com/api/`

### Issue: CORS errors
**Solution**:
- Update backend `CORS_ALLOWED_ORIGINS` to include frontend URL
- See `docs/RENDER_PRODUCTION_FIX.md` for CORS setup

---

## Recommended Solution

**For Render Static Sites**, try this order:

1. ✅ **First**: Verify service settings (Solution 1)
2. ✅ **Second**: Check build output (Solution 3)
3. ✅ **Third**: Use Custom Server (Solution 2 - Option B)

---

## Quick Checklist

- [ ] Frontend Service Type is "Static Site"
- [ ] Root Directory: `.` or empty
- [ ] Build Command: `cd frontend && npm install && npm run build`
- [ ] Publish Directory: `frontend/dist`
- [ ] Environment Variable `VITE_API_BASE_URL` is set
- [ ] Service redeployed after changes
- [ ] `frontend/dist/index.html` exists after build
- [ ] Tested root URL - loads correctly
- [ ] Tested direct route - loads correctly
- [ ] Tested page refresh - still works

---

## Need More Help?

If none of these solutions work:

1. Check Render service logs
2. Check build logs
3. Verify all files are committed and pushed to GitHub
4. Try creating a new static site service with correct settings from the start

