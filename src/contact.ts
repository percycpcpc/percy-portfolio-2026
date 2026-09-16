export function initContact() {
  const form = document.querySelector<HTMLFormElement>('#contact-form');
  const canvas = document.querySelector<HTMLCanvasElement>('#confetti');
  if (!form || !canvas) return;
  const validate = (field: HTMLInputElement | HTMLTextAreaElement) => {
    let message = '';
    if (field.validity.valueMissing) message = 'This field is required.';
    else if (field.validity.typeMismatch) message = 'Please enter a valid email address.';
    else if (field.validity.tooShort) message = `Please use at least ${field.minLength} characters.`;
    field.closest('label')?.classList.toggle('invalid', Boolean(message));
    const error = field.closest('label')?.querySelector('small');
    if (error) error.textContent = message;
    return !message;
  };
  form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea').forEach(f => f.addEventListener('blur',()=>validate(f)));
  form.addEventListener('submit',event=>{event.preventDefault();const fields=[...form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')];if(!fields.every(validate)){form.querySelector<HTMLElement>('.invalid input, .invalid textarea')?.focus();return;} const data=new FormData(form); const subject=encodeURIComponent(`Portfolio enquiry from ${data.get('name')}`);const body=encodeURIComponent(`${data.get('message')}\n\nFrom: ${data.get('name')} (${data.get('email')})`);form.querySelector('.form-status')!.textContent='Thanks — your email app is ready with the message.';burst();setTimeout(()=>{location.href=`mailto:percycpcpc@hotmail.com?subject=${subject}&body=${body}`},450);form.reset();});
  const burst=()=>{const ctx=canvas.getContext('2d')!;const r=form.getBoundingClientRect();const dpr=Math.min(devicePixelRatio,2);canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;canvas.style.width=`${innerWidth}px`;canvas.style.height=`${innerHeight}px`;ctx.scale(dpr,dpr);let pieces=Array.from({length:70},(_,i)=>({x:r.left+r.width/2,y:r.top+r.height*.7,vx:(Math.random()-.5)*12,vy:-Math.random()*9-3,g:.22,life:1,color:i%2?'#d4af37':'#5dade2',rot:Math.random()*6}));const frame=()=>{ctx.clearRect(0,0,innerWidth,innerHeight);pieces.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.life-=.016;p.rot+=.15;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.color;ctx.globalAlpha=Math.max(0,p.life);ctx.fillRect(-4,-2,8,4);ctx.restore()});pieces=pieces.filter(p=>p.life>0);if(pieces.length)requestAnimationFrame(frame);else ctx.clearRect(0,0,innerWidth,innerHeight)};frame();};
}
