<script lang="ts">
  // Demo controls outside the watch: simulation speed, shortcuts and the input legend.
  import { SPEEDS, type Speed } from './config'

  interface Props {
    speed: Speed
    cooking: boolean
    outOfRange: boolean
    onspeed: (s: Speed) => void
    onjump: () => void
    onoutofrange: (v: boolean) => void
    onrestart: () => void
    onforget: () => void
  }
  let { speed, cooking, outOfRange, onspeed, onjump, onoutofrange, onrestart, onforget }: Props = $props()
</script>

<aside class="panel" aria-label="Demo controls">
  <section class="card">
    <h2 id="speed-label">Demo speed</h2>
    <div class="speeds" role="radiogroup" aria-labelledby="speed-label">
      {#each SPEEDS as s (s)}
        <button type="button" role="radio" aria-checked={speed === s} class:on={speed === s} onclick={() => onspeed(s)}>
          {s}×
        </button>
      {/each}
    </div>
    <button type="button" class="jump" disabled={!cooking} onclick={onjump}>Jump to remove-from-heat</button>
    {#if !cooking}<p class="note">Start a cook on the watch to use this.</p>{/if}
    <label class="check">
      <input type="checkbox" checked={outOfRange} onchange={(e) => onoutofrange(e.currentTarget.checked)} />
      Probe out of range (next search fails)
    </label>
    <div class="row">
      <button type="button" class="quiet" onclick={onrestart}>Restart watch app</button>
      <button type="button" class="quiet" onclick={onforget}>Forget saved probe</button>
    </div>
  </section>

  <section class="card">
    <h2>Controls</h2>
    <dl>
      <dt class="start">START · Enter</dt>
      <dd>Select · confirm · cook menu</dd>
      <dt>BACK · Esc</dt>
      <dd>Back · dismiss alert</dd>
      <dt>UP / DOWN · ↑ ↓</dt>
      <dd>Move selection</dd>
      <dt>Touch</dt>
      <dd>Tap · swipe up/down · swipe right = back</dd>
    </dl>
  </section>
</aside>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border-radius: 16px;
    background: var(--panel);
  }
  h2 {
    margin: 0;
    font-size: 14px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    font-weight: 600;
  }
  .speeds {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  button {
    min-height: 48px;
    border-radius: 12px;
    border: 0;
    cursor: pointer;
    font-weight: 600;
  }
  .speeds button {
    background: var(--panel-raised);
    font-size: 18px;
  }
  .speeds button.on {
    background: var(--cooking);
    color: #000;
  }
  .jump {
    background: transparent;
    border: 2px solid var(--remove);
    color: var(--remove);
    font-size: 17px;
  }
  .jump:disabled {
    border-color: var(--line);
    color: var(--dim);
    cursor: not-allowed;
  }
  .note {
    margin: -4px 0 0;
    font-size: 14px;
    color: var(--muted);
  }
  .check {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    font-size: 15px;
    cursor: pointer;
  }
  .check input {
    width: 20px;
    height: 20px;
    accent-color: var(--cooking);
  }
  .row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  .quiet {
    background: var(--panel-raised);
    font-size: 15px;
    font-weight: 500;
    padding: 0 8px;
  }
  dl {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    gap: 8px 12px;
    margin: 0;
    font-size: 15px;
  }
  dt {
    font-weight: 600;
  }
  dt.start {
    color: var(--cooking);
  }
  dd {
    margin: 0;
    color: var(--muted);
  }
</style>
