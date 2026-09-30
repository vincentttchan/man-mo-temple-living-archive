import {look, explore, project, onFrame, setSituation, showThreshold, setSceneActive} from './scene.js';
import {loadVisitState,completeRehearsal,selectFieldworkTheme,confirmFieldworkDeparture} from '../common-knowledge/core-onboarding-state.js';
import {FIELDWORK_THEMES,getFieldworkTheme} from '../common-knowledge/fieldwork-themes.js';

const $ = id => document.getElementById(id);
let step = 0;
let markers = [];
let ritualPhase = null;
let bellPhase = null;
let endingFocusTimer;
let worshipChoice=loadVisitState(sessionStorage,localStorage).worshipChoice;
const journeySurfaces = [...document.querySelectorAll('body > header, body > main, body > footer')];

function showEnding() {
  setSceneActive(false);
  const result=completeRehearsal(sessionStorage,{questionStorage:localStorage,worshipChoice});
  renderThemes(result.state.selectedFieldworkTheme,location.hash==='#fieldwork-themes'||!getFieldworkTheme(result.state.selectedFieldworkTheme));
  $('ending-save-status').hidden=result.ok;


  journeySurfaces.forEach(surface => { surface.inert = true; });
  document.body.classList.add('has-previsit-ending');
  $('previsit-ending').hidden = false;
  const delay = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1500;
  endingFocusTimer = setTimeout(() => $('ending-title').focus({preventScroll: true}), delay);
}

function renderThemes(selected,choosing=!getFieldworkTheme(selected)) {
  const theme=getFieldworkTheme(selected);
  $('ending-theme-options').hidden=!choosing;
  $('ending-theme-preview').hidden=!choosing;
  $('ending-confirmation').hidden=choosing;
  $('ending-theme-options').replaceChildren();
  if(!choosing){
    $('ending-selected-theme').textContent=`${theme.number}｜${theme.title}`;
    $('ending-theme-inquiry').textContent=theme.inquiry;
    return;
  }
  $('ending-theme-preview').textContent=theme?.inquiry||'從一個方向開始，讓現場的證據帶你繼續追問。';
  for(const item of FIELDWORK_THEMES){
    const button=document.createElement('button');button.type='button';button.textContent=`${item.number}｜${item.title}`;
    button.classList.toggle('is-current',item.id===selected);
    const preview=()=>{$('ending-theme-preview').textContent=item.inquiry;};
    button.onpointerenter=preview;button.onfocus=preview;
    button.onclick=()=>{
      const result=selectFieldworkTheme(sessionStorage,item.id);
      $('ending-save-status').hidden=result.ok;
      if(!result.ok)return;
      renderThemes(item.id,false);
      $('ending-selected-theme').focus({preventScroll:true});
    };
    $('ending-theme-options').append(button);
  }
}
$('ending-change-theme').onclick=()=>{
  renderThemes(loadVisitState(sessionStorage).selectedFieldworkTheme,true);
  $('ending-theme-options').querySelector('button').focus();
};
let departureTimer;
$('ending-depart').onclick=()=>{
  const result=confirmFieldworkDeparture(sessionStorage);
  $('ending-save-status').hidden=result.ok;
  if(!result.ok)return;
  $('ending-depart').disabled=true;
  $('previsit-ending').classList.add('is-leaving');
  departureTimer=setTimeout(()=>{location.href=new URL('../fieldwork/',location.href).href;},matchMedia('(prefers-reduced-motion: reduce)').matches?0:600);
};
window.addEventListener('pageshow',()=>{
  clearTimeout(departureTimer);
  $('previsit-ending').classList.remove('is-leaving');
  $('ending-depart').disabled=false;
});

function replayJourney() {
  setSceneActive(true);
  clearTimeout(endingFocusTimer);
  $('previsit-ending').hidden = true;
  document.body.classList.remove('has-previsit-ending');
  journeySurfaces.forEach(surface => { surface.inert = false; });
  step = 0;
  ritualPhase = null;
  bellPhase = null;
  show();
  $('next').focus({preventScroll: true});
}


function copy(title, prompt, progress) {
  $('title').textContent = title;
  $('prompt').textContent = prompt;
  $('progress').textContent = progress.replace(/^\d+\s*\/\s*/, '');
  $('feedback').textContent = '';
  $('choices').replaceChildren();
  $('next').hidden = true;
  document.querySelector('.guide').scrollTop = 0;
  $('title').focus({preventScroll: true});
}
function action(label, fn) {
  $('next').hidden = false;
  $('next').textContent = label;
  $('next').setAttribute('aria-label', label);
  $('next').onclick = fn;
  $('next').disabled = false;
}
function options(items) {
  $('choices').replaceChildren();
  for (const [label, fn] of items) {
    const button = document.createElement('button');
    button.textContent = label;
    button.onclick = fn;
    $('choices').append(button);
  }
}
function clear() {
  markers = [];
  $('hotspots').replaceChildren();
}
function marker(label, point, fn) {
  const button = document.createElement('button');
  button.className = 'hotspot';
  button.setAttribute('aria-label',label);
  const dot = document.createElement('span'); dot.className = 'hotspot-dot'; dot.setAttribute('aria-hidden', 'true');
  const line = document.createElement('span'); line.className = 'hotspot-line'; line.setAttribute('aria-hidden', 'true');
  const text = document.createElement('span'); text.textContent = label;
  button.append(dot, line, text);
  button.onclick = fn;
  $('hotspots').append(button);
  markers.push({button, point});
}
function advance() {
  step++;
  ritualPhase = null;
  bellPhase = null;
  show();
}
function show() {
  clear();
  explore(false);
  setSituation('none');
  showThreshold(false);
  $('back').hidden = step === 0;
  $('repeat').hidden = step === 0;
  $('restart').hidden = step === 0;

  if (step === 0) {
    copy('入廟之前，先整一整衣著。', '整理衣著，慢慢走近廟門。先練習怎樣到訪，建築與文物留待現場觀察。', '到訪前 · 文武廟禮儀');
    look('entry');
    $('caption').textContent = '由廟門開始，一步一步走進去。';
    action('整理好衣著，走到廟門', advance);
  }
  if (step === 1) {
    copy('來到門檻前，先踏哪一腳？', '有一種入廟習俗說「左腳先入」。試用左腳先跨過門檻，記得不要踩在門檻上。', '01 / 跨門檻');
    look('threshold');
    showThreshold(true);
    $('caption').textContent = '金色門檻與足印是教學標示，不是文物原貌。';
    marker('左腳先跨', [-.43, .28, 6.45], () => {
      clear();
      $('choices').replaceChildren();
      $('feedback').textContent = '左腳先入是一種民俗說法，並非廟方公布的硬性規定。現場以安全與廟方安排為先。';
      action('跨入廟內', advance);
    });
    options([['右腳先跨', () => {
      $('feedback').textContent = '這段示範採用「左腳先入」的民俗說法。試點場景中左邊的足印；現場通行安全優先。';
    }]]);
  }
  if (step === 2) showBell();
  if (step === 3) {
    copy('有人正面向神壇行禮。', '先停在旁邊，不從善信與神壇之間穿過；待對方完成，再走向自己的位置。', '03 / 讓出參拜空間');
    look('courtesy');
    setSituation('visitor');
    $('caption').textContent = '人物及等候位置是情境示意。';
    const waitAside = () => {
      clear();
      $('choices').replaceChildren();
      setSituation('wait');
      look('waiting');
      $('feedback').textContent = '你保留了善信與神壇之間的空間。';
      action('走向主龕', advance);
    };
    marker('在旁等一等', [2.65, .85, -.2], waitAside);
    options([
      ['在旁邊等候，讓出空間', waitAside],
      ['從善信前方捷徑穿過', () => {
        $('feedback').textContent = '先讓對方完成行禮，選擇在旁等候。';
      }]
    ]);
  }
  if (step === 4) {
    copy('面向文武二帝，你會參拜嗎？', '參拜是個人選擇。若想參拜，我們會練習香燭、稟願、上香及寶牒的次序；實際做法以當日廟方安排為準。', '04 / 文武二帝');
    look('deities');
    $('caption').textContent = '面向神壇：左為關聖帝君，右為文昌帝君。';
    options([
      ['我想參拜，練習儀式次序', () => {worshipChoice='participate';prayerCandle();}],
      ['我不參拜，在指定位置等候', () => {
        worshipChoice='observe';
        $('choices').replaceChildren();
        setSituation('wait');
        look('waiting');
        $('feedback').textContent = '可以選擇不參拜，並給其他善信留出空間。';
        action('隨隊離開', advance);
      }]
    ]);
  }
  if (step === 5) {
    copy('離開時，再跨過門檻。', '仍然不要踩門檻。有「右腳先出」的民俗說法；跟隨當日動線安全離開。', '05 / 出門');
    look('threshold');
    showThreshold(true);
    $('caption').textContent = '左右腳次序屬民俗示範，不作現場硬性規則。';
    options([
      ['右腳先跨出，避開門檻', advance],
      ['踩着門檻離開', () => {
        $('feedback').textContent = '試抬腳跨過門檻；請選擇避開門檻的做法。';
      }]
    ]);
  }
  if (step === 6) {
    showEnding();
  }
}
function showBell() {
  bellPhase = 'choice';
  copy('進廟後，有人會先敲鐘、擊鼓。', '有訪談記錄「鐘三下、鼓三下」的做法，象徵向天地人告知來意。這是可選的習俗，不代表每位參訪者都可以碰鐘鼓。', '02 / 鐘與鼓');
  look('bell');
  $('caption').textContent = '鐘鼓模型是位置與形制示意。';
  options([
    ['假設廟方允許，模擬鐘三下、鼓三下', bellFirst],
    ['當日未獲允許，不觸碰鐘鼓', advance]
  ]);
}
function triple(label, done) {
  clear();
  $('choices').replaceChildren();
  $('feedback').textContent = `${label}：一 · 二 · 三。這是螢幕演練，現場不可自行敲擊。`;
  done();
}
function bellFirst() {
  bellPhase = 'bell';
  copy('先鐘，後鼓。', '假設工作人員允許，先在模型中模擬敲鐘三下。', '02 / 鐘與鼓');
  look('bell');
  marker('敲鐘 × 3', [4.1, 1.3, 3.15], () => triple('鐘', drumNext));
}
function drumNext() {
  bellPhase = 'drum';
  $('prompt').textContent = '然後在模型中模擬擊鼓三下。';
  marker('擊鼓 × 3', [4.1, 1.2, 4.25], () => triple('鼓', () => {
    bellPhase = 'done';
    action('再向前走', advance);
  }));
}
function prayerCandle() {
  ritualPhase = 'candle';
  clear();
  copy('若參拜，先確認香燭安排。', '有報道記述廟方的示範流程：準備寶燭後，先把蠟燭放到指定燭台。這裏只模擬次序；是否點火、由誰處理，要聽從老師和廟方。', '04 / 香燭');
  look('courtesy');
  options([
    ['先問清楚，再使用指定燭台', prayerWish],
    ['自行找位置插蠟燭', () => { $('feedback').textContent = '燭台位置及火種處理須依現場安排。'; }]
  ]);
}
function prayerWish() {
  ritualPhase = 'wish';
  clear();
  copy('向文武二帝稟告心願。', '不用寫下姓名、生日或地址。想像自己面向主龕，心中說出一個願望，再恭敬行禮。', '04 / 稟願');
  look('deities');
  $('feedback').textContent = '文昌與文運、學業有關；關帝與忠義、武德有關。';
  action('我已在心中稟願', prayerIncense);
}
function prayerIncense() {
  ritualPhase = 'incense';
  clear();
  copy('大香，應供在哪裏？', '報道記述的流程會先向文武二帝稟願，再把大香供在指定的圓形香爐。這裏只辨認位置，不在螢幕上點火。', '04 / 上香');
  look('courtesy');
  marker('指定香爐', [0, 1.35, .1], () => {
    clear();
    $('choices').replaceChildren();
    $('feedback').textContent = '放香數量、細香位置都應依當日廟方指示；不用背一套固定數字。';
    action('再看寶牒怎樣處理', prayerPaper);
  });
  options([['把香插在任何有空位的器物', () => {
    $('feedback').textContent = '先辨認指定香爐，並聽從現場安排。';
  }]]);
}
function prayerPaper() {
  ritualPhase = 'paper';
  clear();
  copy('寶牒最後交到哪裏？', '有報道記述，參拜後把寶牒放進收集箱，由廟方人員統一化寶。這一步只演練交付方法，不在現場自行燃燒。', '04 / 寶牒');
  look('courtesy');
  options([
    ['按指示放進收集箱，再讓出位置', () => {
      $('choices').replaceChildren();
      $('feedback').textContent = '完成參拜。這是其中一種流程示範，現場可依廟方安排簡化或不參拜。';
      action('行禮完畢，隨隊離開', advance);
    }],
    ['自行燃燒寶牒', () => { $('feedback').textContent = '先依廟方的收集與化寶安排。'; }]
  ]);
}
$('back').onclick = () => {
  if (step === 4 && ritualPhase) {
    const previous = {candle: show, wish: prayerCandle, incense: prayerWish, paper: prayerIncense}[ritualPhase];
    ritualPhase = null;
    previous();
  } else if (step === 2 && bellPhase && bellPhase !== 'choice') {
    showBell();
  } else {
    step = Math.max(0, step - 1);
    ritualPhase = null;
    bellPhase = null;
    show();
  }
};
$('repeat').onclick = () => look(step === 1 || step === 5 ? 'threshold' : step === 2 ? 'bell' : step === 4 && ritualPhase === 'wish' ? 'deities' : step === 3 || step === 4 ? 'courtesy' : 'entry');
$('restart').onclick = replayJourney;
$('ending-replay').onclick = replayJourney;
$('ending-source').onclick=()=>$('sources').showModal();
$('about').onclick = () => $('sources').showModal();
$('close-about').onclick = () => $('sources').close();
onFrame(() => {
  for (const {button, point} of markers) {
    const p = project(point);
    button.style.left = `${p.x}px`;
    button.style.top = `${p.y}px`;
    button.classList.toggle('is-left', p.x > window.innerWidth * .74);
    button.style.visibility = p.visible && p.settled ? 'visible' : 'hidden';
  }
});
function beginJourney(){
 const state=loadVisitState(sessionStorage,localStorage);
 if(state.etiquetteCompleted||state.ritualRehearsalCompleted){step=6;showEnding();}else show();
}
window.addEventListener('temple-ready',beginJourney,{once:true});
if(document.documentElement.dataset.ready==='true')beginJourney();
