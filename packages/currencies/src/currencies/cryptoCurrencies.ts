import { CurrencyMap, CurrencyUnitCrypto } from "../types";

export const cryptoCurrenciesMap: CurrencyMap<CurrencyUnitCrypto> = {
  BTC: {
    code: "BTC",
    minorUnit: 8,
    symbol: "BTC",
  },
  LTC: {
    code: "LTC",
    minorUnit: 8,
    symbol: "LTC",
  },
  ETH: {
    code: "ETH",
    minorUnit: 18,
    symbol: "ETH",
  },
} as const;

export const cryptoCurrencies = Object.keys(cryptoCurrenciesMap).map(
  (code) => cryptoCurrenciesMap[code]
);
