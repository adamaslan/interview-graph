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
export default function GraphView({ layer, topic = 'all', preset, spread, selectedId, onSelect, walkIds }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const simRef = useRef(null);
  const zoomRef = useRef(null);
  const nodesRef = useRef([]);
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;
  const fitRef = useRef(null);
  const [, setTick] = useState(0);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const labelMinDegree = 4;

  const { nodes, edges } = useMemo(() => layerGraph(layer, topic), [layer, topic]);
  const walkSet = useMemo(() => new Set(walkIds ?? []), [walkIds]);
  const walkKey = (walkIds ?? []).join('|');
  const walkRef = useRef(walkSet);
  walkRef.current = walkSet;

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

  // (Re)build the simulation when the layer, topic-filtered graph, preset or size changes.
  useEffect(() => {
    fitRef.current = null;
    const pins = loadPins(layer, preset);
    const prev = new Map(nodesRef.current.map(n => [n.id, n]));
    const simNodes = nodes.map(n => {
      const pin = pins.get(n.id);
      const old = prev.get(n.id);
      // Keep the node's current spot across resizes/rebuilds when it is not pinned.
      const x = pin?.x ?? old?.x ?? size.width / 2 + (Math.random() - 0.5) * 200;
      const y = pin?.y ?? old?.y ?? size.height / 2 + (Math.random() - 0.5) * 200;
      return { ...n, x, y, ...(pin ? { fx: pin.x, fy: pin.y } : {}) };
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

    let fitted = false;
    sim.on('tick', () => {
      // No hard boundary at the world box: a clamped edge reads as a packed
      // rectangular ring on dense layers. The simulation's soft containment
      // force holds the layout near the world; this is only a far backstop
      // against numerical escape. The settle-fit below measures real extents.
      const world = sim.world ?? { w: size.width, h: size.height };
      const BACKSTOP = 250;
      for (const d of simNodes) {
        if (d.fx == null) d.x = Math.min(Math.max(d.x, -BACKSTOP), world.w + BACKSTOP);
        if (d.fy == null) d.y = Math.min(Math.max(d.y, -BACKSTOP), world.h + BACKSTOP);
      }
      // Once the layout settles, zoom to fit so dense layers are all visible.
      if (!fitted && sim.alpha() < 0.08 && simNodes.length > 0) {
        fitted = true;
        fitRef.current = (onlyIfNeeded = false) => {
          // Labels show for hubs plus the selected node and its neighbors - all
          // of those count toward the fit bounds so nothing renders off-canvas.
          const labelled = new Set(walkRef.current);
          for (const d of simNodes) {
            if ((DEGREE.get(d.id) ?? 0) >= labelMinDegree) labelled.add(d.id);
          }
          const sel = selectedRef.current;
          if (sel) {
            labelled.add(sel);
            for (const e of simEdges) {
              const a = typeof e.source === 'object' ? e.source.id : e.source;
              const b = typeof e.target === 'object' ? e.target.id : e.target;
              if (a === sel) labelled.add(b);
              if (b === sel) labelled.add(a);
            }
          }
          const boundsFor = candidates => {
            let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
            for (const d of candidates) {
              const labelW = labelled.has(d.id) ? d.label.length * 6 : 0;
              const r = radiusOf(d);
              // Mirror the render-time flip: a label that would overflow the world
              // edge flips to the node's left.
              const flip = d.x + r + 5 + labelW > world.w - 2;
              x0 = Math.min(x0, d.x - r - (flip && labelW ? labelW + 5 : 0));
              x1 = Math.max(x1, d.x + r + (flip ? 0 : labelW));
              y0 = Math.min(y0, d.y - r); y1 = Math.max(y1, d.y + r);
            }
            return { x0, y0, x1, y1 };
          };
          const { x0, y0, x1, y1 } = boundsFor(simNodes);
          const pad = 30;
          const bw = Math.max(1, x1 - x0 + 2 * pad);
          const bh = Math.max(1, y1 - y0 + 2 * pad);
          const k = Math.max(0.1, Math.min(1, size.width / bw, size.height / bh));
          const tx = (size.width - k * (x0 + x1)) / 2;
          const ty = (size.height - k * (y0 + y1)) / 2;
          if (onlyIfNeeded) {
            // Refit only when a labelled node currently sits outside the view;
            // leave the user's own pan/zoom alone otherwise.
            const t = d3.zoomTransform(svgRef.current);
            const labelledBounds = boundsFor(simNodes.filter(d => labelled.has(d.id)));
            if (!Number.isFinite(labelledBounds.x0)) return;
            const sx0 = t.applyX(labelledBounds.x0) - pad, sx1 = t.applyX(labelledBounds.x1) + pad;
            const sy0 = t.applyY(labelledBounds.y0) - pad, sy1 = t.applyY(labelledBounds.y1) + pad;
            if (sx0 >= 0 && sy0 >= 0 && sx1 <= size.width && sy1 <= size.height) return;
          }
          d3.select(svgRef.current).call(
            zoomRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
        };
        fitRef.current();
      }
      setTick(t => t + 1);
    });

    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', event => {
        svg.select('g.viewport').attr('transform', event.transform);
      });
    zoomRef.current = zoom;
    svg.call(zoom);

    return () => { sim.stop(); fitRef.current = null; svg.on('.zoom', null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer, preset, size.width, size.height, nodes, edges]);

  // Live-retune spacing on spread change without rebuilding.
  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    applySpacing(sim, { spread, radiusOf, labelMinDegree });
    sim.on('end.refit', () => fitRef.current?.());
    sim.alpha(0.3).restart();
  }, [spread]);

  // Selecting a node can reveal neighbor labels that sit outside the current
  // view; refit then, but never hijack a view that already shows them.
  useEffect(() => {
    fitRef.current?.(true);
  }, [selectedId]);

  useEffect(() => {
    fitRef.current?.(true);
  }, [walkKey]);

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
    const sim = simRef.current;
    sim?.on('end.refit', () => fitRef.current?.());
    sim?.alpha(0.5).restart();
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
                    <path d={diamond(r + 1)} fill={color}
                      stroke={t === 3 ? 'var(--select-1)' : 'var(--paper)'}
                      strokeWidth={t === 3 ? 2.5 : 1.5} />
                  )}
                  {walkSet.has(d.id) && !selectedId && (
                    <circle r={r + 5} fill="none" stroke="var(--select-2)" strokeWidth={1} strokeDasharray="3 3" />
                  )}
                  {((DEGREE.get(d.id) ?? 0) >= labelMinDegree || t >= 2) && (() => {
                    // Flip the label to the node's left when it would overflow the right edge.
                    const labelW = d.label.length * 6;
                    const worldW = simRef.current?.world?.w ?? size.width;
                    const flip = (d.x ?? 0) + r + 5 + labelW > worldW - 2;
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
