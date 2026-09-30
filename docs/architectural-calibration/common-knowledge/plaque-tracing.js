import {PLAQUE_CHARACTERS,readPlaqueTracing,tracingIsComplete} from './plaque-tracing-state.js';
const SIZE=420,GRID=20;
// Crops sample the same approved plaque raster, in right-to-left reading order.
const crops=[.723,.525,.307,.103].map(x=>({x,y:.24,w:1/6,h:.5}));
export function initPlaqueTracing({host,getSaved,onSave,onReady,onComplete}){
 const root=document.createElement('div');root.className='plaque-writing';root.hidden=true;
 root.innerHTML='<canvas class="plaque-writing-canvas" width="420" height="420" tabindex="0" role="application"></canvas><p class="plaque-writing-status" role="status" aria-live="polite"></p><div class="plaque-writing-actions"><button class="plaque-writing-reset" type="button">重寫這個字</button><button class="plaque-writing-next" type="button" hidden>下一個字 →</button></div><details class="plaque-writing-keyboard"><summary>使用鍵盤描寫</summary><p>方向鍵移動筆尖；空白鍵落筆或提筆。沿淡字描寫，完成後移到下一字。</p></details>';
 host.append(root);
 const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),status=root.querySelector('.plaque-writing-status'),next=root.querySelector('.plaque-writing-next');
 const image=new Image();image.src='assets/living-archive/threshold/plaque-master.png';
 const mask=document.createElement('canvas');mask.width=mask.height=SIZE;const maskCtx=mask.getContext('2d');
 const ink=document.createElement('canvas');ink.width=ink.height=SIZE;const inkCtx=ink.getContext('2d');
 let state,index=0,active=false,pointer=null,stroke=null,cursor=[.5,.5],pen=false,cells=new Set(),visited=new Set(),length=0,ready=false;
 function save(){onSave(readPlaqueTracing(state));}
 function getCrop(){const r=crops[index];return [image.naturalWidth*r.x,image.naturalHeight*r.y,image.naturalWidth*r.w,image.naturalHeight*r.h,0,0,SIZE,SIZE];}
 function makeMask(){
  maskCtx.clearRect(0,0,SIZE,SIZE);maskCtx.drawImage(image,...getCrop());const data=maskCtx.getImageData(0,0,SIZE,SIZE);cells=new Set();
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
   const p=(y*SIZE+x)*4,d=data.data,letter=d[p+3]>200&&d[p]<132&&d[p+1]<105&&d[p+2]<88;
   d[p+3]=letter?255:0;if(letter)cells.add(Math.floor(y/SIZE*GRID)*GRID+Math.floor(x/SIZE*GRID));
  }
  maskCtx.putImageData(data,0,0);
 }
 function segment(a,b,draw=true){
  const distance=Math.hypot(b[0]-a[0],b[1]-a[1]);length+=distance;
  const steps=Math.max(1,Math.ceil(distance*SIZE/3));
  for(let i=0;i<=steps;i++){
   const x=(a[0]+(b[0]-a[0])*i/steps)*GRID,y=(a[1]+(b[1]-a[1])*i/steps)*GRID;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const cx=Math.floor(x)+dx,cy=Math.floor(y)+dy;if(cx>=0&&cx<GRID&&cy>=0&&cy<GRID&&cells.has(cy*GRID+cx))visited.add(cy*GRID+cx);
   }
  }
  if(draw){inkCtx.strokeStyle='#21180e';inkCtx.lineWidth=SIZE*.026;inkCtx.lineCap=inkCtx.lineJoin='round';inkCtx.beginPath();inkCtx.moveTo(a[0]*SIZE,a[1]*SIZE);inkCtx.lineTo(b[0]*SIZE,b[1]*SIZE);inkCtx.stroke();}
 }
 function redraw(showCursor=false){
  ctx.clearRect(0,0,SIZE,SIZE);ctx.filter=state.completed.includes(PLAQUE_CHARACTERS[index])?'none':'grayscale(.7) brightness(.64) contrast(.66)';ctx.drawImage(image,...getCrop());ctx.filter='none';
  const clipped=document.createElement('canvas');clipped.width=clipped.height=SIZE;const c=clipped.getContext('2d');c.drawImage(ink,0,0);c.globalCompositeOperation='destination-in';c.drawImage(mask,0,0);ctx.drawImage(clipped,0,0);
  if(showCursor){ctx.strokeStyle='#f0debb';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cursor[0]*SIZE,cursor[1]*SIZE,6,0,Math.PI*2);ctx.stroke();}
 }
 function updateCompletion(){
  if(!state.completed.includes(PLAQUE_CHARACTERS[index])&&tracingIsComplete({visited:visited.size,total:cells.size,length,strokes:state.strokes[PLAQUE_CHARACTERS[index]].length})){
   state.completed.push(PLAQUE_CHARACTERS[index]);save();redraw();status.textContent=`「${PLAQUE_CHARACTERS[index]}」重新可讀。`;
  }else if(length>0&&!state.completed.includes(PLAQUE_CHARACTERS[index]))status.textContent='沿着淡字，再補回還未描清楚的部分。';
  next.hidden=!state.completed.includes(PLAQUE_CHARACTERS[index]);next.textContent=index===3?'讀牌匾背後的故事 →':'下一個字 →';
 }
 function startLetter(){
  ready=true;pointer=null;stroke=null;pen=false;visited=new Set();length=0;inkCtx.clearRect(0,0,SIZE,SIZE);makeMask();
  for(const path of state.strokes[PLAQUE_CHARACTERS[index]])for(let i=1;i<path.length;i++)segment(path[i-1],path[i]);
  canvas.setAttribute('aria-label',`沿原字描寫「${PLAQUE_CHARACTERS[index]}」。方向鍵移動筆尖，空白鍵落筆或提筆。`);
  status.textContent='沿着淡字，慢慢重寫。';updateCompletion();redraw();onReady(PLAQUE_CHARACTERS[index]);canvas.focus({preventScroll:true});
 }
 function point(event){const rect=canvas.getBoundingClientRect();return [Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height))];}
 function begin(p){stroke=[p];cursor=p;}
 function move(p){if(!stroke)return;const prior=stroke.at(-1);if(Math.hypot(p[0]-prior[0],p[1]-prior[1])<.003)return;stroke.push(p);segment(prior,p);cursor=p;redraw();}
 function finish(cancelled=false){
  if(stroke?.length>1){state.strokes[PLAQUE_CHARACTERS[index]].push(stroke);save();if(!cancelled)updateCompletion();}
  stroke=null;pointer=null;pen=false;
 }
 canvas.addEventListener('pointerdown',event=>{if(!active||!ready||pointer!==null||state.completed.includes(PLAQUE_CHARACTERS[index])||event.button>0)return;event.preventDefault();pointer=event.pointerId;canvas.setPointerCapture(pointer);begin(point(event));});
 canvas.addEventListener('pointermove',event=>{if(event.pointerId!==pointer||!active)return;const samples=event.getCoalescedEvents?.()||[];for(const sample of samples.length?samples:[event])move(point(sample));});
 canvas.addEventListener('pointerup',event=>{if(event.pointerId!==pointer)return;move(point(event));finish();});
 canvas.addEventListener('pointercancel',()=>finish(true));
 canvas.addEventListener('lostpointercapture',()=>{if(stroke)finish(true);});
 canvas.addEventListener('keydown',event=>{
  if(!active||!ready||state.completed.includes(PLAQUE_CHARACTERS[index]))return;
  if(event.key===' '){event.preventDefault();if(event.repeat)return;if(pen)finish();else {pen=true;begin(cursor);}redraw(true);return;}
  const direction={ArrowLeft:[-.025,0],ArrowRight:[.025,0],ArrowUp:[0,-.025],ArrowDown:[0,.025]}[event.key];if(!direction)return;
  event.preventDefault();const p=cursor.map((n,i)=>Math.max(0,Math.min(1,n+direction[i])));if(pen)move(p);cursor=p;redraw(true);
 });
 canvas.addEventListener('blur',()=>{if(pen)finish();});
 root.querySelector('.plaque-writing-reset').onclick=()=>{state.strokes[PLAQUE_CHARACTERS[index]]=[];state.completed=state.completed.filter(char=>PLAQUE_CHARACTERS.indexOf(char)<index);save();startLetter();};
 next.onclick=()=>{if(!state.completed.includes(PLAQUE_CHARACTERS[index]))return;if(index===3){hide();onComplete();}else{index++;startLetter();}};
 function hide(){if(stroke)finish(true);active=false;root.hidden=true;ready=false;}
 return {async show(){state=readPlaqueTracing(getSaved());index=state.completed.length===4?3:state.completed.length;active=true;root.hidden=false;ready=false;await image.decode();if(active)startLetter();},hide,isComplete:()=>state?.completed.length===4};
}
