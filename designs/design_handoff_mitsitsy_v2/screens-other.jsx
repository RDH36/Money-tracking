/* global React */
const T = window.MTS_TOKENS;
const { Icon, Money, Chip, Progress, SectionHead, Card } = window.MTS_UI;

// ────────────────────────────────────────────────────────────
//  Budget Category Detail — refined
// ────────────────────────────────────────────────────────────
const CategoryDetail = () => {
  const cat = { name: 'Restaurants', icon: 'fork', color: '#C8442C' };
  const spent = 138000;
  const limit = 120000;
  const pct = Math.round((spent / limit) * 100);
  const txs = [
    { day: 'Aujourd\'hui',     items: [
      { name: 'Le Soleil',     note: 'Déjeuner', amount: -28000, time: '12:45' },
      { name: 'Café Madagascar', note: '',         amount: -7500,  time: '08:30' },
    ]},
    { day: 'Hier',           items: [
      { name: 'Chez Sucett\'s', note: 'Avec Hery', amount: -42000, time: '19:20' },
      { name: 'Boulangerie',   note: '',         amount: -12500, time: '07:15' },
    ]},
    { day: 'Lundi 26 avril', items: [
      { name: 'Pizza Inn',     note: '',         amount: -34000, time: '20:00' },
      { name: 'Café',          note: 'Réunion',  amount: -14000, time: '15:30' },
    ]},
  ];

  return (
    <div style={{ background: T.bgBase, minHeight: '100%', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '64px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 36, height: 36, borderRadius: 18, background: T.bgSurface,
                      border: `1px solid ${T.hairline}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevBack" size={18} color={T.ink} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9,
                        background: `${cat.color}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={cat.icon} size={16} color={cat.color} strokeWidth={1.9} />
          </div>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 22, color: T.ink, letterSpacing: -0.5 }}>
            {cat.name}
          </div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 18, background: T.bgSurface,
                      border: `1px solid ${T.hairline}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="edit" size={16} color={T.inkMuted} />
        </div>
      </div>

      <div style={{ padding: '6px 20px' }}>
        {/* Hero budget card */}
        <Card style={{ padding: 22, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -50, top: -50, width: 160, height: 160,
                        borderRadius: 80, background: `${cat.color}08` }} />
          <div style={{ fontFamily: T.fontUI, fontSize: 10, fontWeight: 600, letterSpacing: 1.5,
                        textTransform: 'uppercase', color: T.inkSubtle, marginBottom: 8 }}>
            Avril 2026 · dépensé
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: T.fontDisplay, fontSize: 38, color: T.ink, letterSpacing: -1,
                           fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {new Intl.NumberFormat('fr-FR').format(spent)}
            </span>
            <span style={{ fontFamily: T.fontUI, fontSize: 14, color: T.inkSubtle, fontWeight: 500 }}>Ar</span>
            <span style={{ fontFamily: T.fontUI, fontSize: 12, color: T.inkSubtle, marginLeft: 'auto',
                           fontVariantNumeric: 'tabular-nums' }}>
              / {new Intl.NumberFormat('fr-FR').format(limit)} Ar
            </span>
          </div>

          <div style={{ marginTop: 16 }}>
            <Progress value={Math.min(pct, 100)} height={8} color={T.bad} thresholds={[50, 80]} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="time" size={12} color={T.inkSubtle} />
                <span style={{ fontFamily: T.fontUI, fontSize: 11, color: T.inkSubtle, fontWeight: 500 }}>
                  Reset dans 2 j 14h
                </span>
              </div>
              <Chip tone="bad">+ 18 000 Ar dépassé · {pct}%</Chip>
            </div>
          </div>

          {/* Threshold ticks legend */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.hairline}`,
                        display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.fontUI, fontSize: 10, fontWeight: 600, letterSpacing: 0.5,
                            textTransform: 'uppercase', color: T.inkSubtle }}>Seuil 1 · 50%</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: T.good }} />
                <span style={{ fontFamily: T.fontUI, fontSize: 12, color: T.ink, fontWeight: 600 }}>Atteint</span>
              </div>
            </div>
            <div style={{ flex: 1, paddingLeft: 14, borderLeft: `1px solid ${T.hairline}` }}>
              <div style={{ fontFamily: T.fontUI, fontSize: 10, fontWeight: 600, letterSpacing: 0.5,
                            textTransform: 'uppercase', color: T.inkSubtle }}>Seuil 2 · 80%</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: T.warn }} />
                <span style={{ fontFamily: T.fontUI, fontSize: 12, color: T.ink, fontWeight: 600 }}>Alerte</span>
              </div>
            </div>
            <div style={{ flex: 1, paddingLeft: 14, borderLeft: `1px solid ${T.hairline}` }}>
              <div style={{ fontFamily: T.fontUI, fontSize: 10, fontWeight: 600, letterSpacing: 0.5,
                            textTransform: 'uppercase', color: T.inkSubtle }}>Limite · 100%</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: T.bad }} />
                <span style={{ fontFamily: T.fontUI, fontSize: 12, color: T.ink, fontWeight: 600 }}>Dépassée</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Month switcher */}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: T.bgSurface, border: `1px solid ${T.hairline}`,
                      borderRadius: 12, padding: '10px 14px' }}>
          <Icon name="chevBack" size={16} color={T.inkMuted} />
          <span style={{ fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, color: T.ink, letterSpacing: 0.2 }}>
            Avril 2026
          </span>
          <Icon name="chev" size={16} color={T.inkSubtle} />
        </div>

        {/* Transactions grouped by day */}
        <div style={{ marginTop: 22 }}>
          {txs.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
                            textTransform: 'uppercase', color: T.inkSubtle, marginBottom: 8, paddingLeft: 4 }}>
                {group.day}
              </div>
              <Card style={{ padding: 4 }}>
                {group.items.map((tx, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px',
                    borderBottom: i === group.items.length - 1 ? 'none' : `1px solid ${T.hairline}`,
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9,
                                  background: `${cat.color}15`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={cat.icon} size={15} color={cat.color} strokeWidth={1.9} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: T.fontUI, fontSize: 13, fontWeight: 600, color: T.ink }}>
                        {tx.name}
                      </div>
                      <div style={{ fontFamily: T.fontUI, fontSize: 11, color: T.inkSubtle, marginTop: 1 }}>
                        {tx.note ? `${tx.note} · ` : ''}{tx.time}
                      </div>
                    </div>
                    <Money value={tx.amount} size="md" weight={700} color={T.bad} />
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//  Add transaction
// ────────────────────────────────────────────────────────────
const AddTransaction = () => {
  const cats = [
    { name: 'Restaurants', icon: 'fork', color: '#C8442C', active: true },
    { name: 'Courses',     icon: 'cart', color: '#0E8C82' },
    { name: 'Transport',   icon: 'car',  color: '#C8851A' },
    { name: 'Loisirs',     icon: 'sparkle', color: '#7B5EA8' },
    { name: 'Maison',      icon: 'home2', color: '#3D7BB6' },
    { name: 'Santé',       icon: 'leaf', color: '#16A371' },
    { name: 'Shopping',    icon: 'bag',  color: '#9C3F5B' },
    { name: 'Plus',        icon: 'plus', color: '#5A6470', isMore: true },
  ];
  return (
    <div style={{ background: T.bgBase, minHeight: '100%', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '64px 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: 18, background: T.bgSurface,
                      border: `1px solid ${T.hairline}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="x" size={16} color={T.ink} strokeWidth={2} />
        </div>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 22, color: T.ink, letterSpacing: -0.5 }}>
          Nouvelle transaction
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: '12px 20px' }}>
        {/* Mode toggle */}
        <div style={{ background: T.bgRaised, borderRadius: 12, padding: 4, display: 'flex' }}>
          <div style={{ flex: 1, padding: '10px 12px', borderRadius: 8, background: T.ink,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name="receipt" size={14} color={T.inkOnDark} strokeWidth={2} />
            <span style={{ fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, color: T.inkOnDark, letterSpacing: 0.2 }}>
              Transaction
            </span>
          </div>
          <div style={{ flex: 1, padding: '10px 12px', borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name="swap" size={14} color={T.inkSubtle} strokeWidth={2} />
            <span style={{ fontFamily: T.fontUI, fontSize: 12, fontWeight: 600, color: T.inkSubtle, letterSpacing: 0.2 }}>
              Transfert
            </span>
          </div>
        </div>

        {/* Type pills */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <div style={{ flex: 1, background: T.badSoft, padding: '12px',
                        border: `1px solid ${T.bad}30`, borderRadius: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name="arrowDown" size={14} color={T.bad} strokeWidth={2.4} />
            <span style={{ fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, color: T.bad, letterSpacing: 0.2 }}>
              Dépense
            </span>
          </div>
          <div style={{ flex: 1, background: T.bgRaised, padding: '12px', borderRadius: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name="arrowUp" size={14} color={T.inkSubtle} strokeWidth={2.4} />
            <span style={{ fontFamily: T.fontUI, fontSize: 12, fontWeight: 600, color: T.inkSubtle, letterSpacing: 0.2 }}>
              Revenu
            </span>
          </div>
        </div>

        {/* Amount */}
        <div style={{ marginTop: 28, marginBottom: 10, textAlign: 'center' }}>
          <div style={{ fontFamily: T.fontUI, fontSize: 10, fontWeight: 600, letterSpacing: 1.5,
                        textTransform: 'uppercase', color: T.inkSubtle, marginBottom: 6 }}>
            Montant · Ar
          </div>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 56, color: T.ink, letterSpacing: -2,
                        lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            42 000
          </div>
          <div style={{ marginTop: 10, height: 1, background: T.hairlineStrong, marginInline: 30 }} />
        </div>

        {/* Account */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
                        textTransform: 'uppercase', color: T.inkSubtle, marginBottom: 8 }}>
            Compte
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Card style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', gap: 10,
                           borderColor: T.brand, borderWidth: 1.5, borderStyle: 'solid',
                           background: T.brandTint }}>
              <Icon name="bank" size={16} color={T.brand} strokeWidth={1.9} />
              <span style={{ fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, color: T.brand }}>Banque</span>
            </Card>
            <Card style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="cash" size={16} color={T.inkSubtle} strokeWidth={1.9} />
              <span style={{ fontFamily: T.fontUI, fontSize: 12, fontWeight: 600, color: T.inkMuted }}>Espèces</span>
            </Card>
          </div>
        </div>

        {/* Categories */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div style={{ fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
                          textTransform: 'uppercase', color: T.inkSubtle }}>
              Catégorie · sélectionnée
            </div>
            <div style={{ fontFamily: T.fontUI, fontSize: 11, fontWeight: 600, color: T.brand,
                          display: 'flex', alignItems: 'center', gap: 4 }}>
              Voir toutes (24) <Icon name="chev" size={11} color={T.brand} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {cats.map((c, i) => {
              const active = c.active;
              const more = c.isMore;
              return (
                <Card key={i} style={{
                  padding: '10px 6px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 5,
                  background: active ? `${c.color}10` : T.bgSurface,
                  border: active ? `1.5px solid ${c.color}`
                          : more ? `1px dashed ${T.hairlineStrong}`
                          : `1px solid ${T.hairline}`,
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8,
                                background: more ? T.bgRaised : `${c.color}18`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={c.icon} size={14} color={c.color} strokeWidth={2} />
                  </div>
                  <div style={{ fontFamily: T.fontUI, fontSize: 10, fontWeight: 600,
                                color: active ? c.color : more ? T.inkMuted : T.ink,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                maxWidth: '100%', textAlign: 'center' }}>
                    {c.name}
                  </div>
                </Card>
              );
            })}
          </div>
          <div style={{ marginTop: 8, fontFamily: T.fontUI, fontSize: 11, color: T.inkSubtle,
                        textAlign: 'center', fontStyle: 'italic' }}>
            Tape sur une catégorie pour la sélectionner · « Voir toutes » ouvre la liste complète avec recherche
          </div>
        </div>

        {/* Threshold preview — the new feature, contextually shown */}
        <div style={{ marginTop: 14, background: T.warnSoft, border: `1px solid ${T.warn}30`,
                      borderRadius: 12, padding: '12px 14px',
                      display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: T.warn,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="warn" size={14} color="#fff" strokeWidth={2.4} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 2 }}>
              Cette dépense passe le seuil 80%
            </div>
            <div style={{ fontFamily: T.fontUI, fontSize: 11, color: T.inkMuted }}>
              138 000 / 120 000 Ar (115%)
            </div>
          </div>
        </div>

        {/* Save CTA */}
        <div style={{ marginTop: 20, background: T.ink, borderRadius: 14, padding: '16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: '0 6px 16px rgba(15,19,17,0.18)' }}>
          <span style={{ fontFamily: T.fontUI, fontSize: 14, fontWeight: 700, color: T.inkOnDark, letterSpacing: 0.3 }}>
            Enregistrer
          </span>
          <Icon name="chev" size={14} color={T.inkOnDark} strokeWidth={2.4} />
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//  Budgets list
// ────────────────────────────────────────────────────────────
const BudgetsList = () => {
  const items = [
    { name: 'Courses',     icon: 'cart', color: '#0E8C82', spent: 184000, limit: 250000 },
    { name: 'Transport',   icon: 'car',  color: '#C8851A', spent:  92000, limit: 100000 },
    { name: 'Restaurants', icon: 'fork', color: '#C8442C', spent: 138000, limit: 120000 },
    { name: 'Loisirs',     icon: 'sparkle', color: '#7B5EA8', spent: 24000, limit:  60000 },
    { name: 'Maison',      icon: 'home2', color: '#3D7BB6', spent:  85000, limit: 150000 },
    { name: 'Santé',       icon: 'leaf', color: '#16A371',  spent:  18000, limit:  null },
  ];

  const totalSpent = items.reduce((s, b) => s + b.spent, 0);
  const totalLimit = items.reduce((s, b) => s + (b.limit || 0), 0);
  const totalPct = Math.round((totalSpent / totalLimit) * 100);

  return (
    <div style={{ background: T.bgBase, minHeight: '100%', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '64px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: T.fontUI, fontSize: 11, fontWeight: 600, letterSpacing: 1.5,
                        textTransform: 'uppercase', color: T.inkSubtle, marginBottom: 2 }}>
            Avril 2026
          </div>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 28, color: T.ink, letterSpacing: -0.8, lineHeight: 1 }}>
            Budgets
          </div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 18, background: T.brandSoft,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="plus" size={18} color={T.brand} strokeWidth={2.2} />
        </div>
      </div>

      <div style={{ padding: '6px 20px' }}>
        {/* Summary */}
        <Card dark style={{ padding: 22, position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontFamily: T.fontUI, fontSize: 10, fontWeight: 600, letterSpacing: 1.5,
                        textTransform: 'uppercase', color: T.inkOnDarkM, marginBottom: 8 }}>
            Total dépensé · 6 budgets
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: T.fontDisplay, fontSize: 38, color: T.inkOnDark, letterSpacing: -1,
                           fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {new Intl.NumberFormat('fr-FR').format(totalSpent)}
            </span>
            <span style={{ fontFamily: T.fontUI, fontSize: 14, color: T.inkOnDarkM }}>Ar</span>
            <span style={{ fontFamily: T.fontUI, fontSize: 12, color: T.inkOnDarkM, marginLeft: 'auto',
                           fontVariantNumeric: 'tabular-nums' }}>
              / {new Intl.NumberFormat('fr-FR').format(totalLimit)} Ar
            </span>
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ height: 6, background: 'rgba(245,245,241,0.1)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(totalPct, 100)}%`, height: '100%',
                            background: T.brand, borderRadius: 999 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <Chip tone="onDark">1 dépassement · 1 alerte</Chip>
              <span style={{ fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, color: T.inkOnDark,
                             fontVariantNumeric: 'tabular-nums' }}>
                {totalPct}%
              </span>
            </div>
          </div>
        </Card>

        <div style={{ marginTop: 18 }}>
          <SectionHead overline="Par catégorie" title="Mes budgets" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((b, i) => {
              const pct = b.limit ? Math.round((b.spent / b.limit) * 100) : null;
              const over = pct !== null && pct > 100;
              const near = pct !== null && pct >= 80 && pct <= 100;
              const tone = over ? T.bad : near ? T.warn : pct !== null ? T.good : T.inkMuted;
              return (
                <Card key={i} style={{ padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11,
                                  background: `${b.color}15`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={b.icon} size={17} color={b.color} strokeWidth={1.9} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                        <span style={{ fontFamily: T.fontUI, fontSize: 14, fontWeight: 700, color: T.ink }}>
                          {b.name}
                        </span>
                        {pct !== null ? (
                          <Chip tone={over ? 'bad' : near ? 'warn' : 'good'}>{pct}%</Chip>
                        ) : (
                          <Chip tone="neutral">illimité</Chip>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6,
                                    fontFamily: T.fontUI, fontVariantNumeric: 'tabular-nums' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: tone }}>
                          {new Intl.NumberFormat('fr-FR').format(b.spent)} Ar
                        </span>
                        {b.limit && (
                          <span style={{ fontSize: 11, color: T.inkSubtle }}>
                            / {new Intl.NumberFormat('fr-FR').format(b.limit)}
                          </span>
                        )}
                      </div>
                      {pct !== null ? (
                        <Progress
                          value={Math.min(pct, 100)}
                          height={5}
                          color={tone}
                          thresholds={[50, 80]}
                        />
                      ) : (
                        <div style={{ fontFamily: T.fontUI, fontSize: 11, color: T.inkSubtle, fontStyle: 'italic' }}>
                          Pas de limite définie
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

window.MTS_CategoryDetail = CategoryDetail;
window.MTS_AddTransaction = AddTransaction;
window.MTS_BudgetsList = BudgetsList;
