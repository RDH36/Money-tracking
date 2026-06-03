/* global React */
const TA = window.MTS_TOKENS;
const UIA = window.MTS_UI;

// ────────────────────────────────────────────────────────────
//  Activity + Budgets — UNIFIED page (matches repo's history.tsx)
//  Header: Today summary + Reports/Calendar quick actions
//  Body:   Budgets par catégorie (avril)
//  Footer: Transactions récentes
// ────────────────────────────────────────────────────────────
const ActivityBudgets = () => {
  const { Icon, Money, Chip, Progress, Card } = UIA;
  const T = TA;

  const todayExp = 78000;
  const todayInc = 850000;
  const showThresholds = window.__SHOW_THRESHOLDS;

  const budgets = [
    { name: 'Courses',     icon: 'cart', color: '#0E8C82', spent: 184000, limit: 250000, txCount: 12 },
    { name: 'Restaurants', icon: 'fork', color: '#C8442C', spent: 138000, limit: 150000, txCount: 18, alert: true },
    { name: 'Transport',   icon: 'car',  color: '#C8851A', spent:  92000, limit: 120000, txCount:  9 },
    { name: 'Logement',    icon: 'home2',color: '#3F4B9C', spent: 320000, limit: 400000, txCount:  3 },
    { name: 'Loisirs',     icon: 'leaf', color: '#5C6B2D', spent:  28000, limit:  80000, txCount:  4 },
  ];

  const recentTx = []; // moved to Home (Dashboard)

  return (
    <div style={{ background: T.bgBase, minHeight: '100%', paddingBottom: 100 }}>
      {/* ── Page header ── */}
      <div style={{ padding: '64px 20px 4px' }}>
        <div style={{ fontFamily: T.fontUI, fontSize: 11, fontWeight: 600, letterSpacing: 1.5,
                      textTransform: 'uppercase', color: T.inkSubtle, marginBottom: 2 }}>
          Avril 2026
        </div>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 28, color: T.ink, letterSpacing: -0.8, lineHeight: 1 }}>
          Activité & budgets
        </div>
      </div>

      <div style={{ padding: '14px 20px' }}>
        {/* ── Today card ── */}
        <Card style={{ padding: 16, background: T.brandTint, border: `1px solid ${T.brand}30`, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: T.brand,
                            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="time" size={16} color={T.inkOnDark} strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
                              textTransform: 'uppercase', color: T.brandDeep }}>
                  Aujourd'hui · 28 avr.
                </div>
                <div style={{ fontFamily: T.fontUI, fontSize: 11, color: T.inkMuted, marginTop: 2 }}>
                  4 transactions
                </div>
              </div>
            </div>
            <Chip tone="brand">Net +764 500</Chip>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, padding: '10px 12px', background: T.bgSurface, borderRadius: 10 }}>
              <div style={{ fontFamily: T.fontUI, fontSize: 9, fontWeight: 700, letterSpacing: 1.2,
                            textTransform: 'uppercase', color: T.inkSubtle, marginBottom: 4 }}>
                Dépensé
              </div>
              <Money value={-todayExp} size="md" weight={700} color={T.bad} />
            </div>
            <div style={{ flex: 1, padding: '10px 12px', background: T.bgSurface, borderRadius: 10 }}>
              <div style={{ fontFamily: T.fontUI, fontSize: 9, fontWeight: 700, letterSpacing: 1.2,
                            textTransform: 'uppercase', color: T.inkSubtle, marginBottom: 4 }}>
                Reçu
              </div>
              <Money value={todayInc} size="md" weight={700} color={T.good} />
            </div>
          </div>
        </Card>

        {/* ── Quick actions: Rapports + Calendrier ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <Card style={{ flex: 1, padding: 12, display: 'flex', alignItems: 'center', gap: 10,
                         background: T.ink, border: 'none', cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(245,245,241,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="pulse" size={16} color={T.inkOnDark} strokeWidth={2} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, color: T.inkOnDark }}>
                Rapports
              </div>
              <div style={{ fontFamily: T.fontUI, fontSize: 10, color: T.inkOnDarkM }}>
                Graphiques
              </div>
            </div>
            <Icon name="chev" size={12} color={T.inkOnDarkM} strokeWidth={2.4} />
          </Card>
          <Card style={{ flex: 1, padding: 12, display: 'flex', alignItems: 'center', gap: 10,
                         background: T.bgInk, border: 'none', cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(245,245,241,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plan" size={16} color={T.inkOnDark} strokeWidth={2} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, color: T.inkOnDark }}>
                Calendrier
              </div>
              <div style={{ fontFamily: T.fontUI, fontSize: 10, color: T.inkOnDarkM }}>
                Vue mensuelle
              </div>
            </div>
            <Icon name="chev" size={12} color={T.inkOnDarkM} strokeWidth={2.4} />
          </Card>
        </div>

        {/* ── Manage categories link ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 4px',
                      cursor: 'pointer' }}>
          <Icon name="settings" size={14} color={T.brand} strokeWidth={2} />
          <span style={{ flex: 1, fontFamily: T.fontUI, fontSize: 12, fontWeight: 600,
                         color: T.brand, letterSpacing: 0.1 }}>
            Gérer les catégories
          </span>
          <Icon name="chev" size={12} color={T.brand} strokeWidth={2.4} />
        </div>

        {/* ── Budgets section header ── */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                      marginTop: 18, marginBottom: 10, paddingLeft: 4 }}>
          <div>
            <div style={{ fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
                          textTransform: 'uppercase', color: T.inkSubtle, marginBottom: 2 }}>
              Budgets · avril
            </div>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 20, color: T.ink, letterSpacing: -0.4 }}>
              Par catégorie
            </div>
          </div>
          <div style={{ padding: '3px 9px', borderRadius: 999, background: T.bgRaised,
                        fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, color: T.inkMuted }}>
            {budgets.length}
          </div>
        </div>

        {/* ── Budgets list ── */}
        <Card style={{ padding: 4, marginBottom: 22 }}>
          {budgets.map((b, i) => {
            const pct = Math.round((b.spent / b.limit) * 100);
            const overWarn = pct >= 90;
            return (
              <div key={i} style={{
                padding: '12px',
                borderBottom: i === budgets.length - 1 ? 'none' : `1px solid ${T.hairline}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${b.color}15`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={b.icon} size={15} color={b.color} strokeWidth={1.9} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: T.fontUI, fontSize: 13, fontWeight: 600, color: T.ink }}>
                        {b.name}
                      </span>
                      {b.alert && <Chip tone="warn">Seuil 90%</Chip>}
                    </div>
                    <div style={{ fontFamily: T.fontUI, fontSize: 11, color: T.inkSubtle, marginTop: 1 }}>
                      {b.txCount} transactions
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Money value={-b.spent} size="sm" weight={700} color={T.ink} />
                    <div style={{ fontFamily: T.fontUI, fontSize: 10, color: T.inkSubtle,
                                  fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>
                      sur {new Intl.NumberFormat('fr-FR').format(b.limit)} Ar
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <Progress
                      value={pct}
                      height={5}
                      color={overWarn ? T.bad : b.color}
                      thresholds={showThresholds ? [50, 90] : []}
                    />
                  </div>
                  <span style={{
                    fontFamily: T.fontUI, fontSize: 11, fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    color: overWarn ? T.bad : T.inkMuted,
                    minWidth: 32, textAlign: 'right',
                  }}>
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </Card>

        {/* ── Recent transactions: moved to Home (Dashboard) ── */}
      </div>
    </div>
  );
};

window.MTS_ActivityBudgets = ActivityBudgets;

// ────────────────────────────────────────────────────────────
//  Reports — full chart screen
// ────────────────────────────────────────────────────────────
const Reports = () => {
  const { Icon, Money, Chip, SectionHead, Card } = UIA;
  const T = TA;
  const cats = [
    { name: 'Restaurants', value: 138000, pct: 33, color: '#C8442C', icon: 'fork' },
    { name: 'Courses',     value: 184000, pct: 44, color: '#0E8C82', icon: 'cart' },
    { name: 'Transport',   value:  92000, pct: 22, color: '#C8851A', icon: 'car' },
  ];
  const months = [
    { m: 'Nov', exp: 320000, inc: 850000 },
    { m: 'Déc', exp: 410000, inc: 850000 },
    { m: 'Jan', exp: 380000, inc: 950000 },
    { m: 'Fév', exp: 290000, inc: 850000 },
    { m: 'Mar', exp: 350000, inc: 880000 },
    { m: 'Avr', exp: 414500, inc: 850000, current: true },
  ];
  const maxVal = Math.max(...months.flatMap((m) => [m.exp, m.inc]));

  return (
    <div style={{ background: T.bgBase, minHeight: '100%', paddingBottom: 100 }}>
      <div style={{ padding: '64px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 36, height: 36, borderRadius: 18, background: T.bgSurface,
                      border: `1px solid ${T.hairline}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevBack" size={18} color={T.ink} />
        </div>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 22, color: T.ink, letterSpacing: -0.5 }}>
          Rapports
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: '6px 20px' }}>
        <div style={{ background: T.bgRaised, borderRadius: 12, padding: 4, display: 'flex', marginBottom: 16 }}>
          {['Semaine', 'Mois', '6 mois', 'Année'].map((p, i) => (
            <div key={p} style={{
              flex: 1, padding: '8px 10px', borderRadius: 8,
              background: i === 1 ? T.bgSurface : 'transparent',
              boxShadow: i === 1 ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
              fontFamily: T.fontUI, fontSize: 11, fontWeight: 700,
              color: i === 1 ? T.ink : T.inkSubtle,
              textAlign: 'center',
            }}>{p}</div>
          ))}
        </div>

        <Card dark style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ fontFamily: T.fontUI, fontSize: 10, fontWeight: 600, letterSpacing: 1.5,
                        textTransform: 'uppercase', color: T.inkOnDarkM, marginBottom: 6 }}>
            Avril 2026 · net
          </div>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 36, color: T.inkOnDark, letterSpacing: -1,
                        fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            +435 500 <span style={{ fontSize: 16, color: T.inkOnDarkM, fontFamily: T.fontUI, fontWeight: 500 }}>Ar</span>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 18 }}>
            <div>
              <div style={{ fontFamily: T.fontUI, fontSize: 10, color: T.inkOnDarkM, letterSpacing: 0.5,
                            textTransform: 'uppercase', fontWeight: 600 }}>Entrées</div>
              <div style={{ fontFamily: T.fontUI, fontSize: 14, color: T.inkOnDark, fontWeight: 700,
                            fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>850 000 Ar</div>
            </div>
            <div style={{ width: 1, background: 'rgba(245,245,241,0.1)' }} />
            <div>
              <div style={{ fontFamily: T.fontUI, fontSize: 10, color: T.inkOnDarkM, letterSpacing: 0.5,
                            textTransform: 'uppercase', fontWeight: 600 }}>Sorties</div>
              <div style={{ fontFamily: T.fontUI, fontSize: 14, color: T.inkOnDark, fontWeight: 700,
                            fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>414 500 Ar</div>
            </div>
          </div>
        </Card>

        <div style={{ marginBottom: 20 }}>
          <SectionHead overline="6 derniers mois" title="Tendance" />
          <Card style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 140, paddingTop: 8 }}>
              {months.map((m) => (
                <div key={m.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, flex: 1, width: '100%', justifyContent: 'center' }}>
                    <div style={{ width: 8, height: `${(m.inc / maxVal) * 100}%`,
                                  background: m.current ? T.good : 'rgba(22,163,113,0.4)',
                                  borderRadius: '2px 2px 0 0' }} />
                    <div style={{ width: 8, height: `${(m.exp / maxVal) * 100}%`,
                                  background: m.current ? T.bad : 'rgba(200,68,44,0.4)',
                                  borderRadius: '2px 2px 0 0' }} />
                  </div>
                  <div style={{ fontFamily: T.fontUI, fontSize: 10, fontWeight: 600,
                                color: m.current ? T.ink : T.inkSubtle }}>{m.m}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 12, paddingTop: 12,
                          borderTop: `1px solid ${T.hairline}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: T.good }} />
                <span style={{ fontFamily: T.fontUI, fontSize: 11, color: T.inkMuted, fontWeight: 500 }}>Entrées</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: T.bad }} />
                <span style={{ fontFamily: T.fontUI, fontSize: 11, color: T.inkMuted, fontWeight: 500 }}>Sorties</span>
              </div>
            </div>
          </Card>
        </div>

        <SectionHead overline="Avril 2026" title="Par catégorie" />
        <Card style={{ padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', marginBottom: 14 }}>
            {cats.map((c, i) => <div key={i} style={{ flex: c.pct, background: c.color }} />)}
          </div>
          {cats.map((c, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              paddingTop: i === 0 ? 0 : 10, paddingBottom: i === cats.length - 1 ? 0 : 10,
              borderBottom: i === cats.length - 1 ? 'none' : `1px solid ${T.hairline}`,
            }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${c.color}15`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={c.icon} size={14} color={c.color} strokeWidth={1.9} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.fontUI, fontSize: 13, fontWeight: 600, color: T.ink }}>{c.name}</div>
                <div style={{ fontFamily: T.fontUI, fontSize: 11, color: T.inkSubtle, marginTop: 1 }}>
                  {c.pct}% des dépenses
                </div>
              </div>
              <Money value={-c.value} size="sm" weight={700} color={T.ink} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//  Calendar
// ────────────────────────────────────────────────────────────
const Calendar = () => {
  const { Icon, Money, Chip, SectionHead, Card } = UIA;
  const T = TA;
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const cells = [];
  for (let i = 0; i < 2; i++) cells.push({ blank: true });
  for (let d = 1; d <= 30; d++) {
    const intensity = [3, 8, 15, 22, 28].includes(d) ? 'high'
                    : [5, 10, 17, 25, 27].includes(d) ? 'med'
                    : [1, 7, 12, 14, 19, 21, 24].includes(d) ? 'low'
                    : null;
    const today = d === 28;
    cells.push({ d, intensity, today });
  }
  const ic = (i) => i === 'high' ? T.bad : i === 'med' ? T.warn : i === 'low' ? T.good : null;

  return (
    <div style={{ background: T.bgBase, minHeight: '100%', paddingBottom: 100 }}>
      <div style={{ padding: '64px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 36, height: 36, borderRadius: 18, background: T.bgSurface,
                      border: `1px solid ${T.hairline}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevBack" size={18} color={T.ink} />
        </div>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 22, color: T.ink, letterSpacing: -0.5 }}>
          Calendrier
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: '6px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: T.bgSurface, border: `1px solid ${T.hairline}`,
                      borderRadius: 12, padding: '12px 16px', marginBottom: 14 }}>
          <Icon name="chevBack" size={16} color={T.inkMuted} />
          <span style={{ fontFamily: T.fontDisplay, fontSize: 18, color: T.ink, letterSpacing: -0.4 }}>
            Avril 2026
          </span>
          <Icon name="chev" size={16} color={T.inkSubtle} />
        </div>

        <Card style={{ padding: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
            {days.map((d, i) => (
              <div key={i} style={{
                fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                textAlign: 'center', color: T.inkSubtle, padding: '6px 0',
              }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {cells.map((c, i) => {
              if (c.blank) return <div key={i} />;
              const col = ic(c.intensity);
              return (
                <div key={i} style={{
                  aspectRatio: '1', borderRadius: 8,
                  background: c.today ? T.ink : c.intensity ? `${col}12` : 'transparent',
                  border: c.today ? 'none' : `1px solid ${c.intensity ? `${col}30` : 'transparent'}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    fontFamily: T.fontUI, fontSize: 12, fontWeight: c.today ? 700 : 600,
                    color: c.today ? T.inkOnDark : c.intensity ? col : T.ink,
                    fontVariantNumeric: 'tabular-nums',
                  }}>{c.d}</div>
                  {c.intensity && !c.today && (
                    <div style={{ width: 4, height: 4, borderRadius: 2, background: col, marginTop: 2 }} />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <div style={{ display: 'flex', gap: 14, marginTop: 14, paddingInline: 4 }}>
          {[['Faible', T.good], ['Moyen', T.warn], ['Élevé', T.bad]].map(([l, c]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
              <span style={{ fontFamily: T.fontUI, fontSize: 11, color: T.inkMuted, fontWeight: 500 }}>{l}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22 }}>
          <SectionHead overline="Mardi 28 avril" title="Aujourd'hui" />
          <Card style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
                              textTransform: 'uppercase', color: T.inkSubtle, marginBottom: 2 }}>
                  Net du jour
                </div>
                <Money value={764500} size="lg" weight={400} color={T.good} />
              </div>
              <Chip tone="good">+4 transactions</Chip>
            </div>
            <div style={{ height: 1, background: T.hairline, marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, padding: '10px 12px', background: T.badSoft, borderRadius: 9 }}>
                <div style={{ fontFamily: T.fontUI, fontSize: 9, fontWeight: 700, letterSpacing: 1.2,
                              textTransform: 'uppercase', color: T.bad, marginBottom: 2 }}>Sorties</div>
                <Money value={-78000} size="sm" weight={700} color={T.bad} />
              </div>
              <div style={{ flex: 1, padding: '10px 12px', background: T.goodSoft, borderRadius: 9 }}>
                <div style={{ fontFamily: T.fontUI, fontSize: 9, fontWeight: 700, letterSpacing: 1.2,
                              textTransform: 'uppercase', color: T.good, marginBottom: 2 }}>Entrées</div>
                <Money value={850000} size="sm" weight={700} color={T.good} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

window.MTS_Reports = Reports;
window.MTS_Calendar = Calendar;
