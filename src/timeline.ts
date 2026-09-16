import gsap from 'gsap';

export function initTimeline(reduced: boolean) {
  document.querySelectorAll<HTMLElement>('.timeline-item').forEach((item, index) => {
    const button = item.querySelector<HTMLButtonElement>('button');
    button?.addEventListener('click', () => { const open = item.classList.toggle('expanded'); button.setAttribute('aria-expanded', String(open)); });
    if (!reduced) gsap.from(item, { opacity: 0, x: index % 2 ? 45 : -45, duration: .75, ease: 'power3.out', scrollTrigger: { trigger: item, start: 'top 82%', toggleClass: { targets: item, className: 'visible' }, once: true } });
    else item.classList.add('visible');
  });
}
