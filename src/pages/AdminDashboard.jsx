import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  PlusCircle, Edit3, Trash2, LayoutDashboard, FileText, Video as VideoIcon, 
  BarChart2, FilePlus, Video, LogOut, Check, AlertCircle, Info, Lock, Smartphone, ExternalLink,
  Download, UploadCloud, CheckCircle2, Terminal, Database, Cloud, RefreshCw, Server
} from 'lucide-react';
import Modal from '../components/Modal';

export default function AdminDashboard() {
  const {
    articles,
    videos,
    createArticle,
    editArticle,
    removeArticle,
    createVideo,
    editVideo,
    removeVideo,
    adminUser,
    adminTargetArticle,
    setAdminTargetArticle,
    loginAdmin,
    logoutAdmin,
    navigateTo,
    apkDownloadUrl,
    updateApkDownloadUrl,
    triggerApkDownload,
    isCloudActive,
    saveCloudConfig,
    clearCloudConfig,
    syncLocalToCloud,
    testCloudConnection,
    getCloudConfig
  } = useApp();

  const [apkUrlInput, setApkUrlInput] = useState(apkDownloadUrl || '');
  const [uploadedApkInfo, setUploadedApkInfo] = useState(null);

  // Cloud Database state
  const currentCloudCfg = getCloudConfig ? getCloudConfig() : null;
  const [cloudJsonInput, setCloudJsonInput] = useState(() => {
    return currentCloudCfg ? JSON.stringify(currentCloudCfg, null, 2) : '';
  });
  const [cloudApiKey, setCloudApiKey] = useState(currentCloudCfg?.apiKey || '');
  const [cloudProjectId, setCloudProjectId] = useState(currentCloudCfg?.projectId || '');
  const [cloudAuthDomain, setCloudAuthDomain] = useState(currentCloudCfg?.authDomain || '');
  const [cloudStorageBucket, setCloudStorageBucket] = useState(currentCloudCfg?.storageBucket || '');
  const [cloudAppId, setCloudAppId] = useState(currentCloudCfg?.appId || '');
  const [cloudConfigMode, setCloudConfigMode] = useState('json'); // 'json' | 'manual'
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [cloudTestResult, setCloudTestResult] = useState(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  // Authentication states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');


  // Dashboard Sub-navigation tabs
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'articles', 'videos', 'new-article', 'new-video'

  // Modal actions
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // { type: 'article'|'video', id }

  // Notification Banner
  const [alertMessage, setAlertMessage] = useState(null); // { type: 'success'|'error', text }

  // Form states for New / Editing Article
  const [isEditingArticle, setIsEditingArticle] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [artTitle, setArtTitle] = useState('');
  const [artSummary, setArtSummary] = useState('');
  const [artCategory, setArtCategory] = useState('politics');
  const [artAuthor, setArtAuthor] = useState('');
  const [artImageUrl, setArtImageUrl] = useState('');
  const [artImageFile, setArtImageFile] = useState(null);
  const [artBody, setArtBody] = useState('');

  // Form states for New Video
  const [isEditingVideo, setIsEditingVideo] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState(null);
  const [vidTitle, setVidTitle] = useState('');
  const [vidDescription, setVidDescription] = useState('');
  const [vidCategory, setVidCategory] = useState('politics');
  const [vidAuthor, setVidAuthor] = useState('');
  const [vidThumbUrl, setVidThumbUrl] = useState('');
  const [vidThumbFile, setVidThumbFile] = useState(null);
  const [vidVideoUrl, setVidVideoUrl] = useState('');
  const [vidVideoFile, setVidVideoFile] = useState(null);

  // Client-side image compression for Android WebView / mobile gallery uploads (prevents Firestore 1MB rejection)
  const compressImageFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Stats Counters
  const [totalViews, setTotalViews] = useState(0);
  const [totalComments, setTotalComments] = useState(0);

  useEffect(() => {
    // Sum views
    const artViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);
    const vidViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
    setTotalViews(artViews + vidViews);

    // Sum Comments count from local storage keys
    let commentsCount = 0;
    articles.forEach(art => {
      const stored = localStorage.getItem(`comments_${art.id}`);
      if (stored) {
        try {
          commentsCount += JSON.parse(stored).length;
        } catch(e) {}
      }
    });
    setTotalComments(commentsCount);
  }, [articles, videos]);

  useEffect(() => {
    if (adminTargetArticle) {
      loadArticleForEditing(adminTargetArticle);
      if (setAdminTargetArticle) setAdminTargetArticle(null);
    }
  }, [adminTargetArticle]);

  // Clean date formatter
  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper trigger for banner notifications
  const triggerAlert = (type, text) => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage(null), 4000);
  };

  const handleSaveApkLink = (e) => {
    e.preventDefault();
    if (!apkUrlInput.trim()) {
      triggerAlert('error', 'Please enter a valid Google Drive or hosted APK URL.');
      return;
    }
    updateApkDownloadUrl(apkUrlInput);
    triggerAlert('success', 'Android APK download link saved successfully!');
  };

  const handleResetToLocalApk = () => {
    updateApkDownloadUrl('/chronicle-news.apk');
    setApkUrlInput('/chronicle-news.apk');
    setUploadedApkInfo(null);
    triggerAlert('success', 'Reset to local hosted APK (/chronicle-news.apk)!');
  };

  const handleApkFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.apk')) {
      triggerAlert('error', 'Please upload a valid .apk file.');
      return;
    }
    const blobUrl = URL.createObjectURL(file);
    updateApkDownloadUrl(blobUrl);
    setApkUrlInput(blobUrl);
    setUploadedApkInfo({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
    });
    triggerAlert('success', `Active APK updated to ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)!`);
  };

  // Helper to parse Cloud Configuration
  const getActiveFormConfig = () => {
    if (cloudConfigMode === 'json') {
      const raw = (cloudJsonInput || '').trim();
      if (!raw) {
        throw new Error('Please paste your Firebase configuration snippet into the box.');
      }

      // Regex extractor: seamlessly handles JS snippets (const firebaseConfig = { apiKey: "..." }), comments, and JSON
      const extract = (field) => {
        const regex = new RegExp(`['"]?${field}['"]?\\s*:\\s*['"]([^'"]+)['"]`, 'i');
        const match = raw.match(regex);
        return match ? match[1].trim() : '';
      };

      const apiKey = extract('apiKey');
      const projectId = extract('projectId');
      const authDomain = extract('authDomain');
      const storageBucket = extract('storageBucket');
      const messagingSenderId = extract('messagingSenderId');
      const appId = extract('appId');
      const measurementId = extract('measurementId');

      if (apiKey && projectId) {
        return {
          apiKey,
          projectId,
          authDomain: authDomain || `${projectId}.firebaseapp.com`,
          storageBucket: storageBucket || `${projectId}.firebasestorage.app`,
          messagingSenderId,
          appId,
          measurementId
        };
      }

      // Fallback JSON.parse
      try {
        let clean = raw;
        if (clean.includes('=')) clean = clean.split('=')[1].trim();
        if (clean.endsWith(';')) clean = clean.slice(0, -1).trim();
        const parsed = JSON.parse(clean);
        if (parsed.apiKey && parsed.projectId) return parsed;
      } catch (e) {}

      throw new Error('Could not find "apiKey" and "projectId" in the pasted snippet. Please check your text or use the "Manual Fields" tab.');
    } else {
      if (!cloudApiKey.trim() || !cloudProjectId.trim()) {
        throw new Error('API Key and Project ID are required.');
      }
      return {
        apiKey: cloudApiKey.trim(),
        projectId: cloudProjectId.trim(),
        authDomain: cloudAuthDomain.trim() || `${cloudProjectId.trim()}.firebaseapp.com`,
        storageBucket: cloudStorageBucket.trim() || `${cloudProjectId.trim()}.appspot.com`,
        appId: cloudAppId.trim()
      };
    }
  };

  // Test Cloud DB Connection
  const handleTestCloud = async () => {
    try {
      setIsTestingCloud(true);
      setCloudTestResult(null);
      const cfg = getActiveFormConfig();
      const res = await testCloudConnection(cfg);
      setCloudTestResult(res);
      if (res.success) {
        triggerAlert('success', 'Firebase connection test succeeded!');
      } else {
        triggerAlert('error', `Connection test failed: ${res.message}`);
      }
    } catch (err) {
      setCloudTestResult({ success: false, message: err.message });
      triggerAlert('error', err.message);
    } finally {
      setIsTestingCloud(false);
    }
  };

  // Save Cloud DB Config
  const handleSaveCloud = (e) => {
    if (e) e.preventDefault();
    try {
      const cfg = getActiveFormConfig();
      saveCloudConfig(cfg);
      triggerAlert('success', `Firebase Cloud Database connected to project "${cfg.projectId}"!`);
      setCloudTestResult({ success: true, message: `Connected to project "${cfg.projectId}". Real-time sync active!` });
    } catch (err) {
      triggerAlert('error', err.message);
    }
  };

  // Disconnect Cloud DB
  const handleClearCloud = () => {
    clearCloudConfig();
    setCloudApiKey('');
    setCloudProjectId('');
    setCloudAuthDomain('');
    setCloudStorageBucket('');
    setCloudAppId('');
    setCloudJsonInput('');
    setCloudTestResult(null);
    triggerAlert('success', 'Disconnected from Firebase. Reverted to local IndexedDB mode.');
  };

  // Sync Local to Cloud
  const handleSyncCloud = async () => {
    if (!isCloudActive) {
      triggerAlert('error', 'Connect Firebase Firestore before synchronizing.');
      return;
    }
    try {
      setIsSyncingCloud(true);
      const res = await syncLocalToCloud();
      triggerAlert('success', `Synced ${res.uploadedArticles} articles and ${res.uploadedVideos} videos to Firebase Firestore!`);
    } catch (err) {
      triggerAlert('error', `Sync failed: ${err.message}`);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Auth Handler
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    const success = loginAdmin(username, password);
    if (!success) {
      setAuthError('Invalid credentials. Hint: admin / admin123');
    }
  };

  // Delete Handlers
  const openDeleteConfirm = (type, id) => {
    setItemToDelete({ type, id });
    setIsDeleteModalOpen(true);
  };

  const executeDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === 'article') {
        await removeArticle(itemToDelete.id);
        triggerAlert('success', 'Article deleted successfully.');
      } else {
        await removeVideo(itemToDelete.id);
        triggerAlert('success', 'Video deleted successfully.');
      }
    } catch (err) {
      triggerAlert('error', `Failed to delete: ${err.message}`);
    } finally {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  // Form Submission: Publish / Edit Article
  const handleArticleSubmit = async (e) => {
    e.preventDefault();
    try {
      let finalImgUrl = artImageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80';

      // Compress and convert image if file uploaded from mobile gallery/camera
      if (artImageFile) {
        finalImgUrl = await compressImageFile(artImageFile);
      }

      const payload = {
        title: artTitle,
        summary: artSummary,
        category: artCategory,
        author: artAuthor,
        image: finalImgUrl,
        body: artBody
      };

      if (isEditingArticle) {
        await editArticle(editingArticleId, payload);
        triggerAlert('success', 'Article updated successfully.');
      } else {
        await createArticle(payload);
        triggerAlert('success', 'Article published successfully.');
      }

      // Reset forms and navigate to articles management tab
      resetArticleForm();
      setActiveTab('articles');
    } catch (err) {
      triggerAlert('error', `Submission failed: ${err.message}`);
    }
  };

  const resetArticleForm = () => {
    setIsEditingArticle(false);
    setEditingArticleId(null);
    setArtTitle('');
    setArtSummary('');
    setArtCategory('politics');
    setArtAuthor('');
    setArtImageUrl('');
    setArtImageFile(null);
    setArtBody('');
  };

  const loadArticleForEditing = (art) => {
    setIsEditingArticle(true);
    setEditingArticleId(art.id);
    setArtTitle(art.title);
    setArtSummary(art.summary);
    setArtCategory(art.category);
    setArtAuthor(art.author || '');
    setArtImageUrl(art.image || '');
    setArtImageFile(null);
    setArtBody(art.body);
    setActiveTab('new-article');
  };

  const loadVideoForEditing = (vid) => {
    setIsEditingVideo(true);
    setEditingVideoId(vid.id);
    setVidTitle(vid.title);
    setVidDescription(vid.description || '');
    setVidCategory(vid.category || 'politics');
    setVidAuthor(vid.author || '');
    setVidThumbUrl(vid.thumbnailUrl || '');
    setVidThumbFile(null);
    setVidVideoUrl(vid.videoUrl || '');
    setVidVideoFile(null);
    setActiveTab('new-video');
  };

  // Form Submission: Upload / Edit Video
  const handleVideoSubmit = async (e) => {
    e.preventDefault();
    try {
      let finalThumbUrl = vidThumbUrl || 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=800&q=80';
      let finalVideoUrl = vidVideoUrl;

      // Compress and convert thumbnail if uploaded
      if (vidThumbFile) {
        finalThumbUrl = await compressImageFile(vidThumbFile);
      }

      // Handle raw video file upload
      if (vidVideoFile) {
        finalVideoUrl = URL.createObjectURL(vidVideoFile);
      }

      if (!finalVideoUrl) {
        triggerAlert('error', 'Please provide a video file or a public MP4 URL.');
        return;
      }

      const payload = {
        title: vidTitle,
        description: vidDescription,
        category: vidCategory,
        author: vidAuthor,
        thumbnailUrl: finalThumbUrl,
        videoUrl: finalVideoUrl,
        duration: '0:15'
      };

      if (isEditingVideo) {
        await editVideo(editingVideoId, payload);
        triggerAlert('success', 'Video updated successfully.');
      } else {
        await createVideo(payload);
        triggerAlert('success', 'Video uploaded successfully.');
      }
      
      resetVideoForm();
      setActiveTab('videos');
    } catch (err) {
      triggerAlert('error', `Video operation failed: ${err.message}`);
    }
  };

  const resetVideoForm = () => {
    setIsEditingVideo(false);
    setEditingVideoId(null);
    setVidTitle('');
    setVidDescription('');
    setVidCategory('politics');
    setVidAuthor('');
    setVidThumbUrl('');
    setVidThumbFile(null);
    setVidVideoUrl('');
    setVidVideoFile(null);
  };

  // Render Login Form if guest
  if (!adminUser) {
    return (
      <div className="login-wrapper-card glass-card animate-fade-in">
        <div className="login-icon-box">
          <Lock size={32} className="logo-lock-icon" />
        </div>
        <h2>Admin Authentication</h2>
        <p>Please enter credentials to gain editing permissions.</p>

        <form onSubmit={handleLoginSubmit} className="login-form-fields">
          <div className="input-group">
            <label htmlFor="user">Username</label>
            <input
              type="text"
              id="user"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="text-input-styled"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="pass">Password</label>
            <input
              type="password"
              id="pass"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-input-styled"
              required
            />
          </div>

          {authError && (
            <div className="auth-error-banner">
              <AlertCircle size={16} />
              <span>{authError}</span>
            </div>
          )}

          <div className="auth-hint">
            <Info size={14} /> Mock login: <strong>admin</strong> / <strong>admin123</strong>
          </div>

          <button type="submit" className="btn btn-primary login-submit-btn">
            Authenticate Session
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-page-container animate-fade-in">
      {/* 1. Header Toolbar */}
      <div className="admin-header-row">
        <div>
          <h1>Chronicle Workspace</h1>
          <p className="admin-welcome-sub">Welcome back, {adminUser.name} ({adminUser.role})</p>
        </div>
        <button className="btn btn-danger" onClick={logoutAdmin}>
          <LogOut size={16} /> End Session
        </button>
      </div>

      {/* Alert Banner */}
      {alertMessage && (
        <div className={`alert-banner-alert ${alertMessage.type} animate-fade-in`}>
          {alertMessage.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{alertMessage.text}</span>
        </div>
      )}

      {/* 2. Admin Workspace Grid */}
      <div className="admin-workspace-grid">
        {/* Left Column: Admin Navigation Menu */}
        <aside className="admin-nav-sidebar glass-card">
          <button 
            className={`admin-nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={18} /> Overview
          </button>
          
          <button 
            className={`admin-nav-tab ${activeTab === 'articles' ? 'active' : ''}`}
            onClick={() => setActiveTab('articles')}
          >
            <FileText size={18} /> Manage Articles
          </button>

          <button 
            className={`admin-nav-tab ${activeTab === 'videos' ? 'active' : ''}`}
            onClick={() => setActiveTab('videos')}
          >
            <VideoIcon size={18} /> Manage Videos
          </button>

          <div className="nav-divider"></div>

          <button 
            className={`admin-nav-tab publish-tab-btn ${activeTab === 'new-article' ? 'active' : ''}`}
            onClick={() => { resetArticleForm(); setActiveTab('new-article'); }}
          >
            <FilePlus size={18} /> Write Article
          </button>

          <button 
            className={`admin-nav-tab upload-tab-btn ${activeTab === 'new-video' ? 'active' : ''}`}
            onClick={() => { resetVideoForm(); setActiveTab('new-video'); }}
          >
            <PlusCircle size={18} /> Upload Video Report
          </button>

          <div className="nav-divider"></div>

          <button 
            className={`admin-nav-tab ${activeTab === 'cloud-db' ? 'active' : ''}`}
            onClick={() => setActiveTab('cloud-db')}
            style={{
              borderColor: isCloudActive ? 'rgba(74, 222, 128, 0.3)' : 'rgba(245, 158, 11, 0.2)',
              background: isCloudActive ? 'rgba(74, 222, 128, 0.05)' : 'rgba(245, 158, 11, 0.04)'
            }}
          >
            <Database size={18} style={{ color: isCloudActive ? '#4ade80' : '#f59e0b' }} /> Cloud Database
            <span 
              title={isCloudActive ? 'Firebase Firestore Active' : 'IndexedDB Local Mode'}
              style={{ 
                marginLeft: 'auto', 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                background: isCloudActive ? '#4ade80' : '#f59e0b',
                boxShadow: isCloudActive ? '0 0 8px #4ade80' : 'none'
              }} 
            />
          </button>
        </aside>

        {/* Right Column: Active Tab Workspace */}
        <main className="admin-view-workspace">
          
          {/* Tab A: Overview / Statistics Dashboard */}
          {activeTab === 'overview' && (
            <div className="tab-pane-content animate-fade-in">
              <h2 className="workspace-pane-title">Performance Analytics</h2>
              
              <div className="stats-dashboard-grid">
                <div className="stat-card-widget glass-card blue-glow">
                  <div className="stat-icon-wrap">
                    <FileText size={24} />
                  </div>
                  <div className="stat-details">
                    <p className="stat-count-number">{articles.length}</p>
                    <p className="stat-label">Total Articles</p>
                  </div>
                </div>

                <div className="stat-card-widget glass-card green-glow">
                  <div className="stat-icon-wrap">
                    <VideoIcon size={24} />
                  </div>
                  <div className="stat-details">
                    <p className="stat-count-number">{videos.length}</p>
                    <p className="stat-label">Uploaded Videos</p>
                  </div>
                </div>

                <div className="stat-card-widget glass-card purple-glow">
                  <div className="stat-icon-wrap">
                    <BarChart2 size={24} />
                  </div>
                  <div className="stat-details">
                    <p className="stat-count-number">{totalViews}</p>
                    <p className="stat-label">Total Views</p>
                  </div>
                </div>

                <div className="stat-card-widget glass-card red-glow">
                  <div className="stat-icon-wrap">
                    <AlertCircle size={24} />
                  </div>
                  <div className="stat-details">
                    <p className="stat-count-number">{totalComments}</p>
                    <p className="stat-label">Discussion Comments</p>
                  </div>
                </div>
              </div>

              {/* Quick Summary list */}
              <div className="recent-list-row">
                <div className="overview-sub-card glass-card">
                  <h3>Recent Articles</h3>
                  <div className="overview-items-list">
                    {articles.slice(0, 4).map(art => (
                      <div key={art.id} className="overview-item" onClick={() => navigateTo('article', art.id)}>
                        <img src={art.image} alt={art.title} className="overview-item-img" />
                        <div className="overview-item-desc">
                          <h4>{art.title}</h4>
                          <span>{formatDate(art.date)} • {art.views || 0} views</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Complete Android APK Manager Card */}
                <div className="overview-sub-card glass-card apk-admin-manager-card" style={{ flex: 1.2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Smartphone size={20} style={{ color: '#4ade80' }} />
                      <h3 style={{ margin: 0 }}>Android APK & Browser Downloads</h3>
                    </div>
                    <span className="apk-source-badge">
                      {apkDownloadUrl === '/chronicle-news.apk' ? '🟢 Local Web Server APK' : uploadedApkInfo ? '🟣 Uploaded Session APK' : '🔵 External Cloud Link'}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    Manage how mobile readers download the Chronicle News Android app directly in their browser.
                  </p>

                  {/* Test Download & Quick Reset Action */}
                  <div className="apk-quick-actions-bar">
                    <button 
                      type="button" 
                      onClick={triggerApkDownload}
                      className="apk-admin-btn primary"
                      title="Download the current active APK in this browser"
                    >
                      <Download size={14} /> Test Browser Download
                    </button>
                    {apkDownloadUrl !== '/chronicle-news.apk' && (
                      <button 
                        type="button" 
                        onClick={handleResetToLocalApk}
                        className="apk-admin-btn secondary"
                        title="Revert to /chronicle-news.apk"
                      >
                        Reset to /chronicle-news.apk
                      </button>
                    )}
                  </div>

                  {/* Option A: Upload New APK File */}
                  <div className="apk-upload-box">
                    <label className="apk-input-label">
                      <UploadCloud size={14} /> Upload Updated .apk File from Computer
                    </label>
                    <input 
                      type="file" 
                      accept=".apk"
                      onChange={handleApkFileUpload}
                      className="apk-file-input"
                    />
                    {uploadedApkInfo && (
                      <div className="apk-upload-success">
                        <CheckCircle2 size={14} color="#4ade80" />
                        <span>Active file: {uploadedApkInfo.name} ({uploadedApkInfo.size})</span>
                      </div>
                    )}
                  </div>

                  {/* Option B: External or Custom Hosted URL */}
                  <div className="apk-url-override-box">
                    <label className="apk-input-label">
                      Or Set Custom URL (Google Drive, GitHub Release, CDN)
                    </label>
                    <form onSubmit={handleSaveApkLink} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <input 
                        type="text"
                        value={apkUrlInput}
                        onChange={(e) => setApkUrlInput(e.target.value)}
                        placeholder="/chronicle-news.apk or https://drive.google.com/..."
                        className="text-input-styled"
                        style={{ flex: 1, minWidth: '200px' }}
                        required
                      />
                      <button type="submit" className="action-btn-primary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                        Save Link
                      </button>
                    </form>
                  </div>

                  {/* Helper footer */}
                  <div className="apk-build-tips">
                    <Terminal size={13} style={{ color: '#94a3b8' }} />
                    <span>To re-compile APK: Run <code>build-apk.bat</code> or push to GitHub for automated CI.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab B: Manage Articles List */}
          {activeTab === 'articles' && (
            <div className="tab-pane-content animate-fade-in">
              <h2 className="workspace-pane-title">Articles Catalog ({articles.length})</h2>
              
              <div className="catalog-table-wrap glass-card">
                {articles.length === 0 ? (
                  <p className="empty-catalog-text">No articles found in local database. Seed or write some.</p>
                ) : (
                  <table className="catalog-table">
                    <thead>
                      <tr>
                        <th>Title & Info</th>
                        <th>Category</th>
                        <th>Date Published</th>
                        <th>Views</th>
                        <th className="align-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {articles.map((art) => (
                        <tr key={art.id}>
                          <td>
                            <div className="catalog-title-col">
                              <img src={art.image} alt="" className="table-thumb" />
                              <div>
                                <span className="table-title-main">{art.title}</span>
                                <span className="table-subtitle">By {art.author || 'Editorial'}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge badge-${art.category} mini-badge`}>{art.category}</span>
                          </td>
                          <td className="table-date-cell">{formatDate(art.date)}</td>
                          <td className="table-views-cell">{art.views || 0}</td>
                          <td>
                            <div className="table-actions-cell">
                              <button 
                                className="table-action-btn edit" 
                                onClick={() => loadArticleForEditing(art)}
                                title="Edit Article"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button 
                                className="table-action-btn delete" 
                                onClick={() => openDeleteConfirm('article', art.id)}
                                title="Delete Article"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Tab C: Manage Videos List */}
          {activeTab === 'videos' && (
            <div className="tab-pane-content animate-fade-in">
              <h2 className="workspace-pane-title">Video Library ({videos.length})</h2>
              
              <div className="catalog-table-wrap glass-card">
                {videos.length === 0 ? (
                  <p className="empty-catalog-text">No news clips found in local database.</p>
                ) : (
                  <table className="catalog-table">
                    <thead>
                      <tr>
                        <th>Clip & Title</th>
                        <th>Category</th>
                        <th>Date Uploaded</th>
                        <th>Views</th>
                        <th className="align-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {videos.map((vid) => (
                        <tr key={vid.id}>
                          <td>
                            <div className="catalog-title-col">
                              <img src={vid.thumbnailUrl} alt="" className="table-thumb" />
                              <div>
                                <span className="table-title-main">{vid.title}</span>
                                <span className="table-subtitle">By {vid.author || 'Chronicle'}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge badge-${vid.category} mini-badge`}>{vid.category}</span>
                          </td>
                          <td className="table-date-cell">{formatDate(vid.date)}</td>
                          <td className="table-views-cell">{vid.views || 0}</td>
                          <td>
                            <div className="table-actions-cell">
                              <button 
                                className="table-action-btn edit" 
                                onClick={() => loadVideoForEditing(vid)}
                                title="Edit Video"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button 
                                className="table-action-btn delete" 
                                onClick={() => openDeleteConfirm('video', vid.id)}
                                title="Delete Video"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Tab D: Publish News Article Form */}
          {activeTab === 'new-article' && (
            <div className="tab-pane-content animate-fade-in">
              <h2 className="workspace-pane-title">
                {isEditingArticle ? `Edit Article: "${artTitle.substring(0,25)}..."` : 'Compose News Article'}
              </h2>

              <form onSubmit={handleArticleSubmit} className="editor-form glass-card">
                <div className="form-row-double">
                  <div className="input-group">
                    <label>Article Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Breaking: Strategic Decarbonization Accord Finalized"
                      value={artTitle}
                      onChange={(e) => setArtTitle(e.target.value)}
                      className="text-input-styled"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Category *</label>
                    <select 
                      value={artCategory} 
                      onChange={(e) => setArtCategory(e.target.value)}
                      className="text-input-styled select-styled"
                    >
                      <option value="politics">Politics</option>
                      <option value="tech">Technology</option>
                      <option value="world">World</option>
                      <option value="sports">Sports</option>
                      <option value="business">Business</option>
                      <option value="entertainment">Entertainment</option>
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label>Brief Summary / Excerpt *</label>
                  <input
                    type="text"
                    placeholder="Provide a compelling 1-2 sentence preview summary of the article..."
                    value={artSummary}
                    onChange={(e) => setArtSummary(e.target.value)}
                    className="text-input-styled"
                    required
                  />
                </div>

                <div className="form-row-double">
                  <div className="input-group">
                    <label>Author / Journalist Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Jane Rostova"
                      value={artAuthor}
                      onChange={(e) => setArtAuthor(e.target.value)}
                      className="text-input-styled"
                    />
                  </div>

                  <div className="input-group">
                    <label>Cover Image Source URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... (Optional if uploading file)"
                      value={artImageUrl}
                      onChange={(e) => setArtImageUrl(e.target.value)}
                      className="text-input-styled"
                    />
                  </div>
                </div>

                {/* Local Image File Upload selector */}
                <div className="input-group upload-file-box">
                  <label>Or Upload Cover Image File</label>
                  <div className="drag-upload-zone">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setArtImageFile(e.target.files[0])}
                      className="file-zone-input"
                    />
                    <FilePlus size={24} />
                    <p>{artImageFile ? `Selected: ${artImageFile.name}` : 'Drag & drop image here or click to browse'}</p>
                  </div>
                </div>

                <div className="input-group">
                  <label>Article Main Body *</label>
                  <textarea
                    placeholder="Compose the editorial content of your news article. Separate paragraphs with double enter spacing..."
                    value={artBody}
                    onChange={(e) => setArtBody(e.target.value)}
                    className="comment-textarea body-text-area"
                    rows={12}
                    required
                  ></textarea>
                </div>

                <div className="form-actions-row">
                  <button type="button" className="btn btn-secondary" onClick={resetArticleForm}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {isEditingArticle ? 'Save Modifications' : 'Publish Article'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab E: Upload / Edit Video Report Form */}
          {activeTab === 'new-video' && (
            <div className="tab-pane-content animate-fade-in">
              <h2 className="workspace-pane-title">
                {isEditingVideo ? `Edit Video: "${vidTitle.substring(0,25)}..."` : 'Upload News Video Report'}
              </h2>

              <form onSubmit={handleVideoSubmit} className="editor-form glass-card">
                <div className="form-row-double">
                  <div className="input-group">
                    <label>Video Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Special Report: Decarbonization Alliance Logistics"
                      value={vidTitle}
                      onChange={(e) => setVidTitle(e.target.value)}
                      className="text-input-styled"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Category *</label>
                    <select 
                      value={vidCategory} 
                      onChange={(e) => setVidCategory(e.target.value)}
                      className="text-input-styled select-styled"
                    >
                      <option value="politics">Politics</option>
                      <option value="tech">Technology</option>
                      <option value="world">World</option>
                      <option value="sports">Sports</option>
                      <option value="business">Business</option>
                      <option value="entertainment">Entertainment</option>
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label>Description / Metadata</label>
                  <input
                    type="text"
                    placeholder="Provide a description of the news clips contents..."
                    value={vidDescription}
                    onChange={(e) => setVidDescription(e.target.value)}
                    className="text-input-styled"
                  />
                </div>

                <div className="form-row-double">
                  <div className="input-group">
                    <label>Reporter / Agency Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Michael Vance"
                      value={vidAuthor}
                      onChange={(e) => setVidAuthor(e.target.value)}
                      className="text-input-styled"
                    />
                  </div>

                  <div className="input-group">
                    <label>Thumbnail Cover Image URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... (Optional if uploading file)"
                      value={vidThumbUrl}
                      onChange={(e) => setVidThumbUrl(e.target.value)}
                      className="text-input-styled"
                    />
                  </div>
                </div>

                <div className="form-row-double">
                  {/* Thumbnail File upload */}
                  <div className="input-group upload-file-box">
                    <label>Upload Thumbnail File</label>
                    <div className="drag-upload-zone small-zone">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setVidThumbFile(e.target.files[0])}
                        className="file-zone-input"
                      />
                      <FilePlus size={18} />
                      <p>{vidThumbFile ? `Selected: ${vidThumbFile.name}` : 'Click to select thumbnail image'}</p>
                    </div>
                  </div>

                  {/* Video File upload */}
                  <div className="input-group upload-file-box">
                    <label>Upload Video MP4 File *</label>
                    <div className="drag-upload-zone small-zone">
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/ogg"
                        onChange={(e) => setVidVideoFile(e.target.files[0])}
                        className="file-zone-input"
                      />
                      <Video size={18} />
                      <p>{vidVideoFile ? `Selected: ${vidVideoFile.name}` : 'Click to select local MP4 video file'}</p>
                    </div>
                  </div>
                </div>

                <div className="input-group">
                  <label>Or Streaming Video Source URL</label>
                  <input
                    type="url"
                    placeholder="https://commondatastorage.googleapis.com/... (Fallback public URL)"
                    value={vidVideoUrl}
                    onChange={(e) => setVidVideoUrl(e.target.value)}
                    className="text-input-styled"
                  />
                </div>

                <div className="form-actions-row">
                  <button type="button" className="btn btn-secondary" onClick={resetVideoForm}>
                    Clear Form
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {isEditingVideo ? 'Save Changes' : 'Publish Video Report'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab F: Cloud Database (Firebase Firestore) Management */}
          {activeTab === 'cloud-db' && (
            <div className="tab-pane-content animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 className="workspace-pane-title" style={{ margin: 0 }}>Cloud Database & Cross-Device Sync</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                    Connect Google Firebase Firestore to instantly sync articles and videos between your Web portal and Android APK.
                  </p>
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: isCloudActive ? 'rgba(74, 222, 128, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  color: isCloudActive ? '#4ade80' : '#f59e0b',
                  border: isCloudActive ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: isCloudActive ? '#4ade80' : '#f59e0b',
                    boxShadow: isCloudActive ? '0 0 8px #4ade80' : 'none'
                  }} />
                  {isCloudActive ? `Firebase Firestore Active (${cloudProjectId || 'Connected'})` : 'Local IndexedDB (Offline Mode)'}
                </div>
              </div>

              {/* Status & Migration Banner */}
              <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', borderLeft: `4px solid ${isCloudActive ? '#4ade80' : '#f59e0b'}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isCloudActive ? <Cloud size={20} color="#4ade80" /> : <Server size={20} color="#f59e0b" />}
                      {isCloudActive ? 'Live Real-Time Cloud Sync Active' : 'Operating in Local Storage Mode'}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
                      {isCloudActive 
                        ? 'All updates made in this dashboard instantly broadcast via WebSockets/Firestore to all readers browsing the website and all users running the Android APK.' 
                        : 'Articles are currently saved only to this browser’s IndexedDB. Connect Firebase Firestore below to enable public distribution and mobile device syncing.'}
                    </p>
                  </div>

                  {isCloudActive ? (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={handleSyncCloud}
                        disabled={isSyncingCloud}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <RefreshCw size={15} className={isSyncingCloud ? 'animate-spin' : ''} />
                        {isSyncingCloud ? 'Uploading to Cloud...' : 'Sync Local Content to Cloud'}
                      </button>
                      <button
                        type="button"
                        onClick={handleClearCloud}
                        className="btn btn-secondary"
                        style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                      >
                        Disconnect Cloud
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Configuration Section */}
              <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Database size={18} color="var(--accent-blue)" /> Firebase Connection Credentials
                  </h3>
                  
                  {/* Mode Toggle */}
                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '3px' }}>
                    <button
                      type="button"
                      onClick={() => setCloudConfigMode('json')}
                      style={{
                        padding: '4px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: cloudConfigMode === 'json' ? 'var(--accent-blue)' : 'transparent',
                        color: cloudConfigMode === 'json' ? '#000' : 'var(--text-muted)'
                      }}
                    >
                      Paste Config JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => setCloudConfigMode('manual')}
                      style={{
                        padding: '4px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: cloudConfigMode === 'manual' ? 'var(--accent-blue)' : 'transparent',
                        color: cloudConfigMode === 'manual' ? '#000' : 'var(--text-muted)'
                      }}
                    >
                      Manual Fields
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSaveCloud}>
                  {cloudConfigMode === 'json' ? (
                    <div className="input-group" style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Firebase Config Snippet (from Firebase Console)</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Auto-strips variable declarations</span>
                      </label>
                      <textarea
                        rows={7}
                        value={cloudJsonInput}
                        onChange={(e) => setCloudJsonInput(e.target.value)}
                        placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "my-news-app.firebaseapp.com",\n  "projectId": "my-news-app",\n  "storageBucket": "my-news-app.appspot.com",\n  "messagingSenderId": "...",\n  "appId": "..."\n}`}
                        className="text-input-styled"
                        style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                      <div className="input-group">
                        <label>Firebase API Key *</label>
                        <input
                          type="text"
                          value={cloudApiKey}
                          onChange={(e) => setCloudApiKey(e.target.value)}
                          placeholder="AIzaSy..."
                          className="text-input-styled"
                          required
                        />
                      </div>
                      <div className="input-group">
                        <label>Project ID *</label>
                        <input
                          type="text"
                          value={cloudProjectId}
                          onChange={(e) => setCloudProjectId(e.target.value)}
                          placeholder="chronicle-news-12345"
                          className="text-input-styled"
                          required
                        />
                      </div>
                      <div className="input-group">
                        <label>Auth Domain</label>
                        <input
                          type="text"
                          value={cloudAuthDomain}
                          onChange={(e) => setCloudAuthDomain(e.target.value)}
                          placeholder="chronicle-news.firebaseapp.com"
                          className="text-input-styled"
                        />
                      </div>
                      <div className="input-group">
                        <label>Storage Bucket</label>
                        <input
                          type="text"
                          value={cloudStorageBucket}
                          onChange={(e) => setCloudStorageBucket(e.target.value)}
                          placeholder="chronicle-news.appspot.com"
                          className="text-input-styled"
                        />
                      </div>
                      <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                        <label>App ID (Optional)</label>
                        <input
                          type="text"
                          value={cloudAppId}
                          onChange={(e) => setCloudAppId(e.target.value)}
                          placeholder="1:123456789012:web:abcdef123456"
                          className="text-input-styled"
                        />
                      </div>
                    </div>
                  )}

                  {/* Test Feedback Message */}
                  {cloudTestResult && (
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.88rem',
                      background: cloudTestResult.success ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: cloudTestResult.success ? '#4ade80' : '#f87171',
                      border: cloudTestResult.success ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                    }}>
                      {cloudTestResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      <span>{cloudTestResult.message}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleTestCloud}
                      disabled={isTestingCloud}
                      className="btn btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <RefreshCw size={14} className={isTestingCloud ? 'animate-spin' : ''} />
                      {isTestingCloud ? 'Testing...' : 'Test Connection'}
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      Save & Connect Firebase
                    </button>
                  </div>
                </form>
              </div>

              {/* 3-Minute Setup Guide */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Info size={16} color="var(--accent-blue)" /> Quick Guide: How to Get Free Firebase Keys in 3 Minutes
                </h3>
                <ol style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.8 }}>
                  <li>Go to Google's free console at <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)' }}>console.firebase.google.com</a> and click <strong>Add project</strong>.</li>
                  <li>In the sidebar, open <strong>Build &rarr; Firestore Database</strong>, click <strong>Create database</strong>, and choose <strong>Start in test mode</strong>.</li>
                  <li>Click the gear icon next to Project Overview &rarr; <strong>Project settings</strong>. Scroll down to <strong>Your apps</strong> and click the <strong>Web (&lt;/&gt;)</strong> icon.</li>
                  <li>Copy the generated <code>firebaseConfig</code> code snippet, paste it into the box above, and click <strong>Save & Connect Firebase</strong>.</li>
                </ol>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Action Dialog: Confirm Delete Entry */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
      >
        <p>Are you sure you want to permanently delete this news asset? This action will remove the record from your local database and cannot be undone.</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel Action
          </button>
          <button className="btn btn-danger" onClick={executeDeleteItem}>
            Yes, Delete Asset
          </button>
        </div>
      </Modal>

    </div>
  );
}
