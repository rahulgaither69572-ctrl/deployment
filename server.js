/**
 * Production SMTP Server for otp.cyberdefence.org.in
 * Deploy on Hostinger VPS or Node.js hosting
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting configuration
const rateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.RATE_LIMIT_MAX_PER_HOUR) || 3,
  duration: 3600,
});

const dailyRateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.RATE_LIMIT_MAX_PER_DAY) || 10,
  duration: 86400,
});

// CORS - Allow your Flutter app domains
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://yourapp.com',
  'capacitor://localhost',
  'http://localhost'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Create Nodemailer transporter with Hostinger SMTP
const createTransporter = () => {
  const port = parseInt(process.env.SMTP_PORT) || 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

const verifySMTPConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('SMTP server is ready');
    return true;
  } catch (error) {
    console.error('SMTP connection failed:', error.message);
    return false;
  }
};

const generateEmailTemplate = (otp, purpose, name = '') => {
  const purposeTexts = {
    'registration': 'Complete Your Registration',
    'forgot-password': 'Reset Your Password',
    'login': 'Login Verification',
    'verification': 'Email Verification'
  };

  const title = purposeTexts[purpose] || 'Verification Code';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>OTP Verification</title>
      <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; }
        .header p { color: #e0e0e0; margin: 10px 0 0 0; font-size: 14px; }
        .content { padding: 40px 30px; }
        .title { font-size: 20px; font-weight: bold; color: #333333; margin-bottom: 20px; }
        .message { color: #666666; line-height: 1.6; margin-bottom: 20px; }
        .otp-container { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0; }
        .otp-label { color: #e0e0e0; font-size: 14px; margin-bottom: 10px; }
        .otp-code { color: #ffffff; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace; }
        .otp-expiry { color: #e0e0e0; font-size: 12px; margin-top: 10px; }
        .security-notice { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; font-size: 13px; color: #856404; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
        .footer a { color: #667eea; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>CYBER DEFENCE</h1>
          <p>Money Management Application</p>
        </div>
        <div class="content">
          <div class="title">${title}</div>
          <div class="message">
            ${name ? `Dear ${name},` : 'Hello,'}
            <br><br>
            You requested a verification code. Please use the following One-Time Password (OTP) to complete your request:
          </div>
          <div class="otp-container">
            <div class="otp-label">YOUR VERIFICATION CODE</div>
            <div class="otp-code">${otp}</div>
            <div class="otp-expiry">Valid for 10 minutes</div>
          </div>
          <div class="security-notice">
            <strong>⚠ Security Notice:</strong><br>
            Never share this OTP with anyone. Our team will never ask for your OTP.
            If you didn't request this code, please ignore this email.
          </div>
          <div class="message">
            If you have any questions or need assistance, please don't hesitate to contact us.
            <br><br>
            Best regards,<br>
            The Cyber Defence Team
          </div>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply directly.</p>
          <p>© 2025 Cyber Defence. All rights reserved.</p>
          <p><a href="mailto:support@cyberdefence.org.in">support@cyberdefence.org.in</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Cyber Defence SMTP Server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Main send-otp endpoint
app.post('/send-otp', async (req, res) => {
  try {
    const { email, purpose = 'registration', name = '', development_mode = false, otp: providedOtp } = req.body;

    // Validate email
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_EMAIL',
        message: 'Please provide a valid email address'
      });
    }

    // Check rate limits
    try {
      await rateLimiter.consume(email);
      await dailyRateLimiter.consume(email);
    } catch (rej) {
      const remainingTime = Math.ceil(rej.msBeforeNext / 1000);
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many OTP requests. Please try again later.',
        retryAfter: remainingTime
      });
    }

    // Generate OTP or use provided
    const otp = providedOtp || generateOTP();

    // Development mode
    if (development_mode && process.env.NODE_ENV === 'development') {
      console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
      return res.json({
        success: true,
        message: 'OTP generated (development mode)',
        otp_code: otp,
        development: true
      });
    }

    // Send email
    const transporter = createTransporter();
    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: `Your OTP Code - ${purpose.charAt(0).toUpperCase() + purpose.slice(1)}`,
      html: generateEmailTemplate(otp, purpose, name),
      text: `Your OTP Code is: ${otp}\n\nThis code is valid for 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\n- Cyber Defence Team`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}: ${info.messageId}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      error: 'SEND_FAILED',
      message: 'Failed to send OTP. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Test SMTP
app.post('/test-smtp', async (req, res) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    res.json({
      success: true,
      message: 'SMTP connection successful',
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'SMTP_CONNECTION_FAILED',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log('='.repeat(60));
  console.log('Cyber Defence SMTP Server - Production');
  console.log('='.repeat(60));
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  await verifySMTPConnection();
  console.log('Endpoints:');
  console.log(`  POST /send-otp  - Send OTP email`);
  console.log(`  POST /test-smtp - Test SMTP connection`);
  console.log(`  GET  /health    - Health check`);
  console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  process.exit(0);
});
