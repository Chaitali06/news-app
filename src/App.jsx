import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navigation from './components/Navigation';
import BreakingNews from './components/BreakingNews';
import Home from './pages/Home';
import ArticleDetail from './pages/ArticleDetail';
import VideoHub from './pages/VideoHub';
import AdminDashboard from './pages/AdminDashboard';
import DownloadApkModal from './components/DownloadApkModal';
import { Radio } from 'lucide-react';

// Routing content coordinator
function AppContent() {
  const { currentRoute, loading, apkDownloadUrl, setIsApkModalOpen } = useApp();

  const renderActivePage = () => {
    switch (currentRoute) {
      case 'home':
        return <Home />;
      case 'article':
        return <ArticleDetail />;
      case 'video':
        return <VideoHub />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <Home />;
    }
  };

  if (loading) {
    return (
      <div className="app-loader-splash">
        <div className="loader-spinner-box">
          <Radio className="loader-pulse-icon" size={48} />
          <span className="loader-label">Synchronizing Feed...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Dynamic backdrop textures */}
      <div className="mesh-bg"></div>

      {/* Primary navigation */}
      <Navigation />

      {/* Breaking News Ticker bar */}
      <BreakingNews />

      {/* Main Page Content */}
      <main className="main-content">
        {renderActivePage()}
      </main>

      {/* Premium Footer */}
      <footer className="chronicle-footer">
        <div className="footer-inner">
          <div className="footer-brand-pane">
            <div className="footer-logo">
              <Radio size={18} className="logo-pulse" />
              <span>CHRONICLE</span>
            </div>
            <p className="footer-about">
              Delivering high-fidelity journalism and video reporting. Structured, peer-reviewed, and localized insight on global affairs.
            </p>
          </div>
          <div className="footer-links-pane">
            <div>
              <h5>Portal</h5>
              <ul>
                <li onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Headlines</li>
                <li>Video Library</li>
                <li>Investigative Hub</li>
              </ul>
            </div>
            <div>
              <h5>System</h5>
              <ul>
                <li>API Interface</li>
                <li>Offline DB Status</li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setIsApkModalOpen(true)}
                    style={{ 
                      color: '#4ade80', 
                      background: 'none', 
                      border: 'none', 
                      padding: 0, 
                      cursor: 'pointer', 
                      fontSize: 'inherit',
                      fontFamily: 'inherit',
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '4px' 
                    }}
                  >
                    ⚡ Download APK
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom-bar">
          <p>&copy; {new Date().getFullYear()} Chronicle News Network. Built with React and Local Storage.</p>
          <div className="footer-legal">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>

      {/* Standalone Download APK Modal */}
      <DownloadApkModal />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
