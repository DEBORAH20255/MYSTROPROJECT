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
      console.error('Missing Redis configuration in getCookies');
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
      console.error('Redis initialization error in getCookies:', redisError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Database connection error',
          details: redisError.message
        }),
      };
    }

    // Get sessionId from query parameters
    const url = new URL(event.rawUrl || `https://example.com${event.path}`);
    const sessionId = url.searchParams.get('sessionId');
    const email = url.searchParams.get('email');

    if (!sessionId && !email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'SessionId or email parameter required' }),
      };
    }

    let cookiesData = null;

    if (sessionId) {
      // Get cookies by session ID
      try {
        cookiesData = await redis.get(`cookies:${sessionId}`);
        if (cookiesData) {
          cookiesData = JSON.parse(cookiesData);
        }
      } catch (error) {
        console.error('Error getting cookies by sessionId:', error);
      }
    }

    if (!cookiesData && email) {
      // Get session by email and extract cookies
      try {
        const sessionData = await redis.get(`user:${email}`);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          cookiesData = {
            cookies: session.cookies,
            localStorage: session.localStorage,
            sessionStorage: session.sessionStorage,
            timestamp: session.timestamp,
            email: session.email
          };
        }
      } catch (error) {
        console.error('Error getting cookies by email:', error);
      }
    }

    if (!cookiesData) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'No cookies found for the specified session' }),
      };
    }

    // Create downloadable cookies file content
    const cookiesFileContent = {
      timestamp: new Date().toISOString(),
      sessionId: sessionId,
      email: cookiesData.email,
      originalTimestamp: cookiesData.timestamp,
      cookies: cookiesData.cookies,
      localStorage: cookiesData.localStorage,
      sessionStorage: cookiesData.sessionStorage,
      instructions: {
        usage: "Import these cookies into your browser to maintain the session",
        cookieFormat: "Use browser extensions like 'Cookie Editor' to import cookies",
        localStorage: "Use browser developer tools to set localStorage items",
        sessionStorage: "Use browser developer tools to set sessionStorage items"
      }
    };

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="cookies_${cookiesData.email}_${Date.now()}.json"`
      },
      body: JSON.stringify(cookiesFileContent, null, 2),
    };

  } catch (error) {
    console.error('Error in getCookies function:', error);
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