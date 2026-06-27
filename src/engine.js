/* ============================================================
   ENGINE — data-driven PF2e spellbook
   Spell data: GENERATED_SPELLS (from Foundry pf2e, OGL/ORC)
   Curated text: SPELL_OVERRIDES  ·  Class config: CLASSES
   ============================================================ */

/* ---- Legacy (pre-Remaster) name support ---- */
const ALIASES = (typeof LEGACY_ALIASES!=="undefined") ? LEGACY_ALIASES : {};
/* Pull "(Remaster of X)" / "(Formerly X)" notes out of a description. */
function extractLegacyNames(desc){
  const out=[];
  const re=/\((?:Remaster(?:\s+replacement)?\s+of|Formerly|Previously)\s+([^)]+?)\)/gi;
  let m;
  while((m=re.exec(desc||""))){
    m[1].split(/\s*(?:\/|,|\band\b)\s*/).forEach(n=>{
      n=n.replace(/^[\s.,;:]+|[\s.,;:]+$/g,"").trim();
      if(n) out.push(n);
    });
  }
  return out;
}

/* ---- Build the spell index (apply curated overrides + legacy names) ---- */
const SPELLS = GENERATED_SPELLS.map(s=>{
  const o = (typeof SPELL_OVERRIDES!=="undefined") && SPELL_OVERRIDES[s.slug];
  if(o){
    s = Object.assign({}, s, {
      description: o.description!==undefined ? o.description : s.description,
      heightened:  o.heightened!==undefined  ? o.heightened  : s.heightened,
      curated: true
    });
  }
  const legacy=[].concat(ALIASES[s.slug]||[], extractLegacyNames(s.description));
  // de-dupe (case-insensitive), drop any that equal the current name
  const seen={}; s.legacy=[];
  legacy.forEach(n=>{ const k=n.toLowerCase(); if(k && k!==s.name.toLowerCase() && !seen[k]){ seen[k]=1; s.legacy.push(n); } });
  return s;
});
const SPELL_BY_SLUG = {};
SPELLS.forEach(s=>{ SPELL_BY_SLUG[s.slug]=s; });
function legacyNote(s){ return (s.legacy&&s.legacy.length) ? ("formerly "+s.legacy.join(" / ")) : ""; }
function ritualLine(s){
  if(!s.ritual) return "";
  const p=s.ritualPrimary?` &nbsp;<b>Primary</b> ${escapeHtml(s.ritualPrimary)}`:"";
  const sec=s.ritualSecondary?` &nbsp;<b>Secondary</b> ${escapeHtml(s.ritualSecondary)}`:"";
  return `<div class="meta"><span class="ritualtag">Ritual</span>${p}${sec}</div>`;
}

/* ---- Data version stamp ---- */
const META = (typeof GENERATED_META!=="undefined") ? GENERATED_META : {};
function dataStampText(){
  if(!META.generated) return "";
  return `Spell data ${META.generated}${META.sourceCommit?" · "+META.sourceCommit:""} · ${META.count} entries`;
}

/* ============================================================
   STATE
   ============================================================ */
const LS_KEY="pf2eSpellbook.v3";
const OLD_KEY="pf2eSpellbook.v2";

function uid(){ return "c"+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function defaultStateFields(){
  return { classId:null, name:"", level:3, keyMod:3, fontMod:3, font:"heal",
           bloodline:"draconic", patronTradition:"occult", focusPool:1, doctrine:"cloistered",
           prepared:null, cast:{}, sustaining:[] };
}
function blankChar(){ return Object.assign({id:uid()}, defaultStateFields()); }

let library = loadLibrary();
let state = library.characters[library.activeId];

function loadLibrary(){
  try{
    const v3=JSON.parse(localStorage.getItem(LS_KEY));
    if(v3 && v3.characters && Object.keys(v3.characters).length) return normalizeLib(v3);
  }catch(e){}
  try{ // migrate a single v2 character
    const v2=JSON.parse(localStorage.getItem(OLD_KEY));
    if(v2 && v2.classId){ const c=Object.assign(blankChar(), v2); return {characters:{[c.id]:c}, activeId:c.id}; }
  }catch(e){}
  const c=blankChar();
  return {characters:{[c.id]:c}, activeId:c.id};
}
function normalizeLib(lib){
  Object.keys(lib.characters).forEach(id=>{ lib.characters[id]=Object.assign(defaultStateFields(), lib.characters[id], {id}); });
  if(!lib.characters[lib.activeId]) lib.activeId=Object.keys(lib.characters)[0];
  return lib;
}
let _storageWarned=false;
function saveState(){
  library.characters[state.id]=state;
  try{ localStorage.setItem(LS_KEY, JSON.stringify(library)); }
  catch(e){
    if(!_storageWarned && typeof toast==="function"){ toast("⚠ Couldn't save — storage full or disabled"); _storageWarned=true; }
  }
}

/* ============================================================
   CLASS-AWARE HELPERS
   ============================================================ */
function activeClass(){ return CLASSES[state.classId] || null; }
function activeTradition(){
  const c=activeClass(); if(!c) return null;
  if(c.traditionFrom==="bloodline"){ const b=BLOODLINES[state.bloodline]; return b?b.tradition:"arcane"; }
  if(c.traditionFrom==="patron"){ return state.patronTradition||c.defaultTradition||"occult"; }
  return c.tradition;
}
function isSpontaneous(){ const c=activeClass(); return !!c && c.casting==="spontaneous"; }
function hasFeature(type){ const c=activeClass(); return !!(c && c.features && c.features.some(f=>f.type===type)); }
function getFeature(type){ const c=activeClass(); return c && c.features && c.features.find(f=>f.type===type); }
function getFeatures(type){ const c=activeClass(); return (c && c.features || []).filter(f=>f.type===type); }

/* Spells of the active tradition, excluding focus spells. */
function classSpells(){ const t=activeTradition(); if(!t) return []; return SPELLS.filter(s=> !s.focus && s.traditions.includes(t)); }
function spellsByRank(r){ return classSpells().filter(s=>s.rank===r); }
function findSpell(slug){ return SPELL_BY_SLUG[slug]; }

/* Focus spells available to the active class. */
function classFocusSpells(){ const c=activeClass(); if(!c) return []; return SPELLS.filter(s=> s.focus && s.classTrait===c.id); }
function hasFocus(){ return classFocusSpells().length>0; }
/* Focus spells auto-heighten to half your level, rounded up. */
function focusRank(){ return Math.max(1, Math.min(10, Math.ceil(Number(state.level)/2))); }

function classSlots(level){
  const c=activeClass(); if(!c) return {};
  if(c.slots==="full") return fullCasterSlots(level);
  if(c.slots==="partial") return partialCasterSlots(level);
  if(c.slots==="psychic") return psychicSlots(level);
  return c.slots[level]||{};
}
function highestRank(level){ const slots=classSlots(level); const ks=Object.keys(slots).map(Number); return ks.length?Math.max(...ks):0; }

function profBonus(){
  const c=activeClass();
  let tbl=(c&&c.prof)||FULL_CASTER_PROF;
  if(c && c.doctrines && c.doctrines[state.doctrine]) tbl=c.doctrines[state.doctrine].prof;
  const lvl=Number(state.level);
  for(const [min,bonus] of tbl){ if(lvl>=min) return bonus; } return 2;
}
function spellDC(){ return 10 + Number(state.level) + profBonus() + Number(state.keyMod); }
function spellAtk(){ const v=Number(state.level)+profBonus()+Number(state.keyMod); return (v>=0?"+":"")+v; }
function fontCount(){ return Math.max(1, 1 + Number(state.fontMod)); }

/* ============================================================
   FORMATTING HELPERS
   ============================================================ */
const ACTION_GLYPH={1:"◆",2:"◆◆",3:"◆◆◆"};
function actionLabel(a){
  if(!a) return "";
  switch(a){
    case "1": return "◆ 1 action";
    case "2": return "◆◆ 2 actions";
    case "3": return "◆◆◆ 3 actions";
    case "reaction": return "⤳ Reaction";
    case "free": return "◇ Free action";
  }
  const m=String(a).match(/^([1-3])\s*(?:to|or|–|-)\s*([1-3])$/);
  if(m) return `${ACTION_GLYPH[m[1]]}–${ACTION_GLYPH[m[2]]} ${m[1]} to ${m[2]} actions`;
  return "🕑 "+a;
}
function titleCaseTrait(t){ return t.charAt(0).toUpperCase()+t.slice(1); }
function escapeHtml(s){ return (s||"").replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])); }
function textToHtml(s){ return escapeHtml(s).replace(/\n/g,"<br>"); }
function rankLabelOf(s){ return s.rank===0 ? "Cantrip" : ("Rank "+s.rank); }
function cardClass(s){ return "rank"+s.rank; }

/* ---- Computed damage/healing at the cast rank (heightening) ---- */
function parseDice(f){ const m=String(f).match(/^(\d+)d(\d+)\s*([+-]\s*\d+)?$/); return m?{n:+m[1],d:+m[2],mod:m[3]?parseInt(m[3].replace(/\s/g,""),10):0}:null; }
function addDice(base, add, steps){
  const b=parseDice(base), a=parseDice(add);
  if(!b||!a||b.d!==a.d) return null;           // can't cleanly scale (e.g. mixed dice)
  const n=b.n+a.n*steps, mod=b.mod+a.mod*steps;
  return `${n}d${b.d}${mod>0?"+"+mod:mod<0?mod:""}`;
}
function scaleDamage(s, castRank){
  if(!s.damage||!s.damage.length) return null;
  const steps = s.heighten ? Math.floor((Number(castRank)-s.rank)/s.heighten.interval) : 0;
  return s.damage.map((bd,i)=>{
    let f=bd.formula;
    const add=s.heighten&&s.heighten.add&&s.heighten.add[i];
    if(steps>0&&add){ const sc=addDice(bd.formula,add,steps); if(sc) f=sc; }
    return {formula:f, type:bd.type, healing:bd.healing};
  });
}
function damageChipHTML(s, castRank){
  const ds=scaleDamage(s, castRank); if(!ds) return "";
  const parts=ds.map(d=>{
    const icon=d.healing?"✚":"💥";
    const ty=(d.type&&!d.healing)?" "+escapeHtml(d.type):"";
    return `${icon} ${escapeHtml(d.formula)}${ty}`;
  });
  return `<span class="dmgchip">${parts.join(" &nbsp; ")}</span>`;
}

function spellCardHTML(s, opts){
  opts=opts||{};
  const cls = opts.cls || cardClass(s);
  const m=[];
  if(s.range) m.push(`<b>Range</b> ${escapeHtml(s.range)}`);
  if(s.area)  m.push(`<b>Area</b> ${escapeHtml(s.area)}`);
  if(s.targets) m.push(`<b>Targets</b> ${escapeHtml(s.targets)}`);
  if(s.duration) m.push(`<b>Duration</b> ${escapeHtml(s.duration)}`);
  const meta = m.length?`<div class="meta">${m.join(" &nbsp;·&nbsp; ")}</div>`:"";
  const traits=`<div class="traits">${s.traits.map(t=>`<span class="trait">${escapeHtml(titleCaseTrait(t))}</span>`).join("")}</div>`;
  const saveTag = s.save ? `<span class="save-tag">🛡 ${escapeHtml(s.save)}</span>` : "";
  const heighten = s.heightened ? `<div class="heighten"><b>Heightened</b> ${textToHtml(s.heightened)}</div>` : "";
  const note=legacyNote(s)?`<div class="meta" style="margin:-2px 0 4px"><span class="formerly">${escapeHtml(legacyNote(s))}</span></div>`:"";
  return `
  <div class="card ${cls}">
    <div class="spell-head">
      <div class="spell-name">${escapeHtml(s.name)}</div>
      <div class="rankpill">${rankLabelOf(s)}</div>
    </div>
    ${note}
    <div><span class="actions">${actionLabel(s.actions)}</span> ${saveTag}</div>
    ${damageChipHTML(s,s.rank)?`<div class="dmgline">${damageChipHTML(s,s.rank)}</div>`:""}
    ${traits}
    ${meta}
    ${ritualLine(s)}
    <div class="desc">${textToHtml(s.description)}</div>
    ${heighten}
  </div>`;
}

function spellPreviewHTML(s, castRank){
  if(!s) return "";
  const heightNote=(castRank>s.rank)?` · cast at rank ${castRank}`:"";
  const saveTag=s.save?` · 🛡 ${escapeHtml(s.save)}`:"";
  const m=[];
  if(s.range) m.push(`<b>Range</b> ${escapeHtml(s.range)}`);
  if(s.area)  m.push(`<b>Area</b> ${escapeHtml(s.area)}`);
  if(s.targets) m.push(`<b>Targets</b> ${escapeHtml(s.targets)}`);
  if(s.duration) m.push(`<b>Duration</b> ${escapeHtml(s.duration)}`);
  const heighten=s.heightened?`<div class="heighten"><b>Heightened</b> ${textToHtml(s.heightened)}</div>`:"";
  return `<div class="prep-preview-inner">
    <div class="meta">${actionLabel(s.actions)}${saveTag}${heightNote}</div>
    ${m.length?`<div class="meta">${m.join(" &nbsp;·&nbsp; ")}</div>`:""}
    <div class="desc">${textToHtml(s.description)}</div>
    ${heighten}
  </div>`;
}
function updatePreview(sel){
  const box=document.getElementById(sel.dataset.preview);
  if(!box) return;
  const s=findSpell(sel.value);
  box.innerHTML = s ? spellPreviewHTML(s, Number(sel.dataset.castrank)) : "";
}

/* ============================================================
   NAVIGATION
   ============================================================ */
const VIEWS=["today","prepare","browse","help"];
function go(view){
  document.getElementById("view-classpick").classList.add("hide");
  document.getElementById("view-menu").classList.add("hide");
  document.querySelector("nav.bottom").classList.remove("hide");
  document.querySelector("header.top").classList.remove("hide");
  VIEWS.forEach(v=>{
    document.getElementById("view-"+v).classList.toggle("hide", v!==view);
    document.getElementById("nav-"+v).classList.toggle("on", v===view);
  });
  window.scrollTo(0,0);
  if(view==="prepare") renderPrepare();
  if(view==="today") renderToday();
  if(view==="browse") renderBrowse();
  if(view==="help") renderHelp();
}
function toast(msg){
  const t=document.getElementById("toast");
  t.textContent=msg; t.classList.add("show");
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove("show"),1600);
}

/* ============================================================
   CHARACTER MENU (multiple characters · export / import)
   ============================================================ */
function charSummary(c){
  if(!c.classId) return "New character — no class yet";
  const cl=CLASSES[c.classId];
  return `${cl.icon} ${cl.name} · Level ${c.level}`;
}
function openMenu(){
  VIEWS.forEach(v=>document.getElementById("view-"+v).classList.add("hide"));
  document.getElementById("view-classpick").classList.add("hide");
  document.querySelector("header.top").classList.remove("hide");
  document.getElementById("view-menu").classList.remove("hide");
  renderMenu();
  window.scrollTo(0,0);
}
function closeMenu(){ if(!state.classId) showClassPicker(); else go(state.prepared?"today":"prepare"); }
function renderMenu(){
  const ids=Object.keys(library.characters);
  const list=ids.map(id=>{
    const c=library.characters[id];
    const active=id===library.activeId;
    return `<div class="classcard ${active?"activechar":""}">
      <div class="ic">${c.classId?CLASSES[c.classId].icon:"＋"}</div>
      <div class="txt" onclick="switchCharacter('${id}')" style="cursor:pointer">
        <div class="nm">${escapeHtml(c.name||(c.classId?CLASSES[c.classId].name:"Unnamed"))}${active?` <span class="previewtag" style="background:var(--gold);color:#2a1c0c;border-color:var(--gold)">active</span>`:""}</div>
        <div class="tl">${charSummary(c)}</div>
      </div>
      ${ids.length>1?`<button class="rmrow" title="delete" onclick="deleteCharacter('${id}')">✕</button>`:""}
    </div>`;
  }).join("");
  document.getElementById("menuList").innerHTML=list;
  showInstallButton(!!deferredInstall);
  const ds=document.getElementById("dataStamp"); if(ds) ds.textContent=dataStampText();
}
function newCharacter(){ const c=blankChar(); library.characters[c.id]=c; library.activeId=c.id; state=c; saveState(); showClassPicker(); }
function switchCharacter(id){
  if(!library.characters[id]) return;
  library.activeId=id; state=library.characters[id]; saveState();
  if(!state.classId){ showClassPicker(); } else { renderHeader(); go(state.prepared?"today":"prepare"); }
}
function deleteCharacter(id){
  if(!confirm("Delete this character? This can't be undone.")) return;
  delete library.characters[id];
  if(library.activeId===id){
    const ids=Object.keys(library.characters);
    if(ids.length){ library.activeId=ids[0]; state=library.characters[ids[0]]; }
    else { const c=blankChar(); library.characters[c.id]=c; library.activeId=c.id; state=c; }
  }
  saveState(); renderHeader(); renderMenu();
}

/* Export / import a single character as a portable code. */
function b64encode(str){ return btoa(unescape(encodeURIComponent(str))); }
function b64decode(str){ return decodeURIComponent(escape(atob(str))); }
function exportCharacter(){
  const c=Object.assign({}, state); delete c.id;
  const code="PF2E1:"+b64encode(JSON.stringify(c));
  const io=document.getElementById("menuIO");
  io.value=code; io.focus(); io.select();
  if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(code).then(()=>toast("📋 Copied to clipboard")).catch(()=>toast("Code ready — copy it")); }
  else toast("Code ready — copy it");
}
function importCharacter(){
  let code=(document.getElementById("menuIO").value||"").trim();
  if(!code){ toast("Paste a character code first"); return; }
  try{
    if(code.startsWith("PF2E1:")) code=code.slice(6);
    const obj=JSON.parse(b64decode(code));
    if(typeof obj!=="object"||!("level" in obj)) throw new Error("bad");
    const c=Object.assign(blankChar(), obj, {id:uid()});
    library.characters[c.id]=c; library.activeId=c.id; state=c; saveState();
    toast("📥 Character imported");
    if(!state.classId){ showClassPicker(); } else { renderHeader(); go(state.prepared?"today":"prepare"); }
  }catch(e){ alert("That code didn't work — make sure you pasted the whole thing."); }
}

/* ============================================================
   CLASS PICKER
   ============================================================ */
function showClassPicker(){
  VIEWS.forEach(v=>document.getElementById("view-"+v).classList.add("hide"));
  document.querySelector("nav.bottom").classList.add("hide");
  document.querySelector("header.top").classList.toggle("hide", !state.classId);
  const sec=document.getElementById("view-classpick");
  sec.classList.remove("hide");
  sec.innerHTML=`
    <h1 style="text-align:center">📖 PF2e Spellbook</h1>
    <p class="meta" style="text-align:center;margin-bottom:18px">Choose your class to begin.</p>
    ${CLASS_ORDER.map(id=>{
      const c=CLASSES[id];
      return `<button class="classcard" onclick="chooseClass('${id}')">
        <div class="ic">${c.icon}</div>
        <div class="txt"><div class="nm">${c.name}${c.preview?` <span class="previewtag">preview</span>`:""}</div>
        <div class="tl">${c.tagline}</div></div>
        <div class="arr">→</div>
      </button>`;
    }).join("")}
    <p class="meta" style="text-align:center;margin-top:18px;font-size:.8rem">Pathfinder 2e (Remaster) · unofficial fan tool<br>${escapeHtml(dataStampText())}</p>`;
  window.scrollTo(0,0);
}
function chooseClass(id){
  const switching = state.classId && state.classId!==id;
  state.classId=id;
  const c=CLASSES[id];
  if(switching || !state.prepared){ state.prepared=null; state.cast={}; }
  if(!hasFeature("divineFont")) state.font="heal";
  if(c.traditionFrom==="patron" && !state.patronTradition) state.patronTradition=c.defaultTradition||"occult";
  saveState();
  renderHeader();
  toast(`${c.icon} ${c.name} selected`);
  go(state.prepared ? "today" : "prepare");
}
function openClassPicker(){ showClassPicker(); }

/* ============================================================
   HEADER
   ============================================================ */
function renderHeader(){
  const c=activeClass(); if(!c) return;
  document.getElementById("charIcon").textContent=c.icon;
  document.getElementById("charNameHead").textContent=state.name||c.name;
  document.getElementById("charSub").textContent=
    `${c.name} · Pathfinder 2e (Remaster) · ${TRADITION_LABEL[activeTradition()]} list`;
  document.getElementById("stDC").textContent=spellDC();
  document.getElementById("stAtk").textContent=spellAtk();
  document.getElementById("stLvl").textContent=state.level;
}

/* ============================================================
   PREPARE VIEW  (prepared loadout OR spontaneous repertoire)
   ============================================================ */
function buildModOptions(sel, val){
  let html="";
  for(let i=-2;i<=8;i++){ html+=`<option value="${i}" ${i==val?"selected":""}>${i>=0?"+":""}${i}</option>`; }
  sel.innerHTML=html;
}
function setFont(f){ state.font=f; setFontButtons(); renderPrepSummary(); renderPrepDynamic(); }
function setFontButtons(){ document.querySelectorAll("#fontSeg button").forEach(b=>b.classList.toggle("on", b.dataset.font===state.font)); }
function setFontMod(v){ state.fontMod=Number(v); renderHeader(); renderPrepSummary(); renderPrepDynamic(); }
function setBloodline(v){ state.bloodline=v; renderHeader(); renderPrepSummary(); renderPrepDynamic(); }
function setDoctrine(v){ state.doctrine=v; renderHeader(); renderPrepSummary(); }
function setPatronTradition(v){ state.patronTradition=v; renderHeader(); renderPrepSummary(); renderPrepDynamic(); }

function renderPrepare(){
  const c=activeClass();
  document.getElementById("prepClassLine").innerHTML=
    `Playing a <b>${c.name}</b> (${TRADITION_LABEL[activeTradition()]} · ${c.keyAbility}). `+
    `<button class="linklike" onclick="openClassPicker()">Change class</button>`;
  document.getElementById("prepPreviewBanner").classList.toggle("hide", !c.preview);
  document.getElementById("keyAbilityName").textContent=c.keyAbility+" mod";
  document.getElementById("prepDynamicHead").textContent = isSpontaneous() ? "② Build your repertoire" : "② Prepare your spells";

  const lvlSel=document.getElementById("inLevel");
  lvlSel.innerHTML=Array.from({length:20},(_,i)=>i+1)
    .map(l=>`<option value="${l}" ${l==state.level?"selected":""}>Level ${l}</option>`).join("");
  buildModOptions(document.getElementById("inKey"), state.keyMod);
  document.getElementById("inName").value=state.name;

  lvlSel.onchange=e=>{ state.level=Number(e.target.value); refreshPrepDynamic(); };
  document.getElementById("inKey").onchange=e=>{ state.keyMod=Number(e.target.value); renderHeader(); renderPrepSummary(); };
  document.getElementById("inName").oninput=e=>{ state.name=e.target.value; renderHeader(); };

  renderCharExtra();
  refreshPrepDynamic();
}
function refreshPrepDynamic(){ renderHeader(); renderPrepSummary(); renderPrepDynamic(); }

/* Character-section extras: font (cleric), bloodline (sorcerer), patron tradition (witch) */
function renderCharExtra(){
  const c=activeClass();
  let html="";
  if(c.doctrines){
    html+=`<label class="field"><span class="name">Doctrine</span>
      <span class="hint">changes your spell DC at levels 7+</span>
      <select id="inDoctrine" onchange="setDoctrine(this.value)">
      ${Object.keys(c.doctrines).map(k=>`<option value="${k}" ${k===state.doctrine?"selected":""}>${c.doctrines[k].label}</option>`).join("")}
      </select></label>`;
  }
  if(hasFeature("divineFont")){
    html+=`<label class="field"><span class="name">Charisma mod</span>
      <span class="hint">sets your number of free Divine Font Heals/Harms</span>
      <select id="inFontMod" onchange="setFontMod(this.value)"></select></label>
      <label class="field"><span class="name">Divine Font</span>
      <span class="hint">Which one did you choose at level 1?</span></label>
      <div class="seg" id="fontSeg">
        <button data-font="heal" class="heal ${state.font==="heal"?"on":""}" onclick="setFont('heal')">✚ Healing Font</button>
        <button data-font="harm" class="harm ${state.font==="harm"?"on":""}" onclick="setFont('harm')">☠ Harmful Font</button>
      </div>`;
  }
  if(c.traditionFrom==="bloodline"){
    html+=`<label class="field"><span class="name">Bloodline</span>
      <span class="hint">sets your magical tradition</span>
      <select id="inBloodline" onchange="setBloodline(this.value)">
      ${Object.keys(BLOODLINES).map(k=>`<option value="${k}" ${k===state.bloodline?"selected":""}>${BLOODLINES[k].label} (${TRADITION_LABEL[BLOODLINES[k].tradition]})</option>`).join("")}
      </select></label>`;
  }
  if(c.traditionFrom==="patron"){
    const lbl=c.traditionChoiceLabel||"Patron's tradition";
    const hint=c.traditionChoiceHint||"your patron decides which list you cast from";
    html+=`<label class="field"><span class="name">${lbl}</span>
      <span class="hint">${hint}</span>
      <select id="inPatron" onchange="setPatronTradition(this.value)">
      ${["arcane","divine","occult","primal"].map(t=>`<option value="${t}" ${t===state.patronTradition?"selected":""}>${TRADITION_LABEL[t]}</option>`).join("")}
      </select></label>`;
  }
  document.getElementById("charExtra").innerHTML=html;
  if(hasFeature("divineFont")){ buildModOptions(document.getElementById("inFontMod"), state.fontMod); }
}

function renderPrepSummary(){
  const c=activeClass();
  const slots=classSlots(state.level);
  const hr=highestRank(state.level);
  const slotText=Object.keys(slots).map(Number).sort((a,b)=>a-b).map(r=>`<b>${slots[r]}×</b> rank ${r}`).join(" &nbsp;·&nbsp; ");
  let extra="";
  if(hasFeature("divineFont")){
    const fontName=state.font==="heal"?"Heal":"Harm";
    extra+=`<div style="margin-top:4px">${state.font==="heal"?"✚":"☠"} Divine Font: <b>${fontCount()}× ${fontName}</b> (free, heightened to rank ${hr})</div>`;
  }
  getFeatures("extraSlots").forEach(f=>{
    extra+=`<div style="margin-top:4px">${f.icon} ${f.label}: <b>+1</b> per rank</div>`;
  });
  getFeatures("dailyResource").forEach(f=>{
    extra+=`<div style="margin-top:4px">${f.icon} ${f.label}: <b>${f.uses}×</b>/day</div>`;
  });
  if(hasFocus()){
    extra+=`<div style="margin-top:4px">🔵 Focus pool: <b>${state.focusPool||1}</b> Focus Point${(state.focusPool||1)>1?"s":""} (focus spells heighten to rank ${focusRank()})</div>`;
  }
  document.getElementById("prepSummary").innerHTML=`
    <div class="meta" style="font-size:1rem">
      <div>🎯 <b>Spell DC ${spellDC()}</b> &nbsp;·&nbsp; Spell attack ${spellAtk()}</div>
      <div style="margin-top:8px">🪄 Cantrips ${isSpontaneous()?"known":""}: <b>${c.cantrips}</b></div>
      <div style="margin-top:4px">📜 ${isSpontaneous()?"Slots (cast any known spell of that rank)":"Spell slots"}: ${slotText||"—"}</div>
      ${extra}
    </div>`;
}

function spellOptions(maxRank, selected, includeRank0){
  let html=`<option value="">— choose —</option>`;
  const start=includeRank0?0:1;
  for(let r=maxRank;r>=start;r--){
    const list=spellsByRank(r);
    if(!list.length) continue;
    const sorted=list.slice().sort((a,b)=>a.name.localeCompare(b.name));
    const label = r===0?"Cantrips":(r===maxRank?`Rank ${r}`:`Rank ${r} (heightened to ${maxRank})`);
    html+=`<optgroup label="${label}">`;
    sorted.forEach(s=>{ const fm=(s.legacy&&s.legacy.length)?` (formerly ${s.legacy[0]})`:""; html+=`<option value="${s.slug}" ${s.slug===selected?"selected":""}>${escapeHtml(s.name+fm)}</option>`; });
    html+=`</optgroup>`;
  }
  return html;
}

/* ---- Prepare body: cantrips + (slots | repertoire) + focus ---- */
function renderPrepDynamic(){
  let html="";
  getFeatures("note").forEach(f=>{ html+=`<div class="banner"><b>${f.title}</b> — ${f.text}</div>`; });
  html+=cantripPicksHTML();
  html+= isSpontaneous() ? repertoireHTML() : preparedSlotsHTML();
  if(hasFocus()) html+=focusPicksHTML();
  document.getElementById("prepDynamic").innerHTML=html;
}

function setFocusPool(v){ state.focusPool=Number(v); renderPrepSummary(); }
/* Searchable checklist — type your domain/bloodline/order to filter a long list. */
function focusPicksHTML(){
  const prev=(state.prepared&&state.prepared.focus)||{};
  const known=new Set(prev.spells||[]);
  const pool=state.focusPool||1;
  const list=classFocusSpells().slice().sort((a,b)=> a.rank-b.rank || a.name.localeCompare(b.name));
  const rows=list.map(s=>{
    const rank=s.rank===0?"cantrip":("R"+s.rank);
    return `<label class="fcheck" data-hay="${escapeHtml((s.name+" "+s.traits.join(" ")).toLowerCase())}">
      <input type="checkbox" class="focusChk" value="${s.slug}" ${known.has(s.slug)?"checked":""}>
      <span class="fcname">${escapeHtml(s.name)}</span><span class="fcrank">${rank}</span></label>`;
  }).join("");
  return `<div class="slotgroup">
    <h3>🔵 Focus spells <span class="count" style="font-weight:600;color:var(--muted)">(pool of ${pool})</span></h3>
    <p class="meta">Focus spells cost <b>Focus Points</b> (shared pool, max 3) and auto-heighten to rank ${focusRank()}. <b>Refocus</b> restores points. Check the ones you know — type below to filter to your domain / bloodline / order.</p>
    <label class="field" style="margin:8px 0"><span class="name">Focus Point pool</span>
      <span class="hint">1 + 1 per extra focus feat, up to 3</span>
      <select id="inFocusPool" onchange="setFocusPool(this.value)">
        ${[1,2,3].map(n=>`<option value="${n}" ${n===pool?"selected":""}>${n} Focus Point${n>1?"s":""}</option>`).join("")}
      </select></label>
    <input type="text" id="focusFilter" placeholder="🔍 filter focus spells (name or trait)…" oninput="filterFocusChecklist(this.value)" aria-label="filter focus spells">
    <div class="focus-checklist" id="focusChecklist">${rows}</div>
  </div>`;
}
function filterFocusChecklist(q){
  q=(q||"").toLowerCase().trim();
  document.querySelectorAll("#focusChecklist .fcheck").forEach(el=>{
    el.classList.toggle("hide", !!q && !el.dataset.hay.includes(q));
  });
}
function gatherFocus(){
  const spells=[...document.querySelectorAll(".focusChk:checked")].map(c=>c.value);
  return spells.length ? { pool:Number(state.focusPool||1), spells } : null;
}

function cantripPicksHTML(){
  const c=activeClass();
  const prev=(state.prepared&&state.prepared.cantrips)||[];
  let html=`<div class="slotgroup"><h3>🪄 Cantrips (pick ${c.cantrips})</h3>`;
  for(let i=0;i<c.cantrips;i++){
    const sel=prev[i]||"", pid="cprev"+i;
    html+=`<div class="prep-slot">
      <div class="slotrow"><div class="num">∞</div>
        <select class="cantripSel" data-i="${i}" data-castrank="0" data-preview="${pid}" onchange="updatePreview(this)">${spellOptions(0, sel, true)}</select></div>
      <div class="prep-preview" id="${pid}">${spellPreviewHTML(findSpell(sel),0)}</div></div>`;
  }
  return html+`</div>`;
}

function preparedSlotsHTML(){
  const slots=classSlots(state.level);
  const hr=highestRank(state.level);
  const prevSlots=(state.prepared&&state.prepared.slots)||{};
  const prevExtra=(state.prepared&&state.prepared.extra)||{};
  let html="";

  if(hasFeature("divineFont")){
    const feat=getFeature("divineFont");
    const fontName=state.font==="heal"?"Heal":"Harm";
    const fontSpell=findSpell(state.font==="heal"?feat.healSlug:feat.harmSlug);
    html+=`<div class="slotgroup">
      <h3>${state.font==="heal"?"✚":"☠"} Divine Font — ${fontName} (free slots)</h3>
      <p class="meta">These ${fontCount()} castings are free and separate from your normal slots, usable only for <b>${fontName}</b>, auto-heightened to rank ${hr}.</p>`;
    for(let i=0;i<fontCount();i++){
      html+=`<div class="slotrow"><div class="num">${state.font==="heal"?"✚":"☠"}</div>
        <select disabled><option>${fontName} (rank ${hr})</option></select></div>`;
    }
    html+=`<div class="prep-preview">${spellPreviewHTML(fontSpell, hr)}</div></div>`;
  }

  const extraFeats=getFeatures("extraSlots");
  Object.keys(slots).map(Number).sort((a,b)=>b-a).forEach(r=>{
    const n=slots[r];
    const prev=prevSlots[r]||[];
    html+=`<div class="slotgroup"><h3>📜 Rank ${r} slots (${n})</h3>`;
    for(let i=0;i<n;i++){
      const sel=prev[i]||"", pid="sprev"+r+"_"+i;
      html+=`<div class="prep-slot">
        <div class="slotrow"><div class="num">${i+1}</div>
        <select class="slotSel" data-rank="${r}" data-i="${i}" data-castrank="${r}" data-preview="${pid}" onchange="updatePreview(this)">${spellOptions(r, sel, false)}</select></div>
        <div class="prep-preview" id="${pid}">${spellPreviewHTML(findSpell(sel),r)}</div></div>`;
    }
    // extra (e.g. wizard school) slots for this rank
    extraFeats.forEach(f=>{
      const ex=(prevExtra[f.key]&&prevExtra[f.key][r]&&prevExtra[f.key][r][0])||"";
      const pid="xprev"+f.key+r;
      html+=`<div class="prep-slot">
        <div class="slotrow"><div class="num">${f.icon}</div>
        <select class="extraSel" data-key="${f.key}" data-rank="${r}" data-castrank="${r}" data-preview="${pid}" onchange="updatePreview(this)">${spellOptions(r, ex, false)}</select></div>
        <div class="prep-preview" id="${pid}">${spellPreviewHTML(findSpell(ex),r)}</div></div>`;
    });
    html+=`</div>`;
  });
  return html;
}

let repUID=0;
function repRowHTML(rank, sel, sig){
  const pid="rprev"+(repUID++);
  const sigBtn = rank>=1 ? `<button type="button" class="sigstar ${sig?"on":""}" data-sig="${sig?1:0}" title="signature spell" aria-label="toggle signature spell" aria-pressed="${sig?"true":"false"}" onclick="toggleSig(this)">${sig?"★":"☆"}</button>` : "";
  return `<div class="prep-slot rep-row">
    <div class="slotrow">
      ${sigBtn}
      <select class="repSel" data-rank="${rank}" data-castrank="${rank}" data-preview="${pid}" onchange="updatePreview(this)">${spellOptions(rank, sel, rank===0)}</select>
      <button type="button" class="rmrow" title="remove" aria-label="remove spell" onclick="removeRepRow(this)">✕</button>
    </div>
    <div class="prep-preview" id="${pid}">${spellPreviewHTML(findSpell(sel),rank)}</div>
  </div>`;
}
function repertoireHTML(){
  const slots=classSlots(state.level);
  const hr=highestRank(state.level);
  const prevRep=(state.prepared&&state.prepared.repertoire)||{};
  let html=`<p class="meta">Add the spells your character knows of each rank. ★ marks a <b>signature spell</b> (castable in higher slots). There's no fixed limit here — match your character sheet.</p>`;
  for(let r=hr;r>=1;r--){
    const known=prevRep[r]||[];
    const count=Math.max(known.length, slots[r]||0);
    if(!count) continue;   // no slots of this rank (e.g. a summoner's shed low ranks) → no repertoire of that rank
    html+=`<div class="slotgroup" data-reprank="${r}">
      <h3>📜 Rank ${r} spells known <span class="count" style="font-weight:600;color:var(--muted)">(${slots[r]||0} slot${(slots[r]||0)===1?"":"s"}/day)</span></h3>
      <div class="repRows" id="repRows-${r}">`;
    for(let i=0;i<count;i++){
      const e=known[i]||{};
      html+=repRowHTML(r, e.slug||"", !!e.sig);
    }
    html+=`</div><button type="button" class="btn secondary addrow" onclick="addRepertoireRow(${r})">+ Add a rank ${r} spell</button></div>`;
  }
  return html;
}
function addRepertoireRow(rank){
  const box=document.getElementById("repRows-"+rank);
  if(box) box.insertAdjacentHTML("beforeend", repRowHTML(rank, "", false));
}
function removeRepRow(btn){ const row=btn.closest(".rep-row"); if(row) row.remove(); }
function toggleSig(btn){ const on=btn.dataset.sig==="1"; btn.dataset.sig=on?"0":"1"; btn.classList.toggle("on",!on); btn.textContent=on?"☆":"★"; }

/* ---- Save ---- */
function gatherRepertoire(){
  const rep={};
  document.querySelectorAll(".repSel").forEach(sel=>{
    if(!sel.value) return;
    const r=sel.dataset.rank;
    const star=sel.closest(".slotrow").querySelector(".sigstar");
    const sig = star ? star.dataset.sig==="1" : false;
    (rep[r]=rep[r]||[]).push({slug:sel.value, sig});
  });
  return rep;
}
function savePrep(){
  const cantrips=[...document.querySelectorAll(".cantripSel")].map(s=>s.value).filter(Boolean);
  const focus=hasFocus()?gatherFocus():null;
  state.cast={};
  if(isSpontaneous()){
    state.prepared={ type:"spontaneous", cantrips, repertoire:gatherRepertoire() };
  }else{
    const slots={};
    document.querySelectorAll(".slotSel").forEach(sel=>{ const r=sel.dataset.rank; (slots[r]=slots[r]||[]).push(sel.value); });
    const extra={};
    document.querySelectorAll(".extraSel").forEach(sel=>{ const k=sel.dataset.key,r=sel.dataset.rank; extra[k]=extra[k]||{}; (extra[k][r]=extra[k][r]||[]).push(sel.value); });
    const hr=highestRank(state.level);
    state.prepared={ type:"prepared", cantrips, slots, extra };
    if(hasFeature("divineFont")){
      const feat=getFeature("divineFont");
      state.prepared.divineFont={ font:state.font, fontName:state.font==="heal"?"Heal":"Harm",
        fontSlug:(state.font==="heal"?feat.healSlug:feat.harmSlug), fontRank:hr, fontCount:fontCount() };
    }
  }
  if(focus) state.prepared.focus=focus;
  saveState();
  toast("✨ Prepared for the day!");
  go("today");
}

/* ============================================================
   TODAY VIEW
   ============================================================ */
function castKey(kind,rank,i){ return kind+":"+rank+":"+i; }
function todayHeaderHTML(){
  const c=activeClass();
  return `<div class="card" style="text-align:center">
    <div style="font-size:1.1rem"><b>${escapeHtml(state.name||c.name)}</b> · ${c.name} · Level ${state.level}</div>
    <div class="meta" style="font-size:1rem;margin-top:6px">Spell DC <b>${spellDC()}</b> &nbsp;·&nbsp; Spell attack <b>${spellAtk()}</b></div>
    <button class="btn secondary" style="margin-top:12px" onclick="newDay()">🌅 Rest &amp; reset the day</button>
  </div>`;
}
function dailyResourceHTML(){
  let html="";
  getFeatures("dailyResource").forEach(f=>{
    const key="resource:"+f.key;
    const spent=state.cast[key]||0, remaining=f.uses-spent, done=remaining<=0;
    let pips=""; for(let k=0;k<f.uses;k++){ pips+=`<span class="pip ${k<remaining?"full":"spent"}"></span>`; }
    const btn=done?`<button class="castbtn zero" onclick="uncast('${key}')">↩ undo</button>`
                  :`<button class="castbtn" onclick="doCast('${key}',${f.uses})">Use</button>`;
    html+=`<div class="cast-card ${done?"spent":""}">
      <div class="cast-top"><div class="nm">${f.icon} ${f.label}</div><div class="uses">${pips} ${btn}</div></div>
      <div class="meta">${escapeHtml(f.note||"")}</div></div>`;
  });
  return html;
}

function renderToday(){
  renderHeader();
  const p=state.prepared;
  const empty=document.getElementById("todayEmpty");
  const content=document.getElementById("todayContent");
  if(!p){ empty.classList.remove("hide"); content.classList.add("hide"); return; }
  empty.classList.add("hide"); content.classList.remove("hide");
  state.cast=state.cast||{};
  content.innerHTML = sustainingBarHTML() + ((p.type==="spontaneous") ? renderTodaySpontaneous(p) : renderTodayPrepared(p)) + focusSectionHTML(p);
}

/* Focus spells: a shared Focus Point pool + at-will focus cantrips. */
function focusSectionHTML(p){
  const f=p.focus;
  if(!f || !f.spells || !f.spells.length) return "";
  const pool=f.pool||1, key="focuspool";
  const spent=state.cast[key]||0, remaining=pool-spent;
  const fr=focusRank();
  let pips=""; for(let k=0;k<pool;k++){ pips+=`<span class="pip ${k<remaining?"full":"spent"}"></span>`; }
  const refocus=`<button class="castbtn ${spent>0?"":"zero"}" ${spent>0?"":"disabled"} style="margin-left:8px" onclick="refocus()">↻ Refocus</button>`;
  let html=`<div class="sectionhead">🔵 Focus spells <span class="count">${remaining}/${pool} point${pool>1?"s":""}</span></div>
    <div style="margin:2px 0 8px"><span class="uses">${pips}${refocus}</span></div><div class="divider"></div>`;
  f.spells.forEach((slug,i)=>{
    const s=findSpell(slug); if(!s) return;
    const atWill = s.rank===0;
    const out = !atWill && remaining<=0;
    const castRank=fr;
    const heightNote=(castRank>s.rank)?`<span class="meta"> · ↑ heightened to rank ${castRank}</span>`:"";
    const btn = atWill ? `<span class="unlim">∞ at will</span>`
              : (out ? `<button class="castbtn zero" disabled>No points</button>`
                     : `<button class="castbtn" onclick="castFocus(${pool})">Cast</button>`);
    const detailsId="f_"+i;
    html+=`<div class="cast-card ${out?"spent":""}" style="border-left-color:#9b7fd6">
      <div class="cast-top"><div class="nm">🔵 ${escapeHtml(s.name)} ${heightNote}</div><div class="uses">${btn}</div></div>
      <div class="meta">${actionLabel(s.actions)}${s.save?` · 🛡 ${escapeHtml(s.save)}`:""}${s.range?` · ${escapeHtml(s.range)}`:""}</div>${damageChipHTML(s,castRank)?`<div class="dmgline">${damageChipHTML(s,castRank)}</div>`:""}
      <button class="detailsbtn" onclick="toggleDetails('${detailsId}',this)">Show details ▾</button>
      <div id="${detailsId}" class="hide" style="margin-top:10px">${spellCardHTML(s)}</div></div>`;
  });
  return html;
}
function castFocus(pool){ const key="focuspool"; state.cast[key]=Math.min(pool,(state.cast[key]||0)+1); saveState(); renderToday(); }
function refocus(){ state.cast["focuspool"]=0; saveState(); renderToday(); toast("🔵 Refocused"); }

function renderTodayPrepared(p){
  let html=todayHeaderHTML();
  html+=dailyResourceHTML();

  if(p.divineFont){
    const f=p.divineFont; const fontSpell=findSpell(f.fontSlug);
    html+=`<div class="sectionhead">${f.font==="heal"?"✚":"☠"} Divine Font — ${f.fontName} <span class="count">free</span></div><div class="divider"></div>`;
    html+=castableCard(fontSpell,"font",f.fontRank,f.fontCount,f.fontRank,0,{cls:f.font});
  }

  if(p.cantrips && p.cantrips.length){
    html+=`<div class="sectionhead">🪄 Cantrips <span class="count">unlimited</span></div><div class="divider"></div>`;
    p.cantrips.forEach((slug,i)=>{ const s=findSpell(slug); if(!s) return; html+=castableCard(s,"cantrip",0,Infinity,0,i); });
  }

  const extraFeats=getFeatures("extraSlots");
  Object.keys(p.slots||{}).map(Number).sort((a,b)=>b-a).forEach(r=>{
    const arr=(p.slots[r]||[]).filter(Boolean);
    const extras=[];
    extraFeats.forEach(f=>{ const v=p.extra&&p.extra[f.key]&&p.extra[f.key][r]&&p.extra[f.key][r][0]; if(v) extras.push({f,slug:v}); });
    if(!arr.length && !extras.length) return;
    html+=`<div class="sectionhead">📜 Rank ${r} spells <span class="count">${arr.length+extras.length} slot${(arr.length+extras.length)>1?"s":""}</span></div><div class="divider"></div>`;
    (p.slots[r]||[]).forEach((slug,i)=>{ if(!slug) return; const s=findSpell(slug); if(!s) return; html+=castableCard(s,"slot",r,1,r,i); });
    extras.forEach(({f,slug})=>{ const s=findSpell(slug); if(!s) return; html+=castableCard(s,"extra_"+f.key,r,1,r,0,{label:f.icon}); });
  });
  return html;
}

function renderTodaySpontaneous(p){
  let html=todayHeaderHTML();
  html+=dailyResourceHTML();

  if(p.cantrips && p.cantrips.length){
    html+=`<div class="sectionhead">🪄 Cantrips <span class="count">unlimited</span></div><div class="divider"></div>`;
    p.cantrips.forEach((slug,i)=>{ const s=findSpell(slug); if(!s) return; html+=castableCard(s,"cantrip",0,Infinity,0,i); });
  }

  const slots=classSlots(state.level);
  Object.keys(slots).map(Number).sort((a,b)=>b-a).forEach(R=>{
    const max=slots[R];
    const key="pool:"+R;
    const spent=state.cast[key]||0, remaining=max-spent;
    // available: spells known at R + signature spells from lower ranks (heightened)
    const known=(p.repertoire[R]||[]);
    const sigLower=[];
    for(let r=R-1;r>=1;r--){ (p.repertoire[r]||[]).forEach(e=>{ if(e.sig) sigLower.push({slug:e.slug, from:r}); }); }
    if(!known.length && !sigLower.length) return;

    let pips=""; for(let k=0;k<max;k++){ pips+=`<span class="pip ${k<remaining?"full":"spent"}"></span>`; }
    const undo = spent>0 ? `<button class="castbtn zero" style="margin-left:8px" onclick="uncastPool(${R})">↩</button>` : "";
    html+=`<div class="sectionhead">📜 Rank ${R} <span class="count">${remaining}/${max} slot${max>1?"s":""} left</span></div>
      <div style="margin:2px 0 8px"><span class="uses">${pips}${undo}</span></div><div class="divider"></div>`;

    known.forEach((e,i)=>{ const s=findSpell(e.slug); if(!s) return; html+=poolSpellCard(s,R,R,remaining,max,"k"+i,e.sig); });
    sigLower.forEach((e,i)=>{ const s=findSpell(e.slug); if(!s) return; html+=poolSpellCard(s,R,R,remaining,max,"s"+i,true); });
  });
  return html;
}

/* Card for a single prepared/font slot (uses=1) or unlimited cantrip. */
function castableCard(s, kind, rank, uses, castRank, idx, opts){
  opts=opts||{};
  const idStr=(idx!==undefined?idx:0);
  const key=castKey(kind,rank,idStr);
  const spent=(state.cast[key]||0);
  const unlimited=uses===Infinity;
  const remaining=unlimited?Infinity:(uses-spent);
  const isSpent=!unlimited && remaining<=0;
  const cls = opts.cls || (isSpent?"":cardClass(s));
  const heightNote=(castRank>s.rank)?`<span class="meta"> · cast at rank ${castRank}</span>`:"";
  const tag = opts.label?`<span class="slottag">${opts.label}</span> `:"";

  let usesHtml="";
  if(unlimited){ usesHtml=`<span class="unlim">∞ at will</span>`; }
  else if(uses===1){ usesHtml=isSpent?`<span class="meta">used</span>`:`<span class="pip full"></span>`; }
  else{ for(let k=0;k<uses;k++){ usesHtml+=`<span class="pip ${k<remaining?"full":"spent"}"></span>`; } }

  let btn="";
  if(!unlimited){
    btn=isSpent?`<button class="castbtn zero" onclick="uncast('${key}')">↩ undo</button>`
               :`<button class="castbtn" onclick="doCast('${key}',${uses})">Cast</button>`;
  }
  const detailsId="d_"+kind.replace(/[^a-z0-9]/gi,"")+"_"+rank+"_"+idStr;
  return `
  <div class="cast-card ${cls} ${isSpent?"spent":""}">
    <div class="cast-top">
      <div class="nm">${tag}${escapeHtml(s.name)} ${heightNote}</div>
      <div class="uses">${usesHtml} ${btn} ${sustainBtn(s)}</div>
    </div>
    <div class="meta">${actionLabel(s.actions)}${s.save?` · 🛡 ${escapeHtml(s.save)}`:""}${s.range?` · ${escapeHtml(s.range)}`:""}</div>${damageChipHTML(s,castRank)?`<div class="dmgline">${damageChipHTML(s,castRank)}</div>`:""}
    <button class="detailsbtn" onclick="toggleDetails('${detailsId}',this)">Show details ▾</button>
    <div id="${detailsId}" class="hide" style="margin-top:10px">${spellCardHTML(s,{cls})}</div>
  </div>`;
}

/* Card for a spontaneous spell drawing from a shared rank pool. */
function poolSpellCard(s, poolRank, castRank, remaining, max, uid, sig){
  const cls=cardClass(s);
  const out=remaining<=0;
  const heightNote=(castRank>s.rank)?`<span class="meta"> · ↑ heightened to rank ${castRank}</span>`:"";
  const star=sig?`<span class="sigstar on" style="border:none;background:none;padding:0">★</span> `:"";
  const btn=out?`<button class="castbtn zero" disabled>No slots</button>`
               :`<button class="castbtn" onclick="castPool(${poolRank},${max})">Cast</button>`;
  const detailsId="p_"+poolRank+"_"+uid;
  return `
  <div class="cast-card ${cls} ${out?"spent":""}">
    <div class="cast-top">
      <div class="nm">${star}${escapeHtml(s.name)} ${heightNote}</div>
      <div class="uses">${btn} ${sustainBtn(s)}</div>
    </div>
    <div class="meta">${actionLabel(s.actions)}${s.save?` · 🛡 ${escapeHtml(s.save)}`:""}${s.range?` · ${escapeHtml(s.range)}`:""}</div>${damageChipHTML(s,castRank)?`<div class="dmgline">${damageChipHTML(s,castRank)}</div>`:""}
    <button class="detailsbtn" onclick="toggleDetails('${detailsId}',this)">Show details ▾</button>
    <div id="${detailsId}" class="hide" style="margin-top:10px">${spellCardHTML(s)}</div>
  </div>`;
}

function toggleDetails(id,btn){ const el=document.getElementById(id); const open=el.classList.toggle("hide")===false; btn.textContent=open?"Hide details ▴":"Show details ▾"; }
function doCast(key,max){ state.cast[key]=(state.cast[key]||0)+1; if(state.cast[key]>max) state.cast[key]=max; saveState(); renderToday(); }
function uncast(key){ state.cast[key]=Math.max(0,(state.cast[key]||0)-1); saveState(); renderToday(); }
function castPool(rank,max){ const key="pool:"+rank; state.cast[key]=Math.min(max,(state.cast[key]||0)+1); saveState(); renderToday(); }
function uncastPool(rank){ const key="pool:"+rank; state.cast[key]=Math.max(0,(state.cast[key]||0)-1); saveState(); renderToday(); }
function newDay(){ if(confirm("Reset all spent slots for a new day? Your prepared list stays the same.")){ state.cast={}; state.sustaining=[]; saveState(); renderToday(); toast("🌅 A new day dawns!"); } }

/* ---- Sustained-spell tracker ---- */
function sustainBtn(s){
  if(!s || !s.sustained) return "";
  const on=(state.sustaining||[]).includes(s.slug);
  return on ? `<button class="susbtn on" onclick="endSustain('${s.slug}')">⏳ End</button>`
            : `<button class="susbtn" onclick="startSustain('${s.slug}')">⏳ Sustain</button>`;
}
function startSustain(slug){ state.sustaining=state.sustaining||[]; if(!state.sustaining.includes(slug)){ state.sustaining.push(slug); saveState(); renderToday(); toast("⏳ Now sustaining"); } }
function endSustain(slug){ state.sustaining=(state.sustaining||[]).filter(x=>x!==slug); saveState(); renderToday(); }
function sustainingBarHTML(){
  const list=(state.sustaining||[]).filter(slug=>findSpell(slug));
  if(!list.length) return "";
  return `<div class="card" style="border-left:6px solid var(--accent)">
    <div class="sectionhead" style="margin:0 0 6px">⏳ Sustaining now <span class="count">spend an action each turn</span></div>
    ${list.map(slug=>{const s=findSpell(slug); return `<div class="susrow"><span>${escapeHtml(s.name)}</span><button class="castbtn zero" onclick="endSustain('${slug}')">✓ End</button></div>`;}).join("")}
  </div>`;
}

/* ============================================================
   BROWSE VIEW
   ============================================================ */
let browseRank="all", browseSave="all", browseAction="all", browseTrait="", browseFiltersOpen=false;
function toggleBrowseFilters(){
  browseFiltersOpen=!browseFiltersOpen;
  const box=document.getElementById("browseFilters"), tog=document.getElementById("filterToggle");
  box.classList.toggle("hide", !browseFiltersOpen);
  tog.classList.toggle("on", browseFiltersOpen);
  tog.setAttribute("aria-expanded", browseFiltersOpen?"true":"false");
  if(browseFiltersOpen) renderBrowseFilters();
}
function setBrowseSave(v){ browseSave=v; renderBrowseFilters(); renderBrowse(); }
function setBrowseAction(v){ browseAction=v; renderBrowseFilters(); renderBrowse(); }
function setBrowseTrait(v){ browseTrait=(v||"").toLowerCase().trim(); renderBrowse(); }
function actionMatch(actions, f){
  if(f==="all") return true;
  if(f==="reaction") return actions==="reaction";
  if(!actions) return false;
  if(actions===f) return true;
  const m=String(actions).match(/^([1-3])\s*(?:to|or|–|-)\s*([1-3])$/);
  return m ? (+m[1]<=+f && +f<=+m[2]) : false;
}
function chipRow(label, current, opts, fn){
  return `<div class="fgroup"><span class="flabel">${label}</span>`+
    opts.map(([v,l])=>`<button class="chip ${current===v?"on":""}" onclick="${fn}('${v}')">${l}</button>`).join("")+`</div>`;
}
function renderBrowseFilters(){
  const box=document.getElementById("browseFilters");
  box.innerHTML =
    chipRow("Save", browseSave, [["all","Any"],["fortitude","Fort"],["reflex","Reflex"],["will","Will"],["none","No save"]], "setBrowseSave")+
    chipRow("Actions", browseAction, [["all","Any"],["1","◆"],["2","◆◆"],["3","◆◆◆"],["reaction","⤳"]], "setBrowseAction")+
    `<label class="field" style="margin:8px 0 2px"><span class="name" style="font-size:.9rem">Trait contains</span>
       <input type="text" id="traitFilter" placeholder="e.g. fire, healing, incapacitation" value="${escapeHtml(browseTrait)}" oninput="setBrowseTrait(this.value)"></label>`;
}
function renderRankChips(){
  const ranks=[["all","All"],["0","Cantrips"]];
  for(let r=1;r<=10;r++) ranks.push([String(r),"Rank "+r]);
  if(hasFocus()) ranks.push(["focus","🔵 Focus"]);
  ranks.push(["rituals","📜 Rituals"]);
  document.getElementById("rankChips").innerHTML=
    ranks.map(([v,l])=>`<button class="chip ${browseRank===v?"on":""}" onclick="setBrowseRank('${v}')">${l}</button>`).join("");
}
function setBrowseRank(r){ browseRank=r; renderRankChips(); renderBrowse(); }
function renderBrowse(){
  renderRankChips();
  const focusMode = browseRank==="focus";
  const ritualMode = browseRank==="rituals";
  document.getElementById("browseTitle").textContent= ritualMode
    ? "Rituals (any class)"
    : focusMode
    ? `${activeClass().name} focus spells`
    : `All ${TRADITION_LABEL[activeTradition()]} spells`;
  const q=(document.getElementById("search").value||"").toLowerCase().trim();
  let list = ritualMode ? SPELLS.filter(s=>s.ritual) : focusMode ? classFocusSpells() : classSpells();
  if(!focusMode && !ritualMode && browseRank!=="all") list=list.filter(s=>s.rank===Number(browseRank));
  if(q) list=list.filter(s=> s.name.toLowerCase().includes(q) || (s.description||"").toLowerCase().includes(q) || s.traits.join(" ").toLowerCase().includes(q) || (s.legacy||[]).some(n=>n.toLowerCase().includes(q)));
  if(browseSave!=="all") list = (browseSave==="none") ? list.filter(s=>!s.save) : list.filter(s=>s.save && s.save.toLowerCase().includes(browseSave));
  if(browseAction!=="all") list=list.filter(s=>actionMatch(s.actions, browseAction));
  if(browseTrait) list=list.filter(s=>s.traits.some(t=>t.toLowerCase().includes(browseTrait)));
  list.sort((a,b)=> a.rank-b.rank || a.name.localeCompare(b.name));
  const out=document.getElementById("browseList");
  if(!list.length){ out.innerHTML=`<div class="empty">No spells match “${escapeHtml(q)}”.</div>`; return; }
  let html=`<p class="meta" style="margin:0 0 8px">${list.length} spell${list.length>1?"s":""} · tap one to expand</p>`;
  let curRank=null;
  list.forEach(s=>{
    if(s.rank!==curRank){ curRank=s.rank; const lbl=curRank===0?(focusMode?"Focus cantrips":"Cantrips"):("Rank "+curRank);
      html+=`<div class="sectionhead">${lbl} <span class="count">${list.filter(x=>x.rank===curRank).length}</span></div><div class="divider"></div>`; }
    html+=browseRowHTML(s);
  });
  out.innerHTML=html;
}
/* Lightweight collapsed row; the full card renders on demand when tapped. */
function browseRowHTML(s){
  const save=s.save?` · 🛡 ${escapeHtml(s.save)}`:"";
  const note=legacyNote(s)?` <span class="formerly">${escapeHtml(legacyNote(s))}</span>`:"";
  return `<div class="browse-row rank${s.rank}">
    <button class="browse-row-head" onclick="toggleBrowse('${s.slug}',this)">
      <span class="brn">${escapeHtml(s.name)}${s.focus?' <span class="brfocus">focus</span>':''}${note}</span>
      <span class="brmeta">${actionLabel(s.actions)}${save}</span>
    </button>
    <div class="browse-card hide" id="bc_${s.slug}"></div>
  </div>`;
}
function toggleBrowse(slug,btn){
  const box=document.getElementById("bc_"+slug);
  if(box.classList.contains("hide")){
    if(!box.innerHTML) box.innerHTML=spellCardHTML(findSpell(slug));
    box.classList.remove("hide"); btn.classList.add("open");
  } else { box.classList.add("hide"); btn.classList.remove("open"); }
}

/* ============================================================
   HELP VIEW
   ============================================================ */
function renderHelp(){
  const c=activeClass();
  const items=(c.help||[]).concat(CORE_HELP);
  document.getElementById("helpClassName").textContent=c.name;
  document.getElementById("helpContent").innerHTML=items.map(([q,a])=>
    `<details class="help"><summary>${q}</summary><div class="body">${a}</div></details>`).join("");
}

/* ============================================================
   INIT
   ============================================================ */
/* PWA / offline support.
   When hosted over http(s) (e.g. GitHub Pages) we register a service worker so
   the app keeps working offline and can be installed ("Add to Home Screen").
   The browser fires `beforeinstallprompt` when install is available; we capture
   it and reveal our own Install button instead of relying on a browser banner. */
let deferredInstall=null;
function isHeadless(){ return /jsdom/i.test((navigator&&navigator.userAgent)||""); }

function setupInstall(){
  try{
    if(isHeadless()) return; // test harness: skip browser-only wiring
    const proto=(location&&location.protocol)||"";
    if((proto==="http:"||proto==="https:")&&"serviceWorker" in navigator){
      window.addEventListener("load",()=>{
        navigator.serviceWorker.register("sw.js").catch(()=>{});
      });
    }
    window.addEventListener("beforeinstallprompt",(e)=>{
      e.preventDefault();          // suppress the default mini-infobar
      deferredInstall=e;           // stash it for our own button
      showInstallButton(true);
    });
    window.addEventListener("appinstalled",()=>{
      deferredInstall=null;
      showInstallButton(false);
    });
  }catch(e){ /* unsupported environment — offline copy still works */ }
}

function showInstallButton(on){
  const b=document.getElementById("installBtn");
  if(b) b.style.display=on?"":"none";
}

/* Trigger the browser's native install flow (only available after the browser
   has fired beforeinstallprompt — desktop Chrome/Edge, Android). */
function installApp(){
  if(deferredInstall&&deferredInstall.prompt){
    deferredInstall.prompt();
    if(deferredInstall.userChoice&&deferredInstall.userChoice.then){
      deferredInstall.userChoice.then(()=>{ deferredInstall=null; showInstallButton(false); });
    }else{ deferredInstall=null; showInstallButton(false); }
    return;
  }
  alert("To install: open your browser menu and choose “Add to Home Screen” (or “Install app”). On iPhone/iPad use Safari’s Share button → “Add to Home Screen”.");
}

/* Download the whole spellbook as one self-contained file the player can keep
   and open offline forever. Prefer fetching the served page (the clean inlined
   build); fall back to serialising the live DOM when fetch is unavailable
   (e.g. already opened from a file://). */
function downloadOffline(){
  const save=(html)=>{
    try{
      const blob=new Blob([html],{type:"text/html"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url; a.download="pf2e-spellbook.html";
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch(e){ alert("Couldn’t start the download automatically. Use your browser’s “Save page as…” to keep an offline copy."); }
  };
  const fallback=()=>{
    const dt=document.doctype?"<!DOCTYPE html>\n":"";
    save(dt+document.documentElement.outerHTML);
  };
  try{
    if(typeof fetch==="function"){
      fetch(location.href,{cache:"no-store"})
        .then(r=>r.ok?r.text():Promise.reject())
        .then(t=>save(t))
        .catch(fallback);
    }else{ fallback(); }
  }catch(e){ fallback(); }
}

function init(){
  setupInstall();
  if(!state.classId){ showClassPicker(); }
  else { renderHeader(); go(state.prepared?"today":"prepare"); }
}
init();
