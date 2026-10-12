<script lang="ts" module>
  import type { IconName } from './Icon.svelte'

  export interface ListItem {
    label: string
    /** Second line, e.g. the target temperature. */
    sub?: string
    icon?: IconName
  }
</script>

<script lang="ts">
  // Vertical list with one item focused at a time; the neighbours peek above and below.
  import Icon from './Icon.svelte'

  interface Props {
    title: string
    accent: string
    items: ListItem[]
    focus: number
    onpick: (index: number) => void
  }
  let { title, accent, items, focus, onpick }: Props = $props()

  const prev = $derived(focus > 0 ? items[focus - 1] : null)
  const current = $derived(items[focus])
  const next = $derived(focus < items.length - 1 ? items[focus + 1] : null)

  function pick(e: MouseEvent, index: number) {
    e.stopPropagation()
    onpick(index)
  }
</script>

<div class="list" role="listbox" aria-label={title} style:--accent={accent}>
  <div class="title">{title}</div>

  <div class="items">
    {#if prev}
      <button type="button" class="peek" role="option" aria-selected="false" onclick={(e) => pick(e, focus - 1)}>
        {#if prev.icon}<Icon name={prev.icon} size={30} />{/if}
        <span class="peek-text"><span>{prev.label}</span>{#if prev.sub}<small>{prev.sub}</small>{/if}</span>
      </button>
    {:else}
      <div class="peek" aria-hidden="true"></div>
    {/if}

    <button type="button" class="focused" role="option" aria-selected="true" onclick={(e) => pick(e, focus)}>
      {#if current.icon}<Icon name={current.icon} size={current.sub ? 40 : 52} color={accent} />{/if}
      {#if current.sub}
        <span class="two-line"><span class="label">{current.label}</span><span class="num">{current.sub}</span></span>
      {:else}
        <span class="big">{current.label}</span>
      {/if}
    </button>

    {#if next}
      <button type="button" class="peek" role="option" aria-selected="false" onclick={(e) => pick(e, focus + 1)}>
        {#if next.icon}<Icon name={next.icon} size={30} />{/if}
        <span class="peek-text"><span>{next.label}</span>{#if next.sub}<small>{next.sub}</small>{/if}</span>
      </button>
    {:else}
      <div class="peek" aria-hidden="true"></div>
    {/if}
  </div>

  {#if items.length > 1}
    <div class="dots" aria-hidden="true">
      {#each items as _, i (i)}
        <span class:on={i === focus}></span>
      {/each}
    </div>
  {/if}
</div>

<style>
  .list {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .title {
    position: absolute;
    top: 40px;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 20px;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--accent);
    text-transform: uppercase;
  }
  .items {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  button {
    border: 0;
    background: none;
    cursor: pointer;
    padding: 0;
  }
  .peek {
    height: 56px;
    min-width: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: var(--dim);
    font-size: 26px;
    font-weight: 500;
  }
  .peek-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1.1;
  }
  .peek small {
    font-size: 18px;
  }
  .focused {
    width: 360px;
    height: 128px;
    border-radius: 64px;
    background: var(--focus);
    border: 3px solid var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 18px;
    color: var(--text);
  }
  .big {
    font-family: var(--font-num);
    font-size: 60px;
    font-weight: 700;
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
  .dots {
    position: absolute;
    bottom: 44px;
    display: flex;
    gap: 8px;
  }
  .dots span {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--line);
  }
  .dots .on {
    background: var(--accent);
  }
</style>
