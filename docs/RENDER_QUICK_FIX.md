# ⚡ Quick Fix - Frontend Build Error on Render

## 🔴 Error You're Seeing
```
==> Empty build command; skipping build
==> Publish directory dist does not exist!
==> Build failed 😞
```

## ✅ Solution - Update Render Settings

### Step 1: Go to Your Frontend Service
1. Open Render Dashboard: https://dashboard.render.com
2. Click on your **Frontend Service** (zenith-crm-frontend)

### Step 2: Update Settings
1. Click **"Settings"** tab
2. Scroll to **"Build & Deploy"** section

### Step 3: Update These Fields

**Option A (Recommended - Project Root):**
```
Root Directory: (leave empty or put .)
Build Command: cd frontend && npm install && npm run build
Publish Directory: frontend/dist
```

**Option B (Alternative - Frontend Root):**
```
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
```

### Step 4: Set Node Version
1. Scroll to **"Environment"** section
2. Add or update:
   - **Key**: `NODE_VERSION`
   - **Value**: `18` or `20`

### Step 5: Add Environment Variable
1. In **"Environment"** section, click **"Add Environment Variable"**
2. Add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://your-backend-url.onrender.com/api`
   - ⚠️ Replace `your-backend-url` with your actual backend URL

### Step 6: Save and Deploy
1. Click **"Save Changes"** at the bottom
2. Go to **"Manual Deploy"** tab
3. Click **"Deploy latest commit"**
4. Wait for build to complete (5-10 minutes)

## ✅ Verification

After deployment, check:
- ✅ Build logs show "npm install" and "vite build"
- ✅ No errors in build logs
- ✅ Service shows "Live" status
- ✅ Frontend URL loads correctly

## 🆘 Still Not Working?

### Check Build Logs
1. Go to **"Logs"** tab
2. Look for error messages
3. Common issues:
   - **"npm: command not found"** → Set NODE_VERSION
   - **"Cannot find module"** → Check package.json exists
   - **"dist not found"** → Check Publish Directory path

### Verify Locally
Test build locally to ensure it works:
```bash
cd frontend
npm install
npm run build
ls dist  # Should show index.html and assets
```

If local build works, issue is Render configuration.

---

**Quick Reference:**
- Repository: https://github.com/Rajaku12/crm
- Build Command: `cd frontend && npm install && npm run build`
- Publish Directory: `frontend/dist` (if root is `.`) or `dist` (if root is `frontend`)

