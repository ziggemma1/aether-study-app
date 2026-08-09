/**
 * The shop's single source of truth, imported by both the Shop page and the
 * purchase controller.
 *
 * It used to be two hand-maintained copies — a `themes`/`voices` array in
 * Shop.tsx and a `SHOP_CATALOG` map in userController.ts — keyed on the display
 * name, so renaming an item on screen silently broke buying it. Items are keyed
 * on a stable id now, and the price lives here only.
 *
 * This file must stay dependency-free: the server imports it too.
 */

export type ShopItemKind = 'utility' | 'theme' | 'voice';

export interface ShopItem {
  id: string;
  kind: ShopItemKind;
  name: string;
  description: string;
  cost: number;
  /** Themes: the class applied to the app root. Voices: the Gemini voice name. */
  value?: string;
  /** Swatch shown on theme cards, as [primary, secondary, accent]. */
  swatch?: [string, string, string];
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'streak-freeze',
    kind: 'utility',
    name: 'Streak freeze',
    description: 'Miss a day without losing your streak. One is spent automatically the next time you study.',
    cost: 100
  },

  /* Themes recolour the app's accents only. They deliberately leave the paper
     alone — the old time-of-day themes swapped the background wholesale and
     turned a bright app black every evening. */
  {
    id: 'theme-ocean',
    kind: 'theme',
    name: 'Ocean',
    description: 'Cool teals and deep blue in place of violet.',
    cost: 150,
    value: 'accent-ocean',
    swatch: ['#0E7490', '#0891B2', '#0E9F6E']
  },
  {
    id: 'theme-sunset',
    kind: 'theme',
    name: 'Sunset',
    description: 'Warm rose and amber, easier on tired eyes at night.',
    cost: 200,
    value: 'accent-sunset',
    swatch: ['#BE3455', '#C2610C', '#B0490B']
  },
  {
    id: 'theme-forest',
    kind: 'theme',
    name: 'Forest',
    description: 'Deep greens with a moss accent.',
    cost: 250,
    value: 'accent-forest',
    swatch: ['#15803D', '#0E7490', '#4D7C0F']
  },

  /* Real Gemini prebuilt voice names. The shop used to sell "Voice: Atlas
     (Deep UK)" and "Voice: Nova (Bright US)" for 500 and 300 points — neither
     existed, and speech was hardcoded to Kore regardless of what you bought. */
  {
    id: 'voice-puck',
    kind: 'voice',
    name: 'Puck',
    description: 'Upbeat and quick. Good for skimming a summary.',
    cost: 200,
    value: 'Puck'
  },
  {
    id: 'voice-charon',
    kind: 'voice',
    name: 'Charon',
    description: 'Even and informative, at a steady pace.',
    cost: 250,
    value: 'Charon'
  },
  {
    id: 'voice-aoede',
    kind: 'voice',
    name: 'Aoede',
    description: 'Light and breezy, with a softer delivery.',
    cost: 300,
    value: 'Aoede'
  }
];

/** The voice every account starts with; not for sale. */
export const DEFAULT_VOICE = 'Kore';

export const SHOP_ITEM_BY_ID = new Map(SHOP_ITEMS.map((i) => [i.id, i]));

/**
 * Purchases used to be recorded under their display name. Map the two names
 * that were ever on sale onto their replacements so nobody loses an item they
 * paid for.
 */
const LEGACY_IDS: Record<string, string> = {
  'Ocean Breeze': 'theme-ocean',
  'Cyberpunk Red': 'theme-sunset',
  'Streak Freeze': 'streak-freeze',
  'Voice: Atlas (Deep UK)': 'voice-charon',
  'Voice: Nova (Bright US)': 'voice-puck'
};

/** Normalise a stored ownership entry to a current item id. */
export function normaliseOwnedId(entry: string): string {
  return LEGACY_IDS[entry] || entry;
}

export function ownsItem(owned: string[] | undefined, itemId: string): boolean {
  return (owned || []).some((e) => normaliseOwnedId(e) === itemId);
}
