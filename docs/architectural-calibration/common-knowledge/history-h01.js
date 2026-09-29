import { objectPositionFractions, projectArtworkPoint } from './artwork-layout.js?v=33';

const storageKey = 'manmo-history-h01-v1';
const observationIds = ['ritual', 'discussion', 'mediation'];
const observations = {
  ritual: '有居民在日常生活空間旁上香祈願。',
  discussion: '幾名街坊或商戶正在一起查看文件，商量事情。',
  mediation: '兩方出現分歧，一人正在從中協調。',
};
// All four plates share a steep oblique camera. The unbuilt central patch is the
// camera target for H02; H01 deliberately draws no foundations there.
const anchors = {
  wide: { ritual: [.137, .594], discussion: [.469, .668], mediation: [.816, .656], unknown: [.600, .458] },
  ipad: { ritual: [.111, .647], discussion: [.468, .708], mediation: [.819, .692], unknown: [.610, .541] },
  portrait: { ritual: [.120, .607], discussion: [.385, .678], mediation: [.823, .680], unknown: [.585, .490] },
  mobile: { ritual: [.145, .652], discussion: [.434, .717], mediation: [.808, .720], unknown: [.593, .548] },
};

function loadState() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
    const observed = Array.isArray(saved.observed)
      ? [...new Set(saved.observed.filter(id => observationIds.includes(id)))] : [];
    return { observed, phase: observed.length === 3 ? 'inference' : 'observe' };
  } catch { return { observed: [], phase: 'observe' }; }
}

export function initHistoryH01({ onBack }) {
  const view = document.getElementById('history-view');
  const stage = document.getElementById('history-stage');
  const image = document.getElementById('history-image');
  const canvas = document.getElementById('history-traces');
  const progress = view.querySelector('.history-progress');
  const count = document.getElementById('history-count');
  const dots = [...view.querySelectorAll('.history-dots i')];
  const hotspots = [...view.querySelectorAll('[data-history-observation]')];
  const observation = document.getElementById('history-observation');
  const inference = document.getElementById('history-inference');
  const instruction = document.getElementById('history-instruction');
  const source = document.getElementById('history-source');
  const sourceNote = document.getElementById('history-source-note');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const state = loadState();
  let busy = false;
  let focusTimer = 0;
  let inferenceTimer = 0;

  const variant = () => matchMedia('(orientation: portrait) and (max-width: 600px)').matches ? 'mobile'
    : matchMedia('(orientation: portrait)').matches ? 'portrait'
    : matchMedia('(max-aspect-ratio: 7/5)').matches ? 'ipad' : 'wide';

  function point(id) {
    if (!image.complete || !image.naturalWidth) return null;
    const rect = stage.getBoundingClientRect();
    const [x, y] = objectPositionFractions(getComputedStyle(image).objectPosition);
    const { objectFit } = getComputedStyle(image);
    return projectArtworkPoint(rect.width, rect.height, image.naturalWidth, image.naturalHeight,
      ...anchors[variant()][id], x, y, objectFit);
  }

  function save() {
    sessionStorage.setItem(storageKey, JSON.stringify(state));
  }

  function update() {
    stage.dataset.phase = state.phase;
    view.dataset.phase = state.phase;
    count.textContent = `${state.observed.length} / 3`;
    progress.setAttribute('aria-label', `已發現 ${state.observed.length} 處，共 3 處`);
    dots.forEach((dot, index) => dot.classList.toggle('is-filled', index < state.observed.length));
    hotspots.forEach(button => {
      button.classList.toggle('is-observed', state.observed.includes(button.dataset.historyObservation));
      button.tabIndex = state.phase === 'inference' ? -1 : 0;
      button.setAttribute('aria-hidden', String(state.phase === 'inference'));
    });
    const complete = state.phase === 'inference';
    inference.hidden = !complete;
    source.hidden = !complete;
    instruction.textContent = complete ? '看看這些線索正在指向哪裏。' : '觀察這個社區正在發生甚麼。';
    drawTraces();
  }

  function layout() {
    if (view.hidden) return;
    hotspots.forEach(button => {
      const position = point(button.dataset.historyObservation);
      if (!position) return;
      button.style.left = `${position.x}px`;
      button.style.top = `${position.y}px`;
      button.dataset.placed = 'true';
    });
    drawTraces();
  }

  function drawTraces() {
    if (view.hidden) return;
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const density = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * density);
    canvas.height = Math.round(rect.height * density);
    const ctx = canvas.getContext('2d');
    ctx.scale(density, density);
    if (state.phase !== 'inference') return;

    const end = point('unknown');
    if (!end) return;
    const starts = observationIds.map(id => point(id));
    starts.forEach((start, index) => {
      if (!start) return;
      // Short, imperfect graphite fragments; never a map route or architectural plan.
      for (let pass = 0; pass < 2; pass++) {
        ctx.beginPath();
        ctx.strokeStyle = pass ? 'rgba(48,49,45,.12)' : 'rgba(48,49,45,.38)';
        ctx.lineWidth = pass ? 3 : 1.45;
        const bend = index === 0 ? -67 : index === 1 ? 43 : -42;
        const midX = (start.x + end.x) / 2 + (index - 1) * 24;
        const midY = (start.y + end.y) / 2 + bend;
        let penDown = false;
        for (let step = 0; step <= 90; step++) {
          const t = step / 90;
          const breakLine = (step >= 12 && step <= 22) || (step >= 41 && step <= 51) || (step >= 69 && step <= 78);
          if (breakLine) { penDown = false; continue; }
          const drift = Math.sin(step * 1.33 + index * 3.1) * 1.35;
          const x = (1 - t) ** 2 * start.x + 2 * (1 - t) * t * midX + t ** 2 * end.x + drift + pass * 1.5;
          const y = (1 - t) ** 2 * start.y + 2 * (1 - t) * t * midY + t ** 2 * end.y + drift * .5;
          if (!penDown) { ctx.moveTo(x, y); penDown = true; } else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    });
    // An uncertain rubbed area: disconnected arcs and paper grain, no three footprints.
    ctx.save();
    ctx.translate(end.x, end.y);
    ctx.strokeStyle = 'rgba(57,53,46,.46)';
    ctx.lineWidth = 1.65;
    [[-59,-16, -25,-24, 9,-9],[-21,13, 21,22, 52,8],[-45,33, -2,38, 29,29]].forEach(([x1,y1,cx,cy,x2,y2]) => {
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.quadraticCurveTo(cx,cy,x2,y2);ctx.stroke();
    });
    const smudge = ctx.createRadialGradient(0,0,5,0,0,74);
    smudge.addColorStop(0,'rgba(59,52,43,.11)');
    smudge.addColorStop(1,'rgba(59,52,43,0)');
    ctx.fillStyle = smudge;ctx.fillRect(-80,-60,160,120);
    ctx.restore();
  }

  function finishObservation(id) {
    stage.classList.remove('is-focusing');
    state.observed.push(id);
    save();
    update();
    busy = false;
    if (state.observed.length === 3) {
      inferenceTimer = window.setTimeout(() => {
        state.phase = 'inference';
        observation.hidden = true;
        save();
        update();
        source.focus({ preventScroll: true });
      }, reducedMotion.matches ? 0 : 850);
    }
  }

  hotspots.forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.historyObservation;
    if (busy || state.phase === 'inference' || state.observed.includes(id)) return;
    const position = point(id);
    if (!position) return;
    busy = true;
    const rect = stage.getBoundingClientRect();
    stage.style.setProperty('--focus-x', `${position.x / rect.width * 100}%`);
    stage.style.setProperty('--focus-y', `${position.y / rect.height * 100}%`);
    if (!reducedMotion.matches) stage.classList.add('is-focusing');
    observation.textContent = observations[id];
    observation.hidden = false;
    focusTimer = window.setTimeout(() => finishObservation(id), reducedMotion.matches ? 0 : 900);
  }));

  source.addEventListener('click', () => {
    sourceNote.hidden = !sourceNote.hidden;
    source.setAttribute('aria-expanded', String(!sourceNote.hidden));
  });
  source.setAttribute('aria-expanded', 'false');
  document.getElementById('history-back').addEventListener('click', () => {
    clearTimeout(focusTimer);clearTimeout(inferenceTimer);
    busy = false;
    stage.classList.remove('is-focusing');
    view.hidden = true;
    onBack();
  });
  image.addEventListener('load', layout);
  window.addEventListener('resize', () => requestAnimationFrame(layout));
  new ResizeObserver(() => requestAnimationFrame(layout)).observe(stage);

  return {
    show() {
      if (state.observed.length === 3) state.phase = 'inference';
      view.hidden = false;
      sourceNote.hidden = true;
      source.setAttribute('aria-expanded', 'false');
      observation.hidden = true;
      update();
      requestAnimationFrame(layout);
      document.getElementById('history-back').focus({ preventScroll: true });
    },
  };
}
