import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'login'>('landing');
  const [selectedFile, setSelectedFile] = useState<string>('');

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

  return (
    <div className="min-h-screen bg-white">
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