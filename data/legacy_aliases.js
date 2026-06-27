/* Legacy (pre-Remaster) spell names.
   The app uses Remaster names (matching the Foundry pf2e data). This map lets a
   group still playing the original/legacy rules find spells that were renamed in
   the Remaster — by search, by a "formerly …" note, and in the Prepare dropdowns.

   Remaster slug -> [old name(s)]. Only true 1:1 renames whose legacy version was
   removed from the data are listed; spells that still exist under both names
   (e.g. Acid Splash / Caustic Blast) need no alias. Verified against the data.

   The engine ALSO auto-extracts "(Remaster of X)" / "(Formerly X)" notes from
   spell descriptions, so curated entries contribute aliases automatically. */
const LEGACY_ALIASES = {
  "runic-weapon": ["Magic Weapon"],
  "runic-body": ["Magic Fang"],
  "mystic-armor": ["Mage Armor"],
  "telekinetic-hand": ["Mage Hand"],
  "force-barrage": ["Magic Missile"],
  "ignition": ["Produce Flame"],
  "breathe-fire": ["Burning Hands"],
  "dizzying-colors": ["Color Spray"],
  "enfeeble": ["Ray of Enfeeblement"],
  "holy-light": ["Searing Light"],
  "noise-blast": ["Sound Burst"],
  "see-the-unseen": ["See Invisibility"],
  "translate": ["Comprehend Language", "Comprehend Languages"],
  "everlight": ["Continual Flame"],
  "peaceful-rest": ["Gentle Repose"],
  "infuse-vitality": ["Disrupting Weapons"],
  "ring-of-truth": ["Zone of Truth"],
  "vampiric-feast": ["Vampiric Touch"],
  "vitality-lash": ["Disrupt Undead"],
  "cleanse-cuisine": ["Purify Food and Drink"],
  "void-warp": ["Chill Touch"],
  "revealing-light": ["Glitterdust"],
  "anointed-ground": ["Sanctified Ground"],
  "calm": ["Calm Emotions"],
  "laughing-fit": ["Hideous Laughter"]
};
