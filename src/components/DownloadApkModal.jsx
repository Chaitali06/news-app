import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Modal from './Modal';
import { 
  Download, Smartphone, CheckCircle2, Copy, ShieldCheck, 
  Sparkles, ExternalLink, QrCode, AlertCircle 
} from 'lucide-react';

export default function DownloadApkModal() {
  const { isApkModalOpen, setIsApkModalOpen, apkDownloadUrl, triggerApkDownload } = useApp();
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isApkModalOpen) return null;

  // Resolve absolute download URL for QR code and copying
  const absoluteDownloadUrl = (() => {
    if (apkDownloadUrl.startsWith('http://') || apkDownloadUrl.startsWith('https://') || apkDownloadUrl.startsWith('blob:')) {
      return apkDownloadUrl;
    }
    try {
      return new URL(apkDownloadUrl, window.location.href).href;
    } catch {
      return `${window.location.origin}/${apkDownloadUrl.replace(/^\//, '')}`;
    }
  })();

  // QR code URL using public QR Server API
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(absoluteDownloadUrl)}&bgcolor=111827&color=4ade80`;

  const handleDownload = () => {
    triggerApkDownload();
    setDownloadStarted(true);
    setTimeout(() => setDownloadStarted(false), 5000);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(absoluteDownloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback copy
      const textarea = document.createElement('textarea');
      textarea.value = absoluteDownloadUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <Modal
      isOpen={isApkModalOpen}
      onClose={() => setIsApkModalOpen(false)}
      title="Download Android APK"
    >
      <div className="apk-modal-content">
        {/* Header App Banner */}
        <div className="apk-banner-card">
          <div className="apk-app-icon">
            <Smartphone size={32} />
          </div>
          <div className="apk-app-meta">
            <h4>Chronicle News for Android</h4>
            <div className="apk-tags-row">
              <span className="apk-pill-tag">v1.0.0</span>
              <span className="apk-pill-tag">~6.5 MB</span>
              <span className="apk-pill-tag">Android 8.0+</span>
              <span className="apk-pill-tag highlight">Universal APK</span>
            </div>
          </div>
        </div>

        {/* Primary Download Button */}
        <div className="apk-download-actions">
          <button 
            type="button" 
            onClick={handleDownload} 
            className="apk-primary-download-btn"
          >
            {downloadStarted ? (
              <>
                <CheckCircle2 size={20} className="apk-icon-spin" />
                <span>Downloading ChronicleNews.apk...</span>
              </>
            ) : (
              <>
                <Download size={20} />
                <span>Download APK via Browser</span>
              </>
            )}
          </button>

          {downloadStarted && (
            <div className="apk-download-notification animate-fade-in">
              <CheckCircle2 size={16} />
              <span>Download initiated! Check your browser's download manager.</span>
            </div>
          )}
        </div>

        {/* QR Code and Quick Link Card */}
        <div className="apk-qr-section">
          <div className="apk-qr-box">
            <img 
              src={qrCodeImageUrl} 
              alt="QR Code for direct Android APK download" 
              className="apk-qr-image"
              loading="lazy"
            />
            <span className="apk-qr-label">
              <QrCode size={13} /> Scan with Android camera to download directly
            </span>
          </div>

          <div className="apk-link-box">
            <label className="apk-field-label">Direct Download Link</label>
            <div className="apk-url-input-wrap">
              <input 
                type="text" 
                readOnly 
                value={absoluteDownloadUrl} 
                className="apk-readonly-url" 
              />
              <button 
                type="button" 
                onClick={handleCopyLink} 
                className="apk-copy-btn"
                title="Copy link to clipboard"
              >
                {copied ? <CheckCircle2 size={16} color="#4ade80" /> : <Copy size={16} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            
            <a 
              href={apkDownloadUrl}
              download="ChronicleNews-v1.0.0.apk"
              className="apk-fallback-link"
            >
              Direct File Link <ExternalLink size={13} />
            </a>
          </div>
        </div>

        {/* Installation Instructions */}
        <div className="apk-instructions-card">
          <div className="apk-instructions-header">
            <ShieldCheck size={18} style={{ color: '#4ade80' }} />
            <h5>How to Install on Android:</h5>
          </div>

          <ol className="apk-steps-list">
            <li>
              <strong>1. Download:</strong> Click <em>"Download APK"</em> above. If Chrome shows 
              <span className="apk-quote">"File might be harmful"</span>, tap <strong>Download anyway</strong>.
            </li>
            <li>
              <strong>2. Open:</strong> Tap the notification or open the file in your <strong>Downloads</strong> folder.
            </li>
            <li>
              <strong>3. Allow Permission:</strong> If prompted 
              <span className="apk-quote">"Install unknown apps"</span>, tap <strong>Settings</strong> and switch on 
              <strong>"Allow from this source"</strong>.
            </li>
            <li>
              <strong>4. Complete:</strong> Tap <strong>Install</strong> to start reading Chronicle News natively!
            </li>
          </ol>
        </div>

        {/* Security Assurance */}
        <div className="apk-security-footer">
          <Sparkles size={14} style={{ color: '#fbbf24' }} />
          <span>Standalone Package • Built with Capacitor & React • Ad-free & Privacy Preserving</span>
        </div>
      </div>
    </Modal>
  );
}
