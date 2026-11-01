import { describe, it, expect } from 'vitest';
import {
  NODES, EDGES, LAYERS, EDGE_KINDS, TYPE_COLORS, TYPE_SHAPES, TYPE_LABELS,
  nodeBy, edgesFor, layerGraph,
} from './graphData';

describe('graph data integrity', () => {
  it('has unique node ids', () => {
    const ids = NODES.map(n => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every edge references existing nodes', () => {
    for (const e of EDGES) {
      expect(nodeBy(e.source), `edge source ${e.source}`).toBeTruthy();
      expect(nodeBy(e.target), `edge target ${e.target}`).toBeTruthy();
    }
  });

  it('every edge kind has a label', () => {
    for (const e of EDGES) {
      expect(EDGE_KINDS[e.kind], `edge kind ${e.kind}`).toBeTruthy();
    }
  });

  it('every node has a summary and at least one talking point', () => {
    for (const n of NODES) {
      expect(n.summary?.length, `${n.id} summary`).toBeGreaterThan(40);
      expect((n.talkingPoints ?? []).length, `${n.id} talking points`).toBeGreaterThanOrEqual(1);
    }
  });

  it('fluency core: service, concept, incident and datastore nodes carry 3+ talking points', () => {
    for (const n of NODES.filter(n => ['service', 'concept', 'incident', 'datastore', 'scheduler'].includes(n.type))) {
      expect((n.talkingPoints ?? []).length, `${n.id} should sustain minutes of speech`).toBeGreaterThanOrEqual(3);
    }
  });

  it('every node type has color, shape and label metadata', () => {
    for (const n of NODES) {
      expect(TYPE_COLORS[n.type], `${n.id} type ${n.type} color`).toBeTruthy();
      expect(TYPE_SHAPES[n.type], `${n.id} type ${n.type} shape`).toBeTruthy();
      expect(TYPE_LABELS[n.type], `${n.id} type ${n.type} label`).toBeTruthy();
    }
  });

  it('every node appears in at least one layer beyond All', () => {
    const covered = new Set();
    for (const l of LAYERS.filter(l => l.id !== 'all')) {
      for (const t of l.types) covered.add(t);
    }
    for (const n of NODES) {
      expect(covered.has(n.type), `${n.id} type ${n.type} in some layer`).toBe(true);
    }
  });

  it('layers only reference known types', () => {
    for (const l of LAYERS) {
      for (const t of l.types) expect(TYPE_COLORS[t], `layer ${l.id} type ${t}`).toBeTruthy();
    }
  });

  it('every AWS node has at least one aws_equivalent_is edge', () => {
    for (const n of NODES.filter(n => n.type === 'aws')) {
      const hit = EDGES.some(e => e.kind === 'aws_equivalent_is' && (e.source === n.id || e.target === n.id));
      expect(hit, `${n.id} needs an aws_equivalent_is edge`).toBe(true);
    }
  });

  it('every incident connects to its cause, fix, or subject', () => {
    for (const n of NODES.filter(n => n.type === 'incident')) {
      const hit = edgesFor(n.id).some(e => ['caused_by', 'fixed_by', 'mitigated_by', 'relates_to'].includes(e.kind));
      expect(hit, `${n.id} incident needs a cause/fix/subject edge`).toBe(true);
    }
  });

  it('every exercise is fully specified and practices a real node', () => {
    for (const n of NODES.filter(n => n.type === 'exercise')) {
      expect(n.prompt?.length, `${n.id} prompt`).toBeGreaterThan(40);
      expect(n.timeboxMin, `${n.id} timebox`).toBeGreaterThanOrEqual(10);
      expect(n.files?.length, `${n.id} files`).toBeGreaterThanOrEqual(1);
      expect(n.twists?.length, `${n.id} twists`).toBeGreaterThanOrEqual(2);
      expect(n.skills?.length, `${n.id} skills`).toBeGreaterThanOrEqual(2);
      const hit = EDGES.some(e => e.kind === 'practices_on' && e.source === n.id);
      expect(hit, `${n.id} practices_on edge`).toBe(true);
    }
  });

  it('exercise file references point at real repos from the estate', () => {
    for (const n of NODES.filter(n => n.type === 'exercise')) {
      for (const f of n.files) {
        expect(f, `${n.id} file ${f} should be repo/path`).toMatch(/^(quotes-api|ledger-app|mcp-engine|news-portal|project-wiki|web-app|mobile-app)\//);
      }
    }
  });

  it('layerGraph returns only edges with both ends visible', () => {
    for (const l of LAYERS) {
      const { nodes, edges } = layerGraph(l.id);
      const visible = new Set(nodes.map(n => n.id));
      for (const e of edges) {
        expect(visible.has(e.source)).toBe(true);
        expect(visible.has(e.target)).toBe(true);
      }
    }
  });

  it('the estate layer is fully connected (one component)', () => {
    const { nodes, edges } = layerGraph('estate');
    const adj = new Map(nodes.map(n => [n.id, []]));
    for (const e of edges) {
      adj.get(e.source).push(e.target);
      adj.get(e.target).push(e.source);
    }
    const seen = new Set([nodes[0].id]);
    const queue = [nodes[0].id];
    while (queue.length) {
      const id = queue.pop();
      for (const next of adj.get(id)) {
        if (!seen.has(next)) { seen.add(next); queue.push(next); }
      }
    }
    expect(seen.size).toBe(nodes.length);
  });
});
