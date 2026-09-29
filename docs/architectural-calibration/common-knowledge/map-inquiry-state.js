export const MAP_INQUIRY_KEY = 'manmo-map-inquiry-v2';

const LEGACY_KEY = 'manmo-map-inquiry-v1';
const stages = ['observe', 'place-marker', 'confirm-location', 'source-limitation'];
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isPoint = point => isObject(point)
  && Number.isFinite(point.x) && point.x >= 0 && point.x <= 1
  && Number.isFinite(point.y) && point.y >= 0 && point.y <= 1;
const copyPoint = point => ({x: point.x, y: point.y});

export function createMapInquiryState() {
  return {version: 2, stage: 'observe', studentMarker: null, sceneCompleted: false};
}

function sanitize(raw) {
  if (!isObject(raw) || raw.version !== 2) return createMapInquiryState();
  const studentMarker = isPoint(raw.studentMarker) ? copyPoint(raw.studentMarker) : null;
  const requestedStage = stages.includes(raw.stage) ? raw.stage : 'observe';
  const stage = studentMarker || stages.indexOf(requestedStage) < 2
    ? requestedStage : 'place-marker';
  return {
    version: 2,
    stage,
    studentMarker,
    sceneCompleted: studentMarker !== null && raw.sceneCompleted === true,
  };
}

function migrateLegacy(raw) {
  if (!isObject(raw) || raw.version !== 1 || !isObject(raw.preFieldwork)
      || !isPoint(raw.preFieldwork.initialMarker)) return null;
  return {
    version: 2,
    stage: 'confirm-location',
    studentMarker: copyPoint(raw.preFieldwork.initialMarker),
    sceneCompleted: false,
  };
}

export function loadMapInquiryState(storage) {
  try {
    const raw = storage.getItem(MAP_INQUIRY_KEY);
    if (raw !== null) return sanitize(JSON.parse(raw));
  } catch {
    return createMapInquiryState();
  }

  try {
    const raw = storage.getItem(LEGACY_KEY);
    if (raw === null) return createMapInquiryState();
    const migrated = migrateLegacy(JSON.parse(raw));
    if (!migrated) return createMapInquiryState();
    // Keep the old record if the new write fails, so it can be retried later.
    const result = saveMapInquiryState(storage, migrated);
    if (result.ok) {
      try { storage.removeItem?.(LEGACY_KEY); } catch { /* The v2 record is already durable. */ }
    }
    return migrated;
  } catch {
    return createMapInquiryState();
  }
}

export function saveMapInquiryState(storage, state) {
  try {
    if (!isObject(state) || state.version !== 2) throw new TypeError('Invalid map inquiry state');
    const clean = sanitize(state);
    if (JSON.stringify(clean) !== JSON.stringify(state)) throw new TypeError('Invalid map inquiry state');
    storage.setItem(MAP_INQUIRY_KEY, JSON.stringify(clean));
    return {ok: true};
  } catch (error) {
    return {ok: false, error};
  }
}

export function setInitialMarker(state, point) {
  if (state.stage !== 'place-marker' || !isPoint(point)) return state;
  return {...state, studentMarker: copyPoint(point)};
}

export function setMapStage(state, stage) {
  const current = stages.indexOf(state.stage);
  const next = stages.indexOf(stage);
  if (current < 0 || next !== current + 1) return state;
  if (next >= 2 && !isPoint(state.studentMarker)) return state;
  return {...state, stage};
}

export function completeMapScene(state) {
  if (state.stage !== 'source-limitation' || !isPoint(state.studentMarker) || state.sceneCompleted) return state;
  return {...state, sceneCompleted: true};
}
