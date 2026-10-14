import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Clock, Calendar, Eye, Share2, Send, MessageSquare, Type, Edit3, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';

export default function ArticleDetail() {
  const {
    activeArticleId,
    articles,
    navigateTo,
    removeArticle,
    adminUser,
    setAdminTargetArticle
  } = useApp();

  const [serifFont, setSerifFont] = useState(false);
  const [fontSize, setFontSize] = useState('md'); // 'sm', 'md', 'lg'
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Retrieve matching article
  const article = articles.find((a) => a.id === activeArticleId);

  // Simulated Comments initialization/retrieval based on article ID
  useEffect(() => {
    if (article) {
      const storedComments = localStorage.getItem(`comments_${article.id}`);
      if (storedComments) {
        setComments(JSON.parse(storedComments));
      } else {
        // Initial Seed Comments
        const seedComments = [
          {
            id: 'c-1',
            author: 'Alistair Kane',
            date: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
            text: 'This is a remarkable write-up. The technical depth regarding silicon-vacancy channels really clarifies why this room-temperature approach works where standard operations fail. Superb reporting!'
          },
          {
            id: 'c-2',
            author: 'Jane Zhao',
            date: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
            text: 'Will be watching closely how quantum encryption adapts to these hardware advancements. This changes the cryptography roadmap entirely.'
          }
        ];
        setComments(seedComments);
        localStorage.setItem(`comments_${article.id}`, JSON.stringify(seedComments));
      }
    }
  }, [activeArticleId, article]);

  // Clean date formatter
  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!article) {
    return (
      <div className="article-not-found glass-card">
        <h2>Article not found</h2>
        <p>The requested article could not be loaded. It may have been deleted or moved.</p>
        <button className="btn btn-primary" onClick={() => navigateTo('home')}>
          <ArrowLeft size={16} /> Return to Portal
        </button>
      </div>
    );
  }

  // Get recommended articles (same category, excluding current)
  const recommendedArticles = articles
    .filter((a) => a.category === article.category && a.id !== article.id)
    .slice(0, 3);

  // Post comment handler
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      id: `comm-${Date.now()}`,
      author: 'Anonymous Reader',
      date: new Date().toISOString(),
      text: commentText
    };

    const updated = [newComment, ...comments];
    setComments(updated);
    localStorage.setItem(`comments_${article.id}`, JSON.stringify(updated));
    setCommentText('');
  };

  // Mock sharing link copy
  const handleShareClick = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Direct Article Delete action for Admin
  const handleDeleteArticle = async () => {
    try {
      setIsDeleting(true);
      await removeArticle(article.id);
      navigateTo('home');
    } catch (err) {
      alert('Delete failed: ' + (err.message || err));
    } finally {
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  return (
    <div className="article-detail-container animate-fade-in">
      {/* 1. Header Toolbar */}
      <div className="detail-toolbar">
        <button className="btn btn-secondary back-btn" onClick={() => navigateTo('home')}>
          <ArrowLeft size={16} /> Back to Portal
        </button>

        {/* E-reader Font Controls */}
        <div className="font-controls glass-card">
          <button 
            className={`font-tool-btn ${serifFont ? 'active' : ''}`}
            onClick={() => setSerifFont(!serifFont)}
            title="Toggle Serif/Sans-serif"
          >
            <Type size={16} />
            <span className="control-label">{serifFont ? 'Serif' : 'Sans'}</span>
          </button>
          
          <div className="size-selector">
            <button 
              className={`size-btn ${fontSize === 'sm' ? 'active' : ''}`}
              onClick={() => setFontSize('sm')}
            >
              A-
            </button>
            <button 
              className={`size-btn ${fontSize === 'md' ? 'active' : ''}`}
              onClick={() => setFontSize('md')}
            >
              A
            </button>
            <button 
              className={`size-btn ${fontSize === 'lg' ? 'active' : ''}`}
              onClick={() => setFontSize('lg')}
            >
              A+
            </button>
          </div>
        </div>
      </div>

      {/* Admin Action Bar (CRUD: Edit & Delete story directly) */}
      {adminUser ? (
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', marginBottom: '16px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.3)', background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.25), rgba(15, 23, 42, 0.5))', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="#60a5fa" />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e2e8f0' }}>
              Admin Controls ({adminUser.name})
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '6px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => {
                setAdminTargetArticle(article);
                navigateTo('admin');
              }}
            >
              <Edit3 size={15} /> Edit Article
            </button>
            <button 
              className="btn btn-danger" 
              style={{ padding: '6px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setIsConfirmingDelete(true)}
            >
              <Trash2 size={15} /> Delete Article
            </button>
          </div>
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isConfirmingDelete} 
        onClose={() => setIsConfirmingDelete(false)} 
        title="Confirm Delete Article"
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#f87171' }}>
            <AlertTriangle size={24} />
            <span style={{ fontSize: '1rem', fontWeight: 600 }}>Permanent Deletion</span>
          </div>
          <p style={{ color: '#cbd5e1', marginBottom: '20px', lineHeight: 1.5 }}>
            Are you sure you want to delete <strong>"{article.title}"</strong>? This will permanently remove the article from local and cloud storage.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setIsConfirmingDelete(false)}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button 
              className="btn btn-danger" 
              onClick={handleDeleteArticle}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>

      <div className="detail-main-layout">
        {/* Left Column: Article Reading Panel */}
        <div className="article-reader-pane glass-card">
          {/* Article Banner Cover */}
          <div className="reader-image-wrap">
            <img src={article.image} alt={article.title} className="reader-image" />
            <span className={`badge badge-${article.category} reader-badge`}>
              {article.category}
            </span>
          </div>

          {/* Article Info */}
          <div className="reader-header">
            <h1 className="reader-title">{article.title}</h1>
            
            <div className="reader-meta">
              <div className="author-block">
                <span className="author-avatar">{article.author ? article.author.charAt(0) : 'E'}</span>
                <div>
                  <p className="author-name">By {article.author || 'Editorial Staff'}</p>
                  <p className="publish-date">{formatDate(article.date)}</p>
                </div>
              </div>

              <div className="reading-stats">
                <span className="stat-pill"><Clock size={14} /> {article.readTime} min read</span>
                <span className="stat-pill"><Eye size={14} /> {article.views || 0} views</span>
              </div>
            </div>
          </div>

          {/* Article Body */}
          <div className={`reader-body font-${serifFont ? 'serif' : 'sans'} size-${fontSize}`}>
            {article.body.split('\n\n').map((paragraph, index) => {
              // Apply drop cap styling to first paragraph
              if (index === 0) {
                return (
                  <p key={index} className="paragraph-drop-cap">
                    {paragraph}
                  </p>
                );
              }
              return <p key={index}>{paragraph}</p>;
            })}
          </div>

          {/* Share Action Block */}
          <div className="share-actions-row">
            <button className="btn btn-secondary share-btn" onClick={handleShareClick}>
              <Share2 size={16} />
              {copiedLink ? 'Link Copied!' : 'Share Article'}
            </button>
          </div>

          {/* Interactive Comments Section */}
          <section className="comments-section">
            <h3 className="comments-section-title">
              <MessageSquare size={18} />
              Discussion ({comments.length})
            </h3>

            {/* Comment Post Form */}
            <form className="comment-form" onSubmit={handleCommentSubmit}>
              <textarea
                placeholder="Share your thoughts or analysis on this article..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="comment-textarea"
                rows={3}
                required
              ></textarea>
              <button type="submit" className="btn btn-primary comment-submit-btn">
                <Send size={14} /> Post Comment
              </button>
            </form>

            {/* Comments List */}
            <div className="comments-list">
              {comments.length === 0 ? (
                <p className="empty-comments-label">No comments posted yet. Be the first to join the conversation.</p>
              ) : (
                comments.map((comm) => (
                  <div key={comm.id} className="comment-item">
                    <div className="comment-avatar">
                      {comm.author.charAt(0)}
                    </div>
                    <div className="comment-content">
                      <div className="comment-meta">
                        <span className="comment-author-name">{comm.author}</span>
                        <span className="comment-date">{formatDate(comm.date)}</span>
                      </div>
                      <p className="comment-text-body">{comm.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Recommendations Sidebar */}
        <aside className="recommendations-sidebar">
          {recommendedArticles.length > 0 && (
            <div className="recommendations-widget glass-card">
              <h3 className="sidebar-section-title">Related Coverage</h3>
              <div className="recommendations-list">
                {recommendedArticles.map((art) => (
                  <div 
                    key={art.id} 
                    className="rec-article-item"
                    onClick={() => navigateTo('article', art.id)}
                  >
                    <img src={art.image} alt={art.title} className="rec-image" />
                    <div className="rec-details">
                      <span className={`badge badge-${art.category} mini-badge`}>{art.category}</span>
                      <h4 className="rec-title">{art.title}</h4>
                      <span className="rec-meta">{art.readTime} min read</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
