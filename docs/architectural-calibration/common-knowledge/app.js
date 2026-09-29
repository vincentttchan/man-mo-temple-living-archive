import {loadPhotoState} from './photo-inquiry-state.js';
import { objectPositionFractions, projectArtworkPoint } from './artwork-layout.js?v=33';
import {initThresholdJourney} from './threshold-journey.js?v=4';
import { initRestorationJourney } from './restoration-journey.js?v=11';
import { initArchitectureStudy } from './architecture-study.js?v=14';
import { initMapInquiry } from './map-inquiry.js?v=21';
import { initPhotoInquiry } from './photo-inquiry.js?v=16';
import {initRoomPresentation} from './room-presentation.js';
import { rubbingUnlocked, loadRestorationState } from './restoration-state.js';
import { loadCoreOnboardingState, saveCoreOnboardingState, getGuidedStep, markMapCompleted, markPhotoCompleted, markArchitectureCompleted, advancePrevisit } from './core-onboarding-state.js?v=3';

const ROOT = '../references/';
const sources = {
  amo: {name:'古物古蹟辦事處 · 文武廟',url:'https://www.amo.gov.hk/tc/historic-buildings/monuments/hong-kong-island/monuments_96/index.html'},
  twgh: {name:'東華三院 · 建築特色',url:'https://www.tungwah.org.hk/heritage/historic-architecture/man-mo-temple/architectural-design/'},
  plan: {name:'東華三院 · 廟內平面圖',url:'https://www.tungwah.org.hk/en/heritage/historical-architecture/man-mo-temple/manmo-floorplan/'},
  booklet: {name:'發展局 · 荷李活道歷史建築刊物',url:'https://www.heritage.gov.hk/filemanager/heritage/en/content_68/Hollywood_Booklet_EN_Full_Version.pdf'},
  twghArchive: {name:'東華三院 · 文武廟',url:'https://rho.tungwah.org.hk/tc/built-heritage/2'},
  twghFestival: {name:'東華三院 · 文昌啟智禮',url:'https://www.tungwah.org.hk/newsletter/%E4%B8%8A%E7%92%B0%E6%96%87%E6%AD%A6%E5%BB%9F%E8%88%89%E8%A1%8C%E3%80%8C%E6%96%87%E6%98%8C%E5%95%9F%E6%99%BA%E7%A6%AE%E3%80%8D/'},
  sinica: {name:'中央研究院 · 文昌帝君',url:'https://havefun.asdc.sinica.edu.tw/content/repository/resource_content.jsp?oid=4361955'},
  had: {name:'香港政府 · 上環文武廟',url:'https://www.gohk.gov.hk/tc/spots/spot_detail.php?spot=Man+Mo+Temple%2C+Sheung+Wan'},
  sanguozhi: {name:'《三國志》 · 關羽傳',url:'https://zh.wikisource.org/wiki/%E4%B8%89%E5%9C%8B%E5%BF%97/%E5%8D%B736'},
  heritageMuseum: {name:'香港文化博物館 · 關帝資料',url:'https://www.heritagemuseum.gov.hk/documents/2199315/2199703/TTTG_booklet_part2_MAR15.pdf'},
  twghManmo: {name:'東華三院 · 上環文武廟',url:'https://www.tungwah.org.hk/heritage/historic-architecture/man-mo-temple/'}
};

const documents = [
  {
    id:'compound',kind:'map',eyebrow:'建築 · 關係圖',title:'三幢建築，兩條小巷',cover:'三座・兩巷',
    prompt:'在圖中找出組群，而不是把它看成一座建築。',source:sources.amo,
    evidence:[
      {id:'three',label:'三幢建築',fact:'文武廟組群由文武廟、列聖宮和公所組成。'},
      {id:'lanes',label:'兩條小巷',fact:'三幢建築之間有兩條小巷分隔。'}
    ],required:2,field:'到場時，找找三幢建築和小巷的實際位置。'
  },
  {
    id:'plan',kind:'plan',eyebrow:'建築 · 平面圖',title:'從前進走向後進',cover:'廟內平面',
    prompt:'沿來源圖則找出進入廟內的路線，再帶着問題到現場。',source:sources.plan,extraSource:sources.twgh,
    evidence:[
      {id:'entrance',label:'中門',fact:'東華三院平面圖在圖下方標出中門。'},
      {id:'court',label:'天井',fact:'平面圖標出天井；建築資料指出它位於前後兩進之間。'},
      {id:'shrines',label:'後方神龕',fact:'平面圖上方標出供奉文武二帝的神龕。'}
    ],required:3,field:'到場時，沿前進經天井到後進，親身核對空間關係。'
  },
  {
    id:'roof',kind:'roof',eyebrow:'建築 · 工藝',title:'屋頂上有甚麼工藝？',cover:'屋脊細節',
    prompt:'先認得工藝名稱；真正的細節留待現場尋找。',source:sources.twgh,
    evidence:[
      {id:'ridge',label:'屋脊陶塑',fact:'東華三院資料指出，文武廟屋脊有石灣陶塑，呈現粵劇戲台場景。'},
      {id:'craft',label:'不同工藝',fact:'文武廟也有花崗石雕、木雕、灰塑和壁畫；材料不能代替現場細看。'}
    ],required:1,field:'到場時，找一處你能清楚看見的建築工藝。'
  },
  {
    id:'deities',kind:'faith',eyebrow:'信仰 · 供奉',title:'文與武的故事',cover:'文與武',
    prompt:'循着文昌與關雲長的故事，認識兩位受奉者。',source:sources.twghFestival,extraSource:sources.sanguozhi,
    evidence:[
      {id:'man-identity',label:'文昌身份',fact:'東華三院介紹，文帝張亞子後受封為文昌帝君。'},
      {id:'man-wish',label:'文昌祈願',fact:'東華三院的文昌啟智禮記錄了學子對聰明勤奮、學業有成的祈願。'},
      {id:'man-role',label:'文昌職掌',fact:'廟方介紹文昌帝君在傳統信仰中掌管學業及官祿。'},
      {id:'man-link',label:'連起文昌線索',fact:'文昌的信仰職掌與祭典中的學業祈願互相呼應。'},
      {id:'mo-identity',label:'關雲長身份',fact:'關羽字雲長，是三國時代的將領。'},
      {id:'mo-choice',label:'厚待與舊恩',fact:'《三國志》記載，曹操厚待關羽；關羽仍記着劉備的恩情。'},
      {id:'mo-loyalty',label:'留書告別',fact:'《三國志》記載，關羽立功後封起賞賜，留書回到劉備身邊。'},
      {id:'mo-faith',label:'後世敬奉',fact:'後人推崇關羽的忠義與勇武，敬奉他為關帝。'},
      {id:'mo-manmo',label:'上環文武廟',fact:'上環文武廟供奉文昌與關帝；東華三院仍舉行秋祭。'}
    ],required:9,field:'到場時，找找廟內真正可見的文昌與關帝供奉，以及相關說明。'
  },
  {
    id:'kung',kind:'community',eyebrow:'社群 · 昔今',title:'公所：昔日與今天',cover:'公所・昔今',
    prompt:'找出昔日用途與今日用途各自的資料依據。',source:sources.twgh,extraSource:sources.amo,
    evidence:[
      {id:'past',label:'昔日',fact:'古物古蹟辦事處記載：公所曾供區內華人議事及排難解紛。'},
      {id:'today',label:'今天',fact:'東華三院建築資料記載：公所現已改作紀念品商店。昔日用途不能直接當作今日現況。'}
    ],required:2,field:'到場時，可從哪些公開可見的線索理解公所現在的用途？'
  },
  {
    id:'monument',kind:'monument',eyebrow:'保育 · 法定古蹟',title:'2010：一個保護的決定',cover:'2010',
    prompt:'一個年份能說明保護身分，還有甚麼要繼續了解？',source:sources.amo,
    evidence:[
      {id:'year',label:'列為古蹟',fact:'文武廟組群於 2010 年列為法定古蹟。'},
      {id:'fabric',label:'受保護的價值',fact:'資料列出建築布局與多種傳統工藝；現場保存狀況需要親眼查證。'}
    ],required:1,field:'到場時，留意保護歷史建築與日常使用如何並存。'
  },
  {
    id:'plaque',kind:'plaque',eyebrow:'歷史 · 牌匾',title:'一塊匾額，一段故事',cover:'神威普佑',
    prompt:'匾額的背景能反映廟宇以外的甚麼事？',source:sources.twgh,
    evidence:[
      {id:'gift',label:'御賜匾額',fact:'東華三院記載：「神威普佑」匾額於 1879 年由清朝光緒皇帝御賜。'},
      {id:'relief',label:'賑災背景',fact:'匾額與東華三院為華北旱災籌款賑災有關，提醒我們追問廟宇與社會的關係。'}
    ],required:1,field:'到場時，找找匾額與說明文字；哪些內容需要再查資料？'
  },
  {
    id:'rites',kind:'rites',eyebrow:'社群 · 延續',title:'秋祭仍在舉行',cover:'秋祭',
    prompt:'把昔日制度與今天的活動放在一起看。',source:sources.amo,
    evidence:[
      {id:'trust',label:'1908 年',fact:'1908 年《文武廟條例》把文武廟交予東華醫院管理。'},
      {id:'annual',label:'每年秋祭',fact:'古物古蹟辦事處記載，東華三院董事局與社會賢達每年仍在廟內舉行秋祭。'}
    ],required:2,field:'到場時，哪些公開資料可幫你理解今日的活動？'
  }
];
const byId = new Map(documents.map(document=>[document.id,document]));
const table = document.getElementById('table-view');
const documentView = document.getElementById('document-view');
const summaryView = document.getElementById('summary-view');
const historyView = document.getElementById('history-view');
const paper = document.getElementById('document-paper');
const folioLayer = document.getElementById('folio-layer');
const traySlots = document.getElementById('tray-slots');
const continueButton = document.getElementById('tray-continue');
const storageKey = 'manmo-material-table-v1';
const faithStoryStorageKey = 'manmo-faith-story-v24';
const guandiStoryStorageKey = 'manmo-guandi-story-v25';
const artworkAnchors = {
  choice: {wide: [.5, .742], landscape: [.5, .76], portrait: [.5, .485]},
  origin: {closed: {wide: [.52, .54], landscape: [.5, .54], portrait: [.4, .51]}, revealed: {wide: [.9, .55], landscape: [.79, .49], portrait: [.13, .47]}},
  stars: {closed: {wide: [.27, .13], landscape: [.37, .12], portrait: [.45, .14]}, revealed: {wide: [.27, .13], landscape: [.37, .12], portrait: [.45, .14]}},
  study: {closed: {wide: [.35, .6], landscape: [.51, .49], portrait: [.52, .4]}, revealed: {wide: [.35, .59], landscape: [.51, .49], portrait: [.52, .4]}},
  today: {closed: {wide: [.61, .56], landscape: [.56, .49], portrait: [.53, .4]}, revealed: {wide: [.61, .56], landscape: [.56, .49], portrait: [.53, .4]}},
  portrait: {closed: {wide: [.52, .37], landscape: [.45, .19], portrait: [.41, .25]}, revealed: {wide: [.52, .12], landscape: [.45, .19], portrait: [.41, .25]}},
  'guan-camp': {closed: {wide: [.444, .768], landscape: [.456, .63], portrait: [.46, .486]}, revealed: {wide: [.5, .55], landscape: [.47, .53], portrait: [.5, .43]}},
  'guan-gifts': {closed: {wide: [.67, .48], landscape: [.65, .49], portrait: [.57, .41]}, revealed: {wide: [.67, .48], landscape: [.65, .49], portrait: [.57, .41]}},
  'guan-departure': {closed: {wide: [.34, .61], landscape: [.35, .6], portrait: [.48, .48]}, revealed: {wide: [.34, .61], landscape: [.35, .6], portrait: [.48, .48]}},
  'guan-shrine': {closed: {wide: [.65, .55], landscape: [.52, .55], portrait: [.52, .53]}, revealed: {wide: [.65, .55], landscape: [.52, .55], portrait: [.52, .53]}},
  'guan-manmo': {closed: {wide: [.553, .51], landscape: [.55, .51], portrait: [.59, .47]}, revealed: {wide: [.553, .51], landscape: [.55, .51], portrait: [.59, .47]}},
};

function artworkVariant() {
  if (matchMedia('(orientation: portrait)').matches) return 'portrait';
  return matchMedia('(max-aspect-ratio: 7/5)').matches ? 'landscape' : 'wide';
}

function placeArtworkHotspot(button, image, anchors) {
  if (!button || !image || !button.offsetParent || !image.complete || !image.naturalWidth) return;
  const point = anchors[artworkVariant()];
  if (!point) return;
  const frame = image.getBoundingClientRect();
  const parent = button.offsetParent.getBoundingClientRect();
  const imageStyle = getComputedStyle(image);
  const [positionX, positionY] = objectPositionFractions(imageStyle.objectPosition);
  const projected = projectArtworkPoint(frame.width, frame.height, image.naturalWidth, image.naturalHeight,
    point[0], point[1], positionX, positionY, imageStyle.objectFit);
  if (!projected) return;
  button.style.left = `${frame.left - parent.left + projected.x}px`;
  button.style.top = `${frame.top - parent.top + projected.y}px`;
  button.dataset.placed = 'true';
}

function refreshArtworkHotspots() {
  const visual = paper.querySelector('#faith-experience');
  if (!visual) return;
  if (visual.classList.contains('is-choosing')) {
    placeArtworkHotspot(visual.querySelector('#faith-choice-collect'), visual.querySelector('.faith-choice-art img'), artworkAnchors.choice);
  } else {
    const scene = visual.dataset.faithScene;
    const state = visual.dataset.faithState;
    const activePicture = visual.querySelector('.faith-art-scene.is-active');
    if (activePicture?.dataset.faithArt !== scene || activePicture?.dataset.artState !== state) return;
    const image = activePicture.querySelector('img');
    const expectedRatio = {wide: 1672 / 941, landscape: 1448 / 1086, portrait: 1086 / 1448}[artworkVariant()];
    if (image?.naturalWidth && Math.abs(image.naturalWidth / image.naturalHeight - expectedRatio) < .02) {
      placeArtworkHotspot(visual.querySelector('#faith-art-hotspot'), image, artworkAnchors[scene][state]);
    }
  }
}

function queueArtworkLayout() { requestAnimationFrame(refreshArtworkHotspots); }
let collected = {};
try { const saved=JSON.parse(sessionStorage.getItem(storageKey)||'{}'); if(saved&&typeof saved==='object')collected=saved; } catch { /* Start fresh if old preview data is invalid. */ }
if(collected.deities&&(sessionStorage.getItem(faithStoryStorageKey)!=='complete'||sessionStorage.getItem(guandiStoryStorageKey)!=='complete'||!Array.isArray(collected.deities)||!documents.find(item=>item.id==='deities').evidence.every(item=>collected.deities.includes(item.id)))){
  delete collected.deities;
  sessionStorage.setItem(storageKey,JSON.stringify(collected));
}
let activeDocument=null;
let selectedEvidence=new Set();
let faithBeat=0;
let faithReveal=-1;
let faithChoosing=false;
let faithReturn='table';
let planStep=0;
const planDialogue=[
  {voice:'從中門開始',line:'先在圖的下方，找到「中門」。',target:'entrance'},
  {voice:'再往內',line:'由中門往內，找到標作「天井」的位置。',target:'court'},
  {voice:'繼續向前',line:'再往圖的上方，找出供奉文武二帝的神龕。',target:'shrines'},
  {voice:'你找到的',line:'中門、天井與後方神龕，在圖上連成一條參考路線。',next:'再看建築資料'},
  {voice:'建築資料',line:'文武廟本體分前後兩進，兩進之間設有已加蓋的天井。',next:'再想一步'},
  {voice:'想一想',line:'平面圖讓我們預先知道位置；光線與空間感還要到現場體會。',next:'帶去現場'},
  {voice:'到場',line:'沿前進、天井到後進走一遍，核對圖上的空間關係。'}
];
const faithStory=[
  {title:'一個名字',art:'origin',object:'scroll',cue:'輕觸桌上綁起的卷軸',opening:'畫中的書卷，帶你想到一個尚未讀清的名字。桌上的卷軸仍綁着，從這裏找起吧。',lines:[
    '卷軸展開，你跟着畫上的山路走到蜀地梓潼。廟方傳述：文帝姓張，名亞子，號梓潼，相傳是晉朝人。',
    '張亞子——這是辨認畫中人的第一條線索。這個名字，後來怎樣與文昌帝君相連？'
  ],source:sources.twghFestival,evidence:['man-identity']},
  {title:'兩條傳述',art:'stars',object:'stars',cue:'輕觸左邊的星光',opening:'一個名字還未說完整個故事。夜空裏，兩組星光尚未相接；看看它們如何連起來。',lines:[
    '你抬頭看見星光相連。文昌原是星宿的名字；後來，梓潼神與文昌星神的信仰逐漸合流。',
    '廟方傳述，張亞子到了元代獲封文昌帝君。畫中人的稱號，連着長久累積的信仰。'
  ],source:sources.sinica,evidence:[]},
  {title:'書齋的願望',art:'study',object:'book',cue:'輕觸桌上合起的書',opening:'知道了名字，還要知道人們為何敬奉他。書齋的燈仍亮着，翻開桌上的書看看。',lines:[
    '燈下的讀書人，盼着學有所成。畫中的筆與書卷，也讓你開始留意這份與求學相連的願望。',
    '在傳統信仰裏，文昌被奉為掌管學業與官祿的神明。於是，讀書人把求學與前程的願望託付給他。'
  ],source:sources.twghFestival,evidence:['man-role']},
  {title:'上環的祭禮',art:'today',object:'card',cue:'輕觸桌上封起的紅色紙卡',opening:'這份求學的願望，如何留在上環？桌上的紅色紙卡，帶你讀一份祭禮記錄。',lines:[
    '紙卡揭開，你讀到東華三院的記錄：2013 年，上環文武廟舉行了「文昌啟智禮」。',
    '你讀到祭禮記錄：學子祈願聰明勤奮、學業有成；善信亦祈願工作如意。書齋裏的盼望，原來仍有人延續。'
  ],source:sources.twghFestival,evidence:['man-wish']},
  {title:'再見文昌',art:'portrait',object:'brush',cue:'輕觸文昌手中的毛筆',opening:'名字、書齋與祭禮，漸漸連在一起。再看畫中那支毛筆，你會怎樣理解它？',lines:[
    '筆與書卷讓你想起求學的願望；廟方記錄，則讓你知道文昌與學業、官祿的信仰聯繫。畫中的線索，需要與資料一起閱讀。',
    '現在，回到廟藏裏的那幅畫吧。你已能認出文昌帝君，也知道這一側的筆與書卷，為何值得細看。'
  ],source:[sources.sinica,sources.twghFestival],evidence:['man-link']},
  {title:'字雲長',art:'guan-camp',object:'map',cue:'輕觸摺起的行軍圖',opening:'畫中的衣甲與長刀，把你的目光帶向一位將領。營燈下的行軍圖，還摺在案上。',lines:[
    '你展開行軍圖，認識這段故事的主人：關羽，字雲長，是跟隨劉備的將領。',
    '此刻，你認識的是一位歷史人物。故事還沒走到他受奉為關帝的時候；先看看他如何作出選擇。'
  ],source:sources.had,evidence:['mo-identity']},
  {title:'厚待與舊恩',art:'guan-gifts',object:'gifts',cue:'輕觸案上未開的賞賜',opening:'案上的賞賜十分豐厚。面對曹操的厚待，關羽仍記着劉備；他會怎樣回應兩份恩情？',lines:[
    '你查看賞賜背後的記錄。《三國志》記載，曹操厚待關羽，任他為偏將軍；關羽卻無意長留。',
    '另一邊，是劉備曾給他的深厚情誼。關羽打算先立功報答曹操，然後離開；兩份恩情，他都沒有輕看。'
  ],source:sources.sanguozhi,evidence:['mo-choice']},
  {title:'留下告別書',art:'guan-departure',object:'letter',cue:'輕觸正在寫下的告別書',opening:'他準備怎樣實踐自己的話？案上的告別書，留下了下一條線索。',lines:[
    '你走近那封信。《三國志》記載：關羽立功後，把曹操的賞賜封好，留書告別，回到劉備身邊。',
    '賞賜留下，人卻離開。把這個行動與他先前的話連起來，你看見了報恩，也看見了他對劉備的承諾。'
  ],source:sources.sanguozhi,evidence:['mo-loyalty']},
  {title:'從關羽到關帝',art:'guan-shrine',object:'incense',cue:'輕觸尚未點起的香爐',opening:'一位將領，為何會成為廟中受敬奉的人？看看香爐後的畫像，故事還有後來的部分。',lines:[
    '香煙慢慢升起。昔日的將領關羽，因忠義與勇武受到後人敬重，也逐漸被奉為關帝。',
    '再看畫像中的長刀與衣甲，你想到的已不只有武勇。後人也從關羽的故事裏，寄託對忠義的重視。'
  ],source:[sources.heritageMuseum,sources.had],evidence:['mo-faith']},
  {title:'走進上環',art:'guan-manmo',object:'incense',cue:'輕觸前方未燃的香爐',opening:'香煙把目光帶回上環。你在前殿看見的那位武帝，與這段往事有了聯繫。',lines:[
    '香爐亮起，你同時看見文昌與關帝。這座廟供奉兩位；東華三院記錄，秋祭向文武二帝酬拜，為香港祈福。',
    '回到廟藏裏的畫像吧。你已認出關羽，也讀過他的選擇；畫中的武帝，如今有了更清楚的來歷。'
  ],source:[sources.had,sources.twghManmo],evidence:['mo-manmo']}
];
const wenchangSceneCount=5;
const faithSources=[...new Map(faithStory.flatMap(scene=>Array.isArray(scene.source)?scene.source:[scene.source]).map(source=>[source.url,source])).values()];
function faithPartComplete(part){return sessionStorage.getItem(part==='wenchang'?faithStoryStorageKey:guandiStoryStorageKey)==='complete';}
function faithPartForBeat(beat){return beat<wenchangSceneCount?'wenchang':'guandi';}
function faithPartBounds(part){return part==='wenchang'?{start:0,end:wenchangSceneCount-1}:{start:wenchangSceneCount,end:faithStory.length-1};}
let topZ=20;
let archiveArtifactOpen=false;
let archiveBridge=null;
let archiveBridgeTimer=0;
let archiveBridgeFadeTimer=0;
let archiveBridgeFrame=0;
function crossfadeArchiveAndStory(update, part=null){
  if(archiveBridge){
    window.clearTimeout(archiveBridgeTimer);
    window.clearTimeout(archiveBridgeFadeTimer);
    cancelAnimationFrame(archiveBridgeFrame);
    archiveBridge.remove();
    archiveBridge=null;
  }
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){update();return;}
  const bridge=document.createElement('div');
  bridge.className='archive-story-bridge';
  bridge.setAttribute('aria-hidden','true');
  const enteringStory=documentView.hidden;
  bridge.dataset.direction=enteringStory?'enter':'return';
  if(enteringStory){
    bridge.dataset.part=part;
    const stage=document.createElement('div');
    stage.className='archive-story-stage';
    const painting=document.querySelector('#restoration-painting-art');
    const copy=document.createElement('img');
    copy.src=painting.currentSrc||painting.src;
    copy.className='archive-art';
    copy.alt='';
    stage.append(copy);
    bridge.append(stage);
  }else{
    const active=documentView.querySelector('.faith-art-scene.is-active img');
    if(active){
      const copy=document.createElement('img');
      copy.className='archive-story-full-art';
      copy.src=active.currentSrc||active.src;
      copy.alt='';
      bridge.append(copy);
    }
  }
  document.body.append(bridge);
  archiveBridge=bridge;
  void bridge.offsetWidth;
  update();
  if(enteringStory){
    archiveBridgeFrame=requestAnimationFrame(()=>bridge.classList.add('is-zooming'));
    archiveBridgeFadeTimer=window.setTimeout(()=>bridge.classList.add('is-fading'),680);
    archiveBridgeTimer=window.setTimeout(()=>{if(archiveBridge===bridge)archiveBridge=null;bridge.remove();},1200);
  }else{
    archiveBridgeFrame=requestAnimationFrame(()=>bridge.classList.add('is-fading'));
    archiveBridgeTimer=window.setTimeout(()=>{if(archiveBridge===bridge)archiveBridge=null;bridge.remove();},460);
  }
}
const folioPositions={};

function escaped(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function sourceLink(source){return `<a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.name}</a>`;}

function beginFaithFromRoom(part){
  faithReturn='room';
  crossfadeArchiveAndStory(()=>openDocument('deities', part==='wen'?'wenchang':'guandi'),part);
}
function currentFaithPartFinished(){
  return activeDocument?.id==='deities'&&!faithChoosing
    &&faithBeat===faithPartBounds(faithPartForBeat(faithBeat)).end
    &&faithReveal===faithStory[faithBeat].lines.length-1;
}
function finishFaithPart(part){
  sessionStorage.setItem(part==='wenchang'?faithStoryStorageKey:guandiStoryStorageKey,'complete');
  closeDocument(part);
}

function coverMarkup(document){
  // Printed titles belong to the raster artwork. Buttons retain accessible names.
  return `<span class="folio-cover-art folio-cover-art--${document.id}" aria-hidden="true"></span>`;
}

function renderTable(){
  folioLayer.innerHTML=[].map(document=>`<button class="folio folio--${document.id}${collected[document.id]?' is-collected':''}" type="button" data-document="${document.id}" aria-label="打開資料：${escaped(document.title)}"><span class="folio-inside">${coverMarkup(document)}</span>${collected[document.id]?'<span class="folio-collected">已收集</span>':''}</button>`).join('');
  folioLayer.querySelectorAll('.folio').forEach(element=>{
    const position=folioPositions[element.dataset.document];
    if(position){element.dataset.x=String(position.x);element.dataset.y=String(position.y);element.style.setProperty('--drag-x',`${position.x}px`);element.style.setProperty('--drag-y',`${position.y}px`);element.style.zIndex=String(position.z);}
    enableFolio(element);
  });
  renderTray();
}
function enableFolio(element){
  let startX=0,startY=0,originX=0,originY=0,moved=false;
  element.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    element.setPointerCapture(event.pointerId);
    startX=event.clientX;startY=event.clientY;
    originX=Number(element.dataset.x||0);originY=Number(element.dataset.y||0);
    moved=false;element.style.zIndex=String(++topZ);element.classList.add('is-held');
  });
  element.addEventListener('pointermove',event=>{
    if(!element.hasPointerCapture(event.pointerId))return;
    const dx=event.clientX-startX,dy=event.clientY-startY;
    if(Math.hypot(dx,dy)>8)moved=true;
    if(moved){element.style.setProperty('--drag-x',`${originX+dx}px`);element.style.setProperty('--drag-y',`${originY+dy}px`);}
  });
  element.addEventListener('pointerup',event=>{
    if(!element.hasPointerCapture(event.pointerId))return;
    element.releasePointerCapture(event.pointerId);
    element.classList.remove('is-held');
    if(moved){
      const x=originX+event.clientX-startX,y=originY+event.clientY-startY;
      element.dataset.x=String(x);element.dataset.y=String(y);
      folioPositions[element.dataset.document]={x,y,z:topZ};
      element.dataset.wasDragged='true';
      window.setTimeout(()=>{element.dataset.wasDragged='false';},80);
    }
  });
  element.addEventListener('pointercancel',()=>element.classList.remove('is-held'));
  element.addEventListener('click',()=>{
    if(element.dataset.wasDragged==='true'){element.dataset.wasDragged='false';return;}
    element.classList.add('is-opening');
    window.setTimeout(()=>openDocument(element.dataset.document),180);
  });
}
function renderTray(){
  const chosen=documents.filter(document=>collected[document.id]);
  const visible=chosen.slice(0,3);
  traySlots.innerHTML=Array.from({length:3},(_,index)=>visible[index]?`<button class="tray-slot tray-slot--filled" type="button" data-open-collected="${visible[index].id}" aria-label="再次打開${escaped(visible[index].title)}"><span>${escaped(visible[index].cover)}</span></button>`:`<span class="tray-slot tray-slot--empty" aria-hidden="true">＋</span>`).join('');
  traySlots.querySelectorAll('[data-open-collected]').forEach(button=>button.addEventListener('click',()=>openDocument(button.dataset.openCollected)));
  document.getElementById('tray-status').textContent=chosen.length?`已收集 ${chosen.length} 份 · 隨時可以再看`:'尚未收集資料';
  continueButton.disabled=false;
  continueButton.textContent=collected.deities?'繼續：歷史篇':'先讀文與武';
}

function evidenceButton(document,id,extraClass=''){
  const evidence=document.evidence.find(item=>item.id===id);
  return `<button class="evidence-target ${extraClass}" type="button" data-evidence="${id}" aria-label="查看資料線索：${escaped(evidence.label)}"><span>＋</span><b>${escaped(evidence.label)}</b></button>`;
}
function visualMarkup(document){
  switch(document.id){
    case 'compound': return `<div class="visual art-visual art-visual--compound"><img class="art-scene" src="assets/compound-art.jpg" alt="根據官方組群插畫創作的三幢建築藝術圖；並非測繪圖"><span class="art-note">創作插畫 · 請以來源資料核對位置</span><div class="art-building-label art-building-label--man">文武廟</div><div class="art-building-label art-building-label--lit">列聖宮</div><div class="art-building-label art-building-label--kung">公所</div>${evidenceButton(document,'three','art-target--compound-three')}${evidenceButton(document,'lanes','art-target--compound-lanes')}</div>`;
    case 'plan': return '';
    case 'roof': return `<div class="visual art-visual art-visual--roof"><img class="art-scene" src="assets/roof-art.jpg" alt="以粵式屋脊工藝為題的原創插畫，並非文武廟實物照片"><span class="art-note">工藝意象插畫 · 現場細節待考察</span>${evidenceButton(document,'ridge','art-target--roof-ridge')}${evidenceButton(document,'craft','art-target--roof-craft')}</div>`;
    case 'deities': return '';
    case 'kung': return `<div class="visual art-visual art-visual--kung"><img class="art-scene" src="assets/community-art.jpg" alt="以舊日議事與今日用途為題的原創對照插畫，並非公所實況照片"><span class="art-note">昔今意象插畫 · 不是歷史照片</span><div class="art-building-label art-building-label--past">昔日</div><div class="art-building-label art-building-label--today">今天</div>${evidenceButton(document,'past','art-target--kung-past')}${evidenceButton(document,'today','art-target--kung-today')}</div>`;
    case 'monument': return `<div class="visual art-visual art-visual--monument"><img class="art-scene" src="assets/conservation-art.jpg" alt="以材料及保護工藝為題的原創插畫，並非現場保存狀況紀錄"><span class="art-note">保育意象插畫 · 非現況紀錄</span><div class="art-year">2010 <small>列為法定古蹟</small></div>${evidenceButton(document,'year','art-target--monument-year')}${evidenceButton(document,'fabric','art-target--monument-fabric')}</div>`;
    case 'plaque': return `<div class="visual art-visual art-visual--plaque"><img class="art-scene" src="assets/plaque-art.jpg" alt="以深色木匾與賑災文獻為題的原創插畫，並非匾額照片"><span class="art-note">匾額意象插畫 · 非實物照片</span><div class="art-plaque-text">神威普佑</div>${evidenceButton(document,'gift','art-target--plaque-gift')}${evidenceButton(document,'relief','art-target--plaque-relief')}</div>`;
    case 'rites': return `<div class="visual art-visual art-visual--rites"><img class="art-scene" src="assets/rites-art.jpg" alt="以廟內祭祀延續為題的原創插畫，並非秋祭活動紀錄"><span class="art-note">祭祀意象插畫 · 非活動紀錄</span>${evidenceButton(document,'trust','art-target--rites-trust')}${evidenceButton(document,'annual','art-target--rites-annual')}</div>`;
  }
}
function planFullMarkup(document){
  return `<div class="plan-full" id="plan-experience"><div class="plan-stage">
    <picture class="plan-book-art"><source media="(max-width: 560px) and (orientation: portrait)" srcset="assets/plan-book-mobile-v19.jpg"><source media="(orientation: portrait)" srcset="assets/plan-book-portrait-v19.jpg"><img src="assets/plan-book-landscape-v19.jpg" alt="原創建築資料書頁，鑲嵌東華三院平面圖的紙框留在頁上"></picture>
    <button class="plan-back" id="document-back" type="button" aria-label="返回資料桌">返回</button>
    <h2 class="plan-title" id="document-title">從前進走向後進</h2>
    <span class="plan-index">資料 02 ／ 08　·　建築與平面</span>
    <figure class="plan-source"><img src="assets/twgh-plan-source-v19.jpg" alt="東華三院公布的文武廟廟內平面圖：圖下方標出中門，往內標出天井，圖上方標出文武二帝神龕"><button class="plan-seal plan-seal--entrance" data-plan-target="entrance" type="button" aria-label="在平面圖找到中門" hidden><span>一</span></button><button class="plan-seal plan-seal--court" data-plan-target="court" type="button" aria-label="在平面圖找到天井" hidden><span>二</span></button><button class="plan-seal plan-seal--shrines" data-plan-target="shrines" type="button" aria-label="在平面圖找到後方神龕" hidden><span>三</span></button><figcaption><span>東華三院平面圖原件 · 調色展示</span><button class="plan-magnify" id="plan-magnify" type="button">放大原圖</button></figcaption></figure>
    <section class="plan-conversation" aria-label="循圖進廟的逐句引導"><div class="plan-conversation-heading"><span id="plan-voice"></span><span id="plan-progress"></span></div><p class="plan-previous" id="plan-previous" hidden></p><p class="plan-line" id="plan-line" aria-live="polite"></p><p class="plan-hint" id="plan-hint"></p><button class="plan-dialogue-back" id="plan-dialogue-back" type="button" hidden>上一句</button><button class="plan-dialogue-next" id="plan-dialogue-next" type="button" hidden>下一句</button><button class="plan-collect" id="collect-button" type="button" hidden disabled>把路線收進探索夾</button></section>
    <div class="plan-sources">原圖：${sourceLink(document.source)}　·　建築資料：${sourceLink(document.extraSource)}　·　書頁為創作美術</div>
    <div class="plan-feedback" id="document-feedback" aria-live="polite"></div>
  </div><div class="plan-zoom" id="plan-zoom" hidden role="dialog" aria-modal="true" aria-label="放大東華三院平面圖"><button class="plan-zoom-close" id="plan-zoom-close" type="button">返回書頁</button><img src="assets/twgh-plan-source-v19.jpg" alt="東華三院公布的文武廟廟內平面圖原件"><p>東華三院平面圖原件 · 調色展示</p></div></div>`;
}
function faithFullMarkup(document){
  return `<div class="faith-full faith-experience" id="faith-experience"><div class="faith-full-stage">
    <div class="faith-scene-art" id="faith-scene-art">
      ${faithStory.flatMap(scene=>['closed','revealed'].map(state=>`<picture class="faith-art-scene" data-faith-art="${scene.art}" data-art-state="${state}" aria-hidden="true"><source media="(orientation: portrait)" data-srcset="assets/faith-${scene.art}-portrait-${state}-v33.webp"><source media="(orientation: landscape) and (max-aspect-ratio: 7/5)" data-srcset="assets/faith-${scene.art}-landscape-${state}-v33.webp"><img data-src="assets/faith-${scene.art}-wide-${state}-v33.webp" alt="${escaped(scene.title)}的${state==='closed'?'觸碰前':'揭示後'}原創故事場景，並非史料或廟內實景"></picture>`)).join('')}
    </div>
    <div class="faith-choice" id="faith-choice" aria-label="選擇先讀文昌或關雲長">
      <picture class="faith-choice-art faith-choice-art--locked" aria-hidden="true"><source media="(orientation: portrait)" srcset="assets/faith-choice-portrait-locked-v43.jpg"><source media="(orientation: landscape) and (max-aspect-ratio: 7/5)" srcset="assets/faith-choice-landscape-locked-v43.jpg"><img src="assets/faith-choice-wide-locked-v43.jpg" alt=""></picture>
      <picture class="faith-choice-art faith-choice-art--revealed" aria-hidden="true"><source media="(orientation: portrait)" srcset="assets/faith-choice-portrait-v35.webp"><source media="(orientation: landscape) and (max-aspect-ratio: 7/5)" srcset="assets/faith-choice-landscape-v35.webp"><img src="assets/faith-choice-wide-v35.webp" alt=""></picture>
      <button class="faith-choice-option faith-choice-option--wen" data-faith-choice="wenchang" type="button" aria-label="先讀文昌帝君的故事"><span class="faith-choice-zone faith-choice-zone--figure" aria-hidden="true"></span><span class="faith-choice-zone faith-choice-zone--plaque" aria-hidden="true"></span><span class="faith-choice-breath faith-choice-breath--figure" aria-hidden="true"></span><span class="faith-choice-breath faith-choice-breath--plaque" aria-hidden="true"></span></button>
      <button class="faith-choice-option faith-choice-option--wu" data-faith-choice="guandi" type="button" aria-label="先讀關雲長的故事"><span class="faith-choice-zone faith-choice-zone--figure" aria-hidden="true"></span><span class="faith-choice-zone faith-choice-zone--plaque" aria-hidden="true"></span><span class="faith-choice-breath faith-choice-breath--figure" aria-hidden="true"></span><span class="faith-choice-breath faith-choice-breath--plaque" aria-hidden="true"></span></button>
      <span class="faith-choice-corner-shadow" aria-hidden="true"></span>
      <button class="faith-choice-collect" id="faith-choice-collect" type="button" hidden aria-label="揭開書頁中央的封印，收起文與武的線索"><span class="visually-hidden">收起文與武的線索</span></button>
      <details class="faith-source-index"><summary>史料來源</summary><div>${faithSources.map(source=>sourceLink(source)).join('')}</div></details>
      <p class="faith-choice-disclaimer">創作畫像 · 不是廟內神像實錄</p>
    </div>
    <button class="faith-full-back" id="document-back" type="button" aria-label="${faithReturn==='room'?'返回畫像':'返回資料桌'}">← <span>${faithReturn==='room'?'返回畫像':'返回資料桌'}</span></button>
    <span class="faith-full-index" id="faith-full-index">畫中故事 · 文昌篇</span>
    <h2 class="faith-full-title" id="document-title">文與武的故事</h2>
    <button class="faith-art-hotspot" id="faith-art-hotspot" type="button" aria-label="查看畫中的線索"><span class="faith-clue-label" aria-hidden="true">查看線索</span></button>
    <p class="faith-scene-caption" id="faith-scene-caption">創作場景 · 並非史料原件</p>
    <section class="faith-page" aria-label="文武二帝畫像中的故事">
      <div class="faith-page-copy" id="faith-page-copy" aria-live="polite"></div>
      <nav class="faith-page-nav" aria-label="故事閱讀"><button id="faith-page-prev" type="button" hidden aria-label="回看上一句">‹</button><button class="faith-page-next" id="faith-page-next" type="button" disabled><span id="faith-progress-label">先觸碰畫中線索</span></button><button id="collect-button" type="button" hidden disabled>記下文與武，翻下一頁</button></nav>
    </section>
    <div class="faith-full-feedback" id="document-feedback" aria-live="polite"></div>
    <div class="faith-full-sources">場景均為創作美術，並非廟內照片 · 每幕附史料來源</div>
  </div></div>`;
}
function openDocument(id, part){
  activeDocument=byId.get(id);if(!activeDocument)return;
  journey.hide();
  selectedEvidence=new Set((collected[id]||[]).filter(evidenceId=>activeDocument.evidence.some(item=>item.id===evidenceId)));
  if(activeDocument.id==='deities'){
    if(faithPartComplete('wenchang'))faithStory.slice(0,wenchangSceneCount).forEach(scene=>scene.evidence.forEach(evidenceId=>selectedEvidence.add(evidenceId)));
    if(faithPartComplete('guandi'))faithStory.slice(wenchangSceneCount).forEach(scene=>scene.evidence.forEach(evidenceId=>selectedEvidence.add(evidenceId)));
    faithChoosing=!part;
    faithBeat=part?faithPartBounds(part).start:0;
    faithReveal=-1;
  }
  planStep=activeDocument.id==='plan'&&selectedEvidence.size>=3?planDialogue.length-1:0;
  table.hidden=true;summaryView.hidden=true;documentView.hidden=false;
  paper.className=`document-paper document-paper--${activeDocument.kind}`;
  paper.innerHTML=activeDocument.id==='deities'?faithFullMarkup(activeDocument):activeDocument.id==='plan'?planFullMarkup(activeDocument):`<div class="document-head"><button class="document-back" id="document-back" type="button">〈 <span>${archiveArtifactOpen?'返回空間':'返回資料桌'}</span></button><div class="document-heading"><span>${escaped(activeDocument.eyebrow)}</span><h2 id="document-title">${escaped(activeDocument.title)}</h2><p>${escaped(activeDocument.prompt)}</p></div><span class="document-index">資料 ${String(documents.indexOf(activeDocument)+1).padStart(2,'0')} / ${String(documents.length).padStart(2,'0')}</span></div><div class="document-main">${visualMarkup(activeDocument)}</div><div class="document-foot"><div class="document-feedback" id="document-feedback" aria-live="polite"></div><div class="document-actions"><div class="document-sources">資料來源：${sourceLink(activeDocument.source)}${activeDocument.extraSource?` · ${sourceLink(activeDocument.extraSource)}`:''}<br>圖像為創作插畫；不能代替現場證據</div><button class="collect-button" id="collect-button" type="button">收進探索夾</button></div></div>`;
  if(part)paper.querySelector('#document-back').setAttribute('aria-label','返回畫像');
  else if(archiveArtifactOpen)paper.querySelector('#document-back').setAttribute('aria-label','返回空間');
  paper.querySelector('#document-back').addEventListener('click',()=>{
    if(activeDocument?.id==='deities'&&faithReturn!=='room'&&!faithChoosing&&!currentFaithPartFinished()){faithChoosing=true;updateFaithExperience();paper.querySelector('[data-faith-choice]')?.focus({preventScroll:true});return;}
    closeDocument();
  });
  if(activeDocument.id==='deities')enableFaithExperience();
  else if(activeDocument.id==='plan')enablePlanExperience();
  else paper.querySelectorAll('[data-evidence]').forEach(button=>button.addEventListener('click',()=>{
    selectedEvidence.add(button.dataset.evidence);updateEvidence();
  }));
  paper.querySelector('#collect-button').addEventListener('click',collectDocument);
  updateEvidence();
  paper.querySelectorAll('img').forEach(image=>image.addEventListener('load',queueArtworkLayout));
  queueArtworkLayout();
  documentView.scrollTop=0;paper.scrollTop=0;
  paper.querySelector('#document-back').focus({preventScroll:true});
}
function enableFaithExperience(){
  const visual=paper.querySelector('#faith-experience');
  visual.addEventListener('click',event=>{
    const choice=event.target.closest('[data-faith-choice]');
    if(choice){
      visual.querySelector('.faith-source-index').open=false;
      faithChoosing=false;
      faithBeat=faithPartBounds(choice.dataset.faithChoice).start;
      faithReveal=-1;
      updateFaithExperience();
      visual.querySelector('#faith-art-hotspot').focus({preventScroll:true});
      return;
    }
    if(event.target.closest('#faith-choice-collect')){collectDocument();return;}
    if(faithChoosing)return;
    if(event.target.closest('#faith-art-hotspot')&&faithReveal<0){
      faithReveal=0;
      updateFaithExperience();
      visual.querySelector('#faith-page-next').focus({preventScroll:true});
      return;
    }
    if(event.target.closest('#faith-page-next')&&faithReveal>=0){
      if(faithReveal<faithStory[faithBeat].lines.length-1)faithReveal++;
      else{
        const bounds=faithPartBounds(faithPartForBeat(faithBeat));
        if(faithBeat<bounds.end){faithBeat++;faithReveal=-1;}
        else {finishFaithPart(faithPartForBeat(faithBeat));return;}
      }
      updateFaithExperience();
      if(faithChoosing)visual.querySelector('[data-faith-choice]')?.focus({preventScroll:true});
      else visual.querySelector(faithReveal<0?'#faith-art-hotspot':'#faith-page-next').focus({preventScroll:true});
      return;
    }
    if(event.target.closest('#faith-page-prev')){
      if(faithReveal>0)faithReveal--;
      else if(faithReveal===0)faithReveal=-1;
      else if(faithBeat>faithPartBounds(faithPartForBeat(faithBeat)).start){faithBeat--;faithReveal=faithStory[faithBeat].lines.length-1;}
      else if(faithReturn==='room'){closeDocument();return;}
      else faithChoosing=true;
      updateFaithExperience();
    }
  });
}
function faithPageMarkup(){
  const scene=faithStory[faithBeat];
  const line=faithReveal<0?scene.opening:scene.lines[faithReveal];
  const isWenchang=faithBeat<wenchangSceneCount;
  return `<span class="faith-page-kicker">${escaped(scene.title)} <small>${isWenchang?'文昌':'關雲長'}</small></span><div class="faith-dialogue"><p class="faith-dialogue-line" role="status">${escaped(line)}</p></div>`;
}
function loadFaithArt(picture){
  if(!picture)return;
  picture.querySelectorAll('source[data-srcset]').forEach(source=>{source.srcset=source.dataset.srcset;source.removeAttribute('data-srcset');});
  const image=picture.querySelector('img[data-src]');
  if(image){image.src=image.dataset.src;image.removeAttribute('data-src');}
}
function updateFaithExperience(){
  const visual=paper.querySelector('#faith-experience');
  visual.classList.toggle('is-choosing',faithChoosing);
  const choice=visual.querySelector('#faith-choice');
  choice.hidden=!faithChoosing;
  if(faithChoosing){
    prepareFaithChoiceArt(choice);
    choice.classList.toggle('is-wen-unlocked',faithPartComplete('wenchang'));
    choice.classList.toggle('is-wu-unlocked',faithPartComplete('guandi'));
    for(const beat of [0,wenchangSceneCount])loadFaithArt(visual.querySelector(`[data-faith-art="${faithStory[beat].art}"][data-art-state="closed"]`));
    for(const part of ['wenchang','guandi']){
      const name=part==='wenchang'?'文昌帝君':'關雲長';
      visual.querySelector(`[data-faith-choice="${part}"]`).setAttribute('aria-label',`${faithPartComplete(part)?'重讀':'先讀'}${name}的故事`);
    }
    const choiceCollect=visual.querySelector('#faith-choice-collect');
    choiceCollect.hidden=!(faithPartComplete('wenchang')&&faithPartComplete('guandi'));
    queueArtworkLayout();
    return;
  }
  const scene=faithStory[faithBeat];
  visual.dataset.faithScene=scene.art;
  visual.classList.toggle('is-revealed',faithReveal>=0);
  const artState=faithReveal<0?'closed':'revealed';
  visual.dataset.faithState=artState;
  visual.querySelectorAll(`[data-faith-art="${scene.art}"]`).forEach(loadFaithArt);
  const targetPicture=visual.querySelector(`[data-faith-art="${scene.art}"][data-art-state="${artState}"]`);
  const targetImage=targetPicture.querySelector('img');
  const activateScene=()=>{
    if(visual.dataset.faithScene!==scene.art||visual.dataset.faithState!==artState)return;
    const isFirstScene=!visual.querySelector('.faith-art-scene.is-active');
    if(isFirstScene)targetPicture.style.transition='none';
    visual.querySelectorAll('[data-faith-art]').forEach(picture=>{
      const active=picture===targetPicture;
      picture.classList.toggle('is-active',active);
      picture.setAttribute('aria-hidden',String(!active));
    });
    if(isFirstScene){void targetPicture.offsetWidth;targetPicture.style.removeProperty('transition');}
    queueArtworkLayout();
  };
  if(targetImage.complete&&targetImage.naturalWidth)activateScene();
  else targetImage.addEventListener('load',activateScene,{once:true});
  if(faithReveal>=0&&faithBeat<faithPartBounds(faithPartForBeat(faithBeat)).end){
    const nextArt=faithStory[faithBeat+1].art;
    loadFaithArt(visual.querySelector(`[data-faith-art="${nextArt}"][data-art-state="closed"]`));
  }
  visual.querySelector('#faith-full-index').textContent=`畫中故事 · ${faithBeat<wenchangSceneCount?'文昌篇':'關雲長篇'}`;
  visual.querySelector('#faith-scene-caption').textContent=faithBeat===3?'創作場景 · 不是祭禮現場照片':faithBeat===4||faithBeat===8?'創作畫像 · 不是廟內神像實錄':faithBeat===9?'創作意象 · 不是廟內實景照片':'創作場景 · 不是史料原件';
  const hotspot=visual.querySelector('#faith-art-hotspot');
  hotspot.hidden=faithReveal>=0;
  hotspot.removeAttribute('data-placed');
  hotspot.setAttribute('aria-label',scene.cue);
  const copy=visual.querySelector('#faith-page-copy');
  copy.innerHTML=faithPageMarkup();
  copy.scrollTop=0;
  const previous=visual.querySelector('#faith-page-prev');
  previous.hidden=false;
  const atPartStart=faithBeat===faithPartBounds(faithPartForBeat(faithBeat)).start;
  previous.setAttribute('aria-label',atPartStart&&faithReveal<0?(faithReturn==='room'?'返回畫像':'重新選擇文或武'):faithReveal<=0?'回看上一幕':'回看上一句');
  const bounds=faithPartBounds(faithPartForBeat(faithBeat));
  const next=visual.querySelector('#faith-page-next');
  const nextLabel=faithReveal<0?'先觸碰畫中線索':faithReveal<scene.lines.length-1?'下一句':faithBeat<bounds.end?'進入下一幕':faithReturn==='room'?'返回畫像':'返回資料桌';
  next.disabled=faithReveal<0;
  next.setAttribute('aria-label',nextLabel);
  visual.querySelector('#faith-progress-label').textContent=nextLabel;
  if(faithReveal===scene.lines.length-1)scene.evidence.forEach(id=>selectedEvidence.add(id));
  const collect=visual.querySelector('#collect-button');
  collect.disabled=true;
  collect.hidden=true;
  visual.querySelector('#document-feedback').textContent='';
  queueArtworkLayout();
}
function prepareFaithChoiceArt(choice){
  const image=choice.querySelector('.faith-choice-art--revealed img');
  const source=image.currentSrc||image.src;
  if(choice.dataset.revealSource===source&&choice.classList.contains('is-art-ready'))return;
  choice.classList.remove('is-art-ready');
  image.decode().then(()=>{
    if(!choice.isConnected)return;
    choice.dataset.revealSource=image.currentSrc||image.src;
    choice.classList.add('is-art-ready');
  }).catch(()=>{});
}
function enablePlanExperience(){
  const visual=paper.querySelector('#plan-experience');
  const zoom=visual.querySelector('#plan-zoom');
  const magnify=visual.querySelector('#plan-magnify');
  const closeZoom=visual.querySelector('#plan-zoom-close');
  magnify.addEventListener('click',()=>{zoom.hidden=false;closeZoom.focus();});
  closeZoom.addEventListener('click',()=>{zoom.hidden=true;magnify.focus();});
  zoom.addEventListener('click',event=>{if(event.target===zoom){zoom.hidden=true;magnify.focus();}});
  visual.addEventListener('keydown',event=>{if(event.key==='Escape'&&!zoom.hidden){event.stopPropagation();zoom.hidden=true;magnify.focus();}});
  visual.querySelectorAll('[data-plan-target]').forEach(seal=>seal.addEventListener('click',()=>{
    if(planDialogue[planStep]?.target!==seal.dataset.planTarget)return;
    selectedEvidence.add(seal.dataset.planTarget);
    planStep++;
    updatePlanExperience();
  }));
  visual.querySelector('#plan-dialogue-next').addEventListener('click',()=>{
    if(planStep>=3&&planStep<planDialogue.length-1){planStep++;updatePlanExperience();}
  });
  visual.querySelector('#plan-dialogue-back').addEventListener('click',()=>{
    if(planStep>0){planStep--;updatePlanExperience();}
  });
}
function updatePlanExperience(){
  const visual=paper.querySelector('#plan-experience');
  const turn=planDialogue[planStep];
  const previous=visual.querySelector('#plan-previous');
  const hint=visual.querySelector('#plan-hint');
  visual.querySelector('#plan-voice').textContent=turn.voice;
  visual.querySelector('#plan-progress').textContent=`${String(planStep+1).padStart(2,'0')} ／ ${String(planDialogue.length).padStart(2,'0')}`;
  visual.querySelector('#plan-line').textContent=turn.line;
  previous.hidden=planStep===0;
  if(planStep>0)previous.textContent=`${planDialogue[planStep-1].voice}　${planDialogue[planStep-1].line}`;
  hint.hidden=!turn.target;
  hint.textContent=turn.target?'點圖上的朱印，沿原圖找下一站。':'';
  visual.querySelectorAll('[data-plan-target]').forEach((seal,index)=>{
    seal.hidden=index>planStep;
    seal.disabled=turn.target!==seal.dataset.planTarget;
    seal.classList.toggle('is-found',index<planStep);
  });
  visual.querySelector('#plan-dialogue-back').hidden=planStep===0;
  const next=visual.querySelector('#plan-dialogue-next');
  next.hidden=planStep<3||planStep===planDialogue.length-1;
  next.textContent=turn.next||'';
  const collect=visual.querySelector('#collect-button');
  collect.disabled=planStep!==planDialogue.length-1||selectedEvidence.size<3;
  collect.hidden=collect.disabled;
  visual.querySelector('#document-feedback').textContent='';
}
function updateEvidence(){
  if(activeDocument.id==='deities'){updateFaithExperience();return;}
  if(activeDocument.id==='plan'){updatePlanExperience();return;}
  const count=selectedEvidence.size;
  paper.querySelectorAll('[data-evidence]').forEach(button=>{
    const active=selectedEvidence.has(button.dataset.evidence);
    button.classList.toggle('is-found',active);button.setAttribute('aria-pressed',String(active));
  });
  const feedback=paper.querySelector('#document-feedback');
  if(!count)feedback.innerHTML=`<span class="feedback-empty">點選圖上的線索，再對照來源資料可以確認甚麼。</span>`;
  else feedback.innerHTML=`<span class="feedback-label">來源資料指出</span><div>${activeDocument.evidence.filter(item=>selectedEvidence.has(item.id)).map(item=>`<p>${escaped(item.fact)}</p>`).join('')}</div>`;
  const collect=paper.querySelector('#collect-button');
  collect.disabled=count<activeDocument.required;
  collect.textContent=count<activeDocument.required?`再找 ${activeDocument.required-count} 處依據`:'收進探索夾';
}
function collectDocument(){
  if(activeDocument.id==='deities'&&(!faithPartComplete('wenchang')||!faithPartComplete('guandi')||!faithChoosing&&(faithBeat!==faithPartBounds(faithPartForBeat(faithBeat)).end||faithReveal!==faithStory[faithBeat].lines.length-1)))return;
  if(activeDocument.id==='plan'&&planStep<planDialogue.length-1)return;
  if(selectedEvidence.size<activeDocument.required)return;
  collected[activeDocument.id]=[...selectedEvidence];
  sessionStorage.setItem(storageKey,JSON.stringify(collected));
  if(activeDocument.id==='deities'){
    sessionStorage.setItem(faithStoryStorageKey,'complete');
    sessionStorage.setItem(guandiStoryStorageKey,'complete');
  }
  closeDocument();
}
function closeDocument(completedPart=null){
  if(activeDocument?.id==='deities'&&faithReturn==='room'){
    crossfadeArchiveAndStory(()=>closeDocumentNow(completedPart));
    return;
  }
  closeDocumentNow(completedPart);
}
function closeDocumentNow(completedPart=null){
  const wasFaith=activeDocument?.id==='deities';
  documentView.hidden=true;summaryView.hidden=true;
  if(wasFaith&&faithReturn==='room'){
    activeDocument=null;faithReturn='table';
    if(completedPart) journey.storyFinished(completedPart==='wenchang'?'wen':'wu');
    else journey.showPainting();
    return;
  }
  if(archiveArtifactOpen){
    archiveArtifactOpen=false;activeDocument=null;journey.showRoom();return;
  }
  renderTable();table.hidden=false;
  folioLayer.querySelector(`[data-document="${activeDocument?.id}"]`)?.focus({preventScroll:true});
  activeDocument=null;
}
function renderSummary(){
  const chosen=documents.filter(document=>collected[document.id]);
  document.getElementById('summary-sources').innerHTML=chosen.map(document=>`<section class="summary-source"><span>${escaped(document.eyebrow)}</span><h3>${escaped(document.title)}</h3><p>${escaped(document.field)}</p></section>`).join('');
  table.hidden=true;documentView.hidden=true;summaryView.hidden=false;
  document.getElementById('summary-back').focus({preventScroll:true});
}
continueButton.hidden=true; // Retired eight-document table/H01 progression.
document.getElementById('archive-room-back').addEventListener('click',()=>{table.hidden=true;journey.showRoom();});
document.getElementById('summary-back').addEventListener('click',()=>{summaryView.hidden=true;table.hidden=false;continueButton.focus({preventScroll:true});});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!documentView.hidden){closeDocument();return;}
  if(event.key==='Escape'&&!summaryView.hidden){summaryView.hidden=true;table.hidden=false;}
});
renderTable();
function collectFaithAfterRepair(state) {
  if (!rubbingUnlocked(state)) return;
  collected.deities = byId.get('deities').evidence.map(item=>item.id);
  sessionStorage.setItem(storageKey,JSON.stringify(collected));
}
let journey;
let coreState;
const coreContext = () => ({
  questionStorage: localStorage,
  portraitsComplete: rubbingUnlocked(journey?.getState() || loadRestorationState(sessionStorage)),
});
const guidedStep = () => {
  coreState = loadCoreOnboardingState(sessionStorage, coreContext());
  return getGuidedStep({...coreContext(), ...coreState});
};
const announceGuidance = () => {
  const step = guidedStep();
  document.getElementById('restoration-root').dataset.guidedStep=step;
  if (journey && document.getElementById('restoration-root').dataset.scene === 'free-exploration') journey.refreshGuidance();
  window.dispatchEvent(new CustomEvent('archive-guidance-change', {detail: {step}}));
};
const mapInquiry = initMapInquiry({
  storage: localStorage,
  canOpen: () => ['map','free'].includes(guidedStep()),
  onBack: ({completed} = {}) => {
    if (completed === true) {
      const next = markMapCompleted(coreState || loadCoreOnboardingState(sessionStorage, coreContext()), coreContext());
      saveCoreOnboardingState(sessionStorage, next);
    }
    if(completed===true&&guidedStep()==='photo')sessionStorage.removeItem('manmo-guidance-read-photo');
    journey.showRoom();announceGuidance();
    document.querySelector('#restoration-root .archive-stage')?.focus({preventScroll:true});
  },
});
const photoInquiry = initPhotoInquiry({
  onOpenArchitecture:()=>architectureStudy.open({fromPhoto:true}),
  storage: sessionStorage,
  onQuestion: question => {coreState={...loadCoreOnboardingState(sessionStorage,coreContext()),selectedFieldworkQuestion:question};saveCoreOnboardingState(sessionStorage,coreState);},
  canOpen: () => ['photo','architecture','free'].includes(guidedStep()),
  onBack: ({completed} = {}) => {
    if (completed === true) {
      let next = markPhotoCompleted(coreState || loadCoreOnboardingState(sessionStorage, coreContext()), coreContext());
      if(loadPhotoState(sessionStorage).architectureStudyCompleted)next=markArchitectureCompleted(next,coreContext());
      saveCoreOnboardingState(sessionStorage, next);
    }
    journey.showRoom();announceGuidance();
  },
});
journey = initRestorationJourney({
  root: document.getElementById('restoration-root'), storage: sessionStorage,
  onChoosePart: beginFaithFromRoom,
  getGuidedStep: guidedStep,
  canOpenArtifact: artifact => ['map','photo'].includes(artifact) && (guidedStep() === 'free' || artifact === guidedStep()),
  onOpenArtifact: artifact => {
    if (artifact === 'map') {
      journey.hide();table.hidden=true;documentView.hidden=true;summaryView.hidden=true;
      mapInquiry.show();return;
    }
    if (artifact === 'photo') {
      journey.hide();table.hidden=true;documentView.hidden=true;summaryView.hidden=true;
      photoInquiry.show();return;
    }
    // Other legacy object routes are retired; optional sources live at the handoff.
  },
  onPortraitRestored: state => { collectFaithAfterRepair(state);announceGuidance(); },
});
const thresholdJourney=initThresholdJourney({
  getState:()=>loadCoreOnboardingState(sessionStorage,coreContext()),
  onEvent:(event,data)=>{coreState=advancePrevisit(loadCoreOnboardingState(sessionStorage,coreContext()),event,data);saveCoreOnboardingState(sessionStorage,coreState);announceGuidance();},
  onBack:()=>{journey.showRoom();announceGuidance();previsitContinue.focus({preventScroll:true});},
});
function openPrevisit(){const step=guidedStep();if(!['plaque','etiquette','handoff','free'].includes(step))return;journey.hide();table.hidden=true;documentView.hidden=true;summaryView.hidden=true;thresholdJourney.show(step);}
const previsitContinue=document.createElement('button');previsitContinue.className='archive-previsit-continue';previsitContinue.type='button';previsitContinue.hidden=true;
const plaquePresence=document.createElement('div');plaquePresence.className='archive-plaque-presence';plaquePresence.innerHTML='<p class="archive-plaque-cue">回到修復空間，<br>再細看架上的牌匾。</p>';document.querySelector('#restoration-root [data-scene="free-exploration"]').append(plaquePresence,previsitContinue);
previsitContinue.addEventListener('click',openPrevisit);
function syncPrevisit(){const step=guidedStep();previsitContinue.hidden=!['plaque','etiquette','handoff','free'].includes(step);previsitContinue.classList.toggle('is-plaque-target',step==='plaque');previsitContinue.setAttribute('aria-label',step==='plaque'?'細看修復空間的牌匾研究物件':'離開修復空間，繼續到訪準備');previsitContinue.textContent={plaque:'',etiquette:'離開修復空間 →',handoff:'回到廟外演練 →',free:'帶到現場的問題 →'}[step]||'';}
window.addEventListener('archive-guidance-change',syncPrevisit);
const architectureStudy=initArchitectureStudy({
  roomRoot: document.getElementById('restoration-root'),
  onReturn:({fromPhoto=false,completed=false}={})=>{if(fromPhoto){photoInquiry.resumeFromArchitecture(completed);return;}journey.showRoom();announceGuidance();},
  canOpen: ({fromPhoto=false}={}) => (fromPhoto&&guidedStep()==='photo')||['architecture','free'].includes(guidedStep()),
  onComplete: () => {
    const next = markArchitectureCompleted(coreState || loadCoreOnboardingState(sessionStorage, coreContext()), coreContext());
    saveCoreOnboardingState(sessionStorage, next);
    announceGuidance();
    journey.showRoom();announceGuidance();previsitContinue.focus({preventScroll:true});
  },
});
initRoomPresentation(document.getElementById('restoration-root'));
journey.start();
collectFaithAfterRepair(journey.getState());
announceGuidance();
if(guidedStep()==='architecture' && journey.getState().scene==='free-exploration'){journey.showRoom();announceGuidance();}
if(['etiquette','handoff'].includes(guidedStep()) && journey.getState().scene==='free-exploration')openPrevisit();
if(new URLSearchParams(location.search).has('visit') && guidedStep()==='free')openPrevisit();
window.addEventListener('resize',()=>{
  paper.querySelector('#faith-art-hotspot')?.removeAttribute('data-placed');
  const choice=paper.querySelector('#faith-choice');
  if(choice&&!choice.hidden)requestAnimationFrame(()=>prepareFaithChoiceArt(choice));
  queueArtworkLayout();
});
queueArtworkLayout();
