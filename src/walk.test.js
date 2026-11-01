import { describe, it, expect } from 'vitest';
import { buildWalk, walkCoverage, MINUTES_BY_TYPE } from './walk';
import { NODES, EDGES, nodeBy } from './data/graphData';

const neighborsOf = id => EDGES.flatMap(e =>
  e.source === id ? [e.target] : e.target === id ? [e.source] : []);

describe('session walk', () => {
  it('is deterministic for a given seed', () => {
    const a = buildWalk({ minutes: 120, seed: 42 });
    const b = buildWalk({ minutes: 120, seed: 42 });
    expect(a.stops.map(s => s.id)).toEqual(b.stops.map(s => s.id));
    expect(a.totalMinutes).toBe(b.totalMinutes);
  });

  it('fills the requested time budget without overshooting by more than one stop', () => {
    const w = buildWalk({ minutes: 120, seed: 7 });
    const maxStop = Math.max(...NODES.map(n => MINUTES_BY_TYPE[n.type] ?? 30));
    expect(w.totalMinutes).toBeGreaterThanOrEqual(120);
    expect(w.totalMinutes).toBeLessThan(120 + maxStop);
  });

  it('never repeats a node', () => {
    const w = buildWalk({ minutes: 180, seed: 3 });
    const ids = w.stops.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every stop is a real node with positive minutes', () => {
    const w = buildWalk({ minutes: 60, seed: 9 });
    for (const s of w.stops) {
      expect(nodeBy(s.id), s.id).toBeTruthy();
      expect(s.minutes).toBeGreaterThan(0);
    }
  });

  it('marks jumps honestly: non-jump stops are graph-adjacent to the previous stop', () => {
    const w = buildWalk({ minutes: 120, seed: 11 });
    for (let i = 1; i < w.stops.length; i++) {
      if (w.stops[i].jump) continue;
      expect(neighborsOf(w.stops[i - 1].id), `${w.stops[i - 1].id} -> ${w.stops[i].id}`).toContain(w.stops[i].id);
    }
  });

  it('starts at the requested start node', () => {
    const w = buildWalk({ minutes: 30, startId: 'ds-dynamodb', seed: 5 });
    expect(w.stops[0].id).toBe('ds-dynamodb');
  });

  it('a long walk covers every node at most once and can cover the whole graph', () => {
    const w = buildWalk({ minutes: 10000, seed: 13 });
    expect(w.stops.length).toBeLessThanOrEqual(NODES.length);
    expect(w.stops.length).toBe(NODES.length);
  });

  it('coverage summary groups stops and minutes by type', () => {
    const w = buildWalk({ minutes: 120, seed: 17 });
    const cov = walkCoverage(w);
    const stops = Object.values(cov).reduce((a, c) => a + c.stops, 0);
    const minutes = Object.values(cov).reduce((a, c) => a + c.minutes, 0);
    expect(stops).toBe(w.stops.length);
    expect(minutes).toBe(w.totalMinutes);
  });
});
