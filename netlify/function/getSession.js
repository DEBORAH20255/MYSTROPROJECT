exports.handler = async (event, context) => {
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
    // Get cookies from request
    const cookies = event.headers.cookie || '';
    const sessionMatch = cookies.match(/adobe_session=([^;]+)/);

    if (!sessionMatch) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'No session found' }),
      };
    }

    // Parse session data
    const sessionData = JSON.parse(decodeURIComponent(sessionMatch[1]));

    // Check if session is still valid (1 hour)
    const sessionTime = new Date(sessionData.timestamp);
    const now = new Date();
    const hoursDiff = (now - sessionTime) / (1000 * 60 * 60);

    if (hoursDiff > 1) {
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
          timestamp: sessionData.timestamp
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