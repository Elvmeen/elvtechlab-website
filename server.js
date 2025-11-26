const express = require('express');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 5000;
const MESSAGES_FILE = 'messages.json';
const ADMIN_EMAIL = 'i.elameenu@gmail.com';

// Parse form data with bracket notation support
app.use(express.urlencoded({ extended: true, parameterLimit: 100, limit: '50mb' }));
app.use(express.json());
app.use(express.static('.'));

async function getGmailClient() {
  try {
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY 
      ? 'repl ' + process.env.REPL_IDENTITY 
      : process.env.WEB_REPL_RENEWAL 
      ? 'depl ' + process.env.WEB_REPL_RENEWAL 
      : null;

    if (!xReplitToken) return null;

    const response = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
      { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken } }
    );
    
    const data = await response.json();
    const connectionSettings = data.items?.[0];
    const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;
    if (!accessToken) return null;

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    return google.gmail({ version: 'v1', auth: oauth2Client });
  } catch (err) {
    return null;
  }
}

async function sendEmail(name, email, message, phone) {
  try {
    const gmailClient = await getGmailClient();
    if (!gmailClient) return;

    const emailContent = `New message from Elv Tech Lab:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}\n\nSent: ${new Date().toISOString()}`;
    const base64Message = Buffer.from(`Subject: New Contact: ${name}\nTo: ${ADMIN_EMAIL}\n\n${emailContent}`).toString('base64');

    await gmailClient.users.messages.send({
      userId: 'me',
      requestBody: { raw: base64Message }
    });
    console.log(`📧 Email sent`);
  } catch (err) {
    console.error('Email failed:', err.message);
  }
}

function loadMessages() {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
    }
  } catch (err) {}
  return [];
}

function saveMessages(messages) {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
  } catch (err) {}
}

app.post('/submit-message', async (req, res) => {
  try {
    // Express with extended:true should parse form_fields[name] into req.body.form_fields.name
    const ff = req.body.form_fields;
    
    // Handle if it's an object (correct parsing) or if it's an array (alternative parsing)
    let formData = ff;
    if (Array.isArray(ff)) {
      formData = ff[0] || {};
    }
    
    const name = (formData?.name || '').toString().trim();
    const email = (formData?.email || '').toString().trim();
    const phone = (formData?.field_6046966 || '').toString().trim();
    const message = (formData?.message || '').toString().trim();

    console.log('Form data:', { name, email, message });

    if (!name || !email || !message) {
      console.log('Missing fields. Body:', JSON.stringify(req.body).substring(0, 200));
      return res.json({ success: false, error: 'Name, Email, and Message required' });
    }

    const msg = {
      id: loadMessages().length + 1,
      name, email, phone, message,
      timestamp: new Date().toISOString()
    };

    const messages = loadMessages();
    messages.push(msg);
    saveMessages(messages);

    console.log(`✅ Message saved`);
    await sendEmail(name, email, message, phone);

    res.json({ success: true, message: 'Thank you! We will reply soon.' });
  } catch (err) {
    console.error('Error:', err.message);
    res.json({ success: false, error: err.message });
  }
});

app.get('/api/messages', (req, res) => {
  res.json(loadMessages());
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((req, res) => {
  const filePath = path.join(__dirname, req.path);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server on ${PORT}`);
});
