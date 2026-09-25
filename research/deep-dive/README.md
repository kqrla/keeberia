---
title: deep dive, long-form understanding
summary: the four open-ended research fronts (technical depth, prior art, users, manufacturing reality), kept separate from the point-question evidence corpus
---

# deep dive: understanding before building

> thesis: the main evidence corpus (evidence.jsonl) answers point questions
> with verifiable excerpts. this folder answers open-ended ones: how does
> freeroute actually work, what did ergogen try, what do makers struggle
> with, where does the pixel-perfect model break. the two feed each other:
> every hard claim in a deep-dive page still needs an evidence line in the
> corpus before it can gate anything in the engine.

or simply put: evidence.jsonl is the courtroom, deep-dive is the study.

## the four fronts (anne, sept 25 2026)

- technical-depth/: the engineering under the engines. routing algorithms,
  the dsn/ses bridge as a format, freeroute under the hood, the scad
  expressiveness frontier.
- competitive-priorart/: what exists and what has been tried, one folder
  per tool, plus the comparison table across all of them.
- community-user/: what people who make keyboards care about, struggle
  with, and what would make them trust a generator over manual work.
- manufacturing-reality/: measured tolerances over marketing numbers, real
  print test data, feeding checkman's margin model with reality.

## rules

- long-form pages live here. load-bearing claims still get evidence lines
  in research/evidence/ (verbatim excerpts, source urls) before they enter
  the engine. a deep-dive page without evidence pointers is a draft.
- pages cite evidence ids inline, same discipline as the main corpus pages.
- lowercase, thesis-first, no em dashes.
