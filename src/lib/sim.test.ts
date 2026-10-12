import { describe, expect, it } from 'vitest'
import { SIM } from './config'
import { formatClock, formatEta, formatTemp, readyAtS, removeAtS, removeTempC, snapshot } from './sim'

const TARGET = 57 // beef, medium rare

describe('cook curve', () => {
  it('fires remove-from-heat 3°C below target', () => {
    expect(removeTempC(TARGET)).toBe(54)
    expect(snapshot(TARGET, removeAtS(TARGET) - 0.001).internalC).toBeCloseTo(54, 2)
  })

  it('starts cold and rises monotonically toward ambient', () => {
    expect(snapshot(TARGET, 0).internalC).toBe(SIM.startC)
    let prev = -Infinity
    for (let t = 0; t < removeAtS(TARGET); t += 60) {
      const { internalC } = snapshot(TARGET, t)
      expect(internalC).toBeGreaterThan(prev)
      expect(internalC).toBeLessThan(SIM.ambientC)
      prev = internalC
    }
  })

  it('takes longer for hotter targets', () => {
    expect(removeAtS(52)).toBeLessThan(removeAtS(57))
    expect(removeAtS(57)).toBeLessThan(removeAtS(74))
  })

  it('keeps ambient near 180°C with small noise while cooking', () => {
    for (let t = 0; t < removeAtS(TARGET); t += 97) {
      expect(Math.abs(snapshot(TARGET, t).ambientC - SIM.ambientC)).toBeLessThanOrEqual(3.2)
    }
  })
})

describe('phases', () => {
  it('estimates for the first minutes with no ETA', () => {
    const s = snapshot(TARGET, SIM.estimatingS - 1)
    expect(s.phase).toBe('estimating')
    expect(s.etaS).toBeNull()
  })

  it('then cooks with an ETA derived from the curve', () => {
    const t = SIM.estimatingS + 100
    const s = snapshot(TARGET, t)
    expect(s.phase).toBe('cooking')
    expect(s.etaS).toBeCloseTo(removeAtS(TARGET) - t)
    expect(s.progress).toBeCloseTo(t / removeAtS(TARGET))
  })

  it('rests for 5–8 minutes, still rising, and lands on target', () => {
    expect(SIM.restS).toBeGreaterThanOrEqual(5 * 60)
    expect(SIM.restS).toBeLessThanOrEqual(8 * 60)
    const removeAt = removeAtS(TARGET)

    const start = snapshot(TARGET, removeAt)
    expect(start.phase).toBe('resting')
    expect(start.restLeftS).toBe(SIM.restS)
    expect(start.internalC).toBeCloseTo(54)

    const mid = snapshot(TARGET, removeAt + SIM.restS / 2)
    expect(mid.internalC).toBeGreaterThan(54)
    expect(mid.internalC).toBeLessThan(TARGET)
    expect(mid.ambientC).toBeLessThan(start.ambientC)

    expect(snapshot(TARGET, removeAt + SIM.restS - 0.001).internalC).toBeCloseTo(TARGET, 2)
  })

  it('is ready after the rest, and clamps time there', () => {
    const s = snapshot(TARGET, readyAtS(TARGET) + 9999)
    expect(s.phase).toBe('ready')
    expect(s.internalC).toBe(TARGET)
    expect(s.progress).toBe(1)
    expect(s.elapsedS).toBe(readyAtS(TARGET))
  })
})

describe('formatting', () => {
  it('formats temperatures in °C or °F', () => {
    expect(formatTemp(57.4, 'C')).toBe('57°')
    expect(formatTemp(57, 'F')).toBe('135°')
    expect(formatTemp(74, 'F')).toBe('165°')
  })

  it('formats clocks', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(228.9)).toBe('3:48')
    expect(formatClock(4360)).toBe('1:12:40')
    expect(formatClock(-5)).toBe('0:00')
  })

  it('formats the ETA in seconds, minutes, or hours', () => {
    expect(formatEta(42.2)).toEqual({ value: '43', unit: 'sec' })
    expect(formatEta(24 * 60 - 30)).toEqual({ value: '24', unit: 'min' })
    expect(formatEta(130 * 60)).toEqual({ value: '2:10', unit: 'h' })
  })
})
