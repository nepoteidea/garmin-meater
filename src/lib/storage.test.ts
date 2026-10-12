import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadProbe, loadUnits, saveProbe, saveUnits } from './storage'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('storage', () => {
  it('round-trips the probe and forgets it', () => {
    expect(loadProbe()).toBeNull()
    saveProbe({ name: 'MEATER #1', battery: 82 })
    expect(loadProbe()).toEqual({ name: 'MEATER #1', battery: 82 })
    saveProbe(null)
    expect(loadProbe()).toBeNull()
  })

  it('ignores malformed probe data', () => {
    localStorage.setItem('garmin-meater:probe', '{oops')
    expect(loadProbe()).toBeNull()
    localStorage.setItem('garmin-meater:probe', '{"name":1}')
    expect(loadProbe()).toBeNull()
  })

  it('round-trips units, defaulting to °C', () => {
    expect(loadUnits()).toBe('C')
    saveUnits('F')
    expect(loadUnits()).toBe('F')
  })

  it('survives storage that throws', () => {
    const boom = () => {
      throw new Error('blocked')
    }
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(boom)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(boom)
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(boom)
    expect(loadProbe()).toBeNull()
    expect(loadUnits()).toBe('C')
    expect(() => saveProbe({ name: 'x', battery: 1 })).not.toThrow()
    expect(() => saveProbe(null)).not.toThrow()
    expect(() => saveUnits('F')).not.toThrow()
  })
})
