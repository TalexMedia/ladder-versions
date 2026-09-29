/* Version A engine. The v10 flow (pick, result, why, reason in each round) with one change of
   structure: the two film cards stay on screen for the whole round and every step updates the page
   in place, so a film that is playing keeps playing through every choice. */
(function(){
  'use strict';
  var F = window.FACTS, CT = window.CONTENT, C = CT.copy, RD = F.rounds, RC = CT.rounds;
  var $ = function(id){ return document.getElementById(id); };
  var main = $('main');
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var ROUND_STEPS = ['pick', 'reveal', 'why', 'whyreveal'];
  var KEY = 'talex-which-one-a-v11', DAY = 24 * 60 * 60 * 1000;
  var vsN = null, view = null, cycleTimer = null;

  /* ---------- helpers ---------- */
  function fill(t, m){ return String(t || '').replace(/\{(\w+)\}/g, function(_, k){ return m && m[k] !== undefined ? m[k] : '{' + k + '}'; }); }
  function el(tag, cls, text){ var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined && text !== null) e.textContent = text; return e; }
  function html(tag, cls, markup){ var e = el(tag, cls); e.innerHTML = markup; return e; }
  function btn(cls, text){ var b = el('button', cls, text); b.type = 'button'; return b; }
  function shuffle(a){ a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var fmt = CT.fmt;
  var ICON = {
    tick:'<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
    play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    pause:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
    x:'<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    mute:'<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>',
    chev:'<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 6 15 12 9 18"/></svg>',
    arrow:'<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg>'
  };

  /* ---------- state, saved for 24 hours so reopening the link from a DM keeps the game ---------- */
  function fresh(){ return { step:'landing', round:0, pick:null, whyPick:null, display:{}, optOrder:{}, log:[] }; }
  var S = fresh();
  function save(){ try { localStorage.setItem(KEY, JSON.stringify({ t:Date.now(), s:S })); } catch (e) {} }
  function load(){
    try {
      var raw = localStorage.getItem(KEY); if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || !o.s || typeof o.t !== 'number' || Date.now() - o.t > DAY) { localStorage.removeItem(KEY); return null; }
      return o.s;
    } catch (e) { return null; }
  }
  function clearSave(){ try { localStorage.removeItem(KEY); } catch (e) {} }
  function done(i){ var L = S.log[i]; return !!(L && L.gotWhy !== null && L.gotWhy !== undefined); }
  function score(){ return S.log.reduce(function(n, L){ return n + (L && L.gotWinner ? 1 : 0) + (L && L.gotWhy ? 1 : 0); }, 0); }
  function roundsPlayed(){ var n = 0; for (var i = 0; i < RD.length; i++) if (done(i)) n++; return n; }
  function sanitize(){
    if (ROUND_STEPS.indexOf(S.step) === -1 && S.step !== 'landing' && S.step !== 'result') S.step = 'landing';
    if (typeof S.round !== 'number' || !RD[S.round]) S.round = 0;
    if (!S.log) S.log = [];
    var L = S.log[S.round];
    if ((S.step === 'reveal' || S.step === 'why') && !L) { S.step = 'pick'; S.pick = null; }
    if (S.step === 'whyreveal' && !done(S.round)) { S.step = L ? 'why' : 'pick'; S.whyPick = null; }
    if (S.step === 'result' && roundsPlayed() === 0) S.step = 'landing';
  }

  /* ---------- the muted YouTube player ---------- */
  var YTS = { loading:false, ready:false, failed:false, queue:[] };
  var players = [];
  function loadYT(){
    if (YTS.loading || YTS.ready) return;
    YTS.loading = true;
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function(){ YTS.ready = true; if (typeof prev === 'function') prev(); flushYT(); };
    var s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.async = true;
    s.onerror = function(){ YTS.failed = true; flushYT(); };
    document.head.appendChild(s);
  }
  function flushYT(){ var q = YTS.queue.splice(0); q.forEach(function(f){ f(); }); }
  var PV = { autoplay:1, mute:1, controls:0, disablekb:1, fs:0, playsinline:1, rel:0, cc_load_policy:1, cc_lang_pref:'en' };
  function fallbackSrc(id){
    return 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&mute=1&playsinline=1&rel=0&controls=0&disablekb=1&fs=0&cc_load_policy=1&cc_lang_pref=en&enablejsapi=1';
  }
  function pauseOthers(except){ players.forEach(function(p){ if (p !== except && p.playing) setPlaying(p, false); }); }
  function setPlaying(p, on){
    p.playing = on;
    if (p.yt) { try { if (on) { p.yt.mute(); p.yt.playVideo(); } else p.yt.pauseVideo(); } catch (e) {} }
    else if (p.frame && p.frame.contentWindow) { try { p.frame.contentWindow.postMessage(JSON.stringify({ event:'command', func:on ? 'playVideo' : 'pauseVideo', args:'' }), 'https://www.youtube-nocookie.com'); p.frame.contentWindow.postMessage(JSON.stringify({ event:'command', func:'mute', args:'' }), 'https://www.youtube-nocookie.com'); } catch (e) {} }
    syncCtl(p);
  }
  function syncCtl(p){ if (!p.pp) return; p.pp.innerHTML = p.playing ? ICON.pause : ICON.play; p.pp.setAttribute('aria-label', p.playing ? C.pause : C.resume2); }
  function closeFilm(p){
    try { if (p.yt) p.yt.destroy(); } catch (e) {}
    if (p.timer) clearTimeout(p.timer);
    p.wrap.classList.remove('playing');
    var h = p.wrap.querySelector('.host'); if (h) h.parentNode.removeChild(h);
    var f = p.wrap.querySelector('iframe'); if (f) f.parentNode.removeChild(f);
    if (p.ctl && p.ctl.parentNode) p.ctl.parentNode.removeChild(p.ctl);
    players = players.filter(function(x){ return x !== p; });
    var pb = p.wrap.querySelector('.playbtn'); if (pb) pb.focus({ preventScroll:true });
  }
  function stopPlayers(){ players.slice().forEach(function(p){ try { if (p.yt) p.yt.destroy(); } catch (e) {} if (p.timer) clearTimeout(p.timer); }); players = []; }
  /* Called only from the play button's tap handler. Nothing loads from YouTube's player before this. */
  function playFilm(wrap, fs){
    var existing = players.filter(function(p){ return p.wrap === wrap; })[0];
    if (existing) { pauseOthers(existing); setPlaying(existing, true); return; }
    var p = { wrap:wrap, playing:true };
    players.push(p); pauseOthers(p);
    wrap.classList.add('playing');
    var host = el('div', 'host'); var inner = el('div'); host.appendChild(inner); wrap.appendChild(host);
    var ctl = el('div', 'vctl');
    ctl.appendChild(html('span', 'mutetag', ICON.mute + C.muted));
    var pp = btn(''); pp.addEventListener('click', function(ev){ ev.stopPropagation(); if (!p.playing) pauseOthers(p); setPlaying(p, !p.playing); });
    var cx = btn('x'); cx.innerHTML = ICON.x; cx.setAttribute('aria-label', C.close); cx.addEventListener('click', function(ev){ ev.stopPropagation(); closeFilm(p); });
    ctl.appendChild(pp); ctl.appendChild(cx); wrap.appendChild(ctl);
    ctl.addEventListener('click', function(ev){ ev.stopPropagation(); });
    p.ctl = ctl; p.pp = pp; syncCtl(p); pp.hidden = true;
    function viaApi(){
      if (players.indexOf(p) === -1 || p.frame) return;
      p.yt = new window.YT.Player(inner, {
        host:'https://www.youtube-nocookie.com', videoId:fs.videoId, width:'100%', height:'100%', playerVars:PV,
        events:{
          onReady:function(e){ if (players.indexOf(p) === -1) return; p.pp.hidden = false; e.target.mute(); if (p.playing) e.target.playVideo(); else e.target.pauseVideo(); },
          onError:function(){ closeFilm(p); },
          onStateChange:function(e){ try { if (!e.target.isMuted()) e.target.mute(); } catch (x) {} if (e.data === 1) { p.playing = true; syncCtl(p); } else if (e.data === 2 || e.data === 0) { p.playing = false; syncCtl(p); } }
        }
      });
      var f = wrap.querySelector('iframe'); if (f) f.title = fs.videoLabel;
    }
    function viaFrame(){
      if (players.indexOf(p) === -1 || p.yt || p.frame) return;
      var f = el('iframe'); f.title = fs.videoLabel; f.allow = 'autoplay; encrypted-media; picture-in-picture';
      f.src = fallbackSrc(fs.videoId); host.innerHTML = ''; host.appendChild(f); p.frame = f;
      p.pp.hidden = true;
      if (p.timer) clearTimeout(p.timer);
    }
    if (window.YT && window.YT.Player) viaApi();
    else if (YTS.failed) viaFrame();
    else { loadYT(); YTS.queue.push(function(){ if (window.YT && window.YT.Player) viaApi(); else viaFrame(); }); p.timer = setTimeout(function(){ if (!p.yt) viaFrame(); }, 5000); }
  }
  function media(fs){
    var w = el('div', 'video');
    var img = el('img', 'poster'); img.alt = ''; img.decoding = 'async'; img.src = 'https://i.ytimg.com/vi/' + fs.videoId + '/hqdefault.jpg';
    var pl = el('div', 'play'); var b = html('button', 'playbtn', ICON.play); b.type = 'button'; b.setAttribute('aria-label', fill(C.play, { name:fs.videoLabel }));
    b.addEventListener('click', function(ev){ ev.stopPropagation(); playFilm(w, fs); });
    pl.appendChild(b); w.appendChild(img); w.appendChild(pl);
    return w;
  }

  /* ---------- HUD ---------- */
  function hud(){
    var inRound = ROUND_STEPS.indexOf(S.step) !== -1;
    $('progress').textContent = inRound ? fill(C.roundLabel, { n:S.round + 1, total:RD.length }) + ' · ' + C.steps[S.step] : '';
    $('hudScoreLbl').textContent = C.scoreLabel; $('hudScoreN').textContent = score();
    $('hudScore').hidden = !inRound;
    var total = RD.length * ROUND_STEPS.length + 1, d;
    if (S.step === 'landing') d = 0; else if (S.step === 'result') d = total; else d = S.round * ROUND_STEPS.length + ROUND_STEPS.indexOf(S.step) + 1;
    $('barfill').style.width = (100 * d / total) + '%';
  }
  function plusOne(){
    var pill = $('hudScore'); $('hudScoreN').textContent = score();
    pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
    if (reduced || document.hidden) return;
    var r = $('hudScoreN').getBoundingClientRect(), p = el('div', 'plus', '+1');
    p.style.left = (r.left + r.width / 2 - 10) + 'px'; p.style.top = (r.top + 4) + 'px';
    document.body.appendChild(p); setTimeout(function(){ if (p.parentNode) p.parentNode.removeChild(p); }, 1200);
  }
  function countUp(node, finalText, delay){
    node.textContent = finalText;
    if (reduced || document.hidden || !/^[\d,]+$/.test(finalText)) return;
    var target = parseInt(finalText.replace(/,/g, ''), 10), dur = 1000, t0 = null, fin = false;
    node.textContent = '0';
    setTimeout(function(){ function tick(t){ if (fin) return; if (t0 === null) t0 = t; var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); node.textContent = fmt(Math.round(target * e)); if (k < 1) requestAnimationFrame(tick); else { fin = true; node.textContent = finalText; } } requestAnimationFrame(tick); }, delay || 0);
    setTimeout(function(){ if (!fin) { fin = true; node.textContent = finalText; } }, (delay || 0) + dur + 300);
  }

  /* ---------- navigation ---------- */
  function setHash(h){ try { history.replaceState(null, '', h || (location.pathname + location.search)); } catch (e) {} }
  function focusTop(){ var h = main.querySelector('h1'); if (h) { h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll:true }); } catch (e) {} } window.scrollTo(0, 0); }
  function render(){
    stopPlayers(); stopCycle();
    main.innerHTML = ''; view = null;
    main.classList.add('anim');
    if (S.step === 'landing') landing();
    else if (S.step === 'result') result();
    else buildRound();
    Array.prototype.forEach.call(main.children, function(c, i){ c.style.setProperty('--i', i); });
    hud(); save();
  }
  function go(step){
    var inRound = ROUND_STEPS.indexOf(step) !== -1;
    if (inRound && view && view.round === S.round) { S.step = step; applyStep(false); hud(); save(); return; }
    S.step = step;
    if (reduced) { render(); focusTop(); return; }
    main.classList.add('leave');
    setTimeout(function(){ main.classList.remove('leave'); render(); focusTop(); }, 180);
  }
  /* Deep links and reopened rounds go through here, so a round already played shows how it went
     instead of letting it be picked again. */
  function openRound(i){
    S.round = i; var L = S.log[i];
    if (done(i)) { S.pick = L.pick; S.whyPick = L.whyPick; S.step = 'whyreveal'; }
    else if (L) { S.pick = L.pick; S.whyPick = null; S.step = 'reveal'; }
    else { S.pick = null; S.whyPick = null; S.step = 'pick'; }
    setHash('#r' + (i + 1));
  }
  function nextRound(){
    for (var i = S.round + 1; i < RD.length; i++) if (!done(i)) return i;
    return -1;
  }

  /* ---------- landing ---------- */
  var STILLS = ['hqdefault', 'hq1', 'hq2', 'hq3'];
  function stopCycle(){ if (cycleTimer) { clearInterval(cycleTimer); cycleTimer = null; } }
  function still(id, offset){
    var w = el('div', 'still'); var a = el('img'); a.alt = ''; a.decoding = 'async'; a.src = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
    var b = el('img'); b.alt = ''; b.decoding = 'async'; b.style.opacity = '0';
    w.appendChild(a); w.appendChild(b); w._s = { id:id, n:0, off:offset, front:a, back:b }; return w;
  }
  function startCycle(nodes){
    if (reduced) return;
    var tick = 0;
    cycleTimer = setInterval(function(){
      tick++;
      nodes.forEach(function(w, idx){
        if ((tick + idx) % 3 !== 0) return; /* a few stills change at a time, not all at once */
        var s = w._s; s.n = (s.n + 1) % STILLS.length;
        var nb = s.back; nb.onload = function(){ nb.style.opacity = '1'; s.front.style.opacity = '0'; var t = s.front; s.front = nb; s.back = t; };
        nb.onerror = function(){ s.n = 0; };
        nb.src = 'https://i.ytimg.com/vi/' + s.id + '/' + STILLS[s.n] + '.jpg';
      });
    }, 900);
  }
  function landing(){
    setHash(vsN !== null ? '#vs=' + vsN : '');
    main.appendChild(el('p', 'eyebrow', C.eyebrow));
    main.appendChild(el('h1', null, C.title));
    main.appendChild(el('p', 'lead', C.lead));
    if (vsN !== null) main.appendChild(el('p', 'vs', fill(C.vsLine, { n:vsN })));
    var act = el('div', 'actions'); act.style.marginTop = '0';
    var inProgress = S.log.some(function(L){ return !!L; }) && roundsPlayed() < RD.length;
    if (inProgress) {
      var resumeAt = S.log[S.round] && done(S.round) ? nextRound() : S.round; if (resumeAt < 0) resumeAt = S.round;
      var r = btn('btn', fill(C.resume, { n:resumeAt + 1 })); r.insertAdjacentHTML('beforeend', ICON.arrow);
      r.addEventListener('click', function(){ loadYT(); openRound(resumeAt); go(S.step); });
      var st = btn('btn ghost', C.restart); st.addEventListener('click', start);
      act.appendChild(r); act.appendChild(st);
    } else {
      var b = btn('btn', C.start); b.insertAdjacentHTML('beforeend', ICON.arrow); b.addEventListener('click', start); act.appendChild(b);
    }
    main.appendChild(act);
    main.appendChild(html('p', 'notice', ICON.tick + '<span></span>')).lastChild.textContent = C.notice;
    var strip = el('section', 'strip'); strip.setAttribute('aria-label', C.roundsLabel);
    strip.appendChild(el('p', 'lbl', C.roundsLabel));
    var pairs = el('div', 'pairs'), stills = [];
    RD.forEach(function(r, i){
      var p = el('div', 'pair'), th = el('div', 'thumbs');
      Object.keys(r.sides).forEach(function(k, j){ var s = still(r.sides[k].videoId, i * 2 + j); th.appendChild(s); stills.push(s); });
      p.appendChild(th);
      var co = el('div', 'co'); co.appendChild(el('span', null, String(i + 1))); co.appendChild(document.createTextNode(r.company)); p.appendChild(co);
      pairs.appendChild(p);
    });
    strip.appendChild(pairs); main.appendChild(strip);
    startCycle(stills);
    var g = el('figure', 'gate'); g.style.marginLeft = g.style.marginRight = '0';
    g.appendChild(el('p', null, C.gate));
    var ct = el('cite'); ct.appendChild(document.createTextNode(C.gateCite + '. '));
    var a = el('a', null, C.gateLink); a.href = C.gateUrl; a.target = '_blank'; a.rel = 'noopener'; ct.appendChild(a);
    g.appendChild(ct); main.appendChild(g);
  }
  function start(){
    loadYT(); clearSave();
    var keepVs = vsN; S = fresh(); vsN = keepVs;
    S.round = 0; S.step = 'pick'; setHash('#r1'); go('pick');
  }

  /* ---------- a round ---------- */
  function buildRound(){
    var i = S.round, fr = RD[i], rc = RC[i];
    if (!S.display[i]) S.display[i] = shuffle(Object.keys(fr.sides));
    var head = el('header', 'rhead');
    head.appendChild(el('p', 'eyebrow', fill(C.roundLabel, { n:i + 1, total:RD.length }) + ' · ' + rc.company));
    var h1 = el('h1', null, rc.headline); head.appendChild(h1);
    var q = el('div', 'qline'); q.id = 'qline'; head.appendChild(q);
    var stage = el('div', 'stage pick'); var cards = {};
    S.display[i].forEach(function(k, idx){ var c = buildCard(i, k); c.style.setProperty('--i', idx); cards[k] = c; stage.appendChild(c); });
    var panel = el('section', 'panel-area');
    main.appendChild(head); main.appendChild(stage); main.appendChild(panel);
    view = { round:i, head:head, q:q, stage:stage, cards:cards, panel:panel };
    applyStep(true);
  }
  function buildCard(i, k){
    var fs = RD[i].sides[k], cs = RC[i].sides[k];
    var c = el('div', 'card'); c.dataset.k = k;
    var v = media(fs); c.appendChild(v);
    c.appendChild(el('div', 'filmcap', cs.cap));
    var body = el('div', 'body');
    var ring = html('span', 'ring', ICON.tick); ring.setAttribute('aria-hidden', 'true'); body.appendChild(ring);
    body.appendChild(el('div', 'kind', cs.kind));
    body.appendChild(el('div', 'name', cs.name));
    body.appendChild(el('div', 'desc', cs.desc));
    body.appendChild(el('div', 'picktag', C.picked));
    c.appendChild(body);
    /* The poster and the text both pick the card. Only the orange play button plays the film. */
    c.addEventListener('click', function(){ if (S.step === 'pick') togglePick(k); });
    body.addEventListener('keydown', function(e){ if (S.step === 'pick' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); togglePick(k); } });
    c._ = { body:body, ring:ring };
    return c;
  }
  function updateCards(fresh){
    var i = S.round, st = S.step, w = RD[i].winner, L = S.log[i];
    Object.keys(view.cards).forEach(function(k){
      var c = view.cards[k], body = c._.body, cs = RC[i].sides[k];
      var picked = st === 'pick' ? S.pick === k : !!(L && L.pick === k);
      c.classList.toggle('picked', picked);
      c._.ring.classList.toggle('on', picked);
      if (st === 'pick') {
        body.setAttribute('role', 'button'); body.tabIndex = 0; body.setAttribute('aria-pressed', picked ? 'true' : 'false');
        body.setAttribute('aria-label', cs.name + ', ' + cs.kind + '. ' + C.pickThis);
      } else {
        body.removeAttribute('role'); body.removeAttribute('tabindex'); body.removeAttribute('aria-pressed'); body.removeAttribute('aria-label');
        c.classList.toggle('win', k === w);
        if (k === w && !body.querySelector('.mark')) { var m = html('div', 'mark' + (fresh ? ' fresh' : ''), ICON.tick); m.appendChild(document.createTextNode(RC[i].mark)); body.insertBefore(m, body.querySelector('.name')); }
        if (cs.note && !body.querySelector('.fig')) { var nt = el('div', 'fig note' + (fresh ? ' fresh' : '')); nt.appendChild(el('span', null, cs.note)); body.appendChild(nt); }
        if (cs.fig && !body.querySelector('.fig')) {
          var f = el('div', 'fig' + (k === w ? ' win' : '') + (fresh ? ' fresh' : '')), b = el('b'); f.appendChild(b); f.appendChild(el('span', null, cs.fig[1])); body.appendChild(f);
          if (fresh) countUp(b, cs.fig[0], 450); else b.textContent = cs.fig[0];
        }
      }
    });
  }
  function applyStep(first){
    var i = S.round, st = S.step, rc = RC[i], L = S.log[i];
    view.stage.className = 'stage ' + (st === 'pick' ? 'pick' : 'compact' + (st === 'reveal' ? '' : ' mini'));
    updateCards(!first && st === 'reveal');
    var q = view.q; q.innerHTML = '';
    if (st === 'pick') { q.className = 'qline ask'; q.textContent = rc.question; }
    else {
      q.className = 'qline verdict' + (L.gotWinner ? ' ok' : '') + (!first && st === 'reveal' ? ' fresh' : '');
      q.appendChild(el('span', 'vbig', L.gotWinner ? C.correct : C.notThisTime));
      q.appendChild(el('span', 'vfact', rc.winnerLine));
    }
    view.panel.innerHTML = '';
    ({ pick:panelPick, reveal:panelReveal, why:panelWhy, whyreveal:panelReason })[st]();
    Array.prototype.forEach.call(view.panel.children, function(c, n){ c.style.setProperty('--i', n); });
    if (first) return;
    var behavior = reduced ? 'auto' : 'smooth';
    if (st === 'reveal') window.scrollTo({ top:0, behavior:behavior });
    else {
      var headH = document.querySelector('.head').getBoundingClientRect().height;
      var target = st === 'why' ? view.stage : view.panel;
      var y = target.getBoundingClientRect().top + window.pageYOffset - headH - 12;
      window.scrollTo({ top:Math.max(0, y), behavior:behavior });
    }
    var focusNode = view.panel.querySelector('[data-focus]');
    if (focusNode) { focusNode.setAttribute('tabindex', '-1'); try { focusNode.focus({ preventScroll:true }); } catch (e) {} }
  }

  /* Pick: the question above is the one instruction. The lock bar sticks on a phone only after a pick. */
  function panelPick(){
    var a = el('div', 'actions lockbar' + (S.pick ? ' sticky' : ''));
    var b = btn('btn', C.lock); b.disabled = !S.pick;
    b.addEventListener('click', lockPick);
    a.appendChild(b); view.panel.appendChild(a); view.lock = b; view.lockbar = a;
  }
  function togglePick(k){
    S.pick = S.pick === k ? null : k; /* read at click time, updated in place */
    updateCards(false);
    view.lock.disabled = !S.pick; view.lockbar.classList.toggle('sticky', !!S.pick);
    save();
  }
  function lockPick(){
    if (!S.pick) return;
    var i = S.round, got = S.pick === RD[i].winner;
    if (!S.log[i]) { S.log[i] = { pick:S.pick, gotWinner:got, whyPick:null, gotWhy:null }; if (got) plusOne(); }
    go('reveal');
  }

  /* The result: the verdict sits in the header, the figures sit on the cards, and this panel adds
     one picture of the gap and the sources behind a toggle. */
  function ratiosNode(list){
    var w = el('div', 'ratios');
    list.forEach(function(r){
      var d = el('div', 'ratio'), p = el('p', 'big');
      p.appendChild(el('span', 'hi', r.big)); p.appendChild(document.createTextNode(', ')); p.appendChild(el('span', 'same', r.same));
      d.appendChild(p); d.appendChild(el('p', 'small', r.small)); w.appendChild(d);
    });
    return w;
  }
  function vizEpisodes(v, animate){
    var b = el('div', 'block'); b.appendChild(ratiosNode(v.ratios));
    var eps = RD[0].episodes, tide = RD[0].sides.tideSpot.views;
    var max = Math.max.apply(null, eps.map(function(e){ return e.views; }));
    var fig = el('figure', 'epchart'); fig.appendChild(el('figcaption', null, v.chartTitle));
    var bars = el('div', 'bars' + (animate ? ' go' : '')); bars.setAttribute('role', 'img');
    bars.setAttribute('aria-label', v.chartTitle + '. ' + eps.length + ' episodes. ' + v.lineLabel + '.');
    eps.forEach(function(e, j){ var s = el('i', 'b' + (j === 0 ? ' first' : '')); s.style.height = (100 * e.views / max) + '%'; s.style.setProperty('--j', j); s.title = 'Episode ' + e.ep + ', ' + e.title + ': ' + fmt(e.views) + ' views'; bars.appendChild(s); });
    var line = el('div', 'tline'); line.style.bottom = (100 * tide / max) + '%'; line.appendChild(el('span', null, v.lineLabel)); bars.appendChild(line);
    fig.appendChild(bars);
    var ax = el('div', 'axis'); ax.appendChild(el('span', null, 'Episode 1')); ax.appendChild(el('span', null, 'Last episode')); fig.appendChild(ax);
    var lg = el('div', 'legend'); lg.appendChild(html('span', null, '<i></i>Rico\'s Tacos, one bar per episode')); lg.appendChild(html('span', null, '<i class="dash"></i>School Lunch')); fig.appendChild(lg);
    b.appendChild(fig); return b;
  }
  function vizUnits(v, animate){
    var b = el('div', 'block'); b.appendChild(ratiosNode(v.ratios));
    var g = el('div', 'units' + (animate ? ' go' : '')); g.setAttribute('role', 'img'); g.setAttribute('aria-label', v.unitLine);
    for (var j = 0; j < v.units; j++) { var s = el('i'); s.style.setProperty('--j', j); g.appendChild(s); }
    b.appendChild(g);
    var k = el('p', 'unitkey'); k.appendChild(el('i')); k.appendChild(document.createTextNode(v.unitLine)); b.appendChild(k);
    b.appendChild(el('p', 'live', v.live));
    return b;
  }
  function vizChannels(v, animate){
    var b = el('div', 'block'); b.appendChild(ratiosNode(v.ratios));
    var max = Math.max.apply(null, v.rows.map(function(r){ return r.views; }));
    var rows = el('div', 'chrows');
    v.rows.forEach(function(r, n){
      var row = el('div', 'chrow'); row.appendChild(el('div', 'who', r.who)); row.appendChild(el('div', 'what', r.what));
      var t = el('div', 'track' + (animate ? ' go' : '')), f = el('span', 'fill' + (n ? ' other' : '')); f.style.width = 'calc((100% - 7.5rem) * ' + (r.views / max).toFixed(4) + ')';
      t.appendChild(f); t.appendChild(el('b', null, fmt(r.views) + ' views')); row.appendChild(t); rows.appendChild(row);
    });
    b.appendChild(rows); return b;
  }
  function vizMascot(v){
    var b = el('div', 'block');
    var t = el('div', 'tiles');
    v.tiles.forEach(function(x){ var d = el('div', 'tile'); d.appendChild(el('div', 'stat', x.stat)); d.appendChild(el('p', null, x.label)); d.appendChild(el('p', 'by', x.src)); t.appendChild(d); });
    b.appendChild(t); b.appendChild(el('p', 'scope', v.scope));
    var sp = el('div', 'spots'); sp.appendChild(el('p', null, v.spotsLine)); var ul = el('ul'); v.spots.forEach(function(s){ ul.appendChild(el('li', null, s)); }); sp.appendChild(ul); b.appendChild(sp);
    return b;
  }
  function sourcesNode(list){
    var d = el('details', 'sources'); var s = html('summary', null, ICON.chev + '<span></span>'); s.lastChild.textContent = C.sources; d.appendChild(s);
    var ul = el('ul'); list.forEach(function(h){ ul.appendChild(html('li', null, h)); }); d.appendChild(ul); return d;
  }
  function panelReveal(){
    var i = S.round, rc = RC[i], v = rc.viz, animate = !reduced;
    var node = v.type === 'episodes' ? vizEpisodes(v, animate) : v.type === 'units' ? vizUnits(v, animate) : v.type === 'channels' ? vizChannels(v, animate) : vizMascot(v);
    view.panel.appendChild(node);
    view.panel.appendChild(sourcesNode(rc.sources));
    var a = el('div', 'actions'); var b = btn('btn', C.whyBtn); b.insertAdjacentHTML('beforeend', ICON.arrow); b.addEventListener('click', function(){ go('why'); }); a.appendChild(b); view.panel.appendChild(a);
  }

  /* Why: the reviewed question and three reviewed answers, in a shuffled order kept for the session. */
  function panelWhy(){
    var i = S.round, fr = RD[i];
    if (!S.optOrder[i]) S.optOrder[i] = shuffle(fr.why.options.map(function(_, n){ return n; }));
    var h = el('h2', 'whyq', fr.why.question); h.setAttribute('data-focus', ''); view.panel.appendChild(h);
    var o = el('div', 'opts'), buttons = [];
    var a = el('div', 'actions' + (S.whyPick !== null ? ' sticky' : ''));
    var lock = btn('btn', C.choose); lock.disabled = S.whyPick === null;
    S.optOrder[i].forEach(function(idx, n){
      var b = btn('opt'); b.setAttribute('aria-pressed', S.whyPick === idx ? 'true' : 'false');
      b.appendChild(el('span', 'k', String.fromCharCode(65 + n))); b.appendChild(el('span', null, fr.why.options[idx].text));
      b.addEventListener('click', function(){
        S.whyPick = S.whyPick === idx ? null : idx;
        buttons.forEach(function(x){ x.b.setAttribute('aria-pressed', S.whyPick === x.idx ? 'true' : 'false'); });
        lock.disabled = S.whyPick === null; a.classList.toggle('sticky', S.whyPick !== null); save();
      });
      buttons.push({ b:b, idx:idx }); o.appendChild(b);
    });
    view.panel.appendChild(o);
    lock.addEventListener('click', lockWhy); a.appendChild(lock); view.panel.appendChild(a);
  }
  function lockWhy(){
    var i = S.round, fr = RD[i]; if (S.whyPick === null) return;
    var right = fr.why.options[S.whyPick].side === fr.winner;
    if (!done(i)) { S.log[i].gotWhy = right; S.log[i].whyPick = S.whyPick; if (right) plusOne(); }
    go('whyreveal');
  }

  /* The reason: one verdict, the marked answers, then the rung and its source. */
  function panelReason(){
    var i = S.round, fr = RD[i], rc = RC[i], L = S.log[i], right = !!L.gotWhy;
    var v = el('p', 'verdict2' + (right ? ' ok' : '')); v.setAttribute('data-focus', '');
    if (right) v.appendChild(el('span', 'vbig', C.whyRight));
    else { var parts = C.whyWrong.split('. '); v.appendChild(el('span', 'vbig', parts[0] + '.')); v.appendChild(el('span', 'vfact', parts.slice(1).join('. '))); }
    view.panel.appendChild(v);
    var wrap = el('div');
    wrap.appendChild(el('p', 'whyq', fr.why.question));
    var o = el('div', 'opts');
    S.optOrder[i].forEach(function(idx, n){
      var opt = fr.why.options[idx], isWin = opt.side === fr.winner, mine = idx === L.whyPick;
      var d = el('div', 'opt' + (isWin ? ' win' : '')); d.appendChild(el('span', 'k', String.fromCharCode(65 + n)));
      var t = el('span'); t.appendChild(document.createTextNode(opt.text));
      var of = el('span', 'of'); of.appendChild(el('span', 'about', fill(C.aboutSide, { name:RC[i].sides[opt.side].name })));
      if (isWin) of.appendChild(el('span', 'note ok', C.winnerFact));
      if (mine) of.appendChild(el('span', 'note mine', C.yourAnswer));
      t.appendChild(of); d.appendChild(t); o.appendChild(d);
    });
    wrap.appendChild(o); view.panel.appendChild(wrap);
    var rung = el('div', 'rung'); var steps = el('span', 'steps');
    for (var n = 0; n < RD.length; n++) steps.appendChild(el('i', n < i ? 'on' : n === i ? 'now' : ''));
    rung.appendChild(steps); rung.appendChild(el('span', null, fill(C.rungLabel, { n:i + 1, rung:fr.rung })));
    view.panel.appendChild(rung);
    var qb = el('div', 'block quote'), tom = /^Tom Langan/.test(fr.quote.cite);
    qb.appendChild(el('p', 'q' + (tom ? ' tom' : ''), tom ? '"' + fr.quote.text + '"' : fr.quote.text));
    qb.appendChild(el('cite', null, fr.quote.cite));
    var more = el('p', 'more'); var a1 = el('a', null, fill(C.readMore, { subject:rc.more })); a1.href = fr.quote.url; a1.target = '_blank'; a1.rel = 'noopener'; more.appendChild(a1); qb.appendChild(more);
    var pr = el('p', 'princ'); pr.appendChild(el('b', null, C.principles + ': ')); pr.appendChild(document.createTextNode(rc.lens.join(' · '))); qb.appendChild(pr);
    view.panel.appendChild(qb);
    var nx = nextRound(), act = el('div', 'actions');
    var b = btn('btn', nx < 0 ? C.seeResult : fill(C.nextRound, { n:nx + 1 })); b.insertAdjacentHTML('beforeend', ICON.arrow);
    b.addEventListener('click', function(){ if (nx < 0) { setHash('#result'); go('result'); } else { openRound(nx); go(S.step); } });
    act.appendChild(b); view.panel.appendChild(act);
  }

  /* ---------- the result and the call to action ---------- */
  function result(){
    setHash('#result');
    var n = score(), total = roundsPlayed() * 2;
    main.appendChild(el('p', 'eyebrow', C.resultEyebrow));
    var h = el('h1'); var parts = fill(C.resultHeading, { n:'\u0000', total:total }).split('\u0000');
    h.appendChild(document.createTextNode(parts[0])); var cnt = el('span', 'count', String(n)); h.appendChild(cnt); h.appendChild(document.createTextNode(parts[1] || ''));
    main.appendChild(h);
    main.appendChild(el('p', 'result-note', total === 8 ? C.resultNote : C.resultNote.replace(', across four rounds', '')));
    var syn = el('section', 'synth'); syn.appendChild(el('p', 'lbl', C.synthesisHeading)); syn.appendChild(el('p', 'sub', C.ladderNote));
    var ol = el('ol', 'ladder');
    RD.forEach(function(r, i){
      var li = el('li'); li.style.setProperty('--i', i);
      li.appendChild(el('span', 'n', String(i + 1)));
      var t = el('div'); t.appendChild(el('p', 't', r.rung)); t.appendChild(el('p', 'l', F.synthesis[i])); li.appendChild(t);
      ol.appendChild(li);
    });
    syn.appendChild(ol); main.appendChild(syn);
    var cta = el('section', 'cta'); cta.appendChild(el('p', 'closing', C.closing)); cta.appendChild(el('h2', null, C.cta.heading)); cta.appendChild(el('p', null, C.cta.copy));
    var a = el('a', 'btn', C.cta.button); a.href = C.cta.url; a.target = '_blank'; a.rel = 'noopener'; a.insertAdjacentHTML('beforeend', ICON.arrow); cta.appendChild(a);
    main.appendChild(cta);
    var acts = el('div', 'actions');
    var share = btn('btn ghost', C.share);
    share.addEventListener('click', function(){
      var url = location.href.split('#')[0] + '#vs=' + score();
      var text = fill(C.shareText, { n:score() });
      var copied = function(){ share.textContent = C.shared; setTimeout(function(){ share.textContent = C.share; }, 1800); };
      var copy = function(){
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text + ' ' + url).then(copied, function(){ window.prompt(C.share, url); });
        else window.prompt(C.share, url);
      };
      if (navigator.share) {
        navigator.share({ title:C.title, text:text, url:url }).catch(function(err){ if (err && err.name === 'AbortError') return; copy(); });
      } else copy();
    });
    var over = btn('btn ghost', C.startOver);
    over.addEventListener('click', function(){ clearSave(); S = fresh(); vsN = null; setHash(''); go('landing'); });
    acts.appendChild(share); acts.appendChild(over); main.appendChild(acts);
    countUp(cnt, String(n), 300);
  }

  /* ---------- boot ---------- */
  $('brand').textContent = C.brand;
  $('foot').innerHTML = C.brand + ' · <a href="https://talexmedia.com">talexmedia.com</a> · <a href="mailto:info@talexmedia.com">info@talexmedia.com</a>';
  var saved = load();
  if (saved) { S = fresh(); Object.keys(saved).forEach(function(k){ S[k] = saved[k]; }); sanitize(); }
  var hm;
  if ((hm = /^#r([1-4])$/.exec(location.hash))) { openRound(parseInt(hm[1], 10) - 1); loadYT(); }
  else if ((hm = /^#vs=(\d)$/.exec(location.hash)) && parseInt(hm[1], 10) <= 8) { vsN = parseInt(hm[1], 10); S.step = 'landing'; }
  else if (location.hash === '#result' && roundsPlayed() > 0) { S.step = 'result'; }
  else if (ROUND_STEPS.indexOf(S.step) !== -1) { loadYT(); }
  render();
  window.__which = { state:function(){ return JSON.parse(JSON.stringify(S)); }, score:score };
})();
