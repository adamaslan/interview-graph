import * as d3 from 'd3';
import { DEGREE, TYPE_COLORS } from '../data/graphData';

export const SPREAD_MIN = 0.6;
export const SPREAD_MAX = 2.5;
export const SPREAD_DEFAULT = 1;

export const LAYOUT_PRESETS = [
  { id: 'free', label: 'Free' },
  { id: 'type', label: 'By type' },
  { id: 'radial', label: 'Radial' },
];

const BASE = {
  linkDistance: 85,
  charge: -240,
  collidePad: 4,
  centerPull: 0.05,
};

// Translations and hierarchy sit tight; loose associations stay long so the
// middle does not knot.
const LINK_DISTANCE_BY_KIND = {
  aws_equivalent_is: 120, part_of: 55, practices_on: 70,
  caused_by: 60, fixed_by: 60, relates_to: 110,
};
const HUB_DISTANCE_PER_SQRT_DEGREE = 2;

const LABEL_CHAR_WIDTH = 5.5;
const LABEL_EXTRA_MAX = 30;

const TYPE_GRID_PULL = 0.14;
const TOPIC_CLUSTER_PULL = 0.1;
const TOPIC_CLUSTER_MIN_NODES = 60;
const RADIAL_PULL = 0.6;
const RADIAL_INNER_RADIUS = 50;
const RADIAL_OUTER_SHARE = 0.42;
const RING_ORDER = [
  'service', 'frontend', 'datastore', 'scheduler',
  'solution', 'concept', 'incident', 'aws', 'gha', 'exercise',
];

const endId = (d, end) => (typeof d[end] === 'object' ? d[end].id : d[end]);

/** Edge length by kind, lengthened for hubs so a busy node's neighbors can fan out. */
export const linkDistanceFor = d => {
  const hub = Math.max(DEGREE.get(endId(d, 'source')) || 1, DEGREE.get(endId(d, 'target')) || 1);
  return (LINK_DISTANCE_BY_KIND[d.kind] ?? BASE.linkDistance) + Math.sqrt(hub) * HUB_DISTANCE_PER_SQRT_DEGREE;
};

/** Collision radius: the shape, padding that grows with spread, plus room for a visible label. */
export function collideRadiusFor({ spread, radiusOf, labelMinDegree }) {
  return d => {
    const labelled = (DEGREE.get(d.id) ?? 0) >= labelMinDegree;
    const labelExtra = labelled ? Math.min(LABEL_EXTRA_MAX, (d.label.length * LABEL_CHAR_WIDTH) / 2) : 0;
    return radiusOf(d) + BASE.collidePad * spread + labelExtra;
  };
}

/** Retune link length, repulsion and collision on the running simulation; positions are kept. */
export function applySpacing(sim, { spread, radiusOf, labelMinDegree }) {
  sim.force('link').distance(d => linkDistanceFor(d) * spread);
  sim.force('charge').strength(BASE.charge * spread);
  sim.force('collision').radius(collideRadiusFor({ spread, radiusOf, labelMinDegree }));
}

function typeGridTargets(nodes, W, H) {
  const types = [...new Set(nodes.map(n => n.type))].sort(
    (a, b) => Object.keys(TYPE_COLORS).indexOf(a) - Object.keys(TYPE_COLORS).indexOf(b));
  const cols = W > 700 ? Math.min(5, types.length) : 3;
  const rows = Math.ceil(types.length / cols);
  return new Map(types.map((type, i) => [type, {
    x: (W * ((i % cols) + 0.5)) / cols,
    y: (H * (Math.floor(i / cols) + 0.5)) / rows,
  }]));
}

function radialTargets(nodes, W, H) {
  const cx = W / 2;
  const cy = H / 2;
  const maxR = Math.min(W, H) * RADIAL_OUTER_SHARE;
  const byType = new Map();
  for (const n of nodes) {
    if (!byType.has(n.type)) byType.set(n.type, []);
    byType.get(n.type).push(n);
  }
  const targets = new Map();
  RING_ORDER.forEach((type, ring) => {
    const members = byType.get(type) ?? [];
    const r = RADIAL_INNER_RADIUS + (maxR * ring) / Math.max(1, RING_ORDER.length - 1);
    members.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / Math.max(1, members.length) - Math.PI / 2;
      targets.set(n.id, { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    });
  });
  return targets;
}

/** Gentle push back toward the world box once a node drifts outside it. Unlike a
 * hard clamp this does not pin nodes onto the boundary line, so repulsion can
 * still space boundary nodes along the edge instead of stacking them on it. */
function containmentForce(world) {
  let ns;
  const margin = 16;
  const force = alpha => {
    for (const d of ns) {
      if (d.fx != null) continue;
      if (d.x < margin) d.vx += (margin - d.x) * 0.4 * alpha;
      else if (d.x > world.w - margin) d.vx += (world.w - margin - d.x) * 0.4 * alpha;
      if (d.y < margin) d.vy += (margin - d.y) * 0.4 * alpha;
      else if (d.y > world.h - margin) d.vy += (world.h - margin - d.y) * 0.4 * alpha;
    }
  };
  force.initialize = n => { ns = n; };
  return force;
}

/** Build the simulation for a layer's graph. Presets add positional forces. */
export function createSimulation(nodes, edges, { width, height, spread, preset, radiusOf, labelMinDegree }) {
  // Big graphs get a bigger world: the charge needs room to spread before the
  // viewport fit scales it back down, otherwise nodes pack against the bounds.
  const worldScale = Math.max(1, Math.sqrt(nodes.length / 40));
  const world = { w: width * worldScale, h: height * worldScale };
  const sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(edges).id(d => d.id).distance(d => linkDistanceFor(d) * spread))
    .force('charge', d3.forceManyBody().strength(BASE.charge * spread))
    .force('collision', d3.forceCollide().radius(collideRadiusFor({ spread, radiusOf, labelMinDegree })))
    .force('x', d3.forceX(world.w / 2).strength(BASE.centerPull))
    .force('y', d3.forceY(world.h / 2).strength(BASE.centerPull))
    .force('contain', containmentForce(world));
  sim.world = world;

  // Big topic-bearing layers (the Python fundamentals set) cluster by topic in
  // free mode: without a positional pull the charge presses the whole graph
  // against the world bounds, which reads as a rectangular ring on narrow
  // screens. Untopicked anchor nodes drift to the middle.
  const clusterTopics = preset === 'free' && nodes.length >= TOPIC_CLUSTER_MIN_NODES
    ? [...new Set(nodes.map(n => n.topic).filter(Boolean))]
    : [];
  if (clusterTopics.length >= 4) {
    const cols = Math.max(2, Math.round(Math.sqrt(clusterTopics.length * (world.w / world.h))));
    const rows = Math.ceil(clusterTopics.length / cols);
    const targets = new Map(clusterTopics.map((topic, i) => [topic, {
      x: (world.w * ((i % cols) + 0.5)) / cols,
      y: (world.h * (Math.floor(i / cols) + 0.5)) / rows,
    }]));
    const center = { x: world.w / 2, y: world.h / 2 };
    sim.force('x', d3.forceX(d => targets.get(d.topic)?.x ?? center.x).strength(TOPIC_CLUSTER_PULL));
    sim.force('y', d3.forceY(d => targets.get(d.topic)?.y ?? center.y).strength(TOPIC_CLUSTER_PULL));
  }

  if (preset === 'type') {
    const targets = typeGridTargets(nodes, world.w, world.h);
    sim.force('x', d3.forceX(d => targets.get(d.type)?.x ?? width / 2).strength(TYPE_GRID_PULL));
    sim.force('y', d3.forceY(d => targets.get(d.type)?.y ?? height / 2).strength(TYPE_GRID_PULL));
  } else if (preset === 'radial') {
    const targets = radialTargets(nodes, world.w, world.h);
    sim.force('x', d3.forceX(d => targets.get(d.id)?.x ?? width / 2).strength(RADIAL_PULL));
    sim.force('y', d3.forceY(d => targets.get(d.id)?.y ?? height / 2).strength(RADIAL_PULL));
  }
  return sim;
}
