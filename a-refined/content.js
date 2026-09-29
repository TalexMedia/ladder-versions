/* Version A: every word this page shows, as plain data. Every figure comes from window.FACTS
   (../shared/facts.js, read 29 September 2026) and every ratio is computed here at load time.
   Load order: ../shared/facts.js, then this file, then app.js. */
(function(){
  'use strict';
  var F = window.FACTS, E = F.evansCopyDecisions;
  var R1 = F.rounds[0], R2 = F.rounds[1], R3 = F.rounds[2], R4 = F.rounds[3];

  function fmt(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  /* "about 7", "about 45", "about 195", "nearly 100". Never typed, always computed. */
  function times(a, b){
    var r = a / b, round10 = Math.ceil(r / 10) * 10;
    if (r >= 10 && round10 - r < 1) return { value:r, text:'nearly ' + round10, n:round10 };
    return { value:r, text:'about ' + Math.round(r), n:Math.round(r) };
  }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
  function yt(id){ return 'https://www.youtube.com/watch?v=' + id; }
  function link(href, text){ return '<a href="' + href + '" target="_blank" rel="noopener">' + text + '</a>'; }

  var s1 = R1.sides, s2 = R2.sides, s3 = R3.sides, s4 = R4.sides;
  var ep1 = times(s1.ricos.firstEpisodeViews, s1.tideSpot.views);
  var all22 = times(s1.ricos.totalViews, s1.tideSpot.views);
  var jump = times(s3.stratos.views, s3.confession.views);
  var yeti = times(s4.yetiFilm.views, s4.pbrSponsor.views);
  var viewsLine = 'View counts from YouTube, ' + F.readDate + '.';

  window.CONTENT = {
    fmt:fmt,
    ratios:{ ep1:ep1, all22:all22, jump:jump, yeti:yeti },
    rounds:[
      {
        company:R1.company,
        headline:'P&G made both of these films.',
        question:'Which one got more views?',
        winnerLine:'Rico\'s Tacos got more views.',
        mark:'More views',
        lens:[F.principles[0]],
        more:'Rico\'s Tacos',
        sides:{
          ricos:{ kind:'Series', cap:'Episode 1, on MinivelaTV', name:'Rico\'s Tacos', desc:'A scripted comedy series about a taco stand, made with Minivela and Albertsons Media Collective.',
                  fig:[fmt(s1.ricos.firstEpisodeViews), 'views on episode 1'] },
          tideSpot:{ kind:'Commercial', cap:'On Tide\'s channel', name:'School Lunch', desc:'A single Tide commercial.',
                  fig:[fmt(s1.tideSpot.views), 'views'] }
        },
        viz:{
          type:'episodes',
          ratios:[
            { big:cap(ep1.text) + ' times the views', same:'on different channels', small:'Episode 1 of Rico\'s Tacos compared with School Lunch.' },
            { big:cap(all22.text) + ' times the views', same:'on different channels', small:'All ' + s1.ricos.episodes + ' episodes together, with ' + fmt(s1.ricos.totalViews) + ' views.' }
          ],
          chartTitle:'Views on every Rico\'s Tacos episode',
          lineLabel:'School Lunch, ' + fmt(s1.tideSpot.views) + ' views'
        },
        sources:[
          link(yt(s1.ricos.videoId), 'Rico\'s Tacos') + ' is on MinivelaTV, the channel of Minivela, which makes the series with P&G and Albertsons Media Collective. The ' + s1.ricos.episodes + ' episodes ran from ' + s1.ricos.runDates + ', ' + s1.ricos.cadence + '. Two episodes are numbered 16. Episodes 9 and 10 have far fewer views than the rest.',
          link(yt(s1.tideSpot.videoId), 'School Lunch') + ' is on Tide\'s own channel, published ' + s1.tideSpot.published + '.',
          viewsLine
        ]
      },
      {
        company:R2.company,
        headline:'Allstate made both of these commercials.',
        question:'Which campaign ranked first for memorable ads in the mascot research?',
        winnerLine:'Mayhem ranked first for memorable ads among insurance mascots.',
        mark:'Remembered',
        lens:[F.principles[0], F.principles[1]],
        more:'the mascot rankings',
        sides:{
          mayhem:{ kind:'Commercial', cap:'On Allstate\'s channel', name:'Mayhem: Action Hero', desc:'Allstate\'s character Mayhem, played by Dean Winters since 2010.',
                  fig:[R2.evidence[0].stat, R2.evidence[0].label.toLowerCase()] },
          checkFirst:{ kind:'Commercial', cap:'On Allstate\'s channel', name:'Check First: Swim Meet', desc:'One of Allstate\'s Check First commercials. Each one has a new cast and the same line: "' + s2.checkFirst.repeatedLine + '"',
                  fig:null, note:'A new cast in every commercial' }
        },
        viz:{
          type:'mascot',
          tiles:[
            { stat:R2.evidence[1].stat, label:'Mayhem\'s likeability, above the norm', src:'MarketCast' },
            { stat:R2.evidence[2].stat, label:'of US adults surveyed picked Mayhem as the mascot they would most like to grab a beer with. Jake from State Farm came first at 34%.', src:'Insurity' }
          ],
          scope:'Both studies compare Mayhem with other insurers\' mascots.',
          spots:s2.checkFirst.campaignSpots,
          spotsLine:'Allstate\'s YouTube channel has three Check First commercials, each with a different cast:'
        },
        sources:[
          link(R2.evidence[0].url, 'MarketCast') + ' measured insurance mascots from January 2024 to February 2025. MarTech Edge reported the results on 1 April 2025.',
          link(R2.evidence[2].url, 'Insurity') + ' ran an online survey of more than 1,000 US adults in January 2024. Business Wire published the results on 7 March 2024.',
          'Both studies rank Mayhem against other insurers\' mascots, not against Check First.',
          'Allstate\'s YouTube channel has ' + s2.checkFirst.campaignSpots.length + ' Check First commercials: ' + s2.checkFirst.campaignSpots.join(', ').replace(/, ([^,]*)$/, ' and $1') + '. Each one has a different cast, and each one says "' + s2.checkFirst.repeatedLine + '" ' + link(yt(s2.checkFirst.videoId), 'Watch Swim Meet on YouTube') + '.'
        ]
      },
      {
        company:R3.company,
        headline:'Red Bull made both of these films.',
        question:'Which one got more views?',
        winnerLine:'The jump got more views.',
        mark:'More views',
        lens:[F.principles[2], F.principles[1]],
        more:'Red Bull Stratos',
        sides:{
          stratos:{ kind:'Live event', cap:'Highlights film, on Red Bull\'s channel', name:'Stratos', desc:'Felix Baumgartner\'s jump from the edge of space, streamed live and free on YouTube. This film shows the highlights.',
                  fig:[fmt(s3.stratos.views), 'views'] },
          confession:{ kind:'Commercial', cap:'On Red Bull\'s channel', name:'Confession', desc:'A Gives You Wiiings cartoon. Red Bull has made cartoon commercials like this since ' + s3.confession.cartoonsSince + '.',
                  fig:[fmt(s3.confession.views), 'views'] }
        },
        viz:{
          type:'units',
          ratios:[ { big:cap(jump.text) + ' times the views', same:'on the same channel', small:'Both films are on Red Bull\'s own channel.' } ],
          units:jump.n,
          unitLine:'Each square is ' + fmt(s3.confession.views) + ' views, the cartoon\'s total. The jump fills ' + jump.text + ' squares.',
          live:'At its peak, more than 8 million streams of the live jump ran at once. That was the most of any livestream on YouTube at the time.'
        },
        sources:[
          link(yt(s3.stratos.videoId), 'The Stratos highlights film') + ' is on Red Bull\'s own channel, published ' + s3.stratos.published + '. ' + link(s3.stratos.concurrentUrl, 'YouTube\'s official blog') + ' reported the live peak on 14 October 2012.',
          link(yt(s3.confession.videoId), 'Confession') + ' is on Red Bull\'s own channel, published ' + s3.confession.published + '. Red Bull\'s cartoon commercials date from ' + s3.confession.cartoonsSince + ', according to the Kunstmeile Krems exhibition "Gives You Wings. 30 Years of Cartoons by Red Bull", 2017.',
          viewsLine
        ]
      },
      {
        company:R4.company,
        headline:'YETI\'s name is on both of these films.',
        question:'Which film drew viewers to YETI\'s own channel?',
        winnerLine:'A Thousand Casts drew viewers to YETI\'s own channel.',
        mark:'On YETI\'s channel',
        lens:[F.principles[2], F.principles[1]],
        more:'YETI\'s PBR award',
        sides:{
          yetiFilm:{ kind:'Documentary', cap:'A YETI Presents documentary', name:'A Thousand Casts', desc:'A YETI Presents film about a fly fishing trip to Bhutan.',
                  fig:[fmt(s4.yetiFilm.views), 'views on YETI\'s channel'] },
          pbrSponsor:{ kind:'Sponsorship', cap:'A PBR award film', name:'The PBR YETI Bucking Bull Champion', desc:'A Professional Bull Riders film about an award that carries YETI\'s name.',
                  fig:[fmt(s4.pbrSponsor.views), 'views on PBR\'s channel'] }
        },
        viz:{
          type:'channels',
          ratios:[ { big:cap(yeti.text) + ' times the views', same:'on different channels', small:'A Thousand Casts compared with the PBR film about the YETI award.' } ],
          rows:[
            { k:'yetiFilm', who:'YETI\'s channel', what:'A Thousand Casts. YETI Presents has run since ' + s4.yetiFilm.seriesSince + '.', views:s4.yetiFilm.views },
            { k:'pbrSponsor', who:'PBR\'s channel', what:'The YETI award film. YETI has sponsored PBR since ' + s4.pbrSponsor.sponsorSince + '.', views:s4.pbrSponsor.views }
          ]
        },
        sources:[
          link(yt(s4.yetiFilm.videoId), 'A Thousand Casts') + ' is on YETI\'s own channel, published ' + s4.yetiFilm.published + '.',
          link(yt(s4.pbrSponsor.videoId), 'The award film') + ' is on the channel of PBR (Professional Bull Riders), published ' + s4.pbrSponsor.published + '. YETI first sponsored PBR in 2013. The deal ended and started again in 2017, as Front Office Sports reported in October 2019.',
          viewsLine
        ]
      }
    ],
    copy:{
      brand:F.brand,
      eyebrow:'A four-round game',
      title:E.title,
      lead:E.lead,
      notice:E.noticeAboutNumbers,
      start:'Start round one',
      resume:'Pick up at round {n}',
      restart:'Start over',
      vsLine:'A colleague sent you this after scoring {n} of 8. Start round one to see how you do.',
      roundsLabel:'Four rounds, four companies',
      gate:'"' + F.founderQuote.text + '"',
      gateCite:E.founderCredit,
      gateLink:E.founderLink,
      gateUrl:F.founderQuote.url,
      roundLabel:'Round {n} of {total}',
      steps:{ pick:'Pick', reveal:'The result', why:'Why', whyreveal:'The reason' },
      pickThis:'Pick this one',
      picked:'Your pick',
      lock:'Confirm my pick',
      play:'Play {name}, muted',
      pause:'Pause',
      resume2:'Play',
      close:'Close film',
      muted:'Muted',
      correct:E.correctPick,
      notThisTime:'Not this time.',
      sources:'Sources',
      whyBtn:'Find out why',
      choose:'Confirm my answer',
      whyRight:E.correctReason,
      whyWrong:'Not this one. The reason is marked below.',
      aboutSide:'About {name}',
      winnerFact:'The reason',
      yourAnswer:'Your answer',
      rungLabel:'Rung {n} of 4: {rung}',
      principles:'Talex principles',
      readMore:E.readMore,
      nextRound:'Go to round {n}',
      seeResult:'See my result',
      scoreLabel:'Score',
      resultEyebrow:'Your score',
      resultHeading:'{n} of {total}',
      resultNote:'One point for each correct pick and one for each correct reason, across four rounds.',
      synthesisHeading:'Put the four rounds together',
      ladderNote:'The four rungs, from the bottom up',
      closing:F.closingQuestion,
      cta:F.cta,
      share:'Send this to a colleague',
      shared:'Link copied',
      shareText:'Which One Was Better? Four companies each made video two ways. I scored {n} of 8. Try it here:',
      startOver:'Start over'
    }
  };
})();
