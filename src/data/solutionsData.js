// Public study material only. No interview logistics, contacts or private application data.
const company = 'https://66degrees.com/';
const source = [{ label: '66degrees company site', url: company }];
function node(id, label, summary, talkingPoints, q, choices, why) {
  return { id, type: 'solution', label, summary, talkingPoints, sources: source,
    quiz: [{ q, choices, answer: 0, why }] };
}
export const SOLUTION_NODES = [
  node('s-66degrees', '66degrees: solutions to production',
    'A company-specific study bridge: discovery, full-stack delivery, evaluation and adoption. The company describes embedded engineers working on real business workflows; the internal/client mix of any particular opening must be confirmed. These are practice connections, not claims of work performed for 66degrees.', [
      'Start with the workflow: who does the work, where it stalls, what an error costs and who can approve a change. Then choose the smallest useful technical slice.',
      'Ask how engineers divide discovery, coding, demonstrations, service delivery and internal enablement in the actual opening. Do not assume either internal-only tools or pure pre-sales.',
      'Practice the route from discovery through a reusable service, access control, evaluation, release and adoption. Explain one trade-off and one piece of evidence at each connection. Do not quote illustrative estate numbers as current outcomes.',
      'Study beforehand and practice unaided. This graph is a learning aid, not a live interview answer service or a prediction of exact interview questions.',
    ], 'Which is the best opening for a solutions discussion?',
    ['Map the workflow, owner, baseline and failure cost before proposing an agent', 'Lead with the largest available model', 'Assume the role is internal-only', 'Treat a demo as evidence of production adoption'],
    'The company emphasizes workflow outcomes, production delivery and adoption. The implementation should follow the problem.'),
  node('s-discovery', 'Discovery: problem to acceptance test',
    'Practice a concrete hypothetical: approved account-discovery notes become a human-reviewed solution brief. This is a design exercise, not a reported 66degrees project or an autonomous customer-send tool.', [
      'Ask an account lead and a delivery engineer to walk through notes, requirements, unanswered questions, proposed scope and approval. Identify the data owner and the final reviewer.',
      'Measure current turnaround, reviewer rework and unsupported claims before setting a target. A target agreed with a stakeholder is different from a number invented for a pitch.',
      'Define acceptance: the brief links each claim to an approved source, marks unknowns and cannot send a quote or promise to a customer. A simple form plus rules may beat an agent for the first slice.',
    ], 'What makes a discovery metric defensible?',
    ['A measured baseline and a stakeholder-agreed success threshold', 'An impressive percentage selected before observing the workflow', 'Tokens generated per minute alone', 'The number of tools attached to the agent'],
    'Workflow impact needs a baseline, an owner and an agreed definition of success.'),
  node('s-core', 'Reusable delivery: one core, thin adapters',
    'Connect full-stack FDE delivery to the graph\'s generic ledger-api and data-api. The transferable pattern is a testable core behind HTTP, CLI or tool adapters, not a claim those services exist at 66degrees.', [
      'Draw intake UI -> typed API -> core workflow -> data/source adapter -> review screen. Keep business rules outside the transport layer so another delivery can reuse them.',
      'Use schema validation at boundaries and preserve unknown/missing evidence explicitly. Structured model output validates shape, not truth.',
      'Describe a prototype-to-production sequence: one narrow workflow, acceptance tests, telemetry, a small pilot and a named operator. Reuse the proven core without pretending every client has identical data or permissions.',
    ], 'Why put the workflow core behind thin adapters?',
    ['So business behavior can be tested and reused without tying it to one interface', 'So every adapter can implement different authorization rules', 'To avoid tests for external boundaries', 'To guarantee every client can share one database'],
    'Reuse the behavior while keeping integration and access boundaries explicit.'),
  node('s-governance', 'Governance: client and identity boundaries',
    'Tie the proposed workflow to OIDC invocation and least privilege. Access to a search tool does not itself authorize an agent to see every client or disclose its findings.', [
      'Carry the authenticated user, tenant and source permissions through retrieval. Partition client data and filter before material reaches the model, not only when rendering the answer.',
      'Explain issuer and audience checks for service invocation, short-lived credentials and least-privilege roles. Keep production secrets out of logs, prompts, fixtures and screen shares.',
      'Proposed outputs stay drafts until an authorized person approves the consequential action. Define retention and audit events with Security/GRC rather than making up a compliance certification.',
    ], 'Where should client access restrictions be enforced?',
    ['Before retrieval exposes material to the model, and again at action boundaries', 'Only after the model has produced an answer', 'Only in the browser navigation', 'By asking the model to be careful'],
    'A later output filter cannot undo unauthorized retrieval or model exposure.'),
  node('s-evals', 'Evaluation: prove useful, not merely fluent',
    'Turn evaluation feedback into a practical release gate: source support, omissions, leakage, human edits, latency and cost per accepted result. The thresholds must come from the use case.', [
      'Build an approved historical or synthetic test set with both normal cases and failures. Keep a holdout separate from examples used to tune prompts.',
      'Score factual support and omitted requirements, check cross-client leakage and compare with the manual workflow. Report the denominator and failure examples, not a single attractive accuracy claim.',
      'Log source/model/prompt versions, reviewer corrections and rejected drafts. Feed repeated failures into retrieval, workflow or product changes; a larger model is not the default repair.',
    ], 'A polished draft invents one requirement. What should happen?',
    ['Record the failure, block the unsupported claim and fix/test the cause before release', 'Count it as a pass because the JSON is valid', 'Hide the failure in a blended average', 'Send it first and ask for feedback later'],
    'Fluency and schema validity are not factual support or permission to send.'),
  node('s-rollout', 'Rollout: retries, revisions and real delivery',
    'Connect idempotency, revision rollback and the deploy gap. A merge, green build and successful deployment are separate states; none alone proves the user workflow works.', [
      'Give side-effecting operations an idempotency key and a durable result boundary. A retry must not create two customer messages or two approvals.',
      'Pilot read-only or human-reviewed behavior first. Define a rollback/kill-switch signal, a responsible operator and a supported route back to the previous revision.',
      'Verify exact deployed source and the actual user journey after release. Keep provider failure, empty data and denied access honest; do not call a fallback result proof that the primary recovered.',
    ], 'A merged fix is not visible to users. Which connection explains it?',
    ['The deploy gap: verify the deployed revision and real user journey', 'Python list mutability', 'A guarantee that CI always deploys', 'A reason to skip rollback planning'],
    'Source integration and live delivery need separate evidence.'),
  node('s-adoption', 'Adoption: handoff and field feedback',
    'Connect incident learning and reviewed automation to production adoption. The company emphasizes workflow transformation, adoption and governed production; use these themes to discuss outcomes, not only prototypes shipped.', [
      'Agree who uses the result, who operates the service and who receives an incident. Provide a runbook, acceptance examples and a clear path for manual work when automation fails.',
      'Track accepted outputs, repeated edits and abandonment reasons with appropriate consent and data limits. Compare against the baseline before claiming ROI.',
      'Turn a recurring fix into a tested reusable playbook or reviewable bot PR. Keep the human approval boundary where the action affects a client, money or access.',
    ], 'Which evidence best supports an adoption claim?',
    ['Observed use and accepted outcomes compared with the agreed baseline', 'A demo that compiled once', 'An agent with many tools', 'A claim that every user will save time'],
    'Adoption is observed workflow change, not code delivery alone.'),
  node('s-questions', 'Solutions conversation: questions and stories',
    'A study discussion guide inspired by company themes, not a verified current job description or a script for a particular person. Use it to connect defensible engineering stories to business trade-offs and learn the actual scope.', [
      'Ask: is the first assignment internal GTM enablement, embedded client delivery, or a mix? What would the engineer own in the first 90 days?',
      'Ask: what makes a pilot ready for production, who signs off and who operates it? How do field feedback and eval failures change the roadmap?',
      'Practice two honest stories: ambiguous problem -> scoped build, and failure -> diagnosis -> committed repair -> live verification. State personal contribution, evidence, trade-off and what remains unverified.',
      'Ask about qualifications and expectations for the exact requisition. Never imply a certification, experience requirement or personal credential that has not been confirmed.',
    ], 'How should a portfolio story handle an unverified production result?',
    ['Separate what was built/tested from what was actually observed live', 'Present all successful tests as customer adoption', 'Quote illustrative numbers as measured results', 'Avoid mentioning limitations'],
    'A solutions engineer earns trust by keeping implementation, testing, deployment and outcome evidence distinct.'),
];
export const SOLUTION_EDGES = [
  ['s-66degrees', 's-discovery'], ['s-66degrees', 's-core'], ['s-66degrees', 's-governance'],
  ['s-66degrees', 's-evals'], ['s-66degrees', 's-rollout'], ['s-66degrees', 's-adoption'], ['s-66degrees', 's-questions'],
  ['s-discovery', 'svc-ledger-api'], ['s-core', 'svc-ledger-api'], ['s-core', 'svc-data-api'],
  ['s-governance', 'c-oidc-vs-bearer'], ['s-evals', 'i-free-model-failures'],
  ['s-rollout', 'c-idempotency'], ['s-rollout', 'c-revisions'], ['s-rollout', 'c-deploy-gap'],
  ['s-adoption', 'i-free-model-failures'], ['s-adoption', 'gha-bot-prs'], ['s-questions', 's-discovery'],
].map(([source, target]) => ({ source, target, kind: 'relates_to' }));
export const SOLUTION_IDS = [...new Set([...SOLUTION_NODES.map(n => n.id), ...SOLUTION_EDGES.flatMap(e => [e.source, e.target])])];
