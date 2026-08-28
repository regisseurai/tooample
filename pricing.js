/* ================================================================
   pricing.js — renders the Studio / Pre-Wedding / Location / Wedding
   price cards on packages.html and book.html from data/packages.json,
   so editing prices/copies in the CMS actually reflects on the site.

   Fallback array below is only used if the fetch fails (offline etc).
   Edit data/packages.json via /admin — not this file — for day-to-day
   price changes.
   ================================================================ */
(function(){

/* Mirrors data/packages.json exactly — only used if that fetch fails. */
var PACKAGES = [
  {group:'Studio Session',   name:'Studio Session — Single Look',  price:100000, note:'1 outfit · 4 edited copies'},
  {group:'Studio Session',   name:'Studio Session — Double Look',  price:180000, note:'2 outfits · 8 edited copies'},
  {group:'Studio Session',   name:'Studio Session — Triple Look',  price:280000, note:'3 outfits · 12 edited copies'},
  {group:'Pre-Wedding',      name:'Pre-Wedding — Single Look',     price:300000, note:'20 edited images'},
  {group:'Pre-Wedding',      name:'Pre-Wedding — Double Look',     price:450000, note:'40 edited images'},
  {group:'Pre-Wedding',      name:'Pre-Wedding — Triple Look',     price:650000, note:'60 edited images'},
  {group:'Location / Event', name:'Location / Event — Single Look',price:150000, note:'4 edited copies'},
  {group:'Location / Event', name:'Location / Event — Double Look',price:250000, note:'8 edited copies'},
  {group:'Location / Event', name:'Location / Event — Triple Look',price:380000, note:'12 edited copies'},
  {group:'Wedding',          name:'Wedding Coverage — Bronze',     price:800000,  note:'Photo + Video'},
  {group:'Wedding',          name:'Wedding Coverage — Silver',     price:1000000, note:'Photo + Video'},
  {group:'Wedding',          name:'Wedding Coverage — Gold',       price:1500000, note:'Photo + Video'}
];

/* Layout/copy that isn't pricing data — descriptions, bullet extras, badge.
   {outfits}/{copies}/{images} tokens are expanded from the package's own
   name + note at render time, so the numbers always match packages.json. */
var TEMPLATES = {
  'Studio Session': {
    'Single Look': {cat:'Studio · 1 Outfit', desc:'One styled outfit, studio-lit and directed.',
      bullets:['{outfits}','{copies}','Studio lighting &amp; direction','Online gallery delivery']},
    'Double Look': {cat:'Studio · 2 Outfits', desc:'Two outfits for more range and variety.', badge:true,
      bullets:['{outfits}','{copies}','Multiple backdrops','Studio lighting &amp; direction','Online gallery delivery']},
    'Triple Look': {cat:'Studio · 3 Outfits', desc:'Three outfits — the full studio session.',
      bullets:['{outfits}','{copies}','Multiple backdrops &amp; setups','Priority retouching','Online gallery delivery']}
  },
  'Pre-Wedding': {
    'Single Look': {cat:'Pre-Wedding · 1 outfit / look', desc:'One styled look for the two of you.',
      bullets:['{outfits}','{images}','Professional lighting &amp; direction','Online gallery delivery']},
    'Double Look': {cat:'Pre-Wedding · 2 outfits / looks', desc:'Two looks, fully directed.', badge:true,
      bullets:['{outfits}','{images}','Professional lighting &amp; direction','Online gallery delivery']},
    'Triple Look': {cat:'Pre-Wedding · 3 outfits / looks', desc:'Three looks — the complete love story.',
      bullets:['{outfits}','{images}','Professional lighting &amp; direction','Online gallery delivery']}
  },
  'Location / Event': {
    'Single Look': {cat:'Location · 1 outfit / look', desc:'One outfit, shot on location.',
      bullets:['{outfits}','{copies}','Professional lighting &amp; direction','Online gallery delivery']},
    'Double Look': {cat:'Location · 2 outfits / looks', desc:'Two outfits for more range.', badge:true,
      bullets:['{outfits}','{copies}','Professional lighting &amp; direction','Online gallery delivery']},
    'Triple Look': {cat:'Location · 3 outfits / looks', desc:'Three outfits — the full location session.',
      bullets:['{outfits}','{copies}','Professional lighting &amp; direction','Online gallery delivery']}
  },
  'Wedding': {
    'Bronze': {cat:'Complete · Bronze', desc:'Photo &amp; film coverage — the essentials.',
      bullets:['1 photographer + 1 cinematographer','Up to 6 hours coverage','150 edited images','3-min highlight film','Private online gallery']},
    'Silver': {cat:'Complete · Silver', desc:'Fuller photo &amp; film coverage of the day.', badge:true,
      bullets:['2 photographers + 1 cinematographer','Up to 10 hours coverage','300 edited images','7-min film + teaser','Premium printed album']},
    'Gold':   {cat:'Complete · Gold', desc:'Full crew — the signature wedding package.',
      bullets:['2 photographers + 2 cinematographers','Full-day coverage','500+ edited images','10-min feature film + teaser','Pre-wedding shoot included','Drone coverage + premium album']}
  }
};

var GROUP_LABEL = {'Studio Session':'Studio','Pre-Wedding':'Pre-Wedding','Location / Event':'Location','Wedding':'Wedding Coverage'};
var GROUP_CONTAINER = {'Studio Session':'studio','Pre-Wedding':'prewed','Location / Event':'location','Wedding':'wedding'};

function fmtN(n){ return Number(n).toLocaleString(); }
/* json "name" is the full "Group — Tier" string (e.g. "Studio Session — Single Look").
   The card only shows the tier part, and that's also the template lookup key. */
function shortName(name){
  var parts = String(name||'').split(/\s*—\s*/);
  return parts.length>1 ? parts[parts.length-1].trim() : String(name||'').trim();
}
function outfitsFromName(name){
  if(/Single/i.test(name)) return 1;
  if(/Double/i.test(name)) return 2;
  if(/Triple/i.test(name)) return 3;
  return null;
}
function parseCopies(note){ var m=(note||'').match(/(\d+)\s*edited cop/i); return m?+m[1]:null; }
function parseImages(note){ var m=(note||'').match(/(\d+)\s*edited imag/i); return m?+m[1]:null; }

function expandBullet(tok, outfits, copies, images){
  if(tok==='{outfits}' && outfits!=null) return outfits+' outfit'+(outfits>1?'s':'')+' / look'+(outfits>1?'s':'');
  if(tok==='{copies}'  && copies!=null)  return copies+' fully-edited high-res copies';
  if(tok==='{images}'  && images!=null)  return images+' edited images';
  if(tok.charAt(0)==='{') return null; // token had no data to fill — drop the line
  return tok;
}

function buildLabel(pkg, tier, outfits, copies){
  var prefix = GROUP_LABEL[pkg.group] || pkg.group;
  if(pkg.group==='Studio Session' && outfits && copies!=null){
    return prefix+' — '+tier+' ('+outfits+' outfit'+(outfits>1?'s':'')+', '+copies+' copies) — \u20a6'+fmtN(pkg.price);
  }
  return prefix+' — '+tier;
}

function buildCTA(pkg, mode, label, badge){
  var cls = badge?'btn btn-gold':'btn btn-ghost';
  var arrow = badge?' <span class="arr">\u2192</span>':'';
  var escLabel = label.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  if(mode==='packages'){
    if(pkg.group==='Studio Session'){
      return '<a href="book.html?type=Studio%20Session&pkg='+encodeURIComponent(label)+'" class="'+cls+'">Select'+arrow+'</a>';
    }
    if(pkg.group==='Wedding'){
      return '<a href="book.html?pkg='+encodeURIComponent(label)+'" class="'+cls+'">Select'+arrow+'</a>';
    }
    return '<a href="javascript:void(0)" onclick="openBookModal(\''+escLabel+'\')" class="'+cls+'">Book this'+arrow+'</a>';
  }
  // book.html — always opens the on-page modal
  var txt = (pkg.group==='Location / Event' || pkg.group==='Pre-Wedding') ? 'Book this' : 'Select';
  return '<a href="javascript:void(0)" onclick="openBookModal(\''+escLabel+'\')" class="'+cls+'">'+txt+arrow+'</a>';
}

function cardHTML(pkg, mode){
  var tier = shortName(pkg.name);
  var group = TEMPLATES[pkg.group]; if(!group) return '';
  var tpl = group[tier]; if(!tpl) return '';
  var outfits = outfitsFromName(tier);
  var copies  = parseCopies(pkg.note);
  var images  = parseImages(pkg.note);
  var bullets = (tpl.bullets||[])
    .map(function(t){ return expandBullet(t, outfits, copies, images); })
    .filter(function(t){ return t; });
  var label = buildLabel(pkg, tier, outfits, copies);
  var badge = !!tpl.badge;
  return '<div class="plan'+(badge?' feat':'')+'">'+
    (badge?'<span class="badge">Most booked</span>':'')+
    '<span class="cat">'+tpl.cat+'</span>'+
    '<div class="pname">'+tier+'</div>'+
    '<p class="desc">'+tpl.desc+'</p>'+
    '<div class="amt"><span class="cur">\u20a6</span>'+fmtN(pkg.price)+'</div>'+
    '<div class="per">'+(pkg.note||'')+'</div>'+
    '<ul>'+bullets.map(function(b){return '<li>'+b+'</li>';}).join('')+'</ul>'+
    '<div class="pbtn">'+buildCTA(pkg, mode, label, badge)+'</div>'+
  '</div>';
}

function renderAll(mode){
  var byGroup = {};
  PACKAGES.forEach(function(p){ (byGroup[p.group]=byGroup[p.group]||[]).push(p); });
  Object.keys(GROUP_CONTAINER).forEach(function(group){
    var el = document.getElementById(GROUP_CONTAINER[group]);
    if(!el) return;
    var items = byGroup[group]||[];
    el.innerHTML = items.map(function(p){ return cardHTML(p, mode); }).join('');
  });
}

async function loadPackagesJSON(){
  try{
    var r = await fetch('data/packages.json',{cache:'no-store'});
    if(r.ok){
      var d = await r.json();
      if(d && Array.isArray(d.packages) && d.packages.length) return d.packages;
    }
  }catch(e){}
  return null;
}

window.TooAmplePricing = {
  init: function(mode){
    renderAll(mode); // instant paint with fallback data
    loadPackagesJSON().then(function(pkgs){
      if(pkgs){ PACKAGES = pkgs; renderAll(mode); }
    });
  }
};

})();
