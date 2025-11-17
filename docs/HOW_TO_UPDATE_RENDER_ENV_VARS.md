# How to Update Environment Variables on Render

## Step-by-Step Guide

### Part 1: Update Backend Environment Variables

#### Step 1: Access Render Dashboard
1. Go to **https://dashboard.render.com**
2. Log in with your Render account
3. You'll see your **Dashboard** with all your services

#### Step 2: Find Your Backend Service
1. Look for a service named something like:
   - `crm-11o1` (or similar)
   - `zenith-crm-backend`
   - Or any service that shows **"Web Service"** type
2. **Click on the Backend Service name** to open it

#### Step 3: Navigate to Environment Tab
1. You'll see several tabs at the top:
   - **Logs** | **Metrics** | **Events** | **Settings** | **Environment**
2. **Click on the "Environment" tab**
3. You'll see a list of existing environment variables (if any)

#### Step 4: Add/Update Environment Variables

**Option A: If variable doesn't exist (Add New)**
1. Scroll down to the **"Environment Variables"** section
2. Click the **"Add Environment Variable"** button (or **"Add"** button)
3. A form will appear with two fields:
   - **Key**: Enter the variable name (e.g., `ALLOWED_HOSTS`)
   - **Value**: Enter the variable value (e.g., `crm-11o1.onrender.com,localhost,127.0.0.1`)
4. Click **"Save Changes"** or **"Add"**

**Option B: If variable already exists (Update)**
1. Find the variable in the list (e.g., `ALLOWED_HOSTS`)
2. Click the **pencil/edit icon** next to it
3. Update the **Value** field
4. Click **"Save Changes"**

#### Step 5: Add These Backend Variables

Add/Update these one by one:

**Variable 1:**
- **Key**: `ALLOWED_HOSTS`
- **Value**: `crm-11o1.onrender.com,localhost,127.0.0.1`

**Variable 2:**
- **Key**: `CORS_ALLOWED_ORIGINS`
- **Value**: `https://your-frontend-url.onrender.com,http://localhost:5173,http://localhost:3000`
  - ⚠️ **IMPORTANT**: Replace `your-frontend-url.onrender.com` with your actual frontend URL
  - To find your frontend URL: Go to your Frontend Service → Settings tab → Look for "URL" or "Service URL"

**Variable 3:**
- **Key**: `DEBUG`
- **Value**: `False`

**Variable 4 (if not already set):**
- **Key**: `SECRET_KEY`
- **Value**: Generate a strong secret key (you can use: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`)

#### Step 6: Save and Deploy
1. After adding all variables, scroll down
2. Click **"Save Changes"** (if there's a save button)
3. Go to the **"Manual Deploy"** section (or **"Events"** tab)
4. Click **"Deploy latest commit"** to redeploy with new environment variables

---

### Part 2: Update Frontend Environment Variables

#### Step 1: Find Your Frontend Service
1. Go back to Render Dashboard (click **"Dashboard"** in top navigation)
2. Look for a service named something like:
   - `zenith-crm-frontend`
   - Or any service that shows **"Static Site"** type
3. **Click on the Frontend Service name** to open it

#### Step 2: Navigate to Environment Tab
1. Click on the **"Environment"** tab
2. You'll see the environment variables section

#### Step 3: Add Frontend Variable
1. Click **"Add Environment Variable"** button
2. Enter:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://crm-11o1.onrender.com/api`
3. Click **"Save Changes"** or **"Add"**

#### Step 4: Save and Deploy
1. Go to **"Manual Deploy"** section
2. Click **"Deploy latest commit"** to rebuild frontend with new environment variable

---

## Visual Guide (What You'll See)

### Backend Service Page:
```
┌─────────────────────────────────────────┐
│  Backend Service Name                   │
│  ┌───────────────────────────────────┐ │
│  │ [Logs] [Metrics] [Events]         │ │
│  │ [Settings] [Environment] ← Click  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Environment Variables:                 │
│  ┌───────────────────────────────────┐ │
│  │ Key              Value             │ │
│  │ DATABASE_URL     (auto-set)        │ │
│  │                                  │ │
│  │ [+ Add Environment Variable]      │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Adding a Variable:
```
┌─────────────────────────────────────────┐
│  Add Environment Variable               │
│                                         │
│  Key:  [ALLOWED_HOSTS          ]       │
│  Value: [crm-11o1.onrender.com...]     │
│                                         │
│  [Cancel]  [Save Changes]                │
└─────────────────────────────────────────┘
```

---

## Quick Checklist

### Backend Service:
- [ ] Found backend service on Render dashboard
- [ ] Clicked on "Environment" tab
- [ ] Added `ALLOWED_HOSTS` = `crm-11o1.onrender.com,localhost,127.0.0.1`
- [ ] Added `CORS_ALLOWED_ORIGINS` = `https://your-frontend-url.onrender.com,http://localhost:5173,http://localhost:3000`
  - [ ] Replaced `your-frontend-url.onrender.com` with actual frontend URL
- [ ] Set `DEBUG` = `False`
- [ ] Saved changes
- [ ] Triggered manual deploy

### Frontend Service:
- [ ] Found frontend service on Render dashboard
- [ ] Clicked on "Environment" tab
- [ ] Added `VITE_API_BASE_URL` = `https://crm-11o1.onrender.com/api`
- [ ] Saved changes
- [ ] Triggered manual deploy

---

## How to Find Your Frontend URL

If you don't know your frontend URL:

1. Go to Render Dashboard
2. Click on your **Frontend Service**
3. Go to **"Settings"** tab
4. Look for:
   - **"Service URL"** or
   - **"URL"** or
   - **"Custom Domain"**
5. Copy that URL (it will be something like `https://zenith-crm-frontend.onrender.com`)

**Then use that URL in `CORS_ALLOWED_ORIGINS`:**
```
CORS_ALLOWED_ORIGINS=https://zenith-crm-frontend.onrender.com,http://localhost:5173,http://localhost:3000
```

---

## Troubleshooting

### Can't find "Environment" tab?
- Make sure you're logged into Render
- Make sure you're viewing the correct service (Web Service, not Database)
- Try refreshing the page

### Variables not saving?
- Make sure you click "Save Changes" after adding each variable
- Check if there's a "Save" button at the bottom of the page
- Some variables might need the service to be redeployed to take effect

### Don't see "Add Environment Variable" button?
- Scroll down on the Environment tab
- The button might be at the bottom of the existing variables list
- Try refreshing the page

### Service not deploying?
- Check the "Events" or "Logs" tab for error messages
- Make sure your GitHub repository is connected
- Verify the latest code is pushed to GitHub

---

## After Updating Variables

1. **Wait for deployment to complete** (check "Events" tab)
2. **Test Backend**: Visit `https://crm-11o1.onrender.com/api/` - should show JSON
3. **Test Frontend**: Visit your frontend URL - should load (not blank)
4. **Check Browser Console**: Open DevTools (F12) → Console tab → Should see no CORS errors

---

## Need Help?

If you're still having trouble:
1. Take a screenshot of your Render dashboard
2. Check the "Logs" tab for any error messages
3. Verify all environment variables are spelled correctly
4. Make sure there are no extra spaces in variable values

