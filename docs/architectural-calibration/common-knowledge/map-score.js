import {MAN_MO_LOCATION} from './map-location.js';
// Game feedback on the original raster, not metres or a survey-accuracy claim.
// A 60-source-pixel tolerance avoids penalising taps within the immediate site.
// Beyond it, each 900 source pixels of distance reduces the score by e^-1.
export function mapLocationScore(point) {
  if(!point || !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x<0 || point.x>1 || point.y<0 || point.y>1)return null;
  const distance=Math.hypot((point.x-MAN_MO_LOCATION.x)*15280,(point.y-MAN_MO_LOCATION.y)*6699);
  const score=Math.max(0,Math.min(5000,Math.round(5000*Math.exp(-Math.max(0,distance-60)/900))));
  return {score,max:5000,band:score>=4500?'close':score>=2500?'near':'far'};
}
