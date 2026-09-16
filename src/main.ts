import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './styles.css';
import { initHero } from './hero';
import { initOrbs } from './orbs';
import { initTimeline } from './timeline';
import { initQixGame } from './qix-game';
import { initContact } from './contact';
import { initMotionScope } from './motion';

gsap.registerPlugin(ScrollTrigger);

initHero();
initOrbs();
initTimeline();
initQixGame();
initContact();

const navToggle = document.querySelector<HTMLButtonElement>('.nav-toggle');
const nav = document.querySelector<HTMLElement>('#site-nav');
navToggle?.addEventListener('click', () => {
  const open = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!open));
  nav?.classList.toggle('open', !open);
});
nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  navToggle?.setAttribute('aria-expanded', 'false'); nav.classList.remove('open');
}));

initMotionScope('(prefers-reduced-motion: no-preference)', () => {
  const cleanups: Array<() => void> = [];
  const about = document.querySelector<HTMLElement>('.intro');
  if (about) {
    const rule = document.createElement('span');
    rule.className = 'about-rule';
    rule.setAttribute('aria-hidden', 'true');
    about.querySelector('div:last-child')?.prepend(rule);
    cleanups.push(() => rule.remove());
    const reveal = () => {
      gsap.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: .5, ease: 'power2.out' });
      gsap.fromTo(about.querySelector('.avatar-ring'), { scale: .97 }, { scale: 1, duration: .65, ease: 'power2.out' });
      gsap.fromTo(about.querySelectorAll<HTMLElement>('div:last-child > :not(.about-rule)'), { opacity: .85 }, { opacity: 1, duration: .35 });
    };
    ScrollTrigger.create({ trigger: about, start: 'top 85%', once: true, onEnter: reveal });
  }

  document.querySelectorAll<HTMLElement>('.project-card').forEach((card) => {
    const media = card.querySelector<HTMLElement>('.reveal-media');
    const text = card.querySelector<HTMLElement>('.reveal-text');
    const artwork = card.querySelector<HTMLElement>('.project-artwork');
    if (!media || !text || !artwork) return;
    ScrollTrigger.create({
      trigger: card,
      start: 'top 82%',
      once: true,
      onEnter: () => {
        gsap.fromTo(media, { scale: 1.045 }, { scale: 1, duration: .9, ease: 'power3.out', clearProps: 'transform' });
        gsap.fromTo(text, { y: 12, opacity: .85 }, { y: 0, opacity: 1, duration: .35, ease: 'power2.out', clearProps: 'transform,opacity' });
      },
    });
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const xTo = gsap.quickTo(artwork, 'x', { duration: .2, ease: 'power2.out' });
    const yTo = gsap.quickTo(artwork, 'y', { duration: .2, ease: 'power2.out' });
    const rxTo = gsap.quickTo(artwork, 'rotationX', { duration: .2, ease: 'power2.out' });
    const ryTo = gsap.quickTo(artwork, 'rotationY', { duration: .2, ease: 'power2.out' });
    const move = (event: PointerEvent) => {
      const rect = media.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
      const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1));
      xTo(x * 5); yTo(y * 5); rxTo(-y * 3); ryTo(x * 3);
    };
    const reset = () => gsap.to(artwork, { x: 0, y: 0, rotationX: 0, rotationY: 0, duration: .3, ease: 'power2.out' });
    card.addEventListener('pointermove', move);
    card.addEventListener('pointerleave', reset);
    cleanups.push(() => {
      card.removeEventListener('pointermove', move);
      card.removeEventListener('pointerleave', reset);
    });
  });
  return () => cleanups.forEach((cleanup) => cleanup());
});
