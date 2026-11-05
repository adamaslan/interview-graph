import { describe, it, expect } from 'vitest';
import { PYTHON_NODES, PYTHON_EDGES, PYTHON_TOPICS } from './pythonData';
import { layerGraph, nodeBy } from './graphData';

describe('python fundamentals set', () => {
  it('contains exactly 150 nodes', () => {
    expect(PYTHON_NODES.length).toBe(150);
  });

  it('has ten topics of fifteen nodes each, all labeled', () => {
    expect(PYTHON_TOPICS.length).toBe(10);
    for (const t of PYTHON_TOPICS) {
      const inTopic = PYTHON_NODES.filter(n => n.topic === t.id);
      expect(inTopic.length, `topic ${t.id}`).toBe(15);
      expect(t.label.length).toBeGreaterThan(3);
    }
  });

  it('every python node is reachable through edges (no orphans)', () => {
    const touched = new Set();
    for (const e of PYTHON_EDGES) { touched.add(e.source); touched.add(e.target); }
    for (const n of PYTHON_NODES) expect(touched.has(n.id), `${n.id} orphaned`).toBe(true);
  });

  it('the python subgraph is one connected component', () => {
    const adj = new Map(PYTHON_NODES.map(n => [n.id, []]));
    for (const e of PYTHON_EDGES) {
      if (adj.has(e.source) && adj.has(e.target)) {
        adj.get(e.source).push(e.target);
        adj.get(e.target).push(e.source);
      }
    }
    const seen = new Set([PYTHON_NODES[0].id]);
    const queue = [PYTHON_NODES[0].id];
    while (queue.length) {
      for (const next of adj.get(queue.pop())) {
        if (!seen.has(next)) { seen.add(next); queue.push(next); }
      }
    }
    expect(seen.size).toBe(PYTHON_NODES.length);
  });

  it('topic chains use builds_on and reference real nodes', () => {
    const chains = PYTHON_EDGES.filter(e => e.kind === 'builds_on');
    expect(chains.length).toBe(140);
    for (const e of PYTHON_EDGES) {
      expect(nodeBy(e.source), e.source).toBeTruthy();
      expect(nodeBy(e.target), e.target).toBeTruthy();
    }
  });

  it('the Python layer exposes all topics and the topic filter narrows it', () => {
    const full = layerGraph('python', 'all');
    expect(full.nodes.filter(n => n.type === 'python').length).toBe(150);
    for (const t of PYTHON_TOPICS) {
      const { nodes } = layerGraph('python', t.id);
      const py = nodes.filter(n => n.type === 'python');
      expect(py.length, `topic ${t.id} in layer`).toBe(15);
      expect(py.every(n => n.topic === t.id)).toBe(true);
      const visible = new Set(nodes.map(n => n.id));
      const { edges } = layerGraph('python', t.id);
      for (const e of edges) {
        expect(visible.has(e.source) && visible.has(e.target)).toBe(true);
      }
    }
  });

  it('anchors fundamentals to the estate: practice reps and concepts', () => {
    const anchors = PYTHON_EDGES.filter(e => e.kind === 'relates_to'
      && (e.target.startsWith('x-') || e.target.startsWith('c-')));
    expect(anchors.length).toBeGreaterThanOrEqual(8);
  });
});
