import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Radio, User, LogOut, Menu, X, BookOpen, Video, PlusCircle } from 'lucide-react';

export default function Navigation() {
  const {
    currentRoute,
    navigateTo,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    adminUser,
    logoutAdmin
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const categories = [
    { id: 'all', label: 'All News' },
    { id: 'politics', label: 'Politics' },
    { id: 'tech', label: 'Technology' },
    { id: 'world', label: 'World' },
    { id: 'sports', label: 'Sports' },
    { id: 'business', label: 'Business' },
    { id: 'entertainment', label: 'Entertainment' }
  ];

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId);
    if (currentRoute !== 'home') {
      navigateTo('home');
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar-container">
      <div className="navbar-main">
        {/* Brand Logo */}
        <div className="logo-section" onClick={() => navigateTo('home')}>
          <div className="logo-icon-wrap">
            <Radio className="logo-icon pulse-animation" size={24} />
          </div>
          <span className="logo-text">CHRONICLE</span>
        </div>

        {/* Global Search Bar */}
        <div className="search-bar-wrap">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search news, videos, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav">
          <button 
            className={`nav-link ${currentRoute === 'home' && activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => handleCategoryClick('all')}
          >
            <BookOpen size={16} /> Read Portal
          </button>
          
          <button 
            className={`nav-link ${currentRoute === 'video' ? 'active' : ''}`}
            onClick={() => navigateTo('video', null)}
          >
            <Video size={16} /> Video Hub
          </button>

          {adminUser ? (
            <div className="admin-status-nav">
              <button 
                className={`nav-link admin-btn ${currentRoute === 'admin' ? 'active' : ''}`}
                onClick={() => navigateTo('admin')}
              >
                <PlusCircle size={16} /> Admin Panel
              </button>
              <button className="logout-icon-btn" onClick={logoutAdmin} title="Sign Out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button 
              className={`nav-link login-btn ${currentRoute === 'admin' ? 'active' : ''}`}
              onClick={() => navigateTo('admin')}
            >
              <User size={16} /> Admin Access
            </button>
          )}
        </nav>

        {/* Mobile Hamburger Toggle */}
        <button 
          className="mobile-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Categories Bar (Sticky below navbar on desktop) */}
      <div className="categories-subbar">
        <div className="categories-inner">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer animate-fade-in">
          {/* Mobile Search */}
          <div className="mobile-search-wrap">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="drawer-divider"></div>

          {/* Navigation links */}
          <div className="mobile-drawer-links">
            <button 
              className={`mobile-drawer-link ${currentRoute === 'home' ? 'active' : ''}`}
              onClick={() => { navigateTo('home'); setMobileMenuOpen(false); }}
            >
              <BookOpen size={18} /> Articles & Feed
            </button>
            <button 
              className={`mobile-drawer-link ${currentRoute === 'video' ? 'active' : ''}`}
              onClick={() => { navigateTo('video', null); setMobileMenuOpen(false); }}
            >
              <Video size={18} /> Video Hub
            </button>
            
            <div className="drawer-divider"></div>
            
            {/* Category selection */}
            <p className="drawer-section-title">Categories</p>
            <div className="drawer-categories-grid">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`mobile-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => handleCategoryClick(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="drawer-divider"></div>

            {adminUser ? (
              <div className="mobile-admin-block">
                <button 
                  className="mobile-drawer-link admin-btn"
                  onClick={() => { navigateTo('admin'); setMobileMenuOpen(false); }}
                >
                  <PlusCircle size={18} /> Admin Dashboard
                </button>
                <button 
                  className="mobile-drawer-link logout-btn"
                  onClick={() => { logoutAdmin(); setMobileMenuOpen(false); }}
                >
                  <LogOut size={18} /> Sign Out ({adminUser.username})
                </button>
              </div>
            ) : (
              <button 
                className="mobile-drawer-link login-btn"
                onClick={() => { navigateTo('admin'); setMobileMenuOpen(false); }}
              >
                <User size={18} /> Admin Access
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
