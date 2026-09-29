// Both location markers are anchored to normalized coordinates of the full 1889 source.
const asset = 'assets/living-archive/';
const SOURCE = {width: 15280, height: 6699};
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export function createMapSurface(host, {onPlace = () => {}, onExplore = () => {}} = {}) {
  host.classList.add('map-surface');
  host.tabIndex = 0;
  host.setAttribute('role', 'region');
  host.innerHTML = `<div class="map-image-space"><img class="map-source" alt="1889 年維多利亞城歷史地圖" draggable="false"><img class="map-marker" src="${asset}map-ui/judgement-dot.png" alt="你的判斷" hidden><img class="map-confirmed-marker" src="${asset}map-ui/temple-ring.png" alt="文武廟位置" hidden><span class="map-student-label" hidden><img src="${asset}map-ui/text-v2/student-label.png" alt="你的判斷"></span><span class="map-confirmed-label" hidden><img src="${asset}map-ui/text-v2/location-label.png" alt="文武廟位置"></span><span class="map-key-cursor" hidden aria-hidden="true">＋</span></div><span class="map-loading" role="status">正在展開歷史地圖…</span>`;
  const space = host.querySelector('.map-image-space');
  const image = host.querySelector('.map-source');
  const marker = host.querySelector('.map-marker');
  const confirmedMarker = host.querySelector('.map-confirmed-marker');
  const studentLabel = host.querySelector('.map-student-label');
  const confirmedLabel = host.querySelector('.map-confirmed-label');
  const cursor = host.querySelector('.map-key-cursor');
  const loading = host.querySelector('.map-loading');
  Object.assign(confirmedMarker.style, {position: 'absolute', height: 'auto', transform: 'translate(-50%, -50%)', zIndex: '3', pointerEvents: 'none'});
  const events = new AbortController();
  const pointers = new Map();
  let data = {marker: null, confirmedLocation: null};
  let mode = 'pan', scale = 1, dx = 0, dy = 0, baseW = 0, baseH = 0;
  let drag = null, pinch = null, keyPoint = {x: .5, y: .5}, keyMoved = false, destroyed = false;

  function pointOrNull(p) {
    return p && Number.isFinite(p.x) && Number.isFinite(p.y)
      ? {x: clamp(p.x, 0, 1), y: clamp(p.y, 0, 1)} : null;
  }
  function geometry() {
    const r = host.getBoundingClientRect();
    const width = host.clientWidth, height = host.clientHeight;
    return {r, width, height, ratioX: r.width / width || 1, ratioY: r.height / height || 1,
      left: (width - baseW * scale) / 2 + dx, top: (height - baseH * scale) / 2 + dy};
  }
  function normalized(clientX, clientY, restrict = false) {
    const {r, ratioX, ratioY, left, top} = geometry();
    const x = ((clientX - r.left) / ratioX - left) / (baseW * scale);
    const y = ((clientY - r.top) / ratioY - top) / (baseH * scale);
    if (!Number.isFinite(x + y) || (!restrict && (x < 0 || x > 1 || y < 0 || y > 1))) return null;
    return {x: clamp(x, 0, 1), y: clamp(y, 0, 1)};
  }
  function markerAt(element, p) {
    element.hidden = !p;
    if (!p) return;
    element.style.left = `${p.x * 100}%`;
    element.style.top = `${p.y * 100}%`;
    element.style.width = '26px';
    element.style.transform = `translate(-50%, -50%) scale(${1 / scale})`;
  }
  function labelAt(element, p, side, other) {
    element.hidden = !p;
    if (!p) return null;
    const {width: viewportW, height: viewportH, left, top} = geometry();
    const width = Math.min(86, Math.max(70, viewportW * .22)), height = 18;
    const px = left + p.x * baseW * scale, py = top + p.y * baseH * scale;
    let x = side === 'left' ? px - width - 19 : px + 19;
    if (x < 8 || x + width > viewportW - 8) x = side === 'left' ? px + 19 : px - width - 19;
    x = clamp(x, 8, Math.max(8, viewportW - width - 8));
    let y = clamp(py - 30, 8, Math.max(8, viewportH - height - 8));
    if (other && x < other.x + other.width + 5 && x + width + 5 > other.x && y < other.y + other.height + 5 && y + height + 5 > other.y) {
      const below = other.y + other.height + 7;
      y = below + height <= viewportH - 8 ? below : clamp(other.y - height - 7, 8, Math.max(8, viewportH - height - 8));
    }
    Object.assign(element.style, {position: 'absolute', left: `${(x - left) / scale}px`, top: `${(y - top) / scale}px`, width: `${width}px`, height: `${height}px`, transform: `scale(${1 / scale})`, zIndex: '4', pointerEvents: 'none'});
    Object.assign(element.firstElementChild.style, {display: 'block', width: '100%', height: '100%', objectFit: 'contain'});
    return {x, y, width, height};
  }
  function transform() {
    const {width, height} = geometry();
    if (!width || !baseW || destroyed) return;
    // A narrow paper gutter keeps edge markers readable without moving evidence.
    const gutter = data.marker || data.confirmedLocation || mode === 'marker' ? 60 : 0;
    dx = clamp(dx, -Math.max(0, (baseW * scale - width) / 2) - gutter, Math.max(0, (baseW * scale - width) / 2) + gutter);
    dy = clamp(dy, -Math.max(0, (baseH * scale - height) / 2) - gutter, Math.max(0, (baseH * scale - height) / 2) + gutter);
    const {left, top} = geometry();
    space.style.width = `${baseW}px`;
    space.style.height = `${baseH}px`;
    space.style.transform = `translate(${left}px,${top}px) scale(${scale})`;
    host.dataset.scale = String(scale);
    markerAt(marker, data.marker);
    markerAt(confirmedMarker, data.confirmedLocation);
    const first = labelAt(studentLabel, data.marker, 'left');
    labelAt(confirmedLabel, data.confirmedLocation, 'right', first);
    cursor.style.left = `${keyPoint.x * 100}%`;
    cursor.style.top = `${keyPoint.y * 100}%`;
    cursor.style.fontSize = `${30 / scale}px`;
  }
  function layout() {
    if (destroyed || !image.naturalWidth) return;
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    const oldW = baseW;
    baseW = Math.min(width, height * SOURCE.width / SOURCE.height);
    baseH = baseW * SOURCE.height / SOURCE.width;
    if (oldW) { dx *= baseW / oldW; dy *= baseW / oldW; }
    if (data.confirmedLocation) frameData(); else transform();
  }
  function zoom(factor, clientX, clientY) {
    if (!image.naturalWidth || !baseW || mode === 'static' || !Number.isFinite(factor) || factor <= 0) return;
    const {r, width, height, ratioX, ratioY} = geometry();
    const cx = clientX ?? r.left + r.width / 2, cy = clientY ?? r.top + r.height / 2;
    const p = normalized(cx, cy, true);
    if (!p) return;
    scale = clamp(scale * factor, 1, 10);
    dx = (cx - r.left) / ratioX - width / 2 - (p.x - .5) * baseW * scale;
    dy = (cy - r.top) / ratioY - height / 2 - (p.y - .5) * baseH * scale;
    transform(); onExplore();
  }
  function focusArchiveArea() {
    if (!baseW) return;
    // Editorial opening rectangle in full-source pixels, not a temple coordinate.
    const [x1, y1, x2, y2] = [4000, 1000, 7000, 3500];
    const {width, height} = geometry();
    const fitWidth=width / (baseW * (x2 - x1) / SOURCE.width), fitHeight=height / (baseH * (y2 - y1) / SOURCE.height);
    scale = clamp(height > width ? fitHeight : Math.min(fitWidth,fitHeight), 1, 10);
    dx = (.5 - (x1 + x2) / 2 / SOURCE.width) * baseW * scale;
    dy = (.5 - (y1 + y2) / 2 / SOURCE.height) * baseH * scale;
    transform();
  }
  function frameData() {
    const points = [data.marker, data.confirmedLocation].filter(Boolean);
    if (!points.length || !baseW) return;
    const {width, height} = geometry();
    const xs = points.map(p => p.x), ys = points.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    // The reserved margins accommodate the fixed-screen-size pins and labels.
    const roomW = Math.max(1, width - Math.min(290, width * .58));
    const roomH = Math.max(1, height - Math.min(160, height * .48));
    scale = clamp(Math.min(roomW / (baseW * Math.max(.01, maxX - minX)), roomH / (baseH * Math.max(.01, maxY - minY))), 1, 10);
    dx = (.5 - (minX + maxX) / 2) * baseW * scale;
    dy = (.5 - (minY + maxY) / 2) * baseH * scale;
    transform();
  }
  function keepKeyPointVisible() {
    const {width, height, left, top} = geometry();
    const x = left + keyPoint.x * baseW * scale;
    const y = top + keyPoint.y * baseH * scale;
    const margin = 55;
    dx += clamp(x, margin, Math.max(margin, width - margin)) - x;
    dy += clamp(y, margin, Math.max(margin, height - margin)) - y;
  }
  function finishPointer(e, cancelled) {
    pointers.delete(e.pointerId);
    if (pinch) { if (pointers.size < 2) pinch = null; drag = null; return; }
    if (!drag || drag.id !== e.pointerId) return;
    if (!cancelled && mode === 'marker' && !drag.moved && drag.point) onPlace(drag.point);
    drag = null;
  }
  host.addEventListener('pointerdown', e => {
    if (e.button !== 0 || mode === 'static' || !image.naturalWidth) return;
    host.focus({preventScroll: true}); host.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, {x: e.clientX, y: e.clientY}); cursor.hidden = true;
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = {distance: Math.hypot(a.x - b.x, a.y - b.y)}; drag = null; return; }
    drag = {id: e.pointerId, x: e.clientX, y: e.clientY, dx, dy, moved: false, point: normalized(e.clientX, e.clientY)};
  }, {signal: events.signal});
  host.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, {x: e.clientX, y: e.clientY});
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()], distance = Math.hypot(a.x - b.x, a.y - b.y);
      zoom(distance / (pinch.distance || distance), (a.x + b.x) / 2, (a.y + b.y) / 2);
      pinch.distance = distance; return;
    }
    if (!drag || drag.id !== e.pointerId) return;
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) drag.moved = true;
    const {ratioX, ratioY} = geometry();
    dx = drag.dx + (e.clientX - drag.x) / ratioX; dy = drag.dy + (e.clientY - drag.y) / ratioY;
    transform(); if (drag.moved) onExplore();
  }, {signal: events.signal});
  host.addEventListener('pointerup', e => finishPointer(e, false), {signal: events.signal});
  host.addEventListener('pointercancel', e => finishPointer(e, true), {signal: events.signal});
  host.addEventListener('wheel', e => { if (mode === 'static') return; e.preventDefault(); zoom(Math.exp(-e.deltaY * .0015), e.clientX, e.clientY); }, {passive: false, signal: events.signal});
  host.addEventListener('keydown', e => {
    if (mode === 'static' || !image.naturalWidth) return;
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoom(1.3); return; }
    if (e.key === '-') { e.preventDefault(); zoom(1 / 1.3); return; }
    const dirs = {ArrowLeft: [-.01, 0], ArrowRight: [.01, 0], ArrowUp: [0, -.01], ArrowDown: [0, .01]};
    if (dirs[e.key]) {
      e.preventDefault(); const [x, y] = dirs[e.key];
      if (mode === 'pan') { dx -= x * baseW * scale * 4; dy -= y * baseH * scale * 4; onExplore(); }
      else { cursor.hidden = false; keyMoved = true; keyPoint = {x: clamp(keyPoint.x + x, 0, 1), y: clamp(keyPoint.y + y, 0, 1)}; keepKeyPointVisible(); }
      transform();
    } else if ((e.key === 'Enter' || e.key === ' ') && mode === 'marker') {
      e.preventDefault(); cursor.hidden = false; onPlace(keyPoint); transform();
    }
  }, {signal: events.signal});
  image.addEventListener('load', () => {
    loading.hidden = true; delete host.dataset.error; layout();
    if (data.confirmedLocation) frameData(); else focusArchiveArea();
    if (mode === 'marker' && !keyMoved) {
      const r = host.getBoundingClientRect();
      keyPoint = normalized(r.left + r.width / 2, r.top + r.height / 2, true) || keyPoint;
      transform();
    }
    host.dispatchEvent(new CustomEvent('mapready'));
  }, {signal: events.signal});
  image.addEventListener('error', () => { loading.hidden = false; loading.innerHTML = '地圖未能載入。<button type="button">重新載入</button>'; host.dataset.error = 'true'; }, {signal: events.signal});
  loading.addEventListener('click', e => {if(e.target.closest('button')){e.stopPropagation();loading.textContent='正在展開歷史地圖…';image.src=`${asset}maps/victoria-1889-source.webp`;}}, {signal:events.signal});
  image.src = `${asset}maps/victoria-1889-source.webp`;
  const observer = new ResizeObserver(layout); observer.observe(host);
  return {
    setMode(next) {
      if (!['pan', 'marker', 'static'].includes(next)) return;
      if(mode===next)return;
      mode = next; host.dataset.mode = mode; cursor.hidden = true;
      keyMoved = false;
      const r = host.getBoundingClientRect();
      keyPoint = normalized(r.left + r.width / 2, r.top + r.height / 2, true) || {x: .5, y: .5};
      host.tabIndex = next === 'static' ? -1 : 0;
      host.setAttribute('aria-label', `1889 年歷史地圖${next === 'marker' ? '；方向鍵選位置，Enter 留下判斷' : '；方向鍵移動，加減鍵縮放'}`);
    },
    setData(next) {
      if ('marker' in next) data.marker = pointOrNull(next.marker);
      if ('confirmedLocation' in next) data.confirmedLocation = pointOrNull(next.confirmedLocation);
      if (data.confirmedLocation) frameData(); else transform();
    },
    zoom,
    fit() { scale = 1; dx = dy = 0; transform(); onExplore(); },
    resetView(){layout();if(data.confirmedLocation)frameData();else focusArchiveArea();},
    frameData, layout,
    retry() { if (host.dataset.error === 'true') { loading.hidden = false; loading.textContent = '正在展開歷史地圖…'; image.src = `${asset}maps/victoria-1889-source.webp`; } },
    focus() { host.focus({preventScroll: true}); },
    destroy() { destroyed = true; observer.disconnect(); events.abort(); pointers.clear(); },
  };
}
