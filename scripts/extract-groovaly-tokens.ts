import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

type Extracted = {
  source: string;
  generatedAt: string;
  tokens: Record<string, string>;
  cssVariables: Record<string, string>;
};

const fallback: Extracted = {
  source: 'fallback',
  generatedAt: '',
  tokens: {
    backgroundColor: '#f7f4ef',
    textColor: '#111111',
    mutedColor: '#666666',
    borderColor: 'rgba(0,0,0,0.25)',
    headingFontFamily: 'system-ui, sans-serif',
    bodyFontFamily: 'system-ui, sans-serif',
    headingFontSize: 'clamp(1.5rem, 2vw, 2rem)',
    headingLetterSpacing: '0',
    headingTextTransform: 'none',
    buttonBackgroundColor: '#111111',
    buttonTextColor: '#ffffff',
    buttonBorderRadius: '999px',
    buttonPadding: '0.6rem 1rem',
    buttonFontFamily: 'system-ui, sans-serif',
    buttonFontSize: '0.95rem',
    buttonTextTransform: 'none',
  },
  cssVariables: {},
};

async function run(): Promise<void> {
  const outputPath = path.resolve(process.cwd(), 'src/design-tokens.json');
  const headless = process.env.PW_HEADLESS !== 'false';
  let browser;

  try {
    browser = await chromium.launch({ headless });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('https://www.groovaly.com/', {
      waitUntil: 'networkidle',
      timeout: 45_000,
    });

    const extracted = await page.evaluate(() => {
      const bodyEl = document.body;
      const headingEl = document.querySelector('h1') ?? document.querySelector('h2');
      const ctaEl =
        document.querySelector('button') ??
        document.querySelector('a.sqs-button-element--primary') ??
        document.querySelector('a[class*="button"]') ??
        document.querySelector('a[role="button"]') ??
        document.querySelector('input[type="submit"]');

      const bodyStyle = bodyEl ? window.getComputedStyle(bodyEl) : null;
      const headingStyle = headingEl ? window.getComputedStyle(headingEl) : null;
      const ctaStyle = ctaEl ? window.getComputedStyle(ctaEl) : null;

      const body = bodyStyle
        ? {
            backgroundColor: bodyStyle.backgroundColor,
            color: bodyStyle.color,
            fontFamily: bodyStyle.fontFamily,
            fontSize: bodyStyle.fontSize,
            letterSpacing: bodyStyle.letterSpacing,
            textTransform: bodyStyle.textTransform,
            borderRadius: bodyStyle.borderRadius,
            padding: bodyStyle.padding,
          }
        : null;

      const heading = headingStyle
        ? {
            backgroundColor: headingStyle.backgroundColor,
            color: headingStyle.color,
            fontFamily: headingStyle.fontFamily,
            fontSize: headingStyle.fontSize,
            letterSpacing: headingStyle.letterSpacing,
            textTransform: headingStyle.textTransform,
            borderRadius: headingStyle.borderRadius,
            padding: headingStyle.padding,
          }
        : null;

      const cta = ctaStyle
        ? {
            backgroundColor: ctaStyle.backgroundColor,
            color: ctaStyle.color,
            fontFamily: ctaStyle.fontFamily,
            fontSize: ctaStyle.fontSize,
            letterSpacing: ctaStyle.letterSpacing,
            textTransform: ctaStyle.textTransform,
            borderRadius: ctaStyle.borderRadius,
            padding: ctaStyle.padding,
          }
        : null;

      const rootStyle = getComputedStyle(document.documentElement);
      const cssVariables: Record<string, string> = {};

      for (const name of Array.from(rootStyle)) {
        if (!name.startsWith('--')) continue;
        const value = rootStyle.getPropertyValue(name).trim();
        if (!value) continue;
        const isRelevant = /(color|font|radius|space|size|letter|transform|line|button)/i.test(name);
        if (isRelevant) cssVariables[name] = value;
      }

      return { body, heading, cta, cssVariables };
    });

    const result: Extracted = {
      source: 'https://www.groovaly.com/',
      generatedAt: new Date().toISOString(),
      tokens: {
        backgroundColor: extracted.body?.backgroundColor ?? fallback.tokens.backgroundColor,
        textColor: extracted.body?.color ?? fallback.tokens.textColor,
        mutedColor: fallback.tokens.mutedColor,
        borderColor: fallback.tokens.borderColor,
        headingFontFamily: extracted.heading?.fontFamily ?? extracted.body?.fontFamily ?? fallback.tokens.headingFontFamily,
        bodyFontFamily: extracted.body?.fontFamily ?? fallback.tokens.bodyFontFamily,
        headingFontSize: extracted.heading?.fontSize ?? fallback.tokens.headingFontSize,
        headingLetterSpacing: extracted.heading?.letterSpacing ?? fallback.tokens.headingLetterSpacing,
        headingTextTransform: extracted.heading?.textTransform ?? fallback.tokens.headingTextTransform,
        buttonBackgroundColor: extracted.cta?.backgroundColor ?? fallback.tokens.buttonBackgroundColor,
        buttonTextColor: extracted.cta?.color ?? fallback.tokens.buttonTextColor,
        buttonBorderRadius: extracted.cta?.borderRadius ?? fallback.tokens.buttonBorderRadius,
        buttonPadding: extracted.cta?.padding ?? fallback.tokens.buttonPadding,
        buttonFontFamily: extracted.cta?.fontFamily ?? extracted.body?.fontFamily ?? fallback.tokens.buttonFontFamily,
        buttonFontSize: extracted.cta?.fontSize ?? fallback.tokens.buttonFontSize,
        buttonTextTransform: extracted.cta?.textTransform ?? fallback.tokens.buttonTextTransform,
      },
      cssVariables: extracted.cssVariables,
    };

    await fs.writeFile(outputPath, JSON.stringify(result, null, 2), 'utf8');
    console.log(`Wrote tokens to ${outputPath} (headless=${headless})`);
  } catch (error) {
    const failed = {
      ...fallback,
      generatedAt: new Date().toISOString(),
    };
    await fs.writeFile(outputPath, JSON.stringify(failed, null, 2), 'utf8');
    console.error('Token extraction failed, fallback tokens written.', error);
  } finally {
    await browser?.close();
  }
}

void run();
