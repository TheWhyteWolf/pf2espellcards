/* Curated, beginner-friendly overrides (the "teaching" voice).
   Any slug here shadows the auto-generated text. Hand-edited —
   add an entry for any spell whose wording you want to simplify. */
const SPELL_OVERRIDES = {
  "air-bubble": {
    "description": "Trigger: a creature within range enters an environment where it can't breathe. A bubble of fresh air forms around its mouth and nose, letting it breathe normally. Ends if the target re-enters breathable air."
  },
  "anointed-ground": {
    "description": "Sanctify the area against a chosen category (aberrations, celestials, dragons, fiends, monitors, or undead). Creatures in the area gain a +1 status bonus to AC, attack rolls, damage, and saves against creatures of that type. (Remaster of Sanctified Ground.)"
  },
  "augury": {
    "description": "Cast over 10 minutes. Glimpse the future of a course of action within the next 30 minutes. The GM reveals: good, bad, mixed, or nothing. A secret DC 6 flat check can make the result 'nothing', so 'nothing' is never fully reliable."
  },
  "bane": {
    "description": "Enemies in the emanation must succeed at a Will save or take a -1 status penalty to attack rolls while in the area. Once per round you can Sustain to grow the radius by 10 feet and force newly-included enemies to save. Bane can counteract bless."
  },
  "bind-undead": {
    "description": "Seize control of a mindless undead, giving it the minion trait so it obeys you. Ends at once if you or your allies act with hostility toward it. Heightening raises the maximum level of undead you can control."
  },
  "bless": {
    "description": "You and your allies in the emanation gain a +1 status bonus to attack rolls. Once per round you can Sustain to grow the emanation by 10 feet. Bless can counteract bane."
  },
  "blindness": {
    "description": "Try to blind the target. Success: blinded until the start of your next turn. Failure: blinded 1 minute. Critical Failure: blinded permanently."
  },
  "blood-vendetta": {
    "description": "Trigger: a creature deals piercing, slashing, or persistent bleed damage to you (you must be able to bleed). Curse the target with 2d6 persistent bleed (Will save). Success: half. Failure: full bleed plus weakness 1 to piercing & slashing until it ends. Critical Failure: double bleed plus that weakness.",
    "heightened": "(+2) The persistent bleed increases by 2d6."
  },
  "calm": {
    "description": "Soothe creatures into a nonviolent state (Will save). Success: -1 status penalty to attacks. Failure: emotion effects suppressed and it can't take hostile actions; outside hostility ends the effect for it. Critical Failure: as failure, but outside hostility doesn't end it."
  },
  "chilling-darkness": {
    "description": "Fire a ray of unholy darkness: ranged spell attack vs AC. Deal 5d6 cold damage (double on a crit). A holy target also takes 5d6 spirit damage. Attempts to counteract magical light it passes through.",
    "heightened": "(+1) Cold damage +2d6, and spirit damage vs holy +2d6."
  },
  "cleanse-affliction": {
    "description": "Choose a curse, disease, or poison on the target. If it has advanced past stage 1, reduce its stage by 1 (only once per case).",
    "heightened": "(3rd) Also attempt to counteract a disease or poison. (4th) Also attempt to counteract a curse, disease, or poison."
  },
  "cleanse-cuisine": {
    "description": "Improve and purify food and drink in the area — turning water into a fine beverage, enhancing food, and removing toxins or contamination. It doesn't prevent future spoilage or add nutrition. (Formerly Purify Food and Drink.)",
    "heightened": "(+2) The area increases by 1 more contiguous cubic foot."
  },
  "clear-mind": {
    "description": "Attempt to counteract one effect imposing fleeing, frightened, or stupefied. If you just miss the counteract, instead suppress it until the start of your next turn. Can't affect curses, diseases, or innate conditions.",
    "heightened": "(4th) Adds confused, controlled, slowed. (6th) Adds doomed. (8th) Adds stunned."
  },
  "command": {
    "description": "Issue a hard-to-ignore one-word command: approach, flee, drop what it holds, drop prone, or stand in place. Failure: the target spends its first action next turn obeying. Critical Failure: it spends all its actions next turn obeying.",
    "heightened": "(5th) Target up to 10 creatures."
  },
  "create-food": {
    "description": "Cast over 1 hour. Create bland but nourishing food enough to feed 6 Medium creatures for a day; it spoils after 1 day. Smaller creatures eat less, larger creatures much more.",
    "heightened": "(4th) Feeds 12. (6th) Feeds 50. (8th) Feeds 200."
  },
  "create-water": {
    "description": "Conjure 2 gallons of fresh, drinkable water into containers or onto the ground near you. If not drunk, it evaporates after 1 day."
  },
  "crisis-of-faith": {
    "description": "Assault the target with doubt for 6d6 mental damage — or 6d8 if it can cast divine spells. Success: half. Failure: full, and a divine caster is stupefied 1 for 1 round. Critical Failure: double, stupefied 1, and a divine caster can't cast divine spells for 1 round.",
    "heightened": "(+1) Damage +2d6 (or +2d8 vs a divine caster)."
  },
  "darkness": {
    "description": "Create a shroud of darkness. Nonmagical light gives off no light in the area, and magical light of the spell's rank or lower is suppressed. From outside it looks like a globe of pure darkness; creatures can't see in or out.",
    "heightened": "(4th) Creatures with darkvision (not greater) can barely see through it, treating targets within as concealed."
  },
  "darkvision": {
    "description": "You gain darkvision for the duration, seeing in areas of darkness.",
    "heightened": "(3rd) Touch, 1 willing creature. (5th) Touch, 1 willing creature, lasts until your next daily preparations."
  },
  "daze": {
    "description": "Jolt a creature's mind, dealing 1d6 mental damage with a basic Will save. On a critical failure the target also becomes stunned 1.",
    "heightened": "(+2) The damage increases by 1d6."
  },
  "deafness": {
    "description": "The target may lose its hearing (Fortitude), then is temporarily immune for 1 minute. Success: deafened 1 round. Failure: deafened 10 minutes. Critical Failure: deafened permanently."
  },
  "detect-magic": {
    "description": "Send out a magical pulse that tells you whether any magic is present in the area, but not the school, rank, or location. You can ignore your own magic and that of allies. Illusion magic is only detected if its rank is lower than your spell's rank.",
    "heightened": "(3rd) You also learn the rank of the most powerful magic detected. (4th) As 3rd, plus you pinpoint the highest-rank source to a 5-foot cube (imprecise)."
  },
  "dispel-magic": {
    "description": "Attempt a counteract check to unravel the target magic. If you counteract a magic item, it becomes mundane for 10 minutes. You automatically fail against artifacts and the like."
  },
  "divine-lance": {
    "description": "Make a ranged spell attack to hurl spiritual energy. On a hit, deal 2d4 spirit damage (double on a critical hit). When you cast it, choose holy or unholy; this affects creatures of the opposing trait under the sanctified rules.",
    "heightened": "(+1) The damage increases by 1d4."
  },
  "dream-message": {
    "description": "Send a one-way message (up to 1 minute of speech) into the target's dreams. If asleep, it gets the message at once; otherwise the next time it sleeps.",
    "heightened": "(4th) Up to 10 creatures you know and have met, same message to all."
  },
  "environmental-endurance": {
    "description": "Cast over 10 minutes. Choose severe cold or severe heat; the target is protected from that dangerous temperature (but not extreme temperatures).",
    "heightened": "(3rd) Protected from both severe cold and severe heat. (5th) Protected from severe and extreme cold and heat."
  },
  "everlight": {
    "description": "The touched gemstone glows with bright light in a 20-foot radius (dim for 20 more) in a color you choose. Ends if the gemstone breaks. (Remaster of Continual Flame.)"
  },
  "fear": {
    "description": "Instill fear. Critical Success: unaffected. Success: frightened 1. Failure: frightened 2. Critical Failure: frightened 3 and fleeing for 1 round.",
    "heightened": "(3rd) Target up to 5 creatures."
  },
  "forbidding-ward": {
    "description": "Protect an ally against a specific enemy. The target ally gains a +1 status bonus to AC and saving throws against that enemy's attacks, spells, and other effects.",
    "heightened": "(6th) The status bonus increases to +2."
  },
  "guidance": {
    "description": "Grant the target a +1 status bonus to one attack roll, Perception check, saving throw, or skill check before the duration ends. The target chooses which roll to use it on before rolling; the spell then ends and the target is temporarily immune for 1 hour."
  },
  "harm": {
    "description": "Channel void energy to harm the living or knit the undead. A living target takes 1d8 void damage (basic Fortitude); a willing undead target regains 1d8 HP. ◆ 1 action: touch one creature. ◆◆ 2 actions: range 30 ft, one creature, and a healed undead regains an extra 8 HP (1d8+8). ◆◆◆ 3 actions: 30-foot emanation affecting all living and undead in the area (no +8).",
    "heightened": "(+1) Healing/damage increases by 1d8, and the 2-action bonus increases by 8."
  },
  "heal": {
    "description": "Channel vital energy to heal the living or sear the undead. A living target regains 1d8 HP; an undead target takes 1d8 vitality damage (basic Fortitude). ◆ 1 action: touch one creature. ◆◆ 2 actions: range 30 ft, one creature, and a healed living creature regains an extra 8 HP (so 1d8+8). ◆◆◆ 3 actions: 30-foot emanation affecting all living and undead in the area (no +8).",
    "heightened": "(+1) Healing/damage increases by 1d8, and the 2-action bonus increases by 8."
  },
  "heroism": {
    "description": "Grant the target a +1 status bonus to attack rolls, Perception, saving throws, and skill checks.",
    "heightened": "(6th) Bonus increases to +2. (9th) Bonus increases to +3."
  },
  "holy-light": {
    "description": "Fire a blazing ray of light: make a ranged spell attack vs AC. Deal 5d6 fire damage (double on a crit). An unholy target also takes 5d6 spirit damage. If the light passes through magical darkness, it attempts to counteract that darkness. (Remaster of Searing Light.)",
    "heightened": "(+1) Fire damage +2d6, and spirit damage vs unholy +2d6."
  },
  "infuse-vitality": {
    "description": "Infuse allies' Strikes with vital energy: each target's unarmed and weapon Strikes deal an extra 1d4 vitality damage (typically harms only undead). A holy caster can make this spell and the Strikes holy. (Formerly Disrupting Weapons.)",
    "heightened": "(3rd) Extra damage becomes 2d4. (5th) Extra damage becomes 3d4."
  },
  "light": {
    "description": "Create an orb of light that sheds bright light in a 20-foot radius (and dim light for 20 more feet). You can attach it to a willing creature so it moves with them. Sustain to move the orb up to 60 feet. You can have up to four Light spells active at once.",
    "heightened": "(4th) The orb sheds bright light in a 60-foot radius (dim for 60 more)."
  },
  "locate": {
    "description": "Learn the direction to the nearest target object (a named one, or the nearest of a type). It gives direction only, not distance, and is blocked by lead and running water. It can't find creatures at base rank.",
    "heightened": "(5th) Can instead locate a specific creature or a type of creature."
  },
  "marvelous-mount": {
    "description": "Cast over 10 minutes. Conjure a Large fantastical mount (Speed 40 ft) as the target's minion. It bears only the target and its gear, uses the target's AC and saves, and is destroyed if it takes more than 10 damage at once.",
    "heightened": "(3rd) Can walk on water. (4th) Speed 60. (5th) Speed 60 and fly Speed 60. (6th) Speed/fly 80."
  },
  "mending": {
    "description": "Repair a damaged object, restoring 5 Hit Points per spell rank. If this brings it above its Broken Threshold, the broken condition is removed.",
    "heightened": "(2nd) Target up to 1 Bulk. (3rd) Target up to 2 Bulk."
  },
  "moonlight-ray": {
    "description": "Fire a ray of holy moonlight: ranged spell attack vs AC. Deal 5d6 cold damage that counts as silver (double on a crit). An unholy target also takes 5d6 spirit damage. Attempts to counteract magical darkness it passes through.",
    "heightened": "(+1) Cold damage +2d6, and spirit damage vs unholy +2d6."
  },
  "mystic-armor": {
    "description": "Shimmering energy wards you, granting a +1 item bonus to AC (max Dex +5). You use your unarmored proficiency to calculate AC while protected.",
    "heightened": "(4th) Also +1 item bonus to saves. (6th) +2 AC, +1 saves. (8th) +2 AC, +2 saves. (10th) +3 AC, +3 saves."
  },
  "noise-blast": {
    "description": "A cacophonous blast deals 2d10 sonic damage (Fortitude). Success: half. Failure: full and deafened 1 round. Critical Failure: double, deafened 1 minute, and stunned 1. (Remaster of Sound Burst.)",
    "heightened": "(+1) The damage increases by 1d10."
  },
  "peaceful-rest": {
    "description": "The corpse doesn't decay, can't be made into undead, and isn't eaten by ordinary pests. Its duration doesn't count against time limits for spells like raise dead. (Remaster of Gentle Repose.)",
    "heightened": "(5th) Duration unlimited; takes 1 more action and costs 6 gp of embalming fluid."
  },
  "prestidigitation": {
    "description": "Perform a minor magical trick. Each time you Sustain, choose one effect: cook (chill, warm, or flavor 1 lb of nonliving material), lift (raise a light unattended object 1 foot), make (create a temporary crude object — not a usable tool/weapon), or tidy (color, clean, or soil a light object). It can't deal damage or cause conditions."
  },
  "protection": {
    "description": "Ward a creature against harm: it gains a +1 status bonus to Armor Class and saving throws.",
    "heightened": "(3rd) The benefits also affect all your allies in a 10-foot emanation around the target."
  },
  "radiant-globe": {
    "description": "Create a dome of brilliant light. Physical ranged ammunition entering the area is destroyed. A creature making a ranged attack into or through it must succeed at a Fortitude save or be dazzled 1 round (blinded 1 round on a critical failure)."
  },
  "read-aura": {
    "description": "Spend 1 minute to detect whether an object is magical and, if so, learn the school of magic. You and those you advise gain a +2 circumstance bonus to Identify Magic on it. An illusion's aura is detected only if its rank is lower than this spell's.",
    "heightened": "(3rd) Target up to 10 objects. (6th) Target any number of objects."
  },
  "resist-energy": {
    "description": "Choose acid, cold, electricity, fire, or sonic; the target and its gear gain resistance 5 against it.",
    "heightened": "(4th) Resistance 10, up to 2 targets. (7th) Resistance 15, up to 5 targets."
  },
  "revealing-light": {
    "description": "A wash of light (Reflex) makes creatures dazzled; an invisible creature becomes concealed instead, and a creature concealed by other means loses that concealment. Success: 2 rounds. Failure: 1 minute. Critical Failure: 10 minutes. (Remaster of Faerie Fire/Glitterdust.)"
  },
  "ring-of-truth": {
    "description": "Create a zone exposing deceit: creatures in it take a -2 status penalty to Deception, and a bell rings whenever someone in the area knowingly lies (the Will save sets how reliably lies are caught). (Remaster of Zone of Truth.)"
  },
  "runic-body": {
    "description": "Glowing runes cover the target. Its unarmed attacks become +1 striking: +1 item bonus to attack rolls and one extra damage die (two dice total).",
    "heightened": "(6th) +2 greater striking (three dice). (9th) +3 major striking (four dice)."
  },
  "runic-weapon": {
    "description": "The target becomes a +1 striking weapon: +1 item bonus to attack rolls and one extra weapon damage die (two dice total).",
    "heightened": "(6th) +2 greater striking (three dice). (9th) +3 major striking (four dice)."
  },
  "sanctuary": {
    "description": "Ward the target; a creature trying to attack it must first attempt a Will save. Success: it can attack. Failure: it wastes the action and can't attack the target this turn. Critical Failure: it can't attack the target for the rest of the duration. If the warded creature takes a hostile action, the spell ends."
  },
  "see-the-unseen": {
    "description": "You see invisible creatures as concealed (blurred) rather than undetectable, and see incorporeal creatures within 10 feet of a surface. You gain a +2 status bonus to disbelieve illusions. (Remaster of See Invisibility.)",
    "heightened": "(5th) Duration increases to 8 hours."
  },
  "share-life": {
    "description": "Link your life force to the target's. It takes half damage from effects dealing HP damage, and you take the rest (you don't apply your own resistances/weaknesses to it). Ends if the target moves more than 30 feet away, or if either of you drops to 0 HP."
  },
  "shield": {
    "description": "Raise a magical shield of force (counts as Raise a Shield), gaining a +1 circumstance bonus to AC with no hand needed. You can use Shield Block with it (Hardness 5). After it takes Shield Block damage the spell ends and can't be cast again for 10 minutes.",
    "heightened": "(+2) The shield's Hardness increases by 5."
  },
  "sigil": {
    "description": "Mark a creature or object with a magical sigil (about 1 sq inch) of your design. You can make it visible or invisible and toggle it with an Interact action. It can be removed with 5 minutes of work; on a creature it fades after 1 week.",
    "heightened": "(3rd) Lasts 1 month. (5th) Lasts 1 year. (7th) Permanent."
  },
  "silence": {
    "description": "The target produces no sound, so creatures can't notice it by hearing alone. It can't make sonic attacks, use auditory actions, or cast spells with verbal/audible components unless they have the subtle trait.",
    "heightened": "(4th) Instead silences a 10-foot emanation around the creature, affecting all sound within."
  },
  "sound-body": {
    "description": "Attempt to counteract one effect imposing blinded, dazzled, deafened, enfeebled, or sickened. If you just miss, instead suppress it until the start of your next turn. Can't affect curses, diseases, or innate conditions.",
    "heightened": "(4th) Adds drained, slowed. (6th) Adds petrified. (8th) Adds stunned."
  },
  "speak-with-plants": {
    "description": "Ask questions of and receive answers from nearby plants and fungi. They keep their normal intelligence and attitude, so their answers may be limited.",
    "heightened": "(4th) Duration increases to 8 hours."
  },
  "spirit-link": {
    "description": "Form a link to share another creature's pain. When you cast it and at the start of each of your turns, if the target is below maximum HP it regains 2 HP and you lose that many. This transfer can't be increased or reduced by other effects.",
    "heightened": "(+1) The Hit Points transferred increases by 2."
  },
  "spiritual-armament": {
    "description": "Create a ghostly echo of a weapon you wield and fling it: make a spell attack vs AC. On a hit deal 2d8 of the weapon's damage type (or spirit, if worse for the target); double on a crit. It uses and adds to your multiple attack penalty. Sustain to attack again.",
    "heightened": "(+2) The damage increases by 1d8."
  },
  "stabilize": {
    "description": "Channel vitality to halt a creature's slide toward death. The target loses the dying condition, though it remains unconscious at 0 Hit Points."
  },
  "status": {
    "description": "While you and the target are on the same plane and alive, you stay aware of the target's direction, distance, and any conditions affecting it.",
    "heightened": "(4th) Range 30 feet, up to 10 creatures."
  },
  "sure-footing": {
    "description": "Attempt to counteract one effect imposing clumsy, grabbed, or paralyzed. If you just miss, instead suppress it until the start of your next turn. Can't affect curses, diseases, or innate conditions.",
    "heightened": "(4th) Adds immobilized, restrained, slowed. (6th) Adds petrified. (8th) Adds stunned."
  },
  "translate": {
    "description": "The target understands a single language it is hearing or reading at casting (not codes or metaphor). If several known languages are present, the target picks one; otherwise it's random. (Remaster of Comprehend Language.)",
    "heightened": "(3rd) The target can also speak the language. (4th) Up to 10 targets who can also speak it."
  },
  "vampiric-feast": {
    "description": "Leech the target's lifeblood for 6d6 void damage. You gain temporary HP equal to half the void damage dealt (after resistances), lasting up to 1 minute. (Remaster of Vampiric Touch.)",
    "heightened": "(+1) The damage increases by 2d6."
  },
  "vitality-lash": {
    "description": "Sear undeath with the energy of Creation's Forge, dealing 2d6 vitality damage with a basic Fortitude save. On a critical failure the target is also enfeebled 1 until the start of your next turn. (Remaster replacement for Disrupt Undead.)",
    "heightened": "(+1) The damage increases by 1d6."
  },
  "void-warp": {
    "description": "Twist the void against a living creature, dealing 2d4 void damage with a basic Fortitude save. On a critical failure the target is also enfeebled 1 until the start of your next turn.",
    "heightened": "(+1) The damage increases by 1d4."
  },
  "wanderers-guide": {
    "description": "Choose a destination and receive an inspired overland route. While you and your allies travel that route, treat difficult-terrain movement penalties as half. No effect in encounter mode. Recasting replaces the previous route."
  },
  "water-breathing": {
    "description": "Cast over 1 minute. The targets can breathe underwater.",
    "heightened": "(3rd) Duration 8 hours. (4th) Until your next daily preparations."
  },
  "water-walk": {
    "description": "The target can walk on the surface of water and other liquids without sinking. It can go under if it wishes but must Swim; this doesn't grant water breathing.",
    "heightened": "(4th) Range 30 feet, duration 1 hour, up to 10 targets."
  },
  "whirling-scarves": {
    "description": "Force scarves swirl around you, granting concealment vs melee and ranged attacks (ranged attackers face a DC 6 flat check instead of DC 5). When a melee attack against you fails, that attacker takes a -1 circumstance penalty to further attacks with that weapon until end of its turn.",
    "heightened": "(+2) The penalty and the ranged flat-check DC each increase by 1."
  }
};
