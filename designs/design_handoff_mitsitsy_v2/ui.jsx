/* global React */
// Shared UI primitives for Mitsitsy v2
const T = window.MTS_TOKENS;

// Tiny inline SVG icons (Ionicons-ish stroke style, but cleaner)
const Icon = ({ name, size = 18, color = 'currentColor', strokeWidth = 1.8 }) => {
  const paths = {
    home:        <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-8.5Z" />,
    plan:        <path d="M8 4h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm1 5h6M9 13h6M9 17h4" />,
    pulse:       <path d="M3 12h4l2-7 4 14 2-7h6" />,
    trophy:      <path d="M7 4h10v3a5 5 0 0 1-10 0V4Zm-2 0H3v3a3 3 0 0 0 3 3m13-6h2v3a3 3 0 0 1-3 3M9 21h6m-3-5v5" />,
    plus:        <path d="M12 5v14M5 12h14" />,
    settings:    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3 .9-1.5-1.6-2.7-1.7.4a7 7 0 0 0-1.6-.9L15.5 5h-7l-.5 2.3a7 7 0 0 0-1.6.9l-1.7-.4-1.6 2.7L4 12l-.9 1.5 1.6 2.7 1.7-.4a7 7 0 0 0 1.6.9l.5 2.3h7l.5-2.3a7 7 0 0 0 1.6-.9l1.7.4 1.6-2.7L20 12Z" />,
    eye:         <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
    eyeOff:      <path d="m3 3 18 18M10.6 10.6a3 3 0 0 0 4 4M9.9 5.2A11 11 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7c1.5 0 2.9-.4 4.1-1" />,
    chev:        <path d="m9 6 6 6-6 6" />,
    chevDown:    <path d="m6 9 6 6 6-6" />,
    chevBack:    <path d="m15 6-6 6 6 6" />,
    arrowDown:   <path d="M12 5v14m-6-6 6 6 6-6" />,
    arrowUp:     <path d="M12 19V5m-6 6 6-6 6 6" />,
    swap:        <path d="M7 7h13l-3-3m3 3-3 3M17 17H4l3-3m-3 3 3 3" />,
    bell:        <path d="M15 17h5l-1.4-1.4A7 7 0 0 1 17 11V8a5 5 0 0 0-10 0v3c0 1.6-.6 3.2-1.6 4.6L4 17h5m6 0a3 3 0 0 1-6 0" />,
    spark:       <path d="M12 2v6m0 8v6M2 12h6m8 0h6M5 5l4 4m6 6 4 4M19 5l-4 4M5 19l4-4" />,
    flame:       <path d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 1-4 2-6 1 1 2 1 3 0V2Z" />,
    target:      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-4a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0-4a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />,
    cart:        <path d="M3 4h2l2.7 11.3a2 2 0 0 0 2 1.7h7.6a2 2 0 0 0 2-1.5L21 8H6m3 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />,
    car:         <path d="M5 17h14m-14 0v-4l2-5h10l2 5v4m-14 0v2h2v-2m10 0v2h2v-2M7.5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />,
    fork:        <path d="M7 2v8a2 2 0 0 0 2 2v10M11 2v8M3 2v8a2 2 0 0 0 2 2M17 2c-2 0-4 2-4 5s2 5 4 5v10" />,
    leaf:        <path d="M11 20A8 8 0 0 1 3 12c0-4 4-9 9-10 1 6 6 11 9 11-1 4-6 7-10 7Zm-4-4 8-8" />,
    bag:         <path d="M5 8h14l-1 13H6L5 8Zm3 0V6a4 4 0 0 1 8 0v2" />,
    home2:       <path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-4v-6H9v6H4a1 1 0 0 1-1-1v-9Z" />,
    sparkle:     <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z" />,
    time:        <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-15v5l3 2" />,
    edit:        <path d="m4 20 4-1L20 7l-3-3L5 16l-1 4Zm12-13 3 3" />,
    trash:       <path d="M4 7h16M9 7V4h6v3m-7 0v13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7" />,
    check:       <path d="m4 12 5 5 11-12" />,
    x:           <path d="M5 5l14 14M19 5 5 19" />,
    bell2:       <path d="M6 19V11a6 6 0 1 1 12 0v8m-12 0h12m-12 0-1 2h14l-1-2m-7-15V2" />,
    receipt:     <path d="M5 3v18l3-2 3 2 3-2 3 2 3-2V3H5Zm3 5h8m-8 4h8m-8 4h5" />,
    wallet:      <path d="M3 7h17a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Zm0 0V5a1 1 0 0 1 1-1h13M17 13h2" />,
    bank:        <path d="M3 9 12 4l9 5v2H3V9Zm2 2v7m4-7v7m6-7v7m4-7v7M3 19h18" />,
    cash:        <path d="M3 7h18v10H3V7Zm9 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />,
    info:        <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-11v6m0-9v.01" />,
    warn:        <path d="M12 3 2 21h20L12 3Zm0 7v5m0 3v.01" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {paths[name] || null}
    </svg>
  );
};

// Mono money formatter — uses tabular figures
const Money = ({ value, currency = 'Ar', size = 'md', color, weight = 600 }) => {
  const sizes = { xs: 11, sm: 13, md: 15, lg: 22, xl: 32, hero: 44 };
  const formatted = new Intl.NumberFormat('fr-FR').format(Math.round(Math.abs(value)));
  const sign = value < 0 ? '−' : '';
  return (
    <span style={{
      fontFamily: T.fontUI,
      fontVariantNumeric: 'tabular-nums',
      fontWeight: weight,
      letterSpacing: -0.2,
      fontSize: sizes[size],
      color: color || T.ink,
      whiteSpace: 'nowrap',
    }}>
      {sign}{formatted} <span style={{ fontSize: sizes[size] * 0.55, opacity: 0.55, marginLeft: 1 }}>{currency}</span>
    </span>
  );
};

// Status / chip
const Chip = ({ children, tone = 'neutral' }) => {
  const tones = {
    neutral: { bg: 'rgba(15,19,17,0.05)', fg: T.inkMuted },
    good:    { bg: T.goodSoft, fg: T.good },
    warn:    { bg: T.warnSoft, fg: T.warn },
    bad:     { bg: T.badSoft, fg: T.bad },
    brand:   { bg: T.brandSoft, fg: T.brand },
    onDark:  { bg: 'rgba(245,245,241,0.12)', fg: T.inkOnDark },
  };
  const t = tones[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 999,
      background: t.bg, color: t.fg,
      fontFamily: T.fontUI, fontSize: 11, fontWeight: 600,
      letterSpacing: 0.2,
    }}>{children}</span>
  );
};

// Progress with threshold ticks (the new feature: budget seuils/thresholds)
const Progress = ({ value, height = 6, color = T.brand, track = 'rgba(15,19,17,0.06)', thresholds = [] }) => {
  const v = Math.min(Math.max(value, 0), 100);
  return (
    <div style={{ position: 'relative', height, background: track, borderRadius: 999, overflow: 'visible' }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${v}%`, background: color, borderRadius: 999,
        transition: 'width .4s ease',
      }} />
      {thresholds.map((th, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${th}%`, top: -2, bottom: -2,
          width: 1.5, background: T.bgSurface,
          boxShadow: `0 0 0 1px rgba(15,19,17,0.18)`,
          borderRadius: 1,
        }} />
      ))}
    </div>
  );
};

// Section header — overline + title
const SectionHead = ({ overline, title, action, dark = false }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
    <div>
      {overline && (
        <div style={{
          fontFamily: T.fontUI, fontSize: 10, fontWeight: 600,
          letterSpacing: 1.5, textTransform: 'uppercase',
          color: dark ? T.inkOnDarkM : T.inkSubtle,
          marginBottom: 4,
        }}>{overline}</div>
      )}
      <div style={{
        fontFamily: T.fontDisplay, fontSize: 22, lineHeight: 1,
        color: dark ? T.inkOnDark : T.ink, letterSpacing: -0.5,
      }}>{title}</div>
    </div>
    {action}
  </div>
);

// Pressable-looking card
const Card = ({ children, style = {}, dark = false, onClick }) => (
  <div onClick={onClick} style={{
    background: dark ? T.bgInkSoft : T.bgSurface,
    borderRadius: 18,
    border: dark ? '1px solid rgba(245,245,241,0.06)' : `1px solid ${T.hairline}`,
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  }}>{children}</div>
);

window.MTS_UI = { Icon, Money, Chip, Progress, SectionHead, Card };
