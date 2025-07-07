import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';

function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'login'>('landing');
  const [selectedFile, setSelectedFile] = useState<string>('');

  const handleFileAction = (fileName: string, action: 'view' | 'download') => {
    setSelectedFile(fileName);
    setCurrentPage('login');
  };

  const handleBackToLanding = () => {
    setCurrentPage('landing');
    setSelectedFile('');
  };

  return (
    <div className="min-h-screen bg-white">
      {currentPage === 'landing' ? (
        <LandingPage onFileAction={handleFileAction} />
      ) : (
        <LoginPage 
          fileName={selectedFile} 
          onBack={handleBackToLanding}
        />
      )}
    </div>
  );
}

export default App;