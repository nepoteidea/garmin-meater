// localStorage can be missing or throw (private mode, blocked storage), so
// every access is guarded and falls back to "nothing saved".
import type { Probe } from './machine'
import type { Units } from './sim'

const PROBE_KEY = 'garmin-meater:probe'
const UNITS_KEY = 'garmin-meater:units'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Not persisting is fine for a prototype.
  }
}

export function loadProbe(): Probe | null {
  try {
    const p = JSON.parse(read(PROBE_KEY) ?? 'null')
    return p && typeof p.name === 'string' && typeof p.battery === 'number' ? p : null
  } catch {
    return null
  }
}

export function saveProbe(probe: Probe | null): void {
  if (probe) {
    write(PROBE_KEY, JSON.stringify(probe))
    return
  }
  try {
    localStorage.removeItem(PROBE_KEY)
  } catch {
    // Nothing stored, nothing to forget.
  }
}

export function loadUnits(): Units {
  return read(UNITS_KEY) === 'F' ? 'F' : 'C'
}

export function saveUnits(units: Units): void {
  write(UNITS_KEY, units)
}
