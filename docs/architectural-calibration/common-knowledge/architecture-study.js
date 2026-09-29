import {ARCHITECTURE_SOURCE} from './architecture-source.js?v=7';
import {mountRoomLayers} from './room-presentation.js';

const room='assets/living-archive/opening/archive-room-evidence-v3.png';
const base='assets/living-archive/architecture-study/';
const imageText=(name,alt,cls='')=>`<img class="${cls}" src="${base}text/${name}.png" alt="${alt}" draggable="false">`;
const regions={
  phoenix:{question:'人物旁邊還出現了甚麼？',title:'鳳凰',target:'細看人物旁邊的鳥形陶塑'},
  pattern:{question:'除了人物，你還看到哪些重複的線條、色彩或形狀？',title:'裝飾紋樣',body:'工匠利用人物、紋樣、色彩和前後層次，把整組陶塑連接起來。',target:'細看模型上的裝飾紋樣'},
  base:{question:'它看起來像一件獨立擺設，還是建築的一部分？',title:'屋脊陶塑',body:'這組人物和裝飾，原本就是文武廟主脊的一部分。',target:'細看模型下方與建築相連的底座'},
};
const regionNames=Object.keys(regions);
const model=(interactive=false)=>`<div class="architecture-model"${interactive?'':' aria-hidden="true"'}><div class="architecture-model-depth architecture-model-depth-back"></div><div class="architecture-model-visual"><img class="architecture-source" src="${ARCHITECTURE_SOURCE.src}" alt="" draggable="false"><img class="architecture-faded" src="${ARCHITECTURE_SOURCE.src}" alt="" draggable="false">${['figure',...regionNames].map(name=>`<img class="architecture-${name}-readable" src="${ARCHITECTURE_SOURCE.src}" alt="" draggable="false">`).join('')}</div><div class="architecture-model-depth architecture-model-depth-front"></div>${interactive?`<button type="button" class="architecture-figure-target" aria-label="細看模型上方中央的細節" disabled></button>${regionNames.map(name=>`<button type="button" class="architecture-${name}-target" aria-label="${regions[name].target}" disabled></button>`).join('')}`:''}</div>`;

export function initArchitectureStudy({roomRoot,onReturn=()=>{},canOpen=()=>true,onComplete=()=>{}}){
  let root,stage,hit,active=false,phase='room_idle',generation=0,ready=false;
  let focusOrigin=null,observed=false,readingTimer=0,zoom=1,px=0,py=0,pinchDistance=0,closeAt=0,targetPointer=null,activeRegion=null,combinedSeen=false,fieldworkStep=0;
  const readable={figure:false,phoenix:false,pattern:false,base:false};
  const timers=new Set(),pointers=new Map();
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function later(fn,ms){const token=generation;const id=setTimeout(()=>{timers.delete(id);if(active&&generation===token)fn();},ms);timers.add(id);return id;}
  function clear(){generation++;timers.forEach(clearTimeout);timers.clear();pointers.clear();pinchDistance=0;}
  const scene=roomRoot.querySelector('[data-scene="free-exploration"]');
  scene.classList.add('architecture-room');
  if(ARCHITECTURE_SOURCE.available){
    const passive=document.createElement('div');passive.className='architecture-room-model';passive.setAttribute('aria-hidden','true');
    passive.innerHTML=`${model()}<img class="architecture-foreground-occlusion" src="${room}" alt="">`;
    scene.prepend(passive);
  }
  const light=document.createElement('img');light.className='architecture-room-light';light.src=room;light.alt='';light.setAttribute('aria-hidden','true');scene.prepend(light);
  hit=document.createElement('button');hit.type='button';hit.className='archive-hit archive-architecture-hit';hit.setAttribute('aria-label','走近右側的修復研究物件');
  scene.insertBefore(hit,scene.querySelector('[data-artifact="photo"]'));
  function updateRoom(){
    const visible=roomRoot.dataset.scene==='free-exploration'&&['architecture','free'].includes(roomRoot.dataset.guidedStep)&&canOpen();hit.disabled=!visible;
    scene.classList.toggle('architecture-explorable',visible);
    if(!visible)scene.classList.remove('architecture-focused');
  }
  new MutationObserver(updateRoom).observe(roomRoot,{attributes:true,attributeFilter:['data-scene']});window.addEventListener('archive-guidance-change',updateRoom);updateRoom();
  hit.addEventListener('pointerenter',()=>scene.classList.add('architecture-focused'));
  hit.addEventListener('pointerleave',()=>scene.classList.remove('architecture-focused'));
  hit.addEventListener('focus',()=>scene.classList.add('architecture-focused'));
  hit.addEventListener('blur',()=>scene.classList.remove('architecture-focused'));
  hit.addEventListener('click',open);

  function build(){
    if(root)return;
    root=document.createElement('section');root.id='architecture-study';root.hidden=true;root.setAttribute('aria-label','建築形態觀察');
    root.innerHTML=`<div class="architecture-stage" tabindex="0" role="region" aria-label="觀察修復室內的建築形態模型；方向鍵稍移視線，加減鍵輕微縮放，Escape 返回空間">
      <div class="architecture-camera"><div class="architecture-world"><img class="architecture-master" src="${room}" alt="">${model(true)}<img class="architecture-foreground-occlusion" src="${room}" alt=""></div></div>
      <img class="architecture-brand" src="assets/living-archive/opening/identity.png" alt="文武廟 Living Archive，上環・香港">
      <div class="architecture-observation">${imageText('observe','你先注意到甚麼？')}</div>
      <div class="architecture-hint">${imageText('hint','移動看看。')}</div>
      <div class="architecture-figure-question" hidden>${imageText('figure-question','看看他的姿勢和手上的東西，他正在做甚麼？')}</div>
      <button type="button" class="architecture-figure-ready" aria-label="我看好了" hidden>${imageText('figure-ready','我看好了')}</button>
      <div class="architecture-figure-reveal" hidden>${imageText('figure-title','吹簫人物','architecture-figure-title')}</div>
      <button type="button" class="architecture-figure-whole" aria-label="回看整體" hidden>${imageText('figure-whole','回看整體')}</button>
      <div class="architecture-region-question" hidden><img src="" alt="" draggable="false"></div>
      <button type="button" class="architecture-region-ready" aria-label="我看好了" hidden>${imageText('figure-ready','我看好了')}</button>
      <div class="architecture-region-reveal" hidden><img class="architecture-region-title" src="" alt="" draggable="false"><img class="architecture-region-body" src="" alt="" draggable="false"><div class="architecture-region-date" hidden>${imageText('date-title','1893')}${imageText('date-body','文武廟的石灣陶脊建於 1893 年。')}</div></div>
      <button type="button" class="architecture-region-whole" aria-label="回看整體" hidden>${imageText('figure-whole','回看整體')}</button>
      <div class="architecture-combined" hidden>${imageText('combined-title','吹簫引鳳')}${imageText('combined-body','人物吹簫，旁邊伴有鳳凰。')}</div>
      <div class="architecture-payoff" hidden>${imageText('readability-payoff','一件建築裝飾，重新變得可讀。')}</div>
      <div class="architecture-fieldwork" hidden><img class="architecture-fieldwork-line" src="" alt="" draggable="false"><button type="button" class="architecture-fieldwork-next" aria-label="繼續" hidden>${imageText('fieldwork-next','繼續')}</button><button type="button" class="architecture-fieldwork-return" aria-label="返回修復室" hidden>${imageText('return','返回修復室')}</button></div>
      <button type="button" class="architecture-reset" aria-label="重設陶塑視線">重設視線 ↺</button><p class="architecture-study-credit">實物研究 · 現存陶塑的研究表現</p>
      <p class="architecture-loading" role="status">正在展開形態研究…</p>
      <span class="archive-sr-only">按 Escape 可循原路返回修復室。</span>
    </div>`;
    const lionPresence=roomRoot.querySelector('.lion-room-presence');
    mountRoomLayers(root.querySelector('.architecture-world'));
    if(lionPresence)root.querySelector('.architecture-world').append(lionPresence.cloneNode(true));
    document.querySelector('#experience').append(root);stage=root.querySelector('.architecture-stage');
    // Retain approved raster typography on large screens; mobile uses the same copy
    // at readable text sizes independently of the photographic camera.
    for(const img of root.querySelectorAll('.architecture-stage > :not(.architecture-camera) img')){
      const copy=document.createElement('span');copy.className='architecture-mobile-copy';img.parentElement.append(copy);
      const sync=()=>{copy.textContent=img.alt;copy.hidden=img.hidden;};sync();new MutationObserver(sync).observe(img,{attributes:true,attributeFilter:['alt','hidden']});
    }
    root.querySelector('.architecture-reset').addEventListener('click',resetView);
    const source=root.querySelector('.architecture-source');
    function loaded(){
      if(!ARCHITECTURE_SOURCE.available){root.querySelector('.architecture-loading').textContent='形態研究素材待補。輕觸此處或按 Escape 回到空間。';return;}
      ready=true;root.querySelector('.architecture-loading').hidden=true;
      if(active&&phase==='model_close'&&performance.now()-closeAt>=(reduced()?180:2000))beginObservation();
    }
    source.addEventListener('load',loaded);if(source.complete&&source.naturalWidth)loaded();
    source.addEventListener('error',()=>{ready=false;root.querySelector('.architecture-loading').hidden=false;root.querySelector('.architecture-loading').textContent='形態研究素材未能載入。輕觸此處或按 Escape 回到空間後可重試。';});
    root.querySelector('.architecture-loading').addEventListener('click',()=>{if(!ready)returnToRoom();});
    for(const name of ['figure',...regionNames]){
      const target=root.querySelector(`.architecture-${name}-target`);
      target.addEventListener('pointerdown',event=>{targetPointer={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};});
      target.addEventListener('pointermove',event=>{if(targetPointer?.id===event.pointerId&&Math.hypot(event.clientX-targetPointer.x,event.clientY-targetPointer.y)>9)targetPointer.moved=true;});
      target.addEventListener('click',event=>{if(targetPointer?.moved){event.preventDefault();targetPointer=null;return;}targetPointer=null;if(name==='figure')inspectFigures();else inspectRegion(name);});
    }
    root.querySelector('.architecture-figure-ready').addEventListener('click',revealFigures);
    root.querySelector('.architecture-figure-whole').addEventListener('click',returnToWhole);
    root.querySelector('.architecture-region-ready').addEventListener('click',revealRegion);
    root.querySelector('.architecture-region-whole').addEventListener('click',returnToWhole);
    root.querySelector('.architecture-fieldwork-next').addEventListener('click',()=>advanceFieldwork());
    root.querySelector('.architecture-fieldwork-return').addEventListener('click',()=>returnToRoom(true));
    stage.addEventListener('pointerdown',event=>{
      if(!canObserve())return;
      if(event.target instanceof Element&&event.target.closest('button'))return;
      stage.setPointerCapture(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});stage.focus({preventScroll:true});
      if(pointers.size===2){const[a,b]=[...pointers.values()];pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);}
    });
    stage.addEventListener('pointermove',event=>{
      if(!canObserve())return;
      if(pointers.has(event.pointerId))pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
      if(pointers.size===2){const[a,b]=[...pointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);if(pinchDistance)zoom=Math.max(1,Math.min(1.12,zoom*distance/pinchDistance));pinchDistance=distance;}
      const r=stage.getBoundingClientRect();px=Math.max(-1,Math.min(1,(event.clientX-r.left)/r.width*2-1));py=Math.max(-1,Math.min(1,(event.clientY-r.top)/r.height*2-1));applyView();noteObservation();
    });
    for(const name of ['pointerup','pointercancel'])stage.addEventListener(name,event=>{pointers.delete(event.pointerId);pinchDistance=0;});
    stage.addEventListener('wheel',event=>{if(!canObserve())return;event.preventDefault();zoom=Math.max(1,Math.min(1.12,zoom-event.deltaY*.0004));applyView();noteObservation();},{passive:false});
    stage.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();if(isDetailPhase())returnToWhole();else returnToRoom();return;}
      if(event.key==='Tab'){
        const nodes=[stage,...root.querySelectorAll('button')].filter(el=>!el.disabled&&!el.closest('[hidden]')&&el.getClientRects().length);
        const index=nodes.indexOf(document.activeElement);
        if(event.shiftKey&&index<=0){event.preventDefault();nodes.at(-1)?.focus();}
        else if(!event.shiftKey&&index===nodes.length-1){event.preventDefault();nodes[0]?.focus();}
      }
      if(document.activeElement!==stage||!canObserve())return;
      const dir={ArrowLeft:[-.15,0],ArrowRight:[.15,0],ArrowUp:[0,-.15],ArrowDown:[0,.15]};
      if(dir[event.key]){event.preventDefault();px=Math.max(-1,Math.min(1,px+dir[event.key][0]));py=Math.max(-1,Math.min(1,py+dir[event.key][1]));applyView();noteObservation();}
      if(['+','=','-'].includes(event.key)){event.preventDefault();zoom=Math.max(1,Math.min(1.12,zoom+(event.key==='-'?-.03:.03)));applyView();noteObservation();}
    });
  }
  function resetView(){zoom=1;px=py=0;applyView();}
  function setPhase(next){phase=next;root.dataset.state=next;}
  function isFigurePhase(){return ['figure_inspect','figure_question','figure_reveal'].includes(phase);}
  function isRegionPhase(){return ['region_inspect','region_question','region_reveal'].includes(phase);}
  function isDetailPhase(){return isFigurePhase()||isRegionPhase();}
  function canObserve(){return active&&ready&&(['model_observe','model_form'].includes(phase)||isDetailPhase());}
  function allReadable(){return ['figure',...regionNames].every(name=>readable[name]);}
  function syncTargets(){
    if(!root)return;
    const exploring=active&&ready&&['model_observe','model_form'].includes(phase);
    for(const name of ['figure',...regionNames])root.querySelector(`.architecture-${name}-target`).disabled=!exploring||(name==='base'&&!['figure','phoenix','pattern'].every(part=>readable[part]));
  }
  function hideDetails(){
    for(const selector of ['.architecture-figure-question','.architecture-figure-ready','.architecture-figure-reveal','.architecture-figure-whole','.architecture-region-question','.architecture-region-ready','.architecture-region-reveal','.architecture-region-whole','.architecture-region-date'])root.querySelector(selector).hidden=true;
  }
  function applyView(){
    const x=reduced()?0:px,y=reduced()?0:py;
    stage.style.setProperty('--view-x',String(x));stage.style.setProperty('--view-y',String(y));
    stage.style.setProperty('--light-x',String(x));stage.style.setProperty('--light-y',String(y));
    stage.style.setProperty('--study-zoom',String(zoom));
  }
  function open({fromPhoto=false}={}){
    if(active||!canOpen({fromPhoto}))return;
    build();clear();active=true;focusOrigin=document.activeElement;observed=false;zoom=1;px=py=0;targetPointer=null;applyView();
    root.hidden=false;roomRoot.inert=true;scene.classList.remove('architecture-focused');delete root.dataset.observed;
    activeRegion=null;delete root.dataset.region;hideDetails();root.querySelector('.architecture-combined').hidden=true;root.querySelector('.architecture-payoff').hidden=true;root.querySelector('.architecture-fieldwork').hidden=true;syncTargets();
    const returnButton=root.querySelector('.architecture-fieldwork-return');
    returnButton.setAttribute('aria-label',fromPhoto?'回到舊照片':'返回修復室');
    returnButton.innerHTML=fromPhoto?'回到舊照片 →':imageText('return','返回修復室');
    if(fromPhoto){stage.setAttribute('aria-label','陶塑實物研究；方向鍵稍移視線，加減鍵縮放，Escape 回到舊照片');root.dataset.entry='photo';setPhase('placing_model');stage.focus({preventScroll:true});later(()=>{closeAt=performance.now();setPhase('model_close');later(beginObservation,reduced()?180:1800);},reduced()?180:1200);if(!ready)root.querySelector('.architecture-source').src=ARCHITECTURE_SOURCE.src;return;}
    delete root.dataset.entry;setPhase('room_focus_architecture');stage.focus({preventScroll:true});
    later(()=>{setPhase('approach_architecture');later(()=>{setPhase('placing_model');later(()=>{closeAt=performance.now();setPhase('model_close');later(beginObservation,reduced()?180:2000);},reduced()?180:1600);},reduced()?180:2400);},reduced()?40:100);
    if(!ready)root.querySelector('.architecture-source').src=ARCHITECTURE_SOURCE.src;
  }
  function beginObservation(){
    if(phase!=='model_close'||!ready)return;
    setPhase('model_observe');syncTargets();stage.focus({preventScroll:true});readingTimer=later(beginForm,7000);
  }
  function noteObservation(){
    if(observed||phase!=='model_observe')return;
    observed=true;root.dataset.observed='true';clearTimeout(readingTimer);timers.delete(readingTimer);readingTimer=later(beginForm,5000);
  }
  function beginForm(){
    if(phase!=='model_observe')return;
    zoom=1;px=py=0;applyView();setPhase('model_form');syncTargets();
  }
  function inspectFigures(){
    if(!active||!ready||!['model_observe','model_form'].includes(phase))return;
    clearTimeout(readingTimer);timers.delete(readingTimer);
    observed=true;root.dataset.observed='true';activeRegion='figure';root.dataset.region='figure';root.querySelector('.architecture-combined').hidden=true;hideDetails();
    setPhase('figure_inspect');syncTargets();stage.focus({preventScroll:true});
    later(()=>{
      if(phase!=='figure_inspect')return;
      setPhase('figure_question');root.querySelector('.architecture-figure-question').hidden=false;
      later(()=>{if(phase==='figure_question')root.querySelector('.architecture-figure-ready').hidden=false;},5000);
    },reduced()?180:1200);
  }
  function revealFigures(){
    if(phase!=='figure_question'||root.querySelector('.architecture-figure-ready').hidden)return;
    root.querySelector('.architecture-figure-ready').hidden=true;root.querySelector('.architecture-figure-question').hidden=true;
    root.querySelector('.architecture-figure-reveal').hidden=false;
    // Understanding reveals the same approved pixels; it never changes the model.
    readable.figure=true;root.dataset.figureReadable='true';scene.dataset.figureReadable='true';
    setPhase('figure_reveal');stage.focus({preventScroll:true});
    later(()=>{if(phase==='figure_reveal')root.querySelector('.architecture-figure-whole').hidden=false;},2000);
  }
  function inspectRegion(name){
    if(!regions[name]||!active||!ready||!['model_observe','model_form'].includes(phase))return;
    if(name==='base'&&!['figure','phoenix','pattern'].every(part=>readable[part]))return;
    clearTimeout(readingTimer);timers.delete(readingTimer);
    observed=true;root.dataset.observed='true';activeRegion=name;root.dataset.region=name;root.querySelector('.architecture-combined').hidden=true;hideDetails();
    const prompt=root.querySelector('.architecture-region-question img'),title=root.querySelector('.architecture-region-title'),body=root.querySelector('.architecture-region-body');
    prompt.src=`${base}text/${name}-question.png`;prompt.alt=regions[name].question;
    title.src=`${base}text/${name}-title.png`;title.alt=regions[name].title;
    body.hidden=!regions[name].body;
    if(regions[name].body){body.src=`${base}text/${name}-body.png`;body.alt=regions[name].body;}
    setPhase('region_inspect');syncTargets();stage.focus({preventScroll:true});
    later(()=>{
      if(phase!=='region_inspect'||activeRegion!==name)return;
      setPhase('region_question');root.querySelector('.architecture-region-question').hidden=false;
      later(()=>{if(phase==='region_question'&&activeRegion===name)root.querySelector('.architecture-region-ready').hidden=false;},5000);
    },reduced()?180:1200);
  }
  function revealRegion(){
    if(phase!=='region_question'||root.querySelector('.architecture-region-ready').hidden||!regions[activeRegion])return;
    const name=activeRegion;
    root.querySelector('.architecture-region-ready').hidden=true;root.querySelector('.architecture-region-question').hidden=true;root.querySelector('.architecture-region-reveal').hidden=false;
    readable[name]=true;root.dataset[`${name}Readable`]='true';scene.dataset[`${name}Readable`]='true';
    setPhase('region_reveal');stage.focus({preventScroll:true});
    if(name==='base')later(()=>{if(phase==='region_reveal'&&activeRegion==='base')root.querySelector('.architecture-region-date').hidden=false;},3000);
    later(()=>{if(phase==='region_reveal'&&activeRegion===name)root.querySelector('.architecture-region-whole').hidden=false;},name==='base'?4500:2000);
  }
  function showCombined(){
    if(combinedSeen||!readable.figure||!readable.phoenix||phase!=='model_form')return;
    combinedSeen=true;root.querySelector('.architecture-combined').hidden=false;
    later(()=>{if(phase==='model_form')root.querySelector('.architecture-combined').hidden=true;},4000);
  }
  function showFieldwork(){
    if(phase!=='readability_payoff')return;
    root.querySelector('.architecture-payoff').hidden=true;root.querySelector('.architecture-fieldwork').hidden=false;
    setPhase('fieldwork');fieldworkStep=0;advanceFieldwork(true);
  }
  function advanceFieldwork(initial=false){
    if(phase!=='fieldwork')return;
    if(!initial)fieldworkStep=Math.min(3,fieldworkStep+1);
    const lines=['記住它的色彩、人物和立體層次。','到了現場，抬頭找找。','你現在看到的「吹簫引鳳」，仍然只是整條陶脊的一部分。','完整的它，留待你親自看見。'];
    root.dataset.fieldworkStep=String(fieldworkStep);
    const image=root.querySelector('.architecture-fieldwork-line');image.src=`${base}text/fieldwork-${fieldworkStep+1}.png`;image.alt=lines[fieldworkStep];
    root.querySelector('.architecture-fieldwork-next').hidden=fieldworkStep===3;
    root.querySelector('.architecture-fieldwork-return').hidden=fieldworkStep!==3;
  }
  function returnToWhole(){
    if(!isDetailPhase())return;
    clear();targetPointer=null;hideDetails();
    zoom=1;px=py=0;applyView();setPhase('model_form');syncTargets();stage.focus({preventScroll:true});
    if(allReadable()&&root.dataset.fullReadable!=='true'){
      root.dataset.fullReadable='true';scene.dataset.fullReadable='true';root.querySelector('.architecture-combined').hidden=true;
      setPhase('readability_payoff');syncTargets();root.querySelector('.architecture-payoff').hidden=false;later(showFieldwork,4000);
    }else showCombined();
  }
  function returnToRoom(completed=false){
    const finished=completed===true&&phase==='fieldwork'&&fieldworkStep===3&&allReadable();
    if(!active||phase==='return_model'||phase==='return_architecture')return;
    clear();targetPointer=null;hideDetails();root.querySelector('.architecture-combined').hidden=true;root.querySelector('.architecture-payoff').hidden=true;root.querySelector('.architecture-fieldwork').hidden=true;
    if(root.dataset.entry==='photo'){active=false;root.hidden=true;roomRoot.inert=false;onReturn({fromPhoto:true,completed:finished});return;}
    setPhase('return_model');syncTargets();
    later(()=>{setPhase('return_architecture');later(()=>{setPhase('room_idle');later(()=>{
      active=false;root.hidden=true;roomRoot.inert=false;scene.classList.remove('architecture-focused');
      if(finished)onComplete();onReturn();(focusOrigin?.isConnected?focusOrigin:hit).focus({preventScroll:true});
    },reduced()?180:2000);},reduced()?180:1200);},reduced()?180:900);
  }
  return {open,returnToRoom,getState:()=>phase};
}
