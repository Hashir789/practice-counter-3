# CORS Error Explanation and Solution

## What is CORS?

**CORS (Cross-Origin Resource Sharing)** is a browser security feature that blocks requests from one origin (domain) to another unless the server explicitly allows it.

### The Error You're Seeing

```
Access to fetch at 'https://d1tdizimiz2qsf.cloudfront.net/api/health' 
from origin 'http://localhost:5173' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**What this means:**
- Your frontend is running on `http://localhost:5173` (local development)
- Your backend is at `https://d1tdizimiz2qsf.cloudfront.net` (different origin)
- The browser blocks this request because it's a "cross-origin" request
- The backend server isn't sending the required CORS headers

## Solutions

### ✅ Solution 1: Vite Proxy (Recommended for Development)

**What we did:**
- Configured Vite to proxy `/api` requests to your backend
- In development, requests go: `http://localhost:5173/api/health` → Vite proxy → `https://d1tdizimiz2qsf.cloudfront.net/api/health`
- Browser sees same-origin requests (no CORS issue)

**How it works:**
```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'https://d1tdizimiz2qsf.cloudfront.net',
      changeOrigin: true,
      secure: true,
      ws: true, // Also handles WebSocket connections
    },
  },
}
```

**Benefits:**
- ✅ No CORS issues in development
- ✅ Works automatically
- ✅ No backend changes needed
- ✅ WebSocket support included

### Solution 2: Backend CORS Configuration (For Production)

**If you control the backend**, you should configure it to allow CORS:

```javascript
// Example Express.js CORS configuration
const cors = require('cors');
app.use(cors({
  origin: [
    'http://localhost:5173',           // Development
    'https://your-production-domain.com' // Production
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Solution 3: Browser Extension (Not Recommended)

You could disable CORS in your browser, but this is:
- ❌ Not secure
- ❌ Only works for you
- ❌ Won't work for other developers
- ❌ Won't work in production

## Current Setup

### Development Mode
- ✅ Uses Vite proxy (`/api` → backend)
- ✅ No CORS issues
- ✅ WebSocket proxying enabled

### Production Mode
- Uses direct backend URL
- Requires backend to have CORS configured
- Or deploy frontend and backend on same domain

## Testing

1. **Restart your dev server** after the proxy configuration:
   ```bash
   npm run dev
   ```

2. **Check the Network tab** - you should see:
   - Requests going to `http://localhost:5173/api/health` (not the CloudFront URL)
   - Status 200 (success)
   - No CORS errors

3. **WebSocket connections** should also work via the proxy

## Troubleshooting

### Still seeing CORS errors?

1. **Restart the dev server** - Vite config changes require restart
2. **Clear browser cache** - Sometimes cached errors persist
3. **Check Network tab** - Verify requests are going to `/api` not the full URL
4. **Check console** - Look for any proxy-related errors

### WebSocket still not connecting?

1. **Verify backend supports WebSocket** - Not all servers support WS upgrades
2. **Check WebSocket URL** - Should be `ws://localhost:5173/api` in development
3. **Check backend logs** - See if connection attempts are reaching the server

## Summary

✅ **Fixed**: Development uses Vite proxy (no CORS issues)
⚠️ **Production**: Backend needs CORS headers OR deploy on same domain
✅ **WebSocket**: Proxy configured for WebSocket connections

The proxy solution is the standard approach for development. For production, you'll need proper CORS configuration on your backend server.

