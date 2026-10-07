import React from 'react';
import { useApp } from '../context/AppContext';
import { TrendingUp } from 'lucide-react';

export default function BreakingNews() {
  const { articles, navigateTo } = useApp();

  // Take the 5 most recent articles
  const breakingArticles = articles.slice(0, 5);

  if (breakingArticles.length === 0) return null;

  return (
    <div className="ticker-wrap">
      <div className="ticker-label">
        <TrendingUp size={14} />
        Breaking
      </div>
      <div className="ticker-items-container">
        <div className="ticker-track">
          {/* Double the list to create a seamless infinite marquee loop */}
          {[...breakingArticles, ...breakingArticles].map((art, idx) => (
            <div
              key={`${art.id}-${idx}`}
              className="ticker-item"
              onClick={() => navigateTo('article', art.id)}
            >
              <span className="ticker-dot"></span>
              <span className="ticker-text">{art.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
