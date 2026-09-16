export function initProjects(reduced: boolean) {
  if (reduced || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  document.querySelectorAll<HTMLElement>('.project-card').forEach((card) => {
    const artwork = card.querySelector<HTMLElement>('.project-artwork');
    if (!artwork) return;

    card.addEventListener('pointermove', (event) => {
      const rect = artwork.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
      const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1));
      artwork.style.transform = `perspective(1000px) rotateX(${(-y * 3).toFixed(2)}deg) rotateY(${(x * 3).toFixed(2)}deg) translate(${(x * 5).toFixed(2)}px, ${(y * 5).toFixed(2)}px)`;
    });

    card.addEventListener('pointerleave', () => artwork.style.removeProperty('transform'));
  });
}
