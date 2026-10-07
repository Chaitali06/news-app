import React from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen, Calendar, Eye, Clock, SearchX, ArrowRight, Play } from 'lucide-react';

export default function Home() {
  const {
    articles,
    videos,
    activeCategory,
    searchQuery,
    navigateTo
  } = useApp();

  // Helper to format date cleanly
  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // 1. Filter articles based on category and search query
  const filteredArticles = articles.filter((art) => {
    const matchesCategory = activeCategory === 'all' || art.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.body.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 2. Select the top featured article (latest of all or filtered)
  const featuredArticle = filteredArticles[0];
  const gridArticles = filteredArticles.slice(1);

  // 3. Top trending articles (by views)
  const trendingArticles = [...articles]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 4);

  // 4. Quick video highlights (take latest 3)
  const recentVideos = videos.slice(0, 3);

  // Category title display helper
  const getCategoryTitle = () => {
    if (searchQuery) return `Search Results for "${searchQuery}"`;
    if (activeCategory === 'all') return 'Latest Headlines';
    return activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);
  };

  return (
    <div className="home-page-container animate-fade-in">
      {/* 1. Hero Spotlight Section (Only on "All" category and when no search query) */}
      {!searchQuery && activeCategory === 'all' && featuredArticle && (
        <section className="hero-spotlight-section">
          <div className="hero-card glass-card" onClick={() => navigateTo('article', featuredArticle.id)}>
            <div className="hero-image-wrap">
              <img src={featuredArticle.image} alt={featuredArticle.title} className="hero-image" />
              <div className="hero-overlay"></div>
              <span className={`badge badge-${featuredArticle.category} hero-badge`}>
                {featuredArticle.category}
              </span>
            </div>
            <div className="hero-content">
              <span className="hero-spotlight-tag">SPOTLIGHT</span>
              <h1 className="hero-title">{featuredArticle.title}</h1>
              <p className="hero-summary">{featuredArticle.summary}</p>
              
              <div className="card-meta">
                <span className="meta-item"><Calendar size={14} /> {formatDate(featuredArticle.date)}</span>
                <span className="meta-item"><Clock size={14} /> {featuredArticle.readTime} min read</span>
                <span className="meta-item"><Eye size={14} /> {featuredArticle.views} views</span>
              </div>
              
              <div className="hero-action-link">
                Read Full Coverage <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Main Double-Column Layout (News Feed vs Side Bar) */}
      <div className="home-grid-layout">
        {/* Left Column: News Feed */}
        <div className="feed-column">
          <h2 className="feed-header-title">
            <span className="header-dot-indicator"></span>
            {getCategoryTitle()}
          </h2>

          {filteredArticles.length === 0 ? (
            <div className="empty-search-state glass-card">
              <SearchX size={48} className="empty-icon" />
              <h3>No articles found</h3>
              <p>We couldn't find any articles matching your search criteria. Try using different keywords or resetting filters.</p>
            </div>
          ) : (
            <div className="news-feed-grid">
              {/* If Spotlight was shown, display rest. Otherwise display all in the grid. */}
              {(!searchQuery && activeCategory === 'all' ? gridArticles : filteredArticles).map((art) => (
                <article
                  key={art.id}
                  className="news-card glass-card"
                  onClick={() => navigateTo('article', art.id)}
                >
                  <div className="card-img-wrap">
                    <img src={art.image} alt={art.title} className="card-image" />
                    <span className={`badge badge-${art.category} card-badge`}>
                      {art.category}
                    </span>
                  </div>
                  <div className="card-body-wrap">
                    <h3 className="card-title-text">{art.title}</h3>
                    <p className="card-excerpt-text">{art.summary}</p>
                    <div className="card-meta">
                      <span className="meta-item"><Calendar size={12} /> {formatDate(art.date)}</span>
                      <span className="meta-item"><Clock size={12} /> {art.readTime} min</span>
                      <span className="meta-item"><Eye size={12} /> {art.views}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Sidebar */}
        <aside className="sidebar-column">
          {/* Quick Video Highlights Widget */}
          {recentVideos.length > 0 && (
            <div className="sidebar-widget glass-card">
              <h3 className="widget-title">
                <span className="widget-dot green"></span>
                Video Reports
              </h3>
              <div className="sidebar-videos-list">
                {recentVideos.map((vid) => (
                  <div 
                    key={vid.id} 
                    className="sidebar-video-item"
                    onClick={() => navigateTo('video', vid.id)}
                  >
                    <div className="sidebar-vid-thumb-wrap">
                      <img src={vid.thumbnailUrl} alt={vid.title} className="sidebar-vid-thumb" />
                      <div className="sidebar-vid-overlay">
                        <div className="play-icon-small">
                          <Play size={12} fill="#fff" />
                        </div>
                      </div>
                      <span className="sidebar-vid-duration">{vid.duration || '0:15'}</span>
                    </div>
                    <div className="sidebar-vid-details">
                      <h4 className="sidebar-vid-title">{vid.title}</h4>
                      <span className={`badge badge-${vid.category} mini-badge`}>{vid.category}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="sidebar-widget-action" onClick={() => navigateTo('video')}>
                Enter Video Hub <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Trending Articles Widget */}
          <div className="sidebar-widget glass-card">
            <h3 className="widget-title">
              <span className="widget-dot red"></span>
              Trending Stories
            </h3>
            <div className="trending-stories-list">
              {trendingArticles.map((art, index) => (
                <div 
                  key={art.id} 
                  className="trending-story-item"
                  onClick={() => navigateTo('article', art.id)}
                >
                  <span className="trending-number">0{index + 1}</span>
                  <div className="trending-details">
                    <span className={`badge badge-${art.category} mini-badge`}>{art.category}</span>
                    <h4 className="trending-story-title">{art.title}</h4>
                    <span className="trending-story-views">{art.views || 0} readers</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
