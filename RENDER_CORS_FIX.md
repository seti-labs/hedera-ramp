# 🚨 URGENT: Fix Backend CORS on Render

## The Problem

Your backend is blocking requests from the deployed frontend:
```
Access to XMLHttpRequest at 'https://hedera-ramp.onrender.com/api/public/stats' 
from origin 'https://hedera-ramp.vercel.app' has been blocked by CORS policy
```

The `curl` test shows:
```
access-control-allow-origin: http://localhost:3000
```

This means the `CORS_ORIGINS` environment variable on Render is set to **ONLY** `http://localhost:3000`.

## The Solution (2 Minutes)

### Step 1: Go to Render Dashboard
1. Visit: https://dashboard.render.com
2. Find your backend service: **hedera-ramp-backend**
3. Click on it

### Step 2: Update CORS_ORIGINS Environment Variable
1. Click **"Environment"** tab (left sidebar)
2. Find the `CORS_ORIGINS` variable
3. Click **"Edit"** or add it if it doesn't exist
4. Set the value to:
   ```
   https://hedera-ramp.vercel.app,https://hedera-ramp-hub.vercel.app,http://localhost:5173,http://localhost:3000,http://localhost:8080
   ```
5. Click **"Save Changes"**

### Step 3: Redeploy
Render will **automatically redeploy** when you save the environment variable.

Wait 2-3 minutes for the deployment to complete.

### Step 4: Verify the Fix

After deployment completes, run this command:

```bash
curl -I https://hedera-ramp.onrender.com/api/health
```

Look for:
```
access-control-allow-origin: https://hedera-ramp.vercel.app
```

Or test the stats endpoint directly:
```bash
curl https://hedera-ramp.onrender.com/api/public/stats
```

You should see JSON data, not an HTML error page.

## Why This Happened

The `render.yaml` file has the correct CORS origins, but:
1. Render dashboard environment variables **override** `render.yaml` settings
2. Someone (or the initial setup) set `CORS_ORIGINS` to only `http://localhost:3000`
3. This needs to be manually updated in the dashboard

## After Fixing CORS

Once CORS is fixed, your frontend will:
- ✅ Load stats on the landing page
- ✅ Display charts with daily activity
- ✅ Show recent transactions
- ✅ Connect to HashPack wallet (after the Long.js polyfill deploys)

---

**🎯 Action Required**: Update `CORS_ORIGINS` in Render dashboard NOW.

The latest code with HashConnect fixes is already pushed and will deploy automatically to Vercel.

