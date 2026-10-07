import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Play, Pause, Volume2, VolumeX, Maximize, PlayCircle, Eye, Calendar, Clock, RotateCcw } from 'lucide-react';

export default function VideoHub() {
  const {
    videos,
    activeVideoId,
    navigateTo
  } = useApp();

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [theaterMode, setTheaterMode] = useState(false);

  // Active Video retrieval: if none selected, default to first available
  const activeVideo = videos.find((v) => v.id === activeVideoId) || videos[0];

  useEffect(() => {
    // Reset player states when active video changes
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setPlaybackSpeed(1);
    
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [activeVideoId, activeVideo]);

  // Clean date formatter
  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Convert seconds to MM:SS format
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Custom Player Controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(e => console.error("Playback interrupted:", e));
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(cur);
    setDuration(dur);
    setProgress(dur > 0 ? (cur / dur) * 100 : 0);
  };

  const handleProgressChange = (e) => {
    if (!videoRef.current) return;
    const clickPercent = parseFloat(e.target.value);
    const newTime = (clickPercent / 100) * duration;
    videoRef.current.currentTime = newTime;
    setProgress(clickPercent);
  };

  const handleSpeedChange = (e) => {
    const speed = parseFloat(e.target.value);
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    } else if (videoRef.current.webkitRequestFullscreen) {
      videoRef.current.webkitRequestFullscreen();
    } else if (videoRef.current.msRequestFullscreen) {
      videoRef.current.msRequestFullscreen();
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setProgress(100);
  };

  if (!activeVideo) {
    return (
      <div className="video-empty-state glass-card">
        <PlayCircle size={64} className="empty-icon animate-pulse" />
        <h2>No video reports uploaded yet</h2>
        <p>Go to the admin portal or dashboard to upload the first news video report.</p>
        <button className="btn btn-primary" onClick={() => navigateTo('admin')}>
          Go to Admin Access
        </button>
      </div>
    );
  }

  // Sidebar clips (excluding active video)
  const playlistClips = videos.filter((v) => v.id !== activeVideo.id);

  return (
    <div className={`videohub-container ${theaterMode ? 'theater-layout' : ''} animate-fade-in`}>
      {/* 1. Cinematic Playback Section */}
      <div className="player-stage-pane">
        
        {/* Customized Video Player Wrapper */}
        <div className="custom-player-wrapper glass-card">
          <video
            ref={videoRef}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnd}
            onClick={togglePlay}
            className="html5-video-screen"
            poster={activeVideo.thumbnailUrl}
            preload="metadata"
          >
            <source src={activeVideo.videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Player Custom Controls Bar overlay */}
          <div className="player-controls-overlay">
            {/* Progress Bar Slider */}
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleProgressChange}
              className="player-slider"
            />

            <div className="controls-row">
              <div className="controls-group-left">
                <button className="control-btn" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
                  {isPlaying ? <Pause size={18} fill="#fff" /> : <Play size={18} fill="#fff" />}
                </button>
                <button className="control-btn" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <span className="player-time-label">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="controls-group-right">
                {/* Playback speed selector */}
                <select 
                  value={playbackSpeed} 
                  onChange={handleSpeedChange}
                  className="speed-selector-dropdown"
                >
                  <option value="0.5">0.5x</option>
                  <option value="1">1.0x</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2.0x</option>
                </select>

                <button 
                  className={`control-btn theater-toggle ${theaterMode ? 'active' : ''}`}
                  onClick={() => setTheaterMode(!theaterMode)}
                  title="Toggle Theater Mode"
                >
                  <span className="theater-icon-box"></span>
                </button>

                <button className="control-btn" onClick={toggleFullscreen} title="Fullscreen">
                  <Maximize size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Video Information Metadata Card */}
        <div className="video-metadata-card glass-card">
          <span className={`badge badge-${activeVideo.category} meta-badge`}>
            {activeVideo.category}
          </span>
          <h1 className="video-details-title">{activeVideo.title}</h1>
          
          <div className="video-meta-pills">
            <span className="meta-pill"><Calendar size={14} /> {formatDate(activeVideo.date)}</span>
            <span className="meta-pill"><Eye size={14} /> {activeVideo.views || 0} views</span>
            <span className="meta-pill"><Clock size={14} /> Duration: {activeVideo.duration || '0:15'}</span>
          </div>

          <div className="video-author-info">
            <span className="avatar-letter">{activeVideo.author ? activeVideo.author.charAt(0) : 'C'}</span>
            <div>
              <p className="author-heading">Reporter / Agency</p>
              <p className="author-title">{activeVideo.author || 'Chronicle Newsroom'}</p>
            </div>
          </div>

          <p className="video-desc-text">{activeVideo.description}</p>
        </div>
      </div>

      {/* 2. Playlist / Up Next Sidebar */}
      <div className="playlist-sidebar-pane">
        <h3 className="playlist-heading-title">Up Next</h3>
        
        {playlistClips.length === 0 ? (
          <p className="empty-playlist-label">No other video clips found.</p>
        ) : (
          <div className="playlist-list-scroll">
            {playlistClips.map((clip) => (
              <div
                key={clip.id}
                className="playlist-item-card glass-card"
                onClick={() => navigateTo('video', clip.id)}
              >
                <div className="playlist-thumb-wrap">
                  <img src={clip.thumbnailUrl} alt={clip.title} className="playlist-thumb" />
                  <div className="playlist-thumb-hover">
                    <Play size={16} fill="#fff" />
                  </div>
                  <span className="playlist-dur-pill">{clip.duration || '0:15'}</span>
                </div>
                <div className="playlist-details">
                  <span className={`badge badge-${clip.category} mini-badge`}>{clip.category}</span>
                  <h4 className="playlist-clip-title">{clip.title}</h4>
                  <p className="playlist-clip-views">{clip.views || 0} views</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
