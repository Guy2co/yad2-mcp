---
name: yad2-id-audit
description: Verify and update the static Yad2 ID data this MCP server ships — property type IDs (src/realestate/property-types.json), car manufacturer and model IDs (src/vehicles/manufacturers.json), and city/area codes (CITY_CODES in src/realestate/formatters.ts) — by checking them against the live yad2.co.il site with a Playwright browser session. Use this skill whenever the user wants to verify, audit, refresh, re-scrape, or add IDs/codes/options for yad2 data, asks whether a property type or manufacturer or city code is still correct, mentions that a search returns zero or wrong-city results, wants to add a new filter option or a missing car brand, or suspects the bundled catalogs have drifted from the site — even if they don't mention Playwright or name a specific file.
---

# Auditing Yad2's static ID data

This server hardcodes IDs that Yad2 can change under us: property types, car
manufacturers/models, and city+area codes. Nothing in the test suite can catch drift,
because the fixtures encode the same assumptions the source does. The only ground truth is
the live site.

The point of this skill is that **an accepted parameter proves nothing**. Yad2 returns HTTP
200 with a normal-looking page for IDs that are wrong, retired, or mean something entirely
different than you assume. A city code paired with the wrong area silently returns zero
listings. So every recipe below ends in a check against data Yad2 itself labels.

## Ground rules

**Use a real browser, not `curl` or WebFetch.** yad2.co.il sits behind Radware bot
protection. A direct fetch gets a challenge page (title: "Radware Page"). This is the same
reason `src/infra/browser.ts` exists.

**Load one page, then `fetch()` from inside it.** Once a navigation clears the challenge,
same-origin `fetch(..., { credentials: 'include' })` inside the page returns real SSR HTML
and real gateway JSON. This is dramatically faster than navigating per ID and it is how all
the batch loops below work.

**Throttle.** 400–600 ms between requests in a loop. You are scraping someone's production
site to maintain a client for it; don't hammer it.

**Corroborate before you believe.** Confirm an ID with at least two of:
1. the label on the returned listings (`additionalDetails.property.text`,
   `address.city.text`, `manufacturer.text` — Yad2's own words for what it gave you),
2. the SEO `<title>`, which Yad2 generates from the filter ID,
3. result counts (for a comma-joined multi-value param, the total should equal the sum of
   the parts).

## Starting a session

```
browser_navigate → https://www.yad2.co.il/realestate/forsale?city=5000&area=1
```

Then wait for the challenge to clear — the real `__NEXT_DATA__` arrives a few seconds after
`load` via a client-side redirect:

```js
async () => {
  await new Promise(r => setTimeout(r, 6000));
  return { title: document.title, ready: !!document.getElementById('__NEXT_DATA__') };
}
```

If `ready` is false, wait longer and retry. If the title is still "Radware Page" after ~15s,
close the page and navigate again rather than pushing on.

Helper used by every recipe below — fetch any Yad2 page and get its parsed SSR state. Each
`browser_evaluate` call runs in a fresh scope, so stash it on `window` once and it stays
available for the rest of the session (as long as you don't navigate away):

```js
() => {
  window.ssr = async (url) => {
    const r = await fetch(url, { credentials: 'include' });
    const t = await r.text();
    const m = t.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    return {
      url: r.url,
      title: (t.match(/<title[^>]*>([^<]*)</) || [])[1],
      queries: m ? JSON.parse(m[1]).props.pageProps.dehydratedState.queries : [],
    };
  };
  return typeof window.ssr;
}
```

The recipes below call it as `ssr(...)`; read that as `window.ssr(...)`.

Two things about the SSR state that will waste your time otherwise:

- **Feed pages need a city.** `/realestate/rent` and `/realestate/forsale` with no params are
  marketing "lobby" pages with no filter UI and no feed. Always pass `?city=5000&area=1`.
- **Match `queryKey[0]` exactly.** The options query is
  `["base-search-options","realestate-feed-forsale"]` and the feed query is
  `["realestate-forsale-feed",{...}]`. A substring test for `-feed` matches both and you'll
  silently read the wrong one.

## Recipe 1 — Property types

Target file: `src/realestate/property-types.json` (`{ id, yad2Id, name, nameEn }`, where
`yad2Id` is Yad2's numeric `property` param and `id` is our semantic slug).

Yad2 ships the authoritative option list inside the feed page's SSR state:

```js
async () => {
  const s = await ssr('https://www.yad2.co.il/realestate/forsale?city=5000&area=1');
  const q = s.queries.find(x => x.queryKey[0] === 'base-search-options');
  return { property: q.state.data.property, propertyGroup: q.state.data.propertyGroup };
}
```

Each entry is `{ id, title, propertyGroupId }`. **Check rent and for-sale separately** —
they differ. Rent carries types for-sale doesn't (e.g. sublet, apartment swap), so anything
rent-only needs to be marked as such for callers of `search_for_sale`. The same query key
also exposes `rooms`, `squaremeter`, `squareMeterBuild`, `floor` and `price` options if you
ever need to audit those.

Then confirm each ID actually filters to the type you think it does:

```js
async () => {
  const out = {};
  for (const id of ['1', '3', '39' /* ... */]) {
    const s = await ssr(`https://www.yad2.co.il/realestate/rent?city=5000&area=1&property=${id}`);
    const d = s.queries.find(x => x.queryKey[0] === 'realestate-rent-feed')?.state.data || {};
    const labels = {};
    [...(d.private || []), ...(d.agency || []), ...(d.platinum || [])]
      .forEach(it => { const p = it.additionalDetails?.property?.text; labels[p] = (labels[p] || 0) + 1; });
    out[id] = { total: d.pagination?.total ?? null, labels, title: s.title };
    await new Promise(r => setTimeout(r, 450));
  }
  return out;
}
```

A correct ID yields exactly one distinct label. Two traps here:

- **Don't regex the raw `__NEXT_DATA__` string for `"property":{"text":` .** The blob also
  holds recommendation and "similar listings" blocks that ignore your filter, so every ID
  looks like it returns דירה. Read the feed query's arrays.
- **Rare types have no inventory in one city.** Types like משק עזר or דיור מוגן return 0 in
  Tel Aviv. Fall back to the SEO title, which Yad2 derives from the ID itself
  (`property=39` → "דו משפחתיים למכירה…"), or drop the city filter.

Comma-joined multi-value works (`property=5,39,55`) and the totals add up — useful to verify
an aggregate entry is really the sum of its parts.

After editing, extend the `propertyType` enum in `src/mcp/tools.ts` (adding values is
additive and safe; removing or renaming breaks every client) and the id list in the
`propertyType` comment in `src/realestate/types.ts`.

## Recipe 2 — Car manufacturers and models

Target file: `src/vehicles/manufacturers.json`
(`{ id, name, nameEn, models: [{ id, name }] }`).

Cars have a clean catalog API — no page scraping needed, but still run it from inside a
loaded page so it carries the cleared-challenge cookies:

| Endpoint | Returns |
| --- | --- |
| `gw.yad2.co.il/vehicles-cars-catalog/` | all manufacturers: `{ id, engTitle, title }` |
| `gw.yad2.co.il/vehicles-cars-catalog/?manufacturer=<id>` | that maker's models: `{ id, title }` |
| `gw.yad2.co.il/vehicles-cars-catalog/base` | seats, `carFamilyType`, gearbox etc. |

```js
async () => {
  const r = await fetch('https://gw.yad2.co.il/vehicles-cars-catalog/', { credentials: 'include' });
  const mans = (await r.json()).data.manufacturer;
  const out = [];
  let i = 0;
  const worker = async () => {
    while (i < mans.length) {
      const m = mans[i++];
      const j = await (await fetch(`https://gw.yad2.co.il/vehicles-cars-catalog/?manufacturer=${m.id}`, { credentials: 'include' })).json();
      out.push({ id: m.id, title: m.title, engTitle: m.engTitle, models: (j.data.model || []).map(x => ({ id: x.id, title: x.title })) });
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);   // pool of 4 is polite enough
  out.sort((a, b) => a.id - b.id);
  return { manufacturers: out.length, models: out.reduce((a, x) => a + x.models.length, 0), data: out };
}
```

Save that dump to a file and render it into the repo's format with
`scripts/render-manufacturers.mjs` (see **Bundled scripts**).

Notes that matter when you write the file:

- **Model titles are often Hebrew** (`קורולה`, `מודל 3`) even for Latin-named models; roughly
  half the catalog. Decide with the user whether to keep Yad2's titles verbatim or anglicize,
  and apply it consistently — a file where Toyota is half English and half Hebrew is worse
  than either choice. The current file uses verbatim upstream titles.
- **Some catalog brands have zero models.** That's upstream reality, not a fetch failure;
  they still render as valid `manufacturer` filter values.
- **Trim titles.** A couple of dozen carry trailing spaces (`"אוקטביה "`).

Confirm IDs against the feed, whose query key is `["feed-mix","vehicles","cars",{}]`:

```js
async () => {
  const s = await ssr('https://www.yad2.co.il/vehicles/cars?manufacturer=62&model=10846');
  const d = s.queries.find(x => x.queryKey[0] === 'feed-mix')?.state.data || {};
  const seen = {};
  Object.values(d).filter(Array.isArray).flat()
    .forEach(it => { const k = `${it?.manufacturer?.text} / ${it?.model?.text}`; seen[k] = (seen[k] || 0) + 1; });
  return { total: d.pagination?.total ?? null, seen };
}
```

## Recipe 3 — City and area codes

Target: the `CITY_CODES` array in `src/realestate/formatters.ts` (inline, not JSON) —
`{ code, area, name, nameEn }`. Both parts matter: `lookupCityArea` sends `city` **and**
`area`, and Yad2 needs them to agree.

**This is the highest-risk dataset.** A code paired with the wrong area returns HTTP 200 and
zero listings — the tool looks like it works and simply finds nothing. A code that belongs to
a different city returns thousands of listings for the wrong place. Neither shows up as an
error anywhere.

Name check — `city_id` is an exact filter over Yad2's 1,454-city address master:

```js
async () => {
  const r = await fetch('https://gw.yad2.co.il/address-master/cities?city_id=5000', { credentials: 'include' });
  return (await r.json()).data.data;   // [{ city_id: "5000", city_heb: "תל אביב יפו" }]
}
```

An empty result means the code is not a valid city ID at all. `address-master/cities` also
pages over the full list (`?limit=&offset=`, 10 per page by default) and
`address-master/areas` returns the 54 areas as `{ area_id, area_heb }`.

Area check — this is the useful trick: **omit `area` and let Yad2 resolve it**, then read it
back off the redirected URL and confirm with the listings' own city field:

```js
async () => {
  const out = [];
  for (const code of ['5000', '3000' /* ... */]) {
    const s = await ssr(`https://www.yad2.co.il/realestate/forsale?city=${code}`);
    const q = s.queries.find(x => x.queryKey[0] === 'realestate-forsale-feed');
    const d = q?.state.data || {};
    const cities = {};
    [...(d.private || []), ...(d.agency || [])]
      .forEach(it => { const c = it.address?.city?.text; if (c) cities[c] = (cities[c] || 0) + 1; });
    out.push({ code, area: q?.queryKey[1]?.area, total: d.pagination?.total ?? null, cities, title: s.title });
    await new Promise(r => setTimeout(r, 500));
  }
  return out;
}
```

A healthy entry comes back with a single city name, a non-zero total, and an `area` matching
what we store. Zero total with a valid code is the signature of a wrong `area`.

If you need the code for a city Yad2 doesn't resolve from a guess, drive the UI instead:
open the feed page, type the city into the search box, apply, and read `city` and `area` off
the resulting URL. That is the same approach that works for any filter whose param encoding
you can't guess — click it in the UI and let Yad2 build the URL for you.

## Bundled scripts

Both read a JSON dump (the browser output above, saved to a file) and write the target file
in the repo's house format. `.prettierignore` excludes `*.json`, so the hand-aligned columns
in these files are deliberate and must be reproduced — that's what these scripts are for.

```bash
node .claude/skills/yad2-id-audit/scripts/render-manufacturers.mjs <catalog-dump.json>
node .claude/skills/yad2-id-audit/scripts/render-property-types.mjs <rows.json>
```

Run `node <script> --help` for the exact input shape each expects.

## Finishing up

Report what you verified, not just what you changed — "all 256 model IDs valid, 4 of 23 city
codes correct" tells the user where the risk is. Include the evidence (counts, labels) for
anything you claim is wrong.

Then work through this list:

1. **Update the dependent code.** New property types need the `src/mcp/tools.ts` enum and the
   `src/realestate/types.ts` comment. New tool output shapes belong in a formatter, not in
   `handlers.ts`, which stays thin.
2. **Fix the tests that encode the old data.** These assert on specific counts and mappings
   and will fail by design: `src/__tests__/formatters.test.ts` (type count),
   `src/__tests__/parsers.test.ts` (`cottage` → `yad2Id`),
   `src/__tests__/vehicle-formatters.test.ts` (a known Skoda model ID and name).
3. **Watch the response size.** `list_manufacturers` and `list_property_types` inline their
   whole dataset into a tool response an LLM has to read. The full car catalog is ~1,100
   models; dumping it unfiltered is ~7k tokens, which is why the unfiltered listing shows
   counts and defers models to a filtered call. Keep that property if the data grows again.
4. **Run the gate:** `npm run lint && npm run format:check && npm run build && npm test`.
   Functions must stay ≤ 15 non-blank, non-comment lines — extract a helper rather than
   raising the limit.
5. **Clean up scratch files.** Browser `filename:` outputs land in the repo root; delete the
   dumps when you're done and close the browser session.
