import { Redis } from '@upstash/redis';

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
    // Initialize Upstash Redis
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

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
        const userSession = await redis.get(`user:${email}`);
        if (userSession) {
          sessionData = JSON.parse(userSession);
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

    // Check if session is still valid (24 hours for Redis sessions)
    const sessionTime = new Date(sessionData.timestamp);
    const now = new Date();
    const hoursDiff = (now - sessionTime) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      // Clean expired session
      await redis.del(`session:${sessionData.sessionId}`);
      await redis.del(`user:${sessionData.email}`);
      
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Session expired' }),
      };
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
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};