# Zenith Estate CRM - Project Structure & Setup Guide

## 📁 Project Structure

```
zenith-estate-crm/
├── backend/                    # Django REST Framework Backend
│   ├── api/                    # Main application
│   │   ├── models.py          # Database models
│   │   ├── views.py           # API views/endpoints
│   │   ├── serializers.py     # Data serialization
│   │   ├── urls.py            # URL routing
│   │   ├── permissions.py     # Access control
│   │   ├── services/          # Business logic services
│   │   │   ├── invoice_service.py
│   │   │   ├── payment_service.py
│   │   │   ├── commission_service.py
│   │   │   ├── chatbot_service.py
│   │   │   ├── telephony_service.py
│   │   │   ├── workflow_service.py
│   │   │   └── integrations/  # External integrations
│   │   └── tests/             # Backend tests
│   │       ├── test_models.py
│   │       ├── test_views.py
│   │       ├── test_smoke.py
│   │       ├── test_sanity.py
│   │       └── test_regression.py
│   ├── zenith_crm/            # Django project settings
│   │   ├── settings.py        # Configuration
│   │   ├── urls.py            # Root URLs
│   │   ├── wsgi.py            # WSGI config
│   │   └── asgi.py            # ASGI config
│   ├── manage.py              # Django management
│   ├── requirements.txt       # Python dependencies
│   ├── build.sh               # Build script for Render
│   ├── render.yaml            # Render blueprint
│   ├── conftest.py            # Pytest fixtures
│   └── pytest.ini             # Pytest configuration
│
├── frontend/                   # React + Vite Frontend
│   ├── components/            # React components
│   │   ├── Dashboard.tsx
│   │   ├── LeadsTable.tsx
│   │   ├── Payments.tsx
│   │   ├── Properties.tsx
│   │   ├── Reports.tsx
│   │   ├── Settings.tsx
│   │   ├── modals/           # Modal components
│   │   ├── ui/               # UI components
│   │   └── ...
│   ├── contexts/             # React Context providers
│   │   ├── AppContext.tsx
│   │   ├── AuthContext.tsx
│   │   └── ToastContext.tsx
│   ├── services/             # API services
│   │   ├── apiService.ts     # Main API client
│   │   ├── dashboardService.ts
│   │   └── ...
│   ├── types.ts              # TypeScript types
│   ├── utils.ts              # Utility functions
│   ├── App.tsx               # Main app component
│   ├── index.tsx             # Entry point
│   ├── package.json          # Node dependencies
│   ├── vite.config.ts        # Vite configuration
│   ├── vitest.config.ts      # Test configuration
│   └── tests/                # Frontend tests
│       ├── unit/
│       ├── smoke/
│       ├── sanity/
│       └── regression/
│
└── Documentation
    ├── PROJECT_STRUCTURE.md   # This file
    └── DEPLOYMENT_RENDER.md   # Deployment guide
```

---

## 🚀 Quick Start Guide

### Prerequisites

- **Python 3.11+** (Backend)
- **Node.js 18+** (Frontend)
- **MySQL/PostgreSQL** (Database)
- **Git** (Version control)

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd zenith-estate-crm
```

### Step 2: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env  # Or create manually
# Edit .env with your database credentials

# Run migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

Backend will run on: `http://127.0.0.1:8000`

### Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
# Add: VITE_API_BASE_URL=http://127.0.0.1:8000/api

# Start development server
npm run dev
```

Frontend will run on: `http://localhost:3000`

### Step 4: Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://127.0.0.1:8000/api/
- **Admin Panel**: http://127.0.0.1:8000/admin/

---

## 📋 Environment Variables

### Backend (.env)

```bash
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (MySQL)
USE_SQLITE=False
DB_NAME=zenith_crm
DB_USER=root
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=3306

# Or use SQLite for development
USE_SQLITE=True

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Frontend (.env)

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

---

## 🧪 Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
pytest api/tests/

# Run specific test types
pytest api/tests/test_smoke.py      # Smoke tests
pytest api/tests/test_sanity.py     # Sanity tests
pytest api/tests/test_regression.py # Regression tests

# Run with coverage
pytest --cov=api --cov-report=html
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm run test

# Run specific test types
npm run test:smoke        # Smoke tests
npm run test:sanity       # Sanity tests
npm run test:regression   # Regression tests

# Run with coverage
npm run test:coverage
```

---

## 🏗️ Build for Production

### Backend

```bash
cd backend

# Collect static files
python manage.py collectstatic --no-input

# Run migrations
python manage.py migrate --no-input

# Start with Gunicorn
gunicorn zenith_crm.wsgi:application
```

### Frontend

```bash
cd frontend

# Build for production
npm run build

# Preview production build
npm run preview
```

Built files will be in `frontend/dist/`

---

## 📦 Key Dependencies

### Backend (requirements.txt)

- **Django 4.2.7** - Web framework
- **Django REST Framework 3.14.0** - API framework
- **djangorestframework-simplejwt 5.3.0** - JWT authentication
- **mysqlclient 2.2.0** - MySQL connector
- **psycopg2-binary 2.9.9** - PostgreSQL connector
- **gunicorn 21.2.0** - WSGI server
- **whitenoise 6.6.0** - Static file serving
- **pytest 7.4.3** - Testing framework

### Frontend (package.json)

- **React 19.2.0** - UI library
- **Vite 6.2.0** - Build tool
- **recharts 3.4.1** - Charts library
- **@google/genai 1.29.1** - AI integration
- **vitest 2.1.0** - Testing framework
- **@testing-library/react 16.0.0** - Component testing

---

## 🔑 Key Features

### Backend Features

- ✅ **RESTful API** - Complete CRUD operations
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Role-Based Access Control** - Admin, Manager, Agent roles
- ✅ **Payment Management** - Booking payments, receipts, schedules
- ✅ **Invoice System** - Generate and manage invoices
- ✅ **Commission Tracking** - Calculate and track commissions
- ✅ **Chatbot Integration** - AI-powered chatbot
- ✅ **Call Logging** - Track and log calls
- ✅ **Workflow Automation** - Automated workflows
- ✅ **Project Management** - Projects, towers, floors, units

### Frontend Features

- ✅ **Dashboard** - Analytics and metrics
- ✅ **Lead Management** - Track and manage leads
- ✅ **Property Management** - List and manage properties
- ✅ **Payment Management** - Complete payment workflow
- ✅ **Reports** - Generate various reports
- ✅ **Settings** - Configure system settings
- ✅ **User Management** - Manage agents and teams
- ✅ **Responsive Design** - Mobile-friendly UI

---

## 🗄️ Database Models

### Core Models

- **Agent** - User accounts with roles
- **Lead** - Customer leads
- **Property** - Real estate properties
- **Client** - Customers/clients
- **Deal** - Sales deals
- **Activity** - Lead activities (calls, emails, etc.)
- **Task** - Task management

### Payment Models

- **BookingPayment** - Booking payments
- **Receipt** - Payment receipts
- **PaymentSchedule** - Payment schedules
- **Ledger** - Accounting ledger
- **Refund** - Refund management
- **BankReconciliation** - Bank reconciliation

### Project Models

- **Project** - Real estate projects
- **Tower** - Building towers
- **Floor** - Building floors
- **Unit** - Individual units

---

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/token/` - Login
- `POST /api/auth/token/refresh/` - Refresh token
- `POST /api/auth/register/` - Register

### Core Resources

- `GET /api/leads/` - List leads
- `POST /api/leads/` - Create lead
- `GET /api/properties/` - List properties
- `GET /api/clients/` - List clients
- `GET /api/agents/` - List agents
- `GET /api/agents/me/` - Current user profile

### Payment Resources

- `GET /api/booking-payments/` - Booking payments
- `GET /api/receipts/` - Receipts
- `GET /api/payment-schedules/` - Payment schedules
- `GET /api/ledgers/` - Ledger entries
- `GET /api/refunds/` - Refunds

See `backend/api/urls.py` for complete list.

---

## 🛠️ Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Backend: Edit models, views, serializers
- Frontend: Edit components, services

### 3. Run Tests

```bash
# Backend
pytest api/tests/

# Frontend
npm run test
```

### 4. Commit Changes

```bash
git add .
git commit -m "Add feature: description"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

---

## 📝 Code Style

### Backend (Python)

- Follow PEP 8 style guide
- Use type hints where possible
- Write docstrings for functions/classes
- Keep functions small and focused

### Frontend (TypeScript)

- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Keep components small and reusable

---

## 🐛 Troubleshooting

### Backend Issues

**Database Connection Error:**
```bash
# Check database is running
# Verify .env credentials
# Test connection: python manage.py dbshell
```

**Migration Errors:**
```bash
# Reset migrations (development only)
python manage.py migrate --fake-initial
```

**Import Errors:**
```bash
# Ensure virtual environment is activated
# Reinstall dependencies: pip install -r requirements.txt
```

### Frontend Issues

**Build Errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**API Connection Errors:**
```bash
# Check VITE_API_BASE_URL in .env
# Verify backend is running
# Check CORS settings
```

---

## 📚 Additional Resources

- **Django Docs**: https://docs.djangoproject.com/
- **React Docs**: https://react.dev/
- **Vite Docs**: https://vitejs.dev/
- **Django REST Framework**: https://www.django-rest-framework.org/

---

## 🚀 Deployment

For deployment instructions, see **DEPLOYMENT_RENDER.md**

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section
2. Review test results
3. Check logs for errors
4. Review documentation

---

**Last Updated**: 2024
**Version**: 1.0

