# target locales

> thesis: keeberia's geography is delivery-mode-first. the same country can be wide open for file downloads and still closed for connected fab ordering, so locale rollout is scoped per pass, not per country.

or simply put: pass one sells manufacturable files you take to whatever fab you like, so almost nowhere is off the table. pass two orders through keeberia to a connected fab, and a destination only becomes live when that specific fab route is verified. one country, two different maps.

## why no rollout phases

keeberia does not have a phased country rollout like a physical-goods marketplace. it has two product passes with different geographic logic:

- **pass one: file download (first)**. one-off purchase, no subscription. keeberia hands over the manufacturable bundle (gerbers, drill, case stl, caps, bom, firmware source) and the buyer figures out fabrication themselves: their own jlcpcb account, their own sla shop, their own soldering iron or a friend's. nothing physical crosses a border, so the locale question is payment, tax on digital goods, and support language, not shipping.
- **pass two: connected ordering (later)**. ordering through keeberia to connected fabs (jlcpcb family first, per the partnership direction). now physical goods ship, so geography goes deny-by-default: a destination is not live because a fab advertises worldwide delivery. each fab route (jlcpcb, pcbway, osh park, aisler, seeed) gets its own destination verification, duties and tax handling, and defect/returns story before its countries switch on.

the two passes can be live in the same country at different times: a german buyer can download files on day one while connected ordering to germany waits until a fab route is verified.

## pass one: file download locales

intended scope: anywhere the payment provider supports one-off purchases and digital-goods tax can be handled. support is english-first at launch.

first intended cohort (planned, not live promises):

- united states
- canada (high-ppp priority)
- united kingdom (high-ppp priority)
- ireland (high-ppp priority)
- australia (high-ppp priority)
- new zealand
- germany
- netherlands
- france
- switzerland (high-ppp priority)
- sweden (high-ppp priority)
- denmark (high-ppp priority)
- austria
- belgium
- italy
- spain

high-ppp marks are priority signals for demand research and launch ordering, not pricing tiers. the eurozone entries are native-english-optional: strong english fluency in the nordics and netherlands makes them pass-one friendly even before localization exists.

pass-one activation for a country needs, at minimum: payment provider coverage, digital-goods vat/tax handling, and a support-language decision. those checks are cheap, which is why pass one is the default-open map.

## pass two: connected fab ordering locales

deny-by-default. a destination becomes live only per verified fab route, never globally:

1. confirm the connected fab actually ships reliably to the destination (fab's own coverage, not marketing claims)
2. verify landed cost: duties, vat, customs documents, who acts as importer
3. verify tracked and insured carrier service plus value limits
4. establish the defect/reprint/returns story across an international fab hop
5. review destination consumer-protection and buyer terms
6. approve the route with evidence, then enable only the capabilities actually supported

expected first route: jlcpcb-family delivery to the us and eu, since the partnership direction already targets that family. the countries enabled by that route become the pass-two cohort. country support can be paused without deleting its approval history.

## research holds

keyboard culture is global, so some obvious markets stay on a research hold rather than the cohort until evidence or routes justify them:

- japan (largest concentrated mechanical keyboard culture; localization and route required)
- south korea (strong custom keeb scene, same)
- singapore
- united arab emirates
- norway (high-ppp priority, outside the eu, eea customs nuance)

these stay research-only until the pass-two route questions or localization evidence say otherwise.

## what this file does not claim

all listed countries are product targets, not live promises. entries are planning state, not capability. there is no per-country market sizing here yet: that belongs to the evidence-backed market work (see [README.md](README.md)). open questions to evidence later:

- digital-goods tax treatment per country (vat on downloads differs: verify before selling, not after)
- payment provider coverage for one-off purchases per country
- jlcpcb/pcbway/seeed real destination coverage and defect rates, per fab, with sources
- keyboard-market demand signals per high-ppp country (community size, vendor density, group-buy activity)

see also:

- [target-user-profile.md](target-user-profile.md) (who the locales contain)
- [`../positioning/niche.md`](../positioning/niche.md) (why these audiences)
