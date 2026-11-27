# 7. A Claude judge reads each product against the reviewers' checklist

**Status:** accepted, 2026-11-27 (owner chose the plan's fallback, option 2)

## Context

The rules score 9 of 20 on each half of the Stackgini samples, no better than "always Yellow".
The reviewers' Yellow and Red reasons are mostly soft (naming mess, old site, no named customers,
missing governance), which keyword rules can't see. Tavily search scored worse (5 of 20).

## Decision

- `JUDGE=claude make verdict` sends each product, with the rules' evidence links, to
  `claude -p` (Sonnet, web search and fetch, at most 5 vendor pages) with a checklist taken from
  the reviewers' flags. No sample product or answer is in the prompt, and the bracketed hints in
  sample names are cut off.
- The judge has the last word. The rules' red flags become yellow links, and a green call drops
  the rules' doubts. A failed or malformed reply keeps the rules' verdict.
- Opt-in, off by default: it spends the owner's Claude budget.

## Given up

- Tuning on more samples: on 6 even samples it scored 3 of 6 against the rules' 2 of 6, then
  the token budget ran out. The prompt was sharpened once after that run, and the change is untested.
