import React, { useState } from 'react';
import { useScreenSize } from './hooks/useScreenSize';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import MobileLandingPage from './components/mobile/MobileLandingPage';
import MobileLoginPage from './components/mobile/MobileLoginPage';
import LandingPage from './LandingPage';

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'login'>('landing');
  const [selectedFile, setSelectedFile] = useState<string>('');
  const screenSize = useScreenSize();

  const handleFileAction = (fileName: string, action: 'view' | 'download') => {
    setSelectedFile(fileName);
@@ -22,37 +17,25 @@ function App() {

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
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Login Required</h2>
            <p className="mb-4">File: {selectedFile}</p>
            <button 
              onClick={handleBackToLanding}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Back to Files
            </button>
          </div>
        </div>
      )}
    </div>
  );