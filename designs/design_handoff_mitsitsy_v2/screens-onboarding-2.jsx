/* global React */
const T = window.MTS_TOKENS;
const { Icon, Money, Card } = window.MTS_UI;
const { ProgressDots, SpeechBubble, PrimaryBtn, QuizOption } = window.MTS_OnbBits;
const Bubule = window.MTS_OnbBubule;

// ────────────────────────────────────────────────────────────
//  06 — Solution (3 personalised benefits)
// ────────────────────────────────────────────────────────────
const OnbSolution = () => {
  const benefits = [
    { icon: 'pulse',   label: 'Visualise tes flux',
      desc: 'Un seul écran pour comprendre où va chaque ariary, sans tableur.' },
    { icon: 'bell2',   label: 'Reçois les alertes utiles',
      desc: 'On te prévient avant le dépassement, pas une fois qu\'il est fait.' },
    { icon: 'trophy',  label: 'Construis tes habitudes',
      desc: 'Petits défis quotidiens, badges et progression — sans culpabilité.' },
  ];
  return (
    <div style={{
      background: T.bgBase, minHeight: '100%', paddingTop: 64, paddingBottom: 36,
    }}>
      <div style={{ padding: '0 20px' }}>
        <ProgressDots step={6} />
        <div style={{
          fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
          textTransform: 'uppercase', color: T.brand, marginBottom: 6,
        }}>Voilà notre proposition</div>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 28, color: T.ink, letterSpacing: -0.6, lineHeight: 1.1,
        }}>
          Trois choses que Mitsitsy<br/>
          va faire <span style={{ fontStyle: 'italic', color: T.brand }}>pour toi.</span>
        </div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'center', position: 'relative', margin: '14px 0 4px',
      }}>
        <div style={{ position: 'relative' }}>
          <SpeechBubble offset={{ top: 6, left: -110 }}>
            Personnalisé selon tes réponses
          </SpeechBubble>
          <Bubule size={150} mood="help" />
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {benefits.map((b, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 14,
            padding: '14px 6px',
            borderTop: i === 0 ? `1px solid ${T.hairline}` : 'none',
            borderBottom: `1px solid ${T.hairline}`,
          }}>
            <div style={{
              width: 14, paddingTop: 4,
              fontFamily: T.fontDisplay, fontSize: 14, color: T.brand,
              fontStyle: 'italic',
              fontVariantNumeric: 'tabular-nums',
            }}>0{i + 1}</div>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: T.brandSoft,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon name={b.icon} size={18} color={T.brand} strokeWidth={1.9} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: T.fontDisplay, fontSize: 17, color: T.ink, letterSpacing: -0.3, lineHeight: 1.2,
              }}>{b.label}</div>
              <div style={{
                fontFamily: T.fontUI, fontSize: 12, color: T.inkMuted, marginTop: 4, lineHeight: 1.4,
              }}>{b.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <PrimaryBtn label="On essaie ?" />
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//  07 — Wow moment (interactive demo)
// ────────────────────────────────────────────────────────────
const OnbWow = () => {
  const tapped = ['coffee', 'taxi'];
  const expenses = [
    { id: 'coffee', label: 'Café du matin',  cat: 'Alimentation', icon: 'fork', color: '#C8442C', amount: 15000 },
    { id: 'taxi',   label: 'Trajet Antaninarenina', cat: 'Transport', icon: 'car', color: '#3D7BB6', amount: 8000 },
    { id: 'lunch',  label: 'Déjeuner',       cat: 'Alimentation', icon: 'fork', color: '#C8442C', amount: 25000 },
    { id: 'phone',  label: 'Top-up Orange',  cat: 'Factures',     icon: 'receipt', color: '#7B5EA8', amount: 12000 },
  ];
  const baseBalance = 1000000;
  const spent = expenses.filter(e => tapped.includes(e.id)).reduce((s, e) => s + e.amount, 0);
  const balance = baseBalance - spent;

  return (
    <div style={{
      background: T.bgBase, minHeight: '100%', paddingTop: 64, paddingBottom: 36,
    }}>
      <div style={{ padding: '0 20px' }}>
        <ProgressDots step={7} />
        <div style={{
          fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
          textTransform: 'uppercase', color: T.brand, marginBottom: 6,
        }}>Petit essai — sans risque</div>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 26, color: T.ink, letterSpacing: -0.5, lineHeight: 1.1,
        }}>Ajoute quelques dépenses,<br/>regarde ton solde respirer.</div>
      </div>

      {/* Currency picker */}
      <div style={{ padding: '14px 20px 12px' }}>
        <div style={{
          fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 1.4,
          textTransform: 'uppercase', color: T.inkSubtle, marginBottom: 8,
        }}>Devise</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { code: 'MGA', sym: 'Ar', active: true },
            { code: 'EUR', sym: '€',  active: false },
            { code: 'USD', sym: '$',  active: false },
          ].map(c => (
            <div key={c.code} style={{
              flex: 1, padding: '10px 0', borderRadius: 12,
              background: c.active ? T.bgInk : 'transparent',
              border: c.active ? `1px solid ${T.bgInk}` : `1px solid ${T.hairlineStrong}`,
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: T.fontDisplay, fontSize: 16, color: c.active ? T.inkOnDark : T.ink,
                letterSpacing: -0.2, fontStyle: 'italic',
              }}>{c.sym}</div>
              <div style={{
                fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 0.4,
                color: c.active ? T.inkOnDarkM : T.inkSubtle, marginTop: 1,
              }}>{c.code}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live balance display */}
      <div style={{ padding: '0 20px', marginBottom: 14 }}>
        <div style={{
          padding: 18, borderRadius: 18,
          background: T.brandSoft,
          border: `1px solid ${T.brand}30`,
        }}>
          <div style={{
            fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
            textTransform: 'uppercase', color: T.brand, marginBottom: 4,
          }}>Solde après tes ajouts</div>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 38, color: T.brandDeep, letterSpacing: -1, lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {balance.toLocaleString('fr-FR')} <span style={{ fontSize: 22, fontStyle: 'italic' }}>Ar</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginTop: 8,
          }}>
            <Icon name="arrowDown" size={11} color={T.brandDeep} strokeWidth={2.4} />
            <span style={{
              fontFamily: T.fontUI, fontSize: 11, color: T.brandDeep, fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}>−{spent.toLocaleString('fr-FR')} Ar dépensés</span>
          </div>
        </div>
      </div>

      {/* Tap-to-add expenses */}
      <div style={{ padding: '0 20px 14px' }}>
        <div style={{
          fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 1.4,
          textTransform: 'uppercase', color: T.inkSubtle, marginBottom: 8,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Icon name="spark" size={11} color={T.inkSubtle} strokeWidth={2} />
          Tape pour ajouter
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {expenses.map(e => {
            const isAdded = tapped.includes(e.id);
            return (
              <div key={e.id} style={{
                padding: '12px 14px', borderRadius: 14,
                background: isAdded ? T.bgRaised : T.bgSurface,
                border: `1px solid ${T.hairline}`,
                display: 'flex', alignItems: 'center', gap: 12,
                opacity: isAdded ? 0.55 : 1,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${e.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={e.icon} size={16} color={e.color} strokeWidth={1.9} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: T.fontUI, fontSize: 13, fontWeight: 600, color: T.ink,
                  }}>{e.label}</div>
                  <div style={{
                    fontFamily: T.fontUI, fontSize: 11, color: T.inkSubtle, marginTop: 1,
                  }}>{e.cat}</div>
                </div>
                <div style={{
                  fontFamily: T.fontUI, fontSize: 13, fontWeight: 700,
                  color: isAdded ? T.inkSubtle : T.danger,
                  fontVariantNumeric: 'tabular-nums',
                }}>−{e.amount.toLocaleString('fr-FR')}</div>
                {isAdded ? (
                  <div style={{
                    width: 22, height: 22, borderRadius: 11,
                    background: T.brand, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name="check" size={11} color={T.inkOnDark} strokeWidth={3} />
                  </div>
                ) : (
                  <div style={{
                    width: 22, height: 22, borderRadius: 11,
                    border: `1.5px dashed ${T.hairlineStrong}`,
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{
        padding: '0 20px',
        fontFamily: T.fontUI, fontSize: 11, color: T.inkSubtle, textAlign: 'center', fontStyle: 'italic',
      }}>
        2 sur 4 — continue, on te prépare un mini-rapport ✨
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//  07b — Wow report bottom sheet (after all tapped)
// ────────────────────────────────────────────────────────────
const OnbWowReport = () => {
  const cats = [
    { name: 'Alimentation', amount: 40000, color: '#C8442C', pct: 67 },
    { name: 'Transport',    amount: 8000,  color: '#3D7BB6', pct: 13 },
    { name: 'Factures',     amount: 12000, color: '#7B5EA8', pct: 20 },
  ];
  const total = cats.reduce((s, c) => s + c.amount, 0);

  return (
    <div style={{
      background: T.bgBase, minHeight: '100%', paddingTop: 64, paddingBottom: 36,
      position: 'relative',
    }}>
      {/* dim background suggestion */}
      <div style={{
        position: 'absolute', inset: 0, top: 64,
        background: 'rgba(15,19,17,0.45)',
      }} />

      {/* Tiny confetti dots */}
      {[
        { top: 90, left: 50, color: '#FFC857' },
        { top: 110, right: 60, color: T.brand },
        { top: 140, left: 80, color: '#C8442C' },
        { top: 170, right: 90, color: '#A4D4A2' },
        { top: 95, left: 200, color: '#7B5EA8' },
      ].map((c, i) => (
        <div key={i} style={{
          position: 'absolute', ...c, width: 6, height: 6, borderRadius: 3, background: c.color,
          opacity: 0.85,
        }} />
      ))}

      {/* Bottom sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: T.bgBase, borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: '20px 20px 28px',
      }}>
        <div style={{
          width: 38, height: 4, borderRadius: 999, background: T.hairlineStrong,
          margin: '0 auto 16px',
        }} />

        <div style={{
          display: 'flex', justifyContent: 'center', position: 'relative', marginBottom: 8,
        }}>
          <div style={{ position: 'relative' }}>
            <SpeechBubble offset={{ top: -6, left: -110 }}>
              Bravo, t'es prêt·e ! 🎉
            </SpeechBubble>
            <Bubule size={120} mood="happy" />
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 22, color: T.ink, letterSpacing: -0.4, lineHeight: 1.15,
          }}>Voici ton mini-rapport</div>
          <div style={{
            fontFamily: T.fontUI, fontSize: 12, color: T.inkMuted, marginTop: 4,
          }}>4 dépenses · 3 catégories</div>
        </div>

        {/* Receipt-style report */}
        <div style={{
          padding: 16, borderRadius: 14,
          border: `1px solid ${T.hairlineStrong}`,
          background: T.bgRaised,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12,
          }}>
            <Icon name="receipt" size={13} color={T.brand} strokeWidth={1.9} />
            <span style={{
              fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 1.4,
              textTransform: 'uppercase', color: T.brand,
            }}>Répartition</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cats.map((c, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{
                    fontFamily: T.fontUI, fontSize: 12, fontWeight: 600, color: T.ink,
                  }}>{c.name}</span>
                  <span style={{
                    fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, color: T.ink,
                    fontVariantNumeric: 'tabular-nums',
                  }}>{c.amount.toLocaleString('fr-FR')}</span>
                </div>
                <div style={{
                  height: 5, borderRadius: 999, background: 'rgba(15,19,17,0.06)',
                }}>
                  <div style={{
                    width: `${c.pct}%`, height: '100%', borderRadius: 999, background: c.color,
                  }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${T.hairlineStrong}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          }}>
            <span style={{
              fontFamily: T.fontDisplay, fontSize: 14, color: T.ink, letterSpacing: -0.2,
            }}>Total dépensé</span>
            <span style={{
              fontFamily: T.fontDisplay, fontSize: 22, color: T.danger, letterSpacing: -0.4,
              fontVariantNumeric: 'tabular-nums', fontStyle: 'italic',
            }}>−{total.toLocaleString('fr-FR')} Ar</span>
          </div>
        </div>

        <div style={{
          textAlign: 'center', padding: '14px 12px 0',
          fontFamily: T.fontUI, fontSize: 12, color: T.inkMuted, lineHeight: 1.5,
        }}>
          C'était <span style={{ color: T.brand, fontWeight: 700 }}>juste un essai</span>. Maintenant on configure ton vrai compte.
        </div>

        <div style={{ marginTop: 18 }}>
          <PrimaryBtn label="Configurer mon compte" />
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//  08 — Balance setup
// ────────────────────────────────────────────────────────────
const OnbBalance = () => (
  <div style={{
    background: T.bgBase, minHeight: '100%', paddingTop: 64, paddingBottom: 36,
  }}>
    <div style={{ padding: '0 20px' }}>
      <ProgressDots step={7} />
      <div style={{
        fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
        textTransform: 'uppercase', color: T.brand, marginBottom: 6,
      }}>Configurer tes comptes</div>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: 28, color: T.ink, letterSpacing: -0.6, lineHeight: 1.1,
      }}>Combien tu as<br/>là, <span style={{ fontStyle: 'italic', color: T.brand }}>maintenant ?</span></div>
      <div style={{
        fontFamily: T.fontUI, fontSize: 13, color: T.inkMuted, marginTop: 8, lineHeight: 1.5,
      }}>
        Pas besoin d'être précis au franc près. On affinera ensemble.
      </div>
    </div>

    {/* Bank account input */}
    <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        padding: '16px 16px',
        background: T.bgSurface,
        border: `1px solid ${T.hairline}`,
        borderRadius: 16,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `${T.brand}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="bank" size={18} color={T.brand} strokeWidth={1.9} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: T.fontDisplay, fontSize: 16, color: T.ink, letterSpacing: -0.2,
            }}>Compte courant</div>
            <div style={{
              fontFamily: T.fontUI, fontSize: 11, color: T.inkSubtle, marginTop: 1,
            }}>Banque, mobile money</div>
          </div>
          <div style={{
            fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 0.6,
            color: T.inkSubtle,
          }}>MGA</div>
        </div>
        <div style={{
          padding: '14px 14px',
          background: T.bgRaised, borderRadius: 12,
          display: 'flex', alignItems: 'baseline', gap: 8,
        }}>
          <span style={{
            fontFamily: T.fontDisplay, fontSize: 28, color: T.ink, letterSpacing: -0.5,
            fontVariantNumeric: 'tabular-nums',
          }}>1 420 000</span>
          <span style={{
            fontFamily: T.fontUI, fontSize: 13, color: T.inkSubtle, fontWeight: 600,
          }}>Ar</span>
          <div style={{
            marginLeft: 'auto', width: 2, height: 24, background: T.brand,
            opacity: 0.7, animation: 'blink 1s infinite',
          }} />
        </div>
      </div>

      <div style={{
        padding: '16px 16px',
        background: T.bgSurface,
        border: `1px solid ${T.hairline}`,
        borderRadius: 16,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: '#C8442C18',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="cash" size={18} color="#C8442C" strokeWidth={1.9} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: T.fontDisplay, fontSize: 16, color: T.ink, letterSpacing: -0.2,
            }}>Espèces</div>
            <div style={{
              fontFamily: T.fontUI, fontSize: 11, color: T.inkSubtle, marginTop: 1,
            }}>Ce que tu as en cash sur toi</div>
          </div>
          <div style={{
            fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 0.6,
            color: T.inkSubtle,
          }}>MGA</div>
        </div>
        <div style={{
          padding: '14px 14px',
          background: T.bgRaised, borderRadius: 12,
          display: 'flex', alignItems: 'baseline', gap: 8,
        }}>
          <span style={{
            fontFamily: T.fontDisplay, fontSize: 28, color: T.inkSubtle, letterSpacing: -0.5,
            fontVariantNumeric: 'tabular-nums', fontStyle: 'italic',
          }}>0</span>
          <span style={{
            fontFamily: T.fontUI, fontSize: 13, color: T.inkSubtle, fontWeight: 600,
          }}>Ar</span>
        </div>
      </div>

      {/* Tip card */}
      <div style={{
        padding: '12px 14px', borderRadius: 12,
        background: T.brandSoft,
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <Icon name="info" size={14} color={T.brand} strokeWidth={2} />
        <div style={{
          fontFamily: T.fontUI, fontSize: 11, color: T.brandDeep, lineHeight: 1.4, flex: 1,
        }}>
          Tu pourras ajouter d'autres comptes (épargne, prêt) après l'onboarding. On garde simple pour démarrer.
        </div>
      </div>
    </div>

    <div style={{ padding: '20px 20px 0' }}>
      <PrimaryBtn label="Continuer" />
    </div>
  </div>
);

// ────────────────────────────────────────────────────────────
//  09 — Categories selection
// ────────────────────────────────────────────────────────────
const OnbCategories = () => {
  const cats = [
    { id: 'food',     label: 'Alimentation', icon: 'fork',    color: '#C8442C', sel: true },
    { id: 'trans',    label: 'Transport',    icon: 'car',     color: '#3D7BB6', sel: true },
    { id: 'bills',    label: 'Factures',     icon: 'receipt', color: '#7B5EA8', sel: true },
    { id: 'shop',     label: 'Shopping',     icon: 'bag',     color: '#EAB308', sel: true },
    { id: 'health',   label: 'Santé',        icon: 'leaf',    color: '#16A371', sel: false },
    { id: 'leisure',  label: 'Loisirs',      icon: 'sparkle', color: '#EC4899', sel: true },
    { id: 'home',     label: 'Maison',       icon: 'home2',   color: '#0E8C82', sel: false },
    { id: 'gift',     label: 'Cadeaux',      icon: 'spark',   color: '#F59E0B', sel: false },
  ];
  const selectedCount = cats.filter(c => c.sel).length;

  return (
    <div style={{
      background: T.bgBase, minHeight: '100%', paddingTop: 64, paddingBottom: 36,
    }}>
      <div style={{ padding: '0 20px' }}>
        <ProgressDots step={8} />
        <div style={{
          fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
          textTransform: 'uppercase', color: T.brand, marginBottom: 6,
        }}>Dernière étape</div>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 28, color: T.ink, letterSpacing: -0.6, lineHeight: 1.1,
        }}>Quelles catégories<br/>tu utilises <span style={{ fontStyle: 'italic', color: T.brand }}>vraiment ?</span></div>
        <div style={{
          fontFamily: T.fontUI, fontSize: 13, color: T.inkMuted, marginTop: 8, lineHeight: 1.5,
        }}>
          Choisis ce qui te parle. Tu pourras renommer, supprimer ou en créer plus tard.
        </div>

        <div style={{
          marginTop: 14, padding: '8px 12px',
          background: T.bgRaised, borderRadius: 999,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{
            fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, color: T.brand,
            fontVariantNumeric: 'tabular-nums',
          }}>{selectedCount}</span>
          <span style={{ fontFamily: T.fontUI, fontSize: 11, color: T.inkMuted }}>
            sélectionnées · max 12
          </span>
        </div>
      </div>

      <div style={{
        padding: '16px 20px 0',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
      }}>
        {cats.map(c => (
          <div key={c.id} style={{
            padding: '12px 12px', borderRadius: 14,
            background: c.sel ? T.bgSurface : 'transparent',
            border: `1px ${c.sel ? 'solid' : 'dashed'} ${c.sel ? c.color + '35' : T.hairlineStrong}`,
            display: 'flex', alignItems: 'center', gap: 10,
            opacity: c.sel ? 1 : 0.7,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: c.sel ? `${c.color}18` : 'rgba(15,19,17,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={c.icon} size={15} color={c.sel ? c.color : T.inkSubtle} strokeWidth={1.9} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: T.fontUI, fontSize: 12, fontWeight: 700,
                color: c.sel ? T.ink : T.inkMuted,
              }}>{c.label}</div>
            </div>
            <div style={{
              width: 18, height: 18, borderRadius: 9,
              border: `1.5px solid ${c.sel ? c.color : T.hairlineStrong}`,
              background: c.sel ? c.color : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {c.sel && <Icon name="check" size={9} color="#FFFFFF" strokeWidth={3.4} />}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        padding: '16px 20px 0',
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{
          padding: '8px 14px', borderRadius: 999,
          border: `1px dashed ${T.hairlineStrong}`,
          fontFamily: T.fontUI, fontSize: 11, fontWeight: 600, color: T.inkMuted,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Icon name="plus" size={11} color={T.inkMuted} strokeWidth={2.2} />
          Créer une catégorie sur-mesure
        </div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <PrimaryBtn label={`Terminer · ${selectedCount} catégories`} />
        <div style={{
          textAlign: 'center', marginTop: 12,
          fontFamily: T.fontUI, fontSize: 11, color: T.inkSubtle, fontStyle: 'italic',
        }}>
          On t'amène directement à ta première saisie ✨
        </div>
      </div>
    </div>
  );
};

window.MTS_OnbSolution   = OnbSolution;
window.MTS_OnbWow        = OnbWow;
window.MTS_OnbWowReport  = OnbWowReport;
window.MTS_OnbBalance    = OnbBalance;
window.MTS_OnbCategories = OnbCategories;
