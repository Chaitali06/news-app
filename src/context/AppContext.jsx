import React, { createContext, useContext, useState, useEffect } from 'react';
import { dbService } from '../services/db';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [articles, setArticles] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentRoute, setCurrentRoute] = useState('home'); // 'home', 'article', 'video', 'admin'
  const [activeArticleId, setActiveArticleId] = useState(null);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  
  // Admin Session State
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem('chronicle_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [adminTargetArticle, setAdminTargetArticle] = useState(null);

  // Android APK Download URL (Defaults to local hosted APK, supports external links)
  const [apkDownloadUrl, setApkDownloadUrl] = useState(() => {
    const saved = localStorage.getItem('chronicle_apk_url');
    if (!saved || saved === 'https://drive.google.com/' || saved.trim() === '' || saved === '/chronicle-news.apk') {
      return 'chronicle-news.apk';
    }
    return saved;
  });

  const [isApkModalOpen, setIsApkModalOpen] = useState(false);

  const updateApkDownloadUrl = (url) => {
    let finalUrl = (url || '').trim();
    if (!finalUrl) {
      finalUrl = 'chronicle-news.apk';
    } else {
      // If it's a standard Google Drive sharing link, auto-convert to direct download link
      const driveMatch = finalUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (driveMatch && driveMatch[1]) {
        finalUrl = `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
      }
    }
    setApkDownloadUrl(finalUrl);
    localStorage.setItem('chronicle_apk_url', finalUrl);
  };

  const triggerApkDownload = () => {
    const link = document.createElement('a');
    link.href = apkDownloadUrl;
    link.download = 'ChronicleNews-v1.0.0.apk';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isCloudActive, setIsCloudActive] = useState(() => dbService.isCloudActive());

  // Initialize DB and Load Data with instant local rendering
  const loadData = async () => {
    try {
      // 1. Immediately seed and load local storage (< 50ms)
      await dbService.seedIfEmpty();
      const localArts = await dbService.getLocalArticles();
      const localVids = await dbService.getLocalVideos();
      
      localArts.sort((a, b) => new Date(b.date) - new Date(a.date));
      localVids.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      if (localArts.length > 0) setArticles(localArts);
      if (localVids.length > 0) setVideos(localVids);
      setIsCloudActive(dbService.isCloudActive());
    } catch (err) {
      console.warn('Error loading initial local cache:', err);
    } finally {
      // UNLOCK SPLASH SCREEN IMMEDIATELY
      setLoading(false);
    }

    // 2. Fetch fresh cloud articles in background without blocking UI
    if (dbService.isCloudActive()) {
      try {
        const cloudArts = await dbService.getArticles();
        if (cloudArts && cloudArts.length > 0) {
          cloudArts.sort((a, b) => new Date(b.date) - new Date(a.date));
          setArticles(cloudArts);
        }
        const cloudVids = await dbService.getVideos();
        if (cloudVids && cloudVids.length > 0) {
          cloudVids.sort((a, b) => new Date(b.date) - new Date(a.date));
          setVideos(cloudVids);
        }
      } catch (cloudErr) {
        console.warn('Background cloud fetch notice:', cloudErr);
      }
    }
  };

  useEffect(() => {
    loadData();

    // Setup real-time listeners if Cloud is active
    let unsubscribeArticles = () => {};
    let unsubscribeVideos = () => {};

    if (dbService.isCloudActive()) {
      unsubscribeArticles = dbService.subscribeArticles((cloudArticles) => {
        cloudArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
        setArticles(cloudArticles);
      });

      unsubscribeVideos = dbService.subscribeVideos((cloudVideos) => {
        cloudVideos.sort((a, b) => new Date(b.date) - new Date(a.date));
        setVideos(cloudVideos);
      });
    }

    return () => {
      unsubscribeArticles();
      unsubscribeVideos();
    };
  }, [isCloudActive]);

  const saveCloudConfig = (config) => {
    const ok = dbService.saveCloudConfig(config);
    if (ok) {
      setIsCloudActive(dbService.isCloudActive());
      loadData();
    }
    return ok;
  };

  const clearCloudConfig = () => {
    dbService.clearCloudConfig();
    setIsCloudActive(false);
    loadData();
  };

  const syncLocalToCloud = async () => {
    return await dbService.syncLocalToCloud();
  };

  const testCloudConnection = async (config) => {
    return await dbService.testCloudConnection(config);
  };


  // Navigation Helper
  const navigateTo = (route, activeId = null) => {
    setCurrentRoute(route);
    setSearchQuery(''); // Clear search on navigation
    
    if (route === 'article') {
      setActiveArticleId(activeId);
      // Increment views count in background
      if (activeId) {
        incrementArticleViews(activeId);
      }
    } else if (route === 'video') {
      setActiveVideoId(activeId);
      if (activeId) {
        incrementVideoViews(activeId);
      }
    } else {
      setActiveArticleId(null);
      setActiveVideoId(null);
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // View counter increments
  const incrementArticleViews = async (id) => {
    try {
      const art = articles.find(a => a.id === id);
      if (art) {
        const updated = { ...art, views: (art.views || 0) + 1 };
        await dbService.updateArticle(updated);
        setArticles(prev => prev.map(a => a.id === id ? updated : a));
      }
    } catch (err) {
      console.error('Failed to increment views:', err);
    }
  };

  const incrementVideoViews = async (id) => {
    try {
      const vid = videos.find(v => v.id === id);
      if (vid) {
        const updated = { ...vid, views: (vid.views || 0) + 1 };
        // IndexedDB put
        const dbArticles = await dbService.getArticles(); // check just in case, but dbService handles putting
        await dbService.addVideo(updated); // put/add handles rewrite for matching primary key in IndexedDB
        setVideos(prev => prev.map(v => v.id === id ? updated : v));
      }
    } catch (err) {
      console.error('Failed to increment video views:', err);
    }
  };

  // Article Actions
  const createArticle = async (articleData) => {
    const newArticle = {
      id: `art-${Date.now()}`,
      date: new Date().toISOString(),
      views: 0,
      readTime: Math.max(1, Math.round(articleData.body.split(/\s+/).length / 200)),
      ...articleData
    };
    await dbService.addArticle(newArticle);
    setArticles(prev => [newArticle, ...prev]);
    return newArticle;
  };

  const editArticle = async (id, updatedFields) => {
    const article = articles.find(a => a.id === id);
    if (!article) return;
    const updated = {
      ...article,
      ...updatedFields,
      readTime: Math.max(1, Math.round((updatedFields.body || article.body).split(/\s+/).length / 200))
    };
    await dbService.updateArticle(updated);
    setArticles(prev => prev.map(a => a.id === id ? updated : a));
  };

  const removeArticle = async (id) => {
    await dbService.deleteArticle(id);
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  // Video Actions
  const createVideo = async (videoData) => {
    const newVideo = {
      id: `vid-${Date.now()}`,
      date: new Date().toISOString(),
      views: 0,
      ...videoData
    };
    await dbService.addVideo(newVideo);
    setVideos(prev => [newVideo, ...prev]);
    return newVideo;
  };

  const removeVideo = async (id) => {
    await dbService.deleteVideo(id);
    setVideos(prev => prev.filter(v => v.id !== id));
  };

  const editVideo = async (id, updatedFields) => {
    const video = videos.find(v => v.id === id);
    if (!video) return;
    const updated = {
      ...video,
      ...updatedFields
    };
    await dbService.updateVideo(updated);
    setVideos(prev => prev.map(v => v.id === id ? updated : v));
  };

  // Admin Authentication Actions
  const loginAdmin = (username, password) => {
    if (username === 'admin' && password === 'admin123') {
      const user = { username, name: 'Lead Editor', role: 'administrator' };
      setAdminUser(user);
      localStorage.setItem('chronicle_admin_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setAdminUser(null);
    localStorage.removeItem('chronicle_admin_user');
    if (currentRoute === 'admin') {
      navigateTo('home');
    }
  };

  return (
    <AppContext.Provider value={{
      articles,
      videos,
      loading,
      currentRoute,
      activeArticleId,
      activeVideoId,
      searchQuery,
      setSearchQuery,
      activeCategory,
      setActiveCategory,
      adminUser,
      adminTargetArticle,
      setAdminTargetArticle,
      navigateTo,
      createArticle,
      editArticle,
      removeArticle,
      createVideo,
      editVideo,
      removeVideo,
      loginAdmin,
      logoutAdmin,
      apkDownloadUrl,
      updateApkDownloadUrl,
      isApkModalOpen,
      setIsApkModalOpen,
      triggerApkDownload,
      isCloudActive,
      saveCloudConfig,
      clearCloudConfig,
      syncLocalToCloud,
      testCloudConnection,
      getCloudConfig: () => dbService.getCloudConfig(),
      loadData
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
