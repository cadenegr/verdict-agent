# 6. Red means fines and shutdowns, churn is a doubt, evidence is cached

**Status:** accepted, 2026-11-27 (owner approved in the blueprint for build/risk-churn, and
the end-of-life notice and the archive retry after the odd-half run)

## Context

On the even half of the Stackgini samples the agent scored 7 of 20, below the 9 that "always
Yellow" gets. It got 0 of 9 Yellows. Any breach made a product Red, so big vendors got false reds
(M365 Copilot, Tungsten, Notepad++). And nothing looked for what the reviewers call Yellow most
often: repeated renames and owner changes (QlikView, Vertica, Snow Atlas, the Copilot family).

## Decision

- Red stays for a shutdown, a regulator's fine and a privacy violation. A data breach is a
  doubt at weight −0.5: the reviewers rate Optimizely and Notepad++ Yellow despite theirs.
- A search title that ends in "?" is a question, not news, and never counts.
- A red-topic title about what may happen ("could be fined", "warns", "faces", "probe") is a
  doubt at half weight, not a red flag: a warning is not yet a fine (Microsoft Copilot).
- The product name is read from a query without relying on its quotes: the search model
  echoes queries with one quote or none, and the hits were thrown away (DoNotPay's FTC fine).
- "Private equity" hits need a private-equity word or a named fund, not "equity" or
  "investor" alone.
- A new `renamed` search topic, and `churn` on the evidence: phrases on the home page such as
  "formerly", "now part of", "acquired by", "replaced by", "an SAP company". The home page gives
  at most one churn signal. A churn signal counts with the yellow news hits toward
  `MIN_YELLOW_RISKS`, so a single "formerly" leaves a product Green (Planview Vantage).
- `endNotices` on the evidence: the vendor's own notice that the product ends ("end of life",
  "no longer supported", "wird … eingestellt"), outside link texts. It raises a red flag, like a
  shutdown in the news (NettoPro stops after 2026).
- `make verdict` also writes the raw evidence to `live/evidence.jsonl`. `REUSE=1 make verdict
IN=…` reuses its search hits (they cost tokens) and the archive lookups that answered; the
  sites and the failed archive lookups are fetched again, two products at a time. A rule can be
  tuned without new searches. It is an environment variable, so the foundation-owned `Makefile`
  stays as it is.

## Given up

- The product name from the input list as a churn source. Many sample names say "formerly …",
  but those names were written by the reviewers, so using them would leak the answer.
- "Legacy" as a churn word: vendors use it for the systems they replace.
- AnyDesk was Red only because of its 2024 breach. It is now expected to be Yellow, so we lose one
  correct Red (its real red flag, staying in Russia, needs another source).
- The even half's search hits were read to find the false reds, so its score after this change is
  slightly optimistic. The weights were tuned on the odd half only.
