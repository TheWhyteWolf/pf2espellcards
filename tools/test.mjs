import { JSDOM, VirtualConsole } from "jsdom";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");

let pass = 0, fail = 0;
function ok(cond, msg) { (cond ? pass++ : fail++); console.log((cond ? "  ✓ " : "  ✗ FAIL ") + msg); }

const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", e => errors.push(e.message));

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  virtualConsole: vc,
  url: "https://example.org/",   // enables native localStorage
  beforeParse(window) {
    window.scrollTo = () => {};
    window.confirm = () => true;
  },
});
const w = dom.window;
const d = w.document;
const ev = (expr) => w.eval(expr);          // read/write const/let globals

console.log("\n# load / no script errors");
ok(errors.length === 0, "no jsdom script errors" + (errors.length ? ": " + errors[0] : ""));
ok(ev("GENERATED_SPELLS.length") >= 1600, `spell data loaded (${ev("GENERATED_SPELLS.length")} entries)`);
ok(ev("Object.keys(SPELL_OVERRIDES).length") === 73, "73 overrides loaded");
ok(!d.getElementById("view-classpick").classList.contains("hide"), "class picker shown on first run");
ok(d.querySelector("nav.bottom").classList.contains("hide"), "nav hidden until a class is chosen");

console.log("\n# choose Cleric");
w.chooseClass("cleric");
ok(ev("state.classId") === "cleric", "state.classId = cleric");
ok(!d.getElementById("view-prepare").classList.contains("hide"), "lands on Prepare (no prep yet)");
ok(d.getElementById("charSub").textContent.includes("Divine"), "header shows Divine list");

console.log("\n# Cleric parity: DC / slots / font across levels");
const cases = [
  { lvl: 1, dc: 16, slots: { 1: 2 }, font: 4 },
  { lvl: 3, dc: 18, slots: { 1: 3, 2: 2 }, font: 4 },
  { lvl: 5, dc: 20, slots: { 1: 3, 2: 3, 3: 2 }, font: 4 },
  { lvl: 11, dc: 28, slots: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2 }, font: 4 }, // expert@7 (+4)
  { lvl: 19, dc: 40, slots: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 1 }, font: 4 }, // Cloistered: legendary@19 (+8) -> 10+19+8+3
];
for (const c of cases) {
  ev(`state.level=${c.lvl}; state.keyMod=3; state.fontMod=3;`);
  ok(w.spellDC() === c.dc, `L${c.lvl} Spell DC = ${c.dc} (got ${w.spellDC()})`);
  ok(JSON.stringify(w.classSlots(c.lvl)) === JSON.stringify(c.slots),
     `L${c.lvl} slots ${JSON.stringify(c.slots)} (got ${JSON.stringify(w.classSlots(c.lvl))})`);
  ok(w.fontCount() === c.font, `L${c.lvl} font count = ${c.font} (got ${w.fontCount()})`);
}

console.log("\n# spell index / tradition filter / overrides");
const divine = w.classSpells();
ok(divine.length > 200, `divine list large (${divine.length} spells)`);
ok(divine.every(s => s.traditions.includes("divine")), "every listed spell is divine");
ok(divine.every(s => s.type !== "focus"), "focus spells excluded from class list");
ok(w.findSpell("heal").curated === true, "Heal uses curated override text");
ok(w.findSpell("heal").description.startsWith("Channel vital energy"), "Heal override text applied");
ok(w.findSpell("daze") && w.findSpell("daze").rank === 0, "Daze is a rank-0 cantrip");

console.log("\n# Prepare -> Cast Today flow (level 3)");
ev("state.level=3");
w.go("prepare");
const cantripSels = [...d.querySelectorAll(".cantripSel")];
ok(cantripSels.length === 5, `5 cantrip pickers rendered (got ${cantripSels.length})`);
["guidance", "shield", "stabilize", "divine-lance", "detect-magic"].forEach((slug, i) => { cantripSels[i].value = slug; });
const slotSels = [...d.querySelectorAll(".slotSel")];
ok(slotSels.length === 5, `5 slot pickers at L3 (3xR1 + 2xR2) (got ${slotSels.length})`);
slotSels.forEach(sel => {
  const r = Number(sel.dataset.rank);
  const opt = [...sel.options].find(o => o.value && w.findSpell(o.value) && w.findSpell(o.value).rank <= r);
  sel.value = opt ? opt.value : "";
});
w.savePrep();
ok(ev("state.prepared.cantrips.length") === 5, "prepared 5 cantrips");
ok(ev("state.prepared.divineFont.fontCount") === 4, "divineFont saved with 4 free casts");
ok(!d.getElementById("view-today").classList.contains("hide"), "navigated to Today after prepare");

const today = d.getElementById("todayContent").innerHTML;
ok(/Divine Font/.test(today), "Today shows Divine Font section");
ok(/Cantrips/.test(today) && /Guidance/.test(today), "Today shows cantrips incl. Guidance");
ok((today.match(/castbtn/g) || []).length >= 5, "cast buttons present for slots + font");

console.log("\n# cast tracking + new day");
const fontRank = ev("state.prepared.divineFont.fontRank");
w.doCast("font:" + fontRank + ":0", 4);
ok(ev("state.cast['font:" + fontRank + ":0']") === 1, "casting a font slot increments spent");
w.newDay();
ok(ev("Object.keys(state.cast).length") === 0, "new day resets spent casts");

console.log("\n# Browse search");
w.go("browse");
ok(d.getElementById("browseTitle").textContent.includes("Divine"), "browse titled Divine");
d.getElementById("search").value = "heal";
w.renderBrowse();
ok(/browse-row/.test(d.getElementById("browseList").innerHTML), "search 'heal' renders compact rows");
ok(!/class="card /.test(d.getElementById("browseList").innerHTML), "full cards not rendered until expanded (perf)");
w.toggleBrowse("heal", d.querySelector(".browse-row-head"));
ok(/class="card /.test(d.getElementById("bc_heal").innerHTML), "tapping a row expands the full card");

console.log("\n# persistence round-trip");
const saved = JSON.parse(w.localStorage.getItem("pf2eSpellbook.v3"));
ok(saved && saved.characters[saved.activeId].classId === "cleric", "state persisted to localStorage (v3 library)");

console.log("\n# switch to Wizard (arcane)");
w.chooseClass("wizard");
ok(ev("state.classId") === "wizard", "switched to wizard");
ok(w.activeClass().keyAbility === "Intelligence", "wizard key ability = Int");
const arcane = w.classSpells();
ok(arcane.every(s => s.traditions.includes("arcane")), "wizard list is arcane");
ok(arcane.some(s => s.slug === "fireball"), "Fireball available to wizard");
ok(!w.hasFeature("divineFont"), "wizard has no Divine Font");
ok(w.findSpell("heal").traditions.includes("arcane") === false, "Heal is not on the arcane list");

console.log("\n# WIZARD: extra school slots + Drain Bonded Item");
w.chooseClass("wizard");
ev("state.level=5");
w.go("prepare");
ok(d.querySelectorAll(".extraSel").length === Object.keys(w.classSlots(5)).length,
   `one 🎓 school slot per rank (${d.querySelectorAll(".extraSel").length})`);
[...d.querySelectorAll(".cantripSel")].forEach((s,i)=>{ const o=[...s.options].find(o=>o.value); if(o)s.value=o.value; });
[...d.querySelectorAll(".slotSel")].forEach(sel=>{ const r=+sel.dataset.rank; const o=[...sel.options].find(o=>o.value&&w.findSpell(o.value).rank<=r); if(o)sel.value=o.value; });
[...d.querySelectorAll(".extraSel")].forEach(sel=>{ const r=+sel.dataset.rank; const o=[...sel.options].find(o=>o.value&&w.findSpell(o.value).rank<=r); if(o)sel.value=o.value; });
w.savePrep();
ok(ev("state.prepared.extra.school && Object.keys(state.prepared.extra.school).length") >= 3, "school slots saved per rank");
const wToday = d.getElementById("todayContent").innerHTML;
ok(/Drain Bonded Item/.test(wToday), "Today shows Drain Bonded Item resource");
ok(/slottag/.test(wToday), "Today tags the 🎓 school slot");
w.doCast("resource:bonded", 1);
ok(ev("state.cast['resource:bonded']") === 1, "Drain Bonded Item tracks a use");

console.log("\n# WITCH: patron sets tradition");
w.chooseClass("witch");
ok(w.activeClass().keyAbility === "Intelligence", "witch key ability = Int");
w.setPatronTradition("primal");
ok(w.classSpells().every(s => s.traditions.includes("primal")), "witch list follows patron tradition (primal)");
w.setPatronTradition("occult");
ok(w.classSpells().some(s => s.slug === "phantom-pain") || w.classSpells().every(s=>s.traditions.includes("occult")), "patron tradition switches list to occult");

console.log("\n# SORCERER: bloodline tradition + spontaneous repertoire");
w.chooseClass("sorcerer");
ev("state.level=5; state.keyMod=4;");
ok(w.isSpontaneous(), "sorcerer is spontaneous");
w.setBloodline("draconic");
ok(w.activeTradition() === "arcane", "draconic bloodline -> arcane");
w.setBloodline("fey");
ok(w.activeTradition() === "primal", "fey bloodline -> primal");
w.setBloodline("angelic");
ok(w.activeTradition() === "divine", "angelic bloodline -> divine");
w.go("prepare");
ok(d.querySelectorAll("[data-reprank]").length >= 3, "repertoire groups rendered per rank (no fixed slot pickers)");
ok(d.querySelectorAll(".slotSel").length === 0, "spontaneous has no prepared slot pickers");
// fill cantrips
[...d.querySelectorAll(".cantripSel")].forEach((s)=>{ const o=[...s.options].find(o=>o.value); if(o)s.value=o.value; });
// add a known spell to each rank; mark the rank-1 spell as signature
[...d.querySelectorAll('[data-reprank]')].forEach(group=>{
  const r = +group.dataset.reprank;
  const sel = group.querySelector(".repSel");
  const o = [...sel.options].find(o=>o.value && w.findSpell(o.value).rank <= r);
  if(o) sel.value = o.value;
  if(r===1){ const star=group.querySelector(".sigstar"); w.toggleSig(star); }
});
w.savePrep();
ok(ev("state.prepared.type") === "spontaneous", "saved a spontaneous repertoire");
ok(ev("Object.keys(state.prepared.repertoire).length") >= 3, "repertoire has spells across ranks");
ok(ev("state.prepared.repertoire['1'][0].sig") === true, "rank-1 spell flagged signature");

console.log("\n# SORCERER Cast Today: shared rank pools + signature heighten");
const sToday = d.getElementById("todayContent").innerHTML;
ok(/slots? left/.test(sToday), "Today shows per-rank slot pools");
ok(/heightened to rank/.test(sToday), "signature spell appears heightened in a higher pool");
const slots5 = w.classSlots(5);
const topRank = Math.max(...Object.keys(slots5).map(Number));
w.castPool(topRank, slots5[topRank]);
ok(ev(`state.cast['pool:${topRank}']`) === 1, "casting from a rank pool decrements it");
w.uncastPool(topRank);
ok(ev(`state.cast['pool:${topRank}']`) === 0, "undo refunds a pool slot");

console.log("\n# BARD / ORACLE fixed traditions");
w.chooseClass("bard");
ok(w.activeTradition() === "occult" && w.isSpontaneous(), "bard = occult spontaneous");
w.chooseClass("oracle");
ok(w.activeTradition() === "divine" && w.isSpontaneous(), "oracle = divine spontaneous");

console.log("\n# FOCUS SPELLS: Druid (pool + cast + refocus)");
w.chooseClass("druid");
ev("state.level=5");
ok(w.hasFocus(), "druid has focus spells");
ok(w.classFocusSpells().some(s => s.slug === "heal-animal"), "Heal Animal in druid focus list");
ok(w.focusRank() === 3, "focus rank at L5 = 3 (ceil 5/2)");
w.go("prepare");
ok(!!d.getElementById("inFocusPool"), "focus pool selector rendered in Prepare");
ok(d.querySelectorAll(".focusChk").length >= 1, "focus checklist rendered");
w.setFocusPool(2);
[...d.querySelectorAll(".cantripSel")].forEach(s=>{ const o=[...s.options].find(o=>o.value); if(o)s.value=o.value; });
[...d.querySelectorAll(".slotSel")].forEach(sel=>{ const r=+sel.dataset.rank; const o=[...sel.options].find(o=>o.value&&w.findSpell(o.value).rank<=r); if(o)sel.value=o.value; });
d.querySelector('.focusChk[value="heal-animal"]').checked = true;
d.querySelector('.focusChk[value="tempest-surge"]').checked = true;
w.savePrep();
ok(ev("state.prepared.focus.pool") === 2, "focus pool saved (2)");
ok(ev("state.prepared.focus.spells.length") === 2, "two focus spells saved");
const dToday = d.getElementById("todayContent").innerHTML;
ok(/Focus spells/.test(dToday) && /2\/2 points/.test(dToday), "Today shows focus pool 2/2");
ok(/heightened to rank 3/.test(dToday), "focus spell shows heighten to rank 3");
w.castFocus(2);
ok(ev("state.cast['focuspool']") === 1, "casting a focus spell spends a point");
w.castFocus(2); w.castFocus(2);
ok(ev("state.cast['focuspool']") === 2, "focus points cap at pool size");
w.refocus();
ok(ev("state.cast['focuspool']") === 0, "refocus restores all focus points");

console.log("\n# FOCUS CANTRIP: Bard composition is at-will");
w.chooseClass("bard");
ev("state.level=3");
ok(w.findSpell("courageous-anthem").focus === true && w.findSpell("courageous-anthem").rank === 0, "Courageous Anthem is a focus cantrip");
w.go("prepare");
[...d.querySelectorAll(".cantripSel")].forEach(s=>{ const o=[...s.options].find(o=>o.value); if(o)s.value=o.value; });
d.querySelector('.focusChk[value="courageous-anthem"]').checked = true;
w.savePrep();
ok(/at will/.test(d.getElementById("todayContent").innerHTML), "focus cantrip shows ∞ at will (no point cost)");

console.log("\n# BROWSE: focus chip");
w.chooseClass("druid");
w.go("browse");
w.setBrowseRank("focus");
ok(d.getElementById("browseTitle").textContent.includes("focus"), "browse focus mode titled focus spells");
ok(/browse-row/.test(d.getElementById("browseList").innerHTML), "focus browse renders rows");

console.log("\n# MULTI-CHARACTER + export / import");
const before = ev("Object.keys(library.characters).length");
w.newCharacter();
ok(ev("Object.keys(library.characters).length") === before + 1, "new character added to library");
ok(ev("state.classId") === null, "new character starts with no class");
ok(!d.getElementById("view-classpick").classList.contains("hide"), "new character opens the class picker");
w.chooseClass("wizard");
ev("state.name='Mordteero'; state.level=8;");
w.openMenu();
ok(/Mordteero/.test(d.getElementById("menuList").innerHTML), "menu lists the new character by name");
ok((d.getElementById("menuList").innerHTML.match(/classcard/g) || []).length >= 2, "menu shows multiple characters");
w.exportCharacter();
const code = d.getElementById("menuIO").value;
ok(code.startsWith("PF2E1:"), "export produces a PF2E1 code");

const ids = ev("Object.keys(library.characters)");
const firstId = ids[0];
w.switchCharacter(firstId);
ok(ev("state.id") === firstId, "switched to a different character");
ok(ev("state.name") !== "Mordteero", "active character actually changed");

const n1 = ev("Object.keys(library.characters).length");
w.openMenu();
d.getElementById("menuIO").value = code;
w.importCharacter();
ok(ev("Object.keys(library.characters).length") === n1 + 1, "import adds a new character");
ok(ev("state.name") === "Mordteero" && ev("state.classId") === "wizard" && ev("state.level") === 8,
   "imported character loaded faithfully (wizard Mordteero L8)");

const delId = ev("state.id");
w.openMenu();
const n2 = ev("Object.keys(library.characters).length");
w.deleteCharacter(delId);
ok(ev("Object.keys(library.characters).length") === n2 - 1, "delete removes a character");
ok(ev("state.id") !== delId, "active moves off the deleted character");

console.log("\n# v2 -> v3 migration");
{
  const dom2 = new JSDOM(html, { runScripts:"dangerously", virtualConsole: new VirtualConsole(),
    url:"https://migrate.example/", beforeParse(win){ win.scrollTo=()=>{}; win.confirm=()=>true;
      win.localStorage.setItem("pf2eSpellbook.v2", JSON.stringify({classId:"oracle",name:"Old Seer",level:6,keyMod:4})); } });
  const w2=dom2.window;
  ok(w2.eval("Object.keys(library.characters).length") === 1, "v2 save migrates to one v3 character");
  ok(w2.eval("state.classId") === "oracle" && w2.eval("state.name") === "Old Seer", "migrated character keeps class & name");
}

console.log("\n# MAGUS (arcane half-caster, Int)");
w.chooseClass("magus");
ok(w.activeTradition() === "arcane" && w.activeClass().keyAbility === "Intelligence", "magus = arcane, Int spell DC");
ok(w.activeClass().casting === "prepared", "magus is prepared");
const magusSlots = { 1:"{\"1\":1}", 4:"{\"1\":2,\"2\":2}", 5:"{\"2\":2,\"3\":2}", 17:"{\"8\":2,\"9\":2}", 20:"{\"8\":2,\"9\":2}" };
for (const [lvl, exp] of Object.entries(magusSlots)) {
  ok(JSON.stringify(w.classSlots(+lvl)) === exp, `magus slots L${lvl} = ${exp} (got ${JSON.stringify(w.classSlots(+lvl))})`);
}
ev("state.level=8; state.keyMod=4;"); const dc8 = w.spellDC();
ev("state.level=9;"); const dc9 = w.spellDC();
ok(dc8 === 24 && dc9 === 27, `magus DC jumps at L9 expert (L8=${dc8}->24, L9=${dc9}->27)`);
ok(w.hasFocus() && w.classFocusSpells().length > 0, "magus has conflux focus spells");

console.log("\n# SUMMONER (spontaneous half-caster, eidolon tradition)");
w.chooseClass("summoner");
ok(w.isSpontaneous() && w.activeClass().keyAbility === "Charisma", "summoner = spontaneous, Cha");
w.setPatronTradition("primal");
ok(w.activeTradition() === "primal", "eidolon tradition picker sets tradition (primal)");
ok(JSON.stringify(w.classSlots(7)) === "{\"3\":2,\"4\":2}", "summoner shares the partial slot table");
ok(w.hasFocus() && w.classFocusSpells().length > 0, "summoner has evolution focus spells");
w.go("prepare");
ok(!!d.querySelector("#inPatron") && /Eidolon/.test(d.getElementById("charExtra").textContent), "summoner shows the Eidolon's-tradition picker");
// regression: a partial caster's shed low ranks must not render phantom "known" rows (repertoire == slots)
ev("state.level=7"); w.go("prepare");
const sumRepGroups = [...d.querySelectorAll("[data-reprank]")];
const sumRepRows = d.querySelectorAll(".repSel").length;
ok(sumRepGroups.length === 2, `summoner L7 repertoire shows only its 2 slotted ranks (got ${sumRepGroups.length})`);
ok(sumRepRows === 4, `summoner L7 repertoire rows == its 4 slots, no phantom low ranks (got ${sumRepRows})`);
ok(sumRepGroups.every(g => +g.dataset.reprank >= 3), "summoner L7 repertoire has no rank-1/2 phantom groups");

console.log("\n# PSYCHIC (occult spontaneous, 2 slots/rank, full prof)");
w.chooseClass("psychic");
ok(w.activeTradition() === "occult" && w.isSpontaneous(), "psychic = occult spontaneous");
const psySlots = { 1:"{\"1\":1}", 4:"{\"1\":2,\"2\":2}", 5:"{\"1\":2,\"2\":2,\"3\":1}" };
for (const [lvl, exp] of Object.entries(psySlots)) {
  ok(JSON.stringify(w.classSlots(+lvl)) === exp, `psychic slots L${lvl} = ${exp} (got ${JSON.stringify(w.classSlots(+lvl))})`);
}
ok(w.classSlots(19)[10] === 1 && w.classSlots(20)[10] === 1, "psychic reaches 10th rank (1 slot) at L19-20");
ev("state.level=19; state.keyMod=5;");
ok(w.spellDC() === 42, `psychic L19 DC = 42 (legendary; got ${w.spellDC()})`);
ok(w.hasFocus() && w.classFocusSpells().some(s => s.slug === "imaginary-weapon"), "psychic surfaces psi cantrips in the focus section (e.g. Imaginary Weapon)");

console.log("\n# ANIMIST (divine prepared full caster + apparitions)");
ok(ev('CLASS_ORDER.includes("animist")') && !!ev('CLASSES.animist'), "animist registered in the class picker");
w.chooseClass("animist");
ok(!w.isSpontaneous() && w.activeClass().keyAbility === "Wisdom", "animist = prepared, Wisdom");
ok(w.activeTradition() === "divine", "animist casts the divine tradition");
ok(w.classSlots(1)[1] === 2 && w.classSlots(19)[10] === 1, "animist uses the full-caster slot table (2× rank 1 at L1; 10th rank at L19)");
ev("state.level=19; state.keyMod=5;");
ok(w.spellDC() === 42, `animist L19 DC = 42 (legendary full caster; got ${w.spellDC()})`);
ok(w.hasFocus() && w.classFocusSpells().length > 0, `animist surfaces vessel/apparition focus spells (${w.classFocusSpells().length})`);
ev("state.level=5"); w.go("prepare");
ok(d.querySelectorAll(".slotSel").length > 0 && d.querySelectorAll(".repSel").length === 0, "animist prepares into slots, not a repertoire");

console.log("\n# class picker now lists all 11");
ok(ev("CLASS_ORDER.length") === 11, "class picker offers all 11 classes");

console.log("\n# LEGACY / REMASTER compatibility");
// every spell has a legacy array; aliases resolve to real spells
ok(ev("SPELLS.every(s => Array.isArray(s.legacy))"), "every spell has a legacy-names array");
ok(ev("Object.keys(LEGACY_ALIASES).every(slug => !!SPELL_BY_SLUG[slug])"), "every legacy alias points at a real spell");
ok(w.findSpell("force-barrage").legacy.includes("Magic Missile"), "Force Barrage knows its legacy name (Magic Missile)");
ok(w.findSpell("holy-light").legacy.includes("Searing Light"), "Holy Light knows it was Searing Light");
// auto-extraction from curated descriptions, independent of the manual map
ok(JSON.stringify(w.extractLegacyNames("Foo bar. (Remaster of Sound Burst)")) === JSON.stringify(["Sound Burst"]),
   "extracts a (Remaster of X) note from description text");
ok(JSON.stringify(w.extractLegacyNames("(Remaster of Faerie Fire/Glitterdust)")) === JSON.stringify(["Faerie Fire","Glitterdust"]),
   "extracts and splits multiple legacy names");
// search by legacy name finds the remaster spell, per tradition
w.chooseClass("wizard"); w.go("browse"); w.setBrowseRank("all");
d.getElementById("search").value = "magic missile"; w.renderBrowse();
ok(/Force Barrage/.test(d.getElementById("browseList").innerHTML), "wizard: searching 'Magic Missile' finds Force Barrage");
ok(/formerly/.test(d.getElementById("browseList").innerHTML), "browse shows a 'formerly …' note");
w.chooseClass("cleric"); w.go("browse"); w.setBrowseRank("all");
d.getElementById("search").value = "searing light"; w.renderBrowse();
ok(/Holy Light/.test(d.getElementById("browseList").innerHTML), "cleric: searching 'Searing Light' finds Holy Light");
d.getElementById("search").value = "comprehend languages"; w.renderBrowse();
ok(/Translate/.test(d.getElementById("browseList").innerHTML), "searching legacy 'Comprehend Languages' finds Translate");

console.log("\n# action glyph rendering");
ok(w.actionLabel("2") === "◆◆ 2 actions", "single action glyph");
ok(w.actionLabel("1 to 3").startsWith("◆–◆◆◆"), "1-to-3 action range glyph");
ok(w.actionLabel("1 or 2").startsWith("◆–◆◆"), "'1 or 2' renders as a glyph range");
ok(w.actionLabel("reaction") === "⤳ Reaction", "reaction glyph");
ok(w.actionLabel("10 minutes") === "🕑 10 minutes", "long casts show a clock");

console.log("\n# in-app data integrity guard");
ok(ev("new Set(SPELLS.map(s=>s.slug)).size === SPELLS.length"), "all spell slugs unique (no findSpell collisions)");
ok(ev("SPELLS.filter(s=>!s.focus && !s.ritual && (!s.traditions||!s.traditions.length)).length === 0"), "no castable (non-focus, non-ritual) spell is orphaned from every tradition");
ok(ev("SPELLS.every(s=>typeof s.description==='string' && s.description.length>0)"), "every spell has a non-empty description");
ok(ev("SPELLS.every(s=>s.rank>=0 && s.rank<=10)"), "every spell rank is 0–10");
["arcane","divine","occult","primal"].forEach(t=>{
  ok(ev(`SPELLS.filter(s=>!s.focus && s.traditions.includes('${t}')).length > 100`), `${t} list is populated`);
});


console.log("\n# COMPUTED HEIGHTENING (#1)");
ok(w.addDice("6d6","2d6",2) === "10d6", "addDice scales dice count (6d6 +2x2d6 = 10d6)");
ok(w.addDice("1d8","1d8",2) === "3d8", "addDice heal scaling");
ok(w.addDice("1d6+3","1d6",2) === "3d6+3", "addDice preserves flat modifier");
ok(w.addDice("1d8","1d6",2) === null, "addDice refuses mixed die sizes");
{
  const fb = w.findSpell("fireball");
  const sd = w.scaleDamage(fb, 5);
  ok(sd && sd[0].formula === "10d6" && sd[0].type === "fire", "Fireball at rank 5 -> 10d6 fire");
  ok(w.scaleDamage(fb, 3)[0].formula === "6d6", "Fireball at base rank 3 -> 6d6");
  ok(/10d6 fire/.test(w.damageChipHTML(fb, 5)), "damage chip shows scaled dice");
}
ok(w.damageChipHTML(w.findSpell("bless"), 5) === "", "non-damage spell shows no damage chip");
w.chooseClass("cleric"); ev("state.level=3"); w.go("prepare");
[...d.querySelectorAll(".slotSel")].forEach(sel=>{ if(sel.dataset.rank==="2"){ sel.value="heal"; } else { const o=[...sel.options].find(o=>o.value); if(o) sel.value=o.value; } });
[...d.querySelectorAll(".cantripSel")].forEach(s=>{ const o=[...s.options].find(o=>o.value); if(o) s.value=o.value; });
w.savePrep();
ok(/✚ 2d8/.test(d.getElementById("todayContent").innerHTML), "Heal slotted at rank 2 shows ✚ 2d8 on Cast Today");


console.log("\n# SUSTAINED TRACKER (#2)");
w.chooseClass("cleric"); ev("state.level=5");
const sus = w.classSpells().find(s=>s.sustained && s.rank>=1 && s.rank<=2);
ok(!!sus, "found a sustained spell to test (" + (sus && sus.name) + ")");
w.go("prepare");
[...d.querySelectorAll(".slotSel")].forEach(sel=>{ const r=+sel.dataset.rank; if(r===sus.rank){ sel.value=sus.slug; } else { const o=[...sel.options].find(o=>o.value); if(o) sel.value=o.value; } });
[...d.querySelectorAll(".cantripSel")].forEach(x=>{ const o=[...x.options].find(o=>o.value); if(o) x.value=o.value; });
w.savePrep();
ok(/⏳ Sustain/.test(d.getElementById("todayContent").innerHTML), "sustained spell shows a Sustain button on Cast Today");
w.startSustain(sus.slug);
ok((ev("state.sustaining")||[]).includes(sus.slug), "startSustain adds the spell to the tracker");
ok(/Sustaining now/.test(d.getElementById("todayContent").innerHTML), "Sustaining-now bar appears");
w.endSustain(sus.slug);
ok(!(ev("state.sustaining")||[]).includes(sus.slug), "endSustain removes it");
w.startSustain(sus.slug); w.newDay();
ok((ev("state.sustaining")||[]).length === 0, "new day clears the sustained list");


console.log("\n# BROWSE FILTERS (#3)");
w.chooseClass("wizard"); w.go("browse"); w.setBrowseRank("all");
d.getElementById("search").value = "";
w.toggleBrowseFilters();
ok(!d.getElementById("browseFilters").classList.contains("hide"), "filters panel opens");
const browseCount = () => (d.getElementById("browseList").innerHTML.match(/browse-row rank/g) || []).length;
w.setBrowseSave("all"); w.setBrowseAction("all"); w.setBrowseTrait("");
const allN = browseCount();
w.setBrowseSave("will");
const willN = browseCount();
const expWill = w.classSpells().filter(s=>s.save && s.save.toLowerCase().includes("will")).length;
ok(willN > 0 && willN < allN, `Will-save filter narrows results (${willN} of ${allN})`);
ok(willN === expWill, `Will filter exact (${willN} === ${expWill})`);
w.setBrowseSave("none");
ok(browseCount() === w.classSpells().filter(s=>!s.save).length, "No-save filter exact");
w.setBrowseSave("all"); w.setBrowseAction("reaction");
const expReact = w.classSpells().filter(s=>w.actionMatch(s.actions,"reaction")).length;
ok(browseCount() === expReact && expReact > 0, "reaction filter matches reactions");
w.setBrowseAction("all"); w.setBrowseTrait("fire");
const fireN = browseCount();
ok(fireN > 0 && fireN < allN && fireN === w.classSpells().filter(s=>s.traits.some(t=>t.includes("fire"))).length, "trait filter 'fire' exact");
w.setBrowseTrait("");
ok(w.actionMatch("1 to 3","2") === true && w.actionMatch("1","2") === false, "actionMatch handles action ranges");


console.log("\n# CLERIC DOCTRINE (#9)");
w.chooseClass("cleric"); ev("state.level=9; state.keyMod=4;");
ev("state.doctrine='cloistered'"); const dcCl=w.spellDC();
ev("state.doctrine='warpriest'"); const dcWar=w.spellDC();
ok(dcCl===27 && dcWar===25, `doctrine changes L9 DC (cloistered ${dcCl}/27, warpriest ${dcWar}/25)`);
w.go("prepare");
ok(!!d.getElementById("inDoctrine"), "doctrine selector shown for cleric");
w.chooseClass("wizard"); w.go("prepare");
ok(!d.getElementById("inDoctrine"), "no doctrine selector for non-cleric");

console.log("\n# DATA STAMP (#5)");
ok(ev("typeof GENERATED_META")==="object" && ev("GENERATED_META.count")>1700, "GENERATED_META present with count");
ok(/Spell data \d{4}-\d\d-\d\d/.test(w.dataStampText()), "data stamp text is formatted");
w.openMenu();
ok(/Spell data/.test(d.getElementById("dataStamp").textContent), "menu shows the data stamp");

console.log("\n# ZOOM (#6)");
ok(!/user-scalable=no/.test(html) && !/maximum-scale/.test(html), "viewport allows pinch-zoom");

console.log("\n# A11Y + STORAGE (#7)");
w.chooseClass("sorcerer"); w.go("prepare");
const pd = d.getElementById("prepDynamic").innerHTML;
ok(/aria-label="toggle signature spell"/.test(pd), "signature buttons have aria-labels");
ok(/aria-label="remove spell"/.test(pd), "remove buttons have aria-labels");
ok(d.querySelector(".menubtn").getAttribute("aria-label")?.length>0, "header menu button has an aria-label");
{
  const proto=Object.getPrototypeOf(w.localStorage); const orig=proto.setItem; let patched=true;
  try{ proto.setItem=function(){ throw new Error("quota"); }; }catch(e){ patched=false; }
  if(patched){ let threw=false; try{ w.saveState(); }catch(e){ threw=true; } proto.setItem=orig; ok(!threw,"saveState swallows storage errors (no crash when full)"); }
  else ok(true,"storage patch unavailable (skipped)");
}


console.log("\n# FOCUS CHECKLIST + FILTER (#8)");
w.chooseClass("cleric"); ev("state.level=5"); w.go("prepare");
const focusTotal = d.querySelectorAll("#focusChecklist .fcheck").length;
ok(focusTotal > 50, `cleric focus checklist shows many domain spells (${focusTotal})`);
w.filterFocusChecklist("death");
const focusShown = [...d.querySelectorAll("#focusChecklist .fcheck")].filter(el=>!el.classList.contains("hide")).length;
ok(focusShown > 0 && focusShown < focusTotal, `filtering 'death' narrows the checklist (${focusShown} of ${focusTotal})`);
w.filterFocusChecklist("");
ok([...d.querySelectorAll("#focusChecklist .fcheck")].every(el=>!el.classList.contains("hide")), "clearing the filter shows all again");


console.log("\n# RITUALS BROWSER + INSTALL (#10)");
w.chooseClass("wizard"); w.go("browse");
ok(/📜 Rituals/.test(d.getElementById("rankChips").innerHTML), "Rituals chip present in Browse");
w.setBrowseRank("rituals");
d.getElementById("search").value=""; w.setBrowseSave("all"); w.setBrowseAction("all"); w.setBrowseTrait(""); w.renderBrowse();
ok(d.getElementById("browseTitle").textContent.includes("Ritual"), "browse titled Rituals");
const ritN=(d.getElementById("browseList").innerHTML.match(/browse-row rank/g)||[]).length;
ok(ritN>100, `rituals listed (${ritN})`);
{
  const m=d.getElementById("browseList").innerHTML.match(/toggleBrowse\('([^']+)'/);
  const slug=m[1]; w.toggleBrowse(slug, d.querySelector(".browse-row-head"));
  ok(/ritualtag/.test(d.getElementById("bc_"+slug).innerHTML), "expanded ritual shows a Ritual tag");
}
w.setBrowseRank("all"); w.renderBrowse();
ok(!ev("classSpells().some(s=>s.ritual)"), "rituals excluded from normal class spell lists");

console.log("\n# PWA / OFFLINE (#18/#19)");
ok(typeof w.setupInstall === "function", "install setup function present");
ok(typeof w.downloadOffline === "function", "downloadOffline() present");
ok(typeof w.installApp === "function", "installApp() present");
ok(/rel="manifest"/.test(html), "manifest link in head (hosted PWA)");
ok(/rel="apple-touch-icon"/.test(html), "apple-touch-icon link in head");
// menu offline section + controls
w.openMenu();
ok(/Save offline copy/.test(d.getElementById("view-menu").innerHTML), "menu has a Save-offline button");
ok(!!d.getElementById("installBtn"), "install button present in menu");
ok(d.getElementById("installBtn").style.display === "none", "install button hidden until installable");
ok(/on this device only/i.test(d.getElementById("view-menu").innerHTML), "menu reassures data stays on-device");
// downloadOffline builds a Blob anchor and clicks without throwing (DOM-only path)
{
  let clicked = false, downloadName = "";
  const realCreate = d.createElement.bind(d);
  d.createElement = (tag) => {
    const el = realCreate(tag);
    if (tag === "a") { const c = el.click.bind(el); el.click = () => { clicked = true; downloadName = el.download; c && 0; }; }
    return el;
  };
  if (!w.URL.createObjectURL) w.URL.createObjectURL = () => "blob:test";
  if (!w.URL.revokeObjectURL) w.URL.revokeObjectURL = () => {};
  const realFetch = w.fetch; w.fetch = undefined;     // force the DOM-serialise fallback
  w.downloadOffline();
  w.fetch = realFetch; d.createElement = realCreate;
  ok(clicked, "downloadOffline() triggers a file download");
  ok(downloadName === "pf2e-spellbook.html", "download named pf2e-spellbook.html");
}
// installApp with no captured prompt falls back to an instructional alert (no throw)
{
  const realAlert = w.alert; let alerted = false;
  w.alert = () => { alerted = true; };
  w.installApp();
  w.alert = realAlert;
  ok(alerted, "installApp() explains manual install when no prompt is available");
}

console.log(`\n# RESULT: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
