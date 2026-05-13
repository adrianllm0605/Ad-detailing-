// ═══════════════════════════════════════════════════════════════════
//  AD Detailing — Booking Backend (Google Apps Script)
//  Deploy as: Web App → Execute as: Me → Who has access: Anyone
// ═══════════════════════════════════════════════════════════════════

// ── CONFIGURATION ─── Fill these in before deploying ────────────────
var CALENDAR_ID  = 'YOUR_GOOGLE_CALENDAR_EMAIL@gmail.com'; // your Google Calendar email
var OWNER_PHONE  = '+15145039296';   // your phone — receives SMS for every new booking
var TWILIO_SID   = 'YOUR_TWILIO_ACCOUNT_SID';
var TWILIO_TOKEN = 'YOUR_TWILIO_AUTH_TOKEN';
var TWILIO_FROM  = 'YOUR_TWILIO_PHONE_NUMBER'; // format: +18005551234
// ────────────────────────────────────────────────────────────────────

/**
 * Receives booking form data, creates a Google Calendar event,
 * and sends SMS notifications via Twilio.
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Build start/end times
    var start = parseDateTime(data.date, data.time);
    var end   = new Date(start.getTime() + estimateDuration(data.service) * 60 * 1000);

    // Calendar event title and description
    var serviceName = data.service.replace(/\s*\(.*\)/, '').trim();
    var title = 'AD Detailing – ' + serviceName + ' – ' + data.firstName + ' ' + data.lastName;
    var description =
      'CLIENT: '   + data.firstName + ' ' + data.lastName + '\n' +
      'PHONE: '    + data.phone    + '\n' +
      'VEHICLE: '  + data.car      + '\n' +
      'SERVICE: '  + data.service  + '\n' +
      'ADD-ONS: '  + data.addons   + '\n' +
      'COMMENTS: ' + data.comments + '\n\n' +
      'Booked via website';

    // Create the calendar event
    var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) throw new Error('Calendar not found — check CALENDAR_ID');
    calendar.createEvent(title, start, end, { description: description });

    // Format date for SMS
    var dateLabel = formatDateSMS(start);

    // SMS to client — confirmation
    sendSMS(
      data.phone,
      'Hi ' + data.firstName + '! Your AD Detailing appointment (' + serviceName +
      ') is scheduled for ' + dateLabel + '. Need to reschedule? Call 514-503-9296. See you soon!'
    );

    // SMS to owner — new booking alert
    sendSMS(
      OWNER_PHONE,
      'NEW BOOKING\n' +
      data.firstName + ' ' + data.lastName + '\n' +
      'Phone: ' + data.phone + '\n' +
      'Car: ' + data.car + '\n' +
      'Service: ' + data.service + '\n' +
      (data.addons !== 'None' ? 'Add-ons: ' + data.addons + '\n' : '') +
      'When: ' + dateLabel
    );

    return json({ success: true });

  } catch (err) {
    Logger.log(err);
    return json({ success: false, error: err.message });
  }
}

/**
 * Daily trigger — sends 24h reminder SMS to every client with an appointment tomorrow.
 *
 * TO INSTALL: In Apps Script editor → Triggers (clock icon) → Add Trigger:
 *   Function: send24hReminders | Event source: Time-driven | Type: Day timer | Time: 9–10 AM
 */
function send24hReminders() {
  var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var dayStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0);
  var dayEnd   = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59);

  var events = calendar.getEvents(dayStart, dayEnd);
  events.forEach(function(event) {
    if (!event.getTitle().startsWith('AD Detailing')) return;

    var desc  = event.getDescription();
    var phone = (desc.match(/PHONE:\s*([^\n]+)/) || [])[1];
    var fname = (desc.match(/CLIENT:\s*(\S+)/)   || [])[1];
    if (!phone) return;

    sendSMS(
      phone.trim(),
      'Hi ' + (fname || 'there') + '! Reminder: Your AD Detailing appointment is tomorrow – ' +
      formatDateSMS(event.getStartTime()) +
      '. Need to reschedule? Call 514-503-9296.'
    );
  });
}

// ── HELPERS ─────────────────────────────────────────────────────────

function sendSMS(to, body) {
  if (!TWILIO_SID || TWILIO_SID === 'YOUR_TWILIO_ACCOUNT_SID') return;

  // Normalize to E.164 (+1XXXXXXXXXX for Canadian numbers)
  to = to.replace(/[\s\-\(\)\.]/g, '');
  if (to.length === 10)        to = '+1' + to;
  else if (to.charAt(0) !== '+') to = '+' + to;

  UrlFetchApp.fetch(
    'https://api.twilio.com/2010-04-01/Accounts/' + TWILIO_SID + '/Messages.json',
    {
      method: 'post',
      payload: { To: to, From: TWILIO_FROM, Body: body },
      headers: { Authorization: 'Basic ' + Utilities.base64Encode(TWILIO_SID + ':' + TWILIO_TOKEN) },
      muteHttpExceptions: true
    }
  );
}

function parseDateTime(dateStr, timeStr) {
  var d = dateStr.split('-');
  var t = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  var h = parseInt(t[1], 10), m = parseInt(t[2], 10);
  if (t[3].toUpperCase() === 'PM' && h !== 12) h += 12;
  if (t[3].toUpperCase() === 'AM' && h === 12) h = 0;
  return new Date(+d[0], +d[1] - 1, +d[2], h, m, 0);
}

function formatDateSMS(date) {
  var DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var h = date.getHours(), m = date.getMinutes();
  var ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return DAYS[date.getDay()] + ' ' + MONTHS[date.getMonth()] + ' ' + date.getDate() +
    ' at ' + h + ':' + ('0' + m).slice(-2) + ' ' + ampm;
}

function estimateDuration(service) {
  // Returns estimated minutes per service
  if (/5-Year Ceramic|2-Year Ceramic/i.test(service)) return 720;
  if (/Paint Correction/i.test(service))               return 240;
  if (/Full Detail/i.test(service))                    return 210;
  if (/Interior/i.test(service))                       return 150;
  if (/Exterior/i.test(service))                       return 120;
  return 120;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
