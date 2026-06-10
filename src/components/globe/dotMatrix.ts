/**
 * Continent dot-matrix sampler.
 *
 * Loads the equirectangular `/textures/earth.jpg`, draws it to an offscreen
 * 2D canvas, walks a lat/lng grid, classifies each cell as land vs ocean by a
 * pixel heuristic, and projects the land cells onto a sphere. The result is a
 * flat Float32Array of xyz positions plus a parallel array of per-point size
 * jitter — fed straight into a THREE.BufferGeometry once, then memoized.
 *
 * No THREE import here: this stays a pure data module so it can run in a worker
 * later if needed. The caller turns the arrays into geometry.
 */

export interface DotMatrix {
  /** Flat xyz triples on a unit-ish sphere of `radius`. */
  positions: Float32Array
  /** Per-point size multiplier (0.6–1.0) for organic variance. */
  sizes: Float32Array
  /** Per-point limb-brightness factor (0..1), dimmer toward the silhouette. */
  brightness: Float32Array
  count: number
}

/** Convert geographic lat/lng (deg) to a point on a sphere of `radius`. */
export function latLngToVec3(
  latDeg: number,
  lngDeg: number,
  radius: number
): [number, number, number] {
  const phi = (90 - latDeg) * (Math.PI / 180) // polar angle from +Y
  const theta = (lngDeg + 180) * (Math.PI / 180) // azimuth
  const x = -radius * Math.sin(phi) * Math.cos(theta)
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)
  return [x, y, z]
}

/**
 * Ocean test on an equirectangular NASA-style earth map: oceans are blue-dominant
 * and fairly dark; land is brighter / warmer (green-brown). We treat a pixel as
 * ocean when blue clearly leads red & green, OR when the pixel is very dark.
 */
function isLand(r: number, g: number, b: number): boolean {
  const blueDominant = b > r * 1.05 && b > g * 1.02
  const veryDark = r + g + b < 48 // deep ocean / black margins
  if (blueDominant || veryDark) return false
  // Land tends to have appreciable red/green energy.
  return r + g > 70
}

/**
 * Build the dot matrix from a loaded image. `step` is the grid spacing in
 * degrees of latitude; longitude spacing scales by 1/cos(lat) so the woven
 * pattern stays roughly uniform on the sphere instead of bunching at the poles.
 */
export function buildDotMatrix(
  img: HTMLImageElement,
  opts: { radius?: number; step?: number } = {}
): DotMatrix {
  const radius = opts.radius ?? 1.96
  const step = opts.step ?? 1.25

  // Sample at a moderate resolution — enough fidelity for coastlines without
  // paying for a 4k decode on the main thread.
  const W = 512
  const H = 256
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    return { positions: new Float32Array(0), sizes: new Float32Array(0), brightness: new Float32Array(0), count: 0 }
  }
  ctx.drawImage(img, 0, 0, W, H)
  const data = ctx.getImageData(0, 0, W, H).data

  const px: number[] = []
  const sz: number[] = []
  const br: number[] = []

  let row = 0
  for (let lat = -84; lat <= 84; lat += step, row++) {
    const cosLat = Math.cos((lat * Math.PI) / 180)
    // Longitude spacing widens near the poles to keep dot density even.
    const lngStep = step / Math.max(cosLat, 0.22)
    // Stagger alternate rows by half a step for a woven, non-gridded look.
    const stagger = row % 2 === 0 ? 0 : lngStep / 2

    for (let lng = -180 + stagger; lng < 180; lng += lngStep) {
      // Map lat/lng to texel. Texture v=0 is the north pole (lat +90).
      const u = (lng + 180) / 360
      const v = (90 - lat) / 180
      const sx = Math.min(W - 1, Math.max(0, Math.floor(u * W)))
      const sy = Math.min(H - 1, Math.max(0, Math.floor(v * H)))
      const idx = (sy * W + sx) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      if (!isLand(r, g, b)) continue

      const [x, y, z] = latLngToVec3(lat, lng, radius)
      px.push(x, y, z)
      // Size variance: most dots small, a few brighter "city" dots.
      sz.push(0.62 + Math.random() * 0.42)
      // Brightness: dim slightly toward high latitudes (poles) for a softer edge.
      br.push(0.7 + 0.3 * cosLat)
    }
  }

  return {
    positions: new Float32Array(px),
    sizes: new Float32Array(sz),
    brightness: new Float32Array(br),
    count: px.length / 3,
  }
}

/** Promisified image loader for the equirectangular texture. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
