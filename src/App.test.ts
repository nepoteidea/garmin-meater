import { fireEvent, render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.svelte'
import { readyAtS, removeAtS } from './lib/sim'

const display = () => screen.getByTestId('screen').firstElementChild as HTMLElement
const current = () => display().dataset.screen

async function key(k: string, times = 1) {
  for (let i = 0; i < times; i++) {
    await fireEvent.keyDown(window, { key: k })
  }
  await tick()
}

const wait = (ms: number) => vi.advanceTimersByTimeAsync(ms)

async function swipe(dx: number, dy: number) {
  const el = screen.getByTestId('screen')
  await fireEvent.pointerDown(el, { clientX: 200, clientY: 200 })
  await fireEvent.pointerUp(el, { clientX: 200 + dx, clientY: 200 + dy })
  await fireEvent.click(el)
}

/** Fresh page → found → connected → meat list. */
async function connect() {
  render(App)
  await wait(2200)
  expect(current()).toBe('found')
  await key('Enter')
  expect(current()).toBe('connected')
  await wait(1200)
  expect(current()).toBe('meat')
}

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('page', () => {
  it('is labelled as an unofficial concept', () => {
    render(App)
    expect(screen.getByText(/Unofficial concept prototype/)).toBeInTheDocument()
  })
})

describe('full flow with the keyboard', () => {
  it('connects, cooks, alerts, rests and is ready', async () => {
    const vibrate = vi.fn()
    vi.stubGlobal('navigator', { ...navigator, vibrate })

    await connect()
    expect(screen.getByText('Beef')).toBeInTheDocument()

    // Beef → Medium rare
    await key('Enter')
    expect(current()).toBe('doneness')
    await key('ArrowDown')
    expect(screen.getByText('Medium rare')).toBeInTheDocument()
    expect(screen.getByText('57°C')).toBeInTheDocument()
    await key('Enter')

    expect(screen.getByTestId('cook-estimating')).toBeInTheDocument()
    expect(screen.getByLabelText('Estimating')).toBeInTheDocument()

    // Run at 60× for 6 real seconds: 6 simulated minutes → ETA showing.
    await fireEvent.click(screen.getByRole('radio', { name: '60×' }))
    await wait(6000)
    expect(screen.getByTestId('cook-cooking')).toBeInTheDocument()
    expect(screen.getByText('Remove in')).toBeInTheDocument()
    expect(screen.getByText('Elapsed 6:00')).toBeInTheDocument()

    // Run through to the alert.
    await wait(((removeAtS(57) - 360) / 60) * 1000 + 500)
    expect(current()).toBe('alert')
    expect(screen.getByRole('alert')).toHaveTextContent(/REMOVE\s*FROM HEAT/)
    expect(vibrate).toHaveBeenCalledTimes(1)

    await key('Escape')
    expect(screen.getByTestId('cook-resting')).toBeInTheDocument()
    expect(screen.getByText('Internal still rising')).toBeInTheDocument()

    await wait(7000)
    expect(screen.getByTestId('cook-ready')).toBeInTheDocument()
    expect(vibrate).toHaveBeenCalledTimes(2)

    // START begins a new cook.
    await key('Enter')
    expect(current()).toBe('meat')
  })

  it('animates the matching hardware button on key presses', async () => {
    render(App)
    await key('ArrowUp')
    expect(screen.getByRole('button', { name: 'Up' })).toHaveClass('pressed')
    await wait(200)
    expect(screen.getByRole('button', { name: 'Up' })).not.toHaveClass('pressed')
  })

  it('ignores unrelated keys and Enter on demo controls', async () => {
    await connect()
    await key('a')
    expect(current()).toBe('meat')
    const restart = screen.getByRole('button', { name: 'Restart watch app' })
    await fireEvent.keyDown(restart, { key: 'Enter' })
    expect(current()).toBe('meat')
  })
})

describe('hardware buttons and touch', () => {
  it('drives the flow with the side buttons', async () => {
    await connect()
    const btn = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
    await btn('Down')
    await btn('Up')
    await btn('Start / Stop')
    expect(current()).toBe('doneness')
    await btn('Back')
    expect(current()).toBe('meat')
    await btn('Light')
    expect(current()).toBe('meat')
  })

  it('taps items and swipes to scroll and go back', async () => {
    await connect()
    await swipe(0, -80) // swipe up → next item
    expect(screen.getByRole('option', { selected: true })).toHaveTextContent('Pork')
    await swipe(0, 80) // swipe down → previous item
    expect(screen.getByRole('option', { selected: true })).toHaveTextContent('Beef')

    // Only the neighbours of the focused item are on screen.
    expect(screen.queryByRole('option', { name: /Chicken/ })).not.toBeInTheDocument()
    await swipe(0, -80)
    await fireEvent.click(screen.getByRole('option', { name: /Chicken/ }))
    expect(current()).toBe('doneness')
    // Chicken has exactly one option.
    expect(screen.getByText('74°C')).toBeInTheDocument()
    expect(screen.queryByText(/rare/i)).not.toBeInTheDocument()

    await swipe(100, 0) // swipe right → back
    expect(current()).toBe('meat')
    await swipe(-100, 0) // swipe left does nothing
    expect(current()).toBe('meat')

    // A short drag is a tap: selects the focused item.
    const el = screen.getByTestId('screen')
    await fireEvent.pointerDown(el, { clientX: 200, clientY: 200 })
    await fireEvent.pointerUp(el, { clientX: 205, clientY: 203 })
    await fireEvent.click(el)
    expect(current()).toBe('doneness')
  })

  it('a swipe over an item does not also pick it', async () => {
    await connect()
    const el = screen.getByTestId('screen')
    await fireEvent.pointerDown(el, { clientX: 200, clientY: 200 })
    await fireEvent.pointerUp(el, { clientX: 200, clientY: 100 })
    await fireEvent.click(screen.getByRole('option', { selected: true }))
    expect(current()).toBe('meat')
    expect(screen.getByRole('option', { selected: true })).toHaveTextContent('Pork')
  })

  it('taps through the connect and stop screens', async () => {
    localStorage.setItem('garmin-meater:probe', JSON.stringify({ name: 'MEATER #1', battery: 82 }))
    render(App)
    await fireEvent.click(screen.getByRole('button', { name: /Connect new probe/ }))
    await wait(2200)
    await fireEvent.click(screen.getByRole('button', { name: 'Connect' }))
    await wait(1200)
    await fireEvent.click(screen.getByRole('option', { name: /Pork/ }))
    await fireEvent.click(screen.getByRole('option', { name: /Well done/ }))
    expect(current()).toBe('cook')
    await fireEvent.click(screen.getByTestId('screen')) // tap → cook menu
    expect(current()).toBe('stop')
    await fireEvent.click(screen.getByRole('button', { name: 'Stop cook' }))
    expect(current()).toBe('meat')
  })
})

describe('probe memory', () => {
  it('offers the previously connected probe as Sync on reload', async () => {
    await connect()
    expect(JSON.parse(localStorage.getItem('garmin-meater:probe')!)).toMatchObject({ name: 'MEATER #1' })

    await fireEvent.click(screen.getByRole('button', { name: 'Restart watch app' }))
    expect(current()).toBe('home')
    expect(screen.getByRole('button', { name: /Sync MEATER #1/ })).toBeInTheDocument()

    await key('Enter')
    expect(screen.getByRole('status')).toHaveTextContent('Syncing MEATER #1…')
    await wait(2200)
    expect(current()).toBe('connected')
  })

  it('forgets the probe on request', async () => {
    await connect()
    await fireEvent.click(screen.getByRole('button', { name: 'Forget saved probe' }))
    expect(localStorage.getItem('garmin-meater:probe')).toBeNull()
    expect(current()).toBe('searching')
  })

  it('shows the error state when the probe is out of range', async () => {
    render(App)
    await fireEvent.click(screen.getByRole('checkbox', { name: /out of range/ }))
    await wait(2200)
    expect(current()).toBe('error')
    expect(screen.getByText('No probe found')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('checkbox', { name: /out of range/ }))
    await key('Enter')
    await wait(2200)
    expect(current()).toBe('found')
  })
})

describe('settings', () => {
  it('switches to °F and remembers it', async () => {
    await connect()
    await key('ArrowDown', 4)
    await key('Enter')
    expect(current()).toBe('settings')
    await key('ArrowDown')
    expect(screen.getByRole('radio', { name: '°F' })).toHaveAttribute('aria-checked', 'true')
    await key('Escape')
    expect(localStorage.getItem('garmin-meater:units')).toBe('F')

    await key('ArrowUp', 4)
    await key('Enter')
    expect(screen.getByText('135°F')).toBeInTheDocument() // Medium rare is 57°C

    await fireEvent.click(screen.getByRole('button', { name: 'Restart watch app' }))
    await key('ArrowDown', 2)
    await key('Enter')
    await fireEvent.click(screen.getByRole('radio', { name: '°C' }))
    expect(current()).toBe('home')
    expect(localStorage.getItem('garmin-meater:units')).toBe('C')
  })
})

describe('demo controls', () => {
  it('disables jump-to-alert until a cook is running', async () => {
    await connect()
    const jump = screen.getByRole('button', { name: 'Jump to remove-from-heat' })
    expect(jump).toBeDisabled()
    await key('Enter', 2)
    expect(jump).toBeEnabled()
    await fireEvent.click(jump, { detail: 1 })
    expect(current()).toBe('alert')
    expect(document.activeElement).not.toBe(jump)
    await fireEvent.click(screen.getByTestId('screen'))
    expect(screen.getByTestId('cook-resting')).toBeInTheDocument()
  })

  it('runs faster at 10× than 1×', async () => {
    await connect()
    await key('Enter', 2)
    await wait(10_000)
    expect(screen.getByText('Elapsed 0:10')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('radio', { name: '10×' }))
    await wait(10_000)
    expect(screen.getByText('Elapsed 1:50')).toBeInTheDocument()
  })

  it('keeps working without navigator.vibrate', async () => {
    vi.stubGlobal('navigator', { ...navigator, vibrate: () => { throw new Error('nope') } })
    await connect()
    await key('Enter', 2)
    await fireEvent.click(screen.getByRole('button', { name: 'Jump to remove-from-heat' }))
    expect(current()).toBe('alert')
    await wait(readyAtS(57) * 1000)
  })
})
