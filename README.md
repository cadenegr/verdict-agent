# verdict-agent

A command-line agent that judges whether a software product is real, alive and trustworthy, and
gives evidence links a human can open. Built for the Research to Commerce hackathon (Norma
challenge). Two agents work on this repo through branches and pull requests, and the Norma GitHub
App checks each pull request.

## Stackgini verdicts

[`stackgini-verdicts.csv`](stackgini-verdicts.csv) at the top level holds the agent's verdict for
the 10 out-of-sample products (ids 41–50, input in
[`fixtures/out_of_sample/out_of_sample_10.csv`](fixtures/out_of_sample/out_of_sample_10.csv)).
Nobody researched them by hand: it was made with
`SEARCH_PROVIDER=tavily JUDGE=claude make verdict IN=fixtures/out_of_sample/out_of_sample_10.csv`
followed by `make export`.

- Columns: `id, url, product, vendor` as given, then `overall`, `green_flags`, `yellow_flags`,
  `red_flags` and `reasoning`. Each flag is one reason followed by the link it rests on, in
  brackets. Flags are separated by `;`.
- `overall` is **Red** when the product is dead or any evidence is a red flag (for example a
  regulator fine, a confirmed breach or a court ruling against the vendor). It is **Yellow** when
  the agent doubts it or can't tell, for example when the vendor or its claims can't be checked or the product looks
  very new. Otherwise it is **Green**. Yellow flags alone don't make a product Yellow.
- `reasoning` gives the agent's internal verdict (`trust`, `doubt` or `dead`), its confidence and
  what it couldn't check.

## Status

- Works now: `make evidence IN=<file>` collects evidence per product (home page, dead links, help
  centre, Wayback first and last snapshot, optional search). The rules in `packages/core` turn that
  evidence into a verdict: `trust`, `doubt`, `dead` or `unsure`, with a confidence from 0 to 1 and
  the links behind it.
- Next: `make verdict` and `make eval` on the test set in `fixtures/`.
- Prepared before the event (27 Nov 2026, 15:00): the foundation scaffold and the evidence
  collector.

## How to run it

Needs Node 24 (`nvm use` picks it up from `.nvmrc`).

```bash
make setup                       # first time only
make evidence IN=urls.txt        # one URL per line in, one JSON record per line out
make test                        # unit tests, no network
make lint                        # formatting, code style and types
```

Search is off by default. Set `SEARCH_PROVIDER` in `.env` (see `.env.example`) to switch it on.
Live products and verdicts go in `live/`, which git ignores.

## Where things go

```
apps/agent/        the CLI: network access (site, Wayback, search) and nothing else
packages/core/     the rules: evidence from raw pages, verdict from evidence. Pure, with tests
packages/shared/   data shapes (zod): Evidence, ProductVerdict
fixtures/          the public test set with labels
apps/web/          the foundation's web shell (not used yet)
docs/decisions/    why things are the way they are
docs/norma-log.md  every Norma finding and what was done with it
```

## Verdict record

One JSON line per product, plain so it can be converted to the organizers' format later:

```json
{
  "product": "https://example.com",
  "verdict": "trust",
  "confidence": 0.86,
  "evidence": [
    { "url": "https://…", "kind": "wayback-first", "note": "First archived 4000 days ago" }
  ]
}
```

## Decisions

`DEFENCE.md` explains how the Norma findings were handled, from `docs/norma-log.md`.
