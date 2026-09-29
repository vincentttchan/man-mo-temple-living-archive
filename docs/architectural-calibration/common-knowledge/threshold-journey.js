import {plaqueStudyObject} from './plaque-study-object.js';
import {mountRoomLayers} from './room-presentation.js';
import {FIELDWORK_QUESTIONS} from './photo-inquiry.js';
const SOURCE = 'https://www.tungwah.org.hk/heritage/historic-architecture/man-mo-temple/architectural-design/';
const PLACEMENT = 'https://www.tungwah.org.hk/press-release/145%E5%87%BA%E5%B7%A1%EF%BC%8E%E6%96%87%E6%AD%A6%E5%BB%9F%E7%A7%8B%E7%A5%AD/';
export const PLAQUE_QUESTION = '一塊掛在廟門上的牌匾，為甚麼會和賑災有關？';

// The plaque is painted into the room itself; the lens moves towards that place.
export function initThresholdJourney({host=document.querySelector('#experience'), getState=()=>({}), onEvent=()=>{}, onBack=()=>{}}={}) {
  const root=document.createElement('section');root.id='threshold-journey';root.hidden=true;
  root.setAttribute('aria-label','修復空間內的牌匾研究及廟外到訪演練');
  root.innerHTML=`<div class="threshold-world"><img class="threshold-environment" src="assets/living-archive/opening/archive-room-evidence-v3.png" alt="Living Archive 修復空間"><div class="threshold-room-layers"></div><button class="threshold-plaque-target" aria-label="細看牌匾上的整段題字" hidden></button></div><div class="threshold-light" aria-hidden="true"></div>
    <img class="threshold-brand" src="assets/living-archive/opening/identity.png" alt="文武廟 Living Archive，上環・香港">
    <button class="threshold-back" type="button">返回空間 ←</button>
    <div class="threshold-copy" tabindex="-1"><p class="threshold-eyebrow"></p><h1 class="threshold-title"></h1><div class="threshold-body"></div><div class="threshold-feedback" role="status" aria-live="polite"></div><div class="threshold-choices"></div><button class="threshold-next" type="button" hidden></button></div>
    <div class="threshold-footer"><button class="threshold-source" type="button">史料與圖像說明</button><span class="threshold-location">修復空間・研究表現</span></div>
    <dialog class="threshold-sources"><h2>史料與圖像說明</h2><p>牌匾文字及賑災背景依東華三院《建築特色》。正門上方的位置依東華三院〈145出巡．文武廟秋祭〉。</p><p>修復室中的牌匾是參照官方照片融入場景的美術表現，原物仍在文武廟。右至左題字與矩形邊框依參考；細微材質與光影屬藝術演繹，未能核實的小字不重造。1876–78 年旱災遍及五省；東華籌款賑濟，1879 年獲光緒皇帝御賜此匾。</p><p><a href="${SOURCE}" target="_blank" rel="noopener">東華三院・建築特色與參考照片 ↗</a></p><p><a href="${PLACEMENT}" target="_blank" rel="noopener">東華三院・正門牌匾位置記載 ↗</a></p><button type="button" class="threshold-source-close">回到觀察</button></dialog>`;
  const study=document.createElement('div');study.className='threshold-plaque-study';study.innerHTML=plaqueStudyObject();study.append(root.querySelector('.threshold-plaque-target'));root.append(study);
  host.append(root);mountRoomLayers(root.querySelector('.threshold-room-layers'));
  const q=s=>root.querySelector(s), timers=new Set();let phase='', active=false;
  function world(place){const outside=place==='exterior';root.dataset.world=place;q('.threshold-environment').src=outside?'assets/living-archive/threshold/hollywood-road-approach-v1.png':'assets/living-archive/opening/archive-room-evidence-v3.png';q('.threshold-environment').alt=outside?'文武廟荷李活道外觀的美術情境演練':'Living Archive 修復空間';q('.threshold-location').textContent=outside?'廟外・創作情境演練':'修復空間・研究表現';}
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function clear(){for(const timer of timers)clearTimeout(timer);timers.clear();}
  function later(fn,ms){const timer=setTimeout(()=>{timers.delete(timer);if(active)fn();},ms);timers.add(timer);}
  function screen(next,title,body='',eyebrow='') {
    clear();phase=next;root.dataset.phase=next;
    q('.threshold-title').textContent=title;q('.threshold-body').textContent=body;q('.threshold-eyebrow').textContent=eyebrow;
    q('.threshold-feedback').textContent='';q('.threshold-choices').replaceChildren();q('.threshold-next').hidden=true;
    q('.threshold-plaque-target').hidden=!['situated','inspect'].includes(next);q('.threshold-copy').focus({preventScroll:true});
  }
  function action(label,callback){const b=q('.threshold-next');b.textContent=label;b.hidden=false;b.onclick=callback;}
  function choices(items){q('.threshold-choices').replaceChildren();for(const [label,callback] of items){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=callback;q('.threshold-choices').append(b);}}
  function readability(level){root.dataset.readability=level;root.querySelector('.plaque-study-object').dataset.readability=level;}
  function situated(){world('room');root.classList.add('is-close');readability('veiled');screen('inspect','你看得出上面寫甚麼嗎？','移動視線觀察牌匾，再點選題字，讀它的故事。','牌匾研究');q('.threshold-plaque-target').focus({preventScroll:true});}
  function readWords(){
    if(phase==='situated'){root.classList.add('is-close');screen('approach','','');later(()=>{screen('inspect','你看得出上面寫甚麼嗎？','慢慢移動視線，再點選整段題字。','牌匾研究');q('.threshold-plaque-target').focus({preventScroll:true});},reduced()?180:1400);return;}
    if(phase!=='inspect')return;readability('inscription');screen('inscription','神威普佑','從右至左，讀作一段題字。');action('只看這四個字 →',()=>{screen('words','只看這四個字，你知道了甚麼？');later(()=>action('再想一想 →',()=>{screen('limits','又有甚麼，是這四個字沒有告訴你的？');action('看看資料如何補充 →',reveal);}),1200);});
  }
  function reveal(){screen('source','1879','','東華三院・建築特色');later(()=>{q('.threshold-body').textContent='光緒皇帝御賜';readability('context');action('再讀一層背景 →',()=>{screen('relief','東華籌款賑災','1876–78 年嚴重旱災期間，東華籌款救濟災民。','來自文字記錄的背景');action('回看這塊牌匾 →',()=>{readability('complete');screen('readable','一塊牌匾，重新變得可讀。');action('它今天在哪裏？ →',()=>{screen('placement','今天，「神威普佑」仍懸掛於文武廟正門上方。','','東華三院・正門位置記載');action('把這些線索連起來 →',()=>{screen('connection','這塊牌匾，把廟與賑災的故事連在一起。','到現場再看看，它怎樣留在廟門之上。');action('收起研究筆記 →',()=>{onEvent('plaque');bridge();});});});});});},1700);}
  function bridge(){root.classList.remove('is-close');screen('threshold','下一次再看到這四個字，\n你就已經站在文武廟門前了。','現在離開修復空間，看看真正到訪時會遇到甚麼。');action('離開修復空間 →',enterRitual);}
  function enterRitual(){root.classList.remove('is-close');root.dataset.world='transition';screen('departure','離開修復室，走到廟門前。','接下來，在立體場景中練習如何入廟、禮讓與觀察。','考察前・入廟禮儀');later(()=>action('進入立體禮儀體驗 →',()=>{window.location.href=new URL('../experience/index.html',window.location.href).href;}),reduced()?180:1400);}

  const situations = [
    {title:'前面有人正在參拜。', body:'你和同學正準備走過這條通道。', choices:['在旁等候，讓出通道','從參拜者前面穿過'], feedback:'你退到一旁，讓對方有空間完成行禮。', retry:'從前方穿過會打斷對方。先讓出通道，再看看。'},
    {title:'眼前有供品、文物和法器。', body:'你想看清其中一件物件，會怎樣做？', choices:['保持距離觀察，先不觸碰','伸手觸碰，看看表面'], feedback:'你保留了物件的位置，也讓它繼續被使用。想靠近或觸碰，先徵求允許。', retry:'移動物件可能影響供奉或損傷文物。先不觸碰，問清楚再行動。'},
    {title:'你想拍下眼前的線索。', body:'今天可以拍攝嗎？', choices:['先查看指示，向老師或廟方確認','先拍下來再說'], feedback:'先確認今日的拍攝安排；獲准後，也要留意別人的私隱和通道。', retry:'拍攝安排可能改變。先確認，不把別人的參拜當作可隨意拍攝的場景。'},
    {title:'同學準備參拜，你想怎樣做？', body:'參與與否，由你自己決定。', choices:['參與祭拜','在旁安靜等候／觀察']}
  ];
  function etiquette(index=0){
    world('exterior');
    root.classList.remove('is-close','has-stepped-aside');root.dataset.situation=String(index);
    readability('complete');
    const item=situations[index];screen('etiquette',item.title,item.body,'到訪前・情境演練');
    choices(item.choices.map((label,i)=>[label,()=>{
      q('.threshold-choices').replaceChildren();root.classList.toggle('has-stepped-aside',index===0||index===3);
      q('.threshold-feedback').textContent=index===3?(i===0?'你選擇參與。先問清楚當日安排，由老師和廟方指引；毋須自行操作香火或法器。':'你選擇安靜等候，給參拜者留出空間。同樣可以完成這次到訪準備。'):(i===1?item.retry+' 你收回動作，先依現場安排觀察。':item.feedback);
      onEvent('etiquetteBeat',{beat:index+1,worshipChoice:index===3?(i===0?'participate':'observe'):undefined});
      action(index===3?'帶着問題出發 →':'再想一個情況 →',()=>{if(index===3){onEvent('etiquette');handoff();}else etiquette(index+1);});
    }]));
  }
  function handoff(){
    world('exterior');
    root.classList.remove('is-close','has-stepped-aside');delete root.dataset.situation;
    const state=getState();const selected=state.selectedFieldworkQuestion;
    screen('question',selected?'你準備帶着這條問題到現場：':'還有哪一件事，你想帶到現場追查？',selected||'留下一條仍未解答的問題。');
    if(selected){action('把這條問題帶到現場 →',()=>finish(selected));choices([['換另一條問題',chooseQuestion]]);}else chooseQuestion();
  }
  function chooseQuestion(){
    q('.threshold-next').hidden=true;
    choices([...FIELDWORK_QUESTIONS,PLAQUE_QUESTION].map(question=>[question,()=>selectQuestion(question)]));
  }
  function selectQuestion(question){onEvent('question',{question});handoff();}
  function finish(question){onEvent('handoff',{question});screen('complete','你已經知道可以怎樣看了。','把這條問題帶到現場。\n下一步，不是在畫面裏找答案。\n到文武廟，親自看看。');
    const p=document.createElement('p');p.className='threshold-carried-question';p.textContent=question;q('.threshold-body').append(p);
    action('回到廟藏空間 →',()=>{hide();onBack();});choices([['到訪參考',references]]);
  }
  function references(){
    let dialog=q('.threshold-references');if(!dialog){dialog=document.createElement('dialog');dialog.className='threshold-sources threshold-references';root.append(dialog);}dialog.innerHTML=`<h2>帶到現場的參考</h2><p>沿前進、天井、後進理解空間；文武廟、列聖宮、公所之間的關係，留待現場核對。</p><p><a href="https://www.tungwah.org.hk/en/heritage/historical-architecture/man-mo-temple/manmo-floorplan/" target="_blank" rel="noopener">東華三院・廟內平面圖 ↗</a></p><p><a href="${SOURCE}" target="_blank" rel="noopener">公所昔今・東華三院建築特色 ↗</a></p><p><a href="https://www.amo.gov.hk/tc/historic-buildings/monuments/hong-kong-island/monuments_96/index.html" target="_blank" rel="noopener">2010 法定古蹟與秋祭・古物古蹟辦事處 ↗</a></p><p>本演練提供尊重參拜者及文物的參訪建議；並非廟方永久規則。實際拍攝和通行安排，以當日老師及廟方指示為準。</p><p>左右腳、鐘鼓先後等屬資料中描述的習俗，毋須照做；未獲允許，不操作鐘鼓。鐘鼓形制及尺寸未經核實，本段不作模型展示。</p><button type="button">回到問題</button>`;
    dialog.querySelector('button').onclick=()=>dialog.close();dialog.showModal();
  }
  q('.threshold-plaque-target').addEventListener('click',readWords);
  q('.threshold-back').addEventListener('click',()=>{hide();onBack();});
  q('.threshold-source').addEventListener('click',()=>q('.threshold-sources').showModal());q('.threshold-source-close').addEventListener('click',()=>q('.threshold-sources').close());
  root.addEventListener('pointermove',event=>{if(!root.classList.contains('is-close')||reduced()||event.pointerType==='touch')return;const b=root.getBoundingClientRect();root.style.setProperty('--shift',`${((event.clientX-b.left)/b.width-.5)*24}px`);root.style.setProperty('--plaque-yaw',`${((event.clientX-b.left)/b.width-.5)*8}deg`);});
  root.addEventListener('pointerleave',()=>{root.style.setProperty('--shift','0px');root.style.setProperty('--plaque-yaw','0deg');});
  root.addEventListener('keydown',event=>{if(event.key==='Escape'&&!root.querySelector('dialog[open]')){hide();onBack();}if(root.classList.contains('is-close')&&['ArrowLeft','ArrowRight'].includes(event.key)&&!reduced()){event.preventDefault();root.style.setProperty('--shift',event.key==='ArrowLeft'?'-12px':'12px');root.style.setProperty('--plaque-yaw',event.key==='ArrowLeft'?'-4deg':'4deg');}});
  function hide(){active=false;clear();root.querySelectorAll('dialog').forEach(d=>d.close());root.hidden=true;}
  return {show(step='plaque'){active=true;root.hidden=false;if(step==='plaque'){situated();}else if(step==='etiquette'){enterRitual();}else if(step==='handoff')handoff();else{world('exterior');finish(getState().selectedFieldworkQuestion||PLAQUE_QUESTION);}},hide};
}
