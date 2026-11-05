// Python fundamentals: 150 hand-authored nodes in ten topics, added 2026-11-05
// on top of the estate graph. Each node is one interview-grade fundamental:
// a summary you can say out loud, talking points, and a quick check whose
// distractors are the real misconceptions. Facts are CPython 3.11-3.13 era.

export const PYTHON_TOPICS = [
  { id: 'core',        label: 'Core syntax' },
  { id: 'structures',  label: 'Data structures' },
  { id: 'iteration',   label: 'Iteration' },
  { id: 'functions',   label: 'Functions' },
  { id: 'oop',         label: 'OOP & data model' },
  { id: 'errors',      label: 'Errors' },
  { id: 'stdlib',      label: 'Stdlib' },
  { id: 'concurrency', label: 'Concurrency' },
  { id: 'typing',      label: 'Typing' },
  { id: 'packaging',   label: 'Packaging' },
];

const RAW_PYTHON_NODES = [
  // ── Core syntax and semantics ─────────────────────────────────────────
  { id: 'py-core-names-binding', topic: 'core', label: 'Names bind to objects',
    summary: 'Assignment never copies: it binds a name to an object. b = a makes both names point at the same list, so b.append shows up through a. Copying is always explicit: list(a), a[:], copy.copy.',
    talkingPoints: [
      'The mental model that fixes a hundred bugs: variables in Python are names stuck onto objects, not boxes holding values. Function arguments are passed the same way - the parameter is a new name for the same object.',
      'Interview answer when they ask about pass-by-reference: Python passes object references by assignment. You can mutate a shared object through either name, but rebinding one name never affects the other.',
    ],
    quiz: [
      { q: 'a = [1, 2]; b = a; b.append(3). What is a, and why?',
        choices: ['[1, 2], because lists copy on assignment', '[1, 2, 3], because b is a second name for the same list object', '[1, 2], because append returns a new list', 'An error, because a is already bound'],
        answer: 1,
        why: 'b = a binds another name to the same list. Mutation through one name is visible through every name bound to that object.' },
    ] },

  { id: 'py-core-mutability', topic: 'core', label: 'Mutable vs immutable',
    summary: 'Lists, dicts and sets mutate in place; ints, strings and tuples cannot. x += 1 on a list calls __iadd__ and mutates, while on an int it rebinds the name to a new object - same syntax, two mechanisms.',
    talkingPoints: [
      'The += split is a classic trap: for a list, += is in-place extend, so other names see the change. For an int or string, += builds a new object and rebinds. Knowing which one fires explains aliasing bugs and the tuple += list surprise.',
      'Immutability is what makes strings and tuples usable as dict keys. It is also why string concatenation in a loop is quadratic - every += allocates a new string.',
    ],
    quiz: [
      { q: 'Why does t = ([1], 2); t[0].append(9) succeed even though tuples are immutable?',
        choices: ['Tuples are only shallowly immutable: the tuple cannot rebind its slots, but the list inside still mutates', 'Python makes an exception for append', 'The tuple is copied first, so nothing is mutated', 'Immutability only applies to strings'],
        answer: 0,
        why: 'The tuple holds a reference to the list; that reference cannot change, but the referenced list object is still mutable. This is why a tuple is hashable only if everything it holds is hashable.' },
    ] },

  { id: 'py-core-identity-equality', topic: 'core', label: 'is vs ==',
    summary: '== compares values via __eq__; is compares identity (same object in memory). Use is only for singletons: None, True, False, sentinels. Small-int and string interning make is sometimes look true by accident.',
    talkingPoints: [
      'The interning trap: a = 256; b = 256; a is b can be True, while 257 gives False in some contexts - CPython caches small ints and interns some strings. That is an optimization detail, never a contract.',
      'Correct rules: x is None, never x == None. For values, ==. Overriding __eq__ without thinking about __hash__ silently makes your object unhashable in Python 3.',
    ],
    quiz: [
      { q: 'When is "is" the correct comparison in everyday Python?',
        choices: ['Comparing two strings for the same text', 'Checking a number equals zero', 'Comparing against None or a unique sentinel object', 'Any time == would also work, for speed'],
        answer: 2,
        why: 'is asks "same object", which is exactly the question for singletons like None. For values it can give implementation-dependent false results.' },
    ] },

  { id: 'py-core-none', topic: 'core', label: 'None and sentinels',
    summary: 'None is a singleton used for "no value". Test with is None. For optional function arguments, None doubles as the sentinel that avoids the mutable-default trap; for APIs, a unique object() sentinel distinguishes "not passed" from "passed None".',
    talkingPoints: [
      'Two different ideas share one word: missing argument versus explicit None. When the difference matters, define _UNSET = object() and default to that - then None is real data and _UNSET means the caller said nothing.',
      'None compares false in boolean context but so do 0 and empty containers; if value is not None beats if value when 0 or "" are legitimate values.',
    ],
    quiz: [
      { q: 'Why is "if x is not None" safer than "if x" when x is an optional numeric parameter?',
        choices: ['is checks are faster', 'if x also rejects 0, 0.0 and empty containers, which may be valid inputs', 'None raises in boolean context', 'It is shorter to read'],
        answer: 1,
        why: 'Falsy and None are different states. A parameter that legitimately accepts 0 breaks silently under a truthiness check.' },
    ] },

  { id: 'py-core-truthiness', topic: 'core', label: 'Truthiness and __bool__',
    summary: 'Every object has a truth value: False, None, 0, empty containers and empty strings are falsy, everything else is truthy. Custom classes define it through __bool__, falling back to __len__.',
    talkingPoints: [
      'The debugging payoff: if users: and if len(users) > 0: are the same check, and the first is idiomatic. The flip side is the falsy-zero bug - a count of 0 disappears in a truthiness test.',
      'For your own classes: define __bool__ for cheap checks, or __len__ if truthiness should track emptiness. If neither exists, instances are always truthy - a surprise when you expected an "empty" object to be falsy.',
    ],
    quiz: [
      { q: 'A class defines __len__ returning 0 but no __bool__. What is bool(instance)?',
        choices: ['True, because objects are always truthy', 'False, because truthiness falls back to __len__ when __bool__ is missing', 'It raises TypeError', 'False, only if the class also defines __eq__'],
        answer: 1,
        why: 'The data model says: no __bool__, consult __len__. Zero length means falsy. This is why empty lists test False.' },
    ] },

  { id: 'py-core-slicing', topic: 'core', label: 'Slicing and shallow copies',
    summary: 'seq[start:stop:step] builds a new list with a shallow copy of the slice. Out-of-range slices clamp instead of raising (unlike indexing), negative strides reverse, and a[:] is the idiomatic full shallow copy.',
    talkingPoints: [
      'Two facts cover most questions: slicing never raises IndexError (it clamps), and the copy is shallow - nested lists are still shared. So a[:][0].append(x) mutates the original nested list.',
      'Slice assignment works in place and can change length: a[1:3] = [9] shrinks the list. And reversed(seq) is usually clearer than seq[::-1] when you only need to iterate.',
    ],
    quiz: [
      { q: 'What does [1, 2, 3][10:20] evaluate to?',
        choices: ['IndexError: slice index out of range', 'None', '[] - slices clamp to valid bounds', '[3]'],
        answer: 2,
        why: 'Indexing raises on out-of-range; slicing clamps. That asymmetry is deliberate and worth saying out loud in an interview.' },
    ] },

  { id: 'py-core-comprehensions', topic: 'core', label: 'Comprehensions',
    summary: 'List, set and dict comprehensions build a collection from an iterable in one expression, with their own scope for the loop variable in Python 3. They are for transformations that fit on one or two lines, not for side effects.',
    talkingPoints: [
      'Readability rule I defend: a comprehension maps or filters; the moment you need two nested loops plus a condition plus a function call, write the for loop. Comprehensions are expressions, so print() inside one is a smell.',
      'Loop variables do not leak in Python 3: [x for x in ...] leaves an outer x untouched - unlike Python 2. Dict comprehensions {(k, v)} and set comprehensions share the same syntax family.',
    ],
    quiz: [
      { q: 'x = 5; [x for x in range(3)]; print(x) in Python 3 prints what?',
        choices: ['2, the last loop value', '5 - comprehension loop variables have their own scope', 'An error for rebinding x', '[0, 1, 2]'],
        answer: 1,
        why: 'Comprehensions got their own scope in Python 3 precisely to stop loop-variable leakage bugs.' },
    ] },

  { id: 'py-core-unpacking', topic: 'core', label: 'Unpacking and starred targets',
    summary: 'Iterable unpacking assigns a whole sequence at once: a, b = pair; first, *rest = items; *middle, last = items. Tuple swap a, b = b, a needs no temp. Starred targets collect the leftovers into a list.',
    talkingPoints: [
      'Swap without a temp variable is the famous demo, but the daily-driver uses are first, *rest splitting, record destructuring in loops (for name, (x, y) in ...), and forcing keyword clarity by unpacking dicts into calls with **.',
      'Edge cases worth naming: unpacking demands an exact arity match unless a star collects the extras, and a, *b = [] raises ValueError for the missing first element.',
    ],
    quiz: [
      { q: 'first, *rest = [1, 2, 3, 4] leaves rest as what?',
        choices: ['(2, 3, 4) - a tuple', '[2, 3, 4] - a new list', '4 - the last element', '[1, 2, 3, 4] - a copy of everything'],
        answer: 1,
        why: 'A starred target always collects into a fresh list, even when it captures zero items.' },
    ] },

  { id: 'py-core-fstrings', topic: 'core', label: 'f-strings',
    summary: 'f-strings evaluate embedded expressions at runtime, at the point of definition - they are not templates that update. The = specifier (f"{x=}") prints name and value for debugging; format specs handle padding, precision and thousands separators.',
    talkingPoints: [
      'The debugging trick everyone loves: f"{user_id=}" prints user_id=42. It is the fastest honest print-debugging in the language.',
      'Two limits worth knowing: an f-string captures values when it runs, so storing one and expecting it to track a variable fails; and never f-string untrusted input into SQL or shell - formatting is not escaping.',
    ],
    quiz: [
      { q: 'x = 1; s = f"{x}"; x = 2. What does s hold?',
        choices: ['"2" - f-strings update with the variable', '"1" - the expression was evaluated once when the f-string ran', 'A deferred template object', 'An error: x changed after formatting'],
        answer: 1,
        why: 'f-strings are eager. The expression is evaluated at definition time and the result is a plain string.' },
    ] },

  { id: 'py-core-walrus', topic: 'core', label: 'The walrus operator :=',
    summary: 'Assignment expressions bind a value inside an expression: while (line := f.readline()): .... They shine in loop conditions and comprehension filters where you would otherwise compute a value twice.',
    talkingPoints: [
      'The two canonical uses: while/​if conditions that capture what they test, and comprehensions like [y for x in data if (y := f(x)) is not None] which avoid calling f twice.',
      'Restraint is the senior answer: walrus exists to remove duplication, not to golf. If the assignment is not reused, write the extra line.',
    ],
    quiz: [
      { q: 'What is the main reason to reach for := in a comprehension filter?',
        choices: ['It makes the loop run in parallel', 'It binds the computed value so the filter and the expression share one computation', 'It makes the variable global', 'It is required for filtering'],
        answer: 1,
        why: 'Without it you either compute f(x) twice or fall back to a nested loop. The walrus names the intermediate once.' },
    ] },

  { id: 'py-core-chained-comparisons', topic: 'core', label: 'Chained comparisons',
    summary: 'Python reads 0 <= x < 10 as math does: it means (0 <= x) and (x < 10), with x evaluated only once. This is unlike C, where the same text compares a boolean result to 10.',
    talkingPoints: [
      'Two details make this interview-grade: the middle operand is evaluated exactly once (matters if it has side effects), and chaining works for any mix - a == b == c checks three-way equality cleanly.',
      'Do not chain is: a is b is c means (a is b) and (b is c), which is rarely what anyone wants to say.',
    ],
    quiz: [
      { q: 'In Python, 3 == 3.0 == 3 evaluates to what, and why?',
        choices: ['False - mixed types cannot chain', 'True - it is (3 == 3.0) and (3.0 == 3), each evaluated pairwise', 'True - it compares 3 to the boolean True', 'TypeError'],
        answer: 1,
        why: 'Chaining expands to pairwise comparisons of neighbors with the middle evaluated once. 3 == 3.0 is True by numeric equality.' },
    ] },

  { id: 'py-core-str-bytes', topic: 'core', label: 'str vs bytes',
    summary: 'str is a sequence of Unicode code points (text); bytes is a sequence of 8-bit values (binary). The boundary between them is explicit: .encode() text to bytes, .decode() bytes to text. Python 3 never mixes them implicitly.',
    talkingPoints: [
      'The whole Unicode sandwich in one line: decode on the way in, work in text, encode on the way out, and pass encoding="utf-8" explicitly at every file and socket boundary.',
      'Where this bites: hashlib wants bytes, json gives you str, and b"x" + "y" is a TypeError in Python 3 - that strictness is the fix for Python 2 silent-mojibake bugs.',
    ],
    quiz: [
      { q: 'hashlib.sha256("hello") fails in Python 3. What is the fix and the principle?',
        choices: ['Use sha256(b64encode("hello"))', 'Encode first: sha256("hello".encode("utf-8")) - hashing operates on bytes, so the caller chooses the encoding', 'Wrap in str(bytes(...))', 'Pass encoding="utf8" to sha256'],
        answer: 1,
        why: 'Hashes are defined over byte sequences. Python 3 makes you state the encoding explicitly instead of guessing.' },
    ] },

  { id: 'py-core-numbers', topic: 'core', label: 'Numbers: int, float, Decimal',
    summary: 'Python ints are arbitrary precision - no overflow. Floats are IEEE-754 doubles, so 0.1 + 0.2 != 0.3. Money and exact decimal work belong to decimal.Decimal; rational work to fractions.Fraction.',
    talkingPoints: [
      'Two interview facts: Python 3 int has no maximum (2**1000 just works), and float surprise is not a Python bug, it is binary floating point - 0.1 has no exact binary representation.',
      'My rule of thumb: counts and identifiers are ints, measurements are floats, currency is Decimal (constructed from strings, never from floats, or the binary error is baked in).',
    ],
    quiz: [
        { q: 'Why does Decimal(0.1) still print the ugly long expansion while Decimal("0.1") is exact?',
        choices: ['The string form uses a different rounding mode', 'Decimal(0.1) first receives the inexact binary float; the damage happened before Decimal saw it', 'It is a printing bug only', 'Decimal only works for integers'],
        answer: 1,
        why: 'Passing a float hands Decimal the already-imprecise binary value. The string constructor captures the decimal digits you meant.' },
    ] },

  { id: 'py-core-operators', topic: 'core', label: 'Operators: /, //, %, **',
    summary: 'True division / always returns a float (7 / 2 == 3.5); floor division // rounds toward negative infinity (-7 // 2 == -4, not -3); % follows the divisor sign; ** binds tighter than unary minus, so -2**2 == -4.',
    talkingPoints: [
      'The floor-division sign behavior is the classic gotcha: // rounds toward negative infinity, so -7 // 2 is -4. That is mathematically clean (it matches % so that a == (a//b)*b + a%b always holds) but surprises C programmers.',
      'Practical notes: int division of ints still gives float in Python 3, divmod(a, b) returns both at once, and the power-operator precedence trap -2**2 == -(2**2) has burned everyone once.',
    ],
    quiz: [
      { q: 'What is -7 // 2 in Python?',
        choices: ['-3, truncating toward zero like C', '-4, floor division rounds toward negative infinity', '-3.5', 'A TypeError without parentheses'],
        answer: 1,
        why: 'Floor division floors. The invariant a == (a // b) * b + a % b then holds for negative numbers too.' },
    ] },

  { id: 'py-core-string-methods', topic: 'core', label: 'String methods return new strings',
    summary: 'Strings are immutable: every method (upper, strip, replace, split) returns a new string. s.strip() alone does nothing to s. For joining, "sep".join(parts) is the idiom and is linear; repeated + in a loop is quadratic.',
    talkingPoints: [
      'The number one beginner bug: calling s.strip() and printing the unstripped s. Immutable means the method must return the result.',
      'Performance story: "".join(list_of_parts) allocates once. A loop of s += part copies the accumulated string every iteration - O(n^2) total. This is why interviewers ask you to join.',
    ],
    quiz: [
      { q: 'Why is ", ".join(words) preferred over result += word + ", " in a loop?',
        choices: ['join is newer syntax', 'join allocates the final string once; += copies the whole accumulated string on every pass', 'join handles Unicode, += cannot', 'join is lazy'],
        answer: 1,
        why: 'Immutability makes += a full copy each time. join knows the final size up front and allocates once.' },
    ] },

  // ── Data structures ───────────────────────────────────────────────────
  { id: 'py-struct-list', topic: 'structures', label: 'list: dynamic array',
    summary: 'A list is a dynamic array of object references: O(1) index and amortized O(1) append, O(n) insert/pop at the front, O(n) membership test. It over-allocates so appends rarely resize.',
    talkingPoints: [
      'The one-liner complexity profile: append is amortized O(1) thanks to over-allocation, insert(0, x) and pop(0) are O(n) because everything shifts - use collections.deque when the front is hot.',
      'Because a list holds references, a list of a million small ints is an array of pointers plus a million int objects. For dense numeric data, array module or numpy is the honest answer.',
    ],
    quiz: [
      { q: 'Which operations are O(n) on a Python list?',
        choices: ['append and pop() at the end', 'Indexing and len()', 'insert(0, x), pop(0), and membership x in lst', 'Slicing the first element'],
        answer: 2,
        why: 'Anything that shifts elements or scans them linearly is O(n). The tail operations are the cheap end.' },
    ] },

  { id: 'py-struct-tuple', topic: 'structures', label: 'tuple: immutable record',
    summary: 'Tuples are fixed-size, immutable sequences used for heterogeneous records and as dict keys (when contents are hashable). Immutability is shallow: a tuple holding a list can still see that list change.',
    talkingPoints: [
      'Semantic split I state in interviews: lists are for homogeneous collections you loop over, tuples are for heterogeneous records with positional meaning - (host, port), (x, y).',
      'Practical edges: the trailing comma makes the tuple (1,) not the parens; a tuple is hashable only if all its items are; namedtuple is the upgrade when positions need names.',
    ],
    quiz: [
      { q: 'When is a tuple usable as a dict key?',
        choices: ['Always - tuples are immutable', 'Only when every element it contains is itself hashable', 'Never - only strings are valid keys', 'Only tuples of length two'],
        answer: 1,
        why: 'Hashability is recursive for tuples: one mutable member and the whole tuple is unhashable.' },
    ] },

  { id: 'py-struct-dict', topic: 'structures', label: 'dict: ordered hash table',
    summary: 'Since Python 3.7, insertion order is a language guarantee. Lookups, inserts and deletes are average O(1). Keys must be hashable; the compact dict implementation keeps order and cuts memory versus the old table.',
    talkingPoints: [
      'Worth saying precisely: order preservation was a CPython 3.6 implementation detail, guaranteed by the language from 3.7. Iteration order is insertion order, and equal dicts can have different orders.',
      'Modern dict internals (PEP 412 split tables, compact dict) are why per-object __dict__ got cheaper - the mechanism behind "Python objects use less memory than you think since 3.6".',
    ],
    quiz: [
      { q: 'd1 = {"a": 1, "b": 2}; d2 = {"b": 2, "a": 1}. What are d1 == d2 and their iteration orders?',
        choices: ['Not equal; same order', 'Equal; order follows insertion, so a-then-b for d1 and b-then-a for d2', 'Equal; both iterate sorted by key', 'Not equal; order is random'],
        answer: 1,
        why: 'Dict equality ignores order; iteration honors insertion order. Two separate guarantees people merge into one.' },
    ] },

  { id: 'py-struct-set', topic: 'structures', label: 'set and frozenset',
    summary: 'Sets are hash tables of unique members: O(1) membership, dedupe for free, unordered (well, arbitrary order). frozenset is the immutable, hashable version that can nest inside other sets or serve as a dict key.',
    talkingPoints: [
      'The two killer uses: membership testing (x in seen inside a loop turns O(n^2) into O(n)) and set algebra - intersection, difference, symmetric difference read exactly like the business rule they implement.',
      'Gotcha: {} makes a dict, not a set - empty set needs set(). And set order is not insertion order; if you need ordered dedupe, dict.fromkeys(items) is the trick.',
    ],
    quiz: [
      { q: 'What is the idiomatic way to dedupe a list while keeping first-seen order?',
        choices: ['set(items)', 'list(dict.fromkeys(items)) - dicts keep insertion order', 'sorted(set(items))', 'A for loop with in on a result list'],
        answer: 1,
        why: 'dict keys are unique and ordered by insertion, so dict.fromkeys dedupes stably. A bare set loses the order.' },
    ] },

  { id: 'py-struct-hashability', topic: 'structures', label: 'Hashability and the __eq__/__hash__ contract',
    summary: 'Dict keys and set members must be hashable: a stable hash for the object lifetime and __eq__ consistent with __hash__ (equal objects must hash equal). Defining __eq__ in a class sets __hash__ to None unless you opt back in.',
    talkingPoints: [
      'The contract in one sentence: equal objects must have equal hashes, but equal hashes need not be equal objects - collisions are handled by probing.',
      'The Python 3 guardrail: writing __eq__ without __hash__ makes instances unhashable, forcing a decision. If the object is mutable and identified by value, that unhashable outcome is usually correct.',
    ],
    quiz: [
      { q: 'A class defines __eq__ but not __hash__. What happens when you put an instance in a set?',
        choices: ['It works - id() is used as the hash', 'TypeError: unhashable type - defining __eq__ sets __hash__ to None', 'It works but equality checks are skipped', 'The set silently dedupes by identity'],
        answer: 1,
        why: 'Python 3 protects the contract: value equality plus identity hash would let two equal objects both live in one set.' },
    ] },

  { id: 'py-struct-dict-views', topic: 'structures', label: 'Dict views are live',
    summary: 'd.keys(), d.values() and d.items() return dynamic views, not copies: they reflect later mutations. Wrap in list() to snapshot. keys() and items() even support set operations.',
    talkingPoints: [
      'Python 2 to 3 change that still bites: keys() used to return a list. Now it is a live view - iterating keys while deleting raises RuntimeError: dictionary changed size during iteration.',
      'Useful extras: dict1.keys() & dict2.keys() gives common keys as a set, and views are cheap because they share storage with the dict.',
    ],
    quiz: [
      { q: 'ks = d.keys(); d["new"] = 1. What does ks contain?',
        choices: ['The old key set - it was a copy', 'The updated key set including "new" - views are live', 'A RuntimeError on next access', 'None'],
        answer: 1,
        why: 'Views reflect the dict. Snapshot with list(d.keys()) when you need the frozen version.' },
    ] },

  { id: 'py-struct-defaultdict', topic: 'structures', label: 'defaultdict and friends',
    summary: 'collections.defaultdict(factory) auto-creates missing values: defaultdict(list) turns grouping into one append. Alternatives: d.get(k, default) for reads, d.setdefault(k, []) for writes - and setdefault evaluates its default every call.',
    talkingPoints: [
      'Grouping idiom: groups = defaultdict(list); for x in items: groups[key(x)].append(x). That replaces the if k not in d dance and reads like the intent.',
      'Micro-gotcha worth knowing: setdefault always constructs its default argument (a fresh [] per call), while defaultdict only calls the factory on a miss. Also prefer get() for read-only defaults so you do not pollute the dict.',
    ],
    quiz: [
      { q: 'What is the subtle cost of d.setdefault(k, expensive()) compared to defaultdict(expensive)?',
        choices: ['setdefault is slower to hash', 'setdefault evaluates expensive() on every call even when k exists; defaultdict calls the factory only on a miss', 'defaultdict cannot store custom objects', 'There is no difference'],
        answer: 1,
        why: 'Arguments are evaluated before the call. Only a factory deferred to miss-time avoids building values you throw away.' },
    ] },

  { id: 'py-struct-counter', topic: 'structures', label: 'Counter',
    summary: 'collections.Counter is a dict subclass for counting hashables: Counter(iterable), .most_common(n), and arithmetic (+, -, &, |) that treats counts like multiset operations.',
    talkingPoints: [
      'One-liners that impress because they are real: most common word, letter frequency, inventory deltas via counter subtraction. Counter(a) - Counter(b) keeps only positive counts, which matches "what is missing" questions.',
      'Missing keys read as zero, not KeyError - c["x"] == 0 - but c["x"] += 1 materializes the key, which matters if you later iterate.',
    ],
    quiz: [
      { q: 'Counter("ab") - Counter("a") gives what?',
        choices: ["Counter({'b': 1}) - subtraction keeps only positive counts", "Counter({'a': -1, 'b': 1})", 'An empty Counter', 'It raises ValueError'],
        answer: 0,
        why: 'Counter subtraction is multiset subtraction: zero and negative results drop out. Use subtract() if you want the negatives kept.' },
    ] },

  { id: 'py-struct-deque', topic: 'structures', label: 'deque: O(1) at both ends',
    summary: 'collections.deque is a doubly-linked block list: append and pop are O(1) at both ends, making it the right queue and ring buffer (maxlen drops old items automatically). Indexing the middle is O(n).',
    talkingPoints: [
      'Replace list.pop(0) with deque.popleft() and an O(n^2) consumer loop becomes O(n). That one-line change is a real production fix I can describe.',
      'maxlen gives a bounded history for free: appends past the limit evict from the other end - perfect for recent-events buffers and sliding windows.',
    ],
    quiz: [
      { q: 'Why is a deque the right queue and a list the wrong one?',
        choices: ['deque is thread-safe for all operations', 'list.pop(0) shifts every element each call (O(n)); deque.popleft() is O(1)', 'deque uses less memory always', 'Lists cannot hold queue items'],
        answer: 1,
        why: 'It is a data-structure shape question: cheap ends versus cheap middle. deque trades O(n) indexing for O(1) ends.' },
    ] },

  { id: 'py-struct-heapq', topic: 'structures', label: 'heapq: priority queues',
    summary: 'heapq turns a plain list into a binary min-heap in place: heapify is O(n), push/pop O(log n). For priority queues push (priority, counter, item) tuples so equal priorities never compare the payloads.',
    talkingPoints: [
      'The tuple trick is the interview point: (priority, seq, item) with an increasing counter keeps ordering total, because if priorities tie, Python compares the next tuple element and you never let it reach an unorderable payload.',
      'It is a min-heap only - for max behavior negate priorities or use the private _heapify_max, better to negate. heapq.nlargest/nsmallest beat full sorts when k << n.',
    ],
    quiz: [
      { q: 'Why push (priority, counter, item) instead of (priority, item) into a heap?',
        choices: ['heapq requires three elements', 'When priorities tie, the next tuple element is compared; the unique counter prevents comparing arbitrary items', 'It makes pop O(1)', 'The counter orders by insertion time only'],
        answer: 1,
        why: 'Tuple comparison falls through on ties. Without the counter, two equal priorities force item <=> item, which raises for unorderable payloads.' },
    ] },

  { id: 'py-struct-bisect', topic: 'structures', label: 'bisect: search sorted lists',
    summary: 'bisect.bisect_left/right find insertion points in a sorted list in O(log n); bisect.insort keeps the list sorted. It is the stdlib answer to "I need sorted order plus fast lookup" without a tree.',
    talkingPoints: [
      'Pattern: maintain a sorted list of timestamps or scores, bisect for range queries, insort for adds. O(n) insert (list shift) but O(log n) search - fine when reads dominate.',
      'left vs right matters for ranges: [bisect_left(lo), bisect_right(hi)) slices an inclusive range with correct duplicate handling.',
    ],
    quiz: [
      { q: 'For a sorted list with duplicates, how do you find all items equal to x?',
        choices: ['list.index(x) repeatedly', 'Slice between bisect_left(x) and bisect_right(x)', 'bisect(x) twice', 'Convert to a set first'],
        answer: 1,
        why: 'The two bounds bracket exactly the run of equal values, both in O(log n) for the search part.' },
    ] },

  { id: 'py-struct-namedtuple', topic: 'structures', label: 'namedtuple',
    summary: 'collections.namedtuple gives a tuple with named fields: Point(x=1, y=2) stays a real tuple (indexable, unpackable, hashable) but reads like a record. Low ceremony, immutable, small memory.',
    talkingPoints: [
      'Position in the toolkit: namedtuple for plain immutable records, dataclass when you want methods/defaults/mutability knobs, attrs or pydantic for validation. Saying the ladder out loud is the senior answer.',
      'Nice extras: _replace returns a modified copy, _asdict exports, defaults via defaults=... or typing.NamedTuple with annotations.',
    ],
    quiz: [
      { q: 'When do you step up from namedtuple to dataclass?',
        choices: ['When you need immutability', 'When you need methods, mutable fields, per-field defaults or slots - dataclasses trade a little overhead for that control', 'When you need hashing', 'namedtuples cannot be dict keys'],
        answer: 1,
        why: 'Both give you init/repr/eq; the dataclass adds the knobs. namedtuple stays the cheapest honest record.' },
    ] },

  { id: 'py-struct-array', topic: 'structures', label: 'array module and dense numerics',
    summary: 'array.array("d", ...) stores C doubles contiguously - roughly 8 bytes per value versus a list of float objects at several times that. It is the stdlib middle step before reaching for numpy.',
    talkingPoints: [
      'Memory story: a list stores pointers to boxed float objects; an array stores the raw values. For a million readings that difference is tens of megabytes, plus better cache behavior.',
      'Boundary honesty: arrays support sequence ops but no math - the moment you need vectorized arithmetic you are in numpy territory, and I say so.',
    ],
    quiz: [
      { q: 'What does array("i", ...) buy over a list of ints?',
        choices: ['Faster arithmetic', 'Contiguous unboxed storage: far less memory and better locality', 'Thread safety', 'Automatic overflow checking'],
        answer: 1,
        why: 'It is a storage optimization: C values packed tight instead of pointers to objects. Math speed is numpy territory.' },
    ] },

  { id: 'py-struct-shallow-deep-copy', topic: 'structures', label: 'copy vs deepcopy',
    summary: 'copy.copy builds a new outer container sharing the inner objects; copy.deepcopy walks the graph and copies everything (memoized, so shared subgraphs stay shared and cycles survive). Slicing and list() are shallow too.',
    talkingPoints: [
      'The aliasing bug pattern: cfg = defaults.copy(); cfg["limits"]["cpu"] = 9 mutates the shared nested dict inside defaults. Shallow copy protects the top level only.',
      'Costs and edges: deepcopy is slow on big graphs and honors __deepcopy__ for customization; for nested plain data, json round-trip is a hacky alternative I would not defend.',
    ],
    quiz: [
      { q: 'new = old.copy(); new["a"].append(1) also changes old["a"]. Why?',
        choices: ['copy is broken', 'Shallow copy duplicates the outer dict only; both outers reference the same inner list', 'append bypasses the copy', 'old and new are the same object'],
        answer: 1,
        why: 'copy.copy copies one level. Inner objects stay shared until you ask for deepcopy.' },
    ] },

  { id: 'py-struct-complexity', topic: 'structures', label: 'Choosing by complexity profile',
    summary: 'The whole structures topic in one frame: list for ordered sequences with cheap tail, deque for cheap ends, set/dict for O(1) membership, heapq for best-first, sorted list plus bisect for range scans. State the access pattern, then the structure.',
    talkingPoints: [
      'My interview move: name the hot operation first. "Reads dominate and membership is hot" points to a set; "streaming best-N" points to a heap; "append-only log" is a list. The structure is the conclusion, not the start.',
      'Second-order effects worth one breath: constant factors and memory locality mean a list scan can beat a set for tiny n - big-O is about growth, not a stopwatch.',
    ],
    quiz: [
      { q: 'A loop does x in seen millions of times against a growing collection. What change matters most?',
        choices: ['Use a tuple for seen', 'Make seen a set - membership drops from O(n) per check to O(1)', 'Sort seen', 'Use a deque'],
        answer: 1,
        why: 'This is the single highest-leverage data-structure fix: linear scans inside a loop are quadratic total work.' },
    ] },

  // ── Control flow and iteration ────────────────────────────────────────
  { id: 'py-iter-iterator-protocol', topic: 'iteration', label: 'The iterator protocol',
    summary: 'An iterable produces an iterator via __iter__; an iterator yields items via __next__ and raises StopIteration when exhausted. for loops, unpacking and comprehensions are all built on these two methods.',
    talkingPoints: [
      'Demystify for in one breath: it calls iter(obj) to get an iterator, then next() until StopIteration, which it catches silently to end the loop. StopIteration is control flow, not an error.',
      'Key distinction: a list is iterable but not an iterator - you can loop it twice. An iterator is one-shot; iter(it) returns it itself, so once consumed it stays consumed.',
    ],
    quiz: [
      { q: 'How does a for loop know when to stop?',
        choices: ['It checks for None', 'It catches StopIteration raised by __next__', 'It compares against len()', 'It polls __iter__ until false'],
        answer: 1,
        why: 'The protocol is two methods plus one exception. StopIteration is the normal, silent end-of-data signal.' },
    ] },

  { id: 'py-iter-generators', topic: 'iteration', label: 'Generators and yield',
    summary: 'A function containing yield is a generator function: calling it returns a generator, and each next() runs to the next yield, suspending with locals intact. Lazy, one-pass, and tiny memory for huge sequences.',
    talkingPoints: [
      'The mechanism worth saying: the generator frame freezes between yields - local variables and instruction pointer persist without a thread or a callback. That is cooperative suspension, the ancestor of async/await.',
      'Practical power: stream a 10 GB log with constant memory because only one line is alive at a time. The trade is one-shotness - you cannot re-loop without recreating the generator.',
    ],
    quiz: [
      { q: 'def g(): yield 1; yield 2 - what does calling g() do?',
        choices: ['Runs the function and returns [1, 2]', 'Returns a generator object; no code runs until the first next()', 'Runs to the first yield and returns 1', 'Raises because nothing is returned'],
        answer: 1,
        why: 'Generator calls are lazy: the body does not execute at call time. Suspension on yield is the whole point.' },
    ] },

  { id: 'py-iter-generator-expressions', topic: 'iteration', label: 'Generator expressions',
    summary: '(x * 2 for x in data) is the lazy cousin of a list comprehension: same syntax, no list materialized. Feed aggregations like sum(x*x for x in xs) to process big data in constant memory.',
    talkingPoints: [
      'Rule of thumb: if the result is consumed once by one aggregation, use a generator expression; if you index or iterate twice, you need the list. sum, any, all, max, ", ".join all accept generators.',
      'Composition: generator pipelines stage map/filter steps without intermediate lists - each stage pulls one item through the whole chain, which is the memory win.',
    ],
    quiz: [
      { q: 'sum(x for x in range(10**9)) uses how much extra memory?',
        choices: ['A gigabyte-scale list', 'Constant - the values are produced one at a time and never stored', 'A tuple of half the values', 'It overflows the stack'],
        answer: 1,
        why: 'A generator expression holds only the current item. This is the canonical lazy-pipeline example.' },
    ] },

  { id: 'py-iter-yield-from', topic: 'iteration', label: 'yield from: delegation',
    summary: 'yield from sub transparently delegates to a sub-generator: values flow through, and send/throw/close are routed down. It replaced loops of for x in sub: yield x and laid the machinery await later reused.',
    talkingPoints: [
      'Beyond the shortcut: yield from establishes a channel - .send() and .throw() reach the innermost generator, which is exactly the plumbing that PEP 492 reused for await on coroutines.',
      'Use it to compose generators recursively, like walking a tree: yield from walk(child) keeps the code flat and the stack logical.',
    ],
    quiz: [
      { q: 'What does yield from sub add over for x in sub: yield x?',
        choices: ['Nothing, it is pure sugar', 'Proper delegation of send, throw and close into the sub-generator, plus return value capture', 'Parallel execution', 'Automatic caching'],
        answer: 1,
        why: 'The loop form forwards pulls only. yield from is a full two-way channel, the same plumbing await stands on.' },
    ] },

  { id: 'py-iter-lazy-range', topic: 'iteration', label: 'range is lazy (but not an iterator)',
    summary: 'range(10**9) is an immutable lazy sequence: O(1) memory, indexable, supports len and membership tests. It is re-iterable, unlike an iterator - you get a fresh iterator each loop.',
    talkingPoints: [
      'Interview distinction: range is a sequence (re-iterable, indexable, has len), not an iterator. Python 2 xrange became Python 3 range; the old list-building range is gone.',
      'Membership is smart: 10**12 in range(10**13) answers by arithmetic, not by scanning - a nice example of a sequence implementing __contains__ efficiently.',
    ],
    quiz: [
      { q: 'Why can you loop over the same range object twice but not the same iterator?',
        choices: ['range caches its values', 'range is a sequence: each for loop asks it for a fresh iterator; an iterator is its own iterator and stays exhausted', 'for loops copy iterators', 'You cannot loop a range twice either'],
        answer: 1,
        why: 'Iterable versus iterator: re-iterability comes from __iter__ manufacturing new state each time.' },
    ] },

  { id: 'py-iter-enumerate-zip', topic: 'iteration', label: 'enumerate and zip',
    summary: 'enumerate(seq, start=0) yields (index, item) pairs - never range(len(seq)). zip stops at the shortest input by default; strict=True (3.10+) raises on length mismatch, catching silent data loss.',
    talkingPoints: [
      'Two idioms that signal fluency: for i, line in enumerate(f, start=1) for numbered lines, and zip(a, b) to lockstep two series. In an interview, range(len(x)) marks you as translating from C.',
      'zip(strict=True) is the quiet 3.10 upgrade: equal-length assumptions become checked assertions. And dict(zip(keys, values)) builds a dict in one expression.',
    ],
    quiz: [
      { q: 'zip([1, 2, 3], "ab") yields what by default?',
        choices: ['(1,"a"), (2,"b"), (3, None)', '(1,"a"), (2,"b") - it stops at the shortest input', 'A ValueError', '(1,"a"), (2,"b"), (3,"")'],
        answer: 1,
        why: 'Shortest-wins is the default; strict=True turns mismatches into an error when silence would hide a bug.' },
    ] },

  { id: 'py-iter-for-else', topic: 'iteration', label: 'for...else',
    summary: 'The else on a loop runs when the loop finished without break. It exists for search loops: found something - break; exhausted candidates - else handles the not-found case without a flag variable.',
    talkingPoints: [
      'Read else as "nobreak": the classic shape is for x in items: if match(x): break; else: handle_missing(). It deletes the found = False bookkeeping.',
      'Same construct on while. The common complaint (confusing name) is fair, so I use it where the search reading is obvious and a flag otherwise - taste, stated.',
    ],
    quiz: [
      { q: 'When does the else clause of a for loop execute?',
        choices: ['Only when the loop body raised', 'When the loop completes without hitting break', 'When the iterable was empty only', 'Always, after the loop'],
        answer: 1,
        why: 'else pairs with break: no break means the search failed, so the else handles the missing case.' },
    ] },

  { id: 'py-iter-itertools', topic: 'iteration', label: 'itertools: chain, islice, groupby, tee',
    summary: 'itertools is the lazy iterator toolkit: chain flattens streams, islice slices without materializing, groupby clusters consecutive equal keys (sort first!), tee clones one stream into n independent ones.',
    talkingPoints: [
      'groupby is the one with a trap: it groups only consecutive runs, so unsorted input produces repeated groups. Sorting first (or reaching for a dict) is the fix everyone learns once.',
      'islice is how you take the first page of an infinite or huge stream, and chain.from_iterable flattens lazily. Both keep pipelines in constant memory.',
    ],
    quiz: [
      { q: 'groupby([1, 1, 2, 1]) yields groups for which keys?',
        choices: ['1 and 2', '1, then 2, then 1 again - it groups consecutive runs only', '1 and 2 sorted', 'It raises on repeats'],
        answer: 1,
        why: 'groupby is run-length grouping, not SQL GROUP BY. Sort first if you want all equal items together.' },
    ] },

  { id: 'py-iter-any-all', topic: 'iteration', label: 'any() and all() short-circuit',
    summary: 'any() stops at the first truthy item, all() stops at the first falsy one. Fed a generator, they short-circuit without building anything - the readable way to say "exists" and "for all".',
    talkingPoints: [
      'Readable intent: any(x.expired for x in sessions) says exists; all(u.active for u in users) says for all. Short-circuit means the generator stops pulling the moment the answer is decided.',
      'Vacuous truth corner: all([]) is True and any([]) is False - matching the math convention, and occasionally the source of a subtle bug when empty input means something else in your domain.',
    ],
    quiz: [
      { q: 'any(x > 10 for x in huge_stream) finds a match early. How much of the stream is consumed?',
        choices: ['All of it', 'Up to and including the first match - any short-circuits', 'Half on average by buffering', 'None until sum() forces it'],
        answer: 1,
        why: 'Short-circuit plus laziness: consumption stops at the deciding element, which is the efficiency story.' },
    ] },

  { id: 'py-iter-next-default', topic: 'iteration', label: 'next() with a default',
    summary: 'next(it, default) returns the default instead of raising StopIteration. Combined with a generator expression it is the idiomatic "find first match": next((x for x in xs if pred(x)), None).',
    talkingPoints: [
      'This one-liner replaces a five-line search loop with a flag. I use it constantly: first user matching an email, first config line with a key.',
      'Careful with None as default when None is a legitimate value - pick a sentinel or accept the ambiguity knowingly.',
    ],
    quiz: [
      { q: 'What is the idiomatic Python for "first item matching p, else None"?',
        choices: ['[x for x in xs if p(x)][0]', 'next((x for x in xs if p(x)), None)', 'list(filter(p, xs))[0]', 'xs.find(p)'],
        answer: 1,
        why: 'The comprehension version raises IndexError on no match and scans everything; next with a default stops at the first hit and has a fallback.' },
    ] },

  { id: 'py-iter-iteration-mutation', topic: 'iteration', label: 'Never mutate while iterating',
    summary: 'Adding or removing items from a list or dict mid-loop skips elements or raises RuntimeError. Fix by iterating over a copy (for x in xs[:]) or, better, building the result fresh with a comprehension.',
    talkingPoints: [
      'Mechanism: list iterators track an index, so removing the current element shifts the rest left and the next index skips one. Dicts detect size change and raise outright.',
      'The style upgrade: mutation-during-iteration usually means you wanted a filter. xs = [x for x in xs if keep(x)] is atomic-looking, readable and correct.',
    ],
    quiz: [
      { q: 'for x in [1, 2, 3, 4]: if x % 2 == 0: xs.remove(x) leaves xs as what?',
        choices: ['[1, 3]', '[1, 3, 4] - removal shifts elements and the iterator index skips one', 'RuntimeError', '[2, 4]'],
        answer: 1,
        why: 'Removing 2 shifts 3 into its slot; the index advances past it. Iterate a copy or rebuild with a comprehension instead.' },
    ] },

  { id: 'py-iter-generator-send', topic: 'iteration', label: 'Generator send, throw, close',
    summary: 'gen.send(v) resumes a generator making yield evaluate to v, enabling two-way coroutine-style generators. throw injects an exception at the suspension point; close raises GeneratorExit for cleanup.',
    talkingPoints: [
      'This is the historical bridge to async: pre-asyncio coroutines were generators driven by send. Understanding that yield can be an expression (x = yield) demystifies what await compiles down to.',
      'Cleanup matters: close() lets finally blocks in generators run; if you abandon a generator holding a resource, contextlib.closing or explicit close prevents leaks.',
    ],
    quiz: [
      { q: 'Inside a generator, x = yield receives its value from where?',
        choices: ['The return statement', 'A caller using gen.send(value)', 'The next yield', 'The __init__ call'],
        answer: 1,
        why: 'send resumes the generator and its argument becomes the value of the suspended yield expression - two-way communication.' },
    ] },

  { id: 'py-iter-reversed-sorted', topic: 'iteration', label: 'sorted() vs reversed() vs .sort()',
    summary: 'sorted(x) returns a new list from any iterable; list.sort() sorts in place and returns None; reversed(x) returns a lazy reverse iterator. key= functions are called once per element (Schwartzian transform built in).',
    talkingPoints: [
      'The classic confusion: xs.sort() returns None because in-place methods signal mutation by returning None - same convention as list.append and dict.update. Chaining off them is the bug.',
      'key functions: sorted(users, key=lambda u: u.last_login) decorates once per element, unlike cmp-to-key comparators which are O(n log n) calls. Stability means equal keys keep input order - useful for multi-pass sorting.',
    ],
    quiz: [
      { q: 'What does xs = xs.sort() do to xs?',
        choices: ['Sorts xs in place', 'Sorts the list, then binds xs to None - sort mutates and returns None', 'Returns a sorted copy', 'Raises TypeError'],
        answer: 1,
        why: 'In-place methods return None by convention. Use sorted(xs) when you need the value.' },
    ] },

  { id: 'py-iter-min-max-key', topic: 'iteration', label: 'min/max with key functions',
    summary: 'min, max and sorted all take key=, applied once per element. min(users, key=lambda u: u.age) finds the youngest without sorting. Empty iterables need default= to avoid ValueError.',
    talkingPoints: [
      'Key insight for interviews: key transforms the comparison, not the data - you get back the original element, which is usually what you want.',
      'min(iter, default=None) is the safe form for possibly-empty streams, 3.4+. And max on (score, item) tuples breaks ties by the item - shuffle first or add a tiebreaker if fairness matters.',
    ],
    quiz: [
      { q: 'min([], key=len) does what?',
        choices: ['Returns None', 'Raises ValueError unless you pass default=', 'Returns 0', 'Returns []'],
        answer: 1,
        why: 'There is no minimum of nothing. default= converts the failure into a value you choose.' },
    ] },

  { id: 'py-iter-iterable-consumed', topic: 'iteration', label: 'Exhausted iterators stay exhausted',
    summary: 'An iterator that is consumed gives nothing on a second pass - no error, just empty results. The bug shape: build a generator, len-check via list() or debug-print it, then the real consumer sees nothing.',
    talkingPoints: [
      'Debugging story: filtering worked in the REPL but not in the function because the REPL printed the list version. Generators are one-shot; materialize once into a list if two consumers need the data.',
      'Design rule: a function that returns a generator should say so (suffix _iter or a docstring), because callers reasonably expect re-iterable results.',
    ],
    quiz: [
      { q: 'it = (x for x in range(3)); list(it) then list(it) again gives what?',
        choices: ['[0, 1, 2] both times', '[0, 1, 2] then [] - the generator was exhausted by the first pass', 'An error the second time', 'None'],
        answer: 1,
        why: 'One-shot semantics: the second list() starts at the end. Silent emptiness is what makes this bug nasty.' },
    ] },

  // ── Functions ─────────────────────────────────────────────────────────
  { id: 'py-func-mutable-default', topic: 'functions', label: 'The mutable default argument trap',
    summary: 'Default values are evaluated once, at def time, and shared across calls. def f(items=[]) accumulates every call in one list. The fix: default to None and create the object inside.',
    talkingPoints: [
      'Mechanism first: defaults live on the function object (f.__defaults__), created when the def statement runs, not per call. That is why the list grows between calls.',
      'The idiom: def f(items=None): items = [] if items is None else items. Dataclasses encode the same lesson as field(default_factory=list).',
    ],
    quiz: [
      { q: 'def f(x, seen=[]): seen.append(x); return seen. f(1); f(2) returns what?',
        choices: ['[2]', '[1, 2] - the default list is created once and shared across calls', '[1]', 'TypeError'],
        answer: 1,
        why: 'The default is one object made at def time. Every call appends to the same list. Default to None and build inside.' },
    ] },

  { id: 'py-func-args-kwargs', topic: 'functions', label: '*args and **kwargs',
    summary: '*args collects extra positionals into a tuple, **kwargs collects extra keywords into a dict. Parameter order: normal, *args, keyword-only, **kwargs. At call sites, * and ** unpack in the opposite direction.',
    talkingPoints: [
      'The symmetry is the mnemonic: star packs in the signature, unpacks at the call. f(*items) spreads a list into positional arguments; f(**opts) spreads a dict into keywords.',
      'Real uses: decorators that pass through (*args, **kwargs), APIs that forward options to a lower layer, and variadic utilities like max(*scores).',
    ],
    quiz: [
      { q: 'In def f(a, *args, **kwargs), calling f(1, 2, 3, x=4) binds args and kwargs to what?',
        choices: ['args=(2,3), kwargs={"x":4}', 'args=(1,2,3), kwargs={"x":4}', 'args=[2,3], kwargs={"x":4}', 'args=(2,3,x=4), kwargs={}'],
        answer: 0,
        why: 'Positionals after a pack into a tuple; keywords pack into a dict. args is always a tuple, never a list.' },
    ] },

  { id: 'py-func-keyword-only', topic: 'functions', label: 'Keyword-only and positional-only parameters',
    summary: 'A bare * in a signature forces everything after it to be passed by name: def f(a, *, timeout). A / forces everything before it to be positional. Together they let APIs evolve without breaking callers.',
    talkingPoints: [
      'API design lever: keyword-only parameters make call sites self-documenting (retry(f, attempts=3)) and let you insert new options anywhere after the * without breaking positional callers.',
      'Positional-only (/, 3.8+) protects names you might rename later and matches C-implemented builtins - len(obj, /) cannot be called len(obj=...).',
    ],
    quiz: [
      { q: 'def f(a, *, b): - which call is legal?',
        choices: ['f(1, 2)', 'f(1, b=2)', 'f(a=1, 2)', 'f(b=2)'],
        answer: 1,
        why: 'The bare * makes b keyword-only. It exists so options stay explicit and signatures stay evolvable.' },
    ] },

  { id: 'py-func-scope-legb', topic: 'functions', label: 'Scope: LEGB',
    summary: 'Name resolution walks Local, Enclosing, Global, Built-in, in that order, first hit wins. Assignment anywhere in a function makes the name local for the whole function - the UnboundLocalError surprise.',
    talkingPoints: [
      'The trap: x = 1; def f(): print(x); x = 2 raises UnboundLocalError, because the assignment makes x local everywhere in f, including the line before it runs.',
      'Shadowing builtins (list = [...]) is the LEGB bug people write daily: the name still resolves, just to your object now, and every later list() call in scope breaks.',
    ],
    quiz: [
      { q: 'def f(): print(x); x = 2, with a global x = 1, does what?',
        choices: ['Prints 1', 'UnboundLocalError - the assignment makes x local to all of f, and the print runs before the binding', 'Prints 2', 'NameError'],
        answer: 1,
        why: 'Scope is decided statically per function. One assignment anywhere makes the name local everywhere in that function.' },
    ] },

  { id: 'py-func-closures', topic: 'functions', label: 'Closures and late binding',
    summary: 'A closure captures the variable, not its value at definition time. Lambdas made in a loop all see the loop variable final value. Fixes: bind as a default argument (lambda x=i:) or functools.partial.',
    talkingPoints: [
      'Classic demo: [lambda: i for i in range(3)] gives three functions all returning 2. The cell they close over holds one variable i, mutated by the loop.',
      'The default-arg fix works because defaults evaluate at def time - the same once-only rule as the mutable-default trap, here used for good.',
    ],
    quiz: [
      { q: 'fns = [lambda: i for i in range(3)]; [f() for f in fns] returns?',
        choices: ['[0, 1, 2]', '[2, 2, 2] - all closures share one late-bound i', '[0, 0, 0]', 'NameError'],
        answer: 1,
        why: 'Closures capture variables by reference. Bind i as a default argument to snapshot it per iteration.' },
    ] },

  { id: 'py-func-global-nonlocal', topic: 'functions', label: 'global and nonlocal',
    summary: 'Rebinding an outer name from inside a function needs a declaration: global for module scope, nonlocal for the nearest enclosing function scope. Mutating an object needs neither - only rebinding does.',
    talkingPoints: [
      'Precise rule: counters.append(x) in a nested function works with no declaration (mutation, no rebinding); counters = counters + [x] fails without global or nonlocal.',
      'nonlocal powers closure-based factories: def counter(): n = 0; def inc(): nonlocal n; n += 1; return n. It is the clean alternative to a one-element list hack or a class.',
    ],
    quiz: [
      { q: 'A nested function wants to increment an integer held in its enclosing function scope. What is required?',
        choices: ['Nothing, ints are mutable', 'nonlocal, because += rebinds the name in the enclosing scope', 'global', 'Make it a list first'],
        answer: 1,
        why: 'n += 1 on an int is rebinding, and rebinding an enclosing name requires nonlocal. Mutation of a mutable object would not.' },
    ] },

  { id: 'py-func-decorators', topic: 'functions', label: 'Decorators',
    summary: '@deco above def f is exactly f = deco(f). A decorator takes a function and returns a callable, usually a wrapper that adds behavior before/after the call. Stacked decorators apply bottom-up.',
    talkingPoints: [
      'Everything else is detail on one equation: f = deco(f). With arguments it is two levels - @deco(arg) means f = deco(arg)(f): the call returns the actual decorator.',
      'Daily examples: @staticmethod, @property, @lru_cache, @app.route. Stacking order reads bottom-up - the decorator closest to def runs first at definition time and innermost at call time.',
    ],
    quiz: [
      { q: '@logged @timed def f(): - what runs first at call time?',
        choices: ['timed, then logged', 'logged - the topmost decorator is the outermost wrapper at call time', 'f itself', 'They run in parallel'],
        answer: 1,
        why: 'f = logged(timed(f)): the last applied decorator sits outermost and its wrapper code runs first.' },
    ] },

  { id: 'py-func-wraps', topic: 'functions', label: 'functools.wraps',
    summary: 'A naive wrapper erases the wrapped function name, docstring and signature. @functools.wraps(fn) on the wrapper copies __name__, __doc__ and __wrapped__, keeping introspection, help() and tests honest.',
    talkingPoints: [
      'Symptom you have seen: every decorated function shows up as "wrapper" in tracebacks and help output. wraps is the one-line cure.',
      'Bonus: __wrapped__ lets tools unwrap to the original - pytest, IDEs and decorators like lru_cache rely on that chain.',
    ],
    quiz: [
      { q: 'What breaks when a decorator forgets functools.wraps?',
        choices: ['The function cannot be called', 'Introspection: __name__, __doc__ and signature all say "wrapper"', 'The arguments get lost', 'Recursion stops working'],
        answer: 1,
        why: 'The wrapper function metadata shadows the original. wraps copies the metadata across so tools keep working.' },
    ] },

  { id: 'py-func-lru-cache', topic: 'functions', label: 'functools.lru_cache',
    summary: '@lru_cache(maxsize=128) memoizes a function: same arguments hit the cache. Arguments must be hashable, results are shared references, and @cache (3.9+) is the unbounded version.',
    talkingPoints: [
      'Requirements people forget: every argument must be hashable (no lists), and cached mutable results are shared - mutating a returned list corrupts the cache for the next caller.',
      'Design note: caching instance methods can pin self forever (memory leak); prefer caching pure module-level functions. lru_cache(maxsize=N) bounds memory with true LRU eviction; @cache is simple but unbounded.',
    ],
    quiz: [
      { q: 'Why can @lru_cache not memoize a function called with a list argument?',
        choices: ['Lists are too large', 'Cache keys are built from the arguments, which must be hashable; lists are not', 'It can, but slowly', 'lru_cache only works on methods'],
        answer: 1,
        why: 'Memoization is a dict lookup keyed by the call arguments. Unhashable arguments cannot form a key.' },
    ] },

  { id: 'py-func-partial', topic: 'functions', label: 'functools.partial',
    summary: 'partial(f, a, b=2) returns a callable with some arguments pre-filled - a function factory without def. Perfect for adapting signatures: passing a configured call where a simple callback is expected.',
    talkingPoints: [
      'Adapter story: a scheduler expects callables of no arguments; partial(run_job, job_id, retries=3) fits a configured call into that slot cleanly.',
      'partial binds positionally from the left and merges keywords; for freezing a later positional you reorder or use a lambda. partial objects are not functions (no __name__) - a small introspection gotcha.',
    ],
    quiz: [
      { q: 'What is partial(pow, 2)(10)?',
        choices: ['20', '1024 - the 2 is pre-bound as the first positional, so it computes pow(2, 10)', '100', 'An error: partial needs keywords'],
        answer: 1,
        why: 'partial fills arguments from the left, so the frozen 2 is the base and the call supplies the exponent.' },
    ] },

  { id: 'py-func-lambda', topic: 'functions', label: 'lambda: one-expression functions',
    summary: 'lambda args: expression creates an anonymous function limited to a single expression - no statements, no annotations. Its home is short key= callbacks; anything longer deserves a named def.',
    talkingPoints: [
      'Idiomatic habitat: sorted(rows, key=lambda r: r.created_at), min/max keys, and occasional callback wiring. Everywhere else a def is clearer and gives you a name in tracebacks.',
      'Remember late binding: lambdas in loops share the loop variable (the closure trap), and lambdas cannot contain statements - that constraint is deliberate, pushing you to def when logic grows.',
    ],
    quiz: [
      { q: 'Which is the idiomatic use of lambda?',
        choices: ['Assigning f = lambda x: x * 2 as a function definition', 'Short throwaway callbacks like sorted(xs, key=lambda x: x.age)', 'Recursion', 'Multi-statement handlers'],
        answer: 1,
        why: 'PEP 8 itself says bind lambdas only as inline callbacks; naming one with assignment is a def in disguise.' },
    ] },

  { id: 'py-func-first-class', topic: 'functions', label: 'Functions are objects',
    summary: 'Functions are first-class: assignable, storable in data structures, passable as arguments. They carry attributes (__name__, __defaults__, __module__) and can grow new ones, which enables registries and strategy tables.',
    talkingPoints: [
      'The payoff pattern: a dispatch dict - HANDLERS = {"scan": do_scan, "bake": do_bake} - replaces a chain of if/elif and is trivially extensible.',
      'Higher-order plumbing (map, sorted key=, decorators) all rests on one fact: a function is a value. Once that clicks, half the stdlib reads differently.',
    ],
    quiz: [
      { q: 'HANDLERS[name](payload) replaces what pattern, and why is it better?',
        choices: ['Recursion', 'An if/elif chain over string names - the dict makes dispatch data, so new handlers are registered, not coded', 'try/except chains', 'Inheritance'],
        answer: 1,
        why: 'First-class functions let behavior live in data structures. Extension becomes registration, which is the open/closed principle in one line.' },
    ] },

  { id: 'py-func-recursion', topic: 'functions', label: 'Recursion and its limit',
    summary: 'CPython caps recursion depth (default about 1000 frames, sys.getrecursionlimit) because every call is a real C-level frame. Deep recursion either bumps the limit carefully or converts to an explicit stack.',
    talkingPoints: [
      'Interview line: Python does no tail-call optimization, so recursion depth is bounded and each level costs a frame - tree walks are fine, 100k-deep linear recursion is not.',
      'Conversion story: replace the call stack with an explicit list stack and a while loop. Same algorithm, heap-allocated frames you control.',
    ],
    quiz: [
      { q: 'Why does deep linear recursion hit RecursionError in CPython even with plenty of RAM?',
        choices: ['Generators block it', 'There is no tail-call optimization and the interpreter enforces a recursion limit on real frames', 'The heap is full', 'The GIL interrupts it'],
        answer: 1,
        why: 'Each call allocates a frame and the limit (default ~1000) exists to catch infinite recursion before the C stack blows.' },
    ] },

  { id: 'py-func-pure', topic: 'functions', label: 'Pure functions and side effects',
    summary: 'A pure function returns a value determined only by its arguments and changes nothing outside itself. Purity makes code trivially testable, cacheable (lru_cache!) and safe to run concurrently; impurity belongs at the edges.',
    talkingPoints: [
      'Architecture line I use: push I/O and mutation to the shell of the program, keep the core pure. The NWF job entrypoints being plain testable Python under a thin Modal wrapper is exactly this pattern.',
      'Purity is what legitimizes memoization and parallel map: no hidden inputs means the cache key is complete and no shared state means no races.',
    ],
    quiz: [
      { q: 'Why does purity make lru_cache safe?',
        choices: ['Pure functions are faster', 'Output depends only on inputs, so a cache key from the arguments is complete - no hidden state can change the answer', 'Caches require pure functions to import', 'It does not; purity is unrelated'],
        answer: 1,
        why: 'Memoization assumes f(args) is always the same value. Hidden inputs (globals, time, I/O) break that assumption silently.' },
    ] },

  { id: 'py-func-singledispatch', topic: 'functions', label: 'functools.singledispatch',
    summary: '@singledispatch turns a function into a generic: the first argument type selects the registered implementation. It is polymorphism without methods - clean when behavior varies by type but you cannot edit the classes.',
    talkingPoints: [
      'Where it earns its keep: serializing heterogeneous objects (to_json.register(datetime) etc.), or adding behavior for third-party types you do not own.',
      'Mechanics: @base.register(int) specializations, dispatch on the first argument type, MRO-aware fallback to the base. Also exists as singledispatchmethod for class methods.',
    ],
    quiz: [
      { q: 'When is singledispatch a better fit than a method override?',
        choices: ['When performance is critical', 'When the varying behavior lives outside the class, or the classes come from another package you cannot edit', 'When you need multiple dispatch', 'When types are unknown'],
        answer: 1,
        why: 'Methods require owning the class. singledispatch dispatches externally on one argument type - open extension without editing the class.' },
    ] },

  // ── OOP and the data model ────────────────────────────────────────────
  { id: 'py-oop-class-instance-attrs', topic: 'oop', label: 'Class vs instance attributes',
    summary: 'Class attributes live on the class and are shared by all instances; instance attributes live in the instance __dict__ and shadow them. A mutable class attribute (tags = []) is shared state - the mutable-default trap wearing a suit.',
    talkingPoints: [
      'Lookup order: instance dict first, then the class (and its MRO). self.x = ... always writes to the instance, which is how a class-level default gets shadowed per instance.',
      'The classic bug: class Dog: tricks = [] - every dog shares one list. Constants and defaults belong on the class; per-object state belongs in __init__.',
    ],
    quiz: [
      { q: 'class A: items = []. Two instances A() and A() both append. What happens?',
        choices: ['Each gets its own list', 'They share one list: the attribute lives on the class, and appending mutates it in place for everyone', 'AttributeError', 'The second append raises'],
        answer: 1,
        why: 'self.items finds the class attribute and mutates it. Only assignment (self.items = ...) would create an instance attribute.' },
    ] },

  { id: 'py-oop-methods', topic: 'oop', label: 'instance, class and static methods',
    summary: 'An instance method gets the instance (self), a @classmethod gets the class (cls) - ideal for alternative constructors - and a @staticmethod gets neither, just namespaced logic.',
    talkingPoints: [
      'The classmethod pattern worth demoing: @classmethod def from_row(cls, row): return cls(row["a"], row["b"]). Constructors that read like the source format keep __init__ simple.',
      'Under the hood, functions in a class body are descriptors; accessing them on an instance binds self. staticmethod skips the binding, which is why it needs no self.',
    ],
    quiz: [
      { q: 'What is the signature difference between cls.from_csv(path) as a classmethod and a staticmethod?',
        choices: ['None - both get the class', 'The classmethod receives cls, so it can construct and return the right subclass; the staticmethod receives nothing automatic', 'staticmethod receives self', 'classmethod cannot construct instances'],
        answer: 1,
        why: 'cls is the point: alternative constructors and subclass-aware factories need the class object passed in.' },
    ] },

  { id: 'py-oop-init-new', topic: 'oop', label: '__new__ vs __init__',
    summary: '__new__ creates and returns the instance (the constructor); __init__ initializes the already-created object. You override __new__ for immutable-type subclassing, singletons, or returning cached instances.',
    talkingPoints: [
      'The split matters when subclassing immutables: you cannot change a str or tuple in __init__ because it already exists - the change must happen in __new__ before the object is fixed.',
      'Normal code almost never touches __new__. Knowing it exists, and why immutables force it, is the interview-grade part.',
    ],
    quiz: [
      { q: 'Why does subclassing str force you into __new__ instead of __init__?',
        choices: ['str forbids __init__', 'The string value is fixed at creation; by the time __init__ runs the immutable object already exists', '__new__ is faster', 'It does not - __init__ works fine'],
        answer: 1,
        why: 'Immutables are fully formed when __new__ returns. __init__ can only decorate, never change, the value.' },
    ] },

  { id: 'py-oop-repr-str', topic: 'oop', label: '__repr__ vs __str__',
    summary: '__repr__ is for developers: unambiguous, ideally a valid constructor call (Point(x=1, y=2)). __str__ is for users: readable. Fallback order: str() uses __str__, else __repr__; the REPL and f"{x!r}" use __repr__.',
    talkingPoints: [
      'The convention I hold: if you write one, write __repr__, and make it look like the constructor. Logs, tracebacks and pdb all print reprs - debugging quality is set here.',
      'datetime is the textbook example: repr is datetime.datetime(2026, 11, 5, 3, 0), str is 2026-11-05 03:00:00. Same object, two audiences.',
    ],
    quiz: [
      { q: 'A class defines only __repr__. What does print(obj) show?',
        choices: ['A default <object at 0x...>', 'The __repr__ output - __str__ falls back to __repr__', 'An error', 'The class docstring'],
        answer: 1,
        why: 'object.__str__ delegates to __repr__. Defining repr alone covers both, which is why it is the priority.' },
    ] },

  { id: 'py-oop-eq-hash', topic: 'oop', label: '__eq__ and __hash__ together',
    summary: 'Define __eq__ and Python 3 sets __hash__ to None: your object becomes unhashable until you define a matching __hash__. Contract: equal objects must hash equal; use the same fields in both, from immutable state.',
    talkingPoints: [
      'The guardrail exists because value equality plus identity hash breaks sets and dicts: two equal objects could hash differently and both get stored.',
      'Practical recipe: hash((self.a, self.b)) over the same immutable fields __eq__ compares. Mutable value-objects should stay unhashable; frozen dataclasses generate both for you.',
    ],
    quiz: [
      { q: 'Why does Python 3 null out __hash__ when you define __eq__?',
        choices: ['To save memory', 'Because the default identity-based hash would violate the rule that equal objects must hash equal', 'Hashing is deprecated', 'To force dataclasses'],
        answer: 1,
        why: 'The contract is enforced by removing the inconsistent default. You opt back in by defining a value-based hash explicitly.' },
    ] },

  { id: 'py-oop-mro-super', topic: 'oop', label: 'MRO and cooperative super()',
    summary: 'Method resolution order in Python 3 is C3 linearization: a deterministic, monotonic ordering of the inheritance graph. super() delegates to the next class in the MRO, not the parent - which is what makes cooperative multiple inheritance work.',
    talkingPoints: [
      'Key reframe: super() does not mean "parent"; it means "next in line for this instance". In a diamond, every class in the chain runs exactly once, in an order you can inspect via Class.__mro__.',
      'Cooperation rule: every method in the chain must call super() and accept/pass **kwargs, or one link silently drops arguments - the classic mixin bug.',
    ],
    quiz: [
      { q: 'class B(A); class C(A); class D(B, C). What is D.__mro__?',
        choices: ['D, B, A, C, object', 'D, B, C, A, object - C3 keeps local order and defers shared bases', 'D, C, B, A, object', 'Depends on instantiation order'],
        answer: 1,
        why: 'C3 linearization: children before parents, left-to-right, with the shared base A after both B and C. Deterministic and inspectable.' },
    ] },

  { id: 'py-oop-abc', topic: 'oop', label: 'Abstract base classes',
    summary: 'abc.ABC with @abstractmethod makes a class uninstantiable until every abstract method is implemented - interface enforcement at instantiation time, with partial implementation support and isinstance checks.',
    talkingPoints: [
      'Value: the contract fails fast at construction, not at first call. Subclasses can still provide some concrete shared behavior - an ABC is an interface plus optional implementation.',
      'Contrast with typing.Protocol: ABCs are nominal (you must inherit or register), Protocols are structural (matching shape is enough). Choosing between them is a real design discussion.',
    ],
    quiz: [
      { q: 'Instantiating a subclass that misses an @abstractmethod gives what?',
        choices: ['It works until the method is called', 'TypeError at instantiation time listing the missing abstract methods', 'A warning only', 'NotImplementedError at import'],
        answer: 1,
        why: 'ABCs move the contract failure to construction, the earliest moment the object exists.' },
    ] },

  { id: 'py-oop-duck', topic: 'oop', label: 'Duck typing',
    summary: '"If it walks like a duck": Python cares about behavior, not declared type. Code accepts anything with the right methods - a file-like object needs read(), not a File base class. EAFP (try, catch AttributeError) is the idiomatic check.',
    talkingPoints: [
      'Practical consequence: functions that take "a path or a file-like object" are normal Python. The protocol (the set of methods used) is the real interface.',
      'When duck typing needs a seatbelt: hasattr checks, ABCs for nominal contracts, or typing.Protocol for statically checked structure. I pick based on how expensive a wrong duck is.',
    ],
    quiz: [
      { q: 'What does "file-like object" mean in Python terms?',
        choices: ['A subclass of io.FileIO', 'Any object implementing the methods the caller uses, like read() or write() - behavior, not inheritance', 'A string path', 'An object with __file__'],
        answer: 1,
        why: 'Duck typing defines interfaces by use. That is why fakes and stubs slot into Python tests so cleanly.' },
    ] },

  { id: 'py-oop-dataclasses', topic: 'oop', label: 'dataclasses',
    summary: '@dataclass generates __init__, __repr__ and __eq__ from annotated fields. field(default_factory=list) handles mutable defaults; frozen=True adds immutability plus hashing; order=True adds comparisons; slots=True (3.10+) cuts memory.',
    talkingPoints: [
      'default_factory exists because of the mutable-default trap at class level: field(default_factory=list) calls list per instance, sharing nothing.',
      'Dataclasses do NOT validate types - the annotations are metadata unless a library enforces them. If you need runtime validation, that is pydantic territory, and I name the boundary.',
    ],
    quiz: [
      { q: 'Why field(default_factory=list) instead of field(default=[])?',
        choices: ['It is faster', 'A list default would be one object shared by all instances; the factory is called fresh per instance', 'default= is not supported', 'It enables hashing'],
        answer: 1,
        why: 'Same once-only trap as function defaults. The factory defers construction to instance-creation time.' },
    ] },

  { id: 'py-oop-slots', topic: 'oop', label: '__slots__',
    summary: '__slots__ declares a fixed attribute set: instances skip the per-object __dict__, saving substantial memory on small, numerous objects and making typos in attribute names raise immediately. Cost: no dynamic attributes and pickle/multiple-inheritance caveats.',
    talkingPoints: [
      'When I reach for it: millions of small records (parsed rows, tokens, points). The per-instance dict overhead dominates there, and slots remove it.',
      'Trade-offs to say out loud: no ad-hoc attribute attachment, weakrefs need "weakref" declared, and every class in an inheritance chain needs slots or the dict comes back.',
    ],
    quiz: [
      { q: 'What is the primary reason to add __slots__ to a class?',
        choices: ['Faster method calls', 'Memory: instances skip the per-object __dict__, and undeclared attribute names fail fast', 'Thread safety', 'Automatic repr'],
        answer: 1,
        why: 'Slots trade flexibility for a fixed layout. On mass small objects the saved dict overhead is the entire point.' },
    ] },

  { id: 'py-oop-properties', topic: 'oop', label: 'Properties',
    summary: '@property exposes a method as an attribute, so obj.area calls area() without call syntax. It lets a plain attribute grow computation or validation later (@x.setter) without breaking callers - the Python answer to getters.',
    talkingPoints: [
      'The refactor story: start with a public attribute, and when you need validation or derived values, upgrade to a property with the same name. Callers never notice - that is why Python skips mandatory getters.',
      'Setters are for validation and invalidation (recompute a cache), not for hiding everything. And remember properties are data descriptors: they beat instance attributes in lookup.',
    ],
    quiz: [
      { q: 'Why do Python classes not need the Java habit of getX()/setX() up front?',
        choices: ['Python has no methods', 'A plain attribute can later become a property with the same name, adding logic without changing call sites', 'Attributes are private by default', 'Properties are faster'],
        answer: 1,
        why: 'The property escape hatch makes the simple thing (public attribute) the right default.' },
    ] },

  { id: 'py-oop-descriptors', topic: 'oop', label: 'Descriptors: the mechanism under properties',
    summary: 'Any object defining __get__ (and optionally __set__/__delete__) is a descriptor, and attribute lookup defers to it. Properties, classmethod, staticmethod and plain methods are all descriptors - this is how self gets bound.',
    talkingPoints: [
      'The demystifying fact: functions are descriptors; a method call obj.f() is f.__get__(obj, type(obj))() with the instance injected. Once you see that, "bound method" stops being magic.',
      'Data descriptors (define __set__) win over instance __dict__; non-data (functions, __get__ only) lose to it. That one rule explains why instance attributes can shadow methods but not properties.',
    ],
    quiz: [
      { q: 'Why can an instance attribute shadow a method but not a property?',
        choices: ['Properties are private', 'Properties are data descriptors (they define __set__), which take precedence over the instance __dict__; functions are non-data descriptors, which lose to it', 'Methods live on the metaclass', 'Attribute order is random'],
        answer: 1,
        why: 'Lookup precedence: data descriptor, then instance dict, then non-data descriptor. One rule, many mysteries solved.' },
    ] },

  { id: 'py-oop-dunder-protocols', topic: 'oop', label: 'Dunder methods power the syntax',
    summary: 'len(x) calls x.__len__, x[i] calls __getitem__, in calls __contains__, iteration calls __iter__, with calls __enter__/__exit__. Implementing a few dunders makes your object work with the whole language surface.',
    talkingPoints: [
      'Design leverage: a collection class that implements __len__, __iter__ and __getitem__ instantly works with for, list(), sorted(), max(), unpacking - you get the stdlib for free.',
      'Operators too: __add__ for +, __eq__/__lt__ for comparisons (or functools.total_ordering to fill the rest from two). Special methods are looked up on the class, not the instance - a subtle detail interviewers probe.',
    ],
    quiz: [
      { q: 'What is the minimum that makes an object work in a for loop?',
        choices: ['__next__ only', '__iter__ returning an iterator (or __getitem__ with 0-based indexes as a legacy fallback)', '__len__', '__contains__'],
        answer: 1,
        why: 'for calls iter(), which wants __iter__. The old __getitem__ sequence protocol still works as a fallback - a nice depth point.' },
    ] },

  { id: 'py-oop-composition', topic: 'oop', label: 'Composition over inheritance',
    summary: 'Prefer assembling behavior from held objects over deepening class hierarchies. Inheritance is for true is-a relationships and frameworks; composition keeps coupling visible and testable. Mixins are the narrow middle: tiny, focused, cooperative.',
    talkingPoints: [
      'Test line: deep hierarchies couple a change at the top to every leaf; composition makes each dependency an explicit constructor argument you can stub.',
      'Mixin rules when you do use them: no __init__ state of their own, cooperative super(), one focused behavior. A mixin that needs state is really a base class in denial.',
    ],
    quiz: [
      { q: 'What is the strongest signal you should refactor inheritance into composition?',
        choices: ['The class has few methods', 'Subclasses override most of the parent or need only part of its behavior - the is-a claim was false', 'The parent is small', 'You need more classes'],
        answer: 1,
        why: 'Partial reuse means the relationship was has-a all along. Inheritance promises full substitutability.' },
    ] },

  { id: 'py-oop-metaclasses', topic: 'oop', label: 'Metaclasses, honestly scoped',
    summary: 'Classes are objects created by a metaclass (default type). Overriding a metaclass __new__/__init__ customizes class creation - powerful for registries and frameworks, but __init_subclass__ and decorators cover most real needs with less magic.',
    talkingPoints: [
      'Interview balance: know that class creation is itself a call (type(name, bases, ns) or a custom metaclass), and that plugin registries can hook it - then say the modern, simpler tools first: __init_subclass__ (3.6+) and class decorators.',
      'Rule of thumb: if users of your framework never notice the metaclass, fine; if they must understand it, you have probably over-built.',
    ],
    quiz: [
      { q: 'What is the modern first choice for "run code whenever a subclass is defined"?',
        choices: ['A metaclass', '__init_subclass__ on the base class - class-creation hooks without metaclass machinery', 'A module-level function', '__new__ on the subclass'],
        answer: 1,
        why: '__init_subclass__ covers the common hook cases explicitly and simply. Metaclasses remain for deeper framework surgery.' },
    ] },

  // ── Errors and robustness ─────────────────────────────────────────────
  { id: 'py-err-hierarchy', topic: 'errors', label: 'The exception hierarchy',
    summary: 'Everything raisable derives from BaseException; normal errors derive from Exception. KeyboardInterrupt and SystemExit sit outside Exception deliberately - so except Exception: is the widest safe catch, and bare except: is a bug.',
    talkingPoints: [
      'Why the split exists: Ctrl-C and sys.exit() must survive generic error handling. Catching Exception respects that; bare except: (or catching BaseException) swallows interrupts and makes processes unkillable.',
      'Know the common leaves: TypeError (wrong operation for the type) vs ValueError (right type, wrong value), LookupError splitting into KeyError/IndexError, OSError for the OS layer.',
    ],
    quiz: [
      { q: 'Why is except Exception: acceptable but bare except: a bug?',
        choices: ['Bare except is slower', 'Bare except also catches KeyboardInterrupt and SystemExit, so Ctrl-C and sys.exit get swallowed', 'They are identical', 'Exception catches too much'],
        answer: 1,
        why: 'The hierarchy was designed so generic handlers never trap control-flow exceptions. Bare except bypasses that design.' },
    ] },

  { id: 'py-err-try-else-finally', topic: 'errors', label: 'try / except / else / finally',
    summary: 'except handles failures, else runs only when the try block succeeded, finally always runs (even through return or a new exception). Keep the try block tiny so you catch only the errors you meant to.',
    talkingPoints: [
      'The underrated clause is else: code after the risky call but before cleanup goes there, so an unexpected exception from it is not swallowed by your handler.',
      'finally is for release, not control flow: a return inside finally swallows in-flight exceptions - a nasty bug class worth naming.',
    ],
    quiz: [
      { q: 'Where does code run that must happen after success but should not be covered by the except handler?',
        choices: ['Inside try, after the risky call', 'In the else clause - it runs only if the try block raised nothing', 'In finally', 'After the whole statement'],
        answer: 1,
        why: 'else separates "the operation succeeded" logic from the protected region, keeping the handler scope tight.' },
    ] },

  { id: 'py-err-raise-from', topic: 'errors', label: 'Exception chaining: raise ... from',
    summary: 'raise NewError("context") from orig sets an explicit cause, printing "The above exception was the direct cause". Inside a handler, a bare raise re-raises; raise-from-None suppresses noisy context deliberately.',
    talkingPoints: [
      'Debugging value: chaining preserves the original traceback while adding the layer of meaning ("loading config failed" over the raw KeyError). In triage, that second line of the chain is where I start.',
      'raise X from None is the honest choice when the low-level error would mislead - say, a clean 404 raised from a messy internal KeyError.',
    ],
    quiz: [
      { q: 'What does raise AppError("load failed") from orig preserve that a plain raise AppError loses?',
        choices: ['Nothing, only the message changes', 'An explicit causal chain: orig is attached as __cause__ and shown in the traceback', 'The original exception type', 'The line numbers only'],
        answer: 1,
        why: 'Chaining keeps both stories: the high-level meaning and the low-level origin, printed as one narrative.' },
    ] },

  { id: 'py-err-custom', topic: 'errors', label: 'Custom exceptions',
    summary: 'Domain exceptions are one-liners - class InsufficientFunds(Exception): pass - that let callers catch exactly your failure without string-matching messages. Give them a common base per library and attach structured data as attributes.',
    talkingPoints: [
      'Design rule: one base per package (class NWFError(Exception)) with specific subclasses, so users can catch narrowly or broadly. Document what each public function raises.',
      'Carry data, not strings: err.position_id beats parsing "position 42 not found". Messages are for humans; attributes are for code.',
    ],
    quiz: [
      { q: 'Why give a library a common exception base class?',
        choices: ['It is required by raise', 'Callers can catch the whole family with one except while still allowing fine-grained catches of subclasses', 'It improves traceback speed', 'Bases carry the message'],
        answer: 1,
        why: 'The hierarchy is the API: broad catch for "your library failed", narrow catch for "this specific failure".' },
    ] },

  { id: 'py-err-eafp-lbyl', topic: 'errors', label: 'EAFP vs LBYL',
    summary: '"Easier to ask forgiveness than permission": try the operation, handle the failure - versus "look before you leap": pre-check conditions. Python favors EAFP because checks can race with the operation and dict access is optimized for the hit path.',
    talkingPoints: [
      'The race argument is the strong one: os.path.exists(path) then open(path) has a gap where the file can vanish; try: open(...) except FileNotFoundError is atomic in effect.',
      'Also style: EAFP keeps the happy path flat and fast. LBYL survives for cheap, common checks where failure is expected routine, like a membership test before a set remove.',
    ],
    quiz: [
      { q: 'Why is try: open(f) except FileNotFoundError better than checking os.path.exists first?',
        choices: ['exists is deprecated', 'The check and the use are two separate operations with a race window; the exception version cannot be split', 'try blocks are faster', 'exists follows symlinks'],
        answer: 1,
        why: 'TOCTOU: time-of-check to time-of-use races make pre-checks unreliable. Asking forgiveness is atomic and correct.' },
    ] },

  { id: 'py-err-context-managers', topic: 'errors', label: 'Context managers and with',
    summary: 'with expr as x: calls expr.__enter__ (bound to x) and guarantees __exit__ runs on the way out, exception or not. Files, locks and DB transactions all use it - resource release without remembering a finally.',
    talkingPoints: [
      'Guarantee to state: __exit__ runs even if the body raises, and it receives the exception (type, value, traceback); returning True from __exit__ suppresses it.',
      'Everyday leverage: locks release, files close, transactions commit-or-rollback, timers stop. When reviewing code, an un-with-ed resource is a leak candidate.',
    ],
    quiz: [
      { q: 'If the with body raises, what does __exit__ receive and what can it do?',
        choices: ['Nothing - it is skipped', 'The exception triple (type, value, traceback); returning True suppresses propagation', 'Only the message; it cannot suppress', 'It re-raises automatically'],
        answer: 1,
        why: '__exit__ sees the in-flight exception and gets a vote. Suppression is how contextlib-style tools implement controlled swallowing.' },
    ] },

  { id: 'py-err-contextlib', topic: 'errors', label: 'contextlib: @contextmanager, suppress, ExitStack',
    summary: '@contextmanager turns a generator into a context manager (code before yield = enter, finally after = exit). suppress(FileNotFoundError) swallows specific errors explicitly; ExitStack composes a dynamic number of contexts.',
    talkingPoints: [
      'The generator trick: setup runs to the yield, the with body executes, then the generator resumes into your finally. Wrap the yield in try/finally or exceptions leak past cleanup.',
      'ExitStack solves "open n files / n determined at runtime" - you cannot nest a dynamic number of with statements syntactically, so you push them onto a stack.',
    ],
    quiz: [
      { q: 'When do you need ExitStack instead of nested with statements?',
        choices: ['When contexts are slow', 'When the number of context managers is determined at runtime, like a list of files to open', 'When using async only', 'Never - it is decorative'],
        answer: 1,
        why: 'Syntax fixes nesting at write time. ExitStack makes the set of managed resources a runtime value.' },
    ] },

  { id: 'py-err-traceback', topic: 'errors', label: 'Reading tracebacks',
    summary: 'Tracebacks read bottom-up: the last line names the exception, the last frame is where it blew up, and the frames above are the call path. Chained tracebacks show the cause first. traceback module formats them programmatically.',
    talkingPoints: [
      'Triage habit: last line first (type and message), last frame second (the site), then walk up to the first frame in YOUR code - library frames above it are usually the messenger.',
      'In production services I want structured tracebacks logged with request context; a bare 500 with no traceback is the free-tier-refresh lesson - failures must explain themselves.',
    ],
    quiz: [
      { q: 'First move when reading a long traceback?',
        choices: ['Read the top frame', 'Read the last line (exception type and message), then the deepest frame, then up to your own code', 'Count the frames', 'Search for the word Error'],
        answer: 1,
        why: 'Python prints the oldest call first and the failure last. Bottom-up reading is the skill.' },
    ] },

  { id: 'py-err-warnings', topic: 'errors', label: 'warnings vs exceptions',
    summary: 'warnings.warn signals "this works but should change" (deprecations, resource smells) without stopping execution. The warnings module filters by category and location; -W error turns them into exceptions for CI.',
    talkingPoints: [
      'Use split: exceptions stop the caller now; warnings notify developers while behavior continues. DeprecationWarning and FutureWarning are the classic pair.',
      'Operational tip: run test suites with warnings promoted to errors to catch deprecations before the upgrade does, and use stacklevel=2 so the warning points at the caller, not your library line.',
    ],
    quiz: [
      { q: 'Why pass stacklevel=2 to warnings.warn inside a library?',
        choices: ['It warns twice', 'So the reported source location is the caller code, not the library internals', 'It makes the warning an error', 'It dedupes warnings'],
        answer: 1,
        why: 'A warning should point at the code to change. Without stacklevel the user sees your internal line, which they cannot fix.' },
    ] },

  { id: 'py-err-assert', topic: 'errors', label: 'assert: invariants, not validation',
    summary: 'assert checks internal invariants - things that must be true if the code is correct. It is stripped entirely under python -O, so never use it for input validation, auth checks or anything security-relevant.',
    talkingPoints: [
      'The -O footgun: python -O removes asserts, so a program whose correctness depends on them changes behavior in optimized mode. Validation of external input must raise real exceptions.',
      'Good use: postcondition checks during development (assert len(result) == expected) and unreachable-branch documentation. pytest rewrites asserts to give rich diffs, which is why test asserts stay plain.',
    ],
    quiz: [
      { q: 'Why must request validation never be an assert?',
        choices: ['assert is slow', 'asserts vanish under python -O, silently removing the check in optimized runs', 'asserts cannot carry messages', 'Validation must return bool'],
        answer: 1,
        why: 'Optimization strips the check. Anything protecting against bad input or bad actors must be a real raise.' },
    ] },

  { id: 'py-err-logging', topic: 'errors', label: 'logging, not print',
    summary: 'The logging module gives levels (DEBUG...CRITICAL), hierarchical loggers, handlers and formatters. Libraries get_logger(__name__) and stay silent by default; applications configure handlers once at entry.',
    talkingPoints: [
      'Library rule: never configure handlers in library code - the application owns routing. Libraries log to a named child logger and let the app decide where records go.',
      'Practice points: logger.exception() inside a handler attaches the traceback automatically; f-strings in log calls pay formatting even when the level is off - lazy %s args avoid that at scale.',
    ],
    quiz: [
      { q: 'What does logger.exception("save failed") add over logger.error?',
        choices: ['A higher level', 'The current exception traceback, captured automatically from inside the except block', 'An email alert', 'A stack overflow guard'],
        answer: 1,
        why: 'It is error-plus-traceback in one call, and only valid inside an active exception handler.' },
    ] },

  { id: 'py-err-exception-groups', topic: 'errors', label: 'ExceptionGroup and except* (3.11+)',
    summary: 'Python 3.11 added ExceptionGroup for "many failures at once" - think concurrent tasks - and except* to handle selected types inside a group while the rest propagate. Structured concurrency (TaskGroup) raises these.',
    talkingPoints: [
      'Why it exists: before 3.11, ten failing tasks collapsed into whichever exception arrived first and the rest vanished. ExceptionGroup keeps them all, matching how asyncio.TaskGroup reports.',
      'except* ValueError as eg: catches the ValueErrors inside a group; unmatched members re-raise as a new group. Tracebacks render the tree of failures.',
    ],
    quiz: [
      { q: 'What problem does ExceptionGroup solve in concurrent code?',
        choices: ['Slow exceptions', 'Multiple tasks failing simultaneously used to lose all but one failure; groups carry the whole set and except* handles them selectively', 'Chained imports', 'Recursion depth'],
        answer: 1,
        why: 'Fan-out work fails in parallel, and the reporting has to be parallel too. Groups plus except* are that reporting.' },
    ] },

  { id: 'py-err-typeerror-valueerror', topic: 'errors', label: 'TypeError vs ValueError (and friends)',
    summary: 'TypeError: the operation does not apply to that kind of object (len(3)). ValueError: the type is right, the content is wrong (int("abc")). KeyError/IndexError are lookup misses; AttributeError is a missing attribute; RuntimeError is the generic "state is wrong".',
    talkingPoints: [
      'The distinction carries intent: catching ValueError around int(x) says "bad input"; catching TypeError says "wrong kind of thing entirely". Reviewers read the exception choice as a claim.',
      'Also know StopIteration (iterator exhaustion, usually invisible), OverflowError (rare in Python - floats overflow to inf, ints never), and ZeroDivisionError which is an ArithmeticError.',
    ],
    quiz: [
      { q: 'int("not-a-number") raises which, and why not TypeError?',
        choices: ['TypeError - wrong type', 'ValueError - a string is the right type for int(); its contents just cannot parse', 'KeyError', 'SyntaxError'],
        answer: 1,
        why: 'Type means kind of object, value means the contents. Right kind, bad content is ValueError.' },
    ] },

  { id: 'py-err-finally-return', topic: 'errors', label: 'finally vs return interactions',
    summary: 'finally runs even when the try block returns - but a return (or raise) inside finally replaces the original result and swallows any in-flight exception. Keep finally to cleanup; never return from it.',
    talkingPoints: [
      'Two gotchas in one clause: finally overrides the return value if it has its own return, and it silently discards an active exception. Both are code-review red flags.',
      'Legit pattern: def read(): f = open(p); try: return f.read(); finally: f.close() - the close runs after the value is computed but before the caller sees it.',
    ],
    quiz: [
      { q: 'try: return 1; finally: return 2 - what does the function return?',
        choices: ['1', '2 - a return in finally replaces the pending return (and would also swallow an in-flight exception)', 'An error', 'Both, as a tuple'],
        answer: 1,
        why: 'finally gets the last word. That power is exactly why returning from finally is forbidden style.' },
    ] },

  { id: 'py-err-retry-patterns', topic: 'errors', label: 'Retries with backoff and idempotency',
    summary: 'Retry only transient, safe-to-repeat failures: bounded attempts, exponential backoff with jitter, a total deadline. The companion requirement is idempotency - a retried operation must not double-apply, or retries create duplicates.',
    talkingPoints: [
      'Shape I describe: up to n attempts, sleep = base * 2**k plus random jitter (decorrelated, so fleets of clients do not retry in lockstep), capped by an overall deadline so retries cannot exceed the caller patience.',
      'The deep point connects to the estate graph: at-least-once delivery means duplicates arrive whether you retry or not, so the handler must be idempotent - retriable and idempotent are the same property seen from two sides.',
    ],
    quiz: [
      { q: 'Why does a retry policy require idempotency from the operation?',
        choices: ['Idempotency makes calls faster', 'A retry can double-apply the operation (two charges, two orders); idempotency makes the repeat harmless', 'Backoffs need unique keys', 'It does not - retries are always safe'],
        answer: 1,
        why: 'Retry without idempotency converts one failure into two effects. Safe repetition is a property of the operation, not the loop.' },
    ] },

  // ── Stdlib essentials ─────────────────────────────────────────────────
  { id: 'py-std-pathlib', topic: 'stdlib', label: 'pathlib over os.path',
    summary: 'pathlib.Path wraps paths as objects: p / "sub" / "file.txt", read_text, write_text, glob, mkdir(parents=True, exist_ok=True). It replaces os.path.join string surgery with composable, tested pieces.',
    talkingPoints: [
      'The operators do the talking: config = Path.home() / ".config" / "app" / "settings.toml". Existence, suffix, stem, parent, iteration - all methods, no string splitting.',
      'Boundary note: some APIs still want strings (older libs), so str(p) at the edge. And Path.read_text always takes an explicit encoding from me, on purpose.',
    ],
    quiz: [
      { q: 'What is the pathlib idiom for creating nested directories safely?',
        choices: ['os.makedirs with exist_ok', 'Path(p).mkdir(parents=True, exist_ok=True)', 'Path(p).touch()', 'shutil.mkdir'],
        answer: 1,
        why: 'parents=True creates intermediates, exist_ok=True makes reruns a no-op - idempotent setup in one call.' },
    ] },

  { id: 'py-std-json', topic: 'stdlib', label: 'json: the wire format boundary',
    summary: 'json.dumps/loads convert between Python objects and JSON text. JSON has no datetime, set, tuple (becomes list), or bytes; default= and a custom JSONEncoder handle the rest. JSON keys are always strings.',
    talkingPoints: [
      'Round-trip surprises to know: dict int keys come back as strings, tuples come back as lists. If type fidelity matters, that is a schema job, not a json job.',
      'Datetime strategy: ISO 8601 strings on the wire (dt.isoformat(), datetime.fromisoformat on the way back) - explicit and sortable. Never pickle across a trust boundary; json exists because pickle executes code.',
    ],
    quiz: [
      { q: 'json.loads(json.dumps({1: "a"})) returns what?',
        choices: ['{1: "a"}', '{"1": "a"} - JSON object keys are always strings, so int keys stringify', 'An error', '{1.0: "a"}'],
        answer: 1,
        why: 'The format itself has string-only keys. Round-tripping Python dicts with non-string keys silently changes types.' },
    ] },

  { id: 'py-std-re', topic: 'stdlib', label: 're: regular expressions',
    summary: 're.search finds anywhere, re.match anchors at the start, re.fullmatch anchors both ends. Use raw strings (r"\\d+"), compile hot patterns once, and name groups with (?P<name>...) for readable extraction.',
    talkingPoints: [
      'The anchoring confusion is the classic: match only tries position 0, so "find anywhere" is search. fullmatch is the one you want for validation.',
      'Raw strings matter because \\d in a normal string is already an escape attempt; r"\\d+" passes the backslash through to the regex engine. Compiled patterns cache anyway, but explicit compile documents intent.',
    ],
    quiz: [
      { q: 're.match(r"\\d+", "abc123") returns what?',
        choices: ['A match for 123', 'None - match anchors at the start; you wanted search', 'An error', '123 as a string'],
        answer: 1,
        why: 'match tries only from position zero. search scans. fullmatch validates the whole string - three different tools.' },
    ] },

  { id: 'py-std-datetime', topic: 'stdlib', label: 'datetime: aware beats naive',
    summary: 'A datetime is naive or aware (has tzinfo). Mixing them raises; naive arithmetic across DST lies. Store UTC (datetime.now(timezone.utc)), convert at the edges, and serialize as ISO 8601.',
    talkingPoints: [
      'Production rule: aware everywhere inside the system, naive never. "Local time" is a presentation concern - convert with astimezone at the boundary for the user.',
      'The failure that teaches: adding 24 hours across a DST transition with naive datetimes gives the wrong wall time; aware datetimes with zoneinfo handle the transition. dateutil/zoneinfo are the timezone sources.',
    ],
    quiz: [
      { q: 'Why store datetimes in UTC rather than local time?',
        choices: ['UTC is faster', 'Local times are ambiguous around DST and change with the host; UTC is unambiguous, and presentation converts at the edge', 'Databases require it', 'UTC uses less storage'],
        answer: 1,
        why: 'Twice-a-year a local time occurs twice or never. UTC has no such cracks; localize only for humans at the edge.' },
    ] },

  { id: 'py-std-subprocess', topic: 'stdlib', label: 'subprocess.run, safely',
    summary: 'subprocess.run([cmd, arg], check=True, capture_output=True, text=True) is the modern one-call API. Pass an argument list, never a shell string with user data - shell=True with interpolation is an injection hole.',
    talkingPoints: [
      'Security line: list-form arguments bypass the shell parser, so a filename with spaces or semicolons is data, not syntax. If shell=True appears in review, I ask what it buys.',
      'check=True converts nonzero exits into CalledProcessError - silent failures otherwise. timeout= belongs on every call in services, because a hung child is a hung request.',
    ],
    quiz: [
      { q: 'Why is subprocess.run(["ls", user_input]) safer than run(f"ls {user_input}", shell=True)?',
        choices: ['It is faster', 'The list form never invokes a shell, so metacharacters in user_input stay data instead of becoming commands', 'shell=True is deprecated', 'It captures output automatically'],
        answer: 1,
        why: 'Injection happens at the shell parser. Remove the shell, remove the parsing, remove the vulnerability class.' },
    ] },

  { id: 'py-std-argparse', topic: 'stdlib', label: 'argparse for real CLIs',
    summary: 'argparse builds a command-line interface from declarations: types, defaults, required flags, subcommands, and free --help. It beats hand-parsing sys.argv, which has no validation and no discoverability.',
    talkingPoints: [
      'Structure I use: a build_parser() returning ArgumentParser, main(argv=None) taking parsed args - so the CLI is importable and testable without a subprocess.',
      'Subparsers model git-style tools (tool fetch / tool bake), and type=pathlib.Path / type=int moves validation into the parser where errors are reported well.',
    ],
    quiz: [
      { q: 'Why write main(argv=None) with parser.parse_args(argv) instead of reading sys.argv directly?',
        choices: ['It is shorter', 'The CLI becomes importable and unit-testable by passing an argument list, and argparse owns validation and help', 'sys.argv is private', 'argparse is faster'],
        answer: 1,
        why: 'Separating parsing from action gives you tests without spawning processes, and --help for free.' },
    ] },

  { id: 'py-std-os-environ', topic: 'stdlib', label: 'Configuration through os.environ',
    summary: 'Environment variables are the twelve-factor config channel: os.environ["REQUIRED"] (fail fast) versus os.environ.get("OPT", default). They are strings - parse and validate at startup, then pass values down explicitly.',
    talkingPoints: [
      'Startup discipline: read env once at process start, parse into typed config (bool from "true" is manual!), and crash loudly on the missing required ones - a config error at boot beats one mid-request.',
      'Secrets note: env vars are visible to child processes and some diagnostics; for real secrets prefer a manager (the estate uses Secret Manager binding), with env as the local-dev path.',
    ],
    quiz: [
      { q: 'What is the subtlety in os.environ.get("DEBUG", False)?',
        choices: ['It is fine as is', 'The value is a string: "false" is truthy; env config needs explicit parsing', 'get raises on missing', 'It is not cross-platform'],
        answer: 1,
        why: 'Environment values are always text. Any non-string config (bools, ints, lists) must be parsed deliberately.' },
    ] },

  { id: 'py-std-sqlite3', topic: 'stdlib', label: 'sqlite3 and parameter substitution',
    summary: 'sqlite3 gives a real embedded SQL database in stdlib. The safety rule: cur.execute("SELECT * FROM t WHERE id = ?", (id,)) - parameters as a tuple, never f-strings, which are SQL injection by construction.',
    talkingPoints: [
      'The habit that transfers everywhere (psycopg, MySQL, ORMs): values go through the parameter channel so the driver, not string concatenation, handles quoting.',
      'Extras worth knowing: row_factory = sqlite3.Row for dict-ish rows, context manager on the connection for transactions (commit/rollback), and :memory: databases for fast isolated tests.',
    ],
    quiz: [
      { q: 'Why is f"SELECT * FROM users WHERE name = {name}" unacceptable?',
        choices: ['f-strings are slow', 'Interpolated values become SQL syntax; parameters through the driver are quoted and cannot inject', 'SQLite lacks f-string support', 'It only fails on quotes'],
        answer: 1,
        why: 'The parameter channel separates code from data at the protocol level. Formatting merges them - that is the injection.' },
    ] },

  { id: 'py-std-enum', topic: 'stdlib', label: 'Enum for closed sets',
    summary: 'class Status(Enum): OPEN = auto() gives named, comparable, iterable constants with exhaustiveness-friendly semantics. String-valued enums (class S(str, Enum)) compare equal to their values for JSON and DB round-trips.',
    talkingPoints: [
      'Why over string constants: typos become AttributeError not silent strings, iteration over the type lists all cases, and match/case on enums reads declaratively.',
      'StrEnum (3.11) or the (str, Enum) mixin gives you enum safety with wire-friendly values - the right shape for statuses crossing an API.',
    ],
    quiz: [
      { q: 'What does class Status(str, Enum) buy over plain Enum?',
        choices: ['Faster comparisons', 'Members still have enum identity but compare and serialize as their string values - friendly to JSON and databases', 'Less memory', 'Automatic validation'],
        answer: 1,
        why: 'It is the bridge between type-safe code and stringly-typed wire formats.' },
    ] },

  { id: 'py-std-random-secrets', topic: 'stdlib', label: 'random is not secrets',
    summary: 'The random module is a deterministic PRNG for simulation and sampling - seedable, reproducible, predictable. Tokens, passwords and keys need the secrets module (os.urandom-backed CSPRNG): secrets.token_urlsafe.',
    talkingPoints: [
      'The security line: given a few outputs, a Mersenne Twister state is recoverable and all future values predictable. Session tokens from random are forgeable; that is the whole vulnerability.',
      'Also: random.seed for reproducible simulations and tests is a feature in the right context - determinism is the point there, danger here.',
    ],
    quiz: [
      { q: 'Why is random.choice unsuitable for password reset tokens?',
        choices: ['It is biased', 'random is a deterministic PRNG whose state can be reconstructed from outputs; tokens need the CSPRNG in secrets', 'It is too slow', 'It cannot make strings'],
        answer: 1,
        why: 'Predictability is the failure. secrets wraps the OS CSPRNG so tokens are unguessable even with full knowledge of past tokens.' },
    ] },

  { id: 'py-std-cached-property', topic: 'stdlib', label: 'functools.cached_property',
    summary: '@cached_property computes an attribute once per instance on first access, then stores it in the instance __dict__. It needs a __dict__ (mind __slots__) and is not thread-safe by default.',
    talkingPoints: [
      'Use shape: expensive derived data that many methods touch but that must stay lazy - parsed configs, compiled regexes, opened resources you want per instance.',
      'Contrast with lru_cache on a method: cached_property is per instance (dies with it, no leak), lru_cache on a method keys by self and pins every instance forever. That difference is the interview answer.',
    ],
    quiz: [
      { q: 'Why is cached_property safer than lru_cache on an instance method, memory-wise?',
        choices: ['It is not - both leak', 'The cache lives in the instance dict and dies with the instance; lru_cache keyed by self pins every instance for the life of the cache', 'cached_property uses slots', 'lru_cache is per-class by default'],
        answer: 1,
        why: 'Where the cache lives decides the lifetime. Per-instance storage gets collected; a global cache keyed by self does not.' },
    ] },

  { id: 'py-std-tempfile-shutil', topic: 'stdlib', label: 'tempfile and shutil',
    summary: 'tempfile gives race-safe temporary files and directories (NamedTemporaryFile, TemporaryDirectory as a context manager that cleans up). shutil covers high-level file ops: copy, move, rmtree, disk_usage, which.',
    talkingPoints: [
      'Why not mktemp-by-hand: predicting a filename then opening it is a race another process can win. tempfile creates the file atomically with the right permissions.',
      'The write-rename pattern lives here: write to a temp file in the same directory, then os.replace - a crash mid-write never leaves a half-written target. That is atomicity with no database.',
    ],
    quiz: [
      { q: 'Why write to a temp file and os.replace it instead of writing the target directly?',
        choices: ['Temp files are faster', 'os.replace is atomic: readers see the old or new file, never a torn half-write from a crash', 'Direct writes are deprecated', 'It avoids fsync'],
        answer: 1,
        why: 'Atomic rename turns file updates into all-or-nothing events - the simplest durability primitive on a filesystem.' },
    ] },

  { id: 'py-std-csv', topic: 'stdlib', label: 'csv: let the module handle quoting',
    summary: 'csv.reader/writer handle the quoting, escaping and line-ending rules of CSV - splitting on commas does not. DictReader/DictWriter map rows to dicts by header. Always open files with newline="" for csv.',
    talkingPoints: [
      'The naive bug: line.split(",") explodes on "Smith, John" inside quotes. The csv module implements the actual format, including embedded newlines in quoted fields.',
      'newline="" is not trivia: it disables the text layer translation so the csv module sees the line endings the format specifies - the docs call it out and files corrupt subtly without it.',
    ],
    quiz: [
      { q: 'A CSV field contains "ACME, Inc". What breaks with line.split(",")?',
        choices: ['Nothing', 'The quoted comma splits one field into two; the csv module respects quoted fields', 'Encoding errors', 'The row is skipped'],
        answer: 1,
        why: 'CSV quoting is part of the format. Splitting on the delimiter ignores it and silently shifts every later column.' },
    ] },

  { id: 'py-std-urllib-vs-requests', topic: 'stdlib', label: 'urllib (stdlib) vs requests (third-party)',
    summary: 'urllib.request is the stdlib HTTP client: capable but clunky, manual about encodings, pooling and retries. requests (third-party) is the ergonomic standard: sessions, timeouts, JSON helpers. Neither does retries or HTTP/2 well.',
    talkingPoints: [
      'Dependency judgment call: stdlib-only scripts and containers where install size matters can live with urllib; anything user-facing I write with requests (or httpx for async/HTTP-2) and own the dependency.',
      'Whatever the client: always set a timeout. The default is "wait forever", which turns a dead upstream into a wedged worker - the thundering-herd story from the estate side.',
    ],
    quiz: [
      { q: 'What is the single most important argument on any HTTP call in a service?',
        choices: ['headers', 'timeout - the default is no timeout, so one hung upstream can park a worker forever', 'verify', 'stream'],
        answer: 1,
        why: 'Unbounded waits convert upstream failures into your outage. Every client call gets an explicit deadline.' },
    ] },

  { id: 'py-std-pprint', topic: 'stdlib', label: 'pprint and textwrap for inspection',
    summary: 'pprint.pprint formats nested data structures readably (sorted dict keys, wrapped lines, depth and width controls); textwrap.shorten/dedent tidy long strings and indented blocks. Debugging tools you should reach for before writing a parser.',
    talkingPoints: [
      'Small module, big habit: debugging nested API responses with pprint(response, depth=3, width=120) beats scrolling one-line JSON dumps.',
      'Also in this family: reprlib for bounded reprs of huge objects, and dataclasses.asdict when you want to inspect an object tree as plain data.',
    ],
    quiz: [
      { q: 'Why pprint over print for a nested API response?',
        choices: ['It is colored', 'Structured multi-line formatting with sorted keys and width control makes nested data actually readable', 'print cannot show dicts', 'pprint validates JSON'],
        answer: 1,
        why: 'print shows the repr on one line; pprint lays the structure out. Inspection speed is the whole game during triage.' },
    ] },

  // ── Concurrency and async ─────────────────────────────────────────────
  { id: 'py-conc-gil', topic: 'concurrency', label: 'The GIL, precisely',
    summary: 'In CPython, the global interpreter lock lets one thread execute Python bytecode at a time per interpreter. Threads doing blocking I/O release it, so I/O-bound threads still help; CPU-bound Python threads do not scale. The 3.13 free-threaded build (PEP 703) is an opt-in experiment.',
    talkingPoints: [
      'Precision matters here: the GIL is per-interpreter, it serializes bytecode execution, and C extensions (numpy, hashing) can release it inside their C work. The sound bite "Python has no threads" is wrong - it has real OS threads; they just interleave bytecode.',
      'Consequences, stated as a decision tree: I/O-bound - threads or asyncio scale fine because the GIL drops at each blocking call. CPU-bound Python - multiprocessing or native extensions. And free-threaded 3.13 changes this only where it is deliberately enabled and extensions comply.',
    ],
    quiz: [
      { q: 'Why do four CPU-bound pure-Python threads not speed up a number crunch on four cores?',
        choices: ['Threads are not real in Python', 'The GIL serializes bytecode execution across threads in one interpreter, so only one crunches at a time', 'The OS refuses to schedule them', 'The loop is too short'],
        answer: 1,
        why: 'One thread holds the GIL while executing bytecode. CPU-bound work never releases it long enough for the others to run in parallel. Processes bypass this by having one GIL each.' },
    ] },

  { id: 'py-conc-threads-io', topic: 'concurrency', label: 'Threads fit I/O-bound work',
    summary: 'Blocking I/O releases the GIL, so a pool of threads overlaps network and disk waits well. Threads share memory (easy coordination, real race conditions) and are cheap compared with processes but still cost a stack each.',
    talkingPoints: [
      'The scaling story: 50 threads fetching URLs get near-50x overlap because each is parked in a syscall with the GIL released. Same code shape for CPU work would crawl - I always name which regime I am in.',
      'Shared memory is the trade: no serialization cost, but every shared mutable structure needs a lock or a queue discipline. concurrent.futures.ThreadPoolExecutor is the default harness.',
    ],
    quiz: [
      { q: 'A program spends 95% of its time waiting on HTTP responses. Best stdlib speedup?',
        choices: ['multiprocessing.Pool', 'A ThreadPoolExecutor - I/O releases the GIL, so threads overlap the waits without process overhead', 'More CPUs', 'asyncio is required, threads cannot help'],
        answer: 1,
        why: 'The bottleneck is waiting, not computing. Threads are the simplest overlap for blocking I/O libraries.' },
    ] },

  { id: 'py-conc-multiprocessing', topic: 'concurrency', label: 'multiprocessing for CPU-bound work',
    summary: 'Separate processes each have their own interpreter and GIL, so CPU-bound Python actually uses all cores. Costs: arguments and results cross by pickling, startup is slow (spawn), and shared state needs explicit mechanisms.',
    talkingPoints: [
      'The economics: a Pool pays process startup and pickles data across; it wins when each task is chunky (tens of milliseconds plus). Tiny tasks drown in serialization overhead.',
      'Platform nuance: spawn (default on macOS/Windows) re-imports your module in children - guard entry points with if __name__ == "__main__" or children respawn recursively.',
    ],
    quiz: [
      { q: 'Why is if __name__ == "__main__": mandatory around multiprocessing.Pool usage on spawn platforms?',
        choices: ['Style only', 'Children re-import the main module; without the guard, importing it starts new pools recursively', 'The GIL requires it', 'pickle needs it'],
        answer: 1,
        why: 'Spawn starts a fresh interpreter that imports your module to find the target. Unguarded Pool creation in module scope loops forever.' },
    ] },

  { id: 'py-conc-futures', topic: 'concurrency', label: 'concurrent.futures: one API for both pools',
    summary: 'ThreadPoolExecutor and ProcessPoolExecutor share the Executor interface: submit returns a Future, map preserves order, as_completed yields results as they finish. Switching thread-to-process is a one-line experiment.',
    talkingPoints: [
      'The design win: same API over two execution models, so you benchmark the regime question (threads vs processes) by swapping one constructor.',
      'Details that matter: future.result() re-raises the worker exception in the caller - always collect it; as_completed loses input order; Executor.map raises on first consumption of the failed item.',
    ],
    quiz: [
      { q: 'Where does an exception raised inside a submitted task surface?',
        choices: ['In the worker, printed only', 'When you call future.result() (or iterate map) - it is captured and re-raised in the caller', 'It crashes the pool', 'In __del__'],
        answer: 1,
        why: 'Futures carry results or exceptions. If you never collect, failures are silent - a real production bug shape.' },
    ] },

  { id: 'py-conc-asyncio-loop', topic: 'concurrency', label: 'asyncio: one thread, one loop',
    summary: 'asyncio runs many coroutines on a single OS thread via one event loop. A task runs until it suspends at an await, or completes - and an await on already-finished work may not suspend at all. This is cooperative concurrency: massive I/O overlap, zero parallelism.',
    talkingPoints: [
      'The sentence to get exactly right: asyncio gives concurrency on one thread via an event loop; tasks on that loop interleave only at await suspension points, so there is no parallelism, and between suspension points one task runs uninterrupted. That says nothing about other threads or sync callbacks - and a single blocking call freezes everything.',
      'Contrast cleanly with the GIL story: threads are preempted by the interpreter; coroutines preempt themselves at await. One loop per thread - you do not share a loop across threads.',
    ],
    quiz: [
      { q: 'Inside one asyncio event loop, two coroutines appear to run "at the same time". What is actually happening?',
        choices: ['Two threads share the loop', 'One thread interleaves them: each task runs until it suspends at an await or completes', 'The GIL alternates them mid-bytecode', 'They run on separate cores'],
        answer: 1,
        why: 'Cooperative scheduling: suspension happens only at awaits (and an await on already-finished work may not suspend at all). Between suspension points, a task runs uninterrupted on that loop.' },
    ] },

  { id: 'py-conc-coroutine-await', topic: 'concurrency', label: 'async def and await mechanics',
    summary: 'async def defines a coroutine function; calling it returns a coroutine object and runs nothing. await coro drives it and unwraps the result. Forgetting await gives you a coroutine object (and a "never awaited" warning), not a value.',
    talkingPoints: [
      'The beginner bug with a name: "coroutine was never awaited". Calling an async function is like calling a generator - you get the cold machine, and await (or create_task) is what runs it.',
      'You can only await inside async def, which is why async spreads up the call stack - the function-coloring discussion, next node.',
    ],
    quiz: [
      { q: 'result = fetch() where fetch is async def - what is result?',
        choices: ['The fetched value', 'A coroutine object; nothing ran, and awaiting is what executes it and yields the value', 'A Future already resolved', 'An error at call time'],
        answer: 1,
        why: 'Async calls are cold. The coroutine object is a suspended computation; await, create_task or asyncio.run starts it.' },
    ] },

  { id: 'py-conc-tasks', topic: 'concurrency', label: 'Tasks: scheduling coroutines',
    summary: 'asyncio.create_task(coro) schedules a coroutine to run concurrently and returns a Task. Keep a reference: the loop holds only a weak one, and a garbage-collected task dies mid-flight with your work inside it.',
    talkingPoints: [
      'The documented footgun: store created tasks in a set and discard on done-callback. A fire-and-forget create_task can be collected before finishing - the docs say this plainly and it still bites everyone.',
      'Tasks are also the error-surfacing point: an unretrieved task exception logs "Task exception was never retrieved". Wrap bodies, or use TaskGroup (3.11) which cancels siblings and raises ExceptionGroup on failure.',
    ],
    quiz: [
      { q: 'Why does the docs warn to keep a strong reference to create_task results?',
        choices: ['For logging', 'The event loop holds only weak references; a task with no strong reference can be garbage-collected mid-execution', 'To await them twice', 'References make them faster'],
        answer: 1,
        why: 'Fire-and-forget tasks can vanish mid-work. A done-callback-cleaned set is the standard pattern.' },
    ] },

  { id: 'py-conc-gather', topic: 'concurrency', label: 'gather semantics, exactly',
    summary: 'asyncio.gather(*aws) runs awaitables concurrently and returns results in argument order. Default (return_exceptions=False): the first exception propagates to the awaiting caller, but the other tasks are NOT cancelled - they keep running in the background.',
    talkingPoints: [
      'The precise behavior, because this is often mis-stated: gather with the default propagates the first exception, yet sibling tasks continue running - gather does not cancel them. If you need "one fails, stop everything", that is TaskGroup (3.11+) or manual cancellation.',
      'return_exceptions=True instead collects exceptions as results, in order. Structured-concurrency fans prefer TaskGroup: it cancels remaining tasks on failure and reports everything as an ExceptionGroup.',
    ],
    quiz: [
      { q: 'gather(a(), b()) with defaults: a raises after 1s, b needs 5s. What happens to b?',
        choices: ['b is cancelled immediately', 'b keeps running; gather propagates the a exception but does not cancel siblings', 'b is cancelled after 5s', 'gather waits for b silently'],
        answer: 1,
        why: 'First exception propagates, siblings are left running. Cancellation of siblings is a TaskGroup behavior, not a gather default.' },
    ] },

  { id: 'py-conc-blocking-loop', topic: 'concurrency', label: 'Never block the event loop',
    summary: 'One synchronous call - requests.get, time.sleep, a heavy pandas computation - freezes every task on the loop. Offload blocking I/O with asyncio.to_thread and CPU chunks to processes, or pick a blocking design instead.',
    talkingPoints: [
      'Diagnosis story: latency spikes with low CPU in an async service usually mean a blocking call on the loop - every coroutine queues behind it. The fix list: async libraries, to_thread for legacy sync calls, run_in_executor for CPU.',
      'The honest limit: if the workload is mostly blocking libraries, forcing asyncio buys complexity without throughput. Threads might be the right boring answer.',
    ],
    quiz: [
      { q: 'An async handler calls requests.get (blocking). What is the effect and the fix?',
        choices: ['None - requests is async', 'The whole event loop stalls for the duration; wrap it in asyncio.to_thread or use an async client like httpx/aiohttp', 'Only that task stalls', 'It raises immediately'],
        answer: 1,
        why: 'A blocking call never reaches an await, so no other coroutine can run. The loop is one thread: park it and everyone waits.' },
    ] },

  { id: 'py-conc-async-primitives', topic: 'concurrency', label: 'asyncio.Queue, Semaphore, Lock',
    summary: 'asyncio primitives mirror threading ones but coordinate coroutines: Queue for producer/consumer handoff, Semaphore to cap concurrency (say, 10 in-flight requests), Lock to serialize a critical section between awaits.',
    talkingPoints: [
      'The rate-limited client pattern (which the NWF vendor-client rep drills): a Semaphore bounds simultaneous upstream calls, a Queue feeds work, and workers pull until shutdown. Bounded concurrency is how you stay under a vendor rate limit without sleeping blindly.',
      'Never mix threading locks into asyncio: a held threading.Lock blocks the loop. Use asyncio primitives inside coroutines, threading primitives with real threads.',
    ],
    quiz: [
      { q: 'How do you cap an async scraper at 10 concurrent requests?',
        choices: ['Ten threads', 'An asyncio.Semaphore(10) acquired around each request', 'A list of ten tasks only', 'time.sleep between requests'],
        answer: 1,
        why: 'The semaphore admits exactly ten holders; the rest await. That is bounded concurrency without threads.' },
    ] },

  { id: 'py-conc-race-locks', topic: 'concurrency', label: 'Races still exist in asyncio',
    summary: 'Code between two suspension points runs uninterrupted by other tasks on the same loop (threads and signal/callback contexts are outside this guarantee), but any await may yield control. Read-modify-write across an await (fetch balance, await, write balance) is a classic asyncio race.',
    talkingPoints: [
      'Rule: audit every await inside a state mutation. counter += 1 with no await in between cannot be interrupted by another task on the same loop; check-then-act across an await can - hold an asyncio.Lock over the whole critical section. Code shared with real threads still needs threading locks.',
      'Good news worth stating: with no task switches between suspension points on a single loop, many coroutine-shared structures need no locks at all - that is the simplicity you traded parallelism for. It does not cover data shared with threads or synchronous re-entrant callbacks.',
    ],
    quiz: [
      { q: 'Where can two coroutines interleave in a single event loop?',
        choices: ['Any bytecode boundary', 'At await suspension points - so any read-modify-write spanning an await is a race candidate among tasks on that loop', 'Only inside locks', 'Never - asyncio is race-free'],
        answer: 1,
        why: 'Awaits are the only task-switch points on a loop (and even an await may not suspend if the awaited work is already done). The race window is the critical section you stretch across a real suspension. Threads and re-entrant callbacks follow their own rules.' },
    ] },

  { id: 'py-conc-sync-async-color', topic: 'concurrency', label: 'Function coloring: sync calls async',
    summary: 'Awaitable code must be awaited, and await only exists inside async def - so asyncness spreads up the call chain. Entry points bridge the worlds: asyncio.run at the top, to_thread for sync-inside-async, run_coroutine_threadsafe for the reverse.',
    talkingPoints: [
      'Practical architecture: keep the async coloring shallow - async at the I/O leaves and at the orchestration top, plain sync pure logic in the middle. Pure functions need no color at all.',
      'The bridges: asyncio.run once per program entry (it creates and closes the loop); calling it inside a running loop is an error - that is when you reach for create_task or nest_asyncio in notebooks.',
    ],
    quiz: [
      { q: 'Why does adding one await deep in a call stack force changes all the way up?',
        choices: ['It does not', 'await only works inside async def, so every ancestor must become async or bridge through create_task/asyncio.run', 'The GIL requires it', 'Type checkers force it'],
        answer: 1,
        why: 'That is function coloring: async is viral by construction, so design keeps it at the edges.' },
    ] },

  { id: 'py-conc-thread-safety', topic: 'concurrency', label: 'Thread safety and queue.Queue',
    summary: 'With threads, every shared mutable structure needs a discipline: locks around invariants, or better, hand work between threads through queue.Queue and keep state owned by one thread. GIL atomicity of single bytecodes is not a design.',
    talkingPoints: [
      'The anti-pattern to name: relying on "the GIL makes it atomic". Single operations like list.append happen to be atomic in CPython today, but compound checks (if k not in d: d[k] = v) are not - and relying on implementation atomicity is fragile across versions and interpreters.',
      'Producer/consumer with Queue gives you blocking handoff, backpressure (maxsize) and a clean shutdown signal - the boring, correct thread architecture.',
    ],
    quiz: [
      { q: 'Why is "the GIL makes my counter safe" a bad argument?',
        choices: ['The GIL was removed in 3.12', 'Only single bytecode-level operations happen to be atomic; compound read-modify-write sequences interleave, and the guarantee is an implementation detail anyway', 'Threads do not share memory', 'Counters are not shared'],
        answer: 1,
        why: 'x += 1 is several bytecodes (load, add, store). Two threads can interleave between them and lose updates.' },
    ] },

  { id: 'py-conc-parallelism-choice', topic: 'concurrency', label: 'Choosing: threads, asyncio, or processes',
    summary: 'The decision tree: blocking I/O libraries - threads; high-connection-count I/O with async libraries - asyncio; CPU-bound Python - processes; mixed - asyncio orchestrating with to_thread and process pools at the edges.',
    talkingPoints: [
      'The questions I ask: what blocks (I/O or CPU), which libraries exist (sync only or async), how many concurrent units (dozens vs tens of thousands), and what the team can debug at 3 AM.',
      'Concrete anchors from the estate: a handful of vendor API calls - threads fine. Thousands of sockets - asyncio. Per-ticker pandas crunch - processes. One sentence each is the fluent answer.',
    ],
    quiz: [
      { q: 'Ten thousand simultaneous websocket connections, mostly idle. Threads or asyncio?',
        choices: ['Threads - simpler', 'asyncio - a thread per connection costs a stack and scheduler load each; coroutines are cheap enough for five figures of mostly-idle connections', 'Processes', 'Either, identical cost'],
        answer: 1,
        why: 'Connection-count is the axis: per-connection memory and scheduling overhead dominates when connections are many and idle.' },
    ] },

  { id: 'py-conc-timeout', topic: 'concurrency', label: 'Timeouts and cancellation',
    summary: 'asyncio.timeout() (3.11+, async context manager) and wait_for bound how long you await; expiry cancels the inner task by throwing CancelledError into it. Cleanup must handle cancellation, and shield() protects work that must finish.',
    talkingPoints: [
      'Cancellation is cooperative: CancelledError is raised at the next await, giving finally blocks a chance to run - which is why coroutines holding resources need try/finally or async context managers.',
      'Do not swallow CancelledError by accident: catching Exception is fine (CancelledError derives from BaseException since 3.8, deliberately), but explicitly catching and ignoring it breaks the contract and hangs shutdowns.',
    ],
    quiz: [
      { q: 'How does a timeout actually stop a running coroutine?',
        choices: ['It kills the thread', 'It cancels the task: CancelledError is thrown in at the next await, so cleanup in finally still runs', 'It closes the loop', 'It sets a flag only'],
        answer: 1,
        why: 'Cancellation is exception delivery at a suspension point - which is why well-placed finally blocks are the cleanup mechanism.' },
    ] },

  // ── Typing and quality ────────────────────────────────────────────────
  { id: 'py-type-hints-basics', topic: 'typing', label: 'Type hints are not enforcement',
    summary: 'Annotations (def f(x: int) -> str) are metadata: the interpreter stores them in __annotations__ and never checks them. Enforcement comes from static checkers (mypy, pyright) or runtime libraries you opt into.',
    talkingPoints: [
      'The fact to lead with: passing a str where int is hinted runs fine at runtime. Hints are for readers, IDEs and checkers - a contract checked in CI, not by CPython.',
      'Why still worth it: refactoring confidence, autocomplete that knows your types, and bugs caught before tests. Cost is low because typing is gradual - annotate the seams first.',
    ],
    quiz: [
      { q: 'def f(x: int) -> int: return x; f("hello") does what?',
        choices: ['TypeError at call', 'Returns "hello" - annotations are not enforced at runtime', 'A warning', 'Converts to int'],
        answer: 1,
        why: 'CPython records annotations but never validates them. Checking is mypy/pyright in CI or a runtime library like pydantic.' },
    ] },

  { id: 'py-type-optional-union', topic: 'typing', label: 'Optional and unions',
    summary: 'Optional[X] means X | None - a value that might be missing. Modern syntax (3.10+): str | None. The discipline is narrowing: check for None before use, and the checker tracks it.',
    talkingPoints: [
      'Reading annotations fluently: list[str | None] (elements may be missing) is different from list[str] | None (the whole list may be missing). Where the None sits is the design.',
      'Narrowing idioms: if x is None: return early, or assert x is not None when the invariant is structural. The checker follows both - that is the point of gradual typing.',
    ],
    quiz: [
      { q: 'list[str] | None versus list[str | None] - what is the difference?',
        choices: ['None, same type', 'The first allows the whole list to be missing; the second allows individual elements to be None', 'The second is invalid', 'The first needs Optional'],
        answer: 1,
        why: 'Union placement says what can be absent. Getting it right is the difference between handling None at one boundary or in every loop.' },
    ] },

  { id: 'py-type-generics', topic: 'typing', label: 'Generics: list[int] and TypeVar',
    summary: 'Built-in collections are generic since 3.9: list[int], dict[str, float]. For your own generic functions, TypeVar ties types together - def first(xs: list[T]) -> T says the output type equals the element type.',
    talkingPoints: [
      'TypeVar is about relationships, not constraints on one slot: it lets the checker know first([]) has nothing to return and first([1, 2]) is an int.',
      'You can also make generic classes (class Stack(Generic[T])) - the container carries the element type so push/pop stay consistent.',
    ],
    quiz: [
      { q: 'In def first(xs: list[T]) -> T, what does T express?',
        choices: ['Any type, unchecked', 'A tie: the return type is whatever the list elements are', 'A class named T', 'A tuple type'],
        answer: 1,
        why: 'TypeVar binds one type across the signature. The checker propagates the concrete element type to the result.' },
    ] },

  { id: 'py-type-protocol', topic: 'typing', label: 'typing.Protocol: structural typing',
    summary: 'Protocol defines an interface by shape: any class with matching methods satisfies it without inheriting. It is duck typing the checker can verify - the static answer to "file-like object".',
    talkingPoints: [
      'Versus ABC: ABCs are nominal (inherit or register), Protocols are structural (have the methods). For library boundaries, Protocols let callers satisfy your interface without importing your base class.',
      'Mechanics: class SupportsClose(Protocol): def close(self) -> None: ... - then isinstance(x, SupportsClose) needs @runtime_checkable, and it checks only method presence, not signatures.',
    ],
    quiz: [
      { q: 'Why prefer a Protocol parameter over an ABC at a library boundary?',
        choices: ['Protocols are faster', 'Callers satisfy it by shape without importing or inheriting your base class - structure over names', 'Protocols validate at runtime by default', 'ABCs cannot have methods'],
        answer: 1,
        why: 'Structural typing decouples the contract from the class hierarchy - the static version of duck typing.' },
    ] },

  { id: 'py-type-typeddict', topic: 'typing', label: 'TypedDict for JSON-shaped dicts',
    summary: 'TypedDict types the keys and value types of a dictionary that stays a plain dict at runtime - perfect for JSON payloads. total=False marks optional keys; it exists only for the checker.',
    talkingPoints: [
      'Niche: when the data is a dict because it came from JSON or goes to JSON, TypedDict gives key completion and typo protection without a class conversion layer.',
      'Limits to name: no methods, no validation, unknown at runtime (isinstance against TypedDict is not a thing). For validation you are back to pydantic.',
    ],
    quiz: [
      { q: 'A function returns a JSON payload dict. What does TypedDict add over dict?',
        choices: ['Runtime validation', 'Static knowledge of which keys exist and their value types, while the value stays a plain dict at runtime', 'Immutability', 'Faster lookups'],
        answer: 1,
        why: 'TypedDict is a compile-time lens on an ordinary dict - zero runtime footprint, real checking.' },
    ] },

  { id: 'py-type-mypy', topic: 'typing', label: 'mypy/pyright in the loop',
    summary: 'Static type checkers analyze without running the code. Gradual typing means you adopt file by file; CI enforcement with ratcheting strictness (disallow_untyped_defs on new code) keeps the baseline honest.',
    talkingPoints: [
      'Adoption story: checkers pass on partially annotated codebases by design - start strict on new modules, annotate seams, let the ratchet close. Big-bang typing projects die.',
      'Checker disagreement is normal: mypy and pyright differ on edge cases; the team picks one as the CI source of truth.',
    ],
    quiz: [
      { q: 'What does gradual typing mean for adopting mypy on a legacy repo?',
        choices: ['Annotate everything first', 'Unannotated code still checks (leniently); you tighten strictness module by module, enforced in CI', 'mypy only runs on new files', 'Types are inferred perfectly'],
        answer: 1,
        why: 'The ratchet model: strict on new code, lenient on old, always enforced - that is how adoption actually lands.' },
    ] },

  { id: 'py-type-annotations-future', topic: 'typing', label: 'Postponed annotation evaluation',
    summary: 'from __future__ import annotations stores annotations as strings, unevaluated: forward references work, import cycles relax, and module import gets faster. typing.get_type_hints resolves them when you really need the objects.',
    talkingPoints: [
      'Why it exists: annotations used to evaluate at def time, so class A: def clone(self) -> A: failed on the not-yet-defined name. Postponed evaluation makes all annotations lazily resolvable.',
      'Gotcha: tools that introspect at runtime (pydantic, dataclass-transformers) must resolve strings - get_type_hints handles it, and that call can fail if names are missing.',
    ],
    quiz: [
      { q: 'What does from __future__ import annotations change?',
        choices: ['Types become enforced', 'Annotations are stored as strings and not evaluated at definition time, enabling forward references and faster imports', 'Python 2 compat', 'Annotations are removed'],
        answer: 1,
        why: 'Lazy annotations decouple writing the hint from resolving the names - the fix for self-referential types and import cycles.' },
    ] },

  { id: 'py-type-overload', topic: 'typing', label: '@overload: multiple signatures',
    summary: '@overload declares several typed signatures for one implementation: the checker picks per call site. Classic use - a function returning str when given str and bytes when given bytes. The final non-overloaded def is the real body.',
    talkingPoints: [
      'Reading pattern: two or more @overload stubs with ... bodies, then the implementation, often typed more loosely. Only the stubs are visible to the checker.',
      'When NOT to overload: if a union return is acceptable, prefer it - overloads are for when the return type genuinely depends on the argument type.',
    ],
    quiz: [
      { q: 'In a stack of @overload stubs, which definition holds the real code?',
        choices: ['The first stub', 'The last, non-@overload definition - the stubs are checker-only declarations', 'All of them merged', 'The one with types'],
        answer: 1,
        why: 'Overloads declare; the final implementation defines. At runtime only the last def exists.' },
    ] },

  { id: 'py-type-casting', topic: 'typing', label: 'cast, isinstance narrowing, Any',
    summary: 'typing.cast(T, x) tells the checker "trust me" with zero runtime effect. isinstance/None checks narrow types honestly. Any opts out of checking entirely - it spreads silently through everything it touches.',
    talkingPoints: [
      'Hierarchy of honesty: narrowing by check (provable) beats cast (asserted) beats Any (unchecked). Cast when you know something the checker cannot - data just validated by a schema, say.',
      'Any is contagious: an Any in an expression makes the result Any, quietly silencing checking downstream. Audit Any like a code smell with a reason attached.',
    ],
    quiz: [
      { q: 'What does cast(int, x) do at runtime?',
        choices: ['Converts x to int', 'Nothing - it returns x unchanged; it only silences the checker', 'Validates the type', 'Raises if wrong'],
        answer: 1,
        why: 'cast is a compile-time assertion with zero runtime behavior. Conversion is int(x); verification is isinstance.' },
    ] },

  { id: 'py-type-validation', topic: 'typing', label: 'dataclasses do not validate; pydantic does',
    summary: 'Annotations on dataclasses are inert at runtime - User(age="old") constructs fine. Runtime validation needs a validating library (pydantic, attrs with validators). Choose by where bad data enters: external boundaries want validation.',
    talkingPoints: [
      'The misconception to kill in interviews: type hints never raised a TypeError. A dataclass with age: int happily stores a string; the checker would have caught it only if the call site was checked.',
      'Boundary pattern: validate at ingress (pydantic model parsing a request), then pass typed, trusted objects inward so the core never re-validates.',
    ],
    quiz: [
      { q: 'User(age="old") on a dataclass with age: int does what?',
        choices: ['TypeError', 'Constructs fine - dataclass annotations are metadata; runtime validation needs pydantic-style enforcement', 'Converts to int', 'Warns'],
        answer: 1,
        why: 'Generation covers init/repr/eq, not validation. If wrong types must not exist, something has to check them at runtime.' },
    ] },

  { id: 'py-type-none-narrowing', topic: 'typing', label: 'Narrowing Optional correctly',
    summary: 'Working with Optional values means proving non-None before use: early-return guards, if x is not None blocks, or assert for structural certainties. getattr chains and x.attr or default handle presentation cases.',
    talkingPoints: [
      'Guard-clause style: def f(u: User | None): if u is None: return; then u is User for the rest - the checker follows exactly this, which is why the pattern feels collaborative.',
      'Dangerous shortcut: value or default swaps in default for 0, "", [] too. When only None should trigger, write value if value is not None else default.',
    ],
    quiz: [
      { q: 'Why is (timeout or 30) risky when timeout: float | None can be 0.0?',
        choices: ['It is fine', 'or falls back on any falsy value, so an explicit 0.0 silently becomes 30', 'None raises', 'Floats cannot be Optional'],
        answer: 1,
        why: 'The falsy-zero trap again: or cannot tell None from 0. Narrow explicitly when zero is real data.' },
    ] },

  { id: 'py-type-callable', topic: 'typing', label: 'Typing higher-order functions: Callable',
    summary: 'Callable[[int, str], bool] types a function by argument and return types. It is how key functions, callbacks and decorators get checked - and ParamSpec (3.10+) preserves exact signatures through decorators.',
    talkingPoints: [
      'Practical example: def sort_by(items: list[T], key: Callable[[T], float]) - the annotation tells callers exactly what shape of key function fits.',
      'ParamSpec exists because Callable cannot express "same signature in, same signature out" generically - that is what typed decorators need (functools.wraps for the type system).',
    ],
    quiz: [
      { q: 'What problem does ParamSpec solve that Callable cannot?',
        choices: ['Async functions', 'Preserving an arbitrary wrapped function exact signature through a decorator, generically', 'Optional arguments', 'Multiple returns'],
        answer: 1,
        why: 'Callable fixes one concrete signature. Decorators wrap ANY signature - ParamSpec captures it as a variable.' },
    ] },

  { id: 'py-type-literal-final', topic: 'typing', label: 'Literal and Final',
    summary: 'Literal["a", "b"] restricts a value to enumerated constants - mode: Literal["r", "w"]. Final marks names that must not be reassigned and attributes that must not be overridden. Both are checker-time contracts.',
    talkingPoints: [
      'Literal replaces stringly-typed APIs: instead of hoping mode is "r" or "w", the checker rejects typos before runtime. Pairs beautifully with match/case exhaustiveness.',
      'Final communicates design intent: constants (MAX_RETRIES: Final = 5) and methods subclasses must not touch. Runtime ignores it; the checker enforces it.',
    ],
    quiz: [
      { q: 'What does mode: Literal["r", "w"] catch that mode: str cannot?',
        choices: ['Encoding errors', 'Typos like "read" at check time, before the code ever runs', 'Missing files', 'Nothing'],
        answer: 1,
        why: 'Literal narrows a type to exact values. The set of valid strings becomes checkable knowledge.' },
    ] },

  { id: 'py-type-self-type', topic: 'typing', label: 'typing.Self (3.11+)',
    summary: 'Self annotates methods returning the current class - fluent builders, alternative constructors, copy methods - so subclasses inherit correct return types without generics gymnastics.',
    talkingPoints: [
      'The pain it removes: def set_name(self, n) -> Self in a builder means SubBuilder().set_name() is typed as SubBuilder, not the base - before Self you needed a TypeVar bound dance.',
      'Also right for __enter__ on context managers and copy() methods. Runtime: Self is just an annotation, no behavior.',
    ],
    quiz: [
      { q: 'Why annotate a fluent method -> Self instead of -> the class name?',
        choices: ['It is shorter', 'Subclasses inherit the annotation as their own type; a hardcoded class name downgrades them to the base', 'Self is faster', 'The old way errors'],
        answer: 1,
        why: 'Self tracks the actual class of the instance through inheritance - exactly what builders and copy methods need.' },
    ] },

  { id: 'py-type-runtime-cost', topic: 'typing', label: 'When annotations cost at runtime',
    summary: 'Without postponed evaluation, annotations evaluate at def/class-creation time - imports of heavy types cost, and forward references need quotes. get_type_hints resolves lazily. Designing for both worlds is part of senior Python.',
    talkingPoints: [
      'The tension: runtime-introspecting frameworks (pydantic, dataclasses with resolve needs, some DI containers) need real types, so blanket from __future__ import annotations can push failures to introspection time.',
      'Practical rule: libraries consumed by runtime introspection keep annotations resolvable; application code can go fully postponed for import speed and forward refs.',
    ],
    quiz: [
      { q: 'What can break when runtime-introspecting code meets string annotations?',
        choices: ['Nothing changes', 'get_type_hints can fail on names not importable at resolution time - the annotation was never evaluated until someone asked', 'The module fails to import', 'Type checkers crash'],
        answer: 1,
        why: 'Postponed evaluation defers name resolution; introspection must resolve in a namespace where the names actually exist.' },
    ] },

  // ── Packaging and imports ─────────────────────────────────────────────
  { id: 'py-pkg-module-package', topic: 'packaging', label: 'Modules and packages',
    summary: 'A module is one .py file; a package is a directory of modules with an __init__.py (optional since namespace packages). Imports execute the module once and cache it in sys.modules.',
    talkingPoints: [
      'Import = execute once, cache, bind a name. Re-imports are free because of sys.modules - which is also why editing a module mid-session needs importlib.reload or a restart.',
      '__init__.py runs on first import of the package - keep it light. Heavy work there makes every import of any submodule pay for it.',
    ],
    quiz: [
      { q: 'What does "import a; import a" do the second time?',
        choices: ['Re-executes a.py', 'Returns the cached module from sys.modules - execution happens once', 'Raises', 'Copies the module'],
        answer: 1,
        why: 'The sys.modules cache is why imports are idempotent and cheap - and why reloads need explicit work.' },
    ] },

  { id: 'py-pkg-import-system', topic: 'packaging', label: 'How import finds code: sys.path',
    summary: 'import searches sys.path in order: the script directory (or "" for REPL), PYTHONPATH, then site-packages. First match wins - so a local file named json.py shadows the stdlib and breaks everything importing json.',
    talkingPoints: [
      'The shadowing classic: email.py, test.py, json.py in your project root - your file wins over stdlib and the error appears somewhere far away. Name project files to avoid stdlib collisions.',
      'Debugging move: import the module and print module.__file__ to see what actually loaded. sys.path.insert tricks are a smell; packaging properly is the fix.',
    ],
    quiz: [
      { q: 'A project has its own json.py. What happens to "import json"?',
      choices: ['The stdlib wins', 'The local file shadows the stdlib because the script directory comes first in sys.path - every library importing json breaks weirdly', 'Both load', 'An error at startup'],
        answer: 1,
        why: 'First hit in sys.path wins, and your script directory is first. Shadowing bugs look like stdlib corruption.' },
    ] },

  { id: 'py-pkg-venv', topic: 'packaging', label: 'Virtual environments',
    summary: 'python -m venv .venv creates an isolated interpreter with its own site-packages, so each project pins its own dependency versions. Activate (or call .venv/bin/python directly) and the project dependencies stop fighting each other and the system Python.',
    talkingPoints: [
      'Why isolation is non-negotiable: two projects needing different versions of the same library cannot share one site-packages; the system Python belongs to the OS.',
      'Habit: never pip install outside a venv; in CI/containers the venv may be replaced by the container itself, which is the same idea one level up.',
    ],
    quiz: [
      { q: 'What problem does a venv actually solve?',
        choices: ['Speed', 'Dependency conflicts: one interpreter can hold one version of each package, so each project needs its own site-packages', 'Security scanning', 'Faster imports'],
        answer: 1,
        why: 'Isolation per project is the whole point - versions stop colliding and the system interpreter stays clean.' },
    ] },

  { id: 'py-pkg-pip', topic: 'packaging', label: 'pip: installs and editable installs',
    summary: 'pip installs from PyPI into the current environment. pip install -e . installs your own package in editable mode - source changes take effect without reinstall, which is how libraries under development stay importable.',
    talkingPoints: [
      'Editable installs are the development loop: tests and scripts import the package as if installed, while you edit the source tree. Modern -e uses the build backend (PEP 660).',
      'Know pip vs python -m pip: the -m form guarantees the pip that belongs to the interpreter you will actually run - version-mixing across interpreters is a classic self-own.',
    ],
    quiz: [
      { q: 'Why prefer python -m pip install x over plain pip install x?',
        choices: ['It is faster', 'It guarantees pip drives the same interpreter you run, avoiding installs landing in the wrong site-packages', 'Plain pip is deprecated', 'It skips the venv'],
        answer: 1,
        why: 'Multiple Pythons on one machine make bare pip a lottery; -m pins it to the interpreter in front of you.' },
    ] },

  { id: 'py-pkg-pyproject', topic: 'packaging', label: 'pyproject.toml: the modern package definition',
    summary: 'pyproject.toml (PEP 621) is the standard project file: build-system requirements plus project metadata (name, version, dependencies) plus tool config (ruff, pytest, mypy) in one place. It replaced setup.py/setup.cfg for most purposes.',
    talkingPoints: [
      'Structure to recite: [build-system] picks the backend (setuptools, hatchling, flit), [project] declares metadata and dependencies, [project.optional-dependencies] holds extras like dev, [tool.*] configures everything else.',
      'Why it won: builds are isolated and reproducible, metadata is declarative, and one file ends the five-config-file sprawl.',
    ],
    quiz: [
      { q: 'What does the [build-system] table in pyproject.toml specify?',
        choices: ['Runtime dependencies', 'The build backend and its requirements - how the package gets built, before any project metadata matters', 'Test settings', 'The Python version only'],
        answer: 1,
        why: 'Build frontends read build-system first: install the backend, then let it interpret the rest. That split is PEP 517/518.' },
    ] },

  { id: 'py-pkg-name-main', topic: 'packaging', label: 'if __name__ == "__main__"',
    summary: '__name__ is the module dotted name on import and "__main__" when run directly. The guard lets one file be both importable library and runnable script - the import side stays side-effect free.',
    talkingPoints: [
      'Two uses: demo/test code under the guard, and - critically - protecting multiprocessing entry points on spawn platforms from recursive re-import.',
      'python -m package.module runs the module as __main__ with imports resolved from the project root - usually the right way to run things during development, avoiding sys.path surprises.',
    ],
    quiz: [
      { q: 'What is __name__ when you run python app.py versus import app?',
        choices: ['"app" both times', '"__main__" when run directly, "app" when imported', '"__main__" both times', 'It is unset when run'],
        answer: 1,
        why: 'The __main__ sentinel is how one file knows whether it is the program or a library - hence the guard idiom.' },
    ] },

  { id: 'py-pkg-circular', topic: 'packaging', label: 'Circular imports',
    summary: 'A imports B while B imports A: one module gets a partially-initialized partner and names are missing at import time (ImportError/AttributeError). Real fixes: extract the shared piece to a third module, or move the import inside the function that needs it.',
    talkingPoints: [
      'Mechanism: importing runs top-to-bottom; a cycle means one module body runs while the other is half-built. The error points at the second import, confusing everyone.',
      'Design smell signal: cycles usually mean the layering is wrong - the shared types/helpers want their own module. Function-local imports are the tactical patch, not the architecture.',
    ],
    quiz: [
      { q: 'What is the cleanest structural fix for an import cycle?',
        choices: ['importlib.reload', 'Extract the mutually needed names into a lower-level module both sides import', 'Use globals', 'Reorder the imports only'],
        answer: 1,
        why: 'Cycles mean the dependency graph has a loop; breaking it by layering is the fix. Local imports only defer the symptom.' },
    ] },

  { id: 'py-pkg-namespace', topic: 'packaging', label: 'Namespace packages (PEP 420)',
    summary: 'Since 3.3, a directory without __init__.py can still be a package - a namespace package - and multiple directories on sys.path can contribute portions to the same package name. Plugins and monorepos use this.',
    talkingPoints: [
      'Contrast: regular packages have __init__.py and one location; namespace packages spread across sys.path entries, so company.plugins.x from repo A and company.plugins.y from repo B coexist.',
      'Caveat: namespace packages make import discovery scan every sys.path entry - slightly slower, and accidental shadowing gets more creative. Deliberate tool, not default.',
    ],
    quiz: [
      { q: 'What can a namespace package do that a regular package cannot?',
        choices: ['Skip imports', 'Span multiple directories on sys.path under one package name - plugin ecosystems use exactly this', 'Run faster', 'Avoid sys.modules'],
        answer: 1,
        why: 'Splitting one package across installed distributions is the PEP 420 superpower.' },
    ] },

  { id: 'py-pkg-wheels-sdist', topic: 'packaging', label: 'Wheels vs sdists',
    summary: 'An sdist is a source archive that must be built at install time; a wheel is a pre-built, pre-laid-out archive that pip just unpacks - faster, no build tools needed, and the format compiled extensions ship in.',
    talkingPoints: [
      'Why wheels won installs: no arbitrary setup.py execution at install time, no compiler required on the target machine - the heavy lifting happened at package build time.',
      'When you hit "building wheel failed": the package ships only an sdist (or no wheel for your platform/Python version), so pip needs a toolchain - pin versions or upgrade pip as first moves.',
    ],
    quiz: [
      { q: 'Why do wheels install faster and more reliably than sdists?',
        choices: ['They are smaller', 'They are pre-built: no build step, no compiler, no build backend execution on the target machine', 'They skip dependencies', 'They are signed'],
        answer: 1,
        why: 'Installation becomes file placement. The build (and its toolchain requirements) happened once, at release time.' },
    ] },

  { id: 'py-pkg-pinning', topic: 'packaging', label: 'Pinning and lockfiles',
    summary: 'Libraries declare compatible ranges; applications pin exact versions (or lock with hashes) so every deploy builds the same tree. requirements.txt with == or a uv/pip-tools/poetry lockfile is the reproducibility boundary.',
    talkingPoints: [
      'The estate lesson in miniature: two installs with the same lockfile hash are the same dependency tree - that is what makes "just rebuild it" a real claim instead of a hope.',
      'Hash-checking (pip install --require-hashes) also guards supply chain: the bytes you deploy are the bytes you reviewed. CI should install from the lock, never re-resolve.',
    ],
    quiz: [
      { q: 'Why should CI install from a lockfile rather than re-resolving ranges?',
        choices: ['It is faster only', 'Re-resolution can pick new releases, so the tested tree and the deployed tree diverge; the lock pins the exact reviewed set', 'Ranges are deprecated', 'Locks enable caching'],
        answer: 1,
        why: 'Reproducibility means same inputs, same tree. A lockfile turns dependency selection from a time-dependent process into data.' },
    ] },

  { id: 'py-pkg-importlib', topic: 'packaging', label: 'importlib: imports as code',
    summary: 'importlib.import_module("pkg.mod") imports by string name - the backbone of plugin systems, entry-point loading and lazy imports. importlib.resources reads data files inside packages portably.',
    talkingPoints: [
      'Plugin pattern: config names a dotted path, import_module loads it, getattr finds the entry function, and a registry maps names to callables - extensibility without editing the core.',
      'importlib.resources.files(pkg).joinpath("data.json") replaced __file__ path math, which breaks in zipped/frozen distributions.',
    ],
    quiz: [
      { q: 'Why importlib.resources instead of os.path.join(os.path.dirname(__file__), ...)?',
        choices: ['It is shorter', '__file__ math breaks when code ships zipped or frozen; resources abstracts package data access', 'Resources are cached', 'os.path is deprecated'],
        answer: 1,
        why: 'Packages are not always directories on disk. The resources API asks the loader, which knows where the bytes are.' },
    ] },

  { id: 'py-pkg-entry-points', topic: 'packaging', label: 'console_scripts entry points',
    summary: '[project.scripts] mytool = "pkg.cli:main" makes pip install create a mytool command bound to that function. It is how Python CLIs ship - no chmod, no PATH hacking, works inside the venv automatically.',
    talkingPoints: [
      'The function is the contract: main() takes no arguments (parse sys.argv inside, via argparse), returns an exit code int, and the wrapper the installer generates handles the rest.',
      'Entry points are also a discovery mechanism beyond scripts - pytest plugins and many frameworks register under group names and get enumerated at runtime.',
    ],
    quiz: [
      { q: 'What does [project.scripts] mytool = "pkg.cli:main" do at pip install time?',
        choices: ['Runs main once', 'Generates a mytool executable in the environment bin dir that calls pkg.cli.main', 'Adds a man page', 'Creates a systemd unit'],
        answer: 1,
        why: 'The installer writes a small launcher bound to your function - that is the entire CLI shipping mechanism.' },
    ] },

  { id: 'py-pkg-absolute-relative', topic: 'packaging', label: 'Absolute vs relative imports',
    summary: 'from .utils import x is relative to the current package; from pkg.utils import x is absolute. Relative imports only work inside a package context - running a module file directly (python pkg/mod.py) breaks them.',
    talkingPoints: [
      'The classic failure: python package/module.py makes the file __main__ with no package context, so from . import x explodes. Run with python -m package.module instead.',
      'Style guidance I follow: absolute imports for clarity at module boundaries, short relative imports for tightly-coupled siblings inside one package.',
    ],
    quiz: [
      { q: 'Why does python pkg/mod.py fail on from .utils import x while python -m pkg.mod works?',
        choices: ['Permissions', 'Direct execution sets no package context (__package__ is empty); -m runs it as part of the package so relative imports resolve', 'utils is missing', 'The GIL'],
        answer: 1,
        why: 'Relative imports are resolved against the package the module belongs to - direct script execution erases that identity.' },
    ] },

  { id: 'py-pkg-version-features', topic: 'packaging', label: 'Version-gated language features',
    summary: 'Features land per Python version: match/case and X | Y unions (3.10), ExceptionGroup/tomllib/Self (3.11), type statements (3.12), experimental free-threading (3.13). Declare requires-python and know which dialect your codebase speaks.',
    talkingPoints: [
      'Compatibility discipline: requires-python = ">=3.11" in pyproject is a promise your syntax must keep; CI should test the floor version, not just the newest.',
      'tomllib (3.11) reads TOML read-only - enough for config; writing needs a third-party lib. Knowing what is stdlib-by-version is real fluency.',
    ],
    quiz: [
      { q: 'Why should CI test on the minimum supported Python, not only the latest?',
        choices: ['Older is faster', 'Syntax and stdlib features silently depend on version; only the floor version catches accidental 3.12-isms in a 3.11 codebase', 'Users upgrade slowly', 'It is required by PyPI'],
        answer: 1,
        why: 'The floor version defines your legal dialect. Testing above it lets version-specific features slip in unnoticed.' },
    ] },

  { id: 'py-pkg-stdlib-shadowing', topic: 'packaging', label: 'Dependency confusion and typosquat awareness',
    summary: 'Install hygiene is part of packaging: verify package names exactly (typosquats like "requets"), pin versions, and know that pip resolves the public index unless told otherwise - private packages need explicit index configuration, not hope.',
    talkingPoints: [
      'Dependency confusion in one line: if a private package name also exists on the public index, a misconfigured resolver can fetch the public one. Explicit --index-url / --extra-index-url discipline and lockfiles with hashes are the defense.',
      'Daily habit: install from the lockfile, review transitive additions in diffs, and treat a brand-new transitive dependency with the same suspicion as a new direct one.',
    ],
    quiz: [
      { q: 'Why do hash-pinned lockfiles defend against dependency confusion?',
        choices: ['They are faster', 'The exact reviewed distributions are pinned by hash, so a same-named surprise package cannot silently substitute', 'They hide package names', 'They skip the index'],
        answer: 1,
        why: 'Pinning name+version+hash makes the dependency tree data. Substitution fails the hash check loudly instead of shipping quietly.' },
    ] },
];

// Every fundamental is type 'python'; the topic field drives the filter chips.
export const PYTHON_NODES = RAW_PYTHON_NODES.map(n => ({ type: 'python', ...n }));

// Edges: each topic chains its nodes with builds_on in written order (a reading
// path), then hand-authored relates_to links tie topics together and anchor the
// fundamentals to the estate's practice reps and concepts.
const chains = [];
{
  const byTopic = new Map(PYTHON_TOPICS.map(t => [t.id, []]));
  for (const n of PYTHON_NODES) byTopic.get(n.topic).push(n);
  for (const nodes of byTopic.values()) {
    for (let i = 0; i < nodes.length - 1; i++) {
      chains.push({ source: nodes[i].id, target: nodes[i + 1].id, kind: 'builds_on' });
    }
  }
}

const crossLinks = [
  { source: 'py-core-mutability', target: 'py-struct-shallow-deep-copy', kind: 'relates_to' },
  { source: 'py-core-comprehensions', target: 'py-iter-generator-expressions', kind: 'relates_to' },
  { source: 'py-struct-hashability', target: 'py-oop-eq-hash', kind: 'relates_to' },
  { source: 'py-iter-iterator-protocol', target: 'py-oop-dunder-protocols', kind: 'relates_to' },
  { source: 'py-func-lru-cache', target: 'py-func-pure', kind: 'relates_to' },
  { source: 'py-func-mutable-default', target: 'py-oop-dataclasses', kind: 'relates_to' },
  { source: 'py-err-context-managers', target: 'py-oop-dunder-protocols', kind: 'relates_to' },
  { source: 'py-err-retry-patterns', target: 'py-conc-timeout', kind: 'relates_to' },
  { source: 'py-conc-gather', target: 'py-err-exception-groups', kind: 'relates_to' },
  { source: 'py-type-protocol', target: 'py-oop-duck', kind: 'relates_to' },
  { source: 'py-type-validation', target: 'py-oop-dataclasses', kind: 'relates_to' },
  { source: 'py-std-json', target: 'py-type-typeddict', kind: 'relates_to' },
  { source: 'py-std-subprocess', target: 'py-conc-futures', kind: 'relates_to' },
  { source: 'py-iter-iteration-mutation', target: 'py-core-mutability', kind: 'relates_to' },
  { source: 'py-conc-threads-io', target: 'py-conc-asyncio-loop', kind: 'relates_to' },
  { source: 'py-pkg-pyproject', target: 'py-pkg-pinning', kind: 'relates_to' },
  { source: 'py-type-none-narrowing', target: 'py-core-none', kind: 'relates_to' },
  { source: 'py-func-closures', target: 'py-func-scope-legb', kind: 'relates_to' },
  { source: 'py-pkg-pip', target: 'py-std-urllib-vs-requests', kind: 'relates_to' },
];

// Anchors to the existing estate: practice reps and concepts that exercise
// exactly these fundamentals.
const estateLinks = [
  { source: 'py-conc-gil', target: 'x-gil-concurrency', kind: 'relates_to' },
  { source: 'py-conc-asyncio-loop', target: 'x-agent-loop', kind: 'relates_to' },
  { source: 'py-conc-async-primitives', target: 'x-vendor-client', kind: 'relates_to' },
  { source: 'py-conc-blocking-loop', target: 'x-vendor-client', kind: 'relates_to' },
  { source: 'py-oop-dataclasses', target: 'x-run-budget', kind: 'relates_to' },
  { source: 'py-type-protocol', target: 'x-eval-harness', kind: 'relates_to' },
  { source: 'py-err-traceback', target: 'x-traceback-drill', kind: 'relates_to' },
  { source: 'py-err-retry-patterns', target: 'c-idempotency', kind: 'relates_to' },
  { source: 'py-func-lru-cache', target: 'x-mem-cache', kind: 'relates_to' },
  { source: 'py-std-datetime', target: 'x-backtest-bias', kind: 'relates_to' },
];

export const PYTHON_EDGES = [...chains, ...crossLinks, ...estateLinks];
