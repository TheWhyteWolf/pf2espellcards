#!/usr/bin/env python3
"""
build_spells.py — convert the Foundry VTT `pf2e` system spell JSON into the
compact data model used by the PF2e spellbook app.

Source data: https://github.com/foundryvtt/pf2e  (game content under OGL/ORC).
Get it with a sparse, shallow clone (only the spells pack, ~a few MB):

    git clone --depth 1 --filter=blob:none --sparse \\
        https://github.com/foundryvtt/pf2e.git pf2e-data
    cd pf2e-data && git sparse-checkout set packs/pf2e/spells

Then:

    python3 tools/build_spells.py --src /path/to/pf2e-data/packs/pf2e/spells \\
        --out data/spells.generated.js

Output is a JS file declaring `const GENERATED_SPELLS = [ ... ];`
Each entry: {slug, name, rank, type, traditions, rarity, traits, classTrait,
             actions, range, area, targets, duration, sustained, save,
             description, heightened}
Descriptions are cleaned plain text; newlines are meaningful (rendered as <br>).
"""
import argparse
import datetime
import glob
import html
import json
import os
import re
import subprocess
import sys


def src_commit(src):
    """Best-effort short git commit of the Foundry data clone, for the stamp."""
    try:
        out = subprocess.check_output(
            ["git", "-C", src, "rev-parse", "--short", "HEAD"],
            stderr=subprocess.DEVNULL)
        return out.decode().strip()
    except Exception:
        return None

# PF2e class names that appear as traits on focus spells.
CLASS_TRAITS = {
    "bard", "champion", "cleric", "druid", "monk", "oracle", "psychic",
    "ranger", "sorcerer", "summoner", "witch", "wizard", "magus", "kineticist",
    "fighter", "rogue", "barbarian", "investigator", "swashbuckler", "thaumaturge",
    "alchemist", "animist", "exemplar", "guardian", "runesmith", "commander",
}

# Source books whose copyright line could not be verified against the Archives of
# Nethys licenses page. Spells from these are excluded from the build so that
# every source shipped in the data is credited in the OGL/ORC notice (notice.md).
# Remove a title from this set once its attribution becomes available.
EXCLUDED_SOURCES = {
    "Pathfinder #150: Broken Promises",
    "Pathfinder #171: Hurricane's Howl",
    "Pathfinder Society Scenario #2-22: Breaking the Storm: Excising Ruination",
    "Pathfinder Blog: The Waters of Stone Ring Pond",
    "Pathfinder Adventure Path: Hellbreakers",
}

# ---------------------------------------------------------------------------
# Inline Foundry markup -> readable text
# ---------------------------------------------------------------------------
GLYPH = {"1": "◆", "2": "◆◆", "3": "◆◆◆",
         "r": "⤳ reaction", "f": "◇ free"}


def _glyph(content):
    c = content.strip().lower()
    if c in GLYPH:
        return GLYPH[c]
    return content


def _template(inner):
    # e.g. "emanation|distance:30" or "line|distance:60|width:5"
    parts = inner.split("|")
    ttype = parts[0]
    dist = width = None
    for p in parts[1:]:
        if p.startswith("distance:"):
            dist = p.split(":", 1)[1]
        elif p.startswith("width:"):
            width = p.split(":", 1)[1]
    if dist and ttype == "line" and width:
        return f"{dist}-foot line ({width} ft wide)"
    if dist:
        return f"{dist}-foot {ttype}"
    return ttype


def _resolve_vars(s):
    # Foundry interpolation -> readable text (for spells, item level == rank)
    s = re.sub(r"@(?:item|spell)\.(?:level|rank)", "spell rank", s)
    s = re.sub(r"@actor\.level", "your level", s)
    return s


def _damage(inner):
    # e.g. "2d6[fire]", "(@item.level)d6[fire]", "@item.rank|options:x[cold]"
    inner = inner.split(",")[0]
    mtype = re.search(r"\[([^\]]+)\]", inner)
    dtype = mtype.group(1).split(",")[0].strip() if mtype else ""
    formula = inner[:mtype.start()] if mtype else inner
    formula = formula.split("|")[0]                 # drop |options:...
    formula = _resolve_vars(formula).strip()
    return f"{formula} {dtype}".strip()


def _check(inner):
    # e.g. "fortitude|dc:20" -> "Fortitude check"
    stat = inner.split("|")[0].split(":")[-1]
    return f"{stat.capitalize()} check"


def _uuid_label(inner):
    # No explicit {label}: derive from the last path segment.
    seg = inner.split(".")[-1]
    seg = re.sub(r"^(spell|feat|item|action)s?[-_]?", "", seg, flags=re.I)
    return seg.replace("-", " ").replace("_", " ").strip()


def clean_html(raw):
    if not raw:
        return ""
    s = raw
    # action glyphs
    s = re.sub(r'<span class="action-glyph">(.*?)</span>',
               lambda m: _glyph(m.group(1)), s, flags=re.S)
    # @Template / @Damage / @Check / @UUID  (with or without {label})
    s = re.sub(r"@Template\[([^\]]+)\]", lambda m: _template(m.group(1)), s)
    # @Damage may nest one level of brackets: @Damage[(@item.level)d6[fire]]{label}
    dmg = r"@Damage\[((?:[^\[\]]|\[[^\]]*\])*)\](?:\{([^}]+)\})?"
    s = re.sub(dmg, lambda m: m.group(2) or _damage(m.group(1)), s)
    s = re.sub(r"@Check\[([^\]]*)\]\{([^}]+)\}", r"\2", s)
    s = re.sub(r"@Check\[([^\]]*)\]", lambda m: _check(m.group(1)), s)
    s = re.sub(r"@UUID\[[^\]]+\]\{([^}]+)\}", r"\1", s)
    s = re.sub(r"@UUID\[([^\]]+)\]", lambda m: _uuid_label(m.group(1)), s)
    # any other @Foo[...]{label} / @Foo[...]
    s = re.sub(r"@[A-Za-z]+\[[^\]]*\]\{([^}]+)\}", r"\1", s)
    s = re.sub(r"@[A-Za-z]+\[[^\]]*\]", "", s)
    # block-level tags -> newlines / bullets
    s = re.sub(r"<hr\s*/?>", "\n", s)
    s = re.sub(r"<li[^>]*>", "\n• ", s)
    s = re.sub(r"</li>", "", s)
    s = re.sub(r"<br\s*/?>", "\n", s)
    s = re.sub(r"<p[^>]*>", "\n\n", s)
    s = re.sub(r"</(p|ul|ol|div|table|tr)>", "\n", s)
    # strip every remaining tag (incl. <strong>, <em>, <table>, etc.)
    s = re.sub(r"<[^>]+>", "", s)
    # safety net: resolve / drop any stray Foundry interpolations
    s = _resolve_vars(s)
    s = re.sub(r"@(?:item|actor|target|spell)\.[\w.]+(?:\*\d+)?", "spell rank", s)
    s = html.unescape(s)
    # whitespace tidy
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r" *\n *", "\n", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


HEIGHTEN_RE = re.compile(r"Heightened\s*\(")


def split_heightened(text):
    """Separate the trailing 'Heightened (...)' block from the main description."""
    m = HEIGHTEN_RE.search(text)
    if not m:
        return text.strip(), None
    main = text[:m.start()].strip()
    rest = text[m.start():].strip()
    # drop the literal word 'Heightened' (the app adds its own label)
    rest = HEIGHTEN_RE.sub("(", rest)
    rest = re.sub(r"\n+", " ", rest)
    rest = re.sub(r"\s{2,}", " ", rest).strip()
    return main, rest or None


# ---------------------------------------------------------------------------
# Field formatting
# ---------------------------------------------------------------------------
def fmt_area(area):
    if not area:
        return None
    t = area.get("type")
    v = area.get("value")
    if v is None:
        return t
    return f"{v}-foot {t}" if t else f"{v} feet"


def fmt_save(defense):
    if not defense:
        return None
    save = defense.get("save")
    if not save:
        return None
    stat = (save.get("statistic") or "").capitalize()
    if not stat:
        return None
    return f"basic {stat}" if save.get("basic") else stat


def norm_actions(time_val):
    if time_val is None:
        return None
    return str(time_val).strip()


def class_trait_of(traits):
    for t in traits:
        if t in CLASS_TRAITS:
            return t
    return None


def damage_fields(sys_):
    """Base damage dice + interval-heightening add, aligned by index, so the app
    can show the real dice at the cast rank (e.g. Fireball rank 5 -> 10d6)."""
    dmg = sys_.get("damage") or {}
    keys = sorted(dmg.keys(), key=lambda x: int(x) if str(x).isdigit() else 0)
    h = sys_.get("heightening") or {}
    hd = (h.get("damage") or {}) if h.get("type") == "interval" else {}
    base, add, any_add = [], [], False
    for k in keys:
        e = dmg[k]
        if not isinstance(e, dict) or not e.get("formula"):
            continue
        kinds = e.get("kinds") or []
        base.append({"formula": e["formula"], "type": e.get("type"),
                     "healing": ("healing" in kinds)})
        a = hd.get(k)
        add.append(a)
        if a:
            any_add = True
    heighten = None
    if base and h.get("type") == "interval" and any_add:
        heighten = {"interval": h.get("interval", 1) or 1, "add": add}
    return (base or None), heighten


def ritual_fields(sys_):
    r = sys_.get("ritual")
    if not r:
        return False, None, None
    primary = (r.get("primary") or {}).get("check")
    sec = r.get("secondary") or {}
    return True, primary, sec.get("checks")


# ---------------------------------------------------------------------------
# Per-file transform
# ---------------------------------------------------------------------------
def transform(path, is_focus=False, is_ritual=False):
    with open(path, encoding="utf-8") as fh:
        doc = json.load(fh)
    if doc.get("type") != "spell":
        return None
    sys_ = doc["system"]
    traits_obj = sys_.get("traits", {})
    traits = list(traits_obj.get("value", []))
    is_cantrip = "cantrip" in traits
    level = (sys_.get("level") or {}).get("value", 1)
    rank = 0 if is_cantrip else int(level)

    desc_raw = (sys_.get("description") or {}).get("value", "")
    description, heightened = split_heightened(clean_html(desc_raw))
    if not description.strip():
        description = "(This entry's full text isn't included here — see the rulebook.)"

    dur = sys_.get("duration") or {}
    area = sys_.get("area")
    target = (sys_.get("target") or {}).get("value") or None
    rng = (sys_.get("range") or {}).get("value") or None
    base_dmg, heighten = damage_fields(sys_)
    ritual, rit_primary, rit_secondary = ritual_fields(sys_)
    pub = sys_.get("publication") or {}
    if (pub.get("title") or "").strip() in EXCLUDED_SOURCES:
        return None  # unattributable source — excluded to keep the OGL/ORC notice complete

    rec = {
        "slug": os.path.splitext(os.path.basename(path))[0],
        "name": doc.get("name", ""),
        "rank": rank,
        "type": "cantrip" if is_cantrip else "spell",
        "focus": is_focus,
        "ritual": ritual or is_ritual,
        "traditions": list(traits_obj.get("traditions", [])),
        "rarity": traits_obj.get("rarity", "common"),
        "traits": traits,
        "classTrait": class_trait_of(traits) if is_focus else None,
        "actions": norm_actions((sys_.get("time") or {}).get("value")),
        "range": rng,
        "area": fmt_area(area),
        "targets": target,
        "duration": (dur.get("value") or None),
        "sustained": bool(dur.get("sustained")),
        "save": fmt_save(sys_.get("defense")),
        "damage": base_dmg,
        "heighten": heighten,
        "description": description,
        "heightened": heightened,
        # transient: aggregated into GENERATED_SOURCES, stripped before output
        "_pub": {"title": (pub.get("title") or "").strip(),
                 "license": (pub.get("license") or "").strip()},
    }
    if rec["ritual"]:
        rec["ritualPrimary"] = rit_primary
        rec["ritualSecondary"] = rit_secondary
    return rec


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True,
                    help="path to Foundry packs/pf2e/spells directory")
    ap.add_argument("--out", required=True, help="output .js path")
    ap.add_argument("--include-focus", action="store_true", default=True)
    args = ap.parse_args()

    spell_files = glob.glob(os.path.join(args.src, "spells", "**", "*.json"),
                            recursive=True)
    focus_files = glob.glob(os.path.join(args.src, "focus", "*.json")) \
        if args.include_focus else []
    ritual_files = glob.glob(os.path.join(args.src, "rituals", "*.json"))

    out = []
    skipped = 0

    def process(files, **kw):
        nonlocal skipped
        for p in sorted(files):
            if os.path.basename(p).startswith("_"):
                continue
            rec = transform(p, **kw)
            if rec:
                out.append(rec)
            else:
                skipped += 1

    process(spell_files)
    process(focus_files, is_focus=True)
    process(ritual_files, is_ritual=True)

    out.sort(key=lambda s: (s["ritual"], s["rank"], s["name"].lower()))

    # Aggregate source books for the in-app Credits / attribution list, then
    # strip the transient per-spell publication field from the shipped data.
    from collections import Counter
    pubc = Counter()
    for s in out:
        p = s.pop("_pub", None) or {}
        title = p.get("title")
        if title:
            pubc[(title, p.get("license") or "Unknown")] += 1
    sources = [{"title": t, "license": lic, "count": c}
               for (t, lic), c in pubc.items()]
    sources.sort(key=lambda x: (x["license"], -x["count"], x["title"]))

    meta = {
        "generated": datetime.date.today().isoformat(),
        "source": "foundryvtt/pf2e",
        "sourceCommit": src_commit(args.src),
        "count": len(out),
    }

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write("/* AUTO-GENERATED by tools/build_spells.py — do not edit. */\n")
        fh.write("/* Source: foundryvtt/pf2e spell data (Paizo content, OGL/ORC). */\n")
        fh.write("const GENERATED_META = " + json.dumps(meta) + ";\n")
        fh.write("const GENERATED_SOURCES = "
                 + json.dumps(sources, ensure_ascii=False) + ";\n")
        fh.write("const GENERATED_SPELLS = ")
        json.dump(out, fh, ensure_ascii=False, indent=0,
                  separators=(",", ":"))
        fh.write(";\n")

    n_focus = sum(1 for s in out if s["focus"])
    n_rit = sum(1 for s in out if s["ritual"])
    print(f"wrote {len(out)} entries ({n_focus} focus, {n_rit} rituals, "
          f"{len(out)-n_focus-n_rit} regular) to {args.out}; skipped {skipped}; "
          f"commit {meta['sourceCommit']}", file=sys.stderr)


if __name__ == "__main__":
    main()
