# the keeberia research corpus

> thesis: every claim the engines act on is sourced, dated, and quotable. not vibes, evidence.

or simply put: this is the knowledge base under the product. when circuitron checks a board's
trace widths, the numbers came from a fab's own documentation, through an evidence line with
a link, a section, a verbatim excerpt, and the date we read it.

the shape is modeled on sculptura-research (the jewellery equivalent, kqrla/sculptura-research)
with the same disciplines:

- **candidates/** — one file per manufacturer or vendor, always the same shape:
  finding → conditions and caveats → sources with retrieval dates → *how this enters the engine*
- **capabilities/** — a manufacturer's design rules as data, one json per fab, validated by
  schema.json. the engines import these directly: a board is validated against the fab you
  would actually order from, not generic rules
- **evidence/evidence.jsonl** — the claim ledger. every fact: evidence_id, source metadata,
  location, verbatim excerpt, accessed_at
- **evidence/contradictions.jsonl** — where sources disagree. we track the conflict; we don't
  average it away
- **evidence/ontology.json** — the domain model: what a switch family, a mount, a profile,
  an MCU module, a fab process *is* in keeberia terms

## how to add a claim

1. fetch the source (firecrawl, browserbase, plain curl)
2. write the evidence line with a verbatim excerpt
3. only then write the candidate/capability/json it feeds
4. capabilities.json changes get cross-checked against what the engines already emit

nothing enters a record, a drc rule, or an engine default without a line here.
