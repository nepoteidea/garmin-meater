// Prototype defaults. Doneness targets are the final temperature after resting.

export type MeatId = 'beef' | 'pork' | 'chicken' | 'lamb'

export interface Doneness {
  id: string
  label: string
  targetC: number
}

export interface Meat {
  id: MeatId
  label: string
  /** Accent from the design tokens; used for the meat's label and focus ring. */
  accent: string
  doneness: Doneness[]
}

const RED_MEAT: Doneness[] = [
  { id: 'rare', label: 'Rare', targetC: 52 },
  { id: 'medium-rare', label: 'Medium rare', targetC: 57 },
  { id: 'medium', label: 'Medium', targetC: 63 },
  { id: 'medium-well', label: 'Medium well', targetC: 66 },
  { id: 'well-done', label: 'Well done', targetC: 71 },
]

export const MEATS: Meat[] = [
  { id: 'beef', label: 'Beef', accent: '#E5484D', doneness: RED_MEAT },
  {
    id: 'pork',
    label: 'Pork',
    accent: '#F59EB5',
    doneness: [
      { id: 'medium', label: 'Medium', targetC: 63 },
      { id: 'well-done', label: 'Well done', targetC: 71 },
    ],
  },
  {
    id: 'chicken',
    label: 'Chicken',
    accent: '#F5C04A',
    doneness: [{ id: 'done', label: 'Done', targetC: 74 }],
  },
  { id: 'lamb', label: 'Lamb', accent: '#B98CF5', doneness: RED_MEAT },
]

export function getMeat(id: MeatId): Meat {
  return MEATS.find((m) => m.id === id)!
}

/** Cook simulation constants (simulated seconds and °C). */
export const SIM = {
  /** Mean oven/grill temperature the internal temp approaches. */
  ambientC: 180,
  /** Internal temperature when the cook starts (straight from the fridge). */
  startC: 5,
  /** Time constant of the exponential approach curve. */
  tauS: 8000,
  /** "Remove from heat" fires this many degrees below target. */
  carryoverC: 3,
  /** Length of the rest phase. */
  restS: 6 * 60,
  /** Time constant of the carry-over rise while resting. */
  restTauS: 240,
  /** No ETA is shown for this long after the cook starts. */
  estimatingS: 5 * 60,
  /** Room temperature the ambient reading falls to once the meat is off the heat. */
  roomC: 22,
}

/** The probe the simulator always "finds". */
export const PROBE = { name: 'MEATER #1', battery: 82, signal: 'Strong' }

export const SPEEDS = [1, 10, 60] as const
export type Speed = (typeof SPEEDS)[number]
