# RecycleMaster Deployment Guide

## Coolify Deployment

This guide explains how to deploy RecycleMaster to Coolify.

### Prerequisites

- Coolify instance running
- GitHub repository connected to Coolify
- Google Gemini API key (get from https://aistudio.google.com/apikey)

### Deployment Steps

1. **Create New Application in Coolify**
   - Go to your Coolify dashboard
   - Click "Add New Application"
   - Select your GitHub repository
   - Choose the branch to deploy (usually `main`)

2. **Configure Build Settings**
   - Build Pack: **Docker**
   - Port: **80**
   - Dockerfile Path: `Dockerfile` (default)

3. **Set Environment Variables**
   In Coolify, go to your application settings and add:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

   **IMPORTANT:** This must be set as a **Build Argument** in Coolify because the API key is embedded during the build process.

4. **Deploy**
   - Click "Deploy" button
   - Wait for the build to complete (usually 2-5 minutes)
   - Your app will be available at the assigned URL

### Build Process

The deployment uses a multi-stage Docker build:
1. **Stage 1:** Node.js builder - installs dependencies and builds the React app
2. **Stage 2:** Nginx server - serves the static files with optimized configuration

### Verification

After deployment, verify:
- [ ] App loads correctly at the deployed URL
- [ ] No console errors in browser DevTools
- [ ] Theme toggle works (light/dark mode)
- [ ] Language switch works (English/Arabic)
- [ ] AI Assistant features work (requires valid API key)

### Troubleshooting

**Build fails with "Missing GEMINI_API_KEY"**
- Make sure you've added the `GEMINI_API_KEY` as a build argument in Coolify settings

**App shows blank page**
- Check browser console for errors
- Verify the nginx configuration is correct
- Check Coolify logs for deployment errors

**AI features not working**
- Verify the API key is correct
- Check that the API key has the correct permissions
- Test the API key at https://aistudio.google.com/

**Port conflicts**
- The app runs on port 80 inside the container
- Coolify handles external port mapping automatically

### Health Check

The application includes a health check endpoint:
```
http://your-app-url/health
```

Returns: `healthy` (200 OK)

### Performance Optimization

The nginx configuration includes:
- Gzip compression for all text assets
- 1-year cache for static assets (images, fonts, etc.)
- Security headers (X-Frame-Options, CSP, etc.)
- SPA routing support (all routes serve index.html)

### Updating the Deployment

1. Push changes to your GitHub repository
2. Coolify will auto-deploy if you have auto-deployment enabled
3. Or manually trigger deployment from Coolify dashboard

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for AI features |

### Docker Build Locally (Testing)

To test the Docker build locally before deploying:

```bash
# Build the image
docker build --build-arg GEMINI_API_KEY=your_key_here -t recyclemaster .

# Run the container
docker run -p 8080:80 recyclemaster

# Access at http://localhost:8080
```

### Additional Notes

- The app uses CDN-hosted dependencies (React, Tailwind CSS)
- SQLite database runs in browser localStorage on web
- All data is client-side (no backend required)
- Mobile apps require separate Capacitor builds (not covered in this deployment)

### Support

For issues, check:
1. Coolify deployment logs
2. Browser console errors
3. Network tab in DevTools for failed requests
4. `/health` endpoint status
