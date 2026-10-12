<script lang="ts" module>
  // Stroke icons from the design canvas. Decorative: labels always sit next to them.
  export type IconName =
    | 'beef'
    | 'pork'
    | 'chicken'
    | 'lamb'
    | 'settings'
    | 'probe'
    | 'check'
    | 'alert'
    | 'battery'
    | 'signal'
    | 'flame'
    | 'fork'
    | 'up'
    | 'bluetooth'
</script>

<script lang="ts">
  interface Props {
    name: IconName
    size?: number
    color?: string
    strokeWidth?: number
  }
  let { name, size = 32, color = 'currentColor', strokeWidth = 2 }: Props = $props()
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke={color}
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  {#if name === 'beef'}
    <path d="M4 14c0-6 5-10 11-10 4 0 6 3 6 6 0 5-5 10-11 10-3 0-6-2-6-6z" /><path d="M9 13c0-2 2-4 4-4" />
  {:else if name === 'pork'}
    <circle cx="12" cy="13" r="8" /><ellipse cx="12" cy="15" rx="3.5" ry="2.5" /><path d="M11 15h0M13 15h0" />
  {:else if name === 'chicken'}
    <path d="M15.5 3.5a5 5 0 0 1 0 7l-3 3-4-4 3-3a5 5 0 0 1 4-3z" /><path d="M8.5 9.5 5 13" /><path
      d="M5 13l-1.5 1.5a1.5 1.5 0 1 0 2 2 1.5 1.5 0 1 0 2 2L9 17"
    /><path d="M12.5 13.5 9 17" />
  {:else if name === 'lamb'}
    <path d="M5 20c-2-2-2-7 1-10 4-5 10-6 13-3s1 8-4 10c-3 1-5 0-6 1s-2 4-4 2z" /><circle cx="14" cy="10" r="2" />
  {:else if name === 'settings'}
    <circle cx="12" cy="12" r="3" /><path
      d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"
    />
  {:else if name === 'probe'}
    <path d="M12 2v13" /><circle cx="12" cy="18" r="3" /><path d="M8 6h8" />
  {:else if name === 'check'}
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  {:else if name === 'alert'}
    <circle cx="12" cy="12" r="10" /><path d="M12 7v6" /><path d="M12 16.5v.5" />
  {:else if name === 'battery'}
    <rect x="2" y="7" width="18" height="10" rx="2" /><path d="M22 11v2" /><path d="M5 10v4M8 10v4M11 10v4M14 10v4" />
  {:else if name === 'signal'}
    <path d="M4 20v-3M9 20v-7M14 20v-11M19 20V5" />
  {:else if name === 'flame'}
    <path d="M12 3c2 3 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1 1 2 2 3 4 0-3 0-5 0-7z" />
  {:else if name === 'fork'}
    <path d="M7 3v8a2 2 0 0 0 4 0V3M9 11v10M17 3c-2 1-3 4-3 7h3v11" />
  {:else if name === 'up'}
    <path d="M12 19V5M6 11l6-6 6 6" />
  {:else}
    <path d="M7 7l10 10-5 5V2l5 5L7 17" />
  {/if}
</svg>
