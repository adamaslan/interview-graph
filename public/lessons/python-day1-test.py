"""Local contract tests, no network or third-party packages.
Keep beside python-day1-reference.py and run: python python-day1-test.py
"""
import copy
import importlib.util
import itertools
from pathlib import Path
import random
import unittest

spec = importlib.util.spec_from_file_location(
    'day1_reference', Path(__file__).with_name('python-day1-reference.py')
)
r = importlib.util.module_from_spec(spec)
spec.loader.exec_module(r)


class WordCounts(unittest.TestCase):
    def test_sample(self):
        self.assertEqual(r.word_counts('Tea tea, pear!'), [('tea', 2), ('pear', 1)])

    def test_empty_and_punctuation(self):
        self.assertEqual(r.word_counts('?!   '), [])

    def test_ties(self):
        self.assertEqual(r.word_counts('b a'), [('a', 1), ('b', 1)])

    def test_internal_punctuation_remains(self):
        self.assertEqual(r.word_counts('a-b a-b!'), [('a-b', 2)])

    def test_casefold(self):
        self.assertEqual(r.word_counts('Straße STRASSE'), [('strasse', 2)])


class GroupScores(unittest.TestCase):
    def test_sample(self):
        rows = [('Ana', 7), ('Ali', 9), ('Bo', 8), ('', 99)]
        old = rows.copy()
        self.assertEqual(r.group_scores(rows), {
            'a': [('Ali', 9), ('Ana', 7)], 'b': [('Bo', 8)]
        })
        self.assertEqual(rows, old)

    def test_empty(self):
        self.assertEqual(r.group_scores([]), {})

    def test_key_order_and_ties(self):
        result = r.group_scores([('Bo', 4), ('Ana', 7), ('Ali', 7)])
        self.assertEqual(list(result), ['a', 'b'])
        self.assertEqual(result['a'], [('Ali', 7), ('Ana', 7)])

    def test_only_empty_names_skipped(self):
        self.assertEqual(r.group_scores([('', 2), (' ', 0)]), {' ': [(' ', 0)]})


class RecentUnique(unittest.TestCase):
    def test_eviction_allows_return(self):
        self.assertEqual(r.recent_unique(['a', 'b', 'c', 'a'], 2), ['c', 'a'])

    def test_duplicate_does_not_refresh(self):
        self.assertEqual(r.recent_unique(['a', 'b', 'a', 'c'], 2), ['b', 'c'])

    def test_repeated_example(self):
        self.assertEqual(r.recent_unique(['a', 'b', 'a', 'c', 'a'], 2), ['c', 'a'])

    def test_empty_and_zero(self):
        self.assertEqual(r.recent_unique([], 3), [])
        self.assertEqual(r.recent_unique(['x'], 0), [])

    def test_one(self):
        self.assertEqual(r.recent_unique(['a', 'b', 'a'], 1), ['a'])

    def test_negative(self):
        with self.assertRaises(ValueError):
            r.recent_unique([], -1)

    def test_exhaustive_against_slow_list_oracle(self):
        for n in range(7):
            for items in itertools.product('abc', repeat=n):
                for cap in range(4):
                    expected = []
                    if cap:
                        for item in items:
                            if item not in expected:
                                expected.append(item)
                                if len(expected) > cap:
                                    expected.pop(0)
                    self.assertEqual(r.recent_unique(items, cap), expected)


class NextJobs(unittest.TestCase):
    def test_sample_tie_and_no_mutation(self):
        jobs = [(5, 'B'), (3, 'A'), (5, 'C')]
        old = jobs.copy()
        self.assertEqual(r.next_jobs(jobs, 2), ['A', 'B'])
        self.assertEqual(r.next_jobs(jobs, 20), ['A', 'B', 'C'])
        self.assertEqual(jobs, old)

    def test_zero_empty_negative(self):
        self.assertEqual(r.next_jobs([(1, 'a')], 0), [])
        self.assertEqual(r.next_jobs([], 3), [])
        with self.assertRaises(ValueError):
            r.next_jobs([], -1)

    def test_input_order_not_label_breaks_tie(self):
        self.assertEqual(r.next_jobs([(1, 'z'), (1, 'a')], 2), ['z', 'a'])

    def test_random_against_stable_sort_oracle(self):
        rng = random.Random(123)
        for _ in range(300):
            jobs = [(rng.randint(-3, 3), str(i)) for i in range(rng.randrange(25))]
            for k in (0, 1, 3, 30):
                want = [name for _, name in sorted(jobs, key=lambda x: x[0])[:k]]
                self.assertEqual(r.next_jobs(jobs, k), want)


class Debugging(unittest.TestCase):
    def test_multiplicity(self):
        self.assertEqual(r.rank_tokens(['b', 'b', 'a']), [('b', 2), ('a', 1)])

    def test_alphabetical_ties(self):
        self.assertEqual(r.rank_tokens(['b', 'a']), [('a', 1), ('b', 1)])

    def test_broken_history_reproduced(self):
        from collections import deque
        q = deque(maxlen=2)
        seen = set()
        for item in ['a', 'b', 'c', 'a']:
            if item not in seen:
                q.append(item)
                seen.add(item)
        self.assertEqual(list(q), ['b', 'c'])
        self.assertNotEqual(list(q), r.recent_unique(['a', 'b', 'c', 'a'], 2))


class EventReport(unittest.TestCase):
    def test_sample_and_no_mutation(self):
        events = [
            {'name': 'B', 'minute': 5, 'tags': [' Py ', 'data']},
            {'name': 'A', 'minute': 3, 'tags': ['py', '']},
            {'name': 'B', 'minute': 5, 'tags': ['data', 'data']},
            {'name': 'C', 'minute': 5, 'tags': []},
        ]
        old = copy.deepcopy(events)
        self.assertEqual(r.event_report(events, 2, 3), {
            'tag_counts': [('data', 3), ('py', 2)],
            'recent_names': ['A', 'C'], 'next_names': ['A', 'B', 'B']
        })
        self.assertEqual(events, old)

    def test_empty(self):
        self.assertEqual(r.event_report([], 3, 4), {
            'tag_counts': [], 'recent_names': [], 'next_names': []
        })

    def test_zero_limits_do_not_erase_counts(self):
        self.assertEqual(r.event_report([
            {'name': 'a', 'minute': 1, 'tags': [' B ', 'a', ' ', 'B']}
        ], 0, 0), {
            'tag_counts': [('b', 2), ('a', 1)],
            'recent_names': [], 'next_names': []
        })

    def test_negative_parameters_on_empty(self):
        for capacity, k in [(-1, 0), (0, -1), (-1, -1)]:
            with self.assertRaises(ValueError):
                r.event_report([], capacity, k)

    def test_ties_extra_fields_and_duplicate_names(self):
        self.assertEqual(r.event_report([
            {'name': 'z', 'minute': 1, 'tags': ['b'], 'ignored': 42},
            {'name': 'a', 'minute': 1, 'tags': ['a']},
            {'name': 'z', 'minute': 1, 'tags': []},
        ], 2, 10), {
            'tag_counts': [('a', 1), ('b', 1)],
            'recent_names': ['z', 'a'], 'next_names': ['z', 'a', 'z']
        })


if __name__ == '__main__':
    unittest.main(verbosity=2)
