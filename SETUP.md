# Hostel Hub - Setup Guide

## 🚀 Quick Start

### 1. Get Your Gemini API Key (Required for AI Features)

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key (starts with "AIzaSy...")

### 2. Configure Backend Environment

Edit `server/.env` and replace the placeholder:

```env
GEMINI_API_KEY=AIzaSy...your-actual-key-here
```

### 3. Configure Frontend Environment (Optional)

Edit `.env` in the root directory:

```env
GEMINI_API_KEY=AIzaSy...your-actual-key-here
```

### 4. Restart Servers

```bash
# Backend (if running)
cd server
npm run dev

# Frontend (if running)  
npm run dev
```

## ✅ Verification

Test AI features:

```bash
curl -X POST http://localhost:5001/api/search/ai-query \
  -H "Content-Type: application/json" \
  -d '{"query": "affordable hostel with WiFi"}'
```

If you see a response with `filters` and `hostels`, AI is working! ✨

## 📧 Optional: Email Configuration

For email verification and password recovery:

1. **Gmail Setup:**
   - Enable 2-Factor Authentication
   - Generate App Password: https://myaccount.google.com/apppasswords
   - Copy the 16-character password

2. **Update server/.env:**
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   FRONTEND_URL=http://localhost:3000
   ```

## 🎯 Current Configuration

Your `.env` files are already set up with:
- ✅ MongoDB Atlas connection
- ✅ JWT secret
- ✅ Port configuration
- ⚠️ Gemini API key (needs your key)
- ⚠️ Email (optional, commented out)

## 🔧 Troubleshooting

### AI Features Not Working?
- Check `GEMINI_API_KEY` is set in `server/.env`
- Restart the backend server
- Verify API key is valid at https://makersuite.google.com/app/apikey

### Email Not Sending?
- Verify Gmail App Password is correct
- Check EMAIL_USER and EMAIL_PASSWORD in `server/.env`
- Ensure 2FA is enabled on Gmail

## 🎉 You're All Set!

Once you add your Gemini API key, all features will work:
- ✅ Authentication & Authorization
- ✅ Property Management
- ✅ AI-Powered Search
- ✅ Recommendations
- ✅ Reviews & Ratings
