// Session walk: build a timed path through the graph for an out-loud
// talk-through. The walk is the fluency tool - two hours of expert speech
// is just walking the graph, one node at a time.
import { NODES, EDGES, DEGREE, nodeBy } from './data/graphData';

/** Default minutes per stop, by node type. Exercises are timed reps. */
export const MINUTES_BY_TYPE = {
  service: 6, frontend: 5, datastore: 6, scheduler: 6,
  solution: 5, concept: 5, incident: 4, aws: 3, gha: 4,
  exercise: null, // exercises use their own timeboxMin
};

/** Deterministic PRNG (mulberry32) so a walk can be reproduced and shared. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Neighbor ids of a node (both edge directions). */
function neighbors(id) {
  const out = [];
  for (const e of EDGES) {
    if (e.source === id) out.push(e.target);
    else if (e.target === id) out.push(e.source);
  }
  return out;
}

/**
 * Build a walk of about `minutes` total, starting at `startId`, preferring
 * unvisited high-degree neighbors so consecutive stops stay connected and the
 * narration flows. Falls back to a jump to the best unvisited node when the
 * local neighborhood is exhausted.
 * Returns { stops: [{id, minutes, jump}], totalMinutes }.
 */
export function buildWalk({ minutes = 120, startId = 'fe-main-site', seed = 1 } = {}) {
  if (minutes <= 0) return { stops: [], totalMinutes: 0 };
  const rand = seededRandom(seed);
  const visited = new Set();
  const stops = [];
  let total = 0;
  let current = nodeBy(startId) ?? NODES[0];

  const minutesFor = n => {
    const m = MINUTES_BY_TYPE[n.type];
    return m ?? Math.max(10, Math.min(30, n.timeboxMin ?? 20));
  };

  while (total < minutes) {
    const stopMin = minutesFor(current);
    stops.push({ id: current.id, minutes: stopMin, jump: stops.length > 0 && !neighbors(stops[stops.length - 1].id).includes(current.id) });
    total += stopMin;
    visited.add(current.id);

    const candidates = neighbors(current.id)
      .map(nodeBy)
      .filter(n => n && !visited.has(n.id));
    let next;
    if (candidates.length > 0) {
      // Weight by degree with a random tiebreak: hubs first, but not always the same walk.
      next = candidates
        .map(n => ({ n, score: (DEGREE.get(n.id) ?? 0) + rand() }))
        .sort((a, b) => b.score - a.score)[0].n;
    } else {
      const remaining = NODES.filter(n => !visited.has(n.id));
      if (remaining.length === 0) break;
      next = remaining
        .map(n => ({ n, score: (DEGREE.get(n.id) ?? 0) + rand() }))
        .sort((a, b) => b.score - a.score)[0].n;
    }
    current = next;
  }
  return { stops, totalMinutes: total };
}

/** Coverage summary for a walk: stops and minutes per node type. */
export function walkCoverage(walk) {
  const byType = {};
  for (const s of walk.stops) {
    const t = nodeBy(s.id)?.type ?? 'unknown';
    byType[t] = byType[t] ?? { stops: 0, minutes: 0 };
    byType[t].stops += 1;
    byType[t].minutes += s.minutes;
  }
  return byType;
}
