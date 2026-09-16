export function initOrbs() {
  const orbs = [...document.querySelectorAll<HTMLButtonElement>('.skill-orb')];
  const detail = document.querySelector<HTMLElement>('.orb-detail');
  const select = (orb: HTMLButtonElement) => {
    orbs.forEach(item => { item.classList.toggle('active', item === orb); item.setAttribute('aria-pressed', String(item === orb)); });
    if (detail) { detail.querySelector('h3')!.textContent = orb.dataset.title ?? ''; detail.querySelector('p')!.textContent = orb.dataset.description ?? ''; }
  };
  orbs.forEach(orb => { orb.addEventListener('click', () => select(orb)); orb.addEventListener('mouseenter', () => { if (!orbs.some(o => o.classList.contains('active'))) select(orb); }); });
}
