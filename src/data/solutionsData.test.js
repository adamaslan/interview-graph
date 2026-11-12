import { describe, it, expect } from 'vitest';
import { SOLUTION_NODES, SOLUTION_EDGES, SOLUTION_IDS } from './solutionsData';
import { layerGraph, nodeBy, edgesFor } from './graphData';
import { NODES as BASE_NODES } from './baseData';
describe('66degrees public study bridge', () => {
  it('has eight sourced study nodes and eight existing technical anchors', () => {
    expect(SOLUTION_NODES).toHaveLength(8);
    const anchors = SOLUTION_IDS.filter(id => !id.startsWith('s-'));
    expect(anchors).toHaveLength(8);
    for (const id of anchors) expect(BASE_NODES.some(n => n.id === id)).toBe(true);
    for (const n of SOLUTION_NODES) {
      expect(n.sources).toHaveLength(2);
      expect(n.talkingPoints.length).toBeGreaterThanOrEqual(3);
      expect(n.sources.every(s => s.url.startsWith('https://'))).toBe(true);
      expect(edgesFor(n.id).length).toBeGreaterThan(0);
    }
  });
  it('uses the same curated membership for graph and list, without unrelated nodes', () => {
    const { nodes, edges } = layerGraph('solutions');
    expect(nodes.map(n => n.id).sort()).toEqual([...SOLUTION_IDS].sort());
    expect(nodes).toHaveLength(16);
    for (const e of SOLUTION_EDGES) expect(edges).toContainEqual(e);
    expect(nodes.some(n => n.id === 'fe-main-site')).toBe(false);
  });
  it('has no dangling bridge edge or private logistics', () => {
    for (const e of SOLUTION_EDGES) { expect(nodeBy(e.source)).toBeTruthy(); expect(nodeBy(e.target)).toBeTruthy(); }
    expect(JSON.stringify(SOLUTION_NODES)).not.toMatch(/Brodric|Cormier|meet\.google|adamtimur|2:00|45 PM|Maria|Piotrowski/i);
    expect(nodeBy('s-66degrees').summary).toContain('not claims of work performed');
    expect(nodeBy('s-questions').talkingPoints.join(' ')).toContain('exact requisition');
  });
});
