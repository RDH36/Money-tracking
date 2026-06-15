import { useEffect, useRef } from 'react';
import { usePostHog } from 'posthog-react-native';
import type { AccountWithBalance } from '@/types';

interface Params {
  source?: string;
  accounts: AccountWithBalance[];
  accountId: string | null;
  setAccountId: (id: string) => void;
}

/**
 * Logique d'activation de l'écran d'ajout (1re transaction) :
 * - présélectionne le compte par défaut (espèces de préférence) pour qu'une
 *   première saisie ne demande qu'un montant — supprime une étape bloquante ;
 * - track l'arrivée depuis l'onboarding et le premier montant saisi, pour
 *   distinguer « n'a rien saisi » de « a saisi puis abandonné ».
 */
export function useFirstExpenseActivation({ source, accounts, accountId, setAccountId }: Params) {
  const posthog = usePostHog();
  const amountTrackedRef = useRef(false);

  useEffect(() => {
    if (accountId || accounts.length === 0) return;
    const def = accounts.find((a) => a.is_default === 1 && a.type === 'cash')
      ?? accounts.find((a) => a.is_default === 1)
      ?? accounts[0];
    if (def) setAccountId(def.id);
  }, [accounts, accountId]);

  useEffect(() => {
    if (source === 'onboarding') {
      posthog.capture('first_transaction_screen_viewed', { source });
    }
  }, []);

  const trackAmountFirstEntered = () => {
    if (amountTrackedRef.current) return;
    amountTrackedRef.current = true;
    posthog.capture('add_amount_first_entered', source ? { source } : {});
  };

  return { trackAmountFirstEntered };
}
