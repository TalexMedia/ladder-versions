/* Which One Was Better? · B. The Gap Ladder
   Every figure comes from window.FACTS (../shared/facts.js). Ratios are computed here, never typed. */
(function () {
  'use strict';
  var F = window.FACTS;
  var app = document.getElementById('app');
  if (!F) { app.textContent = 'The page data did not load. Please refresh.'; return; }

  var R = F.rounds, EC = F.evansCopyDecisions;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var KEY = 'wowb-v11-b-gap-ladder';

  /* ---------- helpers ---------- */
  function h(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function hx(tag, cls, html) { var e = h(tag, cls); e.innerHTML = html; return e; }
  function fmt(n) { return Number(n).toLocaleString('en-US'); }
  function wait(ms, fn) { return setTimeout(fn, reduce ? 0 : ms); }
  function bring(node, block) {
    if (!node) return;
    try { node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: block || 'start' }); } catch (e) { node.scrollIntoView(); }
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // "about 7", "about 45", "about 195", "nearly 100"
  function approx(r) {
    var up = r >= 50 ? Math.ceil(r / 50) * 50 : 0;
    if (up && (up - r) / up < 0.02) return 'nearly ' + up;
    return 'about ' + (r < 100 ? Math.round(r) : Math.round(r / 5) * 5);
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function countUp(node, to, dur, from) {
    from = from || 0;
    var write = function (v) { node.textContent = fmt(Math.round(v)); };
    if (reduce) { write(to); return; }
    var t0 = null;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      write(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    setTimeout(function () { write(to); }, dur + 250); // end state even if animation frames are frozen
  }
  function still(id, n) { return 'https://i.ytimg.com/vi/' + id + '/hq' + n + '.jpg'; }

  var ICON = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="rgba(255,255,255,.18)"/><path d="M9.5 7.5v9l7-4.5z" fill="currentColor"/></svg>',
    mute: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6M16 9l6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    tv: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="m8 2 4 4 4-4"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  /* ---------- derived figures, all from FACTS ---------- */
  var r1 = R[0], ricos = r1.sides.ricos, tide = r1.sides.tideSpot, EPS = r1.episodes;
  var ep1 = EPS[0].views;
  var seriesTotal = ricos.totalViews;
  var ratio1 = ep1 / tide.views, ratio1all = seriesTotal / tide.views;
  var epsAboveTide = EPS.filter(function (e) { return e.views > tide.views; }).length;
  var r2 = R[1], mayhem = r2.sides.mayhem, cf = r2.sides.checkFirst;
  var r3 = R[2], jump = r3.sides.stratos, cartoon = r3.sides.confession, ratio3 = jump.views / cartoon.views;
  var r4 = R[3], yf = r4.sides.yetiFilm, pbr = r4.sides.pbrSponsor, ratio4 = yf.views / pbr.views;
  var evBy = function (stat) { return r2.evidence.filter(function (e) { return e.stat === stat; })[0]; };
  // The other two Check First spots. Ids come from the v10 round 2 research (captions in v10 review/evidence).
  var CF_SPOTS = [
    { name: cf.campaignSpots[0], id: cf.videoId },
    { name: cf.campaignSpots[1], id: '0bNDXPzc100' },
    { name: cf.campaignSpots[2], id: 'oalJ2-bFETI' }
  ];

  /* ---------- the size chips ---------- */
  var CHIPS = [
    { t: 'About the same', lo: 0, hi: 2, say: 'about the same views' },
    { t: '2 to 5 times', lo: 2, hi: 5, say: '2 to 5 times the views of' },
    { t: '5 to 20 times', lo: 5, hi: 20, say: '5 to 20 times the views of' },
    { t: '20 to 100 times', lo: 20, hi: 100, say: '20 to 100 times the views of' },
    { t: '100 to 500 times', lo: 100, hi: 500, say: '100 to 500 times the views of' },
    { t: '500 times or more', lo: 500, hi: Infinity, say: 'at least 500 times the views of' }
  ];
  var TICKS = [1, 2, 5, 20, 100, 500];
  function band(r) { for (var i = 0; i < CHIPS.length; i++) if (r >= CHIPS[i].lo && r < CHIPS[i].hi) return i; return 0; }
  function scalePos(r) { // percent along the six equal bands, log inside each band
    var i = band(r), lo = Math.max(1, CHIPS[i].lo), hi = CHIPS[i].hi === Infinity ? 2500 : CHIPS[i].hi;
    var f = Math.min(1, Math.max(0, Math.log(Math.max(r, 1) / lo) / Math.log(hi / lo)));
    return (i + f) / CHIPS.length * 100;
  }

  /* ---------- the four rounds ---------- */
  var ROUNDS = [
    {
      kind: 'gap', company: r1.company, head: 'P&G made both of these films.',
      q: 'Which film got more views, and how many times more?',
      hint: 'Tap the film you think got more views.',
      winner: 'ricos', ratio: ratio1,
      sides: {
        ricos: { id: ricos.videoId, label: ricos.videoLabel, title: "Rico's Tacos, episode 1", short: "Rico's Tacos episode 1",
          desc: 'Episode 1 of a scripted comedy series about a taco stand.', chan: 'On MinivelaTV', stills: [1, 3, 2] },
        tideSpot: { id: tide.videoId, label: tide.videoLabel, title: 'School Lunch', short: 'School Lunch',
          desc: 'A Tide commercial.', chan: "On Tide's channel", stills: [1, 2, 3] }
      }
    },
    {
      kind: 'pick', company: r2.company, head: 'Allstate made both of these campaigns.', pre: 'memory',
      q: 'Which Allstate campaign do more people remember?',
      hint: 'Tap a campaign to choose it.',
      winner: 'mayhem',
      sides: {
        mayhem: { id: mayhem.videoId, label: mayhem.videoLabel, title: 'Mayhem: Action Hero', short: 'Mayhem',
          desc: mayhem.label + '.', chan: '', stills: [3, 1, 2] },
        checkFirst: { id: cf.videoId, label: cf.videoLabel, title: 'Check First: Swim Meet', short: 'Check First',
          desc: cf.label + '.', chan: '', stills: [1, 2, 3] }
      }
    },
    {
      kind: 'gap', company: r3.company, head: 'Red Bull made both of these films.', pre: 'test',
      q: "Both films are on Red Bull's own channel. Which film got more views, and how many times more?",
      hint: 'Tap the film you think got more views.',
      winner: 'stratos', ratio: ratio3,
      sides: {
        stratos: { id: jump.videoId, label: jump.videoLabel, title: 'Stratos, the jump', short: 'Stratos',
          desc: jump.label + '.', chan: "On Red Bull's channel", stills: [1, 2, 3] },
        confession: { id: cartoon.videoId, label: cartoon.videoLabel, title: 'Confession, the cartoon', short: 'Confession',
          desc: 'A Gives You Wiiings cartoon commercial from 2011.', chan: "On Red Bull's channel", stills: [2, 1, 3] }
      }
    },
    {
      kind: 'pick', company: r4.company, head: "YETI's name is on both of these films.", post: 'channel',
      q: 'Which film did more for YETI?',
      hint: 'Tap a film to choose it.',
      winner: 'yetiFilm',
      sides: {
        yetiFilm: { id: yf.videoId, label: yf.videoLabel, title: 'A Thousand Casts', short: 'A Thousand Casts',
          desc: 'A YETI Presents documentary about a fly fishing trip to Bhutan.', chan: '', stills: [1, 3, 2] },
        pbrSponsor: { id: pbr.videoId, label: pbr.videoLabel, title: '2026 PBR YETI Bucking Bull Champion', short: 'the PBR award film',
          desc: "YETI's name on a bull riding award.", chan: '', stills: [3, 2, 1] }
      }
    }
  ];

  /* ---------- state ---------- */
  var S = { order: [0, 1, 2, 3].map(function () { return Math.random() < 0.5; }), res: [null, null, null, null], played: [] };
  function load() {
    try {
      var raw = localStorage.getItem(KEY); if (!raw) return null;
      var d = JSON.parse(raw); if (!d || Date.now() - d.t > 864e5) return null; return d;
    } catch (e) { return null; }
  }
  function save(next) {
    try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), order: S.order, res: S.res, played: S.played, next: next })); } catch (e) { /* storage blocked */ }
  }
  function clearSave() { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }
  function points() { var p = 0; S.res.forEach(function (r) { if (r) p += (r.call ? 1 : 0) + (r.why ? 1 : 0); }); return p; }
  function maxPoints() { return S.played.length * 2; }

  /* ---------- header rail ---------- */
  var railEl = document.getElementById('rail'), hdr = document.querySelector('.hdr'), scoreN = document.getElementById('scoreN'), scoreBox = document.getElementById('score');
  var RAIL_SHORT = ['Repetition', 'A cast', 'For the audience', 'Own the show'];
  R.forEach(function (r, i) {
    var li = h('li', 'rung'); li.title = r.rung;
    var rt = h('span', 'rt'); rt.appendChild(h('span', 'rn', String(i + 1))); rt.appendChild(h('span', 'rl', RAIL_SHORT[i]));
    li.appendChild(rt); li.appendChild(h('span', 'bar'));
    railEl.appendChild(li);
  });
  function paintRail(cur) {
    Array.prototype.forEach.call(railEl.children, function (li, i) {
      li.classList.toggle('cur', i === cur && !S.res[i]);
      li.classList.toggle('done', !!S.res[i] && S.res[i].done);
    });
    scoreN.textContent = points();
  }
  function bumpScore() { scoreN.textContent = points(); scoreBox.classList.remove('bump'); void scoreBox.offsetWidth; scoreBox.classList.add('bump'); }
  window.addEventListener('scroll', function () { hdr.classList.toggle('scrolled', window.scrollY > 8); }, { passive: true });

  /* ---------- poster stills (no video loads) ---------- */
  var posters = [];
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target._vis = e.isIntersecting; });
  }) : null;
  function makePoster(id, order, alt) {
    var p = h('div', 'poster');
    order.forEach(function (n, k) {
      var img = h('img'); img.alt = k === 0 ? alt : ''; img.loading = 'lazy'; img.decoding = 'async';
      img.src = still(id, n); if (k === 0) img.className = 'on';
      p.appendChild(img);
    });
    p._k = 0; p._vis = true; posters.push(p); if (io) io.observe(p);
    return p;
  }
  if (!reduce) setInterval(function () {
    posters = posters.filter(function (p) { return p.isConnected; });
    posters.forEach(function (p) {
      if (!p._vis || document.hidden) return;
      var imgs = p.querySelectorAll('img'); if (imgs.length < 2) return;
      imgs[p._k].classList.remove('on'); p._k = (p._k + 1) % imgs.length; imgs[p._k].classList.add('on');
    });
  }, 1700);

  /* ---------- muted YouTube player ---------- */
  var PV = { autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0, playsinline: 1, rel: 0, cc_load_policy: 1, cc_lang_pref: 'en' };
  var apiState = 0, apiQueue = [];
  function loadApi() {
    if (apiState) return; apiState = 1;
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () { apiState = 2; if (prev) try { prev(); } catch (e) { /* ignore */ } var q = apiQueue; apiQueue = []; q.forEach(function (fn) { fn(); }); };
    var s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.async = true; document.head.appendChild(s);
  }
  function embedUrl(id) {
    var q = Object.keys(PV).map(function (k) { return k + '=' + encodeURIComponent(PV[k]); }).join('&');
    return 'https://www.youtube-nocookie.com/embed/' + id + '?' + q + '&enablejsapi=1&origin=' + encodeURIComponent(location.origin);
  }
  function wirePlayer(ctx, key, player) {
    ctx.players[key] = player;
  }
  function playerEvents(ctx, key) {
    return {
      onReady: function (e) { try { e.target.mute(); e.target.playVideo(); } catch (x) { /* ignore */ } },
      onStateChange: function (e) {
        try { if (e.data === 1) e.target.mute(); } catch (x) { /* ignore */ }
        if (ctx.active === key) setPauseLabel(ctx, e.data === 1 || e.data === 3);
      }
    };
  }
  // Called only from a tap handler: the iframe is created right here, inside the tap.
  function createPlayer(ctx, key, host, id, title) {
    if (apiState === 2 && window.YT && window.YT.Player) {
      wirePlayer(ctx, key, new window.YT.Player(host, { host: 'https://www.youtube-nocookie.com', videoId: id, playerVars: PV, events: playerEvents(ctx, key) }));
      var f = host.tagName === 'IFRAME' ? host : ctx.stage.querySelector('[data-slot="' + key + '"] iframe');
      if (f) { f.title = title; f.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture'); }
    } else {
      var ifr = document.createElement('iframe');
      ifr.src = embedUrl(id); ifr.title = title; ifr.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
      host.parentNode.replaceChild(ifr, host);
      var attach = function () { try { wirePlayer(ctx, key, new window.YT.Player(ifr, { events: playerEvents(ctx, key) })); } catch (x) { /* ignore */ } };
      if (apiState === 2) attach(); else { apiQueue.push(attach); loadApi(); }
    }
  }
  function setPauseLabel(ctx, playing) { if (ctx.pauseBtn) ctx.pauseBtn.textContent = playing ? 'Pause' : 'Play'; ctx.isPlaying = playing; }
  function buildStage(ctx) {
    var st = h('div', 'stage'); st.hidden = true;
    var fr = h('div', 'stage-frame'); st.appendChild(fr);
    var bar = h('div', 'stage-bar');
    bar.appendChild(hx('span', 'muted', ICON.mute + 'Muted'));
    var sl = h('span', 'sl'); bar.appendChild(sl);
    var pb = h('button', 'sbtn', 'Pause'); pb.type = 'button';
    var cb = h('button', 'sbtn', 'Close'); cb.type = 'button';
    bar.appendChild(pb); bar.appendChild(cb); st.appendChild(bar);
    ctx.stage = st; ctx.stageFrame = fr; ctx.stageLabel = sl; ctx.pauseBtn = pb;
    pb.addEventListener('click', function () {
      var p = ctx.players[ctx.active]; if (!p || !p.getPlayerState) return;
      try { if (ctx.isPlaying) p.pauseVideo(); else { p.mute(); p.playVideo(); } } catch (x) { /* ignore */ }
    });
    cb.addEventListener('click', function () {
      var p = ctx.players[ctx.active]; try { if (p && p.pauseVideo) p.pauseVideo(); } catch (x) { /* ignore */ }
      st.hidden = true; markWatching(ctx, null);
    });
    return st;
  }
  function markWatching(ctx, key) {
    Object.keys(ctx.cards).forEach(function (k) {
      var b = ctx.cards[k].querySelector('.watch'); var on = k === key;
      b.classList.toggle('playing', on);
      b.querySelector('.wt').textContent = on ? 'Playing' : 'Watch muted';
    });
  }
  function openFilm(ctx, key) { // tap handler
    var side = ctx.cfg.sides[key];
    Object.keys(ctx.players).forEach(function (k) { if (k !== key) try { ctx.players[k].pauseVideo(); } catch (x) { /* ignore */ } });
    Array.prototype.forEach.call(ctx.stageFrame.children, function (s) { s.setAttribute('aria-hidden', s.getAttribute('data-slot') === key ? 'false' : 'true'); });
    var slot = ctx.stageFrame.querySelector('[data-slot="' + key + '"]');
    ctx.stage.hidden = false; ctx.active = key;
    var shownTitle = ctx.cards[key].querySelector('.film-title').textContent;
    ctx.stageLabel.innerHTML = ''; ctx.stageLabel.appendChild(h('b', null, shownTitle));
    markWatching(ctx, key);
    if (!slot) {
      slot = h('div', 'slot'); slot.setAttribute('data-slot', key); slot.setAttribute('aria-hidden', 'false');
      var host = h('div'); slot.appendChild(host); ctx.stageFrame.appendChild(slot);
      createPlayer(ctx, key, host, side.id, side.label + ', muted');
      setPauseLabel(ctx, true);
    } else {
      var p = ctx.players[key]; try { if (p && p.playVideo) { p.mute(); p.playVideo(); } } catch (x) { /* ignore */ }
      setPauseLabel(ctx, true);
    }
    bring(ctx.stage, 'nearest');
  }

  /* ---------- sources sheet ---------- */
  var sheet = document.getElementById('sheet'), sheetBack = document.getElementById('sheetBack'), sheetBody = document.getElementById('sheetBody');
  function link(url, text) { return '<a href="' + url + '" target="_blank" rel="noopener">' + text + '</a>'; }
  function yt(id) { return 'https://www.youtube.com/watch?v=' + id; }
  function buildSources() {
    var s = '';
    s += '<p>' + F.readNote + '</p>';
    s += '<h3 id="src-1">Round 1 · P&amp;G</h3><ul>';
    s += '<li>' + link(yt(ricos.videoId), ricos.videoLabel) + ', on ' + ricos.channelOwner + '. ' + fmt(ep1) + ' views on episode 1. The series ran ' + ricos.episodes + ' episodes, ' + ricos.runDates + ', ' + ricos.cadence + ', with ' + fmt(seriesTotal) + ' views across all ' + ricos.episodes + '.</li>';
    s += '<li>' + r1.episodeNote + ' Episode 9 shows ' + fmt(EPS[8].views) + ' views and episode 10 shows ' + fmt(EPS[9].views) + '.</li>';
    s += '<li>' + link(yt(tide.videoId), tide.videoLabel) + ', on ' + tide.channelOwner + "'s own channel, published " + tide.published + '. ' + fmt(tide.views) + ' views.</li>';
    s += '<li>The two films in round 1 sit on different channels, so the comparison is between channels as well as formats.</li>';
    s += '<li>Quote: ' + r1.quote.cite + '. ' + link(r1.quote.url, 'Read the article') + '</li></ul>';
    s += '<h3 id="src-2">Round 2 · Allstate</h3><ul>';
    r2.evidence.forEach(function (e) { s += '<li>' + e.stat + ' ' + e.label + '. ' + link(e.url, e.source) + '.</li>'; });
    s += '<li>' + r2.evidenceScope + '</li>';
    s += '<li>' + cf.evidence + ' The three spots are ' + CF_SPOTS.map(function (c) { return link(yt(c.id), c.name); }).join(', ') + '.</li>';
    s += '<li>' + link(yt(mayhem.videoId), mayhem.videoLabel) + ', on Allstate\'s channel.</li></ul>';
    s += '<h3 id="src-3">Round 3 · Red Bull</h3><ul>';
    s += '<li>' + link(yt(jump.videoId), jump.videoLabel) + ", on Red Bull's own channel, published " + jump.published + '. ' + fmt(jump.views) + ' views.</li>';
    s += '<li>' + link(yt(cartoon.videoId), cartoon.videoLabel) + ", on Red Bull's own channel, published " + cartoon.published + '. ' + fmt(cartoon.views) + ' views.</li>';
    s += '<li>During the live jump, YouTube reported ' + jump.concurrentStreams + '. ' + link(jump.concurrentUrl, jump.concurrentSource) + '.</li>';
    s += '<li>Red Bull has made cartoon commercials since ' + cartoon.cartoonsSince + ', according to the ' + cartoon.cartoonsSource + '.</li>';
    s += '<li>Quote: ' + r3.quote.cite + '. ' + link(r3.quote.url, 'Read the article') + '</li></ul>';
    s += '<h3 id="src-4">Round 4 · YETI</h3><ul>';
    s += '<li>' + link(yt(yf.videoId), yf.videoLabel) + ", on YETI's own channel, published " + yf.published + '. ' + fmt(yf.views) + ' views. YETI Presents has run since ' + yf.seriesSince + '.</li>';
    s += '<li>' + link(yt(pbr.videoId), pbr.videoLabel) + ', on the channel of ' + pbr.channelOwner + ', published ' + pbr.published + '. ' + fmt(pbr.views) + ' views.</li>';
    s += '<li>' + pbr.sponsorNote + '.</li>';
    s += '<li>The two films in round 4 sit on different channels.</li></ul>';
    s += '<h3>The quote on the first screen</h3><ul><li>' + EC.founderCredit + '. ' + link(F.founderQuote.url, EC.founderLink) + '</li></ul>';
    sheetBody.innerHTML = s;
  }
  var lastFocus = null;
  function openSources(n) {
    if (!sheetBody.firstChild) buildSources();
    lastFocus = document.activeElement;
    sheet.hidden = false; sheetBack.hidden = false;
    var t = n ? document.getElementById('src-' + n) : null;
    sheetBody.scrollTop = t ? t.offsetTop - 8 : 0;
    document.getElementById('sheetX').focus();
  }
  function closeSources() { sheet.hidden = true; sheetBack.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  document.getElementById('sheetX').addEventListener('click', closeSources);
  sheetBack.addEventListener('click', closeSources);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) closeSources(); });
  function creditLine(text, n) {
    var p = h('p', 'credit-line', text + ' ');
    var b = h('button', null, 'Sources'); b.type = 'button'; b.addEventListener('click', function () { openSources(n); });
    p.appendChild(b); return p;
  }

  /* ---------- landing ---------- */
  function landing() {
    reset(); hdr.classList.add('landing');
    var vs = /(?:^|[#&])vs=(\d)(?:$|&)/.exec(location.hash);
    var saved = load();
    var L = h('section', 'landing enter');
    L.appendChild(h('p', 'eyebrow', 'A game in four rounds'));
    var t = h('h1', 'l-title'); t.textContent = EC.title; L.appendChild(t);
    L.appendChild(h('p', 'l-sub', 'And by how much?'));
    L.appendChild(h('p', 'l-lead', EC.lead));
    // a moving strip of real stills from the eight films, no captions, no video
    var strip = h('div', 'strip'); strip.setAttribute('aria-hidden', 'true');
    var track = h('div', 'strip-track');
    var tiles = [[ricos.videoId, 1], [jump.videoId, 1], [mayhem.videoId, 3], [yf.videoId, 1], [tide.videoId, 1], [cartoon.videoId, 2], [cf.videoId, 1], [pbr.videoId, 3]];
    tiles.concat(tiles).forEach(function (tl) { var d = h('div', 'strip-tile'); var i = h('img'); i.src = still(tl[0], tl[1]); i.alt = ''; i.decoding = 'async'; d.appendChild(i); track.appendChild(d); });
    strip.appendChild(track); L.appendChild(strip);
    if (vs && +vs[1] <= 8) L.appendChild(h('p', 'vs-line', 'The colleague who shared this link scored ' + vs[1] + ' of 8.'));
    var acts = h('div', 'l-actions');
    var go = h('button', 'btn', 'Start round one'); go.type = 'button'; go.id = 'start';
    go.insertAdjacentHTML('beforeend', ICON.arrow);
    go.addEventListener('click', function () { clearSave(); S.res = [null, null, null, null]; S.played = []; startRound(0); });
    acts.appendChild(go);
    if (saved && saved.next >= 1 && saved.next <= 3 && saved.played && saved.played.length) {
      var cont = h('button', 'textbtn', 'Continue from round ' + (saved.next + 1)); cont.type = 'button';
      cont.addEventListener('click', function () { S.order = saved.order; S.res = saved.res; S.played = saved.played; startRound(saved.next); });
      acts.appendChild(cont);
    }
    L.appendChild(acts);
    L.appendChild(hx('p', 'notice', '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg><span>Films play muted, and only when you tap Watch.</span>'));
    L.appendChild(hx('p', 'notice', '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg><span></span>'));
    L.lastChild.querySelector('span').textContent = EC.noticeAboutNumbers;
    var gate = h('div', 'gate');
    gate.appendChild(h('span', 'mark', '“'));
    gate.appendChild(h('blockquote', null, F.founderQuote.text));
    var cr = h('p', 'credit', EC.founderCredit + '. ');
    var a = h('a', null, EC.founderLink); a.href = F.founderQuote.url; a.target = '_blank'; a.rel = 'noopener';
    cr.appendChild(a); gate.appendChild(cr);
    L.appendChild(gate);
    app.appendChild(L);
  }

  function reset() {
    app.innerHTML = ''; posters = [];
    window.scrollTo(0, 0);
  }

  /* ---------- a round ---------- */
  function startRound(i) {
    reset(); hdr.classList.remove('landing'); loadApi();
    var cfg = ROUNDS[i];
    if (S.played.indexOf(i) < 0) S.played.push(i);
    S.res[i] = { call: false, why: false, done: false };
    paintRail(i);
    var ctx = { i: i, cfg: cfg, cards: {}, players: {}, pick: null, chip: null, locked: false };
    var root = h('section', 'round enter'); ctx.root = root;
    root.appendChild(h('p', 'r-label', 'Round ' + (i + 1) + ' of 4 · ' + cfg.company));
    root.appendChild(h('h2', 'r-head', cfg.head));
    root.appendChild(buildStage(ctx));
    var keys = Object.keys(cfg.sides); if (S.order[i]) keys.reverse();
    ctx.keys = keys;
    var films = h('div', 'films'); ctx.films = films;
    keys.forEach(function (k, n) { var c = buildCard(ctx, k, n); ctx.cards[k] = c; films.appendChild(c); });
    root.appendChild(films);
    app.appendChild(root);
    if (cfg.pre === 'memory') buildMemory(ctx);
    else if (cfg.pre === 'test') buildTest(ctx);
    else buildCall(ctx);
    app.focus({ preventScroll: true });
  }

  function buildCard(ctx, k, n) {
    var s = ctx.cfg.sides[k];
    var c = h('div', 'film'); c.setAttribute('data-film', k);
    var hide = ctx.cfg.pre === 'memory';
    var p = makePoster(s.id, s.stills, hide ? 'Still from an Allstate ad' : 'Still from ' + s.title);
    var w = h('button', 'watch'); w.type = 'button';
    w.innerHTML = ICON.play + '<span class="wt">Watch muted</span>';
    w.setAttribute('aria-label', 'Watch muted');
    w.addEventListener('click', function (e) { e.stopPropagation(); openFilm(ctx, k); });
    p.appendChild(w);
    p.appendChild(h('span', 'you', 'YOU'));
    c.appendChild(p);
    var m = h('div', 'film-meta');
    m.appendChild(h('p', 'film-title', hide ? (n === 0 ? 'The left ad' : 'The right ad') : s.title));
    var d = h('p', 'film-desc', hide ? 'Name hidden for now.' : s.desc); if (hide) d.classList.add('blank');
    m.appendChild(d);
    if (s.chan) m.appendChild(h('p', 'film-chan', s.chan));
    c.appendChild(m);
    c.addEventListener('click', function () { choose(ctx, k); });
    c.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target === c) { e.preventDefault(); choose(ctx, k); } });
    return c;
  }

  function setPickable(ctx, on) {
    ctx.films.classList.toggle('pickable', on);
    Object.keys(ctx.cards).forEach(function (k) {
      var c = ctx.cards[k];
      if (on) { c.setAttribute('role', 'button'); c.tabIndex = 0; c.setAttribute('aria-pressed', 'false'); c.setAttribute('aria-label', 'Choose ' + ctx.cfg.sides[k].title); }
      else { c.removeAttribute('role'); c.removeAttribute('tabindex'); c.removeAttribute('aria-pressed'); c.removeAttribute('aria-label'); }
    });
  }

  // Updates the two existing cards in place, so a playing film keeps playing.
  function choose(ctx, k) {
    if (!ctx.canPick || ctx.locked) return;
    ctx.pick = k;
    Object.keys(ctx.cards).forEach(function (key) {
      var on = key === k; ctx.cards[key].classList.toggle('picked', on); ctx.cards[key].setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (ctx.cfg.kind === 'gap' && ctx.chipBox && ctx.chipBox.hidden) { ctx.chipBox.hidden = false; ctx.chipBox.classList.add('fade-in'); bring(ctx.chipBox, 'nearest'); }
    updateLock(ctx);
  }

  function memoryLine(ctx, named) {
    if (named.length === 2) return 'You could name someone in both ads.';
    if (named.length === 0) return 'You could not name anyone in either ad.';
    return 'You could name someone in the ' + ctx.cfg.sides[named[0]].short + ' ad.';
  }
  function testLine(t) {
    if (t === 'stratos') return 'With the name taken off, you said you would still watch the jump.';
    if (t === 'confession') return 'With the name taken off, you said you would still watch the cartoon.';
    if (t === 'both') return 'With the name taken off, you said you would still watch both films.';
    return 'With the name taken off, you said you would watch neither film.';
  }

  function buildMemory(ctx) {
    var b = h('div', 'block card-block fade-in');
    b.appendChild(h('p', 'q', 'Before you watch: could you name anyone in these two Allstate ads?'));
    b.appendChild(h('p', 'nopoint', 'This question earns no point.'));
    var o = h('div', 'opts');
    [['left', 'The left ad'], ['right', 'The right ad'], ['both', 'Both'], ['neither', 'Neither']].forEach(function (x) {
      var btn = h('button', 'opt', x[1]); btn.type = 'button'; btn.setAttribute('aria-pressed', 'false'); btn.setAttribute('data-mem', x[0]);
      btn.addEventListener('click', function () {
        if (ctx.memory) return;
        var named = x[0] === 'both' ? ctx.keys.slice() : x[0] === 'neither' ? [] : [ctx.keys[x[0] === 'left' ? 0 : 1]];
        ctx.memory = named;
        Array.prototype.forEach.call(o.children, function (c) { c.disabled = true; c.setAttribute('aria-pressed', c === btn ? 'true' : 'false'); });
        // Names appear in place on the two cards.
        ctx.keys.forEach(function (k) {
          var c = ctx.cards[k], s = ctx.cfg.sides[k];
          c.querySelector('.film-title').textContent = s.title;
          var d = c.querySelector('.film-desc'); d.textContent = s.desc; d.classList.remove('blank');
          c.querySelector('.poster img').alt = 'Still from ' + s.title;
          c.classList.add('fade-in');
        });
        wait(450, function () { foldPre(b, memoryLine(ctx, named) + ' This question earns no point.'); buildCall(ctx); });
      });
      o.appendChild(btn);
    });
    b.appendChild(o);
    ctx.root.appendChild(b); ctx.preBlock = b;
  }
  // An answered unscored question shrinks to one line, so the films and the scored question sit together.
  function foldPre(b, text) {
    b.innerHTML = ''; b.className = 'block folded fade-in';
    b.appendChild(h('span', 'youtag', 'YOU')); b.appendChild(h('span', null, text));
  }

  function buildTest(ctx) {
    var b = h('div', 'block test fade-in');
    b.appendChild(h('span', 'mark', '“'));
    b.appendChild(h('blockquote', null, F.founderQuote.text));
    b.appendChild(h('p', 'who', F.founderQuote.who));
    b.appendChild(h('p', 'q', "Take Red Bull's name and product off each film. Which one would you still watch?"));
    b.appendChild(h('p', 'nopoint', 'This question earns no point.'));
    var o = h('div', 'opts');
    [['stratos', 'The jump'], ['confession', 'The cartoon'], ['both', 'Both'], ['neither', 'Neither']].forEach(function (x) {
      var btn = h('button', 'opt', x[1]); btn.type = 'button'; btn.setAttribute('aria-pressed', 'false'); btn.setAttribute('data-test', x[0]);
      btn.addEventListener('click', function () {
        if (ctx.test) return; ctx.test = x[0];
        Array.prototype.forEach.call(o.children, function (c) { c.disabled = true; c.setAttribute('aria-pressed', c === btn ? 'true' : 'false'); });
        wait(450, function () { foldPre(b, testLine(x[0]) + ' This question earns no point.'); buildCall(ctx); });
      });
      o.appendChild(btn);
    });
    b.appendChild(o);
    ctx.root.appendChild(b); ctx.preBlock = b;
  }

  function buildCall(ctx) {
    var cfg = ctx.cfg;
    var b = h('div', 'block call fade-in'); ctx.callBlock = b;
    if (cfg.pre === 'memory') {
      b.appendChild(h('p', 'r-link', 'Mayhem is one character, played by Dean Winters, in Allstate ads since 2010. Every Check First spot has a new cast, and each one says “' + cf.repeatedLine + '”'));
    }
    b.appendChild(h('p', 'q', cfg.q));
    b.appendChild(h('p', 'hint', cfg.hint));
    if (cfg.kind === 'gap') {
      var box = h('div'); box.hidden = true; ctx.chipBox = box;
      box.appendChild(h('p', 'chips-q', 'How many times more views?'));
      var chips = h('div', 'chips');
      CHIPS.forEach(function (c, n) {
        var btn = h('button', 'chip', c.t); btn.type = 'button'; btn.setAttribute('aria-pressed', 'false'); btn.setAttribute('data-chip', n);
        btn.addEventListener('click', function () {
          if (ctx.locked) return; ctx.chip = n;
          Array.prototype.forEach.call(chips.children, function (x) { x.setAttribute('aria-pressed', x === btn ? 'true' : 'false'); });
          updateLock(ctx); bring(ctx.lockBtn, 'nearest');
        });
        chips.appendChild(btn);
      });
      box.appendChild(chips); b.appendChild(box);
    }
    var row = h('div', 'lockrow');
    var lock = h('button', 'btn lock', 'Lock in my call'); lock.type = 'button'; lock.disabled = true; ctx.lockBtn = lock;
    lock.addEventListener('click', function () { doLock(ctx); });
    row.appendChild(lock); b.appendChild(row);
    ctx.root.appendChild(b);
    ctx.canPick = true; setPickable(ctx, true); updateLock(ctx);
    if (cfg.pre) bring(b, 'start');
  }

  function updateLock(ctx) {
    if (!ctx.lockBtn) return;
    var ready = ctx.cfg.kind === 'gap' ? (ctx.chip === 0 || (ctx.pick && ctx.chip != null)) : !!ctx.pick;
    ctx.lockBtn.disabled = !ready;
    ctx.lockBtn.textContent = ready ? 'Lock in my call' : (ctx.cfg.kind === 'gap' && ctx.pick ? 'Choose how many times more' : (ctx.cfg.kind === 'gap' ? 'Choose a film first' : (ctx.i === 1 ? 'Choose a campaign first' : 'Choose a film first')));
  }

  function judge(ctx) {
    var cfg = ctx.cfg, i = ctx.i;
    if (cfg.kind === 'gap') {
      var real = band(cfg.ratio);
      if (ctx.chip === 0) return real === 0 ? { ok: true, msg: EC.correctPick } : { ok: false, msg: 'The real gap was bigger than your call.' };
      if (ctx.pick !== cfg.winner) return { ok: false, msg: 'Your call went to the other film. Here is what each film got.' };
      if (ctx.chip === real) return { ok: true, msg: EC.correctPick };
      return { ok: false, msg: ctx.chip < real ? 'Right film. The real gap was bigger than your call.' : 'Right film. The real gap was smaller than your call.' };
    }
    if (ctx.pick === cfg.winner) return { ok: true, msg: EC.correctPick };
    return i === 1 ? { ok: false, msg: 'Your call went to Check First. Here is what the research shows.' }
      : { ok: false, msg: 'Your call went to the PBR award film. Here is what each film did for YETI.' };
  }

  function summaryText(ctx) {
    var cfg = ctx.cfg;
    if (cfg.kind === 'gap') {
      var a = cfg.sides[ctx.keys[0]].short, b = cfg.sides[ctx.keys[1]].short;
      if (ctx.chip === 0) return 'Your call: ' + a + ' and ' + b + ' got about the same views.';
      var other = cfg.sides[ctx.keys[0] === ctx.pick ? ctx.keys[1] : ctx.keys[0]].short;
      return 'Your call: ' + cfg.sides[ctx.pick].short + ' got ' + CHIPS[ctx.chip].say + ' ' + other + '.';
    }
    return 'Your call: ' + cap(cfg.sides[ctx.pick].short) + '.';
  }

  function doLock(ctx) {
    if (ctx.locked || ctx.lockBtn.disabled) return;
    ctx.locked = true; ctx.canPick = false; setPickable(ctx, false);
    var v = judge(ctx); ctx.verdict = v;
    S.res[ctx.i].call = v.ok;
    // Collapse the call area to one line, keep the films (and any playing film) where they are.
    ctx.callBlock.hidden = true;
    if (ctx.preBlock) ctx.preBlock.hidden = true; // its answer is repeated in the reveal
    var sum = h('div', 'summary fade-in'); sum.appendChild(h('span', 'youtag', 'YOU')); sum.appendChild(h('span', null, summaryText(ctx)));
    ctx.films.classList.add('compact');
    ctx.films.parentNode.insertBefore(sum, ctx.films.nextSibling);
    ctx.summary = sum;
    if (ctx.cfg.post === 'channel') buildChannelTap(ctx);
    else reveal(ctx);
  }

  function buildChannelTap(ctx) {
    var b = h('div', 'block card-block fade-in');
    b.appendChild(h('p', 'q', 'One more question before the numbers. Which YouTube channel carries the bull riding film?'));
    b.appendChild(h('p', 'nopoint', 'This question earns no point.'));
    var o = h('div', 'opts');
    [['yeti', "YETI's channel"], ['pbr', "PBR's channel"]].forEach(function (x) {
      var btn = h('button', 'opt chan-opt', x[1]); btn.type = 'button'; btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', function () {
        if (ctx.chan) return; ctx.chan = x[0];
        Array.prototype.forEach.call(o.children, function (c) { c.disabled = true; c.setAttribute('aria-pressed', c === btn ? 'true' : 'false'); });
        wait(250, function () { b.hidden = true; reveal(ctx); });
      });
      o.appendChild(btn);
    });
    b.appendChild(o);
    ctx.root.appendChild(b);
    bring(b, 'center');
  }

  /* ---------- reveals ---------- */
  function revealShell(ctx) {
    var rv = h('div', 'reveal'); rv.setAttribute('aria-live', 'polite');
    var vd = h('p', 'verdict'); vd.appendChild(h('span', null, ctx.verdict.msg));
    if (ctx.verdict.ok) vd.appendChild(h('span', 'plus', '+1'));
    rv.appendChild(vd);
    ctx.root.appendChild(rv); ctx.reveal = rv;
    if (ctx.verdict.ok) bumpScore();
    return rv;
  }
  function reveal(ctx) {
    var fn = [revealR1, revealR2, revealR3, revealR4][ctx.i];
    fn(ctx);
    requestAnimationFrame(function () { bring(ctx.reveal, 'start'); });
  }

  function gapScale(ctx, extra) {
    var gs = h('div', 'gs' + (extra ? ' two' : ''));
    gs.appendChild(h('p', 'gs-cap', 'Your call against the real gap, in times more views'));
    var bands = h('div', 'gs-bands'); for (var i = 0; i < 6; i++) bands.appendChild(h('i')); gs.appendChild(bands);
    var ticks = h('div', 'gs-ticks');
    TICKS.forEach(function (t, n) { var s = h('span', null, t === 1 ? '1' : String(t)); s.style.left = (n / 6 * 100) + '%'; ticks.appendChild(s); });
    gs.appendChild(ticks);
    var you = h('div', 'gs-you'); you.style.left = (ctx.chip / 6 * 100) + '%'; you.style.width = (100 / 6) + '%';
    you.appendChild(h('span', null, 'YOU'));
    gs.appendChild(you);
    var mk = h('div', 'gs-mark'); mk.appendChild(h('span', null, extra || 'Real'));
    gs.appendChild(mk);
    wait(350, function () { mk.style.left = scalePos(ctx.cfg.ratio) + '%'; });
    ctx.gsMark = mk; ctx.gs = gs;
    return gs;
  }
  function bigLine(n, rest, cls) {
    var b = h('p', 'big' + (cls ? ' ' + cls : ''));
    b.appendChild(h('span', 'n', cap(n) + ' times the views, '));
    b.appendChild(h('span', 'rest', rest));
    return b;
  }

  function revealR1(ctx) {
    var rv = revealShell(ctx);
    var sec = h('div', 'rv-sec');
    var lg = h('div', 'legend');
    var l1 = h('div', 'lg'); l1.appendChild(h('i', 'o')); var v1 = h('b', 'o-t', '0'); l1.appendChild(v1); var l1t = h('span', null, "views, Rico's Tacos episode 1"); l1.appendChild(l1t);
    var l2 = h('div', 'lg'); l2.appendChild(h('i', 'g')); var v2 = h('b', null, '0'); l2.appendChild(v2); l2.appendChild(h('span', null, 'views, School Lunch, the Tide film'));
    var l3 = h('div', 'lg'); l3.appendChild(h('i', 'dash')); l3.appendChild(h('span', null, 'Dashed line: the level of the Tide film'));
    lg.appendChild(l1); lg.appendChild(l2); lg.appendChild(l3); sec.appendChild(lg);
    // 22 episodes at their true heights, on one scale with the Tide film
    var ch = h('div', 'eps'); var plot = h('div', 'eps-plot');
    var max = Math.max.apply(null, EPS.map(function (e) { return e.views; }).concat([tide.views]));
    var tcol = h('div', 'col tide'); tcol.style.setProperty('--h', (tide.views / max * 100) + '%'); tcol.title = 'School Lunch, ' + fmt(tide.views) + ' views';
    plot.appendChild(tcol); plot.appendChild(h('div', 'col gap'));
    var cols = EPS.map(function (e, n) {
      var c = h('div', 'col'); c.style.setProperty('--h', (e.views / max * 100) + '%');
      c.title = 'Episode ' + e.ep + ', ' + e.title + ', ' + fmt(e.views) + ' views';
      if (n === 0) c.classList.add('hot');
      plot.appendChild(c); return c;
    });
    var ref = h('div', 'eps-ref'); ref.style.bottom = (tide.views / max * 100) + '%';
    plot.appendChild(ref);
    var ax2 = h('p', 'eps-count', 'Episode 1 of 22'); ch.appendChild(ax2);
    ch.appendChild(plot);
    var axis = h('div', 'eps-axis'); axis.appendChild(h('span', null, 'Tide')); axis.appendChild(h('span', null, 'Episode 22'));
    var note = h('div', 'eps-note', 'Episodes 9 and 10'); axis.appendChild(note);
    ch.appendChild(axis); sec.appendChild(ch);
    rv.appendChild(sec);
    wait(200, function () { tcol.classList.add('show'); cols[0].classList.add('show'); ref.classList.add('show'); });
    countUp(v1, ep1, 1200); countUp(v2, tide.views, 1200);
    // the scored call on the gap scale
    var gsec = h('div', 'rv-sec');
    gsec.appendChild(h('p', 'big-cap', 'Episode 1 against the Tide film'));
    var big = bigLine(approx(ratio1), 'on different channels'); gsec.appendChild(big);
    gsec.appendChild(h('p', 'big-sub', 'Episode 1 sits on MinivelaTV and the Tide film sits on Tide\'s channel.'));
    gsec.appendChild(gapScale(ctx, 'Episode 1'));
    rv.appendChild(gsec);
    var add = h('button', 'btn addbtn add-eps', 'Add the other 21 episodes'); add.type = 'button';
    rv.appendChild(add);
    rv.appendChild(creditLine('YouTube view counts, ' + F.readDate + '.', 1));
    add.addEventListener('click', function () {
      add.disabled = true; add.hidden = true;
      cols[0].classList.remove('hot');
      cols.slice(1).forEach(function (c, n) { c.style.transitionDelay = reduce ? '0s' : (n * 55) + 'ms'; c.classList.add('show'); });
      var shown = 1;
      if (reduce) { ax2.textContent = '22 episodes'; } else {
        var tick = setInterval(function () { shown++; ax2.textContent = 'Episode ' + Math.min(shown, 22) + ' of 22'; if (shown >= 22) { clearInterval(tick); ax2.textContent = '22 episodes'; } }, 55);
        setTimeout(function () { clearInterval(tick); ax2.textContent = '22 episodes'; }, 22 * 55 + 400);
      }
      l1t.textContent = "views, all 22 episodes of Rico's Tacos together";
      countUp(v1, seriesTotal, 1500, ep1);
      // place the note over episodes 9 and 10
      wait(1300, function () {
        var a = cols[8].offsetLeft, b = cols[9].offsetLeft + cols[9].offsetWidth;
        note.style.left = ((a + b) / 2 - plot.offsetLeft) + 'px'; note.classList.add('show');
      });
      // the second marker and the new headline figure
      var mk2 = h('div', 'gs-mark b'); mk2.appendChild(h('span', null, 'All 22'));
      ctx.gs.classList.add('two'); ctx.gs.appendChild(mk2);
      wait(300, function () { mk2.style.left = scalePos(ratio1all) + '%'; });
      var g2 = h('div', 'rv-sec fade-in');
      g2.appendChild(h('p', 'big-cap', '22 episodes together against one film'));
      g2.appendChild(bigLine(approx(ratio1all), 'on different channels'));
      g2.appendChild(h('p', 'big-sub', epsAboveTide + ' of the ' + EPS.length + ' episodes each got more views than the Tide film. ' + r1.episodeNote.split('. ')[1]));
      wait(900, function () {
        rv.insertBefore(g2, rv.querySelector('.credit-line'));
        buildWhy(ctx);
      });
    });
  }

  function revealR2(ctx) {
    var rv = revealShell(ctx);
    var named = ctx.memory || [];
    rv.appendChild(h('p', 'echo', 'Before you watched, ' + memoryLine(ctx, named).replace(/^You/, 'you') + (named.length === 0 ? ' Allstate has run Mayhem since 2010.' : '')));
    // a cast that returns, beside a line that repeats
    var st = h('div', 'strip2 rv-sec');
    var castRow = h('div', 's2-row cast'); castRow.appendChild(h('h4', null, 'A cast that returns'));
    var ci = h('div', 's2-imgs'); ci.appendChild(figure(mayhem.videoId, 3, 'Mayhem: Action Hero', null)); ci.appendChild(h('p', 's2-say', mayhem.label + '.')); castRow.appendChild(ci);
    var lineRow = h('div', 's2-row line'); lineRow.appendChild(h('h4', null, 'A line that repeats'));
    var li = h('div', 's2-imgs');
    CF_SPOTS.forEach(function (sp) { li.appendChild(figure(sp.id, 1, sp.name, cf.repeatedLine)); });
    lineRow.appendChild(li);
    st.appendChild(castRow); st.appendChild(lineRow);
    rv.appendChild(st);
    // the research
    var sec = h('div', 'rv-sec');
    var stats = h('div', 'stats');
    ['#1', '+8%'].forEach(function (k) { var e = evBy(k); var d = h('div', 'stat'); d.appendChild(h('b', null, e.stat)); d.appendChild(h('span', null, e.label + ', MarketCast')); stats.appendChild(d); });
    sec.appendChild(stats);
    var sv = evBy('31%');
    sec.appendChild(h('p', 'survey', 'In an Insurity survey of more than 1,000 US adults, ' + sv.stat + ' ' + sv.label + '.'));
    sec.appendChild(h('p', 'scope', r2.evidenceScope));
    rv.appendChild(sec);
    rv.appendChild(creditLine(evBy('#1').source + '. Insurity via Business Wire, 7 March 2024.', 2));
    wait(1200, function () { buildWhy(ctx); });
  }
  function figure(id, n, cap1, line) {
    var f = h('figure', 's2-cell');
    var ph = h('div', 'ph'); var im = h('img'); im.src = still(id, n); im.alt = 'Still from ' + cap1; im.loading = 'lazy'; ph.appendChild(im); f.appendChild(ph);
    var fc = h('figcaption'); if (line) fc.appendChild(h('q', null, line)); fc.appendChild(document.createTextNode(cap1)); f.appendChild(fc);
    return f;
  }

  function revealR3(ctx) {
    var rv = revealShell(ctx);
    rv.appendChild(h('p', 'echo', testLine(ctx.test)));
    var sec = h('div', 'rv-sec');
    var lg = h('div', 'legend');
    var l1 = h('div', 'lg'); l1.appendChild(h('i', 'o')); var v1 = h('b', 'o-t', '0'); l1.appendChild(v1); l1.appendChild(h('span', null, 'views, Stratos, the jump'));
    var l2 = h('div', 'lg'); l2.appendChild(h('i', 'g')); l2.appendChild(h('b', null, fmt(cartoon.views))); l2.appendChild(h('span', null, 'views, Confession, the cartoon'));
    lg.appendChild(l1); lg.appendChild(l2); sec.appendChild(lg);
    var grid = h('div', 'sq-grid'); grid.setAttribute('role', 'img');
    grid.setAttribute('aria-label', 'One grey square for the cartoon and ' + approx(ratio3) + ' orange squares for the jump');
    var whole = Math.floor(ratio3), part = ratio3 - whole;
    var cells = [];
    var g = h('div', 'sq cartoon'); grid.appendChild(g); cells.push(g);
    for (var k = 0; k < whole; k++) { var s = h('div', 'sq'); grid.appendChild(s); cells.push(s); }
    if (part > 0.001) { var ps = h('div', 'sq part'); ps.style.setProperty('--p', Math.round(part * 100) + '%'); grid.appendChild(ps); cells.push(ps); }
    sec.appendChild(grid);
    sec.appendChild(h('p', 'sq-cap', 'Each square is ' + fmt(cartoon.views) + ' views, the whole count for the cartoon.'));
    rv.appendChild(sec);
    var step = 1400 / cells.length;
    wait(300, function () {
      cells.forEach(function (c, n) { c.style.setProperty('--d', reduce ? '0ms' : (n === 0 ? 0 : 350 + n * step) + 'ms'); c.classList.add('show'); });
      countUp(v1, jump.views, 1750);
    });
    var gsec = h('div', 'rv-sec');
    gsec.appendChild(h('p', 'big-cap', 'The jump against the cartoon'));
    gsec.appendChild(bigLine(approx(ratio3), 'on the same channel'));
    gsec.appendChild(h('p', 'big-sub', "Both films sit on Red Bull's own channel. During the live jump, YouTube reported " + jump.concurrentStreams + '.'));
    gsec.appendChild(gapScale(ctx, 'The jump'));
    rv.appendChild(gsec);
    rv.appendChild(creditLine('YouTube view counts, ' + F.readDate + '. ' + jump.concurrentSource + '.', 3));
    wait(1500, function () { buildWhy(ctx); });
  }

  function revealR4(ctx) {
    var rv = revealShell(ctx);
    rv.appendChild(h('p', 'echo', (ctx.chan === 'pbr' ? "You said PBR's channel." : "You said YETI's channel.") + " The bull riding film sits on PBR's channel, and A Thousand Casts sits on YETI's channel."));
    var chans = h('div', 'chans rv-sec');
    var own = chanCard("YETI's channel", yf.videoId, 1, 'A Thousand Casts', yf.views, 'A film YETI made, on a channel YETI owns.', true);
    var rent = chanCard("PBR's channel", pbr.videoId, 3, 'The 2026 PBR YETI Bucking Bull Champion', pbr.views, "YETI's name, on PBR's award.", false);
    chans.appendChild(own.el); chans.appendChild(rent.el); rv.appendChild(chans);
    wait(200, function () { own.el.classList.add('show'); countUp(own.v, yf.views, 1300); });
    wait(450, function () { rent.el.classList.add('show'); countUp(rent.v, pbr.views, 1100); });
    var gsec = h('div', 'rv-sec');
    gsec.appendChild(h('p', 'big-cap', 'A Thousand Casts against the award film'));
    gsec.appendChild(bigLine(approx(ratio4), 'on different channels'));
    rv.appendChild(gsec);
    var q = h('blockquote', 'pull', r4.quote.text); q.appendChild(h('cite', null, r4.quote.cite)); rv.appendChild(q);
    rv.appendChild(creditLine('YouTube view counts, ' + F.readDate + '.', 4));
    wait(1300, function () { buildWhy(ctx); });
  }
  function chanCard(name, id, n, title, views, tag, isOwn) {
    var el = h('div', 'chan' + (isOwn ? ' own' : ''));
    el.appendChild(hx('div', 'chan-h', ICON.tv + '<span></span>')); el.querySelector('.chan-h span').textContent = name;
    var ph = h('div', 'ph'); var im = h('img'); im.src = still(id, n); im.alt = 'Still from ' + title; im.loading = 'lazy'; ph.appendChild(im); el.appendChild(ph);
    var b = h('div', 'chan-b'); b.appendChild(h('p', 'chan-t', title));
    var v = h('span', null, '0'); var vv = h('div', 'chan-v'); vv.appendChild(v); vv.appendChild(h('small', null, 'views')); b.appendChild(vv);
    b.appendChild(h('p', 'chan-tag', tag)); el.appendChild(b);
    return { el: el, v: v };
  }

  /* ---------- the why, then the rung ---------- */
  function buildWhy(ctx) {
    if (ctx.whyBuilt) return; ctx.whyBuilt = true;
    var r = R[ctx.i], w = h('div', 'block why fade-in');
    w.appendChild(h('p', 'q', r.why.question));
    var list = h('div', 'whys');
    var opts = shuffle(r.why.options);
    opts.forEach(function (o) {
      var b = h('button', 'why-opt', o.text); b.type = 'button'; b._right = o.side === r.winner;
      b.addEventListener('click', function () {
        if (ctx.whyDone) return; ctx.whyDone = true;
        b.classList.add('chosen');
        var ok = b._right; S.res[ctx.i].why = ok;
        setTimeout(function () {
          Array.prototype.forEach.call(list.children, function (x) { x.disabled = true; if (x._right) x.classList.add('right'); else if (x !== b) x.classList.add('fade'); });
          var res = h('p', 'why-res'); res.appendChild(h('span', null, ok ? EC.correctReason : 'The answer that fits the evidence is marked.'));
          if (ok) { res.appendChild(document.createTextNode(' ')); res.appendChild(h('span', 'plus', '+1')); bumpScore(); }
          w.appendChild(res);
          afterWhy(ctx);
        }, reduce ? 0 : 280);
      });
      list.appendChild(b);
    });
    w.appendChild(list);
    ctx.root.appendChild(w);
  }

  function afterWhy(ctx) {
    var i = ctx.i, r = R[i];
    if (i === 0 || i === 2) {
      var qb = h('div', 'quote fade-in');
      qb.appendChild(h('blockquote', null, '“' + r.quote.text + '”'));
      var c = h('p', 'cite', r.quote.cite + '. '); var a = h('a', null, EC.founderLink); a.href = r.quote.url; a.target = '_blank'; a.rel = 'noopener'; c.appendChild(a);
      qb.appendChild(c); ctx.root.appendChild(qb);
    }
    S.res[i].done = true;
    var rd = h('div', 'rungdone fade-in');
    var ml = h('div', 'mini-ladder'); ml.setAttribute('aria-hidden', 'true');
    for (var k = 0; k < 4; k++) { var bar = h('i'); bar.style.bottom = (8 + k * 20) + 'px'; if (S.res[k] && S.res[k].done) bar.className = 'on' + (k === i ? ' now' : ''); ml.appendChild(bar); }
    rd.appendChild(ml);
    rd.appendChild(h('p', 'rd-l', 'Rung ' + (i + 1) + ' of 4'));
    rd.appendChild(h('p', 'rd-n', r.rung));
    rd.appendChild(h('p', 'rd-t', r.lesson));
    var go = h('div', 'rd-go');
    var last = i === 3;
    var nb = h('button', 'btn next-round', last ? 'See what the four rounds add up to' : 'Go to round ' + (i + 2)); nb.type = 'button';
    nb.insertAdjacentHTML('beforeend', ICON.arrow);
    nb.addEventListener('click', function () {
      Object.keys(ctx.players).forEach(function (k) { try { ctx.players[k].destroy(); } catch (x) { /* ignore */ } });
      if (last) finale(); else startRound(i + 1);
    });
    go.appendChild(nb); rd.appendChild(go);
    ctx.root.appendChild(rd);
    save(last ? 4 : i + 1);
    paintRail(-1);
    var li = railEl.children[i]; li.classList.add('flash'); setTimeout(function () { li.classList.remove('flash'); }, 1000);
    if (i === 3) { // all four rungs light again from the bottom
      Array.prototype.forEach.call(railEl.children, function (x, n) { setTimeout(function () { x.classList.add('flash'); setTimeout(function () { x.classList.remove('flash'); }, 950); }, reduce ? 0 : 400 + n * 150); });
    }
    setTimeout(function () { bring(rd, 'center'); }, reduce ? 0 : 350);
  }

  /* ---------- finale ---------- */
  function finale() {
    reset(); hdr.classList.remove('landing'); paintRail(-1);
    var pts = points(), max = maxPoints() || 8;
    var top = h('section', 'fin-top enter');
    top.appendChild(h('p', 'fin-lbl', 'Your score'));
    var sc = h('p', 'fin-score'); var n = h('span', null, '0'); sc.appendChild(n); sc.appendChild(h('span', 'of', ' of ' + max));
    top.appendChild(sc); countUp(n, pts, 900);
    var tiles = h('div', 'tiles');
    R.forEach(function (r, i) {
      var res = S.res[i], played = S.played.indexOf(i) >= 0 && res;
      var t = h('div', 'tile' + (played ? '' : ' np'));
      t.appendChild(h('h4', null, 'Round ' + (i + 1) + ' · ' + r.company));
      if (played) {
        [['Your call', res.call], ['Your reason', res.why]].forEach(function (x) {
          var p = h('p'); p.appendChild(h('span', 'm' + (x[1] ? ' y' : ''))); p.appendChild(document.createTextNode(x[0] + (x[1] ? ', correct' : ''))); t.appendChild(p);
        });
      } else t.appendChild(h('p', null, 'Not played'));
      tiles.appendChild(t);
    });
    top.appendChild(tiles);
    top.appendChild(h('p', 'fin-line', 'Each round kept the company the same and changed the approach.'));
    app.appendChild(top);

    var lad = h('section', 'fin-ladder');
    lad.appendChild(h('h3', null, 'What the four rounds add up to'));
    var ladder = h('div', 'ladder');
    var rungs = R.map(function (r, i) {
      var d = h('div', 'lrung');
      d.appendChild(h('span', 'k', String(i + 1)));
      d.appendChild(h('h4', null, r.rung));
      d.appendChild(h('p', null, F.synthesis[i]));
      ladder.appendChild(d); return d;
    });
    lad.appendChild(ladder);
    lad.appendChild(h('p', 'method', "The four rungs make up Tom Langan's Legendeering ladder. The principles behind the ladder:"));
    var pl = h('ul', 'principles'); F.principles.forEach(function (p) { pl.appendChild(h('li', null, p)); }); lad.appendChild(pl);
    app.appendChild(lad);
    rungs.forEach(function (d, i) { wait(500 + i * 260, function () { d.classList.add('lit'); }); });

    var close = h('section', 'fin-close');
    close.appendChild(h('p', 'eyebrow', 'Now your company'));
    close.appendChild(h('p', 'closing', F.closingQuestion));
    var yn = h('div', 'yn'); yn.appendChild(h('p', null, 'Could your company make that show?'));
    var cta;
    ['Yes', 'Not sure'].forEach(function (t) {
      var b = h('button', 'opt', t); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(yn.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        setTimeout(function () { bring(cta, 'start'); }, reduce ? 0 : 200);
      });
      yn.appendChild(b);
    });
    close.appendChild(yn);
    app.appendChild(close);

    cta = h('section', 'cta'); cta.id = 'book';
    cta.appendChild(h('h2', null, F.cta.heading));
    cta.appendChild(h('p', null, F.cta.copy));
    var a = h('a', 'btn cta-btn', F.cta.button); a.href = F.cta.url; a.target = '_blank'; a.rel = 'noopener';
    a.insertAdjacentHTML('beforeend', ICON.arrow);
    cta.appendChild(a);
    app.appendChild(cta);

    var after = h('div', 'after');
    var sh = h('button', 'textbtn', 'Send this to a colleague'); sh.type = 'button';
    var msg = h('span', 'shared-msg'); msg.setAttribute('aria-live', 'polite');
    sh.addEventListener('click', function () { share(pts, max, msg); });
    var src = h('button', 'textbtn', 'Sources'); src.type = 'button'; src.addEventListener('click', function () { openSources(0); });
    var again = h('button', 'textbtn', 'Start over'); again.type = 'button';
    again.addEventListener('click', function () { clearSave(); S.res = [null, null, null, null]; S.played = []; S.order = S.order.map(function () { return Math.random() < 0.5; }); history.replaceState(null, '', location.pathname); paintRail(-1); landing(); });
    after.appendChild(sh); after.appendChild(src); after.appendChild(again); after.appendChild(msg);
    app.appendChild(after);
    save(4);
  }

  function share(pts, max, msg) {
    var full = max === 8;
    var url = location.origin + location.pathname + (full ? '#vs=' + pts : '');
    var rows = R.map(function (r, i) {
      var x = S.res[i]; if (!x || S.played.indexOf(i) < 0) return null;
      return 'Round ' + (i + 1) + ' ' + (x.call ? '■' : '□') + (x.why ? '■' : '□');
    }).filter(Boolean);
    var text = 'I scored ' + pts + ' of ' + max + ' on ' + EC.title + ' Four companies, each shown two ways.\n' + rows.join('\n') + '\n' + url;
    function copied(ok) { msg.textContent = ok ? 'Copied. Paste it into a message.' : url; }
    function clip() {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { copied(true); }, function () { copied(false); });
      else copied(false);
    }
    if (navigator.share) {
      navigator.share({ title: EC.title, text: text }).catch(function (e) { if (e && e.name === 'AbortError') return; clip(); });
    } else clip();
  }

  /* ---------- footer + routing ---------- */
  var foot = document.getElementById('foot');
  foot.appendChild(document.createTextNode(F.brand + ' · '));
  var fa = h('a', null, 'talexmedia.com'); fa.href = 'https://talexmedia.com'; foot.appendChild(fa);
  foot.appendChild(document.createTextNode(' · '));
  var fm = h('a', null, 'info@talexmedia.com'); fm.href = 'mailto:info@talexmedia.com'; foot.appendChild(fm);

  var m = /^#r([1-4])$/.exec(location.hash);
  if (m) { S.res = [null, null, null, null]; S.played = []; startRound(+m[1] - 1); }
  else landing();
})();
