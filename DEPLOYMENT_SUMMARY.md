# Production Deployment Summary

## Files Ready for Hostinger

All files are in `deployment/otp-server/` directory.

### Upload to Hostinger

**Files to upload to otp.cyberdefence.org.in:**

```
deployment/otp-server/
├── server.js              # Main server file
├── package.json           # Dependencies
├── ecosystem.config.json  # PM2 configuration
├── .env                   # Environment variables (IMPORTANT!)
├── .gitignore
└── README.md              # Deployment instructions
```

## Deployment Options

### Option 1: Railway.app (RECOMMENDED - Easiest)

**Steps:**
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Create a new GitHub repo with `deployment/otp-server` files
4. Connect your GitHub repo to Railway
5. Add environment variables:
   ```
   SMTP_HOST=smtp.hostinger.com
   SMTP_PORT=465
   SMTP_USER=otp@cyberdefence.org.in
   SMTP_PASSWORD=Amitkumarn9@@
   FROM_EMAIL=otp@cyberdefence.org.in
   FROM_NAME=Cyber Defence
   ALLOWED_ORIGINS=capacitor://localhost,http://localhost
   ```
6. Railway will give you a URL like: `https://otp-server.railway.app`

**Setup Domain:**
1. Go to Hostinger DNS Manager
2. Add CNAME record:
   - **Name:** otp
   - **Type:** CNAME
   - **Target:** otp-server.railway.app
   - **TTL:** 3600

3. In Railway dashboard:
   - Go to Settings → Domains
   - Add custom domain: `otp.cyberdefence.org.in`

### Option 2: Render.com

**Steps:**
1. Go to https://render.com
2. Click "New" → "Web Service"
3. Connect GitHub repo
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Add same environment variables as above
6. Get URL and setup CNAME in Hostinger DNS

### Option 3: Hostinger VPS

**Steps:**
1. SSH into your VPS
2. Upload files to `/var/www/otp-server`
3. Run commands:
   ```bash
   cd /var/www/otp-server
   npm install
   npm install -g pm2
   pm2 start server.js --name otp-server
   pm2 save
   pm2 startup
   ```

4. Setup Nginx reverse proxy (if needed)

## After Deployment

### Test the server:

```bash
# Health check
curl https://otp.cyberdefence.org.in/health

# Test SMTP
curl -X POST https://otp.cyberdefence.org.in/test-smtp

# Test OTP sending
curl -X POST https://otp.cyberdefence.org.in/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "purpose": "registration"
  }'
```

### Flutter App Update

**File:** `lib/services/email_service.dart` (Already updated!)

```dart
static const String _smtpServerUrl = 'https://otp.cyberdefence.org.in';
```

## Important Notes

1. **Security:**
   - Never share `.env` file
   - Keep SMTP password secure
   - Enable rate limiting

2. **Rate Limiting:**
   - 3 OTPs per hour per email
   - 10 OTPs per day per email
   - 2 minutes cooldown between requests

3. **CORS:**
   - Add your app's domain to `ALLOWED_ORIGINS`
   - For mobile apps: `capacitor://localhost`

4. **Monitoring:**
   - Check server logs: `pm2 logs otp-server`
   - Monitor email delivery

## Troubleshooting

### Emails not sending:
- Verify SMTP credentials in Hostinger
- Check if port 465 is open
- Review server logs

### CORS errors:
- Add your domain to `ALLOWED_ORIGINS`
- Check if using HTTPS

### Rate limiting issues:
- Adjust `RATE_LIMIT_MAX_PER_HOUR` and `RATE_LIMIT_MAX_PER_DAY`
- Clear rate limit tracker

## Current Status

✅ Production files created
✅ Flutter app updated to use production URL
✅ Ready to deploy to otp.cyberdefence.org.in

**Next Step:** Deploy to Railway.app or Render.com, then setup CNAME in Hostinger DNS.
