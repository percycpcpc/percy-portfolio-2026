import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initMotionScope } from './motion';

export function initContact() {
  const section = document.querySelector<HTMLElement>('.contact-section');
  const form = document.querySelector<HTMLFormElement>('#contact-form');
  if (!section || !form) return;
  const headingWrap = section.querySelector<HTMLElement>(':scope > div');
  const glow = document.createElement('span'); glow.className = 'contact-glow'; glow.setAttribute('aria-hidden', 'true');
  const rule = document.createElement('span'); rule.className = 'contact-rule'; rule.setAttribute('aria-hidden', 'true');
  headingWrap?.prepend(glow, rule);

  const fields = [...form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')];
  const validate = (field: HTMLInputElement | HTMLTextAreaElement) => {
    let message = '';
    if (field.validity.valueMissing) message = 'This field is required.';
    else if (field.validity.typeMismatch) message = 'Please enter a valid email address.';
    else if (field.validity.tooShort) message = `Please use at least ${field.minLength} characters.`;
    const label = field.closest('label');
    const error = label?.querySelector<HTMLElement>('small');
    label?.classList.toggle('invalid', Boolean(message));
    field.setAttribute('aria-invalid', String(Boolean(message)));
    if (error) {
      error.id ||= `${field.name}-error`;
      error.textContent = message;
      field.setAttribute('aria-describedby', error.id);
    }
    return !message;
  };
  fields.forEach((field) => field.addEventListener('blur', () => validate(field)));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!fields.every(validate)) { form.querySelector<HTMLElement>('.invalid input, .invalid textarea')?.focus(); return; }
    const data = new FormData(form);
    const subject = encodeURIComponent(`Portfolio enquiry from ${data.get('name')}`);
    const body = encodeURIComponent(`${data.get('message')}\n\nFrom: ${data.get('name')} (${data.get('email')})`);
    form.querySelector<HTMLElement>('.form-status')!.textContent = 'Email draft opened in your mail app — hit send there.';
    location.href = `mailto:percycpcpc@hotmail.com?subject=${subject}&body=${body}`;
  });

  initMotionScope('(prefers-reduced-motion: no-preference)', () => {
    ScrollTrigger.create({ trigger: section, start: 'top 82%', once: true, onEnter: () => {
      gsap.fromTo(glow, { opacity: 0 }, { opacity: 1, duration: .6 });
      gsap.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: .45, ease: 'power2.out' });
    } });
  });
}
