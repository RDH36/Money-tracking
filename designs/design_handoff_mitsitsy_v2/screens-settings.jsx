/* global React */
const T = window.MTS_TOKENS;
const { Icon, Chip, Card } = window.MTS_UI;

// ────────────────────────────────────────────────────────────
//  Shared header & row primitives for Settings
// ────────────────────────────────────────────────────────────
const SettingsHeader = ({ title, subtitle, back = true }) => (
  <div style={{ padding: '64px 20px 18px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {back && (
        <div style={{
          width: 36, height: 36, borderRadius: 18, background: T.bgSurface,
          border: `1px solid ${T.hairline}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="chevBack" size={18} color={T.ink} />
        </div>
      )}
      <div>
        {subtitle && (
          <div style={{
            fontFamily: T.fontUI, fontSize: 10, fontWeight: 600, letterSpacing: 1.5,
            textTransform: 'uppercase', color: T.inkSubtle, marginBottom: 2,
          }}>{subtitle}</div>
        )}
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 28, color: T.ink, letterSpacing: -0.6, lineHeight: 1,
        }}>{title}</div>
      </div>
    </div>
  </div>
);

const SectionLabel = ({ children, action }) => (
  <div style={{
    display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
    padding: '0 6px 8px', marginTop: 14,
  }}>
    <div style={{
      fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 1.6,
      textTransform: 'uppercase', color: T.inkSubtle,
    }}>{children}</div>
    {action}
  </div>
);

const Row = ({ icon, iconColor, iconBg, label, sublabel, value, right, isLast, danger = false, badge = false }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
    borderBottom: isLast ? 'none' : `1px solid ${T.hairline}`,
  }}>
    {icon && (
      <div style={{
        width: 32, height: 32, borderRadius: 9,
        background: iconBg || `${iconColor}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon name={icon} size={16} color={iconColor || T.ink} strokeWidth={1.9} />
      </div>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: T.fontUI, fontSize: 14, fontWeight: 600,
        color: danger ? T.bad : T.ink, lineHeight: 1.2,
      }}>
        {label}
        {badge && (
          <div style={{ width: 7, height: 7, borderRadius: 4, background: T.bad }} />
        )}
      </div>
      {sublabel && (
        <div style={{
          fontFamily: T.fontUI, fontSize: 11, fontWeight: 500, color: T.inkSubtle,
          marginTop: 2, lineHeight: 1.3,
        }}>{sublabel}</div>
      )}
    </div>
    {value && (
      <div style={{
        fontFamily: T.fontUI, fontSize: 12, fontWeight: 600, color: T.inkMuted,
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
    )}
    {right !== undefined ? right : (
      !danger && <Icon name="chev" size={14} color="#C7C7CC" strokeWidth={1.8} />
    )}
  </div>
);

const Toggle = ({ on }) => (
  <div style={{
    width: 40, height: 24, borderRadius: 12,
    background: on ? T.brand : 'rgba(15,19,17,0.14)',
    position: 'relative', transition: 'background .2s',
    flexShrink: 0,
  }}>
    <div style={{
      position: 'absolute', top: 2, left: on ? 18 : 2,
      width: 20, height: 20, borderRadius: 10, background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
      transition: 'left .2s',
    }} />
  </div>
);

const RadioCircle = ({ on }) => (
  <div style={{
    width: 20, height: 20, borderRadius: 10,
    border: `1.5px solid ${on ? T.brand : T.hairlineStrong}`,
    background: on ? T.brand : 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }}>
    {on && <div style={{ width: 8, height: 8, borderRadius: 4, background: '#fff' }} />}
  </div>
);

// ────────────────────────────────────────────────────────────
//  01 — Settings hub
// ────────────────────────────────────────────────────────────
const Settings = () => {
  return (
    <div style={{ background: T.bgBase, minHeight: '100%', paddingBottom: 110 }}>
      <div style={{ padding: '64px 20px 14px' }}>
        <div style={{
          fontFamily: T.fontUI, fontSize: 10, fontWeight: 600, letterSpacing: 1.5,
          textTransform: 'uppercase', color: T.inkSubtle, marginBottom: 4,
        }}>Compte · Hery</div>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 36, color: T.ink, letterSpacing: -1, lineHeight: 1,
        }}>Réglages</div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* Profile card */}
        <Card style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 26,
            background: `linear-gradient(135deg, ${T.brand}, ${T.brandDeep})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: T.fontDisplay, fontSize: 22, color: T.inkOnDark, letterSpacing: -0.5,
          }}>HR</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.fontUI, fontSize: 15, fontWeight: 700, color: T.ink }}>
              Hery Razafimahatratra
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Chip tone="brand">Pro · 12 mois</Chip>
              <span style={{ fontFamily: T.fontUI, fontSize: 11, color: T.inkSubtle }}>
                MGA · Tana
              </span>
            </div>
          </div>
        </Card>

        <SectionLabel>Préférences</SectionLabel>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Row icon="spark"     iconColor="#EF4444" label="Quoi de neuf"          badge sublabel="2 nouvelles fonctions" />
          <Row icon="bank"      iconColor="#3B82F6" label="Comptes"                value="3" />
          <Row icon="cart"      iconColor="#8B5CF6" label="Catégories & budgets"   value="9 actifs" />
          <Row icon="settings"  iconColor="#EC4899" label="Apparence"              value="Sage · Auto" />
          <Row icon="info"      iconColor="#10B981" label="Langue"                 value="Français" />
          <Row icon="bell"      iconColor="#F59E0B" label="Notifications"          value="Quotidien" />
          <Row icon="eye"       iconColor="#6366F1" label="Confidentialité"        value="Visible" />
          <Row icon="receipt"   iconColor="#14B8A6" label="Avis & feedback"        isLast />
        </Card>

        <SectionLabel>Données de jeu</SectionLabel>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Row icon="trophy" iconColor={T.warn} label="Recalculer mes XP" sublabel="1 240 XP · Niveau 8" isLast />
        </Card>

        <SectionLabel>À propos</SectionLabel>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Row icon="info" iconColor={T.inkSubtle} iconBg="rgba(15,19,17,0.06)" label="Mitsitsy" sublabel="Version 2.4.0 · Build 412" right={null} />
          <Row icon="receipt" iconColor={T.inkSubtle} iconBg="rgba(15,19,17,0.06)" label="Conditions d'utilisation" />
          <Row icon="receipt" iconColor={T.inkSubtle} iconBg="rgba(15,19,17,0.06)" label="Politique de confidentialité" isLast />
        </Card>

        <SectionLabel>Zone sensible</SectionLabel>
        <Card style={{ padding: 0, overflow: 'hidden', borderColor: `${T.bad}25` }}>
          <Row icon="trash" iconColor={T.bad} label="Réinitialiser l'application" sublabel="Supprime toutes les données" danger isLast right={<Icon name="chev" size={14} color={T.bad} strokeWidth={1.8} />} />
        </Card>

        <div style={{
          marginTop: 18, textAlign: 'center',
          fontFamily: T.fontDisplay, fontStyle: 'italic',
          fontSize: 14, color: T.inkSubtle, letterSpacing: 0.2,
        }}>
          Mitsitsy · épargner avec intention
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//  02 — Comptes
// ────────────────────────────────────────────────────────────
const SettingsAccounts = () => {
  const accounts = [
    { name: 'Banque BOA',      type: 'bank',   balance: 845000,  icon: 'bank', color: '#3B82F6', last: 'il y a 2h' },
    { name: 'Espèces',         type: 'cash',   balance: 124500,  icon: 'cash', color: '#16A371', last: 'aujourd\'hui' },
    { name: 'Mobile Money',    type: 'wallet', balance:  67000,  icon: 'wallet', color: '#7B5EA8', last: 'hier' },
  ];
  const total = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div style={{ background: T.bgBase, minHeight: '100%', paddingBottom: 110 }}>
      <SettingsHeader title="Comptes" subtitle="Réglages" />
      <div style={{ padding: '0 16px' }}>
        {/* Total card */}
        <Card dark style={{ padding: 22, marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -40, bottom: -40, width: 140, height: 140,
                        borderRadius: 70, background: 'rgba(14,140,130,0.15)' }} />
          <div style={{
            fontFamily: T.fontUI, fontSize: 10, fontWeight: 600, letterSpacing: 1.5,
            textTransform: 'uppercase', color: T.inkOnDarkM, marginBottom: 8,
          }}>Patrimoine consolidé · 3 comptes</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{
              fontFamily: T.fontDisplay, fontSize: 38, color: T.inkOnDark, letterSpacing: -1,
              fontVariantNumeric: 'tabular-nums', lineHeight: 1,
            }}>{new Intl.NumberFormat('fr-FR').format(total)}</span>
            <span style={{ fontFamily: T.fontUI, fontSize: 14, color: T.inkOnDarkM }}>Ar</span>
          </div>
        </Card>

        <SectionLabel action={
          <span style={{ fontFamily: T.fontUI, fontSize: 11, fontWeight: 600, color: T.brand }}>
            + Ajouter
          </span>
        }>Mes comptes</SectionLabel>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {accounts.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px',
              borderBottom: i === accounts.length - 1 ? 'none' : `1px solid ${T.hairline}`,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 11,
                background: `${a.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={a.icon} size={17} color={a.color} strokeWidth={1.9} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.fontUI, fontSize: 14, fontWeight: 700, color: T.ink }}>
                  {a.name}
                </div>
                <div style={{ fontFamily: T.fontUI, fontSize: 11, color: T.inkSubtle, marginTop: 2 }}>
                  Maj {a.last}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: T.fontUI, fontSize: 14, fontWeight: 700, color: T.ink,
                  fontVariantNumeric: 'tabular-nums',
                }}>{new Intl.NumberFormat('fr-FR').format(a.balance)} <span style={{ fontSize: 10, color: T.inkSubtle, fontWeight: 500 }}>Ar</span></div>
                <div style={{ marginTop: 3 }}>
                  <Icon name="chev" size={13} color={T.inkSubtle} strokeWidth={1.8} />
                </div>
              </div>
            </div>
          ))}
        </Card>

        <div style={{
          marginTop: 14, padding: '14px 16px', borderRadius: 14,
          background: T.brandTint, border: `1px solid ${T.brand}25`,
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <Icon name="info" size={16} color={T.brand} strokeWidth={1.9} />
          <div style={{ flex: 1, fontFamily: T.fontUI, fontSize: 12, color: T.brandDeep, lineHeight: 1.45 }}>
            <strong>Astuce.</strong> Tu peux fixer un solde initial différent à la création — utile pour aligner tes vrais comptes.
          </div>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//  03 — Catégories & budgets
// ────────────────────────────────────────────────────────────
const SettingsCategories = () => {
  const base = [
    { name: 'Restaurants', icon: 'fork',    color: '#C8442C', budget: 120000 },
    { name: 'Courses',     icon: 'cart',    color: '#0E8C82', budget: 250000 },
    { name: 'Transport',   icon: 'car',     color: '#C8851A', budget: 100000 },
    { name: 'Maison',      icon: 'home2',   color: '#3D7BB6', budget: 150000 },
    { name: 'Santé',       icon: 'leaf',    color: '#16A371', budget: null   },
  ];
  const custom = [
    { name: 'Loisirs',     icon: 'sparkle', color: '#7B5EA8', budget: 60000 },
    { name: 'Shopping',    icon: 'bag',     color: '#9C3F5B', budget: null  },
  ];

  const fmt = b => b ? `${new Intl.NumberFormat('fr-FR').format(b)} Ar /mois` : 'Illimité';

  const renderCat = (cat, i, last) => (
    <div key={i} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
      borderBottom: last ? 'none' : `1px solid ${T.hairline}`,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: `${cat.color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={cat.icon} size={16} color={cat.color} strokeWidth={1.9} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: T.fontUI, fontSize: 14, fontWeight: 700, color: T.ink }}>
          {cat.name}
        </div>
      </div>
      <div style={{
        fontFamily: T.fontUI, fontSize: 12, fontWeight: 500,
        color: cat.budget ? T.inkMuted : T.inkSubtle,
        fontVariantNumeric: 'tabular-nums', fontStyle: cat.budget ? 'normal' : 'italic',
      }}>{fmt(cat.budget)}</div>
      <div style={{ marginLeft: 8 }}>
        <Icon name="chev" size={13} color="#C7C7CC" strokeWidth={1.8} />
      </div>
    </div>
  );

  return (
    <div style={{ background: T.bgBase, minHeight: '100%', paddingBottom: 110 }}>
      <SettingsHeader title="Catégories & budgets" subtitle="Réglages" />
      <div style={{ padding: '0 16px' }}>
        {/* Info banner */}
        <div style={{
          padding: '12px 14px', borderRadius: 12,
          background: T.bgRaised, display: 'flex', gap: 10, alignItems: 'flex-start',
          marginBottom: 6,
        }}>
          <Icon name="info" size={15} color={T.brand} strokeWidth={1.9} />
          <div style={{
            flex: 1, fontFamily: T.fontUI, fontSize: 12, color: T.inkMuted, lineHeight: 1.45,
          }}>
            Les budgets affichés concernent <strong style={{ color: T.ink }}>avril 2026</strong>.
            Tape sur une catégorie pour ajuster sa limite et ses seuils d'alerte.
          </div>
        </div>

        <SectionLabel>Catégories de base</SectionLabel>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {base.map((c, i) => renderCat(c, i, i === base.length - 1))}
        </Card>

        <SectionLabel>Catégories personnalisées · 2 / 6</SectionLabel>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {custom.map((c, i) => renderCat(c, i, false))}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              border: `1.5px dashed ${T.brand}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="plus" size={16} color={T.brand} strokeWidth={2.2} />
            </div>
            <div style={{ fontFamily: T.fontUI, fontSize: 14, fontWeight: 700, color: T.brand }}>
              Nouvelle catégorie
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//  04 — Apparence
// ────────────────────────────────────────────────────────────
const SettingsAppearance = () => {
  const themes = [
    { id: 'sage',    name: 'Sage',     swatch: '#0E8C82', active: true  },
    { id: 'indigo',  name: 'Indigo',   swatch: '#3F4B9C', active: false },
    { id: 'olive',   name: 'Olive',    swatch: '#5C6B2D', active: false },
    { id: 'rose',    name: 'Rose',     swatch: '#9C3F5B', active: false },
  ];
  const modes = [
    { id: 'light', label: 'Clair',  active: false, icon: '☀' },
    { id: 'auto',  label: 'Auto',   active: true,  icon: '◐' },
    { id: 'dark',  label: 'Sombre', active: false, icon: '☾' },
  ];
  const currencies = [
    { code: 'MGA', name: 'Ariary', flag: '🇲🇬', active: true  },
    { code: 'EUR', name: 'Euro',   flag: '🇪🇺', active: false },
    { code: 'USD', name: 'Dollar', flag: '🇺🇸', active: false },
  ];

  return (
    <div style={{ background: T.bgBase, minHeight: '100%', paddingBottom: 110 }}>
      <SettingsHeader title="Apparence" subtitle="Réglages" />
      <div style={{ padding: '0 16px' }}>

        <SectionLabel>Thème</SectionLabel>
        <Card style={{ padding: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {themes.map(t => (
              <div key={t.id} style={{
                padding: '12px 6px', borderRadius: 12,
                background: t.active ? T.bgRaised : 'transparent',
                border: t.active ? `1.5px solid ${t.swatch}` : `1px solid ${T.hairline}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 15,
                  background: `linear-gradient(135deg, ${t.swatch}, ${t.swatch}cc)`,
                  boxShadow: t.active ? `0 0 0 3px ${t.swatch}25` : 'none',
                }} />
                <span style={{
                  fontFamily: T.fontUI, fontSize: 11, fontWeight: 700,
                  color: t.active ? t.swatch : T.inkMuted,
                }}>{t.name}</span>
              </div>
            ))}
          </div>
        </Card>

        <SectionLabel>Mode</SectionLabel>
        <Card style={{ padding: 4 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {modes.map(m => (
              <div key={m.id} style={{
                flex: 1, padding: '10px 8px', borderRadius: 9,
                background: m.active ? T.ink : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <span style={{
                  fontSize: 14, color: m.active ? T.inkOnDark : T.inkSubtle,
                }}>{m.icon}</span>
                <span style={{
                  fontFamily: T.fontUI, fontSize: 12, fontWeight: 700,
                  color: m.active ? T.inkOnDark : T.inkMuted, letterSpacing: 0.2,
                }}>{m.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <SectionLabel>Devise</SectionLabel>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {currencies.map((c, i) => (
            <div key={c.code} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px',
              borderBottom: i === currencies.length - 1 ? 'none' : `1px solid ${T.hairline}`,
            }}>
              <div style={{ fontSize: 22 }}>{c.flag}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.fontUI, fontSize: 14, fontWeight: 700, color: T.ink }}>
                  {c.name}
                </div>
                <div style={{
                  fontFamily: T.fontUI, fontSize: 11, fontWeight: 600,
                  letterSpacing: 1, color: T.inkSubtle, marginTop: 2,
                }}>{c.code}</div>
              </div>
              <RadioCircle on={c.active} />
            </div>
          ))}
        </Card>

        <SectionLabel>Astuces & conseils</SectionLabel>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Row icon="spark" iconColor={T.brand} label="Afficher les astuces"
               sublabel="Mini-conseils sur la gestion de budget"
               right={<Toggle on={true} />} isLast />
        </Card>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//  05 — Langue
// ────────────────────────────────────────────────────────────
const SettingsLanguage = () => {
  const langs = [
    { code: 'fr', name: 'Français',     native: 'Français',     flag: '🇫🇷', active: true  },
    { code: 'mg', name: 'Malgache',     native: 'Malagasy',     flag: '🇲🇬', active: false },
    { code: 'en', name: 'Anglais',      native: 'English',      flag: '🇬🇧', active: false },
  ];
  return (
    <div style={{ background: T.bgBase, minHeight: '100%', paddingBottom: 110 }}>
      <SettingsHeader title="Langue" subtitle="Réglages" />
      <div style={{ padding: '0 16px' }}>
        <SectionLabel>Langue de l'app</SectionLabel>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {langs.map((l, i) => (
            <div key={l.code} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '15px 14px',
              borderBottom: i === langs.length - 1 ? 'none' : `1px solid ${T.hairline}`,
            }}>
              <div style={{ fontSize: 24 }}>{l.flag}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.fontUI, fontSize: 14, fontWeight: 700, color: T.ink }}>
                  {l.name}
                </div>
                <div style={{
                  fontFamily: T.fontUI, fontSize: 12, color: T.inkSubtle, marginTop: 2, fontStyle: 'italic',
                }}>{l.native}</div>
              </div>
              {l.active && (
                <div style={{
                  width: 24, height: 24, borderRadius: 12, background: T.brand,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="check" size={13} color={T.inkOnDark} strokeWidth={2.6} />
                </div>
              )}
            </div>
          ))}
        </Card>

        <div style={{
          marginTop: 14, padding: '14px 16px', borderRadius: 14,
          background: T.bgRaised, display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <Icon name="info" size={15} color={T.inkSubtle} strokeWidth={1.9} />
          <div style={{
            flex: 1, fontFamily: T.fontUI, fontSize: 12, color: T.inkMuted, lineHeight: 1.45,
          }}>
            Le changement de langue s'applique immédiatement. Les noms de catégories par défaut sont aussi traduits.
          </div>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//  06 — Notifications
// ────────────────────────────────────────────────────────────
const SettingsNotifications = () => {
  const freqs = [
    { id: 'off',    label: 'Désactivés',     desc: 'Aucun rappel',                            active: false },
    { id: 'daily',  label: 'Quotidien',      desc: 'Tous les jours à 20:00',                  active: true  },
    { id: 'weekly', label: 'Hebdomadaire',   desc: 'Chaque dimanche soir',                    active: false },
    { id: 'smart',  label: 'Intelligent',    desc: 'Quand tu oublies de saisir',              active: false },
  ];
  return (
    <div style={{ background: T.bgBase, minHeight: '100%', paddingBottom: 110 }}>
      <SettingsHeader title="Notifications" subtitle="Réglages" />
      <div style={{ padding: '0 16px' }}>

        {/* Hero illustration */}
        <Card style={{ padding: '20px 18px', marginBottom: 6, position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', right: -20, top: -20, width: 110, height: 110,
            borderRadius: 55, background: `${T.warn}10`,
          }} />
          <div style={{
            width: 44, height: 44, borderRadius: 14, background: `${T.warn}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
          }}>
            <Icon name="bell" size={22} color={T.warn} strokeWidth={1.9} />
          </div>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 22, color: T.ink, letterSpacing: -0.5, lineHeight: 1.15,
          }}>Reste sur ta lancée</div>
          <div style={{
            fontFamily: T.fontUI, fontSize: 12, color: T.inkMuted, marginTop: 6, lineHeight: 1.45,
          }}>
            Choisis la fréquence de tes rappels pour saisir tes dépenses régulièrement.
          </div>
        </Card>

        <SectionLabel>Rappels de saisie</SectionLabel>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {freqs.map((f, i) => (
            <div key={f.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px',
              borderBottom: i === freqs.length - 1 ? 'none' : `1px solid ${T.hairline}`,
              background: f.active ? T.brandTint : 'transparent',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: T.fontUI, fontSize: 14, fontWeight: 700,
                  color: f.active ? T.brandDeep : T.ink,
                }}>{f.label}</div>
                <div style={{
                  fontFamily: T.fontUI, fontSize: 12, color: T.inkSubtle, marginTop: 3,
                }}>{f.desc}</div>
              </div>
              <RadioCircle on={f.active} />
            </div>
          ))}
        </Card>

        <SectionLabel>Alertes budget</SectionLabel>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Row icon="warn" iconColor={T.warn} label="Seuil 50%" sublabel="Discret · à mi-chemin du budget"
               right={<Toggle on={false} />} />
          <Row icon="warn" iconColor={T.warn} label="Seuil 80%" sublabel="Avertissement · attention au dépassement"
               right={<Toggle on={true} />} />
          <Row icon="warn" iconColor={T.bad}  label="Limite 100%" sublabel="Alerte · budget dépassé"
               right={<Toggle on={true} />} isLast />
        </Card>

        <div style={{
          marginTop: 14, padding: '14px 16px', borderRadius: 14,
          background: T.warnSoft, border: `1px solid ${T.warn}25`,
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <Icon name="info" size={15} color={T.warn} strokeWidth={1.9} />
          <div style={{ flex: 1, fontFamily: T.fontUI, fontSize: 12, color: '#7A4F0E', lineHeight: 1.45 }}>
            Tu peux aussi régler des seuils <strong>par catégorie</strong> depuis l'écran d'une catégorie.
          </div>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//  07 — Confidentialité
// ────────────────────────────────────────────────────────────
const SettingsPrivacy = () => {
  return (
    <div style={{ background: T.bgBase, minHeight: '100%', paddingBottom: 110 }}>
      <SettingsHeader title="Confidentialité" subtitle="Réglages" />
      <div style={{ padding: '0 16px' }}>

        {/* Visual demo of hide-on-screen */}
        <Card style={{ padding: 20, marginBottom: 6 }}>
          <div style={{
            fontFamily: T.fontUI, fontSize: 10, fontWeight: 600, letterSpacing: 1.5,
            textTransform: 'uppercase', color: T.inkSubtle, marginBottom: 8,
          }}>Aperçu · solde du jour</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{
              fontFamily: T.fontDisplay, fontSize: 38, color: T.ink, letterSpacing: -1,
              lineHeight: 1, fontVariantNumeric: 'tabular-nums', filter: 'blur(8px)',
              userSelect: 'none',
            }}>1 036 500</span>
            <span style={{
              fontFamily: T.fontUI, fontSize: 14, color: T.inkSubtle,
              filter: 'blur(8px)',
            }}>Ar</span>
          </div>
          <div style={{
            marginTop: 14, padding: '8px 12px', borderRadius: 10,
            background: T.bgRaised,
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            <Icon name="eyeOff" size={14} color={T.inkMuted} strokeWidth={1.9} />
            <span style={{ fontFamily: T.fontUI, fontSize: 12, fontWeight: 600, color: T.inkMuted }}>
              Soldes masqués · tape pour afficher
            </span>
          </div>
        </Card>

        <SectionLabel>Affichage des soldes</SectionLabel>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Row icon="eyeOff" iconColor="#6366F1" label="Masquer les soldes par défaut"
               sublabel="Floute les montants au lancement de l'app"
               right={<Toggle on={true} />} />
          <Row icon="eye" iconColor="#6366F1" label="Afficher dans les widgets"
               sublabel="Solde visible sur l'écran d'accueil"
               right={<Toggle on={false} />} isLast />
        </Card>

        <SectionLabel>Sécurité</SectionLabel>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Row icon="settings" iconColor={T.ink} iconBg="rgba(15,19,17,0.08)" label="Verrouillage Face ID"
               sublabel="À chaque ouverture"
               right={<Toggle on={true} />} />
          <Row icon="settings" iconColor={T.ink} iconBg="rgba(15,19,17,0.08)" label="Délai avant verrouillage"
               value="Immédiat" />
          <Row icon="trash" iconColor={T.bad} label="Effacer mes données analytiques"
               sublabel="Supprime l'historique d'usage envoyé" isLast />
        </Card>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//  08 — Avis & feedback
// ────────────────────────────────────────────────────────────
const SettingsFeedback = () => {
  return (
    <div style={{ background: T.bgBase, minHeight: '100%', paddingBottom: 110 }}>
      <SettingsHeader title="Avis & feedback" subtitle="Réglages" />
      <div style={{ padding: '0 16px' }}>

        {/* Pull quote */}
        <Card style={{ padding: '22px 20px', marginBottom: 6 }}>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 26, color: T.ink, lineHeight: 1.25,
            letterSpacing: -0.5, fontStyle: 'italic',
          }}>
            "Mitsitsy m'aide à <span style={{ background: `linear-gradient(transparent 60%, ${T.brand}30 60%)` }}>tenir mon budget</span> sans y penser tous les jours."
          </div>
          <div style={{
            marginTop: 12, fontFamily: T.fontUI, fontSize: 12, color: T.inkSubtle, fontWeight: 600,
          }}>— Voahangy R., utilisatrice depuis 2024</div>
        </Card>

        <SectionLabel>Donne ton avis</SectionLabel>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Row icon="trophy" iconColor={T.warn} label="Noter sur l'App Store"
               sublabel="Aide-nous à grandir · 30 secondes" />
          <Row icon="receipt" iconColor={T.brand} label="Envoyer un message à l'équipe"
               sublabel="hello@mitsitsy.app" />
          <Row icon="bell" iconColor="#7B5EA8" label="Suggérer une fonctionnalité"
               sublabel="Vote ou propose ce que tu aimerais voir" isLast />
        </Card>

        <SectionLabel>Communauté</SectionLabel>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Row icon="info" iconColor="#3B82F6" label="Centre d'aide"          value="40+ articles" />
          <Row icon="spark" iconColor="#EC4899" label="Suivre sur Instagram" value="@mitsitsy" />
          <Row icon="receipt" iconColor="#16A371" label="Roadmap publique"   isLast />
        </Card>

        <div style={{
          marginTop: 18, padding: '20px 16px', borderRadius: 16,
          background: T.bgInk,
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 18, color: T.inkOnDark, letterSpacing: -0.3, fontStyle: 'italic',
          }}>Merci d'être là.</div>
          <div style={{
            fontFamily: T.fontUI, fontSize: 11, color: T.inkOnDarkM, marginTop: 6,
          }}>
            Mitsitsy est construit à Antananarivo par 3 personnes.
          </div>
        </div>
      </div>
    </div>
  );
};

window.MTS_Settings           = Settings;
window.MTS_SettingsAccounts   = SettingsAccounts;
window.MTS_SettingsCategories = SettingsCategories;
window.MTS_SettingsAppearance = SettingsAppearance;
window.MTS_SettingsLanguage   = SettingsLanguage;
window.MTS_SettingsNotifications = SettingsNotifications;
window.MTS_SettingsPrivacy    = SettingsPrivacy;
window.MTS_SettingsFeedback   = SettingsFeedback;
