import React, { useState } from 'react';
import LandingPage from './LandingPage';

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
  };

  return (
    <div className="min-h-screen">
      {currentView === 'landing' ? (
        <LandingPage onFileAction={handleFileAction} />
      ) : (
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
}

export default App;