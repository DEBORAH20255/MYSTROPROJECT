export const handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { email, provider, fileName, sessionId } = data;

    // Check environment variables
    const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
    const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
      console.error('Missing Redis configuration in setSession');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Server configuration error - Redis credentials missing' 
        }),
      };
    }

    // Initialize Upstash Redis with error handling
    let redis;
    try {
      const { Redis } = await import('@upstash/redis');
      redis = new Redis({
        url: UPSTASH_REDIS_REST_URL,
        token: UPSTASH_REDIS_REST_TOKEN,
      });
    } catch (redisError) {
      console.error('Redis initialization error in setSession:', redisError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Database connection error',
          details: redisError.message
        }),
      };
    }

    // Create session data
    const sessionData = {
      email,
      provider,
      fileName,
      timestamp: new Date().toISOString(),
      sessionId: sessionId || Math.random().toString(36).substring(2, 15),
    };

    // Store in Redis with 24-hour TTL
    await redis.setex(`session:${sessionData.sessionId}`, 86400, JSON.stringify(sessionData));
    await redis.setex(`user:${email}`, 86400, JSON.stringify(sessionData));

    // Set session cookie (shorter expiry for security)
    const sessionCookie = `adobe_session=${encodeURIComponent(JSON.stringify(sessionData))}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`;

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Set-Cookie': sessionCookie,
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Session created successfully',
        sessionId: sessionData.sessionId 
      }),
    };

  } catch (error) {
    console.error('Error in setSession function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};