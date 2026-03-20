import React from 'react';

const Guide = () => {
  return (
    <div className="guide-page">
      <header className="guide-header">
        <h1 className="guide-title">Shri Aashapura Maa</h1>
        <p className="guide-subtitle">Official Welcome Guide • પવિત્ર માર્ગદર્શન</p>
      </header>

      {/* Installation Section */}
      <section className="guide-section" style={{ animationDelay: '0.1s' }}>
        <h2 className="guide-section-title">
          <span>📲</span> Installation Guide
        </h2>
        
        <div className="guide-step">
          <div className="step-number">1</div>
          <div className="step-text">
            <p className="step-main">Play Store (Android)</p>
            <p className="step-sub">Download for the best native experience on Android.</p>
          </div>
        </div>
        <a href="https://play.google.com/store/apps/details?id=com.monishgori.shriiashapuramaa" className="guide-btn guide-btn-primary">
          INSTALL FROM PLAY STORE
        </a>

        <div style={{ margin: '30px 0', height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>

        <div className="guide-step">
          <div className="step-number">2</div>
          <div className="step-text">
            <p className="step-main">iOS / Safari Users</p>
            <p className="step-sub">Tap 'Share', then 'Add to Home Screen' to install as a Web App.</p>
          </div>
        </div>
        <a href="/" className="guide-btn guide-btn-secondary">
          OPEN WEB VERSION
        </a>
      </section>

      {/* Features Section */}
      <section className="guide-section" style={{ animationDelay: '0.2s' }}>
        <h2 className="guide-section-title">
          <span>✨</span> App Features • વૈશિષ્ટ્ય
        </h2>
        
        <div className="feature-grid">
          <div className="feature-item">
            <span className="feature-icon">🕉️</span>
            <span className="feature-label">Sacred Pooja</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📜</span>
            <span className="feature-label">Chalisa & Aarti</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📿</span>
            <span className="feature-label">Daily Mantras</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📖</span>
            <span className="feature-label">Divine History</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🌍</span>
            <span className="feature-label">Multi-Language</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎵</span>
            <span className="feature-label">Bhajan Audio</span>
          </div>
        </div>
      </section>

      {/* Usage Section */}
      <section className="guide-section" style={{ animationDelay: '0.3s' }}>
        <h2 className="guide-section-title">
          <span>⚙️</span> How to Use • કેવી રીતે વાપરવું
        </h2>
        
        <div className="guide-step">
          <div className="step-number">1</div>
          <div className="step-text">
            <p className="step-main">Smart Menu</p>
            <p className="step-sub">Tap the 'Library' icon to access all devotional content.</p>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">2</div>
          <div className="step-text">
            <p className="step-main">Rituals</p>
            <p className="step-sub">Interact with the Diya, Bell, and Shankh on the main dashboard.</p>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">3</div>
          <div className="step-text">
            <p className="step-main">Language Choice</p>
            <p className="step-sub">Switch between Gujarati, Hindi, and English anytime from the top bar.</p>
          </div>
        </div>
      </section>

      <footer className="guide-footer">
        <p>V1.0 • DIVINE EDITION BY MONISH GORI</p>
      </footer>
    </div>
  );
};

export default Guide;
