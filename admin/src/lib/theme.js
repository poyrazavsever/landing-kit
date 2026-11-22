// Per-site branding ("siteye özel"): maps a site's theme onto the shadcn CSS variables.
// Colors are adjusted so text always keeps at least 4.5:1 contrast (WCAG AA).

export const DEFAULT_LOGO = '/admin/landing-kit-mark.svg';
const WHITE = [255, 255, 255];
const INK = [14, 21, 37];

/** Fonts bundled with the panel (self-hosted, Turkish glyphs included). */
const BUNDLED_FONTS = {
  inter: 'Inter Variable',
  'bricolage grotesque': 'Bricolage Grotesque Variable',
  'playfair display': 'Playfair Display Variable',
};
export const FONT_CHOICES = ['Bricolage Grotesque', 'Inter', 'Playfair Display'];

export function hexToRgb(hex) {
  let m = String(hex || '').replace('#', '');
  if (m.length === 3) m = m.replace(/(.)/g, '$1$1');
  if (!/^[0-9a-f]{6}$/i.test(m)) return null;
  return [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16));
}

const toHex = (rgb) =>
  '#' +
  rgb
    .map((v) =>
      Math.round(Math.max(0, Math.min(255, v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');

function luminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

/** Darkens a color until it reaches the target contrast on the given background. */
function readableOn(rgb, bg, target = 4.5) {
  let c = rgb;
  for (let i = 0; i < 24 && contrast(c, bg) < target; i++) c = c.map((v) => v * 0.9);
  return c;
}

const onColor = (rgb) => (contrast(rgb, WHITE) >= contrast(rgb, INK) ? '#ffffff' : '#0e1525');

export function applyTheme(theme = {}, name) {
  const root = document.documentElement.style;
  const primary = hexToRgb(theme.primary);
  const props = ['--primary', '--primary-foreground', '--ring', '--accent', '--accent-foreground'];
  if (primary) {
    const accent = mix(primary, WHITE, 0.9);
    root.setProperty('--primary', toHex(primary));
    root.setProperty('--primary-foreground', onColor(primary));
    root.setProperty('--ring', toHex(readableOn(primary, WHITE, 3)));
    root.setProperty('--accent', toHex(accent));
    root.setProperty('--accent-foreground', toHex(readableOn(primary, accent)));
  } else {
    props.forEach((p) => root.removeProperty(p));
  }

  const secondary = hexToRgb(theme.secondary);
  if (secondary) {
    root.setProperty('--brand-2', toHex(secondary));
    root.setProperty('--brand-2-foreground', onColor(secondary));
  } else {
    root.removeProperty('--brand-2');
    root.removeProperty('--brand-2-foreground');
  }

  if (theme.font) {
    const clean = String(theme.font).replace(/["\\]/g, '');
    const family = BUNDLED_FONTS[clean.toLowerCase()] || clean;
    root.setProperty('--font-heading', `"${family}", 'Inter Variable', system-ui, sans-serif`);
  } else {
    root.removeProperty('--font-heading');
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', primary ? toHex(primary) : '#2F54EB');
  const icon = document.querySelector('link[rel="icon"]');
  if (icon) icon.setAttribute('href', theme.logo || '/admin/favicon.svg');
  document.title = `${name || 'landing-kit'} · Yönetim Paneli`;
}
