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

## 66degrees Solutions/FDE study bridge

Choose **66degrees** in the layer bar. Seventeen study nodes connect to eight existing technical anchors. The internal-workflow practice path covers judgment and prioritization, stakeholder trust, discovery, reusable delivery, responsible AI, Workspace, agent design, evaluation, operating cost, rollout, adoption and mentoring. Graph and List use the same curated 25-node set. This layer opens in List view so its full labels remain readable on phones. Click a connection to move to the concrete engineering pattern; each study node includes talking points, a quick check and public background references. The references support the company themes or technical background, not every hypothetical design choice.

This is preparation material, not an announcement of an interview, an exact requisition match, or a claim that these systems run at 66degrees. The hypothetical brief workflow is explicitly an exercise. No private interview logistics or contacts are published. Existing estate examples and numbers remain illustrative/historical, not current production metrics.

Company source checked November 11, 2026: https://66degrees.com/ . The earlier Greenhouse role link is no longer verifiably live and is not used as a current job-description source. Discussion prompts and design examples are study advice, not confirmed requirements for an opening.

Technical background references: https://developers.google.com/workspace/guides/auth-overview and https://google.github.io/adk-docs/ . Internal workflow scenarios are original exercises, not descriptions of private company systems or a reproduced role document. Frameworks and cloud products are options to compare, not a claim about a company stack.

The 66degrees List opens with an ordered stakeholder conversation: discovery, trust, trade-offs, adoption and outcomes. Technical nodes follow under a separate depth heading; connection buttons put conversation neighbors first. Story prompts are generic scaffolds, not personal accomplishments. Other layers retain their degree-based list order.

## Operator-workflow practice

Three hypothetical nodes connect structured run evidence -> an actionable admin dashboard -> useful email follow-up. They cover partial/missing/stale evidence, access boundaries, safe actions, delivery gaps, duplicate suppression and measures to establish before claiming value. These are public design exercises, not a personal project report or a claim of shipped features, company systems or achieved savings. The stakeholder conversation route remains first; these nodes are supporting depth.

Logging background checked November 12, 2026: https://opentelemetry.io/docs/concepts/signals/logs/ .
