/* global React */
const T = window.MTS_TOKENS;
const { Icon, Card } = window.MTS_UI;

// ────────────────────────────────────────────────────────────
//  Bubule mascot — placeholder rounded badge with a face
//  (real app uses PNG illustrations; we draw a stand-in)
// ────────────────────────────────────────────────────────────
const Bubule = ({ size = 220, mood = 'hello', accent = T.brand }) => {
  // Simple character: rounded body, eyes, expression by mood
  const palette = {
    hello: { body: '#FFC857', cheek: '#FF8E72', eye: T.ink },
    wonder: { body: '#FFC857', cheek: '#FF8E72', eye: T.ink },
    search: { body: '#9CC7E0', cheek: '#FF8E72', eye: T.ink },
    motivation: { body: '#A4D4A2', cheek: '#FF8E72', eye: T.ink },
    help:   { body: '#FFC857', cheek: '#FF8E72', eye: T.ink },
    happy:  { body: '#FFC857', cheek: '#FF8E72', eye: T.ink },
    frustration: { body: '#FFC857', cheek: '#FF8E72', eye: T.ink },
  };
  const p = palette[mood] || palette.hello;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ display: 'block' }}>
      {/* glow */}
      <circle cx="100" cy="105" r="92" fill={`${accent}10`} />
      {/* body */}
      <ellipse cx="100" cy="115" rx="68" ry="74" fill={p.body} />
      {/* shadow under */}
      <ellipse cx="100" cy="190" rx="52" ry="6" fill="rgba(15,19,17,0.08)" />
      {/* cheeks */}
      <circle cx="62" cy="125" r="9" fill={p.cheek} opacity="0.55" />
      <circle cx="138" cy="125" r="9" fill={p.cheek} opacity="0.55" />
      {/* eyes by mood */}
      {mood === 'search' ? (
        <>
          <circle cx="78" cy="100" r="14" fill="#FFFFFF" />
          <circle cx="80" cy="102" r="6" fill={p.eye} />
          <circle cx="122" cy="100" r="14" fill="#FFFFFF" />
          <circle cx="124" cy="102" r="6" fill={p.eye} />
        </>
      ) : mood === 'frustration' ? (
        <>
          <path d="M70 96 q8 -6 16 0" stroke={p.eye} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M114 96 q8 -6 16 0" stroke={p.eye} strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="78" cy="100" rx="4" ry="6" fill={p.eye} />
          <ellipse cx="122" cy="100" rx="4" ry="6" fill={p.eye} />
        </>
      )}
      {/* mouth */}
      {mood === 'frustration' ? (
        <path d="M88 145 q12 -8 24 0" stroke={p.eye} strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : mood === 'happy' || mood === 'motivation' ? (
        <path d="M84 138 q16 18 32 0" stroke={p.eye} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M88 140 q12 8 24 0" stroke={p.eye} strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
      {/* tiny antenna */}
      <line x1="100" y1="46" x2="100" y2="32" stroke={p.eye} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="100" cy="29" r="4" fill={accent} />
    </svg>
  );
};

// Speech bubble — hairline + serif italic
const SpeechBubble = ({ children, side = 'right', offset = { top: 30, left: -20 } }) => {
  return (
    <div style={{
      position: 'absolute',
      top: offset.top, left: offset.left,
      maxWidth: 220,
      padding: '10px 14px',
      borderRadius: 16,
      background: T.bgSurface,
      border: `1px solid ${T.hairlineStrong}`,
      boxShadow: '0 8px 18px rgba(15,19,17,0.06)',
      fontFamily: T.fontDisplay,
      fontStyle: 'italic',
      fontSize: 14,
      color: T.ink,
      letterSpacing: -0.1,
      lineHeight: 1.35,
      zIndex: 2,
    }}>
      {children}
      {/* tail */}
      <div style={{
        position: 'absolute',
        bottom: -8, [side === 'right' ? 'left' : 'right']: 26,
        width: 14, height: 14,
        background: T.bgSurface,
        borderRight: `1px solid ${T.hairlineStrong}`,
        borderBottom: `1px solid ${T.hairlineStrong}`,
        transform: 'rotate(45deg)',
      }} />
    </div>
  );
};

// Progress bar — 8 dots with hairline track
const ProgressDots = ({ step, total = 8 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
    {Array.from({ length: total }).map((_, i) => {
      const done = i < step - 1;
      const current = i === step - 1;
      return (
        <div key={i} style={{
          flex: current ? 1.4 : 1,
          height: current ? 4 : 2,
          borderRadius: 999,
          background: done || current ? T.brand : 'rgba(15,19,17,0.10)',
          transition: 'all 200ms',
        }} />
      );
    })}
    <div style={{
      marginLeft: 8,
      fontFamily: T.fontUI, fontSize: 11, fontWeight: 700,
      color: T.inkSubtle, letterSpacing: 0.4,
      fontVariantNumeric: 'tabular-nums',
    }}>{step}/{total}</div>
  </div>
);

// Primary button — full-bleed pill
const PrimaryBtn = ({ label, hint, dark = true }) => (
  <div style={{
    background: dark ? T.bgInk : T.brand,
    color: T.inkOnDark,
    padding: '16px 18px',
    borderRadius: 999,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    boxShadow: '0 10px 22px rgba(15,19,17,0.18)',
  }}>
    <span style={{
      fontFamily: T.fontUI, fontSize: 15, fontWeight: 700, letterSpacing: 0.2,
    }}>{label}</span>
    {hint && (
      <span style={{
        fontFamily: T.fontUI, fontSize: 11, fontWeight: 500,
        color: 'rgba(245,245,241,0.55)', letterSpacing: 0.4,
      }}>{hint}</span>
    )}
  </div>
);

// Quiz option card
const QuizOption = ({ emoji, label, hint, selected }) => (
  <div style={{
    padding: '16px 18px',
    borderRadius: 16,
    background: selected ? T.brandSoft : T.bgSurface,
    border: `1px solid ${selected ? T.brand : T.hairline}`,
    display: 'flex', alignItems: 'center', gap: 14,
    transition: 'all 200ms',
  }}>
    <div style={{
      width: 42, height: 42, borderRadius: 12,
      background: selected ? T.bgSurface : T.bgRaised,
      border: selected ? `1px solid ${T.brand}30` : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 22, lineHeight: 1,
    }}>{emoji}</div>
    <div style={{ flex: 1 }}>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: 16, color: T.ink, letterSpacing: -0.2, lineHeight: 1.25,
      }}>{label}</div>
      {hint && (
        <div style={{
          fontFamily: T.fontUI, fontSize: 11, color: T.inkSubtle, marginTop: 2,
        }}>{hint}</div>
      )}
    </div>
    <div style={{
      width: 22, height: 22, borderRadius: 11,
      border: `1.5px solid ${selected ? T.brand : T.hairlineStrong}`,
      background: selected ? T.brand : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {selected && <Icon name="check" size={12} color={T.inkOnDark} strokeWidth={3} />}
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────
//  01 — Welcome
// ────────────────────────────────────────────────────────────
const OnbWelcome = () => {
  const emojis = ['💰', '📊', '🎯', '✨', '🏦', '💎'];
  const positions = [
    { top: 80, left: 30, rot: -8 },
    { top: 130, right: 40, rot: 14 },
    { top: 220, left: 20, rot: 6 },
    { top: 280, right: 25, rot: -10 },
    { top: 380, left: 50, rot: 12 },
    { top: 420, right: 55, rot: -6 },
  ];
  return (
    <div style={{
      background: T.bgBase, height: '100%', position: 'relative', overflow: 'hidden',
      paddingTop: 64,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Floating emojis */}
      {emojis.map((e, i) => (
        <div key={i} style={{
          position: 'absolute', ...positions[i],
          fontSize: 22, opacity: 0.25,
          transform: `rotate(${positions[i].rot}deg)`,
        }}>{e}</div>
      ))}

      {/* Editorial header */}
      <div style={{ padding: '0 24px', textAlign: 'center', marginBottom: 4 }}>
        <div style={{
          fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 2,
          textTransform: 'uppercase', color: T.brand,
        }}>Mitsitsy</div>
      </div>

      {/* Mascot */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', marginTop: 10,
      }}>
        <div style={{ position: 'relative' }}>
          <SpeechBubble offset={{ top: 18, left: -110 }}>
            Coucou, moi c'est Bubule ✨
          </SpeechBubble>
          <Bubule size={260} mood="hello" />
        </div>
      </div>

      {/* Title */}
      <div style={{ padding: '0 28px', textAlign: 'center', marginBottom: 26 }}>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 32, color: T.ink, letterSpacing: -0.8, lineHeight: 1.05,
        }}>
          Reprends le contrôle<br/>
          <span style={{ fontStyle: 'italic', color: T.brand }}>de ton argent.</span>
        </div>
        <div style={{
          fontFamily: T.fontUI, fontSize: 14, color: T.inkMuted, marginTop: 12, lineHeight: 1.5,
          textWrap: 'pretty',
        }}>
          Trois minutes pour comprendre tes finances, sans jugement et sans formulaire pénible.
        </div>
      </div>

      <div style={{ padding: '0 20px 36px' }}>
        <PrimaryBtn label="Commencer" hint="3 min" />
        <div style={{
          textAlign: 'center', marginTop: 14,
          fontFamily: T.fontUI, fontSize: 11, color: T.inkSubtle,
        }}>Aucune carte bancaire · pas de compte</div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//  02 — Quiz 1 (Frustration)
// ────────────────────────────────────────────────────────────
const OnbQuiz1 = () => (
  <div style={{
    background: T.bgBase, minHeight: '100%', paddingTop: 64, paddingBottom: 36,
  }}>
    <div style={{ padding: '0 20px' }}>
      <ProgressDots step={2} />
      <div style={{
        fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
        textTransform: 'uppercase', color: T.brand, marginBottom: 6,
      }}>Question 1 / 3</div>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: 28, color: T.ink, letterSpacing: -0.6, lineHeight: 1.1,
      }}>Qu'est-ce qui te frustre<br/>le plus avec ton argent ?</div>
    </div>

    <div style={{
      display: 'flex', justifyContent: 'center', position: 'relative', margin: '12px 0 4px',
    }}>
      <div style={{ position: 'relative' }}>
        <SpeechBubble offset={{ top: 8, left: -130 }}>
          Sois honnête, c'est entre nous
        </SpeechBubble>
        <Bubule size={170} mood="frustration" />
      </div>
    </div>

    <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <QuizOption emoji="🤷" label="Je sais pas où passe l'argent"
                  hint="ça file et je vois rien" selected={true} />
      <QuizOption emoji="💸" label="J'arrive pas à épargner"
                  hint="le solde reste plat" />
      <QuizOption emoji="😰" label="Le stress de fin de mois"
                  hint="je dors mal certaines semaines" />
      <QuizOption emoji="📋" label="Je veux mieux planifier"
                  hint="avoir un cap clair" />
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────
//  03 — Quiz 2 (Duration)
// ────────────────────────────────────────────────────────────
const OnbQuiz2 = () => (
  <div style={{
    background: T.bgBase, minHeight: '100%', paddingTop: 64, paddingBottom: 36,
  }}>
    <div style={{ padding: '0 20px' }}>
      <ProgressDots step={3} />
      <div style={{
        fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
        textTransform: 'uppercase', color: T.brand, marginBottom: 6,
      }}>Question 2 / 3</div>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: 28, color: T.ink, letterSpacing: -0.6, lineHeight: 1.1,
      }}>Depuis combien de temps<br/>tu galères avec ça ?</div>
    </div>

    <div style={{
      display: 'flex', justifyContent: 'center', position: 'relative', margin: '12px 0 4px',
    }}>
      <div style={{ position: 'relative' }}>
        <SpeechBubble offset={{ top: 8, left: -120 }}>
          Pas de honte, on commence quand on est prêt·e
        </SpeechBubble>
        <Bubule size={170} mood="wonder" accent="#9CC7E0" />
      </div>
    </div>

    <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <QuizOption emoji="🌱" label="Quelques semaines"
                  hint="ça vient de me prendre" />
      <QuizOption emoji="📅" label="Quelques mois" selected={true}
                  hint="je tourne autour du sujet" />
      <QuizOption emoji="🌀" label="Plus d'un an"
                  hint="j'ai déjà essayé d'autres apps" />
      <QuizOption emoji="♾️" label="Toute ma vie"
                  hint="changer va faire du bien" />
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────
//  04 — Quiz 3 (Goal)
// ────────────────────────────────────────────────────────────
const OnbQuiz3 = () => (
  <div style={{
    background: T.bgBase, minHeight: '100%', paddingTop: 64, paddingBottom: 36,
  }}>
    <div style={{ padding: '0 20px' }}>
      <ProgressDots step={4} />
      <div style={{
        fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
        textTransform: 'uppercase', color: T.brand, marginBottom: 6,
      }}>Question 3 / 3</div>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: 28, color: T.ink, letterSpacing: -0.6, lineHeight: 1.1,
      }}>Si tout se passait bien,<br/><span style={{ fontStyle: 'italic', color: T.brand }}>tu rêves de quoi ?</span></div>
    </div>

    <div style={{
      display: 'flex', justifyContent: 'center', position: 'relative', margin: '12px 0 4px',
    }}>
      <div style={{ position: 'relative' }}>
        <SpeechBubble offset={{ top: 8, left: -110 }}>
          Vise grand, on s'organise après
        </SpeechBubble>
        <Bubule size={170} mood="motivation" accent="#A4D4A2" />
      </div>
    </div>

    <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <QuizOption emoji="🏖️" label="Un voyage qui me fait rêver" />
      <QuizOption emoji="🏠" label="Acheter un logement"
                  selected={true} />
      <QuizOption emoji="🛡️" label="Une vraie épargne de sécurité" />
      <QuizOption emoji="🎓" label="Investir dans mes études" />
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────
//  05 — Empathy (analyzing → result)
// ────────────────────────────────────────────────────────────
const OnbEmpathy = () => (
  <div style={{
    background: T.bgBase, minHeight: '100%', paddingTop: 64, paddingBottom: 36,
    position: 'relative', overflow: 'hidden',
  }}>
    {/* faint expanding circle */}
    <div style={{
      position: 'absolute', left: '50%', top: '40%',
      width: 600, height: 600, borderRadius: 300,
      background: `${T.brand}06`,
      transform: 'translate(-50%, -50%)',
    }} />

    <div style={{ padding: '0 20px', position: 'relative' }}>
      <ProgressDots step={5} />

      {/* Tiny eyebrow */}
      <div style={{
        fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
        textTransform: 'uppercase', color: T.brand, marginBottom: 6,
      }}>Ce qu'on a entendu</div>

      <div style={{
        fontFamily: T.fontDisplay, fontSize: 30, color: T.ink, letterSpacing: -0.7, lineHeight: 1.1,
      }}>
        Tu n'es <span style={{ fontStyle: 'italic', color: T.brand }}>vraiment</span> pas tout·e seul·e.
      </div>

      {/* Stat block — pull quote style */}
      <div style={{
        marginTop: 22, padding: '20px 18px',
        background: T.bgInk, borderRadius: 18,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 56, color: T.brand, letterSpacing: -2, lineHeight: 1,
          fontStyle: 'italic',
        }}>72%</div>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 16, color: T.inkOnDark, letterSpacing: -0.2,
          lineHeight: 1.35, marginTop: 8, textWrap: 'pretty',
        }}>
          des gens comme toi disent ne pas savoir où part leur argent à la fin du mois.
        </div>
        <div style={{
          marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(245,245,241,0.12)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Icon name="info" size={11} color={T.inkOnDarkM} strokeWidth={2} />
          <span style={{
            fontFamily: T.fontUI, fontSize: 10, color: T.inkOnDarkM, fontStyle: 'italic',
          }}>Étude Mitsitsy · 1 200 utilisateurs Madagascar 2025</span>
        </div>
      </div>

      {/* Mascot + bubble */}
      <div style={{
        display: 'flex', justifyContent: 'center', position: 'relative', margin: '20px 0 8px',
      }}>
        <div style={{ position: 'relative' }}>
          <SpeechBubble offset={{ top: 6, left: -110 }}>
            On va y aller doucement, ensemble
          </SpeechBubble>
          <Bubule size={150} mood="motivation" accent="#A4D4A2" />
        </div>
      </div>

      <div style={{
        textAlign: 'center', padding: '0 12px', marginBottom: 20,
        fontFamily: T.fontUI, fontSize: 13, color: T.inkMuted, lineHeight: 1.5,
      }}>
        Comme tu galères depuis quelques mois, on va construire ton plan pour <strong style={{ color: T.ink }}>acheter un logement</strong>.
      </div>
    </div>

    <div style={{ padding: '0 20px' }}>
      <PrimaryBtn label="Voir mon plan" />
    </div>
  </div>
);

window.MTS_OnbWelcome = OnbWelcome;
window.MTS_OnbQuiz1   = OnbQuiz1;
window.MTS_OnbQuiz2   = OnbQuiz2;
window.MTS_OnbQuiz3   = OnbQuiz3;
window.MTS_OnbEmpathy = OnbEmpathy;
window.MTS_OnbBubule  = Bubule;
window.MTS_OnbBits    = { ProgressDots, SpeechBubble, PrimaryBtn, QuizOption };
