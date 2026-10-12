// Cook simulation. Everything is a pure function of the target temperature
// and the simulated seconds elapsed, so it can be tested without timers.
import { SIM } from './config'

export type CookPhase = 'estimating' | 'cooking' | 'resting' | 'ready'

export interface Snapshot {
  phase: CookPhase
  elapsedS: number
  internalC: number
  ambientC: number
  targetC: number
  /** Seconds until "remove from heat"; null while estimating or after removal. */
  etaS: number | null
  /** Seconds of rest left; null unless resting. */
  restLeftS: number | null
  /** 0–1 fill of the bezel ring for the current phase. */
  progress: number
}

export const removeTempC = (targetC: number) => targetC - SIM.carryoverC

/** Simulated time at which the internal temp reaches the remove-from-heat point. */
export function removeAtS(targetC: number): number {
  const { ambientC, startC, tauS } = SIM
  return -tauS * Math.log((ambientC - removeTempC(targetC)) / (ambientC - startC))
}

export const readyAtS = (targetC: number) => removeAtS(targetC) + SIM.restS

/** Internal temperature on the exponential approach curve toward ambient. */
function curveC(t: number): number {
  const { ambientC, startC, tauS } = SIM
  return ambientC - (ambientC - startC) * Math.exp(-t / tauS)
}

/** Carry-over rise while resting, normalised so it lands exactly on target. */
function restC(targetC: number, s: number): number {
  const { carryoverC, restS, restTauS } = SIM
  const k = (1 - Math.exp(-s / restTauS)) / (1 - Math.exp(-restS / restTauS))
  return removeTempC(targetC) + carryoverC * k
}

/** Deterministic "noise" so the ambient reading wobbles realistically. */
const wobble = (t: number) => 2 * Math.sin(t / 37) + 1.2 * Math.sin(t / 11)

export function snapshot(targetC: number, elapsedS: number): Snapshot {
  const removeAt = removeAtS(targetC)
  const t = Math.max(0, Math.min(elapsedS, removeAt + SIM.restS))
  const base = { elapsedS: t, targetC }

  if (t < removeAt) {
    const estimating = t < SIM.estimatingS
    return {
      ...base,
      phase: estimating ? 'estimating' : 'cooking',
      internalC: curveC(t),
      ambientC: SIM.ambientC + wobble(t),
      etaS: estimating ? null : removeAt - t,
      restLeftS: null,
      progress: t / removeAt,
    }
  }

  const s = t - removeAt
  const offHeatAmbient = SIM.roomC + (SIM.ambientC + wobble(removeAt) - SIM.roomC) * Math.exp(-s / 30)
  if (s < SIM.restS) {
    return {
      ...base,
      phase: 'resting',
      internalC: restC(targetC, s),
      ambientC: offHeatAmbient,
      etaS: null,
      restLeftS: SIM.restS - s,
      progress: s / SIM.restS,
    }
  }
  return {
    ...base,
    phase: 'ready',
    internalC: targetC,
    ambientC: offHeatAmbient,
    etaS: null,
    restLeftS: null,
    progress: 1,
  }
}

export type Units = 'C' | 'F'

export function formatTemp(c: number, units: Units): string {
  return `${Math.round(units === 'C' ? c : (c * 9) / 5 + 32)}°`
}

/** m:ss under an hour, h:mm:ss above. */
export function formatClock(totalS: number): string {
  const s = Math.max(0, Math.floor(totalS))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

/** The big ETA number: whole minutes rounded up, or seconds in the last minute. */
export function formatEta(etaS: number): { value: string; unit: string } {
  if (etaS < 60) return { value: String(Math.ceil(etaS)), unit: 'sec' }
  const min = Math.ceil(etaS / 60)
  if (min < 100) return { value: String(min), unit: 'min' }
  return { value: `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`, unit: 'h' }
}
