import {initPlaqueTracing} from './plaque-tracing.js';
import {plaqueStudyObject} from './plaque-study-object.js';
import {mountRoomLayers} from './room-presentation.js';
export {PLAQUE_QUESTION} from './fieldwork-questions.js';
const SOURCE='https://www.tungwah.org.hk/heritage/historic-architecture/man-mo-temple/architectural-design/';
const PLACEMENT='https://www.tungwah.org.hk/press-release/145%E5%87%BA%E5%B7%A1%EF%BC%8E%E6%96%87%E6%AD%A6%E5%BB%9F%E7%A7%8B%E7%A5%AD/';
const ASSETS='assets/living-archive/threshold/';

// Object study and archive closure only. /experience/ owns every etiquette decision.
export function initThresholdJourney({host=document.querySelector('#experience'),getState=()=>({}),onEvent=()=>{},onBack=()=>{}}={}){
 const root=document.createElement('section');root.id='threshold-journey';root.hidden=true;root.setAttribute('aria-label','牌匾研究，從修復室走到文武廟');
 root.innerHTML=`<div class="threshold-world"><img class="threshold-environment" src="assets/living-archive/opening/archive-room-evidence-v3.png" alt="修復室裏的畫像、舊地圖、歷史照片、陶塑與牌匾"><div class="threshold-room-layers"></div></div>
 <div class="arrival-camera" hidden><img class="threshold-arrival-art" src="${ASSETS}arrival-hollywood-road-painterly-v3.png" alt="依實地參考繪製的文武廟入口：綠瓦門柱、石階與敞開的廟門"><img class="arrival-door-light" src="${ASSETS}arrival-hollywood-road-painterly-v3.png" alt="" aria-hidden="true"><button class="arrival-door" type="button" aria-label="進入文武廟，開始入廟禮儀準備"><span>走進廟門 →</span></button></div><div class="arrival-dissolve" aria-hidden="true"></div>
 <div class="threshold-light" aria-hidden="true"></div>
 <div class="threshold-plaque-study">${plaqueStudyObject()}<button class="threshold-plaque-target" type="button" aria-label="細看牌匾上的整段題字"></button></div>
 <aside class="plaque-records" aria-label="牌匾旁的文字史料" hidden>
  <button class="plaque-record-gift" type="button"><span>1879</span><small>查閱御賜記錄 ↗</small></button>
  <p class="plaque-gift-note" hidden><span>1879</span>光緒皇帝御賜</p>
  <button class="plaque-record-relief" type="button" hidden><span>1876–78</span><small>查閱賑災背景 ↗</small></button>
  <p class="plaque-relief-note" hidden>1876–78 年嚴重旱災<br><span class="record-connection" aria-hidden="true">↓</span>東華籌款賑濟</p>
  <small class="plaque-record-credit">東華三院・建築特色</small>
 </aside>
 <button class="threshold-back" type="button">返回修復室 ←</button>
 <div class="threshold-copy" tabindex="-1"><p class="threshold-eyebrow"></p><h1 class="threshold-title"></h1><div class="threshold-body" aria-live="polite"></div><div class="threshold-choices"></div><button class="threshold-next" type="button" hidden></button></div>
 <div class="threshold-footer"><button class="threshold-source" type="button">史料與圖像說明</button><span class="threshold-location">修復室・研究表現</span></div>
 <dialog class="threshold-sources"><h2>史料與圖像說明</h2><p>「神威普佑」、1879 年御賜及 1876–78 年旱災期間東華籌款賑濟的背景，依東華三院《建築特色》。正門位置依〈145出巡．文武廟秋祭〉。</p><p>牌匾研究沿用同一彩色美術底圖。變亮表示理解增加，並非聲稱原物受損或已被實際修復。官方原照只供來源參考，並不在研究場景中展示。</p><p>廟外及門檻場景是依實地與官方照片製作的現代美術表現，不作建築測繪或歷史證據。現場細節仍須親自核對。</p><p><a href="${SOURCE}" target="_blank" rel="noopener">東華三院・建築特色 ↗</a></p><p><a href="${PLACEMENT}" target="_blank" rel="noopener">東華三院・正門牌匾位置 ↗</a></p><p><a href="https://www.tungwah.org.hk/upload/CH/heritage/manmo_architectural03.jpg" target="_blank" rel="noopener">牌匾位置原照 ↗</a></p><button class="threshold-source-close" type="button">回到觀察</button></dialog>`;
 host.append(root);mountRoomLayers(root.querySelector('.threshold-room-layers'));
 const q=s=>root.querySelector(s),timers=new Set();let active=false,phase='',epoch=0;
 const writing=initPlaqueTracing({host:root,getSaved:()=>getState().plaqueTracing,onSave:state=>onEvent('plaqueTracing',state),onReady:char=>screen('writing',`沿着字跡，重新寫「${char}」。`,`用手指、筆或滑鼠描寫。
四字寫完，再讀背後的故事。`),onComplete:readWords});
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function clear(){epoch++;timers.forEach(clearTimeout);timers.clear();}
 function later(fn,ms){const id=setTimeout(()=>{timers.delete(id);if(active)fn();},ms);timers.add(id);return id;}
 function screen(next,title,body='',eyebrow=''){
  clear();phase=next;root.dataset.phase=next;
  q('.threshold-title').textContent=title;q('.threshold-body').textContent=body;q('.threshold-eyebrow').textContent=eyebrow;
  q('.threshold-choices').replaceChildren();q('.threshold-next').hidden=true;
  q('.threshold-plaque-target').hidden=next!=='inspect';q('.threshold-copy').focus({preventScroll:true});
 }
 function action(label,fn){const el=q('.threshold-next');el.textContent=label;el.hidden=false;el.onclick=fn;}
 function readability(level){root.dataset.readability=level;q('.plaque-study-object').dataset.readability=level;}
 function room(){root.dataset.world='room';q('.arrival-camera').hidden=true;q('.threshold-location').textContent='修復室・研究表現';}
 function inspect(){
  room();root.classList.remove('is-close','is-matched');q('.plaque-records').hidden=true;readability('veiled');screen('approach','');
  // Begin on the same upper-right rack before the object approaches the lens.
  later(()=>{root.classList.add('is-close');writing.show();},reduced()?0:900);
 }
 function readWords(){
  if(!writing.isComplete())return;
  readability('inscription');screen('inscription','只看這四個字，你知道了甚麼？');
  later(()=>{q('.threshold-body').textContent='又有甚麼，是這四個字沒有告訴你的？';q('.plaque-records').hidden=false;q('.plaque-record-gift').hidden=false;q('.plaque-gift-note').hidden=true;q('.plaque-record-relief').hidden=true;q('.plaque-relief-note').hidden=true;q('.plaque-record-gift').focus({preventScroll:true});},2400);
 }
 function revealGift(){
  if(phase!=='inscription')return;
  screen('source','文字記錄，補上了來歷。');readability('context');q('.plaque-record-gift').hidden=true;q('.plaque-gift-note').hidden=false;
  q('.plaque-record-relief').hidden=false;q('.plaque-record-relief').focus({preventScroll:true});
 }
 function revealRelief(){
  if(phase!=='source')return;
  screen('relief','這塊牌匾，為甚麼會和賑災有關？');q('.plaque-record-relief').hidden=true;q('.plaque-relief-note').hidden=false;
  later(()=>{readability('complete');screen('readable','一塊牌匾，重新變得可讀。','它把文武廟與一段賑災的故事連在一起。');onEvent('plaque');window.dispatchEvent(new Event('archive-evidence-change'));action('回看修復室 →',synthesis);},3200);
 }
 function synthesis(){
  room();root.classList.remove('is-close');q('.plaque-records').hidden=true;readability('complete');
  screen('synthesis','你已經知道，可以怎樣讀一座廟了。','從位置、人物、建築與文字，\n讀出一座廟與社區的關係。');
  action('離開修復室 →',arrival);
 }
 function arrival(){
  root.dataset.world='exterior';root.classList.remove('is-close','is-matched');q('.arrival-camera').hidden=false;q('.plaque-records').hidden=true;
  screen('departure','離開修復室，走到廟門前。','真正開始考察之前，\n先學會怎樣進入這個仍然被使用的地方。','上環・荷李活道');
  q('.threshold-location').textContent='依實地參考繪製・現代美術表現';
  resetDoor();alignDoor();
 }
 // Map the measured doorway in the unchanged raster through its existing cover crop.
 function alignDoor(){
  if(q('.arrival-camera').hidden||root.classList.contains('is-entering-door'))return;
  const art=q('.threshold-arrival-art'),w=art.clientWidth,h=art.clientHeight;
  const scale=Math.max(w/1672,h/941),iw=1672*scale,ih=941*scale;
  const position=getComputedStyle(art).objectPosition.split(' ').map(parseFloat);
  const left=(w-iw)*position[0]/100+iw*.451,top=(h-ih)*position[1]/100+ih*.432;
  const width=iw*.091,height=ih*.181;
  const door=q('.arrival-door');Object.assign(door.style,{left:`${left}px`,top:`${top}px`,width:`${width}px`,height:`${height}px`});
  const camera=q('.arrival-camera');camera.style.setProperty('--door-center-x',`${left+width/2}px`);camera.style.setProperty('--door-center-y',`${top+height/2}px`);
  const light=q('.arrival-door-light');Object.assign(light.style,{width:`${w}px`,height:`${h}px`,objectPosition:getComputedStyle(art).objectPosition,clipPath:`inset(${top}px ${w-left-width}px ${h-top-height}px ${left}px)`});
 }
 function resetDoor(){root.classList.remove('is-entering-door');q('.arrival-door').disabled=false;}
 q('.arrival-door').onclick=()=>{
  if(phase!=='departure'||root.classList.contains('is-entering-door'))return;
  alignDoor();root.classList.add('is-entering-door');q('.arrival-door').disabled=true;
  later(()=>{window.location.href=new URL('../experience/index.html',location.href).href;},reduced()?240:2100);
 };
 new ResizeObserver(alignDoor).observe(q('.threshold-arrival-art'));
 window.addEventListener('pageshow',()=>{if(active&&phase==='departure'){clear();resetDoor();alignDoor();}});
 q('.threshold-plaque-target').hidden=true;q('.plaque-record-gift').onclick=revealGift;q('.plaque-record-relief').onclick=revealRelief;
 q('.threshold-back').onclick=()=>{hide();onBack();};q('.threshold-source').onclick=()=>q('.threshold-sources').showModal();q('.threshold-source-close').onclick=()=>q('.threshold-sources').close();
 root.addEventListener('pointermove',event=>{if(!root.classList.contains('is-close')||reduced()||event.pointerType==='touch'||phase==='match')return;root.style.setProperty('--plaque-yaw',`${(event.clientX/innerWidth-.5)*5}deg`);});
 root.addEventListener('pointerleave',()=>root.style.setProperty('--plaque-yaw','0deg'));
 root.addEventListener('keydown',event=>{if(event.key==='Escape'&&!root.querySelector('dialog[open]')){hide();onBack();}if(phase==='inspect'&&['ArrowLeft','ArrowRight'].includes(event.key)&&!reduced()){event.preventDefault();root.style.setProperty('--plaque-yaw',event.key==='ArrowLeft'?'-3deg':'3deg');}});
 function hide(){writing.hide();active=false;clear();resetDoor();root.querySelectorAll('dialog').forEach(el=>el.close());root.hidden=true;}
 return {show(step='plaque'){active=true;root.hidden=false;if(step==='plaque')inspect();else if(step==='etiquette')synthesis();else window.location.href=new URL('../experience/index.html#fieldwork-themes',location.href).href;},hide};
}
