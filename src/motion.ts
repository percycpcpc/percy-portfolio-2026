import gsap from 'gsap';

export type MotionSetup = () => void | (() => void);

const scopes = gsap.matchMedia();
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
const reducedListeners = new Set<(reduced: boolean) => void>();

reducedQuery.addEventListener('change', (event) => {
  reducedListeners.forEach((listener) => listener(event.matches));
});

export const prefersReducedMotion = () => reducedQuery.matches;

export function initMotionScope(query: string, setupFn: MotionSetup): void {
  scopes.add(query, setupFn);
}

export function onReducedMotionChange(listener: (reduced: boolean) => void): () => void {
  reducedListeners.add(listener);
  listener(reducedQuery.matches);
  return () => reducedListeners.delete(listener);
}

export function observeMotionRegion(
  element: Element,
  listener: (active: boolean) => void,
  rootMargin = '100px',
): () => void {
  let intersecting = false;
  let lastValue: boolean | undefined;
  const publish = () => {
    const active = intersecting && !document.hidden;
    if (active !== lastValue) {
      lastValue = active;
      listener(active);
    }
  };
  const observer = new IntersectionObserver(([entry]) => {
    intersecting = entry.isIntersecting;
    publish();
  }, { rootMargin });
  const visibility = () => publish();
  observer.observe(element);
  document.addEventListener('visibilitychange', visibility);
  return () => {
    observer.disconnect();
    document.removeEventListener('visibilitychange', visibility);
  };
}
