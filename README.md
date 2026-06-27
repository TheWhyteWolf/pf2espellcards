# PF2e Spellbook

An interactive, mobile-first Pathfinder 2e (Remaster) spellbook for players.
Pick your class, prepare your day's spells, and track your castings during play —
all in a single offline HTML file you can text to a player.

Grew out of the original single-class `clerictest.html`. Now data-driven: spell
data is shared across the four magical traditions and each class is a config object.

## Status

All ten spellcasting classes are playable end-to-end (levels 1–20): prepare / build a
repertoire, track castings, and manage **focus spells**.

| Class | Tradition | Casting | Class features modelled |
|-------|-----------|---------|--------------------------|
| **Cleric** | Divine | prepared (full) | Divine Font · domain focus spells |
| **Wizard** | Arcane | prepared (full) | Arcane school slot (+1/rank) · Drain Bonded Item · school focus |
| **Druid** | Primal | prepared (full) | order focus spells |
| **Witch** | patron's choice | prepared (full) | patron-tradition selector · hexes (focus) |
| **Sorcerer** | bloodline's | spontaneous (full) | bloodline→tradition · signature spells · bloodline focus |
| **Bard** | Occult | spontaneous (full) | signature spells · compositions (focus) |
| **Oracle** | Divine | spontaneous (full) | signature spells · revelations (focus) |
| **Magus** | Arcane | prepared (half) | top-two-rank slots · conflux focus spells |
| **Summoner** | eidolon's choice | spontaneous (half) | eidolon-tradition selector · signature · evolution focus |
| **Psychic** | Occult | spontaneous (2/rank) | psi cantrips + Amps (focus pool) · signature spells |

Slot tables verified against the Archives of Nethys "Spells per Day" tables; spell-DC
proficiency curves verified against the Foundry pf2e class data (full casters
expert@7/master@15/legendary@19; Magus & Summoner expert@9/master@17).

**Focus spells** are fully supported across all classes: a shared Focus-Point pool
(max 3), Refocus, auto-heightening, at-will focus cantrips, and a searchable
**focus checklist** (type your domain / bloodline / order to filter a long list).

### At-the-table features

- **Computed effects at the cast rank.** Cast cards show the real dice for the rank
  you're casting at (e.g. Fireball in a rank-5 slot shows **💥 10d6 fire**; Heal at
  rank 2 shows **✚ 2d8**), for the ~380 spells with interval heightening.
- **Sustained-spell tracker.** Sustained spells get a ⏳ button; active ones show in a
  "Sustaining now" bar so you don't forget to Sustain each turn.
- **Browse filters.** Filter the spell list by **save** (Fort/Reflex/Will/none),
  **action cost**, and **trait** (e.g. "fire", "healing", "incapacitation").
- **Rituals browser** (📜 Rituals chip) — all 150 rituals with their primary/secondary
  checks, available to any class.
- **Cleric doctrine** toggle (Cloistered / Warpriest) adjusts your spell DC correctly.

### Rules editions (Remaster + legacy)

The app uses **Remaster** names and rules (matching the source data), but is built to
serve groups still on the **original/legacy** edition too:

- Mechanically the two editions are identical for what this app tracks (slot tables,
  proficiency curves, spell DC, focus pools, casting models), so both are supported.
- Spells renamed in the Remaster carry a *"formerly …"* note and are **searchable by
  their old name** (e.g. searching *Magic Missile* finds *Force Barrage*) — in Browse
  and in the Prepare dropdowns. Old names are sourced from a verified alias map plus
  auto-extraction of "(Remaster of X)" notes in the curated text.
- Legacy spells that were never changed remain listed under their original names.

App features: **multiple saved characters**, **export/import** a character as a
shareable code, **works fully offline**, **installable** as a PWA when hosted over
HTTPS (a service worker caches the app; the 👤 menu shows an **Install app** button
when the browser supports it), a **📥 Save offline copy** button that downloads the
whole spellbook as one keep-forever file, a built-in beginner Help guide, and a
**data version stamp** (in the 👤 menu).

All character and prepared-spell data lives in the browser's `localStorage` **on the
player's own device** — nothing is uploaded anywhere, and there is no account or
server. The 👤 menu states this plainly to reassure players.

Manual on the player's sheet (noted in-app): Spellstrike, the summoner's shared HP /
eidolon actions, Unleash Psyche, and a few subclass effects (blood magic, oracular
curse, companions/familiars).

## Using it

Open `dist/index.html` in any browser — no server, no install, works offline. State
is saved in the browser's localStorage per device.

Players have three ways to keep it:

1. **Just open the file.** Texted or downloaded, `dist/index.html` is fully
   self-contained and runs offline from `file://`.
2. **📥 Save offline copy** (in the 👤 menu) downloads the whole spellbook as a single
   `pf2e-spellbook.html` they can re-open any time with no internet.
3. **Install app** — when you host the app over HTTPS (see below), a service worker
   caches it and supporting browsers offer to install it to the home screen / app
   launcher; the 👤 menu surfaces an **Install app** button when that's available.
   On iPhone/iPad use Safari → Share → *Add to Home Screen*.

## Hosting on GitHub Pages

The hosted (installable) version needs four files served together from the same
folder — they're all produced by the build into `dist/`:

```
dist/index.html              the app
dist/sw.js                   service worker (offline cache; cache-busted per build)
dist/manifest.webmanifest    PWA manifest (name, colours, icon)
dist/icon.svg                app icon
```

To deploy with GitHub Pages, serve the contents of `dist/` at the site root. A simple
approach is to publish the `dist/` folder (e.g. copy its contents to a `gh-pages`
branch, or point Pages at a `/docs` folder containing the same four files):

```sh
npm run build                       # writes dist/{index.html,sw.js,manifest.webmanifest,icon.svg}

# Example: publish via a gh-pages branch
git switch --orphan gh-pages
cp dist/index.html dist/sw.js dist/manifest.webmanifest dist/icon.svg .
git add index.html sw.js manifest.webmanifest icon.svg
git commit -m "Deploy PF2e Spellbook"
git push -u origin gh-pages
# then: repo Settings → Pages → Branch: gh-pages / root
```

The service worker is **network-first** for the page (so a redeploy is picked up the
next time the player is online) and **cache-first** for assets; each build stamps a
fresh cache name so old caches are cleared automatically. If you only need the offline
file and not installability, you can ignore `sw.js`/`manifest.webmanifest`/`icon.svg`
and just share `index.html`.

## Building

The shippable file `dist/index.html` is assembled from the sources in `src/` and
`data/` by a small Python build (no dependencies, stdlib only):

```sh
python3 tools/build.py          # -> dist/index.html   (or: npm run build)
```

### Tests

A headless [jsdom](https://github.com/jsdom/jsdom) suite loads the built
`dist/index.html` and drives the real UI (200+ assertions across all classes,
casting models, focus, heightening math, filters, legacy aliases, multi-character,
the offline/install UI, and a data-integrity guard):

```sh
npm install        # one-time: installs jsdom (devDependency)
npm test           # build is assumed current; or `npm run check` to build + test
```

### Project layout

```
src/template.html   shell with <!--INJECT--> markers (views, nav, header)
src/styles.css      all styling
src/classes.js      CLASSES config + shared slot / proficiency tables
src/engine.js       the data-driven engine (rendering, state, casting)
src/sw.js           service worker (offline cache, copied to dist/ as-is)
src/manifest.webmanifest  PWA manifest (copied to dist/)
src/icon.svg        app icon (copied to dist/)
data/spells.generated.js   ALL spells + rituals, built from Foundry (do not hand-edit)
data/overrides.js          curated plain-English descriptions (hand-edited)
data/legacy_aliases.js     pre-Remaster spell names (hand-edited)
tools/build_spells.py      Foundry JSON -> data/spells.generated.js (+ version stamp)
tools/build.py             inline everything -> dist/index.html
tools/test.mjs             headless jsdom test suite (npm test)
```

### Regenerating the spell data

Spell data is generated from the open Foundry VTT `pf2e` system. Pull just the
spell pack (a few MB), then transform it:

```sh
git clone --depth 1 --filter=blob:none --sparse \
    https://github.com/foundryvtt/pf2e.git pf2e-data
cd pf2e-data && git sparse-checkout set packs/pf2e/spells && cd ..

python3 tools/build_spells.py --src pf2e-data/packs/pf2e/spells \
    --out data/spells.generated.js
python3 tools/build.py
```

`data/overrides.js` is **not** overwritten by regeneration — any slug present
there shadows the generated description with your friendlier wording (the
"hybrid" approach). Add an entry there to simplify any spell's text.

## Credits & Licensing

The software source code, user interface, and architecture for `pf2e-spellbook` are licensed under the MIT License (see `LICENSE` file). 

**ORC Notice**
This product is licensed under the ORC License located at the Library of Congress at TX 9-307-067 and available online at various locations. All warranties are disclaimed as set forth therein.

**Attribution Notice**
This application uses Licensed Material governed by the ORC License, including game mechanics and spell concepts originally created by Paizo Inc. Any Adapted Licensed Material created by [Your Name] is similarly licensed under the ORC License. 

**Reserved Material Notice**
The proprietary software source code, user interface design, logos, and layout of `pf2e-spellbook` are hereby designated as Reserved Material and are entirely excluded from the ORC License.
