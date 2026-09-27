# target locales

> thesis: keeberia's geography is capability-gated. the market ladder moves on two axes at once: where custom-keeb demand already lives, and what the legend/script pipeline can actually ship. latin-script markets are ready first because the product already handles their layouts; cyrillic opens when dual-legend research lands; CJK and right-to-left scripts wait at the back because they change the product, not just the storefront.

or simply put: a country joins the cohort when two things are true: keeb people are there, and the product can write their script on a keycap. one country, two maps: file downloads are default-open almost everywhere, connected fab ordering is deny-by-default per verified route.

## the two passes

the product has two passes with different geographic logic:

- **pass one: file download (first)**. one-off purchase, no subscription. keeberia hands over the manufacturable bundle (gerbers, drill, case stl, caps, bom, firmware source) and the buyer figures out fabrication themselves: their own jlcpcb account, their own sla shop, their own soldering iron or a friend's. nothing physical crosses a border, so the locale question is payment, tax on digital goods, and support language, not shipping.
- **pass two: connected ordering (later)**. ordering through keeberia to connected fabs (jlcpcb family first, per the partnership direction). now physical goods ship, so geography goes deny-by-default: a destination is not live because a fab advertises worldwide delivery. each fab route (jlcpcb, pcbway, osh park, aisler, seeed) gets its own destination verification, duties and tax handling, and defect/returns story before its countries switch on.

the ladder below orders market entry for both passes; a country's version gate is about product readiness, the pass gate is about delivery readiness.

## the market ladder (demand x script readiness)

### v0: latin-script, keeb-dense, launch cohort

- germany
- united kingdom
- united states and canada
- netherlands and belgium
- france
- ireland
- nordic countries and scandinavia (especially sweden, finland, denmark)
- switzerland and austria
- australia and new zealand

all latin-script, all with existing custom-keeb scenes, none of them blocked on legend work: azerty/qwertz are physical iso variants the corpus already covers, nordic iso variants likewise. this cohort ships with the product as-is.

### v1: latin-script expansion

- poland and czechia (diacritics on latin: nothing the legend schema cannot already do)
- spain, portugal, and italy
- romania, croatia, slovenia, serbia, and other latin-script balkan markets
- singapore

### v1.5: cyrillic research begins

the cyrillic markets (russia, bulgaria, ukraine, serbia's cyrillic face) open when the dual-legend pipeline can prove itself: jcuken is already evidenced in the corpus, so this gate is about caps-engine dual-legend capability (primary/secondary pairing, print convention), not research-from-zero.

### v2: CJK and right-to-left, in this order

- japan
- south korea
- taiwan
- china
- israel

these are the densest keeb cultures on earth and the biggest product lift at the same time: kana/kanji, hangul, bopomofo, hanzi, and then the right-to-left script family. israel is explicitly the capability bar for RTL: the product has to handle right-to-left legend placement, corner anchoring, and international key mappings before that market means anything. the RTL legend-anchoring question is currently an open research item (the one line we had on RTL coordinate origins did not survive verification and was dropped, re-source pending).

## the demand lens

script readiness says when a market can open; demand says which one to work on next. the signals to measure per country:

- community density: r/mechanicalkeyboards and keeb discord presence per country, geekhack/deskthority activity
- creator density: keeb youtubers/tiktokkers/instagram builders with audience in that country (they are also the marketing channel and possibly the affiliate channel)
- vendor density: local keeb shops, group-buy runners, meetup culture (meetups = proven demand willing to travel for caps)
- developer density for the pass-one file-download profile specifically: people who can take a gerber bundle to jlcpcb themselves skew toward tech hubs

a country with middling purchasing power but thick keeb culture beats a rich country with none. the ladder above is the starting guess from script logic plus known community weight; the demand evidence pass reorders within each version band with numbers.

## pass two activation, per country

deny-by-default, per verified fab route, never globally:

1. confirm the connected fab actually ships reliably to the destination (fab's own coverage, not marketing claims)
2. verify landed cost: duties, vat, customs documents, who acts as importer
3. verify tracked and insured carrier service plus value limits
4. establish the defect/reprint/returns story across an international fab hop
5. review destination consumer-protection and buyer terms
6. approve the route with evidence, then enable only the capabilities actually supported

expected first route: jlcpcb-family delivery to the us and eu, since the partnership direction already targets that family. country support can be paused without deleting its approval history.

## what this file does not claim

all ladder entries are product targets, not live promises. there is no per-country market sizing here yet: that belongs to the evidence-backed market work (see [README.md](README.md)). open questions to evidence later:

- digital-goods tax treatment per v0 country (vat on downloads differs: verify before selling, not after)
- payment provider coverage for one-off purchases per country
- jlcpcb/pcbway/seeed real destination coverage and defect rates, per fab, with sources
- demand signals per country (community size, creator density, vendor density, group-buy activity) to set the real ordering inside each version band
- dual-legend print convention and RTL legend anchoring, the two research items gating v1.5 and v2

see also:

- [target-user-profile.md](target-user-profile.md) (who the locales contain)
- [`../positioning/niche.md`](../positioning/niche.md) (why these audiences)
- [`../../research/legends-multilingual.md`](../../research/legends-multilingual.md) and the dual-legend corpus fronts (the script-readiness evidence behind v1.5 and v2)
