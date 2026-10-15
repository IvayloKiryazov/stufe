/* Stufe — a small, data-driven SRS for German vocabulary and grammar. */
(function () {
  "use strict";

  var app = document.getElementById("app");
  var LEVELS = [];
  var BY = {}; // item id -> item
  var LEVEL_OF = {}; // item id -> level index
  var sess = null;
  var confirmReset = false;
  var leechIds = [];
  var expanded = {};

  /* ---------------------------------------------------------------- utils */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function norm(s) {
    return String(s)
      .toLowerCase()
      .trim()
      .replace(/[.!?,;:]+$/, "")
      .replace(/\s+/g, " ")
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss");
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }
  function artHtml(de) {
    var parts = String(de).split(" ");
    var a = parts[0].toLowerCase();
    if (a !== "der" && a !== "die" && a !== "das") return esc(de);
    return (
      '<span class="art ' + a + '">' + esc(parts[0]) + "</span> " +
      esc(parts.slice(1).join(" "))
    );
  }
  function rel(ms) {
    var m = Math.max(1, Math.round(ms / 60000));
    if (m < 60) return m + " min";
    var h = Math.round(m / 60);
    if (h < 48) return h + " h";
    return Math.round(h / 24) + " days";
  }
  function speechText(it) {
    if (it.kind === "cloze") return it.prompt.replace("___", it.answer);
    return it.sentence_de || it.de;
  }
  function answerText(it) {
    return it.kind === "cloze" ? it.answer : it.de;
  }
  function speakBtn(text, label) {
    var visible = label || "\uD83D\uDD0A";
    var hidden = label ? "" : '<span class="sr-only">Play audio</span>';
    return '<button class="speak" data-speak="' + esc(text) + '">' + visible + hidden + "</button>";
  }
  function labelFor(it) {
    if (it.kind === "noun") return "German word with its article";
    if (it.kind === "verb") return "Verb (infinitive)";
    if (it.kind === "adj") return "Adjective";
    return "Fill in the blank";
  }
  function promptHtml(it) {
    if (it.kind === "cloze") {
      return (
        '<p class="prompt sent" lang="de">' + esc(it.prompt).replace("___", '<span class="blank"></span>') + "</p>" +
        '<p class="trans">' + esc(it.en) + "</p>" +
        (it.hint ? '<span class="chip" lang="de">' + esc(it.hint) + "</span>" : "")
      );
    }
    return '<p class="prompt">' + esc(it.en) + "</p>";
  }
  function revealHtml(it) {
    var out = "";
    if (it.kind === "noun") {
      out += '<p class="answer" lang="de">' + artHtml(it.de) + "</p>";
      if (it.plural) out += '<p class="forms" lang="de">Plural: ' + artHtml(it.plural) + "</p>";
      if (it.ipa) out += '<p class="forms">' + esc(it.ipa) + "</p>";
    } else if (it.kind === "verb" || it.kind === "adj") {
      out += '<p class="answer" lang="de">' + esc(it.de) + "</p>";
      if (it.forms) out += '<p class="forms" lang="de">' + esc(it.forms) + "</p>";
      if (it.ipa) out += '<p class="forms">' + esc(it.ipa) + "</p>";
      if (it.conjugation && it.conjugation.present) {
        var pr = it.conjugation.present;
        out += '<p class="conj" lang="de">ich ' + esc(pr[0]) + " · du " + esc(pr[1]) + " · er " + esc(pr[2]) +
          "<br>wir " + esc(pr[3]) + " · ihr " + esc(pr[4]) + " · sie " + esc(pr[5]) + "</p>";
      }
    } else {
      out += '<p class="answer" lang="de">' + esc(it.prompt).replace("___", "<mark>" + esc(it.answer) + "</mark>") + "</p>";
      out += '<p class="trans">' + esc(it.en) + "</p>";
    }
    if (it.sentence_de) {
      out += '<p class="note" lang="de">' + artHtml(it.sentence_de) + "</p>";
      if (it.sentence_en) out += '<p class="note">' + esc(it.sentence_en) + "</p>";
    }
    if (it.mnemonic) {
      out += '<p class="note">' + esc(it.mnemonic) + "</p>";
    }
    if (it.attribution) {
      out += '<p class="src">Example sentence: Tatoeba · CC BY 2.0 FR</p>';
    }
    return out;
  }

  /* ------------------------------------------------------------- progress */

  function itemsOfLevel(i) {
    var ids = [];
    LEVELS[i].groups.forEach(function (g) {
      g.items.forEach(function (id) { ids.push(id); });
    });
    return ids;
  }
  function stats(i) {
    var ids = itemsOfLevel(i);
    var started = 0, passed = 0;
    ids.forEach(function (id) {
      if (window.Store.entry(id)) {
        started++;
        if (window.SRS.passed(id)) passed++;
      }
    });
    return { total: ids.length, started: started, passed: passed };
  }
  function unlocked(i) {
    if (window.Store.settings.unlockAll || i === 0) return true;
    var s = stats(i - 1);
    if (!s.total) return true;
    return s.passed / s.total >= window.SRS.PASS_RATIO;
  }
  function availableItems() {
    var out = [];
    for (var i = 0; i < LEVELS.length; i++) {
      if (!unlocked(i)) continue;
      LEVELS[i].groups.forEach(function (g) {
        g.items.forEach(function (id) {
          if (!window.Store.entry(id)) out.push(id);
        });
      });
    }
    return out;
  }
  function dueItems(now) {
    return Object.keys(window.Store.progress).filter(function (id) {
      return BY[id] && window.SRS.isActive(id) && window.Store.progress[id].due <= now;
    });
  }

  /* ----------------------------------------------------------------- home */

  function home() {
    sess = null;
    confirmReset = false;
    var now = Date.now();
    var due = dueItems(now);
    var avail = availableItems().length;
    var upcoming = Object.keys(window.Store.progress)
      .filter(function (id) { return window.SRS.isActive(id); })
      .map(function (id) { return window.Store.progress[id].due; })
      .filter(function (d) { return d > now; })
      .sort(function (a, b) { return a - b; })[0];
    var reviewLbl = due.length
      ? "reviews due"
      : upcoming
      ? "next review in " + rel(upcoming - now)
      : "reviews due";

    var rows = LEVELS.map(function (L, i) {
      var s = stats(i), open = unlocked(i), done = s.passed === s.total && s.total > 0;
      var pct = s.total ? Math.round((s.passed / s.total) * 100) : 0;
      var meta = !open
        ? "Locked. Pass " + Math.round(window.SRS.PASS_RATIO * 100) + "% of " + LEVELS[i - 1].name + " to open it."
        : s.started + " of " + s.total + " started, " + s.passed + " passed";
      var isOpen = !!expanded[L.id];
      var groups = "";
      if (isOpen && open) {
        groups =
          '<div class="groups">' +
          L.groups.map(function (g) {
            var gt = g.items.length, gp = 0, gs = 0;
            g.items.forEach(function (id) {
              if (window.Store.entry(id)) { gs++; if (window.SRS.passed(id)) gp++; }
            });
            var gpct = gt ? Math.round((gp / gt) * 100) : 0;
            return (
              '<div class="grp"><div class="grp-head"><span class="grp-name">' + esc(g.name) + "</span>" +
              '<button class="link" data-act="group" data-level="' + i + '" data-group="' + esc(g.id) + '">Study</button></div>' +
              '<div class="bar"><div style="width:' + gpct + '%"></div></div>' +
              '<div class="lvl-meta">' + gs + " / " + gt + "</div></div>"
            );
          }).join("") +
          "</div>";
      }
      var headRight = open
        ? '<button class="link" data-act="toggle-level" data-level="' + i + '">' +
          (isOpen ? "Hide groups" : L.groups.length + " groups") + "</button>"
        : '<span class="lvl-kind">locked</span>';
      return (
        '<li class="lvl ' + (open ? "" : "locked") + " " + (done ? "done" : "") + '">' +
        '<div class="lvl-head"><span class="lvl-name">' + esc(L.name) + " · " + esc(L.title) + "</span>" +
        headRight + "</div>" +
        '<div class="bar"><div style="width:' + pct + '%"></div></div>' +
        '<div class="lvl-meta">' + esc(meta) + "</div>" + groups + "</li>"
      );
    }).join("");

    var todayKey = window.Stats.dayKey(now);
    var today = window.Store.history[todayKey] || { new: 0, reviews: 0 };
    var st = window.Stats.streak(window.Store.history, now);
    var goalNew = window.Store.settings.goalNew || 0;
    var goalRev = window.Store.settings.goalReviews || 0;
    var todayLine =
      '<p class="sub">Today: <b>' + (today.new || 0) + "</b>/" + goalNew + " new · <b>" +
      (today.reviews || 0) + "</b>/" + goalRev + " reviews" +
      (st ? " · " + st + "-day streak" : "") + "</p>";

    app.innerHTML =
      "<h1>Stufe</h1>" +
      '<p class="tag">German, one step at a time. Nouns with their articles, grammar as fill-in-the-blank.</p>' +
      '<div class="actions">' +
      '<div class="action"><div class="n">' + avail + '</div><div class="lbl">lessons available</div>' +
      '<button class="primary" data-act="lessons" ' + (avail ? "" : "disabled") + ">Start lessons</button></div>" +
      '<div class="action"><div class="n">' + due.length + '</div><div class="lbl">' + reviewLbl + "</div>" +
      '<button class="primary" data-act="reviews" ' + (due.length ? "" : "disabled") + ">Start reviews</button></div>" +
      "</div>" +
      '<p class="sub">' +
      (Object.keys(window.Store.progress).length
        ? '<button class="link" data-act="practice">Practice 20 learned items now</button> (does not change your schedule)'
        : "Do a lesson first. Each lesson batch has new items, then they show up in reviews.") +
      "</p>" +
      todayLine +
      "<h2>Path</h2>" +
      '<ol class="levels">' + rows + "</ol>" +
      '<div class="settings">' +
      '<label><input type="checkbox" id="set-unlock" ' + (window.Store.settings.unlockAll ? "checked" : "") + "> Unlock all levels</label>" +
      '<label><input type="checkbox" id="set-voice" ' + (window.Store.settings.voice ? "checked" : "") + "> Play audio (browser German voices)</label>" +
      '<label><input type="checkbox" id="set-auto" ' + (window.Store.settings.autoSpeak ? "checked" : "") + "> Auto-play audio when the answer is shown</label>" +
      '<label>New items per lesson <input type="number" id="set-batch" min="3" max="20" value="' + window.Store.settings.newPerLesson + '" style="width:5rem;margin-left:auto"></label>' +
      '<label>Daily new goal <input type="number" id="set-goal-new" min="0" max="200" value="' + window.Store.settings.goalNew + '" style="width:5rem;margin-left:auto"></label>' +
      '<label>Daily review goal <input type="number" id="set-goal-rev" min="0" max="1000" value="' + window.Store.settings.goalReviews + '" style="width:5rem;margin-left:auto"></label>' +
      '<div><button class="link" data-act="backup">Back up / restore progress</button></div>' +
      '<div><button class="link" data-act="progress">Progress by group</button></div>' +
      '<div><button class="link" data-act="grammar-list">Grammar library</button></div>' +
      '<div><button class="link" data-act="stats">Stats</button></div>' +
      '<div><button class="link" data-act="projections">Projections</button></div>' +
      '<div><button class="link" data-act="extra">Extra study (ghosts)</button></div>' +
      '<div><button class="link" data-act="leeches">Leeches (hardest items)</button></div>' +
      '<div><button class="link" data-act="help">Keyboard shortcuts</button></div>' +
      '<div><button class="link" data-act="credits">Credits &amp; licenses</button></div>' +
      '<div><button class="link" data-act="reset">Reset all progress</button></div>' +
      "</div>";

    var u = document.getElementById("set-unlock");
    u.addEventListener("change", function () { window.Store.settings.unlockAll = u.checked; window.Store.save(); home(); });
    var v = document.getElementById("set-voice");
    v.addEventListener("change", function () { window.Store.settings.voice = v.checked; window.Store.save(); });
    var au = document.getElementById("set-auto");
    au.addEventListener("change", function () { window.Store.settings.autoSpeak = au.checked; window.Store.save(); });
    var b = document.getElementById("set-batch");
    b.addEventListener("change", function () {
      var n = Math.max(3, Math.min(20, parseInt(b.value, 10) || 5));
      window.Store.settings.newPerLesson = n;
      window.Store.save();
      b.value = n;
    });
    var gn = document.getElementById("set-goal-new");
    gn.addEventListener("change", function () {
      window.Store.settings.goalNew = Math.max(0, parseInt(gn.value, 10) || 0);
      window.Store.save();
      gn.value = window.Store.settings.goalNew;
    });
    var gr = document.getElementById("set-goal-rev");
    gr.addEventListener("change", function () {
      window.Store.settings.goalReviews = Math.max(0, parseInt(gr.value, 10) || 0);
      window.Store.save();
      gr.value = window.Store.settings.goalReviews;
    });
  }

  /* -------------------------------------------------------------- lessons */

  function startLessons() {
    var batch = availableItems().slice(0, window.Store.settings.newPerLesson);
    if (!batch.length) return;
    sess = { mode: "lesson", batch: batch, i: 0 };
    lesson();
  }
  function startGroupLesson(li, gid) {
    var group = LEVELS[li] && LEVELS[li].groups.filter(function (x) { return x.id === gid; })[0];
    if (!group) return;
    var batch = group.items
      .filter(function (id) { return !window.Store.entry(id); })
      .slice(0, window.Store.settings.newPerLesson);
    if (!batch.length) return;
    sess = { mode: "lesson", batch: batch, i: 0 };
    lesson();
  }
  function lesson() {
    var id = sess.batch[sess.i];
    var it = BY[id];
    var showIntro = sess.i === 0 || BY[sess.batch[sess.i - 1]].group !== it.group;
    var intro = showIntro && it.intro
      ? '<div class="rule"><b>' + esc(it.groupName) + "</b>" + esc(it.intro) + "</div>"
      : "";
    var last = sess.i === sess.batch.length - 1;
    var cls = it.kind === "noun" ? it.de.split(" ")[0].toLowerCase() : "";
    app.innerHTML =
      '<h1 class="sr-only">Lesson</h1>' +
      '<div class="prog"><span>Lesson ' + (sess.i + 1) + " of " + sess.batch.length + "</span>" +
      '<div class="bar"><div style="width:' + ((sess.i + 1) / sess.batch.length) * 100 + '%"></div></div></div>' +
      intro +
      '<div class="card ' + cls + '">' +
      '<div class="prompt-label">' + labelFor(it) + "</div>" +
      promptHtml(it) +
      '<div class="fb" style="border-top:0;padding-top:0">' +
      revealHtml(it) +
      (it.note ? '<p class="note">' + esc(it.note) + "</p>" : "") +
      '<div class="row" style="margin-top:10px">' + speakBtn(speechText(it), "\uD83D\uDD0A Listen") + "</div>" +
      "</div></div>" +
      '<div class="row" style="margin-top:16px">' +
      '<button data-act="home">Cancel</button>' +
      (sess.i > 0 ? '<button data-act="lprev">Back</button>' : "") +
      '<button class="primary" data-act="lnext">' + (last ? "Add to reviews" : "Next") + "</button>" +
      "</div>";
    if (window.Store.settings.autoSpeak) window.TTS.speak(speechText(it));
  }
  function lessonNext() {
    if (sess.i < sess.batch.length - 1) { sess.i++; lesson(); return; }
    var now = Date.now();
    sess.batch.forEach(function (id) { window.Store.set(id, { box: 1, due: now }); });
    window.Store.save();
    window.Store.log("new", sess.batch.length);
    startReviews(false);
  }

  /* -------------------------------------------------------------- reviews */

  function startReviews(practice, explicit) {
    var now = Date.now();
    var ids =
      explicit && explicit.length
        ? explicit.slice()
        : practice
        ? shuffle(Object.keys(window.Store.progress).filter(function (id) { return BY[id]; })).slice(0, 20)
        : shuffle(dueItems(now));
    if (!ids.length) { home(); return; }
    sess = {
      mode: "review", practice: practice, queue: ids, total: ids.length,
      completed: 0, seen: {}, prev: {}, firstOK: 0, firstTotal: 0, phase: "ask",
      last: null, given: "",
    };
    review();
  }
  function review() {
    if (!sess.queue.length) { summary(); return; }
    var it = BY[sess.queue[0]];
    var fb = sess.phase === "fb";
    var last = sess.last;
    var cls = "";
    if (fb) cls = last.ok ? "ok" : "no";
    var fbHtml = "";
    if (fb) {
      var stage = "";
      if (!sess.practice) {
        var entry = window.Store.entry(it.id);
        if (entry) stage = '<span class="chip">' + esc(window.Stages.stageName(entry.box)) + "</span>";
      }
      fbHtml =
        '<div class="fb">' +
        '<p class="verdict ' + (last.ok ? "ok" : "no") + '">' + (last.ok ? "Correct" : "Not quite") + "</p>" +
        stage +
        revealHtml(it) +
        (last.msg ? '<p class="note">' + esc(last.msg) + "</p>" : "") +
        (it.note ? '<p class="note">' + esc(it.note) + "</p>" : "") +
        '<div class="row" style="margin-top:10px">' + speakBtn(speechText(it), "\uD83D\uDD0A Listen") + "</div>" +
        (last.ok ? "" : '<p class="note"><button class="link" data-act="override">I was right (typo)</button></p>') +
        '<div class="row" style="margin-top:8px">' +
        '<button data-act="undo">Undo</button>' +
        '<button data-act="suspend">Suspend</button>' +
        '<button data-act="known">I know this</button>' +
        "</div>" +
        "</div>";
    }
    var dots = "";
    if (!fb) {
      var ent = window.Store.entry(it.id);
      if (ent && ent.hist && ent.hist.length) {
        dots =
          '<div class="dots" aria-hidden="true">' +
          ent.hist.map(function (h) {
            return '<span class="dot ' + (h ? "ok" : "no") + '"></span>';
          }).join("") +
          "</div>";
      }
    }
    app.innerHTML =
      '<h1 class="sr-only">Review</h1>' +
      '<div class="prog"><span>' + sess.completed + " of " + sess.total + (sess.practice ? " (practice)" : "") + "</span>" +
      '<div class="bar"><div style="width:' + (sess.completed / sess.total) * 100 + '%"></div></div></div>' +
      '<div class="card ' + cls + '">' +
      '<div class="prompt-label">' + labelFor(it) + "</div>" +
      promptHtml(it) +
      dots +
      '<input type="text" id="ans" lang="de" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Your answer" ' + (fb ? "readonly" : "") + ">" +
      (fb ? "" : '<div class="umlauts" aria-label="Special characters">' +
        ["ä", "ö", "ü", "ß"].map(function (c) { return '<button data-ch="' + c + '" lang="de" tabindex="-1">' + c + "</button>"; }).join("") +
        "</div>") +
      '<div class="row" ' + (fb ? 'style="margin-top:14px"' : "") + ">" +
      (fb ? '<button class="primary" data-act="rnext">Next</button>' : '<button class="primary" data-act="check">Check</button>') +
      '<button data-act="home">Stop</button></div>' +
      fbHtml +
      "</div>";
    var inp = document.getElementById("ans");
    inp.value = sess.given || "";
    if (fb) {
      if (window.Store.settings.autoSpeak) window.TTS.speak(speechText(it));
    } else {
      setTimeout(function () { inp.focus(); }, 0);
    }
  }
  function judge(it, given) {
    var expected = it.kind === "cloze" ? [it.answer].concat(it.alt || []) : [it.de];
    var g = norm(given);
    var ok = g !== "" && expected.some(function (e) { return norm(e) === g; });
    var msg = "";
    if (!ok && it.kind === "noun") {
      var parts = it.de.split(" ");
      var article = parts[0], noun = norm(parts.slice(1).join(" "));
      var gp = g.split(" ");
      if (gp.length === 1 && gp[0] === noun) msg = "Add the article. It is " + article + ".";
      else if (gp.length > 1 && gp.slice(1).join(" ") === noun) msg = "Right noun, wrong article. It is " + article + ".";
    }
    return { ok: ok, msg: msg };
  }
  function check() {
    var inp = document.getElementById("ans");
    var val = inp.value;
    if (!val.trim()) { inp.focus(); return; }
    var id = sess.queue[0], it = BY[id];
    var j = judge(it, val);
    var first = !sess.seen[id];
    if (first) {
      sess.seen[id] = true;
      sess.firstTotal++;
      if (j.ok) sess.firstOK++;
      if (!sess.practice) sess.prev[id] = window.SRS.grade(id, j.ok);
    }
    sess.last = { ok: j.ok, msg: j.msg, first: first };
    sess.lastId = id;
    sess.given = val;
    sess.phase = "fb";
    review();
  }
  function override() {
    var id = sess.queue[0];
    if (sess.last.first) {
      sess.firstOK++;
      if (!sess.practice) {
        window.SRS.restore(id, sess.prev[id]);
        window.SRS.grade(id, true);
      }
    }
    sess.last.ok = true;
    sess.last.msg = "";
    review();
  }
  function undo() {
    var id = sess.queue[0];
    if (!sess.practice && sess.lastId === id && sess.prev[id]) window.SRS.restore(id, sess.prev[id]);
    sess.phase = "ask";
    sess.last = null;
    sess.given = "";
    review();
  }
  function suspendCurrent() {
    var id = sess.queue[0];
    if (!sess.practice) window.SRS.suspend(id);
    sess.queue.shift();
    sess.phase = "ask";
    sess.last = null;
    sess.given = "";
    review();
  }
  function knowCurrent() {
    var id = sess.queue[0];
    if (!sess.practice) window.SRS.markKnown(id);
    sess.queue.shift();
    sess.phase = "ask";
    sess.last = null;
    sess.given = "";
    review();
  }
  function reviewNext() {
    var id = sess.queue.shift();
    if (sess.last.ok) {
      sess.completed++;
      if (!sess.practice) window.Store.log("reviews");
    } else {
      sess.queue.push(id);
    }
    sess.phase = "ask";
    sess.last = null;
    sess.given = "";
    review();
  }
  function summary() {
    var pct = sess.firstTotal ? Math.round((sess.firstOK / sess.firstTotal) * 100) : 0;
    var now = Date.now();
    var upcoming = Object.keys(window.Store.progress)
      .filter(function (id) { return window.SRS.isActive(id); })
      .map(function (id) { return window.Store.progress[id].due; })
      .filter(function (d) { return d > now; })
      .sort(function (a, b) { return a - b; })[0];
    app.innerHTML =
      "<h1>Done</h1>" +
      '<p class="tag">' + sess.firstOK + " of " + sess.firstTotal + " right on the first try (" + pct + "%).</p>" +
      '<div class="card"><p class="big">' + sess.total + " reviewed</p>" +
      '<p class="note">' + (sess.practice ? "Practice does not change your schedule." : upcoming ? "Next review in " + rel(upcoming - now) + "." : "") + "</p></div>" +
      '<div class="row" style="margin-top:16px"><button class="primary" data-act="home">Back to path</button></div>';
  }

  /* ------------------------------------------------------------ backup UI */

  function backup() {
    sess = null;
    var text = window.Store.export();
    app.innerHTML =
      "<h1>Progress</h1>" +
      '<p class="tag">Copy this to keep a backup, or paste a backup and press Restore.</p>' +
      '<div class="card">' +
      '<textarea id="bk" spellcheck="false">' + esc(text) + "</textarea>" +
      '<div class="row" style="margin-top:12px">' +
      '<button class="primary" data-act="restore">Restore from text</button>' +
      '<button data-act="home">Back</button>' +
      '<button data-act="download">Download .json</button>' +
      "</div></div>";
  }
  function restore() {
    var el = document.getElementById("bk");
    try {
      window.Store.import(el.value);
      home();
    } catch (e) {
      alert("That does not look like a valid backup.");
    }
  }
  function download() {
    var blob = new Blob([window.Store.export()], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "stufe-progress.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ------------------------------------------------------------- leeches */

  function leeches() {
    sess = null;
    leechIds = Object.keys(window.Store.progress)
      .filter(function (id) { return BY[id] && (window.Store.progress[id].lapses || 0) > 0; })
      .sort(function (a, b) {
        return (window.Store.progress[b].lapses || 0) - (window.Store.progress[a].lapses || 0);
      });
    var rows = leechIds.slice(0, 50).map(function (id) {
      var it = BY[id];
      var label = it.kind === "cloze" ? it.prompt + " → " + it.answer : it.en + " → " + it.de;
      return '<p class="note"><b>' + (window.Store.progress[id].lapses || 0) + "×</b> " + esc(label) + "</p>";
    }).join("");
    var susp = Object.keys(window.Store.progress).filter(function (id) {
      return BY[id] && window.Store.progress[id].suspended;
    });
    var suspHtml = susp.length
      ? "<h2>Suspended</h2>" +
        susp.map(function (id) {
          var it = BY[id];
          var label = it.kind === "cloze" ? it.prompt + " → " + it.answer : it.en + " → " + it.de;
          return (
            '<div class="grp-head"><span class="grp-name">' + esc(label) + "</span>" +
            '<button class="link" data-act="resume" data-id="' + esc(id) + '">Resume</button></div>'
          );
        }).join("")
      : "";
    app.innerHTML =
      "<h1>Leeches</h1>" +
      '<p class="tag">The items you get wrong most often.</p>' +
      (leechIds.length
        ? '<div class="row" style="margin-bottom:16px"><button class="primary" data-act="practice-leeches">Practice ' +
          Math.min(20, leechIds.length) + "</button></div>"
        : "") +
      '<div class="card">' + (rows || '<p class="note">No leeches yet — nice.</p>') + "</div>" +
      suspHtml +
      '<div class="row" style="margin-top:16px"><button class="primary" data-act="home">Back</button></div>';
  }

  function progress() {
    sess = null;
    var cards = LEVELS.map(function (L, i) {
      var open = unlocked(i);
      var groups = L.groups.map(function (g) {
        var total = g.items.length, passed = 0;
        g.items.forEach(function (id) { if (window.SRS.passed(id)) passed++; });
        var pct = total ? Math.round((passed / total) * 100) : 0;
        return (
          '<div style="margin:10px 0"><div class="lvl-meta">' + esc(g.name) + " — " + passed + " / " + total + "</div>" +
          '<div class="bar"><div style="width:' + pct + '%"></div></div></div>'
        );
      }).join("");
      return (
        '<div class="card" style="margin-bottom:14px">' +
        '<div class="lvl-head"><span class="lvl-name">' + esc(L.name) + " · " + esc(L.title) + "</span>" +
        (open ? "" : '<span class="lvl-kind">locked</span>') + "</div>" + groups + "</div>"
      );
    }).join("");
    app.innerHTML =
      "<h1>Progress</h1>" +
      '<p class="tag">Passed items per group.</p>' +
      cards +
      '<div class="row" style="margin-top:8px"><button class="primary" data-act="home">Back</button></div>';
  }

  /* ---------------------------------------------------------- extra study */

  function extraStudy() {
    sess = null;
    var learned = Object.keys(window.Store.progress).filter(function (id) { return BY[id]; });
    var passed = learned.filter(function (id) { return window.SRS.passed(id); });
    var leeches = learned.filter(function (id) { return (window.Store.progress[id].lapses || 0) > 0; });
    function btn(act, label, n, disabled) {
      return (
        '<button class="primary" data-act="' + act + '" ' + (disabled ? "disabled" : "") +
        ' style="margin:0 0 10px">' + esc(label) + " (" + n + ")</button>"
      );
    }
    app.innerHTML =
      "<h1>Extra study</h1>" +
      '<p class="tag">Practice without changing your schedule (ghosts).</p>' +
      '<div class="card">' +
      btn("study-leeches", "Leeches", Math.min(20, leeches.length), !leeches.length) +
      btn("study-passed", "Passed items", Math.min(20, passed.length), !passed.length) +
      btn("study-learned", "Any learned item", Math.min(20, learned.length), !learned.length) +
      '<p class="note">None of these affect your SRS schedule.</p>' +
      "</div>" +
      '<div class="row" style="margin-top:16px"><button class="primary" data-act="home">Back</button></div>';
  }

  /* --------------------------------------------------------- projections */

  function projections() {
    sess = null;
    var perDay = window.Store.settings.newPerLesson || 5;
    var now = Date.now();
    var cum = 0;
    function fmt(ts) {
      return new Date(ts).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    }
    var rows = LEVELS.map(function (L, i) {
      var s = stats(i);
      var remaining = s.total - s.started;
      var days = window.Projection.daysToFinish(remaining, perDay);
      if (isFinite(days)) cum += days;
      var by = isFinite(days) ? "by " + fmt(window.Projection.addDays(now, cum)) : "—";
      return (
        '<p class="note"><b>' + esc(L.name) + "</b> — " + remaining + " left · " +
        (isFinite(days) ? days : "∞") + " days · " + by + "</p>"
      );
    }).join("");
    var load = window.Projection.reviewLoad(perDay, window.SRS.HOURS.length - 1);
    var allDone = fmt(window.Projection.addDays(now, cum));
    app.innerHTML =
      "<h1>Projections</h1>" +
      '<p class="tag">At your current pace of ' + perDay + " new items/day.</p>" +
      '<div class="card">' + rows + "</div>" +
      '<p class="note">Estimated steady-state review load: about <b>' + load + "</b> reviews/day.</p>" +
      '<p class="note">Everything introduced around <b>' + allDone + "</b> (reviews continue after that).</p>" +
      '<div class="row" style="margin-top:16px"><button class="primary" data-act="home">Back</button></div>';
  }

  /* ------------------------------------------------------------- grammar */

  function grammarList() {
    sess = null;
    var body = LEVELS.map(function (L, i) {
      var gs = L.groups.filter(function (g) { return g.kind === "cloze"; });
      if (!gs.length) return "";
      return (
        "<h2>" + esc(L.name) + " · " + esc(L.title) + "</h2>" +
        gs.map(function (g) {
          var passed = 0;
          g.items.forEach(function (id) { if (window.SRS.passed(id)) passed++; });
          return (
            '<div class="grp"><div class="grp-head"><span class="grp-name">' + esc(g.name) + "</span>" +
            '<button class="link" data-act="grammar" data-level="' + i + '" data-group="' + esc(g.id) + '">Open</button></div>' +
            '<div class="lvl-meta">' + passed + " / " + g.items.length + " passed</div></div>"
          );
        }).join("")
      );
    }).join("");
    app.innerHTML =
      "<h1>Grammar</h1>" +
      '<p class="tag">Study a point, see the rule and examples.</p>' +
      body +
      '<div class="row" style="margin-top:16px"><button class="primary" data-act="home">Back</button></div>';
  }

  function grammarPoint(li, gid) {
    sess = null;
    var L = LEVELS[li];
    var g = L && L.groups.filter(function (x) { return x.id === gid; })[0];
    if (!g) { home(); return; }
    var examples = g.items.slice(0, 8).map(function (id) {
      var it = BY[id];
      if (!it) return "";
      if (it.kind === "cloze") {
        return (
          '<p class="note" lang="de">' + esc(it.prompt.replace("___", it.answer)) + "</p>" +
          '<p class="note">' + esc(it.en) + "</p>"
        );
      }
      return '<p class="note" lang="de">' + artHtml(it.de) + " — " + esc(it.en) + "</p>";
    }).join("");
    app.innerHTML =
      "<h1>" + esc(g.name) + "</h1>" +
      '<p class="tag">' + esc(L.name) + " · " + esc(L.title) + "</p>" +
      '<div class="rule"><b>Rule</b>' + esc(g.intro) + "</div>" +
      "<h2>Examples</h2>" +
      '<div class="card">' + (examples || '<p class="note">No examples.</p>') + "</div>" +
      '<div class="row" style="margin-top:16px">' +
      '<button class="primary" data-act="cram" data-level="' + li + '" data-group="' + esc(g.id) + '">Cram this point</button>' +
      '<button data-act="grammar-list">All grammar</button>' +
      '<button data-act="home">Home</button></div>';
  }

  function cram(li, gid) {
    var g = LEVELS[li] && LEVELS[li].groups.filter(function (x) { return x.id === gid; })[0];
    if (!g) return;
    startReviews(true, shuffle(g.items.slice()));
  }

  /* --------------------------------------------------------------- stats */

  function showStats() {
    sess = null;
    var t = window.Stats.totals(window.Store.history);
    var started = 0, passed = 0;
    Object.keys(BY).forEach(function (id) {
      if (window.Store.entry(id)) {
        started++;
        if (window.SRS.passed(id)) passed++;
      }
    });
    var days = window.Stats.recentDays(window.Store.history, 35, Date.now());
    var max = 1;
    days.forEach(function (d) { if (d.total > max) max = d.total; });
    var cells = days.map(function (d) {
      var level = d.total === 0 ? 0 : Math.max(1, Math.ceil((d.total / max) * 4));
      return '<span class="cell heat' + level + '" title="' + d.key + ": " + d.total + '"></span>';
    }).join("");
    var st = window.Stats.streak(window.Store.history, Date.now());
    app.innerHTML =
      "<h1>Stats</h1>" +
      '<div class="actions">' +
      '<div class="action"><div class="n">' + st + '</div><div class="lbl">day streak</div></div>' +
      '<div class="action"><div class="n">' + t.reviews + '</div><div class="lbl">reviews all time</div></div>' +
      "</div>" +
      '<div class="actions">' +
      '<div class="action"><div class="n">' + started + '</div><div class="lbl">items started</div></div>' +
      '<div class="action"><div class="n">' + passed + '</div><div class="lbl">items passed</div></div>' +
      "</div>" +
      "<h2>Last 5 weeks</h2>" +
      '<div class="heat">' + cells + "</div>" +
      '<p class="note">' + t.new + " new items and " + t.reviews + " reviews over " + t.days + " active days.</p>" +
      '<div class="row" style="margin-top:16px"><button class="primary" data-act="home">Back</button></div>';
  }

  /* --------------------------------------------------------------- help */

  function help() {
    sess = null;
    var rows = [
      ["Enter", "Check your answer, then go to the next card"],
      ["Esc", "Stop the current session and return to the path"],
      ["?", "Open this help screen (from the path)"],
      ["ä ö ü ß", "Buttons under the answer field insert a special character"],
    ];
    app.innerHTML =
      "<h1>Keyboard shortcuts</h1>" +
      '<p class="tag">Small things that make reviewing faster.</p>' +
      '<div class="card">' +
      rows.map(function (r) {
        return '<p class="note"><b>' + esc(r[0]) + "</b> — " + esc(r[1]) + "</p>";
      }).join("") +
      "</div>" +
      '<div class="row" style="margin-top:16px"><button class="primary" data-act="home">Back</button></div>';
  }

  /* ------------------------------------------------------------- credits */

  function credits() {
    sess = null;
    app.innerHTML =
      "<h1>Credits &amp; licenses</h1>" +
      '<p class="tag">Stufe is MIT-licensed. The language data comes from open sources.</p>' +
      '<div class="card">' +
      '<p><b>Example sentences</b> — <a href="https://tatoeba.org" rel="noopener">Tatoeba</a>, <b>CC BY 2.0 FR</b>.</p>' +
      '<p><b>Noun gender &amp; plurals</b> — <a href="https://github.com/gambolputty/german-nouns" rel="noopener">german-nouns</a>, CC BY-SA 4.0.</p>' +
      '<p><b>Word frequency</b> — <a href="https://github.com/hermitdave/FrequencyWords" rel="noopener">FrequencyWords</a>, MIT.</p>' +
      "</div>" +
      "<h2>Sentence credits</h2>" +
      '<div id="credits-list"><p class="note">Loading…</p></div>' +
      '<div class="row" style="margin-top:16px"><button class="primary" data-act="home">Back</button></div>';
    fetch("data/attribution.json")
      .then(function (r) { return r.json(); })
      .then(function (list) {
        var el = document.getElementById("credits-list");
        if (!el) return;
        el.innerHTML = list.length
          ? list.map(function (x) { return '<p class="note">' + esc(x) + "</p>"; }).join("")
          : '<p class="note">No sentence credits.</p>';
      })
      .catch(function () {
        var el = document.getElementById("credits-list");
        if (el) el.innerHTML = '<p class="note">Could not load credits.</p>';
      });
  }

  /* --------------------------------------------------------------- events */
  app.addEventListener("click", function (e) {
    var sp = e.target.closest("[data-speak]");
    if (sp) { window.TTS.speak(sp.getAttribute("data-speak")); return; }
    var ch = e.target.closest("[data-ch]");
    if (ch) {
      var inp = document.getElementById("ans");
      if (!inp) return;
      var s = inp.selectionStart == null ? inp.value.length : inp.selectionStart;
      var en = inp.selectionEnd == null ? s : inp.selectionEnd;
      inp.value = inp.value.slice(0, s) + ch.getAttribute("data-ch") + inp.value.slice(en);
      inp.focus();
      inp.setSelectionRange(s + 1, s + 1);
      return;
    }
    var b = e.target.closest("[data-act]");
    if (!b) return;
    var a = b.getAttribute("data-act");
    if (a === "lessons") startLessons();
    else if (a === "reviews") startReviews(false);
    else if (a === "practice") startReviews(true);
    else if (a === "toggle-level") {
      var li = parseInt(b.getAttribute("data-level"), 10);
      var lid = LEVELS[li].id;
      expanded[lid] = !expanded[lid];
      home();
    } else if (a === "group") {
      startGroupLesson(parseInt(b.getAttribute("data-level"), 10), b.getAttribute("data-group"));
    }
    else if (a === "home") home();
    else if (a === "lnext") lessonNext();
    else if (a === "lprev") { sess.i--; lesson(); }
    else if (a === "check") check();
    else if (a === "rnext") reviewNext();
    else if (a === "override") override();
    else if (a === "undo") undo();
    else if (a === "suspend") suspendCurrent();
    else if (a === "known") knowCurrent();
    else if (a === "resume") { window.SRS.resume(b.getAttribute("data-id")); leeches(); }
    else if (a === "backup") backup();
    else if (a === "restore") restore();
    else if (a === "download") download();
    else if (a === "progress") progress();
    else if (a === "grammar-list") grammarList();
    else if (a === "grammar") grammarPoint(parseInt(b.getAttribute("data-level"), 10), b.getAttribute("data-group"));
    else if (a === "cram") cram(parseInt(b.getAttribute("data-level"), 10), b.getAttribute("data-group"));
    else if (a === "stats") showStats();
    else if (a === "projections") projections();
    else if (a === "extra") extraStudy();
    else if (a === "study-leeches") startReviews(true, shuffle(Object.keys(window.Store.progress).filter(function (id) { return BY[id] && (window.Store.progress[id].lapses || 0) > 0; })).slice(0, 20));
    else if (a === "study-passed") startReviews(true, shuffle(Object.keys(window.Store.progress).filter(function (id) { return BY[id] && window.SRS.passed(id); })).slice(0, 20));
    else if (a === "study-learned") startReviews(true);
    else if (a === "leeches") leeches();
    else if (a === "practice-leeches") startReviews(true, shuffle(leechIds.slice()).slice(0, 20));
    else if (a === "help") help();
    else if (a === "credits") credits();
    else if (a === "reset") {
      if (!confirmReset) { confirmReset = true; b.textContent = "Click again to erase all progress"; }
      else { window.Store.reset(); home(); }
    }
  });
  app.addEventListener("mousedown", function (e) {
    if (e.target.closest("[data-ch]")) e.preventDefault();
  });
  document.addEventListener("keydown", function (e) {
    var tag = document.activeElement && document.activeElement.tagName;
    if (e.key === "Escape" && sess) { home(); return; }
    if (e.key === "?" && !sess && tag !== "INPUT" && tag !== "TEXTAREA") { help(); return; }
    if (e.key !== "Enter" || !sess) return;
    if (tag === "BUTTON") return;
    if (sess.mode === "lesson") lessonNext();
    else if (sess.mode === "review" && sess.queue.length) {
      if (sess.phase === "ask") check();
      else reviewNext();
    }
  });

  /* ----------------------------------------------------------------- boot */

  function fail(msg) {
    app.innerHTML = '<div class="err"><h1>Stufe</h1><p>' + esc(msg) + "</p>" +
      "<p class=\"note\">Serve the folder over HTTP, e.g. <code>python3 -m http.server 8000</code>, " +
      "then open <code>http://localhost:8000</code>.</p></div>";
  }

  function boot() {
    Promise.all([
      fetch("data/levels.json").then(function (r) { if (!r.ok) throw 0; return r.json(); }),
      fetch("data/items.json").then(function (r) { if (!r.ok) throw 0; return r.json(); }),
    ])
      .then(function (res) {
        LEVELS = res[0];
        res[1].forEach(function (it) { BY[it.id] = it; });
        LEVELS.forEach(function (L, i) {
          L.groups.forEach(function (g) {
            g.items.forEach(function (id) { LEVEL_OF[id] = i; });
          });
        });
        home();
      })
      .catch(function (e) { fail("Could not load the deck data." + (e ? " (" + (e.message || e) + ")" : "")); });

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("sw.js").catch(function () {});
      });
    }
  }

  boot();
})();
