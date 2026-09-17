(function() {
  "use strict";

  var CATEGORY_FILES = [
    { id: "girls-singles", file: "girls-singles.json", name: "Girls Singles" },
    { id: "womens-singles", file: "womens-singles.json", name: "Women's Singles" },
    { id: "womens-doubles", file: "womens-doubles.json", name: "Women's Doubles" },
    { id: "boys-singles", file: "boys-singles.json", name: "Boys Singles" },
    { id: "boys-doubles", file: "boys-doubles.json", name: "Boys' Doubles" },
    { id: "mens-singles", file: "mens-singles.json", name: "Men's Singles" },
    { id: "mens-doubles", file: "mens-doubles.json", name: "Men's Doubles" }
  ];

  var GEN_SINGLES = [
    "Toss decides who serves first and choice of ends.",
    "Serves are underarm and diagonal, struck below waist height; server uses the right court on an even score, left on odd.",
    "Full singles court is in play; a shuttle on the line is in.",
    "A let replays the rally without penalty for accidental disturbances (shuttle caught in net, early serve, shuttle breaking apart).",
    "A rally is lost immediately for a shuttle landing out, failing to clear the net, touching a player or their clothing, a double hit, or obstructing an opponent.",
    "Umpire and organizer calls on faults or lets are final."
  ];

  var GEN_DOUBLES = [
    "Toss decides which team serves first and choice of ends.",
    "One serve per turn (no second serve); serves are underarm, diagonal, and below waist height.",
    "The full doubles court, including the wider sidelines and short service line, is in play.",
    "Serving side's service court follows their own score (even = right, odd = left); the receiving pair may stand in either box but can't swap until their side serves.",
    "A let replays the rally without penalty for accidental disturbances.",
    "A rally is lost immediately for a shuttle landing out, failing to clear the net, touching a player, a double hit, obstruction, or both partners touching the shuttle in succession.",
    "Umpire and organizer calls on faults or lets are final."
  ];

  var catDataMap = {};
  var activeCatId = "girls-singles";
  var lastSyncDate = null;

  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* Compute winner and scores for a match */
  function getMatchOutcome(m) {
    var hasScores = false;
    var sA = null, sB = null;
    var scoreLabelA = "", scoreLabelB = "";
    var winnerSide = null;

    if (m.scoreA !== null && m.scoreA !== undefined && m.scoreB !== null && m.scoreB !== undefined) {
      sA = parseInt(m.scoreA, 10);
      sB = parseInt(m.scoreB, 10);
      if (!isNaN(sA) && !isNaN(sB)) {
        hasScores = true;
        scoreLabelA = String(sA);
        scoreLabelB = String(sB);
        if (sA > sB) winnerSide = "A";
        else if (sB > sA) winnerSide = "B";
      }
    } else if (Array.isArray(m.sets) && m.sets.length > 0) {
      hasScores = true;
      var winsA = 0, winsB = 0;
      var partsA = [], partsB = [];
      m.sets.forEach(function(set) {
        if (Array.isArray(set) && set.length >= 2) {
          var pA = parseInt(set[0], 10) || 0;
          var pB = parseInt(set[1], 10) || 0;
          partsA.push(pA);
          partsB.push(pB);
          if (pA > pB) winsA++;
          else if (pB > pA) winsB++;
        }
      });
      scoreLabelA = partsA.join(", ");
      scoreLabelB = partsB.join(", ");
      if (winsA > winsB) winnerSide = "A";
      else if (winsB > winsA) winnerSide = "B";
    }

    if (m.winner) {
      winnerSide = m.winner.toUpperCase();
    }

    return {
      hasScores: hasScores || !!m.winner,
      sA: sA,
      sB: sB,
      scoreLabelA: scoreLabelA,
      scoreLabelB: scoreLabelB,
      winnerSide: winnerSide
    };
  }

  /* Resolve placeholder references (e.g. "SF1", "SF1:loser", "GA", "BD:1") */
  function resolveParticipant(sideVal, ctx) {
    if (!sideVal) return { name: "TBD", isResolved: false, isPending: true };

    if (typeof sideVal === "object") {
      if (sideVal.ref) {
        var wObj = sideVal.loser ? ctx.losers[sideVal.ref] : ctx.winners[sideVal.ref];
        if (wObj) return { name: wObj, isResolved: true, isPending: false };
        return { name: (sideVal.loser ? "Loser " : "Winner ") + sideVal.ref, isResolved: false, isPending: true };
      }
      if (sideVal.group) {
        var gKey = sideVal.group + (sideVal.rank ? ":" + sideVal.rank : "");
        var gWinner = ctx.groupRanks[gKey] || ctx.groupRanks[sideVal.group];
        if (gWinner) return { name: gWinner, isResolved: true, isPending: false };
        return { name: "Rank " + (sideVal.rank || "1") + " (" + sideVal.group + ")", isResolved: false, isPending: true };
      }
      if (sideVal.name) return { name: sideVal.name, isResolved: true, isPending: false };
    }

    var str = String(sideVal).trim();

    // Check for "MATCH_ID:loser" or "MATCH_ID-loser"
    if (str.indexOf(":loser") !== -1 || str.indexOf("-loser") !== -1) {
      var matchIdL = str.replace(":loser", "").replace("-loser", "");
      if (ctx.losers[matchIdL]) {
        return { name: ctx.losers[matchIdL], isResolved: true, isPending: false };
      }
      return { name: "Loser " + matchIdL, isResolved: false, isPending: true };
    }

    // Check if it's a match ID reference (e.g. "SF1", "QF2", "R1-M1")
    if (ctx.allMatchIds[str]) {
      if (ctx.winners[str]) {
        return { name: ctx.winners[str], isResolved: true, isPending: false };
      }
      return { name: "Winner " + str, isResolved: false, isPending: true };
    }

    // Check if it's a group reference like "GA", "GB", "BD:1", "BD:2"
    if (ctx.groupRanks[str]) {
      return { name: ctx.groupRanks[str], isResolved: true, isPending: false };
    }
    if (str.indexOf(":") !== -1 && ctx.allGroupIds[str.split(":")[0]]) {
      var parts = str.split(":");
      return { name: "Rank " + parts[1] + " (" + parts[0] + ")", isResolved: false, isPending: true };
    }
    if (ctx.allGroupIds[str]) {
      return { name: "Winner " + str, isResolved: false, isPending: true };
    }

    // Default: it's an actual fixed player or team name!
    return { name: str, isResolved: true, isPending: false };
  }

  /* Compute standings for round robin groups */
  function computeStandings(cat, ctx) {
    var standings = {};
    if (!cat.groups) return standings;

    cat.groups.forEach(function(g) {
      var stats = {};
      g.teams.forEach(function(t) {
        stats[t] = { name: t, p: 0, w: 0, l: 0, pf: 0, pa: 0, diff: 0 };
      });

      g.matches.forEach(function(m) {
        var outcome = getMatchOutcome(m);
        if (outcome.hasScores && outcome.winnerSide) {
          var teamA = m.a;
          var teamB = m.b;
          if (stats[teamA] && stats[teamB]) {
            stats[teamA].p++;
            stats[teamB].p++;
            var sA = outcome.sA !== null ? outcome.sA : 0;
            var sB = outcome.sB !== null ? outcome.sB : 0;
            stats[teamA].pf += sA;
            stats[teamA].pa += sB;
            stats[teamB].pf += sB;
            stats[teamB].pa += sA;

            if (outcome.winnerSide === "A") {
              stats[teamA].w++;
              stats[teamB].l++;
            } else if (outcome.winnerSide === "B") {
              stats[teamB].w++;
              stats[teamA].l++;
            }
          }
        }
      });

      var list = g.teams.map(function(t) {
        var s = stats[t];
        s.diff = s.pf - s.pa;
        return s;
      });

      list.sort(function(x, y) {
        return (y.w - x.w) || (y.diff - x.diff) || (y.pf - x.pf);
      });

      standings[g.id] = list;

      list.forEach(function(item, idx) {
        var rankNum = idx + 1;
        if (item.w > 0 || item.p > 0) {
          ctx.groupRanks[g.id + ":" + rankNum] = item.name;
          if (rankNum === 1) ctx.groupRanks[g.id] = item.name;
        }
      });
    });

    return standings;
  }

  /* Compute full tournament state: winners, losers, advanced slots */
  function computeTournamentContext(cat) {
    var ctx = {
      winners: {},
      losers: {},
      groupRanks: {},
      allMatchIds: {},
      allGroupIds: {}
    };

    if (cat.groups) {
      cat.groups.forEach(function(g) {
        ctx.allGroupIds[g.id] = true;
        g.matches.forEach(function(m) { ctx.allMatchIds[m.id] = true; });
      });
      computeStandings(cat, ctx);
    }

    if (cat.rounds) {
      cat.rounds.forEach(function(round) {
        round.matches.forEach(function(m) { ctx.allMatchIds[m.id] = true; });
      });

      cat.rounds.forEach(function(round) {
        round.matches.forEach(function(m) {
          var a = resolveParticipant(m.a, ctx);
          var b = resolveParticipant(m.b, ctx);
          var outcome = getMatchOutcome(m);

          if (outcome.winnerSide === "A" && a.isResolved) {
            ctx.winners[m.id] = a.name;
            ctx.losers[m.id] = b.name;
          } else if (outcome.winnerSide === "B" && b.isResolved) {
            ctx.winners[m.id] = b.name;
            ctx.losers[m.id] = a.name;
          }
        });
      });
    }

    return ctx;
  }

  /* Render a knockout match card */
  function renderMatchCard(m, ctx) {
    var a = resolveParticipant(m.a, ctx);
    var b = resolveParticipant(m.b, ctx);
    var outcome = getMatchOutcome(m);

    var isWinA = outcome.winnerSide === "A";
    var isWinB = outcome.winnerSide === "B";

    var html = '<div class="match" id="match-' + esc(m.id) + '">';
    html += '<div class="m-id"><span>' + esc(m.id) + '</span>';
    if (outcome.winnerSide) {
      html += '<span style="color:var(--win);font-size:10.5px;">Completed</span>';
    }
    html += '</div>';

    // Side A
    var classA = "side" + (isWinA ? " win" : "") + (a.isPending ? " placeholder" : "");
    html += '<div class="' + classA + '">';
    html += '<div class="nm-wrap"><span class="nm">' + esc(a.name) + '</span></div>';
    if (outcome.scoreLabelA) {
      html += '<span class="score-tag">' + esc(outcome.scoreLabelA) + '</span>';
    }
    html += '<span class="tick"></span>';
    html += '</div>';

    // Side B
    var classB = "side" + (isWinB ? " win" : "") + (b.isPending ? " placeholder" : "");
    html += '<div class="' + classB + '">';
    html += '<div class="nm-wrap"><span class="nm">' + esc(b.name) + '</span></div>';
    if (outcome.scoreLabelB) {
      html += '<span class="score-tag">' + esc(outcome.scoreLabelB) + '</span>';
    }
    html += '<span class="tick"></span>';
    html += '</div>';

    if (m.byeNote) {
      html += '<div class="bye-note">' + esc(m.byeNote) + '</div>';
    }

    html += '</div>';
    return html;
  }

  /* Render rules accordion */
  function renderRulesHTML(id, formatList, generalList) {
    var f = (formatList || []).map(function(x) { return "<li>" + esc(x) + "</li>"; }).join("");
    var g = (generalList || []).map(function(x) { return "<li>" + esc(x) + "</li>"; }).join("");
    return '<details class="rules" id="rules-' + esc(id) + '"><summary>Format &amp; rules</summary><div class="rulebody">' +
      '<div style="font-weight:600;font-size:12.5px;color:var(--muted);margin:8px 0 4px;text-transform:uppercase;letter-spacing:.05em;">Format &amp; scoring</div><ul>' + f + '</ul>' +
      '<div style="font-weight:600;font-size:12.5px;color:var(--muted);margin:10px 0 4px;text-transform:uppercase;letter-spacing:.05em;">General play</div><ul>' + g + '</ul>' +
      '</div></details>';
  }

  /* Render podium champion strip */
  function renderChampionLine(cat, ctx) {
    if (!cat.rounds || cat.rounds.length === 0) return "";
    var lastRound = cat.rounds[cat.rounds.length - 1];
    var finalMatch = lastRound.matches.filter(function(m) { return /FINAL/i.test(m.id) && !/3RD/i.test(m.id); })[0];
    var thirdMatch = lastRound.matches.filter(function(m) { return /3RD/i.test(m.id); })[0];

    var parts = [];
    if (finalMatch) {
      var w = ctx.winners[finalMatch.id];
      var l = ctx.losers[finalMatch.id];
      parts.push('<span><b>Champion:</b> ' + esc(w || "TBD") + '</span>');
      parts.push('<span><b>Runner-up:</b> ' + esc(l || "TBD") + '</span>');
    }
    if (thirdMatch) {
      var w3 = ctx.winners[thirdMatch.id];
      parts.push('<span><b>3rd place:</b> ' + esc(w3 || "TBD") + '</span>');
    }
    return parts.length ? '<div class="champ-strip">' + parts.join("") + '</div>' : "";
  }

  /* Render a single category view */
  function renderCategoryView(cat) {
    var host = document.getElementById("cat-" + cat.id);
    if (!host) return;

    var ctx = computeTournamentContext(cat);
    var body = host.querySelector(".cat-body");

    var html = "";

    if (cat.type === "roundrobin") {
      var standings = computeStandings(cat, ctx);
      html += '<div class="grp-grid">';
      cat.groups.forEach(function(g) {
        html += '<div class="grp-card"><h3>' + esc(g.name) + ' — teams</h3>';
        g.teams.forEach(function(t, i) {
          html += '<div class="team-row"><span class="n">' + (i + 1) + '</span><span>' + esc(t) + '</span></div>';
        });

        html += '<div class="rr-matches">';
        g.matches.forEach(function(m) {
          var outcome = getMatchOutcome(m);
          var isWinA = outcome.winnerSide === "A";
          var isWinB = outcome.winnerSide === "B";

          html += '<div class="rr-match">' +
            '<span class="rr-id">' + esc(m.id.replace(g.id + "-", "")) + '</span>' +
            '<span class="rr-side' + (isWinA ? " win" : "") + '">' + esc(m.a) + '</span>' +
            (outcome.scoreLabelA ? '<span class="score-tag">' + esc(outcome.scoreLabelA) + '</span>' : '') +
            '<span class="vs">v</span>' +
            (outcome.scoreLabelB ? '<span class="score-tag">' + esc(outcome.scoreLabelB) + '</span>' : '') +
            '<span class="rr-side' + (isWinB ? " win" : "") + '">' + esc(m.b) + '</span>' +
            '</div>';
        });
        html += '</div>';

        var st = standings[g.id] || [];
        html += '<div style="padding:0 14px 14px;"><table class="standings"><tr><th>Team</th><th>P</th><th>W</th><th>L</th><th>Diff</th></tr>';
        st.forEach(function(s, i) {
          var isTop = (i === 0 && s.w > 0);
          html += '<tr class="' + (isTop ? "rank1" : "") + '"><td>' + esc(s.name) + '</td><td>' + s.p + '</td><td>' + s.w + '</td><td>' + s.l + '</td><td>' + (s.diff > 0 ? "+" : "") + s.diff + '</td></tr>';
        });
        html += '</table></div></div>';
      });
      html += '</div>';

      if (cat.rounds && cat.rounds.length > 0) {
        html += '<div style="margin-top:22px;" class="round-scroll">';
        cat.rounds.forEach(function(round) {
          html += '<div class="round-col"><div class="round-title">' + esc(round.name) + '</div><div class="round-body">';
          round.matches.forEach(function(m) { html += renderMatchCard(m, ctx); });
          html += '</div></div>';
        });
        html += '</div>';
      }
    } else {
      // Knockout
      html += '<div class="round-scroll">';
      cat.rounds.forEach(function(round) {
        html += '<div class="round-col"><div class="round-title">' + esc(round.name) + '</div><div class="round-body">';
        round.matches.forEach(function(m) { html += renderMatchCard(m, ctx); });
        html += '</div></div>';
      });
      html += '</div>';
    }

    body.innerHTML = html;

    var champHost = host.querySelector(".champ-host");
    if (champHost) {
      champHost.innerHTML = renderChampionLine(cat, ctx);
    }
  }

  /* Fetch all 7 category files with cache busting */
  function fetchAllCategories(silent) {
    var promises = CATEGORY_FILES.map(function(item) {
      // Try ./data/ then data/ with cache-busting timestamp
      var url = "./data/" + item.file + "?_t=" + Date.now();
      return fetch(url, { cache: "no-store" })
        .then(function(res) {
          if (!res.ok) throw new Error("Could not load " + item.file);
          return res.json();
        })
        .then(function(json) {
          catDataMap[item.id] = json;
        })
        .catch(function(err) {
          console.warn("Failed fetching " + url + ", fallback to /data/", err);
          return fetch("data/" + item.file + "?_t=" + Date.now(), { cache: "no-store" })
            .then(function(r) { return r.json(); })
            .then(function(j) { catDataMap[item.id] = j; })
            .catch(function(e) { console.error("Final fail for " + item.file, e); });
        });
    });

    return Promise.all(promises).then(function() {
      lastSyncDate = new Date();
      var timeEl = document.getElementById("sync-time");
      if (timeEl) {
        timeEl.textContent = "Synced: " + lastSyncDate.toLocaleTimeString();
      }
      CATEGORY_FILES.forEach(function(item) {
        if (catDataMap[item.id]) {
          renderCategoryView(catDataMap[item.id]);
        }
      });
    });
  }

  function showTab(id) {
    activeCatId = id;
    CATEGORY_FILES.forEach(function(item) {
      var catEl = document.getElementById("cat-" + item.id);
      var tabEl = document.getElementById("tabbtn-" + item.id);
      if (catEl) catEl.classList.toggle("active", item.id === id);
      if (tabEl) tabEl.classList.toggle("active", item.id === id);
    });
  }

  /* Initialize DOM */
  function initDOM() {
    var tabsHost = document.getElementById("tabs");
    var catHost = document.getElementById("catHost");

    tabsHost.innerHTML = "";
    catHost.innerHTML = "";

    CATEGORY_FILES.forEach(function(item, i) {
      // Tab button
      var tab = document.createElement("button");
      tab.className = "tab" + (item.id === activeCatId ? " active" : "");
      tab.textContent = item.name;
      tab.id = "tabbtn-" + item.id;
      tab.onclick = function() { showTab(item.id); };
      tabsHost.appendChild(tab);

      // Category Section
      var section = document.createElement("div");
      section.className = "cat" + (item.id === activeCatId ? " active" : "");
      section.id = "cat-" + item.id;
      section.innerHTML =
        '<div class="cat-head">' +
          '<div><h2 id="title-' + esc(item.id) + '">' + esc(item.name) + '</h2>' +
          '<p class="cat-sub" id="sub-' + esc(item.id) + '">Loading data...</p></div>' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span class="chip" id="chip-' + esc(item.id) + '">Loading...</span>' +
          '</div>' +
        '</div>' +
        '<div class="rules-host" id="rules-host-' + esc(item.id) + '"></div>' +
        '<div class="cat-body" style="padding-top:14px;">Loading fixtures...</div>' +
        '<div class="champ-host"></div>';
      catHost.appendChild(section);
    });

    // Fetch initial data
    fetchAllCategories().then(function() {
      CATEGORY_FILES.forEach(function(item) {
        var cat = catDataMap[item.id];
        if (cat) {
          var titleEl = document.getElementById("title-" + item.id);
          var subEl = document.getElementById("sub-" + item.id);
          var chipEl = document.getElementById("chip-" + item.id);
          var rulesEl = document.getElementById("rules-host-" + item.id);

          if (titleEl) titleEl.textContent = cat.name;
          if (subEl) subEl.textContent = cat.subtitle || "";
          if (chipEl) chipEl.textContent = cat.chip || "";
          if (rulesEl) {
            var genRules = (cat.type === "roundrobin" || cat.id.indexOf("doubles") !== -1) ? GEN_DOUBLES : GEN_SINGLES;
            rulesEl.innerHTML = renderRulesHTML(cat.id, cat.rulesFormat || [], genRules);
          }
          renderCategoryView(cat);
        }
      });
    });

    // Auto-poll every 15 seconds for live venue score commits
    setInterval(function() {
      fetchAllCategories(true);
    }, 15000);
  }

  // Export to window
  window.KSF = {
    showTab: showTab,
    refresh: fetchAllCategories
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDOM);
  } else {
    initDOM();
  }
})();
