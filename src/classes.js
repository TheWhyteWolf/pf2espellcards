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
   "Tap the <b>👤</b> button (top right) to keep <b>several characters</b> and switch between them — each remembers its own prepared spells. From there you can also <b>Export</b> a character to a code to back it up or send to a friend, and <b>Import</b> a code someone shares with you. Everything is stored on your device."],
];

const CLASSES={
  /* ---------------- CLERIC ---------------- */
  cleric:{
    id:"cleric", name:"Cleric", icon:"⛪",
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
    id:"wizard", name:"Wizard", icon:"🪄",
    tagline:"Arcane prepared caster · the widest spell list",
    tradition:"arcane", keyAbility:"Intelligence", keyAbilityShort:"Int",
    casting:"prepared", slots:"full", prof:FULL_CASTER_PROF, cantrips:5,
    preview:true,
    features:[
      {type:"extraSlots", key:"school", icon:"🎓", label:"Arcane school slot",
       note:"One extra slot of each rank you can cast, which must hold a spell from your chosen school / curriculum."},
      {type:"dailyResource", key:"bonded", icon:"🔗", label:"Drain Bonded Item", uses:1,
       note:"Once per day, recast a spell you already cast today without spending its slot."},
    ],
    help:[
      ["What does a wizard do?",
       "You're an <b>Arcane</b> prepared caster with the broadest spell list in the game. You Prepare spells each morning from your spellbook, leaning on control and damage like <b>Fireball</b> plus utility."],
      ["Arcane school slot",
       "Your school (curriculum) gives you <b>one extra prepared slot of every rank</b> you can cast. Fill the 🎓 slots with spells from your school. The app adds these slots automatically."],
      ["Drain Bonded Item",
       "Once per day you can <b>Drain your Bonded Item</b> to recast a spell you've already cast that day, without spending another slot. Tick the 🔗 tracker on Cast Today when you use it."],
    ],
  },

  /* ---------------- DRUID ---------------- */
  druid:{
    id:"druid", name:"Druid", icon:"🌿",
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
    id:"witch", name:"Witch", icon:"🔮",
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
    id:"sorcerer", name:"Sorcerer", icon:"✨",
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
    id:"bard", name:"Bard", icon:"🎵",
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
    id:"oracle", name:"Oracle", icon:"👁",
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
    id:"magus", name:"Magus", icon:"⚔️",
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
    id:"summoner", name:"Summoner", icon:"👹",
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
    id:"psychic", name:"Psychic", icon:"🧠",
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
};

/* Order shown in the class picker. */
const CLASS_ORDER=["cleric","wizard","druid","witch","sorcerer","bard","oracle","magus","summoner","psychic"];
