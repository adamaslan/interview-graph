# Solutions interview cram

A one-hour rehearsal for turning technical work into a useful conversation with a solutions leader.

**Start with the person and the problem. Keep the architecture ready, not in the way.**

Connect five strengths into one story: understand the task, prototype the flow, build the cloud path, make the evidence readable, and leave a useful handoff. Rehearse out loud; offer the short answer first, then the technical depth.

## The 60-minute rehearsal

| Minutes | Focus | Your output |
| --- | --- | --- |
| 0-5 | Opening and discovery | A 60-second introduction and five discovery questions |
| 5-15 | GCP architecture | One request path, one failure path, one trade-off |
| 15-25 | Figma and interactive HTML | A stakeholder flow and a testable prototype decision |
| 25-35 | Docs and reusable Claude skills | A handoff contract and a bounded automation workflow |
| 35-47 | End-to-end solutions case | A thin pilot with an owner, a gate and a success measure |
| 47-55 | Challenge round | Honest answers to five difficult follow-ups |
| 55-60 | Questions and close | Two questions and a concise summary |

This is a rehearsal schedule, not a prediction of an interview agenda. If you have only ten minutes, rehearse the opening, the end-to-end case and the evidence ladder.

## 0-5: Lead with discovery

### Opening scaffold

Practice this in your own words. Replace the brackets with facts you can defend.

> I like turning a messy internal workflow into something people can actually use. I start with who is doing the work, where time or trust is lost, and what would count as a better outcome. Then I make the smallest useful prototype, test it with the people doing the work, and add the cloud and automation pieces that earn their place. A useful example is [verified project]: the problem was [problem], my contribution was [specific work], and the evidence so far is [demo, test or measured result].

Do not read out every tool you know. Name the workflow first, then use GCP, Figma, HTML, docs and Claude skills as supporting choices.

### Five questions to ask before designing

1. Who performs the task, who approves it and who handles exceptions?
2. What happens today, including the spreadsheet, email or manual workaround?
3. Which mistake is expensive or hard to reverse?
4. What data may the tool see, and whose permissions should it use?
5. What would make a small pilot worth continuing after two weeks?

**Quick check:** A stakeholder asks for an agent. Do you begin with a framework comparison or ask them to walk through their last real example? Start with the example. You may discover that a form, search page or deterministic check is enough.

## 5-15: Explain the GCP work as a system

### A two-minute request path

Use the graph's Estate and Depth layers to rehearse a generic frontend → API → datastore path. Explain the boundary at each hop:

- The browser presents the task and displays loading, empty, denied and error states.
- The API validates input, authenticates the caller and checks authorization for the requested action.
- A service identity gets only the permissions needed for its backend work. Caller identity and runtime identity are different questions.
- A datastore holds durable records. A cache speeds reads but is not automatically the source of truth.
- A scheduler starts recurring work. Jobs need idempotency, bounded retries and an observable final state.
- Logs and metrics should connect a failed user task to a specific run or request without exposing secrets.

Cloud Run is one option for a container-based HTTP service or batch workload. Do not turn that into an assertion that every service, job or event-driven workload has the same execution model. Be ready to explain why the chosen product fits the workload.

#### Walk the existing graph, then explain the boundary

Keep **Estate** open for the components and their connections. Switch to **Depth** for the reasons behind them: identity, retries, caching and failure handling. Use the graph's service, datastore and scheduler nodes as prompts, not proof that a particular deployment works this way today.

**One hypothetical example throughout:** an internal request tracker. A signed-in teammate opens a request, edits its summary and later sees a daily status digest. These are design examples, not claims about a real company or a shipped system.

```text
Browser -> API -> durable request records
              -> optional cache for permitted reads
Scheduler -> worker -> durable digest/run records
Request IDs and run IDs connect the evidence across both paths.
```

The scheduler is a separate background path, not an extra hop that every browser request must wait for. Observability spans both paths.

#### 1. Browser: make the task and its state understandable

**Boundary:** the browser is the person's interface, not a trusted authority. It collects input, sends a request and translates the result into a useful next step. Anyone can change client-side code or send an HTTP request without using the page.

**Example:** when the teammate opens request `R-42`, show loading while fetching it. A successful list response with no records is **empty**. A permission refusal is **denied**, not an empty list. A network failure or server failure is an **error**, not proof that no request exists. After saving, show the server-confirmed record, not an optimistic success that silently survives a failed write. Offer a safe retry without losing the draft.

**Say it:** "The frontend helps the user do the task and recover from failure. Hiding an Edit button improves the experience, but the server must still enforce who can edit."

**Follow-up:** "What if Save times out?" The write may have committed even though the response was lost. Reconcile with the server using a stable operation ID before blindly submitting it again.

#### 2. API: validate, authenticate, then authorize the action

**Boundary:** untrusted input becomes a controlled operation. **Validation** asks whether the request has an allowed shape and values. **Authentication** asks who the caller is. **Authorization** asks whether that caller may perform this action on this record, in this organization, now. Passing one check does not pass the others.

**Example:** for an edit to `R-42`, reject an oversized summary or unexpected fields, verify the session or token, then check the caller's edit permission and organization membership. Derive trusted ownership from verified identity and stored records, not a browser-supplied `isAdmin` flag. Use safe database parameters and prevent overwriting a newer edit with an old version.

**Say it:** "A valid token proves identity only after verification. It does not mean its holder can read or change every record. I authorize the specific action and object on the server."

**Follow-up:** "What if someone changes the URL to another request ID?" Re-run the object-level permission check. A hard-to-guess identifier is not authorization. Return a safe denial response without leaking another team's record.

#### 3. Service identity: separate the caller from the backend's powers

**Boundary:** the backend's runtime identity controls what it can access in downstream systems. It is different from the teammate's identity and from the account that deployed the application. A trusted backend still needs an application-level decision about whose record it is handling.

**Example:** a Cloud Run API can run as a dedicated service account. Give it only the datastore operations its work requires, scoped as narrowly as supported. A separate digest worker may need to read eligible requests and write digest results, without the ability to administer the project or change access policies. Use platform-provided credentials where supported rather than putting a long-lived service-account key in frontend code.

**Say it:** "First I check whether this person may edit R-42. Then the service performs the permitted database operation using its own limited runtime identity. Backend access must not become a way for a user to borrow all of the service's powers."

**Follow-up:** "Why not use Owner so it works?" Excess permissions increase the damage from a bug or compromise. Name the required operations, test allowed and denied cases, and keep deployment permissions separate.

#### 4. Datastore and cache: decide which answer is authoritative

**Boundary:** durable storage records accepted state. A cache holds a reusable copy that may be stale, missing or evicted. The role comes from the design, not the product name: a database product can store either authoritative records or cached results.

**Example:** request records and their versions live in the durable datastore. A permitted request-list response may be cached briefly. After an edit, invalidate or update affected cached views, or explicitly tolerate and label a short stale period. Key any user-specific cache by the relevant authorization scope; never return one team's private response to another team. A cache miss means fetch from the source, not "the request was deleted."

**Say it:** "I choose the source of truth first. Then I define what may be stale, for how long, and what happens when the cache is unavailable. A fast wrong answer is still wrong."

**Follow-up:** "How do you avoid lost edits?" Use a transaction or version precondition appropriate to the datastore. If the expected version changed, return a conflict and let the user reconcile, rather than silently replacing newer work. Durability also needs a backup and recovery plan; it is not a promise that data can never be lost.

#### 5. Scheduler and jobs: make repetition safe and completion visible

**Boundary:** a trigger starts work; it does not prove the work finished. A schedule is not an exactly-once guarantee. Separate trigger delivery, worker execution and the useful business result.

**Example:** the daily digest uses a stable key for the organization and scheduled period. A durable uniqueness check or transactional claim prevents two workers from publishing two digests for that key. Re-running safely returns or resumes the existing result. A check in process memory is not enough across restarts. If an external send is involved, use its supported deduplication mechanism or a durable outbox/reconciliation design; a database flag alone cannot make two separate systems atomic.

Set a maximum attempt count, backoff and an overall deadline that includes child work. Retry transient failures, not permanent permission errors forever. Record attempts and a final state such as succeeded, failed or partial, with counts and a reason. A trigger acknowledgement or green process exit is not enough if no useful digest was produced.

**Say it:** "I assume a trigger can repeat. The job must be safe to repeat, stop within a budget and leave a durable result someone can inspect."

**Follow-up:** "What if it crashes halfway?" Resume from a durable checkpoint or repeat idempotent steps. Make partial work explicit and prevent overlapping runs from fighting over the same output.

#### 6. Logs and metrics: connect the user's symptom to evidence

**Boundary:** diagnostics must explain what happened without becoming a second store of private data. Logs describe individual events; metrics summarize rates, latency and freshness. A trace can connect timed operations across services.

**Example:** the page displays a safe support reference after an edit fails. The API records a server-controlled request ID, operation, safe error code and duration. A digest has its own run ID, linked to the initiating request when one exists. Record whether zero output was expected, not merely that the worker exited. Monitor failed tasks, latency, stale digests and exhausted retries so failures do not depend on a user reporting them.

Do not log passwords, authorization headers, access tokens or full private request bodies. Allowlist fields, restrict access and retention, and treat caller-provided IDs and strings as untrusted diagnostic data.

**Say it:** "I want to answer which task failed, at which boundary, for which request or run, and what the user can do next, without copying their secrets into logs."

**Follow-up:** "Where do you investigate first?" Start with the user's reference and time, follow the request or run through the relevant service and datastore operation, then compare errors and latency with baseline metrics. An alert should have an owner and a recovery step.

#### Put it together: a two-minute spoken rehearsal

This is a short route through the longer notes above. Practice it aloud and shorten it to your natural pace; two minutes is a rehearsal target, not a reading-time guarantee.

> Imagine an internal request tracker. The browser makes it clear whether a request is loading, empty, denied or failed. It preserves an unsaved draft, but it is not our security boundary.
>
> The API validates the input, verifies who called it and checks whether that person can edit this specific record. A valid login does not grant access to every team's data.
>
> The API then uses its own limited service identity to reach the datastore. The person, the runtime and the deployer are different identities. Giving the runtime database access does not replace the person's authorization check.
>
> Durable records hold the accepted edit. A cache can speed permitted reads, but we define its freshness and invalidation rules. After a timeout, we reconcile the operation rather than assume the write failed and duplicate it.
>
> Separately, a scheduler starts the daily digest. We assume duplicate triggers, use a durable operation key, bound retries and total execution time, and record useful completion or partial failure. Triggered is not finished.
>
> Finally, request and run IDs let us connect a failed user task to the relevant logs, metrics and worker result. We capture enough to diagnose it, not tokens or private payloads. The design is successful when the person can finish the task or recover safely, not simply when every component is running.

#### Rehearse a failure, not only the happy path

Cover the answers and explain each one out loud before checking.

<details><summary>The page is empty. Does that mean there are no records?</summary>

No. Distinguish a successful empty response from loading, denial, a failed fetch or a stale cache. Inspect the authorized server response before claiming the datastore is empty.

</details>

<details><summary>The caller is signed in and the service account can write. Is the edit allowed?</summary>

Not yet. Check the caller's permission for this action and record. Runtime permissions and caller authorization answer different questions.

</details>

<details><summary>The job returned success but produced zero digests. Did the task succeed?</summary>

Only if zero was an expected, recorded outcome. Check eligibility, output counts, durable publication state and errors. A transport or process success is not automatically business success.

</details>

<details><summary>A retry arrives after the first attempt committed but lost its response. What prevents a duplicate?</summary>

A stable operation key with durable enforcement and a recoverable result. A disabled button or in-memory flag is not enough across callers, processes and restarts.

</details>

**Self-check:** for each boundary, name its responsibility, one failure, one safeguard and the evidence that would show the task worked. Keep technical depth available after the short answer rather than reciting every implementation detail first.

#### Further reading for these boundaries

- [OWASP API Security: broken object-level authorization](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/) explains why a record ID needs its own access check.
- [Cloud Run service identity](https://docs.cloud.google.com/run/docs/securing/service-identity) separates runtime identity from other accounts.
- [Cloud Scheduler overview](https://docs.cloud.google.com/scheduler/docs/overview) describes at-least-once delivery and idempotent targets.
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) covers event correlation, sensitive-data exclusions and log protection.

### The questions behind the product names

| Decision | Explain it to a stakeholder | Technical follow-up |
| --- | --- | --- |
| Managed container service | Less server maintenance for this workload | Startup, concurrency, identity and limits |
| Scheduled batch | Work runs at a known cadence | Retry policy, duplicate triggers and partial failure |
| Document store or analytical warehouse | Store operational records and analyze large datasets differently | Query shape, consistency and scan cost |
| Frontend hosting | Fast delivery of the user interface | Build output, environment boundaries and rollback |
| Observability | Know whether the task succeeded and what needs attention | Run IDs, freshness, alerts and access controls |

### AWS and Vercel crossover

Compare responsibilities, not logos. For any proposed equivalent, discuss execution model, identity, scaling, data access and operational burden. A managed container service, Lambda function and Kubernetes workload are not interchangeable just because all can run code. Frontend hosting does not remove the need for backend authorization.

**Rehearsal:** Explain one deployment from source change to user-visible behavior. Include build, tests, artifact, environment configuration, release, health check and rollback. Distinguish configuration you inspected from configuration you have only documented.

### Evidence ladder: avoid accidental overclaiming

- **Designed:** a proposed architecture or document exists.
- **Implemented locally:** code exists; name the tests and their scope.
- **Reviewed:** someone examined a particular revision.
- **Merged:** the code entered the target branch.
- **Deployed:** an environment is running that revision.
- **Used:** a person completed a real task.
- **Measured:** a defined outcome changed over a stated period.

Terraform validation does not prove a configuration matches a live estate, can apply successfully or is low cost. A Dockerfile is not a running service. Parameterized SQL is not validated against real data until its schema and behavior are checked. A cost target is not an achieved bill.

## 15-25: Connect Figma and rich interactive HTML

### Figma: make a decision before writing the whole application

Use a prototype to test the workflow, not to prove the backend works. Show the starting point, the main action, the result and the recovery path. Ask a representative user to complete a task without coaching.

A useful hypothetical flow is a solution brief review:

1. Choose an approved request.
2. Inspect source evidence and missing fields.
3. Review a generated draft with uncertainty visible.
4. Edit or reject it.
5. Approve the final version for its intended audience.

Ask: Where did the user hesitate? Did they understand draft versus approved? Could they recover from missing information? Bring those observations back into the design.

### Rich HTML, sometimes called "deluxe HTML"

Treat this as an informal description of an interactive deliverable, not a separate technology or a claim about a shipped product. A rich HTML report can combine a readable summary, filters, expandable evidence, charts, a decision table and clear next actions.

The interview graph itself is a public example of interactive study content: connected topics, graph/list views, quick checks and timed practice. It demonstrates an interaction pattern, not measured adoption or business impact.

### Choose the simplest useful artifact

| Artifact | Good fit | Do not claim it proves |
| --- | --- | --- |
| Figma prototype | Validate flow and visual hierarchy | A working integration or secure backend |
| Markdown document | Versioned requirements, decisions and handoff | User adoption |
| Static HTML report | Readable evidence with light interaction | A live data pipeline |
| Application dashboard | Repeated tasks with current data and permissions | Correctness without tests and source checks |

**Practice prompt:** A leader wants an impressive dashboard tomorrow, but the data feed is incomplete. Offer a clearly dated report with missing-data states and a clickable prototype of the proposed dashboard. Do not fake live numbers.

### What makes the HTML professional

Semantic headings, keyboard access, visible focus, labelled controls, readable contrast, mobile layout, useful empty states and print output. A beautiful chart must still explain its source, time range and missing data. Check actual desktop and phone pixels, not only a successful build.

## 25-35: Docs and reusable Claude skills

### Documentation is part of delivery

Use different documents for different jobs:

- **Brief:** user, problem, constraints, non-goals and success measure.
- **Decision record:** options, trade-offs, chosen path and what would change the decision.
- **Implementation handoff:** inputs, outputs, interfaces, dependencies and acceptance tests.
- **Runbook:** how to detect failure, investigate it, recover and escalate.
- **Evidence report:** exact revision, checks run, observed results and what remains unverified.

A long document is not automatically a useful handoff. Ask someone else to follow it, then repair the gaps they hit.

### Explain a Claude skill without hype

A Claude skill packages reusable instructions and supporting resources for a recurring task. It can make a workflow more consistent, but it does not make the output correct by definition or grant permission to act.

For a hypothetical document-review skill, specify:

1. **Trigger:** an approved document needs review against a named rubric.
2. **Inputs:** the document, audience, source references and review criteria.
3. **Steps:** extract claims, check evidence, flag gaps, suggest edits.
4. **Output:** a review with evidence links and clearly marked uncertainty.
5. **Limits:** no secret retrieval, no invented sources and no automatic external sending.
6. **Evaluation:** normal examples, missing evidence, contradictory facts and malicious instructions embedded in source content.
7. **Human gate:** an accountable reviewer approves any outward-facing result.

These are design prompts for the candidate's own workflows. They are not a description of any private assistant implementation.

### The hard question: "Why not just use a prompt?"

A one-off prompt may be enough for one task. A reusable skill is useful when the workflow repeats and needs maintained examples, checks and resources. More structure also means maintenance cost. Start small, compare outputs on a fixed evaluation set and keep it only if it earns the added complexity.

**Practice:** Describe one workflow using a reusable checklist, then explain what you would test before allowing it to update a system or contact another person.

## 35-47: End-to-end case, reviewed solution briefs

Hypothetical scenario: a solution team spends time assembling briefs from approved internal material. Drafts are inconsistent and reviewers cannot easily trace claims to sources. This is a scenario to investigate, not an assertion about a specific company.

### Work through it out loud

**Discover:** Interview an author, an approver and an operations owner. Collect a few approved examples and the current review steps. Confirm which sources are allowed and which outputs require approval.

**Define:** A useful pilot produces an editable draft with source references, a missing-information section and a review state. It does not send proposals, promise pricing or invent customer commitments.

**Prototype:** Test a Figma flow with a small sample of users. Can they distinguish evidence, suggestion and final approval? Use the feedback to reduce ambiguity before implementing.

**Build the thin slice:** A small form submits a bounded request to an authenticated API. Retrieve only approved material the user may access. Apply deterministic checks before an optional model call. Save the draft and evidence together. Require review before sharing.

**Operate:** Give every run an ID, timestamps and a truthful status. Show partial, stale and failed runs as such. Use bounded retries and duplicate protection. Record useful diagnostic information, not confidential source content by default.

**Evaluate:** Compare a fixed set of representative requests. Check factual support, missing requirements, reviewer edits, time to an approved output and failure cases. Include an example that should be declined or escalated.

**Roll out:** Start with a small opt-in group, a named owner and a rollback path. Review failures before expanding access. Do not use a good-looking demo as evidence that the workflow is safe or adopted.

### The stakeholder summary

> The first goal is not to automate the whole process. It is to help a reviewer get to a trustworthy brief faster. I would start with a narrow draft-and-review flow, keep sources visible, measure reviewer effort and errors, and only expand after the pilot shows it helps.

### Proposed measures, not achieved results

Baseline the current process first. Then compare median time to an approved brief, unsupported-claim rate, reviewer edit burden, completion rate and operating cost per accepted output. Define the sample, time period and failure treatment. Do not invent a percentage improvement.

## 47-55: Challenge round

### "What did you personally build?"

Name your exact contribution. Separate your design, implementation, integration and verification from collaborators' work and generated code. Explain how you checked the result. Do not say you wrote every line if you directed and reviewed AI-assisted implementation.

### "The demo works. Why isn't it ready?"

A demo may not cover permissions, real data, failures, accessibility, operating cost or rollback. Name the remaining acceptance checks and the smallest safe pilot rather than hiding behind a vague production-ready label.

### "The stakeholder wants everything now."

Restate the outcome, identify the risky assumption and offer two scoped paths. For example: a reviewed static report this week, or a narrower live integration with an owner and explicit acceptance checks. Explain what each leaves out.

### "Why use AI at all?"

Use deterministic rules for stable checks. Consider AI when interpretation or drafting earns its cost and uncertainty. Keep a non-AI baseline. Refuse to automate an action whose error cost is higher than the value of removing review.

### "What if nobody uses it?"

Watch a real task, check whether it fits the existing workflow, ask what users still do outside the tool and remove friction. Usage alone is not success, but absence of repeat useful tasks is a reason to revisit the problem.

## 55-60: Questions and close

Choose two questions, then listen:

- Which internal workflow would you most want a new engineer to understand in their first month?
- Where does a useful prototype usually get stuck on the way to regular use?
- Who owns adoption and operational support after the first pilot?
- What evidence would make you trust a small AI-assisted workflow enough to expand it?

Close by connecting one demonstrated strength to one concrete need you heard. Avoid a second tool inventory.

## Final five-minute checklist

- Can I explain one user problem without naming a framework?
- Can I show how GCP, Figma, HTML, docs and reusable skills support that same workflow?
- Do I know which examples are designed, tested, deployed, used or measured?
- Can I explain a failure and what I learned without inventing an accomplishment?
- Have I removed confidential data, private links, contact details and secrets from anything I may show?
- Can I give the short version, then offer technical depth if asked?

## Background reading

These references support concepts, not claims about an employer or any private project:

- [Claude Agent Skills overview](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills/overview)
- [Figma guide to prototyping](https://help.figma.com/hc/en-us/articles/360040314193-Guide-to-prototyping-in-Figma)
- [W3C page structure tutorial](https://www.w3.org/WAI/tutorials/page-structure/)

Use the existing graph's Estate, Depth, AWS map, GHA and 66degrees layers for related technical and stakeholder practice. Product limits and prices change; check current official documentation before making a real deployment decision.
