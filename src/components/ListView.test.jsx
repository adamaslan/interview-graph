import React from "react";
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ListView from './ListView';
import { SOLUTION_CONVERSATION_IDS } from '../data/solutionsData';
import { nodeBy } from '../data/graphData';
describe('stakeholder-first study list', () => {
  it('puts the conversation route before technical depth even when anchors have more links', () => {
    const html = renderToStaticMarkup(<ListView layer="solutions" />);
    const labels = SOLUTION_CONVERSATION_IDS.map(id => nodeBy(id).label);
    for (let i = 1; i < labels.length; i++) expect(html.indexOf(labels[i])).toBeGreaterThan(html.indexOf(labels[i-1]));
    expect(html.indexOf('Technical detail and delivery practice')).toBeGreaterThan(html.indexOf(labels.at(-1)));
    expect(html.indexOf('data-api')).toBeGreaterThan(html.indexOf('Technical detail and delivery practice'));
  });
  it('does not add stakeholder headings to other layers', () => {
    const html = renderToStaticMarkup(<ListView layer="estate" />);
    expect(html).not.toContain('Start with the stakeholder');
    expect(html).not.toContain('Technical detail and delivery practice');
  });

  it('shows the same Python topic members as the graph layer', () => {
    const html = renderToStaticMarkup(<ListView layer="python" topic="concurrency" />);
    expect(html).toContain('The GIL, precisely');
    expect(html).not.toContain('Core syntax');
  });
});
