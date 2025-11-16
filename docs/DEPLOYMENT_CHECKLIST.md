# ✅ Production Deployment Checklist

Use this checklist to ensure everything is ready for production deployment on Render.

---

## 📋 Pre-Deployment Checklist

### Code Quality
- [x] ✅ All bugs fixed
- [x] ✅ All tests passing
- [x] ✅ Code reviewed
- [x] ✅ No console errors
- [x] ✅ Build successful

### Repository
- [ ] Code pushed to GitHub
- [ ] All files committed
- [ ] `.gitignore` configured (excludes .env, db.sqlite3, node_modules)
- [ ] No sensitive data in code

### Configuration Files
- [x] ✅ `backend/requirements.txt` - All dependencies listed
- [x] ✅ `backend/build.sh` - Build script ready
- [x] ✅ `backend/runtime.txt` - Python version specified
- [x] ✅ `backend/render.yaml` - Blueprint config (optional)
- [x] ✅ `frontend/package.json` - Dependencies listed
- [x] ✅ `frontend/vite.config.ts` - Production optimized

---

## 🚀 Deployment Steps

### Step 1: Render Account
- [ ] Render account created
- [ ] GitHub connected
- [ ] Repository access granted

### Step 2: Database
- [ ] PostgreSQL database created
- [ ] Database credentials saved securely
- [ ] `DATABASE_URL` copied

### Step 3: Backend Service
- [ ] Web service created
- [ ] Repository connected
- [ ] Root directory: `backend`
- [ ] Build command configured
- [ ] Start command configured
- [ ] Environment variables set (see below)

### Step 4: Frontend Service
- [ ] Static site created
- [ ] Repository connected
- [ ] Root directory: `frontend`
- [ ] Build command configured
- [ ] Publish directory: `dist`
- [ ] Environment variables set

### Step 5: Environment Variables

#### Backend Variables
- [ ] `DJANGO_SETTINGS_MODULE=zenith_crm.settings`
- [ ] `SECRET_KEY=<strong-random-key>`
- [ ] `DEBUG=False`
- [ ] `ALLOWED_HOSTS=<your-backend-url>`
- [ ] `USE_SQLITE=False`
- [ ] `DATABASE_URL=<from-render-database>`
- [ ] `CORS_ALLOWED_ORIGINS=<your-frontend-url>`
- [ ] `PYTHON_VERSION=3.11.0`

#### Frontend Variables
- [ ] `VITE_API_BASE_URL=<your-backend-url>/api`

### Step 6: Database Setup
- [ ] Migrations run successfully
- [ ] Admin user created
- [ ] Test data added (optional)

### Step 7: Verification
- [ ] Backend accessible
- [ ] Frontend accessible
- [ ] Login works
- [ ] All features tested
- [ ] No errors in logs

---

## 🔐 Security Checklist

- [ ] `DEBUG=False` in production
- [ ] Strong `SECRET_KEY` (50+ characters)
- [ ] `ALLOWED_HOSTS` configured
- [ ] HTTPS enabled (automatic on Render)
- [ ] CORS configured correctly
- [ ] Admin password is strong
- [ ] No sensitive data in environment variables
- [ ] Database credentials secure

---

## 📊 Testing Checklist

### Authentication
- [ ] Login works
- [ ] Logout works
- [ ] Token refresh works
- [ ] Protected routes require auth

### Core Features
- [ ] Dashboard loads
- [ ] Leads management works
- [ ] Properties management works
- [ ] Payments feature works
- [ ] Reports generate correctly
- [ ] Settings accessible

### Performance
- [ ] Page load < 3 seconds
- [ ] API responses < 1 second
- [ ] No console errors
- [ ] Images load correctly

---

## 🎯 Post-Deployment

- [ ] Monitor logs for errors
- [ ] Set up monitoring (optional)
- [ ] Configure backups
- [ ] Share URLs with team
- [ ] Document admin credentials securely
- [ ] Test all critical workflows

---

**Status**: Ready for deployment ✅

