# RecycleMaster Deployment Troubleshooting

## Quick Debugging Steps

### 1. Check Browser Console (Most Important!)

Open the deployed site and press **F12** (or right-click → Inspect), then go to the **Console** tab.

**Common Errors:**

#### Error: "Failed to load module script"
```
Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/html"
```
**Solution:** This usually means the asset files aren't being found. Check:
- Coolify build logs to ensure build completed successfully
- Nginx is serving files correctly
- Assets are in the correct location

#### Error: "Uncaught TypeError: Cannot read properties of null"
```
Uncaught TypeError: Cannot read properties of null (reading 'root')
```
**Solution:** The root element isn't found. Check:
- index.html has `<div id="root"></div>`
- JavaScript is loading correctly

#### Error: "process.env.GEMINI_API_KEY is undefined"
**Solution:** API key not set during build
- Go to Coolify → Your App → Settings → Build Arguments
- Add: `GEMINI_API_KEY` with your actual key
- Rebuild the application

---

### 2. Check Coolify Deployment Logs

Go to: **Coolify Dashboard → Your App → Logs → Build Logs**

**Look for:**
- ✅ `npm run build` completed successfully
- ✅ `dist/` folder was created
- ✅ No errors during Docker build
- ❌ Any red error messages

**Common Build Errors:**

```bash
# Error: Missing dependencies
npm ERR! Cannot find module 'react'
```
**Solution:** Delete `node_modules` and rebuild (Coolify does this automatically)

```bash
# Error: Out of memory
FATAL ERROR: Reached heap limit Allocation failed
```
**Solution:** Increase build memory in Coolify settings

---

### 3. Check Coolify Runtime Logs

Go to: **Coolify Dashboard → Your App → Logs → Runtime Logs**

**Look for:**
- ✅ `nginx` started successfully
- ❌ Any error messages about missing files

---

### 4. Verify Environment Variables

**In Coolify:**
1. Go to your app settings
2. Check **Build Arguments** section
3. Ensure `GEMINI_API_KEY` is set

**Important:** The API key must be a **Build Argument**, not a runtime environment variable, because it's embedded during the build process.

---

### 5. Test Individual Files

Try accessing these URLs directly (replace `your-app-url` with your actual URL):

```
https://your-app-url/                    → Should show the app
https://your-app-url/health              → Should return "healthy"
https://your-app-url/favicon-32x32.png   → Should show favicon
https://your-app-url/assets/index-*.js   → Should download JS file
```

If any of these fail, note which ones for further debugging.

---

## Common Issues & Solutions

### Issue: White/Blank Page

**Possible Causes:**
1. JavaScript error preventing React from rendering
2. Missing assets (CSS/JS files)
3. Incorrect base path

**Debug Steps:**
1. Open browser console (F12)
2. Check for red error messages
3. Go to Network tab → Reload page
4. Look for any failed requests (red items)

**Solution:**
- If JS files are 404: Check nginx.conf is copied correctly
- If assets load but page is blank: Check console for React errors
- If "MIME type" error: Ensure nginx.conf has correct content-type headers

---

### Issue: 404 on Refresh

**Symptom:** App works initially, but refreshing the page shows 404

**Cause:** SPA routing not configured in nginx

**Solution:** Already fixed in `nginx.conf`:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Ensure this file was copied during Docker build.

---

### Issue: Assets Not Loading (404 errors)

**Check in Browser Network Tab:**
- Are assets being requested from wrong path?
- Are there 404 errors for CSS/JS files?

**Solution:**
1. Verify `dist/assets/` folder exists after build
2. Check Dockerfile copies `dist/` correctly:
   ```dockerfile
   COPY --from=builder /app/dist /usr/share/nginx/html
   ```

---

### Issue: "Could not find root element"

**Error Message:**
```
Error: Could not find root element to mount to
```

**Cause:** The index.html doesn't have `<div id="root"></div>`

**Solution:**
1. Check `dist/index.html` after build
2. Ensure it contains: `<div id="root"></div>`
3. Rebuild if necessary

---

### Issue: Import Map Errors

**Error:**
```
Failed to resolve module specifier "react"
```

**Cause:** Import maps not loading from CDN

**Check:**
1. Browser console for CORS errors
2. Network tab → Check if `aistudiocdn.com` requests succeed
3. Try accessing CDN directly: https://aistudiocdn.com/react@^19.2.0

**Fallback:** If CDN is blocked, you may need to bundle React (different approach)

---

## Step-by-Step Debugging Process

### Step 1: Identify the Error
1. Open deployed URL
2. Press F12 → Console tab
3. Take screenshot of any errors
4. Go to Network tab → Reload page
5. Note any failed requests (red/404)

### Step 2: Check Coolify Logs
1. Go to Coolify dashboard
2. Find your app
3. Check Build Logs → Ensure successful build
4. Check Runtime Logs → Look for nginx errors

### Step 3: Verify Configuration
```bash
# In Coolify, these should be set:
Build Pack: Docker
Port: 80
Dockerfile: Dockerfile (default)
Build Args: GEMINI_API_KEY=your_key
```

### Step 4: Rebuild
1. Make any necessary fixes
2. Push to Git
3. Coolify will auto-rebuild
4. Or manually trigger rebuild in Coolify

---

## Emergency Fixes

### Fix 1: Force Complete Rebuild
1. In Coolify → App Settings
2. "Force Rebuild" checkbox
3. Click "Rebuild"
4. This clears cache and rebuilds from scratch

### Fix 2: Check Docker Image
If you have SSH access to Coolify server:
```bash
# List running containers
docker ps

# Check container logs
docker logs <container-id>

# Enter container shell
docker exec -it <container-id> sh

# Check if files exist
ls -la /usr/share/nginx/html
cat /usr/share/nginx/html/index.html
```

### Fix 3: Test Locally First
Before redeploying, test locally:
```bash
# Build Docker image
docker build --build-arg GEMINI_API_KEY=your_key -t recyclemaster-test .

# Run container
docker run -p 8080:80 recyclemaster-test

# Test at http://localhost:8080
# If it works locally but not in Coolify, the issue is with Coolify configuration
```

---

## What to Share When Asking for Help

If you need help, provide:
1. ✅ Screenshot of browser console errors
2. ✅ Screenshot of Network tab showing failed requests
3. ✅ Coolify build logs (last 50 lines)
4. ✅ Coolify runtime logs (last 50 lines)
5. ✅ Your Coolify build configuration (screenshot)
6. ✅ The exact error message

---

## Quick Checklist

Before asking for help, verify:
- [ ] Build completed successfully in Coolify logs
- [ ] `GEMINI_API_KEY` is set as Build Argument
- [ ] Port is set to 80
- [ ] Browser console shows no CORS errors
- [ ] Network tab shows no 404 errors
- [ ] `/health` endpoint returns "healthy"
- [ ] Tested in incognito/private browsing mode
- [ ] Cleared browser cache
- [ ] Tried different browser

---

## Contact Support

If none of the above helps:
1. Check Coolify documentation: https://coolify.io/docs
2. Check Coolify Discord for similar issues
3. Share the checklist above with support
