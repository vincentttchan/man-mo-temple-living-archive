// Project a source-image point onto its rendered image without changing the art's aspect ratio.
// object-position is a fraction of any unused or cropped space (0 = start, 1 = end).
export function projectArtworkPoint(frameWidth, frameHeight, imageWidth, imageHeight, anchorX, anchorY, positionX = .5, positionY = .5, fit = 'contain') {
  if (![frameWidth, frameHeight, imageWidth, imageHeight].every(value => Number.isFinite(value) && value > 0)) return null;
  const scale = (fit === 'cover' ? Math.max : Math.min)(frameWidth / imageWidth, frameHeight / imageHeight);
  const drawnWidth = imageWidth * scale;
  const drawnHeight = imageHeight * scale;
  return {
    x: (frameWidth - drawnWidth) * positionX + drawnWidth * anchorX,
    y: (frameHeight - drawnHeight) * positionY + drawnHeight * anchorY,
  };
}

export function objectPositionFractions(value) {
  const parts = String(value).trim().split(/\s+/);
  const fraction = (part, axis) => {
    if (part === 'center') return .5;
    if (part === (axis === 'x' ? 'left' : 'top')) return 0;
    if (part === (axis === 'x' ? 'right' : 'bottom')) return 1;
    const parsed = Number.parseFloat(part);
    return part.endsWith('%') && Number.isFinite(parsed) ? parsed / 100 : .5;
  };
  return [fraction(parts[0], 'x'), fraction(parts[1] ?? 'center', 'y')];
}
