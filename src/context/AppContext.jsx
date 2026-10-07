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

  // Initialize DB and Load Data
  const loadData = async () => {
    try {
      setLoading(true);
      await dbService.seedIfEmpty();
      const arts = await dbService.getArticles();
      const vids = await dbService.getVideos();
      
      // Sort articles and videos by date descending
      arts.sort((a, b) => new Date(b.date) - new Date(a.date));
      vids.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setArticles(arts);
      setVideos(vids);
    } catch (err) {
      console.error('Error seeding/loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      navigateTo,
      createArticle,
      editArticle,
      removeArticle,
      createVideo,
      removeVideo,
      loginAdmin,
      logoutAdmin
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
