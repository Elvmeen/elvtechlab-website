const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;
const MESSAGES_FILE = 'messages.json';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'i.elameenu@gmail.com';

// Parse form data with bracket notation support
app.use(express.urlencoded({ extended: true, parameterLimit: 100, limit: '50mb' }));
app.use(express.json());
app.use(express.static('.'));

async function sendEmail(name, email, message, phone) {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_SERVICE || !process.env.EMAIL_FROM || !process.env.EMAIL_PASSWORD) {
      console.log('⚠️ Email not configured. Skipping email send.');
      return;
    }

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const emailContent = `New message from Elv Tech Lab:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}\n\nSent: ${new Date().toISOString()}`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: `New Contact Form Submission: ${name}`,
      text: emailContent,
      replyTo: email
    });
    console.log(`📧 Email sent to ${ADMIN_EMAIL}`);
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
