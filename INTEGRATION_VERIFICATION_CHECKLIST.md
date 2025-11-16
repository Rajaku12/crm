# Integration & Agent Functionality Verification Checklist

## Overview
This document provides a step-by-step checklist to verify that all integrations are working correctly and that agents can be created and make calls successfully.

---

## Pre-Verification Setup

### 1. Backend Server
- [ ] Backend server is running on `http://127.0.0.1:8000`
- [ ] Database migrations are applied
- [ ] Admin user exists (create with `python backend/create_admin.py` if needed)

### 2. Frontend Server
- [ ] Frontend server is running on `http://127.0.0.1:3000`
- [ ] Can access the login page
- [ ] Can log in with admin credentials

---

## Agent Creation & Management

### Test 1: Create Agent via Admin Panel

1. **Navigate to Agents**
   - [ ] Go to Settings → Agents (or Agents menu)
   - [ ] Click "Add Agent" or "New Agent"

2. **Fill Agent Details**
   - [ ] Username: `testagent1`
   - [ ] Email: `testagent1@example.com`
   - [ ] Password: `Test123!@#`
   - [ ] First Name: `Test`
   - [ ] Last Name: `Agent`
   - [ ] Role: `Agent`
   - [ ] Team: (optional) `Sales Team A`
   - [ ] Contact: `+919876543210`
   - [ ] Monthly Calls Target: `100`
   - [ ] Monthly Sales Target: `500000`

3. **Save Agent**
   - [ ] Click "Save"
   - [ ] Verify success message appears
   - [ ] Agent appears in agents list

4. **Verify Agent Login**
   - [ ] Log out from admin account
   - [ ] Log in with `testagent1` / `Test123!@#`
   - [ ] Verify agent can access dashboard
   - [ ] Verify agent sees only their assigned leads

### Test 2: Create Agent via API

```bash
# Test API endpoint
curl -X POST http://127.0.0.1:8000/api/agents/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testagent2",
    "email": "testagent2@example.com",
    "password": "Test123!@#",
    "first_name": "Test",
    "last_name": "Agent 2",
    "role": "Agent",
    "contact": "+919876543211"
  }'
```

- [ ] API returns 201 Created
- [ ] Agent is created in database
- [ ] Agent can log in

---

## Telephony Integration Setup

### Test 3: Configure Twilio (If Not Already Configured)

1. **Get Twilio Credentials**
   - [ ] Sign up at https://www.twilio.com/
   - [ ] Get Account SID and Auth Token
   - [ ] Get a phone number

2. **Configure in CRM**
   - [ ] Navigate to Settings → Integrations → Telephony
   - [ ] Click "Connect" or "Manage" for Twilio
   - [ ] Enter Account SID
   - [ ] Enter Auth Token
   - [ ] Enter Phone Number
   - [ ] Enter Webhook URL: `http://your-domain.com/api/webhooks/twilio/status/`
   - [ ] Enable "Record Calls" if needed
   - [ ] Set as Default
   - [ ] Save

3. **Verify Configuration**
   - [ ] Configuration appears as "Connected"
   - [ ] Status shows as "Active"
   - [ ] Can see configuration details

### Test 4: Configure Exotel (Optional)

1. **Get Exotel Credentials**
   - [ ] Sign up at https://exotel.com/
   - [ ] Get Subdomain, API Key, and API Token

2. **Configure in CRM**
   - [ ] Navigate to Settings → Integrations → Telephony
   - [ ] Click "Connect" for Exotel
   - [ ] Enter Subdomain
   - [ ] Enter API Key
   - [ ] Enter API Token
   - [ ] Enter Phone Number
   - [ ] Enter Webhook URL
   - [ ] Save

3. **Verify Configuration**
   - [ ] Configuration appears as "Connected"
   - [ ] Can switch between providers

---

## Call Functionality Verification

### Test 5: Create Test Lead

1. **Create Lead**
   - [ ] Navigate to Leads section
   - [ ] Click "Add Lead"
   - [ ] Fill in details:
     - Name: `Test Lead`
     - Phone: `+919876543212` (use a test number)
     - Email: `testlead@example.com`
     - Property: (select any property)
   - [ ] Assign to `testagent1`
   - [ ] Save

2. **Verify Lead Created**
   - [ ] Lead appears in leads list
   - [ ] Lead is assigned to testagent1
   - [ ] Phone number is correct

### Test 6: Initiate Call from Lead Profile

1. **Open Lead Profile**
   - [ ] Click on "Test Lead" from leads list
   - [ ] Lead detail panel opens

2. **Initiate Call**
   - [ ] Click phone icon next to phone number
   - [ ] OR click phone icon in actions column
   - [ ] Verify success message: "Call initiated successfully"

3. **Verify Call Log Created**
   - [ ] Navigate to Calls section
   - [ ] Verify call log appears
   - [ ] Check call details:
     - [ ] From number (your Twilio number)
     - [ ] To number (lead's phone)
     - [ ] Status: "Initiated" or "Ringing"
     - [ ] Agent: testagent1
     - [ ] Lead: Test Lead

4. **Check Call Status Updates**
   - [ ] Wait for call status to update (if webhooks configured)
   - [ ] Status changes to "Answered" when call is answered
   - [ ] Status changes to "Completed" when call ends
   - [ ] Duration is recorded
   - [ ] Recording URL appears (if recording enabled)

### Test 7: Initiate Call from Leads Table

1. **From Leads Table**
   - [ ] Find "Test Lead" in table
   - [ ] Click phone icon in actions column
   - [ ] Verify call is initiated
   - [ ] Verify call log created

### Test 8: Verify Call Activity Creation

1. **After Call Completion**
   - [ ] Navigate to "Test Lead" profile
   - [ ] Go to Activities tab
   - [ ] Verify call activity is created automatically
   - [ ] Check activity details:
     - [ ] Type: "Call"
     - [ ] Duration: (matches call duration)
     - [ ] Outcome: (Success, No Answer, Busy, etc.)
     - [ ] Recording URL: (if available)
     - [ ] Agent: testagent1

2. **Verify Lead Last Contacted**
   - [ ] Check lead's "Last Contacted" date
   - [ ] Should be updated to current date/time

---

## Integration Status Verification

### Test 9: Check Integration Status

1. **Navigate to Settings → Integrations**
   - [ ] All integrations are listed
   - [ ] Status shows correctly:
     - [ ] Twilio: Connected
     - [ ] Exotel: Not Connected (or Connected if configured)
     - [ ] Knowlarity: Not Connected (or Connected if configured)
     - [ ] MyOperator: Not Connected (or Connected if configured)
     - [ ] WhatsApp Business: Connected
     - [ ] Gmail: Connected
     - [ ] HubSpot: Connected
     - [ ] Razorpay: Connected
     - [ ] Google Calendar: Connected

2. **Test Integration Management**
   - [ ] Can click "Manage" on connected integrations
   - [ ] Can view/edit configuration
   - [ ] Can disconnect/reconnect

---

## API Endpoint Verification

### Test 10: Test Call Initiation API

```bash
# Get authentication token first
TOKEN=$(curl -X POST http://127.0.0.1:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}' | jq -r '.access')

# Get lead ID (replace 1 with actual lead ID)
LEAD_ID=1

# Initiate call
curl -X POST http://127.0.0.1:8000/api/leads/${LEAD_ID}/initiate_call/ \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"to_number":"+919876543212"}'
```

- [ ] API returns 201 Created
- [ ] Response contains call_log data
- [ ] Call is initiated via telephony provider

### Test 11: Test Call Logs API

```bash
# Get call logs
curl -X GET http://127.0.0.1:8000/api/call-logs/ \
  -H "Authorization: Bearer ${TOKEN}"
```

- [ ] API returns list of call logs
- [ ] Call logs include all required fields
- [ ] Can filter by agent, lead, status

---

## Error Handling Verification

### Test 12: Test Error Scenarios

1. **Call Without Telephony Config**
   - [ ] Disable all telephony configurations
   - [ ] Try to initiate call
   - [ ] Verify error message: "No active telephony configuration found"

2. **Call Without Phone Number**
   - [ ] Create lead without phone number
   - [ ] Try to initiate call
   - [ ] Verify error message: "Phone number is required"

3. **Call with Invalid Credentials**
   - [ ] Update Twilio config with invalid credentials
   - [ ] Try to initiate call
   - [ ] Verify error is logged
   - [ ] Verify user sees appropriate error message

---

## Performance & Reliability

### Test 13: Concurrent Calls

1. **Multiple Agents Making Calls**
   - [ ] Create 3 test agents
   - [ ] Each agent initiates a call simultaneously
   - [ ] Verify all calls are logged correctly
   - [ ] Verify no conflicts or errors

### Test 14: Call Logging Performance

1. **Large Number of Calls**
   - [ ] Generate 50+ test calls
   - [ ] Verify call logs load quickly
   - [ ] Verify filtering works correctly
   - [ ] Verify pagination works (if implemented)

---

## Documentation Verification

### Test 15: Verify Documentation

- [ ] INTEGRATION_GUIDE.md exists and is complete
- [ ] All integration setup steps are documented
- [ ] API endpoints are documented
- [ ] Troubleshooting section is helpful
- [ ] Examples are clear and accurate

---

## Final Checklist

### All Tests Passed
- [ ] Agent creation works (UI and API)
- [ ] Agent login works
- [ ] Telephony configuration works
- [ ] Call initiation works from UI
- [ ] Call initiation works via API
- [ ] Call logs are created correctly
- [ ] Call activities are created automatically
- [ ] Integration status displays correctly
- [ ] Error handling works properly
- [ ] Documentation is complete

---

## Troubleshooting

### Common Issues

**Issue**: Call not initiating
- Check telephony configuration is active and default
- Verify API credentials are correct
- Check webhook URLs are accessible
- Review server logs for errors

**Issue**: Agent cannot make calls
- Verify agent has proper role permissions
- Check telephony configuration is active
- Verify agent is assigned to lead

**Issue**: Call logs not appearing
- Check webhook configuration
- Verify webhook URLs are publicly accessible
- Check server logs for webhook errors

**Issue**: Activities not created
- Verify call completed successfully
- Check call log has lead assigned
- Review server logs for errors

---

## Next Steps

After verification:
1. Document any issues found
2. Fix any bugs discovered
3. Update documentation if needed
4. Perform production deployment testing
5. Train users on new features

---

**Last Updated**: 2024
**Verified By**: _________________
**Date**: _________________

