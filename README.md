# Production SMTP Server - Deployment Guide

## Deploy on otp.cyberdefence.org.in

### Option 1: Hostinger VPS (Recommended)

1. **Upload files to server:**
   ```bash
   scp -r deployment/otp-server/* user@otp.cyberdefence.org.in:/var/www/
   ```

2. **SSH into server:**
   ```bash
   ssh user@otp.cyberdefence.org.in
   cd /var/www
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Setup PM2 for process management:**
   ```bash
   npm install -g pm2
   pm2 start server.js --name otp-server
   pm2 save
   pm2 startup
   ```

5. **Setup Nginx reverse proxy:**
   ```nginx
   server {
       listen 80;
       server_name otp.cyberdefence.org.in;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Option 2: Railway.app (Easiest)

1. **Create account on railway.app**
2. **Create new project → Deploy from GitHub**
3. **Upload deployment/otp-server folder as GitHub repo**
4. **Add environment variables in Railway dashboard:**
   - `SMTP_HOST=smtp.hostinger.com`
   - `SMTP_PORT=465`
   - `SMTP_USER=otp@cyberdefence.org.in`
   - `SMTP_PASSWORD=Amitkumarn9@@`
   - `FROM_EMAIL=otp@cyberdefence.org.in`
   - `FROM_NAME=Cyber Defence`

5. **Railway will provide URL like: https://otp-server.railway.app**
6. **Add CNAME record in Hostinger DNS:**
   - Name: otp
   - Type: CNAME
   - Target: otp-server.railway.app

### Option 3: Render.com

1. **Create account on render.com**
2. **New → Web Service**
3. **Connect GitHub repo**
4. **Build Command:** `npm install`
5. **Start Command:** `node server.js`
6. **Add environment variables**
7. **Get URL and setup CNAME**

### Option 4: Hostinger Shared Hosting (Node.js)

1. **Upload all files to public_html/otp-subdomain**
2. **Setup in Hostinger hPanel:**
   - Select Node.js App
   - Point to /public_html/otp-subdomain
   - Run `npm install`
3. **Use .htaccess for routing** (if needed)

## After Deployment

1. **Test the server:**
   ```bash
   curl https://otp.cyberdefence.org.in/health
   ```

2. **Test SMTP:**
   ```bash
   curl -X POST https://otp.cyberdefence.org.in/test-smtp
   ```

3. **Test OTP sending:**
   ```bash
   curl -X POST https://otp.cyberdefence.org.in/send-otp \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","purpose":"registration"}'
   ```

## Update Flutter App

In `lib/services/email_service.dart`, change:

```dart
static const String _smtpServerUrl = 'http://localhost:3020';
```

To:

```dart
static const String _smtpServerUrl = 'https://otp.cyberdefence.org.in';
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `SMTP_HOST` | SMTP server host | smtp.hostinger.com |
| `SMTP_PORT` | SMTP port (465 for SSL, 587 for TLS) | 465 |
| `SMTP_USER` | SMTP username | - |
| `SMTP_PASSWORD` | SMTP password | - |
| `FROM_EMAIL` | From email address | - |
| `FROM_NAME` | From display name | Cyber Defence |
| `RATE_LIMIT_MAX_PER_HOUR` | OTP requests per hour | 3 |
| `RATE_LIMIT_MAX_PER_DAY` | OTP requests per day | 10 |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma separated) | - |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/send-otp` | Send OTP email |
| POST | `/test-smtp` | Test SMTP connection |

### Send OTP Request Body

```json
{
  "email": "user@example.com",
  "purpose": "registration",
  "name": "John Doe",
  "development_mode": false
}
```

### Send OTP Response

```json
{
  "success": true,
  "message": "OTP sent successfully",
  "timestamp": "2025-01-03T12:00:00.000Z"
}
```

## Troubleshooting

### Port 465 blocked?
- Try port 587 with STARTTLS
- Set `SMTP_PORT=587`

### CORS errors?
- Add your domain to `ALLOWED_ORIGINS`

### Emails not sending?
- Check SMTP credentials in Hostinger
- Verify firewall allows SMTP traffic
- Check server logs: `pm2 logs otp-server`
