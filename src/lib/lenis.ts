// Shared handle to the Lenis instance created by the homepage (src/routes/index.tsx).
// Anchor navigation needs it because Lenis owns the scroll position on the
// homepage; a bare element.scrollIntoView() gets overwritten by its rAF loop.
export const lenisRef: {
  current: {
    scrollTo: (target: number | HTMLElement, options?: { offset?: number; immediate?: boolean }) => void;
  } | null;
} = { current: null };

// Height of the intro spacer/scroll lock, as a multiple of the viewport.
// Must match IntroReveal.tsx (D = h * 2).
const INTRO_VIEWPORTS = 2;

/**
 * Document-space Y of an element, ignoring CSS transforms.
 *
 * getBoundingClientRect() is useless here: the homepage's IntroReveal translates
 * the whole site by `min(scrollY, D) - D`, so the rect is D pixels away from the
 * element's real position. Walking the offsetParent chain gives the untransformed
 * position, which is what we must scroll to once the intro has settled.
 */
function documentTop(el: HTMLElement): number {
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== document.body) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return y;
}

/** Offset to clear the sticky 4rem navbar. */
const NAV_OFFSET = 64;

/**
 * Scroll the homepage to a section, working from any route.
 * Returns false if the section is not in the DOM yet.
 */
export function scrollToHash(hash: string): boolean {
  const el = document.getElementById(hash);
  if (!el) return false;
  const target = Math.max(0, documentTop(el) - NAV_OFFSET);
  if (lenisRef.current) lenisRef.current.scrollTo(target);
  else window.scrollTo({ top: target, behavior: "smooth" });
  return true;
}

/**
 * Scroll to a section and keep re-asserting until it actually lands.
 *
 * Needed because the homepage intro scroll-lock sets `overflow: hidden` and calls
 * `lenis.stop()` for ~2s once the user crosses D. A single scrollTo issued during
 * that window is dropped, so the position is re-applied until it settles.
 */
export async function scrollToHashWhenReady(hash: string, timeoutMs = 8000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    if (!scrollToHash(hash)) continue;
    const el = document.getElementById(hash);
    // Wait for the intro (2 viewports) to be behind us before trusting the rect.
    const introPassed = window.scrollY >= window.innerHeight * INTRO_VIEWPORTS - 200;
    if (el && introPassed && Math.abs(el.getBoundingClientRect().top - NAV_OFFSET) < 60) {
      return true;
    }
  }
  return false;
}