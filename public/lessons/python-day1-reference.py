"""Day 1 reference solutions. Python 3.10+, standard library only.
Run only after making your own attempt: python python-day1-reference.py
"""
from collections import Counter, defaultdict, deque
import heapq


def word_counts(text):
    counts = {}
    for raw in text.split():
        token = raw.casefold().strip('.,!?;:')
        if token:
            counts[token] = counts.get(token, 0) + 1
    return sorted(counts.items(), key=lambda pair: (-pair[1], pair[0]))


def group_scores(rows):
    grouped = defaultdict(list)
    for name, score in rows:
        if name:
            grouped[name[0].casefold()].append((name, score))
    return {
        initial: sorted(grouped[initial], key=lambda row: (-row[1], row[0]))
        for initial in sorted(grouped)
    }


def recent_unique(items, capacity):
    if capacity < 0:
        raise ValueError('capacity must be nonnegative')
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


def next_jobs(jobs, k):
    if k < 0:
        raise ValueError('k must be nonnegative')
    heap = [(minute, seq, label)
            for seq, (minute, label) in enumerate(jobs)]
    heapq.heapify(heap)
    take = min(k, len(heap))
    return [heapq.heappop(heap)[2] for _ in range(take)]


def rank_tokens(tokens):
    counts = Counter(tokens)
    return sorted(counts.items(), key=lambda p: (-p[1], p[0]))


def event_report(events, capacity, k):
    if capacity < 0 or k < 0:
        raise ValueError('capacity and k must be nonnegative')
    counts = Counter()
    for event in events:
        for raw in event['tags']:
            tag = raw.casefold().strip()
            if tag:
                counts[tag] += 1
    return {
        'tag_counts': sorted(counts.items(), key=lambda p: (-p[1], p[0])),
        'recent_names': recent_unique(
            (event['name'] for event in events), capacity
        ),
        'next_names': next_jobs(
            [(event['minute'], event['name']) for event in events], k
        ),
    }


if __name__ == '__main__':
    assert word_counts('Tea tea, pear!') == [('tea', 2), ('pear', 1)]
    assert group_scores([('Ana', 7), ('Ali', 9), ('Bo', 8), ('', 99)]) == {
        'a': [('Ali', 9), ('Ana', 7)], 'b': [('Bo', 8)]
    }
    assert recent_unique(['a', 'b', 'a', 'c', 'a'], 2) == ['c', 'a']
    assert next_jobs([(5, 'B'), (3, 'A'), (5, 'C')], 2) == ['A', 'B']
    assert rank_tokens(['b', 'b', 'a']) == [('b', 2), ('a', 1)]
    assert event_report([], 0, 0) == {
        'tag_counts': [], 'recent_names': [], 'next_names': []
    }
    print('All six reference sample checks passed.')
