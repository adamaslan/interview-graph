import { describe, it, expect } from 'vitest';
import { SOLUTION_NODES, SOLUTION_EDGES, SOLUTION_IDS, SOLUTION_CONVERSATION_IDS } from './solutionsData';
import { layerGraph, nodeBy, edgesFor } from './graphData';
import { NODES as BASE_NODES } from './baseData';
describe('66degrees public study bridge', () => {
  it('has eighteen sourced study nodes and eight existing technical anchors', () => {
    expect(SOLUTION_NODES).toHaveLength(18);
    const anchors = SOLUTION_IDS.filter(id => !id.startsWith('s-'));
    expect(anchors).toHaveLength(8);
    for (const id of anchors) expect(BASE_NODES.some(n => n.id === id)).toBe(true);
    for (const n of SOLUTION_NODES) {
      expect(n.sources).toHaveLength(1);
      expect(n.talkingPoints.length).toBeGreaterThanOrEqual(3);
      expect(n.sources.every(s => s.url.startsWith('https://'))).toBe(true);
      expect(edgesFor(n.id).length).toBeGreaterThan(0);
    }
  });
  it('covers judgment, adoption, mentoring and production trade-offs as practice', () => {
    for (const id of ['s-judgment', 's-workspace', 's-agents', 's-operations', 's-mentoring']) {
      expect(nodeBy(id).quiz[0].choices).toHaveLength(4);
      expect(nodeBy(id).quiz[0].why.length).toBeGreaterThan(30);
    }
    expect(nodeBy('s-66degrees').summary).toContain('hypothetical practice');
    expect(nodeBy('s-workspace').sources[0].url).toBe('https://developers.google.com/workspace/guides/auth-overview');
  });
  it('starts with a distinct stakeholder conversation route', () => {
    expect(SOLUTION_CONVERSATION_IDS).toEqual(['s-66degrees', 's-discovery', 's-trust', 's-judgment', 's-adoption', 's-questions']);
    for (const id of SOLUTION_CONVERSATION_IDS) expect(nodeBy(id).type).toBe('solution');
    expect(nodeBy('s-questions').summary).toContain('scaffolding');
  });
  it('uses the same curated membership for graph and list, without unrelated nodes', () => {
    const { nodes, edges } = layerGraph('solutions');
    expect(nodes.map(n => n.id).sort()).toEqual([...SOLUTION_IDS].sort());
    expect(nodes).toHaveLength(26);
    for (const e of SOLUTION_EDGES) expect(edges).toContainEqual(e);
    expect(nodes.some(n => n.id === 'fe-main-site')).toBe(false);
  });
  it('adds a discovery-to-production path that stays honest about evidence', () => {
    for (const id of ['s-pipeline', 's-gate-first', 's-feedback', 's-explain']) {
      expect(nodeBy(id).type).toBe('solution');
      expect(nodeBy(id).quiz[0].choices).toHaveLength(4);
    }
    expect(nodeBy('s-pipeline').talkingPoints.join(' ')).toContain('self-directed projects');
    expect(nodeBy('s-gate-first').talkingPoints.join(' ')).toContain('Do not present it as advice');
    expect(nodeBy('s-feedback').talkingPoints.join(' ')).toContain('do not show the measurements improved a business outcome');
    for (const id of ['s-pipeline', 's-gate-first', 's-feedback', 's-explain']) {
      expect(nodeBy(id).sources[0].url).toBe('https://tastytechbytes.com/');
    }
  });
  it('has no dangling bridge edge and keeps the company work hypothetical', () => {
    for (const e of SOLUTION_EDGES) { expect(nodeBy(e.source)).toBeTruthy(); expect(nodeBy(e.target)).toBeTruthy(); }
    expect(nodeBy('s-66degrees').summary).toContain('not claims of work performed');
    expect(nodeBy('s-questions').talkingPoints.join(' ')).toContain('exact requisition');
  });
});
