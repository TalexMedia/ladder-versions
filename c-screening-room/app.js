/* The Screening Room. Vanilla JS, reads every figure from window.FACTS (../shared/facts.js). */
(function () {
  'use strict';
  var F = window.FACTS, E = F.evansCopyDecisions, R = F.rounds;
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var main = document.getElementById('main');
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function loserKey(r) { return Object.keys(r.sides).filter(function (k) { return k !== r.winner; })[0]; }
  function later(ms, fn) { return setTimeout(fn, reduced ? 0 : ms); }
  function lower1(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
  // Ratios are always computed from FACTS, never typed. "Nearly" only when the rounded figure sits above the real one on a round hundred.
  function ratioOf(r) { var w = r.sides[r.winner].views, l = r.sides[loserKey(r)].views; return w / l; }
  function ratioText(x) { var n = x < 20 ? Math.round(x) : Math.round(x / 5) * 5; var w = (n > x && n % 100 === 0) ? 'Nearly' : 'About'; return w + ' ' + fmt(n) + ' times'; }
  var ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10 8l6 4-6 4z" fill="currentColor"/></svg>';
  var ICON_ARROW = '<svg class="arr" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_TICK = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" style="vertical-align:-2px;margin-right:4px"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* Size call: one scale for rounds 1 and 3. The slider snaps to these values; the five chips set the same values without a drag. */
  var SNAPS = [2, 3, 4, 5, 7, 10, 15, 20, 30, 50, 70, 100, 150, 200, 300, 500, 700, 1000];
  var CHIPS = [{ t: '2 to 5 times', v: 3 }, { t: '5 to 20 times', v: 10 }, { t: '20 to 100 times', v: 50 }, { t: '100 to 500 times', v: 200 }, { t: '500 times or more', v: 1000 }];
  function bucket(v) { return v < 5 ? 0 : v < 20 ? 1 : v < 100 ? 2 : v < 500 ? 3 : 4; }
  function logShare(v) { return 50 + 45 * Math.min(1, Math.max(0, Math.log(v) / Math.LN10 / 3)); }

  /* Screen copy per round. Names and labels are taken from FACTS; runtimes and channels stay off the pick screen. */
  var UI = [
    { mode: 'size', q: 'P&G made both films. Which one got more views, and by how much?',
      cap: { ricos: { name: "Rico's Tacos, episode 1", meta: 'A scripted comedy series' }, tideSpot: { name: 'School Lunch', meta: 'A Tide commercial' } },
      short: { ricos: "Rico's Tacos", tideSpot: 'School Lunch' }, read: 'the Taco Drama' },
    { mode: 'pick', q: 'Allstate made both. Which one do people remember?', hint: 'Tap the one you think people remember.',
      cap: { mayhem: { name: 'Mayhem', meta: 'One character since 2010, played by Dean Winters' }, checkFirst: { name: 'Check First: Swim Meet', meta: 'A new cast in every spot' } },
      short: { mayhem: 'Mayhem', checkFirst: 'Check First' } },
    { mode: 'size', q: "Red Bull made both films and posted them on its own channel. Which one got more views, and by how much?",
      cap: { stratos: { name: 'Stratos, the jump', meta: 'A live jump from the edge of space, streamed free on YouTube' }, confession: { name: 'Confession, the cartoon', meta: 'A Gives You Wiiings cartoon' } },
      short: { stratos: 'Stratos', confession: 'Confession' }, read: 'Red Bull Stratos' },
    { mode: 'pick', q: "YETI's name is on both films. Which one did more for YETI?", hint: E.pickInstruction,
      cap: { yetiFilm: { name: 'A Thousand Casts', meta: 'A YETI Presents documentary' }, pbrSponsor: { name: '2026 PBR YETI Bucking Bull Champion', meta: "YETI's name on a PBR bull riding award" } },
      short: { yetiFilm: 'A Thousand Casts', pbrSponsor: 'The PBR award' } }
  ];

  var S = { first: 0, res: [], vs: null, ctx: null };

  /* ---------- header strip ---------- */
  var slots = [], scoreB;
  (function buildStrip() {
    var s = $('strip');
    for (var i = 0; i < 4; i++) {
      var sl = el('span', 'slot'); sl.appendChild(document.createTextNode(String(i + 1)));
      var lb = el('span', 'lbl'); sl.appendChild(lb); sl._lbl = lb; slots.push(sl); s.appendChild(sl);
    }
    var sc = el('span', 'score', 'Score '); scoreB = el('b', null, '0'); sc.appendChild(scoreB); s.appendChild(sc);
  })();
  function points() { var n = 0; S.res.forEach(function (x) { if (x) n += (x.call ? 1 : 0) + (x.why ? 1 : 0); }); return n; }
  function updateStrip(now) {
    slots.forEach(function (sl, i) {
      var done = S.res[i] && S.res[i].done;
      sl.classList.toggle('lit', !!done);
      sl.classList.toggle('now', now === i && !done);
      sl._lbl.textContent = done ? R[i].rung : '';
      sl.setAttribute('aria-label', 'Round ' + (i + 1) + (done ? ', ' + R[i].rung : ''));
    });
    var p = String(points());
    if (scoreB.textContent !== p) { scoreB.textContent = p; scoreB.classList.remove('bump'); void scoreB.offsetWidth; scoreB.classList.add('bump'); }
  }

  /* ---------- helpers ---------- */
  function headH() { return $('head').offsetHeight; }
  function scrollToEl(node, pad) {
    if (!node) return;
    var y = node.getBoundingClientRect().top + window.pageYOffset - headH() - (pad == null ? 10 : pad);
    window.scrollTo({ top: Math.max(0, y), behavior: reduced ? 'auto' : 'smooth' });
  }
  function countUp(node, from, to, dur) {
    if (reduced) { node.textContent = fmt(to); return; }
    var t0 = null, done = false;
    function step(t) { if (done) return; if (t0 == null) t0 = t; var p = Math.min(1, (t - t0) / dur); var e = 1 - Math.pow(1 - p, 3); node.textContent = fmt(from + (to - from) * e); if (p < 1) requestAnimationFrame(step); else done = true; }
    requestAnimationFrame(step);
    setTimeout(function () { done = true; node.textContent = fmt(to); }, dur + 150);
  }
  function show(node) { requestAnimationFrame(function () { node.classList.add('in'); }); setTimeout(function () { node.classList.add('in'); }, 60); }
  function setStageH() {
    var h = window.innerHeight, w = window.innerWidth;
    var v = w < 860 ? Math.max(230, Math.min(360, Math.round(h * 0.37))) : Math.max(340, Math.min(470, Math.round(h * 0.5)));
    document.documentElement.style.setProperty('--stageH', v + 'px');
    if (S.ctx) placeFloats(S.ctx);
  }
  window.addEventListener('resize', setStageH);
  setStageH();
  function toast(t) { var n = $('toast'); n.textContent = t; n.classList.add('on'); clearTimeout(n._t); n._t = setTimeout(function () { n.classList.remove('on'); }, 2600); }

  /* ---------- YouTube: muted, user-started, own controls ---------- */
  var ytP = null;
  function loadYT() {
    if (ytP) return ytP;
    ytP = new Promise(function (res, rej) {
      if (window.YT && window.YT.Player) { res(); return; }
      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () { if (prev) { try { prev(); } catch (e) {} } res(); };
      var s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.async = true;
      s.onerror = function () { rej(new Error('YouTube API did not load')); };
      document.head.appendChild(s);
    });
    ytP.catch(function () {});
    return ytP;
  }
  var PV = { autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0, playsinline: 1, rel: 0, cc_load_policy: 1, cc_lang_pref: 'en' };
  function makePlayer(P) {
    P.player = new window.YT.Player(P.host, {
      host: 'https://www.youtube-nocookie.com', videoId: P.id, width: '100%', height: '100%', playerVars: PV,
      events: {
        onReady: function (e) { try { e.target.mute(); e.target.playVideo(); } catch (x) {} },
        onStateChange: function (e) { try { if (!e.target.isMuted()) e.target.mute(); } catch (x) {} P.state = e.data; setPauseLabel(P); }
      }
    });
  }
  function plainIframe(P) { // fallback only when the API cannot load; still muted and captioned
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + P.id + '?autoplay=1&mute=1&playsinline=1&rel=0&controls=0&disablekb=1&fs=0&cc_load_policy=1&cc_lang_pref=en';
    f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.title = P.title;
    P.host.replaceWith(f); P.host = f; P.plain = true;
  }
  function setPauseLabel(P) { if (P.pauseBtn) P.pauseBtn.textContent = (P.state === 1 || P.state === 3 || P.state == null) ? 'Pause' : 'Play'; }
  function stopAllPlayers() {
    if (!S.ctx) return;
    Object.keys(S.ctx.panes).forEach(function (k) { var P = S.ctx.panes[k]; try { if (P.player && P.player.pauseVideo) P.player.pauseVideo(); } catch (e) {} });
  }

  /* ---------- landing ---------- */
  function landing() {
    stopAllPlayers(); S.ctx = null; S.res = []; lightsDown(); updateStrip(-1);
    main.innerHTML = '';
    var w = el('section', 'lobby wrap');
    var reel = el('div', 'reel'); reel.setAttribute('aria-hidden', 'true');
    var track = el('div', 'reel-track');
    var ids = [];
    R.forEach(function (r) { shuffle(Object.keys(r.sides)).forEach(function (k) { ids.push(r.sides[k].videoId); }); });
    ids.concat(ids).forEach(function (id, j) {
      var fr = el('div', 'frame'); fr.style.animationDelay = reduced ? '0s' : (0.12 * (j % 8) + 0.3) + 's';
      var im = new Image(); im.alt = ''; im.decoding = 'async'; im.src = 'https://i.ytimg.com/vi/' + id + '/hq1.jpg';
      fr.appendChild(im); track.appendChild(fr);
    });
    reel.appendChild(track); w.appendChild(reel);
    w.appendChild(el('div', 'eyebrow', 'A game in four rounds'));
    w.appendChild(el('h1', null, E.title));
    w.appendChild(el('p', 'lead', E.lead));
    if (S.vs != null) { var vs = el('p', 'vs'); vs.appendChild(document.createTextNode('A colleague shared this game and got ')); vs.appendChild(el('b', null, S.vs + ' of 8')); vs.appendChild(document.createTextNode('.')); w.appendChild(vs); }
    var go = el('button', 'btn'); go.type = 'button'; go.id = 'start'; go.innerHTML = 'Start round one ' + ICON_ARROW;
    go.addEventListener('click', function () { S.first = 0; startRound(0); });
    w.appendChild(go);
    w.appendChild(el('p', 'notice', E.noticeAboutNumbers + ' Films play muted, and only when you tap them.'));
    var tq = el('figure', 'tomq');
    tq.appendChild(el('div', 'qm', '“'));
    tq.appendChild(el('blockquote', null, F.founderQuote.text));
    var cr = el('figcaption', 'cred'); cr.appendChild(document.createTextNode(E.founderCredit + '. '));
    var a = el('a', null, E.founderLink); a.href = F.founderQuote.url; a.target = '_blank'; a.rel = 'noopener'; cr.appendChild(a);
    tq.appendChild(cr); w.appendChild(tq);
    main.appendChild(w);
    window.scrollTo(0, 0);
  }

  /* ---------- a round: one stage, built once, changed in place ---------- */
  function startRound(i) {
    stopAllPlayers();
    var r = R[i], u = UI[i];
    var keys = shuffle(Object.keys(r.sides));
    var sec = el('section', 'round wrap'); sec.dataset.round = String(i + 1); sec.dataset.phase = 'call';
    var mq = el('div', 'marquee'); mq.appendChild(el('div', 'eyebrow', 'Round ' + (i + 1) + ' of 4 · ' + r.company)); sec.appendChild(mq);
    sec.appendChild(el('h2', 'q', u.q));
    sec.appendChild(el('p', 'hint', u.mode === 'size' ? 'Tap the film you think got more views. Then set how big the gap is.' : u.hint));
    var ctx = { i: i, r: r, u: u, keys: keys, sec: sec, panes: {}, backed: null, snap: null, split: 50, watching: null, locked: false };
    S.ctx = ctx;
    buildStage(ctx);
    buildControls(ctx);
    ctx.after = el('div', 'after'); sec.appendChild(ctx.after);
    main.innerHTML = ''; main.appendChild(sec);
    updateStrip(i);
    window.scrollTo(0, 0);
    applySplit(ctx);
    setTimeout(function () { placeFloats(ctx); }, 60);
    loadYT(); // the script only; no film loads until a tap on "Watch muted"
  }

  function buildStage(ctx) {
    var st = el('div', 'stage'); ctx.stage = st;
    ctx.keys.forEach(function (k) { st.appendChild(buildPane(ctx, k)); });
    ctx.seam = el('div', 'seam'); st.appendChild(ctx.seam);
    ctx.ghost = el('div', 'ghost'); st.appendChild(ctx.ghost);
    ctx.ghostLbl = el('div', 'ghost-lbl'); st.appendChild(ctx.ghostLbl);
    ctx.readout = el('div', 'readout idle', 'About the same'); st.appendChild(ctx.readout);
    var L = el('div', 'leader'); var d = el('div', 'dial'); var n = el('span', 'n', '3'); d.appendChild(n); L.appendChild(d); L.appendChild(el('div', 'skipnote', 'Tap to skip'));
    ctx.leader = L; st.appendChild(L);
    ctx.sec.appendChild(st);
  }

  function buildPane(ctx, key) {
    var side = ctx.r.sides[key], cap = ctx.u.cap[key];
    var p = el('div', 'pane'); p.dataset.key = key; p.setAttribute('role', 'button'); p.tabIndex = 0; p.setAttribute('aria-pressed', 'false');
    p.setAttribute('aria-label', 'Pick ' + cap.name);
    var flip = el('div', 'flip'), front = el('div', 'face front'), back = el('div', 'face back');
    var stills = el('div', 'stills');
    ['hq1', 'hq2', 'hq3'].forEach(function (s, j) {
      var im = new Image(); im.alt = ''; im.decoding = 'async'; if (j === 0) im.className = 'on';
      im.onerror = function () { this.onerror = null; this.src = 'https://i.ytimg.com/vi/' + side.videoId + '/hqdefault.jpg'; };
      im.src = 'https://i.ytimg.com/vi/' + side.videoId + '/' + s + '.jpg'; stills.appendChild(im);
    });
    front.appendChild(stills); front.appendChild(el('div', 'shade'));
    var ov = el('div', 'ov'); front.appendChild(ov);
    var c = el('div', 'cap'); var tag = el('span', 'tag', 'Your pick'); c.appendChild(tag); c.appendChild(el('div', 'name', cap.name)); c.appendChild(el('div', 'meta', cap.meta)); front.appendChild(c);
    var wb = el('button', 'watch'); wb.type = 'button'; wb.innerHTML = ICON_PLAY + '<span>Watch muted</span>';
    wb.setAttribute('aria-label', 'Watch ' + cap.name + ', muted');
    wb.addEventListener('click', function (e) { e.stopPropagation(); watch(ctx, key); });
    front.appendChild(wb);
    front.appendChild(el('div', 'rim'));
    flip.appendChild(front); flip.appendChild(back); p.appendChild(flip);
    // Film layer: sits outside the flip so a playing film never rotates or remounts.
    var vid = el('div', 'vid'); var host = el('div', 'host'); vid.appendChild(host);
    var bar = el('div', 'vidbar');
    var pb = el('button', null, 'Pause'); pb.type = 'button';
    var mt = el('span', 'mutedtag', 'Muted');
    var cb = el('button', null, 'Back to both films'); cb.type = 'button';
    bar.appendChild(pb); bar.appendChild(mt); bar.appendChild(cb); vid.appendChild(bar); p.appendChild(vid);
    var P = { el: p, key: key, id: side.videoId, title: side.videoLabel, ov: ov, tag: tag, back: back, vid: vid, host: host, pauseBtn: pb, closeBtn: cb, player: null, state: null };
    ctx.panes[key] = P;
    pb.addEventListener('click', function (e) { e.stopPropagation(); togglePause(P); });
    cb.addEventListener('click', function (e) { e.stopPropagation(); closeFilm(ctx, key); });
    vid.addEventListener('click', function (e) { e.stopPropagation(); });
    p.addEventListener('click', function () { backFilm(ctx, key); });
    p.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target === p) { e.preventDefault(); backFilm(ctx, key); } });
    return p;
  }

  function watch(ctx, key) {
    var P = ctx.panes[key];
    Object.keys(ctx.panes).forEach(function (k) { if (k !== key) closeFilm(ctx, k); });
    if (!ctx.locked) { ctx.watching = key; ctx.stage.classList.add('watching'); P.closeBtn.textContent = 'Back to both films'; }
    else { P.closeBtn.textContent = 'Close film'; }
    P.vid.classList.add('show');
    applySplit(ctx);
    if (P.player && P.player.playVideo) { try { P.player.mute(); P.player.playVideo(); } catch (e) {} return; }
    if (P.plain || P.player) return;
    if (window.YT && window.YT.Player) { makePlayer(P); return; } // created right here, inside the tap
    loadYT().then(function () { if (!P.player) makePlayer(P); }, function () { plainIframe(P); });
  }
  function togglePause(P) {
    if (!P.player || !P.player.getPlayerState) return;
    try { if (P.player.getPlayerState() === 1) { P.player.pauseVideo(); P.state = 2; } else { P.player.mute(); P.player.playVideo(); P.state = 1; } } catch (e) {}
    setPauseLabel(P);
  }
  function closeFilm(ctx, key) {
    var P = ctx.panes[key];
    try { if (P.player && P.player.pauseVideo) P.player.pauseVideo(); } catch (e) {}
    P.vid.classList.remove('show'); // kept mounted, only hidden
    if (ctx.watching === key) { ctx.watching = null; ctx.stage.classList.remove('watching'); }
    applySplit(ctx);
  }

  function setSplit(ctx, leftPct) { ctx.split = leftPct; applySplit(ctx); }
  function applySplit(ctx) {
    var L = ctx.split;
    if (ctx.watching) L = ctx.watching === ctx.keys[0] ? 100 : 0;
    var a = ctx.panes[ctx.keys[0]], b = ctx.panes[ctx.keys[1]];
    a.el.style.width = L + '%'; b.el.style.width = (100 - L) + '%';
    a.el.classList.toggle('slim', !ctx.watching && L < 24);
    b.el.classList.toggle('slim', !ctx.watching && 100 - L < 24);
    var narrowStage = ctx.stage.clientWidth < 700;
    a.el.classList.toggle('mid', narrowStage && L < 46); b.el.classList.toggle('mid', narrowStage && 100 - L < 46);
    ctx.seam.style.left = L + '%';
    placeFloats(ctx);
  }
  function clampX(ctx, node, pct) {
    var W = ctx.stage.clientWidth, w = node.offsetWidth, x = pct / 100 * W;
    return Math.max(w / 2 + 8, Math.min(W - w / 2 - 8, x));
  }
  function placeFloats(ctx) {
    if (!ctx.stage) return;
    ctx.readout.style.left = clampX(ctx, ctx.readout, ctx.split) + 'px';
    if (ctx.ghostAt != null) {
      ctx.ghost.style.left = ctx.ghostAt + '%';
      ctx.ghostLbl.style.left = (clampX(ctx, ctx.ghostLbl, ctx.ghostAt) - ctx.ghostLbl.offsetWidth / 2) + 'px';
    }
  }

  /* ---------- the call ---------- */
  function buildControls(ctx) {
    var c = el('div', 'controls' + (ctx.u.mode === 'size' ? '' : ' nosize')); ctx.controls = c;
    if (ctx.u.mode === 'size') {
      var sz = el('div', 'size off'); ctx.size = sz;
      var top = el('div', 'size-top'); top.appendChild(el('span', 'lbl', 'By how much?'));
      ctx.out = el('output', null, 'Tap a film first'); top.appendChild(ctx.out); sz.appendChild(top);
      var rg = el('input', 'range'); rg.type = 'range'; rg.min = '0'; rg.max = String(SNAPS.length - 1); rg.step = '1'; rg.value = '0'; rg.disabled = true;
      rg.setAttribute('aria-label', 'How many times more views the film you back got');
      rg.setAttribute('aria-valuetext', 'Not set');
      rg.addEventListener('input', function () { setSnap(ctx, +rg.value); });
      ctx.range = rg; sz.appendChild(rg);
      var chips = el('div', 'chips'); ctx.chips = [];
      CHIPS.forEach(function (ch, j) {
        var b = el('button', 'chip', ch.t); b.type = 'button'; b.disabled = true; b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () { setSnap(ctx, SNAPS.indexOf(ch.v)); });
        ctx.chips.push(b); chips.appendChild(b);
      });
      sz.appendChild(chips); c.appendChild(sz);
    }
    var lr = el('div', 'lockrow');
    var lk = el('button', 'btn', 'Lock in my call'); lk.type = 'button'; lk.id = 'lock'; lk.disabled = true;
    lk.addEventListener('click', function () { lockIn(ctx); });
    ctx.lock = lk; lr.appendChild(lk); c.appendChild(lr);
    ctx.sec.appendChild(c);
  }
  function backFilm(ctx, key) {
    if (ctx.locked || ctx.watching) return;
    ctx.backed = key;
    Object.keys(ctx.panes).forEach(function (k) { var on = k === key; ctx.panes[k].el.classList.toggle('backed', on); ctx.panes[k].el.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    if (ctx.size) { ctx.size.classList.remove('off'); ctx.range.disabled = false; ctx.chips.forEach(function (b) { b.disabled = false; }); }
    updateCall(ctx);
  }
  function setSnap(ctx, idx) {
    if (!ctx.backed || ctx.locked) return;
    ctx.snap = idx; ctx.range.value = String(idx);
    ctx.range.style.setProperty('--fill', (idx / (SNAPS.length - 1) * 100) + '%');
    var b = bucket(SNAPS[idx]);
    ctx.chips.forEach(function (c, j) { c.setAttribute('aria-pressed', j === b ? 'true' : 'false'); });
    updateCall(ctx);
  }
  function updateCall(ctx) {
    var share = 50, text = 'About the same', idle = true;
    if (ctx.backed) {
      idle = false;
      if (ctx.u.mode === 'size') {
        if (ctx.snap == null) { share = 56; text = ctx.u.short[ctx.backed]; ctx.out.textContent = 'Drag, or tap a size'; }
        else {
          var v = SNAPS[ctx.snap]; share = logShare(v); text = fmt(v) + ' times';
          ctx.out.textContent = 'About ' + fmt(v) + ' times the views';
          ctx.range.setAttribute('aria-valuetext', ctx.u.short[ctx.backed] + ', about ' + fmt(v) + ' times the views');
        }
      } else { share = 62; text = ctx.u.short[ctx.backed]; }
    }
    ctx.readout.textContent = text; ctx.readout.classList.toggle('idle', idle);
    setSplit(ctx, ctx.backed === ctx.keys[1] ? 100 - share : share);
    ctx.lock.disabled = !(ctx.backed && (ctx.u.mode !== 'size' || ctx.snap != null));
  }

  function countdown(ctx) {
    return new Promise(function (res) {
      if (reduced) { res(); return; }
      var L = ctx.leader, n = L.querySelector('.n'), d = L.querySelector('.dial'), t0 = Date.now(), done = false, iv;
      function fin() { if (done) return; done = true; clearInterval(iv); L.classList.remove('on'); res(); }
      L.classList.add('on'); L.onclick = fin; n.textContent = '3';
      iv = setInterval(function () { var t = Date.now() - t0; n.textContent = String(Math.max(1, 3 - Math.floor(t / 400))); d.style.setProperty('--sweep', ((t % 400) / 400 * 360) + 'deg'); if (t >= 1200) fin(); }, 30);
      setTimeout(fin, 1350);
    });
  }

  function lockIn(ctx) {
    if (ctx.locked || ctx.lock.disabled) return;
    ctx.locked = true;
    var r = ctx.r, u = ctx.u, win = r.winner, lose = loserKey(r), i = ctx.i;
    ctx.sec.dataset.phase = 'reveal';
    ctx.controls.hidden = true;
    if (ctx.watching) { var wk = ctx.watching; ctx.watching = null; ctx.stage.classList.remove('watching'); ctx.panes[wk].closeBtn.textContent = 'Close film'; }
    Object.keys(ctx.panes).forEach(function (k) { ctx.panes[k].closeBtn.textContent = 'Close film'; ctx.panes[k].el.removeAttribute('role'); ctx.panes[k].el.removeAttribute('tabindex'); ctx.panes[k].el.removeAttribute('aria-pressed'); });
    var right = ctx.backed === win, real = ratioOf(r), callOK;
    if (u.mode === 'size') { ctx.callV = SNAPS[ctx.snap]; callOK = right && bucket(ctx.callV) === bucket(real); }
    else callOK = right;
    S.res[i] = { call: callOK, why: false, done: false };
    ctx.panes[ctx.backed].tag.textContent = 'Your call';
    if (u.mode === 'size') {
      ctx.ghostAt = ctx.split; ctx.ghostLbl.textContent = 'Your call: about ' + fmt(ctx.callV) + ' times';
      ctx.ghost.classList.add('on'); ctx.ghostLbl.classList.add('on');
    }
    applySplit(ctx);
    scrollToEl(ctx.stage, 8);
    countdown(ctx).then(function () { reveal(ctx, right, callOK, real); });
  }

  function reveal(ctx, right, callOK, real) {
    var r = ctx.r, u = ctx.u, i = ctx.i, win = r.winner, lose = loserKey(r);
    ctx.sec.classList.add('revealed');
    if (u.mode === 'size') {
      var sh = logShare(real); setSplit(ctx, win === ctx.keys[0] ? sh : 100 - sh);
      ctx.readout.textContent = ratioText(real); ctx.readout.classList.remove('idle'); ctx.readout.classList.add('big');
      later(20, function () { placeFloats(ctx); });
    } else {
      setSplit(ctx, 50); ctx.readout.style.opacity = '0';
    }
    updateStrip(i);
    var b = el('div', 'blk wide');
    var v = el('p', 'verdict');
    if (i === 1) {
      v.innerHTML = callOK ? '<b>' + E.correctPick + '</b> People remember Mayhem.' : 'Your call went to Check First. Here is what the research found.';
    } else if (i === 3) {
      v.innerHTML = callOK ? '<b>' + E.correctPick + '</b> The film did more for YETI.' : 'Your call went to the award. Here is where each film sits, and what each one got.';
    } else if (!right) {
      v.textContent = 'Your call went to the other film. Here is what each film got.';
    } else if (callOK) {
      v.innerHTML = '<b>' + E.correctPick + '</b> Right film, and the right size of gap.';
    } else {
      v.textContent = bucket(real) > bucket(ctx.callV) ? 'Right film. The real gap was bigger than your call.' : 'Right film. The real gap was smaller than your call.';
    }
    b.appendChild(v);
    if (i === 1) revealCast(ctx, b); else revealViews(ctx, b, real);
    ctx.after.appendChild(b); show(b);
    // The rung beat for each round, then the why question.
    if (i === 0) beatSeries(ctx);
    else if (i === 1) { beatSeats(ctx); later(500, function () { askWhy(ctx); }); }
    else if (i === 2) { beatSquares(ctx); later(500, function () { askWhy(ctx); }); }
    else { beatOwn(ctx); later(400, function () { askWhy(ctx); }); }
  }

  function numCell(ctx, key, isWin, unit) {
    var side = ctx.r.sides[key];
    var c = el('div', 'num'); c.appendChild(el('div', 'nm', ctx.u.cap[key].name));
    var v = el('div', 'v' + (isWin ? ' win' : ''), '0'); c.appendChild(v); c.appendChild(el('div', 'u', unit || 'views on ' + side.channel));
    countUp(v, 0, side.views, 1100);
    return c;
  }
  function ratioRow(big1, sub1, big2, sub2) {
    var rr = el('div', 'ratio');
    [[big1, sub1, 'rb o'], [big2, sub2, 'rb']].forEach(function (c) { var d = el('div', 'rc'); d.appendChild(el('div', c[2], c[0])); d.appendChild(el('div', 'rs', c[1])); rr.appendChild(d); });
    return rr;
  }
  function chanPair(r) { var w = r.sides[r.winner].channel, l = r.sides[loserKey(r)].channel; return w === l ? ['Same channel', 'Both films sit on ' + w + '’s channel'] : ['Different channels', w + ' and ' + l]; }
  function creditRow(ctx, text) {
    var c = el('p', 'credit'); c.appendChild(el('span', null, text));
    var s = el('button', 'link', 'Sources'); s.type = 'button'; s.addEventListener('click', function () { openSources(ctx.i); });
    c.appendChild(s); return c;
  }
  function revealViews(ctx, b, real) {
    var r = ctx.r, win = r.winner, lose = loserKey(r);
    var nums = el('div', 'nums');
    ctx.keys.forEach(function (k) { nums.appendChild(numCell(ctx, k, k === win)); });
    b.appendChild(nums);
    var cp = chanPair(r);
    b.appendChild(ratioRow(ratioText(real), 'The views, ' + ctx.u.short[win] + ' against ' + ctx.u.short[lose].replace(/^The /, 'the '), cp[0], cp[1]));
    b.appendChild(creditRow(ctx, 'View counts come straight from YouTube.'));
    if (ctx.i !== 3) {
      var tools = el('div', 'tools'); var t = el('button', 'btn-quiet', 'See the views at true scale'); t.type = 'button';
      var trueScale = false;
      t.addEventListener('click', function () {
        trueScale = !trueScale;
        var W = ctx.bigWin || r.sides[win].views, Lv = r.sides[lose].views;
        var sh = trueScale ? Math.min(99.4, W / (W + Lv) * 100) : logShare(W / Lv);
        setSplit(ctx, win === ctx.keys[0] ? sh : 100 - sh);
        t.textContent = trueScale ? 'Back to the call view' : 'See the views at true scale';
      });
      tools.appendChild(t); b.appendChild(tools);
    }
  }
  function revealCast(ctx, b) {
    var r = ctx.r, ev = r.evidence, cf = r.sides.checkFirst;
    var pm = ctx.panes.mayhem.ov, pc = ctx.panes.checkFirst.ov;
    pm.appendChild(el('div', 'big win', ev[0].stat)); pm.appendChild(el('div', 's', ev[0].label));
    pc.appendChild(el('div', 'big', cf.campaignSpots.length + ' casts')); pc.appendChild(el('div', 's', 'One line in every spot: “' + cf.repeatedLine + '”'));
    later(150, function () { pm.classList.add('on'); pc.classList.add('on'); });
    var stats = el('div', 'stats');
    [[ev[0].stat, "Mayhem's place for the " + lower1(ev[0].label)], [ev[1].stat, "Mayhem's " + lower1(ev[1].label)]].forEach(function (x) { var s = el('div', 'stat'); s.appendChild(el('div', 'v', x[0])); s.appendChild(el('div', 'l', x[1])); stats.appendChild(s); });
    b.appendChild(stats);
    var cfp = el('p', null, 'Check First runs ' + cf.campaignSpots.length + ' spots: ' + cf.campaignSpots.slice(0, -1).join(', ') + ' and ' + cf.campaignSpots[cf.campaignSpots.length - 1] + '. Each has a new cast, and each one says “' + cf.repeatedLine + '”');
    cfp.style.margin = '.9rem 0 0'; cfp.style.color = 'var(--soft)';
    b.appendChild(cfp);
    b.appendChild(creditRow(ctx, 'MarketCast, January 2024 to February 2025, via MarTech Edge.'));
  }

  /* Round 1 beat: the other 21 episodes, drawn at their real heights. */
  function beatSeries(ctx) {
    var r = ctx.r, s = r.sides.ricos, tide = r.sides.tideSpot, eps = r.episodes;
    var b = el('div', 'blk wide');
    b.appendChild(el('h3', null, "That was episode 1. Rico's Tacos ran as a series, " + s.cadence + ', from ' + s.runDates + '.'));
    var go = el('button', 'btn-quiet', 'Show all ' + eps.length + ' episodes'); go.type = 'button'; go.id = 'runSeries';
    b.appendChild(go);
    var bars = el('div', 'bars'); var max = 0; eps.forEach(function (e) { if (e.views > max) max = e.views; });
    var ref = el('div', 'ref'); ref.style.bottom = (tide.views / max * 160) + 'px'; 
    var barEls = eps.map(function (e, j) { var d = el('div', 'bar' + (j === 0 ? ' first' : '')); d.title = 'Episode ' + e.ep + ', ' + e.title + ': ' + fmt(e.views) + ' views'; bars.appendChild(d); return d; });
    bars.appendChild(ref);
    barEls[0].style.height = (eps[0].views / max * 160) + 'px';
    b.appendChild(bars);
    var ax = el('div', 'axis'); ax.appendChild(el('span', null, 'Episode 1')); ax.appendChild(el('span', null, 'Last episode')); b.appendChild(ax);
    var tl = el('div', 'tally'); var tv = el('span', 'v', fmt(eps[0].views)); var tlab = el('span', 'l', 'views for episode 1'); tl.appendChild(tv); tl.appendChild(tlab); b.appendChild(tl);
    var cap = el('p', 'small', 'Each bar is one episode. The dashed line is the Tide film, School Lunch, at ' + fmt(tide.views) + ' views.'); cap.style.margin = '.5rem 0 0'; b.appendChild(cap);
    ctx.after.appendChild(b); show(b);
    go.addEventListener('click', function () {
      if (go.disabled) return; go.disabled = true; go.hidden = true;
      ref.classList.add('on');
      var sum = 0, step = reduced ? 0 : 75;
      eps.forEach(function (e, j) {
        setTimeout(function () { barEls[j].style.height = Math.max(2, e.views / max * 160) + 'px'; }, j * step);
      });
      eps.forEach(function (e) { sum += e.views; });
      tlab.textContent = 'views for ' + eps.length + ' episodes together';
      countUp(tv, eps[0].views, s.totalViews, eps.length * step + 300);
      later(eps.length * step + 350, function () {
        var x = s.totalViews / tide.views; ctx.bigWin = s.totalViews;
        var sh = logShare(x); setSplit(ctx, ctx.keys[0] === 'ricos' ? sh : 100 - sh);
        ctx.readout.textContent = ratioText(x); later(20, function () { placeFloats(ctx); });
        var above = eps.filter(function (e) { return e.views > tide.views; }).length;
        var cp = chanPair(r);
        b.appendChild(ratioRow(ratioText(x), 'The views, ' + eps.length + ' episodes together against one Tide film', cp[0], cp[1]));
        var p = el('p', 'small', above + ' of the ' + eps.length + ' episodes each got more views than the Tide film.'); p.style.margin = '.7rem 0 0'; b.appendChild(p);
        later(500, function () { askWhy(ctx); });
      });
    });
  }

  /* Round 2 beat: one hundred seats, one per percent of the people asked. */
  function beatSeats(ctx) {
    var ev = ctx.r.evidence[2];
    var pct = parseInt(ev.stat, 10);
    var b = el('div', 'blk wide');
    b.appendChild(el('p', null, 'Insurity asked more than 1,000 US adults which insurance mascot they would most like to grab a beer with.'));
    var row = el('div', 'seatrow');
    var seats = el('div', 'seats'); seats.setAttribute('role', 'img'); seats.setAttribute('aria-label', pct + ' of 100 seats lit');
    var ss = []; for (var j = 0; j < 100; j++) { var s = el('span', 'seat'); ss.push(s); seats.appendChild(s); }
    row.appendChild(seats);
    var t = el('div'); var pv = el('div', 'pct', '0%'); t.appendChild(pv); t.appendChild(el('p', null, ev.label + '.')); row.appendChild(t);
    b.appendChild(row);
    var cr = el('p', 'credit', 'Each seat is one percent of the people asked. ' + ctx.r.evidenceScope.split('. ')[0] + '.'); b.appendChild(cr);
    ctx.after.appendChild(b); show(b);
    var step = reduced ? 0 : 28;
    for (var k = 0; k < pct; k++) (function (k) { setTimeout(function () { ss[k].classList.add('on'); pv.textContent = (k + 1) + '%'; }, 400 + k * step); })(k);
    setTimeout(function () { ss.slice(0, pct).forEach(function (x) { x.classList.add('on'); }); pv.textContent = pct + '%'; }, reduced ? 0 : 400 + pct * step + 200);
  }

  /* Round 3 beat: each square is the cartoon's whole view count. */
  function beatSquares(ctx) {
    var r = ctx.r, big = r.sides.stratos, small = r.sides.confession, x = big.views / small.views;
    var b = el('div', 'blk wide');
    b.appendChild(el('h3', null, "Each square is the cartoon's whole view count: " + fmt(small.views) + ' views.'));
    var callSq = ctx.backed === 'stratos' ? Math.min(ctx.callV, 400) : 0;
    var n = Math.ceil(Math.max(x, callSq) / 20) * 20;
    var grid = el('div', 'squares'); grid.style.gridTemplateColumns = 'repeat(20,1fr)';
    grid.setAttribute('role', 'img'); grid.setAttribute('aria-label', 'The jump got ' + lower1(ratioText(x)) + ' the views of the cartoon');
    var sq = []; for (var j = 0; j < n; j++) { var s = el('span', 'sq' + (j < callSq ? ' call' : '')); var f = el('i'); s.appendChild(f); sq.push(f); grid.appendChild(s); }
    b.appendChild(grid);
    var lg = el('div', 'legend');
    var a0 = el('span'); var i0 = el('i'); i0.style.background = 'var(--cream)'; a0.appendChild(i0); a0.appendChild(document.createTextNode('Confession, the cartoon: one square')); lg.appendChild(a0);
    var a1 = el('span'); var i1 = el('i'); i1.style.background = 'var(--o)'; a1.appendChild(i1); a1.appendChild(document.createTextNode('Stratos, the jump: ' + lower1(ratioText(x)).replace(' times', ' squares'))); lg.appendChild(a1);
    if (callSq) { var a2 = el('span'); var i2 = el('i'); i2.style.boxShadow = 'inset 0 0 0 1px rgba(245,242,236,.8)'; a2.appendChild(i2); a2.appendChild(document.createTextNode('Your call' + (ctx.callV > 400 ? ', ' + fmt(ctx.callV) + ' squares, runs past the chart' : ''))); lg.appendChild(a2); }
    b.appendChild(lg);
    var p = el('p', null, 'The live jump drew ' + big.concurrentStreams + '.'); p.style.margin = '.9rem 0 0'; b.appendChild(p);
    b.appendChild(el('p', 'credit', big.concurrentSource + '.'));
    ctx.after.appendChild(b); show(b);
    var full = Math.floor(x), part = x - full, step = reduced ? 0 : Math.max(4, Math.round(1500 / full));
    for (var k = 0; k <= full && k < n; k++) (function (k) {
      setTimeout(function () { sq[k].style.width = (k < full ? 100 : Math.round(part * 100)) + '%'; }, 300 + k * step);
    })(k);
  }

  /* Round 4 beat: turn both films round to show whose channel each one sits on. */
  function beatOwn(ctx) {
    var r = ctx.r;
    var y = ctx.panes.yetiFilm.back, p = ctx.panes.pbrSponsor.back;
    y.appendChild(el('div', 'k', 'This film sits on')); y.appendChild(el('div', 'big win', "YETI's channel")); y.appendChild(el('div', 's', 'YETI owns this channel.'));
    p.appendChild(el('div', 'k', 'This film sits on')); p.appendChild(el('div', 'big', "PBR's channel")); p.appendChild(el('div', 's', "PBR owns this channel. YETI's name is on the award."));
    later(250, function () { ctx.panes.yetiFilm.el.classList.add('flipped'); });
    later(450, function () { ctx.panes.pbrSponsor.el.classList.add('flipped'); });
    var b = el('div', 'blk fact wide');
    b.appendChild(el('p', null, r.quote.text));
    b.appendChild(el('p', 'credit', r.quote.cite + '.'));
    ctx.after.appendChild(b); show(b);
  }

  /* ---------- why ---------- */
  function askWhy(ctx) {
    if (ctx.whyShown) return; ctx.whyShown = true;
    var r = ctx.r, b = el('div', 'blk wide'); ctx.whyBlk = b;
    b.appendChild(el('h3', null, r.why.question));
    var opts = el('div', 'opts');
    shuffle(r.why.options).forEach(function (o) {
      var btn = el('button', 'opt'); btn.type = 'button'; btn.appendChild(el('span', 'txt', o.text)); btn._o = o;
      btn.addEventListener('click', function () { answer(ctx, btn, opts); });
      opts.appendChild(btn);
    });
    b.appendChild(opts);
    ctx.after.appendChild(b); show(b);
    later(120, function () { scrollToEl(b, 16); });
  }
  function answer(ctx, btn, opts) {
    if (ctx.answered) return; ctx.answered = true;
    var all = Array.prototype.slice.call(opts.children);
    btn.classList.add('press'); all.forEach(function (x) { x.disabled = true; });
    later(300, function () {
      btn.classList.remove('press');
      var ok = btn._o.side === ctx.r.winner;
      S.res[ctx.i].why = ok;
      all.forEach(function (x) {
        var right = x._o.side === ctx.r.winner, mine = x === btn;
        if (right) { x.classList.add('right'); var t = el('span', 'otag'); t.innerHTML = ICON_TICK + 'Why it worked'; x.insertBefore(t, x.firstChild); x.insertBefore(el('br'), t.nextSibling); }
        else if (mine) { x.classList.add('mine'); var t2 = el('span', 'otag', 'Your answer'); x.insertBefore(t2, x.firstChild); x.insertBefore(el('br'), t2.nextSibling); }
      });
      var wl = el('p', 'whyline', ok ? E.correctReason : 'The reason that fits the evidence is marked.');
      ctx.whyBlk.appendChild(wl);
      updateStrip(ctx.i);
      endRound(ctx);
    });
  }

  function endRound(ctx) {
    var r = ctx.r, i = ctx.i;
    if (ctx.u.read) {
      var q = el('figure', 'blk quote wide'); q.style.margin = '0';
      q.appendChild(el('div', 'qm', '“'));
      q.appendChild(el('blockquote', null, r.quote.text));
      var cite = el('figcaption', 'cite'); cite.appendChild(document.createTextNode(r.quote.cite + '. '));
      var a = el('a', null, E.readMore.replace('{subject}', ctx.u.read)); a.href = r.quote.url; a.target = '_blank'; a.rel = 'noopener'; cite.appendChild(a);
      q.appendChild(cite); ctx.after.appendChild(q); show(q);
    }
    var end = el('div', 'endrow blk wide'); end.style.background = 'transparent'; end.style.border = '0'; end.style.padding = '0';
    var tk = el('div', 'ticket print');
    tk.appendChild(el('span', 'tn', String(i + 1)));
    var tx = el('div'); tx.appendChild(el('div', 'tt', 'Round ' + (i + 1) + ' · ' + r.company)); tx.appendChild(el('div', 'tr', r.rung)); tk.appendChild(tx);
    var mk = el('span', 'marks'); mk.appendChild(el('span', 'mk' + (S.res[i].call ? ' on' : ''))); mk.appendChild(el('span', 'mk' + (S.res[i].why ? ' on' : ''))); mk.setAttribute('aria-label', (S.res[i].call ? 1 : 0) + (S.res[i].why ? 1 : 0) + ' of 2 points'); tk.appendChild(mk);
    end.appendChild(tk);
    var nx = el('button', 'btn next'); nx.type = 'button';
    nx.innerHTML = (i < 3 ? 'Next: Round ' + (i + 2) + ', ' + R[i + 1].company : 'See your score') + ' ' + ICON_ARROW;
    nx.addEventListener('click', function () { if (i < 3) startRound(i + 1); else showResult(); });
    end.appendChild(nx);
    ctx.after.appendChild(end); show(end);
    later(700, function () { fly(tk, i); });
  }
  function fly(tk, i) {
    function light() { S.res[i].done = true; updateStrip(-1); slots[i].classList.remove('pop'); void slots[i].offsetWidth; slots[i].classList.add('pop'); }
    var slot = slots[i];
    if (reduced || !tk.animate) { light(); return; }
    var a = tk.getBoundingClientRect(), b = slot.getBoundingClientRect();
    if (a.bottom < 0 || a.top > window.innerHeight) { light(); return; }
    var c = tk.cloneNode(true); c.classList.remove('print'); c.classList.add('flyer');
    c.style.left = a.left + 'px'; c.style.top = a.top + 'px'; c.style.width = a.width + 'px'; c.style.height = a.height + 'px';
    document.body.appendChild(c);
    var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2), s = Math.max(0.08, b.width / a.width);
    c.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')', opacity: 0.15 }], { duration: 650, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' });
    setTimeout(function () { c.remove(); light(); }, 680);
  }

  /* ---------- result and finale ---------- */
  function showResult() {
    stopAllPlayers(); S.ctx = null;
    S.res.forEach(function (x) { if (x) x.done = true; });
    updateStrip(-1);
    main.innerHTML = '';
    var played = []; S.res.forEach(function (x, i) { if (x) played.push(i); });
    var total = played.length * 2, n = points();
    var res = el('section', 'result wrap');
    res.appendChild(el('div', 'eyebrow', 'Your score'));
    var bs = el('div', 'bigscore'); var bn = el('span', null, '0'); bs.appendChild(bn); bs.appendChild(document.createTextNode(' ')); bs.appendChild(el('span', 'of', 'of')); bs.appendChild(document.createTextNode(' ' + total));
    res.appendChild(bs); countUp(bn, 0, n, 900);
    res.appendChild(el('p', 'sub', 'One point for each call and one for each reason.'));
    var stubs = el('div', 'stubs');
    played.forEach(function (i, j) {
      var x = S.res[i], s = el('div', 'stub');
      s.appendChild(el('div', 'tt', 'Round ' + (i + 1) + ' · ' + R[i].company)); s.appendChild(el('div', 'tr', R[i].rung));
      var ms = el('div', 'ms');
      [['Call', x.call], ['Reason', x.why]].forEach(function (m) { var sp = el('span'); sp.appendChild(el('span', 'mk' + (m[1] ? ' on' : ''))); sp.appendChild(document.createTextNode(m[0])); ms.appendChild(sp); });
      s.appendChild(ms); stubs.appendChild(s);
      later(250 + j * 140, function () { s.classList.add('in'); });
    });
    res.appendChild(stubs);
    var up = el('button', 'btn', 'See what the four rounds add up to'); up.type = 'button'; up.id = 'lightsBtn';
    res.appendChild(up);
    main.appendChild(res);

    var fin = el('section', 'finale wrap'); var nw = el('div', 'narrow'); fin.appendChild(nw);
    nw.appendChild(el('div', 'eyebrow', 'The Legendeering Framework'));
    nw.appendChild(el('h2', null, 'What the four rounds add up to'));
    var ol = el('ol', 'ladder');
    R.forEach(function (r, i) {
      var li = el('li', 'rung'); li.appendChild(el('span', 'n', String(i + 1)));
      var d = el('div'); d.appendChild(el('h3', null, r.rung)); d.appendChild(el('p', null, F.synthesis[i])); li.appendChild(d); ol.appendChild(li);
    });
    nw.appendChild(ol);
    var pr = el('div', 'princ'); pr.appendChild(el('div', 'eyebrow', "Tom Langan's principles"));
    var ul = el('ul'); F.principles.forEach(function (p) { ul.appendChild(el('li', null, p)); }); pr.appendChild(ul); nw.appendChild(pr);
    var cl = el('div', 'closing'); cl.appendChild(el('div', 'eyebrow', 'Now your company')); cl.appendChild(el('p', 'cq', F.closingQuestion)); nw.appendChild(cl);
    var cta = el('div', 'cta'); cta.id = 'cta';
    cta.appendChild(el('h2', null, F.cta.heading)); cta.appendChild(el('p', null, F.cta.copy));
    var bk = el('a', 'btn', F.cta.button); bk.href = F.cta.url; bk.target = '_blank'; bk.rel = 'noopener'; cta.appendChild(bk);
    nw.appendChild(cta);
    var ac = el('div', 'after-cta');
    var sh = el('button', 'btn-quiet', 'Send this to a colleague'); sh.type = 'button'; sh.addEventListener('click', function () { shareScore(n, total); });
    var ag = el('button', 'btn-quiet', 'Play again'); ag.type = 'button'; ag.addEventListener('click', function () { try { history.replaceState(null, '', location.pathname); } catch (e) {} S.vs = null; landing(); });
    ac.appendChild(sh); ac.appendChild(ag); nw.appendChild(ac);
    main.appendChild(fin);
    up.addEventListener('click', function () { lightsUp(fin); scrollToEl(fin, 0); });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { lightsUp(fin); io.disconnect(); } }); }, { rootMargin: '0px 0px -45% 0px' });
      setTimeout(function () { io.observe(ol); }, 1500);
    } else lightsUp(fin);
    window.scrollTo(0, 0);
  }
  function lightsUp(fin) {
    document.documentElement.classList.add('lights');
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', '#F5F2EC');
    Array.prototype.forEach.call(fin.querySelectorAll('.rung'), function (x, j) { later(300 + j * 180, function () { x.classList.add('in'); }); });
  }
  function lightsDown() {
    document.documentElement.classList.remove('lights');
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', '#1A1816');
  }

  /* Share text gives nothing away: no company is paired with a result. */
  function shareScore(n, total) {
    var lines = ['I got ' + n + ' of ' + total + ' on ' + E.title + ' Four companies, two films each.'];
    S.res.forEach(function (x, i) { if (x) lines.push('Round ' + (i + 1) + ' ' + (x.call ? '■' : '□') + (x.why ? '■' : '□')); });
    lines.push(location.origin + location.pathname + (total === 8 ? '#vs=' + n : ''));
    var text = lines.join('\n');
    if (navigator.share) {
      navigator.share({ title: E.title, text: text }).catch(function (e) { if (e && e.name === 'AbortError') return; copyText(text); });
    } else copyText(text);
  }
  function copyText(t) {
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} ta.remove();
      toast(ok ? 'Copied. Paste it into a message to a colleague.' : 'Copy did not work in this browser.');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { toast('Copied. Paste it into a message to a colleague.'); }, fallback);
    else fallback();
  }

  /* ---------- sources sheet ---------- */
  var lastFocus = null;
  function li(ul, parts) { var l = el('li'); parts.forEach(function (p) { if (typeof p === 'string') l.appendChild(document.createTextNode(p)); else l.appendChild(p); }); ul.appendChild(l); return l; }
  function ext(href, text) { var a = el('a', null, text); a.href = href; a.target = '_blank'; a.rel = 'noopener'; return a; }
  function openSources(i) {
    var r = R[i], body = $('sheetBody'); body.innerHTML = '';
    body.appendChild(el('p', 'sm', 'Round ' + (i + 1) + ' · ' + r.company));
    var ul = el('ul');
    Object.keys(r.sides).forEach(function (k) {
      var s = r.sides[k];
      li(ul, [ext('https://www.youtube.com/watch?v=' + s.videoId, s.videoLabel), ' on ' + s.channel + (i === 1 ? '' : ', ' + fmt(s.views) + ' views') + (s.published ? ', published ' + s.published : '') + '.']);
    });
    if (i === 0) {
      var s0 = r.sides.ricos;
      li(ul, ['MinivelaTV is the channel of Minivela, which makes Rico’s Tacos with P&G and Albertsons Media Collective.']);
      li(ul, ['The series ran ' + s0.runDates + ', ' + s0.cadence + ': ' + s0.episodes + ' episodes and ' + fmt(s0.totalViews) + ' views together. ' + r.episodeNote]);
    }
    if (i === 1) {
      r.evidence.forEach(function (x) { li(ul, [x.stat + ' ' + x.label + '. ' + x.source + '. ', ext(x.url, 'Read the report')]); });
      li(ul, [r.evidenceScope]);
      li(ul, [r.sides.checkFirst.evidence]);
    }
    if (i === 2) {
      var st = r.sides.stratos, cf = r.sides.confession;
      li(ul, ['The live jump drew ' + st.concurrentStreams + '. ' + st.concurrentSource + '. ', ext(st.concurrentUrl, 'Read the post')]);
      li(ul, ['Red Bull has made cartoon adverts since ' + cf.cartoonsSince + ': ' + cf.cartoonsSource + '.']);
    }
    if (i === 3) {
      li(ul, ['YETI Presents films have run on YETI’s channel since ' + r.sides.yetiFilm.seriesSince + '.']);
      li(ul, [r.sides.pbrSponsor.sponsorNote + '.']);
    }
    if (r.quote && UI[i].read) li(ul, ['Quote: ' + r.quote.cite + '. ', ext(r.quote.url, 'Read the article')]);
    body.appendChild(ul);
    body.appendChild(el('p', 'sm', 'View counts from YouTube, ' + F.readDate + '.'));
    lastFocus = document.activeElement;
    $('sheet').hidden = false; $('sheetBack').hidden = false; $('sheetClose').focus();
  }
  function closeSources() { $('sheet').hidden = true; $('sheetBack').hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  $('sheetClose').addEventListener('click', closeSources);
  $('sheetBack').addEventListener('click', closeSources);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('sheet').hidden) closeSources(); });

  /* ---------- poster flipbook: YouTube's own stills, never a video ---------- */
  if (!reduced) setInterval(function () {
    if (document.hidden) return;
    Array.prototype.forEach.call(document.querySelectorAll('.round .stills'), function (st) {
      var ims = st.children, k = 0; for (var j = 0; j < ims.length; j++) if (ims[j].classList.contains('on')) k = j;
      ims[k].classList.remove('on'); ims[(k + 1) % ims.length].classList.add('on');
    });
  }, 1200);

  /* ---------- footer and start ---------- */
  $('foot').innerHTML = F.brand + ' · <a href="https://talexmedia.com">talexmedia.com</a> · <a href="mailto:info@talexmedia.com">info@talexmedia.com</a>';
  var hash = location.hash || '';
  var mv = hash.match(/vs=(\d)/); if (mv && +mv[1] <= 8) S.vs = +mv[1];
  var mr = hash.match(/^#r([1-4])$/);
  if (mr) { S.first = +mr[1] - 1; startRound(S.first); } else landing();
})();
