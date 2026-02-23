import { useEffect, useMemo, type CSSProperties } from 'react';
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

export default function App(): JSX.Element {
  const vars = mapTokens(designTokens);
  const isEmbed = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('embed') === '1';
  }, []);

  useEffect(() => {
    if (!isEmbed) return;
    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
    };
  }, [isEmbed]);

  return (
    <main className={`gb-app ${isEmbed ? 'gb-app-embed' : ''}`} style={vars as CSSProperties}>
      <section className="gb-content-shell gb-content-shell-builder-only">
        <ModuleBuilder showHeader={false} showDebug={false} embedMode={isEmbed} />
      </section>
    </main>
  );
}
