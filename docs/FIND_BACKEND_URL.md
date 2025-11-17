# 🔍 How to Find Your Backend URL on Render

## Your Backend URL
Based on your deployment: **`https://crm-11o1.onrender.com`**

---

## 📍 Where to Find Backend URL in Render Dashboard

### Method 1: From Backend Service Page
1. **Go to**: Render Dashboard → https://dashboard.render.com
2. **Click** on your **Backend Service** (e.g., "zenith-crm-backend" or "crm-11o1")
3. **Look at the top** of the service page
4. **You'll see**: 
   ```
   https://crm-11o1.onrender.com
   ```
   This is your backend URL!

### Method 2: From Settings Tab
1. **Go to**: Backend Service → **"Settings"** tab
2. **Scroll down** to **"Service Details"** section
3. **Find**: **"URL"** or **"Service URL"**
4. **Copy** the URL shown

### Method 3: From Service List
1. **Go to**: Render Dashboard main page
2. **Find** your backend service in the list
3. **Click** the URL link next to the service name
4. **Copy** from browser address bar

---

## ✅ Use This URL for Frontend Environment Variable

### For Your Frontend Service:

1. **Go to**: Frontend Service → **"Environment"** tab
2. **Add Environment Variable:**
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://crm-11o1.onrender.com/api`
   
   ⚠️ **Important**: Add `/api` at the end!

3. **Save Changes**

---

## 🔗 Complete URLs Reference

Based on your backend URL `https://crm-11o1.onrender.com`:

- **Backend API Root**: `https://crm-11o1.onrender.com/api`
- **Backend Admin**: `https://crm-11o1.onrender.com/admin/`
- **Backend Root**: `https://crm-11o1.onrender.com/`

### Frontend Environment Variable:
```
VITE_API_BASE_URL=https://crm-11o1.onrender.com/api
```

---

## ✅ Quick Checklist

- [ ] Backend URL found: `https://crm-11o1.onrender.com`
- [ ] Frontend environment variable set: `VITE_API_BASE_URL=https://crm-11o1.onrender.com/api`
- [ ] Backend CORS updated: `CORS_ALLOWED_ORIGINS=https://your-frontend-url.onrender.com`
- [ ] Both services redeployed after changes

---

**Note**: If your backend URL is different, replace `crm-11o1.onrender.com` with your actual backend service URL.

