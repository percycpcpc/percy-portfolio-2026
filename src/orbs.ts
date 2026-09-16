import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initMotionScope, observeMotionRegion } from './motion';

export function initOrbs() {
  const section = document.querySelector<HTMLElement>('.skills-section');
  const cloud = document.querySelector<HTMLElement>('.orb-cloud');
  const orbs = [...document.querySelectorAll<HTMLButtonElement>('.skill-orb')];
  const detail = document.querySelector<HTMLElement>('.orb-detail');
  if (!section || !cloud || !orbs.length || !detail) return;
  orbs.forEach((orb, index) => {
    orb.removeAttribute('role');
    const halo = document.createElement('span'); halo.className = 'orb-halo'; halo.setAttribute('aria-hidden', 'true'); orb.prepend(halo);
    orb.setAttribute('aria-pressed', String(index === 0)); orb.classList.toggle('active', index === 0);
  });
  const heading = detail.querySelector<HTMLElement>('h3');
  const copy = detail.querySelector<HTMLElement>('p');
  const select = (orb: HTMLButtonElement) => {
    if (orb.classList.contains('active')) return;
    orbs.forEach((item) => { const active = item === orb; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.to(orbs.map((item) => item.querySelector('img')), { scale: (index) => orbs[index] === orb ? 1.06 : 1, duration: .18, ease: 'power2.out' });
    const swap = () => { if (heading) heading.textContent = orb.dataset.title ?? ''; if (copy) copy.textContent = orb.dataset.description ?? ''; };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { swap(); return; }
    gsap.to([heading, copy], { opacity: 0, duration: .09, onComplete: () => { swap(); gsap.to([heading, copy], { opacity: 1, duration: .09 }); } });
  };
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  orbs.forEach((orb) => { orb.addEventListener('click', () => select(orb)); orb.addEventListener('focus', () => select(orb)); orb.addEventListener('mouseenter', () => { if (fine.matches) select(orb); }); });
  if (matchMedia('(min-width: 901px)').matches) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.classList.add('orb-connections'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
    ['M15 25 L45 16 L76 28', 'M15 25 L25 68 L56 63 L84 70', 'M45 16 L56 63', 'M76 28 L84 70'].forEach((d) => { const path = document.createElementNS(svg.namespaceURI, 'path'); path.setAttribute('d', d); svg.append(path); });
    cloud.prepend(svg);
  }
  initMotionScope('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
    const paths = [...cloud.querySelectorAll<SVGPathElement>('.orb-connections path')];
    paths.forEach((path) => { const length = path.getTotalLength(); gsap.set(path, { strokeDasharray: length, strokeDashoffset: length }); });
    ScrollTrigger.create({ trigger: section, start: 'top 80%', once: true, onEnter: () => { gsap.to(paths, { strokeDashoffset: 0, duration: .8, stagger: .05, ease: 'power2.out' }); gsap.fromTo(orbs, { scale: .92 }, { scale: 1, duration: .45, stagger: .07, ease: 'power2.out', clearProps: 'transform' }); } });
    const drifts = orbs.map((orb, index) => gsap.to(orb.querySelector('img'), { y: index % 2 ? 4 : -4, duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true }));
    return observeMotionRegion(section, (active) => drifts.forEach((tween) => active ? tween.resume() : tween.pause()));
  });
}
