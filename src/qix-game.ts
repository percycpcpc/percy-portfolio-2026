import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initMotionScope, observeMotionRegion, onReducedMotionChange, prefersReducedMotion } from './motion';

type Point = { x: number; y: number };
type Particle = Point & { life: number; vx: number; vy: number };

export function initQixGame() {
  const section = document.querySelector<HTMLElement>('.game-section');
  const frame = document.querySelector<HTMLElement>('.game-frame');
  const canvas = document.querySelector<HTMLCanvasElement>('#qix-canvas');
  const startButton = document.querySelector<HTMLButtonElement>('#game-start');
  const previewButton = document.querySelector<HTMLButtonElement>('#game-preview');
  if (!section || !frame || !canvas || !startButton || !previewButton) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const scoreEl = document.querySelector<HTMLElement>('#game-score')!;
  const timeEl = document.querySelector<HTMLElement>('#game-time')!;
  const claimedEl = document.querySelector<HTMLElement>('#game-claimed')!;
  const statusEl = document.querySelector<HTMLElement>('#game-status')!;
  const W = canvas.width, H = canvas.height, step = 10, margin = 20;
  let player: Point = { x: margin, y: H - margin };
  let enemy = { x: W * .62, y: H * .42, vx: 162, vy: 132 };
  let trail: Point[] = [], captures: Point[][] = [], particles: Particle[] = [];
  let drawing = false, running = false, sectionActive = false, raf = 0, lastNow = 0;
  let score = 0, time = 30, previewElapsed: number | null = null;
  const demoPath: Point[] = [{ x: margin, y: H - 150 }, { x: 210, y: H - 150 }, { x: 210, y: H - margin }];
  const demoCapture: Point[] = [...demoPath, { x: margin, y: H - margin }];

  ['top', 'right', 'bottom', 'left'].forEach((edge) => { const line = document.createElement('span'); line.className = `frame-trace frame-trace-${edge}`; line.setAttribute('aria-hidden', 'true'); frame.prepend(line); });
  const onBorder = (point: Point) => point.x <= margin || point.x >= W - margin || point.y <= margin || point.y >= H - margin;
  const borderCorner = (a: Point, b: Point): Point => ({ x: Math.abs(a.x - b.x) > Math.abs(a.y - b.y) ? b.x : a.x, y: Math.abs(a.x - b.x) > Math.abs(a.y - b.y) ? a.y : b.y });
  const resetRound = () => { player = { x: margin, y: H - margin }; trail = []; drawing = false; };
  const areaOf = (polygons: Point[][]) => polygons.reduce((sum, polygon) => sum + Math.abs(polygon.reduce((area, point, index) => area + point.x * polygon[(index + 1) % polygon.length].y - polygon[(index + 1) % polygon.length].x * point.y, 0)) / 2, 0);
  const updateUI = () => {
    const values = [String(score), String(Math.max(0, Math.ceil(time))), `${Math.min(99, Math.round(areaOf(captures) / ((W - 40) * (H - 40)) * 100))}%`];
    [scoreEl, timeEl, claimedEl].forEach((element, index) => { if (element.textContent !== values[index]) element.textContent = values[index]; });
  };
  const reward = (point: Point) => {
    if (prefersReducedMotion()) return;
    for (let index = 0; index < 12; index++) particles.push({ ...point, life: 1, vx: (Math.random() - .5) * 240, vy: (Math.random() - .5) * 240 });
    frame.classList.remove('capture-flash'); void frame.offsetWidth; frame.classList.add('capture-flash');
  };
  const cancelPreview = (restore = true) => {
    previewElapsed = null;
    if (restore && !running) { trail = []; captures = []; resetRound(); statusEl.textContent = 'Ready when you are.'; render(); }
  };
  const move = (dx: number, dy: number) => {
    if (!running) return;
    const next = { x: Math.max(margin, Math.min(W - margin, player.x + dx * step)), y: Math.max(margin, Math.min(H - margin, player.y + dy * step)) };
    const wasBorder = onBorder(player), isBorder = onBorder(next);
    if (wasBorder && !isBorder) { drawing = true; trail = [{ ...player }]; }
    if (drawing) trail.push({ ...next });
    player = next;
    if (drawing && isBorder && trail.length > 2) {
      captures.push([...trail, borderCorner(trail[trail.length - 1], trail[0])]); score += Math.max(25, trail.length * 3); reward(player);
      drawing = false; trail = []; statusEl.textContent = 'Territory captured! Keep carving.'; updateUI();
    }
    render();
  };
  const key = (event: KeyboardEvent) => {
    const map: Record<string, Point> = { ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 } };
    const direction = map[event.key]; if (direction && running) { event.preventDefault(); move(direction.x, direction.y); }
  };
  canvas.addEventListener('keydown', key);
  const directions: Record<string, Point> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
  document.querySelectorAll<HTMLButtonElement>('.touch-pad button').forEach((button) => button.addEventListener('click', () => { const direction = directions[button.dataset.dir ?? '']; if (direction) move(direction.x, direction.y); }));
  let drag: Point | null = null;
  canvas.addEventListener('pointerdown', (event) => { if (!running) return; event.preventDefault(); drag = { x: event.clientX, y: event.clientY }; canvas.setPointerCapture(event.pointerId); });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag || !running) return; event.preventDefault(); const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 12) { move(Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) : 0, Math.abs(dy) >= Math.abs(dx) ? Math.sign(dy) : 0); drag = { x: event.clientX, y: event.clientY }; }
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  const hitTrail = () => trail.some((point) => Math.hypot(point.x - enemy.x, point.y - enemy.y) < 12);
  const drawPolygon = (polygon: Point[]) => {
    ctx.beginPath(); polygon.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)); ctx.closePath();
    ctx.fillStyle = 'rgba(42,77,140,.38)'; ctx.fill(); ctx.strokeStyle = 'rgba(93,173,226,.5)'; ctx.stroke();
  };
  const render = (demoProgress?: number) => {
    ctx.fillStyle = '#080d21'; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = 'rgba(93,173,226,.16)'; ctx.lineWidth = 1;
    for (let x = margin; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, margin); ctx.lineTo(x, H - margin); ctx.stroke(); }
    for (let y = margin; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(W - margin, y); ctx.stroke(); }
    captures.forEach(drawPolygon);
    if (!running && previewElapsed === null && prefersReducedMotion()) drawPolygon(demoCapture);
    if (demoProgress !== undefined) {
      if (demoProgress >= .78) drawPolygon(demoCapture);
      const count = Math.max(2, Math.ceil(Math.min(1, demoProgress / .75) * demoPath.length)); trail = demoPath.slice(0, count);
    }
    ctx.strokeStyle = '#5dade2'; ctx.lineWidth = 5; ctx.strokeRect(margin, margin, W - margin * 2, H - margin * 2);
    if (trail.length) { ctx.beginPath(); trail.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)); ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 4; ctx.shadowBlur = 12; ctx.shadowColor = '#d4af37'; ctx.stroke(); ctx.shadowBlur = 0; }
    ctx.beginPath(); ctx.arc(enemy.x, enemy.y, 8, 0, Math.PI * 2); ctx.fillStyle = '#d4af37'; ctx.shadowColor = '#d4af37'; ctx.shadowBlur = 18; ctx.fill(); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(player.x, player.y, 7, 0, Math.PI * 2); ctx.fillStyle = '#b9efff'; ctx.shadowColor = '#5dade2'; ctx.shadowBlur = 14; ctx.fill(); ctx.shadowBlur = 0;
    particles.forEach((particle) => { ctx.fillStyle = `rgba(212,175,55,${particle.life})`; ctx.fillRect(particle.x, particle.y, 3, 3); });
  };
  const tick = (now: number) => {
    raf = 0;
    if (!sectionActive) return;
    const delta = lastNow ? Math.min(.05, (now - lastNow) / 1000) : 0; lastNow = now;
    if (running) {
      enemy.x += enemy.vx * delta; enemy.y += enemy.vy * delta;
      if (enemy.x < margin + 8 || enemy.x > W - margin - 8) enemy.vx *= -1;
      if (enemy.y < margin + 8 || enemy.y > H - margin - 8) enemy.vy *= -1;
      if (hitTrail()) { score = Math.max(0, score - 50); statusEl.textContent = 'The spark hit your trail — back to the border!'; resetRound(); }
      time -= delta;
      if (time <= 0) { running = false; time = 0; frame.classList.remove('is-running'); statusEl.textContent = `Run complete — ${score} points. Play again?`; startButton.textContent = 'Play again'; }
      updateUI();
    }
    let demoProgress: number | undefined;
    if (previewElapsed !== null) {
      previewElapsed += delta;
      demoProgress = Math.min(1, previewElapsed / 2);
      if (demoProgress >= 1) { previewElapsed = null; trail = []; setTimeout(() => cancelPreview(), 350); }
    }
    particles.forEach((particle) => { particle.x += particle.vx * delta; particle.y += particle.vy * delta; particle.life -= delta * 1.8; });
    particles = particles.filter((particle) => particle.life > 0);
    render(demoProgress);
    if (running || previewElapsed !== null || particles.length) raf = requestAnimationFrame(tick);
  };
  const startLoop = () => { if (sectionActive && !raf) { lastNow = 0; raf = requestAnimationFrame(tick); } };
  observeMotionRegion(section, (active) => { sectionActive = active; if (active) { render(); if (running || previewElapsed !== null || particles.length) startLoop(); } else { cancelAnimationFrame(raf); raf = 0; lastNow = 0; } });
  onReducedMotionChange((reduced) => { if (reduced && previewElapsed !== null) cancelPreview(); else render(); });
  startButton.addEventListener('click', () => {
    cancelPreview(false); score = 0; time = 30; captures = []; particles = []; enemy = { x: W * .62, y: H * .42, vx: 162, vy: 132 }; resetRound();
    running = true; frame.classList.add('is-running'); statusEl.textContent = 'Go! Leave the border and reconnect.'; startButton.textContent = 'Restart run'; updateUI(); render(); canvas.focus(); startLoop();
  });
  previewButton.addEventListener('click', () => {
    if (running) return;
    if (prefersReducedMotion()) { statusEl.textContent = 'Static preview: a sample territory is shown on the board.'; render(); return; }
    captures = []; trail = []; previewElapsed = 0; statusEl.textContent = 'Previewing one territory capture.'; startLoop();
  });
  initMotionScope('(prefers-reduced-motion: no-preference)', () => {
    const traces = frame.querySelectorAll<HTMLElement>('.frame-trace');
    gsap.set(traces, { scaleX: 0, scaleY: 0 });
    ScrollTrigger.create({ trigger: section, start: 'top 80%', once: true, onEnter: () => {
      gsap.to(traces, { scaleX: 1, scaleY: 1, duration: .6, stagger: .04, ease: 'power2.out' });
      gsap.fromTo('.game-stats > div', { opacity: 0 }, { opacity: 1, duration: .08, stagger: .08 });
    } });
  });
  updateUI(); render();
}
