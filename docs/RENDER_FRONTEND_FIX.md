# 🔧 Frontend Build Fix for Render

## Issue
```
==> Empty build command; skipping build
==> Publish directory dist does not exist!
==> Build failed 😞
```

## ✅ Solution

The frontend build command is not being recognized. Here's how to fix it:

### Option 1: Fix in Render Dashboard (Recommended)

1. **Go to**: Your Frontend Service → **"Settings"** tab
2. **Update these settings:**

#### Build & Deploy Settings:
- **Root Directory**: Leave **empty** or set to `.` (project root)
- **Build Command**: 
  ```bash
  cd frontend && npm install && npm run build
  ```
- **Publish Directory**: 
  ```
  frontend/dist
  ```

#### Environment:
- **Node Version**: `18` or `20` (latest LTS)
- **Environment Variables**:
  - `VITE_API_BASE_URL` = `https://your-backend-url.onrender.com/api`

3. **Save Changes**
4. **Manual Deploy**: Click "Manual Deploy" → "Deploy latest commit"

### Option 2: Use Root Directory = `frontend`

If Option 1 doesn't work:

1. **Go to**: Frontend Service → **"Settings"**
2. **Update:**
   - **Root Directory**: `frontend`
   - **Build Command**: 
     ```bash
     npm install && npm run build
     ```
   - **Publish Directory**: 
     ```
     dist
     ```

3. **Save and Deploy**

### Option 3: Verify Build Locally First

**Test the build locally:**

```bash
cd frontend
npm install
npm run build
ls dist  # Should show built files
```

If this works locally, the issue is with Render configuration.

---

## Common Issues & Fixes

### Issue: "npm: command not found"
**Fix**: Set Node version in Render settings:
- Go to Settings → Environment
- Set Node version: `18` or `20`

### Issue: "Cannot find module"
**Fix**: 
- Make sure `package.json` is in the `frontend/` directory
- Verify all dependencies are listed
- Check that `node_modules` is NOT in `.gitignore` (it shouldn't be)

### Issue: "Build succeeds but dist folder not found"
**Fix**:
- Check `Publish Directory` matches actual output
- Vite outputs to `dist/` by default
- Verify: `frontend/dist` or just `dist` depending on root directory

### Issue: "Environment variable not working"
**Fix**:
- Vite requires `VITE_` prefix for environment variables
- Variable name: `VITE_API_BASE_URL` (not `API_BASE_URL`)
- Rebuild after adding environment variables

---

## Correct Render Settings Summary

### Frontend Static Site Settings:

```
Name: zenith-crm-frontend
Type: Static Site
Repository: Rajaku12/crm
Branch: main
Root Directory: (empty or .)
Build Command: cd frontend && npm install && npm run build
Publish Directory: frontend/dist
Node Version: 18 or 20
Environment Variables:
  - VITE_API_BASE_URL = https://your-backend-url.onrender.com/api
```

---

## Verification Steps

After fixing:

1. **Check Build Logs**: Frontend Service → "Logs" tab
2. **Look for**: 
   - ✅ "npm install" output
   - ✅ "vite build" output
   - ✅ "dist" folder creation
3. **Verify**: Build completes without errors
4. **Check**: Publish directory exists after build

---

## Still Having Issues?

1. **Check Logs**: Look for specific error messages
2. **Verify Files**: Make sure `frontend/package.json` exists
3. **Test Locally**: Run `npm run build` in `frontend/` directory
4. **Contact Support**: Render support if issue persists

---

**Last Updated**: 2024

