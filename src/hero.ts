import gsap from 'gsap';

export function initHero(reduced: boolean) {
  const hero = document.querySelector<HTMLElement>('.hero');
  const canvas = document.querySelector<HTMLCanvasElement>('#starfield');
  if (!hero || !canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  let width = 0, height = 0, raf = 0;
  const stars = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), size: Math.random() * 1.8 + .4, speed: Math.random() * .0002 + .00006, phase: Math.random() * Math.PI * 2 }));
  const resize = () => { const dpr = Math.min(devicePixelRatio, 2); width = hero.clientWidth; height = hero.clientHeight; canvas.width = width * dpr; canvas.height = height * dpr; canvas.style.width = `${width}px`; canvas.style.height = `${height}px`; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  const draw = (time = 0) => { ctx.clearRect(0, 0, width, height); stars.forEach(s => { if (!reduced) s.y = (s.y - s.speed + 1) % 1; const alpha = .25 + .55 * (.5 + .5 * Math.sin(time * .001 + s.phase)); ctx.beginPath(); ctx.fillStyle = `rgba(185,225,255,${alpha})`; ctx.arc(s.x * width, s.y * height, s.size, 0, Math.PI * 2); ctx.fill(); }); raf = requestAnimationFrame(draw); };
  resize(); draw(); addEventListener('resize', resize);
  if (!reduced && matchMedia('(pointer:fine)').matches) hero.addEventListener('pointermove', (event) => {
    const x = event.clientX / innerWidth - .5, y = event.clientY / innerHeight - .5;
    hero.querySelectorAll<HTMLElement>('[data-depth]').forEach(layer => { const depth = Number(layer.dataset.depth); gsap.to(layer, { x: x * depth, y: y * depth, duration: 1.3, ease: 'power3.out' }); });
  });
  const tag = hero.querySelector<HTMLElement>('.tagline');
  const lines = ['Crafting worlds, products, and playful systems.', 'From mobile games to blockchain products.', 'Turning ambitious ideas into shipped experiences.'];
  let index = 0;
  if (tag && !reduced) setInterval(() => { gsap.to(tag, { opacity: 0, filter: 'blur(8px)', y: -8, duration: .35, onComplete: () => { index = (index + 1) % lines.length; tag.textContent = lines[index]; gsap.fromTo(tag, { opacity: 0, filter: 'blur(8px)', y: 8 }, { opacity: 1, filter: 'blur(0px)', y: 0, duration: .45 }); } }); }, 3600);
  gsap.from('.hero-copy > *', { opacity: 0, y: 22, duration: .9, stagger: .13, delay: .2, ease: 'power3.out' });
  addEventListener('beforeunload', () => cancelAnimationFrame(raf), { once: true });
}
