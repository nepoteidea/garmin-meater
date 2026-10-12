// Screen state machine for the watch app. `reduce` is pure: timers, storage
// and vibration live in the UI layer and feed events in.
import { MEATS, PROBE, getMeat, type MeatId } from './config'
import { readyAtS, removeAtS, type Units } from './sim'

export interface Probe {
  name: string
  battery: number
}

export type Screen =
  | { name: 'home'; focus: number } // a probe was connected before: Sync / Connect new / Settings
  | { name: 'searching'; sync: boolean }
  | { name: 'found' }
  | { name: 'connected' }
  | { name: 'error'; sync: boolean }
  | { name: 'meat'; focus: number } // the 4 meats, then Settings
  | { name: 'doneness'; meat: MeatId; focus: number }
  | { name: 'cook' }
  | { name: 'stop'; focus: number } // 0 = Stop cook, 1 = Keep cooking
  | { name: 'settings'; focus: number; back: Screen } // 0 = °C, 1 = °F

export interface Cook {
  meat: MeatId
  donenessId: string
  targetC: number
  elapsedS: number
  alertDismissed: boolean
}

export interface State {
  screen: Screen
  savedProbe: Probe | null
  units: Units
  cook: Cook | null
}

export type Event =
  | { type: 'up' }
  | { type: 'down' }
  | { type: 'select' }
  | { type: 'back' }
  /** Touch: tap a specific item, which focuses and selects it. */
  | { type: 'pick'; index: number }
  | { type: 'searchDone'; found: boolean }
  | { type: 'connectedDone' }
  | { type: 'tick'; dtS: number }
  | { type: 'jumpToRemove' }

export const HOME_ITEMS = 3
export const MEAT_ITEMS = MEATS.length + 1 // + Settings
export const SETTINGS_INDEX = MEATS.length

export function initialState(savedProbe: Probe | null, units: Units = 'C'): State {
  return {
    screen: savedProbe ? { name: 'home', focus: 0 } : { name: 'searching', sync: false },
    savedProbe,
    units,
    cook: null,
  }
}

/** True once the cook has passed "remove from heat" and the alert is still up. */
export function alertActive(state: State): boolean {
  const { cook } = state
  return !!cook && !cook.alertDismissed && cook.elapsedS >= removeAtS(cook.targetC)
}

const clamp = (n: number, max: number) => Math.max(0, Math.min(max - 1, n))

function itemCount(screen: Screen): number {
  switch (screen.name) {
    case 'home':
      return HOME_ITEMS
    case 'meat':
      return MEAT_ITEMS
    case 'doneness':
      return getMeat(screen.meat).doneness.length
    case 'stop':
    case 'settings':
      return 2
    default:
      return 0
  }
}

function move(state: State, delta: number): State {
  const { screen } = state
  if (!('focus' in screen)) return state
  const focus = clamp(screen.focus + delta, itemCount(screen))
  if (screen.name === 'settings') {
    return { ...state, screen: { ...screen, focus }, units: focus === 0 ? 'C' : 'F' }
  }
  return focus === screen.focus ? state : { ...state, screen: { ...screen, focus } }
}

const to = (state: State, screen: Screen): State => ({ ...state, screen })

/** Where BACK goes from the connect flow and the meat list. */
const connectStart = (state: State): Screen =>
  state.savedProbe ? { name: 'home', focus: 0 } : { name: 'searching', sync: false }

const openSettings = (state: State): State =>
  to(state, { name: 'settings', focus: state.units === 'C' ? 0 : 1, back: state.screen })

function select(state: State): State {
  const { screen } = state
  switch (screen.name) {
    case 'home':
      if (screen.focus === 0) return to(state, { name: 'searching', sync: true })
      if (screen.focus === 1) return to(state, { name: 'searching', sync: false })
      return openSettings(state)
    case 'found':
      return { ...state, screen: { name: 'connected' }, savedProbe: { name: PROBE.name, battery: PROBE.battery } }
    case 'error':
      return to(state, { name: 'searching', sync: screen.sync })
    case 'meat':
      if (screen.focus === SETTINGS_INDEX) return openSettings(state)
      return to(state, { name: 'doneness', meat: MEATS[screen.focus].id, focus: 0 })
    case 'doneness': {
      const d = getMeat(screen.meat).doneness[screen.focus]
      return {
        ...state,
        screen: { name: 'cook' },
        cook: { meat: screen.meat, donenessId: d.id, targetC: d.targetC, elapsedS: 0, alertDismissed: false },
      }
    }
    case 'cook':
      // Once the meat is ready START begins a new cook; before that it opens the stop menu.
      if (state.cook && state.cook.elapsedS >= readyAtS(state.cook.targetC)) {
        return { ...state, cook: null, screen: { name: 'meat', focus: 0 } }
      }
      return to(state, { name: 'stop', focus: 1 })
    case 'stop':
      if (screen.focus === 0) return { ...state, cook: null, screen: { name: 'meat', focus: 0 } }
      return to(state, { name: 'cook' })
    case 'settings':
      return to(state, screen.back)
    default:
      return state
  }
}

function back(state: State): State {
  const { screen } = state
  switch (screen.name) {
    case 'searching':
      return state.savedProbe ? to(state, connectStart(state)) : state
    case 'found':
    case 'error':
    case 'meat':
      return to(state, connectStart(state))
    case 'doneness':
      return to(state, { name: 'meat', focus: MEATS.findIndex((m) => m.id === screen.meat) })
    case 'stop':
      return to(state, { name: 'cook' })
    case 'settings':
      return to(state, screen.back)
    default:
      return state
  }
}

export function reduce(state: State, event: Event): State {
  // The remove-from-heat alert sits on top of every screen until dismissed.
  if (alertActive(state) && ['select', 'back', 'pick'].includes(event.type)) {
    return { ...state, cook: { ...state.cook!, alertDismissed: true }, screen: { name: 'cook' } }
  }

  switch (event.type) {
    case 'up':
      return move(state, -1)
    case 'down':
      return move(state, 1)
    case 'select':
      return select(state)
    case 'back':
      return back(state)
    case 'pick': {
      const { screen } = state
      if (!('focus' in screen)) return select(state)
      const moved = move(state, event.index - screen.focus)
      return select(moved)
    }
    case 'searchDone':
      if (state.screen.name !== 'searching') return state
      if (!event.found) return to(state, { name: 'error', sync: state.screen.sync })
      return state.screen.sync ? to(state, { name: 'connected' }) : to(state, { name: 'found' })
    case 'connectedDone':
      return state.screen.name === 'connected' ? to(state, { name: 'meat', focus: 0 }) : state
    case 'tick': {
      const { cook } = state
      if (!cook) return state
      const elapsedS = Math.min(cook.elapsedS + event.dtS, readyAtS(cook.targetC))
      return elapsedS === cook.elapsedS ? state : { ...state, cook: { ...cook, elapsedS } }
    }
    case 'jumpToRemove': {
      const { cook } = state
      if (!cook) return state
      const elapsedS = removeAtS(cook.targetC)
      return { ...state, screen: { name: 'cook' }, cook: { ...cook, elapsedS, alertDismissed: false } }
    }
  }
}
