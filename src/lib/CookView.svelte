<script lang="ts">
  // Screen 4: the live cook (estimating → cooking → resting → ready).
  import Icon from './Icon.svelte'
  import Ring from './Ring.svelte'
  import { getMeat } from './config'
  import type { Cook } from './machine'
  import { formatClock, formatEta, formatTemp, type Snapshot, type Units } from './sim'

  interface Props {
    cook: Cook
    snap: Snapshot
    units: Units
  }
  let { cook, snap, units }: Props = $props()

  const meat = $derived(getMeat(cook.meat))
  const doneness = $derived(meat.doneness.find((d) => d.id === cook.donenessId)!)
  const tag = $derived(`${meat.label} · ${doneness.label.replace('Medium', 'Med')}`)
  const eta = $derived(snap.etaS === null ? null : formatEta(snap.etaS))
  const t = (c: number) => formatTemp(c, units)
</script>

{#if snap.phase === 'ready'}
  <Ring progress={1} color="var(--ready)" />
  <div class="center ready" data-testid="cook-ready">
    <Icon name="fork" size={64} color="var(--ready)" />
    <div class="headline">READY<br />TO EAT</div>
    <div class="line">{meat.label} · {doneness.label} · {t(cook.targetC)}</div>
    <div class="small">Total {formatClock(snap.elapsedS)} · START for new cook</div>
  </div>
{:else if snap.phase === 'resting'}
  <Ring progress={snap.progress} color="var(--resting)" />
  <div class="center" data-testid="cook-resting">
    <div class="tag" style:color="var(--resting)">RESTING</div>
    <div class="caption">Ready in</div>
    <div class="hero">{formatClock(snap.restLeftS ?? 0)}</div>
    <div class="rising">
      <span class="stat" style:color="var(--resting)">{t(snap.internalC)}</span>
      <Icon name="up" size={24} color="var(--resting)" strokeWidth={2.4} />
      <span class="of">/ {t(cook.targetC)}</span>
    </div>
    <div class="small">Internal still rising</div>
  </div>
{:else}
  {@const estimating = snap.phase === 'estimating'}
  <Ring progress={snap.progress} color={estimating ? 'var(--estimating)' : 'var(--cooking)'} />
  <div class="center" data-testid={estimating ? 'cook-estimating' : 'cook-cooking'}>
    <div class="tag" style:color={meat.accent}>{tag}</div>
    {#if eta}
      <div class="caption">Remove in</div>
      <div class="hero">{eta.value}<span class="unit">{eta.unit}</span></div>
    {:else}
      <div class="caption">Estimating</div>
      <div class="hero dots" aria-label="Estimating"><span>•</span><span>•</span><span>•</span></div>
    {/if}
    <div class="stats">
      <div><span class="stat" style:color="var(--cooking)">{t(snap.internalC)}</span><span class="lbl">INTERNAL</span></div>
      <div><span class="stat">{t(snap.targetC)}</span><span class="lbl">TARGET</span></div>
      <div><span class="stat">{t(snap.ambientC)}</span><span class="lbl">AMBIENT</span></div>
    </div>
    <div class="small">Elapsed {formatClock(snap.elapsedS)}</div>
  </div>
{/if}

<style>
  .center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }
  .tag {
    font-size: 20px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .caption {
    font-size: 22px;
    color: var(--muted);
    margin-top: 6px;
  }
  .hero {
    font-family: var(--font-num);
    font-weight: 700;
    font-size: 128px;
    line-height: 0.9;
    font-variant-numeric: tabular-nums;
  }
  .unit {
    font-size: 44px;
    font-weight: 600;
    color: var(--muted);
    margin-left: 6px;
  }
  .dots {
    display: flex;
    gap: 14px;
    color: var(--estimating);
  }
  .dots span {
    animation: blink 1.2s ease-in-out infinite;
  }
  .dots span:nth-child(2) {
    animation-delay: 0.2s;
  }
  .dots span:nth-child(3) {
    animation-delay: 0.4s;
  }
  @keyframes blink {
    0%,
    100% {
      opacity: 0.25;
    }
    50% {
      opacity: 1;
    }
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
    margin-top: 14px;
    text-align: center;
  }
  .stats div {
    display: flex;
    flex-direction: column;
  }
  .stat {
    font-family: var(--font-num);
    font-weight: 600;
    font-size: 40px;
    font-variant-numeric: tabular-nums;
  }
  .lbl {
    font-size: 16px;
    color: var(--muted);
    letter-spacing: 0.08em;
  }
  .small {
    font-size: 18px;
    color: var(--muted);
    margin-top: 12px;
  }
  .rising {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-top: 14px;
  }
  .rising .stat {
    font-size: 48px;
  }
  .of {
    font-family: var(--font-num);
    font-weight: 600;
    font-size: 32px;
    color: var(--muted);
  }
  .ready {
    gap: 8px;
  }
  .headline {
    font-family: var(--font-num);
    font-weight: 700;
    font-size: 80px;
    line-height: 0.9;
    color: var(--ready);
    text-align: center;
  }
  .line {
    font-size: 24px;
    font-weight: 600;
    margin-top: 6px;
  }
  .ready .small {
    margin-top: 0;
  }
</style>
