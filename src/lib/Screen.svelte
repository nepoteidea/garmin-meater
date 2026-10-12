<script lang="ts">
  // The 454×454 round display: renders whatever the state machine says is on screen.
  import CookView from './CookView.svelte'
  import FocusList, { type ListItem } from './FocusList.svelte'
  import Icon from './Icon.svelte'
  import Ring from './Ring.svelte'
  import { MEATS, PROBE, getMeat } from './config'
  import type { State } from './machine'
  import { formatTemp, type Snapshot } from './sim'

  interface Props {
    app: State
    snap: Snapshot | null
    alert: boolean
    onpick: (index: number) => void
  }
  let { app, snap, alert, onpick }: Props = $props()

  const screen = $derived(app.screen)
  const t = (c: number) => formatTemp(c, app.units)

  const meatItems: ListItem[] = [
    ...MEATS.map((m) => ({ label: m.label, icon: m.id })),
    { label: 'Settings', icon: 'settings' },
  ]

  function pick(e: MouseEvent, index: number) {
    e.stopPropagation()
    onpick(index)
  }
</script>

<div class="display" data-screen={alert ? 'alert' : screen.name}>
  {#if alert && app.cook && snap}
    <div class="alert" role="alert">
      <Icon name="flame" size={64} color="#000" strokeWidth={2.2} />
      <div class="alert-title">REMOVE<br />FROM HEAT</div>
      <div class="alert-line">Internal {t(snap.internalC)} · target {t(app.cook.targetC)}</div>
      <div class="alert-hint">BACK or tap to dismiss</div>
    </div>
  {:else if screen.name === 'home'}
    <div class="stack">
      <Icon name="probe" size={44} color="var(--cooking)" />
      <div class="eyebrow">PROBE</div>
      <button type="button" class="pill" class:on={screen.focus === 0} onclick={(e) => pick(e, 0)}>
        <span class="pill-main">Sync {app.savedProbe?.name}</span>
        <span class="pill-sub">Last used · {app.savedProbe?.battery}% battery</span>
      </button>
      <button type="button" class="pill short" class:on={screen.focus === 1} onclick={(e) => pick(e, 1)}>
        Connect new probe
      </button>
      <button type="button" class="link" class:on={screen.focus === 2} onclick={(e) => pick(e, 2)}>
        <Icon name="settings" size={20} />Settings
      </button>
    </div>
  {:else if screen.name === 'searching'}
    <Ring spin color="var(--cooking)" />
    <div class="stack">
      <div class="pulse-wrap">
        <div class="pulse"></div>
        <Icon name="bluetooth" size={56} color="var(--cooking)" />
      </div>
      <div class="title" role="status">{screen.sync ? `Syncing ${app.savedProbe?.name}…` : 'Searching…'}</div>
      <div class="hint">Take the probe out of its charger</div>
    </div>
  {:else if screen.name === 'found'}
    <div class="stack">
      <div class="eyebrow">PROBE FOUND</div>
      <div class="probe-name">{PROBE.name}</div>
      <div class="facts">
        <div><Icon name="battery" size={40} color="var(--ready)" /><b>{PROBE.battery}%</b><span>BATTERY</span></div>
        <div><Icon name="signal" size={40} color="var(--resting)" /><b>{PROBE.signal}</b><span>SIGNAL</span></div>
      </div>
      <button type="button" class="pill cta on" onclick={(e) => pick(e, 0)}>Connect</button>
    </div>
  {:else if screen.name === 'connected'}
    <Ring progress={1} color="var(--ready)" />
    <div class="stack">
      <div class="badge"><Icon name="check" size={64} color="#000" strokeWidth={3} /></div>
      <div class="title" role="status">Connected</div>
      <div class="hint">{app.savedProbe?.name} · {app.savedProbe?.battery}%</div>
    </div>
  {:else if screen.name === 'error'}
    <Ring dashed color="var(--remove)" />
    <div class="stack">
      <Icon name="alert" size={72} color="var(--remove)" />
      <div class="title" role="status">No probe found</div>
      <div class="hint">Check the probe is charged and within range</div>
      <button type="button" class="pill cta on" onclick={(e) => pick(e, 0)}>Retry</button>
    </div>
  {:else if screen.name === 'meat'}
    <FocusList title="Meat" accent={MEATS[screen.focus]?.accent ?? 'var(--cooking)'} items={meatItems} focus={screen.focus} {onpick} />
  {:else if screen.name === 'doneness'}
    {@const meat = getMeat(screen.meat)}
    {#if meat.doneness.length === 1}
      {@const only = meat.doneness[0]}
      <div class="stack" style:--accent={meat.accent}>
        <div class="eyebrow" style:color={meat.accent}>{meat.label.toUpperCase()}</div>
        <button type="button" class="single" onclick={(e) => pick(e, 0)}>
          <Icon name="check" size={40} color={meat.accent} />
          <span class="two-line"><span class="label">{only.label}</span><span class="num">{t(only.targetC)}{app.units}</span></span>
        </button>
        <div class="hint">Poultry is always cooked through</div>
        <div class="hint dim">START to begin cook</div>
      </div>
    {:else}
      <FocusList
        title="{meat.label} · Doneness"
        accent={meat.accent}
        items={meat.doneness.map((d) => ({ label: d.label, sub: `${t(d.targetC)}${app.units}` }))}
        focus={screen.focus}
        {onpick}
      />
    {/if}
  {:else if screen.name === 'settings'}
    <div class="stack">
      <div class="eyebrow">SETTINGS</div>
      <div class="title">Temperature</div>
      <div class="units" role="radiogroup" aria-label="Temperature units">
        <button type="button" role="radio" aria-checked={screen.focus === 0} class="unit" class:on={screen.focus === 0} onclick={(e) => pick(e, 0)}>°C</button>
        <button type="button" role="radio" aria-checked={screen.focus === 1} class="unit" class:on={screen.focus === 1} onclick={(e) => pick(e, 1)}>°F</button>
      </div>
      <div class="hint dim">UP/DOWN to switch · BACK to save</div>
    </div>
  {:else if screen.name === 'stop'}
    <div class="stack">
      <div class="title">Stop this cook?</div>
      <div class="hint">The probe stays connected</div>
      <div class="col">
        <button type="button" class="pill short danger" class:on={screen.focus === 0} onclick={(e) => pick(e, 0)}>Stop cook</button>
        <button type="button" class="pill short" class:on={screen.focus === 1} onclick={(e) => pick(e, 1)}>Keep cooking</button>
      </div>
    </div>
  {:else if screen.name === 'cook' && app.cook && snap}
    <CookView cook={app.cook} {snap} units={app.units} />
  {/if}
</div>

<style>
  .display {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    overflow: hidden;
    background: var(--black);
    color: var(--text);
    user-select: none;
    -webkit-user-select: none;
  }
  .stack {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    text-align: center;
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 6px;
  }
  .eyebrow {
    font-size: 20px;
    color: var(--muted);
    letter-spacing: 0.1em;
  }
  .title {
    font-size: 34px;
    font-weight: 600;
  }
  .hint {
    font-size: 20px;
    color: var(--muted);
    width: 290px;
  }
  .dim {
    font-size: 18px;
    color: var(--dim);
  }
  button {
    border: 0;
    background: none;
    cursor: pointer;
    padding: 0;
  }
  .pill {
    width: 330px;
    height: 92px;
    border-radius: 46px;
    border: 2px solid var(--line);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 500;
  }
  .pill.short {
    width: 300px;
    height: 68px;
    border-radius: 34px;
  }
  .pill.on {
    background: var(--cooking);
    border-color: var(--cooking);
    color: #000;
    font-weight: 600;
  }
  .pill.danger {
    color: var(--remove);
    border-color: var(--line);
  }
  .pill.danger.on {
    background: var(--focus);
    border: 3px solid var(--remove);
    color: var(--remove);
  }
  .pill.cta {
    width: 240px;
    height: 72px;
    border-radius: 36px;
    font-size: 28px;
  }
  .pill-main {
    font-size: 30px;
    font-weight: 600;
  }
  .pill-sub {
    font-size: 18px;
    font-weight: 500;
  }
  .link {
    height: 44px;
    padding: 0 16px;
    border-radius: 22px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 18px;
    color: var(--muted);
  }
  .link.on {
    color: var(--text);
    background: var(--focus);
    box-shadow: inset 0 0 0 2px var(--cooking);
  }
  .pulse-wrap {
    position: relative;
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .pulse {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 3px solid var(--cooking);
    animation: pulse 1.8s ease-out infinite;
  }
  @keyframes pulse {
    from {
      transform: scale(0.6);
      opacity: 0.9;
    }
    to {
      transform: scale(1.6);
      opacity: 0;
    }
  }
  .probe-name {
    font-family: var(--font-num);
    font-size: 52px;
    font-weight: 700;
    line-height: 1;
  }
  .facts {
    display: flex;
    gap: 36px;
  }
  .facts div {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .facts b {
    font-family: var(--font-num);
    font-size: 32px;
    font-weight: 600;
  }
  .facts span {
    font-size: 16px;
    color: var(--muted);
    letter-spacing: 0.08em;
  }
  .badge {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: var(--ready);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .single {
    width: 340px;
    height: 128px;
    border-radius: 64px;
    background: var(--focus);
    border: 3px solid var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 18px;
  }
  .two-line {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .label {
    font-size: 34px;
    font-weight: 600;
    line-height: 1.1;
  }
  .num {
    font-family: var(--font-num);
    font-size: 40px;
    font-weight: 700;
    line-height: 1;
  }
  .units {
    display: flex;
    gap: 12px;
  }
  .unit {
    width: 140px;
    height: 96px;
    border-radius: 48px;
    border: 2px solid var(--line);
    color: var(--dim);
    font-family: var(--font-num);
    font-size: 48px;
    font-weight: 700;
  }
  .unit.on {
    border: 3px solid var(--cooking);
    background: var(--focus);
    color: var(--text);
  }
  .alert {
    position: absolute;
    inset: 0;
    background: var(--remove);
    color: #000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    animation: throb 1s ease-in-out infinite;
  }
  @keyframes throb {
    0%,
    100% {
      box-shadow: inset 0 0 0 0 rgb(0 0 0 / 0);
    }
    50% {
      box-shadow: inset 0 0 0 26px rgb(0 0 0 / 0.35);
    }
  }
  .alert-title {
    font-family: var(--font-num);
    font-weight: 700;
    font-size: 76px;
    line-height: 0.9;
    text-align: center;
  }
  .alert-line {
    font-size: 24px;
    font-weight: 600;
    margin-top: 8px;
  }
  .alert-hint {
    margin-top: 14px;
    height: 52px;
    padding: 0 26px;
    border-radius: 26px;
    background: #000;
    color: #fff;
    font-size: 22px;
    font-weight: 600;
    display: flex;
    align-items: center;
  }
</style>
