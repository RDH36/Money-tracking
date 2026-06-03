// Design tokens — refined v2 of Mitsitsy
// Slightly more sophisticated than the existing tailwind tokens:
//  - Deeper neutrals (warmer slate vs. flat gray)
//  - Brand teal nudged toward a more confident, less "tropical" hue
//  - Accent ink for hero KPI ("oil money" deep teal-ink)

window.MTS_TOKENS = {
  // Backgrounds
  bgBase:      '#F4F4F1',   // warm off-white, slightly tinted
  bgSurface:   '#FFFFFF',
  bgRaised:    '#EDEDE7',
  bgInk:       '#16201E',   // deep ink for hero / accent surfaces
  bgInkSoft:   '#1F2A28',

  // Brand
  brand:       '#0E8C82',   // confident teal, less neon than #38BDB2
  brandDeep:   '#0A6B63',
  brandSoft:   'rgba(14,140,130,0.10)',
  brandTint:   '#E6F2F0',

  // Content
  ink:         '#0F1311',
  inkMuted:    '#5C6664',
  inkSubtle:   '#8B9491',
  inkOnDark:   '#F5F5F1',
  inkOnDarkM:  'rgba(245,245,241,0.62)',

  // Semantic
  good:        '#16A371',
  goodSoft:    '#E6F4EE',
  warn:        '#C8851A',
  warnSoft:    '#FBF1DE',
  bad:         '#C8442C',
  badSoft:     '#FBE9E3',

  // Lines
  hairline:    'rgba(15,19,17,0.08)',
  hairlineStrong: 'rgba(15,19,17,0.14)',

  // Type
  fontDisplay: '"Instrument Serif", "Cormorant Garamond", Georgia, serif',
  fontUI:      '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  fontMono:    '"JetBrains Mono", ui-monospace, monospace',
};
