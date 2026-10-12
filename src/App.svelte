<script lang="ts">
  import DemoPanel from './lib/DemoPanel.svelte'
  import Watch, { type HwButton } from './lib/Watch.svelte'
  import type { Speed } from './lib/config'
  import { alertActive, initialState, reduce, type Event } from './lib/machine'
  import { readyAtS, snapshot, type CookPhase } from './lib/sim'
  import { loadProbe, loadUnits, saveProbe, saveUnits } from './lib/storage'

  const SEARCH_MS = 2200
  const CONNECTED_MS = 1200
  const TICK_MS = 250
  const PRESS_MS = 150

  let app = $state(initialState(loadProbe(), loadUnits()))
  let speed = $state<Speed>(1)
  let outOfRange = $state(false)
  let pressed = $state<HwButton | null>(null)
  let buzzing = $state(false)

  const dispatch = (e: Event) => (app = reduce(app, e))

  const snap = $derived(app.cook ? snapshot(app.cook.targetC, app.cook.elapsedS) : null)
  const alert = $derived(alertActive(app))
  const running = $derived(!!app.cook && app.cook.elapsedS < readyAtS(app.cook.targetC))

  $effect(() => saveProbe(app.savedProbe))
  $effect(() => saveUnits(app.units))

  // Fake Bluetooth: searching and the "Connected ✓" confirmation resolve on a timer.
  $effect(() => {
    const { name } = app.screen
    if (name !== 'searching' && name !== 'connected') return
    const id =
      name === 'searching'
        ? setTimeout(() => dispatch({ type: 'searchDone', found: !outOfRange }), SEARCH_MS)
        : setTimeout(() => dispatch({ type: 'connectedDone' }), CONNECTED_MS)
    return () => clearTimeout(id)
  })

  // Advance the simulated cook by real time × demo speed.
  $effect(() => {
    if (!running) return
    let last = Date.now()
    const id = setInterval(() => {
      const now = Date.now()
      dispatch({ type: 'tick', dtS: ((now - last) / 1000) * speed })
      last = now
    }, TICK_MS)
    return () => clearInterval(id)
  })

  // Buzz on the remove-from-heat alert and again when the meat is ready to eat.
  let buzzTimer: ReturnType<typeof setTimeout> | undefined
  function buzz(pattern: number[]) {
    try {
      navigator.vibrate?.(pattern)
    } catch {
      // Vibration is a nice-to-have; the visual pulse still runs.
    }
    buzzing = true
    clearTimeout(buzzTimer)
    buzzTimer = setTimeout(() => (buzzing = false), pattern.reduce((a, b) => a + b, 0))
  }
  let prevAlert = false
  let prevPhase: CookPhase | undefined
  $effect(() => {
    if (alert && !prevAlert) buzz([400, 200, 400, 200, 400])
    else if (snap?.phase === 'ready' && prevPhase === 'resting') buzz([200, 100, 200])
    prevAlert = alert
    prevPhase = snap?.phase
  })

  let pressTimer: ReturnType<typeof setTimeout> | undefined
  function press(b: HwButton) {
    pressed = b
    clearTimeout(pressTimer)
    pressTimer = setTimeout(() => (pressed = null), PRESS_MS)
    if (b === 'light') return
    dispatch({ type: b === 'start' ? 'select' : b })
  }

  const KEYS: Record<string, HwButton> = { ArrowUp: 'up', ArrowDown: 'down', Enter: 'start', Escape: 'back' }
  function onkeydown(e: KeyboardEvent) {
    const b = KEYS[e.key]
    // Enter on a focused demo control activates that control instead.
    if (!b || (e.key === 'Enter' && (e.target as Element).closest?.('.demo'))) return
    e.preventDefault()
    press(b)
  }

  const swipeEvents = { up: 'down', down: 'up', right: 'back' } as const

  function restart() {
    app = initialState(loadProbe(), app.units)
  }
  function forget() {
    saveProbe(null)
    app = initialState(null, app.units)
  }
</script>

<svelte:window {onkeydown} />

<div class="page">
  <header>
    <h1>Grill Watch</h1>
    <p>A wrist companion for a wireless meat probe</p>
  </header>

  <main class="layout">
    <div class="watch">
      <Watch
        {app}
        {snap}
        {alert}
        {buzzing}
        {pressed}
        onbutton={press}
        onpick={(index) => dispatch({ type: 'pick', index })}
        onswipe={(dir) => dispatch({ type: swipeEvents[dir] })}
        ontap={() => dispatch({ type: 'select' })}
      />
    </div>
    <!-- After a mouse click, hand the keyboard back to the watch (keyboard focus is kept). -->
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="demo" onclick={(e) => e.detail > 0 && (e.target as Element).closest('button')?.blur()}>
      <DemoPanel
        {speed}
        cooking={!!app.cook}
        {outOfRange}
        onspeed={(s) => (speed = s)}
        onjump={() => dispatch({ type: 'jumpToRemove' })}
        onoutofrange={(v) => (outOfRange = v)}
        onrestart={restart}
        onforget={forget}
      />
    </div>
  </main>

  <footer>Unofficial concept prototype · not affiliated with any watch or probe maker</footer>
</div>

<style>
  .page {
    min-height: 100vh;
    min-height: 100dvh;
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }
  header {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  h1 {
    margin: 0;
    font-family: var(--font-num);
    font-size: 30px;
    font-weight: 700;
  }
  header p {
    margin: 0;
    font-size: 15px;
    color: var(--muted);
  }
  .layout {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .watch {
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
  }
  footer {
    margin-top: auto;
    font-size: 13px;
    color: #8a8a8a;
    text-align: center;
  }

  @media (min-width: 900px) {
    .page {
      padding: 32px;
      gap: 24px;
    }
    header {
      flex-direction: row;
      align-items: baseline;
      gap: 16px;
    }
    h1 {
      font-size: 36px;
    }
    header p {
      font-size: 16px;
    }
    .layout {
      flex-direction: row;
      align-items: center;
      gap: 32px;
    }
    .watch {
      flex: 1 1 auto;
      max-width: 600px;
      /* Room for the button labels outside the case. */
      padding: 0 64px;
      box-sizing: content-box;
    }
    .demo {
      flex: 0 0 320px;
    }
  }
</style>
