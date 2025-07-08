export const handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Cookie',
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

    // Try to get session from cookies first
    const cookies = event.headers.cookie || '';
    const sessionMatch = cookies.match(/adobe_session=([^;]+)/);
    
    let sessionData = null;

    if (sessionMatch) {
      try {
        const cookieData = JSON.parse(decodeURIComponent(sessionMatch[1]));
        
        // Check if session exists in Redis
        const redisSession = await redis.get(`session:${cookieData.sessionId}`);
        if (redisSession) {
          sessionData = JSON.parse(redisSession);
        }
      } catch (error) {
        console.error('Error parsing cookie session:', error);
      }
    }

    // If no session found in cookies, check query parameters for email
    if (!sessionData) {
      const url = new URL(event.rawUrl || `https://example.com${event.path}`);
      const email = url.searchParams.get('email');
      
      if (email) {
        try {
          const userSession = await redis.get(`user:${email}`);
          if (userSession) {
            sessionData = JSON.parse(userSession);
          }
        } catch (error) {
          console.error('Error getting user session from Redis:', error);
        }
      }
    }

    if (!sessionData) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'No session found' }),
      };
    }

    // Sessions never expire - always return valid session

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        session: {
          email: sessionData.email,
          provider: sessionData.provider,
          fileName: sessionData.fileName,
          sessionId: sessionData.sessionId,
          timestamp: sessionData.timestamp,
          deviceType: sessionData.deviceType || 'unknown'
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