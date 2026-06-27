#!/usr/bin/env python3
"""
One-time migration: lift the hand-written, plain-English Cleric spell
descriptions out of the original `clerictest.html` and emit them as
`data/overrides.js`, keyed by the generated spell slug.

After this runs, `data/overrides.js` is maintained by hand: any slug present
there shadows the auto-generated description/heightened text (the "hybrid").

    python3 tools/migrate_cleric_overrides.py \\
        --src ../clerictest.html \\
        --generated data/spells.generated.js \\
        --out data/overrides.js
"""
import argparse
import json
import re
import sys

STR = r'"((?:[^"\\]|\\.)*)"'  # a JS double-quoted string with escapes


def unescape_js(s):
    return s.encode("utf-8").decode("unicode_escape") \
        if "\\u" in s else s.replace('\\"', '"').replace("\\\\", "\\")


def parse_curated(html_path):
    text = open(html_path, encoding="utf-8").read()
    # the SPELLS array — each spell object is one line: {name:"...",...}
    block = text[text.index("const SPELLS = "):]
    block = block[:block.index("\n];")]
    spells = []
    for line in block.splitlines():
        line = line.strip()
        if not line.startswith("{name:"):
            continue
        name = re.search(r"name:" + STR, line)
        desc = re.search(r"description:" + STR, line)
        height = re.search(r"heightened:(null|" + STR + ")", line)
        if not name:
            continue
        spells.append({
            "name": unescape_js(name.group(1)),
            "description": unescape_js(desc.group(1)) if desc else None,
            "heightened": (None if (not height or height.group(1) == "null")
                           else unescape_js(height.group(2))),
        })
    return spells


def load_slug_map(generated_path):
    txt = open(generated_path, encoding="utf-8").read()
    txt = txt[txt.index("["):txt.rindex("]") + 1]
    gen = json.loads(txt)
    by_name = {}
    for s in gen:
        by_name[s["name"].strip().lower()] = s["slug"]
    return by_name


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--generated", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    curated = parse_curated(args.src)
    slug_of = load_slug_map(args.generated)

    overrides = {}
    unmatched = []
    for c in curated:
        slug = slug_of.get(c["name"].strip().lower())
        if not slug:
            unmatched.append(c["name"])
            continue
        entry = {"description": c["description"]}
        if c["heightened"]:
            entry["heightened"] = c["heightened"]
        overrides[slug] = entry

    # stable order
    overrides = dict(sorted(overrides.items()))

    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write("/* Curated, beginner-friendly overrides (the \"teaching\" voice).\n")
        fh.write("   Any slug here shadows the auto-generated text. Hand-edited —\n")
        fh.write("   add an entry for any spell whose wording you want to simplify. */\n")
        fh.write("const SPELL_OVERRIDES = ")
        json.dump(overrides, fh, ensure_ascii=False, indent=2)
        fh.write(";\n")

    print(f"wrote {len(overrides)} overrides to {args.out}", file=sys.stderr)
    if unmatched:
        print("UNMATCHED (no slug found): " + ", ".join(unmatched),
              file=sys.stderr)


if __name__ == "__main__":
    main()
