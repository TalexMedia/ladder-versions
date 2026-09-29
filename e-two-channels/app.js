/* Which One Was Better? Version E, Two Channels.
   Reads every figure from ../shared/facts.js (window.FACTS). Ratios are computed here, never typed. */
(function () {
  'use strict';
  var F = window.FACTS, R = F.rounds, EV = F.evansCopyDecisions;
  var RM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var app = document.getElementById('app');

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function later(fn, ms) { return setTimeout(fn, RM ? 0 : ms); }
  function still(id, s) { return 'https://i.ytimg.com/vi/' + id + '/' + s + '.jpg'; }
  function mmss(sec) { var m = Math.floor(sec / 60), s = sec % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
  function poss(name) { return name + "'s"; }
  function ytLink(id) { return 'https://www.youtube.com/watch?v=' + id; }
  function ext(url, text) { return '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(text) + '</a>'; }

  var ICON = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="4" y1="12" x2="20" y2="12"/><polyline points="13 5 20 12 13 19"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
    mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>',
    ring: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle class="ring" cx="12" cy="12" r="10"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="8" y1="6" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="18"/></svg>',
    resume: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" style="fill:#1A1816;stroke:none"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>'
  };
  function okMark() { return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle class="ok" cx="12" cy="12" r="11"/><path d="M7 12.5l3.2 3.2L17 9"/></svg>'; }

  /* ---------- per-side copy (descriptions only; every figure comes from FACTS) ---------- */
  var S = {
    ricos: { short: "Rico's Tacos", subj: "Episode 1 of Rico's Tacos", title: "Rico's Tacos, episode 1", desc: 'A scripted comedy series made with P&G', stills: ['mqdefault', 'hq2', 'hq3'] },
    tideSpot: { short: 'School Lunch', subj: 'School Lunch', title: 'School Lunch', desc: 'A Tide commercial', stills: ['hq1', 'hq2', 'hq3'] },
    mayhem: { short: 'Mayhem', subj: 'Mayhem', title: 'Mayhem', desc: 'The same character returns in every spot', stills: ['hq3', 'hq1', 'hq2'] },
    checkFirst: { short: 'Check First', subj: 'Check First', title: 'Check First', desc: 'A new cast in every spot, and the same line: "Check Allstate first."', stills: ['hq1', 'hq2', 'hq3'] },
    stratos: { short: 'Stratos', subj: 'Stratos', title: 'Stratos', desc: 'Highlights of a live jump from the edge of space', stills: ['hq1', 'mqdefault', 'hq3'] },
    confession: { short: 'Confession', subj: 'Confession', title: 'Confession', desc: 'A cartoon commercial', stills: ['hq1', 'hq2', 'hq3'] },
    yetiFilm: { short: 'A Thousand Casts', subj: 'A Thousand Casts', title: 'A Thousand Casts', desc: 'A YETI Presents documentary', stills: ['mqdefault', 'hq1', 'hq3'] },
    pbrSponsor: { short: 'the PBR award film', subj: 'The PBR award film', title: 'The YETI Bucking Bull Champion', desc: "YETI's name on a bull riding award", stills: ['mqdefault', 'hq2', 'hq3'] }
  };
  /* Which film sits first (top on a phone, left on desktop). Varied so the winner is not always in one place. */
  var ORDER = { 1: ['tideSpot', 'ricos'], 2: ['mayhem', 'checkFirst'], 3: ['confession', 'stratos'], 4: ['yetiFilm', 'pbrSponsor'] };
  var WHY_ORDER = { 1: [1, 0, 2], 2: [1, 0, 2], 3: [1, 2, 0], 4: [1, 0, 2] };
  var QUESTION = {
    1: 'P&G made both films. Which one got more views, and about how many times more?',
    2: 'Which campaign ranked first for memorable ads in the mascot research?',
    3: "Red Bull made both films, and both sit on Red Bull's own YouTube channel. Which one got more views, and about how many times more?",
    4: "Which film drew viewers to YETI's own channel?"
  };
  var LINES = [
    { k: 'Airs', v: 'New episodes every week or every month' },
    { k: 'Starring', v: 'A cast your audience gets to know' },
    { k: 'Made for', v: 'Your audience, not your company' },
    { k: 'Channel', v: 'One your company owns' }
  ];

  /* ---------- the gap scale: five chips, the same in rounds 1 and 3 ---------- */
  var ZONES = [
    { lo: 1, hi: 5, label: 'Under 5 times', short: 'Under 5' },
    { lo: 5, hi: 20, label: '5 to 20 times', short: '5 to 20' },
    { lo: 20, hi: 100, label: '20 to 100 times', short: '20 to 100' },
    { lo: 100, hi: 500, label: '100 to 500 times', short: '100 to 500' },
    { lo: 500, hi: 2500, label: 'Over 500 times', short: 'Over 500' }
  ];
  function zoneOf(r) { for (var i = 0; i < ZONES.length; i++) if (r < ZONES[i].hi) return i; return ZONES.length - 1; }
  function zonePos(r) {
    var i = zoneOf(r), z = ZONES[i];
    var f = Math.log(Math.max(r, z.lo) / z.lo) / Math.log(z.hi / z.lo);
    return (i + Math.min(Math.max(f, 0), 1)) / ZONES.length * 100;
  }
  function approx(r) {
    var t = r < 20 ? Math.round(r) : r < 200 ? Math.round(r / 5) * 5 : Math.round(r / 10) * 10;
    return { n: t, word: (t > r && t % 100 === 0) ? 'nearly' : 'about' };
  }
  function times(r, cap) { var a = approx(r), s = a.word + ' ' + a.n + ' times'; return cap ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  var r1 = R[0].sides, r3 = R[2].sides, r4 = R[3].sides;
  var RATIO = {
    ep1: r1.ricos.firstEpisodeViews / r1.tideSpot.views,
    series: r1.ricos.totalViews / r1.tideSpot.views,
    r3: r3.stratos.views / r3.confession.views,
    r4: r4.yetiFilm.views / r4.pbrSponsor.views
  };
  function callRatio(n) { return n === 1 ? RATIO.ep1 : RATIO.r3; }

  /* ---------- state ---------- */
  var ST = { n: 0, sel: null, chip: null, locked: false, calls: {}, whys: {}, played: [], revealed: [], company: '' };
  var players = [];

  /* ---------- header ---------- */
  function hud(label, n) {
    $('#prog').textContent = label;
    $$('#segs i').forEach(function (s, i) {
      s.className = (ST.played.indexOf(i + 1) > -1 && i + 1 !== n) ? 'on' : (i + 1 === n ? 'now' : '');
    });
  }
  $('#foot').innerHTML = esc(F.brand) + ' · <a href="https://talexmedia.com">talexmedia.com</a> · <a href="mailto:info@talexmedia.com">info@talexmedia.com</a>';

  /* ---------- listing (TV guide) ---------- */
  function guideHTML(opts) {
    opts = opts || {};
    var earned = opts.earned || 0, name = opts.name || 'Your listing';
    var h = '<div class="guide-head"><span class="gt">' + esc(name) + '</span><span class="gc">' + earned + ' of 4 lines</span></div>';
    LINES.forEach(function (l, i) {
      var got = i < earned, isNew = opts.typing === i + 1;
      h += '<div class="row' + (got ? '' : ' empty') + (isNew ? ' new' : '') + '"><span class="k">' + esc(l.k) + '</span><span class="v">' +
        (got ? (isNew ? '<span class="typed"></span><span class="caret"></span>' : esc(l.v)) : 'Fills in after round ' + (i + 1)) + '</span></div>';
    });
    return h;
  }
  function typeLine(root, text) {
    var t = $('.typed', root); if (!t) return;
    if (RM) { t.textContent = text; return; }
    var i = 0;
    var iv = setInterval(function () { i++; t.textContent = text.slice(0, i); if (i >= text.length) clearInterval(iv); }, 28);
    setTimeout(function () { clearInterval(iv); t.textContent = text; }, 28 * text.length + 400);
  }

  /* ---------- YouTube: created only inside a tap, always muted ---------- */
  var ytPromise = null;
  function loadYT() {
    if (ytPromise) return ytPromise;
    ytPromise = new Promise(function (res) {
      if (window.YT && window.YT.Player) return res(true);
      var settled = false;
      function finish(ok) { if (!settled) { settled = true; clearTimeout(timer); res(ok); } }
      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () { if (prev) try { prev(); } catch (e) {} finish(!!(window.YT && window.YT.Player)); };
      var s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.async = true;
      s.onerror = function () { finish(false); };
      document.head.appendChild(s);
      var timer = setTimeout(function () { finish(false); }, 5000);
    });
    return ytPromise;
  }
  function stopFilm(ch) {
    if (!ch) return;
    if (ch._player) { try { ch._player.destroy(); } catch (e) {} ch._player = null; }
    var host = $('.yt', ch); if (host) host.remove();
    var ifr = $('iframe', ch); if (ifr) ifr.remove();
    ch.classList.remove('playing');
    var pp = $('.pp', ch); if (pp) pp.hidden = false;
    players = players.filter(function (c) { return c !== ch; });
  }
  function stopAll() { players.slice().forEach(stopFilm); }
  function pauseOthers(ch) {
    players.slice().forEach(function (c) { if (c === ch) return; if (c._player && c._player.pauseVideo) { try { c._player.pauseVideo(); } catch (e) {} setPP(c, false); } else stopFilm(c); });
  }
  function setPP(ch, playing) {
    var b = $('.pp', ch); if (!b) return;
    b.innerHTML = playing ? ICON.pause + 'Pause' : ICON.resume + 'Play';
    b.setAttribute('aria-label', playing ? 'Pause the film' : 'Play the film');
  }
  function playFilm(ch, id) {
    if (ch.classList.contains('playing')) return;
    pauseOthers(ch);
    ch.classList.add('playing');
    setPP(ch, true);
    $('.pp', ch).hidden = true;
    var host = el('div', 'yt'); $('.screen', ch).appendChild(host);
    players.push(ch);
    loadYT().then(function (ready) {
      if (!ch.classList.contains('playing') || !host.isConnected) return;
      if (!ready) {
        var frame = el('iframe');
        frame.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&mute=1&playsinline=1&rel=0&controls=0&disablekb=1&fs=0&cc_load_policy=1&cc_lang_pref=en';
        frame.allow = 'autoplay; encrypted-media; picture-in-picture';
        frame.title = 'Film playing muted';
        host.appendChild(frame);
        return;
      }
      ch._player = new window.YT.Player(host, {
        host: 'https://www.youtube-nocookie.com',
        videoId: id, width: '100%', height: '100%',
        playerVars: { autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0, playsinline: 1, rel: 0, cc_load_policy: 1, cc_lang_pref: 'en', iv_load_policy: 3 },
        events: {
          onReady: function (e) { if (!ch.classList.contains('playing')) return; $('.pp', ch).hidden = false; try { e.target.mute(); e.target.playVideo(); } catch (x) {} },
          onError: function () { stopFilm(ch); },
          onStateChange: function (e) {
            try { e.target.mute(); } catch (x) {}
            if (e.data === 1) setPP(ch, true);
            if (e.data === 2 || e.data === 0) setPP(ch, false);
          }
        }
      });
    });
  }

  /* ---------- count-up with a timer fallback ---------- */
  function countUp(node, to, dur, f) {
    f = f || fmt;
    if (RM) { node.textContent = f(to); return; }
    var t0 = null;
    function step(ts) { if (!t0) t0 = ts; var p = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3); node.textContent = f(to * e); if (p < 1) requestAnimationFrame(step); }
    node.textContent = f(0);
    requestAnimationFrame(step);
    setTimeout(function () { node.textContent = f(to); }, dur + 250);
  }

  /* ================= LANDING ================= */
  function landing() {
    stopAll();
    ST.n = 0;
    hud('Four rounds', 0);
    var vs = (location.hash.match(/vs=(\d)/) || [])[1];
    vs = vs != null && +vs <= 8 ? +vs : null;
    function wall(list) {
      return list.map(function (p) { var s = R[p[1]].sides[p[0]]; return '<img alt="" decoding="async" src="' + still(s.videoId, 'mqdefault') + '">'; }).join('');
    }
    // keep each pair on screen together: left and right cycle in step, so both halves show the same company
    var pairsL = [['ricos', 0], ['mayhem', 1], ['stratos', 2], ['yetiFilm', 3]];
    var pairsR = [['tideSpot', 0], ['checkFirst', 1], ['confession', 2], ['pbrSponsor', 3]];
    app.innerHTML =
      '<section class="landing">' +
        '<div class="tvcol"><div class="tv poweron" aria-hidden="true"><div class="halves side">' +
          '<div class="ch"><div class="screen"><div class="stills">' + wall(pairsL) + '</div></div><div class="scan"></div><span class="bug">CH <b>1</b></span></div>' +
          '<div class="vs">VS</div>' +
          '<div class="ch"><div class="screen"><div class="stills">' + wall(pairsR) + '</div></div><div class="scan"></div><span class="bug">CH <b>2</b></span></div>' +
        '</div><div class="tv-foot"><span><i class="led"></i>Same company on both channels</span><span>Four rounds</span></div></div></div>' +
        '<div class="copy">' +
          '<p class="eyebrow">Four rounds, two channels each</p>' +
          '<h1>' + esc(EV.title) + '</h1>' +
          '<p class="lead">' + esc(EV.lead) + '</p>' +
          (vs != null ? '<p class="vsline">A colleague got ' + vs + ' of 8 answers right. See how many you get right.</p>' : '') +
          '<div class="start-row"><button class="btn" id="start" type="button">Start round one ' + ICON.arrow + '</button></div>' +
          '<p class="note">' + ICON.check + '<span>' + esc(EV.noticeAboutNumbers) + '</span></p>' +
          '<p class="note">' + ICON.mute + '<span>Films play muted, and only when you tap them.</span></p>' +
        '</div>' +
      '</section>' +
      '<section class="below">' +
        '<div class="quote-card"><span class="mark" aria-hidden="true">&ldquo;</span><blockquote>' + esc(F.founderQuote.text) + '</blockquote>' +
          '<p class="credit">' + esc(EV.founderCredit) + '. ' + ext(F.founderQuote.url, EV.founderLink) + '</p></div>' +
        '<div><p class="eyebrow">Each round adds one line</p><div class="guide">' + guideHTML({ earned: 0 }) + '</div></div>' +
      '</section>';
    $('#start').addEventListener('click', function () { startRound(1); });
    window.scrollTo(0, 0);
  }

  /* ================= ROUND ================= */
  function channelHTML(n, key, num) {
    var s = R[n - 1].sides[key], c = S[key];
    return '<div class="ch" data-key="' + key + '">' +
      '<div class="screen"><div class="stills">' + c.stills.map(function (x) { return '<img alt=""' + (key === 'ricos' ? ' class="pb"' : '') + ' decoding="async" src="' + still(s.videoId, x) + '">'; }).join('') + '</div></div>' +
      '<div class="scan"></div><div class="static"></div>' +
      '<button class="tap" type="button" aria-label="Stay on channel ' + num + ', ' + esc(c.title) + '"></button>' +
      '<span class="bug">CH <b>' + num + '</b></span>' +
      '<button class="watch" type="button" aria-label="Watch ' + esc(c.title) + ', muted">' + ICON.play + 'Watch muted</button>' +
      '<div class="ctrls"><button class="pp" type="button"></button><button class="cl" type="button" aria-label="Close the film">' + ICON.close + 'Close</button></div>' +
      '<span class="muted-tag">Muted</span>' +
      '<div class="lower"><div class="t">' + esc(c.title) + '</div><div class="d">' + esc(c.desc) + '</div><div class="own"></div></div>' +
      '<div class="plate"></div>' +
    '</div>';
  }

  function startRound(n) {
    stopAll();
    ST.n = n; ST.sel = null; ST.chip = null; ST.locked = false;
    if (ST.played.indexOf(n) < 0) ST.played.push(n);
    hud('Round ' + n + ' of 4', n);
    var r = R[n - 1], o = ORDER[n], a = 2 * n - 1;
    app.innerHTML =
      '<section class="stage" id="stage">' +
        '<div class="main-col">' +
          '<p class="eyebrow rhead">' + (n === 4 ? 'Final round' : 'Round ' + n + ' of 4') + ' · ' + esc(r.company) + '</p>' +
          '<h2 class="q">' + esc(QUESTION[n]) + '</h2>' +
          '<div class="tv switching" id="tv"><div class="halves" id="halves">' +
            channelHTML(n, o[0], a) + '<div class="vs" aria-hidden="true">VS</div>' + channelHTML(n, o[1], a + 1) +
          '</div><div class="tv-foot"><span><i class="led"></i>Channels ' + a + ' and ' + (a + 1) + '</span><span>' + esc(r.company) + ' on both</span></div></div>' +
          '<div class="deck" id="deck"><div class="blk" id="pickblk"></div></div>' +
        '</div>' +
        '<aside class="side-col" aria-label="Your listing"><div class="guide" id="sideGuide">' + guideHTML({ earned: n - 1 }) + '</div></aside>' +
      '</section>';
    later(function () { var tv = $('#tv'); if (tv) tv.classList.remove('switching'); }, 600);
    $$('.ch', app).forEach(function (ch) {
      var key = ch.getAttribute('data-key'), id = r.sides[key].videoId;
      $('.tap', ch).addEventListener('click', function () { choose(key); });
      $('.watch', ch).addEventListener('click', function (e) { e.stopPropagation(); playFilm(ch, id); });
      $('.pp', ch).addEventListener('click', function (e) {
        e.stopPropagation();
        var p = ch._player; if (!p || !p.getPlayerState) return;
        var st = p.getPlayerState();
        if (st === 1 || st === 3) { p.pauseVideo(); setPP(ch, false); } else { pauseOthers(ch); p.mute(); p.playVideo(); setPP(ch, true); }
      });
      $('.cl', ch).addEventListener('click', function (e) { e.stopPropagation(); stopFilm(ch); });
    });
    renderPick();
    window.scrollTo(0, 0);
  }

  function chNum(key) { var o = ORDER[ST.n]; return 2 * ST.n - 1 + o.indexOf(key); }

  function renderPick() {
    var n = ST.n, b = $('#pickblk');
    var gap = n === 1 || n === 3;
    if (!ST.sel) {
      b.innerHTML = '<p class="prompt">' + esc(EV.pickInstruction) + ' Tap a channel to stay on it.</p>';
      return;
    }
    var num = chNum(ST.sel), c = S[ST.sel];
    if (gap) {
      b.innerHTML = '<p class="prompt"><b>You are on channel ' + num + ', ' + esc(c.title) + '.</b> About how many times more views did the film on channel ' + num + ' get?</p>' +
        '<div class="chips" role="group" aria-label="Size of the gap">' + ZONES.map(function (z, i) { return '<button class="chip" type="button" data-z="' + i + '" aria-label="' + esc(z.label) + '"><span class="cr">' + esc(z.short) + '</span><span class="cu">times</span></button>'; }).join('') + '</div>';
      $$('.chip', b).forEach(function (btn) { btn.addEventListener('click', function () { btn.classList.add('on'); ST.chip = +btn.getAttribute('data-z'); lock(); }); });
    } else {
      b.innerHTML = '<p class="prompt"><b>You are on channel ' + num + ', ' + esc(c.title) + '.</b> Tap the other channel to switch, or confirm your pick.</p>' +
        '<div class="lockrow"><button class="btn" id="lock" type="button">Confirm channel ' + num + '</button></div>';
      $('#lock').addEventListener('click', lock);
    }
  }

  function choose(key) {
    if (ST.locked) return;
    ST.sel = key;
    $('#stage').classList.add('picked');
    $$('.ch', app).forEach(function (ch) {
      var on = ch.getAttribute('data-key') === key;
      ch.classList.toggle('sel', on);
      if (on && !RM) { ch.classList.add('press'); setTimeout(function () { ch.classList.remove('press'); }, 160); }
    });
    renderPick();
  }

  /* ---------- lock and reveal (the TV stays; only the deck and overlays change) ---------- */
  function lock() {
    if (ST.locked || !ST.sel) return;
    ST.locked = true;
    var n = ST.n, r = R[n - 1], w = r.winner, gap = n === 1 || n === 3;
    var right = ST.sel === w && (!gap || ST.chip === zoneOf(callRatio(n)));
    ST.calls[n] = right;
    if (ST.revealed.indexOf(n) < 0) ST.revealed.push(n);
    var stage = $('#stage');
    stage.classList.add('revealed');
    $$('.ch', app).forEach(function (ch) {
      var key = ch.getAttribute('data-key'), side = r.sides[key];
      ch.classList.toggle('win', key === w);
      $('.tap', ch).setAttribute('aria-label', S[key].title);
      $('.own', ch).textContent = 'On ' + poss(side.channel) + ' YouTube channel';
      plate(ch, n, key);
    });
    var deck = $('#deck');
    var pb = $('#pickblk'); if (pb) pb.remove();
    var card = el('div', 'blk card reveal');
    card.style.scrollMarginTop = '76px';
    card.innerHTML = '<p class="verdict">' + (right ? okMark() : ICON.ring) + '<span>' + verdict(n) + '</span></p>';
    deck.appendChild(card);
    if (gap) revealGap(card, n); else if (n === 2) revealCast(card); else revealOwn(card);
    if (window.innerWidth < 900) later(function () { card.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); }, 250);
    later(function () { whyBlock(n); }, n === 1 ? 1500 : 1100);
  }

  function verdict(n) {
    var r = R[n - 1], w = r.winner, key = ST.sel;
    if (n === 1 || n === 3) {
      var z = zoneOf(callRatio(n));
      if (key === w && ST.chip === z) return '<b>' + esc(EV.correctPick) + '</b> ' + esc(S[w].subj) + ' got more views, and you picked the right range.';
      if (key === w) return 'You picked the right film, since ' + esc(S[w].subj) + ' got more views. The real gap is outside the range you picked.';
      return 'You stayed on ' + esc(S[key].short) + ', and ' + esc(S[w].subj) + ' got more views.';
    }
    if (n === 2) return key === w ? '<b>' + esc(EV.correctPick) + '</b> Mayhem ranked first for memorable ads among insurance mascots.' : 'You stayed on Check First. Mayhem ranked first for memorable ads among insurance mascots.';
    return key === w ? '<b>' + esc(EV.correctPick) + "</b> A Thousand Casts drew viewers to YETI's own channel." : "You stayed on the PBR award film. A Thousand Casts drew viewers to YETI's own channel.";
  }

  function plate(ch, n, key) {
    var p = $('.plate', ch), side = R[n - 1].sides[key];
    if (n === 2) {
      if (key === 'mayhem') { p.classList.add('stamp'); p.innerHTML = '<b>' + esc(R[1].evidence[0].stat) + '</b><span>Most memorable ads<br>among insurance mascots</span>'; }
      else { p.innerHTML = '<b>' + side.campaignSpots.length + ' spots</b><span>' + side.campaignSpots.length + ' casts, 1 line</span>'; }
    } else {
      p.innerHTML = '<b>0</b><span>' + (key === 'ricos' ? 'views, episode 1' : 'views') + '</span>';
      later(function () { countUp($('b', p), side.views, 1200); }, 200);
    }
    later(function () { p.classList.add('on'); }, 120);
  }

  function meterHTML(n) {
    var you = ST.chip, h = '<div class="meter" role="img" aria-label="Your call: ' + esc(ZONES[you].label) + '. Real gap: ' + esc(times(callRatio(n))) + '.">';
    h += '<div class="needle first low" id="nd1"><span class="nl"></span></div>';
    if (n === 1) h += '<div class="needle" id="nd2"><span class="nl"></span></div>';
    h += '<div class="track">' + ZONES.map(function (z, i) { return '<span class="z' + (i === you ? ' you' : '') + '"></span>'; }).join('') + '</div>';
    h += '<div class="labels">' + ZONES.map(function (z, i) { return '<span' + (i === you ? ' class="you"' : '') + '>' + esc(z.short) + '</span>'; }).join('') + '</div></div>';
    return h;
  }
  function setNeedle(nd, ratio, label) {
    var p = zonePos(ratio);
    nd.classList.toggle('left', p < 20); nd.classList.toggle('right', p > 80);
    $('.nl', nd).innerHTML = label;
    requestAnimationFrame(function () { nd.classList.add('on'); nd.style.left = p + '%'; });
  }

  function revealGap(card, n) {
    var r = R[n - 1];
    var h = meterHTML(n);
    if (n === 1) {
      h += '<div class="facts"><div class="fr o"><b>' + esc(times(RATIO.ep1, true)) + '</b><span>more views for episode 1 than for School Lunch</span></div>' +
           '<div class="fr o" id="allLine" style="opacity:0"><b>' + esc(times(RATIO.series, true)) + '</b><span>more views for all ' + r.sides.ricos.episodes + ' episodes together than for School Lunch</span></div>' +
           '<div class="fr"><b>Different channels</b><span>' + esc(r.sides.ricos.channel) + ' and ' + esc(r.sides.tideSpot.channel) + '</span></div></div>';
    } else {
      var cs = r.sides.stratos.concurrentStreams.split(', the most');
      var peak = cs.length === 2 ? 'The live jump had ' + esc(cs[0]) + '. That was the most' + esc(cs[1]) : 'The live jump had ' + esc(r.sides.stratos.concurrentStreams);
      h += '<div class="facts"><div class="fr o"><b>' + esc(times(RATIO.r3, true)) + '</b><span>more views for Stratos than for Confession</span></div>' +
           '<div class="fr"><b>Same channel</b><span>' + esc(poss(r.sides.stratos.channel)) + ' own YouTube channel</span></div></div>' +
           '<p class="small">' + peak + ' (' + ext(r.sides.stratos.concurrentUrl, r.sides.stratos.concurrentSource) + ').</p>';
    }
    card.insertAdjacentHTML('beforeend', h);
    var nd1 = $('#nd1', card);
    nd1.style.left = '0%';
    later(function () { setNeedle(nd1, callRatio(n), n === 1 ? 'Episode 1 <small>' + esc(times(RATIO.ep1)) + '</small>' : esc(times(RATIO.r3, true))); }, 350);
    if (n === 1) {
      nd1.classList.remove('first');
      schedule(card);
    } else {
      nd1.classList.remove('first', 'low');
    }
  }

  /* Round 1: the schedule. 22 real episodes on their real dates, each bar its real views. */
  function schedule(card) {
    var r = R[0], eps = r.episodes.slice(), tide = r.sides.tideSpot, ricos = r.sides.ricos;
    var blk = el('div', 'blk card sched');
    var max = Math.max.apply(null, eps.map(function (e) { return e.views; }));
    function d(p) { return new Date(+p.slice(0, 4), +p.slice(4, 6) - 1, +p.slice(6, 8)); }
    var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    function day(p) { var t = d(p); return t.getDate() + ' ' + MON[t.getMonth()] + ' ' + t.getFullYear(); }
    var bars = eps.map(function (e) {
      return '<i class="bar" style="height:' + Math.max(e.views / max * 100, 0.6).toFixed(2) + '%" title="' + esc(e.title + ', ' + day(e.published) + ': ' + fmt(e.views) + ' views') + '"></i>';
    }).join('');
    var chart = '<div class="chart" role="img" aria-label="Views for each of the ' + eps.length + ' Rico\'s Tacos episodes, in the order they came out, against the Tide commercial">' +
      '<div class="plot">' + bars + '<span class="tideline" style="bottom:' + (tide.views / max * 100).toFixed(2) + '%"></span></div>' +
      '<div class="axis"><span>' + esc(day(eps[0].published)) + '</span><span>' + esc(day(eps[eps.length - 1].published)) + '</span></div></div>';
    blk.innerHTML = '<h3>The schedule</h3>' +
      '<div class="big"><span id="tot">0</span><small>views across <span id="epn">0</span> episodes</small></div>' +
      chart +
      '<p class="small legend"><span class="dash" aria-hidden="true"></span>' + esc(tide.name) + ': ' + fmt(tide.views) + ' views</p>' +
      '<p class="small">Each bar is one Rico\'s Tacos episode, from ' + esc(ricos.runDates) + ', ' + esc(ricos.cadence) + '.</p>';
    blk.style.animationDelay = RM ? '0s' : '.5s';
    card.after(blk);
    var bars = $$('.bar', blk), tot = $('#tot', blk), epn = $('#epn', blk), sum = 0, step = 70;
    function finish() {
      bars.forEach(function (b) { b.classList.add('on'); });
      tot.textContent = fmt(ricos.totalViews); epn.textContent = eps.length;
      var nd2 = $('#nd2', card), all = $('#allLine', card);
      var nd1 = $('#nd1', card); if (nd1) nd1.classList.add('first');
      if (nd2 && !nd2.classList.contains('on')) setNeedle(nd2, RATIO.series, 'All ' + eps.length + ' episodes <small>' + esc(times(RATIO.series)) + '</small>');
      if (all) { all.style.transition = 'opacity .5s'; all.style.opacity = 1; }
    }
    if (RM) { finish(); return; }
    bars.forEach(function (b, i) {
      setTimeout(function () {
        b.classList.add('on'); sum += eps[i].views;
        tot.textContent = fmt(sum); epn.textContent = i + 1;
        if (i === bars.length - 1) finish();
      }, 900 + i * step);
    });
    setTimeout(finish, 900 + bars.length * step + 600);
  }

  function revealCast(card) {
    var ev = R[1].evidence, h = '<div class="facts narrow">';
    [0, 2].forEach(function (i) {
      var e = ev[i];
      h += '<div class="fr o"><b>' + esc(e.stat) + '</b><span>' + esc(e.label.charAt(0).toUpperCase() + e.label.slice(1)) + '.<small>' + ext(e.url, e.source) + '</small></span></div>';
    });
    card.insertAdjacentHTML('beforeend', h + '</div>');
  }

  function revealOwn(card) {
    var s = R[3].sides;
    card.insertAdjacentHTML('beforeend',
      '<p style="margin:.8rem 0 0">' + esc(s.yetiFilm.name.split(',')[0]) + ' has ' + fmt(s.yetiFilm.views) + ' views on ' + esc(poss(s.yetiFilm.channel)) + ' own channel. The award film has ' + fmt(s.pbrSponsor.views) + ' views on ' + esc(poss(s.pbrSponsor.channel)) + ' channel.</p>' +
      '<p class="small">That is ' + esc(times(RATIO.r4)) + ' more views, on different channels.</p>');
  }

  /* ---------- why ---------- */
  function whyBlock(n) {
    if (ST.n !== n || $('#whyblk')) return;
    var r = R[n - 1], deck = $('#deck');
    var blk = el('div', 'blk card why'); blk.id = 'whyblk'; blk.style.scrollMarginTop = '76px';
    var opts = WHY_ORDER[n].map(function (i) { return r.why.options[i]; });
    blk.innerHTML = '<h3>Why</h3><p class="qq">' + esc(r.why.question) + '</p>' +
      opts.map(function (o, i) { return '<button class="opt" type="button" data-i="' + i + '"><span class="txt">' + esc(o.text) + '</span></button>'; }).join('');
    deck.appendChild(blk);
    $$('.opt', blk).forEach(function (b) {
      b.addEventListener('click', function () { answer(n, opts, +b.getAttribute('data-i'), blk); });
    });
  }

  function answer(n, opts, i, blk) {
    if (ST.whys[n] != null && blk.classList.contains('done')) return;
    var r = R[n - 1], good = opts[i].side === r.winner;
    ST.whys[n] = good;
    blk.classList.add('done');
    $$('.opt', blk).forEach(function (b, j) {
      b.disabled = true;
      var isRight = opts[j].side === r.winner, mine = j === i;
      if (isRight) b.classList.add('right');
      if (mine) b.classList.add('mine');
      if (!isRight && !mine) b.classList.add('faded');
      var tag = isRight ? (mine ? 'Your answer' : 'The answer') : (mine ? 'Your answer' : '');
      if (tag) b.insertAdjacentHTML('afterbegin', '<span class="tag">' + tag + '</span>');
    });
    var res = el('p', 'res', good ? esc(EV.correctReason) : 'The marked answer is the reason.');
    $('.qq', blk).after(res);
    if (n === 1 || n === 3) {
      blk.insertAdjacentHTML('beforeend', '<div class="pull"><span class="mark" aria-hidden="true">&ldquo;</span><blockquote>' + esc(r.quote.text) + '</blockquote><p class="credit">' + esc(r.quote.cite) + '. ' + ext(r.quote.url, EV.founderLink) + '</p></div>');
    }
    later(function () { rungMove(n); listingBlock(n); }, 250);
  }

  /* ---------- the move each rung makes ---------- */
  function rungMove(n) {
    var deck = $('#deck'), blk;
    if (n === 2) {
      var s = R[1].sides;
      blk = el('div', 'blk card');
      blk.innerHTML = '<h3>The faces</h3><div class="faces">' +
        '<div class="col"><h4>Mayhem</h4><div class="strip">' + ['hq1', 'hq2', 'hq3'].map(function (x) { return '<div class="f"><img alt="" loading="lazy" src="' + still(s.mayhem.videoId, x) + '"></div>'; }).join('') + '</div>' +
          '<p class="cap">' + esc(s.mayhem.label) + '.</p></div>' +
        '<div class="col"><h4>Check First</h4><div class="strip">' +
          '<div class="f"><img alt="" loading="lazy" src="' + still(s.checkFirst.videoId, 'hq2') + '"><span>' + esc(s.checkFirst.campaignSpots[0]) + '</span></div>' +
          s.checkFirst.campaignSpots.slice(1).map(function (t) { return '<div class="f txt"><span>' + esc(t) + '<em>A different cast</em></span></div>'; }).join('') +
        '</div><p class="cap">A new cast in every spot. Each spot says "' + esc(s.checkFirst.repeatedLine) + '"</p></div>' +
      '</div>';
    } else if (n === 3) {
      blk = el('div', 'blk card dark');
      blk.innerHTML = '<h3>The name test</h3>' +
        '<p style="font-size:1.12rem;line-height:1.45;margin:.2rem 0 0;font-weight:500">&ldquo;' + esc(F.founderQuote.text) + '&rdquo;</p>' +
        '<p class="small">' + esc(EV.founderCredit) + '. ' + ext(F.founderQuote.url, EV.founderLink) + '</p>' +
        '<p style="margin:1rem 0 0">Red Bull made both films and put both on Red Bull\'s own channel. The jump received far more views.</p>' +
        '<p class="principle">' + esc(F.principles[1]) + '</p>';
    } else if (n === 4) {
      var y = R[3].sides;
      blk = el('div', 'blk card');
      blk.innerHTML = '<h3>Whose channel</h3><div class="chans">' +
        ['yetiFilm', 'pbrSponsor'].map(function (k) {
          var s = y[k];
          return '<div class="chan' + (ST.sel === k ? ' mine' : '') + '"><img alt="" loading="lazy" src="' + still(s.videoId, 'mqdefault') + '"><div><div class="cn">' + esc(poss(s.channel)) + ' channel</div><div class="ct">' + esc(S[k].title) + '</div><div class="cv">' + fmt(s.views) + ' views</div></div></div>';
        }).join('') + '</div>' +
        '<p class="small">' + esc(R[3].quote.text) + ' (' + ext(R[3].quote.url, R[3].quote.cite) + ')</p>';
    }
    if (blk) deck.appendChild(blk);
  }

  function listingBlock(n) {
    var deck = $('#deck');
    var blk = el('div', 'blk card listing-blk'); blk.style.scrollMarginTop = '76px';
    blk.innerHTML = '<h3>New line on your listing</h3><div class="guide">' + guideHTML({ earned: n, typing: n }) + '</div>' +
      '<p class="lesson">' + esc(R[n - 1].lesson) + '</p>' +
      '<div class="nextrow"><button class="btn" id="next" type="button">' + (n === 4 ? 'See your listing' : 'Next round') + ' ' + ICON.arrow + '</button></div>';
    deck.appendChild(blk);
    typeLine(blk, LINES[n - 1].v);
    var sg = $('#sideGuide');
    if (sg) { sg.innerHTML = guideHTML({ earned: n, typing: n }); typeLine(sg, LINES[n - 1].v); }
    $('#next').addEventListener('click', function () { if (n === 4 || nextUnplayed(n) == null) finale(); else startRound(nextUnplayed(n)); });
    later(function () { var w = $('#whyblk'); if (w && window.innerWidth < 900) w.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); }, 300);
  }
  function nextUnplayed(n) { return n < 4 ? n + 1 : null; }

  /* ================= FINALE ================= */
  function finale() {
    stopAll();
    ST.n = 5;
    hud('Your listing', 5);
    $$('#segs i').forEach(function (s, i) { s.className = ST.played.indexOf(i + 1) > -1 ? 'on' : ''; });
    var played = ST.played.slice().sort(), total = played.length * 2, score = 0;
    played.forEach(function (n) { if (ST.calls[n]) score++; if (ST.whys[n]) score++; });
    ST.score = score; ST.total = total;
    var rows = played.map(function (n) {
      var o = ORDER[n], r = R[n - 1];
      return '<div class="crow"><span class="pair">' + o.map(function (k) { return '<img alt=""' + (k === 'ricos' ? ' class="pb"' : '') + ' src="' + still(r.sides[k].videoId, 'mqdefault') + '">'; }).join('') + '</span>' +
        '<span class="nm">Round ' + n + ' · ' + esc(r.company) + '<small>' + esc(LINES[n - 1].k) + ': ' + esc(LINES[n - 1].v.toLowerCase()) + '</small></span>' +
        '<span class="marks"><span>' + (ST.calls[n] ? okMark() : ICON.ring) + 'Call</span><span>' + (ST.whys[n] ? okMark() : ICON.ring) + 'Why</span></span></div>';
    }).join('');
    app.innerHTML =
      '<section class="finale">' +
        '<p class="eyebrow">Your listing, ' + played.length + ' of 4 lines</p>' +
        '<h2 class="big">What the four rounds add up to</h2>' +
        '<div class="fin-grid">' +
          '<div class="fin-tv">' +
            '<label class="namefield"><span>Your company</span><input id="co" type="text" maxlength="40" autocomplete="organization" placeholder="Type your company name"><small>The name stays on this page. Nothing is sent anywhere.</small></label>' +
            '<div class="tv"><div class="tvscreen"><div class="guide dark" id="finGuide"></div></div><div class="tv-foot"><span><i class="led"></i>Your channel</span><span>Listing</span></div></div>' +
          '</div>' +
          '<div class="card calls"><p class="score">You got ' + score + ' of ' + total + ' answers right.</p><p class="sub">Each round showed one company two ways.</p>' + rows + '</div>' +
        '</div>' +
        '<p class="closing">' + esc(F.closingQuestion) + '</p>' +
        '<div class="cta" id="cta"><div class="in"><h2>' + esc(F.cta.heading) + '</h2><p>' + esc(F.cta.copy) + '</p>' +
          '<a class="btn" id="book" href="' + esc(F.cta.url) + '" target="_blank" rel="noopener">' + esc(F.cta.button) + ' ' + ICON.arrow + '</a></div></div>' +
        '<div class="after"><button class="btn ghost" id="share" type="button">Send this to a colleague</button><button class="btn ghost" id="again" type="button">Start over</button></div>' +
      '</section>';
    var fg = $('#finGuide');
    function paint() {
      var nm = ST.company.trim();
      fg.innerHTML = guideHTML({ earned: 4, name: nm || 'Your company' }).replace(/(\d) of 4 lines/, 'Listing');
      $$('.row', fg).forEach(function (row, i) { if (played.indexOf(i + 1) < 0) { row.classList.add('empty'); $('.v', row).textContent = 'Play round ' + (i + 1) + ' to fill this line'; } });
    }
    paint();
    var co = $('#co'); co.value = ST.company;
    co.addEventListener('input', function () { ST.company = co.value; paint(); });
    $('#share').addEventListener('click', share);
    $('#again').addEventListener('click', function () {
      ST = { n: 0, sel: null, chip: null, locked: false, calls: {}, whys: {}, played: [], revealed: [], company: '' };
      try { history.replaceState(null, '', location.pathname); } catch (e) {}
      landing();
    });
    window.scrollTo(0, 0);
  }

  /* ---------- share: no answers, no personal data ---------- */
  function share() {
    var url = location.origin + location.pathname + (ST.total === 8 ? '#vs=' + ST.score : '');
    var text = EV.title + ' Four companies, each shown two ways. I got ' + ST.score + ' of ' + ST.total + ' answers right. See how many you get right: ' + url;
    if (navigator.share) {
      navigator.share({ title: EV.title, text: text }).catch(function (e) { if (e && e.name === 'AbortError') return; copy(text); });
    } else copy(text);
  }
  function copy(text) {
    function fallback() {
      var ta = el('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      ta.remove(); toast(ok ? 'Copied. Paste it into a message.' : text);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { toast('Copied. Paste it into a message.'); }, fallback);
    else fallback();
  }
  var tt;
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(function () { t.classList.remove('on'); }, 2600); }

  /* ---------- sources sheet: built only when opened, only for rounds already revealed ---------- */
  function sources() {
    var h = '<p>View counts and runtimes are as shown on YouTube on ' + esc(F.readDate) + '. Each film opens on YouTube from its link below.</p>';
    h += '<h3>The quote on the first screen</h3><p>' + esc(EV.founderCredit) + '. ' + ext(F.founderQuote.url, EV.founderLink) + '</p>';
    var done = ST.revealed.slice().sort();
    if (!done.length) h += '<p>Sources for each round appear here after you make your pick in that round.</p>';
    done.forEach(function (n) {
      var r = R[n - 1];
      h += '<h3>Round ' + n + ': ' + esc(r.company) + '</h3>';
      ORDER[n].forEach(function (k) {
        var s = r.sides[k];
        h += '<p><b>' + esc(s.videoLabel) + '</b>. On ' + esc(poss(s.channel)) + ' YouTube channel. ' + fmt(s.views) + ' views, runtime ' + mmss(s.seconds) + (s.published ? ', posted ' + esc(s.published) : '') + '. ' + ext(ytLink(s.videoId), 'Open on YouTube') + '</p>';
      });
      if (n === 1) {
        var ri = r.sides.ricos;
        h += '<p>Rico\'s Tacos has ' + ri.episodes + ' episodes, ' + esc(ri.runDates) + ', ' + esc(ri.cadence) + ', with ' + fmt(ri.totalViews) + ' views in all. ' + esc(r.episodeNote) + ' ' + esc(ri.channelOwner) + '.</p>';
      }
      if (n === 2) {
        r.evidence.forEach(function (e) { h += '<p>' + esc(e.stat) + ' ' + esc(e.label) + '. ' + esc(e.source) + '. ' + ext(e.url, 'Read the source') + '</p>'; });
        h += '<p>' + esc(r.evidenceScope) + '</p><p>' + esc(r.sides.checkFirst.evidence) + '</p>';
      }
      if (n === 3) {
        var st = r.sides.stratos, cf = r.sides.confession;
        h += '<p>The live jump had ' + esc(st.concurrentStreams) + '. ' + esc(st.concurrentSource) + '. ' + ext(st.concurrentUrl, 'Read the source') + '</p>';
        h += '<p>Red Bull has made cartoon commercials since ' + cf.cartoonsSince + ' (' + esc(cf.cartoonsSource) + ').</p>';
      }
      if (n === 4) h += '<p>' + esc(r.sides.pbrSponsor.sponsorNote) + '.</p>';
      if (r.quote && (n === 1 || n === 3)) h += '<p>Quote: ' + esc(r.quote.cite) + '. ' + ext(r.quote.url, EV.founderLink) + '</p>';
      if (n === 4) h += '<p>' + esc(r.quote.cite) + '. ' + ext(r.quote.url, 'Open on YouTube') + '</p>';
    });
    $('#sheetBody').innerHTML = h;
    var sh = $('#sheet'); sh.hidden = false;
    var c = $('.sheet-head [data-close]', sh); if (c) c.focus();
  }
  $('#srcBtn').addEventListener('click', sources);
  $$('#sheet [data-close]').forEach(function (b) { b.addEventListener('click', function () { $('#sheet').hidden = true; }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') $('#sheet').hidden = true; });

  /* ---------- start ---------- */
  var m = location.hash.match(/^#r([1-4])$/);
  if (m) startRound(+m[1]); else landing();
})();
