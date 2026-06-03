/* global React, MTS_TOKENS, MTS_UI */
const T = window.MTS_TOKENS;
const { Icon, Money, Chip, Progress, SectionHead, Card } = window.MTS_UI;

// ────────────────────────────────────────────────────────────
//  Tab bar — refined floating dock with crisp typography
// ────────────────────────────────────────────────────────────
const TabBar = ({ active = 'home' }) => {
  const tabs = [
    { id: 'home', label: 'Accueil', icon: 'home' },
    { id: 'plan', label: 'Plans', icon: 'plan' },
    { id: 'add',  label: '', icon: 'plus', center: true },
    { id: 'pulse', label: 'Activité', icon: 'pulse' },
    { id: 'trophy', label: 'Succès', icon: 'trophy' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      paddingBottom: 28, paddingTop: 10,
      background: T.bgSurface,
      borderTop: `1px solid ${T.hairline}`,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
    }}>
      {tabs.map((tab) => {
        if (tab.center) {
          return (
            <div key={tab.id} style={{
              width: 50, height: 50, borderRadius: 25, marginTop: -22,
              background: T.bgInk, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(14,140,130,0.25), 0 2px 4px rgba(0,0,0,0.2)',
            }}>
              <Icon name="plus" size={24} color={T.inkOnDark} strokeWidth={2.2} />
            </div>
          );
        }
        const isActive = tab.id === active;
        return (
          <div key={tab.id} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            color: isActive ? T.brand : T.inkSubtle,
            minWidth: 50,
          }}>
            <Icon name={tab.icon} size={22} strokeWidth={isActive ? 2.2 : 1.7} />
            <div style={{ fontFamily: T.fontUI, fontSize: 10, fontWeight: 600, letterSpacing: 0.2 }}>
              {tab.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//  Dashboard
// ────────────────────────────────────────────────────────────
const Dashboard = () => {
  const accounts = [
    { id: 1, name: 'Compte courant', type: 'bank',  balance: 1420000, icon: 'bank' },
    { id: 2, name: 'Espèces',        type: 'cash',  balance:  185000, icon: 'cash' },
    { id: 3, name: 'Épargne',        type: 'bank',  balance:  640000, icon: 'wallet' },
  ];
  const budgets = [
    { id: 1, cat: 'Courses',       icon: 'cart', color: '#0E8C82', spent: 184000, limit: 250000, thresholds: [50, 80] },
    { id: 2, cat: 'Transport',     icon: 'car',  color: '#C8851A', spent:  92000, limit: 100000, thresholds: [50, 80] },
    { id: 3, cat: 'Restaurants',   icon: 'fork', color: '#C8442C', spent: 138000, limit: 120000, thresholds: [50, 80] },
  ];
  const txs = [
    { id: 1, cat: 'Courses',     icon: 'cart',   color: '#0E8C82', amount: -42500,  note: 'Shoprite', time: '14:22', acct: 'Banque' },
    { id: 2, cat: 'Salaire',     icon: 'arrowUp', color: '#16A371', amount: 850000,  note: '',         time: '09:00', acct: 'Banque' },
    { id: 3, cat: 'Restaurants', icon: 'fork',   color: '#C8442C', amount: -28000,  note: 'Le Soleil', time: '12:45', acct: 'Espèces' },
    { id: 4, cat: 'Transport',   icon: 'car',    color: '#C8851A', amount: -8000,   note: '',         time: '08:10', acct: 'Espèces' },
  ];
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div style={{ background: T.bgBase, minHeight: '100%', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '64px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: T.fontUI, fontSize: 11, fontWeight: 600, letterSpacing: 1.5,
                        textTransform: 'uppercase', color: T.inkSubtle, marginBottom: 2 }}>
            Mardi · 28 avril
          </div>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 28, color: T.ink, letterSpacing: -0.8, lineHeight: 1 }}>
            Mitsitsy
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: T.bgSurface,
                        border: `1px solid ${T.hairline}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <Icon name="bell" size={18} color={T.inkMuted} />
            <div style={{ position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: 4, background: T.bad,
                          border: `1.5px solid ${T.bgSurface}` }} />
          </div>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: T.bgSurface,
                        border: `1px solid ${T.hairline}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="settings" size={18} color={T.inkMuted} />
          </div>
        </div>
      </div>

      <div style={{ padding: '10px 20px' }}>
        {/* Hero balance — dark ink card with a subtle grain */}
        <div style={{
          background: `linear-gradient(150deg, ${T.bgInk} 0%, ${T.bgInkSoft} 100%)`,
          borderRadius: 22,
          padding: 22,
          color: T.inkOnDark,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* decorative ring */}
          <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180,
                        borderRadius: 90, border: `1px solid rgba(245,245,241,0.06)` }} />
          <div style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140,
                        borderRadius: 70, border: `1px solid rgba(14,140,130,0.18)` }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
            <div>
              <div style={{ fontFamily: T.fontUI, fontSize: 11, fontWeight: 600, letterSpacing: 1.5,
                            textTransform: 'uppercase', color: T.inkOnDarkM, marginBottom: 8 }}>
                Solde net · 3 comptes
              </div>
              <div style={{ fontFamily: T.fontDisplay, fontSize: 42, lineHeight: 1, letterSpacing: -1.5,
                            color: T.inkOnDark, fontWeight: 400 }}>
                {new Intl.NumberFormat('fr-FR').format(totalBalance)}
                <span style={{ fontSize: 22, marginLeft: 6, color: T.inkOnDarkM, fontFamily: T.fontUI, fontWeight: 500 }}>Ar</span>
              </div>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(245,245,241,0.08)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="eye" size={16} color={T.inkOnDark} />
            </div>
          </div>

          {/* Mini delta row */}
          <div style={{ marginTop: 18, display: 'flex', gap: 18, position: 'relative' }}>
            <div>
              <div style={{ fontFamily: T.fontUI, fontSize: 10, color: T.inkOnDarkM, letterSpacing: 0.5,
                            textTransform: 'uppercase', fontWeight: 600 }}>Entrées · ce mois</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Icon name="arrowUp" size={12} color="#7DD3A6" strokeWidth={2.4} />
                <span style={{ fontFamily: T.fontUI, fontSize: 13, fontVariantNumeric: 'tabular-nums',
                               color: T.inkOnDark, fontWeight: 600 }}>850 000 Ar</span>
              </div>
            </div>
            <div style={{ width: 1, background: 'rgba(245,245,241,0.1)' }} />
            <div>
              <div style={{ fontFamily: T.fontUI, fontSize: 10, color: T.inkOnDarkM, letterSpacing: 0.5,
                            textTransform: 'uppercase', fontWeight: 600 }}>Sorties · ce mois</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Icon name="arrowDown" size={12} color="#E8A99B" strokeWidth={2.4} />
                <span style={{ fontFamily: T.fontUI, fontSize: 13, fontVariantNumeric: 'tabular-nums',
                               color: T.inkOnDark, fontWeight: 600 }}>414 500 Ar</span>
              </div>
            </div>
          </div>

          {/* Overspend banner — surfaces the new threshold feature */}
          <div style={{ marginTop: 18, background: 'rgba(200,68,44,0.18)',
                        border: '1px solid rgba(232,169,155,0.25)',
                        borderRadius: 12, padding: '10px 12px',
                        display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
            <div style={{ width: 24, height: 24, borderRadius: 12, background: '#C8442C',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="warn" size={13} color="#fff" strokeWidth={2.4} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.fontUI, fontSize: 12, fontWeight: 600, color: T.inkOnDark, letterSpacing: 0.1 }}>
                Restaurants : seuil dépassé de 18 000 Ar
              </div>
            </div>
            <Icon name="chev" size={14} color={T.inkOnDarkM} />
          </div>
        </div>

        {/* Streak / quick stat strip */}
        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, background: T.bgSurface, border: `1px solid ${T.hairline}`,
                        borderRadius: 14, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: T.warnSoft,
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="flame" size={15} color={T.warn} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontFamily: T.fontUI, fontSize: 10, color: T.inkSubtle, letterSpacing: 0.5,
                            textTransform: 'uppercase', fontWeight: 600 }}>Série</div>
              <div style={{ fontFamily: T.fontUI, fontSize: 14, fontWeight: 700, color: T.ink, marginTop: 1 }}>
                12 jours
              </div>
            </div>
          </div>
          <div style={{ flex: 1.4, background: T.bgSurface, border: `1px solid ${T.hairline}`,
                        borderRadius: 14, padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontFamily: T.fontUI, fontSize: 10, color: T.inkSubtle, letterSpacing: 0.5,
                            textTransform: 'uppercase', fontWeight: 600 }}>Niveau 7 · 1 240 XP</div>
              <div style={{ fontFamily: T.fontUI, fontSize: 10, color: T.brand, fontWeight: 600 }}>+260 XP</div>
            </div>
            <Progress value={62} height={4} color={T.brand} />
          </div>
        </div>

        {/* Accounts */}
        <div style={{ marginTop: 22 }}>
          <SectionHead overline="Mes argent" title="Comptes" action={
            <div style={{ width: 28, height: 28, borderRadius: 14, background: T.brandSoft,
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={15} color={T.brand} strokeWidth={2.4} />
            </div>
          } />
          <div style={{ display: 'flex', gap: 10, overflow: 'hidden' }}>
            {accounts.map((a, i) => (
              <Card key={a.id} style={{ padding: 14, minWidth: 138, flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10,
                                background: i === 0 ? T.brandTint : i === 1 ? T.warnSoft : T.bgRaised,
                                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={a.icon} size={15}
                          color={i === 0 ? T.brand : i === 1 ? T.warn : T.inkMuted}
                          strokeWidth={1.8} />
                  </div>
                  <div style={{ fontFamily: T.fontUI, fontSize: 9, fontWeight: 700, letterSpacing: 1.2,
                                textTransform: 'uppercase', color: T.inkSubtle }}>
                    {a.type === 'bank' ? 'Banque' : 'Cash'}
                  </div>
                </div>
                <div style={{ fontFamily: T.fontUI, fontSize: 11, color: T.inkMuted, marginBottom: 4, fontWeight: 500 }}>
                  {a.name}
                </div>
                <div style={{ fontFamily: T.fontUI, fontSize: 16, fontWeight: 600, color: T.ink,
                              fontVariantNumeric: 'tabular-nums', letterSpacing: -0.2 }}>
                  {new Intl.NumberFormat('fr-FR').format(a.balance)}
                  <span style={{ fontSize: 10, color: T.inkSubtle, marginLeft: 3, fontWeight: 500 }}>Ar</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Budgets — the seuils feature */}
        <div style={{ marginTop: 24 }}>
          <SectionHead
            overline="Avril 2026"
            title="Budgets"
            action={
              <div style={{ display: 'flex', alignItems: 'center', gap: 4,
                            fontFamily: T.fontUI, fontSize: 12, fontWeight: 600, color: T.brand }}>
                Tout voir <Icon name="chev" size={12} color={T.brand} strokeWidth={2.2} />
              </div>
            }
          />
          <Card style={{ padding: 14 }}>
            {budgets.map((b, i) => {
              const pct = Math.round((b.spent / b.limit) * 100);
              const over = pct > 100;
              const near = pct >= 80 && pct <= 100;
              const tone = over ? T.bad : near ? T.warn : T.good;
              return (
                <div key={b.id} style={{
                  paddingTop: i === 0 ? 0 : 12,
                  paddingBottom: i === budgets.length - 1 ? 0 : 12,
                  borderBottom: i === budgets.length - 1 ? 'none' : `1px solid ${T.hairline}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8,
                                  background: `${b.color}15`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={b.icon} size={14} color={b.color} strokeWidth={1.9} />
                    </div>
                    <div style={{ fontFamily: T.fontUI, fontSize: 13, fontWeight: 600, color: T.ink, flex: 1 }}>
                      {b.cat}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4,
                                  fontFamily: T.fontUI, fontVariantNumeric: 'tabular-nums' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: tone }}>
                        {new Intl.NumberFormat('fr-FR').format(b.spent)}
                      </span>
                      <span style={{ fontSize: 11, color: T.inkSubtle }}>/ {new Intl.NumberFormat('fr-FR').format(b.limit)}</span>
                    </div>
                  </div>
                  <Progress
                    value={Math.min(pct, 100)}
                    height={6}
                    color={tone}
                    thresholds={b.thresholds}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6,
                                fontFamily: T.fontUI, fontSize: 10, color: T.inkSubtle, fontWeight: 500 }}>
                    <span>Seuils 50% · 80%</span>
                    <span style={{ color: tone, fontWeight: 700 }}>{pct}%{over ? ' · dépassé' : near ? ' · alerte' : ''}</span>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>

        {/* Recent transactions */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{
                fontFamily: T.fontUI, fontSize: 10, fontWeight: 600,
                letterSpacing: 1.5, textTransform: 'uppercase',
                color: T.inkSubtle, marginBottom: 4,
              }}>Récentes</div>
              <div style={{
                fontFamily: T.fontDisplay, fontSize: 22, lineHeight: 1,
                color: T.ink, letterSpacing: -0.5,
              }}>Transactions</div>
            </div>
            <span style={{ fontFamily: T.fontUI, fontSize: 11, fontWeight: 600, color: T.brand, cursor: 'pointer' }}>
              Voir tout →
            </span>
          </div>
          <Card style={{ padding: 4 }}>
            {txs.map((t, i) => (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px',
                borderBottom: i === txs.length - 1 ? 'none' : `1px solid ${T.hairline}`,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10,
                              background: `${t.color}15`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={t.icon} size={16} color={t.color} strokeWidth={1.9} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: T.fontUI, fontSize: 13, fontWeight: 600, color: T.ink,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.cat}
                  </div>
                  <div style={{ fontFamily: T.fontUI, fontSize: 11, color: T.inkSubtle, marginTop: 1,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.note ? `${t.note} · ` : ''}{t.acct} · {t.time}
                  </div>
                </div>
                <Money
                  value={t.amount}
                  size="md"
                  weight={700}
                  color={t.amount < 0 ? T.bad : T.good}
                />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
};

window.MTS_Dashboard = Dashboard;
window.MTS_TabBar = TabBar;
