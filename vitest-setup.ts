import '@testing-library/jest-dom/vitest'

// jsdom has no ResizeObserver; Svelte's bind:clientWidth needs one.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
