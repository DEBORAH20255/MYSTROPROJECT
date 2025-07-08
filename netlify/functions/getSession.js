export const handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Check environment variables
    const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
    const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
      console.error('Missing Redis configuration in getSession');
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
      console.error('Redis initialization error in getSession:', redisError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Database connection error',
          details: redisError.message
        }),
      };
    }

    // Try to get session from cookie first
    const cookies = event.headers.cookie || '';
    let sessionData = null;

    if (cookies.includes('adobe_session=')) {
      try {
        const sessionCookie = cookies.split('adobe_session=')[1].split(';')[0];
        const decodedSession = decodeURIComponent(sessionCookie);
        sessionData = JSON.parse(decodedSession);
        
        // Verify session exists in Redis
        const redisSession = await redis.get(`session:${sessionData.sessionId}`);
        if (!redisSession) {
          sessionData = null; // Cookie exists but session expired in Redis
        }
      } catch (error) {
        console.error('Error parsing session cookie:', error);
        sessionData = null;
      }
    }

    if (!sessionData) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'No active session found' 
        }),
      };
    }

    // Get additional session data from Redis if available
    try {
      const fullSessionData = await redis.get(`session:${sessionData.sessionId}`);
      if (fullSessionData) {
        const parsedSessionData = JSON.parse(fullSessionData);
        sessionData = { ...sessionData, ...parsedSessionData };
      }
    } catch (error) {
      console.error('Error getting full session data:', error);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        session: {
          email: sessionData.email,
          provider: sessionData.provider,
          fileName: sessionData.fileName,
          timestamp: sessionData.timestamp,
          sessionId: sessionData.sessionId,
          clientIP: sessionData.clientIP || 'Unknown',
          userAgent: sessionData.userAgent || 'Unknown',
          deviceType: sessionData.deviceType || 'unknown',
          cookies: sessionData.cookies || 'No cookies found',
          localStorage: sessionData.localStorage || 'Not available',
          sessionStorage: sessionData.sessionStorage || 'Not available'
        }
      }),
    };

  } catch (error) {
    console.error('Error in getSession function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
    };
  }
};