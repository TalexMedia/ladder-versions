/* D. The Ladder Show. Every figure comes from window.FACTS (../shared/facts.js). */
(function () {
  'use strict';
  var F = window.FACTS;
  if (!F) { return; }
  var D = F.evansCopyDecisions;
  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var stage = $('#stage');
  var ROUNDS = F.rounds;

  /* ---------------- helpers ---------------- */
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function compact(n) {
    if (n >= 1e6) { var m = n / 1e6; return (m >= 10 ? Math.round(m) : Math.round(m * 10) / 10) + 'M'; }
    if (n >= 1e3) { return Math.round(n / 1e3) + 'K'; }
    return String(Math.round(n));
  }
  /* Ratios are always computed from FACTS, never typed. */
  function ratio(a, b) {
    var r = a / b;
    var nice = r < 20 ? Math.round(r) : Math.round(r / 5) * 5;
    var word = (nice > r && nice % 100 === 0) ? 'nearly' : 'about';
    return { r: r, n: nice, word: word, text: word + ' ' + nice + ' times' };
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function thumb(id, n) { return 'https://i.ytimg.com/vi/' + id + '/' + (n ? 'hq' + n : 'hqdefault') + '.jpg'; }
  function watchUrl(id) { return 'https://www.youtube.com/watch?v=' + id; }
  function scrollToEl(node, block) {
    if (!node) return;
    try { node.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: block || 'start' }); } catch (e) { node.scrollIntoView(); }
  }
  var ICON = {
    play: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="#1A1816"/></svg>',
    muted: '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="#fff"/><path d="M16 9l5 6M21 9l-5 6" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>',
    check: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrow: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    small: '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#E85A0C"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    over: '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l7 7-7 7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>'
  };

  /* ---------------- presentation config (words only; data stays in FACTS) ---------------- */
  var CFG = {
    repetition: {
      lower: 'P&amp;G', mode: 'views', stack: true, channels: 'Different channels',
      q: 'Which got more views on YouTube, and by how many times?',
      sub: "P&amp;G is behind both films. Rico's Tacos is a comedy series, so this round puts its first episode against one Tide commercial.",
      short: { ricos: "Rico's Tacos, episode 1", tideSpot: 'Tide commercial' },
      poster: { ricos: ["Rico's Tacos, episode 1", 'A scripted comedy series'], tideSpot: ['School Lunch', 'A Tide commercial'] },
      value: { ricos: 'firstEpisodeViews' },
      rail: 'Repetition', more: 'the Taco Drama'
    },
    cast: {
      lower: 'Allstate', mode: 'side',
      q: 'Which campaign ranked first for memorable ads in the mascot research?',
      sub: 'Allstate makes both campaigns. ' + D.pickInstruction,
      short: { mayhem: 'Mayhem', checkFirst: 'Check First' },
      poster: { mayhem: ['Mayhem: Action Hero', 'An Allstate commercial'], checkFirst: ['Check First: Swim Meet', 'An Allstate commercial'] },
      rail: 'Cast'
    },
    audience: {
      lower: 'Red Bull', mode: 'views', test: true, channels: 'Same Red Bull channel',
      q: 'Which got more views on YouTube, and by how many times?',
      sub: "Red Bull made both films, and both sit on Red Bull's own YouTube channel.",
      short: { stratos: 'The jump', confession: 'The cartoon' },
      poster: { stratos: ['Stratos', 'Highlights of the live jump from the edge of space'], confession: ['Confession', 'A Red Bull cartoon commercial'] },
      rail: 'Audience', more: 'Red Bull Stratos',
      principle: "It's Not About You. It's About Them."
    },
    ownership: {
      lower: 'YETI', mode: 'views', follow: true, dark: true, channels: 'Different channels',
      q: 'Which got more views on YouTube, and by how many times?',
      sub: "YETI is behind both. One is a YETI Presents documentary. The other is a PBR film about a bull riding award that carries YETI's name.",
      short: { yetiFilm: 'YETI film', pbrSponsor: 'PBR award' },
      poster: { yetiFilm: ['A Thousand Casts', 'A YETI Presents documentary'], pbrSponsor: ['YETI Bucking Bull Champion', 'A PBR film about the award YETI sponsors'] },
      rail: 'Own the show'
    }
  };
  var NOTCHES = [2, 5, 10, 30, 100, 300];
  var THE = { ricos: "episode 1 of Rico's Tacos", tideSpot: 'the Tide commercial', mayhem: 'Mayhem', checkFirst: 'Check First',
    stratos: 'the jump', confession: 'the cartoon', yetiFilm: 'the YETI film', pbrSponsor: 'the PBR award' };
  var SURE = [
    { k: 'hunch', label: 'Just a hunch' },
    { k: 'fairly', label: 'Fairly sure' },
    { k: 'certain', label: 'Certain' }
  ];
  var TEST = [
    { k: 'jump', label: 'The jump' }, { k: 'cartoon', label: 'The cartoon' },
    { k: 'both', label: 'Both' }, { k: 'neither', label: 'Neither' }
  ];

  /* ---------------- state ---------------- */
  var S = { i: -1, score: 0, played: [], revealed: {}, results: {} };
  var rt = null; // the live round

  /* ---------------- header, ladder ---------------- */
  var head = $('#head');
  window.addEventListener('scroll', function () { head.classList.toggle('scrolled', window.scrollY > 4); }, { passive: true });

  function buildLadder() {
    var ol = $('#rungs'); ol.innerHTML = '';
    ROUNDS.forEach(function (r, i) {
      var li = el('li', 'rung');
      li.innerHTML = '<span class="rbar"></span><span class="rlab"><b>' + (i + 1) + '</b><span class="rname">' + esc(r.company) + '</span></span>';
      ol.appendChild(li);
    });
  }
  function setLadder(now, flashN) {
    var items = document.querySelectorAll('#rungs .rung');
    items.forEach(function (li, i) {
      var r = ROUNDS[i], lit = !!S.results[i] && S.results[i].done;
      li.classList.toggle('lit', lit);
      li.classList.toggle('now', i === now && !lit);
      $('.rname', li).textContent = lit ? CFG[r.id].rail : r.company;
      li.setAttribute('aria-label', 'Rung ' + (i + 1) + (lit ? ', ' + r.rung + ', lit' : ', ' + r.company));
      if (flashN === i) { li.classList.remove('flash'); void li.offsetWidth; li.classList.add('flash'); }
    });
  }
  function setHud(text) {
    $('#hudRound').textContent = text || '';
    $('#hudScore').hidden = S.i < 0;
    $('#hudScoreN').textContent = S.score;
  }
  function addPoint() {
    S.score++;
    $('#hudScoreN').textContent = S.score;
    var hs = $('#hudScore'); hs.classList.remove('pop'); void hs.offsetWidth; hs.classList.add('pop');
  }

  /* ---------------- YouTube players (created only after a tap, always muted) ---------------- */
  var YTQ = { loading: false, failed: false, queue: [] };
  function loadAPI(cb) {
    if (window.YT && window.YT.Player) { cb(); return; }
    if (YTQ.failed) { cb(); return; }
    YTQ.queue.push(cb);
    if (YTQ.loading) return;
    YTQ.loading = true;
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () { if (prev) try { prev(); } catch (e) {} if (YTQ.failed) return; clearTimeout(YTQ.timer); var q = YTQ.queue.splice(0); q.forEach(function (f) { f(); }); };
    var s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    function fail() { if (YTQ.failed || (window.YT && window.YT.Player)) return; YTQ.failed = true; clearTimeout(YTQ.timer); var q = YTQ.queue.splice(0); q.forEach(function (f) { f(); }); }
    s.onerror = fail;
    document.head.appendChild(s);
    YTQ.timer = setTimeout(fail, 5000);
  }
  var live = null; // { poster, player, fallback }
  function stopFilm() {
    if (!live) return;
    try { if (live.player && live.player.destroy) live.player.destroy(); } catch (e) {}
    var p = live.poster;
    $('.host', p).innerHTML = '';
    p.classList.remove('playing');
    var wrap = p.parentNode; if (wrap) wrap.classList.remove('has-playing');
    live = null;
  }
  function playFilm(poster, side) {
    if (live && live.poster === poster) return;
    stopFilm();
    poster.classList.add('playing');
    poster.parentNode.classList.add('has-playing');
    var host = $('.host', poster); host.innerHTML = '';
    var target = el('div'); host.appendChild(target);
    var me = { poster: poster, player: null };
    live = me;
    var pauseBtn = $('[data-act="pause"]', poster);
    pauseBtn.hidden = true;
    pauseBtn.textContent = 'Pause';
    loadAPI(function () {
      if (live !== me) return;
      if (YTQ.failed || !(window.YT && window.YT.Player)) {
        var f = document.createElement('iframe');
        f.src = 'https://www.youtube-nocookie.com/embed/' + side.videoId + '?autoplay=1&mute=1&playsinline=1&rel=0&controls=0&disablekb=1&fs=0&cc_load_policy=1&cc_lang_pref=en';
        f.allow = 'autoplay; encrypted-media; picture-in-picture';
        f.title = side.videoLabel + ' (muted)';
        target.replaceWith(f);
        pauseBtn.hidden = true;
        return;
      }
      me.player = new window.YT.Player(target, {
        host: 'https://www.youtube-nocookie.com',
        videoId: side.videoId,
        width: '100%', height: '100%',
        playerVars: { autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0, playsinline: 1, rel: 0, cc_load_policy: 1, cc_lang_pref: 'en' },
        events: {
          onReady: function (e) { if (live !== me) return; pauseBtn.hidden = false; try { e.target.mute(); e.target.playVideo(); } catch (x) {} },
          onError: function () { if (live === me) stopFilm(); },
          onStateChange: function (e) {
            try { if (!e.target.isMuted()) e.target.mute(); } catch (x) {}
            if (e.data === 1) pauseBtn.textContent = 'Pause';
            else if (e.data === 2 || e.data === 0) pauseBtn.textContent = 'Play';
          }
        }
      });
      var ifr = $('iframe', host); if (ifr) ifr.title = side.videoLabel + ' (muted)';
    });
  }

  /* ---------------- posters (stills cycle, no video until a tap) ---------------- */
  var cycleTimers = [];
  function stopCycles() { cycleTimers.forEach(clearInterval); cycleTimers = []; }
  function startCycle(frame, id, offset) {
    if (reduced) return;
    var seq = [thumb(id), thumb(id, 1), thumb(id, 2), thumb(id, 3)], k = 0;
    var a = $('img.a', frame), b = $('img.b', frame);
    seq.slice(1).forEach(function (u) { var im = new Image(); im.src = u; });
    setTimeout(function () {
      var t = setInterval(function () {
        if (document.hidden || frame.closest('.playing')) return;
        k = (k + 1) % seq.length;
        var showB = !frame.classList.contains('flip');
        var target = showB ? b : a;
        target.src = seq[k];
        frame.classList.toggle('flip', showB);
      }, 1700);
      cycleTimers.push(t);
    }, offset);
  }
  function buildPoster(side, cfg) {
    var info = cfg.poster[side.key];
    var f = el('figure', 'poster');
    f.dataset.side = side.key;
    f.innerHTML =
      '<span class="tag">Your pick</span>' +
      '<div class="frame">' +
        '<img class="a" alt="" src="' + thumb(side.videoId) + '"><img class="b" alt="">' +
        '<span class="shade"></span>' +
        '<button type="button" class="play" aria-label="Watch ' + esc(info[0]) + ', muted">' + ICON.play + '</button>' +
        '<span class="mutedtag">' + ICON.muted + 'Muted</span>' +
        '<div class="host"></div>' +
        '<div class="pctl"><button type="button" class="pbtn" data-act="pause">Pause</button><button type="button" class="pbtn" data-act="close">Close</button></div>' +
      '</div>' +
      '<figcaption class="cap"><h3>' + esc(info[0]) + '</h3><p>' + esc(info[1]) + '</p></figcaption>';
    var frame = $('.frame', f);
    frame.addEventListener('click', function (e) {
      var act = e.target.closest('[data-act]');
      if (act) {
        e.stopPropagation();
        if (act.dataset.act === 'close') { stopFilm(); return; }
        if (live && live.player) {
          try {
            if (live.player.getPlayerState() === 1) live.player.pauseVideo();
            else { live.player.mute(); live.player.playVideo(); }
          } catch (x) {}
        }
        return;
      }
      if (!f.classList.contains('playing')) playFilm(f, side);
    });
    return f;
  }
  function measureVs(wrap) {
    var fr = $('.frame', wrap); if (fr) wrap.style.setProperty('--frameH', fr.offsetHeight + 'px');
  }

  /* ---------------- landing ---------------- */
  function landing() {
    S.i = -1; rt = null; stopFilm(); stopCycles();
    $('#ladder').classList.remove('off');
    setLadder(-1); setHud('');
    var vs = null;
    var m = /(?:^|[#&])vs=(\d+)/.exec(location.hash);
    if (m) { var n = parseInt(m[1], 10); if (n >= 0 && n <= 8) vs = n; }
    var q = F.founderQuote;
    var html =
      '<section class="landing">' +
      '<div class="landing-grid"><div>' +
        '<p class="eyebrow">A four-round game from Talex Media</p>' +
        '<h1 class="title" tabindex="-1">' + esc(D.title) + '</h1>' +
        (vs != null ? '<p class="vs-line">' + ICON.small + '<span>A colleague sent you this and scored ' + vs + ' of 8. See how you do.</span></p>' : '') +
        '<p class="lead">' + esc(D.lead) + '</p>' +
        '<div class="start-row"><button type="button" class="btn" id="startBtn">Start round one <span class="arr">&rarr;</span></button>' +
        '<p class="notice">' + ICON.small + '<span>' + esc(D.noticeAboutNumbers) + '</span></p></div>' +
      '</div><div>' +
        '<div class="lineup" aria-label="The four rounds">' + ROUNDS.map(function (r, i) {
          var ks = Object.keys(r.sides);
          return '<div class="lu"><div class="lu-pair"><img alt="" loading="lazy" src="https://i.ytimg.com/vi/' + r.sides[ks[0]].videoId + '/mqdefault.jpg">' +
            '<img alt="" loading="lazy" src="https://i.ytimg.com/vi/' + r.sides[ks[1]].videoId + '/mqdefault.jpg"><i>VS</i></div>' +
            '<p><b>Round ' + (i + 1) + '</b> ' + esc(r.company) + '</p></div>';
        }).join('') + '</div>' +
        '<figure class="founder"><blockquote>' + esc(q.text) + '</blockquote>' +
        '<p>' + esc(D.founderCredit) + '. <a href="' + esc(q.url) + '" target="_blank" rel="noopener">' + esc(D.founderLink) + '</a></p></figure>' +
      '</div></div></section>';
    stage.innerHTML = html;
    $('#startBtn').addEventListener('click', function () { startRound(0); });
  }

  /* ---------------- rounds ---------------- */
  function startRound(i) {
    stopFilm(); stopCycles();
    S.i = i;
    if (S.played.indexOf(i) < 0) S.played.push(i);
    var r = ROUNDS[i], cfg = CFG[r.id];
    var keys = shuffle(Object.keys(r.sides));
    rt = {
      i: i, r: r, cfg: cfg, left: r.sides[keys[0]], right: r.sides[keys[1]],
      pos: 0, sure: null, locked: false, test: null, why: null, skip: false, skipCbs: [], els: {}
    };
    S.results[i] = { side: false, why: false, done: false };
    setLadder(i); setHud('Round ' + (i + 1) + ' of 4');

    var sec = el('section', 'round' + (cfg.dark ? ' dark' : ''));
    sec.setAttribute('aria-label', 'Round ' + (i + 1));
    sec.innerHTML =
      '<p class="lower">' + (i === 3 ? 'Final round' : 'Round ' + (i + 1)) + ' <span class="dim">·</span> ' + cfg.lower + '</p>' +
      '<h2 class="q" tabindex="-1">' + cfg.q + '</h2>' +
      '<p class="sub">' + cfg.sub + '</p>';
    var posters = el('div', 'posters');
    posters.appendChild(buildPoster(rt.left, cfg));
    posters.appendChild(el('span', 'vs', 'VS'));
    posters.appendChild(buildPoster(rt.right, cfg));
    sec.appendChild(posters);
    rt.els.posters = posters;
    rt.els.sec = sec;

    stage.innerHTML = '';
    stage.appendChild(sec);
    measureVs(posters);
    startCycle($('.frame', posters.children[0]), rt.left.videoId, 0);
    startCycle($('.frame', posters.children[2]), rt.right.videoId, 850);

    if (cfg.test) { sec.appendChild(buildTest()); }
    else { sec.appendChild(buildCall()); }
    window.scrollTo(0, 0);
    try { $('.q', sec).focus({ preventScroll: true }); } catch (e) {}
  }
  window.addEventListener('resize', function () { if (rt) measureVs(rt.els.posters); });

  /* Round 3: Tom's strip-the-name test, unscored, before any numbers */
  function buildTest() {
    var q = F.founderQuote;
    var box = el('div', 'test block');
    box.innerHTML =
      '<p class="lower">Tom\'s test <span class="dim">·</span> not scored</p>' +
      '<blockquote>' + esc(q.text) + '</blockquote>' +
      '<p class="who">' + esc(q.who) + '</p>' +
      '<p class="ask">Which of these two would you still watch with the Red Bull name taken off?</p>' +
      '<div class="test-opts">' + TEST.map(function (t) { return '<button type="button" class="test-opt" data-k="' + t.k + '">' + t.label + '</button>'; }).join('') + '</div>';
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.test-opt'); if (!b || rt.test) return;
      rt.test = b.dataset.k;
      var label = TEST.filter(function (t) { return t.k === rt.test; })[0].label;
      box.classList.add('done');
      box.innerHTML = '<p class="locked-line" style="margin:0"><b style="color:#F3B08A">Tom\'s test</b><span>You said: ' + esc(label) + '</span></p>';
      var call = buildCall();
      box.after(call);
      call.classList.add('enter');
      scrollToEl(call, 'center');
    });
    return box;
  }

  /* The tug: drag or tap toward the film you back, and how far */
  function buildCall() {
    var cfg = rt.cfg, views = cfg.mode === 'views';
    var N = views ? NOTCHES.length : 1;
    var span = views ? 50 : 38;
    var call = el('div', 'call block');
    var L = rt.left, Rr = rt.right;
    var ticks = '', scale = '';
    if (views) {
      for (var p = -N; p <= N; p++) {
        var x = 50 + p / N * span;
        if (p !== 0) ticks += '<i class="tug-tick" style="left:' + x + '%"></i>';
        scale += '<span data-p="' + p + '" style="left:' + x + '%">' + (p === 0 ? 'Same' : NOTCHES[Math.abs(p) - 1]) + '</span>';
      }
    }
    call.innerHTML =
      '<p class="tug-read" aria-live="polite"></p>' +
      '<div class="tug-ends">' +
        '<button type="button" class="tug-end l"><span class="ch">&larr;</span><span>' + esc(cfg.short[L.key]) + '</span></button>' +
        '<button type="button" class="tug-end r"><span>' + esc(cfg.short[Rr.key]) + '</span><span class="ch">&rarr;</span></button>' +
      '</div>' +
      '<div class="tug-track" role="slider" tabindex="0" aria-label="Your pick' + (views ? ' and how big the gap is' : '') + '" aria-valuemin="' + (-N) + '" aria-valuemax="' + N + '" aria-valuenow="0">' +
        '<span class="tug-rope"></span>' + ticks + '<span class="tug-mid"></span><span class="tug-fill"></span><span class="tug-knot"></span>' +
      '</div>' +
      (views ? '<div class="tug-scale" aria-hidden="true">' + scale + '</div><p class="tug-cap">Times the views of the other film</p>' : '') +
      '<div class="sure-wrap"><p class="sure-q">How sure are you?</p><div class="sures">' +
        SURE.map(function (s) { return '<button type="button" class="sure" data-k="' + s.k + '" disabled>' + s.label + '</button>'; }).join('') +
      '</div><p class="sure-note">Move the marker toward a film first.</p></div>';

    var track = $('.tug-track', call), knot = $('.tug-knot', call), fill = $('.tug-fill', call), read = $('.tug-read', call);
    var endL = $('.tug-end.l', call), endR = $('.tug-end.r', call), sures = $('.sures', call), note = $('.sure-note', call);

    function set(p) {
      if (rt.locked) return;
      p = Math.max(-N, Math.min(N, p));
      var was = rt.pos; rt.pos = p;
      var x = 50 + p / N * span;
      knot.style.left = x + '%';
      fill.style.left = Math.min(50, x) + '%';
      fill.style.width = Math.abs(x - 50) + '%';
      track.classList.toggle('set', p !== 0);
      track.setAttribute('aria-valuenow', p);
      endL.classList.toggle('on', p < 0); endR.classList.toggle('on', p > 0);
      var backed = p < 0 ? L.key : p > 0 ? Rr.key : null;
      Array.prototype.forEach.call(rt.els.posters.querySelectorAll('.poster'), function (po) { po.classList.toggle('backed', po.dataset.side === backed); });
      Array.prototype.forEach.call(call.querySelectorAll('.tug-scale span'), function (s) { s.classList.toggle('on', +s.dataset.p === p); });
      read.innerHTML = readout();
      track.setAttribute('aria-valuetext', read.textContent);
      var ready = p !== 0;
      Array.prototype.forEach.call(call.querySelectorAll('.sure'), function (b) { b.disabled = !ready; });
      note.textContent = ready ? 'Tap one to lock in your pick.' : 'Move the marker toward a film first.';
      if (ready && was === 0) { sures.classList.remove('ready'); void sures.offsetWidth; sures.classList.add('ready'); }
    }
    function readout() {
      if (rt.pos === 0) {
        return '<span class="hint">' + (views ? 'Drag the marker toward the film you pick. Drag it further if you think the gap is bigger.' : 'Drag the marker toward the campaign you pick, or tap its name.') + '</span>';
      }
      var side = rt.pos < 0 ? L : Rr, g = NOTCHES[Math.abs(rt.pos) - 1];
      if (!views) return 'You pick <span class="big">' + esc(cfg.short[side.key]) + '</span>';
      return '<span class="big">' + esc(cfg.short[side.key]) + '</span>, about ' + g + ' times the views' + (Math.abs(rt.pos) === N ? ' or more' : '');
    }
    function fromX(clientX) {
      var rc = track.getBoundingClientRect();
      var frac = (clientX - rc.left) / rc.width - 0.5;
      if (!views) { if (Math.abs(frac) > 0.04) set(frac < 0 ? -1 : 1); return; }
      set(Math.round(frac / (span / 100) * N));
    }
    var dragging = false;
    track.addEventListener('pointerdown', function (e) {
      if (rt.locked) return;
      dragging = true; track.classList.add('dragging');
      try { track.setPointerCapture(e.pointerId); } catch (x) {}
      fromX(e.clientX); e.preventDefault();
    });
    track.addEventListener('pointermove', function (e) { if (dragging) fromX(e.clientX); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) {
      track.addEventListener(ev, function () { dragging = false; track.classList.remove('dragging'); });
    });
    track.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowLeft' || k === 'ArrowDown') { set(rt.pos - 1); e.preventDefault(); }
      else if (k === 'ArrowRight' || k === 'ArrowUp') { set(rt.pos + 1); e.preventDefault(); }
      else if (k === 'Home') { set(-N); e.preventDefault(); }
      else if (k === 'End') { set(N); e.preventDefault(); }
    });
    endL.addEventListener('click', function () { set(rt.pos > 0 ? -1 : rt.pos - 1); });
    endR.addEventListener('click', function () { set(rt.pos < 0 ? 1 : rt.pos + 1); });
    sures.addEventListener('click', function (e) {
      var b = e.target.closest('.sure'); if (!b || b.disabled || rt.locked) return;
      lock(b.dataset.k);
    });
    rt.els.call = call;
    set(0);
    return call;
  }

  /* ---------------- lock and reveal ---------------- */
  function sideOf(key) { return rt.r.sides[key]; }
  function other(key) { var ks = Object.keys(rt.r.sides); return ks[0] === key ? ks[1] : ks[0]; }
  function valueOf(key) { var s = sideOf(key), f = rt.cfg.value && rt.cfg.value[key]; return f ? s[f] : s.views; }

  function wait(ms) {
    var me = rt;
    if (reduced || me.skip) return Promise.resolve();
    return new Promise(function (res) {
      var t = setTimeout(res, ms);
      me.skipCbs.push(function () { clearTimeout(t); res(); });
    });
  }
  function skipAll() { if (!rt || rt.skip) return; rt.skip = true; rt.skipCbs.splice(0).forEach(function (f) { f(); }); }

  function lock(sureKey) {
    var cfg = rt.cfg, views = cfg.mode === 'views';
    rt.locked = true; rt.sure = sureKey;
    var pick = rt.pos < 0 ? rt.left.key : rt.right.key;
    rt.pick = pick;
    rt.guess = views ? NOTCHES[Math.abs(rt.pos) - 1] : null;
    rt.top = views && Math.abs(rt.pos) === NOTCHES.length;
    var right = pick === rt.r.winner;
    S.results[rt.i].side = right;
    if (right) addPoint();
    S.revealed[rt.i] = true;

    var sureLabel = SURE.filter(function (s) { return s.k === sureKey; })[0].label;
    var call = rt.els.call;
    call.classList.add('locked');
    call.innerHTML = '<p class="locked-line" style="margin:0"><b>Your pick</b><span>' +
      esc(cfg.short[pick]) + (views ? ', about ' + rt.guess + ' times the views' + (rt.top ? ' or more' : '') : '') + '. ' + esc(sureLabel) + '.</span></p>';

    // winning poster keeps its tag; relabel
    Array.prototype.forEach.call(rt.els.posters.querySelectorAll('.poster'), function (po) {
      if (po.dataset.side === pick) $('.tag', po).textContent = 'Your pick';
    });

    var v = buildVerdict(right, sureKey);
    rt.els.sec.appendChild(v);
    v.classList.add('enter');
    setTimeout(function () { scrollToEl(v); }, 60);

    var next = cfg.mode === 'side' ? revealCast() : revealRace();
    next.then(function () { return wait(350); }).then(afterReveal);
  }

  function buildVerdict(right, sure) {
    var cfg = rt.cfg, views = cfg.mode === 'views';
    var box = el('div', 'verdict block');
    var lines = [];
    if (right) {
      lines.push({ hunch: 'Your hunch was right.', fairly: 'You were fairly sure, and you were right.', certain: 'You were certain, and you were right.' }[sure]);
    } else {
      var won = THE[rt.r.winner];
      lines.push({
        hunch: 'Your hunch went with ' + THE[rt.pick] + ', and a lot of companies make that same choice. There is another way, and here is what happened with ' + won + '.',
        fairly: 'You were fairly sure of ' + THE[rt.pick] + ', and a lot of companies would agree with you. There is another way, and here is what happened with ' + won + '.',
        certain: 'You were certain of ' + THE[rt.pick] + ', and a lot of companies make that same choice. There is another way, and here is what happened with ' + won + '.'
      }[sure]);
    }
    if (right && views) {
      var w = rt.r.winner, real = ratio(valueOf(w), valueOf(other(w)));
      var g = rt.guess, cmp;
      if (rt.top && real.r >= g) cmp = 'which is close to your guess';
      else if (real.r / g <= 1.6 && g / real.r <= 1.6) cmp = 'which is close to your guess';
      else if (real.r > g) cmp = 'which is bigger than your guess';
      else cmp = 'which is smaller than your guess';
      lines.push('You guessed about ' + g + ' times' + (rt.top ? ' or more' : '') + '. The real gap was ' + real.text + ', ' + cmp + '.');
    }
    box.innerHTML =
      '<span class="mark' + (right ? '' : ' alt') + '">' + (right ? ICON.check : ICON.arrow) + '</span>' +
      '<div><h3>' + (right ? esc(D.correctPick) : 'Here is what happened') + '</h3>' + lines.map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') + '</div>';
    return box;
  }

  /* ---------------- the race: bars grow, then the axis rescales ---------------- */
  function Race(rows) {
    var self = this;
    this.axis = 1; this.rows = {}; this.gls = {};
    var box = el('div', 'race block');
    box.innerHTML = '<div class="race-head"><span>Views on YouTube</span></div><div class="race-plot"><div class="grid"></div></div>';
    var skip = el('button', 'skipbtn', 'Skip');
    skip.type = 'button';
    skip.addEventListener('click', function () { skipAll(); skip.remove(); });
    box.appendChild(skip);
    this.skipBtn = skip;
    var plot = $('.race-plot', box);
    rows.forEach(function (r) {
      var row = el('div', 'row' + (r.win ? ' win' : ''));
      row.innerHTML = '<div class="row-top"><img alt="" src="' + thumb(r.id) + '"><span class="row-name">' + esc(r.name) + '</span><span class="row-count">0</span></div>' +
        '<div class="lane"><div class="track"></div></div>';
      var track = $('.track', row);
      var segs = (r.segs || [r.value]).map(function (v, k) {
        var s = el('span', 'seg' + (r.segs ? ' ep' : ''));
        track.appendChild(s);
        return { v: v, el: s, vis: k === 0 };
      });
      var over = el('span', 'over', ICON.over); track.appendChild(over);
      var ghost = el('span', 'ghost', '<span>Your guess</span>'); $('.lane', row).appendChild(ghost);
      plot.appendChild(row);
      self.rows[r.key] = { row: row, segs: segs, shown: 0, count: $('.row-count', row), ghost: ghost, ghostV: null, track: track };
    });
    this.box = box; this.grid = $('.grid', box);
  }
  Race.prototype.layout = function () {
    var ax = this.axis, self = this;
    Object.keys(this.rows).forEach(function (k) {
      var R = self.rows[k], cum = 0;
      R.segs.forEach(function (s) {
        if (!s.vis) { s.el.style.width = '0%'; s.el.style.left = (cum / ax * 100) + '%'; return; }
        var w = Math.max(0, Math.min(s.v, R.shown - cum));
        s.el.style.left = (cum / ax * 100) + '%';
        s.el.style.width = (w / ax * 100) + '%';
        cum += s.v;
      });
      R.row.classList.toggle('overflowing', R.shown > ax * 1.001);
      if (R.ghostV != null) {
        var gx = R.ghostV / ax;
        R.ghost.style.left = (Math.min(gx, 1) * 100) + '%';
        R.ghost.classList.toggle('edge', gx > 0.8);
      }
    });
  };
  Race.prototype.ticks = function () {
    var ax = this.axis, raw = ax / 3, mag = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / mag;
    var step = (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
    var want = { 0: true };
    for (var t = step; t < ax * 0.97; t += step) want[Math.round(t)] = true;
    var grid = this.grid, gls = this.gls;
    Object.keys(want).forEach(function (v) {
      if (!gls[v]) {
        var g = el('i', 'gl fade' + (+v === 0 ? ' zero' : ''), '<span>' + compact(+v) + '</span>');
        g.style.left = '0%';
        grid.appendChild(g); gls[v] = g;
        g.style.left = (+v / ax * 100) + '%';
        requestAnimationFrame(function () { g.classList.remove('fade'); });
      }
    });
    Object.keys(gls).forEach(function (v) {
      var g = gls[v];
      g.style.left = Math.min(+v / ax * 100, 100) + '%';
      if (!want[v]) { g.classList.add('fade'); delete gls[v]; setTimeout(function () { g.remove(); }, 600); }
    });
  };
  Race.prototype.setAxis = function (ax) { this.axis = ax; this.layout(); this.ticks(); };
  Race.prototype.setShown = function (k, v) { var R = this.rows[k]; R.shown = v; R.count.textContent = fmt(v); };
  Race.prototype.stamp = function (big, chan, note) {
    var s = el('div', 'stamp drop');
    s.innerHTML = '<span class="big o">' + esc(cap(big)) + '</span>' + (chan ? '<span class="big">' + esc(chan) + '</span>' : '') + (note ? '<p class="note">' + esc(note) + '</p>' : '');
    this.box.insertBefore(s, this.foot);
    return s;
  };

  /* Phase one: both bars grow at the same speed. The smaller one stops; the bigger one runs off the edge. */
  function raceRun(race, loseKey, winKey, lv, wv) {
    var me = rt;
    var axis = lv * 1.15;
    race.box.classList.add('live');
    race.setAxis(axis);
    return new Promise(function (resolve) {
      var done = false;
      function finish() {
        if (done) return; done = true;
        race.setShown(loseKey, lv); race.setShown(winKey, wv); race.layout();
        resolve();
      }
      if (reduced || me.skip) { finish(); return; }
      me.skipCbs.push(finish);
      var speed = axis / 1300, edgeT = axis / speed, runT = 1200, t0 = performance.now();
      function step(now) {
        if (done) return;
        var t = now - t0;
        var sl = Math.min(lv, speed * t), sw;
        if (t < edgeT) sw = Math.min(wv, speed * t);
        else { var p = Math.min(1, (t - edgeT) / runT); sw = axis + (wv - axis) * (p * p * p); }
        race.setShown(loseKey, sl); race.setShown(winKey, sw); race.layout();
        if (sw >= wv && sl >= lv) { finish(); return; }
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      setTimeout(finish, edgeT + runT + 900);
    });
  }

  function revealRace() {
    var r = rt.r, cfg = rt.cfg, w = r.winner, l = other(w);
    var wv = valueOf(w), lv = valueOf(l);
    var rows = [rt.left, rt.right].map(function (s) {
      var isWin = s.key === w;
      var row = { key: s.key, id: s.videoId, win: isWin, value: valueOf(s.key), name: cfg.short[s.key] };
      if (isWin && cfg.stack) { row.segs = r.episodes.map(function (e) { return e.views; }); row.name = "Rico's Tacos"; }
      return row;
    });
    var race = new Race(rows);
    var foot = el('div', 'race-foot', '<span>View counts come from YouTube.</span><button type="button" class="linkbtn" data-sources>Sources</button>');
    race.box.appendChild(foot); race.foot = foot;
    rt.els.sec.appendChild(race.box);
    race.box.classList.add('enter');
    rt.race = race;
    if (cfg.stack) { race.rows[w].row.querySelector('.row-name').textContent = "Rico's Tacos, episode 1"; }

    var real = ratio(wv, lv);
    return wait(500).then(function () {
      return raceRun(race, l, w, lv, wv);
    }).then(function () {
      return wait(r.id === 'audience' ? 900 : 450);
    }).then(function () {
      race.box.classList.remove('live');
      race.setAxis(wv * 1.06);
      if (rt.pick === w) { race.rows[w].ghostV = rt.guess * lv; race.layout(); }
      return wait(1000);
    }).then(function () {
      if (rt.pick === w) { race.rows[w].ghost.classList.add('show'); race.rows[w].row.classList.add('guessed'); }
      var note = cfg.stack ? 'Episode 1 alone, against one Tide commercial.' : null;
      race.stamp(real.text, cfg.channels, note);
      if (!cfg.stack) return;
      return stackUp(race, w, l, lv);
    }).then(function () {
      race.skipBtn.remove();
      if (r.id === 'audience') {
        var st = sideOf('stratos');
        var peak = /more than \S+ million/.exec(st.concurrentStreams);
        var peakLine = peak
          ? 'At its peak, the live jump had ' + peak[0] + ' streams playing at once, the most of any livestream on YouTube at the time.'
          : 'The live jump had ' + st.concurrentStreams + '.';
        var ex = el('p', 'extra', esc(peakLine) + ' <span class="small">' + esc(st.concurrentSource) + '.</span>');
        race.box.insertBefore(ex, race.foot);
        var echo = {
          jump: 'Before the numbers, you said you would still watch the jump with the name taken off.',
          cartoon: 'Before the numbers, you said you would still watch the cartoon with the name taken off.',
          both: 'Before the numbers, you said you would still watch both films with the name taken off.',
          neither: 'Before the numbers, you said you would watch neither film with the name taken off.'
        }[rt.test];
        if (echo) race.box.insertBefore(el('p', 'echo', esc(echo)), race.foot);
      }
      if (cfg.follow) return followAudience(race);
    });
  }

  /* Round 1: the other 21 episodes stack up one by one, each at its own views */
  function stackUp(race, w, l, lv) {
    var r = rt.r, R = race.rows[w], eps = r.episodes;
    var cap1 = el('p', 'extra', "Rico's Tacos did not stop at episode 1. Here are the other " + (eps.length - 1) + ' episodes, each one sized by its own view count.');
    race.box.insertBefore(cap1, race.foot);
    return wait(1300).then(function () {
      race.box.classList.add('fast');
      R.row.querySelector('.row-name').textContent = "Rico's Tacos, all " + eps.length + ' episodes';
      var cum = eps[0].views, k = 1;
      return new Promise(function (resolve) {
        function next() {
          if (k >= eps.length || rt.skip || reduced) {
            eps.forEach(function (e, j) { R.segs[j].vis = true; });
            cum = eps.reduce(function (a, e) { return a + e.views; }, 0);
            race.setShown(w, cum); race.setAxis(Math.max(race.axis, cum * 1.06));
            resolve(); return;
          }
          R.segs[k].vis = true; R.segs[k].el.classList.add('new');
          cum += eps[k].views; k++;
          race.setShown(w, cum);
          race.setAxis(Math.max(race.axis, cum * 1.06));
          setTimeout(next, 150);
        }
        next();
      });
    }).then(function () { return wait(500); }).then(function () {
      race.box.classList.remove('fast');
      var total = r.sides[w].totalViews;
      var sum = eps.reduce(function (a, e) { return a + e.views; }, 0);
      race.setShown(w, sum);
      var tr = ratio(total, lv);
      race.stamp(tr.text, rt.cfg.channels, 'All ' + r.sides[w].episodes + ' episodes together, against the same Tide commercial.');
    });
  }

  /* Round 4: each film's views settle on the channel that posted it */
  function followAudience(race) {
    var r = rt.r, yf = r.sides.yetiFilm, pb = r.sides.pbrSponsor;
    var box = el('div', 'block');
    box.innerHTML = '<p class="lower">Follow the audience</p>' +
      '<p class="sub" style="margin-bottom:.2rem">Each film\'s views go to the channel that posted it.</p>' +
      '<div class="follow">' +
        '<div class="chan mine" data-k="yetiFilm"><div class="chan-h"><span class="chan-dot">Y</span>YETI\'s channel</div>' +
          '<div class="chan-n"><span class="n">0</span><small>views</small></div><p>' + esc(yf.name.split(',')[0]) + ' sits here, on the channel YETI owns.</p></div>' +
        '<div class="chan" data-k="pbrSponsor"><div class="chan-h"><span class="chan-dot">P</span>PBR\'s channel</div>' +
          '<div class="chan-n"><span class="n">0</span><small>views</small></div><p>The award film sits here, on the channel PBR owns. YETI\'s name is on the award.</p></div>' +
      '</div>';
    rt.els.sec.appendChild(box);
    box.classList.add('enter');
    setTimeout(function () { scrollToEl(box, 'center'); }, 50);
    var cards = box.querySelectorAll('.chan');
    return wait(700).then(function () {
      return Promise.all(Array.prototype.map.call(cards, function (c, idx) {
        return new Promise(function (res) {
          setTimeout(function () {
            c.classList.add('in');
            var k = c.dataset.k, v = r.sides[k].views, n = $('.n', c);
            var from = race.rows[k] && race.rows[k].count;
            if (!reduced && !rt.skip && from) {
              var a = from.getBoundingClientRect(), b = n.getBoundingClientRect();
              var fl = el('span', 'flyer', fmt(v));
              fl.style.left = a.left + 'px'; fl.style.top = a.top + 'px';
              document.body.appendChild(fl);
              requestAnimationFrame(function () { requestAnimationFrame(function () {
                fl.style.transform = 'translate(' + (b.left - a.left) + 'px,' + (b.top - a.top) + 'px)';
                fl.style.opacity = '0.2';
              }); });
              setTimeout(function () { fl.remove(); n.textContent = fmt(v); res(); }, 850);
            } else { n.textContent = fmt(v); res(); }
          }, reduced ? 0 : idx * 380);
        });
      }));
    });
  }

  /* Round 2: no view counts. The evidence is the mascot research, then the cast strip. */
  function revealCast() {
    var r = rt.r, cf = r.sides.checkFirst, my = r.sides.mayhem;
    var ev = el('div', 'block');
    ev.innerHTML = '<p class="lower">What the research says</p><div class="evid">' + r.evidence.map(function (e) {
      return '<div class="ev" style="opacity:0"><span class="n">' + esc(e.stat) + '</span><span class="l">' + esc(cap(e.label)) + '</span><span class="s">' + esc(e.source.split(/,\s(?!\d{3})/)[0]) + '</span></div>';
    }).join('') + '</div><p class="credit">Both studies compare Mayhem with other insurers\' mascots. <button type="button" class="linkbtn" data-sources>Sources</button></p>';
    rt.els.sec.appendChild(ev);
    var castBox = el('div', 'cast block');
    var art = [castArt(0), castArt(1), castArt(2)];
    castBox.innerHTML = '<p class="cast-h">Who is on screen</p><div class="cast-grid">' +
      '<div class="cast-col"><h4>Mayhem</h4><div class="mayhem-face"><img alt="A still from ' + esc(my.videoLabel) + '" src="' + thumb(my.videoId) + '"><span class="since">The same character</span></div>' +
        '<p>' + esc(my.label) + '.</p></div>' +
      '<div class="cast-col"><h4>Check First</h4><div class="casts">' + cf.campaignSpots.map(function (s, k) {
        return '<div class="ct"><div class="ct-art" aria-hidden="true">' + art[k] + '</div><p class="ct-name">' + esc(s) + '</p><p class="ct-line">“' + esc(cf.repeatedLine) + '”</p></div>';
      }).join('') + '</div><p>A new cast in every spot, and every spot says the same line.</p></div>' +
      '</div>';
    return wait(700).then(function () {
      var items = ev.querySelectorAll('.ev');
      return new Promise(function (res) {
        Array.prototype.forEach.call(items, function (it, k) {
          setTimeout(function () { it.style.opacity = ''; it.classList.add('pop'); if (k === items.length - 1) res(); }, reduced ? 0 : k * 260);
        });
      });
    }).then(function () { return wait(700); }).then(function () {
      rt.els.sec.appendChild(castBox);
      castBox.classList.add('enter');
      var cts = castBox.querySelectorAll('.ct');
      return new Promise(function (res) {
        Array.prototype.forEach.call(cts, function (c, k) {
          setTimeout(function () { c.classList.add('in'); if (k === cts.length - 1) setTimeout(res, 400); }, reduced ? 0 : 400 + k * 420);
        });
      });
    });
  }
  /* Simple figure groups: a different set of people in each Check First spot. Drawings only, no likeness. */
  function castArt(k) {
    var sets = [
      [[30, 1, '#1A1816'], [58, .78, '#6b6459'], [84, .92, '#3A3632']],
      [[38, .95, '#3A3632'], [72, 1, '#6b6459']],
      [[26, .9, '#6b6459'], [52, 1.05, '#1A1816'], [78, .7, '#3A3632'], [98, .8, '#8b847a']]
    ][k];
    var s = '<svg viewBox="0 0 120 100" role="img">';
    sets.forEach(function (p) {
      var x = p[0], sc = p[1], c = p[2], h = 60 * sc, r = 10 * sc;
      s += '<circle cx="' + x + '" cy="' + (100 - h - r) + '" r="' + r + '" fill="' + c + '"/>' +
        '<rect x="' + (x - 13 * sc) + '" y="' + (100 - h + 3) + '" width="' + (26 * sc) + '" height="' + h + '" rx="' + (11 * sc) + '" fill="' + c + '"/>';
    });
    return s + '</svg>';
  }

  /* ---------------- why ---------------- */
  function afterReveal() {
    var r = rt.r;
    var box = el('div', 'why block');
    var opts = shuffle(r.why.options);
    box.innerHTML = '<h3>' + esc(r.why.question) + '</h3><div class="opts">' + opts.map(function (o, k) {
      return '<button type="button" class="opt" data-side="' + o.side + '"><span class="k">' + 'ABC'[k] + '</span><span class="tx">' + esc(o.text) + '</span></button>';
    }).join('') + '</div>';
    rt.els.sec.appendChild(box);
    box.classList.add('enter');
    rt.els.why = box;
    setTimeout(function () { scrollToEl(box, reduced ? 'start' : 'center'); }, 80);
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.opt'); if (!b || rt.why) return;
      answerWhy(b);
    });
  }
  function answerWhy(b) {
    var r = rt.r, box = rt.els.why;
    rt.why = b.dataset.side;
    var right = rt.why === r.winner;
    S.results[rt.i].why = right;
    if (right) addPoint();
    Array.prototype.forEach.call(box.querySelectorAll('.opt'), function (o) {
      o.disabled = true;
      var isRight = o.dataset.side === r.winner;
      o.classList.add(isRight ? 'right' : 'dim');
      if (o === b) o.classList.add('mine');
      var flag = null;
      if (isRight && o === b) flag = 'Your answer';
      else if (isRight) flag = 'The reason that fits';
      else if (o === b) flag = 'Your answer';
      if (flag) $('.tx', o).insertAdjacentHTML('beforeend', '<span class="flag">' + esc(flag) + '</span>');
    });
    var res = el('p', 'why-res', right ? esc(D.correctReason) : 'The highlighted answer fits what happened.');
    box.appendChild(res);
    var q = r.quote;
    if (r.id === 'repetition' || r.id === 'audience') {
      var more = rt.cfg.more ? D.readMore.replace('{subject}', rt.cfg.more) : 'Read more';
      var pull = el('figure', 'pull');
      pull.innerHTML = '<blockquote>' + esc(q.text) + '</blockquote><p>' + esc(q.cite) + '. <a href="' + esc(q.url) + '" target="_blank" rel="noopener">' + esc(more) + '</a></p>';
      box.appendChild(pull);
    }
    S.results[rt.i].done = true;
    var rc = buildRungCard();
    setTimeout(function () {
      rt.els.sec.appendChild(rc);
      rc.classList.add('enter');
      setLadder(rt.i, rt.i);
      scrollToEl(rc, 'center');
    }, reduced ? 0 : 650);
  }
  function buildRungCard() {
    var r = rt.r, cfg = rt.cfg, i = rt.i;
    var wrap = el('div', 'block');
    var card = el('div', 'rungcard');
    card.innerHTML = '<span class="rn">' + (i + 1) + '</span><span class="rl">Rung ' + (i + 1) + ' of 4 is lit</span><h3>' + esc(r.rung) + '</h3>' +
      '<p class="lesson">' + esc(r.lesson) + '</p>' +
      (cfg.principle ? '<p class="princ">One of Tom\'s principles: <b>' + esc(cfg.principle) + '</b></p>' : '');
    wrap.appendChild(card);
    var row = el('div', 'nextrow');
    var last = i === ROUNDS.length - 1;
    var btn = el('button', 'btn', last ? 'See my result <span class="arr">&rarr;</span>' : (i === 2 ? 'Final round: ' : 'Round ' + (i + 2) + ': ') + ROUNDS[i + 1 < 4 ? i + 1 : i].company.replace('&', '&amp;') + ' <span class="arr">&rarr;</span>');
    btn.type = 'button';
    btn.addEventListener('click', function () {
      if (last) { result(); return; }
      stage.style.opacity = '0';
      setTimeout(function () { startRound(i + 1); stage.style.opacity = ''; }, reduced ? 0 : 160);
    });
    row.appendChild(btn);
    wrap.appendChild(row);
    return wrap;
  }

  /* ---------------- result ---------------- */
  function result() {
    stopFilm(); stopCycles();
    var played = S.played.length, total = played * 2;
    S.i = 4; rt = null;
    setHud('');
    $('#hudScore').hidden = true;
    $('#ladder').classList.add('off');
    var rungsHtml = ROUNDS.map(function (r, i) {
      return '<li data-i="' + i + '"><span class="bar"></span><div class="t"><b><em>' + (i + 1) + '</em>' + esc(r.rung) + '</b><span>' + esc(F.synthesis[i]) + '</span></div></li>';
    }).join('');
    var html =
      '<section class="result">' +
        '<div class="tally"><p class="lower">Your result</p>' +
          '<p class="score" aria-label="' + S.score + ' of ' + total + '"><span id="scoreN">0</span> of ' + total + '</p>' +
          '<p>One point for each round where your pick matched the result, and one for each reason that fits' + (played < 4 ? ', across the ' + played + ' rounds you played' : '') + '.</p>' +
        '</div>' +
        '<div class="bigladder"><h2>The four rungs of Tom Langan\'s Legendeering ladder</h2><ol class="bl">' + rungsHtml + '</ol></div>' +
        '<div class="closing"><p>' + esc(F.closingQuestion) + '</p></div>' +
        '<div class="cta" id="cta"><h2>' + esc(F.cta.heading) + '</h2><p>' + esc(F.cta.copy) + '</p>' +
          '<a class="btn" href="' + esc(F.cta.url) + '" target="_blank" rel="noopener">' + esc(F.cta.button) + ' <span class="arr">&rarr;</span></a></div>' +
        '<div class="after"><button type="button" class="btn quiet" id="shareBtn">Send this to a colleague</button>' +
          '<button type="button" class="linkbtn" id="againBtn">Play again</button></div>' +
      '</section>';
    stage.innerHTML = html;
    window.scrollTo(0, 0);
    var sn = $('#scoreN');
    countSmall(sn, S.score);
    var lis = stage.querySelectorAll('.bl li');
    Array.prototype.forEach.call(lis, function (li, k) {
      setTimeout(function () { li.classList.add('on'); }, reduced ? 0 : 500 + k * 420);
    });
    $('#shareBtn').addEventListener('click', share);
    $('#againBtn').addEventListener('click', function () {
      S = { i: -1, score: 0, played: [], revealed: {}, results: {} };
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
      landing(); window.scrollTo(0, 0);
    });
  }
  function countSmall(node, to) {
    if (reduced || to === 0) { node.textContent = to; return; }
    var k = 0;
    var t = setInterval(function () { k++; node.textContent = k; if (k >= to) clearInterval(t); }, 140);
    setTimeout(function () { clearInterval(t); node.textContent = to; }, 140 * to + 300);
  }
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('on'); }, 2400);
  }
  function share() {
    var total = S.played.length * 2;
    var url = location.origin + location.pathname + '#vs=' + S.score;
    var text = 'Which One Was Better? I scored ' + S.score + ' of ' + total + " in Talex Media's four-round game about video series. See how you do: " + url;
    if (navigator.share) {
      navigator.share({ title: D.title, text: text }).catch(function (e) {
        if (e && e.name === 'AbortError') return;
        copy(text);
      });
    } else { copy(text); }
  }
  function copy(text) {
    function fallback() {
      var ta = el('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('Link copied. Paste it to a colleague.'); } catch (e) { toast('Copy this link: ' + url); }
      ta.remove();
    }
    var url = text;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('Link copied. Paste it to a colleague.'); }, fallback);
    } else fallback();
  }

  /* ---------------- sources sheet ---------------- */
  function sourcesHtml() {
    var h = '';
    var any = false;
    ROUNDS.forEach(function (r, i) {
      if (!S.revealed[i]) return;
      any = true;
      h += '<h3>' + (i === 3 ? 'Final round' : 'Round ' + (i + 1)) + ' · ' + esc(r.company) + '</h3><ul>';
      Object.keys(r.sides).forEach(function (k) {
        var s = r.sides[k];
        h += '<li>' + esc(s.videoLabel) + ', on the ' + esc(s.channelOwner.split(',')[0]) + ' YouTube channel' +
          (r.id === 'cast' ? '' : ': ' + fmt(s.views) + ' views') + '. <a href="' + watchUrl(s.videoId) + '" target="_blank" rel="noopener">Open on YouTube</a></li>';
      });
      if (r.id === 'repetition') {
        var ri = r.sides.ricos;
        h += '<li>' + esc(ri.channelOwner) + '. The series ran ' + ri.episodes + ' episodes from ' + esc(ri.runDates) + ', ' + esc(ri.cadence) + '. The series total adds up the views of every episode: ' + fmt(ri.totalViews) + '.</li>';
        h += '<li>' + esc(r.episodeNote) + '</li>';
      }
      if (r.id === 'cast') {
        r.evidence.forEach(function (e) { h += '<li>' + esc(e.stat) + ' ' + esc(e.label) + '. ' + esc(e.source) + '. <a href="' + esc(e.url) + '" target="_blank" rel="noopener">Read the source</a></li>'; });
        h += '<li>' + esc(r.evidenceScope) + '</li>';
        h += '<li>' + esc(r.sides.checkFirst.evidence) + '</li>';
      }
      if (r.id === 'audience') {
        var st = r.sides.stratos, co = r.sides.confession;
        h += '<li>Stratos: ' + esc(st.concurrentStreams) + '. ' + esc(st.concurrentSource) + '. <a href="' + esc(st.concurrentUrl) + '" target="_blank" rel="noopener">Read the source</a></li>';
        h += '<li>Red Bull has made Gives You Wiiings cartoons since ' + co.cartoonsSince + '. ' + esc(co.cartoonsSource) + '.</li>';
      }
      if (r.id === 'ownership') {
        h += '<li>YETI Presents films have run since ' + r.sides.yetiFilm.seriesSince + '. ' + esc(r.sides.pbrSponsor.sponsorNote) + '.</li>';
        h += '<li>' + esc(r.quote.text) + ' ' + esc(r.quote.cite) + '.</li>';
      }
      if (r.id === 'repetition' || r.id === 'audience') {
        h += '<li>Quote: ' + esc(r.quote.cite) + '. <a href="' + esc(r.quote.url) + '" target="_blank" rel="noopener">Read the article</a></li>';
      }
      h += '</ul>';
    });
    if (!any) h += '<p>Sources for each round appear here after you make your pick in that round, so nothing gives the answer away early.</p>';
    var q = F.founderQuote;
    h += '<h3>Tom Langan\'s quote</h3><ul><li>' + esc(D.founderCredit) + '. <a href="' + esc(q.url) + '" target="_blank" rel="noopener">' + esc(D.founderLink) + '</a></li></ul>';
    h += '<h3>About the numbers</h3><ul><li>' + esc(F.readNote) + '</li><li>Every comparison on this page is worked out from those counts, and the page says when two films sit on different channels.</li></ul>';
    return h;
  }
  var sheet = $('#sheet'), lastFocus = null;
  function openSheet() {
    lastFocus = document.activeElement;
    $('#sheetBody').innerHTML = sourcesHtml();
    sheet.hidden = false;
    document.body.style.overflow = 'hidden';
    $('.sheet-x', sheet).focus();
  }
  function closeSheet() {
    sheet.hidden = true; document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-sources]')) { openSheet(); return; }
    if (e.target.closest('[data-close-sheet]')) closeSheet();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });

  /* ---------------- boot ---------------- */
  buildLadder();
  var dl = /^#r([1-4])$/.exec(location.hash);
  if (dl) startRound(parseInt(dl[1], 10) - 1); else landing();
})();
