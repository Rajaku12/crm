# 🚨 URGENT: Fix Frontend Build Error on Render

## The Problem
Your frontend build is failing with:
```
==> Empty build command; skipping build
==> Publish directory dist does not exist!
```

## ✅ THE FIX - Do This Now:

### In Render Dashboard:

1. **Go to**: Your Frontend Service → **"Settings"** tab

2. **Update Build & Deploy Section:**

   **Root Directory:**
   ```
   (leave EMPTY - blank field)
   ```
   OR
   ```
   .
   ```

   **Build Command:**
   ```
   cd frontend && npm install && npm run build
   ```

   **Publish Directory:**
   ```
   frontend/dist
   ```

3. **Go to Environment Section:**

   **Add/Update Environment Variable:**
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://your-backend-url.onrender.com/api`
   - ⚠️ Replace `your-backend-url` with your actual backend URL

   **Optional - Set Node Version:**
   - **Key**: `NODE_VERSION`
   - **Value**: `18`

4. **Save Changes**

5. **Manual Deploy:**
   - Go to **"Manual Deploy"** tab
   - Click **"Deploy latest commit"**

6. **Wait 5-10 minutes** for build to complete

---

## ✅ Verification

After deployment, check:
- ✅ Build logs show "npm install" running
- ✅ Build logs show "vite build" running
- ✅ No errors in logs
- ✅ Service status is "Live"
- ✅ Frontend URL loads

---

## 📋 Exact Settings Copy-Paste

**Root Directory:** (empty)

**Build Command:**
```
cd frontend && npm install && npm run build
```

**Publish Directory:**
```
frontend/dist
```

**Environment Variable:**
```
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
```

---

**That's it!** After updating these settings and redeploying, your frontend should build successfully.

