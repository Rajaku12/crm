# Frontend "Not Found" Error Fix Guide

## Problem
When accessing your frontend URL on Render, you see "Not Found" error instead of the application loading.

## Root Cause
This is a common issue with Single Page Applications (SPAs) deployed as static sites. When you navigate to routes like `/dashboard` or `/leads`, the server tries to find a file at that path, but since it's a SPA, all routes should serve `index.html`.

## Solution

### Step 1: Verify Build Output
1. Check if `frontend/dist` folder exists after build
2. Verify `frontend/dist/index.html` exists
3. Check Render build logs for any errors

### Step 2: Configure Render Static Site Settings

#### Option A: Using Render Dashboard (Recommended)

1. Go to your **Frontend Service** on Render Dashboard
2. Click on **"Settings"** tab
3. Look for **"Redirects/Rewrites"** or **"Custom Headers"** section
4. Add this redirect rule:
   ```
   Source: /*
   Destination: /index.html
   Status Code: 200
   ```

#### Option B: Using `_redirects` File (If Render supports it)

The `_redirects` file has been created in `frontend/public/_redirects`:
```
/*    /index.html   200
```

This file will be copied to `frontend/dist/_redirects` during build.

### Step 3: Verify Frontend Build Configuration

Check your Render Frontend Service settings:

1. **Root Directory**: Should be `.` (project root) or empty
2. **Build Command**: `cd frontend && npm install && npm run build`
3. **Publish Directory**: `frontend/dist`
4. **Environment Variable**: 
   - Key: `VITE_API_BASE_URL`
   - Value: `https://crm-11o1.onrender.com/api`

### Step 4: Rebuild and Redeploy

1. **Trigger Manual Deploy**:
   - Go to Frontend Service → **"Manual Deploy"** → **"Deploy latest commit"**
   - Or push a new commit to trigger auto-deploy

2. **Check Build Logs**:
   - Go to **"Logs"** tab during deployment
   - Verify build completes successfully
   - Check for any errors

3. **Verify Build Output**:
   - After build, check if `frontend/dist` contains:
     - `index.html`
     - `js/` folder with JavaScript files
     - `assets/` folder (if any)
     - `_redirects` file (if supported)

### Step 5: Test the Fix

1. **Test Root URL**:
   - Visit: `https://your-frontend-url.onrender.com/`
   - Should load the application

2. **Test Direct Route** (if you have routing):
   - Visit: `https://your-frontend-url.onrender.com/dashboard`
   - Should load the application (not 404)

3. **Check Browser Console**:
   - Open DevTools (F12) → Console tab
   - Should see no 404 errors
   - Check Network tab for successful API calls

---

## Alternative Solutions

### Solution 1: Use 404.html Fallback

A `404.html` file has been created that redirects to `index.html`. Some static hosts use this automatically.

### Solution 2: Configure Render Headers

If Render supports custom headers, add:
```
X-Rewrite-URL: /index.html
```

### Solution 3: Use Server-Side Rendering (SSR)

If the above doesn't work, consider:
- Deploying frontend as a Node.js service instead of static site
- Using a different hosting provider that better supports SPAs (Netlify, Vercel)

---

## Troubleshooting

### Issue: Build Fails
**Check**:
- Node.js version compatibility
- `package.json` dependencies
- Build logs for specific errors

**Fix**:
- Update Node.js version in Render settings
- Clear `node_modules` and reinstall
- Check for missing dependencies

### Issue: Files Not Found After Build
**Check**:
- `frontend/dist` folder structure
- `index.html` exists in dist
- JavaScript files in `js/` folder

**Fix**:
- Verify build command runs successfully
- Check `vite.config.ts` build configuration
- Ensure `public` folder files are copied

### Issue: Still Getting 404
**Check**:
- Render static site configuration
- Redirect rules are set correctly
- `_redirects` file is in dist folder

**Fix**:
- Manually configure redirects in Render dashboard
- Verify `_redirects` file is copied during build
- Contact Render support if redirects don't work

### Issue: Blank Page (Not 404)
**Check**:
- Browser console for JavaScript errors
- Network tab for failed API calls
- `VITE_API_BASE_URL` is set correctly

**Fix**:
- Check CORS configuration on backend
- Verify API URL is correct
- Check browser console for specific errors

---

## Quick Checklist

- [ ] Frontend service is set as "Static Site" type
- [ ] Build command: `cd frontend && npm install && npm run build`
- [ ] Publish directory: `frontend/dist`
- [ ] `VITE_API_BASE_URL` environment variable is set
- [ ] Redirect rule configured (/* → /index.html with 200 status)
- [ ] Build completes successfully
- [ ] `frontend/dist/index.html` exists after build
- [ ] Root URL loads the application
- [ ] Direct routes work (no 404)

---

## Render Static Site Configuration

### Required Settings:

```
Service Type: Static Site
Root Directory: . (or empty)
Build Command: cd frontend && npm install && npm run build
Publish Directory: frontend/dist
```

### Environment Variables:

```
VITE_API_BASE_URL=https://crm-11o1.onrender.com/api
```

### Redirect Configuration:

If Render dashboard has redirect settings:
- Pattern: `/*`
- Destination: `/index.html`
- Status: `200` (not 301/302)

---

## Next Steps

1. **Update Render Settings**: Configure redirects in dashboard
2. **Redeploy**: Trigger manual deploy
3. **Test**: Verify root URL and routes work
4. **Monitor**: Check logs for any errors

If issues persist, check Render documentation for static site SPA routing support or contact Render support.

