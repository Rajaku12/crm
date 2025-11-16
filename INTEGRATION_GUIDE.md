# Zenith Estate CRM - Integration Guide

## Table of Contents
1. [Overview](#overview)
2. [Telephony APIs](#telephony-apis)
3. [Messaging & WhatsApp](#messaging--whatsapp)
4. [Email Integration](#email-integration)
5. [CRM Sync](#crm-sync)
6. [Payment Gateways](#payment-gateways)
7. [Calendar Sync](#calendar-sync)
8. [Agent Management & Call Functionality](#agent-management--call-functionality)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Zenith Estate CRM supports multiple integrations to streamline your real estate operations. This guide covers how to integrate and configure each service.

### Prerequisites
- Admin access to the CRM
- API credentials from the respective service providers
- Webhook URLs configured (for telephony services)

---

## Telephony APIs

### Twilio (Connected)

**Status**: ✅ Fully Integrated

#### Setup Instructions

1. **Get Twilio Credentials**
   - Sign up at [Twilio](https://www.twilio.com/)
   - Get your Account SID and Auth Token from the dashboard
   - Purchase a phone number or use a trial number

2. **Configure in CRM**
   - Navigate to Settings → Integrations → Telephony
   - Click "Connect" or "Manage" for Twilio
   - Enter the following:
     - **Account SID**: Your Twilio Account SID
     - **Auth Token**: Your Twilio Auth Token
     - **Phone Number**: Your Twilio phone number (e.g., +1234567890)
     - **Webhook URL**: `https://your-domain.com/api/webhooks/twilio/status/`
     - **Recording Callback URL**: `https://your-domain.com/api/webhooks/twilio/recording/`

3. **Configure Webhooks in Twilio**
   - Go to Twilio Console → Phone Numbers → Manage → Active Numbers
   - Select your number
   - Set Voice & Fax webhook URL to: `https://your-domain.com/api/webhooks/twilio/status/`
   - Enable call recording if needed

4. **Test the Integration**
   - Create a test agent in the CRM
   - Initiate a call from a lead's profile
   - Verify call logs appear in the Calls section

#### Features
- ✅ Outbound calling
- ✅ Inbound call handling
- ✅ Call recording
- ✅ Call transcription (optional)
- ✅ Real-time call status updates
- ✅ Automatic lead creation from calls

---

### Exotel (Not Connected)

**Status**: ⚠️ Integration Available (Needs Configuration)

#### Setup Instructions

1. **Get Exotel Credentials**
   - Sign up at [Exotel](https://exotel.com/)
   - Get your Subdomain, API Key, and API Token
   - Get your Exophone number

2. **Configure in CRM**
   - Navigate to Settings → Integrations → Telephony
   - Click "Connect" for Exotel
   - Enter the following:
     - **Subdomain**: Your Exotel subdomain (e.g., `yourcompany`)
     - **API Key**: Your Exotel API Key
     - **API Token**: Your Exotel API Token
     - **Phone Number**: Your Exophone number
     - **Webhook URL**: `https://your-domain.com/api/webhooks/exotel/status/`

3. **Configure Webhooks in Exotel**
   - Go to Exotel Dashboard → Settings → Webhooks
   - Add webhook URL: `https://your-domain.com/api/webhooks/exotel/status/`
   - Enable events: Call Initiated, Call Answered, Call Completed

4. **Test the Integration**
   - Create a test call from the CRM
   - Verify call appears in Exotel dashboard
   - Check call logs in CRM

#### Features
- ✅ Outbound calling
- ✅ Inbound call handling
- ✅ Call recording
- ✅ Call analytics
- ✅ IVR support

---

### Knowlarity (Not Connected)

**Status**: ⚠️ Integration Available (Needs Configuration)

#### Setup Instructions

1. **Get Knowlarity Credentials**
   - Sign up at [Knowlarity](https://www.knowlarity.com/)
   - Get your API Key and API Secret
   - Get your Knowlarity phone number

2. **Configure in CRM**
   - Navigate to Settings → Integrations → Telephony
   - Click "Connect" for Knowlarity
   - Enter the following:
     - **API Key**: Your Knowlarity API Key
     - **API Secret**: Your Knowlarity API Secret
     - **Phone Number**: Your Knowlarity number
     - **Webhook URL**: `https://your-domain.com/api/webhooks/knowlarity/status/`

3. **Configure Webhooks in Knowlarity**
   - Go to Knowlarity Dashboard → Settings → Webhooks
   - Add webhook URL for call events
   - Enable call status notifications

4. **Test the Integration**
   - Make a test call
   - Verify integration in CRM

#### Features
- ✅ Outbound calling
- ✅ Inbound call handling
- ✅ Call recording
- ✅ Call analytics
- ✅ Multi-level IVR

---

### MyOperator (Not Connected)

**Status**: ⚠️ Integration Available (Needs Configuration)

#### Setup Instructions

1. **Get MyOperator Credentials**
   - Sign up at [MyOperator](https://www.myoperator.com/)
   - Get your API Key and API Secret
   - Get your MyOperator phone number

2. **Configure in CRM**
   - Navigate to Settings → Integrations → Telephony
   - Click "Connect" for MyOperator
   - Enter the following:
     - **API Key**: Your MyOperator API Key
     - **API Secret**: Your MyOperator API Secret
     - **Phone Number**: Your MyOperator number
     - **Webhook URL**: `https://your-domain.com/api/webhooks/myoperator/status/`

3. **Configure Webhooks in MyOperator**
   - Go to MyOperator Dashboard → Settings → Webhooks
   - Add webhook URL for call events

4. **Test the Integration**
   - Make a test call
   - Verify call logs in CRM

#### Features
- ✅ Outbound calling
- ✅ Inbound call handling
- ✅ Call recording
- ✅ Call analytics
- ✅ Smart call routing

---

## Messaging & WhatsApp

### WhatsApp Business (Connected)

**Status**: ✅ Fully Integrated

#### Setup Instructions

1. **Get WhatsApp Business API Credentials**
   - Create a Meta Business Account
   - Set up WhatsApp Business API via Meta or a Business Solution Provider
   - Get your Phone Number ID and Access Token

2. **Configure in CRM**
   - Navigate to Settings → Integrations → Messaging
   - Click "Connect" or "Manage" for WhatsApp Business
   - Enter the following:
     - **Phone Number ID**: Your WhatsApp Business Phone Number ID
     - **Access Token**: Your WhatsApp Business API Access Token
     - **Business Account ID**: (Optional) Your Meta Business Account ID

3. **Verify Phone Number**
   - Complete phone number verification in Meta Business Manager
   - Ensure your WhatsApp Business account is approved

4. **Test the Integration**
   - Send a test message from the CRM to a verified number
   - Verify message delivery

#### Features
- ✅ Send text messages
- ✅ Send template messages
- ✅ Receive messages
- ✅ Media support
- ✅ Message templates management

#### WhatsApp Template Setup
1. Create templates in Meta Business Manager
2. Wait for approval (usually 24-48 hours)
3. Templates will sync automatically to CRM

---

## Email Integration

### Gmail (Connected)

**Status**: ✅ Fully Integrated

#### Setup Instructions

1. **Enable Gmail API**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Gmail API
   - Create OAuth 2.0 credentials

2. **Configure in CRM**
   - Navigate to Settings → Integrations → Email
   - Click "Connect" or "Manage" for Gmail
   - Click "Authorize" to connect your Gmail account
   - Grant necessary permissions

3. **Permissions Required**
   - Send email
   - Read email
   - Manage email drafts

#### Features
- ✅ Send emails from CRM
- ✅ Receive emails in CRM
- ✅ Email templates
- ✅ Email tracking
- ✅ Attachments support

---

### Outlook (Not Connected)

**Status**: ⚠️ Integration Available (Needs Configuration)

#### Setup Instructions

1. **Register Application in Azure**
   - Go to [Azure Portal](https://portal.azure.com/)
   - Register a new application
   - Get Client ID and Client Secret
   - Set redirect URI: `https://your-domain.com/api/integrations/outlook/callback/`

2. **Configure in CRM**
   - Navigate to Settings → Integrations → Email
   - Click "Connect" for Outlook
   - Enter Client ID and Client Secret
   - Authorize the application

3. **Test the Integration**
   - Send a test email
   - Verify email appears in Outlook

#### Features
- ✅ Send emails
- ✅ Receive emails
- ✅ Calendar integration
- ✅ Email templates

---

### SMTP (Not Connected)

**Status**: ⚠️ Integration Available (Needs Configuration)

#### Setup Instructions

1. **Get SMTP Credentials**
   - Use your email provider's SMTP settings
   - Common providers: Gmail, Outlook, SendGrid, AWS SES

2. **Configure in CRM**
   - Navigate to Settings → Integrations → Email
   - Click "Connect" for SMTP
   - Enter the following:
     - **SMTP Host**: e.g., `smtp.gmail.com`
     - **SMTP Port**: e.g., `587` (TLS) or `465` (SSL)
     - **Username**: Your email address
     - **Password**: Your email password or app password
     - **From Email**: Email address to send from
     - **Use TLS**: Enable for port 587

3. **Gmail SMTP Settings**
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Use TLS: Yes
   - Use App Password (not regular password)

4. **Test the Integration**
   - Send a test email
   - Check delivery

#### Features
- ✅ Send emails via SMTP
- ✅ Support for multiple providers
- ✅ Email templates
- ✅ Attachments

---

## CRM Sync

### Zoho CRM (Not Connected)

**Status**: ⚠️ Integration Available (Needs Configuration)

#### Setup Instructions

1. **Get Zoho CRM Credentials**
   - Sign up at [Zoho CRM](https://www.zoho.com/crm/)
   - Go to Settings → Developer Space → APIs
   - Generate API Token or OAuth credentials

2. **Configure in CRM**
   - Navigate to Settings → Integrations → CRM Sync
   - Click "Connect" for Zoho CRM
   - Enter API credentials
   - Authorize the connection

3. **Sync Configuration**
   - Choose what to sync: Leads, Contacts, Deals
   - Set sync direction: One-way or Two-way
   - Configure field mapping

#### Features
- ✅ Sync leads
- ✅ Sync contacts
- ✅ Sync deals
- ✅ Bidirectional sync
- ✅ Field mapping

---

### HubSpot (Connected)

**Status**: ✅ Fully Integrated

#### Setup Instructions

1. **Get HubSpot API Key**
   - Sign up at [HubSpot](https://www.hubspot.com/)
   - Go to Settings → Integrations → Private Apps
   - Create a private app
   - Get API Key

2. **Configure in CRM**
   - Navigate to Settings → Integrations → CRM Sync
   - Click "Connect" or "Manage" for HubSpot
   - Enter API Key
   - Test connection

3. **Sync Configuration**
   - Configure sync settings
   - Map fields between systems
   - Set sync frequency

#### Features
- ✅ Sync leads
- ✅ Sync contacts
- ✅ Sync deals
- ✅ Real-time sync
- ✅ Custom field mapping

---

## Payment Gateways

### Razorpay (Connected)

**Status**: ✅ Fully Integrated

#### Setup Instructions

1. **Get Razorpay Credentials**
   - Sign up at [Razorpay](https://razorpay.com/)
   - Go to Settings → API Keys
   - Generate Key ID and Key Secret

2. **Configure in CRM**
   - Navigate to Settings → Integrations → Payment Gateways
   - Click "Connect" or "Manage" for Razorpay
   - Enter:
     - **Key ID**: Your Razorpay Key ID
     - **Key Secret**: Your Razorpay Key Secret
     - **Webhook Secret**: (Optional) For webhook verification

3. **Configure Webhooks**
   - Go to Razorpay Dashboard → Settings → Webhooks
   - Add webhook URL: `https://your-domain.com/api/webhooks/razorpay/`
   - Enable events: payment.captured, payment.failed

4. **Test the Integration**
   - Create a test payment
   - Verify payment appears in CRM

#### Features
- ✅ Accept payments
- ✅ Payment links
- ✅ Payment reminders
- ✅ Payment tracking
- ✅ Refund management

---

### Paytm (Not Connected)

**Status**: ⚠️ Integration Available (Needs Configuration)

#### Setup Instructions

1. **Get Paytm Credentials**
   - Sign up at [Paytm](https://business.paytm.com/)
   - Get Merchant ID and Merchant Key
   - Complete KYC verification

2. **Configure in CRM**
   - Navigate to Settings → Integrations → Payment Gateways
   - Click "Connect" for Paytm
   - Enter:
     - **Merchant ID**: Your Paytm Merchant ID
     - **Merchant Key**: Your Paytm Merchant Key
     - **Environment**: Production or Staging

3. **Test the Integration**
   - Create a test payment
   - Verify integration

#### Features
- ✅ Accept payments
- ✅ Payment links
- ✅ Payment tracking
- ✅ Refund management

---

## Calendar Sync

### Google Calendar (Connected)

**Status**: ✅ Fully Integrated

#### Setup Instructions

1. **Enable Google Calendar API**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Google Calendar API
   - Create OAuth 2.0 credentials

2. **Configure in CRM**
   - Navigate to Settings → Integrations → Calendar
   - Click "Connect" or "Manage" for Google Calendar
   - Authorize Google account
   - Select calendar to sync

3. **Sync Configuration**
   - Choose sync direction
   - Set sync frequency
   - Configure event types to sync

#### Features
- ✅ Sync appointments
- ✅ Create calendar events
- ✅ Two-way sync
- ✅ Event reminders
- ✅ Multiple calendar support

---

## Agent Management & Call Functionality

### Creating Agents

Agents can be created by Admin users through the CRM interface.

#### Steps to Create an Agent:

1. **Navigate to Agents Section**
   - Go to Settings → Agents or use the Agents menu
   - Click "Add Agent" or "New Agent"

2. **Fill Agent Details**
   - **Username**: Unique username for login
   - **Email**: Agent's email address
   - **Password**: Set initial password
   - **First Name** & **Last Name**: Agent's full name
   - **Role**: Select from:
     - Admin
     - Sales Manager
     - Agent
     - Telecaller
     - Customer Support
   - **Team**: Assign to a team (optional)
   - **Contact**: Phone number
   - **Monthly Targets**: Set call and sales targets

3. **Save Agent**
   - Click "Save" to create the agent
   - Agent will receive login credentials

#### Agent Permissions by Role:

- **Admin**: Full access to all features
- **Sales Manager**: Manage team, view team reports
- **Agent**: Manage assigned leads, make calls
- **Telecaller**: Make calls, log activities
- **Customer Support**: Handle support tickets

### Making Calls

Agents can initiate calls directly from the CRM interface.

#### Steps to Make a Call:

1. **From Lead Profile**
   - Open a lead's detail panel
   - Click the phone icon next to the lead's phone number
   - Call will be initiated via configured telephony provider

2. **From Leads Table**
   - Find the lead in the leads table
   - Click the phone icon in the actions column
   - Call will be initiated

3. **Call Flow**
   - System creates a CallLog entry
   - Initiates call via configured telephony provider (Twilio, Exotel, etc.)
   - Call status updates in real-time
   - After call completion:
     - Call recording is saved (if enabled)
     - Activity is automatically created
     - Lead's last contacted date is updated

#### Call Features:

- ✅ One-click calling from lead profiles
- ✅ Automatic call logging
- ✅ Call recording (if enabled)
- ✅ Call transcription (if enabled)
- ✅ Real-time call status
- ✅ Automatic activity creation
- ✅ Call quality scoring
- ✅ Sentiment analysis

### Verifying Call Functionality

#### Test Checklist:

1. **Telephony Configuration**
   - [ ] Verify telephony provider is configured
   - [ ] Check webhook URLs are set correctly
   - [ ] Test webhook connectivity

2. **Agent Setup**
   - [ ] Create a test agent
   - [ ] Verify agent can log in
   - [ ] Check agent permissions

3. **Call Initiation**
   - [ ] Create a test lead with phone number
   - [ ] Initiate call from lead profile
   - [ ] Verify CallLog is created
   - [ ] Check call status updates

4. **Call Completion**
   - [ ] Complete a test call
   - [ ] Verify activity is created
   - [ ] Check call recording (if enabled)
   - [ ] Verify lead's last contacted is updated

5. **Call Logs**
   - [ ] Check Calls section shows call logs
   - [ ] Verify call details are correct
   - [ ] Test call filtering by agent

---

## Troubleshooting

### Common Issues

#### Calls Not Initiating

**Problem**: Clicking call button doesn't initiate call

**Solutions**:
1. Check telephony configuration is active and set as default
2. Verify API credentials are correct
3. Check webhook URLs are accessible
4. Review server logs for errors
5. Ensure phone numbers are in correct format (E.164)

#### Agent Cannot Make Calls

**Problem**: Agent sees call button but call fails

**Solutions**:
1. Verify agent has proper role permissions
2. Check telephony configuration is active
3. Verify agent is assigned to a lead (for some providers)
4. Check API quota/limits haven't been exceeded

#### Webhooks Not Working

**Problem**: Call status not updating in CRM

**Solutions**:
1. Verify webhook URL is publicly accessible
2. Check webhook URL in provider dashboard matches CRM
3. Review webhook logs in provider dashboard
4. Ensure SSL certificate is valid
5. Check firewall rules allow incoming webhooks

#### Integration Not Connecting

**Problem**: Cannot connect to integration service

**Solutions**:
1. Verify API credentials are correct
2. Check internet connectivity
3. Review API rate limits
4. Check service status of provider
5. Verify OAuth tokens haven't expired

### Getting Help

For additional support:
1. Check server logs: `backend/logs/` or Django admin
2. Review integration logs in Settings → Integrations
3. Contact support with:
   - Integration name
   - Error messages
   - Steps to reproduce
   - Screenshots if applicable

---

## API Endpoints Reference

### Telephony

- `POST /api/call-logs/{id}/initiate_call/` - Initiate outbound call
- `GET /api/call-logs/` - List call logs
- `POST /api/webhooks/twilio/status/` - Twilio status webhook
- `POST /api/webhooks/twilio/recording/` - Twilio recording webhook

### Integrations

- `GET /api/integrations/` - List all integrations
- `POST /api/integrations/` - Create integration config
- `PUT /api/integrations/{id}/` - Update integration config
- `POST /api/integrations/{id}/test/` - Test integration connection

### Agents

- `GET /api/agents/` - List agents
- `POST /api/agents/` - Create agent
- `PUT /api/agents/{id}/` - Update agent
- `DELETE /api/agents/{id}/` - Delete agent

---

## Security Best Practices

1. **API Keys**: Never share API keys publicly
2. **Webhooks**: Use HTTPS for all webhook URLs
3. **OAuth**: Regularly refresh OAuth tokens
4. **Access Control**: Limit integration access to admins only
5. **Audit Logs**: Regularly review integration access logs

---

## Version History

- **v1.0** (Current): Initial integration support
  - Twilio, WhatsApp, Gmail, HubSpot, Razorpay, Google Calendar
  - Exotel, Knowlarity, MyOperator, Outlook, SMTP, Zoho CRM, Paytm (Available but need configuration)

---

**Last Updated**: 2024
**Maintained By**: Zenith Estate CRM Team

