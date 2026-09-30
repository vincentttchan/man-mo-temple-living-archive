import {createMapInquiryState,loadMapInquiryState,saveMapInquiryState,setMapStage,setInitialMarker,completeMapScene} from './map-inquiry-state.js?v=4';
import {createMapSurface} from './map-surface.js?v=3';
import {mapLocationScore} from './map-score.js';
import {MAN_MO_LOCATION} from './map-location.js';
import {mountRoomLayers} from './room-presentation.js';
const ui='assets/living-archive/map-ui/';
const prompts={observe:'這座廟，在十九世紀的城市哪裏？','place-marker':'這座廟，在十九世紀的城市哪裏？','confirm-location':'這裡就是文武廟的位置。\n和你剛才的判斷相同嗎？'};
const art=(name,alt='',cls='')=>`<img class="${cls}" src="${ui}text-v2/${name}.png" alt="${alt}" draggable="false">`;
const button=(action,name,label,cls='')=>`<button type="button" class="map-button ${cls}" data-map-action="${action}" aria-label="${label}">${art(name)}</button>`;
export function initMapInquiry({onBack=()=>{},storage=localStorage,canOpen=()=>true}={}){
  let root,surface,state=loadMapInquiryState(storage),storageError=false,beat='first',completedRecord=null;
  const timers=new Set();
  const later=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);if(!root.hidden)fn();},ms);timers.add(id);return id;};
  const clearTimers=()=>{timers.forEach(clearTimeout);timers.clear();};
  function build(){
    if(root)return;
    for(const name of ['title','confirm-marker','observe-task','place-task','confirm-location-prompt','modern-hint','modern-title','modern-guide','limitation-question','keeper-first','keeper-second','keeper','student-label','location-label','back','start-marker','continue','advance','recorded','observe-hint','source','zoom-in','zoom-out','fit']){const im=new Image();im.src=`${ui}text-v2/${name}.png`;im.decode?.().catch(()=>{});}
    root=document.createElement('section');root.id='map-inquiry';root.className='map-inquiry';root.hidden=true;root.setAttribute('aria-label','把文武廟放回十九世紀上環');
    root.innerHTML=`<div class="map-inquiry-stage">
      <div class="map-room-world"><img class="map-room-art" src="assets/living-archive/opening/archive-room-evidence-v3.png" alt="" aria-hidden="true"></div>
      <div class="map-room-shade"></div>
      <h1 class="map-main-title">${art('title','1889｜維多利亞城')}</h1>
      <div class="map-board map-primary-board"><div class="map-primary-viewport"></div></div>
      <div class="map-zoom" aria-label="地圖縮放"><button class="map-button" data-map-action="zoom-out" aria-label="縮小 1889 年地圖">−</button><button class="map-button" data-map-action="zoom-in" aria-label="放大 1889 年地圖">＋</button><button class="map-button" data-map-action="fit" aria-label="重設地圖視角">↺</button></div>
      ${button('modern-hint','modern-hint','參考今日地圖','map-modern-toggle')}
      <aside class="map-modern-reference" hidden aria-label="今日地圖參考">
        <header>${art('modern-title','今日上環')}<button type="button" data-map-action="modern-hint" aria-label="收起今日地圖">收起 ×</button></header>
        <div class="map-modern-frame"><iframe title="今日上環地圖：文武廟位置" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" data-src="https://www.openstreetmap.org/export/embed.html?bbox=114.1465%2C22.2817%2C114.1537%2C22.2870&amp;layer=mapnik&amp;marker=22.28391%2C114.15008"></iframe></div>
        <div class="map-modern-guide">${art('modern-guide','先看文武廟與荷李活道的位置關係，再回舊圖尋找相應街道。')}</div>
        <p>文武廟 · 上環荷李活道 124–126 號<br>今昔圖幅與方向不同，位置不能直接照搬。</p>
        <small>© OpenStreetMap contributors · 今日位置參考<br><a href="https://www.amo.gov.hk/en/historic-buildings/monuments/hong-kong-island/monuments_96/index.html" target="_blank" rel="noopener noreferrer">廟址資料：古物古蹟辦事處 ↗</a></small>
      </aside>
      <aside class="map-score" aria-live="polite" hidden></aside><div id="map-prompt" tabindex="-1" aria-live="polite"></div><div class="map-optional-guide">${art('optional-guide','在舊地圖上留下你的判斷。')}</div>
      <div class="map-footer"><div id="map-hint">${art('observe-hint','拖動・放大細看\n點一下留下你的判斷')}</div><div id="map-actions"></div></div>
      <div class="map-limitation" hidden><div class="map-limitation-question">${art('limitation-question','現在你知道文武廟在哪裡。但這張地圖能告訴你——附近住着甚麼人、在做甚麼嗎？')}</div><div class="map-keeper" aria-live="polite"><div id="map-keeper-line"></div>${art('keeper','廟祝','map-keeper-name')}</div>${button('advance','advance','繼續聆聽廟祝','map-dialogue-advance')}</div>
      <p id="map-toast" role="status" hidden>${art('recorded','已記錄你的判斷。')}</p>
      <p id="map-save-status" role="status"></p>
      ${button('source','source','地圖來源','map-source-toggle')}
      <aside class="map-sources" hidden aria-label="地圖來源"><button type="button" data-map-action="source" aria-label="關閉地圖來源">關閉 ×</button><h2>1889｜Plan of the City of Victoria, Hong Kong</h2><p>地圖來源：香港特別行政區政府地政總署 / DATA.GOV.HK；知識產權屬香港特別行政區政府。</p><a href="https://data.gov.hk/en-data/dataset/hk-landsd-openmap-historical-maps/resource/e2ccb33a-81da-4ff9-a1ad-38a25747762b" target="_blank" rel="noopener noreferrer">查看原始資料 ↗</a><p>文武廟位置依原圖地理定位及古物古蹟辦事處位置圖核對；標記表示廟址。</p><p>定位得分是學習活動的圖上距離評分，滿分 5,000。以原圖座標計算兩點距離，60 原圖像素內給予滿分容差，超出後按 5,000 × exp(−(距離−60)/900) 遞減取整；不受縮放及螢幕尺寸影響。這不是測量誤差、米數或歷史位置的準確率。</p></aside>
    </div>`;
    document.querySelector('#experience').append(root);
    mountRoomLayers(root.querySelector('.map-room-world'));
    for(const selector of ['.architecture-room-model','.lion-room-presence']){
      const object=document.querySelector(`#restoration-root ${selector}`);
      if(object)root.querySelector('.map-room-world').append(object.cloneNode(true));
    }
    root.querySelector('.map-modern-reference').id='map-modern-reference';
    root.querySelector('.map-modern-toggle').setAttribute('aria-controls','map-modern-reference');
    root.querySelector('.map-modern-toggle').setAttribute('aria-expanded','false');
    surface=createMapSurface(root.querySelector('.map-primary-viewport'),{
      onExplore(){root.dataset.explored='true';},
      onPlace(point){
        if(!['observe','place-marker'].includes(state.stage))return;
        root.dataset.explored='true';
        if(state.stage==='observe')state=setMapStage(state,'place-marker');
        state=setInitialMarker(state,point);persist();render();
      }
    });
    root.querySelector('.map-board').addEventListener('transitionend',e=>{if(e.propertyName==='transform')surface.layout();});
    root.querySelector('.map-primary-viewport').addEventListener('mapready',()=>{if(state.stage==='confirm-location')surface.frameData();});
    root.addEventListener('click',e=>{const b=e.target.closest('[data-map-action]');if(b&&!b.disabled)act(b.dataset.mapAction);});
    document.addEventListener('keydown',e=>{if(!root.hidden&&e.key==='Escape'){e.preventDefault();e.stopPropagation();if(!root.querySelector('.map-modern-reference').hidden)act('modern-hint');else if(!root.querySelector('.map-sources').hidden)act('source');}});
  }
  function modernHint(open){
    const panel=root.querySelector('.map-modern-reference');panel.hidden=!open;
    root.classList.toggle('has-modern-reference',open);
    const toggle=root.querySelector('.map-modern-toggle');toggle.setAttribute('aria-expanded',String(open));
    if(open){const frame=panel.querySelector('iframe');if(!frame.src)frame.src=frame.dataset.src;}
    // Overlay never resizes the historical viewport: pan, zoom and hypothesis stay exact.
    root.querySelector('.map-board').inert=open;
    root.querySelector('.map-zoom').inert=open;
    root.querySelector('.map-footer').inert=open;
  }
  function persist(){const result=saveMapInquiryState(storage,completedRecord&&!state.sceneCompleted?completedRecord:state);storageError=!result.ok;if(root)root.querySelector('#map-save-status').textContent=storageError?'未能保存到此瀏覽器。請保留此頁，稍後再試。':'';}
  function go(stage){clearTimers();state=setMapStage(state,stage);persist();render();}
  function render(){
    const stage=state.stage;root.dataset.stage=stage;
    const feedback=root.querySelector('.map-score'),result=stage==='confirm-location'?mapLocationScore(state.studentMarker):null;
    feedback.hidden=!result;
    if(result){const labels={close:'十分接近廟址',near:'已找到附近街區',far:'再沿街道尋找廟址'};feedback.innerHTML=`${art('score-label','定位得分','map-score-label')}<div class="map-score-value"><strong>${result.score.toLocaleString('en-US')}</strong><span> / 5,000</span></div>${art('score-'+result.band,labels[result.band],'map-score-band')}${art('score-method','按舊圖上的相對距離計分','map-score-method')}`;}
    delete root.dataset.beat;
    const supportsHint=['observe','place-marker'].includes(stage);
    root.querySelector('.map-modern-toggle').hidden=!supportsHint;
    if(!supportsHint)modernHint(false);
    root.querySelector('#map-toast').hidden=true;
    root.querySelector('.map-limitation').hidden=stage!=='source-limitation';
    root.querySelector('#map-prompt').innerHTML=prompts[stage]?art(stage==='observe'?'observe-task':stage==='place-marker'?'place-task':`${stage}-prompt`,prompts[stage]):'';
    root.querySelector('#map-actions').innerHTML=stage==='place-marker'&&state.studentMarker?button('confirm-marker','confirm-marker','就放在這裏')
      : stage==='confirm-location'?button('limitation','continue','再看看'):'';
    root.querySelector('#map-actions').hidden=!state.studentMarker;
    root.querySelector('#map-hint').hidden=!['observe','place-marker'].includes(stage);
    surface.setData({marker:stage==='observe'?null:state.studentMarker,confirmedLocation:stage==='confirm-location'?MAN_MO_LOCATION:null});
    surface.setMode(['observe','place-marker'].includes(stage)?'marker':stage==='source-limitation'?'static':'pan');
    requestAnimationFrame(()=>{surface.layout();if(stage==='confirm-location')surface.frameData();});
    if(stage==='source-limitation'){
      root.dataset.beat='retreat';root.querySelector('.map-limitation').hidden=true;
      later(()=>{surface.setData({marker:null,confirmedLocation:MAN_MO_LOCATION});root.querySelector('.map-limitation').hidden=false;beat='first';showBeat();},matchMedia('(prefers-reduced-motion: reduce)').matches?30:1600);
    }
    else{
      root.querySelector('#map-prompt').focus({preventScroll:true});
      // Reading is exploration too; do not require a particular gesture to proceed.
      if(stage==='confirm-location'){root.querySelector('#map-actions').hidden=true;later(()=>{root.querySelector('#map-actions').hidden=false;},1800);}
    }
  }
  function showBeat(){
    root.dataset.beat=beat;
    const line=root.querySelector('#map-keeper-line');
    line.innerHTML=beat==='first'?art('reflection-first','你現在知道它在哪裏。'):art('reflection-second','但地圖沒有告訴你，誰在這裏生活，又為甚麼需要這座廟。');
    const advance=root.querySelector('[data-map-action="advance"]');
    advance.setAttribute('aria-label',beat==='first'?'繼續聆聽廟祝':'回到修復室');
    advance.focus({preventScroll:true});
    // Dialogue advances intentionally, including for slow readers.
  }
  function advanceBeat(){clearTimers();if(beat==='question'){beat='first';showBeat();}else if(beat==='first'){beat='second';showBeat();}else{state=completeMapScene(state);persist();hide(true);}}
  function act(action){
    if(action==='modern-hint'){if(!['observe','place-marker'].includes(state.stage))return;const open=root.querySelector('.map-modern-reference').hidden;modernHint(open);(open?root.querySelector('.map-modern-reference button'):root.querySelector('.map-modern-toggle')).focus({preventScroll:true});return;}
    if(action==='source'){const panel=root.querySelector('.map-sources');panel.hidden=!panel.hidden;(panel.hidden?root.querySelector('.map-source-toggle'):panel.querySelector('button')).focus();return;}
    if(action==='zoom-in'||action==='zoom-out'){surface.zoom(action==='zoom-in'?1.35:1/1.35);return;}
    if(action==='fit'){surface.resetView();root.dataset.explored='true';return;}
    if(action==='start-marker'){go('place-marker');surface.focus();return;}
    if(action==='confirm-marker'&&state.stage==='place-marker'&&state.studentMarker){go('confirm-location');return;}
    if(action==='limitation'){go('source-limitation');return;}
    if(action==='advance')advanceBeat();
  }
  function hide(completed=false){clearTimers();persist();root.hidden=true;onBack({completed});}
  return {
    show(){
      if(!canOpen())return;
      build();clearTimers();if(!storageError)state=loadMapInquiryState(storage);
      // Every entry begins a new observation. Older pins are records, not a new judgement.
      if(state.studentMarker){try{storage.setItem('manmo-map-inquiry-previous-v2',JSON.stringify(state));}catch{/* Active interaction still works without storage. */}}
      completedRecord=state.sceneCompleted?structuredClone(state):null;state=createMapInquiryState();delete root.dataset.explored;persist();
      const lion=root.querySelector('.lion-room-presence');if(lion)lion.hidden=document.querySelector('#restoration-root .lion-room-presence')?.hidden!==false;
      modernHint(false);root.hidden=false;root.classList.remove('is-open');render();surface.resetView();surface.retry();
      requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.add('is-open')));
    },
    hide,getState(){return structuredClone(state);}
  };
}
