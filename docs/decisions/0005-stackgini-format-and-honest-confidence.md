# 5. Stackgini's format, honest confidence, and eval and export targets

**Status:** accepted, 2026-11-27 (owner approved in the blueprint for PR C)

## Context

Stackgini sent 40 reviewed samples (Green, Yellow, Red, with flags and reasoning). A first run on
them scored 14 of 40: the agent said trust, at confidence 1, for 39 products. 14 of those rested on
"home page loads" alone, because Wayback lookups failed under load and nothing said so.

## Decision

- Every evidence item carries a `flag` (green, yellow, red). `ratingOf` in `packages/core` turns a
  verdict into Stackgini's traffic light: Red when the product is dead or any flag is red, Yellow for
  `doubt` and `unsure`, Green otherwise. Yellow flags alone don't make a product Yellow: Stackgini
  rates products Green that carry yellow flags (sample 1).
- A lookup that didn't answer (archive, search) becomes a `gap`: no weight, but confidence is capped
  at 0.6. A failed home page is evidence, not a gap. "Alive" resting on fewer than 3 observations
  is `unsure`.
- The Wayback lookup retries once after 5 s on 429, a server error or no reply. The host queue
  (decision 4) still keeps 1 request/s per host on top of it.
- Two more additions to the foundation-owned `Makefile`, like decisions 3 and 4:
  `make eval [LABELS=<file>] [HALF=odd|even]` scores any labelled set by traffic light, on all of it
  or one half (tune on odd, report on even). `make export` writes `live/stackgini.csv` in the
  organizers' columns. These targets may conflict on `copier update`; keep them when resolving.
- The organizers' samples stay in `live/` (gitignored): the repository is public and the file holds
  their reviewers' notes.

## Given up

- Yellow when any flag is yellow: simpler, but wrong against the samples.
- Dropping the old verdict names (trust, doubt, dead): the existing test set and rules use them;
  the traffic light is a reading of them, not a replacement.
- `flag` as optional: lines written before this change no longer parse. Re-run `make verdict`.
