// The interview graph: hand-authored content from baseData.js, assembled with
// type metadata, layers, and edge-kind labels. Mirrors the original app's
// graphData.js shape.
import { NODES as BASE_NODES, EDGES as BASE_EDGES } from './baseData';

/** Nine node types share six color families; shape tells types apart inside a family. */
export const TYPE_COLORS = {
  service:   'var(--fam-infra)',
  frontend:  'var(--fam-infra)',
  datastore: 'var(--fam-infra)',
  scheduler: 'var(--fam-infra)',
  concept:   'var(--fam-depth)',
  incident:  'var(--fam-fire)',
  aws:       'var(--fam-cloud)',
  gha:       'var(--fam-ci)',
  exercise:  'var(--fam-practice)',
};

/** circle = running things, square = places/state, diamond = ideas and events. */
export const TYPE_SHAPES = {
  service: 'circle', frontend: 'circle', scheduler: 'circle',
  datastore: 'square', aws: 'square', gha: 'square',
  concept: 'diamond', incident: 'diamond', exercise: 'diamond',
};

export const TYPE_LABELS = {
  service: 'Service', frontend: 'Frontend', datastore: 'Datastore',
  scheduler: 'Scheduler', concept: 'Concept', incident: 'Incident',
  aws: 'AWS equivalent', gha: 'GHA pattern', exercise: 'Practice rep',
};

/** Mix a CSS color with transparency, e.g. tint('var(--fam-infra)', 40). */
export const tint = (color, percent) => `color-mix(in srgb, ${color} ${percent}%, transparent)`;

/** Filter-bar layers: which node types each view shows. A 72-node graph is not a good default. */
export const LAYERS = [
  { id: 'estate',    label: 'Estate',    types: ['service', 'frontend', 'datastore', 'scheduler'] },
  { id: 'depth',     label: 'Depth',     types: ['concept', 'service', 'scheduler', 'datastore'] },
  { id: 'incidents', label: 'Incidents', types: ['incident', 'service', 'scheduler', 'datastore', 'frontend', 'concept'] },
  { id: 'aws',       label: 'AWS map',   types: ['aws', 'service', 'datastore', 'scheduler', 'frontend', 'concept'] },
  { id: 'gha',       label: 'GHA',       types: ['gha', 'scheduler', 'service', 'datastore', 'frontend'] },
  { id: 'practice',  label: 'Practice',  types: ['exercise', 'service', 'datastore', 'scheduler', 'concept', 'gha'] },
  { id: 'all',       label: 'All',       types: Object.keys(TYPE_COLORS) },
];

export const EDGE_KINDS = {
  proxies_to: 'proxies to', calls: 'calls', stores_in: 'stores in',
  ships_via: 'ships via', triggers: 'triggers', archives_to: 'archives to',
  aws_equivalent_is: 'AWS equivalent is', caused_by: 'caused by',
  fixed_by: 'fixed by', mitigated_by: 'mitigated by', secures: 'secures',
  part_of: 'part of', replaces: 'replaces', migrates_to: 'migrates to',
  relates_to: 'relates to', practices_on: 'practices on',
};

export const NODES = BASE_NODES;
export const EDGES = BASE_EDGES;

const nodeById = new Map(NODES.map(n => [n.id, n]));
export const nodeBy = id => nodeById.get(id);

export const DEGREE = new Map(NODES.map(n => [n.id, 0]));
for (const e of EDGES) {
  DEGREE.set(e.source, (DEGREE.get(e.source) ?? 0) + 1);
  DEGREE.set(e.target, (DEGREE.get(e.target) ?? 0) + 1);
}

/** Edges touching a node, normalized so `other` is the far end. */
export function edgesFor(id) {
  const out = [];
  for (const e of EDGES) {
    if (e.source === id) out.push({ kind: e.kind, other: e.target, direction: 'out' });
    else if (e.target === id) out.push({ kind: e.kind, other: e.source, direction: 'in' });
  }
  return out;
}

/** Nodes visible in a layer, plus the edges with both ends visible. */
export function layerGraph(layerId) {
  const layer = LAYERS.find(l => l.id === layerId) ?? LAYERS[0];
  const types = new Set(layer.types);
  const nodes = NODES.filter(n => types.has(n.type));
  const visible = new Set(nodes.map(n => n.id));
  const edges = EDGES.filter(e => visible.has(e.source) && visible.has(e.target));
  return { nodes, edges };
}
