import { useTranslation } from 'react-i18next';
import { AddTransactionHeader } from '@/components/add';
import { ImportCaptureEntry } from '@/components/ocr-import';
import { BetaTesterCard } from '@/components/import-feedback/BetaTesterCard';
import type { AddEntryMode } from '@/hooks/habit/useAddEntryMode';
import { FirstExpenseHeader } from './FirstExpenseHeader';
import { EveningBanner } from './EveningBanner';

interface AddScreenTopProps {
  mode: AddEntryMode;
  formatMoney: (n: number) => string;
  deferBusy: boolean;
  onDefer: () => void;
}

/**
 * Haut de l'écran d'ajout selon le mode d'arrivée. Mode normal : titre
 * « Nouvelle transaction » + carte d'import, puis invitation « Testeur bêta ».
 */
export function AddScreenTop({ mode, formatMoney, deferBusy, onDefer }: AddScreenTopProps) {
  const { t } = useTranslation();
  if (mode === 'onboarding') return <FirstExpenseHeader busy={deferBusy} onDefer={onDefer} />;
  return (
    <>
      {mode === 'reminder'
        ? <EveningBanner formatMoney={formatMoney} />
        : <AddTransactionHeader title={t('add.newTransaction')} />}
      <ImportCaptureEntry />
      <BetaTesterCard />
    </>
  );
}
