/* ============================================================
   CLASS CONFIG + shared caster tables
   Each class is data the engine consumes; adding a class is a
   config edit, not an engine change.
   ============================================================ */

/* Slots-per-rank by character level for a FULL caster (Cleric, Wizard,
   Druid, Witch, Sorcerer, Bard, Oracle). Cantrips are separate.
   Rank r unlocks at level (2r-1) with 2 slots, becomes 3 the next level,
   and rank 10 is only ever a single slot (levels 19-20). */
function fullCasterSlots(level){
  const slots={};
  const maxRank=Math.min(10, Math.ceil(level/2));
  for(let r=1;r<=maxRank;r++){
    const unlock=2*r-1;
    if(level<unlock) continue;
    if(r===10) slots[r]=1;
    else if(level===unlock) slots[r]=2;
    else slots[r]=3;
  }
  return slots;
}

/* Partial caster (Magus, Summoner): ~4 slots concentrated in the top two ranks,
   shedding lower ranks from L5; never reaches 10th rank. Verified vs. the AoN
   "Spells per Day" tables. */
function partialCasterSlots(level){
  if(level<=0) return {};
  if(level===1) return {1:1};
  if(level===2) return {1:2};
  if(level===3) return {1:2,2:1};
  if(level===4) return {1:2,2:2};
  const H=Math.min(9, Math.floor((level+1)/2)); // highest rank, capped at 9th
  const slots={};
  if(H-1>=1) slots[H-1]=2;
  slots[H]=2;
  return slots;
}

/* Psychic: full rank progression but only 2 slots per rank (a newly-gained rank
   starts at 1), reaching 10th rank (1 slot) at level 19. */
function psychicSlots(level){
  const slots={};
  const maxRank=Math.min(10, Math.ceil(level/2));
  for(let r=1;r<=maxRank;r++){
    const unlock=2*r-1;
    if(level<unlock) continue;
    if(r===10) slots[r]=1;
    else if(level===unlock) slots[r]=1;
    else slots[r]=2;
  }
  return slots;
}

/* ============================================================
   INLINE SVG ICON REGISTRY
   Thin line icons (24x24, stroke = currentColor) so they inherit the
   active accent colour. Keyed by name; classes/features reference a key
   instead of an emoji. iconSvg() wraps the path data in an <svg>.
   ============================================================ */
const ICONS={
  /* classes */
  cleric:'<circle cx="12" cy="12" r="3.4"/><path d="M12 3v2.6M12 18.4V21M3 12h2.6M18.4 12H21M5.6 5.6l1.9 1.9M16.5 16.5l1.9 1.9M18.4 5.6l-1.9 1.9M7.5 16.5l-1.9 1.9"/>',
  wizard:'<path d="M12 3.5 4.5 19.5h15z"/><circle cx="12" cy="13.5" r="1.9"/>',
  druid:'<path d="M5 19.5C5 11 10.5 5 19 4.5 19 13 13.5 19 5 19.5z"/><path d="M11.5 12 5 19.5"/>',
  witch:'<path d="M17.5 15.2A6 6 0 1 1 11.3 5a5 5 0 0 0 6.2 10.2z"/><path d="M18.3 3.6l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z"/>',
  sorcerer:'<path d="M12 3c2.8 3.6 4.6 5.6 4.6 8.4a4.6 4.6 0 0 1-9.2 0c0-1.2.6-2.2 1.6-3.1.3 1.1 1 1.6 1.6 1.6C9.4 8.4 10.3 5.7 12 3z"/>',
  bard:'<path d="M9.5 17.5V6.2l9-2v9.6"/><circle cx="6.8" cy="17.5" r="2.4"/><circle cx="15.8" cy="15.8" r="2.4"/>',
  oracle:'<path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.4"/>',
  magus:'<path d="M17.5 3.5 20.5 6.5 12 15l-3 1 1-3z"/><path d="M8 14l-4 4"/><path d="M5.5 15.5l3 3"/>',
  summoner:'<circle cx="9.2" cy="12" r="4.8"/><circle cx="14.8" cy="12" r="4.8"/>',
  psychic:'<path d="M12 12a1.5 1.5 0 1 0 1.6-1.5A3.6 3.6 0 1 0 8.4 12 5.7 5.7 0 1 0 17.7 7.7"/>',
  animist:'<path d="M12 3c2 2.5 3.1 4 3.1 6a3.1 3.1 0 0 1-6.2 0c0-1 .5-2 1.5-2.9.3.8.8 1.2 1.3 1.2C11 6 11 5 12 3z"/><path d="M12 12v6"/><path d="M9 21h6"/>',
  /* navigation */
  today:'<rect x="7" y="3.5" width="12.5" height="17" rx="2"/><path d="M4.5 7v11.5a2 2 0 0 0 2 2h9.5"/>',
  prepare:'<path d="M3 18.5h18"/><path d="M6.5 18.5a5.5 5.5 0 0 1 11 0"/><path d="M12 3v3M4.2 8.7l1.7 1.7M19.8 8.7l-1.7 1.7"/>',
  browse:'<path d="M4 5.2A2 2 0 0 1 6 3.2h5.2v15.6H6a2 2 0 0 0-2 2z"/><path d="M20 5.2a2 2 0 0 0-2-2h-5.2v15.6H18a2 2 0 0 1 2 2z"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.4 9.4a2.6 2.6 0 1 1 3.6 2.4c-.9.5-1.1 1-1.1 1.9"/><path d="M12 16.7v.01"/>',
  /* features / utility */
  school:'<path d="M2.5 8.5 12 4.5l9.5 4-9.5 4z"/><path d="M6.5 10.5v4c0 1.5 11 1.5 11 0v-4"/><path d="M21.5 8.5v5"/>',
  bonded:'<path d="M9.3 12.4a3 3 0 0 1 0-4.2l1.9-1.9a3 3 0 0 1 4.2 4.2l-1 1"/><path d="M14.7 11.6a3 3 0 0 1 0 4.2l-1.9 1.9a3 3 0 0 1-4.2-4.2l1-1"/>',
  heal:'<path d="M12 5.5v13M5.5 12h13"/>',
  harm:'<path d="M12 3a7 7 0 0 0-7 7c0 2 1 3.6 2.2 4.6V17a1 1 0 0 0 1 1h7.6a1 1 0 0 0 1-1v-2.4C19 13.6 20 12 20 10a7 7 0 0 0-7-7z" transform="translate(-1 0)"/><circle cx="8.5" cy="10.5" r="1.1"/><circle cx="13.5" cy="10.5" r="1.1"/><path d="M9 18v2M11 18v2M13 18v2"/>',
  menu:'<circle cx="12" cy="8" r="3.4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',
  filter:'<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="8" cy="17" r="2"/>',
  plus:'<path d="M12 5.5v13M5.5 12h13"/>',
  book:'<path d="M12 6.5C9.5 4.7 6 4.7 3.5 6v13c2.5-1.3 6-1.3 8.5.5 2.5-1.8 6-1.8 8.5-.5V6c-2.5-1.3-6-1.3-8.5.5z"/><path d="M12 6.5v13"/>',
};
function iconSvg(name, cls){
  return '<svg class="icn '+(cls||"")+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
    'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
    (ICONS[name]||"")+'</svg>';
}

/* [minLevel, proficiency bonus] for spell DC / spell attack, highest first.
   Bonus = 2/4/6/8 for trained/expert/master/legendary.
   Wizard, Druid, Sorcerer, Bard, Oracle, Psychic and the Cloistered Cleric
   doctrine all reach expert@7, master@15, legendary@19 (verified vs. Foundry). */
const FULL_CASTER_PROF=[[19,8],[15,6],[7,4],[1,2]];
/* Magus & Summoner: expert@9, master@17, no legendary (verified vs. Foundry). */
const PARTIAL_CASTER_PROF=[[17,6],[9,4],[1,2]];
/* Warpriest doctrine differs: expert@11, master@19 (no legendary). Kept here
   for when Cleric doctrine selection is added. */
const WARPRIEST_PROF=[[19,6],[11,4],[1,2]];

const TRADITION_LABEL={arcane:"Arcane",divine:"Divine",occult:"Occult",primal:"Primal"};

/* Sorcerer bloodlines -> magical tradition (Player Core). */
const BLOODLINES={
  aberrant:{label:"Aberrant",tradition:"occult"},
  angelic:{label:"Angelic",tradition:"divine"},
  demonic:{label:"Demonic",tradition:"divine"},
  diabolic:{label:"Diabolic",tradition:"divine"},
  draconic:{label:"Draconic",tradition:"arcane"},
  elemental:{label:"Elemental",tradition:"primal"},
  fey:{label:"Fey",tradition:"primal"},
  hag:{label:"Hag",tradition:"occult"},
  imperial:{label:"Imperial",tradition:"arcane"},
  undead:{label:"Undead",tradition:"divine"},
};

const CORE_HELP=[
  ["What do the numbers at the top mean?",
   "<b>Spell DC</b> is the number enemies must beat on a saving throw against your spells. <b>Spell attack</b> is what you add to a d20 when a spell says 'make a spell attack' (against the target's AC). Both come from your level + spellcasting proficiency + your key ability modifier — the app works them out for you."],
  ["Prepared vs. spontaneous casting",
   "<b>Prepared</b> casters (Cleric, Wizard, Druid, Witch) lock specific spells into their slots each morning — a slot can only cast the spell you put in it. <b>Spontaneous</b> casters (Sorcerer, Bard, Oracle) instead learn a <b>repertoire</b> and can cast any spell in it using a slot of the right rank. This app tracks whichever your class uses."],
  ["Spell slots & casting",
   "A <b>spell slot</b> is one casting. Prepared casters spend the slot they loaded a spell into; spontaneous casters spend any slot of the right rank on any repertoire spell of that rank. On <b>Cast Today</b>, tap <b>Cast</b> to spend a slot — it greys out so you always know what's left. <b>Rest &amp; reset</b> refreshes everything for a new day."],
  ["Cantrips",
   "<b>Cantrips</b> can be cast <b>as many times as you like</b>, all day, and automatically scale to your level so they never feel weak. Most casters prepare or know 5."],
  ["Heightening a spell",
   "Casting a spell in a higher-rank slot makes it stronger — that's <b>heightening</b>. Each spell card shows its <b>Heightened</b> line. Prepared casters drop a lower-rank spell into a higher slot; spontaneous casters can only heighten a spell that's one of their <b>signature spells</b>."],
  ["Signature spells (spontaneous only)",
   "A spontaneous caster's known spells are normally locked to the rank they learned. Mark a spell as a <b>signature spell</b> (the ★ in your repertoire) and you can cast it using any higher-rank slot to heighten it automatically. You typically pick one signature spell per spell rank."],
  ["Focus spells & Refocus",
   "<b>Focus spells</b> (domain, order, hex, composition, revelation, bloodline…) are cast using <b>Focus Points</b> from a small shared pool (max 3) and auto-heighten to half your level. Add the ones you know in <b>Prepare</b>, then spend points on <b>Cast Today</b>. Spend 10 minutes to <b>Refocus</b> and recover points between encounters. (Focus <i>cantrips</i>, like a bard's Courageous Anthem, are free and at-will.)"],
  ["Saving throws & degrees of success",
   "Many spells list a save like <b>Basic Fortitude</b>. 'Basic' means: Critical Success = no effect, Success = half, Failure = full, Critical Failure = double. Non-basic saves have their own listed effects. You crit by beating (or missing) the DC by 10+."],
  ["Remaster vs. legacy (original) rules",
   "This app uses the current <b>Remaster</b> spell names and rules. If your group still plays the <b>original</b> (pre-Remaster) edition, most spells are identical — and renamed ones show a small <i>“formerly …”</i> note, so you can also <b>search by the old name</b> (e.g. searching <b>Magic Missile</b> finds <b>Force Barrage</b>). A few legacy spells that weren't changed are still listed under their original names too.<br><br>A few wording changes to keep in mind: spell <b>rank</b> = spell <b>level</b>; <b>vitality</b>/<b>void</b> damage = the old <b>positive</b>/<b>negative</b>; and <b>holy</b>/<b>unholy</b> replace the old <b>good</b>/<b>evil</b> alignment damage. The numbers and effects are the same."],
  ["Multiple characters, backup & sharing",
   "Tap the <b>character</b> button (top right) to keep <b>several characters</b> and switch between them — each remembers its own prepared spells. From there you can also <b>Export</b> a character to a code to back it up or send to a friend, and <b>Import</b> a code someone shares with you. Everything is stored on your device."],
];

const CLASSES={
  /* ---------------- CLERIC ---------------- */
  cleric:{
    id:"cleric", name:"Cleric", icon:"cleric", color:"#d8a23a",
    tagline:"Divine prepared caster · the party's main healer",
    tradition:"divine", keyAbility:"Wisdom", keyAbilityShort:"Wis",
    casting:"prepared", slots:"full", prof:FULL_CASTER_PROF, cantrips:5,
    doctrines:{
      cloistered:{label:"Cloistered Cleric", prof:FULL_CASTER_PROF},
      warpriest:{label:"Warpriest", prof:WARPRIEST_PROF},
    },
    features:[{type:"divineFont", healSlug:"heal", harmSlug:"harm"}],
    help:[
      ["What does a cleric actually do?",
       "You're a divine spellcaster. Each morning you <b>Prepare</b> a set of spells, then cast them during the day. You also get <b>Divine Font</b> — a pile of free <b>Heal</b> (or Harm) spells — which makes you the party's main healer."],
      ["Divine Font (your free heals)",
       "At level 1 you chose a <b>Healing</b> or <b>Harmful Font</b>. It gives you extra casts of <b>Heal</b> (or Harm) each day equal to <b>1 + your Charisma modifier</b>, <b>separate</b> from your normal slots and always cast at your highest spell rank."],
      ["The three-action Heal (and Harm)",
       "<b>Heal</b>'s power changes with how many actions you spend:<br>◆ <b>1 action</b>: touch one creature.<br>◆◆ <b>2 actions</b>: heal at 30 ft <b>and</b> add a flat +8 HP.<br>◆◆◆ <b>3 actions</b>: heal everyone (and damage undead) in a 30-ft burst around you."],
      ["Doctrine & your spell DC",
       "Pick your <b>doctrine</b> in the character section. A <b>Cloistered Cleric</b>'s spell DC becomes expert at 7, master at 15, and legendary at 19; a <b>Warpriest</b>'s becomes expert at 11 and master at 19. The app adjusts your Spell DC and attack to match your choice. Levels 1–6 are identical either way."],
    ],
  },

  /* ---------------- WIZARD ---------------- */
  wizard:{
    id:"wizard", name:"Wizard", icon:"wizard", color:"#7b6cf0",
    tagline:"Arcane prepared caster · the widest spell list",
    tradition:"arcane", keyAbility:"Intelligence", keyAbilityShort:"Int",
    casting:"prepared", slots:"full", prof:FULL_CASTER_PROF, cantrips:5,
    preview:true,
    features:[
      {type:"extraSlots", key:"school", icon:"school", label:"Arcane school slot",
       note:"One extra slot of each rank you can cast, which must hold a spell from your chosen school / curriculum."},
      {type:"dailyResource", key:"bonded", icon:"bonded", label:"Drain Bonded Item", uses:1,
       note:"Once per day, recast a spell you already cast today without spending its slot."},
    ],
    help:[
      ["What does a wizard do?",
       "You're an <b>Arcane</b> prepared caster with the broadest spell list in the game. You Prepare spells each morning from your spellbook, leaning on control and damage like <b>Fireball</b> plus utility."],
      ["Arcane school slot",
       "Your school (curriculum) gives you <b>one extra prepared slot of every rank</b> you can cast. Fill the <b>school</b> slots with spells from your school. The app adds these slots automatically."],
      ["Drain Bonded Item",
       "Once per day you can <b>Drain your Bonded Item</b> to recast a spell you've already cast that day, without spending another slot. Tick the <b>Drain Bonded Item</b> tracker on Cast Today when you use it."],
    ],
  },

  /* ---------------- DRUID ---------------- */
  druid:{
    id:"druid", name:"Druid", icon:"druid", color:"#4faf6d",
    tagline:"Primal prepared caster · nature's versatility",
    tradition:"primal", keyAbility:"Wisdom", keyAbilityShort:"Wis",
    casting:"prepared", slots:"full", prof:FULL_CASTER_PROF, cantrips:5,
    preview:true,
    features:[{type:"note", title:"Druidic order", text:"Pick your order's focus spells (Heal Animal, Tempest Surge, Wild/Untamed Form…) in the Focus section below. Companion/familiar bookkeeping stays on your sheet."}],
    help:[
      ["What does a druid do?",
       "You're a <b>Primal</b> prepared caster tied to nature, with strong healing, control, and battlefield spells. Many druids also use order focus spells to shapeshift (coming soon to the app)."],
    ],
  },

  /* ---------------- WITCH ---------------- */
  witch:{
    id:"witch", name:"Witch", icon:"witch", color:"#b061b8",
    tagline:"Prepared caster · your patron sets the tradition",
    traditionFrom:"patron", defaultTradition:"occult",
    keyAbility:"Intelligence", keyAbilityShort:"Int",
    casting:"prepared", slots:"full", prof:FULL_CASTER_PROF, cantrips:5,
    preview:true,
    features:[{type:"note", title:"Hexes & familiar", text:"Choose your patron's tradition above, then add your hex focus spells in the Focus section below. Familiar details stay on your sheet."}],
    help:[
      ["What does a witch do?",
       "You're a prepared caster whose <b>patron</b> grants your magic — set your patron's <b>tradition</b> (arcane, divine, occult, or primal) in the character section, and your spell list follows. Witches also cast <b>hexes</b> through a familiar (coming soon)."],
    ],
  },

  /* ---------------- SORCERER ---------------- */
  sorcerer:{
    id:"sorcerer", name:"Sorcerer", icon:"sorcerer", color:"#e05a52",
    tagline:"Spontaneous caster · magic in the blood",
    traditionFrom:"bloodline", keyAbility:"Charisma", keyAbilityShort:"Cha",
    casting:"spontaneous", slots:"full", prof:FULL_CASTER_PROF, cantrips:5,
    preview:true,
    features:[
      {type:"signature"},
      {type:"note", title:"Bloodline magic", text:"Add your bloodline focus spells in the Focus section below. Blood-magic side effects are described on each spell but tracked by you."},
    ],
    help:[
      ["What does a sorcerer do?",
       "You're a <b>spontaneous</b> caster whose <b>bloodline</b> sets your tradition. You build a <b>repertoire</b> of known spells and cast any of them using slots of the right rank — flexible turn to turn."],
      ["Signature spells",
       "Mark spells as <b>signature</b> (the ★) so you can cast them with higher-rank slots to heighten them. Pick one per spell rank for the most flexibility (e.g., a signature damage spell scales all game)."],
    ],
  },

  /* ---------------- BARD ---------------- */
  bard:{
    id:"bard", name:"Bard", icon:"bard", color:"#34a8c4",
    tagline:"Occult spontaneous caster · master of support",
    tradition:"occult", keyAbility:"Charisma", keyAbilityShort:"Cha",
    casting:"spontaneous", slots:"full", prof:FULL_CASTER_PROF, cantrips:5,
    preview:true,
    features:[
      {type:"signature"},
      {type:"note", title:"Compositions & muse", text:"Add your composition focus spells (Courageous Anthem, Counter Performance…) in the Focus section below."},
    ],
    help:[
      ["What does a bard do?",
       "You're an <b>Occult</b> <b>spontaneous</b> caster and the game's best supporter. You build a repertoire and cast flexibly, and your composition cantrips/focus spells buff the party (coming soon)."],
      ["Signature spells",
       "Mark spells as <b>signature</b> (the ★) to heighten them with higher-rank slots. One per rank is the usual choice."],
    ],
  },

  /* ---------------- ORACLE ---------------- */
  oracle:{
    id:"oracle", name:"Oracle", icon:"oracle", color:"#c061d6",
    tagline:"Divine spontaneous caster · power at a price",
    tradition:"divine", keyAbility:"Charisma", keyAbilityShort:"Cha",
    casting:"spontaneous", slots:"full", prof:FULL_CASTER_PROF, cantrips:5,
    preview:true,
    features:[
      {type:"signature"},
      {type:"note", title:"Mystery & revelations", text:"Add your revelation focus spells in the Focus section below. Your escalating oracular curse is tracked on your sheet."},
    ],
    help:[
      ["What does an oracle do?",
       "You're a <b>Divine</b> <b>spontaneous</b> caster channeling a <b>mystery</b>. You build a repertoire and cast flexibly; your revelation spells deepen an escalating <b>curse</b> (coming soon)."],
      ["Signature spells",
       "Mark spells as <b>signature</b> (the ★) to heighten them with higher-rank slots — usually one per spell rank."],
    ],
  },
  /* ---------------- MAGUS ---------------- */
  magus:{
    id:"magus", name:"Magus", icon:"magus", color:"#5d82e0",
    tagline:"Arcane half-caster · blade and spell as one",
    tradition:"arcane", keyAbility:"Intelligence", keyAbilityShort:"Int",
    casting:"prepared", slots:"partial", prof:PARTIAL_CASTER_PROF, cantrips:5,
    preview:true,
    features:[{type:"note", title:"Spellstrike & conflux spells", text:"Add your conflux focus spells (Force Fang, etc.) in the Focus section. Spellstrike itself is a martial action recharged by Arcane Cascade — track it on your sheet. You have only a few spell slots, always in your top two ranks."}],
    help:[
      ["What does a magus do?",
       "You're a martial <b>Arcane</b> caster who fuses weapon strikes with spells via <b>Spellstrike</b>. You only get a <b>handful of spell slots</b> (always your two highest ranks), so each prepared spell is precious — often a damaging spell to channel through Spellstrike."],
      ["Why so few slots?",
       "The magus trades spell quantity for martial power. From level 5 you stop preparing your lowest ranks entirely — the app only shows the slots you actually have. Your spell DC uses <b>Intelligence</b>."],
    ],
  },

  /* ---------------- SUMMONER ---------------- */
  summoner:{
    id:"summoner", name:"Summoner", icon:"summoner", color:"#2bb59a",
    tagline:"Half-caster · you and your eidolon, as one",
    traditionFrom:"patron", defaultTradition:"arcane",
    traditionChoiceLabel:"Eidolon's tradition",
    traditionChoiceHint:"your eidolon's essence sets your spell tradition",
    keyAbility:"Charisma", keyAbilityShort:"Cha",
    casting:"spontaneous", slots:"partial", prof:PARTIAL_CASTER_PROF, cantrips:5,
    preview:true,
    features:[
      {type:"signature"},
      {type:"note", title:"Eidolon & shared life", text:"Choose your eidolon's tradition above and add evolution focus spells in the Focus section. You get only a few slots (top two ranks). Your shared HP pool and the eidolon's actions stay on your sheet."},
    ],
    help:[
      ["What does a summoner do?",
       "You and your <b>eidolon</b> act as a team, sharing a Hit Point pool. You're a <b>spontaneous</b> caster with very few slots — pick your eidolon's <b>tradition</b> above, build a small repertoire, and lean on your eidolon in combat."],
      ["Few slots, top ranks only",
       "Like the magus, you cap at four slots in your two highest ranks and never reach 10th rank. Mark signature spells to heighten them into your higher slots."],
    ],
  },

  /* ---------------- PSYCHIC ---------------- */
  psychic:{
    id:"psychic", name:"Psychic", icon:"psychic", color:"#e05fa6",
    tagline:"Occult spontaneous caster · few spells, mighty cantrips",
    tradition:"occult", keyAbility:"Int or Cha", keyAbilityShort:"Key",
    casting:"spontaneous", slots:"psychic", prof:FULL_CASTER_PROF, cantrips:5,
    preview:true,
    features:[
      {type:"signature"},
      {type:"note", title:"Psi cantrips, Amps & Unleash Psyche", text:"Your psi cantrips appear in the Focus section — cast them at will, and spend a Focus Point to Amp them (use Refocus to recover). Your spell DC uses Intelligence or Charisma, whichever your conscious mind chose. Unleash Psyche is tracked on your sheet."},
    ],
    help:[
      ["What does a psychic do?",
       "You're an <b>Occult</b> <b>spontaneous</b> caster who turns <b>cantrips</b> into your main weapon by <b>Amping</b> them, backed by a small pool of stronger spell slots. Your spell DC uses <b>Intelligence or Charisma</b> depending on your conscious mind."],
      ["Few slots, strong cantrips",
       "You get only two slots per rank (one for a newly-gained rank), so cantrips and Amps carry much of your output. Mark signature spells to heighten them into higher slots."],
    ],
  },

  /* ---------------- ANIMIST ---------------- */
  animist:{
    id:"animist", name:"Animist", icon:"animist", color:"#e08a3c",
    tagline:"Divine prepared caster · channels apparitions (spirits)",
    tradition:"divine", keyAbility:"Wisdom", keyAbilityShort:"Wis",
    casting:"prepared", slots:"full", prof:FULL_CASTER_PROF, cantrips:4,
    preview:true,
    features:[{type:"note", title:"Apparitions & vessel spells", text:"You prepare divine spells; your attuned apparitions grant a vessel focus spell (add the ones you know in the Focus section below) and a separate spontaneous repertoire of apparition spells that stays on your character sheet."}],
    help:[
      ["What does an animist do?",
       "You're a <b>Divine</b> prepared caster who channels <b>apparitions</b> — spirits that lend you power. You prepare divine spells like a cleric, and your attuned apparitions grant extra spells plus a <b>vessel</b> focus spell. The app tracks your divine slots, cantrips and DC; apparition attunement and the apparition repertoire stay on your sheet (coming soon)."],
      ["Cantrips & apparitions",
       "You know <b>4 cantrips</b> — two you choose plus two granted by your attuned apparitions. Your <b>vessel</b> focus spell (from your primary apparition) appears in the Focus section; cast it with Focus Points like other focus spells."],
    ],
  },
};

/* Order shown in the class picker. */
const CLASS_ORDER=["cleric","wizard","druid","witch","sorcerer","bard","oracle","magus","summoner","psychic","animist"];
