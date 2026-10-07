import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  PlusCircle, Edit3, Trash2, LayoutDashboard, FileText, Video as VideoIcon, 
  BarChart2, FilePlus, Video, LogOut, Check, AlertCircle, Info, Lock, Smartphone, ExternalLink
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
    removeVideo,
    adminUser,
    loginAdmin,
    logoutAdmin,
    navigateTo,
    apkDownloadUrl,
    updateApkDownloadUrl
  } = useApp();

  const [apkUrlInput, setApkUrlInput] = useState(apkDownloadUrl || '');

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
  const [vidTitle, setVidTitle] = useState('');
  const [vidDescription, setVidDescription] = useState('');
  const [vidCategory, setVidCategory] = useState('politics');
  const [vidAuthor, setVidAuthor] = useState('');
  const [vidThumbUrl, setVidThumbUrl] = useState('');
  const [vidThumbFile, setVidThumbFile] = useState(null);
  const [vidVideoUrl, setVidVideoUrl] = useState('');
  const [vidVideoFile, setVidVideoFile] = useState(null);

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

      // Read image file as Base64 if uploaded
      if (artImageFile) {
        finalImgUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(artImageFile);
        });
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

  // Form Submission: Upload Video
  const handleVideoSubmit = async (e) => {
    e.preventDefault();
    try {
      let finalThumbUrl = vidThumbUrl || 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=800&q=80';
      let finalVideoUrl = vidVideoUrl;

      // Read thumbnail file as Base64 if uploaded
      if (vidThumbFile) {
        finalThumbUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(vidThumbFile);
        });
      }

      // Handle raw video file upload
      if (vidVideoFile) {
        // We create an Object URL to play local file instantly, 
        // and store it as a raw Blob if we had a persistent Blob store,
        // but for lightweight local demonstration we can generate a local Object URL
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
        duration: '0:15' // default mock duration
      };

      await createVideo(payload);
      triggerAlert('success', 'Video uploaded successfully.');
      
      resetVideoForm();
      setActiveTab('videos');
    } catch (err) {
      triggerAlert('error', `Video upload failed: ${err.message}`);
    }
  };

  const resetVideoForm = () => {
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

                {/* Google Drive APK Download Link Card */}
                <div className="overview-sub-card glass-card" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Smartphone size={20} style={{ color: '#4ade80' }} />
                    <h3 style={{ margin: 0 }}>Android App (APK) Download Link</h3>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Paste your Google Drive link or hosted APK file link below. Google Drive sharing links will be automatically converted to 1-click direct download links.
                  </p>
                  
                  <form onSubmit={handleSaveApkLink} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input 
                      type="url"
                      value={apkUrlInput}
                      onChange={(e) => setApkUrlInput(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      className="text-input-styled"
                      style={{ width: '100%' }}
                      required
                    />
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <button type="submit" className="action-btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                        Save Link
                      </button>
                      {apkDownloadUrl && (
                        <a 
                          href={apkDownloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '0.85rem', color: '#60a5fa', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                        >
                          Test Link <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </form>
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

          {/* Tab E: Upload Video Report Form */}
          {activeTab === 'new-video' && (
            <div className="tab-pane-content animate-fade-in">
              <h2 className="workspace-pane-title">Upload News Video Report</h2>

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
                    Publish Video Report
                  </button>
                </div>
              </form>
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
