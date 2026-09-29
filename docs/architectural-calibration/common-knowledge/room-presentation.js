import {loadPhotoState} from './photo-inquiry-state.js';
const base='assets/living-archive/room-correction/';
const sceneBase='assets/living-archive/opening/';
export function mountRoomLayers(host){
  if(!host||host.querySelector(':scope > .room-local-repaint'))return;
  const layer=document.createElement('div');layer.className='room-local-repaint';layer.setAttribute('aria-hidden','true');
  layer.innerHTML=`<img class="room-variant-lion" src="${sceneBase}archive-room-lion-revealed-v3.png" alt="" draggable="false"><div class="room-evidence-light"></div>`;
  host.append(layer);
  const sync=()=>{layer.dataset.lionRevealed=String(loadPhotoState(sessionStorage).lionRevealed===true);};
  window.addEventListener('archive-evidence-change',sync);sync();
}
export function initRoomPresentation(root){
  const scene=root.querySelector('[data-scene="free-exploration"]');mountRoomLayers(scene);
  const annotations=document.createElement('div');annotations.className='room-evidence-annotations';
  annotations.innerHTML=['map','photo','architecture'].map(key=>`<img class="room-evidence-label room-label-${key}" data-room-label="${key}" alt="" hidden>`).join('');scene.append(annotations);
  for(const cue of scene.querySelectorAll('.archive-map-entry-cue,.archive-photo-entry-cue'))cue.remove();
  function update(){
    const step=root.dataset.guidedStep;
    const done={map:['photo','architecture','plaque','etiquette','handoff','free'].includes(step),photo:['architecture','plaque','etiquette','handoff','free'].includes(step),architecture:['plaque','etiquette','handoff','free'].includes(step)};
    for(const key of ['map','photo','architecture']){
      const image=annotations.querySelector(`[data-room-label=${key}]`),active=step===key;
      image.hidden=(!active&&!done[key])||(active&&['map','photo'].includes(key)&&root.dataset.guidanceReady!=='true');image.dataset.active=String(active);
      image.src=`${base}${key}-${done[key]?'done':'pending'}.png`;
      image.alt={map:'上環舊地圖',photo:'1868 年舊照',architecture:'建築研究模型'}[key]+'，'+(done[key]?{map:'位置已確認',photo:'線索已整理',architecture:'建築證據已讀'}[key]:{map:'等待定位',photo:'等待細看',architecture:'等待觀察'}[key]);
    }
  }
  new MutationObserver(update).observe(root,{attributes:true,attributeFilter:['data-guided-step','data-scene','data-guidance-ready']});
  window.addEventListener('archive-evidence-change',update);window.addEventListener('archive-guidance-change',update);update();
}
