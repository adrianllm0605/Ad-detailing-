# Booking System Setup Guide

## What you need

1. A Google account (to create the Apps Script)
2. A free Twilio account (for SMS — takes ~5 minutes to set up)

---

## Step 1 — Set up Twilio (for SMS)

1. Go to **twilio.com** and create a free account
2. Verify your phone number during signup
3. From your Twilio Console dashboard, copy:
   - **Account SID** (starts with `AC…`)
   - **Auth Token**
4. Go to **Phone Numbers → Manage → Buy a Number** → get a free trial number
5. Give these 3 values to Claude to fill in `Code.gs`

---

## Step 2 — Deploy the Google Apps Script

1. Go to **script.google.com** and click **New Project**
2. Delete the existing code and paste the entire contents of `Code.gs`
3. Fill in the 5 config values at the top:
   ```
   CALENDAR_ID  = 'your-email@gmail.com'   ← your Google Calendar email
   OWNER_PHONE  = '+15145039296'            ← your phone (already set)
   TWILIO_SID   = 'ACxxxxxxxx…'
   TWILIO_TOKEN = 'your_auth_token'
   TWILIO_FROM  = '+18005551234'            ← your Twilio number
   ```
4. Click **Deploy → New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy** → Authorize when prompted
6. Copy the **Web App URL** (looks like `https://script.google.com/macros/s/XXXXX/exec`)

---

## Step 3 — Connect to your website

Open `index.html` and find this line near the bottom:

```javascript
var APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL';
```

Replace `YOUR_APPS_SCRIPT_URL` with the URL you copied in Step 2.

---

## Step 4 — Set up the 24-hour reminder

1. In the Apps Script editor, click the **clock icon** (Triggers) in the left sidebar
2. Click **Add Trigger**
3. Choose:
   - Function: `send24hReminders`
   - Event source: **Time-driven**
   - Type: **Day timer**
   - Time of day: **9 AM to 10 AM**
4. Save

Now every morning at ~9 AM, the script will SMS every client who has an appointment the next day.

---

## How it works

| Action | What happens |
|--------|-------------|
| Client clicks "Book Now" | Policy popup appears |
| Client accepts policy | Booking form opens |
| Client submits form | Google Calendar event created instantly |
| | Client gets SMS: appointment confirmed |
| | You get SMS: new booking with all details |
| Every morning @ 9 AM | 24h reminder SMS sent to next day's clients |
