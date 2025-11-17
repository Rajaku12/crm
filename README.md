# Devreal_state - Real Estate CRM System

A comprehensive Real Estate CRM system built with Django REST Framework backend and React TypeScript frontend, featuring full integration support for telephony, messaging, email, payment gateways, and CRM sync.

## 🚀 Features

### Core Functionality
- **Lead Management**: Complete lead tracking, scoring, and management
- **Property Management**: Property listings, categories, and status tracking
- **Agent Management**: Multi-role agent system (Admin, Sales Manager, Agent, Telecaller)
- **Call Management**: Integrated telephony with call logging, recording, and transcription
- **Activity Tracking**: Comprehensive activity logging and history
- **Task Management**: Task creation, assignment, and tracking
- **Client Management**: Full client lifecycle management
- **Deal Management**: Deal tracking from lead to closure
- **Invoice & Payment**: Invoice generation, payment tracking, and payment plans
- **Commission Management**: Automated commission calculation and splitting
- **Reports & Analytics**: Comprehensive reporting and analytics dashboard

### Integrations

#### Telephony APIs
- ✅ **Twilio** - Fully integrated
- ✅ **Exotel** - Integration available
- ✅ **Knowlarity** - Integration available
- ✅ **MyOperator** - Integration available

#### Messaging & WhatsApp
- ✅ **WhatsApp Business** - Fully integrated via Meta Cloud API

#### Email
- ✅ **Gmail** - Fully integrated
- ✅ **Outlook** - Integration available
- ✅ **SMTP** - Generic SMTP support

#### CRM Sync
- ✅ **HubSpot** - Fully integrated
- ✅ **Zoho CRM** - Integration available

#### Payment Gateways
- ✅ **Razorpay** - Fully integrated
- ✅ **Paytm** - Integration available

#### Calendar
- ✅ **Google Calendar** - Fully integrated

## 📋 Prerequisites

- Python 3.11+
- Node.js 16+
- GitHub account
- Render account (for production deployment)

## 🚀 Quick Start

### Local Development

1. **Start Backend**:
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Production Deployment

**📖 See [Complete Deployment Guide](docs/DEPLOYMENT_GUIDE.md) for step-by-step instructions.**

The deployment guide includes:
- Render service setup
- Environment variable configuration
- API setup and configuration
- Troubleshooting guide
- Verification steps

---

## 📋 Prerequisites (Detailed)
- MySQL/PostgreSQL (or SQLite for development)
- Git

## 🛠️ Installation

### Local Development Setup

#### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

#### Start Both Servers

```powershell
# Windows PowerShell
.\START_BOTH_SERVERS.ps1

# Or manually:
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🚀 Production Deployment

### Deploy to Render

**📖 Complete Guide:** See **[DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)**

The deployment guide includes everything you need:
- ✅ Step-by-step Render setup
- ✅ Environment variable configuration
- ✅ API setup and configuration
- ✅ Database setup
- ✅ Troubleshooting guide
- ✅ Verification checklist

**What You'll Deploy:**
- ✅ Django Backend (Web Service)
- ✅ React Frontend (Static Site)
- ✅ PostgreSQL Database

**Estimated Time:** 30-45 minutes

**Cost:** Free tier available (90 days), then ~$14/month for production

## 📚 Documentation

- **[Complete Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Everything you need to deploy and configure the application

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=your-database-url
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Telephony Configuration

1. Navigate to Settings → Integrations → Telephony
2. Configure your telephony provider (Twilio, Exotel, etc.)
3. Enter API credentials and phone numbers
4. Set webhook URLs for call status updates

See [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) for detailed setup instructions.

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 📁 Project Structure

```
crm/
├── backend/                 # Django backend
│   ├── api/               # API app
│   │   ├── models.py     # Database models
│   │   ├── views.py      # API views
│   │   ├── serializers.py
│   │   └── services/     # Business logic
│   ├── zenith_crm/       # Django project settings
│   └── manage.py
├── frontend/              # React frontend
│   ├── components/       # React components
│   ├── services/        # API services
│   ├── contexts/        # React contexts
│   └── types.ts        # TypeScript types
├── docs/                 # Documentation
│   └── DEPLOYMENT_GUIDE.md  # Complete deployment and configuration guide
└── scripts/              # Utility scripts
    └── github/           # GitHub-related scripts (if any)
```

## 🔐 Security

- JWT authentication
- Role-based access control
- CORS configuration
- Environment variable management
- Secure password handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

[Add your license here]

## 👥 Authors

- **Rajaku12** - [GitHub Profile](https://github.com/Rajaku12)

## 🙏 Acknowledgments

- Django REST Framework
- React
- Twilio
- All integration providers

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) for troubleshooting
- Review service logs on Render dashboard

---

**Last Updated**: 2024

