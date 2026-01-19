const PRIMARY_API_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies';
const FALLBACK_API_URL = 'https://latest.currency-api.pages.dev/v1/currencies';

type ExchangeRateResponse = {
  date: string;
} & Record<string, Record<string, number>>;

async function fetchFromUrl(url: string): Promise<Response> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response;
}

export async function fetchExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) {
    return 1;
  }

  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  let response: Response;
  try {
    response = await fetchFromUrl(`${PRIMARY_API_URL}/${fromLower}.json`);
  } catch {
    try {
      response = await fetchFromUrl(`${FALLBACK_API_URL}/${fromLower}.json`);
    } catch {
      throw new Error('Impossible de contacter le serveur de taux de change');
    }
  }

  const data: ExchangeRateResponse = await response.json();

  if (!data[fromLower] || data[fromLower][toLower] === undefined) {
    throw new Error(`Taux de change non disponible pour ${from} → ${to}`);
  }

  return data[fromLower][toLower];
}
