import type { CSSProperties } from 'react';
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

  return (
    <main className="gb-app gb-app-embed" style={vars as CSSProperties}>
      <section className="gb-content-shell gb-content-shell-embed">
        <ModuleBuilder showHeader={false} showDebug={false} />
      </section>
    </main>
  );
}
