import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initMotionScope, observeMotionRegion, onReducedMotionChange, prefersReducedMotion } from './motion';

const PLANE_SPEEDS: Record<string, number> = {
  '1': .32,
  '2': .22,
  '3': .10,
  '4': -.10,
  '5': -.18,
};

export function initHero() {
  const hero = document.querySelector<HTMLElement>('.hero');
  const canvas = document.querySelector<HTMLCanvasElement>('#starfield');
  const mist = document.querySelector<HTMLElement>('.hero-mist');
  const beacon = document.querySelector<HTMLElement>('.hero-beacon');
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
    const dpr = Math.min(devicePixelRatio, 2); width = canvas.clientWidth; height = canvas.clientHeight;
    canvas.width = width * dpr; canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); drawStatic();
  };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; drawStatic(); };
  const draw = (time: number) => { paint(time, true); raf = requestAnimationFrame(draw); };
  const syncLoop = () => sectionActive && !reduced ? (raf ||= requestAnimationFrame(draw)) : stop();
  resize();
  addEventListener('resize', resize);
  let ambientMotion: gsap.core.Tween[] = [];
  observeMotionRegion(hero, (active) => {
    sectionActive = active;
    syncLoop();
    ambientMotion.forEach((motion) => motion.paused(!active));
  });
  onReducedMotionChange((value) => { reduced = value; syncLoop(); });

  initMotionScope('(min-width: 701px) and (prefers-reduced-motion: no-preference)', () => {
    const planes = [...hero.querySelectorAll<HTMLElement>('[data-plane]')];
    const progress = { value: 0 };
    const writePlanes = () => {
      const travel = hero.offsetHeight;
      planes.forEach((plane) => {
        const coefficient = PLANE_SPEEDS[plane.dataset.plane ?? ''] ?? 0;
        plane.style.translate = `0 ${progress.value * travel * coefficient}px`;
      });
    };
    planes.forEach((plane) => { plane.style.willChange = 'translate'; });
    const tween = gsap.to(progress, {
      value: 1,
      ease: 'none',
      onUpdate: writePlanes,
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: .3,
        invalidateOnRefresh: true,
      },
    });
    writePlanes();
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      planes.forEach((plane) => {
        plane.style.removeProperty('translate');
        plane.style.removeProperty('will-change');
      });
    };
  });

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
    if (rect.bottom > 0 && rect.top < innerHeight) {
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
      if (mist) timeline.from(mist, { opacity: 0, duration: .7 }, 0);
      timeline.from('.hero-bg, #starfield', { opacity: 0, duration: .9 }, 0)
        .from('.city', { opacity: 0, y: 14, duration: .8 }, .15)
        .from('.island-one, .island-two', { opacity: 0, y: 18, duration: .85, stagger: .12 }, .18)
        .from('.chain-one, .chain-two', { opacity: 0, y: 22, duration: .7 }, .25);
      if (beacon) timeline.from(beacon, { opacity: 0, duration: .5 }, .62);
    }

    if (mist && beacon) {
      ambientMotion = [
        gsap.to(mist, { x: 6, duration: 10, delay: 1.1, ease: 'sine.inOut', repeat: -1, yoyo: true, paused: !sectionActive }),
        gsap.to(beacon, { opacity: .7, duration: 3.5, delay: 1.1, ease: 'sine.inOut', repeat: -1, yoyo: true, paused: !sectionActive }),
      ];
    }

    return () => {
      ambientMotion.forEach((motion) => motion.kill());
      ambientMotion = [];
      gsap.set([mist, beacon].filter(Boolean), { clearProps: 'transform,opacity' });
    };
  });

  document.fonts.ready.then(() => ScrollTrigger.refresh());
}
