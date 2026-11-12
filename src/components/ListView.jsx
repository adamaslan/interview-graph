import React from "react";
import { useMemo, useState } from 'react';
import { SOLUTION_CONVERSATION_IDS } from '../data/solutionsData';
import { NODES, DEGREE, TYPE_LABELS, TOPIC_LABELS, layerGraph } from '../data/graphData';

/** Searchable list of every node - the keyboard-first path into the graph. */
export default function ListView({ layer = 'all', topic = 'all', onSelect, selectedId }) {
  const [query, setQuery] = useState('');

  const stakeholderLayer = layer === 'solutions';
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = new Set(layerGraph(layer, topic).nodes.map(n => n.id));
    return NODES
      .filter(n => visible.has(n.id))
      .filter(n => !q
        || n.label.toLowerCase().includes(q)
        || n.summary.toLowerCase().includes(q)
        || (n.talkingPoints ?? []).some(tp => tp.toLowerCase().includes(q)))
      .sort((a, b) => {
        if (stakeholderLayer) {
          const ai = SOLUTION_CONVERSATION_IDS.indexOf(a.id);
          const bi = SOLUTION_CONVERSATION_IDS.indexOf(b.id);
          if (ai >= 0 || bi >= 0) return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
        }
        return (DEGREE.get(b.id) ?? 0) - (DEGREE.get(a.id) ?? 0);
      });
  }, [query, layer, stakeholderLayer, topic]);

  return (
    <div className="panel-scroll h-full overflow-y-auto p-4">
      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search nodes, talking points..."
        aria-label="Search nodes"
        className="mb-3 w-full rounded-md border px-3 py-2 text-sm"
        style={{ borderColor: 'var(--line)', background: 'var(--paper-raised)', color: 'var(--ink)' }}
      />
      {stakeholderLayer && <section className="mb-3 text-sm" aria-label="Conversation route">
        <h2 className="font-semibold">Start with the stakeholder</h2>
        <p>Discovery, trust, trade-offs, adoption and outcomes first. Engineering details are supporting depth.</p>
      </section>}
      <ul className="flex flex-col gap-1">
        {rows.map(n => (
          <li key={n.id}>
            {stakeholderLayer && n.id === rows.find(row => !SOLUTION_CONVERSATION_IDS.includes(row.id))?.id && (
              <h2 className="mb-2 mt-4 text-sm font-semibold">Technical detail and delivery practice</h2>
            )}
            <button
              className="w-full rounded-md border px-3 py-2 text-left"
              style={{
                borderColor: n.id === selectedId ? 'var(--ink)' : 'var(--line)',
                background: 'var(--paper-raised)',
              }}
              onClick={() => onSelect(n.id)}>
              <span className="text-sm font-medium">{n.label}</span>
              <span className="chip ml-2">{TYPE_LABELS[n.type] ?? n.type}</span>
              {n.topic && <span className="chip ml-2">{TOPIC_LABELS[n.topic] ?? n.topic}</span>}
              <span className="ml-2 text-xs" style={{ color: 'var(--ink-faint)' }}>{DEGREE.get(n.id) ?? 0} links</span>
              <p className="mt-1 line-clamp-2 text-xs" style={{ color: 'var(--ink-soft)' }}>{n.summary}</p>
            </button>
          </li>
        ))}
      </ul>
      {rows.length === 0 && <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>No matches.</p>}
    </div>
  );
}
