<script lang="ts">
  // Progress ring around the bezel of the 454×454 screen.
  interface Props {
    progress?: number
    color: string
    /** Indeterminate spinner instead of a fill. */
    spin?: boolean
    dashed?: boolean
  }
  let { progress = 0, color, spin = false, dashed = false }: Props = $props()

  const R = 215
  const C = 2 * Math.PI * R
  const p = $derived(Math.max(0, Math.min(1, progress)))
</script>

<svg class="ring" viewBox="0 0 454 454" aria-hidden="true">
  <circle cx="227" cy="227" r={R} stroke="var(--track)" />
  {#if spin}
    <circle class="spin" cx="227" cy="227" r={R} stroke={color} stroke-dasharray="220 {C - 220}" />
  {:else if dashed}
    <circle cx="227" cy="227" r={R} stroke={color} stroke-dasharray="10 18" />
  {:else if p > 0}
    <circle
      data-testid="ring-fill"
      cx="227"
      cy="227"
      r={R}
      stroke={color}
      stroke-linecap="round"
      stroke-dasharray={C}
      stroke-dashoffset={C * (1 - p)}
      transform="rotate(-90 227 227)"
    />
  {/if}
</svg>

<style>
  .ring {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  circle {
    fill: none;
    stroke-width: 14;
    transition: stroke-dashoffset 0.4s linear;
  }
  .spin {
    transform-origin: 227px 227px;
    animation: spin 1.6s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
