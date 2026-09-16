import gsap from 'gsap';
import { initMotionScope, observeMotionRegion, onReducedMotionChange, prefersReducedMotion } from './motion';

export function initHero() {
  const hero = document.querySelector<HTMLElement>('.hero');
  const canvas = document.querySelector<HTMLCanvasElement>('#starfield');
  if (!hero || !canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0, height = 0, raf = 0, sectionActive = false;
  let reduced = prefersReducedMotion();
  const stars = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), size: Math.random() * 1.8 + .4, speed: Math.random() * .0002 + .00006, phase: Math.random() * Math.PI * 2 }));
  const paint = (time: number, animate: boolean) => {
    ctx.clearRect(0, 0, width, height);
    stars.forEach((star) => {
      if (animate) star.y = (star.y - star.speed + 1) % 1;
      const alpha = animate ? .25 + .55 * (.5 + .5 * Math.sin(time * .001 + star.phase)) : .55;
      ctx.beginPath(); ctx.fillStyle = `rgba(185,225,255,${alpha})`; ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2); ctx.fill();
    });
  };
  const drawStatic = () => paint(0, false);
  const resize = () => {
    const dpr = Math.min(devicePixelRatio, 2); width = hero.clientWidth; height = hero.clientHeight;
    canvas.width = width * dpr; canvas.height = height * dpr; canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); drawStatic();
  };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; drawStatic(); };
  const draw = (time: number) => { paint(time, true); raf = requestAnimationFrame(draw); };
  const syncLoop = () => sectionActive && !reduced ? (raf ||= requestAnimationFrame(draw)) : stop();
  resize();
  addEventListener('resize', resize);
  observeMotionRegion(hero, (active) => { sectionActive = active; syncLoop(); });
  onReducedMotionChange((value) => { reduced = value; syncLoop(); });

  initMotionScope('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
    const setters = [...hero.querySelectorAll<HTMLElement>('[data-depth]')].map((layer) => ({ layer, x: gsap.quickTo(layer, 'x', { duration: 1.3, ease: 'power3.out' }), y: gsap.quickTo(layer, 'y', { duration: 1.3, ease: 'power3.out' }) }));
    let rect = hero.getBoundingClientRect();
    const measure = () => { rect = hero.getBoundingClientRect(); };
    const move = (event: PointerEvent) => {
      const nx = Math.max(-.5, Math.min(.5, (event.clientX - rect.left) / rect.width - .5));
      const ny = Math.max(-.5, Math.min(.5, (event.clientY - rect.top) / rect.height - .5));
      setters.forEach(({ layer, x, y }) => { const depth = Number(layer.dataset.depth); x(nx * depth); y(ny * depth); });
    };
    const reset = () => setters.forEach(({ x, y }) => { x(0); y(0); });
    hero.addEventListener('pointerenter', measure); hero.addEventListener('pointermove', move); hero.addEventListener('pointerleave', reset); addEventListener('resize', measure);
    return () => { hero.removeEventListener('pointerenter', measure); hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', reset); removeEventListener('resize', measure); };
  });
  initMotionScope('(prefers-reduced-motion: no-preference)', () => {
    const rect = hero.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < innerHeight) gsap.from('.hero-copy > *', { opacity: 0, y: 22, duration: .9, stagger: .13, delay: .2, ease: 'power3.out' });
  });
}
