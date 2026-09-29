import { loadRestorationState, saveRestorationState, markStoryRead, rubbingUnlocked } from './restoration-state.js';

const assetBase = 'assets/living-archive/opening/';
const paintingArt = { faded: 'painting-unrestored-v2.webp', wen: 'painting-wen-restored-v2.webp', wu: 'painting-wu-restored-v2.webp', complete: 'painting-complete.webp' };
const entryBeatKey = 'manmo-living-archive-entry-beat-v4';
const roomBeatKey = 'manmo-living-archive-room-beat-v4';

export function initRestorationJourney({ root, storage, onChoosePart = () => {}, onOpenArtifact = () => {}, onPortraitRestored = () => {}, canOpenArtifact = () => true, getGuidedStep = () => 'map' }) {
  if (!root) throw new Error('Restoration journey root is required');
  let state = loadRestorationState(storage);
  const savedEntryBeat = () => ['role', 'threshold', 'neglected'].includes(storage.getItem(entryBeatKey)) ? storage.getItem(entryBeatKey) : 'role';
  const savedRoomBeat = () => ['archive', 'task', 'guide'].includes(storage.getItem(roomBeatKey)) ? storage.getItem(roomBeatKey) : 'archive';
  let entryBeat = savedEntryBeat();
  let roomBeat = savedRoomBeat();
  function setEntryBeat(next) { entryBeat = next; storage.setItem(entryBeatKey, next); }
  function setRoomBeat(next) { roomBeat = next; storage.setItem(roomBeatKey, next); }
  const stage = root.querySelector('.archive-stage');
  const painting = root.querySelector('#restoration-painting-art');
  const previousPainting = root.querySelector('#restoration-painting-previous');
  const transitionArt = root.querySelector('#archive-transition-art');
  const completion = root.querySelector('#restoration-completion');
  const status = root.querySelector('#restoration-status');
  const freeRoom = root.querySelector('.archive-scene[data-scene="free-exploration"]');
  const guidedCaption = document.createElement('div');
  guidedCaption.className = 'archive-guided-caption';
  guidedCaption.hidden = true;
  guidedCaption.innerHTML = `<img class="archive-guided-line-1" src="${assetBase}guided-map1.png" alt=""><img class="archive-guided-line-2" src="${assetBase}guided-map2.png" alt="">`;
  freeRoom.append(guidedCaption);
  const guidanceAdvance=document.createElement('button');
  guidanceAdvance.className='archive-guidance-advance';
  guidanceAdvance.type='button';guidanceAdvance.textContent='→';
  guidanceAdvance.setAttribute('aria-label','繼續聆聽廟祝');
  guidedCaption.append(guidanceAdvance);
  let guidanceStep=null,guidanceBeat=0;
  const guidanceRead=step=>storage.getItem('manmo-guidance-read-'+step)==='true';
  function renderGuidance(step){
    const gated=['map','photo'].includes(step),ready=!gated||guidanceRead(step);
    root.dataset.guidanceReady=String(ready);
    guidedCaption.classList.toggle('is-sequenced',gated);
    guidedCaption.classList.toggle('is-finished',gated&&ready);
    guidanceAdvance.hidden=!gated||ready;
    for(let i=0;i<2;i++)guidedCaption.querySelector('.archive-guided-line-'+(i+1)).hidden=gated&&(ready||i!==guidanceBeat);
    if(gated&&!ready)root.querySelectorAll('[data-artifact]').forEach(b=>b.disabled=true);
  }
  guidanceAdvance.addEventListener('click',()=>{
    const step=getGuidedStep();
    if(!['map','photo'].includes(step)||guidanceRead(step))return;
    if(guidanceBeat===0){guidanceBeat=1;renderGuidance(step);return;}
    storage.setItem('manmo-guidance-read-'+step,'true');
    render('free-exploration',null,false);
    root.querySelector('[data-artifact="'+step+'"]')?.focus({preventScroll:true});
  });
  const guidanceCopy = {
    map: ['知道他們的故事，只是開始。', '再看看，這座廟為甚麼會在這裏。'],
    photo: ['一張地圖，看不到所有事情。', '再看看別的吧。'],
    architecture: ['有些痕跡，留在文字裏。', '有些，就留在建築上。'],
    free: ['現在，你知道可以怎樣看了。', '接下來，從你想看的東西開始吧。'],
  };
  root.dataset.input = 'pointer';
  root.addEventListener('pointerdown', () => { root.dataset.input = 'pointer'; });
  document.addEventListener('keydown', event => {
    if (!root.hidden && !event.metaKey && !event.ctrlKey && !event.altKey) root.dataset.input = 'keyboard';
  });
  let heroTimer = 0;
  let sceneTimer = 0;
  let paintingTimer = 0;
  let arrivalTimer = 0;
  let sceneFrame = 0;
  let paintingFrame = 0;
  let arrivalFrame = 0;
  let arrivingArt = null;
  const warmedPaintingArt = new Map();
  function warmPaintingArt() {
    for (const file of [paintingArt.wen, paintingArt.wu, paintingArt.complete]) {
      if (warmedPaintingArt.has(file)) continue;
      const image = new Image();
      image.src = assetBase + file;
      warmedPaintingArt.set(file, image);
      image.decode?.().catch(() => {});
    }
  }
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const focus = selector => root.querySelector(selector)?.focus({ preventScroll: true });
  function persist(next) { state = next; saveRestorationState(storage, state); }
  function artState() { return state.repaired.wen && state.repaired.wu ? 'complete' : state.repaired.wen ? 'wen' : state.repaired.wu ? 'wu' : 'faded'; }
  function stopMotion() {
    window.clearTimeout(sceneTimer); window.clearTimeout(paintingTimer); window.clearTimeout(arrivalTimer);
    cancelAnimationFrame(sceneFrame); cancelAnimationFrame(paintingFrame); cancelAnimationFrame(arrivalFrame);
    sceneTimer = paintingTimer = arrivalTimer = sceneFrame = paintingFrame = arrivalFrame = 0;
    transitionArt.hidden = true; transitionArt.classList.remove('is-dissolving');
    previousPainting.hidden = true; previousPainting.classList.remove('is-dissolving');
    arrivingArt?.classList.remove('is-arriving', 'is-settled');
    arrivingArt = null;
  }
  function render(next, focusSelector, animate = true) {
    const currentScene = stage.dataset.scene;
    const currentArt = painting.getAttribute('src');
    const targetArt = assetBase + paintingArt[artState()];
    const canMove = animate && !reducedMotion();
    stopMotion();
    if (canMove && !root.hidden && currentScene !== next) {
      const outgoing = currentScene === 'hero' && stage.classList.contains('is-entering')
        ? root.querySelector('.archive-hero-clean')
        : root.querySelector(`.archive-scene[data-scene="${currentScene}"] .archive-art`);
      if (outgoing) {
        transitionArt.src = outgoing.src;
        transitionArt.dataset.motion = `${currentScene}-to-${next}`;
        transitionArt.hidden = false;
      }
    }
    root.hidden = false;
    if (next === 'room' || next === 'painting') warmPaintingArt();
    stage.dataset.scene = next;
    root.dataset.scene = next;
    root.dataset.entryBeat = entryBeat;
    root.dataset.roomBeat = roomBeat;
    const entryContinue = root.querySelector('#restoration-entry-continue');
    const entryFollow = root.querySelector('#restoration-follow');
    entryContinue.hidden = next !== 'archive-entry' || entryBeat === 'neglected';
    entryFollow.disabled = next !== 'archive-entry' || entryBeat !== 'neglected';
    root.querySelector('#restoration-entry-role-continue-art').hidden = entryContinue.hidden;
    root.querySelector('#restoration-entry-continue-art').hidden = entryFollow.disabled;
    for (const beat of ['role', 'threshold', 'neglected']) {
      root.querySelector(`#restoration-entry-${beat}-art`).hidden = next !== 'archive-entry' || entryBeat !== beat;
      root.querySelector(`[data-entry-transcript="${beat}"]`).hidden = next !== 'archive-entry' || entryBeat !== beat;
    }
    const roomContinue = root.querySelector('#restoration-room-continue');
    roomContinue.hidden = next !== 'room' || roomBeat === 'guide';
    root.querySelector('#restoration-room-painting').disabled = next !== 'room' || roomBeat !== 'guide';
    for (const beat of ['archive', 'task', 'guide']) {
      root.querySelector(`#restoration-room-${beat}-art`).hidden = next !== 'room' || roomBeat !== beat;
      root.querySelector(`[data-room-transcript="${beat}"]`).hidden = next !== 'room' || roomBeat !== beat;
    }
    root.querySelector('#restoration-room-cue-art').hidden = next !== 'room' || roomBeat !== 'guide';
    root.querySelector('#restoration-room-continue-art').hidden = roomContinue.hidden;
    root.dataset.restoration = artState();
    root.querySelectorAll('.archive-scene').forEach(section => { section.hidden = section.dataset.scene !== next; });
    if (canMove && currentScene !== next) {
      arrivingArt = root.querySelector(`.archive-scene[data-scene="${next}"] .archive-art`);
      if (arrivingArt) {
        arrivingArt.dataset.arrival = `${currentScene}-to-${next}`;
        arrivingArt.classList.add('is-arriving');
      }
    }
    if (canMove && next === 'painting' && currentArt !== targetArt) {
      previousPainting.src = currentArt;
      previousPainting.hidden = false;
    }
    painting.src = targetArt;
    const completeMessage = next === 'painting' && rubbingUnlocked(state) && !state.completionAcknowledged;
    completion.hidden = !completeMessage;
    root.querySelector('#restoration-completion-art').hidden = !completeMessage;
    root.querySelector('#restoration-painting-guide').hidden = artState() !== 'faded';
    const guidedStep = getGuidedStep();
    root.dataset.guidedStep = guidedStep;
    if(guidanceStep!==guidedStep){guidanceStep=guidedStep;guidanceBeat=guidedStep==='photo'?1:0;}
    root.querySelectorAll('[data-artifact]').forEach(button => {
      button.disabled = next !== 'free-exploration' || !rubbingUnlocked(state) || (guidedStep !== 'free' && button.dataset.artifact !== guidedStep) || !canOpenArtifact(button.dataset.artifact);
    });
    root.querySelector('#restoration-free-painting').disabled = true; // Completed portraits remain visible without a duplicate story entrance.
    guidedCaption.hidden = next !== 'free-exploration' || ['portraits','plaque','etiquette','handoff'].includes(guidedStep);
    if (!guidedCaption.hidden) {
      for (let index = 0; index < 2; index++) {
        const image = guidedCaption.querySelector(`.archive-guided-line-${index + 1}`);
        image.src = guidedStep === 'photo' && index === 1 ? 'assets/living-archive/photo-inquiry/text/look-elsewhere.png' : `${assetBase}guided-${guidedStep}${index + 1}.png`;
        image.alt = guidanceCopy[guidedStep]?.[index] || '';
      }
    }
    renderGuidance(guidedStep);
    const showAnnotations = artState() !== 'faded';
    for (const part of ['wen', 'wu']) {
      root.querySelector(`[data-annotation-${part}-recognised]`).hidden = !showAnnotations || !state.repaired[part];
      root.querySelector(`[data-annotation-${part}-pending]`).hidden = !showAnnotations || state.repaired[part];
    }
    status.textContent = next === 'archive-entry'
      ? ({ role: '廟祝：你是來修復廟藏文物的歷史修復師吧。有些舊物，我想請你幫忙看看。', threshold: '廟祝：前殿每天有人上香。這道門後的東西，卻少有人再問起。', neglected: '廟祝：這裡很久沒有人動過了。跟我來，腳下慢一點。' })[entryBeat]
      : next === 'room'
      ? ({ archive: '廟祝：畫、舊照片、留下字跡的木匾……這裡有不少等待修復的文物。', task: '廟祝：有些褪了色，有些連來歷也不清楚了。你得先找回線索，才能讀懂它們。', guide: '廟祝：先從哪一件開始？就這幅吧。你剛才在前殿，也見過他們。' })[roomBeat]
      : next === 'painting'
      ? `${state.repaired.wen ? '文帝已辨認。' : '文帝仍待辨認。'}${state.repaired.wu ? '武帝已辨認。' : '武帝仍待辨認。'}${completeMessage ? '一段故事，重新被看見。返回空間繼續探索。' : ''}`
      : next === 'free-exploration' ? `畫作已重新可讀。廟祝：${guidanceCopy[guidedStep]?.join(' ') || ''}` : '';
    if (!transitionArt.hidden) {
      // Commit the visible starting frame before changing opacity and camera position.
      void transitionArt.offsetWidth;
      sceneFrame = requestAnimationFrame(() => { if (!transitionArt.hidden) transitionArt.classList.add('is-dissolving'); });
      sceneTimer = window.setTimeout(() => { transitionArt.hidden = true; transitionArt.classList.remove('is-dissolving'); }, 600);
    }
    if (!previousPainting.hidden) {
      void previousPainting.offsetWidth;
      paintingFrame = requestAnimationFrame(() => { if (!previousPainting.hidden) previousPainting.classList.add('is-dissolving'); });
      paintingTimer = window.setTimeout(() => { previousPainting.hidden = true; previousPainting.classList.remove('is-dissolving'); }, 680);
    }
    if (arrivingArt) {
      void arrivingArt.offsetWidth;
      arrivalFrame = requestAnimationFrame(() => arrivingArt?.classList.add('is-settled'));
      arrivalTimer = window.setTimeout(() => { arrivingArt?.classList.remove('is-arriving', 'is-settled'); arrivingArt = null; }, 600);
    }
    if (focusSelector) focus(focusSelector);
  }
  function visit(scene, focusSelector) { persist({ ...state, introSeen: scene !== 'hero' || state.introSeen, scene }); render(scene, focusSelector); }
  function start() {
    state = loadRestorationState(storage);
    entryBeat = savedEntryBeat();
    roomBeat = savedRoomBeat();
    const scene = state.scene === 'free-exploration' && !state.completionAcknowledged ? 'painting' : state.scene;
    const focusTarget = {
      hero: '#restoration-enter', 'archive-entry': entryBeat === 'neglected' ? '#restoration-follow' : '#restoration-entry-continue', room: roomBeat === 'guide' ? '#restoration-room-painting' : '#restoration-room-continue',
      painting: rubbingUnlocked(state) && !state.completionAcknowledged ? '#restoration-completion' : '[data-portrait-wen]',
      'free-exploration': '#restoration-free-painting',
    }[scene];
    render(scene, focusTarget, false);
  }
  function showRoom() {
    state = loadRestorationState(storage);
    const next = rubbingUnlocked(state) && state.completionAcknowledged ? 'free-exploration' : 'room';
    if (next === 'room') setRoomBeat(savedRoomBeat());
    visit(next, next === 'free-exploration' ? '#restoration-free-painting' : roomBeat === 'guide' ? '#restoration-room-painting' : '#restoration-room-continue');
  }
  function showPainting() { state = loadRestorationState(storage); visit('painting', '[data-portrait-wen]'); }
  function hide() {
    window.clearTimeout(heroTimer); heroTimer = 0;
    stage.classList.remove('is-entering');
    stopMotion();
    root.hidden = true;
  }
  function storyFinished(part) {
    if (!['wen', 'wu'].includes(part)) return;
    const wasRestored = state.repaired[part];
    persist(markStoryRead(state, part));
    if (!wasRestored) onPortraitRestored(state);
    render('painting', rubbingUnlocked(state) && !state.completionAcknowledged ? '#restoration-completion' : '[data-portrait-wen]');
  }
  root.querySelector('#restoration-enter').addEventListener('click', () => {
    if (heroTimer || stage.dataset.scene !== 'hero') return;
    stage.classList.add('is-entering');
    heroTimer = window.setTimeout(() => {
      heroTimer = 0;
      if (root.hidden || stage.dataset.scene !== 'hero') return;
      setEntryBeat('role');
      visit('archive-entry', '#restoration-entry-continue');
      stage.classList.remove('is-entering');
    }, reducedMotion() ? 0 : 320);
  });
  root.querySelector('#restoration-entry-continue').addEventListener('click', () => {
    if (stage.dataset.scene !== 'archive-entry' || entryBeat === 'neglected') return;
    setEntryBeat(entryBeat === 'role' ? 'threshold' : 'neglected');
    render('archive-entry', entryBeat === 'neglected' ? '#restoration-follow' : '#restoration-entry-continue');
  });
  root.querySelector('#restoration-follow').addEventListener('click', () => { setRoomBeat('archive'); visit('room', '#restoration-room-continue'); });
  root.querySelector('#restoration-room-continue').addEventListener('click', () => {
    if (stage.dataset.scene !== 'room' || roomBeat === 'guide') return;
    setRoomBeat(roomBeat === 'archive' ? 'task' : 'guide');
    render('room', roomBeat === 'guide' ? '#restoration-room-painting' : '#restoration-room-continue');
  });
  root.querySelector('#restoration-room-painting').addEventListener('click', showPainting);
  root.querySelectorAll('[data-portrait-wen], [data-portrait-wu]').forEach(button => button.addEventListener('click', () => onChoosePart(button.hasAttribute('data-portrait-wen') ? 'wen' : 'wu')));
  root.querySelector('#restoration-painting-back').addEventListener('click', showRoom);
  root.querySelector('#restoration-completion').addEventListener('click', () => { persist({ ...state, completionAcknowledged: true, scene: 'free-exploration' }); render('free-exploration', '#restoration-free-painting'); });
  root.querySelector('#restoration-free-painting').addEventListener('click', () => { if (getGuidedStep() === 'free') showPainting(); });
  root.querySelectorAll('[data-artifact]').forEach(button => button.addEventListener('click', () => {
    const step = getGuidedStep();
    if (!button.disabled && rubbingUnlocked(state) && (step === 'free' || button.dataset.artifact === step) && canOpenArtifact(button.dataset.artifact)) onOpenArtifact(button.dataset.artifact);
  }));
  return { start, showRoom, showPainting, hide, storyFinished, refreshGuidance: () => { if (!root.hidden) render(root.dataset.scene, null, false); }, getState: () => structuredClone({ ...state, entryBeat, roomBeat }) };
}
