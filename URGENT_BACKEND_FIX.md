# 🚨 URGENT: Backend CORS Fix Required

## The Problem
Your frontend is deployed and working, but the **backend is rejecting all requests** due to CORS policy.

**Error Message:**
```
Access to XMLHttpRequest at 'https://hedera-ramp.onrender.com/api/public/stats' 
from origin 'https://hedera-ramp.vercel.app' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ The Fix (2 Minutes)

### Step 1: Go to Render Dashboard
1. Open: https://dashboard.render.com
2. Log in to your account
3. Find your backend service (likely named `hedera-ramp-backend` or similar)

### Step 2: Add Environment Variable
1. Click on your backend service
2. Click "Environment" in the left sidebar
3. Click "Add Environment Variable"
4. Add the following:
   - **Key:** `CORS_ORIGINS`
   - **Value:** `https://hedera-ramp.vercel.app,https://hedera-ramp-hub.vercel.app,http://localhost:5173,http://localhost:3000,http://localhost:8080`
5. Click "Save Changes"

### Step 3: Wait for Automatic Redeploy
- Render will automatically redeploy your backend (takes 2-3 minutes)
- Watch the logs to ensure deployment succeeds
- Look for: "Deploy live"

## How to Verify It's Fixed

### Option 1: Check Browser Console
1. Go to https://hedera-ramp.vercel.app
2. Open browser console (F12)
3. Refresh the page
4. You should see stats loading without CORS errors

### Option 2: Test API Directly
Run this in your terminal:
```bash
curl -H "Origin: https://hedera-ramp.vercel.app" -v https://hedera-ramp.onrender.com/api/public/stats
```

**Expected Response Headers:**
```
Access-Control-Allow-Origin: https://hedera-ramp.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

## Alternative Method (If Environment Variable Doesn't Work)

### Use Render's Blueprint
1. Go to your backend service on Render
2. Click "Manual Deploy" → "Clear build cache & deploy"
3. This will pick up the `render.yaml` file that already has the CORS configuration

## What Happens After Fix

✅ Landing page will load stats correctly
✅ Charts will display transaction data
✅ Recent transactions will show
✅ Wallet connect will attempt to work (separate issue to fix after)
✅ No more CORS errors in console

## Current Status

- ✅ Frontend deployed successfully
- ✅ Frontend using correct backend URL
- ✅ Error handling working
- ❌ **Backend CORS blocking requests** ← YOU ARE HERE
- ⏳ Wallet connection has a separate issue (will fix after CORS)

---

**DO THIS NOW** - Without this fix, the entire application is unusable in production.

