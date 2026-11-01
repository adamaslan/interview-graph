import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { DEGREE, TYPE_COLORS, TYPE_SHAPES, layerGraph } from '../data/graphData';
import { createSimulation, applySpacing } from '../graph/forces';
import { loadPins, savePins, clearPins } from '../graph/pins';

const radiusOf = d => 6 + Math.sqrt(DEGREE.get(d.id) ?? 0) * 2;

/** Diamond path for a node of radius r at (0,0). */
const diamond = r => `M 0 ${-r} L ${r} 0 L 0 ${r} L ${-r} 0 Z`;

/**
 * The force-directed graph. Selection has three tiers with no glow:
 * the selected node is full ink, its neighbors are mid, everything else fades.
 */
export default function GraphView({ layer, preset, spread, selectedId, onSelect, walkIds }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const simRef = useRef(null);
  const nodesRef = useRef([]);
  const [, setTick] = useState(0);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const labelMinDegree = 4;

  const { nodes, edges } = useMemo(() => layerGraph(layer), [layer]);
  const walkSet = useMemo(() => new Set(walkIds ?? []), [walkIds]);

  // Track container size.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSize({ width: Math.max(320, width), height: Math.max(320, height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // (Re)build the simulation when the layer, preset or size changes.
  useEffect(() => {
    const pins = loadPins(layer, preset);
    const simNodes = nodes.map(n => {
      const pin = pins.get(n.id);
      return {
        ...n,
        x: pin?.x ?? size.width / 2 + (Math.random() - 0.5) * 200,
        y: pin?.y ?? size.height / 2 + (Math.random() - 0.5) * 200,
        ...(pin ? { fx: pin.x, fy: pin.y } : {}),
      };
    });
    const simEdges = edges.map(e => ({ ...e }));
    nodesRef.current = simNodes;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sim = createSimulation(simNodes, simEdges, {
      width: size.width, height: size.height, spread, preset,
      radiusOf, labelMinDegree,
    });
    simRef.current = sim;
    if (reduced) sim.alphaTarget(0).alpha(0.3);

    sim.on('tick', () => {
      // Keep nodes inside the viewport on narrow screens; pinned nodes stay put.
      for (const d of simNodes) {
        const r = radiusOf(d);
        if (d.fx == null) {
          // Keep a permanently shown label inside the viewport too: cap x so the
          // right-anchored label fits (the render falls back to a left anchor).
          const showLabel = (DEGREE.get(d.id) ?? 0) >= labelMinDegree;
          const labelW = showLabel ? d.label.length * 6 : 0;
          let maxX = size.width - r - 4;
          const fitMaxX = size.width - 2 - r - 5 - labelW;
          if (labelW && fitMaxX >= r + 4) maxX = fitMaxX; // reserve label room when it can fit
          d.x = Math.min(Math.max(d.x, r + 4), Math.max(r + 4, maxX));
        }
        if (d.fy == null) d.y = Math.min(Math.max(d.y, r + 4), size.height - r - 4);
      }
      setTick(t => t + 1);
    });

    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom()
      .scaleExtent([0.3, 4])
      .on('zoom', event => {
        svg.select('g.viewport').attr('transform', event.transform);
      });
    svg.call(zoom);

    return () => { sim.stop(); svg.on('.zoom', null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer, preset, size.width, size.height]);

  // Live-retune spacing on spread change without rebuilding.
  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    applySpacing(sim, { spread, radiusOf, labelMinDegree });
    sim.alpha(0.3).restart();
  }, [spread]);

  const simNodes = nodesRef.current;
  const nodeEls = new Map();

  const neighborIds = useMemo(() => {
    if (!selectedId) return new Set();
    const set = new Set([selectedId]);
    for (const e of edges) {
      const s = typeof e.source === 'object' ? e.source.id : e.source;
      const t = typeof e.target === 'object' ? e.target.id : e.target;
      if (s === selectedId) set.add(t);
      if (t === selectedId) set.add(s);
    }
    return set;
  }, [selectedId, edges]);

  function tier(id) {
    if (!selectedId) return walkSet.has(id) ? 2 : 1;
    if (id === selectedId) return 3;
    if (neighborIds.has(id)) return 2;
    return 0;
  }

  const opacityFor = t => (t === 3 || t === 2 ? 1 : t === 1 ? 0.85 : 0.18);

  function onDragStart(event, d) {
    if (!event.active) simRef.current?.alphaTarget(0.3).restart();
    d.fx = d.x; d.fy = d.y;
  }
  function onDrag(event, d) {
    d.fx = event.x; d.fy = event.y;
  }
  function onDragEnd(event, d) {
    if (!event.active) simRef.current?.alphaTarget(0);
    // The pin persists: dragged nodes stay where they are dropped.
    const pins = loadPins(layer, preset);
    pins.set(d.id, { x: d.fx, y: d.fy });
    savePins(layer, preset, pins);
  }

  function unpinAll() {
    clearPins(layer, preset);
    for (const n of nodesRef.current) { n.fx = null; n.fy = null; }
    simRef.current?.alpha(0.5).restart();
    setTick(t => t + 1);
  }

  const simEdges = simRef.current?.force('link')?.links() ?? [];

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <svg ref={svgRef} width={size.width} height={size.height} role="img" aria-label="Interview infrastructure graph">
        <g className="viewport">
          <g>
            {simEdges.map((e, i) => {
              const s = typeof e.source === 'object' ? e.source : simNodes.find(n => n.id === e.source);
              const t = typeof e.target === 'object' ? e.target : simNodes.find(n => n.id === e.target);
              if (!s || !t) return null;
              const hot = selectedId && (s.id === selectedId || t.id === selectedId);
              const dim = selectedId && !hot;
              return (
                <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                  className={`edge-line ${hot ? 'hot' : ''} ${dim ? 'dim' : ''}`}
                  strokeWidth={hot ? 1.8 : 1} />
              );
            })}
          </g>
          <g>
            {simNodes.map(d => {
              const t = tier(d.id);
              const r = radiusOf(d);
              const shape = TYPE_SHAPES[d.type] ?? 'circle';
              const color = TYPE_COLORS[d.type] ?? 'var(--ink-soft)';
              const common = {
                className: 'graph-node',
                transform: `translate(${d.x ?? 0}, ${d.y ?? 0})`,
                opacity: opacityFor(t),
                tabIndex: 0,
                role: 'button',
                'aria-label': `${d.label} (${d.type})`,
                onClick: () => onSelect(d.id),
                onKeyDown: ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onSelect(d.id); } },
              };
              const drag = d3.drag()
                .on('start', (event) => onDragStart(event, d))
                .on('drag', (event) => onDrag(event, d))
                .on('end', (event) => onDragEnd(event, d));
              return (
                <g key={d.id} {...common}
                  ref={el => {
                    if (el) { d3.select(el).call(drag); nodeEls.set(d.id, el); }
                  }}>
                  {shape === 'circle' && (
                    <circle r={r} fill={color}
                      stroke={t === 3 ? 'var(--select-1)' : 'var(--paper)'}
                      strokeWidth={t === 3 ? 2.5 : 1.5} />
                  )}
                  {shape === 'square' && (
                    <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={2} fill={color}
                      stroke={t === 3 ? 'var(--select-1)' : 'var(--paper)'}
                      strokeWidth={t === 3 ? 2.5 : 1.5} />
                  )}
                  {shape === 'diamond' && (
                    <polygon points={diamond(r + 1)} fill={color}
                      stroke={t === 3 ? 'var(--select-1)' : 'var(--paper)'}
                      strokeWidth={t === 3 ? 2.5 : 1.5} />
                  )}
                  {walkSet.has(d.id) && !selectedId && (
                    <circle r={r + 5} fill="none" stroke="var(--select-2)" strokeWidth={1} strokeDasharray="3 3" />
                  )}
                  {((DEGREE.get(d.id) ?? 0) >= labelMinDegree || t >= 2) && (() => {
                    // Flip the label to the node's left when it would overflow the right edge.
                    const labelW = d.label.length * 6;
                    const flip = (d.x ?? 0) + r + 5 + labelW > size.width - 2;
                    return (
                      <text className="node-label" x={flip ? -(r + 5) : r + 5} y={3}
                        textAnchor={flip ? 'end' : 'start'}>{d.label}</text>
                    );
                  })()}
                </g>
              );
            })}
          </g>
        </g>
      </svg>
      <button className="ctl absolute bottom-3 right-3" onClick={unpinAll} title="Drop all pins and re-layout">
        Unpin all
      </button>
    </div>
  );
}
