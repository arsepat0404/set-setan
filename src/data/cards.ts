export { ALL_CARDS } from "../../supabase/functions/_shared/cards";
export type { CardType } from "../../supabase/functions/_shared/cards";
import { ALL_CARDS } from "../../supabase/functions/_shared/cards";

export const getCardImageUrl = (slug: string) => `/cards/${slug}.png`;
export const SETAN_CARD = ALL_CARDS.find((c) => c.isSetan)!;
