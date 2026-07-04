// Shared card catalog for "Jajan Terus" (Old Maid / Setan-setanan).
// 50 paired cards + 1 Setan card = 51 total.

export type CardType = {
  id: string;
  name: string;
  pairId: string | null;
  slug: string;
  isSetan: boolean;
};

export const ALL_CARDS: CardType[] = [
  { id: "c01", name: "Bakso Malang", pairId: "pair_01", slug: "bakso-malang", isSetan: false },
  { id: "c02", name: "Sambal Pedas", pairId: "pair_01", slug: "sambal-pedas", isSetan: false },
  { id: "c03", name: "Mie Instan Rebus", pairId: "pair_02", slug: "mie-instan", isSetan: false },
  { id: "c04", name: "Telur Ceplok", pairId: "pair_02", slug: "telur-ceplok", isSetan: false },
  { id: "c05", name: "Terang Bulan", pairId: "pair_03", slug: "terang-bulan", isSetan: false },
  { id: "c06", name: "Keju & Cokelat", pairId: "pair_03", slug: "keju-cokelat", isSetan: false },
  { id: "c07", name: "Cilok", pairId: "pair_04", slug: "cilok", isSetan: false },
  { id: "c08", name: "Saus Kacang Cilok", pairId: "pair_04", slug: "saus-kacang", isSetan: false },
  { id: "c09", name: "Sate Ayam", pairId: "pair_05", slug: "sate-ayam", isSetan: false },
  { id: "c10", name: "Bumbu Kacang Sate", pairId: "pair_05", slug: "bumbu-kacang", isSetan: false },
  { id: "c11", name: "Siomay", pairId: "pair_06", slug: "siomay", isSetan: false },
  { id: "c12", name: "Saus Kacang Siomay", pairId: "pair_06", slug: "saus-kacang-2", isSetan: false },
  { id: "c13", name: "Gorengan", pairId: "pair_07", slug: "gorengan", isSetan: false },
  { id: "c14", name: "Cabe Rawit", pairId: "pair_07", slug: "cabe-rawit", isSetan: false },
  { id: "c15", name: "Nasi Goreng", pairId: "pair_08", slug: "nasi-goreng", isSetan: false },
  { id: "c16", name: "Kerupuk", pairId: "pair_08", slug: "kerupuk", isSetan: false },
  { id: "c17", name: "Es Cendol", pairId: "pair_09", slug: "es-cendol", isSetan: false },
  { id: "c18", name: "Gula Merah", pairId: "pair_09", slug: "gula-merah", isSetan: false },
  { id: "c19", name: "Martabak Manis", pairId: "pair_10", slug: "martabak-manis", isSetan: false },
  { id: "c20", name: "Kacang Cokelat", pairId: "pair_10", slug: "kacang-cokelat", isSetan: false },
  { id: "c21", name: "Pempek", pairId: "pair_11", slug: "pempek", isSetan: false },
  { id: "c22", name: "Cuko", pairId: "pair_11", slug: "cuko", isSetan: false },
  { id: "c23", name: "Soto Ayam", pairId: "pair_12", slug: "soto-ayam", isSetan: false },
  { id: "c24", name: "Jeruk Nipis", pairId: "pair_12", slug: "jeruk-nipis", isSetan: false },
  { id: "c25", name: "Rendang", pairId: "pair_13", slug: "rendang", isSetan: false },
  { id: "c26", name: "Nasi Putih", pairId: "pair_13", slug: "nasi-putih", isSetan: false },
  { id: "c27", name: "Gado-Gado", pairId: "pair_14", slug: "gado-gado", isSetan: false },
  { id: "c28", name: "Bumbu Kacang Gado", pairId: "pair_14", slug: "bumbu-kacang-2", isSetan: false },
  { id: "c29", name: "Ketoprak", pairId: "pair_15", slug: "ketoprak", isSetan: false },
  { id: "c30", name: "Bawang Goreng", pairId: "pair_15", slug: "bawang-goreng", isSetan: false },
  { id: "c31", name: "Mie Ayam", pairId: "pair_16", slug: "mie-ayam", isSetan: false },
  { id: "c32", name: "Pangsit", pairId: "pair_16", slug: "pangsit", isSetan: false },
  { id: "c33", name: "Nasi Uduk", pairId: "pair_17", slug: "nasi-uduk", isSetan: false },
  { id: "c34", name: "Ayam Goreng", pairId: "pair_17", slug: "ayam-goreng", isSetan: false },
  { id: "c35", name: "Es Teh Manis", pairId: "pair_18", slug: "es-teh", isSetan: false },
  { id: "c36", name: "Gorengan Sore", pairId: "pair_18", slug: "gorengan-2", isSetan: false },
  { id: "c37", name: "Bubur Ayam", pairId: "pair_19", slug: "bubur-ayam", isSetan: false },
  { id: "c38", name: "Kacang Tanah", pairId: "pair_19", slug: "kacang-tanah", isSetan: false },
  { id: "c39", name: "Nasi Kuning", pairId: "pair_20", slug: "nasi-kuning", isSetan: false },
  { id: "c40", name: "Ayam Suwir", pairId: "pair_20", slug: "ayam-suwir", isSetan: false },
  { id: "c41", name: "Klepon", pairId: "pair_21", slug: "klepon", isSetan: false },
  { id: "c42", name: "Kelapa Parut", pairId: "pair_21", slug: "kelapa-parut", isSetan: false },
  { id: "c43", name: "Lemper", pairId: "pair_22", slug: "lemper", isSetan: false },
  { id: "c44", name: "Abon Ayam", pairId: "pair_22", slug: "abon-ayam", isSetan: false },
  { id: "c45", name: "Risoles", pairId: "pair_23", slug: "risoles", isSetan: false },
  { id: "c46", name: "Saus Sambal", pairId: "pair_23", slug: "saus-sambal", isSetan: false },
  { id: "c47", name: "Pastel", pairId: "pair_24", slug: "pastel", isSetan: false },
  { id: "c48", name: "Cabe Rawit Pastel", pairId: "pair_24", slug: "cabe-rawit-2", isSetan: false },
  { id: "c49", name: "Onde-onde", pairId: "pair_25", slug: "onde-onde", isSetan: false },
  { id: "c50", name: "Kacang Hijau", pairId: "pair_25", slug: "kacang-hijau", isSetan: false },
  { id: "c51", name: "Sendok Plastik Patah", pairId: null, slug: "sendok-patah", isSetan: true },
];
