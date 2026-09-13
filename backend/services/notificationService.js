// services/notificationService.js — Enterprise Healthcare Notification Service with iCalendar (.ics) Attachment
const nodemailer = require('nodemailer');

/* ─── Mail Transporter ─── */
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  Email not configured — set SMTP_USER and SMTP_PASS in .env');
    return null;
  }
  transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls:    { rejectUnauthorized: false },
  });
  return transporter;
}

/** 12-Hour Time Format Helper (e.g. "14:00" -> "2:00 PM") */
function format12Hour(timeStr) {
  if (!timeStr) return '';
  if (typeof timeStr === 'string' && timeStr.includes(':')) {
    const parts = timeStr.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].slice(0, 2);
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  }
  return timeStr;
}

/** Generates iCalendar (.ics) event string for Google / Apple / Outlook Calendar integration */
function generateICSCalendarFile(createdMedicines, user) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const events = [];

  createdMedicines.forEach((c, idx) => {
    const med = c.medicine || c;
    const times = c.reminderTimes || med.times || ['08:00'];
    const durationDays = c.durationDays || 30;

    times.forEach((tStr, tIdx) => {
      const [h, min] = tStr.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(h || 8, min || 0, 0, 0);

      const dtStart = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endDate = new Date(startDate.getTime() + 15 * 60 * 1000); // 15 min duration
      const dtEnd = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      const summary = `Take ${med.name} (${med.dosage || '1'} ${med.unit || 'tablets'})`;
      const description = `CareSphere AI Medicine Schedule\\nMedication: ${med.name}\\nDose: ${med.dosage || '1'} ${med.unit || 'tablets'}\\nInstructions: ${med.instructions || 'Take as scheduled'}\\nFrequency: ${med.frequency || 'Daily'}`;
      const uid = `med-${med._id || idx}-${tIdx}-${Date.now()}@caresphere.ai`;

      events.push(`BEGIN:VEVENT
UID:${uid}
DTSTAMP:${timestamp}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${summary}
DESCRIPTION:${description}
RRULE:FREQ=DAILY;COUNT=${durationDays}
BEGIN:VALARM
TRIGGER:-PT10M
ACTION:DISPLAY
DESCRIPTION:Reminder: ${summary}
END:VALARM
END:VEVENT`);
    });
  });

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CareSphere AI//Medicine Schedule//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
${events.join('\n')}
END:VCALENDAR`.replace(/\r?\n/g, '\r\n');
}

/* ─── Professional Enterprise Email Master Template ─── */
function emailTemplate(title, body, accentColor = '#2563eb', footerNote = '') {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      margin: 0;
      padding: 30px 12px;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .brand-header {
      background-color: #0f172a;
      padding: 24px 32px;
      border-bottom: 3px solid ${accentColor};
    }
    .brand-title {
      color: #ffffff;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin: 0;
      text-transform: uppercase;
    }
    .brand-subtitle {
      color: #94a3b8;
      font-size: 12px;
      margin-top: 4px;
      font-weight: 500;
    }
    .content-body {
      padding: 32px;
      font-size: 14px;
      line-height: 1.6;
      color: #334155;
    }
    .page-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 16px 0;
      letter-spacing: -0.2px;
    }
    .info-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px 20px;
      margin: 20px 0;
    }
    .alert-card {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 4px solid #dc2626;
      border-radius: 6px;
      padding: 16px 20px;
      margin: 20px 0;
      color: #991b1b;
    }
    .success-card {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-left: 4px solid #16a34a;
      border-radius: 6px;
      padding: 16px 20px;
      margin: 20px 0;
      color: #166534;
    }
    .table-container {
      width: 100%;
      margin: 20px 0;
      border-collapse: collapse;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    .table-container th {
      background-color: #f8fafc;
      color: #475569;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 14px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    .table-container td {
      padding: 12px 14px;
      font-size: 13px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .footer-bar {
      background-color: #f8fafc;
      padding: 20px 32px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
      text-align: center;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="brand-header">
      <div class="brand-title">CareSphere AI</div>
      <div class="brand-subtitle">Clinical Telemetry & Patient Engagement Platform</div>
    </div>
    <div class="content-body">
      <h1 class="page-title">${title}</h1>
      ${body}
    </div>
    <div class="footer-bar">
      ${footerNote ? footerNote : `CareSphere AI Platform · Confidential Medical Notification<br/>This is an automated system notification.`}
    </div>
  </div>
</body>
</html>`;
}

/* ─── Send Email Core with Attachment Support ─── */
async function sendEmail({ to, subject, html, text, attachments }) {
  const t = getTransporter();
  if (!t) return { success: false, error: 'Email server not configured' };
  try {
    const mailOptions = {
      from: `"CareSphere Platform" <${process.env.SMTP_USER}>`,
      to, subject, html, text: text || subject,
    };
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    const info = await t.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Email send failure:', err.message);
    return { success: false, error: err.message };
  }
}

/* ─── Medicine Reminder Email ─── */
async function sendMedicineReminder(user, medicine, scheduledTime) {
  const timeStr = format12Hour(new Date(scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const html = emailTemplate(
    'Medication Dose Scheduled',
    `<p>Dear <strong>${user.name}</strong>,</p>
     <p>You have a scheduled medication dose due for administration.</p>
     <div class="info-card">
       <div style="font-weight: 700; font-size: 15px; color: #0f172a; margin-bottom: 8px;">${medicine.name}</div>
       <table style="width:100%; border:none;">
         <tr><td style="border:none; padding:4px 0; color:#64748b; width:120px;">Dosage:</td><td style="border:none; padding:4px 0; font-weight:600;">${medicine.dosage} ${medicine.unit}</td></tr>
         <tr><td style="border:none; padding:4px 0; color:#64748b;">Scheduled Time:</td><td style="border:none; padding:4px 0; font-weight:600;">${timeStr}</td></tr>
         <tr><td style="border:none; padding:4px 0; color:#64748b;">Instructions:</td><td style="border:none; padding:4px 0;">${medicine.instructions || 'Standard administration'}</td></tr>
       </table>
     </div>
     <p style="font-size:13px; color:#64748b;">Please confirm administration in the CareSphere application.</p>`,
    '#2563eb'
  );

  const singleMedSchedule = [{ medicine, reminderTimes: [new Date(scheduledTime).toTimeString().slice(0,5)], durationDays: 1 }];
  const icsContent = generateICSCalendarFile(singleMedSchedule, user);

  return sendEmail({
    to: user.email,
    subject: `Medication Reminder: ${medicine.name} (${timeStr}) — CareSphere`,
    html,
    attachments: [
      {
        filename: `${medicine.name.replace(/\s+/g, '_')}_reminder.ics`,
        content: icsContent,
        contentType: 'text/calendar; method=REQUEST; charset=UTF-8',
      }
    ]
  });
}

/* ─── Prescription / Bill Confirmation Email with .ics Calendar Event Attachment ─── */
async function sendPrescriptionConfirmation(user, { created, extracted }) {
  const medicineRows = created.map(c => `
    <tr>
      <td style="font-weight:600;">${c.medicine.name}</td>
      <td>${c.medicine.dosage} ${c.medicine.unit}</td>
      <td>${c.medicine.frequency}</td>
      <td>${(c.reminderTimes || []).map(format12Hour).join(', ')}</td>
      <td>${c.durationDays} days</td>
      <td style="color:#16a34a; font-weight:600;">${c.remindersCreated} scheduled</td>
    </tr>`).join('');

  const totalReminders = created.reduce((s, c) => s + c.remindersCreated, 0);

  const html = emailTemplate(
    'Medicine Schedule Configured',
    `<p>Dear <strong>${user.name}</strong>,</p>
     <p>Your medication bill/receipt has been processed and schedules have been configured.</p>
     <div class="success-card">
       <strong>Configuration Summary:</strong> ${created.length} medication(s) configured · ${totalReminders} automated reminders active.<br/>
       📅 <strong>Calendar Event Included:</strong> An <code>.ics</code> calendar event file is attached to this email so you can add all dosage times directly to Google Calendar, Apple Calendar, or Outlook.
     </div>
     <table class="table-container">
       <thead>
         <tr>
           <th>Medication</th>
           <th>Dosage</th>
           <th>Frequency</th>
           <th>Times (12h)</th>
           <th>Duration</th>
           <th>Reminders</th>
         </tr>
       </thead>
       <tbody>${medicineRows}</tbody>
     </table>
     <p style="font-size:12px; color:#64748b;">Open the attached <strong>medicine_schedule.ics</strong> file to add these reminders to your calendar app.</p>`,
    '#2563eb'
  );

  const icsContent = generateICSCalendarFile(created, user);

  return sendEmail({
    to:      user.email,
    subject: `Medicine Schedule Created: ${created.length} Medication(s) — CareSphere`,
    html,
    attachments: [
      {
        filename: 'medicine_schedule.ics',
        content: icsContent,
        contentType: 'text/calendar; method=REQUEST; charset=UTF-8',
      }
    ]
  });
}

/* ─── SOS Emergency Email ─── */
async function sendSOSEmail({ patient, contact, location, message }) {
  const locationStr = location
    ? `Lat: ${location.lat?.toFixed(4)}, Lng: ${location.lng?.toFixed(4)}`
    : 'Location coordinates unavailable';
  const mapsLink = location
    ? `https://maps.google.com/?q=${location.lat},${location.lng}`
    : null;

  const html = emailTemplate(
    'CRITICAL EMERGENCY ALERT (SOS)',
    `<div class="alert-card">
       <div style="font-weight:700; font-size:15px; margin-bottom:4px;">URGENT DISPATCH NOTIFICATION</div>
       Patient <strong>${patient.name}</strong> has triggered an emergency SOS distress alert. Immediate response required.
     </div>
     <p>Dear <strong>${contact.name}</strong>,</p>
     <p>The patient listed below has signaled an urgent requirement for assistance.</p>
     <table class="table-container">
       <tr><th>Patient Name</th><td><strong>${patient.name}</strong></td></tr>
       <tr><th>Contact Phone</th><td>${patient.phone || 'Not recorded'}</td></tr>
       <tr><th>GPS Location</th><td>${locationStr}</td></tr>
       <tr><th>Blood Group</th><td>${patient.bloodGroup || 'Not specified'}</td></tr>
       <tr><th>Medical Conditions</th><td>${patient.medicalConditions?.join(', ') || 'None listed'}</td></tr>
       <tr><th>Known Allergies</th><td>${patient.allergies?.join(', ') || 'None listed'}</td></tr>
       <tr><th>Dispatch Message</th><td>${message || 'Emergency assistance needed'}</td></tr>
       <tr><th>Timestamp</th><td>${new Date().toUTCString()}</td></tr>
     </table>
     ${mapsLink ? `<a href="${mapsLink}" class="btn-action" style="background-color:#dc2626;">View GPS Location on Google Maps</a>` : ''}`,
    '#dc2626'
  );
  return sendEmail({
    to: contact.email,
    subject: `[URGENT] SOS EMERGENCY ALERT: ${patient.name}`,
    html,
  });
}

/* ─── AQI Warning Email ─── */
async function sendAQIAlert(user, aqiData) {
  const isHazardous = aqiData.aqi > 150;
  const html = emailTemplate(
    `Air Quality Telemetry Report — ${aqiData.city}`,
    `<p>Dear <strong>${user.name}</strong>,</p>
     <p>Environmental sensors report updated Air Quality Index (AQI) data for your location.</p>
     <div class="${isHazardous ? 'alert-card' : 'info-card'}">
       <div style="font-size:24px; font-weight:800; color:${isHazardous ? '#dc2626' : '#2563eb'}">AQI ${aqiData.aqi}</div>
       <div style="font-size:13px; font-weight:600; text-transform:uppercase; margin-top:2px;">Category: ${aqiData.category}</div>
       <div style="font-size:12px; margin-top:4px; color:#64748b;">Location: ${aqiData.city}</div>
     </div>
     <p style="font-weight:600; font-size:13px;">Clinical Recommendations:</p>
     <ul style="padding-left:20px; font-size:13px; color:#475569;">
       ${aqiData.recommendations.map(r => `<li style="margin-bottom:6px;">${r}</li>`).join('')}
     </ul>`,
    isHazardous ? '#dc2626' : '#2563eb'
  );
  return sendEmail({
    to: user.email,
    subject: `Environmental AQI Update: ${aqiData.city} (AQI ${aqiData.aqi})`,
    html,
  });
}

/* ─── Health Alert Email ─── */
async function sendHealthAlert(user, { title, message, severity = 'info', tips = [] }) {
  const colors = { danger: '#dc2626', warning: '#f59e0b', info: '#2563eb', success: '#16a34a' };
  const cardClass = severity === 'danger' ? 'alert-card' : severity === 'success' ? 'success-card' : 'info-card';
  const html = emailTemplate(
    title,
    `<p>Dear <strong>${user.name}</strong>,</p>
     <div class="${cardClass}">${message}</div>
     ${tips.length ? `<p style="font-weight:600; font-size:13px;">Recommended Guidance:</p><ul style="padding-left:20px; font-size:13px; color:#475569;">${tips.map(t => `<li style="margin-bottom:6px;">${t}</li>`).join('')}</ul>` : ''}`,
    colors[severity] || '#2563eb'
  );
  return sendEmail({ to: user.email, subject: `CareSphere Health Notice: ${title}`, html });
}

/* ─── Welcome Email ─── */
async function sendWelcomeEmail(user) {
  const html = emailTemplate(
    'Welcome to CareSphere AI',
    `<p>Dear <strong>${user.name}</strong>,</p>
     <p>Thank you for registering with <strong>CareSphere AI</strong>. Your account has been initialized and is ready for use.</p>
     <div class="success-card">
       Account initialization complete. You now have full access to the patient management suite.
     </div>`,
    '#2563eb'
  );
  return sendEmail({ to: user.email, subject: 'Welcome to CareSphere AI', html });
}

/* ─── Pathology Report Alert ─── */
async function sendPathologyAlert(user, analysis) {
  const abnormalCount = analysis.abnormalValues?.length || 0;
  const html = emailTemplate(
    'Pathology Analysis Summary',
    `<p>Dear <strong>${user.name}</strong>,</p>
     <p>Your pathology report has been processed through the CareSphere clinical analysis service.</p>
     ${abnormalCount > 0
       ? `<div class="alert-card"><strong>Notice:</strong> ${abnormalCount} value(s) deviate from standard reference ranges. Physician review is advised.</div>`
       : '<div class="success-card">All analyzed metrics fall within standard physiological reference ranges.</div>'
     }
     <p><strong>Clinical Summary:</strong></p>
     <div class="info-card">${analysis.summary}</div>`,
    abnormalCount > 0 ? '#dc2626' : '#16a34a'
  );
  return sendEmail({ to: user.email, subject: `Pathology Report Summary — CareSphere`, html });
}

module.exports = {
  sendEmail,
  sendMedicineReminder,
  sendSOSEmail,
  sendAQIAlert,
  sendHealthAlert,
  sendWelcomeEmail,
  sendPathologyAlert,
  sendPrescriptionConfirmation,
};
