/**
 * Cloudflare Worker for R2 operations
 * Handles file uploads, downloads, listing, and guest authentication
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
    
    // Store session in KV (if available) or use a simple approach
    // For now, we'll use a simple approach with session metadata
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

    // For now, we'll accept any session ID that looks valid
    // In a production system, you'd validate against stored sessions
    const isValid = /^[a-zA-Z0-9]{16,}$/.test(sessionId);

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
 * Handle file upload to R2 with guest session tracking
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
    const bucketType = formData.get('bucketType') || 'photos'; // 'photos' or 'videos'
    const sessionId = formData.get('sessionId'); // Guest session ID
    const key = formData.get('key') || generateFileKey(file.name, bucketType);

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Determine which bucket to use based on file type or explicit bucketType
    let targetBucket;
    if (bucketType === 'videos' || file.type.startsWith('video/')) {
      targetBucket = env.WEDDING_VIDEOS_BUCKET;
    } else {
      targetBucket = env.WEDDING_PHOTOS_BUCKET;
    }

    // Create metadata to track ownership
    const metadata = {
      uploadedBy: sessionId || 'anonymous',
      uploadedAt: Date.now().toString(),
      originalName: file.name,
    };

    // Upload to R2 with metadata
    await targetBucket.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: metadata,
    });

    return new Response(JSON.stringify({
      success: true,
      key: key,
      bucketType: bucketType,
      sessionId: sessionId,
      url: `${request.url.replace('/upload', '')}/download?key=${encodeURIComponent(key)}&bucketType=${bucketType}`,
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
    const bucketType = url.searchParams.get('bucketType') || 'photos';

    if (!key) {
      return new Response(JSON.stringify({ error: 'No key provided' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Determine which bucket to use
    let targetBucket;
    if (bucketType === 'videos') {
      targetBucket = env.WEDDING_VIDEOS_BUCKET;
    } else {
      targetBucket = env.WEDDING_PHOTOS_BUCKET;
    }

    // Get object from R2
    const object = await targetBucket.get(key);

    if (!object) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Determine cache headers based on file type
    const isImage = object.httpMetadata?.contentType?.startsWith('image/');
    const isVideo = object.httpMetadata?.contentType?.startsWith('video/');
    
    // Aggressive caching for images
    const cacheHeaders = {
      'Cache-Control': isImage ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
      'ETag': `"${object.etag}"`,
      'Accept-Ranges': 'bytes',
      'Content-Length': object.size,
    };

    // Add compression for images
    if (isImage) {
      cacheHeaders['Content-Encoding'] = 'gzip';
    }

    // Return the file with optimized headers
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        ...cacheHeaders,
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
    const bucketType = url.searchParams.get('bucketType') || 'photos';

    // Determine which bucket to use
    let targetBucket;
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
      customMetadata: obj.customMetadata, // Include custom metadata
      bucketType: bucketType,
    }));

    return new Response(JSON.stringify({
      success: true,
      files: files,
      truncated: objects.truncated,
      bucketType: bucketType,
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
 * Handle file deletion from R2 with ownership validation
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
    const bucketType = url.searchParams.get('bucketType') || 'photos';
    const sessionId = url.searchParams.get('sessionId'); // Guest session ID

    if (!key) {
      return new Response(JSON.stringify({ error: 'No key provided' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Determine which bucket to use
    let targetBucket;
    if (bucketType === 'videos') {
      targetBucket = env.WEDDING_VIDEOS_BUCKET;
    } else {
      targetBucket = env.WEDDING_PHOTOS_BUCKET;
    }

    // Get object metadata to check ownership
    const object = await targetBucket.head(key);
    
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
      bucketType: bucketType,
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
    const bucketType = url.searchParams.get('bucketType') || 'photos';

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'No session ID provided' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Determine which bucket to use
    let targetBucket;
    if (bucketType === 'videos') {
      targetBucket = env.WEDDING_VIDEOS_BUCKET;
    } else {
      targetBucket = env.WEDDING_PHOTOS_BUCKET;
    }

    // List all objects and filter by ownership
    const objects = await targetBucket.list({
      limit: 1000,
    });

    const myFiles = [];
    
    for (const obj of objects.objects) {
      // Get object metadata to check ownership
      const objectHead = await targetBucket.head(obj.key);
      const uploadedBy = objectHead.customMetadata?.uploadedBy;
      
      if (uploadedBy === sessionId) {
        myFiles.push({
          key: obj.key,
          size: obj.size,
          uploaded: obj.uploaded,
          httpMetadata: obj.httpMetadata,
          bucketType: bucketType,
          originalName: objectHead.customMetadata?.originalName || obj.key,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      files: myFiles,
      bucketType: bucketType,
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