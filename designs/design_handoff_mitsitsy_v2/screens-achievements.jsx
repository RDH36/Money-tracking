/* global React */
const T = window.MTS_TOKENS;
const { Icon, Chip, Card } = window.MTS_UI;

// ────────────────────────────────────────────────────────────
//  Shared: Hero (level + XP + stats)
// ────────────────────────────────────────────────────────────
const AchievementsHero = () => {
  const level = 8;
  const xp = 1240;
  const nextLevelXp = 1500;
  const progress = (xp - 1000) / (nextLevelXp - 1000);
  const earned = 14;
  const totalBadges = 32;
  const streak = 12;
  const freezes = 2;

  return (
    <Card dark style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', right: -50, top: -50, width: 160, height: 160,
        borderRadius: 80, background: 'rgba(14,140,130,0.18)',
      }} />
      <div style={{
        position: 'absolute', left: -30, bottom: -30, width: 100, height: 100,
        borderRadius: 50, background: 'rgba(245,245,241,0.04)',
      }} />

      {/* Level row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: `linear-gradient(135deg, ${T.brand}, ${T.brandDeep})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 8px 22px ${T.brand}40`,
        }}>
          <span style={{
            fontFamily: T.fontDisplay, fontSize: 26, color: T.inkOnDark,
            letterSpacing: -0.5, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          }}>{level}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: T.fontUI, fontSize: 10, fontWeight: 600, letterSpacing: 1.5,
            textTransform: 'uppercase', color: T.inkOnDarkM, marginBottom: 2,
          }}>Niveau · épargnant·e</div>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 22, color: T.inkOnDark, letterSpacing: -0.4, lineHeight: 1,
          }}>Apprenti zen</div>
        </div>
      </div>

      {/* XP bar */}
      <div style={{ marginTop: 16 }}>
        <div style={{
          height: 6, background: 'rgba(245,245,241,0.12)', borderRadius: 999, overflow: 'hidden',
        }}>
          <div style={{
            width: `${Math.min(progress * 100, 100)}%`, height: '100%',
            background: `linear-gradient(90deg, ${T.brand}, #2EBDA8)`,
            borderRadius: 999,
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
          <span style={{
            fontFamily: T.fontUI, fontSize: 11, color: T.inkOnDarkM, fontVariantNumeric: 'tabular-nums', fontWeight: 600,
          }}>{xp.toLocaleString('fr-FR')} XP</span>
          <span style={{
            fontFamily: T.fontUI, fontSize: 11, color: T.inkOnDarkM, fontVariantNumeric: 'tabular-nums',
          }}>plus que {(nextLevelXp - xp).toLocaleString('fr-FR')} pour niv. {level + 1}</span>
        </div>
      </div>

      {/* Stat chips */}
      <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
        {[
          { icon: 'flame', color: '#EF4444', value: `${streak}j`, label: 'série' },
          { icon: 'spark', color: '#06B6D4', value: String(freezes), label: 'gels' },
          { icon: 'trophy', color: '#EAB308', value: xp.toLocaleString('fr-FR'), label: 'XP' },
          { icon: 'check', color: T.brand, value: `${earned}/${totalBadges}`, label: 'badges' },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, padding: '8px 6px', borderRadius: 10,
            background: 'rgba(245,245,241,0.08)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name={s.icon} size={11} color={s.color} strokeWidth={2.4} />
              <span style={{
                fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, color: T.inkOnDark,
                fontVariantNumeric: 'tabular-nums',
              }}>{s.value}</span>
            </div>
            <span style={{
              fontFamily: T.fontUI, fontSize: 9, fontWeight: 600, letterSpacing: 0.6,
              textTransform: 'uppercase', color: T.inkOnDarkM,
            }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Countdown */}
      <div style={{
        marginTop: 12, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <Icon name="time" size={11} color={T.inkOnDarkM} strokeWidth={1.9} />
        <span style={{ fontFamily: T.fontUI, fontSize: 10, color: T.inkOnDarkM, fontWeight: 500 }}>
          Prochain défi quotidien dans 4h 23m
        </span>
      </div>
    </Card>
  );
};

// ────────────────────────────────────────────────────────────
//  Header + segmented control
// ────────────────────────────────────────────────────────────
const AchHeader = ({ active = 'challenges' }) => {
  const tabs = [
    { id: 'challenges', label: 'Défis', icon: 'flame' },
    { id: 'quests',     label: 'Quêtes', icon: 'target' },
    { id: 'badges',     label: 'Badges', icon: 'trophy' },
  ];
  return (
    <>
      <div style={{ padding: '64px 20px 14px' }}>
        <div style={{
          fontFamily: T.fontUI, fontSize: 10, fontWeight: 600, letterSpacing: 1.5,
          textTransform: 'uppercase', color: T.inkSubtle, marginBottom: 4,
        }}>Avril 2026 · semaine 17</div>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 36, color: T.ink, letterSpacing: -1, lineHeight: 1,
        }}>Succès</div>
      </div>

      <div style={{ padding: '0 16px' }}>
        <AchievementsHero />
      </div>

      {/* Segmented control */}
      <div style={{
        display: 'flex', gap: 4, padding: '14px 16px 6px',
      }}>
        <div style={{
          background: T.bgRaised, borderRadius: 12, padding: 4,
          display: 'flex', flex: 1, gap: 2,
        }}>
          {tabs.map(t => {
            const isActive = t.id === active;
            return (
              <div key={t.id} style={{
                flex: 1, padding: '9px 8px', borderRadius: 9,
                background: isActive ? T.bgSurface : 'transparent',
                boxShadow: isActive ? '0 1px 4px rgba(15,19,17,0.08)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}>
                <Icon name={t.icon} size={13} color={isActive ? T.brand : T.inkSubtle} strokeWidth={isActive ? 2.2 : 1.8} />
                <span style={{
                  fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, letterSpacing: 0.2,
                  color: isActive ? T.ink : T.inkSubtle,
                }}>{t.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

// ────────────────────────────────────────────────────────────
//  Challenge card
// ────────────────────────────────────────────────────────────
const ChallengeCard = ({ kind, label, desc, xp, color, icon, completed, progress, target }) => {
  const tone = completed ? '#16A371' : color;
  const bg = completed ? 'rgba(22,163,113,0.08)' : `${color}10`;
  return (
    <Card style={{ padding: 14, background: bg, border: `1px solid ${tone}25` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: completed ? 'rgba(22,163,113,0.18)' : `${color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon name={completed ? 'check' : icon} size={18} color={tone} strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8,
          }}>
            <div>
              <div style={{
                fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 1.4,
                textTransform: 'uppercase', color: tone, marginBottom: 2,
              }}>{kind}</div>
              <div style={{
                fontFamily: T.fontUI, fontSize: 14, fontWeight: 700, color: T.ink, lineHeight: 1.2,
              }}>{label}</div>
            </div>
            <div style={{
              fontFamily: T.fontUI, fontSize: 13, fontWeight: 800, color: tone,
              fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
            }}>+{xp}</div>
          </div>
          <div style={{
            fontFamily: T.fontUI, fontSize: 12, color: T.inkMuted, marginTop: 4, lineHeight: 1.4,
          }}>{desc}</div>
          {!completed && target > 1 && progress !== undefined && (
            <div style={{ marginTop: 10 }}>
              <div style={{
                height: 5, background: 'rgba(15,19,17,0.06)', borderRadius: 999, overflow: 'hidden',
              }}>
                <div style={{
                  width: `${Math.min((progress / target) * 100, 100)}%`, height: '100%',
                  background: color, borderRadius: 999,
                }} />
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', marginTop: 5,
                fontFamily: T.fontUI, fontSize: 11, color: T.inkSubtle, fontVariantNumeric: 'tabular-nums',
              }}>
                <span>Progression</span>
                <span style={{ fontWeight: 700, color: T.ink }}>{progress} / {target}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// ────────────────────────────────────────────────────────────
//  Variation A — Challenges (default)
// ────────────────────────────────────────────────────────────
const AchievementsChallenges = () => {
  return (
    <div style={{ background: T.bgBase, minHeight: '100%', paddingBottom: 110 }}>
      <AchHeader active="challenges" />

      <div style={{ padding: '6px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ChallengeCard
            kind="Défi du jour"
            icon="receipt"
            color="#EAB308"
            label="Saisis 3 transactions aujourd'hui"
            desc="Continue ta série · reset à minuit"
            xp={50}
            progress={2}
            target={3}
            completed={false}
          />
          <ChallengeCard
            kind="Défi de la semaine"
            icon="time"
            color="#8B5CF6"
            label="Reste sous ton budget Restaurants"
            desc="3 jours déjà sans dépassement, plus que 4 à tenir"
            xp={150}
            progress={3}
            target={7}
            completed={false}
          />
          <ChallengeCard
            kind="Défi du mois"
            icon="target"
            color="#F59E0B"
            label="50 transactions saisies en avril"
            desc="Tu es à mi-parcours, garde le rythme"
            xp={500}
            progress={28}
            target={50}
            completed={false}
          />
          <ChallengeCard
            kind="Défi de la semaine · terminé"
            icon="check"
            color="#16A371"
            label="3 catégories utilisées"
            desc="Bien vu · récompense ajoutée à ton total"
            xp={100}
            progress={3}
            target={3}
            completed={true}
          />
        </div>

        {/* Upcoming unlocks */}
        <div style={{
          padding: '0 6px', marginTop: 22, marginBottom: 10,
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        }}>
          <div style={{
            fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 1.6,
            textTransform: 'uppercase', color: T.inkSubtle,
          }}>À débloquer prochainement</div>
          <span style={{ fontFamily: T.fontUI, fontSize: 11, fontWeight: 600, color: T.brand }}>
            Voir tout
          </span>
        </div>

        <Card style={{ padding: 4, overflow: 'hidden' }}>
          {[
            { name: 'Slot catégorie +1',     desc: 'Crée une 7ᵉ catégorie personnalisée', xp: 200,  current: 1240 },
            { name: 'Thème Émeraude',        desc: 'Une variation forêt sombre',          xp: 800,  current: 1240 },
            { name: 'Slot compte +1',        desc: '4ᵉ compte (mobile money / épargne)',  xp: 1200, current: 1240 },
          ].map((u, i, arr) => {
            const remaining = u.xp - (u.current % u.xp);
            const close = u.xp <= u.current + 300;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px',
                borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${T.hairline}`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: close ? T.brandSoft : 'rgba(15,19,17,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={close ? 'spark' : 'settings'} size={14}
                        color={close ? T.brand : T.inkSubtle} strokeWidth={1.9} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, color: T.ink }}>
                    {u.name}
                  </div>
                  <div style={{
                    fontFamily: T.fontUI, fontSize: 11, color: T.inkSubtle, marginTop: 1,
                  }}>{u.desc}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: T.fontUI, fontSize: 12, fontWeight: 700,
                    color: close ? T.brand : T.inkMuted, fontVariantNumeric: 'tabular-nums',
                  }}>{u.xp.toLocaleString('fr-FR')} XP</div>
                  <div style={{
                    fontFamily: T.fontUI, fontSize: 10, color: T.inkSubtle, marginTop: 1,
                  }}>{close ? 'tout proche' : 'à atteindre'}</div>
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//  Variation B — Quests
// ────────────────────────────────────────────────────────────
const AchievementsQuests = () => {
  const tier1 = [
    {
      title: 'Le rituel du soir',
      desc: 'Saisis tes dépenses tous les jours',
      icon: 'time', color: '#0E8C82',
      currentStep: 2, totalSteps: 4,
      metricValue: 14, target: 21,
      nextXp: 200,
      completed: false,
    },
    {
      title: 'L\'œil du tigre',
      desc: 'Maîtrise les budgets par catégorie',
      icon: 'target', color: '#C8442C',
      currentStep: 3, totalSteps: 5,
      metricValue: 7, target: 10,
      nextXp: 350,
      completed: false,
    },
    {
      title: 'Petits ruisseaux',
      desc: 'Économise un peu chaque semaine',
      icon: 'leaf', color: '#16A371',
      currentStep: 4, totalSteps: 4,
      metricValue: 12, target: 12,
      nextXp: null,
      completed: true,
    },
    {
      title: 'Vue d\'ensemble',
      desc: 'Consulte tes rapports régulièrement',
      icon: 'pulse', color: '#3D7BB6',
      currentStep: 1, totalSteps: 3,
      metricValue: 4, target: 8,
      nextXp: 150,
      completed: false,
    },
  ];

  return (
    <div style={{ background: T.bgBase, minHeight: '100%', paddingBottom: 110 }}>
      <AchHeader active="quests" />

      <div style={{ padding: '6px 16px' }}>
        {/* Pull quote header */}
        <div style={{
          padding: '0 6px', marginBottom: 14, marginTop: 4,
        }}>
          <div style={{
            fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 1.6,
            textTransform: 'uppercase', color: T.inkSubtle, marginBottom: 4,
          }}>Quêtes au long cours · 4 actives</div>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 16, color: T.inkMuted, letterSpacing: -0.2,
            fontStyle: 'italic', lineHeight: 1.35,
          }}>Des objectifs en plusieurs étapes pour ancrer tes habitudes.</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tier1.map((q, i) => (
            <Card key={i} style={{
              padding: 14,
              background: q.completed ? 'rgba(22,163,113,0.08)' : T.bgSurface,
              border: q.completed ? `1px solid rgba(22,163,113,0.25)` : `1px solid ${T.hairline}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: q.completed ? 'rgba(22,163,113,0.18)' : `${q.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon name={q.completed ? 'check' : q.icon} size={18}
                        color={q.completed ? '#16A371' : q.color} strokeWidth={2.1} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8,
                  }}>
                    <div style={{
                      fontFamily: T.fontDisplay, fontSize: 17, color: T.ink, letterSpacing: -0.3, lineHeight: 1.2,
                    }}>{q.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {Array.from({ length: q.totalSteps }).map((_, idx) => (
                        <div key={idx} style={{
                          width: 6, height: 6, borderRadius: 3,
                          background: idx < q.currentStep
                            ? (q.completed ? '#16A371' : q.color)
                            : 'rgba(15,19,17,0.12)',
                        }} />
                      ))}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: T.fontUI, fontSize: 12, color: T.inkMuted, marginTop: 3, lineHeight: 1.4,
                  }}>{q.desc}</div>

                  {!q.completed ? (
                    <div style={{ marginTop: 10 }}>
                      <div style={{
                        height: 5, background: 'rgba(15,19,17,0.06)', borderRadius: 999, overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${Math.min((q.metricValue / q.target) * 100, 100)}%`, height: '100%',
                          background: q.color, borderRadius: 999,
                        }} />
                      </div>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', marginTop: 5,
                        fontFamily: T.fontUI, fontSize: 11, fontVariantNumeric: 'tabular-nums',
                      }}>
                        <span style={{ color: T.inkSubtle }}>
                          Étape {q.currentStep + 1} · {q.metricValue}/{q.target}
                        </span>
                        <span style={{ color: q.color, fontWeight: 700 }}>+{q.nextXp} XP</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      marginTop: 10, display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <Chip tone="good">Quête terminée</Chip>
                      <span style={{
                        fontFamily: T.fontUI, fontSize: 11, color: T.inkSubtle, fontStyle: 'italic',
                      }}>
                        +600 XP collectés
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Tier 2 — Epic */}
        <div style={{
          marginTop: 22, padding: '14px 16px', borderRadius: 14,
          background: `linear-gradient(135deg, ${T.warn}10, ${T.warn}05)`,
          border: `1px dashed ${T.warn}40`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Icon name="sparkle" size={18} color={T.warn} strokeWidth={1.9} />
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, letterSpacing: 0.4,
              textTransform: 'uppercase', color: T.warn,
            }}>Quêtes Épiques</div>
            <div style={{
              fontFamily: T.fontUI, fontSize: 11, color: T.inkMuted, marginTop: 2,
            }}>Termine toutes les quêtes ci-dessus pour les déverrouiller</div>
          </div>
          <div style={{
            fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, color: T.warn,
            fontVariantNumeric: 'tabular-nums',
          }}>3 / 4</div>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//  Variation C — Badges grid
// ────────────────────────────────────────────────────────────
const AchievementsBadges = () => {
  const filters = [
    { id: 'all',    label: 'Tous',       count: 32, active: true  },
    { id: 'earned', label: 'Obtenus',    count: 14, active: false },
    { id: 'locked', label: 'À obtenir',  count: 18, active: false },
  ];

  const badges = [
    { name: 'Premier pas',       desc: '1ʳᵉ transaction',   icon: 'spark',   color: '#EAB308', earned: true,  date: '12 jan' },
    { name: 'Sept jours',        desc: 'Série de 7 jours',  icon: 'flame',   color: '#EF4444', earned: true,  date: '19 jan' },
    { name: 'Triple',            desc: '3 catégories actives', icon: 'cart', color: '#0E8C82', earned: true,  date: '24 jan' },
    { name: 'Œil de lynx',       desc: 'Repère un dépassement', icon: 'eye', color: '#3D7BB6', earned: true,  date: '02 fév' },
    { name: 'Fourmilière',       desc: '50 transactions',   icon: 'leaf',    color: '#16A371', earned: true,  date: '11 fév' },
    { name: 'Mois propre',       desc: 'Budget tenu un mois', icon: 'check', color: T.brand,   earned: true,  date: '01 mar' },
    { name: 'Marathon',          desc: 'Série de 30 jours', icon: 'target',  color: '#7B5EA8', earned: false, progress: '12/30' },
    { name: 'Centurion',         desc: '100 transactions',  icon: 'receipt', color: '#0E8C82', earned: false, progress: '67/100' },
    { name: 'Trésorier',         desc: '3 comptes actifs',  icon: 'bank',    color: '#3B82F6', earned: false, progress: '2/3' },
    { name: 'Or pur',            desc: 'Niveau 10 atteint', icon: 'trophy',  color: '#D4AF37', earned: false, progress: 'niv 8' },
    { name: 'Sage',              desc: 'Pas de dépassement 3 mois', icon: 'leaf', color: '#5C6B2D', earned: false, progress: '1/3 mois' },
    { name: 'Visionnaire',       desc: 'Toutes les quêtes', icon: 'sparkle', color: '#EC4899', earned: false, progress: '3/4' },
  ];

  return (
    <div style={{ background: T.bgBase, minHeight: '100%', paddingBottom: 110 }}>
      <AchHeader active="badges" />

      <div style={{ padding: '6px 16px' }}>
        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {filters.map(f => (
            <div key={f.id} style={{
              padding: '8px 14px', borderRadius: 999,
              background: f.active ? T.ink : 'transparent',
              border: f.active ? `1px solid ${T.ink}` : `1px solid ${T.hairlineStrong}`,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{
                fontFamily: T.fontUI, fontSize: 12, fontWeight: 700,
                color: f.active ? T.inkOnDark : T.ink, letterSpacing: 0.2,
              }}>{f.label}</span>
              <span style={{
                fontFamily: T.fontUI, fontSize: 11, fontWeight: 600,
                color: f.active ? T.inkOnDarkM : T.inkSubtle,
                fontVariantNumeric: 'tabular-nums',
              }}>{f.count}</span>
            </div>
          ))}
        </div>

        {/* Earned section header */}
        <div style={{
          padding: '0 6px', marginBottom: 10,
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 1.6,
              textTransform: 'uppercase', color: T.brand,
            }}>Obtenus · 6 sur la grille</div>
            <div style={{
              fontFamily: T.fontDisplay, fontSize: 18, color: T.ink, letterSpacing: -0.3, marginTop: 3,
            }}>Ta collection</div>
          </div>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        }}>
          {badges.map((b, i) => (
            <Card key={i} style={{
              padding: '14px 12px',
              background: b.earned ? T.bgSurface : 'transparent',
              border: b.earned ? `1px solid ${b.color}25` : `1px dashed ${T.hairlineStrong}`,
              opacity: b.earned ? 1 : 0.7,
              position: 'relative', overflow: 'hidden',
            }}>
              {b.earned && (
                <div style={{
                  position: 'absolute', right: -20, top: -20, width: 70, height: 70,
                  borderRadius: 35, background: `${b.color}10`,
                }} />
              )}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: b.earned ? `${b.color}18` : 'rgba(15,19,17,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 10,
                  filter: b.earned ? 'none' : 'grayscale(0.7)',
                }}>
                  <Icon name={b.earned ? b.icon : 'settings'} size={20}
                        color={b.earned ? b.color : T.inkSubtle} strokeWidth={1.9} />
                </div>
                <div style={{
                  fontFamily: T.fontUI, fontSize: 13, fontWeight: 700,
                  color: b.earned ? T.ink : T.inkMuted, lineHeight: 1.2,
                }}>{b.name}</div>
                <div style={{
                  fontFamily: T.fontUI, fontSize: 11, color: T.inkSubtle, marginTop: 3, lineHeight: 1.3,
                }}>{b.desc}</div>
                <div style={{ marginTop: 8 }}>
                  {b.earned ? (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 8px', borderRadius: 999,
                      background: `${b.color}15`,
                    }}>
                      <Icon name="check" size={9} color={b.color} strokeWidth={2.6} />
                      <span style={{
                        fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, color: b.color,
                      }}>{b.date}</span>
                    </div>
                  ) : (
                    <span style={{
                      fontFamily: T.fontUI, fontSize: 10, fontWeight: 600,
                      color: T.inkSubtle, fontVariantNumeric: 'tabular-nums',
                    }}>· {b.progress}</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Hidden badges hint */}
        <div style={{
          marginTop: 14, padding: '12px 14px', borderRadius: 12,
          background: T.bgRaised,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'rgba(15,19,17,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: T.fontDisplay, fontSize: 18, color: T.inkSubtle, letterSpacing: -0.5,
          }}>?</div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, color: T.ink,
            }}>3 badges secrets</div>
            <div style={{
              fontFamily: T.fontUI, fontSize: 11, color: T.inkSubtle, marginTop: 1,
            }}>Continue d'utiliser Mitsitsy pour les découvrir</div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.MTS_AchievementsChallenges = AchievementsChallenges;
window.MTS_AchievementsQuests     = AchievementsQuests;
window.MTS_AchievementsBadges     = AchievementsBadges;
