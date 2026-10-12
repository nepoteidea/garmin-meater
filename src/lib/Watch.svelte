<script lang="ts" module>
  export type HwButton = 'light' | 'up' | 'down' | 'start' | 'back'
</script>

<script lang="ts">
  // Generic round watch case with five side buttons. The 600×600 frame is laid
  // out in fixed px and scaled to the available width.
  import Screen from './Screen.svelte'
  import type { State } from './machine'
  import type { Snapshot } from './sim'

  interface Props {
    app: State
    snap: Snapshot | null
    alert: boolean
    /** Briefly true when the watch vibrates. */
    buzzing: boolean
    /** Hardware button currently shown pressed (keyboard presses animate it too). */
    pressed: HwButton | null
    onbutton: (b: HwButton) => void
    onpick: (index: number) => void
    onswipe: (dir: 'up' | 'down' | 'right') => void
    ontap: () => void
  }
  let { app, snap, alert, buzzing, pressed, onbutton, onpick, onswipe, ontap }: Props = $props()

  const FRAME = 600
  let width = $state(FRAME)
  // clientWidth is 0 before layout (and in jsdom); render at full size until measured.
  const scale = $derived(width > 0 ? Math.min(1, width / FRAME) : 1)

  const buttons: { id: HwButton; label: string; x: number; y: number; angle: number; side: 'l' | 'r' }[] = [
    { id: 'light', label: 'LIGHT', x: 50, y: 135, angle: 30, side: 'l' },
    { id: 'up', label: 'UP', x: 13, y: 274, angle: 0, side: 'l' },
    { id: 'down', label: 'DOWN', x: 50, y: 413, angle: -30, side: 'l' },
    { id: 'start', label: 'START', x: 532, y: 135, angle: -30, side: 'r' },
    { id: 'back', label: 'BACK', x: 532, y: 413, angle: 30, side: 'r' },
  ]
  const ariaLabels: Record<HwButton, string> = {
    light: 'Light',
    up: 'Up',
    down: 'Down',
    start: 'Start / Stop',
    back: 'Back',
  }

  // Touch gestures on the display: swipe up/down scrolls, swipe right goes back.
  let start: { x: number; y: number } | null = null
  let swiped = false
  const SWIPE_PX = 40

  function pointerdown(e: PointerEvent) {
    start = { x: e.clientX, y: e.clientY }
    swiped = false
  }
  function pointerup(e: PointerEvent) {
    if (!start) return
    const dx = (e.clientX - start.x) / scale
    const dy = (e.clientY - start.y) / scale
    start = null
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_PX) return
    swiped = true
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) onswipe('right')
    } else {
      onswipe(dy < 0 ? 'up' : 'down')
    }
  }
  function click() {
    if (swiped) {
      swiped = false
      return
    }
    ontap()
  }
  function pick(index: number) {
    if (swiped) {
      swiped = false
      return
    }
    onpick(index)
  }

  let lit = $state(false)
  let litTimer: ReturnType<typeof setTimeout> | undefined
  $effect(() => {
    if (pressed === 'light') {
      lit = true
      clearTimeout(litTimer)
      litTimer = setTimeout(() => (lit = false), 1500)
    }
  })
</script>

<div class="fit" bind:clientWidth={width}>
  <div class="sizer" style:height="{FRAME * scale}px">
    <div class="frame" class:buzzing style:transform="scale({scale})">
      {#each buttons as b (b.id)}
        <button
          type="button"
          class="hw {b.id}"
          class:pressed={pressed === b.id}
          aria-label={ariaLabels[b.id]}
          style:left="{b.x}px"
          style:top="{b.y}px"
          style:--angle="{b.angle}deg"
          onclick={() => onbutton(b.id)}
        ></button>
        <span
          class="hw-label"
          class:start={b.id === 'start'}
          style:top="{b.y + 18}px"
          style:right={b.side === 'l' ? `${FRAME - b.x + 8}px` : undefined}
          style:left={b.side === 'r' ? `${b.x + 26}px` : undefined}
          aria-hidden="true"
        >
          {b.label}
        </span>
      {/each}
      <div class="case"></div>
      <div class="bezel"></div>
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions (keyboard has global ↑ ↓ Enter Esc) -->
      <div
        class="screen"
        class:lit
        data-testid="screen"
        onpointerdown={pointerdown}
        onpointerup={pointerup}
        onpointercancel={() => (start = null)}
        onclick={click}
      >
        <Screen {app} {snap} {alert} onpick={pick} />
      </div>
    </div>
  </div>
</div>

<style>
  .fit {
    width: 100%;
  }
  .sizer {
    position: relative;
  }
  .frame {
    position: absolute;
    top: 0;
    left: 50%;
    width: 600px;
    height: 600px;
    margin-left: -300px;
    transform-origin: 50% 0;
  }
  .frame.buzzing {
    animation: buzz 0.12s linear infinite;
  }
  @keyframes buzz {
    0%,
    100% {
      translate: 0 0;
    }
    25% {
      translate: -3px 1px;
    }
    75% {
      translate: 3px -1px;
    }
  }
  .case {
    position: absolute;
    left: 30px;
    top: 30px;
    width: 540px;
    height: 540px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #4a4c51, #1e1f22 70%);
    box-shadow:
      0 30px 60px rgb(0 0 0 / 0.6),
      inset 0 0 0 2px #55575d;
  }
  .bezel {
    position: absolute;
    left: 53px;
    top: 53px;
    width: 494px;
    height: 494px;
    border-radius: 50%;
    background: #0a0a0a;
    box-shadow: inset 0 0 0 3px #2a2b2e;
  }
  .screen {
    position: absolute;
    left: 73px;
    top: 73px;
    width: 454px;
    height: 454px;
    border-radius: 50%;
    overflow: hidden;
    touch-action: none;
    cursor: pointer;
    transition: filter 0.3s;
  }
  .screen.lit {
    filter: brightness(1.25);
  }
  .hw {
    position: absolute;
    width: 18px;
    height: 52px;
    border-radius: 9px;
    border: 0;
    padding: 0;
    background: linear-gradient(90deg, #3a3b3f, #6a6c72);
    transform: rotate(var(--angle));
    cursor: pointer;
    transition: translate 0.08s;
  }
  .hw.start {
    background: linear-gradient(90deg, #8a4a16, #ff8a1f);
  }
  /* Pressed buttons sink into the case. */
  .hw.light.pressed,
  .hw.up.pressed,
  .hw.down.pressed,
  .hw.light:active,
  .hw.up:active,
  .hw.down:active {
    translate: 5px 0;
  }
  .hw.start.pressed,
  .hw.back.pressed,
  .hw.start:active,
  .hw.back:active {
    translate: -5px 0;
  }
  .hw.light.pressed,
  .hw.light:active {
    translate: 4px 3px;
  }
  .hw.down.pressed,
  .hw.down:active {
    translate: 4px -3px;
  }
  .hw.start.pressed,
  .hw.start:active {
    translate: -4px 3px;
  }
  .hw.back.pressed,
  .hw.back:active {
    translate: -4px -3px;
  }
  .hw-label {
    position: absolute;
    font-size: 13px;
    letter-spacing: 0.1em;
    color: #8a8a8a;
    white-space: nowrap;
    pointer-events: none;
  }
  .hw-label.start {
    color: var(--cooking);
  }
  /* Labels sit outside the frame; on narrow screens there is no room for them. */
  @media (max-width: 899px) {
    .hw-label {
      display: none;
    }
  }
</style>
