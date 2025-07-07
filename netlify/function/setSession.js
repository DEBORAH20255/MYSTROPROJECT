exports.handler = async (event, context) => {
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
    const { email, provider, fileName } = data;

    // Create session data
    const sessionData = {
      email,
      provider,
      fileName,
      timestamp: new Date().toISOString(),
      sessionId: Math.random().toString(36).substring(2, 15),
    };

    // Set session cookie
    const sessionCookie = `adobe_session=${JSON.stringify(sessionData)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`;

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