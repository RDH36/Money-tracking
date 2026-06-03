/* global React */
const TC = window.MTS_TOKENS;
const UIC = window.MTS_UI;

// ────────────────────────────────────────────────────────────
//  Categories Bottom Sheet — quick picker over Add Transaction
// ────────────────────────────────────────────────────────────
const CategoriesSheet = () => {
  const { Icon, Card } = UIC;
  const T = TC;

  const cats = [
    { name: 'Restaurants', icon: 'fork',    color: '#C8442C', active: true },
    { name: 'Courses',     icon: 'cart',    color: '#0E8C82' },
    { name: 'Transport',   icon: 'car',     color: '#C8851A' },
    { name: 'Logement',    icon: 'home2',   color: '#3F4B9C' },
    { name: 'Loisirs',     icon: 'sparkle', color: '#7B5EA8' },
    { name: 'Santé',       icon: 'leaf',    color: '#16A371' },
    { name: 'Shopping',    icon: 'bag',     color: '#9C3F5B' },
    { name: 'Sport',       icon: 'flame',   color: '#C8442C' },
    { name: 'Voyages',     icon: 'target',  color: '#0E8C82' },
    { name: 'Cadeaux',     icon: 'trophy',  color: '#C8851A' },
    { name: 'Éducation',   icon: 'plan',    color: '#7B5EA8' },
    { name: 'Divers',      icon: 'info',    color: '#5A6470' },
  ];

  return (
    <div style={{ position: 'relative', background: T.bgBase, height: '100%', overflow: 'hidden' }}>
      {/* Dimmed Add Transaction screen behind */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.45, pointerEvents: 'none' }}>
        <window.MTS_AddTransaction />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,19,17,0.32)' }} />

      {/* Bottom sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: T.bgSurface,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        boxShadow: '0 -12px 32px rgba(15,19,17,0.18)',
        maxHeight: '78%', display: 'flex', flexDirection: 'column',
      }}>
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.hairlineStrong }} />
        </div>

        {/* Header */}
        <div style={{ padding: '8px 20px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
                          textTransform: 'uppercase', color: T.inkSubtle, marginBottom: 2 }}>
              Sélection rapide
            </div>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 20, color: T.ink, letterSpacing: -0.4 }}>
              Catégorie
            </div>
          </div>
          <div style={{ width: 30, height: 30, borderRadius: 15, background: T.bgRaised,
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={14} color={T.ink} strokeWidth={2.2} />
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 20px 6px' }}>
          <div style={{ background: T.bgRaised, borderRadius: 11, padding: '10px 12px',
                        display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="target" size={14} color={T.inkSubtle} strokeWidth={1.9} />
            <span style={{ flex: 1, fontFamily: T.fontUI, fontSize: 12, color: T.inkSubtle }}>
              Rechercher…
            </span>
            <span style={{ fontFamily: T.fontUI, fontSize: 10, color: T.inkSubtle }}>24</span>
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ padding: '4px 20px 8px', display: 'flex', gap: 6, overflowX: 'auto' }}>
          {[
            { label: 'Toutes', active: true },
            { label: 'Dépenses' },
            { label: 'Revenus' },
            { label: 'Récentes' },
          ].map((p, i) => (
            <div key={i} style={{
              padding: '5px 11px', borderRadius: 999,
              background: p.active ? T.ink : 'transparent',
              border: p.active ? 'none' : `1px solid ${T.hairlineStrong}`,
              fontFamily: T.fontUI, fontSize: 10, fontWeight: 600,
              color: p.active ? T.inkOnDark : T.inkMuted,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>{p.label}</div>
          ))}
        </div>

        {/* Grid of categories */}
        <div style={{ padding: '4px 20px 12px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {cats.map((c, i) => {
              const a = c.active;
              return (
                <div key={i} style={{
                  padding: '12px 6px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  background: a ? `${c.color}10` : T.bgRaised,
                  border: a ? `1.5px solid ${c.color}` : `1px solid transparent`,
                  borderRadius: 12,
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: `${c.color}20`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={c.icon} size={15} color={c.color} strokeWidth={2} />
                  </div>
                  <div style={{ fontFamily: T.fontUI, fontSize: 10, fontWeight: 600,
                                color: a ? c.color : T.ink, textAlign: 'center',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                maxWidth: '100%' }}>
                    {c.name}
                  </div>
                </div>
              );
            })}
            {/* Create new */}
            <div style={{
              padding: '12px 6px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              background: 'transparent',
              border: `1.5px dashed ${T.hairlineStrong}`,
              borderRadius: 12,
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: T.bgRaised,
                            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="plus" size={15} color={T.brand} strokeWidth={2.4} />
              </div>
              <div style={{ fontFamily: T.fontUI, fontSize: 10, fontWeight: 600,
                            color: T.brand, textAlign: 'center' }}>
                Créer
              </div>
            </div>
          </div>
        </div>

        {/* Confirm */}
        <div style={{ padding: '8px 20px 24px', borderTop: `1px solid ${T.hairline}` }}>
          <div style={{ background: T.ink, borderRadius: 12, padding: '14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, color: T.inkOnDark }}>
              Choisir Restaurants
            </span>
            <Icon name="check" size={14} color={T.inkOnDark} strokeWidth={2.6} />
          </div>
        </div>
      </div>
    </div>
  );
};

window.MTS_CategoriesSheet = CategoriesSheet;
