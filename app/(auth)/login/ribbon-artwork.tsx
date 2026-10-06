/*
 * The sign-in panel's artwork: a ribbon of fine lines twisting through space,
 * over a field of softer stripes. Every line is computed here, on the server,
 * from one parametric shape; nothing is downloaded. The colours are the
 * product's violet (hue 288.4) leaning to cyan where the ribbon turns edge-on
 * and to magenta at its tail, like light catching a pleated surface.
 */

type Point = [number, number];
type Colour = [lightness: number, chroma: number, hue: number];

const width = 800;
const height = 1000;

type Ribbon = {
  /** A cubic Bézier the ribbon's centre follows. */
  spine: [Point, Point, Point, Point];
  /** Half-turns of twist from one end to the other, and where the twist starts. */
  turns: number;
  phase: number;
  /** Half the ribbon's width, and how much it widens towards the middle. */
  halfWidth: number;
  swell: number;
  /** The screen direction the ribbon's depth is drawn in: an oblique view, so a twist reads as a turn, not a pinch. */
  depth: Point;
};

/** Sweeps in from the top corner, folds through the middle, and leaves at the bottom. */
const ribbon: Ribbon = {
  spine: [
    [-260, 120],
    [1100, -60],
    [-300, 1180],
    [1080, 960],
  ],
  turns: 2.1,
  phase: 0.2,
  halfWidth: 120,
  swell: 0.4,
  depth: [0.6, -0.4],
};

/** A much wider, gentler ribbon behind it, drawn as lengthwise stripes. */
const field: Ribbon = {
  spine: [
    [1000, -200],
    [200, 300],
    [900, 700],
    [-200, 1200],
  ],
  turns: 0.8,
  phase: 1.2,
  halfWidth: 420,
  swell: 0.2,
  depth: [0.3, 0.2],
};

function bezier([a, b, c, d]: Ribbon["spine"], t: number): Point {
  const u = 1 - t;
  const [wa, wb, wc, wd] = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return [wa * a[0] + wb * b[0] + wc * c[0] + wd * d[0], wa * a[1] + wb * b[1] + wc * c[1] + wd * d[1]];
}

/**
 * Cross-sections spaced evenly along the ribbon's length (a Bézier's own
 * parameter bunches up on the bends). Each carries its centre, the direction
 * of travel, the vector out to one edge as seen on screen, and how squarely
 * that face is turned towards the viewer.
 */
function sections(shape: Ribbon, count: number) {
  const steps = 600;
  const points = Array.from({ length: steps + 1 }, (_, index) => bezier(shape.spine, index / steps));
  const lengths = [0];
  for (let index = 1; index <= steps; index++) {
    const [x0, y0] = points[index - 1];
    const [x1, y1] = points[index];
    lengths.push(lengths[index - 1] + Math.hypot(x1 - x0, y1 - y0));
  }

  let segment = 0;
  return Array.from({ length: count }, (_, index) => {
    const along = index / (count - 1);
    const target = along * lengths[steps];
    while (segment < steps - 1 && lengths[segment + 1] < target) segment++;
    const t = (segment + (target - lengths[segment]) / (lengths[segment + 1] - lengths[segment])) / steps;

    const centre = bezier(shape.spine, t);
    const [x0, y0] = bezier(shape.spine, Math.max(0, t - 0.001));
    const [x1, y1] = bezier(shape.spine, Math.min(1, t + 0.001));
    const run = Math.hypot(x1 - x0, y1 - y0);
    const tangent: Point = [(x1 - x0) / run, (y1 - y0) / run];

    // The edge is the spine's normal turned about the tangent by the twist.
    const twist = shape.phase + shape.turns * Math.PI * along;
    const facing = Math.cos(twist);
    const tilt = Math.sin(twist);
    const reach = shape.halfWidth * (1 + shape.swell * Math.sin(Math.PI * along));
    const edge: Point = [
      reach * (facing * -tangent[1] + tilt * shape.depth[0]),
      reach * (facing * tangent[0] + tilt * shape.depth[1]),
    ];
    return { along, centre, tangent, edge, facing, tilt, reach };
  });
}

const round = (value: number) => Math.round(value * 10) / 10;

const mix = (from: Colour, to: Colour, amount: number) =>
  from.map((channel, index) => channel + (to[index] - channel) * amount) as Colour;

const oklch = ([lightness, chroma, hue]: Colour, alpha: number) =>
  `oklch(${lightness.toFixed(3)} ${chroma.toFixed(3)} ${hue.toFixed(1)} / ${alpha.toFixed(2)})`;

/** Indigo into the product violet into magenta, from the ribbon's head to its tail. */
const hues: Colour[] = [
  [0.62, 0.2, 270],
  [0.56, 0.24, 288.4],
  [0.58, 0.24, 300],
  [0.64, 0.23, 335],
];
const glint: Colour = [0.88, 0.12, 200];
const underside: Colour = [0.34, 0.16, 285];

function hueAt(along: number): Colour {
  const position = along * (hues.length - 1);
  const index = Math.min(hues.length - 2, Math.floor(position));
  return mix(hues[index], hues[index + 1], position - index);
}

/** One slightly bowed line across the ribbon for every step along it. */
const rungs = sections(ribbon, 280).map(({ along, centre, tangent, edge, facing, tilt, reach }) => {
  const bow = 0.35 * tilt * reach;
  const start: Point = [centre[0] - edge[0], centre[1] - edge[1]];
  // Edge-on faces catch the light (cyan); the back of the ribbon sits in shade.
  const sheen = mix(hueAt(along), glint, 0.9 * Math.pow(1 - Math.abs(facing), 1.6));
  const colour = facing >= 0 ? sheen : mix(sheen, underside, 0.5);
  const light = 0.3 + 0.7 * Math.abs(Math.cos(Math.acos(facing) - 0.6));
  return {
    d: `M${round(start[0])} ${round(start[1])}q${round(edge[0] + tangent[0] * bow)} ${round(edge[1] + tangent[1] * bow)} ${round(2 * edge[0])} ${round(2 * edge[1])}`,
    stroke: oklch(colour, 0.35 + 0.65 * light),
    strokeWidth: round(1.2 + 1.8 * Math.abs(facing)),
  };
});

/** Lengthwise stripes, as relative moves between rounded points so the path text stays short. */
const fieldSections = sections(field, 50);
const stripes = Array.from({ length: 56 }, (_, index) => {
  const offset = -1 + (2 * index) / 55;
  const points = fieldSections.map(({ centre, edge }) => [
    round(centre[0] + offset * edge[0]),
    round(centre[1] + offset * edge[1]),
  ]);
  const moves = points.slice(1).map(([x, y], step) => `${round(x - points[step][0])} ${round(y - points[step][1])}`);
  return `M${points[0][0]} ${points[0][1]}l${moves.join(" ")}`;
});

/** Absolutely positioned layers that fill their (relative, overflow-hidden) parent. */
export function RibbonArtwork() {
  return (
    <div aria-hidden="true" className="absolute inset-0 bg-[oklch(0.2_0.09_284)]">
      {/* Each moving layer is oversized so its drift never shows an edge, and
          the two drift against each other for a hint of depth. In the short
          phone banner they stand tall, so the banner shows the top fold. */}
      <div className="absolute -inset-[6%] max-lg:bottom-auto max-lg:h-[340%] [--drift-turn:-1.5deg] [--drift-x:2%] [--drift-y:-1.5%] motion-safe:animate-[scribe-drift_36s_ease-in-out_infinite_alternate]">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="size-full">
          <defs>
            <radialGradient id="ribbon-bloom" cx="0.7" cy="0.2" r="0.7">
              <stop offset="0" stopColor="oklch(0.42 0.2 288.4)" />
              <stop offset="1" stopColor="oklch(0.2 0.09 284)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="ribbon-ember" cx="0.2" cy="0.95" r="0.6">
              <stop offset="0" stopColor="oklch(0.45 0.2 325)" stopOpacity="0.8" />
              <stop offset="1" stopColor="oklch(0.2 0.09 284)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="ribbon-stripes" x1="0" y1="0" x2={width} y2={height} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="oklch(0.55 0.2 275)" />
              <stop offset="0.6" stopColor="oklch(0.55 0.24 292)" />
              <stop offset="1" stopColor="oklch(0.6 0.24 330)" />
            </linearGradient>
            <filter id="ribbon-haze">
              <feGaussianBlur stdDeviation="1.8" />
            </filter>
          </defs>
          <rect width={width} height={height} fill="url(#ribbon-bloom)" />
          <rect width={width} height={height} fill="url(#ribbon-ember)" />
          <g fill="none" stroke="url(#ribbon-stripes)" strokeOpacity="0.32" strokeWidth="3.5" filter="url(#ribbon-haze)">
            {stripes.map((d, index) => (
              <path key={index} d={d} />
            ))}
          </g>
        </svg>
      </div>

      <div className="absolute -inset-[6%] max-lg:bottom-auto max-lg:h-[340%] [--drift-turn:2deg] [--drift-x:-2.5%] [--drift-y:2%] motion-safe:animate-[scribe-drift_28s_ease-in-out_infinite_alternate]">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="size-full">
          <defs>
            <filter id="ribbon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="14" />
            </filter>
          </defs>
          <g id="ribbon-lines" fill="none" strokeLinecap="round">
            {rungs.map((rung, index) => (
              <path key={index} {...rung} />
            ))}
          </g>
          {/* The same lines again, blurred and added on top: the glow. */}
          <use href="#ribbon-lines" filter="url(#ribbon-glow)" opacity="0.6" className="mix-blend-screen" />
        </svg>
      </div>

      {/* Film grain, so the gradients do not band. */}
      <svg className="absolute inset-0 size-full opacity-12 mix-blend-overlay">
        <filter id="ribbon-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#ribbon-grain)" />
      </svg>
    </div>
  );
}
