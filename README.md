# Interview Graph App

An interactive force-directed graph of a GCP + Vercel + AWS + GitHub Actions estate,
built to train one skill: **talking like an expert for two hours.**

React, D3, Vite. Nodes are running things (services, frontends, datastores, schedulers);
edges are the relationships (deploys-to, triggers, stores-in, aws-equivalent-is,
caused-by, fixed-by); every node carries talking points written to be spoken -
claim, mechanism, a number, a trade-off. Service and repo names are genericized;
the patterns, incidents, and lessons are real.

## Why a graph

Fluency is not flashcards. A two-hour expert conversation is a walk across a
system you know: from the frontend to the proxy to the service to the cache to
the cron that fills it, with a failure story and an AWS translation at each
hop. This app makes that walk literal.

## Using it

- **Layers** (Estate, Depth, Incidents, AWS map, GHA, Practice, All) keep the
  72-node graph readable. Start on Estate.
- **Click a node** for its panel: summary, talking points, evidence, and
  clickable connections to walk to next.
- **Self-test** blurs the talking points. Cover, speak out loud, click to
  check. Silent reading does not transfer to speaking - say it.
- **Start 2h walk** builds a timed 120-minute path through the graph
  (hub-first, deterministic per seed). Prev/Next steps through it; each stop
  shows its minute budget. That is the talk-through.
- **Practice layer** is the live-coding wing: Python reps (a RunBudget
  dataclass, mem-cache FIFO to LRU, calendar edge cases, FIFO cost basis,
  OIDC verify, yearly subcollections). Each rep has a prompt, file paths, a
  timebox, a timer, and debug twists to add live.
- Drag nodes to pin them (persists per layer); Spread slider loosens the
  layout; List view is the keyboard-first search path.

## Run it

```bash
npm ci
npm run dev      # local dev server
npm test         # vitest: graph integrity + walk logic
npm run lint     # oxlint
npm run build    # production build to dist/
npm run preview  # serve the production build
```

CI (`.github/workflows/pr-build.yml`) runs lint, tests, and build on every PR
and push to main.
