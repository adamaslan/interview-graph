import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { EDGE_KINDS, TYPE_LABELS, edgesFor, nodeBy } from '../data/graphData';

/**
 * The detail panel. Talking points are written to be spoken. Self-test mode
 * blurs them until you reveal each one - cover, speak, check.
 */

/** One multiple-choice question. Answering locks the choices and shows why. */
function QuizItem({ item, index }) {
  const [picked, setPicked] = useState(null);
  const answered = picked !== null;
  return (
    <div className={index > 0 ? 'mt-3' : 'mt-2'}>
      <p className="text-sm font-medium leading-snug">{index + 1}. {item.q}</p>
      <div className="mt-1 flex flex-col gap-1">
        {item.choices.map((choice, ci) => {
          const isAnswer = ci === item.answer;
          const isPicked = ci === picked;
          let style = {};
          if (answered && isAnswer) style = { borderColor: 'var(--fam-infra)', color: 'var(--fam-infra)', fontWeight: 600, opacity: 1 };
          else if (answered && isPicked) style = { borderColor: 'var(--fam-fire)', color: 'var(--fam-fire)', opacity: 1 };
          else if (answered) style = { opacity: 0.55 };
          return (
            <button key={ci} type="button" className="ctl text-left" style={style}
              disabled={answered} onClick={() => setPicked(ci)}>
              {choice}
            </button>
          );
        })}
      </div>
      {answered && (
        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          {picked === item.answer ? 'Correct. ' : 'Not quite. '}{item.why}
        </p>
      )}
    </div>
  );
}

export default function NodePanel({ nodeId, onSelect, onClose }) {
  const node = nodeBy(nodeId);
  const [selfTest, setSelfTest] = useState(false);
  const [revealed, setRevealed] = useState(new Set());
  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => { setRevealed(new Set()); setSecondsLeft(null); }, [nodeId]);

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const edges = useMemo(() => (node ? edgesFor(node.id) : []), [node]);

  if (!node) return null;
  const isExercise = node.type === 'exercise';

  const mm = String(Math.floor((secondsLeft ?? 0) / 60)).padStart(2, '0');
  const ss = String((secondsLeft ?? 0) % 60).padStart(2, '0');

  return (
    <aside className="panel-scroll flex h-full w-full flex-col gap-3 overflow-y-auto border-l p-4"
      style={{ borderColor: 'var(--line)', background: 'var(--paper-raised)' }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="chip">{TYPE_LABELS[node.type] ?? node.type}</span>
          <h2 className="mt-1 text-lg font-semibold leading-tight">{node.label}</h2>
        </div>
        <button className="ctl" onClick={onClose} aria-label="Close panel">x</button>
      </div>

      <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>{node.summary}</p>

      {isExercise && (
        <section className="rounded-md border p-3" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">The rep</h3>
            <span className="chip">{node.timeboxMin} min</span>
          </div>
          <p className="mt-1 text-sm leading-relaxed">{node.prompt}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {node.files.map(f => <code key={f} className="chip mono">{f}</code>)}
          </div>
          <div className="mt-3 flex items-center gap-2">
            {secondsLeft === null ? (
              <button className="ctl" onClick={() => setSecondsLeft(node.timeboxMin * 60)}>Start timer</button>
            ) : (
              <>
                <span className="mono text-lg" aria-live="polite">{mm}:{ss}</span>
                <button className="ctl" onClick={() => setSecondsLeft(null)}>Reset</button>
                {secondsLeft === 0 && <span className="text-sm" style={{ color: 'var(--fam-fire)' }}>Time. Say what you would do next.</span>}
              </>
            )}
          </div>
          {node.skills?.length > 0 && (
            <p className="mt-2 text-xs" style={{ color: 'var(--ink-soft)' }}>
              Trains: {node.skills.join(' · ')}
            </p>
          )}
        </section>
      )}

      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Talking points</h3>
          <button className={`ctl ${selfTest ? 'active' : ''}`} onClick={() => setSelfTest(v => !v)}
            title="Blur the points until you reveal each one - cover, speak, check">
            {selfTest ? 'Self-test on' : 'Self-test'}
          </button>
        </div>
        <ol className="mt-2 flex list-decimal flex-col gap-2 pl-5">
          {(node.talkingPoints ?? []).map((tp, i) => {
            const hidden = selfTest && !revealed.has(i);
            return (
              <li key={i} className="text-sm leading-relaxed">
                {hidden ? (
                  <button type="button" className="tp-hidden text-left"
                    onClick={() => setRevealed(r => new Set(r).add(i))}
                    title="Speak first, then click to check">
                    {tp}
                  </button>
                ) : tp}
              </li>
            );
          })}
        </ol>
      </section>

      {node.quiz?.length > 0 && (
        <section className="rounded-md border p-3" style={{ borderColor: 'var(--line)' }}>
          <h3 className="text-sm font-semibold">Quick check</h3>
          <p className="mt-1 text-xs" style={{ color: 'var(--ink-soft)' }}>Answer out loud first, then click.</p>
          {node.quiz.map((item, qi) => (
            <QuizItem key={`${node.id}-${qi}`} item={item} index={qi} />
          ))}
        </section>
      )}

      {isExercise && node.twists?.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold">Debug twists (add these live)</h3>
          <ul className="mt-1 flex list-disc flex-col gap-1 pl-5">
            {node.twists.map((t, i) => <li key={i} className="text-sm leading-relaxed">{t}</li>)}
          </ul>
        </section>
      )}

      {node.sources?.length > 0 && (
        <section><h3 className="text-sm font-semibold">Public references and study scope</h3>
          <p className="text-xs">Original practice exercises with public background references. Not a reproduced job description, exact requisition claim or company endorsement. Technical examples do not imply a company uses that stack.</p>
          <ul>{node.sources.map(s => <li key={s.url}><a className="underline text-sm" href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>)}</ul>
        </section>
      )}
      {node.evidence?.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold">Evidence</h3>
          <div className="mt-1 flex flex-wrap gap-1">
            {node.evidence.map(e => <code key={e} className="chip mono">{e}</code>)}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-sm font-semibold">Connections</h3>
        <div className="mt-1 flex flex-wrap gap-1">
          {edges.map((e, i) => {
            const other = nodeBy(e.other);
            if (!other) return null;
            const verb = EDGE_KINDS[e.kind] ?? e.kind;
            return (
              <button key={i} className="chip clickable" onClick={() => onSelect(other.id)}
                title={`${node.label} ${verb} ${other.label}`}>
                {e.direction === 'out' ? '→' : '←'} {verb} · {other.label}
              </button>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
