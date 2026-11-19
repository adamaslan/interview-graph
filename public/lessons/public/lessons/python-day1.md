# Day 1: rebuild your Python fundamentals

A four-hour, write-it-yourself lesson for a live coding exam. Start with choices, then explain, complete, build, debug and combine. This is Day 1 only, not a take-home defense or a prediction of exam questions.

Use Python 3.10 or newer, a plain editor and a terminal. No account, API, paid tool or autocomplete is needed. Keep your own attempts before opening a hint or solution. All data below is invented practice data.

## Your 240-minute route

Use elapsed time, not wall-clock time. The route includes three five-minute breaks. If you finish a task early, do its stretch prompt and explain your complexity aloud. If stuck for five minutes, write one concrete input/output example, then open one hint. At the time boundary, record what remains and move on. A four-hour practice allocation is not a promise that everyone will finish at the same speed.

- **0-25:** ten multiple-choice questions. Spend 15 minutes choosing and explaining, then ten checking mistakes.
- **25-55:** rebuild the core ideas with five worked examples. Type and vary each one.
- **55-60:** break, away from the screen.
- **60-90:** four predict-and-explain traces. Seven minutes each, then two minutes summarizing.
- **90-115:** two guided completion tasks. Twelve minutes each, then compare your approach.
- **115-120:** break.
- **120-155:** two independent scripts. Seventeen minutes each, then record one edge case you missed.
- **155-175:** two debugging tasks. Ten minutes each, including a regression test.
- **175-180:** break.
- **180-220:** capstone event report. Five minutes clarify, five plan, twenty code, ten test and explain.
- **220-235:** explain your choices and adapt to a changed constraint. This is short Day 1 recall, not the later mock-defense session.
- **235-240:** exit check and one next practice target.

By the end you will have built four tiny scripts: word counts, grouped scores, recent unique items and a heap-based schedule. The capstone combines those ideas into a report. Write your own first; the reference download is for comparison afterward.

## 0-25: choose, then justify

For every item, record a letter, a one-sentence reason and confidence from 1 to 3. Each question has one intended answer. Treat dictionary/set costs as expected average costs for ordinary well-behaved hashes; worst cases can be linear. Let n be the number of input items unless stated otherwise.

### Q1. Copy or alias?

```python
a = [1, 2]
b = a
b.append(3)
print(a)
```

A. `[1, 2]`  B. `[1, 2, 3]`  C. `None`  D. An error

<details markdown="1"><summary>Check Q1</summary>

**B.** Both names refer to the same list. Assignment did not copy it. A requires a separate list such as `a.copy()`. C confuses the return value of `append` with the mutated object. D is not an error because lists support append.

</details>

### Q2. Unique IDs with repeated membership checks

You need to keep distinct string IDs and repeatedly ask whether an ID has been seen. You do not need their order. Which is the best ordinary starting point?

A. List  B. Set  C. String  D. List sorted again before each lookup

<details markdown="1"><summary>Check Q2</summary>

**B.** A set represents uniqueness and supports expected O(1) membership. A may scan O(n) items. C can match substrings rather than complete IDs and does not represent a collection of IDs. D adds repeated sorting work without a need for ordering. Hashable strings fit a set; lists as elements would not.

</details>

### Q3. Dictionary membership

```python
counts = {"pear": 2, "apple": 0}
print("apple" in counts, 2 in counts)
```

A. `True True`  B. `False True`  C. `True False`  D. `False False`

<details markdown="1"><summary>Check Q3</summary>

**C.** `in` checks keys, including a key whose value is zero. A wrongly searches values for the second check. B and D confuse zero with absence. To inspect values explicitly, use `counts.values()`, which is a different question and may require a scan.

</details>

### Q4. Mutation and return values

```python
values = [3, 1, 2]
result = values.sort()
```

What is `result`?

A. `[1, 2, 3]`  B. `[3, 1, 2]`  C. `None`  D. A sorting iterator

<details markdown="1"><summary>Check Q4</summary>

**C.** `list.sort()` mutates the list and returns `None`. A describes the now-sorted list or the return from `sorted(values)`, not `sort()`. B is the old order. D is not what this method returns. Use `sorted` if you need a new list and must preserve the input.

</details>

### Q5. Filter, then transform

```python
[x * x for x in range(5) if x % 2 == 1]
```

A. `[0, 4, 16]`  B. `[1, 9]`  C. `[1, 3]`  D. `[0, 1, 4, 9, 16]`

<details markdown="1"><summary>Check Q5</summary>

**B.** The filter keeps 1 and 3, then the expression squares them. A keeps even inputs. C forgets the transformation. D ignores the filter. The comprehension reads each input once, O(n) time and O(m) output space for m retained items.

</details>

### Q6. Frequency counting

```python
from collections import Counter
c = Counter("aba")
print(c["a"], c["z"])
```

A. `2 0`  B. `2 KeyError`  C. `1 0`  D. `3 0`

<details markdown="1"><summary>Check Q6</summary>

**A.** Counter counts repeated elements and returns zero for a missing count. B describes ordinary dictionary indexing, not Counter indexing. C counts distinct letters rather than occurrences. D confuses total length with the count of a single letter. This does not mean a missing key is inserted whenever it is read.

</details>

### Q7. FIFO work queue

Which operation is a good fit for removing the oldest pending item many times?

A. `list.pop(0)`  B. `deque.popleft()`  C. `list.sort()`  D. `set.pop()`

<details markdown="1"><summary>Check Q7</summary>

**B.** A deque supports efficient operations at both ends. A shifts the remaining list elements and costs O(n) per front removal. C sorts instead of removing the oldest. D removes an arbitrary set element, not the oldest queued one.

</details>

### Q8. What is guaranteed by a min-heap?

After `heapq.heapify(values)` on a nonempty list of integers, which is guaranteed?

A. The whole list is sorted  B. The largest value is at index 0  C. The smallest value is at index 0  D. Every insertion takes O(n log n)

<details markdown="1"><summary>Check Q8</summary>

**C.** A min-heap exposes its minimum at the root. The internal array is not fully sorted, so A is too strong. B describes a max-heap. D is not the usual insertion bound; heap push is O(log n). `heapify` builds a heap in O(n), a useful distinction from sorting.

</details>

### Q9. Look inside the loops

```python
for group in groups:
    for item in group:
        print(item)
```

There are g groups containing n total items. Ignoring output-device latency, what is the traversal cost?

A. Always O(n squared)  B. O(g + n)  C. O(log n)  D. Always O(1)

<details markdown="1"><summary>Check Q9</summary>

**B.** Every group is visited, and every contained item is visited once. Nested syntax alone does not prove quadratic work. A would fit two independent loops each visiting n items. C and D do not account for examining every item. If g is at most proportional to n, you can simplify to O(n), but name the assumption.

</details>

### Q10. Deterministic tie-breaking

Sort records by descending score and then ascending name. Which key expresses that rule for integer scores?

A. `key=lambda r: r["score"]`  B. `key=lambda r: (-r["score"], r["name"])`  C. `key=lambda r: r["name"], reverse=True`  D. `key=lambda r: (r["score"], r["name"]), reverse=True`

<details markdown="1"><summary>Check Q10</summary>

**B.** Negating only score reverses that component while leaving name ascending. A lacks the requested direction and tie-break. C sorts primarily by name. D reverses both components, making names descending on ties. Stable sorting preserves input order for equal complete keys; it does not invent a missing tie-break.

</details>

Score is diagnostic, not a pass/fail label. Mark every low-confidence answer, even if correct. If Q1/Q4 were hard, focus on mutation. If Q2/Q3/Q6 were hard, focus on container contracts. If Q8/Q9/Q10 were hard, slow down on cost and ordering.

## 25-55: rebuild the ideas

Spend about six minutes on each example. First predict, then type it, change one input and explain why the result changed.

### 1. Names, mutation and strings

```python
original = ["a", "b"]
alias = original
copy = original.copy()
alias.append("c")
assert original == ["a", "b", "c"]
assert copy == ["a", "b"]
word = "Pear"
clean = word.casefold()
assert word == "Pear" and clean == "pear"
```

List methods can mutate; strings are immutable, so transformations return strings. A shallow list copy still shares nested objects. Try `rows = [[1], [2]]; other = rows.copy(); other[0].append(9)` and explain both levels of sharing. Don't call a shallow copy an independent deep snapshot.

### 2. Lists, sets and dictionaries express different questions

```python
items = ["pear", "apple", "pear"]
assert len(items) == 3
assert len(set(items)) == 2
counts = {}
for item in items:
    counts[item] = counts.get(item, 0) + 1
assert counts == {"pear": 2, "apple": 1}
```

A list preserves occurrences and order. A set answers uniqueness/membership, not frequency or a guaranteed sorted order. A dict associates keys with values and preserves insertion order in supported Python versions. Keys and set elements must be hashable. Dictionary value order is not automatically alphabetical order.

Ordinary expected costs: list indexing O(1), membership O(n), append amortized O(1); dict/set membership expected O(1), worst-case O(n). Explain the difference between amortized append cost and expected hashing cost. Neither means every individual operation takes identical time.

### 3. Comprehensions and stable sorting

```python
rows = [("Zoe", 4), ("Ana", 7), ("Bo", 7)]
passed = [(name, score) for name, score in rows if score >= 5]
ranked = sorted(passed, key=lambda row: (-row[1], row[0]))
assert ranked == [("Ana", 7), ("Bo", 7)]
assert rows[0] == ("Zoe", 4)
```

Filtering is one pass. Sorting m retained items is O(m log m) worst-case; Python's sort can exploit existing order, but use the general bound unless the input contract gives more. The key is computed once per item. Prefer a loop over a comprehension when side effects or multiple state changes make the logic easier to read.

### 4. Counter and defaultdict

```python
from collections import Counter, defaultdict
words = ["blue", "red", "blue"]
assert Counter(words)["blue"] == 2
by_initial = defaultdict(list)
for word in words:
    by_initial[word[0]].append(word)
assert dict(by_initial) == {"b": ["blue", "blue"], "r": ["red"]}
```

`defaultdict(list)` creates a fresh list for a missing indexed key. Pass the factory `list`, not the result `list()`. Accessing `d[missing]` can insert a default, whereas `d.get(missing)` does not invoke the factory. Try both and inspect the keys. Counter's equal-count ordering follows first encounter; use an explicit key when the task requests alphabetical ties.

### 5. deque and heapq

```python
from collections import deque
import heapq
pending = deque(["first", "second"])
pending.append("third")
assert pending.popleft() == "first"
heap = [8, 2, 5]
heapq.heapify(heap)
assert heapq.heappop(heap) == 2
heapq.heappush(heap, 1)
assert heapq.heappop(heap) == 1
```

Use a deque for order at the ends; use a heap for repeated priority selection. A heap is not a substitute for a set. To make equal-priority jobs deterministic, store tuples such as `(minute, sequence, label)`, where sequence is a unique integer. That avoids comparing arbitrary payload objects when priorities tie.

### Cost recall before the break

Without looking up: compare one list search, one set lookup, copying a list, sorting a list, one deque front removal, heapify and k heap pops. Name what n and k mean. For strings, processing an entire string depends on its length; a character-comparison or hash is not always constant when keys themselves grow.

## 55-60: break

Stand up, look away and leave the answers closed. Do not fill the break with another problem.

## 60-90: predict and explain

Write the exact result and a brief cost argument before running each trace.

### Trace A: shallow sharing

```python
rows = [[1], [2]]
copy = rows[:]
copy[0].append(7)
copy.append([3])
print(rows, copy)
```

<details markdown="1"><summary>Trace A answer</summary>

`[[1, 7], [2]] [[1, 7], [2], [3]]`. The outer copy is separate; its first inner list is shared. Slicing copies the outer references in O(n) time/space for n rows. Appending the extra row only mutates the copied outer list. Change the first append into `copy[0] = [7]` and predict again: replacing a slot does not mutate the formerly shared inner list.

</details>

### Trace B: grouping and first occurrence

```python
from collections import defaultdict
by_length = defaultdict(list)
for word in ["tea", "to", "ten", "a"]:
    by_length[len(word)].append(word)
print(list(by_length))
print(by_length[3])
```

<details markdown="1"><summary>Trace B answer</summary>

`[3, 2, 1]` and `['tea', 'ten']`. Keys follow first insertion, not numerical sort. Traversal is expected O(n) excluding total string construction, with O(n) stored word references. Now ask for keys ascending: use `sorted(by_length)`, which adds O(g log g) work for g distinct lengths.

</details>

### Trace C: bounded history

```python
from collections import deque
recent = deque(maxlen=3)
for item in ["a", "b", "c", "d"]:
    recent.append(item)
print(list(recent))
```

<details markdown="1"><summary>Trace C answer</summary>

`['b', 'c', 'd']`. A bounded deque drops the opposite end when full. This alone does not enforce uniqueness. Adding a companion set requires removing an evicted item from the set explicitly; automatic eviction does not update a separate set for you. Four appends are constant work each, with space bounded by capacity.

</details>

### Trace D: priority and ties

```python
import heapq
jobs = [(5, 2, "B"), (3, 1, "A"), (5, 0, "C")]
heapq.heapify(jobs)
print([heapq.heappop(jobs)[2] for _ in range(3)])
```

<details markdown="1"><summary>Trace D answer</summary>

`['A', 'C', 'B']`. Tuple order compares minute, then sequence. Building is O(n); taking all n items is O(n log n). For a single fully sorted output, ordinary sorting is often simpler. A heap is useful when new jobs arrive between removals or only a prefix is needed. Change the priority of C to 2 and predict the output before running.

</details>

## 90-115: guided practice

### Script 1: word counts

Write `word_counts(text)`. Split on whitespace; case-fold each token; strip only leading/trailing `.,!?;:`; ignore tokens made empty by stripping. Internal punctuation stays. Return `(token, count)` pairs sorted by descending count, then token ascending. Do not use Counter for the first attempt. This deliberately small tokenizer is not a general natural-language parser.

```python
def word_counts(text):
    counts = {}
    for raw in text.split():
        token = __________
        if __________:
            counts[token] = __________
    return sorted(counts.items(), key=__________)

assert word_counts("Tea tea, pear!") == [("tea", 2), ("pear", 1)]
assert word_counts("?!   ") == []
assert word_counts("b a") == [("a", 1), ("b", 1)]
```

<details markdown="1"><summary>Script 1 hint</summary>

Use `raw.casefold().strip(".,!?;:")`, then test the string's truth value. Count with `.get(token, 0) + 1`. Sort pairs with `lambda pair: (-pair[1], pair[0])`. State your tie-break before writing the key.

</details>

<details markdown="1"><summary>Script 1 reference and explanation</summary>

```python
def word_counts(text):
    counts = {}
    for raw in text.split():
        token = raw.casefold().strip(".,!?;:")
        if token:
            counts[token] = counts.get(token, 0) + 1
    return sorted(counts.items(), key=lambda pair: (-pair[1], pair[0]))
```

Let L be total text length and u distinct normalized tokens. Expected counting work is O(L); sorting is O(u log u) key comparisons, with string comparisons depending on token lengths. `split` and token storage allocate memory proportional to input/token content. Rewrite with Counter after the first solution. Why is `dict(Counter(...))` not a ranked output?

</details>

### Script 2: grouped scores

Write `group_scores(rows)`. Input is a list of `(name, integer_score)` tuples. Group by the first case-folded character of each nonempty name, preserving each original name. Ignore empty names only, not whitespace names. Return a plain dict whose keys are inserted ascending, with each group's rows sorted by descending score, then original name ascending. Do not mutate input.

```python
from collections import defaultdict

def group_scores(rows):
    grouped = defaultdict(list)
    for name, score in rows:
        if __________:
            grouped[__________].append((name, score))
    return {
        initial: sorted(__________, key=__________)
        for initial in __________
    }
```

Acceptance examples: `[('Ana', 7), ('Ali', 9), ('Bo', 8), ('', 99)]` yields `{'a': [('Ali', 9), ('Ana', 7)], 'b': [('Bo', 8)]}`; empty input yields `{}`; equal scores sort names ascending. Assume names contain ordinary single-code-point initials for this exercise; case folding some Unicode characters expands them, so a real internationalized grouping rule needs a separate decision.

<details markdown="1"><summary>Script 2 hint</summary>

Use `if name`, `name[0].casefold()`, `grouped[initial]`, and `sorted(grouped)` for the keys. `defaultdict(list)` avoids a shared mutable default list. Do not accidentally sort names case-insensitively when the requested tie-break is original-name order.

</details>

<details markdown="1"><summary>Script 2 reference and explanation</summary>

```python
from collections import defaultdict

def group_scores(rows):
    grouped = defaultdict(list)
    for name, score in rows:
        if name:
            grouped[name[0].casefold()].append((name, score))
    return {
        initial: sorted(grouped[initial], key=lambda row: (-row[1], row[0]))
        for initial in sorted(grouped)
    }
```

Expected grouping is O(n), followed by sorting g keys and each group. A safe overall comparison bound is O(n log n + g log g); if g <= n this is O(n log n), ignoring string-comparison length. Output space is O(n). Explain why building each group's list by repeatedly concatenating a longer list would do unnecessary copying.

</details>

## 115-120: break

Save your scripts. On return, use a blank file for the next task.

## 120-155: independent practice

### Script 3: recent unique items

Implement `recent_unique(items, capacity)`. Items are strings in arrival order. Keep at most capacity distinct items, oldest first. Ignore a duplicate while it remains in the retained window; **do not refresh its position**. Once evicted, an item may be added again. Capacity zero returns `[]`; a negative capacity raises ValueError. Assume integer capacity and string items. Use a deque and set together, not repeated list membership.

Acceptance checks:

```python
assert recent_unique(["a", "b", "a", "c", "a"], 2) == ["c", "a"]
assert recent_unique(["a", "b", "a"], 2) == ["a", "b"]
assert recent_unique([], 3) == []
assert recent_unique(["x"], 0) == []
assert recent_unique(["a", "b", "a"], 1) == ["a"]
```

Before coding, hand-trace queue and set after every input of the first example. Invariant: the set equals exactly the elements in the deque, with no duplicates and length at most capacity. Add a test showing that an evicted item can return. Stretch: what changes if duplicates should refresh recency? Do not silently implement that different contract.

<details markdown="1"><summary>Script 3 hint</summary>

Skip retained duplicates before evicting. When full, `popleft` and remove that exact value from the set. Then append/add the new item. Handle capacity zero before trying to pop from an empty queue.

</details>

<details markdown="1"><summary>Script 3 reference and explanation</summary>

```python
from collections import deque

def recent_unique(items, capacity):
    if capacity < 0:
        raise ValueError("capacity must be nonnegative")
    if capacity == 0:
        return []
    queue = deque()
    seen = set()
    for item in items:
        if item in seen:
            continue
        if len(queue) == capacity:
            seen.remove(queue.popleft())
        queue.append(item)
        seen.add(item)
    return list(queue)
```

Expected O(n) work, O(min(n, capacity)) retained state, with string hashing costs as a qualification. No full input history is retained. Using `deque(maxlen=capacity)` without synchronizing the set produces false duplicate detection after eviction. Explain why using `remove` rather than `discard` can help expose a broken invariant during development.

</details>

### Script 4: take the next jobs

Implement `next_jobs(jobs, k)`. Each job is `(minute, label)`; minutes are integers and labels strings. Return at most k labels ordered by ascending minute, preserving input order on equal minutes. Do not mutate input. k zero returns `[]`; negative k raises ValueError. Assume integer k. Use a min-heap and a unique sequence number, even though sorting would be a simpler valid general alternative.

Acceptance checks:

```python
jobs = [(5, "B"), (3, "A"), (5, "C")]
assert next_jobs(jobs, 2) == ["A", "B"]
assert next_jobs(jobs, 20) == ["A", "B", "C"]
assert next_jobs([], 2) == []
assert next_jobs(jobs, 0) == []
assert jobs == [(5, "B"), (3, "A"), (5, "C")]
```

Budget your seventeen minutes: three clarify/trace, eight implement, four tests, two complexity. Stretch: explain when you would keep a heap alive between calls instead of rebuilding it, and why a heap copied from input still uses O(n) space even if k is small.

<details markdown="1"><summary>Script 4 hint</summary>

Construct `(minute, sequence, label)` using `enumerate(jobs)`. Build once with heapify, then pop `min(k, len(heap))` times. Sequence, not label, breaks ties.

</details>

<details markdown="1"><summary>Script 4 reference and explanation</summary>

```python
import heapq

def next_jobs(jobs, k):
    if k < 0:
        raise ValueError("k must be nonnegative")
    heap = [(minute, seq, label)
            for seq, (minute, label) in enumerate(jobs)]
    heapq.heapify(heap)
    take = min(k, len(heap))
    return [heapq.heappop(heap)[2] for _ in range(take)]
```

O(n + min(k,n) log n) time and O(n) heap space. The zero case here still builds the heap; you could return early for k zero. Do not claim O(k) memory for this implementation. `sorted` has O(n log n) general time and is worth considering if you always need the full order.

</details>

## 155-175: debug and protect the fix

### Bug A: disappearing order and unstable ties

The requested output is descending frequency, then token ascending. The input is already normalized tokens.

```python
from collections import Counter

def rank_tokens(tokens):
    counts = Counter(set(tokens))
    return counts.most_common()
```

Find two separate problems. Write a failing assertion for each, then fix the function. Test both before opening the answer. Do not change the requested contract to match Counter's default ties.

<details markdown="1"><summary>Bug A answer</summary>

`set` destroys multiplicity. `most_common` ties follow first encounter, not alphabetical order, and set iteration does not provide the requested deterministic tie order. Use:

```python
def rank_tokens(tokens):
    counts = Counter(tokens)
    return sorted(counts.items(), key=lambda p: (-p[1], p[0]))

assert rank_tokens(["b", "b", "a"]) == [("b", 2), ("a", 1)]
assert rank_tokens(["b", "a"]) == [("a", 1), ("b", 1)]
```

The first assertion exposes lost counts. The second exposes the specified tie rule; on some set orders the broken code may accidentally pass that one, so do not describe a single lucky execution as proof. The fixed implementation is deterministic for this contract.

</details>

### Bug B: stale history membership

```python
from collections import deque

def broken_recent(items, capacity):
    queue = deque(maxlen=capacity)
    seen = set()
    for item in items:
        if item not in seen:
            queue.append(item)
            seen.add(item)
    return list(queue)
```

Reproduce the error for `["a", "b", "c", "a"]` with capacity 2. Name the invariant it breaks. Add a capacity-zero test and a negative-capacity test to your corrected Script 3. Fix the root cause rather than periodically clearing all history.

<details markdown="1"><summary>Bug B answer</summary>

Correct result: `['c', 'a']`; broken result: `['b', 'c']`. The queue evicts `a`, but seen still contains it. A later `a` is falsely rejected. Explicit eviction from both structures, as in Script 3, restores their equality. Reject negative capacity explicitly. Capacity zero returns empty without attempting a queue removal. A full reset would discard valid retained items and alter the contract.

</details>

## 175-180: break

Close the reference solutions. The next task uses the same ideas without giving the implementation order.

## 180-220: capstone event report

Build `event_report(events, capacity, k)`. Each event is a dict with exactly the useful fields `name` (nonempty string), `minute` (integer), and `tags` (list of strings). Extra fields, if present, are ignored. For this exercise inputs are already valid; validation is an extension, not hidden required work. Do not mutate events or their tags. No files, networking, personal data or external libraries.

Return a dict with:

- `tag_counts`: `(tag, count)` pairs, count descending then tag ascending. Normalize each tag with casefold and whitespace strip only; skip empty normalized tags. Count every occurrence, including repeated tags inside one event.
- `recent_names`: use Script 3's contract on event names in input order, with capacity. Names are case-sensitive and not normalized.
- `next_names`: use Script 4's contract on `(minute, name)` pairs, with k. This includes every event occurrence, even repeated names. Input order breaks equal-minute ties.

Negative capacity or k raises ValueError, including on empty input. Do not quietly return an empty report when a parameter is invalid.

Example:

```python
events = [
    {"name": "B", "minute": 5, "tags": [" Py ", "data"]},
    {"name": "A", "minute": 3, "tags": ["py", ""]},
    {"name": "B", "minute": 5, "tags": ["data", "data"]},
    {"name": "C", "minute": 5, "tags": []},
]
expected = {
    "tag_counts": [("data", 3), ("py", 2)],
    "recent_names": ["A", "C"],
    "next_names": ["A", "B", "B"],
}
assert event_report(events, 2, 3) == expected
```

The time allocation:

1. **Five minutes clarify:** explain duplicate tags versus duplicate names, sorting ties, mutation and parameter errors. Write one empty-input expectation.
2. **Five minutes plan:** sketch which container answers which question. State what each helper promises. Trace the sample by hand.
3. **Twenty minutes build:** first get the sample working, then edge cases. Prefer readable helpers over one long comprehension.
4. **Ten minutes test/explain:** empty events; capacity/k zero; all tags blank; tied minutes; repeated names after eviction; negative parameters; unchanged input. Explain a brute-force alternative and its cost without pretending you implemented an optimization you did not.

<details markdown="1"><summary>Capstone hint 1: composition</summary>

Reuse the helpers' contracts. Counting tags is a Counter or dict task. Recent distinct names need deque plus set. Priority output uses heap tuples with sequence numbers. The distinction between event occurrences and unique retained names is intentional.

</details>

<details markdown="1"><summary>Capstone hint 2: parameter errors</summary>

Validate both negative parameters before doing useful work, even if events is empty. Collect tags independently from names so a repeated name does not erase a valid tag occurrence.

</details>

<details markdown="1"><summary>Capstone reference solution</summary>

```python
from collections import Counter

def event_report(events, capacity, k):
    if capacity < 0 or k < 0:
        raise ValueError("capacity and k must be nonnegative")
    counts = Counter()
    for event in events:
        for raw in event["tags"]:
            tag = raw.casefold().strip()
            if tag:
                counts[tag] += 1
    return {
        "tag_counts": sorted(counts.items(), key=lambda p: (-p[1], p[0])),
        "recent_names": recent_unique(
            (event["name"] for event in events), capacity
        ),
        "next_names": next_jobs(
            [(event["minute"], event["name"]) for event in events], k
        ),
    }
```

Let e be event count, L total tag characters, u distinct normalized tags and t=min(k,e). Expected time is O(L + e + u log u + t log e), with string comparisons/hashing as qualifications; for e zero, the heap work is zero. Space includes O(e) heap/job references, O(min(e,capacity)) retained history and normalized tag/output storage. This implementation expects events to be a repeatable list, not a one-shot iterator. If you change that contract, account for multiple traversals or refactor into one pass.

</details>

### Review rubric, 10 points

- Two points: counts every normalized tag occurrence and handles alphabetical ties.
- Two points: exact recent-window semantics, synchronized deque/set, zero and invalid capacities.
- Two points: priority order with stable input-order ties and correct k limits.
- Two points: unchanged input and tests covering edge cases rather than only the sample.
- Two points: explains variables, time/space and one honest alternative.

Eight points suggests a useful baseline, not an exam guarantee. If tests fail, preserve the failing case and root cause rather than replacing the expected output. Optional stretch: validate malformed events with a clear policy. Keep that extension separate so it does not hide a broken core implementation.

## 220-235: explain and transfer

Use three minutes per prompt. Answer before opening the reference guide.

1. Why do counts, uniqueness, FIFO order and priority order need different containers? Give one case where using a set loses required information.
2. Your partner says any nested loop is quadratic. Use grouping and the tag traversal to show why the amount visited matters more than indentation.
3. The priority list must now accept new jobs while you remove old ones. What state would you retain? What identity would you use for cancellation? Do not claim the current helper supports cancellation.
4. A caller passes a generator of events instead of a list. Which part of the capstone contract breaks? Compare materializing once with a one-pass rewrite, including memory.
5. You have two minutes to improve your own solution. Name an actual issue you saw, the smallest change and the test that would show it helped. Saying you need to check a library detail is better than bluffing.

<details markdown="1"><summary>Explanation guide</summary>

1. Dict/Counter preserve counts; a set only preserves membership; deque preserves endpoint order; heap exposes priority. A set of tags discards repeated occurrences.
2. Traversing g groups and n contained items is O(g+n); scanning every pair of n items is O(n squared). Include the work in the loop body.
3. Keep the heap and monotonic sequence counter between operations. Cancellation might need job IDs and lazy-deletion bookkeeping or another structure; stale entries and compaction add design work.
4. Multiple passes exhaust a one-shot iterator. Materializing once costs O(e) extra references; a one-pass rewrite can collect counts/history/heap as it goes but still stores heap entries. Streaming cannot make a full retained heap free.
5. A good answer names a demonstrated failure or limitation, not a vague rewrite. Examples: early return for k zero, a missed tie test, or a documented input type. Preserve behavior unless the requirement changed.

</details>

## 235-240: exit check

Close every reveal. Without looking back:

- Rewrite the ranking key for count descending and word ascending.
- State the difference between `sorted(x)` and `x.sort()`.
- State the deque/set invariant in Script 3.
- Explain why the heap tuple contains a sequence number.
- Name one case your first code got wrong and the test that now protects it.

Write: "Next practice target: ___, because my evidence was ___." Choose one target, not an entire new plan. Keep the four scripts and capstone with your attempts, tests and corrections. Do not move to speed practice until you can explain the basic contracts.

## Reference download and local checks

After attempting the work, download [reference solutions](python-day1-reference.py) and [standard-library tests](python-day1-test.py). Put them in one empty folder, then run:

```sh
python python-day1-reference.py
python python-day1-test.py
```

The reference file runs sample assertions without third-party packages. The test file exercises all four scripts, both debugging fixes and the capstone. These tests check the stated practice contracts, not every possible Python input type. Passing them does not substitute for explaining your code.

## Sources and qualifications

Python semantics and library behavior checked against these references on 19 November 2026. The lesson deliberately uses long-established Python 3.10+ features rather than newer-version-only APIs. Expected/amortized/worst-case cost distinctions matter; implementation and input details can change real performance.

- [Python tutorial: data structures](https://docs.python.org/3/tutorial/datastructures.html), lists, comprehensions, dictionaries, sets and queues.
- [collections](https://docs.python.org/3/library/collections.html), Counter, defaultdict and deque behavior, including tie order and missing counts.
- [heapq](https://docs.python.org/3/library/heapq.html), min-heap invariant, heapify and priority-queue tie-break patterns.
- [Python time complexity reference](https://wiki.python.org/moin/TimeComplexity), CPython operation bounds and expected hash-table qualifications.

All scenarios, names, code and tests are original practice material. No private recruiting correspondence, take-home source or personal claims are used.
