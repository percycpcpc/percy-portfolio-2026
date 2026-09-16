import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initMotionScope, prefersReducedMotion } from './motion';

export function initTimeline() {
  const timeline = document.querySelector<HTMLElement>('.timeline');
  if (!timeline) return;
  const route = document.createElement('span');
  route.className = 'timeline-route';
  route.setAttribute('aria-hidden', 'true');
  timeline.prepend(route);

  document.querySelectorAll<HTMLElement>('.timeline-item').forEach((item) => {
    const button = item.querySelector<HTMLButtonElement>(':scope > button');
    button?.addEventListener('click', () => {
      const open = item.classList.toggle('expanded');
      button.setAttribute('aria-expanded', String(open));
      setTimeout(() => ScrollTrigger.refresh(), 360);
    });
  });
  const earlier = document.querySelector<HTMLDetailsElement>('.earlier-chapters');
  const earlierSummary = earlier?.querySelector<HTMLElement>(':scope > summary');
  const earlierList = earlier?.querySelector<HTMLElement>('.earlier-chapters-list');
  earlierSummary?.addEventListener('click', (event) => {
    if (!earlier || !earlierList) return;
    event.preventDefault();
    if (prefersReducedMotion()) { earlier.open = !earlier.open; ScrollTrigger.refresh(); return; }
    if (earlier.open) {
      gsap.to(earlierList, { height: 0, duration: .35, ease: 'power2.inOut', onComplete: () => {
        earlier.open = false; gsap.set(earlierList, { clearProps: 'height,overflow' }); ScrollTrigger.refresh();
      } });
    } else {
      earlier.open = true;
      const height = earlierList.scrollHeight;
      gsap.fromTo(earlierList, { height: 0, overflow: 'hidden' }, { height, duration: .35, ease: 'power2.inOut', onComplete: () => {
        gsap.set(earlierList, { clearProps: 'height,overflow' }); ScrollTrigger.refresh();
      } });
    }
  });

  initMotionScope('(prefers-reduced-motion: no-preference)', () => {
    gsap.fromTo(route, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: timeline, start: 'top 70%', end: 'bottom 70%', scrub: .3 } });
    document.querySelectorAll<HTMLElement>('.timeline-item').forEach((item, index) => {
      ScrollTrigger.create({ trigger: item, start: 'top 70%', once: true, onEnter: () => item.classList.add('visible') });
      if (item.classList.contains('timeline-recent')) {
        ScrollTrigger.create({ trigger: item, start: 'top 82%', once: true, onEnter: () => {
          gsap.fromTo(item, { opacity: .85, x: index % 2 ? 12 : -12 }, { opacity: 1, x: 0, duration: .4, delay: index * .06, ease: 'power2.out', clearProps: 'transform,opacity' });
        } });
      }
    });
  });
  initMotionScope('(prefers-reduced-motion: reduce)', () => {
    gsap.set(route, { scaleY: 1 });
    document.querySelectorAll('.timeline-item').forEach((item) => item.classList.add('visible'));
  });
}
