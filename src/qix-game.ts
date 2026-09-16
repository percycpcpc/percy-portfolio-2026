type Point = { x: number; y: number };

export function initQixGame() {
  const canvas = document.querySelector<HTMLCanvasElement>('#qix-canvas');
  const startButton = document.querySelector<HTMLButtonElement>('#game-start');
  if (!canvas || !startButton) return;
  const ctx = canvas.getContext('2d')!;
  const scoreEl = document.querySelector('#game-score')!;
  const timeEl = document.querySelector('#game-time')!;
  const claimedEl = document.querySelector('#game-claimed')!;
  const statusEl = document.querySelector('#game-status')!;
  const W = canvas.width, H = canvas.height, step = 10, margin = 20;
  let player: Point = { x: margin, y: H - margin }, enemy = { x: W*.62, y: H*.42, vx: 2.7, vy: 2.2 };
  let trail: Point[] = [], drawing = false, running = false, score = 0, time = 30, startTime = 0, raf = 0;
  let captures: Point[][] = [], particles: Array<Point & { life:number; vx:number; vy:number }> = [];

  const onBorder = (p: Point) => p.x <= margin || p.x >= W-margin || p.y <= margin || p.y >= H-margin;
  const resetRound = () => { player = { x: margin, y: H-margin }; trail = []; drawing = false; };
  const updateUI = () => { scoreEl.textContent = String(score); timeEl.textContent = String(Math.max(0, Math.ceil(time))); const area = captures.reduce((sum,p) => sum + Math.abs(p.reduce((a,q,i)=>a+q.x*p[(i+1)%p.length].y-p[(i+1)%p.length].x*q.y,0))/2, 0); claimedEl.textContent = `${Math.min(99, Math.round(area/((W-40)*(H-40))*100))}%`; };
  const spark = (p: Point) => { for(let i=0;i<22;i++) particles.push({ ...p, life: 1, vx:(Math.random()-.5)*7, vy:(Math.random()-.5)*7 }); };
  const move = (dx: number, dy: number) => {
    if (!running) return;
    const next = { x: Math.max(margin, Math.min(W-margin, player.x+dx*step)), y: Math.max(margin, Math.min(H-margin, player.y+dy*step)) };
    const wasBorder = onBorder(player), isBorder = onBorder(next);
    if (wasBorder && !isBorder) { drawing = true; trail = [{...player}]; }
    if (drawing) trail.push({...next});
    player = next;
    if (drawing && isBorder && trail.length > 2) { captures.push([...trail, borderCorner(trail[trail.length-1], trail[0])]); score += Math.max(25, trail.length * 3); spark(player); drawing = false; trail = []; statusEl.textContent = 'Territory captured! Keep carving.'; updateUI(); }
  };
  const borderCorner = (a: Point, b: Point): Point => ({ x: Math.abs(a.x-b.x)>Math.abs(a.y-b.y) ? b.x : a.x, y: Math.abs(a.x-b.x)>Math.abs(a.y-b.y) ? a.y : b.y });
  const key = (event: KeyboardEvent) => { const map: Record<string,Point> = {ArrowUp:{x:0,y:-1},w:{x:0,y:-1},ArrowDown:{x:0,y:1},s:{x:0,y:1},ArrowLeft:{x:-1,y:0},a:{x:-1,y:0},ArrowRight:{x:1,y:0},d:{x:1,y:0}}; const d=map[event.key]; if(d){ event.preventDefault(); move(d.x,d.y); } };
  canvas.addEventListener('keydown', key);
  document.querySelectorAll<HTMLButtonElement>('.touch-pad button').forEach(btn => { const dirs:Record<string,Point>={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}}; const act=(e:Event)=>{e.preventDefault(); const d=dirs[btn.dataset.dir!]; move(d.x,d.y);}; btn.addEventListener('pointerdown',act); });
  let drag: Point | null = null;
  canvas.addEventListener('pointerdown', e => { drag={x:e.clientX,y:e.clientY}; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if(!drag||!running)return; const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.max(Math.abs(dx),Math.abs(dy))>12){move(Math.abs(dx)>Math.abs(dy)?Math.sign(dx):0,Math.abs(dy)>=Math.abs(dx)?Math.sign(dy):0);drag={x:e.clientX,y:e.clientY};}});
  canvas.addEventListener('pointerup',()=>drag=null);
  const hitTrail = () => trail.some(p => Math.hypot(p.x-enemy.x,p.y-enemy.y)<12);
  const draw = (now=0) => {
    ctx.fillStyle='#080d21';ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(93,173,226,.16)';ctx.lineWidth=1;for(let x=margin;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,margin);ctx.lineTo(x,H-margin);ctx.stroke()}for(let y=margin;y<H;y+=40){ctx.beginPath();ctx.moveTo(margin,y);ctx.lineTo(W-margin,y);ctx.stroke()}
    captures.forEach(poly=>{ctx.beginPath();poly.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle='rgba(42,77,140,.38)';ctx.fill();ctx.strokeStyle='rgba(93,173,226,.5)';ctx.stroke()});
    ctx.strokeStyle='#5dade2';ctx.lineWidth=5;ctx.strokeRect(margin,margin,W-margin*2,H-margin*2);
    if(trail.length){ctx.beginPath();trail.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle='#d4af37';ctx.lineWidth=4;ctx.shadowBlur=12;ctx.shadowColor='#d4af37';ctx.stroke();ctx.shadowBlur=0;}
    if(running){ enemy.x+=enemy.vx;enemy.y+=enemy.vy;if(enemy.x<margin+8||enemy.x>W-margin-8)enemy.vx*=-1;if(enemy.y<margin+8||enemy.y>H-margin-8)enemy.vy*=-1;if(hitTrail()){score=Math.max(0,score-50);statusEl.textContent='The spark hit your trail — back to the border!';resetRound();updateUI();} time=30-(now-startTime)/1000;if(time<=0){running=false;time=0;statusEl.textContent=`Run complete — ${score} points. Play again?`;startButton.textContent='Play again';}}
    ctx.beginPath();ctx.arc(enemy.x,enemy.y,8,0,Math.PI*2);ctx.fillStyle='#d4af37';ctx.shadowColor='#d4af37';ctx.shadowBlur=18;ctx.fill();ctx.shadowBlur=0;
    ctx.beginPath();ctx.arc(player.x,player.y,7,0,Math.PI*2);ctx.fillStyle='#b9efff';ctx.shadowColor='#5dade2';ctx.shadowBlur=14;ctx.fill();ctx.shadowBlur=0;
    particles=particles.filter(p=>p.life>0);particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life-=.03;ctx.fillStyle=`rgba(212,175,55,${p.life})`;ctx.fillRect(p.x,p.y,3,3)});
    updateUI();raf=requestAnimationFrame(draw);
  };
  startButton.addEventListener('click',()=>{score=0;time=30;captures=[];particles=[];enemy={x:W*.62,y:H*.42,vx:2.7,vy:2.2};resetRound();running=true;startTime=performance.now();statusEl.textContent='Go! Leave the border and reconnect.';startButton.textContent='Restart run';canvas.focus();});
  draw(); addEventListener('beforeunload',()=>cancelAnimationFrame(raf),{once:true});
}
