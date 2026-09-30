import {loadPhotoState,savePhotoState,entranceObserved,photoEvidenceComplete} from './photo-inquiry-state.js';
import {mountRoomLayers} from './room-presentation.js';
const ASSETS='assets/living-archive/photo-inquiry/';
const text=(name,alt,cls='')=>`<img class="${cls}" src="${ASSETS}text/${name}.png" alt="${alt}" draggable="false">`;
export {FIELDWORK_QUESTIONS} from './fieldwork-questions.js';
const regions=[
 {key:'roof',name:'屋脊',x:.31,y:.18,left:.055,top:.095,width:.465,height:.20},
 {key:'sign',name:'門邊的招牌',x:.375,y:.68,left:.34,top:.62,width:.07,height:.13},
 {key:'lion',name:'廟門左側的石獅',x:.26,y:.60,left:.20,top:.48,width:.13,height:.26},
 {key:'lion',name:'廟門右側的石獅',x:.75,y:.61,left:.69,top:.53,width:.12,height:.20},
];
export function initPhotoInquiry({onBack=()=>{},onOpenArchitecture=()=>{},storage=sessionStorage,canOpen=()=>true}={}){
 for(const name of ['rail-heading','rail-managers','rail-community','rail-school','rail-question','rail-source','rail-bridge','rail-c6','inscription-date','inscription-date-note','inscription-donor','inscription-donor-note','model-prompt','inscription-other','study-return-note','study-unavailable','study-label','study-credit','study-closer','study-observe','study-detail','study-move','study-trace','model-return','year','overview','observe','tap-detail','detail-notice','entrance','sign-canvas','lion-question','back-to-photo','observation-rest','hint-sign','observations-found','observations-limit','judgement-question','judgement-record','judgement-canvas-retry','judgement-canvas-ack','record-year','record-label','record-body','record-context','record-question','record-next','record-bridge','record-open','handoff-one','handoff-two','handoff-evidence']){const image=new Image();image.src=`${ASSETS}text/${name}.png`;image.decode().catch(()=>{});}
 const root=document.createElement('section');root.id='photo-inquiry';root.dataset.revision='three-clues-inscriptions-20260929';root.hidden=true;root.setAttribute('aria-label','觀察文武廟歷史照片');
 root.innerHTML=`<div class="photo-stage" tabindex="-1">
  <div class="photo-room-camera"><div class="photo-room-world"><img class="photo-room" src="assets/living-archive/opening/archive-room-evidence-v3.png" alt=""></div></div>
  <div class="photo-evidence"><div class="photo-surface" tabindex="0" role="region" aria-label="1868 年文武廟歷史照片；拖動、縮放；方向鍵移動，加減鍵縮放，Home 回看全圖">
   <div class="photo-plane"><img class="photo-original" src="${ASSETS}reference-01-08-205.jpg" alt="約 1868 年荷李活道文武廟：廟門前可見石獅、招牌、台階，旁邊有相鄰建築。" draggable="false">
    <div class="photo-marks" aria-hidden="true"></div>
    ${regions.map((r,i)=>`<button class="photo-detail photo-detail-${r.key}${i===3?'-right':''}" data-region="${i}" aria-label="觀察${r.name}" style="left:${r.left*100}%;top:${r.top*100}%;width:${r.width*100}%;height:${r.height*100}%" disabled></button>`).join('')}
   </div>
  </div></div>
  <div class="lion-study-layer" inert aria-label="石獅實物研究">
   <div class="lion-study-background"></div>
   <div class="lion-study-surface" tabindex="0" role="region" aria-label="石獅研究模型；左右拖動或方向鍵稍移視線，加減鍵縮放，Home 重設；Enter 選擇中央細節">
    <div class="lion-study-plane"><img class="lion-study-art" src="${ASSETS}lion-study-pair.png" alt="現存文武廟石獅的現代研究模型，一對石獅連同石座；用於觀察雕刻及表面，並非歷史照片。" draggable="false"><span class="lion-texture lion-texture-date"></span><span class="lion-texture lion-texture-donor"></span><button class="lion-inscription-hit lion-inscription-date" data-inscription="date" aria-label="查看左側石座文字"></button><button class="lion-inscription-hit lion-inscription-donor" data-inscription="donor" aria-label="查看右側石座文字"></button><img class="lion-study-mark" src="${ASSETS}observation-trace.png" alt="" hidden></div>
    <div class="lion-study-light"></div>
   </div>
   <div class="lion-study-credit">${text('study-credit','依現存石獅照片製作的現代研究表現；銘文取自原照。')}</div>
  </div>
  <div class="photo-lion-memory" hidden>${text('study-trace','1851 · 上中三市豬肉行送贈')}</div>
  <div class="photo-year">${text('year','1868')}</div>
  <div class="photo-prompt-anchor"><div class="photo-prompt" aria-live="polite">${text('overview','先看整張照片。')}</div><div class="lion-inscription-note" aria-live="polite" hidden></div><div class="photo-navigation-guide">${text('navigation','可以放大、移動，仔細看看。')}</div>
   <div class="photo-actions"><button class="photo-detail-return" aria-label="再看整張照片" hidden>${text('back-to-photo','再看整張照片')}</button><button class="lion-study-return" aria-label="回到舊照片" hidden>${text('model-return','回到舊照片 →')}</button><button class="photo-next" hidden></button></div>
  </div>
  <aside class="photo-evidence-rail" hidden aria-label="這裏還發生過甚麼？" aria-live="polite">
   <div class="rail-heading">這裏還發生過甚麼？</div>
   <div class="rail-year rail-reveal" data-rail="1">${text('record-year','1880')}</div>
   <div class="rail-terms"><div class="rail-reveal" data-rail="2">${text('rail-managers','文武廟值理')}</div><div class="rail-reveal" data-rail="3">${text('rail-community','坊眾')}</div><div class="rail-reveal" data-rail="4">${text('rail-school','義學')}</div></div>
   <div class="rail-reflection rail-reveal" data-rail="5">這些活動沒有被拍下來，<br>我們為甚麼仍然知道？</div>
   <div class="rail-source rail-reveal" data-rail="6">${text('rail-source','來自另一份文字紀錄')}</div>
  </aside>
  <div class="evidence-bridge" hidden>${text('rail-bridge','照片裏看不到的人，\n要從其他史料尋找。')}</div>
  <aside class="photo-documentary" aria-live="polite" hidden></aside>
  <div class="photo-judgement" hidden><div class="judgement-options"><button data-answer="photo">${text('judgement-photo','1868 年的照片')}</button><button data-answer="inscription">${text('judgement-record','石獅銘文的文字記錄')}</button></div></div>
  <div class="photo-controls"><button data-zoom="-1" aria-label="縮小照片">−</button><button data-zoom="1" aria-label="放大照片">＋</button><button class="photo-fit" aria-label="回看整張照片">↺</button></div>
  <details class="photo-source"><summary>${text('source','史料來源')}<small>Government Records Service, 01-08-205</small></summary><div><button class="photo-source-close" aria-label="關閉史料來源">關閉 ×</button>
   <p>約 1868 年，荷李活道文武廟。<br>Government Records Service · 01-08-205</p><a href="https://www.grs.gov.hk/ws/hip/en/birth.html" target="_blank" rel="noopener">查看照片出處 ↗</a>
   <p>石座文字依東華三院現存石獅銘文照片核對。請走近研究模型，點選石座上的文字細看；這些字並不能從 1868 年照片讀清。</p><a href="https://rho.tungwah.org.hk/content/media/2022/10/11/IMG_0015.jpg" target="_blank" rel="noopener">立置銘文原照 ↗</a><br><a href="https://rho.tungwah.org.hk/content/media/2022/10/11/IMG_0017.jpg" target="_blank" rel="noopener">送贈銘文原照 ↗</a>
   <p>1880 年義學的背景來自東華三院文物介紹：文武廟值理與坊眾支持東華醫院在廟旁中華書院設義學。這是後來的文字記錄，並非照片拍下的活動。</p><p>石獅實物研究是依現存石獅照片製作的現代美術表現，用於觀察形態與材質；不是 1868 年照片的清晰化版本。模型銘文取自原照，細節仍須到現場核對。</p><a href="https://rho.tungwah.org.hk/tc/built-heritage/2" target="_blank" rel="noopener">東華三院文物介紹 ↗</a>
  </div></details><div class="photo-loading" role="status" hidden>正在展開歷史照片…</div>
 </div>`;
 document.body.append(root);mountRoomLayers(root.querySelector('.photo-room-world'));
 const q=s=>root.querySelector(s),surface=q('.photo-surface'),plane=q('.photo-plane'),original=q('.photo-original');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let saved=loadPhotoState(storage),active=false,stage='from_map',scale=1,fitScale=1,zoomLevel=1,tx=0,ty=0;
 let inscriptionToken=0;
 let studyX=0,studyZoom=1,studyGesture=null,studyPoint=null,studyReady=false;
 let activeClue=null,nonLionSelections=0,lionSelected=false,guidanceShown=false,exploredMs=0,lastExplored=0,marks=[];
 const timers=new Set(),pointers=new Map();let gesture=null,pinch=null,promptToken=0;
 const later=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);if(active)fn();},ms);timers.add(id);return id;};
 function clearTimers(){timers.forEach(clearTimeout);timers.clear();pointers.clear();gesture=null;pinch=null;promptToken++;}
 function persist(){savePhotoState(storage,saved);try{storage.setItem('manmo-photo-observations-v1',JSON.stringify(marks));}catch{}window.dispatchEvent(new CustomEvent('archive-evidence-change'));}
 function state(value,view='photo'){
  stage=value;root.dataset.state=value;root.dataset.view=view;
  surface.inert=!['photo','record'].includes(view);
  q('.photo-evidence-rail').hidden=view!=='record';q('.evidence-bridge').hidden=view!=='record';
  if(view!=='record')q('.photo-lion-memory').removeAttribute('style');
  q('.lion-study-layer').inert=value!=='lion_2_5d_study';
  q('.photo-lion-memory').hidden=true;
  root.querySelectorAll('[data-region]').forEach(b=>b.disabled=!(value==='photo_select'&&regions[Number(b.dataset.region)].key!=='roof'||value==='roof_observation'&&regions[Number(b.dataset.region)].key==='roof'));
 }
 function prompt(name,alt,fade=false){
  const token=++promptToken,el=q('.photo-prompt');
  const update=()=>{if(token!==promptToken)return;el.innerHTML=text(name,alt);el.classList.remove('is-changing');root.dataset.prompt=name;};
  if(fade&&!reduced){el.classList.add('is-changing');later(update,180);}else update();
 }
 function hideCopy(){for(const s of ['.photo-detail-return','.photo-next','.photo-documentary','.photo-judgement','.lion-study-return','.lion-inscription-note'])q(s).hidden=true;}
 function next(name,alt){const b=q('.photo-next');b.innerHTML=text(name,alt);b.setAttribute('aria-label',alt.replace(/\s*→$/,''));b.hidden=false;}
 const ratio=1378/1000;
 const surfaceRatio=()=>surface.clientHeight/((surface.clientWidth||1)/ratio);
 function constrain(){const h=surfaceRatio();tx=scale<=1?(1-scale)/2:Math.max(1-scale,Math.min(0,tx));ty=scale<=h?(h-scale)/2:Math.max(h-scale,Math.min(0,ty));}
 function transform(animate=false){
  constrain();plane.style.transition=animate?`transform ${reduced?'.01':'.9'}s cubic-bezier(.22,.55,.25,1)`:'none';
  plane.style.setProperty('--photo-inverse-scale',String(1/scale));plane.style.transform=`translate(${tx*100}%,${ty*100}%) scale(${scale})`;
  root.dataset.zoom=String(zoomLevel);
  if(root.dataset.view==='record'){
   const memory=q('.photo-lion-memory'),w=surface.clientWidth,h=surface.clientHeight;
   memory.style.left=`${Math.max(18,Math.min(w-210,(tx+.26*scale)*w))}px`;
   memory.style.top=`${Math.max(100,Math.min(h-100,(ty+.73*scale)*(w/ratio)))}px`;memory.style.right='auto';
  }
  for(const b of root.querySelectorAll('[data-region]')){b.style.minWidth=`${44/scale}px`;b.style.minHeight=`${44/scale}px`;}
 }
 function fit(animate=false){const old=scale,documentary=root.dataset.view==='record';fitScale=stage!=='photo_overview'&&surface.clientWidth>surface.clientHeight?Math.max(1,surfaceRatio()):Math.min(1,surfaceRatio());scale=fitScale*zoomLevel;
  if(zoomLevel===1){tx=(1-scale)/2;ty=(surfaceRatio()-scale)/2;}else{const change=scale/old;tx=.5-(.5-tx)*change;ty=surfaceRatio()/2-(surfaceRatio()/2-ty)*change;}transform(animate);
 }
 function focus(x,y,z){zoomLevel=Math.max(1,Math.min(3.5,z));scale=fitScale*zoomLevel;tx=.5-x*scale;ty=surfaceRatio()/2-y*scale;transform(true);}
 function resetPhoto(){zoomLevel=1;fit(true);}
 function zoom(delta,ax=.5,ay=surfaceRatio()/2){const nx=Math.max(1,Math.min(3.5,zoomLevel+delta)),sx=(ax-tx)/scale,sy=(ay-ty)/scale;zoomLevel=nx;scale=fitScale*nx;tx=ax-sx*scale;ty=ay-sy*scale;transform();meaningful();}
 function drawMarks(){q('.photo-marks').innerHTML=marks.map(p=>`<img class="photo-mark" src="${ASSETS}observation-trace.png" style="left:${p.x*100}%;top:${p.y*100}%" alt="">`).join('');}
 function mark(x,y,clue){marks.push({x,y,clue});marks=marks.slice(-12);drawMarks();persist();}
 function guideLion(){
  if(guidanceShown||lionSelected||saved.clues.lion||!['photo_select','sign_read'].includes(stage))return;
  guidanceShown=true;prompt('entrance','入口附近，還有沒有甚麼值得看看？',true);
 }
 function meaningful(){
  if(!['photo_select'].includes(stage))return;
  const now=performance.now();if(lastExplored)exploredMs+=Math.min(1200,now-lastExplored);lastExplored=now;
  root.dataset.explored='true';if(exploredMs>=10000)guideLion();
 }
 function selectClue(clue,x,y){
  if(!['photo_select','roof_observation'].includes(stage)||!['sign','lion','roof'].includes(clue)||clue==='roof'&&!photoEvidenceComplete(saved))return;
  clearTimers();hideCopy();activeClue=clue;root.dataset.explored='true';mark(x,y,clue);
  if(clue==='lion'){lionSelected=true;saved.lionRevealed=true;persist();}else nonLionSelections++;
  focus(x,y,clue==='sign'?2.6:clue==='lion'?2.15:2.1);state(`${clue}_focus`);prompt('detail-notice','你在這裏注意到甚麼？');
  later(()=>{
   if(clue==='lion'){
    state('lion_study_invitation');prompt('study-closer','再仔細看看這件石獅。');enterStudy();
   }else{
    state(`${clue}_read`);
    // Only these approved regions carry existing source-supported copy.
    if(clue==='sign')prompt('sign-canvas','字樣似是「卜命」。\n是誰掛出這塊招牌？');
    if(clue==='roof'){saved.roofRidgeDiscovered=true;persist();state('roof_introduction');nativePrompt('屋脊上，也藏着人物與故事。','借現存、帶有 1893 年款的陶塑走近看看；它不能證明 1868 年照片中的屋脊已有相同面貌。');nextNative('走近陶塑，細看形態 →');return;}
    if(nonLionSelections>=2)later(guideLion,3500);
   }
   q('.photo-detail-return').hidden=clue==='lion';
  },reduced?80:1000);
 }
 // Temporary material study. The historical image node and its transform stay intact underneath.
 function studyUI(enabled){
  q('.photo-year').innerHTML=enabled?text('study-label','實物研究'):text('year','1868');
  q('.photo-source small').textContent=enabled?'現代研究表現 · 依東華三院現存石獅照片':'Government Records Service, 01-08-205';
  q('[data-zoom="-1"]').setAttribute('aria-label',enabled?'縮小石獅':'縮小照片');q('[data-zoom="1"]').setAttribute('aria-label',enabled?'放大石獅':'放大照片');
  q('.photo-fit').setAttribute('aria-label',enabled?'重設石獅視線':'回看整張照片');
 }
 function renderStudy(){
  const plane=q('.lion-study-plane');plane.style.setProperty('--study-x',`${studyX*22}px`);plane.style.setProperty('--study-zoom',studyZoom);
  plane.style.transformOrigin=studyPoint?`${studyPoint.x*100}% ${studyPoint.y*100}%`:'50% 48%';
  q('.lion-study-background').style.transform=`translateX(${-studyX*7}px) scale(1.06)`;
  q('.lion-study-light').style.setProperty('--study-light',`${50+studyX*20}%`);
 }
 function studyTouched(){root.dataset.studyMoved='true';}
 function resetStudy(){studyX=0;studyZoom=1;studyPoint=null;q('.lion-study-mark').hidden=true;renderStudy();}
 function zoomStudy(delta){studyZoom=Math.max(1,Math.min(1.65,studyZoom+delta));renderStudy();studyTouched();}
 async function enterStudy(){
  if(stage!=='lion_study_invitation')return;
  try{await q('.lion-study-art').decode();}catch{prompt('study-unavailable','研究素材未能載入，請重試。');q('.photo-loading').hidden=false;q('.photo-loading').innerHTML='研究素材未能載入。<button type="button" data-study-retry>重新載入</button>';return;}
  if(!active||stage!=='lion_study_invitation')return;
  hideCopy();studyReady=false;root.dataset.studyMoved='false';resetStudy();studyUI(true);q('.photo-source').open=false;
  state('lion_study_transition','study');prompt('study-closer','再仔細看看這件石獅。');
  later(()=>{state('lion_2_5d_study','study');prompt('model-prompt','看看石座，有甚麼留下來？');q('.lion-study-surface').focus({preventScroll:true});
   later(()=>{studyReady=true;q('.lion-study-return').hidden=!(saved.inscriptions.date&&saved.inscriptions.donor);},2200);
  },reduced?80:1100);
 }
 function selectStudy(x,y){
  if(stage!=='lion_2_5d_study'||x<0||x>1||y<0||y>1)return;
  inscriptionToken++;q('.lion-inscription-note').hidden=true;
  studyPoint={x,y};studyX=Math.max(-1,Math.min(1,(x-.5)*2));studyZoom=Math.max(studyZoom,1.18);renderStudy();studyTouched();
  const m=q('.lion-study-mark');m.style.left=`${x*100}%`;m.style.top=`${y*100}%`;m.hidden=false;
  prompt('study-detail','你看到哪些凹凸、線條或磨損？');
 }
 function returnFromStudy(){
  if(stage!=='lion_2_5d_study'||!studyReady||!saved.inscriptions.date||!saved.inscriptions.donor)return;
  clearTimers();hideCopy();studyGesture=null;studyUI(false);state('lion_study_return');prompt('study-return-note','再看看照片裏的石獅。');
  saved.clues.lion=true;persist();
  later(()=>backToPhoto(),reduced?80:900);
 }
 function readInscription(key){
  if(stage!=='lion_2_5d_study'||!['date','donor'].includes(key))return;
  studyTouched();saved.inscriptions[key]=true;saved.lionRevealed=true;persist();
  const token=++inscriptionToken;
  prompt(`inscription-${key}`,key==='date'?'咸豐元年四月吉日立':'上中三市豬肉行敬送');
  q('.lion-inscription-note').innerHTML=text(`inscription-${key}-note`,key==='date'?'銘文留下了立置的時間：1851 年。':'銘文留下了送贈者：上中三市豬肉行。');q('.lion-inscription-note').hidden=false;
  const done=saved.inscriptions.date&&saved.inscriptions.donor;
  q('.lion-study-return').hidden=!done||!studyReady;
  later(()=>{if(stage!=='lion_2_5d_study'||token!==inscriptionToken)return;
   if(done){q('.lion-inscription-note').hidden=true;prompt('lion-question','為甚麼一群街市商人，\n會在這裏留下石獅？');}
   else{q('.lion-inscription-note').innerHTML+=text('inscription-other','另一座石獅，又留下甚麼？');}
  },4000);
 }
 root.querySelectorAll('[data-inscription]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();if(e.detail===0)readInscription(b.dataset.inscription);}));
 q('.lion-study-return').addEventListener('click',returnFromStudy);
 const studySurface=q('.lion-study-surface');
 studySurface.insertAdjacentHTML('afterend',`<div class="lion-study-hint">${text('study-move','移動看看。')}</div>`);
 studySurface.addEventListener('pointerdown',e=>{if(stage!=='lion_2_5d_study'||e.button!==0||studyGesture)return;studySurface.setPointerCapture(e.pointerId);studyGesture={id:e.pointerId,x:e.clientX,y:e.clientY,start:studyX,moved:false,inscription:e.target.closest('[data-inscription]')?.dataset.inscription};});
 studySurface.addEventListener('pointermove',e=>{if(!studyGesture||studyGesture.id!==e.pointerId)return;const dx=e.clientX-studyGesture.x;if(Math.hypot(dx,e.clientY-studyGesture.y)>6)studyGesture.moved=true;if(studyGesture.moved){studyX=Math.max(-1,Math.min(1,studyGesture.start+dx/studySurface.clientWidth*3));renderStudy();studyTouched();}});
 function finishStudyPointer(e){if(!studyGesture||studyGesture.id!==e.pointerId)return;const tap=!studyGesture.moved,key=studyGesture.inscription;studyGesture=null;if(tap&&e.type==='pointerup'){if(key){readInscription(key);return;}const r=q('.lion-study-plane').getBoundingClientRect();selectStudy((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);}}
 studySurface.addEventListener('pointerup',finishStudyPointer);studySurface.addEventListener('pointercancel',finishStudyPointer);
 studySurface.addEventListener('wheel',e=>{if(stage!=='lion_2_5d_study')return;e.preventDefault();zoomStudy(e.deltaY<0?.08:-.08);},{passive:false});
 studySurface.addEventListener('keydown',e=>{if(e.target.closest('[data-inscription]'))return;if(stage!=='lion_2_5d_study')return;if(['ArrowLeft','ArrowRight','+','=','-','Home','Enter',' '].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft'||e.key==='ArrowRight'){studyX=Math.max(-1,Math.min(1,studyX+(e.key==='ArrowLeft'?-.15:.15)));renderStudy();studyTouched();}else if(e.key==='+'||e.key==='=')zoomStudy(.15);else if(e.key==='-')zoomStudy(-.15);else if(e.key==='Home')resetStudy();else if(e.key==='Enter'||e.key===' ')selectStudy(.5,.5);});
 function notice(x,y){
  if(!['photo_select','roof_observation'].includes(stage)||!Number.isFinite(x+y)||x<0||x>1||y<0||y>1)return;
  const r=regions.find(r=>(stage==='roof_observation'?r.key==='roof':r.key!=='roof')&&x>=r.left&&x<=r.left+r.width&&y>=r.top&&y<=r.top+r.height);
  // Areas outside the three authored evidence categories remain the immutable photo.
  if(r)selectClue(r.key,x,y);
 }
 function backToPhoto(acknowledge=false){
  if(acknowledge&&['sign_read','roof_read'].includes(stage)){
   saved.clues[activeClue]=true;
   if(activeClue==='roof')saved.roofRidgeDiscovered=true;
   persist();
  }
  clearTimers();hideCopy();resetPhoto();activeClue=null;
  if(saved.completed&&photoEvidenceComplete(saved)){roofBridge();}
  else if(entranceObserved(saved)){if(!saved.judgement)sourceJudgement();else if(!saved.recordSeen)record();else photoPayoff();}
  else{
   state('photo_select');
   const missing=!saved.clues.sign&&saved.clues.lion?'sign':null;
   prompt(missing?`hint-${missing}`:'observation-rest',missing==='sign'?'門口還有一塊小招牌。':'再看看，照片裏還留下甚麼？');
   surface.focus({preventScroll:true});if(nonLionSelections>=2)later(guideLion,2200);
  }
 }
 function record(){
  clearTimers();hideCopy();state('record_bridge');resetPhoto();prompt('record-bridge','還有一些人，\n要從文字記載中尋找。');later(revealRecord,2200);
 }
 function revealRecord(){
  clearTimers();hideCopy();state('record_1880','record');root.dataset.railBeat='0';
  q('.photo-evidence-rail').querySelectorAll('[data-rail]').forEach(el=>{el.classList.remove('is-revealed');el.setAttribute('aria-hidden','true');});
  resetPhoto();
  // Same image and surface. Only their available width changes to make room for text.
  const reveal=beat=>{root.dataset.railBeat=String(beat);const el=q(`[data-rail="${beat}"]`);el.classList.add('is-revealed');el.removeAttribute('aria-hidden');};
  [700,1400,2100,2800,4600,7500].forEach((ms,i)=>later(()=>reveal(i+1),ms));
  later(()=>{saved.recordSeen=true;persist();state('record_ready','record');next('record-next','繼續看看 →');},12000);
 }
 function nativePrompt(copy,source=''){promptToken++;q('.photo-prompt').replaceChildren();const line=document.createElement('p');line.className='photo-editorial';line.textContent=copy;q('.photo-prompt').append(line);if(source){const note=document.createElement('small');note.textContent=source;q('.photo-prompt').append(note);}root.dataset.prompt='editorial';}
 function nextNative(label){const b=q('.photo-next');b.textContent=label;b.setAttribute('aria-label',label.replace(/\s*→$/,''));b.hidden=false;}
 function sourceJudgement(){
  hideCopy();state('source_judgement');resetPhoto();prompt('judgement-question','石獅是照片讓你看見的；\n送贈者，你是從哪裏讀到的？');q('.photo-judgement').hidden=false;
  q('[data-answer=photo]').focus({preventScroll:true});
 }
 function photoPayoff(){
  clearTimers();hideCopy();state('observation_summary');resetPhoto();
  prompt('reflection-first','照片留下了一些痕跡。');
  later(()=>{prompt('reflection-second','但有些故事，\n要靠其他史料才能讀出來。',true);next('look-up','抬頭看看 →');},2200);
 }
 function roofBridge(){
  clearTimers();hideCopy();state('roof_bridge');resetPhoto();prompt('entrance-traces','門前留下了一些線索。');
  later(()=>{state('roof_observation');prompt('look-higher','如果把視線再抬高一點呢？');surface.focus({preventScroll:true});},2000);
 }

 function hide(){if(!active||!saved.completed)return;clearTimers();persist();active=false;root.hidden=true;onBack({completed:true,fromRoof:true});}
 q('.photo-detail-return').addEventListener('click',()=>backToPhoto(true));
 q('.photo-next').addEventListener('click',()=>{
  if(stage==='roof_introduction'){clearTimers();hideCopy();active=false;root.hidden=true;onOpenArchitecture();return;}
  if(stage==='record_ready'){photoPayoff();return;}
  if(stage==='observation_summary'&&photoEvidenceComplete(saved)){saved.completed=true;persist();roofBridge();return;}
  if(stage==='source_ack'){record();return;}
 });
 root.querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>{
  if(stage!=='source_judgement'||!entranceObserved(saved))return;
  if(b.dataset.answer!=='inscription'){prompt('judgement-canvas-retry','照片看得見石獅，卻讀不清座上的字。\n送贈者的名字，是由哪一種史料補上的？');return;}
  saved.judgement=true;persist();hideCopy();state('source_ack');prompt('judgement-canvas-ack','照片讓你發現石獅；\n銘文的文字記錄，補上了送贈者。');later(record,3200);
 }));
 function resetAction(){if(root.dataset.view==='study'){if(stage==='lion_2_5d_study')resetStudy();return;}if(['lion_focus','lion_read','lion_study_invitation','lion_study_transition','lion_study_return'].includes(stage))return;if(['sign_read'].includes(stage))backToPhoto(true);else resetPhoto();}
 q('.photo-fit').addEventListener('click',resetAction);surface.addEventListener('dblclick',()=>{if(!['photo_overview','photo_question'].includes(stage))resetAction();});
 root.querySelectorAll('[data-zoom]').forEach(b=>b.addEventListener('click',()=>{if(root.dataset.view==='study'){if(stage==='lion_2_5d_study')zoomStudy(Number(b.dataset.zoom)*.15);}else if(canMove())zoom(Number(b.dataset.zoom)*.25);}));
 root.querySelectorAll('[data-region]').forEach(b=>b.addEventListener('click',e=>{if(e.detail===0){const r=regions[Number(b.dataset.region)];selectClue(r.key,r.x,r.y);}}));
 function canMove(){return ['photo','record'].includes(root.dataset.view)&&!stage.endsWith('_focus')&&!['lion_study_invitation','lion_study_return'].includes(stage);}
 surface.addEventListener('pointerdown',e=>{
  if(!canMove()||e.button!==0)return;plane.style.transition='none';surface.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===1)gesture={x:e.clientX,y:e.clientY,tx,ty,moved:false,region:e.target.closest('[data-region]')?.dataset.region};
  if(pointers.size===2){const[a,b]=[...pointers.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),zoomLevel};if(gesture)gesture.moved=true;}
 });
 surface.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pinch&&pointers.size===2){const[a,b]=[...pointers.values()],r=surface.getBoundingClientRect(),nz=Math.max(1,Math.min(3.5,pinch.zoomLevel*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,pinch.distance)));zoom(nz-zoomLevel,((a.x+b.x)/2-r.left)/r.width,((a.y+b.y)/2-r.top)/(r.width/ratio));return;}
  if(!gesture)return;const r=surface.getBoundingClientRect(),dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;if(Math.hypot(dx,dy)>6)gesture.moved=true;tx=gesture.tx+dx/r.width;ty=gesture.ty+dy/(r.width/ratio);transform();if(gesture.moved)meaningful();
 });
 function release(e){if(!pointers.has(e.pointerId))return;const tapped=gesture&&!gesture.moved&&pointers.size===1,hit=gesture?.region;pointers.delete(e.pointerId);if(!pointers.size){if(tapped&&e.type!=='pointercancel'){if(hit!==undefined&&['photo_select','roof_observation'].includes(stage)){const target=regions[Number(hit)];selectClue(target.key,target.x,target.y);}else{const r=surface.getBoundingClientRect();notice(((e.clientX-r.left)/r.width-tx)/scale,((e.clientY-r.top)/(r.width/ratio)-ty)/scale);}}gesture=null;pinch=null;}else{const p=[...pointers.values()][0];gesture={x:p.x,y:p.y,tx,ty,moved:true};pinch=null;}}
 surface.addEventListener('pointerup',release);surface.addEventListener('pointercancel',release);
 surface.addEventListener('wheel',e=>{if(!canMove())return;e.preventDefault();const r=surface.getBoundingClientRect();zoom(e.deltaY<0?.15:-.15,(e.clientX-r.left)/r.width,(e.clientY-r.top)/(r.width/ratio));},{passive:false});
 surface.addEventListener('keydown',e=>{if(!canMove())return;if(['+','=','-','Home','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();if(e.key==='+'||e.key==='=')zoom(.2);else if(e.key==='-')zoom(-.2);else if(e.key==='Home')resetAction();else if(e.key.startsWith('Arrow')){if(zoomLevel===1)zoom(.2);tx+=e.key==='ArrowLeft'?.08:e.key==='ArrowRight'?-.08:0;ty+=e.key==='ArrowUp'?.08:e.key==='ArrowDown'?-.08:0;transform();meaningful();}});
 document.addEventListener('keydown',e=>{if(active&&e.key==='Escape'){e.preventDefault();e.stopPropagation();q('.photo-source').open=false;}});
 q('.photo-source-close').addEventListener('click',()=>q('.photo-source').open=false);
 new ResizeObserver(()=>{if(active)fit();}).observe(surface);
 async function beginObservation(){
  try{await original.decode();}catch{q('.photo-loading').hidden=false;q('.photo-loading').innerHTML='照片未能載入。<button type="button">重新載入</button>';return;}
  if(!active)return;q('.photo-loading').hidden=true;state('photo_overview');resetPhoto();prompt('overview','先看整張照片。');surface.focus({preventScroll:true});
  later(()=>{state('photo_question');fit(true);prompt('observe','如果不只看這座廟，\n你還注意到甚麼？',true);
   later(()=>{if(entranceObserved(saved)||saved.completed){backToPhoto();}else{state('photo_select');prompt('tap-detail','點出門口招牌、石獅或屋脊，看看各自留下甚麼線索。',true);}},2200);
  },2200);
 }
 q('.photo-loading').addEventListener('click',()=>{if(stage==='lion_study_invitation'){q('.photo-loading').hidden=true;enterStudy();}else{original.src=original.src;beginObservation();}});
 return {
  resumeFromArchitecture(completed=false){active=true;root.hidden=false;if(completed){saved.architectureStudyCompleted=true;saved.clues.roof=true;persist();hide();}else{persist();roofBridge();}},
  show(){if(!canOpen())return;studyUI(false);clearTimers();hideCopy();active=true;root.hidden=false;saved=loadPhotoState(storage);nonLionSelections=0;lionSelected=saved.clues.lion;guidanceShown=false;exploredMs=lastExplored=0;delete root.dataset.explored;zoomLevel=1;scale=fitScale=1;tx=ty=0;
   try{marks=JSON.parse(storage.getItem('manmo-photo-observations-v1')||'[]').filter(p=>['sign','lion','roof'].includes(p.clue)&&Number.isFinite(p.x+p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1).slice(-12);}catch{marks=[];}drawMarks();state('from_map','room');fit();q('.photo-stage').focus({preventScroll:true});
   requestAnimationFrame(()=>{if(!active)return;state('approach_photo','entering');later(beginObservation,reduced?80:1100);});
  },hide,getState:()=>({stage,...saved}),
 };
}
