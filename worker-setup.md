# Cloudflare R2 Worker Setup Guide

## Overview
This guide helps you set up a Cloudflare Worker to handle R2 operations securely. The worker acts as a server-side proxy for your R2 bucket operations.

## Prerequisites

1. **Cloudflare Account**: Sign up at https://cloudflare.com
2. **R2 Bucket**: Create an R2 bucket in your Cloudflare dashboard
3. **Wrangler CLI**: Already installed globally

## Step 1: Create R2 Bucket

1. Go to Cloudflare dashboard → R2 Object Storage
2. Click "Create bucket"
3. Name it `wedding-photos-bucket` (or update the name in `workers/wrangler.toml`)
4. Choose your preferred region

## Step 2: Configure Worker

### Update wrangler.toml
Edit `workers/wrangler.toml` and update the bucket name:

```toml
[[r2_buckets]]
binding = "WEDDING_PHOTOS_BUCKET"
bucket_name = "your-actual-bucket-name"
```

## Step 3: Deploy the Worker

### Navigate to workers directory
```bash
cd workers
```

### Login to Cloudflare (if not already logged in)
```bash
wrangler login
```

### Deploy the worker
```bash
wrangler deploy
```

The worker will be deployed to: `https://wedding-photos-r2-worker.your-subdomain.workers.dev`

## Step 4: Update Environment Variables

### Local Development (.env file)
```
# Existing Supabase variables
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_SECRET_KEY=your_supabase_anon_key

# New R2 Worker variable
REACT_APP_R2_WORKER_URL=https://wedding-photos-r2-worker.your-subdomain.workers.dev
```

### Vercel Deployment
Add this environment variable in your Vercel project settings:
- `REACT_APP_R2_WORKER_URL`

## Step 5: Test the Worker

### Test endpoints:
- **Upload**: `POST /upload`
- **Download**: `GET /download?key=filename`
- **List**: `GET /list?prefix=images&limit=10`
- **Delete**: `DELETE /delete?key=filename`

### Test with curl:
```bash
# Upload a file
curl -X POST https://your-worker-url/upload \
  -F "file=@test.jpg" \
  -F "key=test.jpg"

# List files
curl https://your-worker-url/list

# Download a file
curl https://your-worker-url/download?key=test.jpg
```

## Step 6: Update Your React App

### Option 1: Use Worker Uploader
Replace your current FileUploader import:

```javascript
// Old
import FileUploader from './FileUploader';

// New
import FileUploaderWorker from './FileUploaderWorker';
```

### Option 2: Update App.js
```javascript
import FileUploaderWorker from './FileUploaderWorker';

function App() {
  return (
    <div className="App">
      <FileUploaderWorker />
      {/* ... rest of your app */}
    </div>
  );
}
```

## Worker Features

### ✅ Security Benefits
- No R2 credentials exposed in client-side code
- Server-side validation and processing
- CORS handling
- Rate limiting (can be added)

### ✅ API Endpoints
- **POST /upload** - Upload files to R2
- **GET /download** - Download files from R2
- **GET /list** - List files in R2 bucket
- **DELETE /delete** - Delete files from R2

### ✅ Error Handling
- Comprehensive error responses
- CORS preflight support
- Input validation
- File type checking

## Troubleshooting

### Common Issues:

1. **Worker deployment fails**
   - Check your Cloudflare account permissions
   - Verify wrangler.toml configuration
   - Ensure bucket exists and is accessible

2. **CORS errors**
   - Worker includes CORS headers
   - Check if your domain is allowed

3. **Upload fails**
   - Verify bucket permissions
   - Check file size limits
   - Ensure proper content-type headers

### Debug Commands:
```bash
# View worker logs
wrangler tail

# Test locally
wrangler dev

# Check worker status
wrangler whoami
```

## Security Notes

- ✅ No R2 credentials in client code
- ✅ Server-side validation
- ✅ CORS protection
- ✅ Error handling
- ⚠️ Consider adding authentication
- ⚠️ Consider adding rate limiting
- ⚠️ Consider adding file size limits

## Next Steps

1. **Add Authentication**: Implement JWT or API key authentication
2. **Add Rate Limiting**: Prevent abuse with rate limiting
3. **Add File Validation**: Validate file types and sizes
4. **Add Image Processing**: Add image resizing/optimization
5. **Add CDN**: Configure custom domain for better performance 