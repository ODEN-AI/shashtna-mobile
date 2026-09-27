/**
 * CSS gradient strings for React Native's native `experimental_backgroundImage`
 * (drawn by the platform view, no extra native module). Kept in one place so
 * the implementation can be swapped without touching screens.
 */
export function linear(angle: number, stops: readonly string[]) {
  return `linear-gradient(${angle}deg, ${stops.join(', ')})`;
}

/**
 * A soft light pool. `rgb` is "r, g, b"; it fades to the same colour at zero
 * alpha (fading to `transparent` would pass through grey).
 */
export function radial(rgb: string, alpha: number, at = 'center', extent = '70%') {
  return `radial-gradient(circle at ${at}, rgba(${rgb}, ${alpha}) 0%, rgba(${rgb}, 0) ${extent})`;
}

/** Background style for a gradient (one or more stacked layers, top first). */
export function gradientStyle(...layers: string[]) {
  return { experimental_backgroundImage: layers.join(', ') } as const;
}

export const RGB = {
  navy: '3, 25, 91',
  royal: '11, 44, 177',
  electric: '25, 81, 252',
  sky: '55, 129, 252',
  ice: '203, 233, 253',
  night: '1, 6, 25',
} as const;
