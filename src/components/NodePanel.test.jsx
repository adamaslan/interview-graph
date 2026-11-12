import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import NodePanel from './NodePanel';
import { NODES } from '../data/graphData';

describe('NodePanel quiz rendering', () => {
  it('renders the Quick check section for nodes with quiz items', () => {
    const withQuiz = NODES.filter(n => n.quiz?.length > 0);
    expect(withQuiz.length).toBeGreaterThan(0);
    const html = renderToStaticMarkup(
      <NodePanel nodeId={withQuiz[0].id} onSelect={() => {}} onClose={() => {}} />
    );
    expect(html).toContain('Quick check');
    // one button per choice across all questions of this node
    const totalChoices = withQuiz[0].quiz.reduce((s, item) => s + item.choices.length, 0);
    expect(html.match(/<button/g).length).toBeGreaterThanOrEqual(totalChoices);
  });

  it('every node in the graph carries at least one quick check', () => {
    // The quick checks are how the questions connect all the nodes: coverage is total.
    for (const n of NODES) {
      expect(n.quiz?.length, `${n.id} should have a quick check`).toBeGreaterThanOrEqual(1);
    }
  });

  it('every quiz item is well formed', () => {
    for (const n of NODES.filter(n => n.quiz)) {
      for (const item of n.quiz) {
        expect(item.q.length, `${n.id} quiz question`).toBeGreaterThan(10);
        expect(item.choices.length, `${n.id} quiz choices`).toBe(4);
        expect(item.answer, `${n.id} quiz answer`).toBeGreaterThanOrEqual(0);
        expect(item.answer, `${n.id} quiz answer`).toBeLessThan(item.choices.length);
        expect(item.why.length, `${n.id} quiz why`).toBeGreaterThan(10);
      }
    }
  });

  it('renders self-test mode from parent state so it can survive node remounts', () => {
    const html = renderToStaticMarkup(
      <NodePanel nodeId="py-conc-gil" selfTest onSelfTestChange={() => {}} onSelect={() => {}} onClose={() => {}} />
    );
    expect(html).toContain('Self-test on');
    expect(html).toContain('tp-hidden');
  });
});
