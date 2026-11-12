import { useMemo, useState } from 'react';
import { LAYERS, nodeBy } from './data/graphData';
import { LAYOUT_PRESETS, SPREAD_MIN, SPREAD_MAX, SPREAD_DEFAULT } from './graph/forces';
import { loadSpread, saveSpread } from './graph/pins';
import { buildWalk } from './walk';
import GraphView from './components/GraphView';
import NodePanel from './components/NodePanel';
import ListView from './components/ListView';
import { useMediaQuery } from './hooks';

export default function App() {
  const [layer, setLayer] = useState('estate');
  const [preset, setPreset] = useState('free');
  const [spread, setSpread] = useState(() => loadSpread(SPREAD_DEFAULT));
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState('graph');
  const [walk, setWalk] = useState(null);
  const [walkIndex, setWalkIndex] = useState(0);
  const narrow = useMediaQuery('(max-width: 760px)');

  const layerTypes = useMemo(
    () => new Set((LAYERS.find(l => l.id === layer) ?? LAYERS[0]).types),
    [layer]);

  function changeSpread(v) {
    setSpread(v);
    saveSpread(v);
  }

  function startWalk() {
    const w = buildWalk({ minutes: 120, startId: 'fe-main-site', seed: Date.now() % 100000 });
    setWalk(w);
    setWalkIndex(0);
    if (w.stops.length > 0) setSelectedId(w.stops[0].id);
  }

  function walkStep(delta) {
    if (!walk) return;
    const next = Math.min(walk.stops.length - 1, Math.max(0, walkIndex + delta));
    setWalkIndex(next);
    setSelectedId(walk.stops[next].id);
  }

  const walkStop = walk?.stops[walkIndex];
  const walkElapsed = walk ? walk.stops.slice(0, walkIndex).reduce((a, s) => a + s.minutes, 0) : 0;

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b px-3 py-2"
        style={{ borderColor: 'var(--line)' }}>
        <h1 className="mr-2 text-base font-semibold">Interview graph</h1>

        <nav className="flex flex-wrap gap-1" aria-label="Layers">
          {LAYERS.map(l => (
            <button key={l.id} className={`ctl ${layer === l.id ? 'active' : ''}`}
              onClick={() => { setLayer(l.id); if (l.id === 'solutions') { setSelectedId('s-66degrees'); setView('list'); } }}>{l.label}</button>
          ))}
        </nav>

        <span className="mx-1" style={{ color: 'var(--line)' }}>|</span>

        <nav className="flex gap-1" aria-label="Layout">
          {LAYOUT_PRESETS.map(p => (
            <button key={p.id} className={`ctl ${preset === p.id ? 'active' : ''}`}
              onClick={() => setPreset(p.id)}>{p.label}</button>
          ))}
        </nav>

        <label className="flex items-center gap-1 text-xs" style={{ color: 'var(--ink-soft)' }}>
          Spread
          <input type="range" min={SPREAD_MIN} max={SPREAD_MAX} step={0.1} value={spread}
            onChange={e => changeSpread(Number(e.target.value))} aria-label="Spread" />
        </label>

        <span className="mx-1" style={{ color: 'var(--line)' }}>|</span>

        <button className={`ctl ${view === 'graph' ? 'active' : ''}`} onClick={() => setView('graph')}>Graph</button>
        <button className={`ctl ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>List</button>

        <span className="mx-1" style={{ color: 'var(--line)' }}>|</span>

        {walk ? (
          <div className="flex items-center gap-1" aria-label="Session walk">
            <button className="ctl" onClick={() => walkStep(-1)} disabled={walkIndex === 0}>Prev</button>
            <span className="text-xs" style={{ color: 'var(--ink-soft)' }}>
              {walkIndex + 1}/{walk.stops.length} · {walkElapsed}–{walkElapsed + (walkStop?.minutes ?? 0)} min
              {walkStop ? ` · ${nodeBy(walkStop.id)?.label ?? ''}` : ''}
            </span>
            <button className="ctl" onClick={() => walkStep(1)} disabled={walkIndex >= walk.stops.length - 1}>Next</button>
            <button className="ctl" onClick={() => setWalk(null)}>End</button>
          </div>
        ) : (
          <button className="ctl" onClick={startWalk}
            title="Build a 120-minute walk through the graph - your out-loud talk-through">
            Start 2h walk
          </button>
        )}
      </header>

      <main className={`flex min-h-0 flex-1 ${narrow ? 'flex-col' : 'flex-row'}`}>
        <div className="min-h-0 min-w-0 flex-1">
          {view === 'graph' ? (
            <GraphView
              layer={layer}
              preset={preset}
              spread={spread}
              selectedId={selectedId}
              onSelect={setSelectedId}
              walkIds={walk?.stops.map(s => s.id)}
            />
          ) : (
            <ListView nodeIds={LAYERS.find(l => l.id === layer)?.nodeIds} layerTypes={layerTypes} onSelect={setSelectedId} selectedId={selectedId} />
          )}
        </div>
        {selectedId && (
          <div className={narrow ? 'max-h-[55%] border-t' : 'w-[380px] shrink-0'}
            style={{ borderColor: 'var(--line)' }}>
            <NodePanel key={selectedId} nodeId={selectedId} onSelect={setSelectedId} onClose={() => setSelectedId(null)} />
          </div>
        )}
      </main>
    </div>
  );
}
