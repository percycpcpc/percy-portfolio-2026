import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './styles.css';
import { initHero } from './hero';
import { initOrbs } from './orbs';
import { initTimeline } from './timeline';
import { initProjects } from './projects';
import { initQixGame } from './qix-game';
import { initContact } from './contact';

gsap.registerPlugin(ScrollTrigger);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
initHero(reduced);
initOrbs();
initTimeline(reduced);
initProjects(reduced);
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

if (!reduced) {
  gsap.utils.toArray<HTMLElement>('.section-heading, .intro > *, .game-copy, .contact-section > *').forEach((element) => {
    gsap.from(element, { opacity: 0, y: 36, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 88%', once: true } });
  });
}

const typewriter = document.querySelector<HTMLElement>('.typewriter');
if (typewriter) {
  const text = typewriter.dataset.text ?? '';
  if (reduced) typewriter.textContent = text;
  else ScrollTrigger.create({ trigger: typewriter, start: 'top 82%', once: true, onEnter: () => {
    let i = 0; const timer = window.setInterval(() => { typewriter.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(timer); }, 13);
  }});
}
