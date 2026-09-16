export function initProjects(reduced: boolean) {
  document.querySelectorAll<HTMLElement>('.project-card').forEach(card => {
    const flip = () => card.classList.toggle('flipped');
    card.querySelectorAll<HTMLButtonElement>('.flip-button').forEach(button => button.addEventListener('click', (event) => { event.stopPropagation(); flip(); }));
    card.addEventListener('keydown', event => { if ((event.key === 'Enter' || event.key === ' ') && event.target === card) { event.preventDefault(); flip(); } });
    if (!reduced && matchMedia('(pointer:fine)').matches) {
      card.addEventListener('pointermove', event => { if (card.classList.contains('flipped')) return; const r = card.getBoundingClientRect(); card.style.setProperty('--rx', `${((event.clientY-r.top)/r.height-.5)*-9}deg`); card.style.setProperty('--ry', `${((event.clientX-r.left)/r.width-.5)*11}deg`); });
      card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    }
  });
}
