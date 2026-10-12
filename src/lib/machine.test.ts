import { describe, expect, it } from 'vitest'
import { MEATS, PROBE } from './config'
import { MEAT_ITEMS, SETTINGS_INDEX, alertActive, initialState, reduce, type Event, type State } from './machine'
import { readyAtS, removeAtS } from './sim'

const run = (state: State, ...events: (Event | Event['type'])[]) =>
  events.reduce<State>((s, e) => reduce(s, typeof e === 'string' ? ({ type: e } as Event) : e), state)

const saved = { name: PROBE.name, battery: PROBE.battery }

/** A freshly connected app sitting on the meat list. */
const onMeat = () => run(initialState(saved), 'select', { type: 'searchDone', found: true }, 'connectedDone')

describe('connect / sync', () => {
  it('starts searching when no probe was connected before', () => {
    expect(initialState(null).screen).toEqual({ name: 'searching', sync: false })
  })

  it('goes searching → found → connected → meat and remembers the probe', () => {
    let s = run(initialState(null), { type: 'searchDone', found: true })
    expect(s.screen.name).toBe('found')
    expect(s.savedProbe).toBeNull()
    s = run(s, 'select')
    expect(s.screen.name).toBe('connected')
    expect(s.savedProbe).toEqual(saved)
    expect(run(s, 'connectedDone').screen).toEqual({ name: 'meat', focus: 0 })
  })

  it('shows an error when no probe is found, and Retry searches again', () => {
    const s = run(initialState(null), { type: 'searchDone', found: false })
    expect(s.screen).toEqual({ name: 'error', sync: false })
    expect(run(s, 'select').screen).toEqual({ name: 'searching', sync: false })
  })

  it('offers Sync first when a probe was connected before', () => {
    const s = initialState(saved)
    expect(s.screen).toEqual({ name: 'home', focus: 0 })
    const syncing = run(s, 'select')
    expect(syncing.screen).toEqual({ name: 'searching', sync: true })
    // Syncing a known probe skips the "found" step.
    expect(run(syncing, { type: 'searchDone', found: true }).screen.name).toBe('connected')
    expect(run(syncing, { type: 'searchDone', found: false }).screen).toEqual({ name: 'error', sync: true })
  })

  it('can connect a new probe instead', () => {
    const s = run(initialState(saved), 'down', 'select')
    expect(s.screen).toEqual({ name: 'searching', sync: false })
  })

  it('goes back to the start of the connect flow', () => {
    expect(run(initialState(null), 'back').screen.name).toBe('searching')
    expect(run(initialState(saved), 'select', 'back').screen.name).toBe('home')
    expect(run(initialState(null), { type: 'searchDone', found: true }, 'back').screen.name).toBe('searching')
    expect(run(initialState(saved), 'select', { type: 'searchDone', found: false }, 'back').screen.name).toBe('home')
    expect(run(onMeat(), 'back').screen.name).toBe('home')
  })

  it('ignores timer events that arrive on another screen', () => {
    const s = initialState(saved)
    expect(reduce(s, { type: 'searchDone', found: true })).toBe(s)
    expect(reduce(s, { type: 'connectedDone' })).toBe(s)
  })
})

describe('lists', () => {
  it('clamps focus at both ends', () => {
    const s = onMeat()
    expect(reduce(s, { type: 'up' })).toBe(s)
    const last = run(s, ...Array<Event['type']>(10).fill('down'))
    expect(last.screen).toEqual({ name: 'meat', focus: MEAT_ITEMS - 1 })
  })

  it('lists beef, pork, chicken and lamb', () => {
    expect(MEATS.map((m) => m.id)).toEqual(['beef', 'pork', 'chicken', 'lamb'])
  })

  it('touch-picks an item directly', () => {
    const s = run(onMeat(), { type: 'pick', index: 2 })
    expect(s.screen).toEqual({ name: 'doneness', meat: 'chicken', focus: 0 })
  })

  it('goes back from doneness to the same meat', () => {
    const s = run(onMeat(), 'down', 'down', 'down', 'select', 'back')
    expect(s.screen).toEqual({ name: 'meat', focus: 3 })
  })
})

describe('doneness rules', () => {
  const targets = (id: string) => MEATS.find((m) => m.id === id)!.doneness.map((d) => d.targetC)

  it('only lets chicken be cooked to 74°C', () => {
    expect(targets('chicken')).toEqual([74])
    const s = run(onMeat(), { type: 'pick', index: 2 }, 'down', 'down', 'select')
    expect(s.cook?.targetC).toBe(74)
  })

  it('has no rare options for pork', () => {
    expect(targets('pork')).toEqual([63, 71])
    expect(MEATS.find((m) => m.id === 'pork')!.doneness.some((d) => /rare/i.test(d.label))).toBe(false)
  })

  it('offers the full range for beef and lamb', () => {
    expect(targets('beef')).toEqual([52, 57, 63, 66, 71])
    expect(targets('lamb')).toEqual([52, 57, 63, 66, 71])
  })
})

describe('settings', () => {
  it('toggles units from the meat list and returns there', () => {
    let s = run(onMeat(), { type: 'pick', index: SETTINGS_INDEX })
    expect(s.screen.name).toBe('settings')
    s = run(s, 'down')
    expect(s.units).toBe('F')
    s = run(s, 'up')
    expect(s.units).toBe('C')
    s = run(s, 'down', 'select')
    expect(s.units).toBe('F')
    expect(s.screen).toEqual({ name: 'meat', focus: SETTINGS_INDEX })
  })

  it('is reachable from the sync screen; BACK returns there', () => {
    const s = run(initialState(saved, 'F'), 'down', 'down', 'select')
    expect(s.screen).toMatchObject({ name: 'settings', focus: 1 })
    expect(run(s, 'back').screen).toEqual({ name: 'home', focus: 2 })
  })
})

describe('cooking', () => {
  const cooking = () => run(onMeat(), 'select', 'down', 'select') // beef, medium rare
  const removeAt = removeAtS(57)

  it('starts a cook with the chosen target', () => {
    const s = cooking()
    expect(s.screen).toEqual({ name: 'cook' })
    expect(s.cook).toMatchObject({ meat: 'beef', donenessId: 'medium-rare', targetC: 57, elapsedS: 0 })
  })

  it('advances on ticks and stops at ready', () => {
    let s = run(cooking(), { type: 'tick', dtS: 120 })
    expect(s.cook?.elapsedS).toBe(120)
    s = run(s, { type: 'tick', dtS: 1e9 })
    expect(s.cook?.elapsedS).toBe(readyAtS(57))
    expect(reduce(s, { type: 'tick', dtS: 1 })).toBe(s)
  })

  it('raises the remove-from-heat alert until dismissed with BACK or a tap', () => {
    const s = run(cooking(), { type: 'tick', dtS: removeAt })
    expect(alertActive(s)).toBe(true)
    // UP/DOWN don't dismiss it.
    expect(alertActive(run(s, 'up', 'down'))).toBe(true)
    expect(alertActive(run(s, 'back'))).toBe(false)
    expect(alertActive(run(s, { type: 'pick', index: 0 }))).toBe(false)
    expect(run(s, 'select').screen).toEqual({ name: 'cook' })
  })

  it('jumps straight to remove-from-heat for demos', () => {
    const s = run(cooking(), 'select', { type: 'jumpToRemove' })
    expect(s.cook?.elapsedS).toBe(removeAt)
    expect(s.screen).toEqual({ name: 'cook' })
    expect(alertActive(s)).toBe(true)
    const none = onMeat()
    expect(reduce(none, { type: 'jumpToRemove' })).toBe(none)
    expect(reduce(none, { type: 'tick', dtS: 5 })).toBe(none)
  })

  it('asks before stopping a cook, defaulting to keep cooking', () => {
    const menu = run(cooking(), 'select')
    expect(menu.screen).toEqual({ name: 'stop', focus: 1 })
    expect(run(menu, 'select').screen).toEqual({ name: 'cook' })
    expect(run(menu, 'back').screen).toEqual({ name: 'cook' })
    const stopped = run(menu, 'up', 'select')
    expect(stopped.cook).toBeNull()
    expect(stopped.screen).toEqual({ name: 'meat', focus: 0 })
  })

  it('starts a new cook with START once ready', () => {
    const s = run(cooking(), { type: 'tick', dtS: 1e9 }, 'back', 'select')
    expect(s.cook).toBeNull()
    expect(s.screen.name).toBe('meat')
  })

  it('ignores BACK on the cook screen', () => {
    const s = cooking()
    expect(reduce(s, { type: 'back' })).toBe(s)
    expect(reduce(s, { type: 'up' })).toBe(s)
  })
})
