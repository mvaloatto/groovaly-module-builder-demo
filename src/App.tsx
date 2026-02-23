import { useState, type CSSProperties } from 'react';
import designTokens from './design-tokens.json';
import { ModuleBuilder } from './components/ModuleBuilder';

type TokenShape = {
  tokens?: Record<string, string>;
};

const fallback = {
  bg: '#f7f4ef',
  text: '#111111',
  muted: '#666666',
  border: 'rgba(0,0,0,0.25)',
  accent: '#111111',
  headingFont: 'system-ui, sans-serif',
  bodyFont: 'system-ui, sans-serif',
};

const withBase = (path: string): string => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;

function mapTokens(raw: TokenShape): Record<string, string> {
  const tokens = raw.tokens ?? {};
  return {
    '--gb-bg': tokens.backgroundColor ?? fallback.bg,
    '--gb-text': tokens.textColor ?? fallback.text,
    '--gb-muted': tokens.mutedColor ?? fallback.muted,
    '--gb-border': tokens.borderColor ?? fallback.border,
    '--gb-accent': tokens.buttonBackgroundColor ?? fallback.accent,
    '--gb-heading-font': tokens.headingFontFamily ?? fallback.headingFont,
    '--gb-body-font': tokens.bodyFontFamily ?? fallback.bodyFont,
  };
}

function SocialIcon({ kind }: { kind: 'instagram' | 'youtube' | 'tiktok' | 'pinterest' }): JSX.Element {
  if (kind === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <circle cx="12" cy="12" r="4.3" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <circle cx="17.2" cy="6.9" r="1.2" fill="currentColor" />
      </svg>
    );
  }
  if (kind === 'youtube') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2.8" y="6.1" width="18.4" height="11.8" rx="3.6" fill="currentColor" />
        <path d="M10 9.1 15.4 12 10 14.9Z" fill="#fff" />
      </svg>
    );
  }
  if (kind === 'tiktok') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15.8 5.2c.9 1.1 1.9 1.8 3.2 2.1v2.5a8.3 8.3 0 0 1-3.2-1V14a5.8 5.8 0 1 1-5.8-5.8v2.6a3.2 3.2 0 1 0 3.2 3.2V4.8h2.6Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M10.7 14.2c.6.5 1.5.8 2.4.8 2 0 3.7-1.6 3.7-3.7 0-2-1.6-3.7-3.7-3.7-2 0-3.7 1.6-3.7 3.7v7.2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export default function App(): JSX.Element {
  const vars = mapTokens(designTokens);
  const [adminOpen, setAdminOpen] = useState(false);

  const socialLinks = [
    { href: 'https://www.instagram.com/', label: 'Instagram', kind: 'instagram' as const },
    { href: 'https://www.youtube.com/', label: 'YouTube', kind: 'youtube' as const },
    { href: 'https://www.tiktok.com/', label: 'TikTok', kind: 'tiktok' as const },
    { href: 'https://www.pinterest.com/', label: 'Pinterest', kind: 'pinterest' as const },
  ];

  return (
    <main className="gb-app" style={vars as CSSProperties}>
      <header className="gb-site-header">
        <div className="gb-header-top">
          <div className="gb-socials" aria-label="Social links">
            {socialLinks.map((item) => (
              <a key={item.label} href={item.href} aria-label={item.label} target="_blank" rel="noreferrer">
                <SocialIcon kind={item.kind} />
              </a>
            ))}
          </div>
          <a href="#" className="gb-logo" aria-label="Groovaly home">
            <img src={withBase('/brand/Logo_Groovaly.webp')} alt="Groovaly" />
          </a>
          <div className="gb-account-links">
            <a href="#">Login</a>
            <a href="#">Cart (0)</a>
          </div>
        </div>
        <nav className="gb-main-nav" aria-label="Main navigation">
          <a href="#">Get Inspired</a>
          <a href="#">Shop the Collection</a>
          <a href="#" className="is-active-build">
            Build Your Setup
          </a>
          <a href="#">In Motion</a>
          <a href="#">Our Story</a>
          <a href="#">Professional Orders</a>
          <a href="#">Let's Talk</a>
        </nav>
        <div className="gb-hero-title">
          <h1>Build Your Setup</h1>
        </div>
      </header>

      <section className="gb-content-shell">
        <ModuleBuilder showHeader={false} showDebug={adminOpen} />
      </section>

      <footer className="gb-site-footer">
        <div className="gb-footer-inner">
          <div className="gb-footer-socials">
            {socialLinks.map((item) => (
              <a key={`footer-${item.label}`} href={item.href} aria-label={item.label} target="_blank" rel="noreferrer">
                <SocialIcon kind={item.kind} />
              </a>
            ))}
          </div>
          <p className="gb-footer-copy">© Groovaly</p>
          <h2 className="gb-footer-manifesto">BECAUSE LIFE&apos;S TOO SHORT TO MISS A GROOVE.</h2>
          <div className="gb-footer-links">
            <a href="#">Legal Notice</a>
            <span className="gb-footer-sep" aria-hidden="true">
              |
            </span>
            <a href="#">Privacy Policy</a>
            <span className="gb-footer-sep" aria-hidden="true">
              |
            </span>
            <a href="#">Cookies Policy</a>
            <span className="gb-footer-sep" aria-hidden="true">
              |
            </span>
            <a href="#">Terms of Sale</a>
            <span className="gb-footer-sep" aria-hidden="true">
              |
            </span>
            <a href="#">Delivery &amp; Shipping</a>
            <span className="gb-footer-sep" aria-hidden="true">
              |
            </span>
            <a href="#">Terms of Use</a>
            <span className="gb-footer-sep" aria-hidden="true">
              |
            </span>
            <a href="#">Contact</a>
            <span className="gb-footer-sep" aria-hidden="true">
              |
            </span>
            <a href="#">FR</a>
          </div>
          <button
            type="button"
            className="gb-footer-admin-toggle"
            onClick={() => setAdminOpen((current) => !current)}
            aria-expanded={adminOpen}
            aria-controls="module-builder-debug"
          >
            Admin
          </button>
        </div>
      </footer>
    </main>
  );
}
