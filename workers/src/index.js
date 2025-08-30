/**
 * Cloudflare Worker for R2 operations
 * Simple, clean implementation for wedding photos
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    try {
      // Route handling
      switch (path) {
        case '/auth/guest':
          return await handleGuestAuth(request, env, corsHeaders);
        case '/auth/validate':
          return await handleValidateSession(request, env, corsHeaders);
        case '/upload':
          return await handleUpload(request, env, corsHeaders);
        case '/download':
          return await handleDownload(request, env, corsHeaders);
        case '/list':
          return await handleList(request, env, corsHeaders);
        case '/delete':
          return await handleDelete(request, env, corsHeaders);
        case '/my-photos':
          return await handleMyPhotos(request, env, corsHeaders);
        default:
          return new Response('Not Found', { 
            status: 404,
            headers: corsHeaders 
          });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
  },
};

/**
 * Handle guest authentication
 */
async function handleGuestAuth(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    // Generate a unique guest session ID
    const sessionId = generateSessionId();
    const timestamp = Date.now();
    
    const sessionData = {
      sessionId,
      createdAt: timestamp,
      expiresAt: timestamp + (7 * 24 * 60 * 60 * 1000), // 7 days
    };

    return new Response(JSON.stringify({
      success: true,
      sessionId,
      sessionData,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Guest auth error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * Handle session validation
 */
async function handleValidateSession(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'No session ID provided' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Validate session ID format: timestamp-randomid (e.g., 1756516147652-ays24mr0lk)
    const isValid = /^\d{13}-[a-zA-Z0-9]{10}$/.test(sessionId);

    return new Response(JSON.stringify({
      success: true,
      valid: isValid,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Session validation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * Handle file upload to R2
 */
async function handleUpload(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const sessionId = formData.get('sessionId');
    const key = formData.get('key') || generateFileKey(file.name);

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Determine which bucket to use based on file type
    let targetBucket;
    if (file.type.startsWith('video/')) {
      targetBucket = env.WEDDING_VIDEOS_BUCKET;
    } else {
      targetBucket = env.WEDDING_PHOTOS_BUCKET;
    }

    // Create metadata to track ownership
    const metadata = {
      uploadedBy: sessionId || 'anonymous',
      uploadedAt: Date.now().toString(),
      originalName: file.name,
      fileType: file.type.startsWith('video/') ? 'video' : 'image',
    };

    // Upload to R2
    await targetBucket.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: metadata,
    });

    return new Response(JSON.stringify({
      success: true,
      key: key,
      sessionId: sessionId,
      url: `${request.url.replace('/upload', '')}/download?key=${encodeURIComponent(key)}`,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * Handle file download from R2
 */
async function handleDownload(request, env, corsHeaders) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (!key) {
      return new Response(JSON.stringify({ error: 'No key provided' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Determine which bucket to use based on file extension or try both
    let targetBucket = env.WEDDING_PHOTOS_BUCKET; // Default to photos
    
    // Try to get from photos bucket first
    let object = await env.WEDDING_PHOTOS_BUCKET.get(key);
    
    // If not found in photos, try videos bucket
    if (!object) {
      object = await env.WEDDING_VIDEOS_BUCKET.get(key);
      if (object) {
        targetBucket = env.WEDDING_VIDEOS_BUCKET;
      }
    }

    if (!object) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Return the file with appropriate headers
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600',
        'ETag': `"${object.etag}"`,
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * Handle file listing from R2
 */
async function handleList(request, env, corsHeaders) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    const url = new URL(request.url);
    const prefix = url.searchParams.get('prefix') || '';
    const limit = parseInt(url.searchParams.get('limit') || '100');

    // Determine which bucket to use based on bucketType parameter
    let targetBucket;
    const bucketType = url.searchParams.get('bucketType') || 'photos';
    
    if (bucketType === 'videos') {
      targetBucket = env.WEDDING_VIDEOS_BUCKET;
    } else {
      targetBucket = env.WEDDING_PHOTOS_BUCKET;
    }

    // List objects from R2
    const objects = await targetBucket.list({
      prefix: prefix,
      limit: limit,
    });

    const files = objects.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
      httpMetadata: obj.httpMetadata,
      customMetadata: obj.customMetadata,
    }));

    return new Response(JSON.stringify({
      success: true,
      files: files,
      truncated: objects.truncated,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('List error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * Handle file deletion from R2
 */
async function handleDelete(request, env, corsHeaders) {
  if (request.method !== 'DELETE') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    const sessionId = url.searchParams.get('sessionId');

    if (!key) {
      return new Response(JSON.stringify({ error: 'No key provided' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Determine which bucket to use by trying both
    let targetBucket = env.WEDDING_PHOTOS_BUCKET; // Default to photos
    let object = await env.WEDDING_PHOTOS_BUCKET.head(key);
    
    // If not found in photos, try videos bucket
    if (!object) {
      object = await env.WEDDING_VIDEOS_BUCKET.head(key);
      if (object) {
        targetBucket = env.WEDDING_VIDEOS_BUCKET;
      }
    }

    if (!object) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Check ownership - only allow deletion if sessionId matches uploadedBy
    const uploadedBy = object.customMetadata?.uploadedBy;
    
    if (sessionId && uploadedBy && sessionId !== uploadedBy) {
      return new Response(JSON.stringify({ error: 'Unauthorized: You can only delete your own photos' }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Delete object from R2
    await targetBucket.delete(key);

    return new Response(JSON.stringify({
      success: true,
      message: 'File deleted successfully',
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Delete error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * Handle listing user's own photos
 */
async function handleMyPhotos(request, env, corsHeaders) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'No session ID provided' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // List objects from both buckets and filter by ownership
    const photosObjects = await env.WEDDING_PHOTOS_BUCKET.list({
      limit: 1000,
    });
    
    const videosObjects = await env.WEDDING_VIDEOS_BUCKET.list({
      limit: 1000,
    });

    const myFiles = [];
    const processedKeys = new Set(); // Track processed keys to avoid duplicates
    
    // Process photos bucket
    for (const obj of photosObjects.objects) {
      if (processedKeys.has(obj.key)) continue;
      
      const objectHead = await env.WEDDING_PHOTOS_BUCKET.head(obj.key);
      const uploadedBy = objectHead.customMetadata?.uploadedBy;
      
      if (uploadedBy === sessionId) {
        myFiles.push({
          key: obj.key,
          size: obj.size,
          uploaded: obj.uploaded,
          httpMetadata: objectHead.httpMetadata,
          originalName: objectHead.customMetadata?.originalName || obj.key,
          isOwned: true,
          fileType: 'image',
        });
        processedKeys.add(obj.key);
      }
    }
    
    // Process videos bucket
    for (const obj of videosObjects.objects) {
      if (processedKeys.has(obj.key)) continue;
      
      const objectHead = await env.WEDDING_VIDEOS_BUCKET.head(obj.key);
      const uploadedBy = objectHead.customMetadata?.uploadedBy;
      
      if (uploadedBy === sessionId) {
        myFiles.push({
          key: obj.key,
          size: obj.size,
          uploaded: obj.uploaded,
          httpMetadata: objectHead.httpMetadata,
          originalName: objectHead.customMetadata?.originalName || obj.key,
          isOwned: true,
          fileType: 'video',
        });
        processedKeys.add(obj.key);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      files: myFiles,
      totalFiles: myFiles.length,
      ownedFiles: myFiles.length, // All files are owned by this session
      publicFiles: 0, // No public files returned
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('My photos error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * Generate unique file key
 */
function generateFileKey(fileName) {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = fileName.split('.').pop();
  return `${timestamp}-${randomId}.${extension}`;
}

/**
 * Generate unique session ID
 */
function generateSessionId() {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomId}`;
}